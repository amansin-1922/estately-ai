"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Activity, ArrowUpRight, Bell, Building2, ChevronDown, CircleHelp, CalendarDays, ClipboardList, LayoutDashboard, Menu, Plus, Sparkles, X, MessagesSquare } from "lucide-react";
import { useLeads } from "./lead-provider";
const nav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "All leads", href: "/leads", icon: ClipboardList },
  { label: "New enquiry", href: "/enquiry", icon: Plus },
  { label: "Properties", href: "/properties", icon: Building2 },
  { label: "Site visits", href: "/visits", icon: CalendarDays },
  { label: "Website chatbot", href: "/website-chat", icon: MessagesSquare },
];
export function AppShell({children}:{children:ReactNode}) {
  const pathname=usePathname(); const [open,setOpen]=useState(false); const {leads,ready,user,signOut,error,clearError}=useLeads();
  const newCount=ready?leads.filter(l=>l.status==="New").length:0;
  return <div className="app-layout">
    {open && <button className="mobile-overlay" aria-label="Close navigation" onClick={()=>setOpen(false)} />}
    <aside className={`sidebar ${open?"sidebar-open":""}`}>
      <div className="sidebar-top">
        <Link href="/dashboard" className="brand" onClick={()=>setOpen(false)}>
          <span className="brand-icon"><Building2 size={23} strokeWidth={2}/></span>
          <span className="brand-text"><strong>estately<span className="brand-ai">.ai</span></strong><small>BY TECHNORICH</small></span>
        </Link>
        <button className="sidebar-close" onClick={()=>setOpen(false)} aria-label="Close menu"><X size={19}/></button>
      </div>
      <div className="workspace-tile"><span className="workspace-icon">T</span><span className="workspace-copy"><strong>Technorich AI</strong><small>Demo workspace</small></span><ChevronDown size={15} className="text-muted"/></div>
      <div className="section-label">WORKSPACE</div>
      <nav className="nav-links" aria-label="Primary navigation">
        {nav.map(({label,href,icon:Icon})=><Link key={href} href={href} onClick={()=>setOpen(false)} className={`nav-item ${pathname===href?"nav-active":""}`}><Icon size={18}/><span>{label}</span>{label==="All leads"&&newCount>0&&<b className="nav-count">{newCount}</b>}</Link>)}
      </nav>
      <div className="section-label nav-divider-label">INTELLIGENCE</div>
      <Link href="/leads" onClick={()=>setOpen(false)} className="nav-item"><Sparkles size={18}/><span>Ollama matching</span></Link>
      <div className="nav-coming"><Activity size={18}/><span>Analytics reports</span><span className="soon">SOON</span></div>
      <div className="sidebar-spacer"/>
      <div className="sidebar-promo"><span className="promo-icon"><Sparkles size={17}/></span><strong>Smarter leads. Faster sales.</strong><p>Turn every property enquiry into an opportunity.</p><Link href="/enquiry">Add a new lead <ArrowUpRight size={15}/></Link></div>
      <div className="sidebar-help"><CircleHelp size={17}/><span>Phase 5 · Secure workspace</span></div>
    </aside>
    <div className="main-panel">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label="Open navigation" onClick={()=>setOpen(true)}><Menu size={22}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{pathname==="/enquiry"?"New enquiry":pathname==="/leads"?"All leads":pathname==="/properties"?"Properties":pathname==="/visits"?"Site visits":pathname==="/website-chat"?"Website chatbot":"Overview"}</strong></div></div><div className="topbar-right"><span className="demo-pill"><span className="live-dot"/> Private workspace</span><Link className="topbar-action" title="View new enquiries" href="/leads"><Bell size={18}/>{newCount>0&&<span className="notification-dot"/>}</Link><span className="topbar-avatar" title={user?.email ?? "Technorich AI"}>TA</span><button type="button" className="signout-button" onClick={()=>{void signOut().catch(()=>{});}}>Sign out</button></div></header>
      <main className="content-wrap">{error && <div className="db-error" role="alert">Database: {error} <button onClick={clearError}>Dismiss</button></div>}{children}</main>
    </div>
  </div>;
}
