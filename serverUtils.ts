export interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries = 200; // Limit entries to prevent excessive memory consumption
  private defaultTTL = 30 * 60 * 1000; // 30 minutes in milliseconds

  constructor(maxEntries = 200, defaultTTL = 30 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.defaultTTL = defaultTTL;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, ttlMs = this.defaultTTL): void {
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export class RateLimiter {
  private ipRequestLimits = new Map<string, { count: number; resetTime: number }>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60 * 1000, maxRequests = 40) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  handle(ip: string, now = Date.now()): RateLimitResult {
    let info = this.ipRequestLimits.get(ip);
    if (!info || now > info.resetTime) {
      info = { count: 1, resetTime: now + this.windowMs };
      this.ipRequestLimits.set(ip, info);
    } else {
      info.count++;
    }

    const remaining = Math.max(0, this.maxRequests - info.count);
    return {
      allowed: info.count <= this.maxRequests,
      remaining,
      resetTime: info.resetTime,
    };
  }

  prune(now = Date.now()): void {
    for (const [ip, info] of this.ipRequestLimits.entries()) {
      if (now > info.resetTime) {
        this.ipRequestLimits.delete(ip);
      }
    }
  }

  clear(): void {
    this.ipRequestLimits.clear();
  }

  getLimit(): number {
    return this.maxRequests;
  }

  getIpCount(ip: string): number {
    return this.ipRequestLimits.get(ip)?.count || 0;
  }
}

export function validateString(val: any, name: string, maxLen = 200, required = false): string {
  if (val === undefined || val === null) {
    if (required) {
      throw new Error(`${name} is required.`);
    }
    return "";
  }
  if (typeof val !== "string") {
    throw new Error(`${name} must be a valid string.`);
  }
  const clean = val.trim();
  if (required && clean.length === 0) {
    throw new Error(`${name} cannot be empty.`);
  }
  if (clean.length > maxLen) {
    throw new Error(`${name} must not exceed ${maxLen} characters.`);
  }
  return clean;
}

export function cleanAndParseJson(text: string): any {
  if (!text) {
    throw new Error("Received empty response from the AI model.");
  }
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "");
    cleaned = cleaned.replace(/\n?```$/i, "");
    cleaned = cleaned.trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error("AI response is not valid JSON:", cleaned);
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }
}
