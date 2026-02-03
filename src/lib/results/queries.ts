import { db } from "@/lib/db";

export interface ExamResultRow {
  id: string;
  candidateName: string;
  candidateEmail: string;
  totalScore: number | null;
  maxScore: number;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  timeTakenMinutes: number | null;
  proctorFlags: number;
  examTitle: string;
  examId: string;
}

export async function getExamResults(examId?: string): Promise<ExamResultRow[]> {
  const sessions = await db.examSession.findMany({
    where: examId ? { examId } : undefined,
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      candidateName: true,
      candidateEmail: true,
      totalScore: true,
      status: true,
      startedAt: true,
      submittedAt: true,
      examId: true,
      exam: {
        select: {
          title: true,
          examProblems: {
            select: {
              points: true,
            },
          },
        },
      },
      _count: {
        select: {
          proctorEvents: true,
        },
      },
    },
  });

  return sessions.map((session) => {
    const timeTakenMinutes = session.submittedAt
      ? Math.round(
          (session.submittedAt.getTime() - session.startedAt.getTime()) / 60000
        )
      : null;

    return {
      id: session.id,
      candidateName: session.candidateName,
      candidateEmail: session.candidateEmail,
      totalScore: session.totalScore,
      maxScore: session.exam.examProblems.reduce((sum, p) => sum + p.points, 0),
      status: session.status,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      timeTakenMinutes,
      proctorFlags: session._count.proctorEvents,
      examTitle: session.exam.title,
      examId: session.examId,
    };
  });
}

export interface SessionDetail {
  id: string;
  candidateName: string;
  candidateEmail: string;
  totalScore: number | null;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
  };
  submissions: Array<{
    id: string;
    problemId: string;
    problemTitle: string;
    points: number;
    language: string;
    code: string;
    status: string;
    testResults: Array<{ passed: boolean; output: string }> | null;
    isFinal: boolean;
    createdAt: Date;
  }>;
  proctorEvents: Array<{
    id: string;
    eventType: string;
    details: unknown;
    createdAt: Date;
  }>;
}

export async function getSessionDetail(
  sessionId: string
): Promise<SessionDetail | null> {
  const session = await db.examSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      candidateName: true,
      candidateEmail: true,
      totalScore: true,
      status: true,
      startedAt: true,
      submittedAt: true,
      exam: {
        select: {
          id: true,
          title: true,
          durationMinutes: true,
          examProblems: {
            select: {
              problemId: true,
              points: true,
              problem: {
                select: {
                  title: true,
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      },
      submissions: {
        where: { isFinal: true },
        select: {
          id: true,
          problemId: true,
          language: true,
          code: true,
          status: true,
          testResults: true,
          isFinal: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      proctorEvents: {
        select: {
          id: true,
          eventType: true,
          details: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  const problemMap = new Map(
    session.exam.examProblems.map((ep) => [
      ep.problemId,
      { title: ep.problem.title, points: ep.points },
    ])
  );

  return {
    id: session.id,
    candidateName: session.candidateName,
    candidateEmail: session.candidateEmail,
    totalScore: session.totalScore,
    status: session.status,
    startedAt: session.startedAt,
    submittedAt: session.submittedAt,
    exam: {
      id: session.exam.id,
      title: session.exam.title,
      durationMinutes: session.exam.durationMinutes,
    },
    submissions: session.submissions.map((sub) => {
      const problem = problemMap.get(sub.problemId);
      return {
        id: sub.id,
        problemId: sub.problemId,
        problemTitle: problem?.title ?? "Unknown Problem",
        points: problem?.points ?? 0,
        language: sub.language,
        code: sub.code,
        status: sub.status,
        testResults: sub.testResults as Array<{
          passed: boolean;
          output: string;
        }> | null,
        isFinal: sub.isFinal,
        createdAt: sub.createdAt,
      };
    }),
    proctorEvents: session.proctorEvents.map((event) => ({
      id: event.id,
      eventType: event.eventType,
      details: event.details,
      createdAt: event.createdAt,
    })),
  };
}

// UTF-8 BOM for Excel compatibility
const UTF8_BOM = "\uFEFF";

export async function exportResultsCSV(examId: string): Promise<string> {
  const results = await getExamResults(examId);

  const headers = [
    "Name",
    "Email",
    "Score",
    "Max Score",
    "Percentage",
    "Status",
    "Time Taken (min)",
    "Flags",
    "Started At",
    "Submitted At",
  ];

  const rows = results.map((r) => [
    escapeCSV(r.candidateName),
    escapeCSV(r.candidateEmail),
    r.totalScore?.toString() ?? "",
    r.maxScore.toString(),
    r.totalScore !== null && r.maxScore > 0
      ? ((r.totalScore / r.maxScore) * 100).toFixed(1) + "%"
      : "",
    r.status,
    r.timeTakenMinutes?.toString() ?? "",
    r.proctorFlags.toString(),
    formatDateTime(r.startedAt),
    r.submittedAt ? formatDateTime(r.submittedAt) : "",
  ]);

  return (
    UTF8_BOM + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  );
}

function formatDateTime(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function getExamsForFilter() {
  return db.exam.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
    },
  });
}
