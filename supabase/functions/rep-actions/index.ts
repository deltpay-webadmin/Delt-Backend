/**
 * rep-actions — in-call actions for the Call Playbooks live-call panel.
 *
 * Actions (POST JSON { action, ... }, staff JWT required):
 *   book_meeting   — create rep_meetings row, email the merchant a
 *                    confirmation with an .ics calendar invite (+ a copy
 *                    to the rep), return a click-to-text confirmation SMS.
 *   send_app_link  — product 'pay': create deal_submission + tokenized
 *                    merchant application (same shape as mpa-application
 *                    self-start) and email/return the /apply/mpa/<token>
 *                    link. product 'capital': build the deltcapital.com
 *                    /apply?d=<b64> deep link (same payload as the
 *                    DeltCapital repo's _deeplink.js). channel 'email'
 *                    sends it (Resend, suppression-gated); channel 'sms'
 *                    returns { link, smsBody } for the rep to fire from
 *                    Google Voice (manual SMS, house convention).
 *   run-reminders  — cron only (x-cron-secret): T-24h and T-2h meeting
 *                    reminder emails to the merchant + "text them now"
 *                    nudge to the rep. Scheduled by 0009_rep_actions.sql.
 *
 * All merchant emails check email_suppressions first and log send
 * failures to email_events (same deliverability model as lifecycle.ts).
 * App-link sends log to outreach_events (campaign 'rep-app-link').
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const FROM_SALES = () => Deno.env.get("LIFECYCLE_FROM_SALES") || "David Hazday <david@deltpay.com>";
const FROM_CAPITAL = () => Deno.env.get("LIFECYCLE_FROM_CAPITAL") || "David Hazday <david@deltcapital.com>";
const REPLY_TO = () => Deno.env.get("LIFECYCLE_REPLY_TO") || "david@deltpay.com";
const SITE_URL = () => (Deno.env.get("SITE_URL") || "https://www.deltpay.com").replace(/\/$/, "");
const CAPITAL_URL = () => (Deno.env.get("CAPITAL_URL") || "https://www.deltcapital.com").replace(/\/$/, "");

const svc = (): SupabaseClient => createClient(SUPABASE_URL, SERVICE_KEY);

function b64FromString(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });

// ── Email plumbing (same model as _shared/lifecycle.ts) ─────────

async function isSuppressed(email: string): Promise<boolean> {
  try {
    const { data } = await svc().from("email_suppressions").select("email")
      .eq("email", String(email).trim().toLowerCase()).maybeSingle();
    return Boolean(data);
  } catch { return false; } // fail open — never block transactional mail
}

async function logEmailEvent(recipient: string, reason: string, subject: string) {
  try {
    await svc().from("email_events").insert({ recipient, event: "send_error", reason, subject });
  } catch { /* best effort */ }
}

async function sendEmail(opts: {
  to: string; from: string; subject: string; html: string;
  replyTo?: string; ics?: string;
}): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.warn("[rep-actions] RESEND_API_KEY not set"); return false; }
  if (await isSuppressed(opts.to)) {
    console.warn("[rep-actions] suppressed recipient — skipping:", opts.to);
    return false;
  }
  const body: Record<string, unknown> = {
    from: opts.from, to: [opts.to], subject: opts.subject, html: opts.html,
    reply_to: opts.replyTo || REPLY_TO(),
  };
  if (opts.ics) {
    body.attachments = [{ filename: "invite.ics", content: b64FromString(opts.ics) }];
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 300);
      await logEmailEvent(opts.to, `resend ${res.status}: ${detail}`, opts.subject);
      return false;
    }
    return true;
  } catch (err) {
    await logEmailEvent(opts.to, String((err as Error)?.message || err), opts.subject);
    return false;
  }
}

