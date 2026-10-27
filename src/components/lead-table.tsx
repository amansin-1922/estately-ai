"use client";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, Sparkles, X } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { leadStatuses } from "@/lib/types";
import { initials, relativeTime, statusClass } from "@/lib/utils";
import { useLeads } from "./lead-provider";
import { LeadConversation } from "./lead-conversation";
import { PropertyMatcher } from "./property-matcher";

export function LeadTable({ leads, compact = false, onSelect }: { leads: Lead[]; compact?: boolean; onSelect?: (lead: Lead)=>void }) {
  const visible = compact ? leads.slice(0,5) : leads;
  const {setStatus}=useLeads();
  return <div className="table-scroll"><table className="leads-table"><thead><tr><th>LEAD</th><th>INTEREST</th><th>SOURCE</th><th>STATUS</th><th>RECEIVED</th><th></th></tr></thead><tbody>{visible.map((lead,i)=><tr key={lead.id}>
    <td><button className="lead-person" onClick={()=>onSelect?.(lead)}><span className={`person-avatar avatar-${i%5}`}>{initials(lead.name)}</span><span><strong>{lead.name}</strong><small>{lead.city}</small></span></button></td>
    <td><div className="cell-main">{lead.propertyType}</div><div className="cell-sub">{lead.budget}</div></td>
    <td><span className="source-cell">{lead.source}</span></td>
    <td><div className="status-select-wrap"><span className={`status-badge ${statusClass(lead.status)}`}>{lead.status}</span><select aria-label={`Change status for ${lead.name}`} value={lead.status} onChange={e=>{void setStatus(lead.id,e.target.value as LeadStatus).catch(()=>{});}}>{leadStatuses.map(status=><option key={status}>{status}</option>)}</select><ChevronDown size={12}/></div></td>
    <td><span className="cell-age">{relativeTime(lead.createdAt)}</span></td>
    <td><button aria-label={`View ${lead.name}`} className="row-arrow" onClick={()=>onSelect?.(lead)}><ArrowUpRight size={17}/></button></td>
  </tr>)}</tbody></table>{visible.length===0 && <div className="empty-table">No leads found. Try adding a new enquiry.</div>}</div>;
}
export function LeadDetail({lead,onClose}:{lead:Lead;onClose:()=>void}) {
  const {setNote,removeLead,setStatus,qualifyLead}=useLeads(); const [notes,setNotes]=useState(lead.note); const [showDelete,setShowDelete]=useState(false); const [analyzing,setAnalyzing]=useState(false); const [aiError,setAiError]=useState("");
  return <div className="drawer-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><aside className="lead-drawer" role="dialog" aria-modal="true" aria-label={`Details for ${lead.name}`}><div className="drawer-header"><div><span className="eyebrow">LEAD DETAILS</span><h2>{lead.name}</h2></div><button className="icon-button" aria-label="Close lead details" onClick={onClose}><X size={20}/></button></div>
  <div className="drawer-body"><div className="detail-summary"><span className="detail-avatar">{initials(lead.name)}</span><h3>{lead.name}</h3><p>{lead.city} · {lead.source}</p><span className={`status-badge ${statusClass(lead.status)}`}>{lead.status}</span></div>
  <div className="detail-grid"><div><label>Email</label><span>{lead.email || "Not provided"}</span></div><div><label>Phone</label><span>{lead.phone}</span></div><div><label>Property interest</label><span>{lead.propertyType}</span></div><div><label>Budget</label><span>{lead.budget}</span></div><div className="detail-wide"><label>Message</label><span>{lead.interest || "No additional message."}</span></div><div className="detail-wide"><label>Received</label><span>{new Date(lead.createdAt).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"})}</span></div></div>
  <label className="input-label" htmlFor="drawer-status">Lead status</label><select id="drawer-status" className="field" value={lead.status} onChange={e=>{void setStatus(lead.id,e.target.value as LeadStatus).catch(()=>{});}}>{leadStatuses.map(s=><option key={s}>{s}</option>)}</select>
  <section className="ai-review-box">
    <div className="ai-review-heading"><div><span className="eyebrow">PHASE 3</span><h3>AI buyer qualification</h3><p>Analyzes available preferences. No customer message is sent automatically.</p></div></div>
    <button className="btn btn-dark w-full" disabled={analyzing} onClick={()=>{
      setAnalyzing(true);setAiError("");
      void qualifyLead(lead.id).catch(e=>setAiError(e instanceof Error ? e.message : "Unable to qualify lead")).finally(()=>setAnalyzing(false));
    }}><Sparkles size={16}/>{analyzing?"Analyzing buyer…":lead.aiReview?"Re-analyze lead":"Analyze with AI"}</button>
    {aiError && <p className="login-error" role="alert">{aiError}</p>}
    {lead.aiReview && <div className="ai-review-result">
      <span className="ai-priority">Indicative priority: <strong>{lead.aiReview.priority}</strong></span>
      <h4>Buyer summary</h4><p>{lead.aiReview.summary}</p>
      <h4>Questions to ask</h4><ol>{lead.aiReview.questions.map((q,i)=><li key={i}>{q}</li>)}</ol>
      <h4>Recommended next step</h4><p>{lead.aiReview.nextStep}</p>
      <h4>Draft follow-up — review before sending</h4><p className="ai-draft">{lead.aiReview.draftMessage}</p>
      <small>Reviewed {new Date(lead.aiReview.analyzedAt).toLocaleString("en-IN")}. AI results can be inaccurate. A salesperson must review before taking action.</small>
    </div>}
  </section>
  <PropertyMatcher lead={lead}/>
  <LeadConversation lead={lead}/>
  <label className="input-label" htmlFor="lead-note">Internal notes</label><textarea id="lead-note" className="field note-area" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Add conversation notes and next steps..." rows={4}/><button className="btn btn-dark w-full" onClick={()=>{void setNote(lead.id,notes).then(onClose).catch(()=>{});}}>Save changes</button>
  <div className="drawer-danger">{showDelete?<div className="delete-confirm"><span>Permanently delete this lead from the database?</span><div><button className="btn btn-outline" onClick={()=>setShowDelete(false)}>Cancel</button><button className="btn btn-danger" onClick={()=>{void removeLead(lead.id).then(onClose).catch(()=>{});}}>Delete lead</button></div></div>:<button onClick={()=>setShowDelete(true)}>Delete lead</button>}</div>
  </div></aside></div>;
}
