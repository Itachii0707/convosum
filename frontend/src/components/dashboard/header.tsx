"use client";

import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function Header({ title }: { title: string }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-border/50 px-6 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-40">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground hidden md:block">
          {user?.full_name ?? user?.email ?? "User"}
        </span>
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
          {(user?.full_name ?? user?.email ?? "U")[0].toUpperCase()}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
