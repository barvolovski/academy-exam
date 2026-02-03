import { db } from "@/lib/db";
import { ExamForm } from "../_components/exam-form";

export default async function NewExamPage() {
  const problems = await db.problem.findMany({
    select: {
      id: true,
      title: true,
      difficulty: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const availableProblems = problems.map((p) => ({
    id: p.id,
    title: p.title,
    difficulty: p.difficulty as "easy" | "medium" | "hard",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Exam</h1>
        <p className="text-muted-foreground">
          Configure the exam details and select problems.
        </p>
      </div>

      <ExamForm availableProblems={availableProblems} />
    </div>
  );
}
