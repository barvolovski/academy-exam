import { z } from "zod";

export const examProblemSchema = z.object({
  problemId: z.string().uuid(),
  points: z.coerce.number().int().min(1, "Minimum 1 point").max(100, "Maximum 100 points"),
});

export const createExamSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15, "Minimum 15 minutes")
    .max(300, "Maximum 5 hours"),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().min(1, "End date is required"),
  problems: z
    .array(examProblemSchema)
    .min(1, "At least one problem required"),
}).refine(
  (data) => new Date(data.endsAt) > new Date(data.startsAt),
  {
    message: "End date must be after start date",
    path: ["endsAt"],
  }
);

export const updateExamSchema = createExamSchema;

export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type ExamProblem = z.infer<typeof examProblemSchema>;
