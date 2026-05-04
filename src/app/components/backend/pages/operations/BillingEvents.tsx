import React, { useMemo, useState } from 'react';
import { Receipt, FileText } from 'lucide-react';
import {
  MOCK_INVOICES,
  MOCK_BILLING_EVENTS,
  MOCK_AI_USAGE_KPIS,
  INVOICE_STATUSES,
  type InvoiceStatus,
  formatCents,
  formatDate,
  formatDateTime,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

/**
 * Billing Events — invoices and event stream for AI/Website billing.
 */
export function BillingEvents() {
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');

  const filtered = useMemo(
    () => MOCK_INVOICES.filter((i) => (filter === 'all' ? true : i.status === filter)),
    [filter],
  );

  const totals = MOCK_AI_USAGE_KPIS;

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Billing Events</h1>
        <p className="text-sm text-gray-500 mt-1">Invoices, payments, and the event stream feeding accounting.</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2"><Receipt className="w-4 h-4 text-indigo-600" /><p className="text-xs font-semibold text-gray-700">Invoiced MTD</p></div>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatCents(totals.invoicedMtdCents)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Collected MTD</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatCents(totals.collectedMtdCents)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700">Outstanding</p>
          <p className="text-xl font-bold text-amber-700 mt-1">{formatCents(totals.outstandingCents)}</p>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | InvoiceStatus)}
          className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
        >
          <option value="all">All statuses</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Invoices</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Number</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Merchant</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Period</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Lines</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Total</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Due</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Status</th>
              <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Paid at</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs text-gray-700">{i.number}</td>
                <td className="px-4 py-2 text-gray-900">{i.merchantName}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{formatDate(i.periodStart)} — {formatDate(i.periodEnd)}</td>
                <td className="px-4 py-2">{i.lines.length}</td>
                <td className="px-4 py-2 font-medium">{formatCents(i.totalCents)}</td>
                <td className="px-4 py-2 text-amber-700">{formatCents(i.amountDueCents)}</td>
                <td className="px-4 py-2"><OpsStatusPill status={i.status} /></td>
                <td className="px-4 py-2 text-xs text-gray-500">{formatDateTime(i.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4 text-gray-600" /><h2 className="font-semibold text-gray-900">Event stream</h2></div>
        <ul className="space-y-2">
          {MOCK_BILLING_EVENTS.map((e) => (
            <li key={e.id} className="flex items-center justify-between text-sm border-b border-gray-50 last:border-0 py-2">
              <div className="flex items-center gap-2">
                <OpsStatusPill status={e.type.split('.').pop() ?? e.type} />
                <span className="font-mono text-xs text-gray-500">{e.invoiceId ?? e.subjectId}</span>
                <span className="text-gray-700">merchant {e.merchantId}</span>
              </div>
              <div className="text-xs text-gray-500">
                {e.amountCents != null && <span className="mr-3 text-gray-700">{formatCents(e.amountCents)}</span>}
                {formatDateTime(e.occurredAt)}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
