"use client";

import Editor, { type OnChange } from "@monaco-editor/react";
import { useCallback } from "react";

export type SupportedLanguage = "python" | "java" | "cpp" | "go";

const LANGUAGE_MAP: Record<SupportedLanguage, string> = {
  python: "python",
  java: "java",
  cpp: "cpp",
  go: "go",
};

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: SupportedLanguage;
  readOnly?: boolean;
  height?: string;
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  height = "400px",
}: CodeEditorProps) {
  const handleChange: OnChange = useCallback(
    (newValue) => {
      onChange(newValue ?? "");
    },
    [onChange]
  );

  return (
    <Editor
      height={height}
      language={LANGUAGE_MAP[language]}
      value={value}
      onChange={handleChange}
      theme="vs-dark"
      options={{
        readOnly,
        lineNumbers: "on",
        minimap: { enabled: false },
        wordWrap: "on",
        fontSize: 14,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        formatOnPaste: true,
        formatOnType: true,
      }}
    />
  );
}
