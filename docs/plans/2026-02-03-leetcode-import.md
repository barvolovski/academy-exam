# LeetCode Import Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to import LeetCode problems with full test cases from pre-scraped datasets instead of manually creating problems.

**Architecture:** Download two GitHub datasets (problems metadata + test cases), merge them by problem ID, store as static JSON in the project. Build an import UI with browse/search/URL tabs. On import, populate the existing problem form and save via existing server actions.

**Tech Stack:** Next.js 15 Server Components, TypeScript, existing UI components (Dialog, Tabs, Input, Table), Zod validation

---

## Task 1: Download and Setup LeetCode Datasets

**Files:**
- Create: `data/leetcode/problems.json`
- Create: `data/leetcode/test-cases.json`
- Create: `src/lib/leetcode/types.ts`

**Step 1: Download problems dataset**

```bash
curl -L "https://raw.githubusercontent.com/neenza/leetcode-problems/main/merged_problems.json" -o data/leetcode/problems.json
```

**Step 2: Download test cases dataset**

Create a script to fetch and merge test cases:

```bash
mkdir -p data/leetcode
```

**Step 3: Create TypeScript types**

Create `src/lib/leetcode/types.ts`:

```typescript
export interface LeetCodeProblem {
  problem_id: number;
  frontend_id: number;
  title: string;
  problem_slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  examples: {
    example_num: number;
    example_text: string;
    image_url?: string;
  }[];
  constraints: string[];
  hints: string[];
  topics: string[];
  code_snippets: Record<string, string>;
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
```

**Step 4: Commit**

```bash
git add data/leetcode src/lib/leetcode/types.ts
git commit -m "feat: add LeetCode datasets and types

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create LeetCode Data Loader

**Files:**
- Create: `src/lib/leetcode/loader.ts`

**Step 1: Create the loader module**

Create `src/lib/leetcode/loader.ts`:

```typescript
import { promises as fs } from "fs";
import path from "path";
import type { LeetCodeProblem, MergedLeetCodeProblem, LeetCodeTestCaseFile } from "./types";

let cachedProblems: MergedLeetCodeProblem[] | null = null;

