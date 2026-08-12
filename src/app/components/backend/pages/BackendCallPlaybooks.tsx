import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Phone, PhoneOff, BookOpen, FlaskConical, ChevronLeft, Plus, Check,
  Lightbulb, Trophy, RefreshCw, Copy, X, AlertTriangle, Clock,
  Zap, ArrowRight, CircleDot, Ban, Voicemail, CalendarCheck, FileText,
  Flame, User, Building2, Pencil, Save, RotateCcw, TrendingUp,
  CalendarPlus, MessageSquare, Mail, Link2, MapPin, Video, ExternalLink,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../auth/AuthContext';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════
//
// Glencoco-style guided call playbooks:
//   call_playbooks — one "deck" per product × industry
//   playbook_cards — stage cards (intro→pitch→qual→close→end) plus
//                    shared product-level objection cards (playbook_id null)
//   card_variants  — A/B script variants per card; test_mode on a card
//                    rotates variants across calls, control wins by default
//   call_sessions  — one row per dial: variant assignment + disposition,
//                    powering the Performance tab and promote-winner flow

interface Playbook {
  id: string; slug: string; product: 'deltpay' | 'deltcapital';
  industry: string; name: string; description: string | null; is_active: boolean;
}
interface Card {
  id: string; slug: string; playbook_id: string | null; product: string | null;
  card_type: string; title: string; trigger_label: string | null;
  sort_order: number; test_mode: boolean; is_active: boolean;
}
interface Variant {
  id: string; card_id: string; label: string; body: string;
  coaching_note: string | null; is_control: boolean; status: 'active' | 'retired';
}
interface CallSession {
  id: string; created_at: string; rep_name: string | null; lead_id: string | null;
  lead_name: string | null; playbook_id: string | null;
  variant_map: Record<string, string>; disposition: string | null;
  connected: boolean; conversation_30s: boolean; meeting_booked: boolean;
  objections_hit: string[]; duration_seconds: number | null; notes: string | null;
}
interface LeadLite {
  id: string; business_name: string; contact_name: string | null;
  contact_email: string | null; contact_phone: string | null; industry: string | null;
}
interface Meeting {
  id: string; created_at: string; lead_id: string | null;
  product: 'deltpay' | 'deltcapital'; merchant_business: string;
  contact_name: string | null; contact_email: string | null; contact_phone: string | null;
  mode: 'online' | 'in_person'; location: string | null; meeting_link: string | null;
  starts_at: string; duration_min: number; rep_name: string | null; rep_email: string | null;
  notes: string | null; status: 'scheduled' | 'completed' | 'no_show' | 'cancelled';
  confirm_sent_at: string | null; remind_24h_sent_at: string | null; remind_2h_sent_at: string | null;
}

// ══════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════

const STAGE_ORDER: { type: string; label: string }[] = [
  { type: 'intro', label: 'Intro' },
  { type: 'pitch', label: 'Pitch' },
  { type: 'qualification', label: 'Qual' },
  { type: 'close', label: 'Close' },
  { type: 'end_call', label: 'End' },
];

