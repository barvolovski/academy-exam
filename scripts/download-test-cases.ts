import { writeFileSync } from "fs";
import * as path from "path";

const TEST_CASE_BASE_URL =
  "https://raw.githubusercontent.com/chrisxue815/leetcode_test_cases/master";

async function downloadTestCases() {
  const testCasesMap: Record<number, { test_cases: unknown[] }> = {};

  // Download test cases for problems 1-500 (most common ones)
  for (let i = 1; i <= 500; i++) {
    const paddedId = String(i).padStart(4, "0");
    const url = `${TEST_CASE_BASE_URL}/test_${paddedId}.json`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        testCasesMap[i] = data;
        console.log(`Downloaded test cases for problem ${i}`);
      }
    } catch {
      // Skip missing test cases
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const outputPath = path.join(process.cwd(), "data/leetcode/test-cases.json");
  writeFileSync(outputPath, JSON.stringify(testCasesMap, null, 2));
  console.log(`Saved ${Object.keys(testCasesMap).length} test case files`);
}

downloadTestCases();
