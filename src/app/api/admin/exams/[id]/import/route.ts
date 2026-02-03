import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseCSV, generateToken } from "@/lib/csv";
import {
  candidateRowSchema,
  type ImportResult,
} from "@/lib/candidates/schemas";

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
    const { data, errors: parseErrors } = parseCSV<{
      name: string;
      email: string;
    }>(content, ["name", "email"]);

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
    const validCandidates: { name: string; email: string; token: string }[] =
      [];

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
        {
          error: {
            code: "NO_VALID_ROWS",
            message: "No valid candidates to import",
          },
        },
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
