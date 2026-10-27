import type { Lead } from "./types";
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString();
export function seedLeads(): Lead[] {
  return [
    { id:"demo-01", name:"Riya Sharma", email:"riya@example.com", phone:"+91 90000 00001", city:"Patna", budget:"₹80L–₹1.2Cr", propertyType:"3 BHK Apartment", source:"Meta Ads", interest:"Interested in a 3 BHK near Bailey Road", status:"Qualified", createdAt:minutesAgo(15), note:"Would like to visit this weekend." },
    { id:"demo-02", name:"Arjun Mehta", email:"arjun@example.com", phone:"+91 90000 00002", city:"Patna", budget:"₹50L–₹80L", propertyType:"2 BHK Apartment", source:"Website", interest:"Looking for a ready-to-move flat", status:"New", createdAt:minutesAgo(64), note:"" },
    { id:"demo-03", name:"Sneha Kapoor", email:"sneha@example.com", phone:"+91 90000 00003", city:"Noida", budget:"₹1.2Cr–₹2Cr", propertyType:"Villa", source:"Referral", interest:"Independent villa with parking", status:"Visit Booked", createdAt:minutesAgo(210), note:"Demo visit booking; no real calendar integration." },
    { id:"demo-04", name:"Kabir Sinha", email:"kabir@example.com", phone:"+91 90000 00004", city:"Patna", budget:"₹30L–₹50L", propertyType:"Plot", source:"Meta Ads", interest:"Residential plot around Danapur", status:"Contacted", createdAt:minutesAgo(390), note:"Requested brochure." },
    { id:"demo-05", name:"Aditi Verma", email:"aditi@example.com", phone:"+91 90000 00005", city:"Lucknow", budget:"₹80L–₹1.2Cr", propertyType:"3 BHK Apartment", source:"Google Ads", interest:"Investment property", status:"Closed", createdAt:minutesAgo(1500), note:"Sample completed sale." },
    { id:"demo-06", name:"Dev Malhotra", email:"dev@example.com", phone:"+91 90000 00006", city:"Patna", budget:"₹50L–₹80L", propertyType:"2 BHK Apartment", source:"Website", interest:"Near schools and public transport", status:"New", createdAt:minutesAgo(1700), note:"" },
    { id:"demo-07", name:"Meera Nair", email:"meera@example.com", phone:"+91 90000 00007", city:"Bengaluru", budget:"₹2Cr+", propertyType:"Villa", source:"Referral", interest:"Premium gated community", status:"Qualified", createdAt:minutesAgo(2900), note:"Wants a virtual walkthrough." },
    { id:"demo-08", name:"Aditya Rao", email:"aditya@example.com", phone:"+91 90000 00008", city:"Patna", budget:"₹30L–₹50L", propertyType:"Plot", source:"Walk-in", interest:"Corner plot", status:"Lost", createdAt:minutesAgo(4800), note:"Budget mismatch." }
  ];
}
