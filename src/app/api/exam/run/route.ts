import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { executeCode, isAccepted, type Language, LANGUAGE_IDS } from "@/lib/judge0";

const runCodeSchema = z.object({
  sessionId: z.string().uuid(),
  problemId: z.string().uuid(),
  language: z.enum(["python", "java", "cpp", "go"]),
  code: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, problemId, language, code } = runCodeSchema.parse(body);

    // Verify session exists and is active
    const session = await db.examSession.findUnique({
      where: { id: sessionId },
      include: { exam: true },
    });

    if (!session || session.status !== "in_progress") {
      return NextResponse.json(
        { error: { code: "SESSION_INVALID", message: "Invalid or expired session" } },
        { status: 400 }
      );
    }

    // Check time
    if (new Date() > session.exam.endsAt) {
      await db.examSession.update({
        where: { id: sessionId },
        data: { status: "timed_out" },
      });
      return NextResponse.json(
        { error: { code: "SESSION_EXPIRED", message: "Exam time has expired" } },
        { status: 400 }
      );
    }

    // Get problem with test cases
    const problem = await db.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json(
        { error: { code: "PROBLEM_NOT_FOUND", message: "Problem not found" } },
        { status: 404 }
      );
    }

    const testCases = problem.testCases as Array<{
      input: string;
      expected: string;
      hidden: boolean;
    }>;

    // Run code against visible test cases only (for "Run" button)
    const visibleTests = testCases.filter((tc) => !tc.hidden);
    const results = [];

    for (let i = 0; i < visibleTests.length; i++) {
      const tc = visibleTests[i];
      try {
        const result = await executeCode(code, language as Language, tc.input, tc.expected);
        results.push({
          testCase: i + 1,
          passed: isAccepted(result.status.id),
          output: result.stdout?.trim() || "",
          expected: tc.expected,
          timeMs: result.time ? Math.round(parseFloat(result.time) * 1000) : 0,
          error: result.stderr || result.compileOutput || null,
        });
      } catch (error) {
        results.push({
          testCase: i + 1,
          passed: false,
          output: "",
          expected: tc.expected,
          timeMs: 0,
          error: error instanceof Error ? error.message : "Execution failed",
        });
      }
    }

    // Save submission (non-final)
    await db.submission.create({
      data: {
        sessionId,
        problemId,
        language,
        code,
        status: results.every((r) => r.passed) ? "passed" : "failed",
        testResults: results,
        isFinal: false,
      },
    });

    return NextResponse.json({
      status: "completed",
      results,
      passedCount: results.filter((r) => r.passed).length,
      totalCount: results.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
        { status: 400 }
      );
    }

    console.error("Run code error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
