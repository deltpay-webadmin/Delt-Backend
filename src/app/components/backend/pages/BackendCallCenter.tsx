import React, { useMemo, useRef, useState } from 'react';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  Building2,
  UserRound,
  Clock,
  Trash2,
  Link2,
  ChevronRight,
  Voicemail,
  XCircle,
  CheckCircle2,
  PhoneOff,
} from 'lucide-react';
import { useAppNavigate } from '../NavigationContext';
import {
  useCallLogs,
  callLogActions,
  searchByPhone,
  useLeads,
  useMerchants,
  type CallDirection,
  type CallStatus,
  type CallLog,
  type PhoneMatch,
} from '../crmStore';
import { formatPhone, normalizePhone, phoneMatches } from '../../../lib/phone';

// ── Helpers ──
const STATUS_OPTIONS: { value: CallStatus; label: string }[] = [
  { value: 'completed', label: 'Completed' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'no-answer', label: 'No answer' },
  { value: 'busy', label: 'Busy' },
  { value: 'failed', label: 'Failed' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'in-progress', label: 'In progress' },
];

function statusIcon(s: CallStatus) {
  if (s === 'completed') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
  if (s === 'voicemail') return <Voicemail className="w-3.5 h-3.5 text-amber-600" />;
  if (s === 'no-answer' || s === 'busy') return <PhoneOff className="w-3.5 h-3.5 text-gray-500" />;
  if (s === 'failed' || s === 'canceled') return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  return <Clock className="w-3.5 h-3.5 text-gray-500" />;
}

