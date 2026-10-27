"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AIReview, Lead, LeadStatus, NewLead } from "@/lib/types";

type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string | null;
  budget: string | null;
  property_type: string | null;
  source: string | null;
  interest: string | null;
  status: string;
  created_at: string;
  note: string | null;
  user_id: string;
  ai_priority: string | null;
  ai_summary: string | null;
  ai_questions: string[] | null;
  ai_next_step: string | null;
  ai_draft: string | null;
  ai_analyzed_at: string | null;
};

function fromRow(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone,
    city: row.city ?? "",
    budget: row.budget ?? "",
    propertyType: row.property_type ?? "",
    source: (row.source ?? "Other") as Lead["source"],
    interest: row.interest ?? "",
    status: row.status as LeadStatus,
    createdAt: row.created_at,
    note: row.note ?? "",
    aiReview: row.ai_priority && row.ai_summary && row.ai_analyzed_at ? {
      priority: (["High", "Medium", "Low"].includes(row.ai_priority) ? row.ai_priority : "Low") as AIReview["priority"],
      summary: row.ai_summary,
      questions: Array.isArray(row.ai_questions) ? row.ai_questions.filter(q => typeof q === "string") : [],
      nextStep: row.ai_next_step ?? "",
      draftMessage: row.ai_draft ?? "",
      analyzedAt: row.ai_analyzed_at,
    } : null,
  };
}

type LeadContextValue = {
  user: User | null;
  authLoading: boolean;
  leads: Lead[];
  ready: boolean;
  error: string | null;
  clearError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  addLead: (input: NewLead) => Promise<string>;
  setStatus: (id: string, status: LeadStatus) => Promise<void>;
  setNote: (id: string, note: string) => Promise<void>;
  removeLead: (id: string) => Promise<void>;
  qualifyLead: (id: string) => Promise<AIReview>;
};

const LeadContext = createContext<LeadContextValue | null>(null);

function showError(err: unknown) {
  return err instanceof Error ? err.message : "Unexpected database error";
}

export function LeadProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    // Initial identity check, followed by updates from the Supabase auth listener.
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      if (authError) setError(authError.message);
      setUser(data.user);
      setAuthLoading(false);
    }).catch((err: unknown) => {
      if (!active) return;
      setError(showError(err));
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const refresh = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from("leads")
      .select("id,name,email,phone,city,budget,property_type,source,interest,status,created_at,note,user_id,ai_priority,ai_summary,ai_questions,ai_next_step,ai_draft,ai_analyzed_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (loadError) throw loadError;
    setLeads(((data ?? []) as LeadRow[]).map(fromRow));
  }, []);

  useEffect(() => {
    let active = true;
    // RLS is the security boundary; this effect only manages UI loading state.
    void Promise.resolve().then(async () => {
      if (!active) return;
      if (!user) {
        setLeads([]);
        setReady(false);
        return;
      }
      setReady(false);
      try {
        const { data, error: loadError } = await supabase
          .from("leads")
          .select("id,name,email,phone,city,budget,property_type,source,interest,status,created_at,note,user_id,ai_priority,ai_summary,ai_questions,ai_next_step,ai_draft,ai_analyzed_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1000);
        if (loadError) throw loadError;
        if (active) {
          setLeads(((data ?? []) as LeadRow[]).map(fromRow));
          setReady(true);
        }
      } catch (err) {
        if (active) {
          setError(showError(err));
          setReady(true);
        }
      }
    });
    return () => { active = false; };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) throw loginError;
  }, []);

  const signOut = useCallback(async () => {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) { setError(logoutError.message); throw logoutError; }
    setLeads([]);
  }, []);

  const addLead = useCallback(async (input: NewLead): Promise<string> => {
    if (!user) throw new Error("Please sign in first.");
    const { data, error: addError } = await supabase.from("leads").insert({
      user_id: user.id,
      name: input.name,
      email: input.email || null,
      phone: input.phone,
      city: input.city,
      budget: input.budget,
      property_type: input.propertyType,
      source: input.source,
      interest: input.interest,
    }).select("id,name,email,phone,city,budget,property_type,source,interest,status,created_at,note,user_id,ai_priority,ai_summary,ai_questions,ai_next_step,ai_draft,ai_analyzed_at").single();
    if (addError) { setError(addError.message); throw addError; }
    setLeads(prev => [fromRow(data as LeadRow), ...prev]);
    return data.id as string;
  }, [user]);

  const update = useCallback(async (id: string, patch: Record<string, string>) => {
    if (!user) throw new Error("Please sign in first.");
    const { data, error: updateError } = await supabase.from("leads")
      .update(patch).eq("id", id).eq("user_id", user.id)
      .select("id,name,email,phone,city,budget,property_type,source,interest,status,created_at,note,user_id,ai_priority,ai_summary,ai_questions,ai_next_step,ai_draft,ai_analyzed_at").single();
    if (updateError) { setError(updateError.message); throw updateError; }
    setLeads(prev => prev.map(lead => lead.id === id ? fromRow(data as LeadRow) : lead));
  }, [user]);

  const setStatus = useCallback((id: string, status: LeadStatus) => update(id, { status }), [update]);
  const setNote = useCallback((id: string, note: string) => update(id, { note }), [update]);
  const removeLead = useCallback(async (id: string) => {
    if (!user) throw new Error("Please sign in first.");
    const { data, error: deleteError } = await supabase.from("leads")
      .delete().eq("id", id).eq("user_id", user.id).select("id");
    if (deleteError) { setError(deleteError.message); throw deleteError; }
    if (!data?.length) throw new Error("Lead was not deleted; check your access permissions.");
    setLeads(prev => prev.filter(lead => lead.id !== id));
  }, [user]);

  const qualifyLead = useCallback(async (id: string): Promise<AIReview> => {
    if (!user) throw new Error("Please sign in first.");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) throw new Error("Your session expired. Please sign in again.");
    const response = await fetch("/api/qualify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ leadId: id }),
    });
    const result: { review?: AIReview; error?: string } = await response.json();
    if (!response.ok || !result.review) throw new Error(result.error || "AI review failed");
    // Update the local record with the server-saved AI review.
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, aiReview: result.review! } : lead));
    return result.review;
  }, [user]);

  return <LeadContext.Provider value={{
    user, authLoading, leads, ready, error,
    clearError: () => setError(null),
    signIn, signOut, refresh, addLead, setStatus, setNote, removeLead, qualifyLead,
  }}>{children}</LeadContext.Provider>;
}

export function useLeads() {
  const value = useContext(LeadContext);
  if (!value) throw new Error("useLeads must be used within LeadProvider");
  return value;
}
