export const leadStatuses = ["New", "Contacted", "Qualified", "Visit Booked", "Closed", "Lost"] as const;
export type LeadStatus = (typeof leadStatuses)[number];
export const leadSources = ["Meta Ads", "Website", "Referral", "Walk-in", "Google Ads", "Other"] as const;
export type LeadSource = (typeof leadSources)[number];
export type AIReview = {
  priority: "High" | "Medium" | "Low";
  summary: string;
  questions: string[];
  nextStep: string;
  draftMessage: string;
  analyzedAt: string;
};
export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  budget: string;
  propertyType: string;
  source: LeadSource;
  interest: string;
  status: LeadStatus;
  createdAt: string;
  note: string;
  aiReview?: AIReview | null;
};
export type NewLead = Pick<Lead, "name" | "email" | "phone" | "city" | "budget" | "propertyType" | "source" | "interest">;
