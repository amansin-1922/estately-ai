"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useLeads } from "@/components/lead-provider";
import { LeadDetail, LeadTable } from "@/components/lead-table";
import { csvLeads } from "@/lib/utils";
import { leadStatuses } from "@/lib/types";
function exportCsv(csv:string){const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="technorich-leads.csv";a.click();URL.revokeObjectURL(url);}
export default function LeadsPage(){
  const {leads,ready}=useLeads(); const [query,setQuery]=useState("");const [status,setStatus]=useState("All statuses");const [selectedId,setSelectedId]=useState<string|null>(null);
  const filtered=useMemo(()=>leads.filter(l=>[l.name,l.phone,l.email,l.city,l.interest,l.propertyType].join(" ").toLowerCase().includes(query.toLowerCase())&&(status==="All statuses"||l.status===status)).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[leads,query,status]);const selected=leads.find(l=>l.id===selectedId);
  return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> YOUR SALES PIPELINE</span><h1>All enquiries</h1><p>Organize and manage every potential property buyer in one place.</p></div><div className="heading-actions"><button className="btn btn-outline" disabled={!filtered.length} onClick={()=>exportCsv(csvLeads(filtered))}><Download size={16}/> Export CSV</button><Link href="/enquiry" className="btn btn-dark"><Plus size={17}/> Add enquiry</Link></div></div>
  <section className="panel leads-page-panel"><div className="leads-toolbar"><div className="search-input"><Search size={18}/><input aria-label="Search leads" placeholder="Search by name, phone, city, property..." value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="filter-select"><SlidersHorizontal size={16}/><select aria-label="Filter by lead status" value={status} onChange={e=>setStatus(e.target.value)}><option>All statuses</option>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select></div></div><div className="results-bar"><span>{ready?filtered.length:"—"} of {ready?leads.length:"—"} enquiries</span><span className="hint">Click a lead to view details · Change status directly in the table</span></div><LeadTable leads={filtered} onSelect={l=>setSelectedId(l.id)}/></section>
  {selected&&<LeadDetail key={selected.id} lead={selected} onClose={()=>setSelectedId(null)}/>}</div>;
}
