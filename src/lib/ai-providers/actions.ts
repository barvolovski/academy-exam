"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function getAIProviders() {
  return db.aIProvider.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      label: true,
      isEnabled: true,
      apiKey: true,
    },
  });
}

export async function getEnabledAIProviders() {
  return db.aIProvider.findMany({
    where: { isEnabled: true },
    orderBy: { label: "asc" },
    select: {
      id: true,
      name: true,
      label: true,
    },
  });
}

export async function updateAIProvider(
  id: string,
  data: { isEnabled?: boolean; apiKey?: string | null }
) {
  await db.aIProvider.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/settings/ai");
}

export async function seedAIProviders() {
  const providers = [
    { name: "claude", label: "Claude (Anthropic)" },
    { name: "openai", label: "GPT-4 (OpenAI)" },
  ];

  for (const provider of providers) {
    await db.aIProvider.upsert({
      where: { name: provider.name },
      update: {},
      create: provider,
    });
  }
}
