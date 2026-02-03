import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ExamForm } from "../_components/exam-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExamPage({ params }: PageProps) {
  const { id } = await params;

  const [exam, problems] = await Promise.all([
    db.exam.findUnique({
      where: { id },
      include: {
        examProblems: {
          orderBy: { order: "asc" },
          select: {
            problemId: true,
            points: true,
          },
        },
      },
    }),
    db.problem.findMany({
      select: {
        id: true,
        title: true,
        difficulty: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  if (!exam) {
    notFound();
  }

  const availableProblems = problems.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty as "easy" | "medium" | "hard",
  }));

  const initialData = {
    id: exam.id,
    title: exam.title,
    accessCode: exam.accessCode,
    durationMinutes: exam.durationMinutes,
    startsAt: exam.startsAt.toISOString(),
    endsAt: exam.endsAt.toISOString(),
    isActive: exam.isActive,
    problems: exam.examProblems.map((ep) => ({
      problemId: ep.problemId,
      points: ep.points,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Exam</h1>
        <p className="text-muted-foreground">
          Update the exam configuration and problems.
        </p>
      </div>

      <ExamForm availableProblems={availableProblems} initialData={initialData} />
    </div>
  );
}
