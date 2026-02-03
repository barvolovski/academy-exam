# Bulk Candidate Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow admins to upload a CSV file to bulk import candidates and generate direct access links.

**Architecture:** Add `token` field to ExamSession for direct access. Create CSV upload component that posts to API route. API parses CSV, validates rows, creates sessions in transaction. Direct join page looks up session by token and redirects to exam.

**Tech Stack:** Next.js 15 App Router, Prisma, Zod validation, shadcn/ui components

---

## Task 1: Update Database Schema

**Files:**
- Modify: `prisma/schema.prisma:116-135`

**Step 1: Add token field to ExamSession model**

In `prisma/schema.prisma`, update the ExamSession model to add:

```prisma
model ExamSession {
  id             String        @id @default(uuid())
  examId         String        @map("exam_id")
  candidateName  String        @db.VarChar(255) @map("candidate_name")
  candidateEmail String        @db.VarChar(255) @map("candidate_email")
  token          String?       @unique @db.VarChar(32)  // Direct access token
  importedAt     DateTime?     @map("imported_at")      // When bulk imported
  startedAt      DateTime      @default(now()) @map("started_at")
  submittedAt    DateTime?     @map("submitted_at")
  totalScore     Int?          @map("total_score")
  status         SessionStatus @default(in_progress)
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")

  exam           Exam          @relation(fields: [examId], references: [id])
  submissions    Submission[]
  proctorEvents  ProctorEvent[]
  aiMessages     AIMessage[]

  @@unique([examId, candidateEmail])
  @@map("exam_sessions")
}
```

**Step 2: Push schema to database**

Run: `pnpm db:push`
Expected: Schema updates applied successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add token and importedAt fields to ExamSession for bulk import"
```

---

## Task 2: Create CSV Parsing Utility

**Files:**
- Create: `src/lib/csv.ts`

**Step 1: Create CSV utility file**

```typescript
/**
 * Parse CSV content into array of objects
 * Handles quoted fields, commas in values, and various line endings
 */
export function parseCSV<T extends Record<string, string>>(
  content: string,
  requiredHeaders: string[]
): { data: T[]; errors: string[] } {
  const errors: string[] = [];
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return { data: [], errors: ["CSV file is empty"] };
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  // Validate required headers
  for (const required of requiredHeaders) {
    if (!headers.includes(required.toLowerCase())) {
      errors.push(`Missing required header: ${required}`);
    }
  }

  if (errors.length > 0) {
    return { data: [], errors };
  }

  // Parse data rows
  const data: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) {
      errors.push(`Row ${i + 1}: column count mismatch`);
      continue;
    }

    const row = {} as T;
    for (let j = 0; j < headers.length; j++) {
      (row as Record<string, string>)[headers[j]] = values[j].trim();
    }
    data.push(row);
  }

  return { data, errors };
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);

  return result;
}

/**
 * Escape a value for CSV output
 */
export function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate a secure random token for direct access links
 */
export function generateToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  const randomValues = new Uint8Array(24);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 24; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  return token;
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors related to csv.ts

**Step 3: Commit**

```bash
git add src/lib/csv.ts
git commit -m "feat: add CSV parsing utility with token generation"
```

---

## Task 3: Create Candidate Import Schemas

**Files:**
- Create: `src/lib/candidates/schemas.ts`

**Step 1: Create validation schemas**

```typescript
import { z } from "zod";

export const candidateRowSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or less"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must be 255 characters or less"),
});

export type CandidateRow = z.infer<typeof candidateRowSchema>;

export interface ImportResult {
  success: boolean;
  imported: {
    name: string;
    email: string;
    token: string;
    link: string;
  }[];
  failed: {
    row: number;
    name: string;
    email: string;
    error: string;
  }[];
  summary: {
    total: number;
    imported: number;
    failed: number;
  };
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/candidates/schemas.ts
git commit -m "feat: add candidate import validation schemas"
```

---

## Task 4: Create Import API Route

**Files:**
- Create: `src/app/api/admin/exams/[id]/import/route.ts`

**Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCSV, generateToken } from "@/lib/csv";
import { candidateRowSchema, type ImportResult } from "@/lib/candidates/schemas";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await params;

    // Verify exam exists
    const exam = await db.exam.findUnique({
      where: { id: examId },
      select: { id: true, title: true },
    });

    if (!exam) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Exam not found" } },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: "NO_FILE", message: "No file provided" } },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: "FILE_TOO_LARGE", message: "File exceeds 1MB limit" } },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: { code: "INVALID_TYPE", message: "File must be a CSV" } },
        { status: 400 }
      );
    }

    // Parse CSV content
    const content = await file.text();
    const { data, errors: parseErrors } = parseCSV<{ name: string; email: string }>(
      content,
      ["name", "email"]
    );

    if (parseErrors.length > 0) {
      return NextResponse.json(
        { error: { code: "PARSE_ERROR", message: parseErrors.join(", ") } },
        { status: 400 }
      );
    }

    if (data.length === 0) {
      return NextResponse.json(
        { error: { code: "EMPTY_FILE", message: "No data rows found in CSV" } },
        { status: 400 }
      );
    }

    // Get existing sessions for this exam
    const existingSessions = await db.examSession.findMany({
      where: { examId },
      select: { candidateEmail: true },
    });
    const existingEmails = new Set(
      existingSessions.map((s) => s.candidateEmail.toLowerCase())
    );

    // Process rows
    const result: ImportResult = {
      success: true,
      imported: [],
      failed: [],
      summary: { total: data.length, imported: 0, failed: 0 },
    };

    const seenEmails = new Set<string>();
    const validCandidates: { name: string; email: string; token: string }[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 for 1-indexed and header row

      // Validate row
      const validation = candidateRowSchema.safeParse(row);
      if (!validation.success) {
        result.failed.push({
          row: rowNum,
          name: row.name || "",
          email: row.email || "",
          error: validation.error.errors[0].message,
        });
        continue;
      }

      const email = validation.data.email.toLowerCase();

      // Check for duplicate in file
      if (seenEmails.has(email)) {
        result.failed.push({
          row: rowNum,
          name: validation.data.name,
          email: validation.data.email,
          error: "Duplicate email in file",
        });
        continue;
      }

      // Check for existing session
      if (existingEmails.has(email)) {
        result.failed.push({
          row: rowNum,
          name: validation.data.name,
          email: validation.data.email,
          error: "Candidate already registered for this exam",
        });
        continue;
      }

      seenEmails.add(email);
      validCandidates.push({
        name: validation.data.name,
        email: validation.data.email,
        token: generateToken(),
      });
    }

    if (validCandidates.length === 0) {
      return NextResponse.json(
        { error: { code: "NO_VALID_ROWS", message: "No valid candidates to import" } },
        { status: 400 }
      );
    }

    // Create sessions in transaction
    const now = new Date();
    await db.examSession.createMany({
      data: validCandidates.map((c) => ({
        examId,
        candidateName: c.name,
        candidateEmail: c.email,
        token: c.token,
        importedAt: now,
      })),
    });

    // Build result
    result.imported = validCandidates.map((c) => ({
      name: c.name,
      email: c.email,
      token: c.token,
      link: `/exam/join/${c.token}`,
    }));
    result.summary.imported = validCandidates.length;
    result.summary.failed = result.failed.length;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/admin/exams/\[id\]/import/route.ts
git commit -m "feat: add CSV import API route for bulk candidate import"
```

---

## Task 5: Create Direct Join Page

**Files:**
- Create: `src/app/(exam)/exam/join/[token]/page.tsx`

**Step 1: Create the join page**

```typescript
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinExamPage({ params }: PageProps) {
  const { token } = await params;

  // Find session by token
  const session = await db.examSession.findUnique({
    where: { token },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          isActive: true,
          startsAt: true,
          endsAt: true,
          durationMinutes: true,
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  // Check if exam is accessible
  const now = new Date();
  const exam = session.exam;

  if (!exam.isActive) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Exam Not Active</h1>
          <p className="text-muted-foreground">
            This exam is not currently active. Please contact your administrator.
          </p>
        </div>
      </main>
    );
  }

  if (now < exam.startsAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Exam Not Yet Started</h1>
          <p className="text-muted-foreground">
            This exam will start at{" "}
            {exam.startsAt.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            Please return at the scheduled time.
          </p>
        </div>
      </main>
    );
  }

  if (now > exam.endsAt) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Exam Has Ended</h1>
          <p className="text-muted-foreground">
            This exam ended on{" "}
            {exam.endsAt.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </main>
    );
  }

  // Check if already submitted
  if (session.status === "submitted" || session.status === "timed_out") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Exam Already Completed</h1>
          <p className="text-muted-foreground">
            You have already submitted this exam.
          </p>
        </div>
      </main>
    );
  }

  // Redirect to exam session
  redirect(`/exam/${session.id}`);
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/\(exam\)/exam/join/\[token\]/page.tsx
git commit -m "feat: add direct join page for imported candidates"
```

---

## Task 6: Create CSV Upload Component

**Files:**
- Create: `src/components/admin/csv-upload.tsx`

**Step 1: Create the upload component**

```typescript
"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ImportResult } from "@/lib/candidates/schemas";

interface CSVUploadProps {
  examId: string;
  baseUrl: string;
}

