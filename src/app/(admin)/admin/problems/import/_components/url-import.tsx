"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { importLeetCodeProblemFromUrl } from "@/lib/leetcode/actions";

export function UrlImport() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleImport = () => {
    setError(null);
    startTransition(async () => {
      const result = await importLeetCodeProblemFromUrl(url);
      if ("error" in result) {
        setError(result.error ?? "Failed to import");
      } else {
        router.push(`/admin/problems/${result.id}`);
      }
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">LeetCode Problem URL</Label>
          <Input
            id="url"
            placeholder="https://leetcode.com/problems/two-sum/"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Paste a LeetCode problem URL to import it automatically
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button onClick={handleImport} disabled={isPending || !url.trim()}>
          {isPending ? "Importing..." : "Import Problem"}
        </Button>
      </div>
    </Card>
  );
}
