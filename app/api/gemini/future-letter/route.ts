import { GoogleGenAI, type Schema } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

const futureLetterSchema: Schema = {
  type: "OBJECT" as const,
  properties: {
    teaser: {
      type: "STRING" as const,
      description: "A short, poetic, handwritten-style teaser quote strip (10-18 words) hinting at what future wisdom awaits without spoiling it all.",
    },
    letter: {
      type: "STRING" as const,
      description: "A warm, profound, and grounded letter written from the voice of the user's Future Self (around 150-250 words). It specifically addresses their current struggles, goals, and reflections.",
    },
  },
  required: ["teaser", "letter"],
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

    const entryTitle = typeof body.entryTitle === "string" ? body.entryTitle.trim() : "Current Reflection";
    const entryContent = typeof body.entryContent === "string" ? body.entryContent.trim() : "";
    const deliveryDate = typeof body.deliveryDate === "string" ? body.deliveryDate.trim() : "a future date";
    const recentThemes = Array.isArray(body.recentThemes) ? body.recentThemes.join(", ") : "";

    if (!entryContent) {
      return NextResponse.json(
        { error: "Journal entry content is required to draft a Future Letter." },
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

    const systemInstruction = `You are the user's Future Self, writing back across time to your present self who will read this letter on ${deliveryDate}.
Tone: Warm, grounded, wise, deeply personal, and calming.
DO NOT use generic clichés. Ground your words directly in the actual themes, doubts, and aspirations expressed in their reflection.
Acknowledge the specific weight of what they are experiencing right now, offer perspective on how it shaped you, and express profound gratitude for their perseverance.`;

    const promptText = `Here is my current reflection that I am writing today:
Title: ${entryTitle}
${recentThemes ? `Recent Themes: ${recentThemes}` : ""}
Content:
${entryContent}

Please write a letter from my Future Self on ${deliveryDate} back to me, along with a short handwritten teaser quote strip for the envelope flap.`;

    let result: { teaser: string; letter: string } | null = null;

    for (const modelName of MODEL_FALLBACK_LADDER) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            systemInstruction,
            temperature: 0.7,
            responseMimeType: "application/json",
            responseSchema: futureLetterSchema,
          },
        });

        const rawText = response.text || "{}";
        const data = JSON.parse(rawText);

        if (data.letter && data.teaser) {
          result = {
            teaser: String(data.teaser).trim(),
            letter: String(data.letter).trim(),
          };
          break;
        }
      } catch (err: unknown) {
        console.warn(`[Future Letter Fallback] Model ${modelName} failed:`, err);
        continue;
      }
    }

    if (!result) {
      result = {
        teaser: "You are stronger than the uncertainties of today — look how far we have traveled.",
        letter: `Dear Past Self,\n\nLooking back at when you wrote "${entryTitle}", I remember how real the weight felt. Take heart: the questions you are asking today are already shaping the peace you will inhabit tomorrow. Trust your pace, honor your quiet efforts, and know that we made it through.\n\nWith all my love,\nYour Future Self`,
      };
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API gemini/future-letter] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
