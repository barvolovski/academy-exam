# AI Integration Design

## Overview

Add optional AI chat assistance to the exam interface. Admins can enable/configure AI per problem, with the ability to override settings when adding problems to specific exams.

## Requirements

- Candidates can chat with AI while solving certain problems
- Admin controls AI access per problem (enable/disable)
- Support multiple AI providers (Claude, OpenAI, etc.)
- Admin selects which model to use
- Configurable system prompt and message limits
- Settings on Problem (defaults) can be overridden on ExamProblem (per exam)
- API keys via environment variables, with optional admin dashboard override

## Data Model

### New Model: AIProvider

Stores configured AI providers with optional API key override.

```prisma
model AIProvider {
  id        String   @id @default(uuid())
  name      String   @unique  // "claude", "openai", "gemini"
  label     String            // "Claude (Anthropic)", "GPT-4 (OpenAI)"
  apiKey    String?           // encrypted, overrides env var if set
  isEnabled Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("ai_providers")
}
```

### Problem Model - New Fields

Default AI settings for the problem.

```prisma
// Add to existing Problem model
aiEnabled       Boolean  @default(false) @map("ai_enabled")
aiProviderId    String?  @map("ai_provider_id")
aiProvider      AIProvider? @relation(fields: [aiProviderId], references: [id])
aiSystemPrompt  String?  @map("ai_system_prompt")
aiMaxMessages   Int?     @map("ai_max_messages")
```

### ExamProblem Model - New Fields

Per-exam overrides (null = use Problem defaults).

```prisma
// Add to existing ExamProblem model
aiEnabled       Boolean? @map("ai_enabled")
aiProviderId    String?  @map("ai_provider_id")
aiProvider      AIProvider? @relation(fields: [aiProviderId], references: [id])
aiSystemPrompt  String?  @map("ai_system_prompt")
aiMaxMessages   Int?     @map("ai_max_messages")
```

### New Model: AIMessage

Stores chat history per candidate session and problem.

```prisma
model AIMessage {
  id        String      @id @default(uuid())
  sessionId String      @map("session_id")
  session   ExamSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  problemId String      @map("problem_id")
  problem   Problem     @relation(fields: [problemId], references: [id], onDelete: Cascade)
  role      String      // "user" | "assistant"
  content   String
  createdAt DateTime    @default(now()) @map("created_at")

  @@index([sessionId, problemId])
  @@map("ai_messages")
}
```

## AI Service Layer

### Provider Abstraction

`src/lib/ai/types.ts`:
```typescript
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AIProviderClient {
  chat(messages: Message[], systemPrompt?: string): Promise<string>;
}
```

### Provider Implementations

`src/lib/ai/providers/`:
- `claude.ts` - Uses @anthropic-ai/sdk
- `openai.ts` - Uses openai sdk
- `index.ts` - Factory function to get provider by name

### Main Service

`src/lib/ai/service.ts`:
- `getAIConfig(problemId, examId?)` - Resolves effective AI settings (with overrides)
- `getProviderClient(providerId)` - Gets provider with API key (env or db)
- `chat(sessionId, problemId, message)` - Main chat function

### API Route

`POST /api/exam/chat`:

Request:
```typescript
{
  sessionId: string;
  problemId: string;
  message: string;
}
```

Response:
```typescript
{
  reply: string;
  messagesRemaining: number | null; // null = unlimited
}
```

Flow:
1. Validate session is active
2. Get AI config for problem (with exam overrides)
3. Check AI is enabled
4. Check message limit not exceeded
5. Load chat history from AIMessage
6. Call AI provider
7. Save user message and AI reply to AIMessage
8. Return response

## Admin UI

### 1. AI Providers Page (`/admin/settings/ai`)

- List all providers (Claude, OpenAI, Gemini, etc.)
- Per provider:
  - Enable/disable toggle
  - API key input (masked, optional - overrides env var)
  - Test connection button
- Pre-seeded providers on first run

### 2. Problem Form - AI Section

New collapsible section "AI Assistance":
- Toggle: Enable AI Assistance (default: off)
- Dropdown: AI Provider (only enabled providers shown)
- Textarea: System Prompt (optional)
  - Placeholder: "You are a helpful coding tutor..."
- Number: Max Messages (optional, blank = unlimited)

### 3. Exam Problem Editor - AI Overrides

When adding/editing problem in exam:
- Checkbox: "Use problem defaults" (default: checked)
- If unchecked, show override fields:
  - Toggle: AI Enabled
  - Dropdown: AI Provider
  - Textarea: System Prompt
  - Number: Max Messages

## Candidate UI

### Chat Side Panel

Layout when AI is enabled for current problem:
```
+------------------+------------------+------------------+
|     Sidebar      |   Code Editor    |    AI Chat       |
|                  |                  |                  |
|  Problem 1       |  [Monaco]        |  [Messages]      |
|  Problem 2 ✓     |                  |                  |
|  Problem 3       |                  |  [Input box]     |
|                  |                  |  [Send button]   |
+------------------+------------------+------------------+
```

### Behavior

- Panel only visible when AI enabled for current problem
- Shows remaining messages if limit set: "3 messages left"
- Chat history persists per problem (from database)
- Loading state while AI responds
- Switching problems loads that problem's chat history
- Panel hidden (not disabled) when AI not enabled

### Components

- `AIChatPanel` - Main container with message list and input
- `AIChatMessage` - Individual message bubble (user/assistant styling)
- `AIChatInput` - Input box with send button, disabled states

## Environment Variables

```env
# AI Provider API Keys (defaults, can be overridden in admin)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional: Default provider if not set per problem
DEFAULT_AI_PROVIDER=claude
```

## Implementation Order

1. **Schema** - Add new models and fields to Prisma
2. **AI Service** - Provider abstraction and implementations
3. **API Route** - `/api/exam/chat` endpoint
4. **Admin: Providers Page** - Configure API keys and enable providers
5. **Admin: Problem Form** - Add AI settings section
6. **Admin: Exam Problem** - Add AI override fields
7. **Candidate: Chat Panel** - UI components and integration

## Security Considerations

- API keys encrypted at rest in database
- Rate limiting on chat endpoint
- Message limits enforced server-side
- Chat history tied to valid exam session
- No direct exposure of API keys to frontend
