import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "ConvoSum — Enterprise Dialogue Summarization",
    template: "%s | ConvoSum",
  },
  description:
    "AI-powered enterprise dialogue summarization platform. Generate accurate summaries from meetings, customer support chats, and transcripts using state-of-the-art models.",
  keywords: ["AI", "summarization", "NLP", "FLAN-T5", "BART", "dialogue"],
  authors: [{ name: "ConvoSum" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