export async function loadLeetCodeProblems(): Promise<MergedLeetCodeProblem[]> {
  if (cachedProblems) {
    return cachedProblems;
  }

  const problemsPath = path.join(process.cwd(), "data/leetcode/problems.json");
  const testCasesPath = path.join(process.cwd(), "data/leetcode/test-cases.json");

  const problemsData = await fs.readFile(problemsPath, "utf-8");
  const problems: LeetCodeProblem[] = JSON.parse(problemsData);

  let testCasesMap: Record<number, LeetCodeTestCaseFile> = {};
  try {
    const testCasesData = await fs.readFile(testCasesPath, "utf-8");
    testCasesMap = JSON.parse(testCasesData);
  } catch {
    // Test cases file may not exist yet
  }

  cachedProblems = problems.map((problem) => {
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
```

**Step 2: Commit**

```bash
git add src/lib/leetcode/loader.ts
git commit -m "feat: add LeetCode data loader with search and filtering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create Import Server Action

**Files:**
- Create: `src/lib/leetcode/actions.ts`

**Step 1: Create server action for importing**

Create `src/lib/leetcode/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getLeetCodeProblemBySlug, parseSlugFromUrl } from "./loader";
import type { MergedLeetCodeProblem } from "./types";

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

  const starterCode = {
    python: "",
    java: "",
    cpp: "",
    go: "",
  };

  for (const [lang, code] of Object.entries(problem.code_snippets || {})) {
    const mappedLang = languageMap[lang.toLowerCase()];
    if (mappedLang && mappedLang in starterCode) {
      starterCode[mappedLang as keyof typeof starterCode] = code;
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

export async function importLeetCodeProblem(slug: string) {
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

export async function importLeetCodeProblemFromUrl(url: string) {
  const slug = parseSlugFromUrl(url);

  if (!slug) {
    return { error: "Invalid LeetCode URL" };
  }

  return importLeetCodeProblem(slug);
}
```

**Step 2: Commit**

```bash
git add src/lib/leetcode/actions.ts
git commit -m "feat: add server action to import LeetCode problems

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create LeetCode Browser Component

**Files:**
- Create: `src/app/(admin)/admin/problems/import/_components/leetcode-browser.tsx`

**Step 1: Create the browser component**

Create `src/app/(admin)/admin/problems/import/_components/leetcode-browser.tsx`:

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { MergedLeetCodeProblem } from "@/lib/leetcode/types";
import { importLeetCodeProblem } from "@/lib/leetcode/actions";

interface LeetCodeBrowserProps {
  initialProblems: MergedLeetCodeProblem[];
}

export function LeetCodeBrowser({ initialProblems }: LeetCodeBrowserProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [importingSlug, setImportingSlug] = useState<string | null>(null);

  const filtered = initialProblems.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (difficulty !== "all" && p.difficulty !== difficulty) {
      return false;
    }
    return true;
  });

  const handleImport = async (slug: string) => {
    setImportingSlug(slug);
    startTransition(async () => {
      const result = await importLeetCodeProblem(slug);
      if (result.success) {
        router.push(`/admin/problems/${result.id}`);
      } else {
        alert(result.error);
      }
      setImportingSlug(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search problems..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[100px]">Difficulty</TableHead>
              <TableHead className="w-[100px]">Test Cases</TableHead>
              <TableHead className="w-[100px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 50).map((problem) => (
              <TableRow key={problem.problem_id}>
                <TableCell className="font-mono text-muted-foreground">
                  {problem.frontend_id}
                </TableCell>
                <TableCell className="font-medium">{problem.title}</TableCell>
                <TableCell>
                  <DifficultyBadge difficulty={problem.difficulty} />
                </TableCell>
                <TableCell>
                  {problem.hasTestCases ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    onClick={() => handleImport(problem.problem_slug)}
                    disabled={isPending && importingSlug === problem.problem_slug}
                  >
                    {isPending && importingSlug === problem.problem_slug
                      ? "Importing..."
                      : "Import"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 50 of {filtered.length} results. Use search to narrow down.
        </p>
      )}
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const variant = {
    Easy: "default" as const,
    Medium: "secondary" as const,
    Hard: "destructive" as const,
  }[difficulty] ?? "default" as const;

  return <Badge variant={variant}>{difficulty}</Badge>;
}
```

**Step 2: Commit**

```bash
git add src/app/\(admin\)/admin/problems/import/_components/leetcode-browser.tsx
git commit -m "feat: add LeetCode browser component with search and filters

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create URL Import Component

**Files:**
- Create: `src/app/(admin)/admin/problems/import/_components/url-import.tsx`

**Step 1: Create the URL import component**

Create `src/app/(admin)/admin/problems/import/_components/url-import.tsx`:

```typescript
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { importLeetCodeProblemFromUrl } from "@/lib/leetcode/actions";

export function UrlImport() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);
    startTransition(async () => {
      const result = await importLeetCodeProblemFromUrl(url);
      if (result.success) {
        router.push(`/admin/problems/${result.id}`);
      } else {
        setError(result.error ?? "Failed to import");
      }
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">LeetCode Problem URL</Label>
          <Input
            id="url"
            placeholder="https://leetcode.com/problems/two-sum/"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Paste a LeetCode problem URL to import it automatically
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button onClick={handleImport} disabled={isPending || !url.trim()}>
          {isPending ? "Importing..." : "Import Problem"}
        </Button>
      </div>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(admin\)/admin/problems/import/_components/url-import.tsx
git commit -m "feat: add URL import component for LeetCode problems

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create Import Page

**Files:**
- Create: `src/app/(admin)/admin/problems/import/page.tsx`

**Step 1: Create the import page**

Create `src/app/(admin)/admin/problems/import/page.tsx`:

```typescript
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { loadLeetCodeProblems } from "@/lib/leetcode/loader";
import { LeetCodeBrowser } from "./_components/leetcode-browser";
import { UrlImport } from "./_components/url-import";

export default async function ImportPage() {
  const problems = await loadLeetCodeProblems();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Import from LeetCode</h1>
          <p className="text-muted-foreground mt-1">
            Import problems from LeetCode with test cases
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/problems">Back to Problems</Link>
        </Button>
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse Catalog</TabsTrigger>
          <TabsTrigger value="url">Import by URL</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          <LeetCodeBrowser initialProblems={problems} />
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <UrlImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(admin\)/admin/problems/import/page.tsx
git commit -m "feat: add LeetCode import page with browse and URL tabs

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Add Import Button to Problems List

**Files:**
- Modify: `src/app/(admin)/admin/problems/page.tsx:19-24`

**Step 1: Update the problems page header**

In `src/app/(admin)/admin/problems/page.tsx`, replace the header section:

```typescript
<div className="flex justify-between items-center">
  <h1 className="text-3xl font-bold">Problems</h1>
  <div className="flex gap-2">
    <Link
      href="/admin/problems/import"
      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
    >
      Import from LeetCode
    </Link>
    <Link
      href="/admin/problems/new"
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Create Problem
    </Link>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add src/app/\(admin\)/admin/problems/page.tsx
git commit -m "feat: add Import from LeetCode button to problems list

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Download Test Cases Dataset

**Files:**
- Create: `scripts/download-test-cases.ts`
- Update: `data/leetcode/test-cases.json`

**Step 1: Create download script**

Create `scripts/download-test-cases.ts`:

```typescript
import { writeFileSync } from "fs";
import path from "path";

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
```

**Step 2: Add script to package.json**

Add to `package.json` scripts:

```json
"download:leetcode": "npx tsx scripts/download-test-cases.ts"
```

**Step 3: Run the script**

```bash
pnpm download:leetcode
```

**Step 4: Commit**

```bash
git add scripts/download-test-cases.ts package.json data/leetcode/test-cases.json
git commit -m "feat: add script to download LeetCode test cases

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Run Typecheck and Lint

**Step 1: Run typecheck**

```bash
pnpm typecheck
```

Expected: No errors

**Step 2: Run lint**

```bash
pnpm lint
```

Expected: No errors

**Step 3: Fix any issues if found**

---

## Summary

After completing all tasks, you will have:

1. **Data**: LeetCode problems JSON + test cases JSON in `data/leetcode/`
2. **Types**: TypeScript interfaces in `src/lib/leetcode/types.ts`
3. **Loader**: Data loading with caching in `src/lib/leetcode/loader.ts`
4. **Actions**: Server actions for importing in `src/lib/leetcode/actions.ts`
5. **UI**: Import page at `/admin/problems/import` with:
   - Browse tab with search/filter
   - URL import tab
6. **Integration**: "Import from LeetCode" button on problems list page
