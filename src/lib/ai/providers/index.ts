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
