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