export function CSVUpload({ examId, baseUrl }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    } else {
      setError("Please drop a CSV file");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/exams/${examId}/import`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Import failed");
      }

      setResult(data as ImportResult);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = async (index: number, token: string) => {
    const link = `${baseUrl}/exam/join/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadLinks = () => {
    if (!result) return;

    const headers = ["Name", "Email", "Link"];
    const rows = result.imported.map((c) => [
      c.name,
      c.email,
      `${baseUrl}/exam/join/${c.token}`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidate-links-${examId}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!result && (
        <Card
          className={`p-8 border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                {file ? file.name : "Drop CSV file here"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" asChild>
                <span>Select File</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">
              Format: name,email (max 1MB)
            </p>
          </div>
        </Card>
      )}

      {/* Selected File */}
      {file && !result && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-lg font-medium">Import Complete</p>
                <p className="text-sm text-muted-foreground">
                  {result.summary.imported} imported, {result.summary.failed} failed
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadLinks}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Links
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Import More
                </Button>
              </div>
            </div>
          </Card>

          {/* Imported Candidates */}
          {result.imported.length > 0 && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">
                Imported Candidates ({result.imported.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.imported.map((candidate, index) => (
                  <div
                    key={candidate.token}
                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {candidate.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(index, candidate.token)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedIndex === index ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Failed Rows */}
          {result.failed.length > 0 && (
            <Card className="p-4 border-destructive/50">
              <h3 className="font-medium mb-3 text-destructive">
                Failed Rows ({result.failed.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.failed.map((failure, index) => (
                  <div
                    key={index}
                    className="py-2 px-3 bg-destructive/5 rounded-md"
                  >
                    <p className="text-sm">
                      <span className="font-medium">Row {failure.row}:</span>{" "}
                      {failure.name || "(empty)"} - {failure.email || "(empty)"}
                    </p>
                    <p className="text-sm text-destructive">{failure.error}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/admin/csv-upload.tsx
git commit -m "feat: add CSV upload component with drag-drop and results display"
```

---

## Task 7: Create Import Page

**Files:**
- Create: `src/app/(admin)/admin/exams/[id]/import/page.tsx`

**Step 1: Create the import page**

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CSVUpload } from "@/components/admin/csv-upload";
import { headers } from "next/headers";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ImportCandidatesPage({ params }: PageProps) {
  const { id } = await params;

  const exam = await db.exam.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      accessCode: true,
    },
  });

  if (!exam) {
    notFound();
  }

  // Get base URL from headers
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/exams/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Import Candidates</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CSVUpload examId={exam.id} baseUrl={baseUrl} />
      </div>

      <div className="max-w-2xl">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">CSV Format</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Your CSV file should have the following columns:
          </p>
          <pre className="text-sm bg-background p-3 rounded border">
            name,email{"\n"}
            John Doe,john@example.com{"\n"}
            Jane Smith,jane@example.com
          </pre>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/exams/\[id\]/import/page.tsx
git commit -m "feat: add import candidates page"
```

---

## Task 8: Add Import Button to Exam Form

**Files:**
- Modify: `src/app/(admin)/admin/exams/_components/exam-form.tsx`

**Step 1: Add import button after access code section**

Find the access code Card section (around line 98-124) and add the Import Candidates button. Add `Upload` to the lucide-react imports.

Add import at top:
```typescript
import { Copy, Check, Trash2, Upload } from "lucide-react";
```

After the copy button in the access code section (after line 121), add:
```typescript
              <Button
                type="button"
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/admin/exams/${initialData.id}/import`}>
                  <Upload className="h-4 w-4 mr-1" />
                  Import Candidates
                </Link>
              </Button>
```

**Step 2: Verify TypeScript compiles**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/exams/_components/exam-form.tsx
git commit -m "feat: add import candidates button to exam form"
```

---

## Task 9: Update Exam Session Page to Handle Direct Join

**Files:**
- Modify: `src/app/(exam)/exam/[sessionId]/page.tsx`

**Step 1: Check if the exam session page needs updates**

Read the current exam session page to understand if it needs changes to handle sessions without localStorage data (for direct join flow).

The page should work as-is since it fetches session data from the database. However, we need to ensure localStorage is populated for the client-side exam interface.

**Step 2: Verify the page handles direct access**

If the page expects localStorage data, we may need to add a client component that sets it on mount. Check the current implementation first.

---

## Task 10: Test the Complete Flow

**Step 1: Start development server**

Run: `pnpm dev`

**Step 2: Create test CSV file**

Create a file `test-candidates.csv`:
```csv
name,email
Test User One,test1@example.com
Test User Two,test2@example.com
Invalid Email,not-an-email
Test User Three,test3@example.com
```

**Step 3: Test import flow**

1. Go to `/admin/exams` and edit an exam
2. Click "Import Candidates"
3. Upload the test CSV
4. Verify: 3 imported, 1 failed (invalid email)
5. Copy a direct link
6. Open in incognito → should go directly to exam

**Step 4: Final commit**

```bash
git add -A
git commit -m "test: verify bulk candidate import flow works end-to-end"
```

---

## Task 11: Update Memory Bank

**Files:**
- Modify: `memory-bank/activeContext.md`
- Modify: `memory-bank/progress.md`

**Step 1: Update activeContext.md**

Add bulk candidate import to completed items and update next steps.

**Step 2: Update progress.md**

Add bulk candidate import feature to completed work.

**Step 3: Commit**

```bash
git add memory-bank/
git commit -m "docs: update memory bank with bulk candidate import completion"
```
