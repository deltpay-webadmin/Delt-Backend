import React, { useState, useMemo } from 'react';
import { Wallet, CalendarClock } from 'lucide-react';
import {
  MOCK_PAYOUT_RUNS,
  MOCK_AGENT_PAYOUTS,
  PAYOUT_RUN_STATUSES,
  type PayoutRunStatus,
  formatUsd,
  formatDateTime,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

/**
 * Payout Runs — monthly residual payout cycle for agents.
 * Shows the run header, status history, and per-agent breakdown.
 */
export function PayoutRuns() {
  const [filter, setFilter] = useState<'all' | PayoutRunStatus>('all');
  const [selectedRunId, setSelectedRunId] = useState<string>(MOCK_PAYOUT_RUNS[0]?.id ?? '');

  const filteredRuns = useMemo(
    () => MOCK_PAYOUT_RUNS.filter((r) => (filter === 'all' ? true : r.status === filter)),
    [filter],
  );

  const selectedRun = MOCK_PAYOUT_RUNS.find((r) => r.id === selectedRunId);
  const runAgentPayouts = useMemo(
    () => MOCK_AGENT_PAYOUTS.filter((a) => a.periodMonth === selectedRun?.periodMonth),
    [selectedRun],
  );

  const totals = useMemo(() => ({
    pendingNet: MOCK_PAYOUT_RUNS.filter((r) => ['draft', 'in_review', 'approved'].includes(r.status))
      .reduce((s, r) => s + r.totalNet, 0),
    paidYtd: MOCK_PAYOUT_RUNS.filter((r) => r.status === 'paid').reduce((s, r) => s + r.totalNet, 0),
  }), []);

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Payout Runs</h1>
        <p className="text-sm text-gray-500 mt-1">Monthly residual payouts to agents with full audit trail.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-amber-600" /><p className="text-xs font-semibold text-gray-700">Pending payout</p></div>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatUsd(totals.pendingNet)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Paid YTD</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatUsd(totals.paidYtd)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-indigo-600" /><p className="text-xs font-semibold text-gray-700">Next cutover</p></div>
          <p className="text-xl font-bold text-gray-900 mt-1">2026-06-01</p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | PayoutRunStatus)}
          className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
        >
          <option value="all">All statuses</option>
          {PAYOUT_RUN_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Runs</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Period</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Agents</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Gross</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Net</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Approved by</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredRuns.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedRunId(r.id)}
                className={`cursor-pointer ${r.id === selectedRunId ? 'bg-indigo-50/40' : 'hover:bg-gray-50'}`}
              >
                <td className="px-4 py-2 font-mono text-xs text-gray-700">{r.periodMonth}</td>
                <td className="px-4 py-2">{r.totalAgents}</td>
                <td className="px-4 py-2">{formatUsd(r.totalGross)}</td>
                <td className="px-4 py-2 font-medium">{formatUsd(r.totalNet)}</td>
                <td className="px-4 py-2"><OpsStatusPill status={r.status} /></td>
                <td className="px-4 py-2 text-gray-700">{r.approvedBy ?? '—'}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{formatDateTime(r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedRun && (
        <section className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Run {selectedRun.periodMonth} — agent breakdown</h2>
          <div className="mb-3">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status history</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {selectedRun.statusHistory.map((h, i) => (
                <li key={i} className="flex items-center gap-2"><OpsStatusPill status={h.status} />{h.by} · {formatDateTime(h.at)}</li>
              ))}
            </ul>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left">
              <tr>
                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Agent</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Gross</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Adjustments</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Net</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Merchants on slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runAgentPayouts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 text-gray-900">{a.agentName}</td>
                  <td className="px-4 py-2">{formatUsd(a.grossEarnings)}</td>
                  <td className="px-4 py-2">{formatUsd(a.adjustments)}</td>
                  <td className="px-4 py-2 font-medium">{formatUsd(a.netPayout)}</td>
                  <td className="px-4 py-2"><OpsStatusPill status={a.status} /></td>
                  <td className="px-4 py-2 text-xs text-gray-500">{a.lineItems.length}</td>
                </tr>
              ))}
              {runAgentPayouts.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-sm">No agent payouts loaded for this run.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
