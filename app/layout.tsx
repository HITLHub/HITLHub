import "./globals.css";
import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = { title: "HITLHub Demo", description: "The human decision layer for AI agents" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><TooltipProvider>{children}</TooltipProvider></body></html>;
}
