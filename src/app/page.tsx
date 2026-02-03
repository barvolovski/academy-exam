import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight">
          Academy
        </h1>
        <p className="text-xl text-muted-foreground">
          Coding Assessment Platform for Technical Interviews
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link
            href="/exam"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Take Exam
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Admin Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
