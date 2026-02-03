import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function ExamsPage() {
  const exams = await db.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { examProblems: true, sessions: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Exams</h1>
        <Link
          href="/admin/exams/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Exam
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No exams yet. Create your first exam to get started.
        </div>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-6 bg-card rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{exam.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Access Code:{" "}
                    <code className="bg-muted px-2 py-0.5 rounded">
                      {exam.accessCode}
                    </code>
                  </p>
                </div>
                <StatusBadge isActive={exam.isActive} />
              </div>

              <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
                <span>{exam._count.examProblems} problems</span>
                <span>{exam._count.sessions} candidates</span>
                <span>{exam.durationMinutes} minutes</span>
              </div>

              <div className="mt-2 text-sm text-muted-foreground">
                {formatDate(exam.startsAt)} - {formatDate(exam.endsAt)}
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/admin/exams/${exam.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/results?examId=${exam.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View Results
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
