import React, { useState } from 'react';
import {
  DollarSign,
  Download,
  CheckCircle,
  Clock,
  Calendar,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CommissionLine {
  merchant: string;
  volume: number;
  rate: number;
  deltCut: number;
  agentShare: number;
  type: 'MCA' | 'Lease' | 'Residual';
}

const currentPeriod = {
  month: 'April 2026',
  totalEarned: 6555,
  status: 'Pending' as const,
  paymentDate: 'April 15, 2026',
  dealsCount: 5,
};

const commissionLines: CommissionLine[] = [
  { merchant: 'Metro Diner Group', volume: 75000, rate: 3.0, deltCut: 2250, agentShare: 1575, type: 'MCA' },
  { merchant: 'Bright Auto Sales', volume: 120000, rate: 2.5, deltCut: 3000, agentShare: 2100, type: 'Residual' },
  { merchant: 'Sunset Logistics LLC', volume: 50000, rate: 3.0, deltCut: 1500, agentShare: 1050, type: 'MCA' },
  { merchant: 'Peak Construction Co', volume: 95000, rate: 2.0, deltCut: 1900, agentShare: 1330, type: 'Lease' },
  { merchant: 'Apex Fitness Studio', volume: 40000, rate: 2.5, deltCut: 1000, agentShare: 500, type: 'MCA' },
];

const totalVolume = commissionLines.reduce((s, c) => s + c.volume, 0);
const totalDeltCut = commissionLines.reduce((s, c) => s + c.deltCut, 0);
const totalAgentShare = commissionLines.reduce((s, c) => s + c.agentShare, 0);

const historicalStatements = [
  { month: 'March 2026', earned: 5820, deals: 4, status: 'Paid', paidDate: 'Mar 15, 2026' },
  { month: 'February 2026', earned: 4290, deals: 3, status: 'Paid', paidDate: 'Feb 15, 2026' },
  { month: 'January 2026', earned: 7110, deals: 6, status: 'Paid', paidDate: 'Jan 15, 2026' },
  { month: 'December 2025', earned: 3680, deals: 3, status: 'Paid', paidDate: 'Dec 15, 2025' },
  { month: 'November 2025', earned: 5940, deals: 5, status: 'Paid', paidDate: 'Nov 15, 2025' },
];

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const fmtFull = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getTypeStyle(type: string) {
  switch (type) {
    case 'MCA': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Lease': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Residual': return 'bg-teal-50 text-teal-700 border-teal-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function AgentCommissions() {
  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
          <p className="text-sm text-gray-500 mt-1">Track your earnings and download statements.</p>
        </div>
        <button
          onClick={() => {
            downloadCSV('commissions-all.csv', [
              ['Period', 'Earned', 'Deals', 'Status', 'Paid Date'],
              [currentPeriod.month, currentPeriod.totalEarned, currentPeriod.dealsCount, currentPeriod.status, currentPeriod.paymentDate],
              ...historicalStatements.map(s => [s.month, s.earned, s.deals, s.status, s.paidDate]),
            ]);
            toast.success('Exported');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-[6px] text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* Current Period Card */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Current Period</h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            {currentPeriod.status}
          </span>
        </div>
        <div className="px-5 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Period</p>
              <p className="text-sm font-semibold text-gray-900">{currentPeriod.month}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-emerald-600">{fmt(currentPeriod.totalEarned)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Deals This Period</p>
              <p className="text-sm font-semibold text-gray-900">{currentPeriod.dealsCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Expected Payment</p>
              <p className="text-sm font-semibold text-gray-900">{currentPeriod.paymentDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Statement Table */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Statement — {currentPeriod.month}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Merchant Name</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Volume</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Rate</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Delt's Cut</th>
                <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Your Share</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commissionLines.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.merchant}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(c.volume)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{c.rate.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmtFull(c.deltCut)}</td>
                  <td className="px-4 py-3 text-right font-medium text-emerald-600">{fmtFull(c.agentShare)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 text-xs border rounded-md ${getTypeStyle(c.type)}`}>
                      {c.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td className="px-4 py-3 font-semibold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmt(totalVolume)}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right font-semibold text-gray-900">{fmtFull(totalDeltCut)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-600">{fmtFull(totalAgentShare)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Historical Statements */}
      <div className="bg-white rounded-[8px] border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historical Statements</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {historicalStatements.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-[8px] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.month}</p>
                  <p className="text-xs text-gray-500">{s.deals} deals • Paid {s.paidDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{fmt(s.earned)}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle className="w-3 h-3" />
                    {s.status}
                  </span>
                </div>
                <button
                  onClick={() => {
                    downloadCSV(`${s.month.replace(/\s+/g, '-')}-statement.csv`, [
                      ['Period', 'Earned', 'Deals', 'Status', 'Paid Date'],
                      [s.month, s.earned, s.deals, s.status, s.paidDate],
                    ]);
                    toast.success('Exported');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
