import React, { useState, useMemo } from 'react';
import { ShieldAlert, Search, Clock } from 'lucide-react';
import {
  MOCK_COLLECTIONS_CASES,
  COLLECTIONS_STATUSES,
  type CollectionsStatus,
  formatUsd,
  formatDateTime,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

/**
 * Collections — past-due / workout / charge-off case board.
 */
export function McaCollections() {
  const [filter, setFilter] = useState<'all' | CollectionsStatus>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return MOCK_COLLECTIONS_CASES.filter((c) => {
      if (filter !== 'all' && c.status !== filter) return false;
      if (q && !c.dealId.toLowerCase().includes(q.toLowerCase()) && !c.merchantId.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [filter, q]);

  const totals = useMemo(() => ({
    cases: MOCK_COLLECTIONS_CASES.length,
    outstanding: MOCK_COLLECTIONS_CASES.reduce((s, c) => s + c.outstandingBalance, 0),
    recovered: MOCK_COLLECTIONS_CASES.reduce((s, c) => s + c.recoveredAmount, 0),
    avgDpd: MOCK_COLLECTIONS_CASES.length
      ? Math.round(MOCK_COLLECTIONS_CASES.reduce((s, c) => s + c.daysPastDue, 0) / MOCK_COLLECTIONS_CASES.length)
      : 0,
  }), []);

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
        <p className="text-sm text-gray-500 mt-1">Past-due cases assigned to collectors with status history.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-600" /><p className="text-xs font-semibold text-gray-700">Open cases</p></div>
          <p className="text-xl font-bold text-gray-900 mt-1">{totals.cases}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Outstanding</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatUsd(totals.outstanding)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Recovered</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatUsd(totals.recovered)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-600" /><p className="text-xs font-semibold text-gray-700">Avg DPD</p></div>
          <p className="text-xl font-bold text-gray-900 mt-1">{totals.avgDpd}d</p>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search deal or merchant ID"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | CollectionsStatus)}
          className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
        >
          <option value="all">All statuses</option>
          {COLLECTIONS_STATUSES.map((s) => (
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
                  <span className="font-mono text-xs text-gray-500">{c.dealId}</span>
                  <OpsStatusPill status={c.status} />
                </div>
                <p className="font-semibold text-gray-900 mt-1">Merchant {c.merchantId}</p>
                <p className="text-sm text-gray-500">Assigned to {c.assignedTo} · next action {formatDateTime(c.nextActionDue)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Outstanding</p>
                <p className="text-lg font-bold text-amber-700">{formatUsd(c.outstandingBalance)}</p>
                <p className="text-xs text-emerald-700">recovered {formatUsd(c.recoveredAmount)}</p>
                <p className="text-xs text-red-700">{c.daysPastDue} DPD</p>
              </div>
            </div>

            {c.statusHistory.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Status history</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  {c.statusHistory.map((h, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <OpsStatusPill status={h.status} />
                      <span>by {h.by} · {formatDateTime(h.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {c.notes.length > 0 && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent notes</p>
                <ul className="space-y-1 text-xs text-gray-700">
                  {c.notes.map((n) => (
                    <li key={n.id}><span className="font-medium">{n.author}</span> · {formatDateTime(n.at)}: {n.body}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">No cases match the current filters.</div>
        )}
      </section>
    </div>
  );
}
