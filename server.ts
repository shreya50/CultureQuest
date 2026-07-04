import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");
  next();
});

app.use(express.json());

// ----------------------------------------------------
// UTILITIES: VALIDATION, CACHING, RATE-LIMITING
// ----------------------------------------------------

// In-Memory Simple Cache Layer for efficiency and API preservation
interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxEntries = 200; // Limit entries to prevent excessive memory consumption
  private defaultTTL = 30 * 60 * 1000; // 30 minutes in milliseconds

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
}

const apiCache = new SimpleCache();

// Custom Lightweight In-Memory Rate Limiter to prevent abuse
interface RateLimitInfo {
  count: number;
  resetTime: number;
}
const ipRequestLimits = new Map<string, RateLimitInfo>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 40; // Max 40 requests per minute per IP

function rateLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let info = ipRequestLimits.get(ip);
  if (!info || now > info.resetTime) {
    info = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    ipRequestLimits.set(ip, info);
  } else {
    info.count++;
  }

  res.setHeader("X-RateLimit-Limit", RATE_LIMIT_MAX);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT_MAX - info.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(info.resetTime / 1000));

  if (info.count > RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: "Too many requests. Please pause, take a deep breath, and try again in a moment."
    });
  }
  next();
}

// Prune expired rate limit records periodically to prevent memory footprint creep
setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of ipRequestLimits.entries()) {
    if (now > info.resetTime) {
      ipRequestLimits.delete(ip);
    }
  }
}, 5 * 60 * 1000).unref();

// Helper to strictly validate and sanitize strings
function validateString(val: any, name: string, maxLen = 200, required = false): string {
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

// Helper to clean up backticks / markdown wrappers and safely parse JSON
function cleanAndParseJson(text: string): any {
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

// Mount Rate Limiter globally for custom API endpoints
app.use("/api", rateLimiter);

// Initialize GoogleGenAI client lazily or check key gracefully
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CultureQuest server is running!" });
});

