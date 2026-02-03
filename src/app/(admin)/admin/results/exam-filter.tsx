"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExamFilterProps {
  exams: Array<{ id: string; title: string }>;
  selectedExamId?: string;
}

export function ExamFilter({ exams, selectedExamId }: ExamFilterProps) {
  const router = useRouter();

  const handleChange = (value: string) => {
    if (value === "all") {
      router.push("/admin/results");
    } else {
      router.push(`/admin/results?examId=${value}`);
    }
  };

  return (
    <Select value={selectedExamId ?? "all"} onValueChange={handleChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Filter by exam" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Exams</SelectItem>
        {exams.map((exam) => (
          <SelectItem key={exam.id} value={exam.id}>
            {exam.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
