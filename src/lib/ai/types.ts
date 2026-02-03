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
