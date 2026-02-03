import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getChatHistory, getAIConfig } from "@/lib/ai";
import { db } from "@/lib/db";

const querySchema = z.object({
  sessionId: z.string().uuid(),
  problemId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = querySchema.safeParse({
      sessionId: searchParams.get("sessionId"),
      problemId: searchParams.get("problemId"),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: { message: "Invalid request" } },
        { status: 400 }
      );
    }

    const { sessionId, problemId } = result.data;

    // Get session to check examId
    const session = await db.examSession.findUnique({
      where: { id: sessionId },
      select: { examId: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: { message: "Session not found" } },
        { status: 404 }
      );
    }

    const config = await getAIConfig(problemId, session.examId);
    const history = await getChatHistory(sessionId, problemId);

    return NextResponse.json({
      enabled: config.enabled,
      ...history,
    });
  } catch (error) {
    console.error("Chat history API error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch chat history" } },
      { status: 500 }
    );
  }
}
