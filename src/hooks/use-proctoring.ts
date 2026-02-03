"use client";

import { useEffect, useRef, useCallback } from "react";

type EventType = "tab_switch" | "copy" | "paste" | "focus_lost";

interface ProctorEvent {
  eventType: EventType;
  timestamp: string;
  details?: Record<string, unknown>;
}

const FLUSH_INTERVAL_MS = 5000;
const DEBOUNCE_MS = 1000;

export function useProctoring(sessionId: string) {
  const eventQueueRef = useRef<ProctorEvent[]>([]);
  const lastEventTimeRef = useRef<Record<EventType, number>>({
    tab_switch: 0,
    copy: 0,
    paste: 0,
    focus_lost: 0,
  });

  const queueEvent = useCallback((eventType: EventType, details?: Record<string, unknown>) => {
    const now = Date.now();
    const lastTime = lastEventTimeRef.current[eventType];

    // Debounce rapid events of the same type
    if (now - lastTime < DEBOUNCE_MS) {
      return;
    }

    lastEventTimeRef.current[eventType] = now;
    eventQueueRef.current.push({
      eventType,
      timestamp: new Date().toISOString(),
      details,
    });
  }, []);

  const flushEvents = useCallback(async () => {
    if (eventQueueRef.current.length === 0) {
      return;
    }

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    try {
      await fetch("/api/exam/proctor-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, events }),
      });
    } catch {
      // Re-queue events on failure
      eventQueueRef.current = [...events, ...eventQueueRef.current];
    }
  }, [sessionId]);

  const flushEventsBeacon = useCallback(() => {
    if (eventQueueRef.current.length === 0) {
      return;
    }

    const events = [...eventQueueRef.current];
    eventQueueRef.current = [];

    // Use sendBeacon for reliability on page unload
    navigator.sendBeacon(
      "/api/exam/proctor-event",
      JSON.stringify({ sessionId, events })
    );
  }, [sessionId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        queueEvent("tab_switch", { hidden: true });
      }
    };

    const handleCopy = () => {
      queueEvent("copy");
    };

    const handlePaste = () => {
      queueEvent("paste");
    };

    const handleWindowBlur = () => {
      queueEvent("focus_lost");
    };

    const handleBeforeUnload = () => {
      flushEventsBeacon();
    };

    // Attach event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Set up periodic flush
    const intervalId = setInterval(flushEvents, FLUSH_INTERVAL_MS);

    // Cleanup
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(intervalId);

      // Flush remaining events on unmount
      flushEventsBeacon();
    };
  }, [queueEvent, flushEvents, flushEventsBeacon]);
}