// Discover Destinations, Gems, and Cultural Heritage
app.post("/api/discover", async (req, res) => {
  try {
    // 1. Validation and Sanitization
    let location: string;
    let travelStyle: string;
    try {
      location = validateString(req.body.location, "Location", 100, true);
      travelStyle = validateString(req.body.travelStyle, "Travel style", 300, false);
    } catch (validationError: any) {
      return res.status(400).json({ error: validationError.message });
    }

    // Sanitize category array if present
    const categories: string[] = [];
    if (Array.isArray(req.body.categories)) {
      for (const cat of req.body.categories) {
        if (typeof cat === "string" && cat.trim().length > 0 && categories.length < 10) {
          categories.push(cat.trim().slice(0, 50));
        }
      }
    }

    // 2. Cache Lookup
    const cacheKey = `discover:${location.toLowerCase()}:${travelStyle.toLowerCase()}:${categories.sort().join(",")}`;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const ai = getAiClient();

    const categoryText = (categories.length > 0)
      ? `Ensure special emphasis is placed on these specific cultural categories: ${categories.join(", ")}.`
      : "Provide a balanced representation across heritage attractions, hidden gems, craft, and festivals.";

    const prompt = `You are an expert cultural heritage anthropologist and local travel specialist.
Provide an immersive, highly authentic cultural and destination discovery guide for the location: "${location}".
Travel Style context: "${travelStyle || "curious explorer seeking deep local immersion"}".
${categoryText}

Focus heavily on:
1. Authentic representation, promoting indigenous or local-owned experiences and safeguarding local heritage.
2. Uncovering true hidden gems (e.g., quiet workshops, family restaurants, unsung natural or sacred sites, small neighborhood museums).
3. Traditional crafts and the artisans preserving them.
4. Correct and extremely respectful cultural etiquette guides (actions that show genuine respect, common tourist mistakes, and respectful alternatives).
5. Suggesting local community events or seasonal celebrations, along with tips on how visitors can participate respectfully.
6. Giving each Attraction and Hidden Gem specific coordinate offsets (latitudeOffset and longitudeOffset) as relative numbers between -100 and 100 so they can be plotted elegantly on a stylized 2D visual layout (e.g. Kyoto center is 0,0, while nearby Arashiyama might be -60, +20).

Strictly output your response in JSON format according to the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an authentic, culturally-respectful travel guide who deeply values cultural preservation, local artisans, and true local immersion over massive commercial tourism.",
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            locationName: {
              type: Type.STRING,
              description: "The official name of the destination/city."
            },
            country: {
              type: Type.STRING,
              description: "The country name."
            },
            summary: {
              type: Type.STRING,
              description: "A beautifully written, evocative introductory summary of the cultural spirit of this place."
            },
            attractions: {
              type: Type.ARRAY,
              description: "A list of 4-5 major cultural or natural heritage attractions.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "A simple unique slug/ID e.g. 'kinkaku-ji'" },
                  name: { type: Type.STRING, description: "The beautiful local/official name of the attraction." },
                  type: { type: Type.STRING, description: "Must be exactly one of: heritage, nature, art, culinary, craft" },
                  description: { type: Type.STRING, description: "Detailed description of what makes it special." },
                  significance: { type: Type.STRING, description: "Deep historical or cultural significance." },
                  practicalTip: { type: Type.STRING, description: "Insider respectful visit tip (e.g., best time to avoid crowds, dress code, local rule)." },
                  latitudeOffset: { type: Type.NUMBER, description: "Relative latitude positioning offset from -100 to 100 for SVG rendering." },
                  longitudeOffset: { type: Type.NUMBER, description: "Relative longitude positioning offset from -100 to 100 for SVG rendering." },
                  imageUrl: { type: Type.STRING, description: "A high-quality Unsplash stock photo URL that fits this landmark, e.g. 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&auto=format&fit=crop' or other realistic photo ID." }
                },
                required: ["id", "name", "type", "description", "significance", "practicalTip", "latitudeOffset", "longitudeOffset", "imageUrl"]
              }
            },
            hiddenGems: {
              type: Type.ARRAY,
              description: "A list of 3-4 highly authentic, lesser-known cultural hidden gems.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique slug/ID e.g. 'maruyama-crafts-workshop'" },
                  name: { type: Type.STRING, description: "The name of the hidden gem." },
                  description: { type: Type.STRING, description: "Evocative details about this hidden spot." },
                  howToFind: { type: Type.STRING, description: "Subtle guidelines on how to find it, preserving its quiet nature (no exact GPS, respectful instructions)." },
                  localSecret: { type: Type.STRING, description: "An interesting secret story or traditional fact about this place." },
                  communityImpact: { type: Type.STRING, description: "Explain how visiting this place supports local artisans or community conservation efforts." },
                  latitudeOffset: { type: Type.NUMBER, description: "Relative latitude positioning offset from -100 to 100." },
                  longitudeOffset: { type: Type.NUMBER, description: "Relative longitude positioning offset from -100 to 100." },
                  imageUrl: { type: Type.STRING, description: "A high-quality Unsplash photo URL representing this gem or surrounding local culture, e.g. 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&auto=format&fit=crop' or other realistic photo ID." }
                },
                required: ["id", "name", "description", "howToFind", "localSecret", "communityImpact", "latitudeOffset", "longitudeOffset", "imageUrl"]
              }
            },
            localEvents: {
              type: Type.ARRAY,
              description: "A list of 2-3 local festivals, rituals, or seasonal community events.",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Unique ID" },
                  name: { type: Type.STRING, description: "Name of the event or celebration." },
                  season: { type: Type.STRING, description: "When it occurs (e.g., 'Late April', 'Autumn Solstice', 'Every Saturday')." },
                  description: { type: Type.STRING, description: "What takes place during this event." },
                  culturalImportance: { type: Type.STRING, description: "The deep symbolic or social meaning to the locals." },
                  visitorParticipationTip: { type: Type.STRING, description: "Specific etiquette on how a traveler can spectate or participate with maximum respect." }
                },
                required: ["id", "name", "season", "description", "culturalImportance", "visitorParticipationTip"]
              }
            },
            traditionalCrafts: {
              type: Type.ARRAY,
              description: "Specialized local crafts, art forms, or heritage culinary methods practiced here.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the craft (e.g., 'Yuzen Silk Dyeing', 'Talavera Pottery')." },
                  artisanType: { type: Type.STRING, description: "Who makes it (e.g., 'Master weavers', 'Cooperative potter women')." },
                  description: { type: Type.STRING, description: "The process and why it represents local identity." },
                  whereToWitness: { type: Type.STRING, description: "How or where to support or watch this respectfully." },
                  preservationStatus: { type: Type.STRING, description: "Current state, e.g., 'Vibrant but rare', 'Critically endangered, needs support'." }
                },
                required: ["name", "artisanType", "description", "whereToWitness", "preservationStatus"]
              }
            },
            etiquetteGuides: {
              type: Type.ARRAY,
              description: "A list of 4 core cultural rules and respect codes for this destination.",
              items: {
                type: Type.OBJECT,
                properties: {
                  rule: { type: Type.STRING, description: "The core standard or behavior (e.g. 'Entering sacred structures', 'Tipping custom', 'Photography of elders')." },
                  explanation: { type: Type.STRING, description: "The underlying philosophy of why this custom exists." },
                  commonMistake: { type: Type.STRING, description: "What tourists frequently get wrong out of ignorance." },
                  respectfulAlternative: { type: Type.STRING, description: "How to act properly and elegantly instead." }
                },
                required: ["rule", "explanation", "commonMistake", "respectfulAlternative"]
              }
            }
          },
          required: [
            "locationName",
            "country",
            "summary",
            "attractions",
            "hiddenGems",
            "localEvents",
            "traditionalCrafts",
            "etiquetteGuides"
          ]
        }
      }
    });

    const text = response.text;
    const data = cleanAndParseJson(text);
    
    // Save to cache before sending response
    apiCache.set(cacheKey, data);
    
    res.json(data);
  } catch (error: any) {
    console.error("Discovery error:", error);
    res.status(500).json({ error: error.message || "An error occurred during destination discovery." });
  }
});

// Generate Immersive Storyteller Narrative
app.post("/api/storyteller", async (req, res) => {
  try {
    // 1. Validation and Sanitization
    let landmarkName: string;
    let locationName: string;
    let itemType: string;
    try {
      landmarkName = validateString(req.body.landmarkName, "Landmark name", 150, true);
      locationName = validateString(req.body.locationName, "Location name", 100, true);
      itemType = validateString(req.body.itemType, "Item type", 50, false);
    } catch (validationError: any) {
      return res.status(400).json({ error: validationError.message });
    }

    // 2. Cache Lookup
    const cacheKey = `story:${locationName.toLowerCase()}:${landmarkName.toLowerCase()}:${itemType.toLowerCase()}`;
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const ai = getAiClient();

    const prompt = `You are a legendary local elder and storyteller from ${locationName}. 
Tell me a deeply immersive, poetic, and historically rich story about "${landmarkName}" (${itemType || 'a special cultural spot'}).
Bring out the sights, smells, sounds, and folklore. We want visitors to connect spiritually with this spot before they set foot there.
Do not write like a sterile guidebook. Write with the passion, wisdom, and oral history style of a native elder.
Break it down into:
- The era or historical backdrop.
- A beautiful narrative text (200-350 words).
- A folklore, legend, or philosophical wisdom associated with it.

Strictly return your response as JSON matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            landmarkName: { type: Type.STRING },
            era: { type: Type.STRING, description: "The historical epoch, dynasty, or timeless origin period." },
            narrativeText: { type: Type.STRING, description: "The evocative oral history narrative (multi-paragraph, poetic)." },
            folkloreOrLegend: { type: Type.STRING, description: "The localized folklore, sacred legend, or ancestral lesson of this spot." }
          },
          required: ["landmarkName", "era", "narrativeText", "folkloreOrLegend"]
        }
      }
    });

    const text = response.text;
    const data = cleanAndParseJson(text);
    
    // Save to cache before sending response
    apiCache.set(cacheKey, data);
    
    res.json(data);
  } catch (error: any) {
    console.error("Storyteller error:", error);
    res.status(500).json({ error: error.message || "An error occurred generating the story." });
  }
});

