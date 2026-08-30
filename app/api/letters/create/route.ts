import { NextRequest, NextResponse } from "next/server";
import { db, doc, setDoc, stripUndefined } from "@/lib/firebase";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";

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

    const entryTitle = typeof body.entryTitle === "string" ? body.entryTitle.trim() : "A Sealed Letter";
    const entryContent = typeof body.entryContent === "string" ? body.entryContent.trim() : "";
    let customTeaser = typeof body.customTeaser === "string" ? body.customTeaser.trim() : "";
    let customContent = typeof body.customContent === "string" ? body.customContent.trim() : "";

    if (!entryContent && !customContent) {
      return NextResponse.json(
        { error: "Content is required to seal and create a letter." },
        { status: 400 }
      );
    }

    // If custom content not provided, use entryContent or polish with Gemini if key exists
    let letterContent = customContent || entryContent;
    let teaser = customTeaser;

    if (!teaser) {
      const firstLine = letterContent.split("\n")[0].replace(/^#+\s*/, "").slice(0, 80);
      teaser = firstLine ? `"${firstLine}..."` : "A sealed reflection waiting to be opened...";
    }

    // Optional Gemini refinement if requested or if polish needed
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && (!customContent || !customTeaser)) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `Create a brief teaser quote strip (max 15 words) and ensure the following letter reads beautifully as a sealed personal letter:
Title: ${entryTitle}
Content:
${letterContent}`,
          config: {
            systemInstruction: "You format reflections into an intimate, beautifully composed letter with an enticing 10-15 word teaser line for the envelope flap. Respond in JSON: { teaser: string, formattedLetter: string }",
            responseMimeType: "application/json",
            temperature: 0.5,
          },
        });

        const rawText = response.text || "{}";
        const parsed = JSON.parse(rawText);
        if (parsed.teaser) teaser = String(parsed.teaser).trim();
        if (parsed.formattedLetter) letterContent = String(parsed.formattedLetter).trim();
      } catch (geminiErr: unknown) {
        console.warn("[Sealed Letter Create] Gemini formatting fallback:", geminiErr);
      }
    }

    // Generate secure random letterId (12 chars url-safe)
    const letterId = crypto.randomBytes(9).toString("base64url");
    const now = Date.now();

    const sharedDoc = stripUndefined({
      id: letterId,
      teaser: teaser.slice(0, 150),
      content: letterContent,
      opened: false,
      openedAt: null,
      createdAt: now,
    });

    // Write to top-level sharedLetters collection
    const letterRef = doc(db, "sharedLetters", letterId);
    await setDoc(letterRef, sharedDoc);

    return NextResponse.json({
      success: true,
      letterId,
      shareUrl: `/letter/${letterId}`,
      teaser,
      createdAt: now,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[API letters/create] Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
