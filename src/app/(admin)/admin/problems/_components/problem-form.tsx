"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { CodeEditor, type SupportedLanguage } from "@/components/editor/code-editor";
import {
  createProblem,
  updateProblem,
  type ActionState,
} from "@/lib/problems/actions";
import type { StarterCode, TestCase } from "@/lib/problems/schemas";
import { Trash2, Plus } from "lucide-react";

const DEFAULT_STARTER_CODE: StarterCode = {
  python: 'def solution():\n    pass',
  java: 'class Solution {\n    \n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}',
  go: 'package main\n\nfunc main() {\n    \n}',
};

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
];

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

export function ProblemForm({ initialData, aiProviders }: ProblemFormProps) {
  const isEditing = !!initialData;

  const boundUpdateProblem = initialData
    ? updateProblem.bind(null, initialData.id)
    : null;

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    isEditing ? boundUpdateProblem! : createProblem,
    null
  );

  const [starterCode, setStarterCode] = useState<StarterCode>(
    initialData?.starterCode ?? DEFAULT_STARTER_CODE
  );

  const [testCases, setTestCases] = useState<TestCase[]>(
    initialData?.testCases ?? [{ input: "", expected: "", hidden: false }]
  );

  const [difficulty, setDifficulty] = useState<string>(
    initialData?.difficulty ?? ""
  );

  const [aiEnabled, setAiEnabled] = useState(initialData?.aiEnabled ?? false);
  const [aiProviderId, setAiProviderId] = useState(initialData?.aiProviderId ?? "");
  const [aiSystemPrompt, setAiSystemPrompt] = useState(initialData?.aiSystemPrompt ?? "");
  const [aiMaxMessages, setAiMaxMessages] = useState<string>(
    initialData?.aiMaxMessages?.toString() ?? ""
  );

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expected: "", hidden: false }]);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter((_, i) => i !== index));
    }
  };

  const updateTestCase = (
    index: number,
    field: keyof TestCase,
    value: string | boolean
  ) => {
    setTestCases(
      testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      )
    );
  };

  const updateStarterCode = (language: SupportedLanguage, code: string) => {
    setStarterCode((prev) => ({ ...prev, [language]: code }));
  };

  return (
    <form action={formAction} className="space-y-8">
      {state?.message && !state.errors && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          {state.message}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={initialData?.title}
              placeholder="Two Sum"
            />
            {state?.errors?.title && (
              <p className="text-sm text-destructive">{state.errors.title[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select
              name="difficulty"
              value={difficulty}
              onValueChange={setDifficulty}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            {state?.errors?.difficulty && (
              <p className="text-sm text-destructive">
                {state.errors.difficulty[0]}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Markdown)</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={initialData?.description}
            placeholder="Given an array of integers..."
            rows={8}
          />
          {state?.errors?.description && (
            <p className="text-sm text-destructive">
              {state.errors.description[0]}
            </p>
          )}
        </div>
      </div>

      {/* Execution Limits */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Execution Limits</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timeLimitMs">Time Limit (ms)</Label>
            <Input
              id="timeLimitMs"
              name="timeLimitMs"
              type="number"
              defaultValue={initialData?.timeLimitMs ?? 2000}
              min={100}
              max={10000}
            />
            {state?.errors?.timeLimitMs && (
              <p className="text-sm text-destructive">
                {state.errors.timeLimitMs[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="memoryLimitKb">Memory Limit (KB)</Label>
            <Input
              id="memoryLimitKb"
              name="memoryLimitKb"
              type="number"
              defaultValue={initialData?.memoryLimitKb ?? 262144}
              min={1024}
              max={524288}
            />
            {state?.errors?.memoryLimitKb && (
              <p className="text-sm text-destructive">
                {state.errors.memoryLimitKb[0]}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Starter Code */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Starter Code</h2>

        <Tabs defaultValue="python">
          <TabsList>
            {LANGUAGES.map((lang) => (
              <TabsTrigger key={lang.value} value={lang.value}>
                {lang.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {LANGUAGES.map((lang) => (
            <TabsContent key={lang.value} value={lang.value}>
              <div className="border rounded-md overflow-hidden">
                <CodeEditor
                  value={starterCode[lang.value]}
                  onChange={(code) => updateStarterCode(lang.value, code)}
                  language={lang.value}
                  height="200px"
                />
              </div>
              <input
                type="hidden"
                name={`starterCode.${lang.value}`}
                value={starterCode[lang.value]}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Test Cases */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Test Cases</h2>
          <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
            <Plus className="h-4 w-4 mr-1" />
            Add Test Case
          </Button>
        </div>

        {state?.errors?.testCases && (
          <p className="text-sm text-destructive">{state.errors.testCases[0]}</p>
        )}

        <div className="space-y-4">
          {testCases.map((testCase, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Test Case {index + 1}
                </span>
                {testCases.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTestCase(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Input</Label>
                  <Textarea
                    value={testCase.input}
                    onChange={(e) =>
                      updateTestCase(index, "input", e.target.value)
                    }
                    placeholder="5&#10;3"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Expected Output</Label>
                  <Textarea
                    value={testCase.expected}
                    onChange={(e) =>
                      updateTestCase(index, "expected", e.target.value)
                    }
                    placeholder="8"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`hidden-${index}`}
                  checked={testCase.hidden}
                  onChange={(e) =>
                    updateTestCase(index, "hidden", e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor={`hidden-${index}`} className="text-sm font-normal">
                  Hidden (not shown to candidates)
                </Label>
              </div>
            </Card>
          ))}
        </div>

        <input type="hidden" name="testCases" value={JSON.stringify(testCases)} />
      </div>

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

      {/* Submit */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEditing
              ? "Saving..."
              : "Creating..."
            : isEditing
              ? "Save Changes"
              : "Create Problem"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/problems">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
