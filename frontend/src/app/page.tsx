"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ── 3D Tilt Card Component ────────────────────────────────────────────────
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the motion
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Map mouse position to rotation (max 10 degrees)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Calculate mouse position relative to center (-0.5 to 0.5)
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative rounded-xl transition-all duration-200 ease-in-out hover:shadow-2xl hover:shadow-primary/20 ${className}`}
    >
      {/* Inner wrapper to give depth */}
      <div style={{ transform: "translateZ(30px)" }} className="h-full">
        {children}
      </div>
    </motion.div>
  );
}

// ── Background Glow ───────────────────────────────────────────────────────
function BackgroundGlow() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
      style={{
        background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.07), transparent 40%)`,
      }}
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 overflow-hidden relative font-sans selection:bg-indigo-500/30">
      <BackgroundGlow />

      {/* Top Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">
            C
          </div>
          <span className="font-semibold text-lg tracking-tight">ConvoSum</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Sign in
          </Link>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 rounded-full px-6">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Introducing Enterprise Summarization</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            Summarize Intelligence <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 animate-pulse">
              at Scale
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            ConvoSum compresses long-form documents into precise, structured insight using ensemble inference across FLAN-T5, BART, Pegasus, and GPT-class models.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="h-12 px-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-base shadow-lg shadow-indigo-600/25 group">
              <Link href="/register">
                Start free trial 
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-full border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-sm text-base">
              <Link href="/dashboard">View live demo</Link>
            </Button>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-32 perspective-[1000px]">
          
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <TiltCard className="h-full">
              <Card className="h-full bg-slate-900/40 backdrop-blur-xl border-slate-800/50 hover:border-indigo-500/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-4 border border-indigo-500/20">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                  </div>
                  <CardTitle className="text-xl text-slate-100">Multi-Model AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base leading-relaxed">
                    Route across FLAN-T5, BART, Pegasus, and GPT to pick the right model per document type.
                  </CardDescription>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
            <TiltCard className="h-full">
              <Card className="h-full bg-slate-900/40 backdrop-blur-xl border-slate-800/50 hover:border-purple-500/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20">
                    <Zap className="w-6 h-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-xl text-slate-100">Instant Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base leading-relaxed">
                    Sub-second inference with cached embeddings and streaming output to the workspace.
                  </CardDescription>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}>
            <TiltCard className="h-full">
              <Card className="h-full bg-slate-900/40 backdrop-blur-xl border-slate-800/50 hover:border-emerald-500/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 border border-emerald-500/20">
                    <Activity className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-xl text-slate-100">Enterprise Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base leading-relaxed">
                    Track model usage, latency, and quality across teams with audit-ready dashboards.
                  </CardDescription>
                </CardContent>
              </Card>
            </TiltCard>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
