import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Send, Mail, MessageSquare, MousePointerClick, BarChart3, Zap,
  Clock, TrendingUp, RefreshCw, Activity, FlaskConical, Globe,
  ExternalLink, AlertTriangle,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════
//
// This page renders REAL outreach telemetry from the `outreach_events`
// table (written by the deltcapital.com serverless functions):
//   sent    — an email/SMS left our hands
//   opened  — the tracking pixel in the email fired
//   clicked — the lead followed a tracked link (short-link redirect or
//             a utm-tagged /apply visit reported by the apply modal)
//
// Session-level attribution (which utm_campaign drove site visits) lives
// in Vercel Web Analytics for the deltcapital.com project — this page
// covers per-lead engagement, which Vercel can't see.

type Channel = 'email' | 'sms';

interface OutreachEventRow {
  id: number;
  created_at: string;
  lead_id: string | null;
  lead_email: string | null;
  lead_name: string | null;
  campaign: string;
  channel: string;
  event: 'sent' | 'opened' | 'clicked' | 'responded' | 'bounced';
  variant: string | null;
  utm: Record<string, string> | null;
  meta: Record<string, unknown> | null;
}

interface CampaignAgg {
  campaign: string;
  name: string;
  description: string;
  channel: Channel;
  automated: boolean;
  sent: number;            // total sent events
  recipients: number;      // unique leads sent to
  opened: number;          // unique leads that opened
  clicked: number;         // unique leads that clicked
  lastActivity: string | null;
}

// Known campaigns fired by the deltcapital.com pipeline. Anything else
// that shows up in outreach_events still renders, with the raw key.
const CAMPAIGN_META: Record<string, { name: string; description: string; channel: Channel; automated: boolean }> = {
  'calc-confirmation': {
    name: 'Calculator Confirmation',
    description: 'Instant pre-qualification email after the calculator lead-gate',
    channel: 'email',
    automated: true,
  },
  'calc-nudge-45m': {
    name: 'T+45min Reactivation Nudge',
    description: 'Follow-up email to leads that stalled before bank link (A/B subjects)',
    channel: 'email',
    automated: true,
  },
  'sms-nudge': {
    name: 'SMS Short-Link Taps',
    description: 'Lead tapped the deltcapital.com/r/… short link from a text',
    channel: 'sms',
    automated: false,
  },
};

// Subject-line copy for the nudge A/B test — mirrors nudgeSubject() in
// the DeltCapital repo (api/sms-nudge.js) so the backend shows what each
// variant actually says.
const NUDGE_VARIANTS: Record<string, string> = {
  a: '{Name} — your {$high}K offer is holding (2 min to claim)',
  b: 'Your Delt Capital offer expires Sunday',
  c: 'David @ Delt: your {$low}–{$high}K is still open',
};

