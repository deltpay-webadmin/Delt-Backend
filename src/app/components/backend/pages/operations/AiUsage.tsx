import React, { useMemo } from 'react';
import { Sparkles, Globe, Phone, Mail } from 'lucide-react';
import {
  AI_PRODUCTS,
  MOCK_USAGE_EVENTS,
  MOCK_AI_USAGE_KPIS,
  type AiUsageProduct,
  formatCents,
  formatNumber,
  formatDateTime,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

const PRODUCT_ICONS: Record<AiUsageProduct, any> = {
  website_hosting: Globe,
  website_traffic: Globe,
  lens_ai_chat: Sparkles,
  lens_ai_completion: Sparkles,
  lens_ai_embedding: Sparkles,
  ai_phone_minutes: Phone,
  ai_email_send: Mail,
};

/**
 * AI Usage — per-merchant usage events across AI/Website products.
 * Drives the metering/billing pipeline.
 */
export function AiUsage() {
  const productSummaries = useMemo(() => {
    return AI_PRODUCTS.map((p) => {
      const events = MOCK_USAGE_EVENTS.filter((e) => e.product === p.product);
      const quantity = events.reduce((s, e) => s + e.quantity, 0);
      const revenueCents = events.reduce((s, e) => s + e.computedCostCents, 0);
      const merchantSet = new Set(events.map((e) => e.merchantId));
      return { product: p, quantity, revenueCents, merchantCount: merchantSet.size, eventCount: events.length };
    });
  }, []);

  const totals = MOCK_AI_USAGE_KPIS;

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">AI Usage</h1>
        <p className="text-sm text-gray-500 mt-1">Per-merchant usage events across AI and Website products feeding the billing pipeline.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Active merchants</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{totals.activeMerchants}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Usage events MTD</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatNumber(totals.totalUsageEventsMtd)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Computed revenue MTD</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCents(totals.computedRevenueMtdCents)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Avg revenue / merchant</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCents(totals.averageUsagePerMerchantCents)}</p>
        </div>
      </section>

      {/* Product breakdown */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Products</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Product</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Unit</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Unit price</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Quantity</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Events</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Merchants</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productSummaries.map((s) => {
              const Icon = PRODUCT_ICONS[s.product.product];
              return (
                <tr key={s.product.product} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-indigo-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{s.product.label}</p>
                        <p className="text-xs text-gray-500">{s.product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-700">{s.product.meterUnit}</td>
                  <td className="px-4 py-2 text-gray-700">{formatCents(s.product.unitPriceCents, { precise: true })}</td>
                  <td className="px-4 py-2">{formatNumber(s.quantity)}</td>
                  <td className="px-4 py-2">{s.eventCount}</td>
                  <td className="px-4 py-2">{s.merchantCount}</td>
                  <td className="px-4 py-2 text-emerald-700 font-medium">{formatCents(s.revenueCents)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Event stream */}
      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Recent usage events</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Event</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Merchant</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Product</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Qty</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Cost</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Occurred</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {MOCK_USAGE_EVENTS.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs text-gray-700">{e.id}</td>
                <td className="px-4 py-2 text-gray-900">{e.merchantId}</td>
                <td className="px-4 py-2"><OpsStatusPill status={e.product} tone="info" /></td>
                <td className="px-4 py-2">{formatNumber(e.quantity)}</td>
                <td className="px-4 py-2 text-emerald-700">{formatCents(e.computedCostCents, { precise: true })}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{formatDateTime(e.occurredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
