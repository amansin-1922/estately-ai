"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, BrainCircuit, Building2, MapPin, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/lib/types";
import { inr, type Property } from "@/lib/property-types";
type Match = { property:Property; score:number; positives:string[]; cautions:string[]; aiReason:string|null };
type ResponseBody = {error?:string;warning?:string;source?:"ollama"|"rules";matches?:Match[];preferences?:{city:string;locality:string;maxBudget:number|null;bedrooms:number|null}};
export function PropertyMatcher({lead}:{lead:Lead}){
 const [city,setCity]=useState(lead.city);
 const [locality,setLocality]=useState("");
 const [maxBudget,setMaxBudget]=useState("");
 const [bedrooms,setBedrooms]=useState("");
 const [result,setResult]=useState<ResponseBody|null>(null);
 const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function match(e:FormEvent<HTMLFormElement>){
   e.preventDefault();if(busy)return;setBusy(true);setError("");setResult(null);
   try{
     const {data:{session},error:authError}=await supabase.auth.getSession();
     if(authError||!session?.access_token)throw new Error("Please sign in again.");
     const response=await fetch("/api/match",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({leadId:lead.id,city,locality,maxBudget:maxBudget?Number(maxBudget):null,bedrooms:bedrooms?Number(bedrooms):null})});
     const body:ResponseBody=await response.json();if(!response.ok)throw new Error(body.error??"Matching failed");
     setResult(body);
   }catch(err){setError(err instanceof Error?err.message:"Matching failed");}finally{setBusy(false);}
 }
 return <section className="ai-review-box phase4b-match">
   <div className="ai-review-heading"><div><span className="eyebrow">PHASE 4B · INVENTORY-AWARE</span><h3><BrainCircuit size={17}/> Match verified properties</h3><p>Filters and ranks only Active listings in your own account. Ollama adds optional explanations; no invented listings.</p></div></div>
   <form className="phase4b-match-form" onSubmit={match}>
     <label>City<input className="field" value={city} onChange={e=>setCity(e.target.value)} maxLength={90}/></label>
     <label>Preferred locality (optional)<input className="field" value={locality} onChange={e=>setLocality(e.target.value)} placeholder="Bailey Road" maxLength={120}/></label>
     <label>Max budget ₹ (optional)<input className="field" type="number" min="100000" step="1" value={maxBudget} onChange={e=>setMaxBudget(e.target.value)} placeholder="7500000"/></label>
     <label>Bedrooms (optional)<select className="field" value={bedrooms} onChange={e=>setBedrooms(e.target.value)}><option value="">Infer from enquiry</option>{Array.from({length:6},(_,i)=><option value={i+1} key={i+1}>{i+1} BHK</option>)}</select></label>
     <button type="submit" disabled={busy} className="btn btn-dark w-full"><Search size={16}/>{busy?"Finding matches…":"Match properties"}</button>
   </form>
   {error&&<p className="login-error" role="alert">{error}</p>}
   {result&&<div className="phase4b-match-results"><div className="phase4b-match-summary"><strong>{result.matches?.length??0} recommended listing(s)</strong><span>{result.source==="ollama"?"Ollama-assisted explanation":"Rule-based shortlist"}</span></div>
     {result.warning&&<p className="phase4b-muted">{result.warning}</p>}
     {result.preferences&&<p className="phase4b-muted">Matching on {result.preferences.city||"any city"}, {result.preferences.bedrooms?`${result.preferences.bedrooms} BHK`:"any bedroom count"}, {result.preferences.maxBudget?`max ${inr(result.preferences.maxBudget)}`:"budget not specified"}. Review before sharing.</p>}
     {(result.matches??[]).map(m=><article className="phase4b-match-result" key={m.property.id}>
       <div className="phase4b-match-top"><strong>{m.property.title}</strong><span>{m.score}/100 fit</span></div>
       <p className="phase4b-muted"><MapPin size={13}/>{m.property.locality}, {m.property.city}</p>
       <b>{inr(m.property.price_inr)} · {m.property.bedrooms} BHK</b>
       {m.aiReason&&<p>{m.aiReason}</p>}
       <p className="phase4b-muted">{m.positives.length?`Matches: ${m.positives.join(", ")}.`:"No preferences verified."} {m.cautions.length?`Check: ${m.cautions.join(", ")}.`:""}</p>
       <Link className="phase4b-link" href="/visits">Request site visit <ArrowRight size={15}/></Link>
     </article>)}
     {!result.matches?.length&&<p className="phase4b-muted"><Building2 size={14}/> Add Active listings under Properties before trying again.</p>}
   </div>}
 </section>;
}