// ── Helpers ──
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const timeAgo = (iso: string | null) => {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const channelIcon: Record<string, { icon: React.ElementType; label: string; bg: string; text: string }> = {
  email: { icon: Mail, label: 'Email', bg: 'bg-blue-50', text: 'text-blue-700' },
  sms: { icon: MessageSquare, label: 'SMS', bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const eventStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  sent: { label: 'Sent', color: 'text-gray-600', bg: 'bg-gray-100' },
  opened: { label: 'Opened', color: 'text-blue-700', bg: 'bg-blue-50' },
  clicked: { label: 'Clicked', color: 'text-purple-700', bg: 'bg-purple-50' },
  responded: { label: 'Responded', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  bounced: { label: 'Bounced', color: 'text-red-700', bg: 'bg-red-50' },
};

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left py-2.5 px-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold ${className}`}>
      {children}
    </th>
  );
}

function InlineEmpty({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 px-6 py-14 text-center">
      <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">{body}</p>
    </div>
  );
}

// ══════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════
export function BackendOutreach() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ab' | 'automations' | 'activity'>('dashboard');
  const [events, setEvents] = useState<OutreachEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('outreach_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) {
      setLoadError(error.message);
      setEvents([]);
    } else {
      setEvents((data || []) as OutreachEventRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime: stream new events in as the website records them.
  useEffect(() => {
    if (!supabase) return;
    const ch = supabase
      .channel('outreach-events')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'outreach_events' }, (payload) => {
        setEvents(prev => [payload.new as OutreachEventRow, ...prev]);
      })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, []);

  // ── Aggregates ──
  const leadKey = (e: OutreachEventRow) => e.lead_id || e.lead_email || String(e.id);

  const campaigns = useMemo<CampaignAgg[]>(() => {
    const byCampaign = new Map<string, OutreachEventRow[]>();
    events.forEach(e => {
      const list = byCampaign.get(e.campaign) || [];
      list.push(e);
      byCampaign.set(e.campaign, list);
    });
    const aggs: CampaignAgg[] = [];
    byCampaign.forEach((list, campaign) => {
      const meta = CAMPAIGN_META[campaign] || {
        name: campaign, description: 'Untracked campaign key', channel: 'email' as Channel, automated: false,
      };
      const uniq = (ev: string) => new Set(list.filter(e => e.event === ev).map(leadKey)).size;
      aggs.push({
        campaign,
        ...meta,
        sent: list.filter(e => e.event === 'sent').length,
        recipients: uniq('sent'),
        opened: uniq('opened'),
        clicked: uniq('clicked'),
        lastActivity: list.length ? list[0].created_at : null,
      });
    });
    // SMS short-link taps have no 'sent' baseline — always show last.
    return aggs.sort((x, y) => (y.recipients - x.recipients) || x.campaign.localeCompare(y.campaign));
  }, [events]);

  const metrics = useMemo(() => {
    const sent = events.filter(e => e.event === 'sent');
    const totalSent = sent.length;
    const uniqSent = new Set(sent.map(leadKey)).size;
    const uniqOpened = new Set(events.filter(e => e.event === 'opened').map(leadKey)).size;
    const uniqClicked = new Set(events.filter(e => e.event === 'clicked').map(leadKey)).size;
    return {
      totalSent,
      uniqSent,
      uniqOpened,
      uniqClicked,
      openRate: uniqSent > 0 ? uniqOpened / uniqSent : 0,
      clickRate: uniqSent > 0 ? uniqClicked / uniqSent : 0,
      nudgesSent: events.filter(e => e.campaign === 'calc-nudge-45m' && e.event === 'sent').length,
      lastEvent: events.length ? events[0].created_at : null,
    };
  }, [events]);

  // A/B subject-line breakdown for the reactivation nudge.
  const abStats = useMemo(() => {
    const nudge = events.filter(e => e.campaign === 'calc-nudge-45m');
    const variants = ['a', 'b', 'c'];
    const rows = variants.map(v => {
      const list = nudge.filter(e => e.variant === v);
      const uniq = (ev: string) => new Set(list.filter(e => e.event === ev).map(leadKey)).size;
      const sent = list.filter(e => e.event === 'sent').length;
      return { variant: v, subject: NUDGE_VARIANTS[v], sent, opened: uniq('opened'), clicked: uniq('clicked') };
    });
    const legacy = nudge.filter(e => !e.variant && e.event === 'sent').length;
    return { rows, legacy, total: nudge.filter(e => e.event === 'sent').length };
  }, [events]);

  // Real automations wired into the deltcapital.com pipeline.
  const automations = useMemo(() => {
    const nudgeSent = events.filter(e => e.campaign === 'calc-nudge-45m' && e.event === 'sent');
    const confSent = events.filter(e => e.campaign === 'calc-confirmation' && e.event === 'sent');
    return [
      {
        id: 'calc-confirmation',
        name: 'Calculator Confirmation Email',
        when: 'Lead submits the calculator lead-gate on deltcapital.com',
        then: 'Instant pre-qualification email with deep link back into the application',
        channel: 'email' as Channel,
        cadence: 'Instant (transactional)',
        fired: confSent.length,
        lastFired: confSent.length ? confSent[0].created_at : null,
      },
      {
        id: 'calc-nudge-45m',
        name: 'T+45min Reactivation Nudge',
        when: 'Lead stalls 45min–24h without connecting a bank (cron, every 15min, quiet hours 9pm–8am ET + weekends)',
        then: 'A/B-subject follow-up email to the lead + tap-to-text SMS prompt to the operator',
        channel: 'email' as Channel,
        cadence: 'Cron */15 · one nudge per lead',
        fired: nudgeSent.length,
        lastFired: nudgeSent.length ? nudgeSent[0].created_at : null,
      },
    ];
  }, [events]);

  const tabs = [
    { key: 'dashboard' as const, label: 'Campaign Dashboard', icon: BarChart3 },
    { key: 'ab' as const, label: 'A/B Subjects', icon: FlaskConical },
    { key: 'automations' as const, label: 'Automations', icon: Zap, badge: automations.length },
    { key: 'activity' as const, label: 'Activity Log', icon: Activity },
  ];

  const recentEvents = events.slice(0, 12);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Live engagement from deltcapital.com lead emails — sends, opens, clicks, and UTM attribution per lead
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {automations.length} automations live
            </span>
            <button onClick={load}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-[6px] hover:bg-gray-50 transition-colors flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Config / error notices ── */}
        {!isSupabaseConfigured && (
          <div className="bg-amber-50 border border-amber-200 rounded-[8px] p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Supabase isn't configured in this environment, so outreach telemetry can't load.
              Set <code className="font-mono">VITE_SUPABASE_URL</code> and <code className="font-mono">VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        )}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-[8px] p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-800 leading-relaxed">Couldn't load outreach events: {loadError}</p>
          </div>
        )}

        {/* ── Top KPIs (unique-lead based) ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Emails Sent', value: metrics.totalSent.toLocaleString(), accent: 'border-t-brand', sub: `${metrics.uniqSent} unique leads` },
            { label: 'Open Rate', value: metrics.uniqSent ? fmtPct(metrics.openRate) : '—', accent: 'border-t-blue-500', sub: `${metrics.uniqOpened} leads opened` },
            { label: 'Click Rate', value: metrics.uniqSent ? fmtPct(metrics.clickRate) : '—', accent: 'border-t-purple-500', sub: `${metrics.uniqClicked} leads clicked` },
            { label: 'Nudges Fired', value: metrics.nudgesSent.toLocaleString(), accent: 'border-t-amber-500', sub: 'T+45min reactivation' },
            { label: 'Last Activity', value: timeAgo(metrics.lastEvent), accent: 'border-t-emerald-500', sub: 'across all campaigns' },
          ].map((kpi, i) => (
            <div key={i} className={`bg-white rounded-[8px] border border-gray-200 border-t-2 ${kpi.accent} p-4`}>
              <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-900 leading-none">{kpi.value}</p>
              <p className="text-xs text-gray-400 mt-1.5">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Nav ── */}
        <div className="border-b border-gray-200">
          <div className="flex gap-1">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-[1px] flex items-center gap-2 ${
                  activeTab === t.key ? 'text-brand border-brand' : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.badge !== undefined && (
                  <span className={`text-[10px] tabular-nums px-1.5 py-px rounded-full ${
                    activeTab === t.key ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500'
                  }`}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════ */}
        {/* CAMPAIGN DASHBOARD                       */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {campaigns.length === 0 && !loading ? (
              <InlineEmpty icon={Send} title="No outreach recorded yet"
                body="Events appear here the moment deltcapital.com sends a calculator confirmation or reactivation nudge. Opens and clicks stream in as leads engage." />
            ) : (
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <Th className="pl-5">Campaign</Th>
                        <Th>Channel</Th>
                        <Th>Type</Th>
                        <Th>Sent</Th>
                        <Th>Recipients</Th>
                        <Th>Open Rate</Th>
                        <Th>Click Rate</Th>
                        <Th className="pr-5">Last Activity</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map(c => {
                        const ch = channelIcon[c.channel] || channelIcon.email;
                        const ChIcon = ch.icon;
                        const denom = c.recipients;
                        return (
                          <tr key={c.campaign} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="pl-5 py-2.5">
                              <p className="text-sm font-medium text-gray-900">{c.name}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">{c.description}</p>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${ch.bg} ${ch.text}`}>
                                <ChIcon className="w-3 h-3" />{ch.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-600">{c.automated ? 'Automated' : 'Tracked'}</td>
                            <td className="py-2.5 px-3 text-sm tabular-nums text-gray-900 font-medium">{c.sent > 0 ? c.sent.toLocaleString() : '—'}</td>
                            <td className="py-2.5 px-3 text-sm tabular-nums text-gray-600">{c.recipients > 0 ? c.recipients.toLocaleString() : '—'}</td>
                            <td className="py-2.5 px-3 text-sm tabular-nums font-medium">
                              {denom > 0 ? (
                                <span className={c.opened / denom > 0.5 ? 'text-emerald-600' : c.opened / denom > 0.3 ? 'text-amber-600' : 'text-gray-500'}>
                                  {fmtPct(c.opened / denom)}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-sm tabular-nums font-medium">
                              {denom > 0 ? (
                                <span className={c.clicked / denom > 0.2 ? 'text-emerald-600' : c.clicked / denom > 0.1 ? 'text-amber-600' : 'text-gray-500'}>
                                  {fmtPct(c.clicked / denom)}
                                </span>
                              ) : c.clicked > 0 ? <span className="text-purple-600">{c.clicked} clicks</span> : '—'}
                            </td>
                            <td className="pr-5 py-2.5 px-3 text-xs text-gray-500">{timeAgo(c.lastActivity)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Site-side attribution pointer */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-[8px] border border-indigo-200 p-4 flex items-start gap-3">
              <Globe className="w-5 h-5 text-brand mt-0.5 shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">Session attribution lives in Vercel Web Analytics</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Every email CTA is utm-tagged (<code className="font-mono">utm_campaign</code> per email,{' '}
                  <code className="font-mono">utm_content</code> per subject variant). Vercel Web Analytics on the
                  deltcapital.com project breaks down site visits by those params; this page tracks the same tags
                  per lead once they open the application.
                </p>
              </div>
              <a href="https://vercel.com/deltpay/delt-capital-final/analytics" target="_blank" rel="noreferrer"
                className="shrink-0 px-3 py-1.5 bg-white border border-indigo-200 text-brand text-xs font-medium rounded-[6px] hover:bg-indigo-50 flex items-center gap-1.5">
                Open Analytics <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Recent Events */}
            {recentEvents.length > 0 && (
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Recent Outreach Activity</h3>
                  <span className="text-[10px] text-gray-400 ml-auto">Latest {recentEvents.length} events</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentEvents.map(ev => {
                    const ch = channelIcon[ev.channel] || channelIcon.email;
                    const st = eventStatusConfig[ev.event] || eventStatusConfig.sent;
                    const ChIcon = ch.icon;
                    const meta = CAMPAIGN_META[ev.campaign];
                    return (
                      <div key={ev.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50">
                        <div className={`w-7 h-7 rounded-full ${ch.bg} flex items-center justify-center shrink-0`}>
                          <ChIcon className={`w-3.5 h-3.5 ${ch.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-gray-900 font-medium truncate">
                              {ev.lead_name || ev.lead_email || 'Unknown lead'}
                            </p>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${st.bg} ${st.color}`}>{st.label}</span>
                            {ev.variant && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 uppercase">Subj {ev.variant}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate">
                            {(meta && meta.name) || ev.campaign}
                            {ev.lead_email && ev.lead_name ? <> &bull; {ev.lead_email}</> : null}
                            &nbsp;&bull; {timeAgo(ev.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* A/B SUBJECTS                             */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'ab' && (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-[8px] border border-amber-200 p-4 flex items-start gap-3">
              <FlaskConical className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">Reactivation Nudge — Subject Line Test</h3>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Each stalled lead deterministically gets one of three subjects (split ~33/33/33 by lead id).
                  The variant rides the CTA link as <code className="font-mono">utm_content=subj-a/b/c</code>, so opens
                  AND clicks attribute back to the subject that earned them.
                </p>
              </div>
            </div>

            {abStats.total === 0 ? (
              <InlineEmpty icon={FlaskConical} title="No nudges sent since the A/B test went live"
                body="The next time the T+45min cron fires, sends land here split by subject variant. Give it a day of traffic before reading anything into the rates." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {abStats.rows.map(row => {
                  const openRate = row.sent > 0 ? row.opened / row.sent : 0;
                  const clickRate = row.sent > 0 ? row.clicked / row.sent : 0;
                  return (
                    <div key={row.variant} className="bg-white rounded-[8px] border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 text-xs font-bold flex items-center justify-center uppercase">{row.variant}</span>
                        <p className="text-xs text-gray-500">{row.sent} sent</p>
                      </div>
                      <p className="text-sm text-gray-900 font-medium leading-snug mb-3">"{row.subject}"</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                            <span>Open rate</span><span className="tabular-nums text-gray-700 font-semibold">{row.sent ? fmtPct(openRate) : '—'}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(openRate * 100, 100)}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                            <span>Click rate</span><span className="tabular-nums text-gray-700 font-semibold">{row.sent ? fmtPct(clickRate) : '—'}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(clickRate * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {abStats.legacy > 0 && (
              <p className="text-[11px] text-gray-400">
                {abStats.legacy} nudge{abStats.legacy === 1 ? '' : 's'} predate the A/B rotation and aren't attributed to a variant.
              </p>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* AUTOMATIONS                              */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'automations' && (
          <div className="space-y-3">
            {automations.map(rule => {
              const ch = channelIcon[rule.channel];
              const ChIcon = ch.icon;
              return (
                <div key={rule.id} className="bg-white rounded-[8px] border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <h4 className="text-sm font-bold text-gray-900">{rule.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">Active</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${ch.bg} ${ch.text}`}>
                          <ChIcon className="w-3 h-3" />{ch.label}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8 text-xs">
                        <div>
                          <p className="text-gray-400 uppercase text-[9px] tracking-wide font-bold mb-1">When</p>
                          <p className="text-gray-700 font-medium max-w-md">{rule.when}</p>
                        </div>
                        <div className="shrink-0">
                          <p className="text-gray-400 uppercase text-[9px] tracking-wide font-bold mb-1">Then</p>
                          <p className="text-gray-700 font-medium max-w-md">{rule.then}</p>
                          <p className="text-gray-400 text-[10px] mt-0.5">{rule.cadence}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 ml-4 text-right">
                      <div>
                        <p className="text-lg font-bold text-gray-900 tabular-nums">{rule.fired}</p>
                        <p className="text-[9px] text-gray-400">times fired</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{timeAgo(rule.lastFired)}</p>
                        <p className="text-[9px] text-gray-400">last fired</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-[11px] text-gray-400 leading-relaxed">
              These automations run in the deltcapital.com pipeline (Vercel serverless + cron). Merchant-side rules
              (chargeback alerts, renewal triggers, drip sequences) will appear here as they're wired to live data.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════ */}
        {/* ACTIVITY LOG                             */}
        {/* ════════════════════════════════════════ */}
        {activeTab === 'activity' && (
          <div className="space-y-5">
            {events.length === 0 && !loading ? (
              <InlineEmpty icon={Activity} title="No activity yet"
                body="Every send, open, and click on outreach emails is logged here with its campaign, subject variant, and UTM tags." />
            ) : (
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <Th className="pl-5">Lead</Th>
                        <Th>Event</Th>
                        <Th>Campaign</Th>
                        <Th>Channel</Th>
                        <Th>Variant</Th>
                        <Th>UTM</Th>
                        <Th className="pr-5">When</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.slice(0, 200).map(ev => {
                        const ch = channelIcon[ev.channel] || channelIcon.email;
                        const st = eventStatusConfig[ev.event] || eventStatusConfig.sent;
                        const ChIcon = ch.icon;
                        const meta = CAMPAIGN_META[ev.campaign];
                        return (
                          <tr key={ev.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="pl-5 py-2.5">
                              <p className="text-sm font-medium text-gray-900">{ev.lead_name || '—'}</p>
                              <p className="text-[10px] text-gray-400">{ev.lead_email || ev.lead_id || ''}</p>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${st.bg} ${st.color}`}>{st.label}</span>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-600">{(meta && meta.name) || ev.campaign}</td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${ch.bg} ${ch.text}`}>
                                <ChIcon className="w-3 h-3" />{ch.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-xs text-gray-600 uppercase">{ev.variant || '—'}</td>
                            <td className="py-2.5 px-3 text-[10px] text-gray-400 font-mono max-w-[220px] truncate">
                              {ev.utm ? Object.entries(ev.utm).map(([k, v]) => `${k.replace('utm_', '')}=${v}`).join(' ') : '—'}
                            </td>
                            <td className="pr-5 py-2.5 px-3 text-xs text-gray-500 whitespace-nowrap">{timeAgo(ev.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <p className="text-[11px] text-gray-400 leading-relaxed flex items-start gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 mt-px shrink-0" />
              Opens are recorded by a tracking pixel and inflated by Apple Mail privacy prefetch — treat them as an
              upper bound. Clicks (utm-tagged link follows) are the reliable engagement signal.
            </p>
          </div>
        )}

        {loading && events.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">Loading outreach telemetry…</div>
        )}
      </div>
    </div>
  );
}
