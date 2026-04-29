import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Campus Map",
  description: "Interactive campus map editor and viewer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>
          <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
          <Toaster richColors position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
