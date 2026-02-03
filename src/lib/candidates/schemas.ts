import { z } from "zod";

export const candidateRowSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or less"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255, "Email must be 255 characters or less"),
});

export type CandidateRow = z.infer<typeof candidateRowSchema>;

export interface ImportResult {
  success: boolean;
  imported: {
    name: string;
    email: string;
    token: string;
    link: string;
  }[];
  failed: {
    row: number;
    name: string;
    email: string;
    error: string;
  }[];
  summary: {
    total: number;
    imported: number;
    failed: number;
  };
}
