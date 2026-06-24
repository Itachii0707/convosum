"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

import { loginApi, getMeApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ── Validation schema ──────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Component ──────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    try {
      const { access_token } = await loginApi(data.email, data.password);
      setToken(access_token);
      const me = await getMeApi(access_token);
      setUser(me);
      router.push("/dashboard");
    } catch (err) {
      setServerError((err as Error).message ?? "Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
              C
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your dashboard
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="grid gap-4">
            {/* Server-level error */}
            {serverError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⟳</span> Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
