"use client";

import { useEffect, useState, useCallback } from "react";

export interface ExamTimerProps {
  endsAt: Date;
  onTimeUp: () => void;
}

function formatTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return "00:00";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function ExamTimer({ endsAt, onTimeUp }: ExamTimerProps) {
  const calculateRemaining = useCallback(() => {
    const now = new Date();
    const end = new Date(endsAt);
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  }, [endsAt]);

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [calculateRemaining, onTimeUp]);

  const isLowTime = remainingSeconds < 300; // Less than 5 minutes
  const isCritical = remainingSeconds < 60; // Less than 1 minute

  return (
    <div
      className={`font-mono text-lg font-semibold px-3 py-1 rounded ${
        isCritical
          ? "bg-red-600 text-white animate-pulse"
          : isLowTime
            ? "bg-red-100 text-red-700"
            : "bg-muted text-foreground"
      }`}
    >
      {formatTime(remainingSeconds)}
    </div>
  );
}