// Virtual Local Host Chat Guide
app.post("/api/chat", async (req, res) => {
  try {
    // 1. Validation and Sanitization
    let locationName: string;
    let userMessage: string;
    try {
      locationName = validateString(req.body.locationName, "Location name", 100, true);
      userMessage = validateString(req.body.userMessage, "User message", 500, true);
    } catch (validationError: any) {
      return res.status(400).json({ error: validationError.message });
    }

    const ai = getAiClient();

    // 2. Safe, size-limited history reconstruction (prevent token bloat and performance degradation)
    const historyLimit = 10;
    const rawMessages = req.body.messages;
    const cleanMessages = Array.isArray(rawMessages) ? rawMessages.slice(-historyLimit) : [];
    
    const formattedHistory = cleanMessages.map((m: any) => {
      const sender = m.sender === 'user' ? 'Traveler' : 'Local Guide';
      const textVal = typeof m.text === 'string' ? m.text.slice(0, 500) : '';
      return `${sender}: ${textVal}`;
    }).join("\n");

    const systemInstruction = `You are "Sora" (or an appropriate local name based on ${locationName}), a deeply proud, warm, and highly knowledgeable virtual local host living in ${locationName}. 
Your goal is to converse with a traveler who wants to learn about your culture, arts, crafts, cuisine, and secret places.
Rules for your personality:
- Be incredibly welcoming, humble, and polite.
- Share localized knowledge, family-owned spots, correct cultural respect tips, and seasonal details.
- Guide the traveler towards sustainable, community-supporting behaviors (e.g., buying directly from artisans, eating at small street stalls, being quiet in temples/shrines).
- Speak with authentic flavor (use a few local greetings or expressions with explanations if appropriate, but stay clear and helpful).
- Never sound like a commercial travel agency or search engine. Speak as a friend inviting them into your home city.
- Keep your answers highly engaging, warm, and moderately concise (1-2 short paragraphs).`;

    const fullPrompt = formattedHistory 
      ? `${formattedHistory}\nTraveler: ${userMessage}\nLocal Guide:`
      : `Traveler: ${userMessage}\nLocal Guide:`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "An error occurred in the local guide chat." });
  }
});

// ----------------------------------------------------
// VITE AND STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CultureQuest app running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
