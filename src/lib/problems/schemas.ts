import { z } from "zod";

export const starterCodeSchema = z.object({
  python: z.string(),
  java: z.string(),
  cpp: z.string(),
  go: z.string(),
});

export const testCaseSchema = z.object({
  input: z.string(),
  expected: z.string(),
  hidden: z.boolean().default(false),
});

export const createProblemSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().min(1, "Description is required"),
  difficulty: z.enum(["easy", "medium", "hard"], {
    required_error: "Difficulty is required",
  }),
  starterCode: starterCodeSchema,
  testCases: z.array(testCaseSchema).min(1, "At least one test case required"),
  timeLimitMs: z.coerce
    .number()
    .int()
    .min(100, "Minimum 100ms")
    .max(10000, "Maximum 10s")
    .default(2000),
  memoryLimitKb: z.coerce
    .number()
    .int()
    .min(1024, "Minimum 1MB")
    .max(524288, "Maximum 512MB")
    .default(262144),
  // AI settings
  aiEnabled: z.coerce.boolean().default(false),
  aiProviderId: z.string().uuid().nullable().optional(),
  aiSystemPrompt: z.string().max(2000).nullable().optional(),
  aiMaxMessages: z.coerce.number().int().min(1).max(100).nullable().optional(),
});

export const updateProblemSchema = createProblemSchema;

export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type UpdateProblemInput = z.infer<typeof updateProblemSchema>;
export type StarterCode = z.infer<typeof starterCodeSchema>;
export type TestCase = z.infer<typeof testCaseSchema>;
