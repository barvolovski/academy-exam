"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getLeetCodeProblemBySlug, parseSlugFromUrl } from "./loader";
import type { MergedLeetCodeProblem } from "./types";

type ImportResult = { success: true; id: string } | { error: string };

function convertToDbFormat(problem: MergedLeetCodeProblem) {
  // Map difficulty
  const difficulty = problem.difficulty.toLowerCase() as "easy" | "medium" | "hard";

  // Map code snippets to our format
  const languageMap: Record<string, string> = {
    python3: "python",
    python: "python",
    java: "java",
    cpp: "cpp",
    "c++": "cpp",
    golang: "go",
    go: "go",
  };

  const starterCode: Record<string, string> = {
    python: "",
    java: "",
    cpp: "",
    go: "",
  };

  for (const [lang, code] of Object.entries(problem.code_snippets || {})) {
    const mappedLang = languageMap[lang.toLowerCase()];
    if (mappedLang && mappedLang in starterCode) {
      starterCode[mappedLang] = code;
    }
  }

  // Convert test cases
  const testCases = (problem.testCases || []).slice(0, 10).map((tc, index) => ({
    input: JSON.stringify(tc.args, null, 2),
    expected: JSON.stringify(tc.expected),
    hidden: index >= 3, // First 3 visible, rest hidden
  }));

  // If no test cases from dataset, try to parse from examples
  if (testCases.length === 0 && problem.examples?.length) {
    for (const example of problem.examples) {
      // Examples are in text format, we'll just add them as-is
      testCases.push({
        input: example.example_text,
        expected: "",
        hidden: false,
      });
    }
  }

  return {
    title: problem.title,
    description: problem.description,
    difficulty,
    starterCode,
    testCases: testCases.length > 0 ? testCases : [{ input: "", expected: "", hidden: false }],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
  };
}

export async function importLeetCodeProblem(slug: string): Promise<ImportResult> {
  const problem = await getLeetCodeProblemBySlug(slug);

  if (!problem) {
    return { error: "Problem not found" };
  }

  const data = convertToDbFormat(problem);

  try {
    const created = await db.problem.create({
      data,
    });

    revalidatePath("/admin/problems");
    return { success: true, id: created.id };
  } catch (error) {
    console.error("Failed to import problem:", error);
    return { error: "Failed to import problem" };
  }
}

export async function importLeetCodeProblemFromUrl(url: string): Promise<ImportResult> {
  const slug = parseSlugFromUrl(url);

  if (!slug) {
    return { error: "Invalid LeetCode URL" };
  }

  return importLeetCodeProblem(slug);
}
