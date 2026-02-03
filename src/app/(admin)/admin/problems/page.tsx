import Link from "next/link";
import { db } from "@/lib/db";

export default async function ProblemsPage() {
  const problems = await db.problem.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      difficulty: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Problems</h1>
        <Link
          href="/admin/problems/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Problem
        </Link>
      </div>

      {problems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No problems yet. Create your first problem to get started.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Difficulty</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {problems.map((problem) => (
                <tr key={problem.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">{problem.title}</td>
                  <td className="px-4 py-3">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {problem.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/problems/${problem.id}`}
                      className="text-primary hover:underline"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const colors = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        colors[difficulty as keyof typeof colors] || colors.medium
      }`}
    >
      {difficulty}
    </span>
  );
}
