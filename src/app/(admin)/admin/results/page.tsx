import Link from "next/link";
import { getExamResults, getExamsForFilter } from "@/lib/results/queries";
import { ResultsTable } from "@/components/admin";
import { ExamFilter } from "./exam-filter";
import { ExportButton } from "./export-button";

interface ResultsPageProps {
  searchParams: Promise<{ examId?: string }>;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const { examId } = await searchParams;

  const [results, exams] = await Promise.all([
    getExamResults(examId),
    getExamsForFilter(),
  ]);

  const selectedExam = examId
    ? exams.find((e) => e.id === examId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Results</h1>
          {selectedExam && (
            <p className="text-muted-foreground mt-1">
              Showing results for: {selectedExam.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ExamFilter exams={exams} selectedExamId={examId} />
          {examId && <ExportButton examId={examId} />}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {examId ? (
            <>
              No results found for this exam.{" "}
              <Link href="/admin/results" className="text-primary hover:underline">
                View all results
              </Link>
            </>
          ) : (
            "No exam results yet."
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <ResultsTable results={results} />
        </div>
      )}
    </div>
  );
}
