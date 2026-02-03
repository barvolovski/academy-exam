# AI Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add optional AI chat assistance to the exam interface with per-problem configuration.

**Architecture:** Multi-provider AI service abstraction, database-stored chat history, admin-configurable settings at problem and exam-problem level with override hierarchy.

**Tech Stack:** Anthropic SDK, OpenAI SDK, Prisma, Next.js API routes, React components

---

## Task 1: Install AI SDK Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Anthropic and OpenAI SDKs**

Run:
```bash
pnpm add @anthropic-ai/sdk openai
```

**Step 2: Verify installation**

Run: `pnpm list @anthropic-ai/sdk openai`
Expected: Both packages listed with versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add AI SDK dependencies (Anthropic, OpenAI)"
```

---

## Task 2: Update Prisma Schema with AI Models

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add AIProvider model and update Problem, ExamProblem, ExamSession**

Add the following to `prisma/schema.prisma`:

```prisma
// AI Provider configuration
model AIProvider {
  id        String   @id @default(uuid())
  name      String   @unique @db.VarChar(50)  // "claude", "openai"
  label     String   @db.VarChar(100)         // "Claude (Anthropic)"
  apiKey    String?  @db.Text                 // encrypted, overrides env var
  isEnabled Boolean  @default(true) @map("is_enabled")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  problems     Problem[]
  examProblems ExamProblem[]

  @@map("ai_providers")
}

// AI Chat messages
model AIMessage {
  id        String      @id @default(uuid())
  sessionId String      @map("session_id")
  problemId String      @map("problem_id")
  role      String      @db.VarChar(20)  // "user" | "assistant"
  content   String      @db.Text
  createdAt DateTime    @default(now()) @map("created_at")

  session   ExamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  problem   Problem     @relation(fields: [problemId], references: [id], onDelete: Cascade)

  @@index([sessionId, problemId])
  @@map("ai_messages")
}
```

Add to `Problem` model (before `@@map`):

```prisma
  // AI settings (defaults)
  aiEnabled      Boolean     @default(false) @map("ai_enabled")
  aiProviderId   String?     @map("ai_provider_id")
  aiProvider     AIProvider? @relation(fields: [aiProviderId], references: [id])
  aiSystemPrompt String?     @db.Text @map("ai_system_prompt")
  aiMaxMessages  Int?        @map("ai_max_messages")

  aiMessages     AIMessage[]
```

Add to `ExamProblem` model (before `@@unique`):

```prisma
  // AI overrides (null = use Problem defaults)
  aiEnabled      Boolean?    @map("ai_enabled")
  aiProviderId   String?     @map("ai_provider_id")
  aiProvider     AIProvider? @relation(fields: [aiProviderId], references: [id])
  aiSystemPrompt String?     @db.Text @map("ai_system_prompt")
  aiMaxMessages  Int?        @map("ai_max_messages")
```

Add to `ExamSession` model (before `@@unique`):

```prisma
  aiMessages     AIMessage[]
```

**Step 2: Push schema changes**

Run: `pnpm db:push`
Expected: Schema pushed successfully

**Step 3: Regenerate Prisma client**

Run: `pnpm db:generate`
Expected: Client generated

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add AI provider, message, and problem AI settings schema"
```

---

## Task 3: Create AI Types and Interfaces

**Files:**
- Create: `src/lib/ai/types.ts`

**Step 1: Create types file**

```typescript
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AIProviderClient {
  chat(messages: ChatMessage[], systemPrompt?: string): Promise<string>;
}

export interface AIConfig {
  enabled: boolean;
  providerId: string | null;
  providerName: string | null;
  systemPrompt: string | null;
  maxMessages: number | null;
}

export interface ChatResponse {
  reply: string;
  messagesRemaining: number | null;
}
```

**Step 2: Commit**

```bash
git add src/lib/ai/types.ts
git commit -m "feat(ai): add AI types and interfaces"
```

---

## Task 4: Create Claude Provider

**Files:**
- Create: `src/lib/ai/providers/claude.ts`

**Step 1: Create Claude provider**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { AIProviderClient, ChatMessage } from "../types";

