import { NextRequest, NextResponse } from "next/server";
import { db, doc, runTransaction } from "@/lib/firebase";

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

    const letterId = typeof body.letterId === "string" ? body.letterId.trim() : "";

    if (!letterId) {
      return NextResponse.json(
        { error: "Letter ID is required." },
        { status: 400 }
      );
    }

    const letterRef = doc(db, "sharedLetters", letterId);

    // Atomic transaction ensures single winner and guarantees burn-after-reading
    const result = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(letterRef);

      if (!snap.exists()) {
        return {
          status: "not_found" as const,
        };
      }

      const data = snap.data();

      if (data.opened === true) {
        // Document has already been opened and burned. Return NO content!
        return {
          status: "already_opened" as const,
          openedAt: data.openedAt || null,
          teaser: data.teaser || "A sealed letter that has vanished into the ether.",
        };
      }

      // First time reading: atomically mark opened and return content
      const now = Date.now();
      transaction.update(letterRef, {
        opened: true,
        openedAt: now,
      });

      return {
        status: "success" as const,
        letter: {
          id: letterId,
          content: data.content || "",
          teaser: data.teaser || "",
          createdAt: data.createdAt || now,
        },
      };
    });

    if (result.status === "not_found") {
      return NextResponse.json(
        { error: "Letter not found. It may have expired or never existed.", status: "not_found" },
        { status: 404 }
      );
    }

    if (result.status === "already_opened") {
      return NextResponse.json(
        {
          status: "already_opened",
          message: "This letter has already been opened and was burned after reading.",
          teaser: result.teaser,
          openedAt: result.openedAt,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      status: "success",
      letter: result.letter,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to open sealed letter.";
    console.error("[API letters/open] Transaction Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
