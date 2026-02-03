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
