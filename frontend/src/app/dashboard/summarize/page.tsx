"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  summarizeTextApi,
  summarizeFileApi,
  listModelsApi,
  SummaryResponse,
} from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InputMode = "text" | "file";

export default function SummarizePage() {
  const { token } = useAuthStore();
  const [mode, setMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/flan-t5-base");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: models = [] } = useQuery({
    queryKey: ["models", token],
    queryFn: () => listModelsApi(token!),
    enabled: !!token,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === "text") {
        return summarizeTextApi(text, selectedModel, token!);
      } else {
        if (!uploadedFile) throw new Error("No file selected");
        return summarizeFileApi(uploadedFile, selectedModel, token!);
      }
    },
    onSuccess: (data) => setResult(data),
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const copyToClipboard = () => {
    if (result) navigator.clipboard.writeText(result.generated_summary);
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Summarize" />

      <div className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            {(["text", "file"] as InputMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "text" ? "✏ Text" : "📎 File"}
              </button>
            ))}
          </div>

          {/* Model selector */}
          <div className="space-y-1.5">
            <Label htmlFor="model-select">Model</Label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Text or File input */}
          {mode === "text" ? (
            <div className="space-y-1.5">
              <Label htmlFor="dialogue-input">Dialogue / Transcript</Label>
              <textarea
                id="dialogue-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your conversation, meeting transcript, or document here..."
                rows={14}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {text.length} characters
              </p>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl h-56 cursor-pointer transition-colors",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              )}
            >
              <span className="text-4xl">
                {uploadedFile ? "✅" : "📁"}
              </span>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {uploadedFile ? uploadedFile.name : "Drop a file here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, TXT, CSV
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUploadedFile(f);
                }}
              />
            </div>
          )}

          <Button
            className="w-full h-11"
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              (mode === "text" ? !text.trim() : !uploadedFile)
            }
          >
            {mutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span> Summarizing…
              </span>
            ) : (
              "✦ Generate Summary"
            )}
          </Button>

          {mutation.isError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {(mutation.error as Error).message}
            </div>
          )}
        </div>

        {/* Result Panel */}
        <Card className={cn("flex flex-col transition-opacity", result ? "opacity-100" : "opacity-60")}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Generated Summary</CardTitle>
            {result && (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
                  {result.inference_time_ms.toFixed(0)} ms
                </span>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  Copy
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {result ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {result.generated_summary}
                </p>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground font-mono">
                    Model: {result.model_name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center min-h-[300px]">
                <span className="text-5xl">✦</span>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Your generated summary will appear here after you submit a
                  dialogue or document.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
