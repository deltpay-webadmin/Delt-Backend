import React, { useMemo } from 'react';
import { Handshake } from 'lucide-react';
import {
  MOCK_REFERRAL_PARTNERS,
  MOCK_REFERRAL_SUBMISSIONS,
  formatUsd,
  formatDateTime,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

/**
 * Referrals — ISO/broker partner submissions feeding origination.
 */
export function McaReferrals() {
  const totals = useMemo(() => {
    return {
      submissions: MOCK_REFERRAL_SUBMISSIONS.length,
      converted: MOCK_REFERRAL_SUBMISSIONS.filter((r) => r.status === 'converted').length,
      ytdFunded: MOCK_REFERRAL_PARTNERS.reduce((s, p) => s + p.ytdFunded, 0),
      ytdPayouts: MOCK_REFERRAL_PARTNERS.reduce((s, p) => s + p.ytdPayouts, 0),
    };
  }, []);

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Referral Partners</h1>
        <p className="text-sm text-gray-500 mt-1">ISO and broker submissions, conversion, and partner payouts.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><Handshake className="w-4 h-4 text-indigo-600" /><p className="text-xs font-semibold text-gray-700">Active partners</p></div>
          <p className="text-xl font-bold text-gray-900 mt-1">{MOCK_REFERRAL_PARTNERS.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Submissions YTD</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{totals.submissions}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Funded YTD</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{totals.ytdFunded}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Partner payouts YTD</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatUsd(totals.ytdPayouts)}</p>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Partners</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Partner</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Type</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Default %</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">YTD subs</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">YTD funded</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">YTD payouts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_REFERRAL_PARTNERS.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.email}</p>
                </td>
                <td className="px-4 py-2"><OpsStatusPill status={p.partnerType} tone="info" /></td>
                <td className="px-4 py-2">{p.defaultCommissionPct}%</td>
                <td className="px-4 py-2">{p.ytdSubmissions}</td>
                <td className="px-4 py-2 text-emerald-700">{p.ytdFunded}</td>
                <td className="px-4 py-2">{formatUsd(p.ytdPayouts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Recent submissions</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Submission</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Partner</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Merchant</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Requested</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Funded</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Commission</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_REFERRAL_SUBMISSIONS.map((s) => {
              const p = MOCK_REFERRAL_PARTNERS.find((x) => x.id === s.partnerId);
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-gray-700">{s.id}</td>
                  <td className="px-4 py-2 text-gray-900">{p?.name ?? s.partnerId}</td>
                  <td className="px-4 py-2 text-gray-900">{s.merchantName}</td>
                  <td className="px-4 py-2">{formatUsd(s.requestedAmount)}</td>
                  <td className="px-4 py-2">{s.fundedAmount ? formatUsd(s.fundedAmount) : '—'}</td>
                  <td className="px-4 py-2">{s.commissionAmount ? formatUsd(s.commissionAmount) : `${s.commissionPct}%`}</td>
                  <td className="px-4 py-2"><OpsStatusPill status={s.status} /></td>
                  <td className="px-4 py-2 text-xs text-gray-500">{formatDateTime(s.submittedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
