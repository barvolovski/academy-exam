import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { executeCode, isAccepted, type Language } from "@/lib/judge0";

const submitSchema = z.object({
  sessionId: z.string().uuid(),
  problemId: z.string().uuid(),
  language: z.enum(["python", "java", "cpp", "go"]),
  code: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, problemId, language, code } = submitSchema.parse(body);

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

    // Run code against ALL test cases (including hidden ones) for final submission
    const results = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      try {
        const result = await executeCode(code, language as Language, tc.input, tc.expected);
        results.push({
          testCase: i + 1,
          passed: isAccepted(result.status.id),
          output: result.stdout?.trim() || "",
          expected: tc.expected,
          timeMs: result.time ? Math.round(parseFloat(result.time) * 1000) : 0,
          error: result.stderr || result.compileOutput || null,
          hidden: tc.hidden,
        });
      } catch (error) {
        results.push({
          testCase: i + 1,
          passed: false,
          output: "",
          expected: tc.expected,
          timeMs: 0,
          error: error instanceof Error ? error.message : "Execution failed",
          hidden: tc.hidden,
        });
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    const allPassed = passedCount === totalCount;

    // Calculate score based on problem points
    // Get the exam problem to find the points
    const examProblem = await db.examProblem.findFirst({
      where: {
        examId: session.examId,
        problemId: problemId,
      },
    });

    const maxPoints = examProblem?.points || 0;
    const earnedPoints = allPassed ? maxPoints : Math.floor((passedCount / totalCount) * maxPoints);

    // Save final submission
    await db.submission.create({
      data: {
        sessionId,
        problemId,
        language,
        code,
        status: allPassed ? "passed" : "failed",
        testResults: results,
        isFinal: true,
      },
    });

    // Update session score - recalculate from all final submissions
    const allFinalSubmissions = await db.submission.findMany({
      where: {
        sessionId,
        isFinal: true,
      },
      include: {
        problem: true,
      },
    });

    // Get exam problems to find points for each problem
    const examProblems = await db.examProblem.findMany({
      where: { examId: session.examId },
    });

    const problemPointsMap = new Map(
      examProblems.map((ep) => [ep.problemId, ep.points])
    );

    // Calculate total score based on passed submissions
    let totalScore = 0;
    for (const sub of allFinalSubmissions) {
      if (sub.status === "passed") {
        totalScore += problemPointsMap.get(sub.problemId) || 0;
      }
    }

    await db.examSession.update({
      where: { id: sessionId },
      data: { totalScore },
    });

    // Return results (hide details of hidden test cases)
    const visibleResults = results.map((r) => ({
      testCase: r.testCase,
      passed: r.passed,
      output: r.hidden ? "[Hidden]" : r.output,
      expected: r.hidden ? "[Hidden]" : r.expected,
      timeMs: r.timeMs,
      error: r.hidden ? (r.passed ? null : "Hidden test failed") : r.error,
      hidden: r.hidden,
    }));

    return NextResponse.json({
      status: "submitted",
      allPassed,
      passedCount,
      totalCount,
      score: earnedPoints,
      maxScore: maxPoints,
      results: visibleResults,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input" } },
        { status: 400 }
      );
    }

    console.error("Submit error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
