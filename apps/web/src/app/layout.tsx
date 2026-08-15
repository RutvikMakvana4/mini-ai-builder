import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "mini-ai-builder",
  description: "From prompt to production-ready app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white font-mono min-h-screen antialiased">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}