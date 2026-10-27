"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, CalendarCheck2, CheckCircle2, Clock3, Download, ListFilter, MessageSquareText, Plus, Sparkles, TrendingUp, Users } from "lucide-react";
import { useLeads } from "@/components/lead-provider";
import { LeadDetail, LeadTable } from "@/components/lead-table";
import { csvLeads, relativeTime } from "@/lib/utils";
import type { Lead } from "@/lib/types";
function exportCsv(leads:Lead[]) { const blob=new Blob([csvLeads(leads)],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="technorich-leads.csv";a.click();URL.revokeObjectURL(url); }
const week = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
function WeeklyBars({leads}:{leads:Lead[]}) {
  const data=useMemo(()=>{
    const now=new Date();const dow=(now.getDay()+6)%7; const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-dow);monday.setHours(0,0,0,0);
    return Array.from({length:7},(_,i)=>leads.filter(l=>{const d=new Date(l.createdAt).getTime();const day=new Date(monday);day.setDate(day.getDate()+i);const next=new Date(day);next.setDate(next.getDate()+1);return d>=day.getTime()&&d<next.getTime();}).length);
  },[leads]);
  const max=Math.max(3,...data);const today=(new Date().getDay()+6)%7;
  return <div className="weekly-bars" aria-label="Leads received each day this week">{data.map((value,i)=><div className="bar-slot" key={week[i]}><span className="bar-number">{value>0?value:""}</span><div className="bar-track"><div className={`bar-fill ${i===today?"bar-today":""}`} style={{height:`${Math.max(value?10:3,(value/max)*100)}%`}} title={`${week[i]}: ${value} leads`}/></div><span className={`bar-label ${i===today?"bar-current":""}`}>{week[i]}</span></div>)}</div>;
}
export default function Dashboard() {
 const {leads,ready}=useLeads();const [selectedId,setSelectedId]=useState<string|null>(null); const sorted=useMemo(()=>[...leads].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)),[leads]);const selected=sorted.find(l=>l.id===selectedId);
 const qualified=leads.filter(l=>["Qualified","Visit Booked","Closed"].includes(l.status)).length;const booked=leads.filter(l=>l.status==="Visit Booked").length;const newLeads=leads.filter(l=>l.status==="New").length;
 const metrics=[{label:"Total leads",value:leads.length,detail:"All enquiries",icon:Users,theme:"lavender"},{label:"New enquiries",value:newLeads,detail:"Need attention",icon:MessageSquareText,theme:"peach"},{label:"Qualified leads",value:qualified,detail:"High intent prospects",icon:CheckCircle2,theme:"mint"},{label:"Site visits booked",value:booked,detail:"Live pipeline",icon:CalendarCheck2,theme:"blue"}];
 const funnel=[{label:"New",value:newLeads,color:"#a59bff"},{label:"Contacted",value:leads.filter(l=>l.status==="Contacted").length,color:"#ffc48a"},{label:"Qualified",value:leads.filter(l=>l.status==="Qualified").length,color:"#886ff5"},{label:"Visit Booked",value:booked,color:"#66c6b6"},{label:"Closed",value:leads.filter(l=>l.status==="Closed").length,color:"#87bca0"}];
 return <div className="page-stack"><div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> REAL ESTATE INTELLIGENCE</span><h1>Good morning, Technorich <span className="wave">✳</span></h1><p>Here&apos;s what&apos;s happening with your property leads today.</p></div><div className="heading-actions"><button className="btn btn-outline" disabled={!ready||!leads.length} onClick={()=>exportCsv(leads)}><Download size={16}/> Export leads</button><Link href="/enquiry" className="btn btn-dark"><Plus size={17}/> Add enquiry</Link></div></div>
 <div className="demo-banner"><span className="demo-banner-icon"><Sparkles size={19}/></span><div><strong>Your real estate command center is ready.</strong><span>Manage verified properties, match buyers with Ollama, and book site visits alongside your leads.</span></div><Link href="/properties">View listings <ArrowRight size={16}/></Link></div>
 <div className="metric-grid">{metrics.map(m=><div className="metric-card" key={m.label}><div className="metric-top"><span>{m.label}</span><span className={`metric-icon ${m.theme}`}><m.icon size={19}/></span></div><div className="metric-value">{ready?m.value:"—"}</div><div className="metric-bottom"><span className="metric-signal"><TrendingUp size={13}/></span><span>{m.detail}</span></div></div>)}</div>
 <div className="insights-grid"><section className="panel trend-panel"><div className="panel-heading"><div><h2>Lead activity</h2><p>New enquiries received this week</p></div><span className="small-chip"><Clock3 size={14}/> This week</span></div><div className="chart-summary"><strong>{ready?sorted.filter(l=>{const now=new Date();const day=(now.getDay()+6)%7;const monday=new Date(now.getFullYear(),now.getMonth(),now.getDate()-day);return new Date(l.createdAt)>=monday;}).length:"—"}</strong><span>leads this week</span></div><WeeklyBars leads={leads}/></section>
 <section className="panel funnel-panel"><div className="panel-heading"><div><h2>Pipeline snapshot</h2><p>Where your leads stand</p></div><span className="panel-dots"><ListFilter size={18}/></span></div><div className="funnel-list">{funnel.map(f=><div className="funnel-row" key={f.label}><span>{f.label}</span><div className="funnel-track"><div style={{width:`${leads.length?Math.max(0,f.value/leads.length*100):0}%`,backgroundColor:f.color}}/></div><b>{f.value}</b></div>)}</div><Link className="panel-footer-link" href="/leads">View full pipeline <ArrowUpRight size={16}/></Link></section></div>
 <section className="panel recent-panel"><div className="panel-heading recent-header"><div><h2>Recent enquiries</h2><p>Keep track of your newest prospective buyers</p></div><Link className="text-link" href="/leads">View all leads <ArrowRight size={16}/></Link></div><LeadTable leads={sorted} compact onSelect={l=>setSelectedId(l.id)}/></section>
 <div className="bottom-footnote"><span><span className="footnote-dot"/> Secure Supabase data</span><span>Last activity: {sorted[0]?relativeTime(sorted[0].createdAt):"No enquiries yet"}</span></div>
 {selected&&<LeadDetail key={selected.id} lead={selected} onClose={()=>setSelectedId(null)}/>}</div>;
}
