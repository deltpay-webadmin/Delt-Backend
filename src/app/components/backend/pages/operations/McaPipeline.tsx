import React, { useMemo } from 'react';
import { GitBranch, ClipboardCheck, Banknote, Activity, ShieldAlert, ChevronRight } from 'lucide-react';
import { useAppNavigate } from '../../NavigationContext';
import { useUnderwriting, useDeals } from '../../crmStore';
import {
  MOCK_MCA_KPIS,
  MOCK_FUNDING_RECORDS,
  MOCK_COLLECTIONS_CASES,
  MOCK_REFERRAL_SUBMISSIONS,
  formatUsd,
  formatPct,
  formatNumber,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

/**
 * MCA Pipeline overview — single screen that summarises every lifecycle
 * stage so an operator can see "where is value sitting today".
 *
 * Data sources:
 *   • origination + underwriting from `crmStore` (existing leads + UW)
 *   • funding / collections / referrals from `domain/mca` mock data
 *   • aggregated KPIs from MOCK_MCA_KPIS (replace with API roll-ups)
 */
export function McaPipeline() {
  const { navigate } = useAppNavigate();
  const uw = useUnderwriting();
  const deals = useDeals();

  const stageCounts = useMemo(() => {
    const originating = uw.filter((u) => ['Received', 'Doc Collection'].includes(u.stage)).length;
    const underwriting = uw.filter((u) => ['Bank Review', 'Credit Analysis', 'Committee'].includes(u.stage)).length;
    const funding = MOCK_FUNDING_RECORDS.filter((f) => f.status !== 'funded' && f.status !== 'failed').length;
    const servicing = deals.filter((d) => d.status === 'Current').length;
    const collections = MOCK_COLLECTIONS_CASES.length + deals.filter((d) => ['Delinquent', 'Default', 'Workout'].includes(d.status)).length;
    const referrals = MOCK_REFERRAL_SUBMISSIONS.filter((r) => r.status === 'pending' || r.status === 'qualified').length;
    return { originating, underwriting, funding, servicing, collections, referrals };
  }, [uw, deals]);

  const kpiCards = [
    { label: 'Pipeline (count)', value: formatNumber(MOCK_MCA_KPIS.pipelineCount + uw.length), accent: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
    { label: 'Pipeline volume', value: formatUsd(MOCK_MCA_KPIS.pipelineRequestedAmount), accent: 'text-blue-700 bg-blue-50 border-blue-100' },
    { label: 'Funded MTD', value: formatUsd(MOCK_MCA_KPIS.fundedMtd), accent: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'Funded YTD', value: formatUsd(MOCK_MCA_KPIS.fundedYtd), accent: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
    { label: 'Avg factor', value: MOCK_MCA_KPIS.weightedAvgFactorRate.toFixed(2) + 'x', accent: 'text-purple-700 bg-purple-50 border-purple-100' },
    { label: 'Outstanding principal', value: formatUsd(MOCK_MCA_KPIS.outstandingPrincipal), accent: 'text-gray-700 bg-gray-50 border-gray-100' },
    { label: 'Delinquency rate', value: formatPct(MOCK_MCA_KPIS.delinquencyRate), accent: 'text-amber-700 bg-amber-50 border-amber-100' },
    { label: 'Net charge-off YTD', value: formatUsd(MOCK_MCA_KPIS.netChargedOff), accent: 'text-red-700 bg-red-50 border-red-100' },
  ];

  const stageCards = [
    { label: 'Origination', count: stageCounts.originating, icon: GitBranch, path: '/leads', desc: 'Leads + applications in intake.' },
    { label: 'Underwriting', count: stageCounts.underwriting, icon: ClipboardCheck, path: '/underwriting', desc: 'In review with credit / committee.' },
    { label: 'Funding', count: stageCounts.funding, icon: Banknote, path: '/mca/funding', desc: 'Signed contracts → wire.' },
    { label: 'Servicing', count: stageCounts.servicing, icon: Activity, path: '/deals', desc: 'Active deals being collected on.' },
    { label: 'Collections', count: stageCounts.collections, icon: ShieldAlert, path: '/mca/collections', desc: 'Past-due, workout, charge-off.' },
    { label: 'Referrals', count: stageCounts.referrals, icon: ChevronRight, path: '/mca/referrals', desc: 'ISO / partner submissions in flight.' },
  ];

  return (
    <div className="px-6 py-6 space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">MCA Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">Lifecycle health across origination, underwriting, funding, servicing, collections and referrals.</p>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((c) => (
          <div key={c.label} className={`border rounded-lg p-4 ${c.accent}`}>
            <p className="text-[12px] font-medium opacity-80">{c.label}</p>
            <p className="text-xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </section>

      {/* Stage cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stageCards.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={() => navigate(s.path)}
              className="text-left bg-white rounded-lg border border-gray-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{s.label}</h3>
                </div>
                <span className="text-2xl font-bold text-gray-900">{s.count}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">{s.desc}</p>
              <p className="text-xs text-indigo-600 font-medium mt-2 flex items-center gap-1">
                Open <ChevronRight className="w-3 h-3" />
              </p>
            </button>
          );
        })}
      </section>

      {/* Recent activity strip */}
      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Latest funding activity</h2>
        <div className="space-y-2">
          {MOCK_FUNDING_RECORDS.map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm border-b border-gray-50 last:border-0 py-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-500">{f.dealId}</span>
                <span className="text-gray-900">{formatUsd(f.amount)}</span>
                <OpsStatusPill status={f.status} />
              </div>
              <span className="text-xs text-gray-500">factor {f.factorRate.toFixed(2)}x · payback {formatUsd(f.paybackAmount)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
