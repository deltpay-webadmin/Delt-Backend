import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Edit, Plus, Download, FileText, FileCheck, File, Receipt, CalendarDays, CreditCard, Banknote, Globe, AlertCircle, Mail, MessageSquare, Monitor, Eye, MousePointerClick, ChevronDown, Send, PlusCircle, ToggleLeft, ToggleRight, CheckCircle, Settings, Clock, Percent, XCircle, ExternalLink, Gauge, Smartphone, Activity, Brain, Zap, Shield, BarChart3, Key, Package, Gift, Copy, Users, Truck, Link2, X, ShieldAlert, StickyNote, Flag, Calendar, Megaphone, Trash2 } from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';
import { Button } from '../ui';

/* ─── Shared sub-components ─── */

function StatCard({ label, value, trend, subtitle }: { label: string; value: string; trend?: { value: string; isPositive: boolean }; subtitle?: string }) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-5">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <span className={`flex items-center text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {trend.value}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

function HealthScoreCard({ score }: { score: number }) {
  const getColor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-amber-600' : 'text-red-600';
  const getStroke = (s: number) => s >= 80 ? '#10B981' : s >= 60 ? '#F59E0B' : '#EF4444';
  const c = 2 * Math.PI * 36;
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-5">
      <p className="text-sm text-gray-600 mb-3">Lens Health Score</p>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          <svg className="transform -rotate-90 w-20 h-20">
            <circle cx="40" cy="40" r="36" stroke="#E5E7EB" strokeWidth="8" fill="none" />
            <circle cx="40" cy="40" r="36" stroke={getStroke(score)} strokeWidth="8" fill="none" strokeDasharray={c} strokeDashoffset={c - (score / 100) * c} strokeLinecap="round" className="transition-all duration-500" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${getColor(score)}`}>{score}</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500">Out of 100</p>
          <p className="text-xs text-gray-500 mt-1">{score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Fair'}</p>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (<div className="py-3 border-b border-gray-100 last:border-0"><p className="text-xs text-gray-500 mb-1">{label}</p><p className="text-sm font-medium text-gray-900">{value}</p></div>);
}

function TimelineItem({ icon, title, description, user, timestamp, isLast }: { icon: React.ReactNode; title: string; description: string; user: string; timestamp: string; isLast?: boolean }) {
  return (
    <div className="flex gap-3 relative">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0">{icon}</div>
        {!isLast && <div className="w-px h-full bg-gray-200 mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500">{user}</span>
          <span className="text-xs text-gray-400">&bull;</span>
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>
      </div>
    </div>
  );
}

function DocumentItem({ name, type, date }: { name: string; type: string; date: string }) {
  const icon = type.includes('Agreement') ? <FileCheck className="w-5 h-5 text-brand" /> : type.includes('Bank') ? <FileText className="w-5 h-5 text-emerald-600" /> : <File className="w-5 h-5 text-gray-600" />;
  const cls = type.includes('Agreement') ? 'bg-brand-50 text-brand-hover' : type.includes('Bank') ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-700';
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-3 -mx-3 rounded-[8px] transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{type}</span>
            <span className="text-xs text-gray-500">{date}</span>
          </div>
        </div>
      </div>
      <button className="p-2 hover:bg-gray-100 rounded-[8px] transition-colors"><Download className="w-4 h-4 text-gray-600" /></button>
    </div>
  );
}

/* ─── Bundles (kept compact) ─── */
const BUNDLE_TIERS = [
  { id: 'welcome', name: 'Welcome Bundle', amount: 500 },
  { id: 'referrer', name: 'Referrer Reward', amount: 200 },
  { id: 'retention-light', name: 'Retention - Light', amount: 200 },
  { id: 'retention-medium', name: 'Retention - Medium', amount: 350 },
  { id: 'retention-full', name: 'Retention - Full', amount: 500 },
];
type CreditStatus = 'Active' | 'Partially Used' | 'Fully Used' | 'Expired';
interface BundleCredit { id: string; tier: string; amount: number; used: number; status: CreditStatus; expiration: string; }
const CARD_QTY_OPTIONS = [50, 100, 250, 500];
function creditStatusCls(s: CreditStatus) { return s === 'Active' ? 'bg-emerald-50 text-emerald-700' : s === 'Partially Used' ? 'bg-amber-50 text-amber-700' : s === 'Fully Used' ? 'bg-gray-100 text-gray-500' : s === 'Expired' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'; }

function BundlesAndReferralsCard({ merchantName, merchantId }: { merchantName: string; merchantId: string }) {
  const [credits, setCredits] = useState<BundleCredit[]>([
    { id: 'bc-1', tier: 'Welcome Bundle', amount: 500, used: 150, status: 'Partially Used', expiration: 'May 10, 2026' },
    { id: 'bc-2', tier: 'Referrer Reward', amount: 200, used: 200, status: 'Fully Used', expiration: 'Mar 28, 2026' },
  ]);
  const [issueDropdown, setIssueDropdown] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardQty, setCardQty] = useState(100);
  const [shipTo, setShipTo] = useState<'merchant' | 'agent'>('merchant');
  const [copied, setCopied] = useState(false);
  const [reminderSent, setReminderSent] = useState<string | null>(null);
  const referralLink = `https://deltpay.com/r/${merchantId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const handleIssue = (t: { id: string; name: string; amount: number }) => { const exp = new Date(); exp.setDate(exp.getDate() + 30); setCredits(prev => [...prev, { id: `bc-${Date.now()}`, tier: t.name, amount: t.amount, used: 0, status: 'Active', expiration: exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }]); setIssueDropdown(false); };
  return (
    <div className="bg-white rounded-[8px] border border-gray-200">
      <div className="px-5 py-3 border-b border-gray-200"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-gray-400" /><h3 className="text-sm font-semibold text-gray-700">Bundles & Referrals</h3></div>
        <div className="relative"><button onClick={() => setIssueDropdown(!issueDropdown)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-brand hover:bg-brand-50 border border-gray-200 rounded-[8px] transition-colors"><Gift className="w-3.5 h-3.5" />Issue Credit<ChevronDown className="w-3 h-3 ml-0.5" /></button>
          {issueDropdown && (<><div className="fixed inset-0 z-10" onClick={() => setIssueDropdown(false)} /><div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-[8px] shadow-lg py-1 w-60"><p className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Select Tier</p>{BUNDLE_TIERS.map(t => (<button key={t.id} onClick={() => handleIssue(t)} className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"><span>{t.name}</span><span className="text-xs font-semibold text-gray-900">${t.amount}</span></button>))}</div></>)}
        </div></div></div>
      <div className="px-5 py-3 border-b border-gray-200">
        {credits.length === 0 ? <p className="text-sm text-gray-400 py-3 text-center">No credits issued yet.</p> : (
          <div className="divide-y divide-gray-100">{credits.map(c => { const rem = c.amount - c.used; const pct = Math.round((c.used / c.amount) * 100); return (
            <div key={c.id} className="flex items-center gap-4 py-3"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><p className="text-sm font-medium text-gray-900">{c.tier}</p><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${creditStatusCls(c.status)}`}>{c.status}</span></div><div className="flex items-center gap-3 text-xs text-gray-500"><span>${c.used} used / <span className="font-medium text-gray-700">${rem} remaining</span></span><span className="text-gray-300">|</span><span>Expires {c.expiration}</span></div><div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-[200px]"><div className={`h-full rounded-full transition-all ${c.status === 'Fully Used' || c.status === 'Expired' ? 'bg-gray-300' : 'bg-brand'}`} style={{ width: `${pct}%` }} /></div></div>
              {(c.status === 'Active' || c.status === 'Partially Used') && (<button onClick={() => { setReminderSent(c.id); setTimeout(() => setReminderSent(null), 2000); }} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-brand hover:bg-brand-50 border border-gray-200 rounded-[8px] transition-colors shrink-0"><Send className="w-3 h-3" />{reminderSent === c.id ? 'Sent!' : 'Remind'}</button>)}
            </div>); })}</div>)}
      </div>
      <div className="px-5 py-4 space-y-3">
        <div><p className="text-xs text-gray-500 font-medium mb-1.5">Referral Link</p><div className="flex items-center gap-2"><div className="flex-1 flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm text-gray-700 min-w-0"><Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" /><span className="truncate">{referralLink}</span></div><button onClick={() => { navigator.clipboard.writeText(referralLink).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-brand hover:bg-brand-50 border border-gray-200 rounded-[8px] transition-colors shrink-0"><Copy className="w-3.5 h-3.5" />{copied ? 'Copied!' : 'Copy'}</button></div></div>
        <div className="flex items-center justify-between pt-1"><div className="flex items-center gap-2 text-sm text-gray-600"><Users className="w-4 h-4 text-gray-400" /><span><span className="font-semibold text-gray-900">3</span> merchants referred</span></div><button onClick={() => setCardModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-50 border border-brand/20 rounded-[8px] transition-colors"><CreditCard className="w-3.5 h-3.5" />Order Referral Cards</button></div>
      </div>
      {cardModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/30" onClick={() => setCardModalOpen(false)} /><div className="relative bg-white rounded-[8px] shadow-2xl border border-gray-200 p-6 max-w-md w-full mx-4"><div className="flex items-center justify-between mb-5"><div><h3 className="text-lg font-bold text-gray-900">Order Referral Cards</h3><p className="text-xs text-gray-500 mt-0.5">Physical referral cards for {merchantName}</p></div><button onClick={() => setCardModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-[8px]"><X className="w-4 h-4 text-gray-500" /></button></div><div className="space-y-4"><div><label className="text-sm font-medium text-gray-700 block mb-2">Quantity</label><div className="grid grid-cols-4 gap-2">{CARD_QTY_OPTIONS.map(q => (<button key={q} onClick={() => setCardQty(q)} className={`py-2.5 rounded-[8px] text-sm font-medium border transition-colors ${cardQty === q ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-200 hover:border-brand/30'}`}>{q}</button>))}</div></div><div><label className="text-sm font-medium text-gray-700 block mb-2">Ship To</label><div className="grid grid-cols-2 gap-2"><button onClick={() => setShipTo('merchant')} className={`flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-medium border transition-colors ${shipTo === 'merchant' ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-200'}`}><Truck className="w-4 h-4" />Merchant</button><button onClick={() => setShipTo('agent')} className={`flex items-center justify-center gap-2 py-2.5 rounded-[8px] text-sm font-medium border transition-colors ${shipTo === 'agent' ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-200'}`}><Users className="w-4 h-4" />Agent</button></div></div></div><div className="flex items-center gap-3 mt-5"><Button onClick={() => setCardModalOpen(false)} className="flex-1">Submit Order</Button><Button variant="secondary" onClick={() => setCardModalOpen(false)}>Cancel</Button></div></div></div>)}
    </div>
  );
}

/* ─── Outreach template helper ─── */
function OutreachTemplateCard({ name, desc, tplId, onPreview }: { name: string; desc: string; tplId: string; onPreview: (id: string) => void }) {
  return (
    <div className="border border-gray-200 rounded-[8px] p-3 flex items-center justify-between">
      <div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-900">{name}</p><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
      <div className="flex items-center gap-2 ml-3 shrink-0">
        <button onClick={() => onPreview(tplId)} className="text-xs text-brand hover:underline">Preview</button>
        <Button size="sm" icon={<Send />}>Send</Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export function MerchantDetail() {
  const { navigate, currentPage } = useAppNavigate();
  const openTemplateEditor = (tplId: string = 'tpl-001') => navigate(`/templates/${tplId}/${encodeURIComponent(currentPage)}`);

  const urlParts = currentPage.split('/');
  const [activeTab, setActiveTab] = useState(urlParts.length >= 4 ? urlParts[3] : 'overview');
  useEffect(() => { const p = currentPage.split('/'); if (p.length >= 4 && ['website', 'lens', 'outreach'].includes(p[3])) setActiveTab(p[3]); }, [currentPage]);

  /* ── Outreach state ── */
  const [outreachProduct, setOutreachProduct] = useState<'payments' | 'capital' | 'website' | 'lens'>('payments');
  const [ohTypeFilter, setOhTypeFilter] = useState('All');
  const [ohStatusFilter, setOhStatusFilter] = useState('All');
  const [oCTAs, setOCTAs] = useState<Record<string, boolean>>({ cta1: true, cta2: false, cta3: true });

  /* ── Website tab state ── */
  const [wsOhType, setWsOhType] = useState('All');
  const [wsOhStatus, setWsOhStatus] = useState('All');

  /* ── Notes & Tasks ── */
  const [notes, setNotes] = useState([
    { id: 'n1', text: 'Merchant expressed interest in increasing MCA amount at renewal. Follow up in June.', author: 'Sarah Johnson', date: 'Apr 12, 2026' },
    { id: 'n2', text: 'Owner mentioned seasonal dip in Q1 — factor into next underwriting cycle.', author: 'Michael Chen', date: 'Mar 28, 2026' },
  ]);
  const [newNote, setNewNote] = useState('');
  const [tasks, setTasks] = useState([
    { id: 't1', text: 'Call to discuss MCA renewal options', due: 'Apr 20, 2026', done: false },
    { id: 't2', text: 'Send updated rate comparison', due: 'Apr 18, 2026', done: true },
    { id: 't3', text: 'Review Q1 processing volume drop', due: 'Apr 25, 2026', done: false },
  ]);
  const [newTask, setNewTask] = useState('');
  const flags = ['MCA renewal candidate', 'Churn risk — call this week'];

  const merchantProducts = { payments: 'active' as const, capital: 'active' as const, website: 'inactive' as const, lens: 'active' as const };
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'outreach', label: 'Outreach' },
    { id: 'website', label: 'Website', product: 'website' },
    { id: 'lens', label: 'Lens AI', product: 'lens' },
  ];

  /* ── Outreach data per product ── */
  const emailTemplates: Record<string, { name: string; desc: string; tplId: string }[]> = {
    payments: [{ name: 'Processing Rate Review', desc: 'Notify merchant of rate optimization', tplId: 'tpl-001' }, { name: 'Upgrade Plan Offer', desc: 'Promote Growth or Custom plan upgrade', tplId: 'tpl-002' }, { name: 'New Feature Announcement', desc: 'Announce new processing features', tplId: 'tpl-003' }],
    capital: [{ name: 'Capital Pre-Approval Offer', desc: 'Notify of pre-approved funding amount', tplId: 'tpl-007' }, { name: 'MCA Renewal Invitation', desc: 'Invite to renew existing deal early', tplId: 'tpl-008' }, { name: 'Additional Advance Available', desc: 'Offer stacking or additional advance', tplId: 'tpl-008' }],
    website: [{ name: 'Website Introduction', desc: 'Introduce Delt website builder', tplId: 'tpl-011' }, { name: 'Free Consultation', desc: 'Offer a free design consultation', tplId: 'tpl-012' }, { name: 'Competitor Site Analysis', desc: 'Share competitor website analysis', tplId: 'tpl-011' }],
    lens: [{ name: 'Lens AI Introduction', desc: 'Introduce AI-powered insights', tplId: 'tpl-014' }, { name: 'Monthly Insights Report', desc: 'Share AI-generated monthly insights', tplId: 'tpl-015' }, { name: 'New AI Model Available', desc: 'Announce new AI capabilities', tplId: 'tpl-016' }],
  };
  const textTemplates: Record<string, { name: string; desc: string; tplId: string }[]> = {
    payments: [{ name: 'Processing Rate Review', desc: 'SMS about rate review opportunity', tplId: 'tpl-004' }, { name: 'Upgrade Plan Offer', desc: 'Text-based plan upgrade prompt', tplId: 'tpl-005' }, { name: 'New Feature Announcement', desc: 'Quick text about new features', tplId: 'tpl-006' }],
    capital: [{ name: 'Capital Pre-Approval', desc: 'SMS with pre-approved funding details', tplId: 'tpl-009' }, { name: 'MCA Renewal', desc: 'Text-based renewal prompt', tplId: 'tpl-010' }, { name: 'Additional Advance', desc: 'Quick text about additional funding', tplId: 'tpl-010' }],
    website: [{ name: 'Website Introduction', desc: 'Quick SMS about website offering', tplId: 'tpl-013' }, { name: 'Free Consultation', desc: 'Text with booking link', tplId: 'tpl-013' }, { name: 'Competitor Analysis', desc: 'SMS teaser about insights', tplId: 'tpl-013' }],
    lens: [{ name: 'Lens AI Introduction', desc: 'SMS intro to AI insights', tplId: 'tpl-017' }, { name: 'Monthly Insights Ready', desc: 'Text when insights available', tplId: 'tpl-018' }, { name: 'New AI Model', desc: 'Quick text about new capability', tplId: 'tpl-019' }],
  };
  const portalCTAData: Record<string, { key: string; title: string; desc: string; impressions: number; clicks: number }[]> = {
    payments: [{ key: 'cta1', title: 'Rate Review Banner', desc: 'Show rate review CTA on portal', impressions: 245, clicks: 18 }, { key: 'cta2', title: 'Plan Upgrade Prompt', desc: 'Display upgrade prompt after login', impressions: 0, clicks: 0 }, { key: 'cta3', title: 'Referral Program CTA', desc: 'Promote referral rewards', impressions: 312, clicks: 27 }],
    capital: [{ key: 'cta1', title: 'Pre-Approval Banner', desc: 'Show pre-approved capital amount', impressions: 189, clicks: 14 }, { key: 'cta2', title: 'Renewal Countdown', desc: 'Display renewal eligibility', impressions: 0, clicks: 0 }, { key: 'cta3', title: 'Additional Advance CTA', desc: 'Promote stacking option', impressions: 156, clicks: 11 }],
    website: [{ key: 'cta1', title: 'Get a Free Website', desc: 'Show free website CTA', impressions: 52, clicks: 4 }, { key: 'cta2', title: 'Online Presence Score', desc: 'Display presence assessment', impressions: 0, clicks: 0 }, { key: 'cta3', title: 'Website ROI Calculator', desc: 'Interactive ROI calculator', impressions: 38, clicks: 3 }],
    lens: [{ key: 'cta1', title: 'AI Insights Preview', desc: 'Show AI-generated insights', impressions: 92, clicks: 8 }, { key: 'cta2', title: 'Health Score Widget', desc: 'Display Lens health score', impressions: 0, clicks: 0 }, { key: 'cta3', title: 'Revenue Forecast', desc: 'Show predictive forecast', impressions: 67, clicks: 5 }],
  };
  const outreachHistory: Record<string, { date: string; type: string; action: string; template: string; status: string; agent: string }[]> = {
    payments: [{ date: 'Apr 8, 2026', type: 'Email', action: 'Sent', template: 'Processing Rate Review', status: 'Opened', agent: 'Sarah Johnson' }, { date: 'Apr 5, 2026', type: 'Text', action: 'Sent', template: 'Upgrade Plan Offer', status: 'Delivered', agent: 'Sarah Johnson' }, { date: 'Mar 28, 2026', type: 'Portal', action: 'Enabled', template: 'Referral Program CTA', status: 'Clicked', agent: 'System' }, { date: 'Mar 20, 2026', type: 'Email', action: 'Sent', template: 'New Feature Announcement', status: 'Opened', agent: 'Michael Chen' }],
    capital: [{ date: 'Apr 7, 2026', type: 'Email', action: 'Sent', template: 'MCA Renewal Invitation', status: 'Opened', agent: 'Sarah Johnson' }, { date: 'Apr 2, 2026', type: 'Portal', action: 'Enabled', template: 'Pre-Approval Banner', status: 'Clicked', agent: 'System' }, { date: 'Mar 25, 2026', type: 'Text', action: 'Sent', template: 'Additional Advance', status: 'Delivered', agent: 'Sarah Johnson' }, { date: 'Mar 18, 2026', type: 'Email', action: 'Sent', template: 'Capital Pre-Approval', status: 'Opened', agent: 'Michael Chen' }],
    website: [{ date: 'Apr 9, 2026', type: 'Email', action: 'Sent', template: 'Site Performance Report', status: 'Opened', agent: 'Sarah Johnson' }, { date: 'Apr 3, 2026', type: 'Portal', action: 'Enabled', template: 'New Feature Banner', status: 'Clicked', agent: 'System' }, { date: 'Mar 27, 2026', type: 'Text', action: 'Sent', template: 'SEO Tips', status: 'Delivered', agent: 'Sarah Johnson' }],
    lens: [{ date: 'Apr 10, 2026', type: 'Email', action: 'Sent', template: 'Monthly Insights Report', status: 'Opened', agent: 'Sarah Johnson' }, { date: 'Apr 4, 2026', type: 'Portal', action: 'Enabled', template: 'AI Insights Preview', status: 'Clicked', agent: 'System' }, { date: 'Mar 22, 2026', type: 'Text', action: 'Sent', template: 'New AI Model Available', status: 'Delivered', agent: 'Sarah Johnson' }],
  };

  return (
    <div className="min-h-full bg-canvas">
      {/* ═══ HEADER ═══ */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <button onClick={() => navigate('/merchants')} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"><ArrowLeft className="w-4 h-4" />Back to Merchants</button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Sunrise Cafe & Bakery</h1>
                <span className="px-3 py-1 bg-brand-50 text-brand-hover text-sm font-medium rounded-full">Food & Beverage</span>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-full">Active</span>
                {/* Cross-Product Risk Badge */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium rounded-full"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" />Yellow Risk</span>
              </div>
              <p className="text-sm text-gray-600">Assigned to: <span className="font-medium text-gray-900">Sarah Johnson</span></p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" icon={<Edit />}>Edit</Button>
              <Button icon={<Plus />}>New MCA Application</Button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <StatCard label="Monthly Volume" value="$37,500" trend={{ value: "12.5%", isPositive: true }} subtitle="vs. last month" />
          <StatCard label="Active MCA Balance" value="$187,500" subtitle="Across 2 deals" />
          <HealthScoreCard score={78} />
          <StatCard label="Plan Tier" value="Growth" subtitle="Premium features" />
          <StatCard label="Chargeback Rate" value="0.4%" trend={{ value: "0.1%", isPositive: false }} subtitle="Industry avg: 0.6%" />
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-3 mb-6">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            const ps = tab.product ? merchantProducts[tab.product as keyof typeof merchantProducts] : null;
            const isInactive = ps === 'inactive';
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-5 py-2 text-sm font-medium rounded-full border-2 transition-all flex items-center gap-2 ${isActive ? 'bg-brand/10 text-brand border-brand' : isInactive ? 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:border-gray-300' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}>{tab.label}{tab.product && <span className={`w-2 h-2 rounded-full ${isInactive ? 'bg-gray-300' : 'bg-emerald-400'}`} />}</button>);
          })}
        </div>

        {/* ═══ OVERVIEW TAB ═══ */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Business Information */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Business Information</h2></div>
                <div className="px-5 py-2"><div className="grid grid-cols-2 gap-x-6">
                  <InfoField label="Legal Business Name" value="Sunrise Cafe & Bakery LLC" /><InfoField label="DBA Name" value="Sunrise Cafe" /><InfoField label="EIN" value="**-***9876" /><InfoField label="SOS Status" value="Active - Good Standing" /><InfoField label="Industry" value="Food & Beverage / Restaurant" /><InfoField label="Years in Business" value="5.2 years" /><InfoField label="Owner Name" value="Michael Roberts" /><InfoField label="Owner Contact" value="michael@sunrisecafe.com" />
                </div></div>
              </div>

              {/* Document Vault */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-gray-900">Document Vault</h2><p className="text-xs text-gray-500 mt-1">9 documents</p></div><button className="text-sm text-brand hover:text-brand-hover font-medium">View All</button></div>
                <div className="px-5 py-4">
                  <DocumentItem name="MCA Agreement - 2024-0847.pdf" type="Agreement" date="Jan 15, 2026" />
                  <DocumentItem name="Bank Statements - Oct 2025.pdf" type="Bank Statement" date="Nov 3, 2025" />
                  <DocumentItem name="UCC-1 Filing.pdf" type="Legal" date="Jan 18, 2026" />
                  <DocumentItem name="Business Tax Returns 2025.pdf" type="Tax Document" date="Dec 20, 2025" />
                </div>
              </div>

              {/* ── Relationship Notes & Tasks ── */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200"><div className="flex items-center gap-2"><StickyNote className="w-4 h-4 text-brand" /><h2 className="text-lg font-semibold text-gray-900">Notes & Tasks</h2></div></div>
                <div className="px-5 py-4 space-y-4">
                  {flags.length > 0 && <div className="flex flex-wrap gap-2">{flags.map((f, i) => <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium rounded-full"><Flag className="w-3 h-3" />{f}</span>)}</div>}
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Tasks</p>
                    <div className="space-y-2">{tasks.map(t => (
                      <div key={t.id} className="flex items-start gap-2.5 group">
                        <button onClick={() => setTasks(p => p.map(x => x.id === t.id ? { ...x, done: !x.done } : x))} className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${t.done ? 'bg-brand border-brand' : 'border-gray-300 hover:border-brand'}`}>{t.done && <CheckCircle className="w-3 h-3 text-white" />}</button>
                        <div className="flex-1 min-w-0"><p className={`text-sm ${t.done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.text}</p><div className="flex items-center gap-1.5 mt-0.5"><Calendar className="w-3 h-3 text-gray-400" /><span className="text-xs text-gray-400">{t.due}</span></div></div>
                        <button onClick={() => setTasks(p => p.filter(x => x.id !== t.id))} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded transition-all"><Trash2 className="w-3 h-3 text-gray-400" /></button>
                      </div>
                    ))}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="text" value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newTask.trim()) { setTasks(p => [...p, { id: `t-${Date.now()}`, text: newTask.trim(), due: 'Set date...', done: false }]); setNewTask(''); } }} placeholder="Add a task..." className="flex-1 text-sm border border-gray-200 rounded-[8px] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-gray-400" />
                      <Button size="sm" onClick={() => { if (newTask.trim()) { setTasks(p => [...p, { id: `t-${Date.now()}`, text: newTask.trim(), due: 'Set date...', done: false }]); setNewTask(''); } }}>Add</Button>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-2">Notes</p>
                    <div className="space-y-3">{notes.map(n => (
                      <div key={n.id} className="bg-gray-50 rounded-[8px] px-3 py-2.5 group relative">
                        <p className="text-sm text-gray-800">{n.text}</p>
                        <div className="flex items-center gap-2 mt-1.5"><span className="text-xs text-gray-400">{n.author}</span><span className="text-xs text-gray-300">&bull;</span><span className="text-xs text-gray-400">{n.date}</span></div>
                        <button onClick={() => setNotes(p => p.filter(x => x.id !== n.id))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all"><Trash2 className="w-3 h-3 text-gray-400" /></button>
                      </div>
                    ))}</div>
                    <div className="flex items-start gap-2 mt-2">
                      <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note..." rows={2} className="flex-1 text-sm border border-gray-200 rounded-[8px] px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand placeholder:text-gray-400 resize-none" />
                      <Button size="sm" onClick={() => { if (newNote.trim()) { setNotes(p => [{ id: `n-${Date.now()}`, text: newNote.trim(), author: 'You', date: 'Just now' }, ...p]); setNewNote(''); } }}>Add</Button>
                    </div>
                  </div>
                </div>
              </div>

              <BundlesAndReferralsCard merchantName="Sunrise Cafe" merchantId="MER-0847" />
            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cross-Product Risk Assessment */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" /><h3 className="text-sm font-semibold text-gray-700">Cross-Product Risk</h3></div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-full"><span className="w-2 h-2 rounded-full bg-amber-400" />Yellow</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-[8px] px-3 py-2"><p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Payments Risk</p><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-sm font-semibold text-emerald-700">Green</span></div><p className="text-xs text-gray-500 mt-1">CB rate 0.4% &bull; Volume stable</p></div>
                    <div className="bg-amber-50/50 border border-amber-100 rounded-[8px] px-3 py-2"><p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold mb-1">Capital Risk</p><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-sm font-semibold text-amber-700">Yellow</span></div><p className="text-xs text-gray-500 mt-1">2 NSF retries &bull; No stacking</p></div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 rounded-[8px] px-3 py-2">
                    <p className="font-medium text-gray-700 mb-1">Risk Factors</p>
                    <ul className="space-y-0.5">
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-400" />2 NSF retry events in last 30 days</li>
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400" />Payment velocity within normal range</li>
                      <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400" />No stacking detected</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Product Adoption Timeline */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3 border-b border-gray-200"><h3 className="text-sm font-semibold text-gray-700">Product Adoption</h3></div>
                <div className="px-5 py-4">
                  {[{ product: 'Payments', date: 'Aug 2025', icon: <CreditCard className="w-3.5 h-3.5" />, color: 'bg-brand', active: true }, { product: 'Website', date: 'Sep 2025', icon: <Globe className="w-3.5 h-3.5" />, color: 'bg-sky-500', active: false }, { product: 'Lens AI', date: 'Nov 2025', icon: <Brain className="w-3.5 h-3.5" />, color: 'bg-purple-500', active: true }, { product: 'First MCA', date: 'Jan 2026', icon: <Banknote className="w-3.5 h-3.5" />, color: 'bg-emerald-500', active: true }].map((item, i, arr) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 ${item.active ? item.color : 'bg-gray-300'}`}>{item.icon}</div>
                        {i < arr.length - 1 && <div className="w-px h-8 mt-1 bg-gray-200" />}
                      </div>
                      <div className="pt-0.5 pb-4"><div className="flex items-center gap-2"><p className={`text-sm font-medium ${item.active ? 'text-gray-900' : 'text-gray-400'}`}>{item.product}</p>{!item.active && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded">Inactive</span>}</div><p className="text-xs text-gray-500">{item.date}</p></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments Snapshot */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand" /><h3 className="text-sm font-semibold text-gray-700">Payments Snapshot</h3></div><button onClick={() => navigate('/residuals')} className="text-xs text-brand hover:underline underline-offset-2 font-medium flex items-center gap-1">Full Residuals <ExternalLink className="w-3 h-3" /></button></div>
                <div className="px-5 py-4"><div className="grid grid-cols-2 gap-4 mb-3"><div><p className="text-xs text-gray-500 mb-0.5">Monthly Volume</p><p className="text-lg font-bold text-gray-900">$37,500</p></div><div><p className="text-xs text-gray-500 mb-0.5">Net Revenue (MTD)</p><p className="text-lg font-bold text-gray-900">$795.00</p></div></div><div className="grid grid-cols-3 gap-3 text-center"><div className="bg-gray-50 rounded-[8px] px-2 py-2"><p className="text-xs text-gray-500">Avg Ticket</p><p className="text-sm font-semibold text-gray-900">$52.40</p></div><div className="bg-gray-50 rounded-[8px] px-2 py-2"><p className="text-xs text-gray-500">Transactions</p><p className="text-sm font-semibold text-gray-900">715</p></div><div className="bg-gray-50 rounded-[8px] px-2 py-2"><p className="text-xs text-gray-500">Refund Rate</p><p className="text-sm font-semibold text-gray-900">1.2%</p></div></div></div>
              </div>

              {/* Capital Snapshot */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between"><div className="flex items-center gap-2"><Banknote className="w-4 h-4 text-brand" /><h3 className="text-sm font-semibold text-gray-700">Capital Snapshot</h3></div><button onClick={() => navigate('/capital')} className="text-xs text-brand hover:underline underline-offset-2 font-medium flex items-center gap-1">Full Capital <ExternalLink className="w-3 h-3" /></button></div>
                <div className="px-5 py-4"><div className="grid grid-cols-2 gap-4 mb-3"><div><p className="text-xs text-gray-500 mb-0.5">Active Balance</p><p className="text-lg font-bold text-gray-900">$187,500</p></div><div><p className="text-xs text-gray-500 mb-0.5">Active Deals</p><p className="text-lg font-bold text-gray-900">2</p></div></div><div className="space-y-2">{[{ id: 'MCA-2024-0847', pct: 42.8 }, { id: 'MCA-2024-0723', pct: 10.4 }].map(d => (<div key={d.id} className="flex items-center gap-2"><span className="text-xs text-gray-500 w-28 shrink-0">{d.id}</span><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.pct}%` }} /></div><span className="text-xs font-medium text-gray-700 w-10 text-right">{d.pct}%</span></div>))}</div></div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white rounded-[8px] border border-gray-200">
                <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2></div>
                <div className="px-5 py-4">
                  <TimelineItem icon={<FileCheck className="w-4 h-4 text-brand" />} title="MCA Agreement Signed" description="Deal MCA-2024-0847 agreement executed" user="Sarah Johnson" timestamp="2 hours ago" />
                  <TimelineItem icon={<FileText className="w-4 h-4 text-brand" />} title="Bank Statements Uploaded" description="6 months of statements received" user="System" timestamp="5 hours ago" />
                  <TimelineItem icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} title="Payment Received" description="Daily payment of $785 processed" user="System" timestamp="1 day ago" />
                  <TimelineItem icon={<Edit className="w-4 h-4 text-brand" />} title="Merchant Info Updated" description="Contact information modified" user="Michael Chen" timestamp="2 days ago" />
                  <TimelineItem icon={<FileCheck className="w-4 h-4 text-emerald-600" />} title="Merchant Onboarded" description="Account setup completed" user="System" timestamp="3 months ago" isLast />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ OUTREACH TAB ═══ */}
        {activeTab === 'outreach' && (
          <div className="space-y-6">
            {/* Product Toggle */}
            <div className="flex items-center gap-2">
              {([{ id: 'payments' as const, label: 'Payments', icon: <CreditCard className="w-3.5 h-3.5" /> }, { id: 'capital' as const, label: 'Capital', icon: <Banknote className="w-3.5 h-3.5" /> }, { id: 'website' as const, label: 'Website', icon: <Globe className="w-3.5 h-3.5" /> }, { id: 'lens' as const, label: 'Lens AI', icon: <Brain className="w-3.5 h-3.5" /> }]).map(p => (
                <button key={p.id} onClick={() => setOutreachProduct(p.id)} className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-[8px] border transition-all ${outreachProduct === p.id ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{p.icon}{p.label}</button>
              ))}
            </div>

            {/* Link to dedicated Outreach page */}
            <div className="bg-gradient-to-r from-brand-50 to-purple-50 rounded-[8px] border border-brand-200 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="w-5 h-5 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Send outreach, manage templates & campaigns</p>
                  <p className="text-xs text-gray-500 mt-0.5">Use the dedicated Outreach page for bulk sends, automation rules, and template management</p>
                </div>
              </div>
              <Button onClick={() => navigate('/outreach')} icon={<Send />} className="shrink-0">Go to Outreach</Button>
            </div>

            {/* Outreach History */}
            <div className="bg-white rounded-[8px] border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <div><h2 className="text-lg font-semibold text-gray-900">Outreach History</h2><p className="text-xs text-gray-500 mt-1">All {outreachProduct} communications</p></div>
                <div className="flex items-center gap-2">
                  <div className="relative"><select value={ohTypeFilter} onChange={e => setOhTypeFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-gray-200 rounded-[8px] bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="All">All Types</option><option value="Email">Email</option><option value="Text">Text</option><option value="Portal">Portal</option></select><ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" /></div>
                  <div className="relative"><select value={ohStatusFilter} onChange={e => setOhStatusFilter(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 text-xs font-medium border border-gray-200 rounded-[8px] bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"><option value="All">All Statuses</option><option value="Delivered">Delivered</option><option value="Opened">Opened</option><option value="Clicked">Clicked</option><option value="Bounced">Bounced</option></select><ChevronDown className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" /></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200"><tr>{['Date','Type','Action','Template / CTA','Status','Agent'].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {(outreachHistory[outreachProduct] || []).filter(r => ohTypeFilter === 'All' || r.type === ohTypeFilter).filter(r => ohStatusFilter === 'All' || r.status === ohStatusFilter).map((r, i) => {
                      const tb = r.type === 'Email' ? 'bg-blue-50 text-blue-700' : r.type === 'Text' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700';
                      const sc = r.status === 'Opened' ? 'text-emerald-700' : r.status === 'Clicked' ? 'text-brand-hover' : r.status === 'Bounced' ? 'text-red-600' : 'text-gray-600';
                      return (<tr key={i} className="hover:bg-gray-50 transition-colors"><td className="px-5 py-3 text-sm text-gray-900">{r.date}</td><td className="px-5 py-3"><span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tb}`}>{r.type}</span></td><td className="px-5 py-3 text-sm text-gray-600">{r.action}</td><td className="px-5 py-3 text-sm font-medium text-gray-900">{r.template}</td><td className="px-5 py-3"><span className={`text-sm font-medium ${sc}`}>{r.status}</span></td><td className="px-5 py-3 text-sm text-gray-600">{r.agent}</td></tr>);
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ WEBSITE TAB ═══ */}
        {activeTab === 'website' && (
          <div className="space-y-6">
            {merchantProducts.website === 'inactive' ? (
              <>
                <div className="bg-white rounded-[8px] border border-gray-200">
                  <div className="px-5 py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><Globe className="w-8 h-8 text-gray-300" /></div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Website Not Active</h3>
                    <p className="text-sm text-gray-500 mb-5 max-w-sm">This merchant hasn't activated a website yet.</p>
                    <button className="px-5 py-2.5 bg-info text-white text-sm font-medium rounded-[8px] hover:bg-info-hover transition-colors">Send Website Offer</button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-[8px] border border-gray-200 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500"><Megaphone className="w-4 h-4 text-gray-400" />Send outreach to convert this merchant</div>
                  <button onClick={() => { setActiveTab('outreach'); setOutreachProduct('website'); }} className="text-xs text-brand hover:underline font-medium flex items-center gap-1">Go to Outreach <ExternalLink className="w-3 h-3" /></button>
                </div>
              </>
            ) : (
              <>
                {/* Site Overview */}
                <div className="bg-white rounded-[8px] border border-gray-200">
                  <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Site Overview</h2></div>
                  <div className="px-5 py-4">
                    <div className="w-full max-w-[400px] h-[240px] bg-gradient-to-br from-sky-50 to-blue-100 rounded-[8px] border border-gray-200 mb-4 flex items-center justify-center"><div className="text-center"><Globe className="w-10 h-10 text-sky-300 mx-auto mb-2" /><p className="text-xs text-sky-400 font-medium">Live Site Preview</p><p className="text-[10px] text-sky-300 mt-0.5">sunrisecafe.com</p></div></div>
                    <a href="https://www.sunrisecafe.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-info hover:underline underline-offset-2 mb-4">www.sunrisecafe.com <ExternalLink className="w-3.5 h-3.5" /></a>
                    <div className="grid grid-cols-3 gap-6 mb-5 pt-4 border-t border-gray-100"><div><p className="text-xs text-gray-500 mb-0.5">Last Updated</p><p className="text-sm font-semibold text-gray-900">Apr 6, 2026</p></div><div><p className="text-xs text-gray-500 mb-0.5">Page Views (30d)</p><p className="text-sm font-semibold text-gray-900">2,847</p></div><div><p className="text-xs text-gray-500 mb-0.5">Unique Visitors (30d)</p><p className="text-sm font-semibold text-gray-900">1,203</p></div></div>
                    <div className="flex items-center gap-3"><a href="#" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-50 transition-colors flex items-center gap-2"><Edit className="w-4 h-4" />Edit Website</a><a href="https://www.sunrisecafe.com" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[8px] hover:bg-gray-50 transition-colors flex items-center gap-2"><ExternalLink className="w-4 h-4" />View Live Site</a></div>
                  </div>
                </div>

                {/* Site Performance */}
                <div className="bg-white rounded-[8px] border border-gray-200">
                  <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Site Performance</h2><p className="text-xs text-gray-500 mt-1">Core web vitals and traffic</p></div>
                  <div className="px-5 py-4">
                    <div className="grid grid-cols-3 gap-6 mb-6">
                      <div className="bg-gray-50 rounded-[8px] p-4"><div className="flex items-center gap-2 mb-2"><Gauge className="w-4 h-4 text-gray-400" /><p className="text-xs text-gray-500">Page Load Time</p></div><p className="text-xl font-bold text-gray-900">1.8s</p><p className="text-xs text-emerald-600 mt-1">Good</p></div>
                      <div className="bg-gray-50 rounded-[8px] p-4"><div className="flex items-center gap-2 mb-2"><Smartphone className="w-4 h-4 text-gray-400" /><p className="text-xs text-gray-500">Mobile Score</p></div><p className="text-xl font-bold text-gray-900">92/100</p><p className="text-xs text-emerald-600 mt-1">Excellent</p></div>
                      <div className="bg-gray-50 rounded-[8px] p-4"><div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-gray-400" /><p className="text-xs text-gray-500">Uptime</p></div><p className="text-xl font-bold text-gray-900">99.97%</p><p className="text-xs text-emerald-600 mt-1">Last 30 days</p></div>
                    </div>
                    <div><p className="text-xs text-gray-500 mb-2">Visitor Trend (Last 30 Days)</p><div className="flex items-end gap-[3px] h-16">{[45,52,48,60,55,70,65,80,75,82,78,90,85,95,88,92,86,98,94,100,96,88,92,85,90,95,88,92,96,100].map((v, i) => <div key={i} className="flex-1 bg-sky-200 rounded-t hover:bg-sky-300 transition-colors" style={{ height: `${v}%` }} />)}</div></div>
                  </div>
                </div>

                {/* Outreach link */}
                <div className="bg-gray-50 rounded-[8px] border border-gray-200 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500"><Megaphone className="w-4 h-4 text-gray-400" />Manage website outreach and communications</div>
                  <button onClick={() => { setActiveTab('outreach'); setOutreachProduct('website'); }} className="text-xs text-brand hover:underline font-medium flex items-center gap-1">Go to Outreach <ExternalLink className="w-3 h-3" /></button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══ LENS AI TAB ═══ */}
        {activeTab === 'lens' && (
          <div className="space-y-6">
            {merchantProducts.lens === 'inactive' ? (
              <div className="bg-white rounded-[8px] border border-gray-200"><div className="py-16 flex flex-col items-center justify-center text-center px-6"><div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center mb-4"><Brain className="w-7 h-7 text-purple-400" /></div><h3 className="text-lg font-semibold text-gray-900 mb-1">Lens AI Not Active</h3><p className="text-sm text-gray-500 mb-5 max-w-sm">Activate to unlock AI-powered insights.</p><Button size="lg">Activate Lens AI</Button></div></div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-[8px] border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-medium">API Calls (MTD)</span><Zap className="w-4 h-4 text-purple-500" /></div><p className="text-xl font-bold text-gray-900">12,847</p><p className="text-xs text-emerald-600 mt-1">+18.3% vs last month</p></div>
                  <div className="bg-white rounded-[8px] border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-medium">Avg Response Time</span><Activity className="w-4 h-4 text-blue-500" /></div><p className="text-xl font-bold text-gray-900">142ms</p><p className="text-xs text-emerald-600 mt-1">-12ms from last month</p></div>
                  <div className="bg-white rounded-[8px] border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-medium">Success Rate</span><Shield className="w-4 h-4 text-emerald-500" /></div><p className="text-xl font-bold text-gray-900">99.7%</p><p className="text-xs text-gray-400 mt-1">3 failed in last 30 days</p></div>
                  <div className="bg-white rounded-[8px] border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><span className="text-xs text-gray-500 font-medium">Monthly Cost</span><BarChart3 className="w-4 h-4 text-amber-500" /></div><p className="text-xl font-bold text-gray-900">$64.24</p><p className="text-xs text-amber-600 mt-1">$0.005/call avg</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-[8px] border border-gray-200">
                      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between"><h2 className="text-sm font-semibold text-gray-900">API Usage (Last 30 Days)</h2><select className="text-xs border border-gray-200 rounded-[8px] px-2 py-1 text-gray-600"><option>Daily</option><option>Weekly</option></select></div>
                      <div className="px-5 py-4"><div className="flex items-end gap-1 h-32">{[320,410,380,520,470,390,610,580,430,510,620,540,490,680,420,530,470,560,640,510,450,580,620,490,530,610,550,480,570,630].map((v, i) => <div key={i} className="flex-1 bg-purple-200 hover:bg-purple-400 rounded-t transition-colors cursor-pointer" style={{ height: `${(v / 680) * 100}%` }} title={`Day ${i + 1}: ${v} calls`} />)}</div><div className="flex justify-between mt-2"><span className="text-[10px] text-gray-400">Mar 11</span><span className="text-[10px] text-gray-400">Mar 21</span><span className="text-[10px] text-gray-400">Mar 31</span><span className="text-[10px] text-gray-400">Apr 10</span></div></div>
                    </div>
                    <div className="bg-white rounded-[8px] border border-gray-200">
                      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between"><h2 className="text-sm font-semibold text-gray-900">Recent API Calls</h2><button className="text-xs text-brand font-medium hover:underline">View All</button></div>
                      <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Timestamp</th><th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Endpoint</th><th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Status</th><th className="px-5 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Latency</th></tr></thead><tbody className="divide-y divide-gray-100">{[{ time: 'Apr 10, 2:14 PM', endpoint: '/v1/insights/revenue', status: 200, latency: '128ms' },{ time: 'Apr 10, 2:12 PM', endpoint: '/v1/predict/churn', status: 200, latency: '156ms' },{ time: 'Apr 10, 1:58 PM', endpoint: '/v1/analyze/transactions', status: 200, latency: '203ms' },{ time: 'Apr 10, 1:30 PM', endpoint: '/v1/score/health', status: 500, latency: '2,104ms' }].map((r, i) => (<tr key={i} className="hover:bg-gray-50/50"><td className="px-5 py-2.5 text-sm text-gray-600">{r.time}</td><td className="px-5 py-2.5"><code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">{r.endpoint}</code></td><td className="px-5 py-2.5"><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${r.status === 200 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{r.status}</span></td><td className={`px-5 py-2.5 text-sm tabular-nums ${r.latency.includes('2,') ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{r.latency}</td></tr>))}</tbody></table></div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[8px] border border-gray-200">
                      <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-sm font-semibold text-gray-900">AI Models Enabled</h2></div>
                      <div className="px-5 py-3 space-y-3">{[{ name: 'Revenue Insights', desc: 'Revenue forecasting', active: true },{ name: 'Churn Prediction', desc: 'Churn risk scoring', active: true },{ name: 'Transaction Analysis', desc: 'Anomaly detection', active: true },{ name: 'Health Scoring', desc: 'Business assessment', active: true },{ name: 'Cash Flow Forecast', desc: 'Predictive modeling', active: false }].map((m, i) => (<div key={i} className="flex items-center justify-between py-1"><div><p className="text-sm font-medium text-gray-900">{m.name}</p><p className="text-xs text-gray-400">{m.desc}</p></div><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${m.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{m.active ? 'Active' : 'Inactive'}</span></div>))}</div>
                    </div>
                    <div className="bg-white rounded-[8px] border border-gray-200">
                      <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-sm font-semibold text-gray-900">API Configuration</h2></div>
                      <div className="px-5 py-4 space-y-4">
                        <div><label className="text-xs text-gray-500 font-medium block mb-1">API Key</label><div className="flex items-center gap-2"><code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-[8px] px-3 py-2 font-mono text-gray-600 truncate">sk-lens-****************************a7f2</code><button className="px-2.5 py-2 bg-gray-100 text-gray-600 rounded-[8px] hover:bg-gray-200 transition-colors"><Key className="w-3.5 h-3.5" /></button></div></div>
                        <div><label className="text-xs text-gray-500 font-medium block mb-1">Webhook URL</label><code className="block text-xs bg-gray-50 border border-gray-200 rounded-[8px] px-3 py-2 font-mono text-gray-600 truncate">https://api.deltpay.com/webhooks/lens/mc-001</code></div>
                        <div className="grid grid-cols-2 gap-3"><div><label className="text-xs text-gray-500 font-medium block mb-1">Rate Limit</label><p className="text-sm font-medium text-gray-900">1,000/min</p></div><div><label className="text-xs text-gray-500 font-medium block mb-1">Plan Quota</label><p className="text-sm font-medium text-gray-900">50,000/mo</p></div></div>
                        <div><label className="text-xs text-gray-500 font-medium block mb-1">Usage This Month</label><div className="flex items-center gap-3"><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-purple-500 rounded-full" style={{ width: '25.7%' }} /></div><span className="text-xs text-gray-600 font-medium">12,847 / 50,000</span></div></div>
                      </div>
                    </div>
                    <div className="bg-white rounded-[8px] border border-gray-200">
                      <div className="px-5 py-4 border-b border-gray-200"><h2 className="text-sm font-semibold text-gray-900">Billing Summary</h2></div>
                      <div className="px-5 py-3 space-y-2">{[{ label: 'Base Plan (Custom)', amount: '$49.00' },{ label: 'API Overage (0 calls)', amount: '$0.00' },{ label: 'Premium Models (2)', amount: '$15.24' }].map((item, i) => (<div key={i} className="flex items-center justify-between py-1"><span className="text-sm text-gray-600">{item.label}</span><span className="text-sm font-medium text-gray-900">{item.amount}</span></div>))}<div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between"><span className="text-sm font-semibold text-gray-900">Total</span><span className="text-sm font-bold text-gray-900">$64.24</span></div></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
