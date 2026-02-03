"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronUp, ChevronDown, Plus, X } from "lucide-react";

export interface AvailableProblem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface SelectedProblem {
  problemId: string;
  points: number;
}

interface ProblemSelectorProps {
  availableProblems: AvailableProblem[];
  initialSelected?: SelectedProblem[];
  onChange: (selected: SelectedProblem[]) => void;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  hard: "bg-red-100 text-red-800",
};

export function ProblemSelector({
  availableProblems,
  initialSelected = [],
  onChange,
}: ProblemSelectorProps) {
  const [selected, setSelected] = useState<SelectedProblem[]>(initialSelected);

  const selectedIds = new Set(selected.map((s) => s.problemId));
  const unselectedProblems = availableProblems.filter(
    (p) => !selectedIds.has(p.id)
  );

  const handleAdd = (problemId: string) => {
    const newSelected = [...selected, { problemId, points: 10 }];
    setSelected(newSelected);
    onChange(newSelected);
  };

  const handleRemove = (problemId: string) => {
    const newSelected = selected.filter((s) => s.problemId !== problemId);
    setSelected(newSelected);
    onChange(newSelected);
  };

  const handlePointsChange = (problemId: string, points: number) => {
    const newSelected = selected.map((s) =>
      s.problemId === problemId ? { ...s, points } : s
    );
    setSelected(newSelected);
    onChange(newSelected);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSelected = [...selected];
    [newSelected[index - 1], newSelected[index]] = [
      newSelected[index],
      newSelected[index - 1],
    ];
    setSelected(newSelected);
    onChange(newSelected);
  };

  const handleMoveDown = (index: number) => {
    if (index === selected.length - 1) return;
    const newSelected = [...selected];
    [newSelected[index], newSelected[index + 1]] = [
      newSelected[index + 1],
      newSelected[index],
    ];
    setSelected(newSelected);
    onChange(newSelected);
  };

  const getProblemById = (id: string) =>
    availableProblems.find((p) => p.id === id);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Available Problems */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Available Problems ({unselectedProblems.length})
        </h3>
        <div className="border rounded-md max-h-80 overflow-y-auto">
          {unselectedProblems.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              All problems have been selected
            </p>
          ) : (
            <div className="divide-y">
              {unselectedProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="p-3 flex items-center justify-between hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{problem.title}</span>
                    <Badge
                      variant="secondary"
                      className={difficultyColors[problem.difficulty]}
                    >
                      {problem.difficulty}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAdd(problem.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Problems */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Selected Problems ({selected.length})
        </h3>
        <div className="border rounded-md max-h-80 overflow-y-auto">
          {selected.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No problems selected. Click + to add problems.
            </p>
          ) : (
            <div className="divide-y">
              {selected.map((item, index) => {
                const problem = getProblemById(item.problemId);
                if (!problem) return null;

                return (
                  <Card key={item.problemId} className="p-3 rounded-none border-0">
                    <div className="flex items-center gap-2">
                      {/* Order controls */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selected.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Order number */}
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        {index + 1}.
                      </span>

                      {/* Problem info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm truncate">{problem.title}</span>
                          <Badge
                            variant="secondary"
                            className={difficultyColors[problem.difficulty]}
                          >
                            {problem.difficulty}
                          </Badge>
                        </div>
                      </div>

                      {/* Points input */}
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={item.points}
                          onChange={(e) =>
                            handlePointsChange(
                              item.problemId,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-16 h-8 text-sm"
                          min={1}
                          max={100}
                        />
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>

                      {/* Remove button */}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(item.problemId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Total points:{" "}
            <span className="font-medium">
              {selected.reduce((sum, s) => sum + s.points, 0)}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
