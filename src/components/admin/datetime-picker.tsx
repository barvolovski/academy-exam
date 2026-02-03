"use client";

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
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="datetime-local"
        defaultValue={formatDateTimeLocal(defaultValue)}
        required={required}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
