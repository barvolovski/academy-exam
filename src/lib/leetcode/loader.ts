import { promises as fs } from "fs";
import path from "path";
import type {
  LeetCodeProblemsFile,
  LeetCodeTestCaseFile,
  MergedLeetCodeProblem,
} from "./types";

let cachedProblems: MergedLeetCodeProblem[] | null = null;

export async function loadLeetCodeProblems(): Promise<MergedLeetCodeProblem[]> {
  if (cachedProblems) {
    return cachedProblems;
  }

  const problemsPath = path.join(process.cwd(), "data/leetcode/problems.json");
  const testCasesPath = path.join(process.cwd(), "data/leetcode/test-cases.json");

  const problemsData = await fs.readFile(problemsPath, "utf-8");
  const problemsFile: LeetCodeProblemsFile = JSON.parse(problemsData);
  const problems = problemsFile.questions;

  let testCasesMap: Record<string, LeetCodeTestCaseFile> = {};
  try {
    const testCasesData = await fs.readFile(testCasesPath, "utf-8");
    testCasesMap = JSON.parse(testCasesData);
  } catch {
    // Test cases file may not exist yet
  }

  cachedProblems = problems.map((problem) => {
    // problem_id is a string, so use it directly as the key
    const testCaseFile = testCasesMap[problem.problem_id];
    return {
      ...problem,
      testCases: testCaseFile?.test_cases,
      hasTestCases: !!testCaseFile?.test_cases?.length,
    };
  });

  return cachedProblems;
}

export async function getLeetCodeProblemBySlug(
  slug: string
): Promise<MergedLeetCodeProblem | null> {
  const problems = await loadLeetCodeProblems();
  return problems.find((p) => p.problem_slug === slug) ?? null;
}

export async function searchLeetCodeProblems(
  query: string,
  filters?: {
    difficulty?: "Easy" | "Medium" | "Hard";
    topics?: string[];
    hasTestCases?: boolean;
  }
): Promise<MergedLeetCodeProblem[]> {
  const problems = await loadLeetCodeProblems();
  const lowerQuery = query.toLowerCase();

  return problems.filter((p) => {
    // Text search
    if (query && !p.title.toLowerCase().includes(lowerQuery)) {
      return false;
    }

    // Difficulty filter
    if (filters?.difficulty && p.difficulty !== filters.difficulty) {
      return false;
    }

    // Topics filter
    if (filters?.topics?.length) {
      const hasMatchingTopic = filters.topics.some((t) =>
        p.topics.some((pt) => pt.toLowerCase().includes(t.toLowerCase()))
      );
      if (!hasMatchingTopic) return false;
    }

    // Has test cases filter
    if (filters?.hasTestCases !== undefined && p.hasTestCases !== filters.hasTestCases) {
      return false;
    }

    return true;
  });
}

export function parseSlugFromUrl(url: string): string | null {
  // Handles: leetcode.com/problems/two-sum/ or leetcode.com/problems/two-sum
  const match = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  return match?.[1]?.toLowerCase() ?? null;
}

/**
 * Clear the cached problems - useful for testing or when data files are updated
 */
export function clearProblemsCache(): void {
  cachedProblems = null;
}
