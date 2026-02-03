import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

const eventSchema = z.object({
  eventType: z.enum(["tab_switch", "copy", "paste", "focus_lost"]),
  timestamp: z.string().datetime(),
  details: z.record(z.unknown()).optional(),
});

const proctorEventSchema = z.object({
  sessionId: z.string().uuid(),
  events: z.array(eventSchema).min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and sendBeacon (which sends as text)
    const contentType = request.headers.get("content-type") || "";
    let body: unknown;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      // sendBeacon sends as text/plain
      const text = await request.text();
      body = JSON.parse(text);
    }

    const { sessionId, events } = proctorEventSchema.parse(body);

    // Verify session exists and is active
    const session = await db.examSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: { code: "SESSION_NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    // Insert all events
    await db.proctorEvent.createMany({
      data: events.map((event) => ({
        sessionId,
        eventType: event.eventType,
        details: event.details
          ? (event.details as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        createdAt: new Date(event.timestamp),
      })),
    });

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.errors } },
        { status: 400 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: { code: "INVALID_JSON", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    console.error("Proctor event error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }
}