// ── Template shell (Delt navy on white, house style) ────────────

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shell(inner: string, brand: "pay" | "capital"): string {
  const name = brand === "capital" ? "Delt Capital" : "DeltPay";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f6fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
        <tr><td style="background:#041E42;padding:20px 28px;">
          <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:.02em;">${name}</span>
        </td></tr>
        <tr><td style="padding:28px;">${inner}</td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #e8ecf5;">
          <p style="margin:0;font-size:11px;line-height:1.5;color:#8a93a8;">
            Questions? Just reply to this email — it lands in a real inbox, not a ticket queue.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

const h1 = (t: string) => `<h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#0b1526;">${t}</h1>`;
const p = (t: string) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#3c4657;">${t}</p>`;
const btn = (url: string, label: string) =>
  `<p style="margin:20px 0;"><a href="${esc(url)}" style="display:inline-block;background:#041E42;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 22px;border-radius:10px;">${esc(label)}</a></p>`;
const detailBox = (rows: [string, string][]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#f7f9fd;border-radius:10px;margin:0 0 14px;">
    ${rows.map(([k, v]) => `<tr><td style="padding:8px 14px 0;font-size:12px;color:#8a93a8;width:110px;vertical-align:top;">${esc(k)}</td><td style="padding:8px 14px 0;font-size:13px;color:#0b1526;font-weight:600;">${esc(v)}</td></tr>`).join("")}
    <tr><td colspan="2" style="padding:8px;"></td></tr>
  </table>`;

// ── Helpers ─────────────────────────────────────────────────────

const firstNameOf = (s?: string | null) => String(s || "").trim().split(/\s+/)[0] || "there";

function fmtEt(iso: string): { date: string; time: string; full: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }) + " ET";
  return { date, time, full: `${date} at ${time}` };
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

function buildIcs(m: {
  id: string; summary: string; description: string; location: string;
  startsAt: string; durationMin: number; organizerName: string; organizerEmail: string;
  attendeeName: string; attendeeEmail: string;
}): string {
  const start = new Date(m.startsAt);
  const end = new Date(start.getTime() + m.durationMin * 60000);
  const escIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Delt//CRM//EN", "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${m.id}@delt-crm`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escIcs(m.summary)}`,
    `DESCRIPTION:${escIcs(m.description)}`,
    m.location ? `LOCATION:${escIcs(m.location)}` : "",
    `ORGANIZER;CN=${escIcs(m.organizerName)}:mailto:${m.organizerEmail}`,
    m.attendeeEmail ? `ATTENDEE;CN=${escIcs(m.attendeeName)};RSVP=TRUE:mailto:${m.attendeeEmail}` : "",
    "STATUS:CONFIRMED",
    "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

function googleCalUrl(m: { summary: string; description: string; location: string; startsAt: string; durationMin: number }): string {
  const start = new Date(m.startsAt);
  const end = new Date(start.getTime() + m.durationMin * 60000);
  const q = new URLSearchParams({
    action: "TEMPLATE", text: m.summary,
    dates: `${icsDate(start)}/${icsDate(end)}`,
    details: m.description, location: m.location || "",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

// Capital apply deep link — same payload shape as DeltCapital api/_deeplink.js
function capitalApplyUrl(opts: { leadId?: string; firstName?: string; businessName?: string; email?: string; phone?: string }): string {
  const payload = {
    v: 1, t: Date.now(),
    leadId: opts.leadId ? String(opts.leadId) : undefined,
    firstName: String(opts.firstName || "").trim(),
    businessName: String(opts.businessName || "").trim(),
    email: String(opts.email || "").trim(),
    phone: String(opts.phone || "").trim(),
    low: 0, high: 0, revenue: 0, tib: "", acceptsCards: null, cardSales: 0, boosted: false,
  };
  const b64 = b64FromString(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${CAPITAL_URL()}/apply?d=${b64}`;
}

async function defaultOrgId(): Promise<string | null> {
  const admin = svc();
  const { data: def } = await admin.rpc("default_org_id");
  if (typeof def === "string" && def) return def;
  const { data: orgs } = await admin.from("orgs").select("id").order("created_at").limit(1);
  return orgs?.[0]?.id ?? null;
}

