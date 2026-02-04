import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const sessionQuerySchema = z.object({
  sessionId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const { sessionId: validSessionId } = sessionQuerySchema.parse({ sessionId });

    // Find session with exam and problems
    const session = await db.examSession.findUnique({
      where: { id: validSessionId },
      include: {
        exam: {
          include: {
            examProblems: {
              include: { problem: true },
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: { code: "SESSION_NOT_FOUND", message: "Exam session not found" } },
        { status: 404 }
      );
    }

    // Check if session is still valid (not timed out or submitted)
    if (session.status === "submitted") {
      return NextResponse.json(
        { error: { code: "SESSION_SUBMITTED", message: "This exam has already been submitted" } },
        { status: 400 }
      );
    }

    if (session.status === "timed_out") {
      return NextResponse.json(
        { error: { code: "SESSION_TIMED_OUT", message: "This exam session has timed out" } },
        { status: 400 }
      );
    }

    // Check if exam time has passed
    const now = new Date();
    if (now > session.exam.endsAt) {
      // Update session status to timed_out
      await db.examSession.update({
        where: { id: validSessionId },
        data: { status: "timed_out" },
      });
      return NextResponse.json(
        { error: { code: "EXAM_ENDED", message: "The exam has ended" } },
        { status: 400 }
      );
    }

    // Return session data in the same format as start endpoint
    return NextResponse.json({
      sessionId: session.id,
      token: session.token || session.id,
      exam: {
        title: session.exam.title,
        durationMinutes: session.exam.durationMinutes,
        endsAt: session.exam.endsAt,
      },
      problems: session.exam.examProblems.map((ep) => ({
        id: ep.problem.id,
        title: ep.problem.title,
        description: ep.problem.description,
        starterCode: ep.problem.starterCode,
        points: ep.points,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid session ID" } },
        { status: 400 }
      );
    }

    console.error("Get session error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
