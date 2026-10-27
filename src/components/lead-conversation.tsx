"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Bot, Copy, MessageSquareText, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/lib/types";
import { useLeads } from "@/components/lead-provider";

type Message = { id: string; role: "buyer" | "assistant"; message: string; created_at: string };

export function LeadConversation({ lead }: { lead: Lead }) {
  const { user } = useLeads();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const reload = useCallback(async () => {
    if (!user) return;
    const { data, error: fetchError } = await supabase.from("lead_conversations")
      .select("id,role,message,created_at")
      .eq("lead_id", lead.id).eq("user_id", user.id)
      .order("created_at", { ascending: true }).limit(100);
    if (fetchError) throw fetchError;
    setMessages((data ?? []) as Message[]);
  }, [lead.id, user]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      try {
        if (!user) return;
        const { data, error: fetchError } = await supabase.from("lead_conversations")
          .select("id,role,message,created_at")
          .eq("lead_id", lead.id).eq("user_id", user.id)
          .order("created_at", { ascending: true }).limit(100);
        if (fetchError) throw fetchError;
        if (active) setMessages((data ?? []) as Message[]);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load conversation");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => { active = false; };
  }, [lead.id, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || sending) return;
    const buyerText = message.trim();
    setSending(true);
    setError("");
    setNotice("");
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) throw new Error("Please sign in again.");
      const response = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ leadId: lead.id, buyerMessage: buyerText }),
      });
      const result: { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error ?? "AI conversation failed");
      setMessage("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI conversation failed");
      // Server may have successfully stored the buyer's message before the AI failure.
      try { await reload(); } catch { /* Keep original diagnostic. */ }
    } finally { setSending(false); }
  }

  async function copyDraft(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Draft copied. Review it before sharing with anyone.");
    } catch { setNotice("Could not copy automatically; select and copy the message."); }
  }

  return <section className="ai-review-box chat-panel">
    <div className="ai-review-heading"><span className="eyebrow">PHASE 4A · FREE LOCAL AI</span>
      <h3><MessageSquareText size={17}/> Buyer conversation simulator</h3>
      <p>Enter a fictional buyer message. Ollama drafts a response for your salesperson. Nothing is sent to WhatsApp or the customer.</p>
    </div>
    <div className="chat-messages" aria-live="polite">
      {loading ? <p className="chat-empty">Loading conversation…</p> : messages.length === 0 ?
        <p className="chat-empty">No messages yet. Try: “I need a 3 BHK in Bailey Road and want to visit next week.”</p> :
        messages.map(item => <div key={item.id} className={`chat-bubble ${item.role === "buyer" ? "chat-buyer" : "chat-assistant"}`}>
          <div className="chat-message-label">{item.role === "buyer" ? "Buyer (simulated)" : "AI draft · not sent"}</div>
          <p>{item.message}</p>
          <div className="chat-message-footer"><span>{new Date(item.created_at).toLocaleTimeString("en-IN", { hour:"2-digit",minute:"2-digit" })}</span>
            {item.role === "assistant" && <button type="button" onClick={() => { void copyDraft(item.message); }} aria-label="Copy AI draft"><Copy size={13}/> Copy</button>}
          </div>
        </div>)
      }
    </div>
    <form className="chat-form" onSubmit={(event) => { void submit(event); }}>
      <label className="input-label" htmlFor="simulated-buyer-message">Simulated buyer message</label>
      <textarea id="simulated-buyer-message" className="field textarea-field" rows={3} maxLength={700}
        placeholder="Example: I prefer Bailey Road, budget up to 90 lakh, can I visit next weekend?"
        value={message} onChange={e => setMessage(e.target.value)}/>
      <button className="btn btn-dark w-full" type="submit" disabled={loading || sending || message.trim().length < 2}>
        {sending ? <Bot size={16}/> : <Send size={16}/>}{sending ? "Generating draft with Ollama…" : "Save buyer message & generate AI draft"}
      </button>
    </form>
    {error && <p role="alert" className="login-error">{error}</p>}
    {notice && <p className="chat-notice" role="status">{notice}</p>}
    <small className="chat-footnote">For demonstration with fictitious data only. AI can be wrong. Do not promise availability or confirm bookings without a human verifying them.</small>
  </section>;
}
