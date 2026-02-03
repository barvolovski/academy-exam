"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { generateAccessCode } from "@/lib/utils";
import {
  createExamSchema,
  updateExamSchema,
  type ExamProblem,
} from "./schemas";

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
} | null;

function parseFormData(formData: FormData) {
  const problemsJson = formData.get("problems") as string;
  let problems: ExamProblem[] = [];
  try {
    problems = JSON.parse(problemsJson);
  } catch {
    problems = [];
  }

  return {
    title: formData.get("title") as string,
    durationMinutes: formData.get("durationMinutes"),
    startsAt: formData.get("startsAt") as string,
    endsAt: formData.get("endsAt") as string,
    problems,
  };
}

export async function createExam(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = parseFormData(formData);
  const result = createExamSchema.safeParse(rawData);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      message: "Validation failed",
    };
  }

  try {
    const accessCode = generateAccessCode();

    await db.exam.create({
      data: {
        title: result.data.title,
        accessCode,
        durationMinutes: result.data.durationMinutes,
        startsAt: new Date(result.data.startsAt),
        endsAt: new Date(result.data.endsAt),
        isActive: false,
        examProblems: {
          create: result.data.problems.map((p, index) => ({
            problemId: p.problemId,
            order: index,
            points: p.points,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Failed to create exam:", error);
    return {
      message: "Failed to create exam. Please try again.",
    };
  }

  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}

export async function updateExam(
  id: string,
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawData = parseFormData(formData);
  const result = updateExamSchema.safeParse(rawData);

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      message: "Validation failed",
    };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.exam.update({
        where: { id },
        data: {
          title: result.data.title,
          durationMinutes: result.data.durationMinutes,
          startsAt: new Date(result.data.startsAt),
          endsAt: new Date(result.data.endsAt),
        },
      });

      await tx.examProblem.deleteMany({
        where: { examId: id },
      });

      await tx.examProblem.createMany({
        data: result.data.problems.map((p, index) => ({
          examId: id,
          problemId: p.problemId,
          order: index,
          points: p.points,
        })),
      });
    });
  } catch (error) {
    console.error("Failed to update exam:", error);
    return {
      message: "Failed to update exam. Please try again.",
    };
  }

  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}

export async function toggleExamActive(
  id: string,
  isActive: boolean
): Promise<ActionState> {
  try {
    await db.exam.update({
      where: { id },
      data: { isActive },
    });
  } catch (error) {
    console.error("Failed to toggle exam status:", error);
    return {
      message: "Failed to update exam status. Please try again.",
    };
  }

  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${id}`);
  return null;
}

export async function deleteExam(id: string): Promise<ActionState> {
  try {
    await db.exam.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete exam:", error);
    return {
      message: "Failed to delete exam. Please try again.",
    };
  }

  revalidatePath("/admin/exams");
  redirect("/admin/exams");
}
