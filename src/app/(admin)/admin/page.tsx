import { db } from "@/lib/db";

// Disable static prerendering - admin pages need runtime database access
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // Get counts for dashboard
  const [problemCount, examCount, sessionCount] = await Promise.all([
    db.problem.count(),
    db.exam.count(),
    db.examSession.count(),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Problems" count={problemCount} href="/admin/problems" />
        <DashboardCard title="Exams" count={examCount} href="/admin/exams" />
        <DashboardCard title="Sessions" count={sessionCount} href="/admin/results" />
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  count,
  href,
}: {
  title: string;
  count: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block p-6 bg-card rounded-lg border hover:shadow-md transition-shadow"
    >
      <h2 className="text-lg font-medium text-muted-foreground">{title}</h2>
      <p className="text-4xl font-bold mt-2">{count}</p>
    </a>
  );
}
