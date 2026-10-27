"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { CalendarCheck2, Check, Clock3, MapPin, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useLeads } from "@/components/lead-provider";
import {
  dateTime,
  inr,
  type Property,
  type SiteVisit,
  type VisitSlot,
  type VisitStatus,
} from "@/lib/property-types";

const message = (err: unknown) =>
  err instanceof Error ? err.message : "Unexpected error";

const statuses: VisitStatus[] = [
  "Requested",
  "Confirmed",
  "Completed",
  "Cancelled",
];

export default function VisitsPage() {
  const { user, leads, refresh: refreshLeads } = useLeads();

  const [properties, setProperties] = useState<Property[]>([]);
  const [slots, setSlots] = useState<VisitSlot[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);

  const [leadId, setLeadId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [now, setNow] = useState(0);

  // Date.now() runs in an effect callback, never during React render.
  useEffect(() => {
    const updateClock = () => setNow(Date.now());
    const initialTimer = setTimeout(updateClock, 0);
    const interval = setInterval(updateClock, 60_000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  const reload = useCallback(async () => {
    if (!user) return;

    const [p, s, v] = await Promise.all([
      supabase
        .from("properties")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("property_visit_slots")
        .select("*")
        .eq("user_id", user.id)
        .order("starts_at", { ascending: false })
        .limit(1000),
      supabase
        .from("site_visits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    if (p.error) throw p.error;
    if (s.error) throw s.error;
    if (v.error) throw v.error;

    setProperties((p.data ?? []) as Property[]);
    setSlots((s.data ?? []) as VisitSlot[]);
    setVisits((v.data ?? []) as SiteVisit[]);
  }, [user]);

  useEffect(() => {
    let active = true;

    void Promise.resolve().then(async () => {
      if (!active || !user) return;

      try {
        const [p, s, v] = await Promise.all([
          supabase
            .from("properties")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(200),
          supabase
            .from("property_visit_slots")
            .select("*")
            .eq("user_id", user.id)
            .order("starts_at", { ascending: false })
            .limit(1000),
          supabase
            .from("site_visits")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(500),
        ]);

        if (p.error) throw p.error;
        if (s.error) throw s.error;
        if (v.error) throw v.error;

        if (active) {
          setProperties((p.data ?? []) as Property[]);
          setSlots((s.data ?? []) as VisitSlot[]);
          setVisits((v.data ?? []) as SiteVisit[]);
        }
      } catch (err) {
        if (active) setError(message(err));
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [user]);

  const activeSlotIds = useMemo(
    () =>
      new Set(
        visits
          .filter((visit) =>
            visit.status === "Requested" || visit.status === "Confirmed"
          )
          .map((visit) => visit.slot_id)
      ),
    [visits]
  );

  const availableSlots = useMemo(
    () =>
      slots
        .filter(
          (slot) =>
            slot.property_id === propertyId &&
            now > 0 &&
            new Date(slot.starts_at).getTime() > now &&
            !activeSlotIds.has(slot.id)
        )
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [slots, propertyId, activeSlotIds, now]
  );

  const availableFutureSlots = useMemo(
    () =>
      slots.filter(
        (slot) =>
          now > 0 &&
          new Date(slot.starts_at).getTime() > now &&
          !activeSlotIds.has(slot.id)
      ).length,
    [slots, activeSlotIds, now]
  );

  const propertyName = (id: string) =>
    properties.find((property) => property.id === id)?.title ??
    "Property unavailable";

  const leadName = (id: string) =>
    leads.find((lead) => lead.id === id)?.name ?? "Lead unavailable";

  async function createVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const property = properties.find(
        (item) => item.id === propertyId && item.listing_status === "Active"
      );
      const slot = availableSlots.find((item) => item.id === slotId);
      const lead = leads.find((item) => item.id === leadId);

      if (!property || !slot || !lead) {
        throw new Error(
          "Select a lead, Active property and an available future slot."
        );
      }

      const { error: saveError } = await supabase.from("site_visits").insert({
        user_id: user.id,
        lead_id: lead.id,
        property_id: property.id,
        slot_id: slot.id,
        status: "Requested",
        notes: notes.trim(),
      });
      if (saveError) throw saveError;

      setLeadId("");
      setPropertyId("");
      setSlotId("");
      setNotes("");
      setSuccess(
        "Site visit requested. A salesperson must confirm it before informing the buyer."
      );
      await reload();
    } catch (err) {
      setError(
        message(err) + " If this time was booked in another browser, refresh the slots."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(visit: SiteVisit, status: VisitStatus) {
    if (!user) return;

    setError("");
    setSuccess("");

    try {
      const { error: saveError } = await supabase
        .from("site_visits")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", visit.id)
        .eq("user_id", user.id);
      if (saveError) throw saveError;

      await reload();

      if (status === "Confirmed") {
        // Only a human confirmation changes the lead's sales status.
        const { error: leadError } = await supabase
          .from("leads")
          .update({ status: "Visit Booked" })
          .eq("id", visit.lead_id)
          .eq("user_id", user.id);
        if (leadError) throw leadError;
        await refreshLeads();
      }

      setSuccess(
        `Visit status changed to ${status}. No customer message has been sent.`
      );
    } catch (err) {
      setError(message(err));
    }
  }

  const confirmed = visits.filter(
    (visit) => visit.status === "Confirmed"
  ).length;

  return (
    <div className="page-stack phase4b">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            <span className="eyebrow-dot" /> SALES APPOINTMENTS
          </span>
          <h1>Site visits</h1>
          <p>Request and confirm real appointments against available property slots.</p>
        </div>
        <Link href="/properties" className="btn btn-outline">
          <Plus size={16} /> Add property slots
        </Link>
      </div>

      {error && <div className="db-error" role="alert">{error}</div>}
      {success && (
        <div className="phase4b-ok" role="status">
          <Check size={17} /> {success}
        </div>
      )}

      <div className="phase4b-stat-grid">
        <div>
          <small>Total visit requests</small>
          <strong>{loading ? "—" : visits.length}</strong>
        </div>
        <div>
          <small>Confirmed appointments</small>
          <strong>{loading ? "—" : confirmed}</strong>
        </div>
        <div>
          <small>Available future slots</small>
          <strong>{loading ? "—" : availableFutureSlots}</strong>
        </div>
      </div>

      <section className="panel phase4b-card">
        <div className="panel-heading">
          <div>
            <h2>Book a site visit</h2>
            <p>Reservations start as Requested and cannot be double-booked.</p>
          </div>
          <CalendarCheck2 size={20} />
        </div>

        <form className="phase4b-form" onSubmit={createVisit}>
          <label>
            Buyer lead
            <select
              className="field"
              required
              value={leadId}
              onChange={(event) => setLeadId(event.target.value)}
            >
              <option value="">Choose lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} — {lead.city}
                </option>
              ))}
            </select>
          </label>

          <label>
            Active property
            <select
              className="field"
              required
              value={propertyId}
              onChange={(event) => {
                setPropertyId(event.target.value);
                setSlotId("");
              }}
            >
              <option value="">Choose property</option>
              {properties
                .filter((property) => property.listing_status === "Active")
                .map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title} — {inr(property.price_inr)}
                  </option>
                ))}
            </select>
          </label>

          <label className="phase4b-wide">
            Available time slot
            <select
              className="field"
              required
              value={slotId}
              onChange={(event) => setSlotId(event.target.value)}
            >
              <option value="">Choose time</option>
              {availableSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {dateTime(slot.starts_at)} —{" "}
                  {new Date(slot.ends_at).toLocaleTimeString("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </option>
              ))}
            </select>
          </label>

          <label className="phase4b-wide">
            Internal notes (optional)
            <textarea
              className="field"
              maxLength={1000}
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Sales executive, meeting instructions, any accessibility requests…"
            />
          </label>

          <div className="phase4b-actions">
            <button
              className="btn btn-dark"
              type="submit"
              disabled={saving || !availableSlots.length}
            >
              <CalendarCheck2 size={17} />
              {saving ? "Booking…" : "Request visit"}
            </button>
            <span className="phase4b-muted">
              No buyer notifications are sent automatically.
            </span>
          </div>
        </form>
      </section>

      <section className="panel phase4b-card">
        <div className="panel-heading">
          <div>
            <h2>All appointments</h2>
            <p>Confirm after coordinating with your property representative.</p>
          </div>
          <button
            className="btn btn-outline"
            onClick={() => {
              void reload().catch((err) => setError(message(err)));
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        <div className="phase4b-visits">
          {visits.map((visit) => {
            const slot = slots.find((item) => item.id === visit.slot_id);
            return (
              <div className="phase4b-visit" key={visit.id}>
                <div className="phase4b-visit-heading">
                  <strong>{leadName(visit.lead_id)}</strong>
                  <span className={`phase4b-tag phase4b-tag-${visit.status.toLowerCase()}`}>
                    {visit.status}
                  </span>
                </div>
                <p><MapPin size={15} /> {propertyName(visit.property_id)}</p>
                <p>
                  <Clock3 size={15} />{" "}
                  {slot
                    ? dateTime(slot.starts_at)
                    : "Slot date unavailable (past or removed)"}
                </p>
                {visit.notes && <p className="phase4b-notes">{visit.notes}</p>}
                <div className="phase4b-toolbar">
                  <label className="phase4b-inline">
                    Set status{" "}
                    <select
                      className="field"
                      value={visit.status}
                      onChange={(event) => {
                        void changeStatus(
                          visit,
                          event.target.value as VisitStatus
                        );
                      }}
                    >
                      {statuses.map((status) => (
                        <option value={status} key={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        {!loading && !visits.length && (
          <div className="phase4b-empty">
            No bookings yet. Add property slots, then request a visit.
          </div>
        )}
      </section>
    </div>
  );
}
