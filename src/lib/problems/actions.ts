"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createProblemSchema,
  updateProblemSchema,
  type StarterCode,
  type TestCase,
} from "./schemas";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

function parseFormData(formData: FormData) {
  const starterCode: StarterCode = {
    python: formData.get("starterCode.python") as string,
    java: formData.get("starterCode.java") as string,
    cpp: formData.get("starterCode.cpp") as string,
    go: formData.get("starterCode.go") as string,
  };

  const testCasesJson = formData.get("testCases") as string;
  let testCases: TestCase[] = [];
  try {
    testCases = JSON.parse(testCasesJson);
  } catch {
    testCases = [];
  }

  // AI settings
  const aiEnabled =
    formData.get("aiEnabled") === "on" ||
    formData.get("aiEnabled") === "true";
  const aiProviderId = formData.get("aiProviderId") as string | null;
  const aiSystemPrompt = formData.get("aiSystemPrompt") as string | null;
  const aiMaxMessagesRaw = formData.get("aiMaxMessages") as string | null;
  const aiMaxMessages = aiMaxMessagesRaw ? parseInt(aiMaxMessagesRaw, 10) : null;

  return {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    difficulty: formData.get("difficulty") as string,
    starterCode,
    testCases,
    timeLimitMs: formData.get("timeLimitMs"),
    memoryLimitKb: formData.get("memoryLimitKb"),
    aiEnabled,
    aiProviderId: aiProviderId || null,
    aiSystemPrompt: aiSystemPrompt || null,
    aiMaxMessages: isNaN(aiMaxMessages as number) ? null : aiMaxMessages,
  };
}

export async function createProblem(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = parseFormData(formData);
  const result = createProblemSchema.safeParse(rawData);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      message: "Validation failed",
    };
  }

  try {
    await db.problem.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        difficulty: result.data.difficulty,
        starterCode: result.data.starterCode,
        testCases: result.data.testCases,
        timeLimitMs: result.data.timeLimitMs,
        memoryLimitKb: result.data.memoryLimitKb,
        aiEnabled: result.data.aiEnabled,
        aiProviderId: result.data.aiProviderId,
        aiSystemPrompt: result.data.aiSystemPrompt,
        aiMaxMessages: result.data.aiMaxMessages,
      },
    });
  } catch (error) {
    console.error("Failed to create problem:", error);
    return {
      message: "Failed to create problem. Please try again.",
    };
  }

  revalidatePath("/admin/problems");
  redirect("/admin/problems");
}

export async function updateProblem(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = parseFormData(formData);
  const result = updateProblemSchema.safeParse(rawData);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      message: "Validation failed",
    };
  }

  try {
    await db.problem.update({
      where: { id },
      data: {
        title: result.data.title,
        description: result.data.description,
        difficulty: result.data.difficulty,
        starterCode: result.data.starterCode,
        testCases: result.data.testCases,
        timeLimitMs: result.data.timeLimitMs,
        memoryLimitKb: result.data.memoryLimitKb,
        aiEnabled: result.data.aiEnabled,
        aiProviderId: result.data.aiProviderId,
        aiSystemPrompt: result.data.aiSystemPrompt,
        aiMaxMessages: result.data.aiMaxMessages,
      },
    });
  } catch (error) {
    console.error("Failed to update problem:", error);
    return {
      message: "Failed to update problem. Please try again.",
    };
  }

  revalidatePath("/admin/problems");
  redirect("/admin/problems");
}

export async function deleteProblem(id: string): Promise<ActionState> {
  try {
    await db.problem.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete problem:", error);
    return {
      message: "Failed to delete problem. Please try again.",
    };
  }

  revalidatePath("/admin/problems");
  redirect("/admin/problems");
}
