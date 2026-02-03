import { NextRequest, NextResponse } from "next/server";
import { exportResultsCSV } from "@/lib/results/queries";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get("examId");

  if (!examId) {
    return NextResponse.json(
      { error: { code: "MISSING_EXAM_ID", message: "examId is required" } },
      { status: 400 }
    );
  }

  try {
    const csv = await exportResultsCSV(examId);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `exam-results-${examId}-${date}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export failed:", error);
    return NextResponse.json(
      { error: { code: "EXPORT_FAILED", message: "Failed to export results" } },
      { status: 500 }
    );
  }
}
