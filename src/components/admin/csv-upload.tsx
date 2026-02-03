"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Copy, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ImportResult } from "@/lib/candidates/schemas";

interface CSVUploadProps {
  examId: string;
  baseUrl: string;
}

export function CSVUpload({ examId, baseUrl }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
      setError(null);
      setResult(null);
    } else {
      setError("Please drop a CSV file");
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      }
    },
    []
  );

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/admin/exams/${examId}/import`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Import failed");
      }

      setResult(data as ImportResult);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = async (index: number, token: string) => {
    const link = `${baseUrl}/exam/join/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadLinks = () => {
    if (!result) return;

    const headers = ["Name", "Email", "Link"];
    const rows = result.imported.map((c) => [
      c.name,
      c.email,
      `${baseUrl}/exam/join/${c.token}`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidate-links-${examId}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!result && (
        <Card
          className={`p-8 border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                {file ? file.name : "Drop CSV file here"}
              </p>
              <p className="text-sm text-muted-foreground">or click to browse</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" asChild>
                <span>Select File</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">
              Format: name,email (max 1MB)
            </p>
          </div>
        </Card>
      )}

      {/* Selected File */}
      {file && !result && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Importing..." : "Import"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive">
          <p className="text-destructive">{error}</p>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-lg font-medium">Import Complete</p>
                <p className="text-sm text-muted-foreground">
                  {result.summary.imported} imported, {result.summary.failed}{" "}
                  failed
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadLinks}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Links
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Import More
                </Button>
              </div>
            </div>
          </Card>

          {/* Imported Candidates */}
          {result.imported.length > 0 && (
            <Card className="p-4">
              <h3 className="font-medium mb-3">
                Imported Candidates ({result.imported.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.imported.map((candidate, index) => (
                  <div
                    key={candidate.token}
                    className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-md"
                  >
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {candidate.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(index, candidate.token)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedIndex === index ? "Copied" : "Copy Link"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Failed Rows */}
          {result.failed.length > 0 && (
            <Card className="p-4 border-destructive/50">
              <h3 className="font-medium mb-3 text-destructive">
                Failed Rows ({result.failed.length})
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.failed.map((failure, index) => (
                  <div
                    key={index}
                    className="py-2 px-3 bg-destructive/5 rounded-md"
                  >
                    <p className="text-sm">
                      <span className="font-medium">Row {failure.row}:</span>{" "}
                      {failure.name || "(empty)"} - {failure.email || "(empty)"}
                    </p>
                    <p className="text-sm text-destructive">{failure.error}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
