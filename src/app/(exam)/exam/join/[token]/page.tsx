import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinExamPage({ params }: PageProps) {
  const { token } = await params;

  // Find session by token
  const session = await db.examSession.findFirst({
    where: { token },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
          durationMinutes: true,
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  // Check if exam is accessible
  const now = new Date();
  const exam = session.exam;

  if (!exam.isActive) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Exam Not Active
          </h1>
          <p className="text-muted-foreground">
            This exam is not currently active. Please contact your
            administrator.
          </p>
        </div>
      </main>
    );
  }

  if (now < exam.startsAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Exam Not Yet Started</h1>
          <p className="text-muted-foreground">
            This exam will start at{" "}
            {exam.startsAt.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Please return at the scheduled time.
          </p>
        </div>
      </main>
    );
  }

  if (now > exam.endsAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Exam Has Ended
          </h1>
          <p className="text-muted-foreground">
            This exam ended on{" "}
            {exam.endsAt.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </main>
    );
  }

  // Check if already submitted
  if (session.status === "submitted" || session.status === "timed_out") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Exam Already Completed</h1>
          <p className="text-muted-foreground">
            You have already submitted this exam.
          </p>
        </div>
      </main>
    );
  }

  // Redirect to exam session
  redirect(`/exam/${session.id}`);
}