export function createClaudeProvider(apiKey: string): AIProviderClient {
  const client = new Anthropic({ apiKey });

  return {
    async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt || "You are a helpful coding tutor. Help the student understand concepts without giving complete solutions.",
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const content = response.content[0];
      if (content.type === "text") {
        return content.text;
      }
      throw new Error("Unexpected response type from Claude");
    },
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/ai/providers/claude.ts
git commit -m "feat(ai): add Claude provider implementation"
```

---

## Task 5: Create OpenAI Provider

**Files:**
- Create: `src/lib/ai/providers/openai.ts`

**Step 1: Create OpenAI provider**

```typescript
import OpenAI from "openai";
import type { AIProviderClient, ChatMessage } from "../types";

export function createOpenAIProvider(apiKey: string): AIProviderClient {
  const client = new OpenAI({ apiKey });

  return {
    async chat(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
      const systemMessage = {
        role: "system" as const,
        content: systemPrompt || "You are a helpful coding tutor. Help the student understand concepts without giving complete solutions.",
      };

      const response = await client.chat.completions.create({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: [
          systemMessage,
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }
      return content;
    },
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/ai/providers/openai.ts
git commit -m "feat(ai): add OpenAI provider implementation"
```

---

## Task 6: Create Provider Factory

**Files:**
- Create: `src/lib/ai/providers/index.ts`

**Step 1: Create provider factory**

```typescript
import type { AIProviderClient } from "../types";
import { createClaudeProvider } from "./claude";
import { createOpenAIProvider } from "./openai";

const ENV_KEYS: Record<string, string | undefined> = {
  claude: process.env.ANTHROPIC_API_KEY,
  openai: process.env.OPENAI_API_KEY,
};

export function getProviderClient(
  providerName: string,
  apiKeyOverride?: string | null
): AIProviderClient {
  const apiKey = apiKeyOverride || ENV_KEYS[providerName];

  if (!apiKey) {
    throw new Error(`No API key configured for provider: ${providerName}`);
  }

  switch (providerName) {
    case "claude":
      return createClaudeProvider(apiKey);
    case "openai":
      return createOpenAIProvider(apiKey);
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }
}
```

**Step 2: Commit**

```bash
git add src/lib/ai/providers/index.ts
git commit -m "feat(ai): add provider factory with env/db key resolution"
```

---

## Task 7: Create AI Service

**Files:**
- Create: `src/lib/ai/service.ts`

**Step 1: Create main AI service**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/ai/service.ts
git commit -m "feat(ai): add main AI service with config resolution and chat"
```

---

## Task 8: Create AI Index Export

**Files:**
- Create: `src/lib/ai/index.ts`

**Step 1: Create index file**

```typescript
export * from "./types";
export { getAIConfig, chat, getChatHistory } from "./service";
export { getProviderClient } from "./providers";
```

**Step 2: Commit**

```bash
git add src/lib/ai/index.ts
git commit -m "feat(ai): add AI module index exports"
```

---

## Task 9: Create Chat API Route

**Files:**
- Create: `src/app/api/exam/chat/route.ts`

**Step 1: Create chat API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chat } from "@/lib/ai";

const chatSchema = z.object({
  sessionId: z.string().uuid(),
  problemId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = chatSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: { message: "Invalid request", details: result.error.flatten() } },
        { status: 400 }
      );
    }

    const { sessionId, problemId, message } = result.data;
    const response = await chat(sessionId, problemId, message);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Failed to process chat";
    return NextResponse.json(
      { error: { message } },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/exam/chat/route.ts
git commit -m "feat(api): add /api/exam/chat endpoint"
```

---

## Task 10: Create Chat History API Route

**Files:**
- Create: `src/app/api/exam/chat/history/route.ts`

**Step 1: Create history API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getChatHistory, getAIConfig } from "@/lib/ai";
import { db } from "@/lib/db";

const querySchema = z.object({
  sessionId: z.string().uuid(),
  problemId: z.string().uuid(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = querySchema.safeParse({
      sessionId: searchParams.get("sessionId"),
      problemId: searchParams.get("problemId"),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: { message: "Invalid request" } },
        { status: 400 }
      );
    }

    const { sessionId, problemId } = result.data;

    // Get session to check examId
    const session = await db.examSession.findUnique({
      where: { id: sessionId },
      select: { examId: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: { message: "Session not found" } },
        { status: 404 }
      );
    }

    const config = await getAIConfig(problemId, session.examId);
    const history = await getChatHistory(sessionId, problemId);

    return NextResponse.json({
      enabled: config.enabled,
      ...history,
    });
  } catch (error) {
    console.error("Chat history API error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch chat history" } },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/exam/chat/history/route.ts
git commit -m "feat(api): add /api/exam/chat/history endpoint"
```

---

## Task 11: Create AI Chat Panel Component

**Files:**
- Create: `src/components/exam/ai-chat-panel.tsx`

**Step 1: Create chat panel component**

```typescript
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  sessionId: string;
  problemId: string;
}

export function AIChatPanel({ sessionId, problemId }: AIChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load chat history when problem changes
  useEffect(() => {
    async function loadHistory() {
      setInitialLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/exam/chat/history?sessionId=${sessionId}&problemId=${problemId}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to load chat");
        }

        setEnabled(data.enabled);
        setMessages(data.messages || []);
        setMessagesRemaining(data.messagesRemaining);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chat");
        setEnabled(false);
      } finally {
        setInitialLoading(false);
      }
    }

    loadHistory();
  }, [sessionId, problemId]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/exam/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          problemId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to send message");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setMessagesRemaining(data.messagesRemaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (initialLoading) {
    return (
      <div className="w-80 border-l flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!enabled) {
    return null;
  }

  const isLimitReached = messagesRemaining !== null && messagesRemaining <= 0;

  return (
    <div className="w-80 border-l flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-3 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">AI Assistant</span>
          </div>
          {messagesRemaining !== null && (
            <span className="text-xs text-muted-foreground">
              {messagesRemaining} {messagesRemaining === 1 ? "message" : "messages"} left
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            Ask the AI for help with this problem
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />
            )}
            <div
              className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
            {message.role === "user" && (
              <User className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />
            <div className="bg-background border rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-3 pb-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t bg-background">
        {isLimitReached ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            Message limit reached
          </p>
        ) : (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={2}
              className="resize-none text-sm"
              disabled={loading}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/exam/ai-chat-panel.tsx
git commit -m "feat(ui): add AI chat panel component for exam interface"
```

---

## Task 12: Export Chat Panel from Exam Components

**Files:**
- Modify: `src/components/exam/index.ts`

**Step 1: Read current exports**

Current content:
```typescript
export { ExamTimer } from "./exam-timer";
export { ProblemSidebar, type Problem, type SubmissionStatus } from "./problem-sidebar";
export { TestResults, type TestResult } from "./test-results";
```

**Step 2: Add AIChatPanel export**

Add to exports:

```typescript
export { AIChatPanel } from "./ai-chat-panel";
```

**Step 3: Commit**

```bash
git add src/components/exam/index.ts
git commit -m "feat(ui): export AIChatPanel from exam components"
```

---

## Task 13: Integrate Chat Panel into Exam Page

**Files:**
- Modify: `src/app/(exam)/exam/[sessionId]/page.tsx`

**Step 1: Add import**

Add to imports:

```typescript
import { AIChatPanel } from "@/components/exam";
```

Update the existing import line to:

```typescript
import {
  ExamTimer,
  ProblemSidebar,
  TestResults,
  AIChatPanel,
  type Problem,
  type SubmissionStatus,
  type TestResult,
} from "@/components/exam";
```

**Step 2: Add chat panel to layout**

Find the `{/* Main content */}` section around line 257. The current structure is:

```tsx
{/* Main content */}
<div className="flex-1 flex overflow-hidden">
  {/* Problem sidebar */}
  <ProblemSidebar ... />

  {/* Problem content and editor */}
  <main className="flex-1 flex flex-col overflow-hidden">
    ...
  </main>
</div>
```

Change to:

```tsx
{/* Main content */}
<div className="flex-1 flex overflow-hidden">
  {/* Problem sidebar */}
  <ProblemSidebar ... />

  {/* Problem content and editor */}
  <main className="flex-1 flex flex-col overflow-hidden">
    ...
  </main>

  {/* AI Chat Panel */}
  <AIChatPanel sessionId={sessionId} problemId={currentProblemId} />
</div>
```

**Step 3: Commit**

```bash
git add src/app/\(exam\)/exam/\[sessionId\]/page.tsx
git commit -m "feat(ui): integrate AI chat panel into exam interface"
```

---

## Task 14: Update Problem Schema with AI Fields

**Files:**
- Modify: `src/lib/problems/schemas.ts`

**Step 1: Add AI fields to schema**

Add new fields to `createProblemSchema`:

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/problems/schemas.ts
git commit -m "feat(schema): add AI fields to problem validation schema"
```

---

## Task 15: Update Problem Actions with AI Fields

**Files:**
- Modify: `src/lib/problems/actions.ts`

**Step 1: Update parseFormData function**

Add AI fields parsing:

```typescript
function parseFormData(formData: FormData) {
  // ... existing code ...

  // AI settings
  const aiEnabled = formData.get("aiEnabled") === "on" || formData.get("aiEnabled") === "true";
  const aiProviderId = formData.get("aiProviderId") as string | null;
  const aiSystemPrompt = formData.get("aiSystemPrompt") as string | null;
  const aiMaxMessagesRaw = formData.get("aiMaxMessages") as string | null;
  const aiMaxMessages = aiMaxMessagesRaw ? parseInt(aiMaxMessagesRaw, 10) : null;

  return {
    // ... existing fields ...
    aiEnabled,
    aiProviderId: aiProviderId || null,
    aiSystemPrompt: aiSystemPrompt || null,
    aiMaxMessages: isNaN(aiMaxMessages as number) ? null : aiMaxMessages,
  };
}
```

**Step 2: Update create/update data objects**

In `createProblem` and `updateProblem`, add the AI fields to the data object:

```typescript
data: {
  // ... existing fields ...
  aiEnabled: result.data.aiEnabled,
  aiProviderId: result.data.aiProviderId,
  aiSystemPrompt: result.data.aiSystemPrompt,
  aiMaxMessages: result.data.aiMaxMessages,
},
```

**Step 3: Commit**

```bash
git add src/lib/problems/actions.ts
git commit -m "feat(actions): handle AI fields in problem create/update actions"
```

---

## Task 16: Create AI Providers Actions

**Files:**
- Create: `src/lib/ai-providers/actions.ts`

**Step 1: Create providers actions**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/lib/ai-providers/actions.ts
git commit -m "feat(actions): add AI providers management actions"
```

---

## Task 17: Create AI Settings Admin Page

**Files:**
- Create: `src/app/(admin)/admin/settings/ai/page.tsx`

**Step 1: Create AI settings page**

```typescript
import { getAIProviders, seedAIProviders } from "@/lib/ai-providers/actions";
import { AIProvidersList } from "./_components/providers-list";

export default async function AISettingsPage() {
  // Seed providers if not exist
  await seedAIProviders();

  const providers = await getAIProviders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Settings</h1>
        <p className="text-muted-foreground">
          Configure AI providers for exam assistance
        </p>
      </div>

      <AIProvidersList providers={providers} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(admin\)/admin/settings/ai/page.tsx
git commit -m "feat(admin): add AI settings page"
```

---

## Task 18: Create AI Providers List Component

**Files:**
- Create: `src/app/(admin)/admin/settings/ai/_components/providers-list.tsx`

**Step 1: Create providers list component**

```typescript
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAIProvider } from "@/lib/ai-providers/actions";
import { Eye, EyeOff, Check } from "lucide-react";

interface AIProvider {
  id: string;
  name: string;
  label: string;
  isEnabled: boolean;
  apiKey: string | null;
}

interface AIProvidersListProps {
  providers: AIProvider[];
}

export function AIProvidersList({ providers }: AIProvidersListProps) {
  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} provider={provider} />
      ))}
    </div>
  );
}

function ProviderCard({ provider }: { provider: AIProvider }) {
  const [isEnabled, setIsEnabled] = useState(provider.isEnabled);
  const [apiKey, setApiKey] = useState(provider.apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const envKeyName = provider.name === "claude" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY";
  const hasEnvKey = provider.name === "claude"
    ? !!process.env.NEXT_PUBLIC_HAS_ANTHROPIC_KEY
    : !!process.env.NEXT_PUBLIC_HAS_OPENAI_KEY;

  const handleToggle = async () => {
    setSaving(true);
    try {
      await updateAIProvider(provider.id, { isEnabled: !isEnabled });
      setIsEnabled(!isEnabled);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKey = async () => {
    setSaving(true);
    try {
      await updateAIProvider(provider.id, {
        apiKey: apiKey.trim() || null
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold">{provider.label}</h3>
          <p className="text-sm text-muted-foreground">Provider: {provider.name}</p>
        </div>
        <Button
          variant={isEnabled ? "default" : "outline"}
          size="sm"
          onClick={handleToggle}
          disabled={saving}
        >
          {isEnabled ? "Enabled" : "Disabled"}
        </Button>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`apiKey-${provider.id}`}>
            API Key
            <span className="text-muted-foreground font-normal ml-2">
              (overrides {envKeyName} env var)
            </span>
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id={`apiKey-${provider.id}`}
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter ${provider.label} API key`}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleSaveKey} disabled={saving}>
              {saved ? <Check className="h-4 w-4" /> : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\(admin\)/admin/settings/ai/_components/providers-list.tsx
git commit -m "feat(admin): add AI providers list component"
```

---

## Task 19: Add AI Section to Problem Form

**Files:**
- Modify: `src/app/(admin)/admin/problems/_components/problem-form.tsx`

**Step 1: Add AI providers prop and state**

Add to imports:

```typescript
import { getEnabledAIProviders } from "@/lib/ai-providers/actions";
```

Update `ProblemFormProps` interface:

```typescript
interface ProblemFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    starterCode: StarterCode;
    testCases: TestCase[];
    timeLimitMs: number;
    memoryLimitKb: number;
    aiEnabled: boolean;
    aiProviderId: string | null;
    aiSystemPrompt: string | null;
    aiMaxMessages: number | null;
  };
  aiProviders: Array<{ id: string; name: string; label: string }>;
}
```

Add state for AI fields after other state declarations:

```typescript
const [aiEnabled, setAiEnabled] = useState(initialData?.aiEnabled ?? false);
const [aiProviderId, setAiProviderId] = useState(initialData?.aiProviderId ?? "");
const [aiSystemPrompt, setAiSystemPrompt] = useState(initialData?.aiSystemPrompt ?? "");
const [aiMaxMessages, setAiMaxMessages] = useState<string>(
  initialData?.aiMaxMessages?.toString() ?? ""
);
```

**Step 2: Add AI section to form**

Add after the Test Cases section and before the Submit section:

```tsx
{/* AI Assistance */}
<div className="space-y-4">
  <h2 className="text-lg font-semibold">AI Assistance</h2>

  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      id="aiEnabled"
      name="aiEnabled"
      checked={aiEnabled}
      onChange={(e) => setAiEnabled(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300"
    />
    <Label htmlFor="aiEnabled" className="font-normal">
      Enable AI chat assistance for this problem
    </Label>
  </div>

  {aiEnabled && (
    <Card className="p-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="aiProviderId">AI Provider</Label>
          <Select
            name="aiProviderId"
            value={aiProviderId}
            onValueChange={setAiProviderId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {aiProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aiMaxMessages">Max Messages (optional)</Label>
          <Input
            id="aiMaxMessages"
            name="aiMaxMessages"
            type="number"
            value={aiMaxMessages}
            onChange={(e) => setAiMaxMessages(e.target.value)}
            placeholder="Unlimited"
            min={1}
            max={100}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="aiSystemPrompt">System Prompt (optional)</Label>
        <Textarea
          id="aiSystemPrompt"
          name="aiSystemPrompt"
          value={aiSystemPrompt}
          onChange={(e) => setAiSystemPrompt(e.target.value)}
          placeholder="You are a helpful coding tutor..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Custom instructions for the AI. Leave blank for default behavior.
        </p>
      </div>
    </Card>
  )}
</div>
```

**Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/problems/_components/problem-form.tsx
git commit -m "feat(admin): add AI settings section to problem form"
```

---

## Task 20: Update Problem Pages to Pass AI Providers

**Files:**
- Modify: `src/app/(admin)/admin/problems/new/page.tsx`
- Modify: `src/app/(admin)/admin/problems/[id]/page.tsx`

**Step 1: Update new problem page**

Add import and fetch providers:

```typescript
import { getEnabledAIProviders } from "@/lib/ai-providers/actions";

export default async function NewProblemPage() {
  const aiProviders = await getEnabledAIProviders();

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Create New Problem</h1>
      <ProblemForm aiProviders={aiProviders} />
    </div>
  );
}
```

**Step 2: Update edit problem page**

Add import and update query to include AI fields:

```typescript
import { getEnabledAIProviders } from "@/lib/ai-providers/actions";
```

In the `findUnique` call, add AI fields to select:

```typescript
const problem = await db.problem.findUnique({
  where: { id: params.id },
  select: {
    // ... existing fields ...
    aiEnabled: true,
    aiProviderId: true,
    aiSystemPrompt: true,
    aiMaxMessages: true,
  },
});
```

Fetch providers and pass to form:

```typescript
const aiProviders = await getEnabledAIProviders();

return (
  <ProblemForm
    initialData={{
      // ... existing fields ...
      aiEnabled: problem.aiEnabled,
      aiProviderId: problem.aiProviderId,
      aiSystemPrompt: problem.aiSystemPrompt,
      aiMaxMessages: problem.aiMaxMessages,
    }}
    aiProviders={aiProviders}
  />
);
```

**Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/problems/new/page.tsx src/app/\(admin\)/admin/problems/\[id\]/page.tsx
git commit -m "feat(admin): pass AI providers to problem form pages"
```

---

## Task 21: Add Settings Link to Admin Layout

**Files:**
- Modify: `src/app/(admin)/layout.tsx`

**Step 1: Add settings navigation link**

Find the navigation section and add a Settings link that includes AI settings:

```tsx
<Link
  href="/admin/settings/ai"
  className={cn(
    "...",
    pathname.startsWith("/admin/settings") && "..."
  )}
>
  Settings
</Link>
```

**Step 2: Commit**

```bash
git add src/app/\(admin\)/layout.tsx
git commit -m "feat(admin): add settings navigation to admin layout"
```

---

## Task 22: Add Environment Variables Documentation

**Files:**
- Modify: `.env.example`

**Step 1: Add AI environment variables**

Add to `.env.example`:

```env
# AI Providers (optional - can also configure in admin UI)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

**Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add AI provider env variables to example"
```

---

## Task 23: Run Type Check and Lint

**Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: No type errors

**Step 2: Run lint**

Run: `pnpm lint`
Expected: No lint errors

**Step 3: Fix any issues found**

If errors found, fix them before proceeding.

**Step 4: Commit fixes if any**

```bash
git add -A
git commit -m "fix: resolve type and lint errors"
```

---

## Task 24: Test the Integration Manually

**Step 1: Start the dev server**

Run: `pnpm dev`

**Step 2: Test admin flow**

1. Navigate to `/admin/settings/ai`
2. Enable Claude or OpenAI provider
3. Add API key if not using env var
4. Create/edit a problem
5. Enable AI assistance
6. Select provider
7. Optionally set system prompt and max messages

**Step 3: Test candidate flow**

1. Start an exam with an AI-enabled problem
2. Verify chat panel appears
3. Send a message
4. Verify response appears
5. Check message limit works (if set)

**Step 4: Commit final state**

```bash
git add -A
git commit -m "feat: complete AI integration for exam assistance"
```

---

## Summary

This plan implements:

1. **Database Layer** (Tasks 2): AIProvider, AIMessage models, Problem/ExamProblem AI fields
2. **AI Service Layer** (Tasks 3-8): Provider abstraction, Claude/OpenAI implementations, config resolution
3. **API Routes** (Tasks 9-10): Chat and history endpoints
4. **Candidate UI** (Tasks 11-13): Chat panel component integrated into exam interface
5. **Admin UI** (Tasks 14-21): AI settings page, problem form AI section
6. **Documentation** (Task 22): Environment variables

Total: 24 tasks following TDD principles with frequent commits.
