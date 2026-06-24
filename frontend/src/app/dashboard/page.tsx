"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalyticsApi, listModelsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { token } = useAuthStore();

  const { data: analytics } = useQuery({
    queryKey: ["analytics", token],
    queryFn: () => getAnalyticsApi(token!),
    enabled: !!token,
  });

  const { data: models } = useQuery({
    queryKey: ["models", token],
    queryFn: () => listModelsApi(token!),
    enabled: !!token,
  });

  const stats = [
    {
      label: "Documents Processed",
      value: analytics?.total_documents ?? "–",
      icon: "📄",
    },
    {
      label: "Summaries Generated",
      value: analytics?.total_summaries ?? "–",
      icon: "✦",
    },
    {
      label: "Avg Inference Time",
      value: analytics
        ? `${analytics.avg_inference_time_ms.toFixed(0)} ms`
        : "–",
      icon: "⚡",
    },
    {
      label: "Available Models",
      value: models?.length ?? "–",
      icon: "🤖",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="flex-1 p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <span className="text-2xl">{stat.icon}</span>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Model Usage Table */}
        {analytics?.model_usage && analytics.model_usage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.model_usage.map((item) => {
                  const total = analytics.model_usage.reduce(
                    (a, b) => a + b.count,
                    0
                  );
                  const pct = Math.round((item.count / total) * 100);
                  return (
                    <div key={item.model_name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground font-mono truncate max-w-xs">
                          {item.model_name}
                        </span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
