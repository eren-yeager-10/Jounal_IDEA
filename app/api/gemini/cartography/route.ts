import { GoogleGenAI, type Schema } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { type CartographyMetadata } from "@/lib/types";

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

const cartographyResponseSchema: Schema = {
  type: "OBJECT" as const,
  properties: {
    themes: {
      type: "ARRAY" as const,
      items: { type: "STRING" as const },
      description: "2 to 4 dominant conceptual or emotional themes (e.g. 'work-life balance', 'resilience', 'gratitude', 'impostor syndrome', 'family connection')",
    },
    people: {
      type: "ARRAY" as const,
      items: { type: "STRING" as const },
      description: "Specific individuals, relationships, or named figures mentioned (e.g. 'Sarah', 'Father', 'Team lead', 'Partner', 'Self')",
    },
    sentiment: {
      type: "NUMBER" as const,
      description: "Overall emotional valence scored strictly between -1.0 (deep distress/frustration) and 1.0 (deep joy/empowerment). 0.0 represents calm neutrality.",
    },
    recurring_flag: {
      type: "BOOLEAN" as const,
      description: "Set to true if this entry exhibits an ongoing life motif, habitual mindset pattern, or recurring behavioral dilemma.",
    },
  },
  required: ["themes", "people", "sentiment", "recurring_flag"],
};

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      const raw = await req.json();
      if (raw && typeof raw === "object") {
        body = raw;
      }
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const entryTitle = typeof body.entryTitle === "string" ? body.entryTitle.trim() : "Untitled";
    const entryContent = typeof body.entryContent === "string" ? body.entryContent.trim() : "";

    if (!entryContent) {
      return NextResponse.json(
        { error: "Journal entry content is required for Emotional Cartography extraction." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert psychological and emotional cartographer.
Your job is to analyze the user's private journal entry and extract structured emotional metrics for emotional pattern tracking.
Extract:
1. themes: 2 to 4 concise thematic tags (lowercase preferred).
2. people: any specific people, colleagues, family members, or named entities referenced.
3. sentiment: floating point number strictly between -1.0 (most negative) and 1.0 (most positive).
4. recurring_flag: boolean indicating if this suggests a recurring mindset, habitual loop, or ongoing life theme.

Output MUST strictly conform to the provided JSON Schema.`;

    const promptText = `Analyze this journal entry:
Title: ${entryTitle}
Content:
${entryContent}`;

    let parsedResult: CartographyMetadata | null = null;
    let modelUsed = "";

    for (const modelName of MODEL_FALLBACK_LADDER) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            systemInstruction,
            temperature: 0.2,
            responseMimeType: "application/json",
            responseSchema: cartographyResponseSchema,
          },
        });

        const rawText = response.text || "{}";
        const data = JSON.parse(rawText);

        // Validate and sanitize extracted structured fields
        const themes = Array.isArray(data.themes)
          ? data.themes.map((t: unknown) => String(t).trim().toLowerCase()).filter(Boolean)
          : ["general reflection"];
        
        const people = Array.isArray(data.people)
          ? data.people.map((p: unknown) => String(p).trim()).filter(Boolean)
          : [];

        let sentiment = typeof data.sentiment === "number" ? data.sentiment : 0.0;
        if (isNaN(sentiment)) sentiment = 0.0;
        sentiment = Math.max(-1.0, Math.min(1.0, sentiment));

        const recurring_flag = Boolean(data.recurring_flag);

        parsedResult = {
          themes: themes.length > 0 ? themes : ["reflection"],
          people,
          sentiment: Math.round(sentiment * 100) / 100,
          recurring_flag,
          analyzedAt: Date.now(),
        };

        modelUsed = modelName;
        break;
      } catch (err: unknown) {
        console.warn(`[Cartography Fallback] Model ${modelName} failed:`, err);
        continue;
      }
    }

    if (!parsedResult) {
      // Fallback baseline heuristic if all AI models fail
      parsedResult = {
        themes: ["mindfulness", "reflection"],
        people: [],
        sentiment: 0.1,
        recurring_flag: false,
        analyzedAt: Date.now(),
      };
    }

    return NextResponse.json({
      cartography: parsedResult,
      modelUsed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API gemini/cartography] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
