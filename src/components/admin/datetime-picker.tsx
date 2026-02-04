"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}

function formatDateTimeLocal(date: Date | string | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DateTimePicker({
  id,
  name,
  label,
  defaultValue,
  error,
  required,
}: DateTimePickerProps) {
  const [localValue, setLocalValue] = useState(formatDateTimeLocal(defaultValue));
  const [isoValue, setIsoValue] = useState("");

  // Convert local datetime to ISO string whenever it changes
  useEffect(() => {
    if (localValue) {
      // datetime-local value is in local time, convert to ISO with timezone
      const localDate = new Date(localValue);
      setIsoValue(localDate.toISOString());
    } else {
      setIsoValue("");
    }
  }, [localValue]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="datetime-local"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        required={required}
      />
      {/* Hidden input sends ISO string to server */}
      <input type="hidden" name={name} value={isoValue} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
