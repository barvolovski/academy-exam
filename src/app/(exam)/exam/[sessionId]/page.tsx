"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { CodeEditor, type SupportedLanguage } from "@/components/editor/code-editor";
import { useProctoring } from "@/hooks/use-proctoring";
import {
  ExamTimer,
  ProblemSidebar,
  TestResults,
  type Problem,
  type SubmissionStatus,
  type TestResult,
} from "@/components/exam";

interface ExamData {
  sessionId: string;
  exam: {
    title: string;
    durationMinutes: number;
    endsAt: string;
  };
  problems: Array<{
    id: string;
    title: string;
    description: string;
    starterCode: Record<string, string>;
    points: number;
  }>;
}

const STORAGE_KEY_PREFIX = "exam_code_";

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // Track proctoring events (tab switches, copy/paste, focus lost)
  useProctoring(sessionId);

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [currentProblemId, setCurrentProblemId] = useState<string>("");
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [codeByProblem, setCodeByProblem] = useState<Record<string, string>>({});
  const [submissions, setSubmissions] = useState<Record<string, SubmissionStatus>>({});
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load exam data from localStorage (set by exam entry page)
  useEffect(() => {
    const storedData = localStorage.getItem(`exam_session_${sessionId}`);
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as ExamData;
        setExamData(data);
        if (data.problems.length > 0) {
          setCurrentProblemId(data.problems[0].id);
          // Initialize code for each problem from starter code
          const initialCode: Record<string, string> = {};
          data.problems.forEach((problem) => {
            const savedCode = localStorage.getItem(
              `${STORAGE_KEY_PREFIX}${sessionId}_${problem.id}`
            );
            initialCode[problem.id] =
              savedCode || problem.starterCode?.[language] || "";
          });
          setCodeByProblem(initialCode);
        }
      } catch {
        setError("Failed to load exam data");
      }
    } else {
      setError("Exam session not found. Please start the exam again.");
    }
    setLoading(false);
  }, [sessionId, language]);

  // Save code to localStorage whenever it changes
  const saveCode = useCallback(
    (problemId: string, code: string) => {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${sessionId}_${problemId}`, code);
    },
    [sessionId]
  );

  const handleCodeChange = useCallback(
    (value: string) => {
      setCodeByProblem((prev) => ({ ...prev, [currentProblemId]: value }));
      saveCode(currentProblemId, value);
    },
    [currentProblemId, saveCode]
  );

  const handleProblemSelect = useCallback((problemId: string) => {
    setCurrentProblemId(problemId);
    setTestResults([]); // Clear test results when switching problems
  }, []);

  const handleTimeUp = useCallback(() => {
    alert("Time is up! Your exam will be submitted automatically.");
    router.push("/exam/completed");
  }, [router]);

  const handleRunCode = async () => {
    if (!currentProblemId || running) return;

    setRunning(true);
    setTestResults([]);
    setError(null);

    try {
      const response = await fetch("/api/exam/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          problemId: currentProblemId,
          language,
          code: codeByProblem[currentProblemId] || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to run code");
      }

      setTestResults(data.results || []);

      // Update submission status based on results
      const allPassed = data.results?.every((r: TestResult) => r.passed) ?? false;
      setSubmissions((prev) => ({
        ...prev,
        [currentProblemId]: allPassed ? "passed" : "failed",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run code");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitProblem = async () => {
    if (!currentProblemId || submitting) return;

    const confirmSubmit = confirm(
      "Are you sure you want to submit this problem? This will mark your solution as final."
    );
    if (!confirmSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          problemId: currentProblemId,
          language,
          code: codeByProblem[currentProblemId] || "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to submit");
      }

      // Mark as submitted
      setSubmissions((prev) => ({
        ...prev,
        [currentProblemId]: data.allPassed ? "passed" : "failed",
      }));

      alert(
        data.allPassed
          ? "Problem submitted successfully! All tests passed."
          : `Problem submitted. ${data.passedCount}/${data.totalCount} tests passed.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAll = async () => {
    const confirmSubmit = confirm(
      "Are you sure you want to submit all problems and end the exam?"
    );
    if (!confirmSubmit) return;

    // For now, redirect to completed page
    router.push("/exam/completed");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading exam...</div>
      </div>
    );
  }

  if (error || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error || "Exam not found"}</p>
          <button
            onClick={() => router.push("/exam")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Return to Exam Entry
          </button>
        </div>
      </div>
    );
  }

  const currentProblem = examData.problems.find((p) => p.id === currentProblemId);
  const problemIndex = examData.problems.findIndex((p) => p.id === currentProblemId);
  const currentCode = codeByProblem[currentProblemId] || "";

  const sidebarProblems: Problem[] = examData.problems.map((p) => ({
    id: p.id,
    title: p.title,
    points: p.points,
  }));

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ExamTimer endsAt={new Date(examData.exam.endsAt)} onTimeUp={handleTimeUp} />
          <span className="text-sm text-muted-foreground">
            Problem {problemIndex + 1}/{examData.problems.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{examData.exam.title}</span>
          <button
            onClick={handleSubmitAll}
            className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Submit All
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Problem sidebar */}
        <ProblemSidebar
          problems={sidebarProblems}
          currentProblemId={currentProblemId}
          onSelectProblem={handleProblemSelect}
          submissions={submissions}
        />

        {/* Problem content and editor */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentProblem && (
            <>
              {/* Problem description */}
              <div className="p-4 border-b overflow-y-auto max-h-48">
                <h2 className="text-xl font-semibold mb-2">
                  {currentProblem.title}
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({currentProblem.points} points)
                  </span>
                </h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {currentProblem.description}
                </div>
              </div>

              {/* Code editor area */}
              <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                {/* Editor toolbar */}
                <div className="flex items-center justify-between">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
                    className="px-3 py-1 border rounded-md bg-background text-sm"
                  >
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRunCode}
                      disabled={running}
                      className="px-4 py-1 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50"
                    >
                      {running ? "Running..." : "Run Code"}
                    </button>
                    <button
                      onClick={handleSubmitProblem}
                      disabled={submitting}
                      className="px-4 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Problem"}
                    </button>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 min-h-0 border rounded-md overflow-hidden">
                  <CodeEditor
                    value={currentCode}
                    onChange={handleCodeChange}
                    language={language}
                    height="100%"
                  />
                </div>

                {/* Test results */}
                <div className="max-h-64 overflow-y-auto">
                  {error && (
                    <div className="p-3 mb-2 bg-destructive/10 text-destructive rounded-md text-sm">
                      {error}
                    </div>
                  )}
                  <TestResults results={testResults} loading={running} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
