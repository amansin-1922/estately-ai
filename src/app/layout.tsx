import type { Metadata } from "next";
import { RouteGate } from "@/components/route-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estately AI | Technorich AI Solutions",
  description: "Private real estate lead intelligence, verified property matching and site-visit scheduling by Technorich AI Solutions.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><RouteGate>{children}</RouteGate></body></html>;
}
