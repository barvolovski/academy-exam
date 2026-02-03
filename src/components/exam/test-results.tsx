"use client";

export interface TestResult {
  testCase: number;
  passed: boolean;
  output: string;
  expected: string;
  error?: string | null;
}

export interface TestResultsProps {
  results: TestResult[];
  loading: boolean;
}

export function TestResults({ results, loading }: TestResultsProps) {
  if (loading) {
    return (
      <div className="border rounded-md p-4 bg-muted/30">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          <span>Running tests...</span>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="border rounded-md p-4 bg-muted/30 text-muted-foreground text-sm">
        Click &quot;Run Code&quot; to test your solution against sample test
        cases.
      </div>
    );
  }

  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
        <h3 className="font-medium text-sm">Test Results</h3>
        <span
          className={`text-sm ${passedCount === results.length ? "text-green-600" : "text-muted-foreground"}`}
        >
          {passedCount}/{results.length} passed
        </span>
      </div>
      <div className="divide-y max-h-64 overflow-y-auto">
        {results.map((result) => (
          <div
            key={result.testCase}
            className={`p-3 ${result.passed ? "bg-green-50" : "bg-red-50"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-medium ${result.passed ? "text-green-700" : "text-red-700"}`}
              >
                {result.passed ? "✓" : "✗"} Test {result.testCase}
              </span>
            </div>

            {!result.passed && (
              <div className="text-sm space-y-1 mt-2">
                {result.error ? (
                  <div className="font-mono text-xs bg-red-100 p-2 rounded text-red-800 whitespace-pre-wrap">
                    {result.error}
                  </div>
                ) : (
                  <>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Expected:</span>{" "}
                      <code className="bg-muted px-1 rounded">
                        {result.expected}
                      </code>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="font-medium">Got:</span>{" "}
                      <code className="bg-muted px-1 rounded">
                        {result.output || "(empty)"}
                      </code>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
