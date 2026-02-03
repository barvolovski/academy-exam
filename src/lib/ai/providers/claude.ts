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
