/**
 * Judge0 API Client
 * Handles code execution requests
 *
 * MOCK MODE:
 * When JUDGE0_MOCK_MODE=true, this client returns simulated responses
 * instead of calling the actual Judge0 API. This is useful for:
 * - macOS development (Judge0 requires Linux cgroups)
 * - UI testing without Judge0 infrastructure
 * - Faster test iteration
 */

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
const MOCK_MODE = process.env.JUDGE0_MOCK_MODE === "true";

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
  if (MOCK_MODE) {
    return createSubmissionMock(request);
  }

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
  if (MOCK_MODE) {
    return getSubmissionMock(token);
  }

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
  if (MOCK_MODE) {
    return waitForResultMock(token);
  }

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
  if (MOCK_MODE) {
    return executeCodeMock(code, language, stdin, expectedOutput);
  }

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

// =============================================================================
// MOCK MODE IMPLEMENTATION
// =============================================================================

/**
 * Mock submission storage (in-memory for development)
 */
const mockSubmissions = new Map<
  string,
  {
    sourceCode: string;
    languageId: number;
    stdin?: string;
    expectedOutput?: string;
  }
>();

/**
 * Generate a mock token
 */
function generateMockToken(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Simulate code execution in mock mode
 * This provides basic pattern matching to simulate pass/fail scenarios
 */
function simulateExecution(
  sourceCode: string,
  _languageId: number,
  stdin?: string,
  expectedOutput?: string
): SubmissionResult {
  const token = generateMockToken();

  // Simulate compilation errors for obviously invalid code
  if (sourceCode.includes("syntax error") || sourceCode.includes("FORCE_COMPILE_ERROR")) {
    return {
      token,
      status: { id: 6, description: "Compilation Error" },
      stdout: null,
      stderr: null,
      compileOutput: "Mock compilation error: Invalid syntax",
      time: null,
      memory: null,
    };
  }

  // Simulate runtime errors
  if (sourceCode.includes("FORCE_RUNTIME_ERROR") || sourceCode.includes("raise Exception")) {
    return {
      token,
      status: { id: 11, description: "Runtime Error (NZEC)" },
      stdout: null,
      stderr: "Mock runtime error: Exception raised",
      compileOutput: null,
      time: "0.05",
      memory: 1024,
    };
  }

  // Simulate timeout
  if (sourceCode.includes("FORCE_TIMEOUT") || sourceCode.includes("while True")) {
    return {
      token,
      status: { id: 5, description: "Time Limit Exceeded" },
      stdout: null,
      stderr: null,
      compileOutput: null,
      time: "2.0",
      memory: 2048,
    };
  }

  // Try to extract expected output from code comments or simple print patterns
  let simulatedOutput = "";

  // Look for print statements (Python)
  const pythonPrintMatch = sourceCode.match(/print\s*\(\s*["']([^"']+)["']\s*\)/);
  if (pythonPrintMatch) {
    simulatedOutput = pythonPrintMatch[1];
  }

  // Look for System.out.println (Java)
  const javaPrintMatch = sourceCode.match(/System\.out\.println\s*\(\s*["']([^"']+)["']\s*\)/);
  if (javaPrintMatch) {
    simulatedOutput = javaPrintMatch[1];
  }

  // Look for cout (C++)
  const cppPrintMatch = sourceCode.match(/cout\s*<<\s*["']([^"']+)["']/);
  if (cppPrintMatch) {
    simulatedOutput = cppPrintMatch[1];
  }

  // Look for fmt.Println (Go)
  const goPrintMatch = sourceCode.match(/fmt\.Println\s*\(\s*["']([^"']+)["']\s*\)/);
  if (goPrintMatch) {
    simulatedOutput = goPrintMatch[1];
  }

  // Check if code contains MOCK_OUTPUT directive for explicit output
  const mockOutputMatch = sourceCode.match(/MOCK_OUTPUT:\s*(.+?)(?:\n|$)/);
  if (mockOutputMatch) {
    simulatedOutput = mockOutputMatch[1].trim();
  }

  // If input is provided, echo it for simple cases
  if (stdin && sourceCode.includes("input()")) {
    simulatedOutput = stdin.trim().split("\n")[0];
  }

  // Determine if output matches expected
  const outputMatches =
    expectedOutput !== undefined
      ? simulatedOutput.trim() === expectedOutput.trim()
      : true;

  const statusId = outputMatches ? 3 : 4; // 3 = Accepted, 4 = Wrong Answer

  return {
    token,
    status: {
      id: statusId,
      description: outputMatches ? "Accepted" : "Wrong Answer",
    },
    stdout: simulatedOutput + "\n",
    stderr: null,
    compileOutput: null,
    time: (0.01 + Math.random() * 0.1).toFixed(3),
    memory: Math.floor(1000 + Math.random() * 5000),
  };
}

/**
 * Mock implementation of createSubmission
 */
async function createSubmissionMock(
  request: SubmissionRequest
): Promise<{ token: string }> {
  const token = generateMockToken();

  mockSubmissions.set(token, {
    sourceCode: request.sourceCode,
    languageId: request.languageId,
    stdin: request.stdin,
    expectedOutput: request.expectedOutput,
  });

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));

  return { token };
}

/**
 * Mock implementation of getSubmission
 */
async function getSubmissionMock(token: string): Promise<SubmissionResult> {
  const submission = mockSubmissions.get(token);

  if (!submission) {
    // If no submission found, return a generic result
    return {
      token,
      status: { id: 3, description: "Accepted" },
      stdout: "Mock output\n",
      stderr: null,
      compileOutput: null,
      time: "0.05",
      memory: 2048,
    };
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

  const result = simulateExecution(
    submission.sourceCode,
    submission.languageId,
    submission.stdin,
    submission.expectedOutput
  );

  // Clean up
  mockSubmissions.delete(token);

  return { ...result, token };
}

/**
 * Mock implementation of waitForResult
 */
async function waitForResultMock(token: string): Promise<SubmissionResult> {
  // In mock mode, we can return immediately since there's no actual processing
  return getSubmissionMock(token);
}

/**
 * Mock implementation of executeCode
 */
async function executeCodeMock(
  code: string,
  language: Language,
  stdin?: string,
  expectedOutput?: string
): Promise<SubmissionResult> {
  // Log mock mode usage in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Judge0 Mock] Executing code in mock mode");
  }

  // Simulate submission + processing delay
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  return simulateExecution(code, LANGUAGE_IDS[language], stdin, expectedOutput);
}
