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
      if ("error" in result) {
        alert(result.error);
      } else {
        router.push(`/admin/problems/${result.id}`);
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
                    <span className="text-green-600">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
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