async function logOutreach(opts: {
  leadId?: string | null; email?: string | null; name?: string | null;
  channel: "email" | "sms"; meta: Record<string, unknown>;
}) {
  try {
    const orgId = await defaultOrgId();
    if (!orgId) return;
    await svc().from("outreach_events").insert({
      org_id: orgId,
      lead_id: opts.leadId ?? null,
      lead_email: opts.email ?? null,
      lead_name: opts.name ?? null,
      campaign: "rep-app-link",
      channel: opts.channel,
      event: "sent",
      meta: opts.meta,
    });
  } catch (err) { console.warn("[rep-actions] outreach log failed:", err); }
}

const newToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Staff auth ──────────────────────────────────────────────────

async function requireStaff(req: Request): Promise<{ ok: true; userId: string; email: string } | { ok: false; res: Response }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const anon = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await anon.auth.getUser();
  if (!user) return { ok: false, res: json({ error: "Not signed in" }, 401) };
  const { data: staff } = await svc().from("staff_profiles").select("id,email").eq("id", user.id).maybeSingle();
  if (!staff) return { ok: false, res: json({ error: "Staff access required" }, 403) };
  return { ok: true, userId: user.id, email: user.email ?? staff.email ?? "" };
}

async function verifyCronSecret(req: Request): Promise<boolean> {
  const got = req.headers.get("x-cron-secret") ?? "";
  if (!got) return false;
  const { data } = await svc().rpc("cron_secret");
  return typeof data === "string" && data.length > 0 && data === got;
}

// ── Meeting emails ──────────────────────────────────────────────

interface MeetingRow {
  id: string; product: "deltpay" | "deltcapital"; merchant_business: string;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
  mode: "online" | "in_person"; location: string | null; meeting_link: string | null;
  starts_at: string; duration_min: number; rep_name: string | null; rep_email: string | null;
  notes: string | null; lead_id: string | null;
}

function meetingWhere(m: MeetingRow): [string, string] {
  return m.mode === "online"
    ? ["Where", m.meeting_link ? `Online — ${m.meeting_link}` : "Online (link to follow)"]
    : ["Where", m.location || "In person"];
}

function meetingBrand(m: MeetingRow): "pay" | "capital" { return m.product === "deltcapital" ? "capital" : "pay"; }
function meetingFrom(m: MeetingRow): string { return m.product === "deltcapital" ? FROM_CAPITAL() : FROM_SALES(); }
function meetingSummary(m: MeetingRow): string {
  const brand = m.product === "deltcapital" ? "Delt Capital" : "DeltPay";
  return `${brand} — ${m.merchant_business} × ${m.rep_name || "Delt"}`;
}
function meetingDescription(m: MeetingRow): string {
  const lines = [
    m.product === "deltcapital"
      ? "Working capital review with Delt Capital."
      : "Processing statement review with DeltPay.",
    m.mode === "online" && m.meeting_link ? `Join: ${m.meeting_link}` : "",
    m.notes ? `Notes: ${m.notes}` : "",
    `Questions? Reply to ${m.rep_email || REPLY_TO()}`,
  ];
  return lines.filter(Boolean).join("\n");
}

function meetingIcs(m: MeetingRow): string {
  return buildIcs({
    id: m.id,
    summary: meetingSummary(m),
    description: meetingDescription(m),
    location: m.mode === "online" ? (m.meeting_link || "Online") : (m.location || ""),
    startsAt: m.starts_at, durationMin: m.duration_min,
    organizerName: m.rep_name || "Delt", organizerEmail: m.rep_email || REPLY_TO(),
    attendeeName: m.contact_name || m.merchant_business, attendeeEmail: m.contact_email || "",
  });
}

