"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { CodeEditor, type SupportedLanguage } from "@/components/editor";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CodeViewerProps {
  code: string;
  language: string;
  testResults: Array<{ passed: boolean; output: string }> | null;
}

function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return ["python", "java", "cpp", "go"].includes(lang);
}

export function CodeViewer({ code, language, testResults }: CodeViewerProps) {
  const supportedLanguage = isSupportedLanguage(language) ? language : "python";

  const passedCount = testResults?.filter((t) => t.passed).length ?? 0;
  const totalCount = testResults?.length ?? 0;
  const allPassed = passedCount === totalCount && totalCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-xs">
          {language}
        </Badge>
        {testResults && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                allPassed ? "text-green-600" : "text-amber-600"
              )}
            >
              {passedCount} / {totalCount} tests passed
            </span>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <CodeEditor
          value={code}
          onChange={() => {}}
          language={supportedLanguage}
          readOnly={true}
          height="300px"
        />
      </div>

      {testResults && testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Test Results</h4>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 p-3 rounded-lg text-sm",
                  result.passed
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                )}
              >
                {result.passed ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-medium">Test {index + 1}</span>
                  {result.output && (
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap break-words">
                      {result.output}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
