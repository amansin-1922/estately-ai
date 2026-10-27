"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Building2, CalendarPlus, Check, Home, MapPin, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLeads } from "@/components/lead-provider";
import { dateTime, inr, type Property, type PropertyStatus, type VisitSlot } from "@/lib/property-types";

type FormState = { title: string; city: string; locality: string; price: string; bedrooms: string; bathrooms: string; area: string; description: string; amenities: string; imageUrl: string; status: PropertyStatus };
const blank: FormState = { title:"",city:"Patna",locality:"",price:"",bedrooms:"2",bathrooms:"2",area:"",description:"",amenities:"Parking, Security",imageUrl:"",status:"Active" };
const text = (err: unknown) => err instanceof Error ? err.message : "Unexpected error";

export default function PropertiesPage() {
  const {user} = useLeads();
  const [properties,setProperties] = useState<Property[]>([]);
  const [slots,setSlots] = useState<VisitSlot[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(""); const [notice,setNotice] = useState("");
  const [form,setForm] = useState<FormState>(blank);
  const [editingId,setEditingId] = useState<string|null>(null);
  const [saving,setSaving] = useState(false);
  const [slotProperty,setSlotProperty] = useState("");
  const [startLocal,setStartLocal] = useState(""); const [duration,setDuration] = useState("60");
  const [slotSaving,setSlotSaving] = useState(false);
  const update = (key:keyof FormState, value:string) => setForm(prev=>({...prev,[key]:value}));

  const reload = useCallback(async () => {
    if (!user) return;
    const [p,s] = await Promise.all([
      supabase.from("properties").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(200),
      supabase.from("property_visit_slots").select("*").eq("user_id",user.id).gte("starts_at",new Date().toISOString()).order("starts_at").limit(300),
    ]);
    if(p.error) throw p.error; if(s.error) throw s.error;
    setProperties((p.data ?? []) as Property[]);setSlots((s.data ?? []) as VisitSlot[]);
  },[user]);
  useEffect(()=>{
    let active=true;
    void Promise.resolve().then(async()=>{
      if(!user || !active) return;
      try{
        const [p,s] = await Promise.all([
          supabase.from("properties").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(200),
          supabase.from("property_visit_slots").select("*").eq("user_id",user.id).gte("starts_at",new Date().toISOString()).order("starts_at").limit(300),
        ]);
        if(p.error) throw p.error; if(s.error) throw s.error;
        if(active){setProperties((p.data??[]) as Property[]);setSlots((s.data??[]) as VisitSlot[]);}
      }catch(err){if(active)setError(text(err));}finally{if(active)setLoading(false);}
    });
    return()=>{active=false;};
  },[user]);

  async function saveProperty(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); if(!user||saving)return;
    setError("");setNotice("");setSaving(true);
    const price=Number(form.price);const bedrooms=Number(form.bedrooms);const bathrooms=Number(form.bathrooms);
    if(!Number.isSafeInteger(price)||price<100000||!Number.isInteger(bedrooms)||bedrooms<1||bedrooms>12||!Number.isInteger(bathrooms)||bathrooms<1||bathrooms>20){setError("Enter a valid INR price and BHK/bathroom counts.");setSaving(false);return;}
    if(form.imageUrl && !/^https:\/\//i.test(form.imageUrl)){setError("Use an HTTPS URL for an optional property image.");setSaving(false);return;}
    const payload={user_id:user.id,title:form.title.trim(),city:form.city.trim(),locality:form.locality.trim(),price_inr:price,bedrooms,bathrooms,
      area_sqft:form.area?Number(form.area):null,description:form.description.trim(),amenities:form.amenities.split(",").map(a=>a.trim()).filter(Boolean).slice(0,20),image_url:form.imageUrl.trim()||null,listing_status:form.status};
    try{
      const result=editingId ? await supabase.from("properties").update(payload).eq("id",editingId).eq("user_id",user.id)
        : await supabase.from("properties").insert(payload);
      if(result.error)throw result.error;
      setNotice(editingId?"Listing updated.":"Listing created. Add available site-visit slots below.");setEditingId(null);setForm(blank);await reload();
    }catch(err){setError(text(err));}finally{setSaving(false);}
  }
  function edit(p:Property){setEditingId(p.id);setForm({title:p.title,city:p.city,locality:p.locality,price:String(p.price_inr),bedrooms:String(p.bedrooms),bathrooms:String(p.bathrooms),area:p.area_sqft?String(p.area_sqft):"",description:p.description,amenities:p.amenities.join(", "),imageUrl:p.image_url??"",status:p.listing_status});window.scrollTo({top:0,behavior:"smooth"});}
  async function updateStatus(p:Property,status:PropertyStatus){if(!user)return;setError("");try{const {error:e}=await supabase.from("properties").update({listing_status:status}).eq("id",p.id).eq("user_id",user.id);if(e)throw e;await reload();}catch(err){setError(text(err));}}
  async function removeProperty(p:Property){if(!user||!window.confirm(`Delete ${p.title}? Existing visits may prevent deletion. Pausing the listing is safer.`))return;setError("");try{const {error:e}=await supabase.from("properties").delete().eq("id",p.id).eq("user_id",user.id);if(e)throw e;await reload();}catch(err){setError(text(err)+" — Consider setting this listing to Paused instead.");}}
  async function addSlot(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!user||slotSaving)return;setSlotSaving(true);setError("");setNotice("");try{
    const start=new Date(startLocal);const minutes=Number(duration);if(!startLocal||Number.isNaN(start.getTime())||start.getTime()<Date.now()+60000||!Number.isInteger(minutes)||minutes<15||minutes>360)throw new Error("Choose a future start date and a valid duration.");
    const property=properties.find(p=>p.id===slotProperty && p.listing_status==="Active");if(!property)throw new Error("Choose an Active property.");
    const {error:e}=await supabase.from("property_visit_slots").insert({user_id:user.id,property_id:property.id,starts_at:start.toISOString(),ends_at:new Date(start.getTime()+minutes*60000).toISOString()});if(e)throw e;
    setNotice("Available visit slot created.");setStartLocal("");await reload();
  }catch(err){setError(text(err));}finally{setSlotSaving(false);}}
  async function removeSlot(slot:VisitSlot){if(!user||!window.confirm("Remove this slot? Slots linked to visits cannot be deleted."))return;setError("");try{const {error:e}=await supabase.from("property_visit_slots").delete().eq("id",slot.id).eq("user_id",user.id);if(e)throw e;await reload();}catch(err){setError(text(err));}}

  return <div className="page-stack phase4b">
    <div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> PROPERTY INVENTORY</span><h1>Properties</h1><p>Manage the verified listings used by AI matching and site-visit scheduling.</p></div><Link className="btn btn-outline" href="/visits"><CalendarPlus size={16}/> Manage visits</Link></div>
    {error&&<div className="db-error" role="alert">{error}</div>}{notice&&<div className="phase4b-ok" role="status"><Check size={17}/>{notice}</div>}
    <section className="panel phase4b-card"><div className="panel-heading"><div><h2>{editingId?"Edit property":"Add verified listing"}</h2><p>Only inventory entered here will be considered for property matches.</p></div><Building2 size={20}/></div>
      <form className="phase4b-form" onSubmit={saveProperty}>
        <label>Property title<input className="field" required minLength={3} maxLength={140} value={form.title} onChange={e=>update("title",e.target.value)} placeholder="e.g. Sample Residency 2 BHK"/></label>
        <label>City<input className="field" required value={form.city} onChange={e=>update("city",e.target.value)} maxLength={90}/></label>
        <label>Locality<input className="field" required value={form.locality} onChange={e=>update("locality",e.target.value)} placeholder="Bailey Road" maxLength={120}/></label>
        <label>Asking price (₹)<input className="field" required type="number" min="100000" max="100000000000" step="1" value={form.price} onChange={e=>update("price",e.target.value)} placeholder="7500000"/></label>
        <label>Bedrooms / BHK<input className="field" required type="number" min="1" max="12" value={form.bedrooms} onChange={e=>update("bedrooms",e.target.value)}/></label>
        <label>Bathrooms<input className="field" required type="number" min="1" max="20" value={form.bathrooms} onChange={e=>update("bathrooms",e.target.value)}/></label>
        <label>Area (sq ft, optional)<input className="field" type="number" min="100" max="100000" value={form.area} onChange={e=>update("area",e.target.value)}/></label>
        <label>Listing status<select className="field" value={form.status} onChange={e=>update("status",e.target.value)}><option>Active</option><option>Paused</option><option>Sold</option></select></label>
        <label className="phase4b-wide">Amenities (comma-separated)<input className="field" maxLength={500} value={form.amenities} onChange={e=>update("amenities",e.target.value)} placeholder="Parking, Lift, Security"/></label>
        <label className="phase4b-wide">Description<textarea className="field" rows={3} maxLength={1200} value={form.description} onChange={e=>update("description",e.target.value)}/></label>
        <label className="phase4b-wide">Image URL (optional, HTTPS only)<input className="field" type="url" value={form.imageUrl} onChange={e=>update("imageUrl",e.target.value)} placeholder="https://example.com/property.jpg"/></label>
        <div className="phase4b-actions"><button disabled={saving} className="btn btn-dark" type="submit"><Plus size={16}/>{saving?"Saving…":editingId?"Save listing":"Create property"}</button>{editingId&&<button type="button" className="btn btn-outline" onClick={()=>{setEditingId(null);setForm(blank);}}>Cancel editing</button>}</div>
      </form>
    </section>
    <section className="panel phase4b-card"><div className="panel-heading"><div><h2>Property inventory</h2><p>{loading?"Loading…":`${properties.length} listing(s) in your private workspace`}</p></div><button className="btn btn-outline" onClick={()=>{void reload().catch(e=>setError(text(e)));}}><RefreshCw size={15}/> Refresh</button></div>
      <div className="phase4b-grid">{properties.map(p=><article className="phase4b-property" key={p.id}>
        <div className="phase4b-image" style={p.image_url?.startsWith("https://")?{backgroundImage:`url(${JSON.stringify(p.image_url)})`}:undefined}><Home size={28}/><span className={`phase4b-tag phase4b-tag-${p.listing_status.toLowerCase()}`}>{p.listing_status}</span></div>
        <div className="phase4b-property-body"><h3>{p.title}</h3><p><MapPin size={14}/>{p.locality}, {p.city}</p><strong>{inr(p.price_inr)}</strong><div className="phase4b-meta">{p.bedrooms} BHK · {p.bathrooms} bath {p.area_sqft?`· ${p.area_sqft.toLocaleString("en-IN")} sq ft`:""}</div><div className="phase4b-chips">{p.amenities.slice(0,4).map(a=><span key={a}>{a}</span>)}</div>
        <div className="phase4b-toolbar"><button className="btn btn-outline" onClick={()=>edit(p)}><Pencil size={14}/> Edit</button><select className="field" aria-label={`Status of ${p.title}`} value={p.listing_status} onChange={e=>{void updateStatus(p,e.target.value as PropertyStatus);}}><option>Active</option><option>Paused</option><option>Sold</option></select><button className="phase4b-remove" title="Delete listing" aria-label={`Delete ${p.title}`} onClick={()=>{void removeProperty(p);}}><Trash2 size={17}/></button></div></div>
      </article>)}</div>{!loading&&!properties.length&&<div className="phase4b-empty">No properties yet. Add your first verified property above (use fictional details for testing).</div>}
    </section>
    <section className="panel phase4b-card"><div className="panel-heading"><div><h2>Available site-visit slots</h2><p>Add time windows before booking buyers. Times use your laptop&apos;s local timezone.</p></div><CalendarPlus size={21}/></div>
      <form className="phase4b-form" onSubmit={addSlot}>
        <label>Active property<select className="field" required value={slotProperty} onChange={e=>setSlotProperty(e.target.value)}><option value="">Choose property</option>{properties.filter(p=>p.listing_status==="Active").map(p=><option value={p.id} key={p.id}>{p.title} — {p.locality}</option>)}</select></label>
        <label>Start date and time<input className="field" required type="datetime-local" value={startLocal} onChange={e=>setStartLocal(e.target.value)}/></label>
        <label>Duration<select className="field" value={duration} onChange={e=>setDuration(e.target.value)}><option value="30">30 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option><option value="120">2 hours</option></select></label>
        <div className="phase4b-actions"><button className="btn btn-dark" disabled={slotSaving} type="submit"><CalendarPlus size={16}/>{slotSaving?"Adding…":"Add slot"}</button></div>
      </form>
      <div className="phase4b-slot-list">{slots.map(slot=><div className="phase4b-slot" key={slot.id}><span><strong>{dateTime(slot.starts_at)}</strong><small>{properties.find(p=>p.id===slot.property_id)?.title??"Property"} · until {new Date(slot.ends_at).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"})}</small></span><button aria-label="Delete slot" className="phase4b-remove" onClick={()=>{void removeSlot(slot);}}><Trash2 size={15}/></button></div>)}{!slots.length&&<p className="phase4b-muted">No future slots. Create one to enable bookings.</p>}</div>
    </section>
  </div>;
}
