import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { type ReflectionRequest, type ReflectionMode } from "@/lib/types";

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

// Helper to execute generateContent with fallback ladder
async function generateContentWithFallback(
  ai: GoogleGenAI,
  systemInstruction: string,
  contents: Array<{ role?: string; parts: Array<{ text: string }> }> | string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: unknown = null;

  for (const modelName of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "";
      if (text) {
        return { text, modelUsed: modelName };
      }
    } catch (err: unknown) {
      lastError = err;
      const errorMsg = String(err);
      console.warn(`[Gemini Fallback] Model ${modelName} failed, trying next. Error: ${errorMsg}`);
      
      // Continue to next model in ladder for typical API failures
      continue;
    }
  }

  throw lastError || new Error("All Gemini models in fallback ladder failed to generate content.");
}

export async function POST(req: NextRequest) {
  try {
    // 1. Defensive Payload Ingestion (Null-Safe Destructuring)
    let body: Partial<ReflectionRequest> = {};
    try {
      const raw = await req.json();
      if (raw && typeof raw === "object") {
        body = raw;
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload in request body" },
        { status: 400 }
      );
    }

    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const entryContent = typeof body.entryContent === "string" ? body.entryContent.trim() : "";
    const entryTitle = typeof body.entryTitle === "string" ? body.entryTitle.trim() : "Untitled Reflection";
    const mode: ReflectionMode = body.mode && ["reflect", "summarize", "brainstorm", "chat"].includes(body.mode) 
      ? body.mode 
      : "reflect";
    const history = Array.isArray(body.history) ? body.history : [];

    if (!prompt && !entryContent) {
      return NextResponse.json(
        { error: "Prompt or entry content is required" },
        { status: 400 }
      );
    }

    // 2. Validate API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not configured on the server." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // 3. Craft contextual system instructions according to mode
    let systemInstruction = `You are a thoughtful, empathetic, and highly insightful AI Journaling and Reflection Companion.
Your goal is to help the user unpack their thoughts, cultivate clarity, discover hidden patterns, and develop actionable constructive wisdom.
Maintain a supportive, authentic tone. Avoid generic platitudes. Use clean Markdown with headers, bullet points, or bold highlights where appropriate.`;

    if (mode === "summarize") {
      systemInstruction += `\nTASK: Provide a concise executive summary of the user's reflection.
Include:
1. Core Theme & Key Insights (2-3 concise points)
2. Emotional Tone & Mindset Shift
3. Actionable Takeaways or Next Steps.`;
    } else if (mode === "brainstorm") {
      systemInstruction += `\nTASK: Generate creative, diverse angles, alternative perspectives, and constructive solutions or creative explorations based on the user's thoughts.
Provide 3-5 distinct brainstorming angles with brief concrete examples.`;
    } else if (mode === "reflect") {
      systemInstruction += `\nTASK: Offer a deep, thoughtful reflection on the user's entry.
- Acknowledge and validate their authentic experience.
- Surface subtle patterns, underlying values, or strengths.
- Offer 2 powerful, introspective reflection questions to help them explore further.`;
    } else {
      systemInstruction += `\nTASK: Engage in an ongoing dialogue with the user about their reflections and ideas. Respond to their latest message directly while keeping the full context in mind.`;
    }

    // 4. Construct multi-turn contents
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Context banner
    if (entryContent) {
      contents.push({
        role: "user",
        parts: [{ 
          text: `[Journal Entry Context - Title: "${entryTitle}"]\n${entryContent}` 
        }],
      });
      contents.push({
        role: "model",
        parts: [{ 
          text: `I have read and internalized your journal entry "${entryTitle}". How would you like us to explore or reflect on it?` 
        }],
      });
    }

    // Append conversation history
    for (const msg of history) {
      if (msg.content && (msg.role === "user" || msg.role === "model")) {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add latest prompt
    if (prompt) {
      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });
    }

    // 5. Generate content with fallback
    const { text, modelUsed } = await generateContentWithFallback(ai, systemInstruction, contents);

    return NextResponse.json({
      text,
      mode,
      modelUsed,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[API gemini/reflect] Error:", error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
