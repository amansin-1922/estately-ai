"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Globe2, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useLeads } from "@/components/lead-provider";
import { supabase } from "@/lib/supabase";

type Site = { id: string; slug: string; business_name: string; welcome_message: string; is_enabled: boolean; user_id: string };

export default function WebsiteChatSettings() {
  const { user } = useLeads();
  const [site, setSite] = useState<Site | null>(null);
  const [business, setBusiness] = useState("Estately AI Demo");
  const [welcome, setWelcome] = useState("Hi! Tell me the city, budget and type of home you are looking for.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setOrigin(window.location.origin); });
    return () => { active = false; };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error: readError } = await supabase.from("public_chat_sites").select("id,slug,business_name,welcome_message,is_enabled,user_id").eq("user_id",user.id).maybeSingle();
    if (readError) throw readError;
    const entry = data as Site | null;
    setSite(entry);
    if (entry) { setBusiness(entry.business_name); setWelcome(entry.welcome_message); }
  }, [user]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      try { await load(); } catch (err) { if (active) setError(err instanceof Error ? err.message : "Could not load chatbot settings."); }
      finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [load]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!user || saving) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const payload = { business_name: business.trim(), welcome_message: welcome.trim() };
      if (!payload.business_name || !payload.welcome_message) throw new Error("Enter a business name and greeting.");
      if (site) {
        const { error: writeError } = await supabase.from("public_chat_sites").update(payload).eq("id",site.id).eq("user_id",user.id);
        if (writeError) throw writeError;
      } else {
        const slug = `estately-${user.id.split("-")[0]}`;
        const { error: writeError } = await supabase.from("public_chat_sites").insert({ ...payload, user_id:user.id,slug,is_enabled:true });
        if (writeError) throw writeError;
      }
      await load(); setSuccess("Your public chat settings have been saved.");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to save settings."); }
    finally { setSaving(false); }
  }

  async function toggle() {
    if (!site || !user) return;
    setError(""); setSuccess("");
    const {error: writeError} = await supabase.from("public_chat_sites").update({is_enabled:!site.is_enabled}).eq("id",site.id).eq("user_id",user.id);
    if (writeError) return setError(writeError.message);
    await load(); setSuccess("Chatbot availability updated.");
  }
  const link = site && origin ? `${origin}/chat/${site.slug}` : "";

  return <div className="page-stack phase4b">
    <div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> PUBLIC BUYER EXPERIENCE</span><h1>Website chatbot</h1><p>Share a buyer-facing link without exposing the private sales workspace.</p></div><Globe2 size={27}/></div>
    {error && <div className="db-error" role="alert">{error}</div>}
    {success && <div className="phase4b-ok" role="status"><Check size={17}/>{success}</div>}
    <section className="panel phase4b-card public-settings"><div className="panel-heading"><div><h2>Your public chatbot</h2><p>Requires the Phase 5 SQL migration and a server-only Supabase secret key.</p></div><ShieldCheck size={22}/></div>
      {loading ? <p>Loading settings…</p> : <form className="phase4b-form" onSubmit={save}>
        <label>Business name<input required maxLength={90} className="field" value={business} onChange={e=>setBusiness(e.target.value)}/></label>
        <label className="phase4b-wide">Welcome message<textarea required maxLength={350} rows={3} className="field" value={welcome} onChange={e=>setWelcome(e.target.value)}/></label>
        <div className="phase4b-actions"><button type="submit" className="btn btn-dark" disabled={saving}><Sparkles size={16}/>{saving?"Saving…":site?"Save settings":"Create buyer chat link"}</button>{site && <button type="button" className="btn btn-outline" onClick={()=>{void toggle();}}>{site.is_enabled?"Disable public chat":"Enable public chat"}</button>}</div>
      </form>}
      {site && <div className="public-share"><div><small>PUBLIC CHAT LINK</small><div className="public-share-url">{link || `/chat/${site.slug}`}</div><span className={site.is_enabled?"public-live":"public-paused"}>{site.is_enabled?"Enabled":"Disabled"}</span></div><div className="public-share-actions"><button className="btn btn-outline" type="button" onClick={()=>{void navigator.clipboard.writeText(link);}} disabled={!link}><Copy size={16}/> Copy link</button><Link href={`/chat/${site.slug}`} target="_blank" className="btn btn-dark"><ExternalLink size={16}/> Open demo</Link></div></div>}
    </section>
    <section className="panel phase4b-card public-settings"><div className="panel-heading"><h2>How this demo works</h2><RefreshCw size={18}/></div><ol className="public-instructions"><li>Make sure you have at least one <strong>Active property</strong> under Properties.</li><li>Share the link with a <strong>fictional test buyer</strong> during development.</li><li>Visitors consent to submit an enquiry, then chat with local Ollama and request available visits.</li><li>New leads appear in <Link href="/leads">All Leads</Link> under your own Supabase account.</li><li>Visit requests appear under <Link href="/visits">Site Visits</Link>; a salesperson must confirm them.</li></ol><p className="public-hint">Localhost links work only on your computer. For public access, you must deploy the app and host Ollama securely. Do not expose local Ollama directly to the internet.</p></section>
  </div>;
}
