"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, Building2, CalendarDays, CheckCircle2, ChevronRight, Home, LoaderCircle, MapPin, MessageCircle, RefreshCcw, Send, ShieldCheck, Sparkles } from "lucide-react";

type Property = { id:string;title:string;city:string;locality:string;price_inr:number;bedrooms:number;bathrooms:number;area_sqft:number|null;description:string;amenities:string[];image_url:string|null };
type Slot = {id:string;property_id:string;starts_at:string;ends_at:string};
type ChatMessage = {role:"buyer"|"assistant";message:string;created_at:string};
type Catalogue = {brand:string;welcome:string;properties:Property[];slots:Slot[]};
const currency = (price:number) => "₹"+Number(price).toLocaleString("en-IN",{maximumFractionDigits:0});
const prettyTime = (v:string) => new Date(v).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"});
const storagePrefix = "estately-webchat:";

async function api(slug:string, action:string, input:Record<string,unknown>, token?:string) {
  const result = await fetch("/api/public-chat", {method:"POST",headers:{"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({slug,action,...input}),cache:"no-store"});
  const data:unknown = await result.json();
  const obj=data as Record<string,unknown>;
  if(!result.ok)throw new Error(typeof obj.error==="string"?obj.error:"Request failed.");
  return obj;
}

export default function PublicBuyerChat() {
  const params=useParams<{slug:string}>();
  const slug=typeof params.slug==="string"?params.slug:"";
  const [catalogue,setCatalogue]=useState<Catalogue|null>(null);
  const [initialError,setInitialError]=useState("");
  const [loading,setLoading]=useState(true);
  const [token,setToken]=useState("");
  const [name,setName]=useState("");const [phone,setPhone]=useState("");const [email,setEmail]=useState("");
  const [city,setCity]=useState("Patna");const [budget,setBudget]=useState("");const [propertyType,setPropertyType]=useState("");
  const [requirements,setRequirements]=useState("");const [consent,setConsent]=useState(false);
  const [honeypot,setHoneypot]=useState("");
  const [messages,setMessages]=useState<ChatMessage[]>([]);
  const [draft,setDraft]=useState("");
  const [working,setWorking]=useState(false);
  const [actionError,setActionError]=useState("");
  const [aiSource,setAiSource]=useState("");
  const [showBooking,setShowBooking]=useState(false);
  const [propertyId,setPropertyId]=useState("");const [slotId,setSlotId]=useState("");
  const [visitSuccess,setVisitSuccess]=useState("");

  useEffect(()=>{
    if(!slug)return;
    let active=true;
    void Promise.resolve().then(async()=>{
      try {
        const res=await fetch(`/api/public-chat?slug=${encodeURIComponent(slug)}`,{cache:"no-store"});
        const json:unknown=await res.json(); const data=json as Record<string,unknown>;
        if(!res.ok)throw new Error(typeof data.error==="string"?data.error:"Unable to open chatbot.");
        if(active)setCatalogue(json as Catalogue);
        const saved=window.sessionStorage.getItem(storagePrefix+slug);
        if(saved && active){
          const history=await api(slug,"history",{},saved);
          if(active){setToken(saved);setMessages((history.messages as ChatMessage[])??[]);}
        }
      }catch(err){
        if(!active)return;
        // Missing/expired old session must not prevent starting a new enquiry.
        if((err instanceof Error?err.message:"").includes("session expired")){
          window.sessionStorage.removeItem(storagePrefix+slug);
        }else setInitialError(err instanceof Error?err.message:"Unable to open chatbot.");
      }finally{if(active)setLoading(false);}
    });
    return()=>{active=false;};
  },[slug]);

  async function start(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(working)return;
    setWorking(true);setActionError("");
    try{
      const result=await api(slug,"start",{name,phone,email,city,budget,propertyType,requirements,consent,website:honeypot});
      const session=String(result.token||"");
      if(!session)throw new Error("Chat session missing.");
      sessionStorage.setItem(storagePrefix+slug,session);setToken(session);setMessages([]);
    }catch(err){setActionError(err instanceof Error?err.message:"Could not begin conversation.");}
    finally{setWorking(false);}
  }
  async function send(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(working || draft.trim().length<2)return;
    const latest=draft.trim();setWorking(true);setActionError("");setDraft("");
    try {
      const result=await api(slug,"message",{message:latest},token);
      const buyer=result.buyer as ChatMessage;
      const response=String(result.reply||"");
      setMessages(old=>[...old,buyer,{role:"assistant",message:response,created_at:new Date().toISOString()}]);
      setAiSource(String(result.source||""));
    }catch(err){setDraft(latest);setActionError(err instanceof Error?err.message:"Unable to send message.");}
    finally{setWorking(false);}
  }
  async function requestVisit(){
    if(!propertyId||!slotId||working)return;
    setWorking(true);setActionError("");setVisitSuccess("");
    try{
      const result=await api(slug,"visit",{propertyId,slotId},token);
      setVisitSuccess(String(result.message||"Visit requested."));
      setShowBooking(false);
      const res=await fetch(`/api/public-chat?slug=${encodeURIComponent(slug)}`,{cache:"no-store"});
      if(res.ok)setCatalogue(await res.json() as Catalogue);
      setSlotId("");
    }catch(err){setActionError(err instanceof Error?err.message:"Could not request visit.");}
    finally{setWorking(false);}
  }
  if(loading)return <main className="buyer-shell"><div className="buyer-loading"><LoaderCircle className="buyer-spin" size={28}/> Loading the property assistant…</div></main>;
  if(!catalogue)return <main className="buyer-shell"><div className="buyer-error-panel"><Building2 size={32}/><h1>Chatbot unavailable</h1><p>{initialError || "Ask the property team for an updated link."}</p></div></main>;
  const slotOptions=catalogue.slots.filter(s=>s.property_id===propertyId);

  return <main className="buyer-shell">
    <header className="buyer-topbar"><div className="buyer-brand"><span className="buyer-brand-mark"><Building2 size={23}/></span><div><strong>{catalogue.brand}</strong><small>AI property concierge · by Technorich</small></div></div><span className="buyer-safe"><ShieldCheck size={15}/> Private enquiry</span></header>
    <div className="buyer-grid">
      <section className="buyer-hero">
        <div className="buyer-overline"><Sparkles size={15}/> SMART REAL ESTATE EXPERIENCE</div>
        <h1>Find your next home, <em>with clarity.</em></h1>
        <p>Explore verified listings, share your preferences and request a site visit — all in one place.</p>
        <div className="buyer-mini-stats"><div><strong>{catalogue.properties.length}</strong><span>Active listings</span></div><div><strong>{catalogue.slots.length}</strong><span>Open visit slots</span></div></div>
        <div className="buyer-listings-heading"><span>Available properties</span><span>From this agency only</span></div>
        <div className="buyer-listings">
          {catalogue.properties.length===0&&<div className="buyer-no-listings">No active properties listed yet. You can still submit an enquiry.</div>}
          {catalogue.properties.map(p=><article key={p.id} className="buyer-property">
            <div className="buyer-property-icon"><Home size={21}/></div>
            <div className="buyer-property-body"><h3>{p.title}</h3><span className="buyer-location"><MapPin size={12}/>{p.locality}, {p.city}</span><div className="buyer-property-meta">{p.bedrooms} BHK · {p.area_sqft ? `${p.area_sqft.toLocaleString("en-IN")} sq ft` : "Area on request"}</div></div>
            <div className="buyer-property-right"><strong>{currency(p.price_inr)}</strong>{token&&<button type="button" onClick={()=>{setPropertyId(p.id);setSlotId("");setShowBooking(true);setVisitSuccess("");}}>View slots <ChevronRight size={12}/></button>}</div>
          </article>)}
        </div>
        <div className="buyer-disclaimer"><ShieldCheck size={18}/><span>Only Active listings are shown. Availability and visit confirmations are subject to verification by the sales team.</span></div>
      </section>
      <section className="buyer-chat-panel">
        <div className="buyer-chat-header"><span className="buyer-agent-avatar"><MessageCircle size={24}/></span><div><strong>Estately AI concierge</strong><small><span className="buyer-online-dot"/> Local AI assistant · no WhatsApp required</small></div></div>
        {!token?<div className="buyer-onboarding"><h2>Tell us what you’re looking for</h2><p>Share a few details to get personalized guidance. This creates an enquiry for the property sales team.</p>
          <form className="buyer-form" onSubmit={start}>
            <label>Full name *<input className="buyer-input" required maxLength={90} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>
            <label>Phone number *<input className="buyer-input" required type="tel" maxLength={20} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="10-digit phone number"/></label>
            <label>Email (optional)<input className="buyer-input" type="email" maxLength={150} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
            <div className="buyer-form-row"><label>City *<input className="buyer-input" required maxLength={90} value={city} onChange={e=>setCity(e.target.value)}/></label><label>Budget<input className="buyer-input" maxLength={100} value={budget} onChange={e=>setBudget(e.target.value)} placeholder="e.g. 75 lakh"/></label></div>
            <label>Property type<input className="buyer-input" maxLength={90} value={propertyType} onChange={e=>setPropertyType(e.target.value)} placeholder="e.g. 2 BHK apartment"/></label>
            <label>Additional requirements<textarea className="buyer-input buyer-textarea" maxLength={600} rows={2} value={requirements} onChange={e=>setRequirements(e.target.value)} placeholder="Location, timeline, amenities…"/></label>
            <label className="buyer-trap" aria-hidden="true">Website<input value={honeypot} autoComplete="off" tabIndex={-1} onChange={e=>setHoneypot(e.target.value)}/></label>
            <label className="buyer-consent"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I agree to submit my enquiry and have these details shared with this real estate sales team for follow-up. I understand that the chat is saved. This is not consent to unrelated marketing.</span></label>
            {actionError&&<p className="buyer-error" role="alert">{actionError}</p>}
            <button type="submit" className="buyer-primary" disabled={working||!consent}>{working?<LoaderCircle className="buyer-spin" size={18}/>:<ArrowRight size={18}/>} Start property conversation</button>
          </form>
        </div>:<>
          <div className="buyer-messages" aria-live="polite">
            <div className="buyer-bubble assistant">{catalogue.welcome}</div>
            {messages.map((m,i)=><div key={`${m.created_at}-${i}`} className={`buyer-bubble ${m.role==="buyer"?"buyer":"assistant"}`}>{m.message}</div>)}
            {working&&<div className="buyer-bubble assistant"><LoaderCircle className="buyer-spin" size={16}/> Working on your request…</div>}
          </div>
          <div className="buyer-chat-controls">
            {visitSuccess&&<div className="buyer-confirmation"><CheckCircle2 size={18}/>{visitSuccess}</div>}
            {actionError&&<p className="buyer-error" role="alert">{actionError}</p>}
            {showBooking?<div className="buyer-booking"><strong><CalendarDays size={18}/> Request an available site visit</strong>
              <label>Property<select className="buyer-input" value={propertyId} onChange={e=>{setPropertyId(e.target.value);setSlotId("");}}><option value="">Select property</option>{catalogue.properties.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></label>
              <label>Available slot<select className="buyer-input" value={slotId} onChange={e=>setSlotId(e.target.value)}><option value="">Select time</option>{slotOptions.map(s=><option value={s.id} key={s.id}>{prettyTime(s.starts_at)}</option>)}</select></label>
              {propertyId&&slotOptions.length===0&&<small>No open times for this property. Please ask our sales team.</small>}
              <div className="buyer-booking-actions"><button type="button" onClick={()=>{void requestVisit();}} disabled={!slotId||working} className="buyer-primary">Request visit</button><button type="button" className="buyer-secondary" onClick={()=>setShowBooking(false)}>Cancel</button></div>
            </div>:<button type="button" className="buyer-visit-link" onClick={()=>{setShowBooking(true);setActionError("");}}><CalendarDays size={17}/> Request a site visit <ChevronRight size={16}/></button>}
            <form onSubmit={send} className="buyer-message-form"><input className="buyer-input" minLength={2} maxLength={700} placeholder="Ask about properties, budget, neighbourhoods…" value={draft} onChange={e=>setDraft(e.target.value)} disabled={working}/><button type="submit" disabled={working||draft.trim().length<2} aria-label="Send message"><Send size={19}/></button></form>
            <small className="buyer-chat-footnote">{aiSource==="fallback"?"AI is offline — safe fallback reply used. ":""}Do not share passwords, identity documents or payment details. Visit requests need staff confirmation.</small>
          </div>
        </>}
      </section>
    </div>
    <footer className="buyer-footer"><span>Estately AI · Built by Technorich AI Solutions</span><span><RefreshCcw size={13}/> Listings and time slots may change</span></footer>
  </main>;
}
