import React, { useState, useMemo } from 'react';
import { Banknote, Search, FileSignature, Wallet, Send, AlertTriangle } from 'lucide-react';
import {
  MOCK_FUNDING_RECORDS,
  FUNDING_STATUSES,
  type FundingStatus,
  formatUsd,
  formatDateTime,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

const STATUS_GROUPS: { label: string; statuses: FundingStatus[]; icon: any }[] = [
  { label: 'Awaiting signature', statuses: ['pending_signature'], icon: FileSignature },
  { label: 'Signed / queued', statuses: ['signed', 'wire_queued'], icon: Wallet },
  { label: 'Wire sent', statuses: ['wire_sent'], icon: Send },
  { label: 'Funded', statuses: ['funded'], icon: Banknote },
  { label: 'Failed / reversed', statuses: ['failed', 'reversed'], icon: AlertTriangle },
];

/**
 * MCA Funding Queue — operational view of the funding stage.
 * Each row is a `FundingRecord` with full status history.
 */
export function McaFunding() {
  const [filter, setFilter] = useState<'all' | FundingStatus>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return MOCK_FUNDING_RECORDS.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (q && !r.dealId.toLowerCase().includes(q.toLowerCase()) && !r.merchantId.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [filter, q]);

  const totals = useMemo(() => {
    const by = (status: FundingStatus) =>
      MOCK_FUNDING_RECORDS.filter((r) => r.status === status).reduce((sum, r) => sum + r.amount, 0);
    return {
      queued: by('signed') + by('wire_queued'),
      sent: by('wire_sent'),
      funded: by('funded'),
      failed: by('failed') + by('reversed'),
    };
  }, []);

  return (
    <div className="px-6 py-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funding Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Signed contracts moving through wire / ACH disbursement.</p>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-blue-100 bg-blue-50 rounded-lg p-4">
          <p className="text-[12px] text-blue-700 font-medium">Queued</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{formatUsd(totals.queued)}</p>
        </div>
        <div className="border border-indigo-100 bg-indigo-50 rounded-lg p-4">
          <p className="text-[12px] text-indigo-700 font-medium">Wire sent</p>
          <p className="text-xl font-bold text-indigo-700 mt-1">{formatUsd(totals.sent)}</p>
        </div>
        <div className="border border-emerald-100 bg-emerald-50 rounded-lg p-4">
          <p className="text-[12px] text-emerald-700 font-medium">Funded</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatUsd(totals.funded)}</p>
        </div>
        <div className="border border-red-100 bg-red-50 rounded-lg p-4">
          <p className="text-[12px] text-red-700 font-medium">Failed / reversed</p>
          <p className="text-xl font-bold text-red-700 mt-1">{formatUsd(totals.failed)}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {STATUS_GROUPS.map((g) => {
          const Icon = g.icon;
          const count = MOCK_FUNDING_RECORDS.filter((r) => g.statuses.includes(r.status)).length;
          return (
            <button
              key={g.label}
              onClick={() => setFilter(g.statuses[0])}
              className="text-left bg-white rounded-lg border border-gray-200 p-3 hover:border-indigo-200 transition-all"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-semibold text-gray-700">{g.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
            </button>
          );
        })}
      </section>

      {/* Filters */}
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
          onChange={(e) => setFilter(e.target.value as 'all' | FundingStatus)}
          className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
        >
          <option value="all">All statuses</option>
          {FUNDING_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Deal</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Merchant</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Net disbursed</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Factor</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Funded at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs text-gray-700">{r.dealId}</td>
                <td className="px-4 py-2 text-gray-900">{r.merchantId}</td>
                <td className="px-4 py-2 font-medium">{formatUsd(r.amount)}</td>
                <td className="px-4 py-2 text-gray-600">{formatUsd(r.netDisbursed)}</td>
                <td className="px-4 py-2 text-gray-600">{r.factorRate.toFixed(2)}x</td>
                <td className="px-4 py-2"><OpsStatusPill status={r.status} /></td>
                <td className="px-4 py-2 text-xs text-gray-500">{formatDateTime(r.fundedAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No funding records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
