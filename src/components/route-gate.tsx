"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LeadProvider } from "@/components/lead-provider";
import { AuthGate } from "@/components/auth-gate";
import { AppShell } from "@/components/app-shell";

/** The buyer-facing chatbot is intentionally outside the staff-only auth shell. */
export function RouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/chat/")) return <>{children}</>;
  return (
    <LeadProvider>
      <AuthGate><AppShell>{children}</AppShell></AuthGate>
    </LeadProvider>
  );
}
