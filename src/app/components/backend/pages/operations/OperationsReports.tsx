import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useAppNavigate } from '../../NavigationContext';
import {
  MOCK_MCA_KPIS,
  MOCK_MERCHANT_SERVICES_KPIS,
  MOCK_AI_USAGE_KPIS,
  formatCents,
  formatNumber,
  formatPct,
  formatUsd,
  OPERATIONS_ROUTES,
  routesForModule,
} from '../../../../domain';

/**
 * Operations Reports — cross-module KPI roll-up with deep-links to each
 * operational surface. Matches what an exec or oncall would scan first.
 */
export function OperationsReports() {
  const { navigate } = useAppNavigate();
  const mca = MOCK_MCA_KPIS;
  const ms = MOCK_MERCHANT_SERVICES_KPIS;
  const ai = MOCK_AI_USAGE_KPIS;

  const sections: { title: string; rows: { label: string; value: string }[]; routes: typeof OPERATIONS_ROUTES }[] = [
    {
      title: 'MCA',
      rows: [
        { label: 'Pipeline volume', value: formatUsd(mca.pipelineRequestedAmount) },
        { label: 'Funded MTD', value: formatUsd(mca.fundedMtd) },
        { label: 'Funded YTD', value: formatUsd(mca.fundedYtd) },
        { label: 'Approval rate', value: formatPct(mca.approvalRate) },
        { label: 'Avg factor', value: mca.weightedAvgFactorRate.toFixed(2) + 'x' },
        { label: 'Outstanding principal', value: formatUsd(mca.outstandingPrincipal) },
        { label: 'Delinquency rate', value: formatPct(mca.delinquencyRate) },
        { label: 'Net charge-off YTD', value: formatUsd(mca.netChargedOff) },
        { label: 'Syndication deployed', value: formatUsd(mca.syndicationDeployed) },
      ],
      routes: routesForModule('mca'),
    },
    {
      title: 'Merchant Services',
      rows: [
        { label: 'Active merchants', value: formatNumber(ms.activeMerchants) },
        { label: 'Monthly processing volume', value: formatUsd(ms.monthlyProcessingVolume) },
        { label: 'Residuals TTM', value: formatUsd(ms.residualsTtm) },
        { label: 'Pending payout', value: formatUsd(ms.pendingPayoutTotal) },
        { label: 'Chargebacks (30d)', value: formatNumber(ms.chargebackCount30d) },
        { label: 'Chargeback rate', value: formatPct(ms.chargebackRate) },
        { label: 'Won rate', value: formatPct(ms.chargebackWonRate) },
        { label: 'Active terminals', value: formatNumber(ms.activeTerminals) },
        { label: 'Param changes (7d)', value: formatNumber(ms.parameterChanges7d) },
      ],
      routes: routesForModule('merchant_services'),
    },
    {
      title: 'AI / Websites',
      rows: [
        { label: 'Active merchants', value: formatNumber(ai.activeMerchants) },
        { label: 'Usage events MTD', value: formatNumber(ai.totalUsageEventsMtd) },
        { label: 'Computed revenue MTD', value: formatCents(ai.computedRevenueMtdCents) },
        { label: 'Invoiced MTD', value: formatCents(ai.invoicedMtdCents) },
        { label: 'Collected MTD', value: formatCents(ai.collectedMtdCents) },
        { label: 'Outstanding', value: formatCents(ai.outstandingCents) },
        { label: 'Top product', value: ai.topProductByRevenue.replace(/_/g, ' ') },
        { label: 'Avg revenue / merchant', value: formatCents(ai.averageUsagePerMerchantCents) },
      ],
      routes: routesForModule('ai_billing'),
    },
  ];

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Operations Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Cross-module KPI roll-ups with deep-links to each operational surface.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <section key={s.title} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">{s.title}</h2>
            <dl className="px-4 py-3 space-y-1.5 text-sm">
              {s.rows.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-3 py-1 border-b border-gray-50 last:border-0">
                  <dt className="text-gray-600">{r.label}</dt>
                  <dd className="font-semibold text-gray-900">{r.value}</dd>
                </div>
              ))}
            </dl>
            <div className="px-4 py-3 border-t border-gray-100 space-y-1">
              {s.routes.map((r) => (
                <button
                  key={r.path}
                  onClick={() => navigate(r.path)}
                  className="w-full flex items-center justify-between text-xs text-indigo-700 hover:text-indigo-900 py-1"
                >
                  <span>{r.label}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
