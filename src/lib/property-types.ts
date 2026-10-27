export type PropertyStatus = "Active" | "Paused" | "Sold";
export type Property = {
  id: string;
  user_id: string;
  title: string;
  city: string;
  locality: string;
  price_inr: number;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number | null;
  description: string;
  amenities: string[];
  image_url: string | null;
  listing_status: PropertyStatus;
  created_at: string;
};
export type VisitSlot = {
  id: string;
  property_id: string;
  user_id: string;
  starts_at: string;
  ends_at: string;
};
export type VisitStatus = "Requested" | "Confirmed" | "Completed" | "Cancelled";
export type SiteVisit = {
  id: string;
  user_id: string;
  lead_id: string;
  property_id: string;
  slot_id: string;
  status: VisitStatus;
  notes: string;
  created_at: string;
};
export function inr(value: number) {
  return "₹" + Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
export function dateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
export function validPhotoUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && value.length <= 500 ? url.toString() : null;
  } catch { return null; }
}
