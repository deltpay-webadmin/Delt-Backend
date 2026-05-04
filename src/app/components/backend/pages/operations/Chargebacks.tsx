import React, { useState, useMemo } from 'react';
import { Search, ShieldAlert, Clock } from 'lucide-react';
import {
  MOCK_CHARGEBACK_CASES,
  CHARGEBACK_STATUSES,
  type ChargebackStatus,
  formatUsd,
  formatDate,
  formatDateTime,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

/**
 * Chargebacks — case workflow with deadline tracking.
 *
 * The legacy `BackendDisputes` page handles the customer-facing dispute
 * surface; this page focuses on the structured case workflow with
 * status history that finance / compliance need.
 */
export function Chargebacks() {
  const [filter, setFilter] = useState<'all' | ChargebackStatus>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return MOCK_CHARGEBACK_CASES.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false;
      if (q && !c.merchantName.toLowerCase().includes(q.toLowerCase()) && !c.caseNumber.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [filter, q]);

  const totals = useMemo(() => ({
    open: MOCK_CHARGEBACK_CASES.filter((c) => !['won', 'lost', 'accepted'].includes(c.status)).length,
    exposed: MOCK_CHARGEBACK_CASES
      .filter((c) => !['won', 'lost', 'accepted'].includes(c.status))
      .reduce((s, c) => s + c.amount, 0),
    won: MOCK_CHARGEBACK_CASES.filter((c) => c.status === 'won').length,
    lost: MOCK_CHARGEBACK_CASES.filter((c) => c.status === 'lost').length,
  }), []);

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Chargebacks</h1>
        <p className="text-sm text-gray-500 mt-1">Structured case workflow with status history and response deadlines.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-600" /><p className="text-xs font-semibold text-gray-700">Open cases</p></div>
          <p className="text-xl font-bold text-amber-700 mt-1">{totals.open}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">At risk</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatUsd(totals.exposed)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Won (YTD)</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{totals.won}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Lost (YTD)</p>
          <p className="text-xl font-bold text-red-700 mt-1">{totals.lost}</p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search merchant or case number"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | ChargebackStatus)}
          className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
        >
          <option value="all">All statuses</option>
          {CHARGEBACK_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <section className="space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-gray-500">{c.caseNumber}</span>
                  <OpsStatusPill status={c.status} />
                  <OpsStatusPill status={c.cardNetwork} tone="info" />
                </div>
                <p className="font-semibold text-gray-900 mt-1">{c.merchantName}</p>
                <p className="text-sm text-gray-500">Reason {c.reasonCode} · {c.reasonDescription}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Disputed</p>
                <p className="text-lg font-bold text-gray-900">{formatUsd(c.amount, { precise: true })}</p>
                <p className="text-xs text-red-700 flex items-center justify-end gap-1"><Clock className="w-3 h-3" />respond by {formatDate(c.responseDeadline)}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div>
                <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">Status history</p>
                <ul className="space-y-1">
                  {c.statusHistory.map((h, i) => (
                    <li key={i} className="flex items-center gap-2"><OpsStatusPill status={h.status} />{h.by} · {formatDateTime(h.at)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                <ul className="space-y-1">
                  {c.notes.length === 0 && <li className="text-gray-400">No notes yet.</li>}
                  {c.notes.map((n) => (
                    <li key={n.id}><span className="font-medium">{n.author}</span>: {n.body}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">No chargeback cases match the current filters.</div>
        )}
      </section>
    </div>
  );
}