async function sendMeetingConfirmation(m: MeetingRow): Promise<{ merchant: boolean; rep: boolean }> {
  const when = fmtEt(m.starts_at);
  const ics = meetingIcs(m);
  const gcal = googleCalUrl({
    summary: meetingSummary(m), description: meetingDescription(m),
    location: m.mode === "online" ? (m.meeting_link || "Online") : (m.location || ""),
    startsAt: m.starts_at, durationMin: m.duration_min,
  });
  const brand = meetingBrand(m);
  const prep = m.product === "deltcapital"
    ? "To make it count, have a rough idea of how much capital you could put to work — I'll bring real numbers."
    : "One favor — have your latest processing statement handy. That's where the savings hide.";

  let merchant = false;
  if (m.contact_email) {
    merchant = await sendEmail({
      to: m.contact_email,
      from: meetingFrom(m),
      replyTo: m.rep_email || undefined,
      subject: `Confirmed: ${when.date}, ${when.time} — ${m.merchant_business} × Delt`,
      ics,
      html: shell(
        h1("You're on the calendar") +
        p(`Hi ${esc(firstNameOf(m.contact_name))},`) +
        p(`Great talking with you — here's everything for our meeting:`) +
        detailBox([
          ["When", when.full],
          meetingWhere(m),
          ["With", `${m.rep_name || "Delt"} — Delt`],
          ["Length", `${m.duration_min} minutes`],
        ]) +
        (m.mode === "online" && m.meeting_link ? btn(m.meeting_link, "Join the meeting") : "") +
        p(`<a href="${esc(gcal)}" style="color:#041E42;font-weight:600;">Add to Google Calendar</a> — or open the attached invite for Apple/Outlook.`) +
        p(prep) +
        p(`Need to move it? Just reply to this email.`),
        brand,
      ),
    });
  }

  let rep = false;
  if (m.rep_email) {
    rep = await sendEmail({
      to: m.rep_email,
      from: "Delt CRM <noreply@deltpay.com>",
      subject: `Booked: ${m.merchant_business} — ${when.full}`,
      ics,
      html: shell(
        h1("Meeting booked") +
        detailBox([
          ["Merchant", `${m.contact_name || "—"} — ${m.merchant_business}`],
          ["When", when.full],
          meetingWhere(m),
          ["Phone", m.contact_phone || "—"],
          ["Product", m.product === "deltcapital" ? "Delt Capital" : "DeltPay"],
        ]) +
        (m.notes ? p(`Notes: ${esc(m.notes)}`) : "") +
        p("Calendar invite attached. Reminders to the merchant go out automatically 24 hours and 2 hours before."),
        brand,
      ),
    });
  }
  return { merchant, rep };
}

// Manual-SMS body the rep can fire from Google Voice right after booking.
function meetingSmsBody(m: MeetingRow): string {
  const when = fmtEt(m.starts_at);
  const where = m.mode === "online"
    ? (m.meeting_link ? `Join link: ${m.meeting_link}` : "I'll send the video link shortly.")
    : (m.location ? `Address: ${m.location}` : "");
  return `Hi ${firstNameOf(m.contact_name)}, it's ${m.rep_name || "your rep"} with Delt — we're confirmed for ${when.full}. ${where} Reply here if anything changes.`.trim();
}

// ── Reminder job (cron) ─────────────────────────────────────────

function withinEtSendWindow(): boolean {
  const hour = Number(new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }));
  return hour >= 8 && hour < 21;
}

