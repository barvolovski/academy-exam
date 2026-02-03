import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const startExamSchema = z.object({
  accessCode: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessCode, name, email } = startExamSchema.parse(body);

    // Find exam by access code
    const exam = await db.exam.findUnique({
      where: { accessCode },
      include: {
        examProblems: {
          include: { problem: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { error: { code: "INVALID_ACCESS_CODE", message: "Invalid access code" } },
        { status: 400 }
      );
    }

    // Check if exam is active and within time window
    const now = new Date();
    if (!exam.isActive || now < exam.startsAt || now > exam.endsAt) {
      return NextResponse.json(
        { error: { code: "EXAM_NOT_ACTIVE", message: "This exam is not currently active" } },
        { status: 400 }
      );
    }

    // Check for existing session
    const existingSession = await db.examSession.findUnique({
      where: {
        examId_candidateEmail: {
          examId: exam.id,
          candidateEmail: email,
        },
      },
    });

    if (existingSession) {
      // Return existing session
      return NextResponse.json({
        sessionId: existingSession.id,
        token: existingSession.id, // Simple token for now
        exam: {
          title: exam.title,
          durationMinutes: exam.durationMinutes,
          endsAt: exam.endsAt,
        },
        problems: exam.examProblems.map((ep) => ({
          id: ep.problem.id,
          title: ep.problem.title,
          description: ep.problem.description,
          starterCode: ep.problem.starterCode,
          points: ep.points,
        })),
      });
    }

    // Create new session
    const session = await db.examSession.create({
      data: {
        examId: exam.id,
        candidateName: name,
        candidateEmail: email,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      token: session.id,
      exam: {
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        endsAt: exam.endsAt,
      },
      problems: exam.examProblems.map((ep) => ({
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
        { error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
        { status: 400 }
      );
    }

    console.error("Start exam error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
