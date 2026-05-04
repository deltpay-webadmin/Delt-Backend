import React, { useMemo } from 'react';
import { Users, TrendingUp, Wallet } from 'lucide-react';
import {
  MOCK_SYNDICATORS,
  MOCK_SYNDICATION_POSITIONS,
  formatUsd,
  formatPct,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

/**
 * Syndication — capital partner positions per deal.
 * Aggregates capital deployed and YTD return per syndicator.
 */
export function McaSyndication() {
  const aggregated = useMemo(() => {
    return MOCK_SYNDICATORS.map((s) => {
      const positions = MOCK_SYNDICATION_POSITIONS.filter((p) => p.syndicatorId === s.id);
      const deployed = positions.reduce((sum, p) => sum + p.capitalContributed, 0);
      const expected = positions.reduce((sum, p) => sum + p.expectedReturn, 0);
      const collected = positions.reduce((sum, p) => sum + p.collectedToDate, 0);
      const utilization = s.totalCapitalCommitted > 0 ? deployed / s.totalCapitalCommitted : 0;
      return { syndicator: s, deployed, expected, collected, utilization, positionCount: positions.length };
    });
  }, []);

  const totals = aggregated.reduce(
    (acc, a) => ({
      committed: acc.committed + a.syndicator.totalCapitalCommitted,
      deployed: acc.deployed + a.deployed,
      collected: acc.collected + a.collected,
    }),
    { committed: 0, deployed: 0, collected: 0 },
  );

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Syndication</h1>
        <p className="text-sm text-gray-500 mt-1">Syndicator capital, deployment, and collected returns by deal.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-indigo-600" /><p className="text-xs font-semibold text-gray-700">Total committed</p></div>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatUsd(totals.committed)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /><p className="text-xs font-semibold text-gray-700">Deployed</p></div>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatUsd(totals.deployed)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatPct(totals.committed > 0 ? totals.deployed / totals.committed : 0)} utilization</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><Users className="w-4 h-4 text-purple-600" /><p className="text-xs font-semibold text-gray-700">Active syndicators</p></div>
          <p className="text-xl font-bold text-gray-900 mt-1">{MOCK_SYNDICATORS.length}</p>
        </div>
      </section>

      {/* Syndicator table */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Syndicators</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Syndicator</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Default %</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Mgmt fee</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Committed</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Deployed</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Collected</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Positions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {aggregated.map((a) => (
              <tr key={a.syndicator.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <p className="font-semibold text-gray-900">{a.syndicator.name}</p>
                  <p className="text-xs text-gray-500">{a.syndicator.contactEmail}</p>
                </td>
                <td className="px-4 py-2">{a.syndicator.defaultParticipationPct}%</td>
                <td className="px-4 py-2">{a.syndicator.managementFeeBps} bps</td>
                <td className="px-4 py-2">{formatUsd(a.syndicator.totalCapitalCommitted)}</td>
                <td className="px-4 py-2">{formatUsd(a.deployed)}</td>
                <td className="px-4 py-2 text-emerald-700">{formatUsd(a.collected)}</td>
                <td className="px-4 py-2 text-gray-700">{a.positionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Positions */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Open positions</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Deal</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Syndicator</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Participation</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Capital</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Expected return</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Collected</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_SYNDICATION_POSITIONS.map((p) => {
              const synd = MOCK_SYNDICATORS.find((s) => s.id === p.syndicatorId);
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-700">{p.dealId}</td>
                  <td className="px-4 py-2 text-gray-900">{synd?.name ?? p.syndicatorId}</td>
                  <td className="px-4 py-2">{p.participationPct}%</td>
                  <td className="px-4 py-2">{formatUsd(p.capitalContributed)}</td>
                  <td className="px-4 py-2">{formatUsd(p.expectedReturn)}</td>
                  <td className="px-4 py-2 text-emerald-700">{formatUsd(p.collectedToDate)}</td>
                  <td className="px-4 py-2"><OpsStatusPill status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
