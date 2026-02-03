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
