export interface LeetCodeProblem {
  problem_id: string;
  frontend_id: string;
  title: string;
  problem_slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: {
    example_num: number;
    example_text: string;
    images: string[];
  }[];
  constraints: string[];
  hints: string[];
  topics: string[];
  code_snippets: Record<string, string>;
  follow_ups?: string[];
  solution?: string;
}

export interface LeetCodeProblemsFile {
  questions: LeetCodeProblem[];
}

export interface LeetCodeTestCase {
  args: Record<string, unknown>;
  expected: unknown;
}

export interface LeetCodeTestCaseFile {
  test_cases: LeetCodeTestCase[];
}

export interface MergedLeetCodeProblem extends LeetCodeProblem {
  testCases?: LeetCodeTestCase[];
  hasTestCases: boolean;
}