async function runReminders(): Promise<{ checked: number; sent24: number; sent2: number }> {
  const admin = svc();
  const now = Date.now();
  const { data: meetings } = await admin
    .from("rep_meetings")
    .select("*")
    .eq("status", "scheduled")
    .gte("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + 26 * 3600_000).toISOString());
  let sent24 = 0, sent2 = 0;
  if (!withinEtSendWindow()) return { checked: meetings?.length ?? 0, sent24, sent2 };

  for (const m of (meetings ?? []) as (MeetingRow & { remind_24h_sent_at: string | null; remind_2h_sent_at: string | null })[]) {
    const hoursOut = (new Date(m.starts_at).getTime() - now) / 3600_000;
    const when = fmtEt(m.starts_at);
    const brand = meetingBrand(m);

    // T-24h window (22h–26h out)
    if (!m.remind_24h_sent_at && hoursOut <= 26 && hoursOut > 20) {
      if (m.contact_email) {
        await sendEmail({
          to: m.contact_email, from: meetingFrom(m), replyTo: m.rep_email || undefined,
          subject: `Tomorrow: ${when.time} with ${m.rep_name || "Delt"}`,
          html: shell(
            h1("See you tomorrow") +
            p(`Hi ${esc(firstNameOf(m.contact_name))} — quick reminder that we're on for <strong>${esc(when.full)}</strong>.`) +
            detailBox([["When", when.full], meetingWhere(m)]) +
            (m.product === "deltcapital"
              ? p("I'll bring real numbers on what we can get you — takes the full 15 minutes, no more.")
              : p("Have your latest processing statement nearby — that's the whole meeting.")) +
            p("Need to move it? Just reply."),
            brand,
          ),
        });
      }
      if (m.rep_email && m.contact_phone) {
        const sms = `Hi ${firstNameOf(m.contact_name)}, ${m.rep_name || "Delt"} here — looking forward to tomorrow at ${when.time}. Reply if anything changes.`;
        await sendEmail({
          to: m.rep_email, from: "Delt CRM <noreply@deltpay.com>",
          subject: `Text ${m.contact_name || m.merchant_business} a 24h reminder (1 tap)`,
          html: shell(
            h1("Meeting tomorrow — send the text") +
            detailBox([["Merchant", `${m.contact_name || "—"} — ${m.merchant_business}`], ["When", when.full], ["Phone", m.contact_phone]]) +
            btn(`sms:${m.contact_phone.replace(/[^+\d]/g, "")}?&body=${encodeURIComponent(sms)}`, "Text them now") +
            p(`Suggested: “${esc(sms)}”`),
            brand,
          ),
        });
      }
      await admin.from("rep_meetings").update({ remind_24h_sent_at: new Date().toISOString() }).eq("id", m.id);
      sent24++;
    }

    // T-2h window (1h–3h out)
    if (!m.remind_2h_sent_at && hoursOut <= 3 && hoursOut > 0.75) {
      if (m.contact_email) {
        await sendEmail({
          to: m.contact_email, from: meetingFrom(m), replyTo: m.rep_email || undefined,
          subject: `Today at ${when.time} — ${m.mode === "online" ? "your join link" : "see you soon"}`,
          html: shell(
            h1(`Today at ${esc(when.time)}`) +
            p(`Hi ${esc(firstNameOf(m.contact_name))} — we're on in a couple of hours.`) +
            detailBox([["When", when.full], meetingWhere(m)]) +
            (m.mode === "online" && m.meeting_link ? btn(m.meeting_link, "Join the meeting") : "") +
            p("Running behind? Just reply and we'll adjust."),
            brand,
          ),
        });
      }
      await admin.from("rep_meetings").update({ remind_2h_sent_at: new Date().toISOString() }).eq("id", m.id);
      sent2++;
    }
  }
  return { checked: meetings?.length ?? 0, sent24, sent2 };
}

// ── App links ───────────────────────────────────────────────────

async function payApplyLink(opts: {
  business: string; contactName?: string; email?: string; phone?: string; repName: string; userId: string;
}): Promise<{ url: string } | { error: string }> {
  const admin = svc();
  const orgId = await defaultOrgId();
  if (!orgId) return { error: "Organization is not configured" };
  const { data: sub, error: subErr } = await admin.from("deal_submissions").insert({
    org_id: orgId,
    agent_name: opts.repName || "CRM Rep",
    merchant_name: opts.business,
    contact_name: opts.contactName || null,
    email: opts.email || null,
    phone: opts.phone || null,
    monthly_volume: 0,
    notes: `Application link sent from a cold call (Call Playbooks) by ${opts.repName || "rep"}.`,
  }).select("*").single();
  if (subErr) return { error: subErr.message };

  const token = newToken();
  const tokenHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString();
  const linkUrl = `${SITE_URL()}/apply/mpa/${token}`;
  const seed = {
    business: {
      legalName: opts.business, dba: opts.business,
      phone: opts.phone || "", email: opts.email || "",
      contactFirstName: (opts.contactName || "").split(/\s+/)[0] ?? "",
      contactLastName: (opts.contactName || "").split(/\s+/).slice(1).join(" "),
    },
  };
  const { error: appErr } = await admin.from("merchant_applications").insert({
    org_id: orgId,
    submission_id: sub.id,
    data: seed,
    token_hash: tokenHash,
    token_expires_at: expiresAt,
    applicant_email: opts.email || null,
    link_url: linkUrl,
    link_sent_at: new Date().toISOString(),
    created_by: opts.userId,
  });
  if (appErr) return { error: appErr.message };
  return { url: linkUrl };
}

function appLinkEmail(product: "pay" | "capital", opts: { firstName: string; business: string; url: string; repName: string }) {
  if (product === "pay") {
    return {
      subject: "Your DeltPay application link (10 minutes, saves as you go)",
      html: shell(
        h1("Your secure application link") +
        p(`Hi ${esc(opts.firstName)},`) +
        p(`Good talking with you just now — here's the secure application link for <strong>${esc(opts.business)}</strong>:`) +
        btn(opts.url, "Start my application") +
        p(`What to expect:<br/>&bull; <strong>~10 minutes.</strong> Business details, ownership, bank connection, sign.<br/>&bull; <strong>Saves as you go.</strong> Close the tab, come back later — nothing is lost.<br/>&bull; <strong>Bank connection is handled by Plaid</strong> (used by Venmo and American Express). Your credentials never touch our servers.`) +
        p(`Stuck on anything? Reply here — it comes straight to ${esc(opts.repName)}.`),
        "pay",
      ),
    };
  }
  return {
    subject: `${opts.business} — your Delt Capital application (5 minutes)`,
    html: shell(
      h1("Your application link") +
      p(`Hi ${esc(opts.firstName)},`) +
      p(`As promised on our call — here's the application for <strong>${esc(opts.business)}</strong>. It's already pre-filled with your details:`) +
      btn(opts.url, "See what I qualify for") +
      p(`&bull; <strong>~5 minutes</strong>, no paperwork to print<br/>&bull; Checking eligibility <strong>does not affect your credit</strong><br/>&bull; Funding can land in <strong>24–48 hours</strong> once approved`) +
      p(`Questions? Reply here — it comes straight to ${esc(opts.repName)}.`),
      "capital",
    ),
  };
}

function appLinkSms(product: "pay" | "capital", opts: { firstName: string; repName: string; url: string }): string {
  return product === "pay"
    ? `Hi ${opts.firstName}, it's ${opts.repName} with Delt — here's your secure DeltPay application link (saves as you go): ${opts.url}`
    : `Hi ${opts.firstName}, it's ${opts.repName} with Delt Capital — here's your application link, takes about 5 min and won't affect your credit: ${opts.url}`;
}

// ── HTTP entry ──────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return json({ ok: true });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const action = String(body?.action || "");

  // ── cron: reminders ──
  if (action === "run-reminders") {
    if (!(await verifyCronSecret(req))) return json({ error: "Forbidden" }, 403);
    const result = await runReminders();
    return json({ ok: true, ...result });
  }

  // ── everything else: staff only ──
  const auth = await requireStaff(req);
  if (!auth.ok) return auth.res;

  if (action === "book_meeting") {
    const m = body as Record<string, string | number | null>;
    const startsAt = String(m.starts_at || "");
    if (!m.merchant_business || !startsAt || isNaN(new Date(startsAt).getTime())) {
      return json({ error: "merchant_business and a valid starts_at are required" }, 400);
    }
    if (new Date(startsAt).getTime() < Date.now()) {
      return json({ error: "Meeting time is in the past" }, 400);
    }
    const { data: row, error } = await svc().from("rep_meetings").insert({
      lead_id: m.lead_id || null,
      call_session_id: m.call_session_id || null,
      product: m.product === "deltcapital" ? "deltcapital" : "deltpay",
      merchant_business: String(m.merchant_business),
      contact_name: m.contact_name || null,
      contact_email: m.contact_email ? String(m.contact_email).trim().toLowerCase() : null,
      contact_phone: m.contact_phone || null,
      mode: m.mode === "in_person" ? "in_person" : "online",
      location: m.location || null,
      meeting_link: m.meeting_link || null,
      starts_at: startsAt,
      duration_min: Math.min(Math.max(Number(m.duration_min) || 30, 10), 240),
      rep_name: m.rep_name || null,
      rep_email: auth.email || null,
      notes: m.notes || null,
    }).select("*").single();
    if (error) return json({ error: error.message }, 500);

    const sent = await sendMeetingConfirmation(row as MeetingRow);
    if (sent.merchant) {
      await svc().from("rep_meetings").update({ confirm_sent_at: new Date().toISOString() }).eq("id", row.id);
    }
    const smsBody = meetingSmsBody(row as MeetingRow);
    const phone = (row.contact_phone || "").replace(/[^+\d]/g, "");
    return json({
      ok: true,
      meeting_id: row.id,
      confirmation_emailed: sent.merchant,
      rep_copy_emailed: sent.rep,
      sms: phone ? { to: phone, body: smsBody, uri: `sms:${phone}?&body=${encodeURIComponent(smsBody)}` } : null,
      when: fmtEt(startsAt).full,
    });
  }

  if (action === "send_app_link") {
    const product = body.product === "capital" ? "capital" : "pay";
    const channel = body.channel === "sms" ? "sms" : "email";
    const business = String(body.business || "").trim();
    const contactName = String(body.contact_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const repName = String(body.rep_name || "").trim() || "your Delt rep";
    const leadId = body.lead_id ? String(body.lead_id) : undefined;
    if (!business) return json({ error: "business is required" }, 400);
    if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "A valid email is required to email the link" }, 400);
    }
    if (channel === "sms" && !phone) return json({ error: "A phone number is required to text the link" }, 400);

    // Build the link
    let url: string;
    if (product === "pay") {
      const r = await payApplyLink({ business, contactName, email, phone, repName, userId: auth.userId });
      if ("error" in r) return json({ error: r.error }, 500);
      url = r.url;
    } else {
      url = capitalApplyUrl({ leadId, firstName: firstNameOf(contactName), businessName: business, email, phone });
    }

    const firstName = firstNameOf(contactName);
    if (channel === "email") {
      const tpl = appLinkEmail(product, { firstName, business, url, repName });
      const okSend = await sendEmail({
        to: email,
        from: product === "capital" ? FROM_CAPITAL() : FROM_SALES(),
        subject: tpl.subject,
        html: tpl.html,
      });
      if (!okSend) return json({ error: "Send failed (suppressed address or delivery error) — try texting it instead" }, 502);
      await logOutreach({ leadId, email, name: contactName || business, channel: "email", meta: { product, via: "call-playbooks" } });
      return json({ ok: true, url, emailed_to: email });
    }

    // sms — manual send (Google Voice house convention): return the payload
    const smsBody = appLinkSms(product, { firstName, repName, url });
    const cleanPhone = phone.replace(/[^+\d]/g, "");
    await logOutreach({ leadId, email: email || null, name: contactName || business, channel: "sms", meta: { product, via: "call-playbooks", manual: true } });
    return json({ ok: true, url, sms: { to: cleanPhone, body: smsBody, uri: `sms:${cleanPhone}?&body=${encodeURIComponent(smsBody)}` } });
  }

  return json({ error: `Unknown action: ${action}` }, 400);
});