const DISPOSITIONS: { code: string; label: string; icon: React.ElementType; color: string; next: string; meeting?: boolean; connected?: boolean }[] = [
  { code: 'MEETING_BOOKED', label: 'Meeting booked', icon: CalendarCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', next: 'Calendar invite sent — prep the statement/docs ask', meeting: true, connected: true },
  { code: 'DOCS_PROMISED', label: 'Statement / docs promised', icon: FileText, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', next: 'Send secure upload link now; follow up in 24h', connected: true },
  { code: 'HOT', label: 'Hot — call back 24–48h', icon: Flame, color: 'text-orange-700 bg-orange-50 border-orange-200', next: 'Priority callback, same rep', connected: true },
  { code: 'CB_SCHED', label: 'Callback scheduled', icon: Clock, color: 'text-blue-700 bg-blue-50 border-blue-200', next: 'Requeue at the agreed time', connected: true },
  { code: 'NI_THINK', label: 'Soft no — not now', icon: CircleDot, color: 'text-gray-700 bg-gray-100 border-gray-200', next: 'Suppress 30 days, then requeue', connected: true },
  { code: 'NI_FINAL', label: 'Hard no', icon: Ban, color: 'text-red-700 bg-red-50 border-red-200', next: 'Remove from calling queue', connected: true },
  { code: 'GATEKEEPER', label: 'Gatekeeper — got referral', icon: User, color: 'text-purple-700 bg-purple-50 border-purple-200', next: 'Log the decision-maker contact, requeue', connected: true },
  { code: 'VM_LEFT', label: 'Voicemail left', icon: Voicemail, color: 'text-gray-600 bg-gray-50 border-gray-200', next: 'Retry — most connects take 6–8 attempts' },
  { code: 'NO_ANSWER', label: 'No answer', icon: PhoneOff, color: 'text-gray-600 bg-gray-50 border-gray-200', next: 'Retry — try the 4–5pm window' },
  { code: 'WRONG_NUM', label: 'Wrong number', icon: X, color: 'text-gray-600 bg-gray-50 border-gray-200', next: 'Flag lead data for cleanup' },
];

const PRODUCT_META = {
  deltpay: { label: 'Deltpay', sub: 'Processing savings', chip: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  deltcapital: { label: 'DeltCapital', sub: 'Working capital', chip: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
} as const;

// Map pipeline_leads.industry → playbook industry
function matchIndustry(leadIndustry: string | null): string | null {
  if (!leadIndustry) return null;
  const s = leadIndustry.toLowerCase();
  if (/(restaurant|food|beverage|cafe|bakery|qsr)/.test(s)) return 'Restaurant';
  if (/(retail|store|shop|boutique)/.test(s)) return 'Retail';
  if (/(auto|automotive|repair|tire|mechanic)/.test(s)) return 'Automotive';
  if (/(salon|spa|beauty|barber|wellness|fitness)/.test(s)) return 'Salon & Spa';
  if (/(medical|dental|health|clinic|doctor|veterinar)/.test(s)) return 'Medical & Dental';
  if (/(e-?commerce|online|ecom)/.test(s)) return 'E-Commerce';
  return null;
}

const fmtPct = (n: number, d: number) => (d === 0 ? '—' : `${((n / d) * 100).toFixed(1)}%`);
const fmtDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ══════════════════════════════════════
// SCRIPT BODY RENDERER
// ══════════════════════════════════════
// Conventions (match the seeded content):
//   {{merge_field}}          → filled from lead/rep, amber chip if unresolved
//   [GREEN]/[BLUE]/[RED] …   → color-coded conditional branch section
//   IF …:                    → bold branch label
//   (pause) (wait …)         → muted italic stage direction

const BRANCH_STYLE: Record<string, { border: string; bg: string; label: string; text: string }> = {
  GREEN: { border: 'border-emerald-300', bg: 'bg-emerald-50/60', label: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-900' },
  BLUE: { border: 'border-blue-300', bg: 'bg-blue-50/60', label: 'bg-blue-100 text-blue-800', text: 'text-blue-900' },
  RED: { border: 'border-rose-300', bg: 'bg-rose-50/60', label: 'bg-rose-100 text-rose-800', text: 'text-rose-900' },
};

function renderInline(line: string, merge: Record<string, string>, key: number) {
  const parts = line.split(/(\{\{[^}]+\}\}|\([^)]*\))/g);
  return (
    <React.Fragment key={key}>
      {parts.map((p, i) => {
        const tok = p.match(/^\{\{([^}]+)\}\}$/);
        if (tok) {
          const v = merge[tok[1].trim()];
          return v
            ? <span key={i} className="font-semibold text-indigo-700 bg-indigo-50 rounded px-1">{v}</span>
            : <span key={i} className="font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1 text-[13px]">{tok[1].trim()}</span>;
        }
        if (/^\([^)]*\)$/.test(p)) return <span key={i} className="italic text-gray-400">{p}</span>;
        return <span key={i}>{p}</span>;
      })}
    </React.Fragment>
  );
}

function ScriptBody({ body, merge, large }: { body: string; merge: Record<string, string>; large?: boolean }) {
  // Group lines into plain / branch sections
  const lines = body.split('\n');
  const sections: { color: string | null; lines: string[] }[] = [{ color: null, lines: [] }];
  for (const raw of lines) {
    const m = raw.match(/^\[(GREEN|BLUE|RED)\]\s*(.*)$/);
    const isIf = /^IF\s.+:/.test(raw.trim()) || /^[A-Z][A-Z\s&/'-]+:$/.test(raw.trim());
    if (m) sections.push({ color: m[1], lines: [m[2]] });
    else if (isIf && sections[sections.length - 1].color === null) sections.push({ color: 'PLAIN_BRANCH', lines: [raw] });
    else sections[sections.length - 1].lines.push(raw);
  }
  const textSize = large ? 'text-[17px] leading-[1.85]' : 'text-[14px] leading-[1.8]';
  return (
    <div className="space-y-3">
      {sections.map((sec, si) => {
        if (sec.lines.every(l => !l.trim())) return null;
        if (sec.color && sec.color !== 'PLAIN_BRANCH') {
          const st = BRANCH_STYLE[sec.color];
          const [first, ...rest] = sec.lines;
          return (
            <div key={si} className={`border-l-[3px] ${st.border} ${st.bg} rounded-r-[8px] px-4 py-3`}>
              {first?.trim() && (
                <span className={`inline-block text-[11px] font-bold tracking-wide uppercase rounded px-1.5 py-0.5 mb-1.5 ${st.label}`}>{first.replace(/:$/, '')}</span>
              )}
              <div className={`${textSize} ${st.text} whitespace-pre-wrap`}>
                {rest.map((l, i) => <div key={i} className={l.trim() ? '' : 'h-3'}>{renderInline(l, merge, i)}</div>)}
              </div>
            </div>
          );
        }
        return (
          <div key={si} className={`${textSize} text-gray-800 whitespace-pre-wrap`}>
            {sec.lines.map((l, i) => {
              const isIf = /^IF\s.+:/.test(l.trim()) || /^[A-Z][A-Z\s&/'-]+:$/.test(l.trim());
              if (isIf) return <div key={i} className="font-bold text-gray-900 mt-2">{renderInline(l, merge, i)}</div>;
              return <div key={i} className={l.trim() ? '' : 'h-3'}>{renderInline(l, merge, i)}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function CoachingNote({ note, large }: { note: string; large?: boolean }) {
  return (
    <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-[8px] px-3.5 py-3 mt-4">
      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700 mb-0.5">Caller thinking</p>
        <p className={`${large ? 'text-[14px]' : 'text-[13px]'} text-amber-900 leading-relaxed`}>{note}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════

export function BackendCallPlaybooks() {
  const [tab, setTab] = useState<'live' | 'meetings' | 'library' | 'performance'>('live');
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [sessions, setSessions] = useState<CallSession[]>([]);
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    const [pb, cd, vr, ss, ld, mt] = await Promise.all([
      supabase.from('call_playbooks').select('*').eq('is_active', true).order('product').order('industry'),
      supabase.from('playbook_cards').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('card_variants').select('*').order('created_at'),
      supabase.from('call_sessions').select('*').order('created_at', { ascending: false }).limit(2000),
      supabase.from('pipeline_leads').select('id,business_name,contact_name,contact_email,contact_phone,industry').order('business_name'),
      supabase.from('rep_meetings').select('*').order('starts_at', { ascending: true }).limit(500),
    ]);
    setPlaybooks((pb.data as Playbook[]) ?? []);
    setCards((cd.data as Card[]) ?? []);
    setVariants((vr.data as Variant[]) ?? []);
    setSessions((ss.data as CallSession[]) ?? []);
    setLeads((ld.data as LeadLite[]) ?? []);
    setMeetings((mt.data as Meeting[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  if (!isSupabaseConfigured) {
    return (
      <div className="px-6 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Call Playbooks</h1>
        <div className="bg-white rounded-[8px] border border-gray-200 p-8 text-center text-sm text-gray-500">
          <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          Supabase is not configured — call playbooks need a live database connection.
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Playbooks</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Guided cold-call scripts by product and industry — cycle variants, log every dial, promote what books meetings.</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-[8px] p-1">
          {([
            { id: 'live', label: 'Live Call', icon: Phone },
            { id: 'meetings', label: 'Meetings', icon: CalendarCheck },
            { id: 'library', label: 'Playbooks', icon: BookOpen },
            { id: 'performance', label: 'Performance', icon: FlaskConical },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-[8px] border border-gray-200 p-10 text-center text-sm text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" /> Loading playbooks…
        </div>
      ) : tab === 'live' ? (
        <LiveCall playbooks={playbooks} cards={cards} variants={variants} sessions={sessions} leads={leads} onLogged={reload} />
      ) : tab === 'meetings' ? (
        <MeetingsView meetings={meetings} onChanged={reload} />
      ) : tab === 'library' ? (
        <Library playbooks={playbooks} cards={cards} variants={variants} sessions={sessions} onChanged={reload} />
      ) : (
        <Performance playbooks={playbooks} cards={cards} variants={variants} sessions={sessions} onChanged={reload} />
      )}
    </div>
  );
}

// ══════════════════════════════════════
// VARIANT ASSIGNMENT (A/B rotation)
// ══════════════════════════════════════
// test_mode ON  → round-robin: pick the ACTIVE variant with the fewest
//                 logged sessions, so exposure stays balanced.
// test_mode OFF → the control variant (or first active).

function usageCount(variantId: string, cardId: string, sessions: CallSession[]) {
  return sessions.filter(s => s.variant_map?.[cardId] === variantId).length;
}

function assignVariant(card: Card, variants: Variant[], sessions: CallSession[]): Variant | null {
  const active = variants.filter(v => v.card_id === card.id && v.status === 'active');
  if (active.length === 0) return null;
  if (!card.test_mode || active.length === 1) {
    return active.find(v => v.is_control) ?? active[0];
  }
  return [...active].sort((a, b) => usageCount(a.id, card.id, sessions) - usageCount(b.id, card.id, sessions))[0];
}

// ══════════════════════════════════════
// LIVE CALL
// ══════════════════════════════════════

function LiveCall({ playbooks, cards, variants, sessions, leads, onLogged }: {
  playbooks: Playbook[]; cards: Card[]; variants: Variant[]; sessions: CallSession[];
  leads: LeadLite[]; onLogged: () => void;
}) {
  const { profile } = useAuth();
  const [product, setProduct] = useState<'deltpay' | 'deltcapital'>('deltpay');
  const [playbookId, setPlaybookId] = useState<string>('');
  const [leadId, setLeadId] = useState<string>('');
  const [repName, setRepName] = useState(() => localStorage.getItem('delt_rep_name') ?? '');
  const [inCall, setInCall] = useState(false);
  const [assignment, setAssignment] = useState<Record<string, Variant>>({});
  const [stage, setStage] = useState('intro');
  const [objectionCard, setObjectionCard] = useState<Card | null>(null);
  const [objectionsHit, setObjectionsHit] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [ending, setEnding] = useState(false);
  const [disposition, setDisposition] = useState<string>('');
  const [meetingBooked, setMeetingBooked] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [actionsLog, setActionsLog] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Default the rep name from the signed-in profile
  useEffect(() => {
    if (!repName && profile?.name) setRepName(profile.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.name]);

  const productBooks = playbooks.filter(p => p.product === product);
  const playbook = playbooks.find(p => p.id === playbookId) ?? null;
  const lead = leads.find(l => l.id === leadId) ?? null;

  // Auto-suggest playbook from the lead's industry
  useEffect(() => {
    if (!lead) return;
    const ind = matchIndustry(lead.industry);
    const match = productBooks.find(p => p.industry === ind) ?? productBooks.find(p => p.industry === 'Universal');
    if (match) setPlaybookId(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, product]);

  useEffect(() => {
    if (!playbookId && productBooks.length) {
      setPlaybookId(productBooks.find(p => p.industry === 'Universal')?.id ?? productBooks[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, playbooks]);

  const stageCards = useMemo(() =>
    cards.filter(c => c.playbook_id === playbook?.id)
      .sort((a, b) => a.sort_order - b.sort_order), [cards, playbook]);
  const objectionCards = useMemo(() =>
    cards.filter(c => !c.playbook_id && c.product === product && c.card_type === 'objection')
      .sort((a, b) => a.sort_order - b.sort_order), [cards, product]);

  const merge: Record<string, string> = useMemo(() => {
    const m: Record<string, string> = {};
    if (repName) m.rep_name = repName;
    if (lead) {
      m.business_name = lead.business_name;
      if (lead.contact_name) m.owner_first_name = lead.contact_name.split(' ')[0];
      if (lead.industry) m.business_type = lead.industry.toLowerCase();
    }
    return m;
  }, [repName, lead]);

  const startCall = () => {
    if (!playbook) return;
    localStorage.setItem('delt_rep_name', repName);
    const asg: Record<string, Variant> = {};
    for (const c of [...stageCards, ...objectionCards]) {
      const v = assignVariant(c, variants, sessions);
      if (v) asg[c.id] = v;
    }
    setAssignment(asg);
    setStage('intro');
    setObjectionCard(null);
    setObjectionsHit([]);
    setElapsed(0);
    setEnding(false);
    setDisposition('');
    setMeetingBooked(false);
    setNotes('');
    setActionsLog([]);
    setInCall(true);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };

  const stopTimer = () => { if (timerRef.current) clearInterval(timerRef.current); timerRef.current = null; };
  useEffect(() => () => stopTimer(), []);

  const hitObjection = (c: Card) => {
    setObjectionCard(c);
    setObjectionsHit(prev => (prev.includes(c.id) ? prev : [...prev, c.id]));
  };

  const saveSession = async () => {
    if (!supabase || !playbook) return;
    setSaving(true);
    const dispo = DISPOSITIONS.find(d => d.code === disposition);
    const variant_map: Record<string, string> = {};
    Object.entries(assignment).forEach(([cid, v]) => { variant_map[cid] = v.id; });
    const { error } = await supabase.from('call_sessions').insert({
      rep_name: repName || null,
      lead_id: lead?.id ?? null,
      lead_name: lead ? (lead.contact_name ? `${lead.contact_name} — ${lead.business_name}` : lead.business_name) : null,
      playbook_id: playbook.id,
      variant_map,
      disposition: disposition || null,
      connected: dispo?.connected ?? false,
      conversation_30s: (dispo?.connected ?? false) && elapsed >= 30,
      meeting_booked: meetingBooked || !!dispo?.meeting,
      objections_hit: objectionsHit,
      duration_seconds: elapsed,
      notes: [notes, actionsLog.length ? `Actions: ${actionsLog.join(' | ')}` : ''].filter(Boolean).join('\n') || null,
    });
    setSaving(false);
    if (error) {
      window.alert(`Could not log the call: ${error.message}`);
      return;
    }
    setInCall(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 4000);
    onLogged();
  };

  // ── Setup screen ──
  if (!inCall) {
    return (
      <div className="max-w-3xl space-y-4">
        {savedMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] rounded-[8px] px-4 py-2.5">
            <Check className="w-4 h-4" /> Call logged — stats updated. Dial the next one.
          </div>
        )}
        <div className="bg-white rounded-[8px] border border-gray-200 p-5 space-y-4">
          <p className="text-[13px] font-semibold text-gray-900">Set up the call</p>

          <div className="flex gap-2">
            {(['deltpay', 'deltcapital'] as const).map(p => (
              <button key={p} onClick={() => { setProduct(p); setPlaybookId(''); }}
                className={`flex-1 border rounded-[8px] px-4 py-3 text-left transition-colors ${product === p ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-gray-200 hover:border-gray-300'}`}>
                <p className="text-[14px] font-semibold text-gray-900">{PRODUCT_META[p].label}</p>
                <p className="text-[12px] text-gray-500">{PRODUCT_META[p].sub}</p>
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-gray-600 block mb-1">Lead (optional — fills the script)</label>
              <select value={leadId} onChange={e => setLeadId(e.target.value)}
                className="w-full border border-gray-200 rounded-[6px] px-3 py-2 text-[13px] bg-white">
                <option value="">No lead selected — practice mode</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.business_name}{l.contact_name ? ` — ${l.contact_name}` : ''}{l.industry ? ` (${l.industry})` : ''}
                  </option>
                ))}
              </select>
              {lead?.contact_phone && (
                <p className="text-[12px] text-gray-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.contact_phone}</p>
              )}
            </div>
            <div>
              <label className="text-[12px] font-medium text-gray-600 block mb-1">Playbook</label>
              <select value={playbookId} onChange={e => setPlaybookId(e.target.value)}
                className="w-full border border-gray-200 rounded-[6px] px-3 py-2 text-[13px] bg-white">
                {productBooks.map(p => <option key={p.id} value={p.id}>{p.industry} — {p.name}</option>)}
              </select>
              {lead && matchIndustry(lead.industry) && (
                <p className="text-[12px] text-indigo-600 mt-1 flex items-center gap-1"><Zap className="w-3 h-3" /> Auto-matched to the lead's industry</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-[12px] font-medium text-gray-600 block mb-1">Your name (fills {'{{rep_name}}'})</label>
            <input value={repName} onChange={e => setRepName(e.target.value)} placeholder="e.g. Sarah"
              className="w-full sm:w-64 border border-gray-200 rounded-[6px] px-3 py-2 text-[13px]" />
          </div>

          {playbook && (
            <div className="border-t border-gray-100 pt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[12px] text-gray-500">
                {stageCards.length} stage cards · {objectionCards.length} objection cards ready
                {stageCards.some(c => c.test_mode) && (
                  <span className="ml-2 inline-flex items-center gap-1 text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5 text-[11px] font-medium">
                    <FlaskConical className="w-3 h-3" /> A/B test running — variants rotate
                  </span>
                )}
              </div>
              <button onClick={startCall}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-[8px] px-5 py-2.5 transition-colors">
                <Phone className="w-4 h-4" /> Start call
              </button>
            </div>
          )}
        </div>

        <RepQuickstats sessions={sessions} repName={repName} />
      </div>
    );
  }

  // ── In-call: end-call panel ──
  if (ending) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="bg-white rounded-[8px] border border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-gray-900">How did it end?</p>
            <span className="text-[12px] text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {fmtDur(elapsed)}</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {DISPOSITIONS.map(d => (
              <button key={d.code} onClick={() => { setDisposition(d.code); if (d.meeting) setMeetingBooked(true); }}
                className={`flex items-start gap-2.5 border rounded-[8px] px-3 py-2.5 text-left transition-colors ${disposition === d.code ? d.color + ' ring-1 ring-current' : 'border-gray-200 hover:border-gray-300'}`}>
                <d.icon className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  <span className="block text-[13px] font-medium">{d.label}</span>
                  <span className="block text-[11px] opacity-70">{d.next}</span>
                </span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-[13px] text-gray-700">
            <input type="checkbox" checked={meetingBooked} onChange={e => setMeetingBooked(e.target.checked)} className="rounded" />
            Meeting / appointment booked
          </label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes — what worked, what stalled, exact words they used…"
            className="w-full border border-gray-200 rounded-[6px] px-3 py-2 text-[13px]" />
          {actionsLog.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[6px] px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700 mb-1">Actions taken on this call</p>
              {actionsLog.map((a, i) => <p key={i} className="text-[12px] text-emerald-900">• {a}</p>)}
            </div>
          )}
          {objectionsHit.length > 0 && (
            <p className="text-[12px] text-gray-500">
              Objections hit: {objectionsHit.map(id => cards.find(c => c.id === id)?.title).filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setEnding(false)} className="text-[13px] text-gray-500 hover:text-gray-800 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back to script
            </button>
            <button onClick={saveSession} disabled={!disposition || saving}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-[13px] font-semibold rounded-[8px] px-5 py-2.5">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Log call
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── In-call: live screenplay ──
  const currentCard = objectionCard ?? stageCards.find(c => c.card_type === stage) ?? stageCards[0];
  const currentVariant = currentCard ? assignment[currentCard.id] : null;

  return (
    <div className="max-w-6xl space-y-3">
      {/* Call header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-[8px] border border-gray-200 px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-gray-900 truncate">
              {lead ? `${lead.contact_name ?? 'Owner'} — ${lead.business_name}` : 'Practice call'}
            </p>
            <p className="text-[11px] text-gray-500 truncate">{playbook?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[13px] font-mono tabular-nums ${elapsed >= 30 ? 'text-emerald-600 font-semibold' : 'text-gray-600'}`}>
            {fmtDur(elapsed)}{elapsed >= 30 && <span className="text-[10px] ml-1 align-middle">CONVO</span>}
          </span>
          <button onClick={() => { setEnding(true); }}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-[6px] px-3 py-1.5">
            <PhoneOff className="w-3.5 h-3.5" /> End call
          </button>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-3 lg:items-start">
      <div className="space-y-3 min-w-0">
      {/* Stage tabs */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {STAGE_ORDER.map(s => {
          const has = stageCards.some(c => c.card_type === s.type);
          if (!has) return null;
          const active = !objectionCard && stage === s.type;
          return (
            <button key={s.type} onClick={() => { setObjectionCard(null); setStage(s.type); }}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-colors ${active ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'}`}>
              {s.label}
            </button>
          );
        })}
        {objectionCard && (
          <span className="px-4 py-1.5 rounded-full text-[13px] font-medium bg-rose-600 text-white whitespace-nowrap">
            Objection: {objectionCard.title}
          </span>
        )}
      </div>

      {/* Active card */}
      <div className="bg-white rounded-[8px] border border-gray-200 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {objectionCard ? 'Objection' : STAGE_ORDER.find(s => s.type === stage)?.label} · {currentCard?.title}
            </p>
            {currentVariant && (
              <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border ${currentCard?.test_mode ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {currentVariant.label}{currentVariant.is_control && !currentVariant.label.includes('control') ? ' · control' : ''}{currentCard?.test_mode ? ' · testing' : ''}
              </span>
            )}
          </div>
          {objectionCard && (
            <button onClick={() => setObjectionCard(null)}
              className="flex items-center gap-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-800">
              <RotateCcw className="w-3.5 h-3.5" /> Back to script
            </button>
          )}
        </div>

        {currentVariant ? (
          <>
            <ScriptBody body={currentVariant.body} merge={merge} large />
            {currentVariant.coaching_note && <CoachingNote note={currentVariant.coaching_note} large />}
          </>
        ) : (
          <p className="text-sm text-gray-400">No script variant on this card yet — add one in the Playbooks tab.</p>
        )}

        {/* Next stage */}
        {!objectionCard && (
          <div className="flex justify-end mt-5">
            {(() => {
              const idx = STAGE_ORDER.findIndex(s => s.type === stage);
              const next = STAGE_ORDER.slice(idx + 1).find(s => stageCards.some(c => c.card_type === s.type));
              return next ? (
                <button onClick={() => setStage(next.type)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-indigo-600 hover:text-indigo-800">
                  {next.label} <ArrowRight className="w-4 h-4" />
                </button>
              ) : null;
            })()}
          </div>
        )}
      </div>

      {/* One-tap objection bar */}
      <div className="bg-white rounded-[8px] border border-gray-200 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">If they push back — one tap</p>
        <div className="flex flex-wrap gap-1.5">
          {objectionCards.map(c => (
            <button key={c.id} onClick={() => hitObjection(c)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${objectionCard?.id === c.id ? 'bg-rose-600 text-white border-rose-600' : objectionsHit.includes(c.id) ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300 hover:text-rose-700'}`}>
              {c.trigger_label ?? c.title}
            </button>
          ))}
        </div>
      </div>
      </div>{/* /left column */}

      {/* Right column — in-call actions */}
      <div className="space-y-3 mt-3 lg:mt-0">
        <ActionPanel
          product={product}
          lead={lead}
          repName={repName}
          onBooked={() => { setMeetingBooked(true); setDisposition('MEETING_BOOKED'); }}
          onLog={entry => setActionsLog(prev => [...prev, entry])}
        />
        {actionsLog.length > 0 && (
          <div className="bg-white rounded-[8px] border border-gray-200 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">This call</p>
            <div className="space-y-1.5">
              {actionsLog.map((a, i) => (
                <p key={i} className="text-[12px] text-gray-700 flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> {a}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>{/* /grid */}
    </div>
  );
}

// ════════════════════════════════════
// MEETINGS (booked pipeline + show rates)
// ════════════════════════════════════

function fmtMeetingEt(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  const now = new Date();
  const et = (x: Date) => x.toLocaleDateString('en-US', { timeZone: 'America/New_York' });
  const tomorrow = new Date(now.getTime() + 86400000);
  let day = d.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' });
  if (et(d) === et(now)) day = 'Today';
  else if (et(d) === et(tomorrow)) day = 'Tomorrow';
  const time = d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }) + ' ET';
  return { day, time };
}

const MEETING_STATUS_META: Record<Meeting['status'], { label: string; cls: string }> = {
  scheduled: { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  completed: { label: 'Showed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  no_show: { label: 'No-show', cls: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
};

function MeetingsView({ meetings, onChanged }: { meetings: Meeting[]; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const now = Date.now();

  const upcoming = meetings.filter(m => m.status === 'scheduled' && new Date(m.starts_at).getTime() >= now);
  const needsOutcome = meetings.filter(m => m.status === 'scheduled' && new Date(m.starts_at).getTime() < now)
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());
  const decided = meetings.filter(m => m.status === 'completed' || m.status === 'no_show');
  const showed = decided.filter(m => m.status === 'completed').length;
  const weekAhead = upcoming.filter(m => new Date(m.starts_at).getTime() < now + 7 * 86400000);
  const recent = meetings.filter(m => m.status !== 'scheduled')
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()).slice(0, 10);

  const setStatus = async (m: Meeting, status: Meeting['status']) => {
    if (!supabase) return;
    if (status === 'cancelled' && !window.confirm(`Cancel the meeting with ${m.merchant_business}? (No email is sent — let them know yourself.)`)) return;
    setBusy(m.id);
    const { error } = await supabase.from('rep_meetings').update({ status }).eq('id', m.id);
    setBusy(null);
    if (error) { window.alert(`Could not update: ${error.message}`); return; }
    onChanged();
  };

  const reminderSms = (m: Meeting) => {
    const { day, time } = fmtMeetingEt(m.starts_at);
    const where = m.mode === 'online'
      ? (m.meeting_link ? ` Join link: ${m.meeting_link}` : '')
      : (m.location ? ` Address: ${m.location}` : '');
    return `Hi ${(m.contact_name || '').split(' ')[0] || 'there'}, it's ${m.rep_name || 'your rep'} with Delt — quick reminder we're on for ${day === 'Today' ? `today at ${time}` : `${day} at ${time}`}.${where} Reply here if anything changes.`;
  };

  const MeetingRow = ({ m, outcome }: { m: Meeting; outcome?: boolean }) => {
    const { day, time } = fmtMeetingEt(m.starts_at);
    const phone = (m.contact_phone || '').replace(/[^+\d]/g, '');
    return (
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-t border-gray-100 first:border-t-0">
        <div className="w-28 shrink-0">
          <p className={`text-[13px] font-semibold ${day === 'Today' ? 'text-indigo-700' : 'text-gray-900'}`}>{day}</p>
          <p className="text-[12px] text-gray-500">{time}</p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-gray-900 truncate">
            {m.merchant_business}
            {m.contact_name && <span className="font-normal text-gray-500"> — {m.contact_name}</span>}
          </p>
          <p className="text-[12px] text-gray-500 flex items-center gap-2 flex-wrap">
            <span className={`inline-block text-[10px] font-semibold uppercase rounded px-1 py-0.5 border ${PRODUCT_META[m.product].chip}`}>{PRODUCT_META[m.product].label}</span>
            <span className="flex items-center gap-1">{m.mode === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}{m.mode === 'online' ? 'Online' : (m.location || 'In person')}</span>
            {m.rep_name && <span>· {m.rep_name}</span>}
          </p>
        </div>
        {!outcome && m.status === 'scheduled' && (
          <div className="flex items-center gap-1 text-[10px] font-medium" title="Confirmation / 24h reminder / 2h reminder">
            {[['Invite', m.confirm_sent_at], ['24h', m.remind_24h_sent_at], ['2h', m.remind_2h_sent_at]].map(([label, sent]) => (
              <span key={label as string} className={`rounded px-1.5 py-0.5 border ${sent ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                {label as string}{sent ? ' ✓' : ''}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {m.status === 'scheduled' && m.mode === 'online' && m.meeting_link && !outcome && (
            <a href={m.meeting_link} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 px-1.5">
              <ExternalLink className="w-3 h-3" /> Join
            </a>
          )}
          {m.status === 'scheduled' && phone && !outcome && (
            <button onClick={() => openSms(`sms:${phone}?&body=${encodeURIComponent(reminderSms(m))}`, reminderSms(m))}
              className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 rounded-[6px] px-2 py-1">
              <MessageSquare className="w-3 h-3" /> Text
            </button>
          )}
          {outcome ? (
            <>
              <button onClick={() => setStatus(m, 'completed')} disabled={busy === m.id}
                className="text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[6px] px-2.5 py-1">Showed</button>
              <button onClick={() => setStatus(m, 'no_show')} disabled={busy === m.id}
                className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-[6px] px-2.5 py-1">No-show</button>
            </>
          ) : m.status === 'scheduled' ? (
            <button onClick={() => setStatus(m, 'cancelled')} disabled={busy === m.id}
              className="text-[11px] text-gray-400 hover:text-red-600 px-1.5">Cancel</button>
          ) : (
            <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border ${MEETING_STATUS_META[m.status].cls}`}>{MEETING_STATUS_META[m.status].label}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Upcoming', v: String(upcoming.length), sub: 'scheduled meetings on the books' },
          { label: 'Next 7 days', v: String(weekAhead.length), sub: 'this week\u2019s pipeline' },
          { label: 'Show rate', v: decided.length ? `${((showed / decided.length) * 100).toFixed(0)}%` : '—', sub: `${showed} showed · ${decided.length - showed} no-show`, warn: decided.length >= 5 && showed / decided.length < 0.6 },
          { label: 'Awaiting outcome', v: String(needsOutcome.length), sub: 'past meetings — mark showed / no-show', warn: needsOutcome.length > 0 },
        ].map(k => (
          <div key={k.label} className={`bg-white rounded-[8px] border px-4 py-3 ${k.warn ? 'border-amber-300' : 'border-gray-200'}`}>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">{k.label}</p>
            <p className="text-xl font-bold text-gray-900">{k.v}</p>
            <p className="text-[11px] text-gray-500">{k.sub}</p>
          </div>
        ))}
      </div>

      {needsOutcome.length > 0 && (
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-amber-600 mb-2">Did they show?</p>
          <div className="bg-white rounded-[8px] border border-amber-200">
            {needsOutcome.map(m => <MeetingRow key={m.id} m={m} outcome />)}
          </div>
        </div>
      )}

      <div>
        <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-2">Upcoming</p>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-[8px] border border-gray-200 p-8 text-center text-[13px] text-gray-400">
            Nothing on the books yet — book meetings from the Live Call action panel and they'll show up here with automatic reminders.
          </div>
        ) : (
          <div className="bg-white rounded-[8px] border border-gray-200">
            {upcoming.map(m => <MeetingRow key={m.id} m={m} />)}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-2">Recent outcomes</p>
          <div className="bg-white rounded-[8px] border border-gray-200">
            {recent.map(m => <MeetingRow key={m.id} m={m} />)}
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-4 py-3 text-[12px] text-gray-500">
        Reminders go out automatically — invite on booking, then 24h and 2h before (badges above turn green as each lands). A personal text on top of the emails is the single best show-rate booster: use the Text button.
      </div>
    </div>
  );
}

// ════════════════════════════════════
// ACTION PANEL (in-call): book meeting · send app link
// ════════════════════════════════════
// Talks to the rep-actions edge function. Meetings send a confirmation
// email + .ics invite immediately; 24h/2h reminders run on pg_cron.
// Texts follow the house convention: we open the rep's SMS app
// (Google Voice) with the message prefilled — nothing sends silently.

async function invokeRepAction(body: Record<string, unknown>): Promise<{ ok?: boolean; error?: string;[k: string]: unknown }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const { data, error } = await supabase.functions.invoke('rep-actions', { body });
  if (error) {
    // FunctionsHttpError carries the response — try to surface the real message
    try {
      const ctx = (error as { context?: Response }).context;
      if (ctx) { const j = await ctx.json(); if (j?.error) return { error: String(j.error) }; }
    } catch { /* fall through */ }
    return { error: error.message || 'Request failed' };
  }
  return (data ?? {}) as { ok?: boolean; error?: string };
}

function openSms(uri: string, body: string) {
  try { navigator.clipboard?.writeText(body); } catch { /* best effort */ }
  window.open(uri, '_self');
}

function ActionPanel({ product, lead, repName, onBooked, onLog }: {
  product: 'deltpay' | 'deltcapital';
  lead: LeadLite | null;
  repName: string;
  onBooked: (when: string) => void;
  onLog: (entry: string) => void;
}) {
  const [email, setEmail] = useState(lead?.contact_email ?? '');
  const [phone, setPhone] = useState(lead?.contact_phone ?? '');
  const business = lead?.business_name ?? 'this merchant';
  const contactName = lead?.contact_name ?? '';

  // ── book meeting state ──
  const [showBook, setShowBook] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [mode, setMode] = useState<'online' | 'in_person'>('online');
  const [meetLink, setMeetLink] = useState(() => localStorage.getItem('delt_meet_link') ?? '');
  const [location, setLocation] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookedSms, setBookedSms] = useState<{ uri: string; body: string } | null>(null);
  const [appProduct, setAppProduct] = useState<'pay' | 'capital'>(product === 'deltcapital' ? 'capital' : 'pay');
  const [sending, setSending] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => { setEmail(lead?.contact_email ?? ''); setPhone(lead?.contact_phone ?? ''); }, [lead?.id]);
  useEffect(() => { setAppProduct(product === 'deltcapital' ? 'capital' : 'pay'); }, [product]);

  const flash = (msg: string) => { setDone(msg); setErr(null); setTimeout(() => setDone(null), 5000); };
  const fail = (msg: string) => { setErr(msg); setDone(null); };

  const book = async () => {
    if (!date || !time) { fail('Pick a date and time'); return; }
    const startsAt = new Date(`${date}T${time}`);
    if (isNaN(startsAt.getTime())) { fail('Invalid date/time'); return; }
    setBooking(true); setErr(null);
    if (mode === 'online' && meetLink) localStorage.setItem('delt_meet_link', meetLink);
    const r = await invokeRepAction({
      action: 'book_meeting',
      lead_id: lead?.id ?? null,
      product,
      merchant_business: business,
      contact_name: contactName || null,
      contact_email: email || null,
      contact_phone: phone || null,
      mode,
      location: mode === 'in_person' ? location || null : null,
      meeting_link: mode === 'online' ? meetLink || null : null,
      starts_at: startsAt.toISOString(),
      duration_min: duration,
      rep_name: repName || null,
    });
    setBooking(false);
    if (r.error) { fail(r.error); return; }
    const when = String(r.when ?? `${date} ${time}`);
    onBooked(when);
    onLog(`Meeting booked — ${when}${r.confirmation_emailed ? ' · invite emailed' : email ? ' · email failed' : ' · no email on file'}`);
    const sms = r.sms as { uri: string; body: string } | null;
    setBookedSms(sms ?? null);
    setShowBook(false);
    flash(r.confirmation_emailed
      ? `Booked — invite + reminders are on their way`
      : `Booked — no confirmation email sent (${email ? 'send failed' : 'no email on file'})`);
  };

  const sendLink = async (channel: 'email' | 'sms') => {
    if (channel === 'email' && !email) { fail('Add an email first'); return; }
    if (channel === 'sms' && !phone) { fail('Add a phone number first'); return; }
    setSending(channel); setErr(null);
    const r = await invokeRepAction({
      action: 'send_app_link',
      product: appProduct,
      channel,
      business,
      contact_name: contactName,
      email, phone,
      rep_name: repName,
      lead_id: lead?.id ?? null,
    });
    setSending(null);
    if (r.error) { fail(r.error); return; }
    const label = appProduct === 'pay' ? 'DeltPay app' : 'Capital app';
    if (channel === 'email') {
      onLog(`${label} link emailed to ${email}`);
      flash(`${label} link emailed`);
    } else {
      const sms = r.sms as { uri: string; body: string };
      onLog(`${label} link texted to ${phone}`);
      flash('Text ready — opening your SMS app (message copied too)');
      openSms(sms.uri, sms.body);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-[6px] px-2.5 py-1.5 text-[13px]';

  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-4 space-y-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Take action</p>

      {/* contact */}
      <div className="space-y-1.5">
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="merchant@email.com" className={inputCls} type="email" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(305) 555-0123" className={inputCls} type="tel" />
      </div>

      {err && <p className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-[6px] px-2.5 py-1.5">{err}</p>}
      {done && <p className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-[6px] px-2.5 py-1.5 flex items-center gap-1.5"><Check className="w-3.5 h-3.5 shrink-0" /> {done}</p>}

      {/* ── Book meeting ── */}
      {!showBook ? (
        <button onClick={() => setShowBook(true)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-semibold rounded-[8px] px-3 py-2.5">
          <CalendarPlus className="w-4 h-4" /> Book a meeting
        </button>
      ) : (
        <div className="border border-indigo-200 bg-indigo-50/40 rounded-[8px] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-gray-900">Book a meeting</p>
            <button onClick={() => setShowBook(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} min={new Date().toISOString().slice(0, 10)} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputCls} />
          </div>
          <div className="flex rounded-[6px] border border-gray-200 overflow-hidden">
            {([['online', Video, 'Online'], ['in_person', MapPin, 'In person']] as const).map(([v, Icon, label]) => (
              <button key={v} onClick={() => setMode(v)}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[12px] font-medium py-1.5 whitespace-nowrap ${mode === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'}`}>
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} className={inputCls}>
            {[15, 30, 45, 60].map(d => <option key={d} value={d}>{d} minutes</option>)}
          </select>
          {mode === 'online'
            ? <input value={meetLink} onChange={e => setMeetLink(e.target.value)} placeholder="Video link — optional" className={inputCls} />
            : <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Address — e.g. their shop" className={inputCls} />}
          <button onClick={book} disabled={booking}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[13px] font-semibold rounded-[6px] px-3 py-2">
            {booking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
            Book + send invite
          </button>
          <p className="text-[11px] text-gray-500">Emails a calendar invite now · auto-reminds them 24h and 2h before.</p>
        </div>
      )}
      {bookedSms && (
        <button onClick={() => { openSms(bookedSms.uri, bookedSms.body); onLog('Confirmation text opened'); }}
          className="w-full flex items-center justify-center gap-2 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[13px] font-semibold rounded-[8px] px-3 py-2">
          <MessageSquare className="w-4 h-4" /> Text them the confirmation too
        </button>
      )}

      {/* ── App link ── */}
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-gray-900 flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-gray-400" /> Send the application</p>
          <div className="flex rounded-full border border-gray-200 overflow-hidden">
            {([['pay', 'Pay'], ['capital', 'Capital']] as const).map(([v, label]) => (
              <button key={v} onClick={() => setAppProduct(v)}
                className={`text-[11px] font-semibold px-2.5 py-1 ${appProduct === v ? 'bg-gray-900 text-white' : 'bg-white text-gray-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => sendLink('sms')} disabled={sending !== null}
            className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-gray-400 disabled:opacity-50 text-gray-800 text-[12px] font-semibold rounded-[6px] px-2 py-2">
            {sending === 'sms' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />} Text link
          </button>
          <button onClick={() => sendLink('email')} disabled={sending !== null}
            className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-gray-400 disabled:opacity-50 text-gray-800 text-[12px] font-semibold rounded-[6px] px-2 py-2">
            {sending === 'email' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />} Email link
          </button>
        </div>
        <p className="text-[11px] text-gray-500">
          {appProduct === 'pay'
            ? 'Creates a real tokenized DeltPay application — saves as they go, 14-day link.'
            : 'Pre-filled deltcapital.com application — their name and business are already in it.'}
        </p>
      </div>
    </div>
  );
}

function RepQuickstats({ sessions, repName }: { sessions: CallSession[]; repName: string }) {
  const mine = repName ? sessions.filter(s => s.rep_name === repName) : sessions;
  const today = mine.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());
  const connects = today.filter(s => s.connected).length;
  const meetings = today.filter(s => s.meeting_booked).length;
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Dials today', v: today.length, sub: 'persist to 6–8 attempts per lead' },
        { label: 'Connects', v: connects, sub: `${fmtPct(connects, today.length)} rate — benchmark ~16%` },
        { label: 'Meetings / docs', v: meetings, sub: '4–5% of convos is solid, 15% is elite' },
      ].map(k => (
        <div key={k.label} className="bg-white rounded-[8px] border border-gray-200 px-4 py-3">
          <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold">{k.label}</p>
          <p className="text-xl font-bold text-gray-900">{k.v}</p>
          <p className="text-[11px] text-gray-500">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════
// LIBRARY (playbook editor)
// ══════════════════════════════════════

function Library({ playbooks, cards, variants, sessions, onChanged }: {
  playbooks: Playbook[]; cards: Card[]; variants: Variant[]; sessions: CallSession[]; onChanged: () => void;
}) {
  const [productFilter, setProductFilter] = useState<'all' | 'deltpay' | 'deltcapital'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = playbooks.find(p => p.id === openId) ?? null;

  if (open) {
    return <PlaybookEditor playbook={open} cards={cards} variants={variants} sessions={sessions}
      onBack={() => setOpenId(null)} onChanged={onChanged} />;
  }

  const list = playbooks
    .filter(p => productFilter === 'all' || p.product === productFilter)
    .sort((a, b) => a.product === b.product
      ? (a.industry === 'Universal' ? -1 : b.industry === 'Universal' ? 1 : a.industry.localeCompare(b.industry))
      : (a.product === 'deltpay' ? -1 : 1));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {(['all', 'deltpay', 'deltcapital'] as const).map(f => (
          <button key={f} onClick={() => setProductFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border ${productFilter === f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {f === 'all' ? 'All' : PRODUCT_META[f].label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(p => {
          const pbCards = cards.filter(c => c.playbook_id === p.id);
          const objCount = cards.filter(c => !c.playbook_id && c.product === p.product && c.card_type === 'objection').length;
          const vCount = variants.filter(v => pbCards.some(c => c.id === v.card_id) && v.status === 'active').length;
          const pbSessions = sessions.filter(s => s.playbook_id === p.id);
          const convos = pbSessions.filter(s => s.conversation_30s).length;
          const meetings = pbSessions.filter(s => s.meeting_booked).length;
          const testing = pbCards.some(c => c.test_mode);
          return (
            <button key={p.id} onClick={() => setOpenId(p.id)}
              className="bg-white rounded-[8px] border border-gray-200 hover:border-indigo-300 hover:shadow-sm p-4 text-left transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wide rounded px-1.5 py-0.5 border ${PRODUCT_META[p.product].chip}`}>
                  {PRODUCT_META[p.product].label}
                </span>
                {testing && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">
                    <FlaskConical className="w-3 h-3" /> A/B live
                  </span>
                )}
              </div>
              <p className="text-[14px] font-semibold text-gray-900">{p.industry}</p>
              <p className="text-[12px] text-gray-500 line-clamp-2 mt-0.5">{p.description}</p>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-gray-400">
                <span>{pbCards.length} cards</span>
                <span>{vCount} variants</span>
                <span>{objCount} objections</span>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                <span className="text-gray-500">{pbSessions.length} calls</span>
                <span className={meetings > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                  {meetings} meetings{convos > 0 ? ` · ${fmtPct(meetings, convos)} of convos` : ''}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-4 py-3 text-[12px] text-gray-500 flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>Objection cards are shared per product — edit them once inside any playbook and every deck gets the update. Every script card carries a "Caller thinking" note so green reps learn the why while they read.</span>
      </div>
    </div>
  );
}

function PlaybookEditor({ playbook, cards, variants, sessions, onBack, onChanged }: {
  playbook: Playbook; cards: Card[]; variants: Variant[]; sessions: CallSession[];
  onBack: () => void; onChanged: () => void;
}) {
  const stageCards = cards.filter(c => c.playbook_id === playbook.id).sort((a, b) => a.sort_order - b.sort_order);
  const objCards = cards.filter(c => !c.playbook_id && c.product === playbook.product && c.card_type === 'objection').sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4 max-w-4xl">
      <button onClick={onBack} className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-900">
        <ChevronLeft className="w-4 h-4" /> All playbooks
      </button>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">{playbook.name}</h2>
          <span className={`text-[10px] font-semibold uppercase rounded px-1.5 py-0.5 border ${PRODUCT_META[playbook.product].chip}`}>{PRODUCT_META[playbook.product].label}</span>
        </div>
        <p className="text-[13px] text-gray-500">{playbook.description}</p>
      </div>

      <div className="space-y-3">
        <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400">Stage cards</p>
        {stageCards.map(c => (
          <CardEditor key={c.id} card={c} variants={variants.filter(v => v.card_id === c.id)} sessions={sessions} onChanged={onChanged} />
        ))}
        <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 pt-2">
          Shared {PRODUCT_META[playbook.product].label} objections <span className="normal-case font-normal">(edits apply to every {PRODUCT_META[playbook.product].label} playbook)</span>
        </p>
        {objCards.map(c => (
          <CardEditor key={c.id} card={c} variants={variants.filter(v => v.card_id === c.id)} sessions={sessions} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

function CardEditor({ card, variants, sessions, onChanged }: {
  card: Card; variants: Variant[]; sessions: CallSession[]; onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = variants.filter(v => v.status === 'active');

  const toggleTest = async () => {
    if (!supabase) return;
    setBusy(true);
    await supabase.from('playbook_cards').update({ test_mode: !card.test_mode }).eq('id', card.id);
    setBusy(false); onChanged();
  };

  const addVariant = async () => {
    if (!supabase) return;
    const base = active.find(v => v.is_control) ?? active[0];
    setBusy(true);
    await supabase.from('card_variants').insert({
      card_id: card.id,
      label: `v${variants.length + 1} · challenger`,
      body: base?.body ?? '',
      coaching_note: base?.coaching_note ?? null,
      is_control: false,
    });
    setBusy(false); onChanged();
  };

  return (
    <div className="bg-white rounded-[8px] border border-gray-200">
      <button onClick={() => setExpanded(e => !e)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 w-24 shrink-0">{card.card_type.replace('_', ' ')}</span>
          <span className="text-[13px] font-semibold text-gray-900">{card.title}</span>
          {card.test_mode && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded px-1.5 py-0.5">
              <FlaskConical className="w-3 h-3" /> testing {active.length} variants
            </span>
          )}
        </div>
        <span className="text-[11px] text-gray-400">{active.length} variant{active.length === 1 ? '' : 's'}</span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={toggleTest} disabled={busy || active.length < 2}
              title={active.length < 2 ? 'Add a second variant to start a test' : ''}
              className={`flex items-center gap-1.5 text-[12px] font-medium rounded-[6px] px-2.5 py-1.5 border transition-colors disabled:opacity-40 ${card.test_mode ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}>
              <FlaskConical className="w-3.5 h-3.5" /> {card.test_mode ? 'A/B test ON — variants rotate' : 'Start A/B test'}
            </button>
            <button onClick={addVariant} disabled={busy}
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 bg-white border border-gray-200 hover:border-gray-400 rounded-[6px] px-2.5 py-1.5">
              <Copy className="w-3.5 h-3.5" /> Add variant (copies control)
            </button>
          </div>
          {variants.sort((a, b) => (b.is_control ? 1 : 0) - (a.is_control ? 1 : 0)).map(v => (
            <VariantEditor key={v.id} variant={v} card={card} sessions={sessions} onChanged={onChanged} />
          ))}
        </div>
      )}
    </div>
  );
}

function VariantEditor({ variant, card, sessions, onChanged }: {
  variant: Variant; card: Card; sessions: CallSession[]; onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(variant.body);
  const [note, setNote] = useState(variant.coaching_note ?? '');
  const [label, setLabel] = useState(variant.label);
  const [busy, setBusy] = useState(false);
  const uses = usageCount(variant.id, card.id, sessions);

  const save = async () => {
    if (!supabase) return;
    setBusy(true);
    await supabase.from('card_variants').update({ body, coaching_note: note || null, label }).eq('id', variant.id);
    setBusy(false); setEditing(false); onChanged();
  };
  const retire = async () => {
    if (!supabase) return;
    if (!window.confirm(`Retire ${variant.label}? It stops being served on new calls (history is kept).`)) return;
    setBusy(true);
    await supabase.from('card_variants').update({ status: 'retired' }).eq('id', variant.id);
    setBusy(false); onChanged();
  };
  const restore = async () => {
    if (!supabase) return;
    setBusy(true);
    await supabase.from('card_variants').update({ status: 'active' }).eq('id', variant.id);
    setBusy(false); onChanged();
  };
  const makeControl = async () => {
    if (!supabase) return;
    setBusy(true);
    await supabase.from('card_variants').update({ is_control: false }).eq('card_id', card.id);
    await supabase.from('card_variants').update({ is_control: true }).eq('id', variant.id);
    setBusy(false); onChanged();
  };

  return (
    <div className={`border rounded-[8px] p-3.5 ${variant.status === 'retired' ? 'border-gray-100 bg-gray-50 opacity-60' : variant.is_control ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {editing ? (
            <input value={label} onChange={e => setLabel(e.target.value)} className="text-[12px] border border-gray-200 rounded px-2 py-0.5 w-40" />
          ) : (
            <span className="text-[12px] font-semibold text-gray-800">{variant.label}</span>
          )}
          {variant.is_control && <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 rounded px-1.5 py-0.5">CONTROL</span>}
          {variant.status === 'retired' && <span className="text-[10px] font-bold text-gray-500 bg-gray-200 rounded px-1.5 py-0.5">RETIRED</span>}
          <span className="text-[11px] text-gray-400">{uses} calls</span>
        </div>
        <div className="flex items-center gap-1.5">
          {variant.status === 'active' && !variant.is_control && (
            <button onClick={makeControl} disabled={busy} className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-1.5">Make control</button>
          )}
          {editing ? (
            <button onClick={save} disabled={busy} className="flex items-center gap-1 text-[11px] font-semibold text-white bg-indigo-600 rounded px-2 py-1"><Save className="w-3 h-3" /> Save</button>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-gray-800 px-1.5"><Pencil className="w-3 h-3" /> Edit</button>
          )}
          {variant.status === 'active'
            ? <button onClick={retire} disabled={busy} className="text-[11px] text-gray-400 hover:text-red-600 px-1.5">Retire</button>
            : <button onClick={restore} disabled={busy} className="text-[11px] text-gray-400 hover:text-emerald-600 px-1.5">Restore</button>}
        </div>
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={10}
            className="w-full border border-gray-200 rounded-[6px] px-3 py-2 text-[13px] font-mono leading-relaxed" />
          <div>
            <label className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">Caller thinking (coaching note)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full border border-amber-200 bg-amber-50/50 rounded-[6px] px-3 py-2 text-[13px] mt-1" />
          </div>
          <p className="text-[11px] text-gray-400">Formatting: {'{{merge_fields}}'} · [GREEN]/[BLUE]/[RED] branch labels · (pause) stage directions · IF …: bold branches</p>
        </div>
      ) : (
        <>
          <ScriptBody body={variant.body} merge={{}} />
          {variant.coaching_note && <CoachingNote note={variant.coaching_note} />}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════
// PERFORMANCE (A/B results + promote winner)
// ══════════════════════════════════════

const MIN_CONNECTS_PER_VARIANT = 50; // sample-size gate before declaring a winner

function Performance({ playbooks, cards, variants, sessions, onChanged }: {
  playbooks: Playbook[]; cards: Card[]; variants: Variant[]; sessions: CallSession[]; onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);

  // Funnel totals
  const dials = sessions.length;
  const connects = sessions.filter(s => s.connected).length;
  const convos = sessions.filter(s => s.conversation_30s).length;
  const meetings = sessions.filter(s => s.meeting_booked).length;

  // Cards under test, or with >1 active variant, or any card with usage across 2+ variants
  const testCards = cards.filter(c => {
    const act = variants.filter(v => v.card_id === c.id && v.status === 'active');
    return c.test_mode || act.length > 1;
  });

  // Objection frequency
  const objFreq = useMemo(() => {
    const freq: Record<string, number> = {};
    sessions.forEach(s => (s.objections_hit ?? []).forEach(id => { freq[id] = (freq[id] ?? 0) + 1; }));
    return Object.entries(freq)
      .map(([id, n]) => ({ card: cards.find(c => c.id === id), n }))
      .filter(x => x.card)
      .sort((a, b) => b.n - a.n)
      .slice(0, 8);
  }, [sessions, cards]);

  const promote = async (winner: Variant, card: Card) => {
    if (!supabase) return;
    const losers = variants.filter(v => v.card_id === card.id && v.status === 'active' && v.id !== winner.id);
    if (!window.confirm(
      `Promote "${winner.label}" as the winner on "${card.title}"?\n\nThis makes it the control, retires ${losers.length} other variant(s), and stops the rotation — every rep gets the winning script.`
    )) return;
    setBusy(true);
    await supabase.from('card_variants').update({ is_control: false }).eq('card_id', card.id);
    await supabase.from('card_variants').update({ is_control: true }).eq('id', winner.id);
    for (const l of losers) await supabase.from('card_variants').update({ status: 'retired' }).eq('id', l.id);
    await supabase.from('playbook_cards').update({ test_mode: false }).eq('id', card.id);
    setBusy(false); onChanged();
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Funnel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Dials', v: dials, sub: '12–20 dials per booked meeting is normal' },
          { label: 'Connect rate', v: fmtPct(connects, dials), sub: 'benchmark ~16.6% · below 10% = list problem', warn: dials >= 30 && connects / Math.max(dials, 1) < 0.10 },
          { label: 'Conversations >30s', v: fmtPct(convos, connects), sub: '30–50% of connects is healthy' },
          { label: 'Convo → meeting', v: fmtPct(meetings, convos), sub: '4–5% solid · 15% elite · <2% = fix script or list', warn: convos >= 30 && meetings / Math.max(convos, 1) < 0.02 },
        ].map(k => (
          <div key={k.label} className={`bg-white rounded-[8px] border px-4 py-3 ${k.warn ? 'border-red-300' : 'border-gray-200'}`}>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold flex items-center gap-1">
              {k.label}{k.warn && <AlertTriangle className="w-3 h-3 text-red-500" />}
            </p>
            <p className="text-xl font-bold text-gray-900">{k.v}</p>
            <p className="text-[11px] text-gray-500">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Experiments */}
      <div>
        <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-2">Script experiments</p>
        {testCards.length === 0 ? (
          <div className="bg-white rounded-[8px] border border-gray-200 p-6 text-center text-[13px] text-gray-400">
            No cards have multiple variants yet — add a challenger variant in the Playbooks tab to start a test.
          </div>
        ) : (
          <div className="space-y-3">
            {testCards.map(card => {
              const pb = playbooks.find(p => p.id === card.playbook_id);
              const act = variants.filter(v => v.card_id === card.id && v.status === 'active');
              const rows = act.map(v => {
                const vs = sessions.filter(s => s.variant_map?.[card.id] === v.id);
                const c = vs.filter(s => s.connected).length;
                const cv = vs.filter(s => s.conversation_30s).length;
                const m = vs.filter(s => s.meeting_booked).length;
                return { v, calls: vs.length, connects: c, convos: cv, meetings: m, rate: cv > 0 ? m / cv : 0 };
              }).sort((a, b) => b.rate - a.rate);
              const leader = rows[0];
              const ready = rows.length > 1 && rows.every(r => r.connects >= MIN_CONNECTS_PER_VARIANT);
              return (
                <div key={card.id} className="bg-white rounded-[8px] border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">
                        {card.title}
                        <span className="text-gray-400 font-normal"> — {pb ? pb.name : `shared ${card.product} objection`}</span>
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {card.test_mode
                          ? `Rotating ${act.length} variants evenly across calls`
                          : `${act.length} active variants (rotation off — control is served)`}
                      </p>
                    </div>
                    {ready ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                        <Trophy className="w-3.5 h-3.5" /> Sample size reached — pick a winner
                      </span>
                    ) : rows.length > 1 && (
                      <span className="text-[11px] text-gray-400">
                        Keep testing — {MIN_CONNECTS_PER_VARIANT}+ connects per variant before calling it
                      </span>
                    )}
                  </div>
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-wide">
                        <th className="text-left py-1.5 font-semibold">Variant</th>
                        <th className="text-right py-1.5 font-semibold">Calls</th>
                        <th className="text-right py-1.5 font-semibold">Connects</th>
                        <th className="text-right py-1.5 font-semibold">Convos</th>
                        <th className="text-right py-1.5 font-semibold">Meetings</th>
                        <th className="text-right py-1.5 font-semibold">Convo→Mtg</th>
                        <th className="text-right py-1.5 font-semibold" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(r => (
                        <tr key={r.v.id} className="border-t border-gray-100">
                          <td className="py-2">
                            <span className="font-medium text-gray-800">{r.v.label}</span>
                            {r.v.is_control && <span className="ml-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-100 rounded px-1 py-0.5">CONTROL</span>}
                            {rows.length > 1 && r === leader && r.meetings > 0 && <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded px-1 py-0.5">LEADING</span>}
                          </td>
                          <td className="text-right text-gray-600">{r.calls}</td>
                          <td className="text-right text-gray-600">
                            {r.connects}
                            <span className="text-gray-300"> / {MIN_CONNECTS_PER_VARIANT}</span>
                          </td>
                          <td className="text-right text-gray-600">{r.convos}</td>
                          <td className="text-right font-semibold text-gray-900">{r.meetings}</td>
                          <td className="text-right font-semibold text-gray-900">{fmtPct(r.meetings, r.convos)}</td>
                          <td className="text-right">
                            {rows.length > 1 && (
                              <button onClick={() => promote(r.v, card)} disabled={busy}
                                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-40">
                                Promote winner
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Objection frequency */}
      {objFreq.length > 0 && (
        <div className="bg-white rounded-[8px] border border-gray-200 p-4">
          <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mb-2">Most-hit objections</p>
          <div className="space-y-1.5">
            {objFreq.map(({ card, n }) => (
              <div key={card!.id} className="flex items-center gap-3">
                <span className="text-[12px] text-gray-700 w-56 truncate">{card!.title}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-rose-400 h-2 rounded-full" style={{ width: `${(n / objFreq[0].n) * 100}%` }} />
                </div>
                <span className="text-[12px] text-gray-500 w-8 text-right">{n}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Rising objection = tune that card first. Falling objection after a script change = the change is working.</p>
        </div>
      )}

      {/* Methodology */}
      <div className="bg-gray-50 border border-gray-200 rounded-[8px] px-4 py-3 text-[12px] text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Testing rules baked into this page</p>
        <p>• Change ONE card per test (opener only, or close only) — never two whole scripts at once.</p>
        <p>• Rotation splits calls evenly; wait for {MIN_CONNECTS_PER_VARIANT}+ connects per variant and 2–3 weeks before promoting.</p>
        <p>• Within 1–2 points = tie; only promote clear gaps (e.g. 6.5% vs 3%). Then the winner becomes control and the next single-variable test starts.</p>
      </div>
    </div>
  );
}
