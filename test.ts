import { SimpleCache, RateLimiter, validateString, cleanAndParseJson } from "./serverUtils";

// Color helpers for the console report
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const cyan = (text: string) => `\x1b[36m${text}\x1b[0m`;
const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  try {
    fn();
    console.log(`  ${green("✓")} ${name}`);
    passedCount++;
  } catch (error: any) {
    console.error(`  ${red("✗")} ${name}`);
    console.error(`    ${red("Error:")} ${error.message}`);
    if (error.stack) {
      console.error(`    ${yellow("Stack:")} ${error.stack.split("\n")[1]}`);
    }
    failedCount++;
  }
}

async function runAsyncTest(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ${green("✓")} ${name}`);
    passedCount++;
  } catch (error: any) {
    console.error(`  ${red("✗")} ${name}`);
    console.error(`    ${red("Error:")} ${error.message}`);
    failedCount++;
  }
}

function assertEquals(actual: any, expected: any, message = "") {
  if (actual !== expected) {
    throw new Error(`${message || "Assertion failed"}: expected [${expected}] but got [${actual}]`);
  }
}

function assertThrows(fn: () => void, expectedMessagePart = "", message = "") {
  try {
    fn();
  } catch (error: any) {
    if (expectedMessagePart && !error.message.includes(expectedMessagePart)) {
      throw new Error(`${message || "Assertion failed"}: Error [${error.message}] did not contain [${expectedMessagePart}]`);
    }
    return; // Success
  }
  throw new Error(`${message || "Assertion failed"}: Expected function to throw an error, but it succeeded.`);
}

console.log(bold("\n============================================="));
console.log(bold(`🏃 RUNNING UTILITIES TEST SUITE`));
console.log(bold("=============================================\n"));

// ==========================================
// 1. CACHE TESTS
// ==========================================
console.log(cyan(bold("📦 UNIT: SimpleCache Layer")));

runTest("Should store and retrieve a cached item before it expires", () => {
  const cache = new SimpleCache(5, 5000);
  cache.set("greet", "Hello CultureQuest!");
  assertEquals(cache.get("greet"), "Hello CultureQuest!");
});

runTest("Should return null for non-existent cache keys", () => {
  const cache = new SimpleCache();
  assertEquals(cache.get("missing_key"), null);
});

runTest("Should discard entries that have exceeded their TTL", () => {
  const cache = new SimpleCache(10, -100); // Expiries are immediately stale
  cache.set("stale", "Im expired");
  assertEquals(cache.get("stale"), null, "Stale cache item must be discarded");
});

runTest("Should enforce maxEntries limit by removing the oldest entry when full", () => {
  const cache = new SimpleCache(3, 5000);
  cache.set("k1", "val1");
  cache.set("k2", "val2");
  cache.set("k3", "val3");
  assertEquals(cache.size(), 3);
  
  // Adding 4th item forces eviction of oldest (k1)
  cache.set("k4", "val4");
  assertEquals(cache.get("k1"), null, "k1 should have been evicted");
  assertEquals(cache.get("k2"), "val2");
  assertEquals(cache.get("k4"), "val4");
  assertEquals(cache.size(), 3);
});

runTest("Should clear all cached entries on calling clear()", () => {
  const cache = new SimpleCache();
  cache.set("test1", 123);
  cache.set("test2", 456);
  cache.clear();
  assertEquals(cache.size(), 0);
  assertEquals(cache.get("test1"), null);
});


// ==========================================
// 2. RATE LIMITER TESTS
// ==========================================
console.log(cyan(bold("\n🛡️  UNIT: RateLimiter Middleware")));

runTest("Should allow normal rate limits and increment request counts", () => {
  const limiter = new RateLimiter(60000, 3);
  const ip = "192.168.1.100";

  const r1 = limiter.handle(ip);
  assertEquals(r1.allowed, true);
  assertEquals(r1.remaining, 2);

  const r2 = limiter.handle(ip);
  assertEquals(r2.allowed, true);
  assertEquals(r2.remaining, 1);

  const r3 = limiter.handle(ip);
  assertEquals(r3.allowed, true);
  assertEquals(r3.remaining, 0);
});

runTest("Should block requests that exceed max limit within the current window", () => {
  const limiter = new RateLimiter(60000, 2);
  const ip = "10.0.0.1";

  limiter.handle(ip);
  limiter.handle(ip);
  const blockedResult = limiter.handle(ip);

  assertEquals(blockedResult.allowed, false, "Third request must be blocked");
  assertEquals(blockedResult.remaining, 0);
});

runTest("Should automatically reset rate limits when window time has elapsed", () => {
  const limiter = new RateLimiter(100, 1); // 100ms window
  const ip = "172.16.0.5";

  const r1 = limiter.handle(ip, Date.now());
  assertEquals(r1.allowed, true);

  const r2 = limiter.handle(ip, Date.now());
  assertEquals(r2.allowed, false);

  // Simulate moving past the window reset time (e.g. 150ms in the future)
  const futureTime = Date.now() + 150;
  const r3 = limiter.handle(ip, futureTime);
  assertEquals(r3.allowed, true, "Rate limit should reset after window expires");
});

runTest("Should prune stale rate-limited IPs during periodic housekeeping", () => {
  const limiter = new RateLimiter(50, 1);
  const ip = "192.168.2.2";
  
  limiter.handle(ip, Date.now());
  assertEquals(limiter.getIpCount(ip), 1);

  // Prune with current time should do nothing
  limiter.prune(Date.now());
  assertEquals(limiter.getIpCount(ip), 1);

  // Prune 100ms in the future should clean up
  limiter.prune(Date.now() + 100);
  assertEquals(limiter.getIpCount(ip), 0, "Stale IP limit records should be deleted");
});


// ==========================================
// 3. VALIDATOR TESTS
// ==========================================
console.log(cyan(bold("\n🧪 UNIT: String Validators")));

runTest("Should accept valid strings and trim whitespace", () => {
  const input = "  Kyoto, Japan   ";
  const sanitized = validateString(input, "Destination", 50, true);
  assertEquals(sanitized, "Kyoto, Japan");
});

runTest("Should throw errors for missing or undefined required parameters", () => {
  assertThrows(() => {
    validateString(null, "Target", 50, true);
  }, "Target is required.");

  assertThrows(() => {
    validateString(undefined, "Target", 50, true);
  }, "Target is required.");
});

runTest("Should allow undefined or null values when parameters are optional", () => {
  const out1 = validateString(null, "OptionalParam", 50, false);
  assertEquals(out1, "");

  const out2 = validateString(undefined, "OptionalParam", 50, false);
  assertEquals(out2, "");
});

runTest("Should reject values with non-string data types", () => {
  assertThrows(() => {
    validateString(12345, "Age", 50, false);
  }, "Age must be a valid string.");

  assertThrows(() => {
    validateString({ location: "Earth" }, "Complex", 50, false);
  }, "Complex must be a valid string.");
});

runTest("Should throw errors when string lengths exceed character limits", () => {
  assertThrows(() => {
    validateString("This string is too long for the limit", "ShortText", 15, false);
  }, "ShortText must not exceed 15 characters.");
});

runTest("Should throw errors for empty strings when required", () => {
  assertThrows(() => {
    validateString("    ", "RequiredField", 100, true);
  }, "RequiredField cannot be empty.");
});


// ==========================================
// 4. JSON PARSING & CLEANING TESTS
// ==========================================
console.log(cyan(bold("\n🧹 UNIT: JSON Sanitize & Parsers")));

runTest("Should parse clean JSON text standard inputs", () => {
  const sample = '{"location": "Tokyo", "visited": true}';
  const obj = cleanAndParseJson(sample);
  assertEquals(obj.location, "Tokyo");
  assertEquals(obj.visited, true);
});

runTest("Should successfully strip markdown code fences block strings", () => {
  const sample = "```json\n{\n  \"city\": \"Varanasi\",\n  \"temples\": 2000\n}\n```";
  const obj = cleanAndParseJson(sample);
  assertEquals(obj.city, "Varanasi");
  assertEquals(obj.temples, 2000);
});

runTest("Should successfully strip plain code block fences without json type", () => {
  const sample = "```\n{\"status\": \"ok\"}\n```";
  const obj = cleanAndParseJson(sample);
  assertEquals(obj.status, "ok");
});

runTest("Should throw explicit parse errors for invalid or malformed JSON", () => {
  const badSample = "{\n  \"city\": \"Kochi\",\n  \"broken\":\n";
  assertThrows(() => {
    cleanAndParseJson(badSample);
  }, "Failed to parse AI response as JSON");
});


// ==========================================
// REPORT SUMMARY
// ==========================================
console.log(bold("\n============================================="));
console.log(bold(`📊 SUMMARY REPORT`));
console.log(bold("============================================="));
console.log(`  Total Passed Tests: ${green(passedCount.toString())}`);
console.log(`  Total Failed Tests: ${failedCount > 0 ? red(failedCount.toString()) : green("0")}`);

if (failedCount > 0) {
  console.log(bold(red("\n❌ SOME TESTS FAILED. PLEASE FIX THEM!\n")));
  process.exit(1);
} else {
  console.log(bold(green("\n✨ ALL TESTS COMPLETED SUCCESSFULLY!\n")));
  process.exit(0);
}
