"use client";

export interface Problem {
  id: string;
  title: string;
  points: number;
}

export type SubmissionStatus = "passed" | "failed" | "pending";

export interface ProblemSidebarProps {
  problems: Problem[];
  currentProblemId: string;
  onSelectProblem: (id: string) => void;
  submissions: Record<string, SubmissionStatus>;
}

function StatusIcon({ status }: { status: SubmissionStatus }) {
  switch (status) {
    case "passed":
      return (
        <span className="text-green-600 font-bold" aria-label="Passed">
          ✓
        </span>
      );
    case "failed":
      return (
        <span className="text-red-600 font-bold" aria-label="Failed">
          ✗
        </span>
      );
    case "pending":
    default:
      return (
        <span className="text-gray-400" aria-label="Pending">
          ○
        </span>
      );
  }
}

export function ProblemSidebar({
  problems,
  currentProblemId,
  onSelectProblem,
  submissions,
}: ProblemSidebarProps) {
  return (
    <nav className="w-48 border-r bg-muted/30 p-4">
      <h2 className="text-sm font-semibold text-muted-foreground mb-3">
        Problems
      </h2>
      <ul className="space-y-1">
        {problems.map((problem, index) => {
          const status = submissions[problem.id] || "pending";
          const isActive = problem.id === currentProblemId;

          return (
            <li key={problem.id}>
              <button
                onClick={() => onSelectProblem(problem.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <StatusIcon status={status} />
                <span className="flex-1 truncate">
                  P{index + 1}. {problem.title}
                </span>
                <span
                  className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {problem.points}pts
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
