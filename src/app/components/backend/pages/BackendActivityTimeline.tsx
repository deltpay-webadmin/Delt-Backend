import React, { useState, useMemo } from 'react';
import {
  Clock, Phone, Mail, MessageSquare, FileText, DollarSign,
  AlertTriangle, CheckCircle, XCircle, ChevronRight, Search,
  Filter, User, Store, ArrowRight, Zap, Shield, CreditCard,
  Send, Edit3, Plus, X, ChevronDown, Activity, Eye,
  Banknote, RefreshCw, GitBranch, Heart, Calendar,
} from 'lucide-react';
import { Button, Tabs } from '../ui';

// ── Types ──
type ActivityType = 'call' | 'email' | 'sms' | 'note' | 'status_change' | 'deal' | 'payment' | 'task' | 'document' | 'alert' | 'system';

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityType;
  title: string;
  description: string;
  user: string;
  merchant?: string;
  merchantId?: string;
  dealId?: string;
  metadata?: Record<string, string>;
}

const TYPE_CONFIG: Record<ActivityType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  call: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Call' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Email' },
  sms: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'SMS' },
  note: { icon: Edit3, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Note' },
  status_change: { icon: GitBranch, color: 'text-brand', bg: 'bg-brand-50 border-brand-200', label: 'Status' },
  deal: { icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', label: 'Deal' },
  payment: { icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Payment' },
  task: { icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Task' },
  document: { icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200', label: 'Document' },
  alert: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Alert' },
  system: { icon: Zap, color: 'text-gray-400', bg: 'bg-gray-50 border-gray-100', label: 'System' },
};

// ── Mock Data ──
const ACTIVITIES: ActivityEvent[] = [
  { id: 'a1', timestamp: '2026-04-17 09:42', type: 'alert', title: 'VAMP threshold warning — Coral Reef Auto Spa', description: 'Fraud-to-sales at 0.82%, approaching 0.9% trigger. Remediation plan required.', user: 'System', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004' },
  { id: 'a2', timestamp: '2026-04-17 09:15', type: 'call', title: 'Outbound call — Richmond Auto Detailing', description: 'Discussed VA 3-day review period. Merchant understands cannot fund before Apr 22. Confirmed receipt of disclosure package.', user: 'Marcus Johnson', merchant: 'Richmond Auto Detailing', merchantId: 'M-1003', dealId: 'DL-2026-0416', metadata: { duration: '8m 32s', outcome: 'Connected', disposition: 'Follow-up scheduled' } },
  { id: 'a3', timestamp: '2026-04-17 08:55', type: 'document', title: 'VA disclosure package generated', description: 'VA HB 1027 disclosure generated with all 9 required items. 3-business-day review period initiated.', user: 'System', merchant: 'Richmond Auto Detailing', merchantId: 'M-1003', dealId: 'DL-2026-0416' },
  { id: 'a4', timestamp: '2026-04-16 16:30', type: 'status_change', title: 'Lead → Underwriting', description: 'Brooklyn Vinyl Records moved from Lead to Underwriting stage. Application complete, bank statements uploaded.', user: 'Sarah Kim', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002' },
  { id: 'a5', timestamp: '2026-04-16 15:10', type: 'email', title: 'Disclosure email sent — Brooklyn Vinyl Records', description: 'NY CFDL disclosure package sent to david@brooklynvinyl.com. Awaiting acknowledgment.', user: 'Sarah Kim', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415', metadata: { to: 'david@brooklynvinyl.com', template: 'NY CFDL Disclosure', status: 'Delivered' } },
  { id: 'a6', timestamp: '2026-04-16 14:20', type: 'note', title: 'Underwriting note — Brooklyn Vinyl Records', description: 'DataMerch flagged 1 existing position: Rapid Capital $28k. Need to review stacking risk before proceeding. Owner seems cooperative, provided all docs quickly.', user: 'Sarah Kim', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002', dealId: 'DL-2026-0415' },
  { id: 'a7', timestamp: '2026-04-16 10:05', type: 'system', title: 'KYC verification complete — Brooklyn Vinyl Records', description: 'Plaid IDV complete. EIN confirmed. OFAC clear. MATCH clear.', user: 'System', merchant: 'Brooklyn Vinyl Records', merchantId: 'M-1002' },
  { id: 'a8', timestamp: '2026-04-15 11:30', type: 'payment', title: 'ACH collection — Havana Bites Cafe', description: 'Daily ACH debit $145.00 collected successfully. Running total: $17,820 of $24,300.', user: 'System', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', metadata: { amount: '$145.00', status: 'Success', method: 'ACH' } },
  { id: 'a9', timestamp: '2026-04-15 09:00', type: 'deal', title: 'Renewal offer generated — Havana Bites Cafe', description: 'Merchant has repaid 73% ($17,820 of $24,300). Auto-generated renewal offer: $50K at 1.36x.', user: 'System', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', metadata: { offer_amount: '$50,000', factor: '1.36', payoff: '$6,480' } },
  { id: 'a10', timestamp: '2026-04-14 16:45', type: 'call', title: 'Inbound call — Midtown Taqueria', description: 'Owner called asking about chargeback on Mar 28 transaction. Explained dispute process and timeline. Will follow up with documentation request.', user: 'Marcus Johnson', merchant: 'Midtown Taqueria', merchantId: 'M-1005', metadata: { duration: '12m 05s', outcome: 'Connected', disposition: 'Action required' } },
  { id: 'a11', timestamp: '2026-04-14 14:00', type: 'deal', title: 'Deal funded — Havana Bites Cafe', description: 'DL-2026-0412 funded. $45,000 at 1.38x. Daily ACH $145. FL — no disclosure required.', user: 'Marcus Johnson', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412', metadata: { amount: '$45,000', factor: '1.38', daily_ach: '$145' } },
  { id: 'a12', timestamp: '2026-04-14 10:30', type: 'sms', title: 'SMS sent — Havana Bites Cafe', description: 'Funding confirmation SMS sent to (305) 555-0142. "Your funding of $45,000 has been deposited. Daily payments of $145 begin tomorrow."', user: 'System', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', metadata: { to: '(305) 555-0142', status: 'Delivered' } },
  { id: 'a13', timestamp: '2026-04-14 09:12', type: 'system', title: 'Contract health assessment — Havana Bites Cafe', description: '6/6 factors assessed: Defensible. Reconciliation genuine, no fixed term, business failure risk borne by funder.', user: 'System', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', dealId: 'DL-2026-0412' },
  { id: 'a14', timestamp: '2026-04-13 15:00', type: 'alert', title: 'NSF — Little Havana Barbershop', description: '3rd consecutive NSF on daily ACH ($68). Status changed to Slow Pay. Collection workflow initiated.', user: 'System', merchant: 'Little Havana Barbershop', metadata: { amount: '$68', nsf_count: '3', new_status: 'Slow Pay' } },
  { id: 'a15', timestamp: '2026-04-13 11:20', type: 'task', title: 'Task completed — PCI SAQ follow-up', description: 'Completed PCI SAQ reminder follow-up for Midtown Taqueria. Merchant confirmed scan scheduled for Mar 15.', user: 'Sarah Kim', merchant: 'Midtown Taqueria', merchantId: 'M-1005' },
  { id: 'a16', timestamp: '2026-04-12 14:00', type: 'email', title: 'Renewal offer email — Havana Bites Cafe', description: 'Sent renewal pre-qualification email. Merchant at 65% repaid, approaching eligibility.', user: 'Marcus Johnson', merchant: 'Havana Bites Cafe', merchantId: 'M-1001', metadata: { to: 'maria@havanabites.com', template: 'Renewal Pre-Qual', status: 'Opened' } },
  { id: 'a17', timestamp: '2026-04-11 10:00', type: 'status_change', title: 'Health score dropped — Coral Reef Auto Spa', description: 'Health score decreased from 88 to 82. Triggered by rising chargeback rate (VAMP proximity) and expired ASV scan.', user: 'System', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004' },
  { id: 'a18', timestamp: '2026-04-10 09:30', type: 'note', title: 'Agent note — Coral Reef Auto Spa', description: 'Spoke with owner re: chargeback issue. 3 recent CBs are from a single card-not-present customer. Recommended enabling 3DS for online bookings. Owner will discuss with web developer.', user: 'James Miller', merchant: 'Coral Reef Auto Spa', merchantId: 'M-1004' },
  { id: 'a19', timestamp: '2026-04-09 16:00', type: 'document', title: 'Contract signed — SoBe Cycle & Fitness', description: 'MCA agreement executed via e-sign. UCC-1 filed with FL Secretary of State.', user: 'System', merchant: 'SoBe Cycle & Fitness', metadata: { doc_type: 'MCA Agreement', signer: 'Carlos Mendez', ucc: 'Filed' } },
  { id: 'a20', timestamp: '2026-04-08 14:30', type: 'payment', title: 'ACH failed — Little Havana Barbershop', description: 'Daily ACH $68 returned NSF. 2nd consecutive failure. Auto-retry scheduled for Apr 10.', user: 'System', merchant: 'Little Havana Barbershop', metadata: { amount: '$68', status: 'NSF', retry: 'Apr 10' } },
];

// ── Quick Note Modal ──
function QuickNoteModal({ onClose, onSave }: { onClose: () => void; onSave: (note: { merchant: string; content: string; type: ActivityType }) => void }) {
  const [merchant, setMerchant] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ActivityType>('note');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-[8px] shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-900">Log Activity</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-1.5">
            {(['note', 'call', 'email', 'sms'] as ActivityType[]).map(t => {
              const cfg = TYPE_CONFIG[t];
              const Icon = cfg.icon;
              return (
                <button key={t} onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-medium border transition-colors ${
                    type === t ? `${cfg.bg} ${cfg.color} font-semibold` : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  <Icon className="w-3 h-3" />{cfg.label}
                </button>
              );
            })}
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Merchant</label>
            <input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Search merchant..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Details</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder={type === 'call' ? 'Call notes, outcome, follow-up...' : type === 'email' ? 'Email subject, key points...' : 'Write your note...'}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" />
          </div>
          {type === 'call' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Duration</label>
                <input placeholder="e.g. 5m 30s" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Outcome</label>
                <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20">
                  <option>Connected</option>
                  <option>Voicemail</option>
                  <option>No answer</option>
                  <option>Busy</option>
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-[8px]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-[8px]">Cancel</button>
          <Button size="sm" onClick={() => { onSave({ merchant, content, type }); onClose(); }}>Log Activity</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export function BackendActivityTimeline() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [merchantFilter, setMerchantFilter] = useState<string | null>(null);

  const merchants = useMemo(() => [...new Set(ACTIVITIES.map(a => a.merchant).filter(Boolean))].sort() as string[], []);

  const filtered = useMemo(() => {
    return ACTIVITIES.filter(a => {
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (merchantFilter && a.merchant !== merchantFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || (a.merchant || '').toLowerCase().includes(q) || a.user.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, typeFilter, merchantFilter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { date: string; events: ActivityEvent[] }[] = [];
    let currentDate = '';
    for (const ev of filtered) {
      const d = ev.timestamp.split(' ')[0];
      const label = d === '2026-04-17' ? 'Today — Apr 17' : d === '2026-04-16' ? 'Yesterday — Apr 16' : d.replace('2026-0', 'Apr ').replace('4-', '').replace('2026-', '');
      const dateLabel = d === '2026-04-17' ? 'Today — Apr 17' : d === '2026-04-16' ? 'Yesterday — Apr 16' :
        d === '2026-04-15' ? 'Apr 15' : d === '2026-04-14' ? 'Apr 14' : d === '2026-04-13' ? 'Apr 13' :
        d === '2026-04-12' ? 'Apr 12' : d === '2026-04-11' ? 'Apr 11' : d === '2026-04-10' ? 'Apr 10' :
        d === '2026-04-09' ? 'Apr 9' : d === '2026-04-08' ? 'Apr 8' : d;
      if (d !== currentDate) {
        groups.push({ date: dateLabel, events: [] });
        currentDate = d;
      }
      groups[groups.length - 1].events.push(ev);
    }
    return groups;
  }, [filtered]);

  const typeCounts = useMemo(() => {
    const c: Record<string, number> = {};
    ACTIVITIES.forEach(a => { c[a.type] = (c[a.type] || 0) + 1; });
    return c;
  }, []);

  return (
    <div className="px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Timeline</h1>
            <p className="text-sm text-gray-500">Every interaction across all merchants and deals</p>
          </div>
        </div>
        <Button size="sm" icon={<Plus />} onClick={() => setShowModal(true)}>Log Activity</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[8px] border border-gray-200 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activities..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-[8px] text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <button onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1.5 rounded-[8px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${typeFilter === 'all' ? 'bg-brand/5 text-brand border-brand/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
              All ({ACTIVITIES.length})
            </button>
            {(['call', 'email', 'sms', 'note', 'deal', 'payment', 'alert', 'status_change', 'document', 'task', 'system'] as ActivityType[]).map(t => {
              const cfg = TYPE_CONFIG[t];
              const Icon = cfg.icon;
              const count = typeCounts[t] || 0;
              if (count === 0) return null;
              return (
                <button key={t} onClick={() => setTypeFilter(typeFilter === t ? 'all' : t)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[10px] font-semibold border whitespace-nowrap transition-colors ${
                    typeFilter === t ? `${cfg.bg} ${cfg.color}` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}>
                  <Icon className="w-3 h-3" />{cfg.label} ({count})
                </button>
              );
            })}
          </div>
          {merchantFilter && (
            <button onClick={() => setMerchantFilter(null)} className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-50 text-brand border border-brand-200 rounded-[8px] text-[10px] font-semibold">
              <Store className="w-3 h-3" />{merchantFilter} <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        {grouped.map((group, gi) => (
          <div key={gi}>
            {/* Date header */}
            <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{group.date}</span>
            </div>
            {/* Events */}
            {group.events.map((ev, ei) => {
              const cfg = TYPE_CONFIG[ev.type];
              const Icon = cfg.icon;
              const time = ev.timestamp.split(' ')[1];
              return (
                <div key={ev.id} className="relative px-5 py-3.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex gap-3.5">
                    {/* Timeline dot & line */}
                    <div className="flex flex-col items-center shrink-0 pt-0.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${cfg.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                      </div>
                      {ei < group.events.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-gray-900">{ev.title}</h4>
                            {ev.dealId && <span className="text-[9px] font-mono text-brand bg-brand-50 px-1.5 py-0.5 rounded">{ev.dealId}</span>}
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{ev.description}</p>
                          {/* Metadata */}
                          {ev.metadata && (
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {Object.entries(ev.metadata).map(([k, v]) => (
                                <span key={k} className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                  <span className="text-gray-500 font-medium">{k.replace(/_/g, ' ')}:</span> {v}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-gray-400 font-mono">{time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><User className="w-2.5 h-2.5" />{ev.user}</span>
                        {ev.merchant && (
                          <button onClick={() => setMerchantFilter(ev.merchant!)} className="text-[10px] text-brand hover:underline flex items-center gap-1">
                            <Store className="w-2.5 h-2.5" />{ev.merchant}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-16 text-center">
            <Activity className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No activities match your filters</p>
          </div>
        )}
      </div>

      {showModal && <QuickNoteModal onClose={() => setShowModal(false)} onSave={() => {}} />}
    </div>
  );
}
