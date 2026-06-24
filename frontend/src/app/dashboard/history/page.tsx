"use client";

import { useQuery } from "@tanstack/react-query";
import { getHistoryApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent } from "@/components/ui/card";

export default function HistoryPage() {
  const { token } = useAuthStore();

  const { data: history, isLoading } = useQuery({
    queryKey: ["history", token],
    queryFn: () => getHistoryApi(token!),
    enabled: !!token,
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="History" />
      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-muted-foreground animate-pulse">Loading…</span>
          </div>
        ) : !history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
            <span className="text-5xl">◷</span>
            <p className="text-muted-foreground">No summaries generated yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {history.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                        {item.generated_summary}
                      </p>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {item.model_name.split("/").pop()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.inference_time_ms.toFixed(0)} ms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
