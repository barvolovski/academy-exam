"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { DateTimePicker } from "@/components/admin/datetime-picker";
import {
  ProblemSelector,
  type AvailableProblem,
  type SelectedProblem,
} from "@/components/admin/problem-selector";
import {
  createExam,
  updateExam,
  toggleExamActive,
  deleteExam,
  type ActionState,
} from "@/lib/exams/actions";
import { Copy, Check, Trash2 } from "lucide-react";

interface ExamFormProps {
  availableProblems: AvailableProblem[];
  initialData?: {
    id: string;
    title: string;
    accessCode: string;
    durationMinutes: number;
    startsAt: string;
    endsAt: string;
    isActive: boolean;
    problems: SelectedProblem[];
  };
}

export function ExamForm({ availableProblems, initialData }: ExamFormProps) {
  const isEditing = !!initialData;

  const boundUpdateExam = initialData
    ? updateExam.bind(null, initialData.id)
    : null;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    isEditing ? boundUpdateExam! : createExam,
    null
  );

  const [selectedProblems, setSelectedProblems] = useState<SelectedProblem[]>(
    initialData?.problems ?? []
  );

  const [isActive, setIsActive] = useState(initialData?.isActive ?? false);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleCopyCode = async () => {
    if (initialData?.accessCode) {
      await navigator.clipboard.writeText(initialData.accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleActive = async () => {
    if (!initialData) return;
    setIsToggling(true);
    try {
      await toggleExamActive(initialData.id, !isActive);
      setIsActive(!isActive);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData) return;
    setIsDeleting(true);
    try {
      await deleteExam(initialData.id);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <form action={formAction} className="space-y-8">
      {state?.message && !state.errors && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {state.message}
        </div>
      )}

      {/* Access Code (edit mode only) */}
      {isEditing && initialData && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-muted-foreground">Access Code</Label>
              <p className="text-2xl font-mono font-bold tracking-wider mt-1">
                {initialData.accessCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <Check className="h-4 w-4 mr-1" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Exam Details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialData?.title}
              placeholder="Coding Assessment 2025"
            />
            {state?.errors?.title && (
              <p className="text-sm text-destructive">{state.errors.title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duration (minutes)</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              defaultValue={initialData?.durationMinutes ?? 90}
              min={15}
              max={300}
            />
            {state?.errors?.durationMinutes && (
              <p className="text-sm text-destructive">
                {state.errors.durationMinutes[0]}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DateTimePicker
            id="startsAt"
            name="startsAt"
            label="Start Date & Time"
            defaultValue={initialData?.startsAt}
            error={state?.errors?.startsAt?.[0]}
          />

          <DateTimePicker
            id="endsAt"
            name="endsAt"
            label="End Date & Time"
            defaultValue={initialData?.endsAt}
            error={state?.errors?.endsAt?.[0]}
          />
        </div>
      </div>

      {/* Problem Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Select Problems</h2>
        {state?.errors?.problems && (
          <p className="text-sm text-destructive">{state.errors.problems[0]}</p>
        )}

        <ProblemSelector
          availableProblems={availableProblems}
          initialSelected={selectedProblems}
          onChange={setSelectedProblems}
        />

        <input
          type="hidden"
          name="problems"
          value={JSON.stringify(selectedProblems)}
        />
      </div>

      {/* Active Toggle (edit mode only) */}
      {isEditing && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Status</h2>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {isActive ? "Exam is Active" : "Exam is Inactive"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isActive
                    ? "Candidates can access this exam with the code"
                    : "Candidates cannot access this exam"}
                </p>
              </div>
              <Button
                type="button"
                variant={isActive ? "destructive" : "default"}
                onClick={handleToggleActive}
                disabled={isToggling}
              >
                {isToggling
                  ? "Updating..."
                  : isActive
                    ? "Deactivate"
                    : "Activate"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-4 justify-between">
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save Changes"
                : "Create Exam"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/exams">Cancel</Link>
          </Button>
        </div>

        {/* Delete (edit mode only) */}
        {isEditing && (
          <div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Are you sure?
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Exam
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
