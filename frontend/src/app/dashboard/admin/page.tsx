"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { listModelsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Header } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DATASETS = ["samsum", "cnn_dailymail", "xsum"];

export default function AdminPage() {
  const { token, user } = useAuthStore();
  const [selectedModel, setSelectedModel] = useState("google/flan-t5-base");
  const [selectedDataset, setSelectedDataset] = useState("samsum");
  const [taskInfo, setTaskInfo] = useState<{
    task_id: string;
    status: string;
  } | null>(null);

  const { data: models = [] } = useQuery({
    queryKey: ["models", token],
    queryFn: () => listModelsApi(token!),
    enabled: !!token,
  });

  const trainMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/train/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            model_name: selectedModel,
            dataset_name: selectedDataset,
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? "Training request failed");
      }
      return res.json();
    },
    onSuccess: (data) => setTaskInfo(data),
  });

  if (!user?.is_superuser) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Admin" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-5xl">🔒</p>
            <p className="text-muted-foreground">
              Admin access is restricted to superusers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Admin Panel" />
      <div className="flex-1 p-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Trigger Model Fine-Tuning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-model">Base Model</Label>
              <select
                id="admin-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin-dataset">Dataset</Label>
              <select
                id="admin-dataset"
                value={selectedDataset}
                onChange={(e) => setSelectedDataset(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {DATASETS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => trainMutation.mutate()}
              disabled={trainMutation.isPending}
              className="w-full"
            >
              {trainMutation.isPending ? "Queuing…" : "🚀 Start Training Job"}
            </Button>
            {trainMutation.isError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                {(trainMutation.error as Error).message}
              </div>
            )}
            {taskInfo && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-sm space-y-1">
                <p>
                  <span className="font-semibold">Task ID:</span>{" "}
                  <code className="font-mono text-xs">{taskInfo.task_id}</code>
                </p>
                <p>
                  <span className="font-semibold">Status:</span> {taskInfo.status}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
