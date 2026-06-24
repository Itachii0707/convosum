"use client";

import { useQuery } from "@tanstack/react-query";
import { getAnalyticsApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const { token } = useAuthStore();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", token],
    queryFn: () => getAnalyticsApi(token!),
    enabled: !!token,
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" />
      <div className="flex-1 p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Documents", value: analytics?.total_documents ?? "–" },
            { label: "Total Summaries", value: analytics?.total_summaries ?? "–" },
            {
              label: "Avg Inference Time",
              value: analytics
                ? `${analytics.avg_inference_time_ms.toFixed(0)} ms`
                : "–",
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summaries by Model</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground animate-pulse">
                Loading chart…
              </div>
            ) : analytics?.model_usage && analytics.model_usage.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={analytics.model_usage.map((m) => ({
                    name: m.model_name.split("/").pop(),
                    count: m.count,
                  }))}
                  margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data yet — start summarizing!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