function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return iso;
  const diff = (Date.now() - t) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 7 * 86_400) return `${Math.round(diff / 86_400)}d ago`;
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ══════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════
export function BackendCallCenter() {
  const { navigate } = useAppNavigate();
  const callLogs = useCallLogs();
  const leads = useLeads();
  const merchants = useMerchants();

  const [phone, setPhone] = useState('');
  const [direction, setDirection] = useState<CallDirection>('outbound');
  const [status, setStatus] = useState<CallStatus>('completed');
  const [notes, setNotes] = useState('');
  const [agent] = useState('You');
  const [historyFilter, setHistoryFilter] = useState('');

  // Ensure searchByPhone re-runs when leads/merchants change (the function reads
  // straight from store state; deps below are what triggers re-render).
  const matches: PhoneMatch[] = useMemo(() => {
    if (!phone.trim()) return [];
    return searchByPhone(phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, leads, merchants]);

  const [pickedSubject, setPickedSubject] = useState<PhoneMatch | null>(null);

  // If the user types a number, default the picked subject to the first match
  // (only when they haven't manually overridden).
  React.useEffect(() => {
    if (matches.length > 0) {
      // If the current pick is not in matches, reset.
      if (!pickedSubject || !matches.find(m => m.id === pickedSubject.id && m.kind === pickedSubject.kind)) {
        setPickedSubject(matches[0]);
      }
    } else {
      setPickedSubject(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, matches.length]);

  const normalized = normalizePhone(phone);

  const dialHref = normalized ? `tel:${normalized}` : undefined;

  function logCurrent() {
    if (!phone.trim()) return;
    callLogActions.log({
      phone,
      direction,
      status,
      subjectKind: pickedSubject?.kind || 'none',
      subjectId: pickedSubject?.id || null,
      subjectLabel: pickedSubject?.label || null,
      agent,
      notes,
      provider: 'click-to-call',
    });
    setNotes('');
  }

  function dialAndLog() {
    if (!phone.trim()) return;
    if (dialHref) {
      // Open the OS / browser tel handler. If no handler is registered, the
      // browser silently does nothing — safe.
      window.location.href = dialHref;
    }
    callLogActions.log({
      phone,
      direction: 'outbound',
      status: 'in-progress',
      subjectKind: pickedSubject?.kind || 'none',
      subjectId: pickedSubject?.id || null,
      subjectLabel: pickedSubject?.label || null,
      agent,
      notes,
      provider: 'click-to-call',
    });
    setNotes('');
  }

  // ── History filter ──
  const filteredLogs = useMemo(() => {
    if (!historyFilter.trim()) return callLogs;
    const q = historyFilter.toLowerCase();
    return callLogs.filter(c => {
      if (phoneMatches(c.phoneNormalized, historyFilter)) return true;
      if ((c.subjectLabel || '').toLowerCase().includes(q)) return true;
      if ((c.notes || '').toLowerCase().includes(q)) return true;
      return false;
    });
  }, [callLogs, historyFilter]);

  return (
    <div className="px-6 py-6 space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="delt-page-title">Call Center</h1>
        <p className="delt-page-subtitle">
          Look up merchants by phone number, place click-to-call calls, and log customer-service interactions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─────────────────────────────────────────────── */}
        {/* Left: dialer + matches                          */}
        {/* ─────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <Dialer
            phone={phone}
            setPhone={setPhone}
            normalized={normalized}
            direction={direction}
            setDirection={setDirection}
            status={status}
            setStatus={setStatus}
            notes={notes}
            setNotes={setNotes}
            onDial={dialAndLog}
            onLog={logCurrent}
            dialHref={dialHref}
          />

          <Matches
            phone={phone}
            matches={matches}
            picked={pickedSubject}
            setPicked={setPickedSubject}
            onOpenSubject={(m) => {
              if (m.kind === 'merchant') navigate(`/merchants/${m.id}`);
              else if (m.kind === 'lead') navigate('/leads');
            }}
          />
        </div>

        {/* ─────────────────────────────────────────────── */}
        {/* Right: history                                  */}
        {/* ─────────────────────────────────────────────── */}
        <div>
          <div className="delt-card">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Recent calls
              </h2>
              <span className="text-[11px] text-gray-400">{callLogs.length} total</span>
            </div>
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={historyFilter}
                  onChange={e => setHistoryFilter(e.target.value)}
                  placeholder="Filter by number or merchant"
                  className="w-full pl-8 pr-3 py-[7px] bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-gray-400">
                  No calls logged yet.
                </div>
              ) : (
                filteredLogs.map(c => (
                  <CallRow key={c.id} call={c} onOpen={(c2) => {
                    if (c2.subjectKind === 'merchant' && c2.subjectId) navigate(`/merchants/${c2.subjectId}`);
                    else if (c2.subjectKind === 'lead') navigate('/leads');
                  }} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dialer ──
function Dialer(props: {
  phone: string;
  setPhone: (s: string) => void;
  normalized: string;
  direction: CallDirection;
  setDirection: (d: CallDirection) => void;
  status: CallStatus;
  setStatus: (s: CallStatus) => void;
  notes: string;
  setNotes: (s: string) => void;
  onDial: () => void;
  onLog: () => void;
  dialHref: string | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="delt-card">
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Phone className="w-4 h-4 text-brand" />
          Dial / Log a call
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Phone input */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone number</label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                value={props.phone}
                onChange={e => props.setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                inputMode="tel"
                autoComplete="off"
              />
            </div>
            <a
              href={props.dialHref}
              onClick={(e) => {
                if (!props.phone.trim()) {
                  e.preventDefault();
                  return;
                }
                props.onDial();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] text-sm font-medium transition-colors ${
                props.phone.trim()
                  ? 'bg-brand text-white hover:bg-brand-hover'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <PhoneOutgoing className="w-4 h-4" />
              Dial
            </a>
          </div>
          {props.normalized && (
            <p className="text-[11px] text-gray-400 mt-1.5">
              Will dial <code className="bg-gray-50 px-1 py-0.5 rounded">{props.normalized}</code>
            </p>
          )}
        </div>

        {/* Direction + status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Direction</label>
            <div className="flex items-center gap-1.5 bg-gray-50 rounded-[6px] p-1">
              <button
                onClick={() => props.setDirection('outbound')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-[4px] flex items-center justify-center gap-1.5 transition-colors ${
                  props.direction === 'outbound' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <PhoneOutgoing className="w-3.5 h-3.5" /> Outbound
              </button>
              <button
                onClick={() => props.setDirection('inbound')}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-[4px] flex items-center justify-center gap-1.5 transition-colors ${
                  props.direction === 'inbound' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <PhoneIncoming className="w-3.5 h-3.5" /> Inbound
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Outcome</label>
            <select
              value={props.status}
              onChange={e => props.setStatus(e.target.value as CallStatus)}
              className="w-full py-2 px-3 bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            >
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
          <textarea
            value={props.notes}
            onChange={e => props.setNotes(e.target.value)}
            placeholder="What was the call about?"
            rows={3}
            className="w-full py-2 px-3 bg-white border border-gray-200 rounded-[6px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={props.onLog}
            disabled={!props.phone.trim()}
            className={`px-3 py-2 rounded-[6px] text-sm font-medium border transition-colors ${
              props.phone.trim()
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                : 'border-gray-100 text-gray-300 cursor-not-allowed'
            }`}
          >
            Log without dialing
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Matches list ──
function Matches(props: {
  phone: string;
  matches: PhoneMatch[];
  picked: PhoneMatch | null;
  setPicked: (m: PhoneMatch | null) => void;
  onOpenSubject: (m: PhoneMatch) => void;
}) {
  const { phone, matches, picked, setPicked, onOpenSubject } = props;

  return (
    <div className="delt-card">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          Phone matches
        </h2>
        <span className="text-[11px] text-gray-400">
          {!phone.trim() ? 'Type a number to search' :
            matches.length === 0 ? 'No match' :
              `${matches.length} match${matches.length === 1 ? '' : 'es'}`}
        </span>
      </div>

      {!phone.trim() ? (
        <div className="px-6 py-10 text-center text-sm text-gray-400">
          Enter a phone number above and we'll find any merchant or lead with that number on file.
        </div>
      ) : matches.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center">
            <Phone className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-sm text-gray-700">No merchant or lead has this number on file.</p>
          <p className="text-xs text-gray-400 mt-1">
            The call will still be logged — you can associate it later.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {matches.map(m => {
            const isPicked = !!picked && picked.id === m.id && picked.kind === m.kind;
            return (
              <li
                key={`${m.kind}-${m.id}-${m.matchedField}`}
                className={`px-4 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                  isPicked ? 'bg-brand/5' : 'hover:bg-gray-50'
                }`}
                onClick={() => setPicked(m)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  m.kind === 'merchant' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {m.kind === 'merchant' ? <Building2 className="w-4 h-4" /> : <UserRound className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.label}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {m.kind === 'merchant' ? 'Merchant' : 'Lead'}
                    {m.contactName ? ` • ${m.contactName}` : ''}
                    {' • '}
                    {formatPhone(m.phone)}
                    {' • '}
                    <span className="text-gray-400">{m.matchedField.replace('lead.kyb.', 'KYB ').replace('lead.', '').replace('merchant.', '')}</span>
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenSubject(m); }}
                  className="text-gray-400 hover:text-brand transition-colors p-1 rounded"
                  title="Open profile"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ── A single call history row ──
function CallRow({ call, onOpen }: { call: CallLog; onOpen: (c: CallLog) => void }) {
  const isInbound = call.direction === 'inbound';
  return (
    <div className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors group">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isInbound ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {isInbound ? <PhoneIncoming className="w-4 h-4" /> : <PhoneOutgoing className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {call.subjectLabel || formatPhone(call.phoneNormalized)}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
              {statusIcon(call.status)}
              {call.status}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 truncate">
            {formatPhone(call.phoneNormalized)}
            {call.agent ? ` • ${call.agent}` : ''}
            {' • '}
            {fmtRelative(call.startedAt)}
          </p>
          {call.notes && (
            <p className="text-[12px] text-gray-600 mt-1 line-clamp-2">{call.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {call.subjectId && (
            <button
              onClick={() => onOpen(call)}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-brand"
              title={`Open ${call.subjectKind}`}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => callLogActions.remove(call.id)}
            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
