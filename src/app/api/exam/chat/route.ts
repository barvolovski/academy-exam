import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/ai";

const chatSchema = z.object({
  sessionId: z.string().uuid(),
  problemId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = chatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { message: "Invalid request", details: result.error.flatten() } },
        { status: 400 }
      );
    }

    const { sessionId, problemId, message } = result.data;
    const response = await chat(sessionId, problemId, message);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Failed to process chat";
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}
