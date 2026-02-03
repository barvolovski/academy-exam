/**
 * Judge0 API Client
 * Handles code execution requests
 */

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

// Language IDs for Judge0
export const LANGUAGE_IDS = {
  python: 71,   // Python 3.8.1
  java: 62,     // Java 13.0.1
  cpp: 54,      // C++ 9.2.0
  go: 60,       // Go 1.13.5
} as const;

export type Language = keyof typeof LANGUAGE_IDS;

export interface SubmissionRequest {
  sourceCode: string;
  languageId: number;
  stdin?: string;
  expectedOutput?: string;
  cpuTimeLimit?: number;  // seconds
  memoryLimit?: number;   // KB
}

export interface SubmissionResult {
  token: string;
  status: {
    id: number;
    description: string;
  };
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  time: string | null;  // seconds
  memory: number | null; // KB
}

/**
 * Create a code submission
 */
export async function createSubmission(
  request: SubmissionRequest
): Promise<{ token: string }> {
  const response = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_code: btoa(request.sourceCode),
        language_id: request.languageId,
        stdin: request.stdin ? btoa(request.stdin) : undefined,
        expected_output: request.expectedOutput
          ? btoa(request.expectedOutput)
          : undefined,
        cpu_time_limit: request.cpuTimeLimit || 2,
        memory_limit: request.memoryLimit || 262144,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Judge0 submission failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get submission result by token
 */
export async function getSubmission(token: string): Promise<SubmissionResult> {
  const response = await fetch(
    `${JUDGE0_URL}/submissions/${token}?base64_encoded=true`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Judge0 get submission failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    token: data.token,
    status: data.status,
    stdout: data.stdout ? atob(data.stdout) : null,
    stderr: data.stderr ? atob(data.stderr) : null,
    compileOutput: data.compile_output ? atob(data.compile_output) : null,
    time: data.time,
    memory: data.memory,
  };
}

/**
 * Poll for submission result until complete
 */
export async function waitForResult(
  token: string,
  maxAttempts = 20,
  intervalMs = 500
): Promise<SubmissionResult> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await getSubmission(token);

    // Status 1 = In Queue, 2 = Processing
    if (result.status.id > 2) {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Submission timed out waiting for result");
}

/**
 * Execute code and wait for result
 */
export async function executeCode(
  code: string,
  language: Language,
  stdin?: string,
  expectedOutput?: string
): Promise<SubmissionResult> {
  const { token } = await createSubmission({
    sourceCode: code,
    languageId: LANGUAGE_IDS[language],
    stdin,
    expectedOutput,
  });

  return waitForResult(token);
}

/**
 * Check if status indicates success
 */
export function isAccepted(statusId: number): boolean {
  return statusId === 3; // Accepted
}

/**
 * Get human-readable status description
 */
export function getStatusDescription(statusId: number): string {
  const statuses: Record<number, string> = {
    1: "In Queue",
    2: "Processing",
    3: "Accepted",
    4: "Wrong Answer",
    5: "Time Limit Exceeded",
    6: "Compilation Error",
    7: "Runtime Error (SIGSEGV)",
    8: "Runtime Error (SIGXFSZ)",
    9: "Runtime Error (SIGFPE)",
    10: "Runtime Error (SIGABRT)",
    11: "Runtime Error (NZEC)",
    12: "Runtime Error (Other)",
    13: "Internal Error",
    14: "Exec Format Error",
  };
  return statuses[statusId] || "Unknown";
}
