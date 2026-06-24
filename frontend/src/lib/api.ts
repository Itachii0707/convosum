const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...rest } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail ?? "API Error");
  }
  return res.json() as Promise<T>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function loginApi(email: string, password: string) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Login failed");
  }
  return res.json() as Promise<{ access_token: string; token_type: string }>;
}

export async function registerApi(data: {
  email: string;
  password: string;
  full_name?: string;
}) {
  return apiFetch<{ id: number; email: string }>("/users/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMeApi(token: string) {
  return apiFetch<{
    id: number;
    email: string;
    full_name: string | null;
    is_superuser: boolean;
  }>("/users/me", { token });
}

// ─── Summarization ───────────────────────────────────────────────────────────

export interface SummaryResponse {
  id: number;
  document_id: number;
  model_name: string;
  generated_summary: string;
  inference_time_ms: number;
}

export async function summarizeTextApi(
  text: string,
  model_name: string,
  token: string
): Promise<SummaryResponse> {
  return apiFetch<SummaryResponse>("/summarize/", {
    method: "POST",
    token,
    body: JSON.stringify({ text, model_name }),
  });
}

export async function summarizeFileApi(
  file: File,
  model_name: string,
  token: string
): Promise<SummaryResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("model_name", model_name);
  const res = await fetch(`${BASE_URL}/summarize/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }
  return res.json() as Promise<SummaryResponse>;
}

export async function getHistoryApi(
  token: string,
  skip = 0,
  limit = 20
): Promise<SummaryResponse[]> {
  return apiFetch<SummaryResponse[]>(
    `/summarize/history?skip=${skip}&limit=${limit}`,
    { token }
  );
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export async function getAnalyticsApi(token: string) {
  return apiFetch<{
    total_documents: number;
    total_summaries: number;
    avg_inference_time_ms: number;
    model_usage: { model_name: string; count: number }[];
  }>("/analytics/", { token });
}

// ─── Models ──────────────────────────────────────────────────────────────────

export async function listModelsApi(token: string) {
  return apiFetch<
    { name: string; version: string; framework: string; is_active: boolean }[]
  >("/models/", { token });
}
