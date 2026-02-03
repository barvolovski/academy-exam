import { db } from "@/lib/db";
import type { AIConfig, ChatMessage, ChatResponse } from "./types";
import { getProviderClient } from "./providers";

export async function getAIConfig(
  problemId: string,
  examId?: string
): Promise<AIConfig> {
  const problem = await db.problem.findUnique({
    where: { id: problemId },
    select: {
      aiEnabled: true,
      aiProviderId: true,
      aiProvider: { select: { name: true } },
      aiSystemPrompt: true,
      aiMaxMessages: true,
    },
  });

  if (!problem) {
    throw new Error("Problem not found");
  }

  // If examId provided, check for overrides
  if (examId) {
    const examProblem = await db.examProblem.findFirst({
      where: { examId, problemId },
      select: {
        aiEnabled: true,
        aiProviderId: true,
        aiProvider: { select: { name: true } },
        aiSystemPrompt: true,
        aiMaxMessages: true,
      },
    });

    if (examProblem) {
      return {
        enabled: examProblem.aiEnabled ?? problem.aiEnabled,
        providerId: examProblem.aiProviderId ?? problem.aiProviderId,
        providerName: examProblem.aiProvider?.name ?? problem.aiProvider?.name ?? null,
        systemPrompt: examProblem.aiSystemPrompt ?? problem.aiSystemPrompt,
        maxMessages: examProblem.aiMaxMessages ?? problem.aiMaxMessages,
      };
    }
  }

  return {
    enabled: problem.aiEnabled,
    providerId: problem.aiProviderId,
    providerName: problem.aiProvider?.name ?? null,
    systemPrompt: problem.aiSystemPrompt,
    maxMessages: problem.aiMaxMessages,
  };
}

export async function chat(
  sessionId: string,
  problemId: string,
  userMessage: string
): Promise<ChatResponse> {
  // Get session to find examId
  const session = await db.examSession.findUnique({
    where: { id: sessionId },
    select: { examId: true, status: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  if (session.status !== "in_progress") {
    throw new Error("Exam session is not active");
  }

  // Get AI config with overrides
  const config = await getAIConfig(problemId, session.examId);

  if (!config.enabled) {
    throw new Error("AI assistance is not enabled for this problem");
  }

  if (!config.providerName) {
    throw new Error("No AI provider configured for this problem");
  }

  // Get provider with API key
  const provider = await db.aIProvider.findFirst({
    where: { name: config.providerName, isEnabled: true },
    select: { apiKey: true, name: true },
  });

  if (!provider) {
    throw new Error("AI provider not found or disabled");
  }

  // Check message limit
  const messageCount = await db.aIMessage.count({
    where: { sessionId, problemId, role: "user" },
  });

  if (config.maxMessages !== null && messageCount >= config.maxMessages) {
    throw new Error("Message limit reached for this problem");
  }

  // Load chat history
  const history = await db.aIMessage.findMany({
    where: { sessionId, problemId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  const messages: ChatMessage[] = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: userMessage },
  ];

  // Call AI provider
  const client = getProviderClient(provider.name, provider.apiKey);
  const reply = await client.chat(messages, config.systemPrompt ?? undefined);

  // Save messages
  await db.aIMessage.createMany({
    data: [
      { sessionId, problemId, role: "user", content: userMessage },
      { sessionId, problemId, role: "assistant", content: reply },
    ],
  });

  const messagesRemaining = config.maxMessages !== null
    ? config.maxMessages - messageCount - 1
    : null;

  return { reply, messagesRemaining };
}

export async function getChatHistory(
  sessionId: string,
  problemId: string
): Promise<{ messages: ChatMessage[]; messagesRemaining: number | null }> {
  const session = await db.examSession.findUnique({
    where: { id: sessionId },
    select: { examId: true },
  });

  if (!session) {
    throw new Error("Session not found");
  }

  const config = await getAIConfig(problemId, session.examId);

  const history = await db.aIMessage.findMany({
    where: { sessionId, problemId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  const userMessageCount = history.filter((m) => m.role === "user").length;
  const messagesRemaining = config.maxMessages !== null
    ? config.maxMessages - userMessageCount
    : null;

  return {
    messages: history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    messagesRemaining,
  };
}
