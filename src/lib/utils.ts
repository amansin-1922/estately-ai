import type { Lead, LeadStatus } from "./types";
export const initials = (value: string) => value.split(/\s+/).filter(Boolean).slice(0,2).map((word) => word[0].toUpperCase()).join("");
export function relativeTime(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now()-new Date(iso).getTime())/60000));
  if(minutes < 1) return "Just now";
  if(minutes < 60) return `${minutes}m ago`;
  if(minutes < 1440) return `${Math.floor(minutes/60)}h ago`;
  return `${Math.floor(minutes/1440)}d ago`;
}
export function statusClass(status: LeadStatus) {
  return ({"New":"status-blue", "Contacted":"status-orange", "Qualified":"status-purple", "Visit Booked":"status-teal", "Closed":"status-green", "Lost":"status-gray"} as const)[status];
}
function csvValue(value: string) { return `"${value.replace(/"/g,'""')}"`; }
export function csvLeads(leads: Lead[]): string {
  const header = ["Name","Email","Phone","City","Budget","Property","Source","Interest","Status","Created At","Notes"];
  const lines = leads.map(l => [l.name,l.email,l.phone,l.city,l.budget,l.propertyType,l.source,l.interest,l.status,l.createdAt,l.note].map(csvValue).join(","));
  return "\uFEFF" + header.join(",") + "\r\n" + lines.join("\r\n");
}
