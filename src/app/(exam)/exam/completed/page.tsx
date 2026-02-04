"use client";

import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function ExamCompletedPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold">Exam Completed</h1>
        <p className="text-muted-foreground">
          Your exam has been submitted successfully. Thank you for completing the assessment.
        </p>
        <p className="text-sm text-muted-foreground">
          You may now close this window or return to the home page.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Return to Home
        </button>
      </div>
    </main>
  );
}
