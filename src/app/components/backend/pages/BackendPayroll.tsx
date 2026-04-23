import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  Eye,
  AlertCircle,
  Users,
  UserCircle,
  XCircle,
  CreditCard,
  Banknote,
  FileText,
} from 'lucide-react';

// ── Types ──
type PayeeCategory = 'Employee' | 'Agent Commission';
type PaymentMethod = 'Direct Deposit' | 'Check';
type RunStatus = 'Processed' | 'Pending' | 'Failed';

interface PayrollLineItem {
  id: string;
  name: string;
  category: PayeeCategory;
  type: 'Salary' | 'Hourly' | 'Commission';
  grossPay: number;
  deductions: number;
  taxes: number;
  netPay: number;
  paymentMethod: PaymentMethod;
}

interface PayrollRun {
  id: string;
  payDate: string;
  period: string;
  totalGross: number;
  totalNet: number;
  employeesPaid: number;
  agentsPaid: number;
  status: RunStatus;
}

// ── Data ──
const upcomingItems: PayrollLineItem[] = [
  // Employees
  { id: 'P-001', name: 'Carlos Rivera', category: 'Employee', type: 'Salary', grossPay: 6041.67, deductions: 420, taxes: 1450, netPay: 4171.67, paymentMethod: 'Direct Deposit' },
  { id: 'P-002', name: 'Patrick Oduya', category: 'Employee', type: 'Salary', grossPay: 5208.33, deductions: 380, taxes: 1250, netPay: 3578.33, paymentMethod: 'Direct Deposit' },
  { id: 'P-003', name: 'Jason Park', category: 'Employee', type: 'Salary', grossPay: 4583.33, deductions: 350, taxes: 1100, netPay: 3133.33, paymentMethod: 'Direct Deposit' },
  { id: 'P-004', name: 'Lyndon Tate', category: 'Employee', type: 'Salary', grossPay: 4083.33, deductions: 310, taxes: 980, netPay: 2793.33, paymentMethod: 'Direct Deposit' },
  { id: 'P-005', name: 'Nina Voskresenskaya', category: 'Employee', type: 'Hourly', grossPay: 6800.00, deductions: 0, taxes: 1632, netPay: 5168.00, paymentMethod: 'Check' },
  // Agent Commissions
  { id: 'P-006', name: 'Sarah Johnson', category: 'Agent Commission', type: 'Commission', grossPay: 4250.00, deductions: 0, taxes: 1020, netPay: 3230.00, paymentMethod: 'Direct Deposit' },
  { id: 'P-007', name: 'Michael Chen', category: 'Agent Commission', type: 'Commission', grossPay: 3800.00, deductions: 0, taxes: 912, netPay: 2888.00, paymentMethod: 'Direct Deposit' },
  { id: 'P-008', name: 'James Miller', category: 'Agent Commission', type: 'Commission', grossPay: 5100.00, deductions: 0, taxes: 1224, netPay: 3876.00, paymentMethod: 'Direct Deposit' },
];

const pastRuns: PayrollRun[] = [
  { id: 'RUN-007', payDate: 'Apr 1, 2026', period: 'Mar 16–31', totalGross: 38_420, totalNet: 27_650, employeesPaid: 5, agentsPaid: 3, status: 'Processed' },
  { id: 'RUN-006', payDate: 'Mar 15, 2026', period: 'Mar 1–15', totalGross: 37_890, totalNet: 27_210, employeesPaid: 5, agentsPaid: 3, status: 'Processed' },
  { id: 'RUN-005', payDate: 'Mar 1, 2026', period: 'Feb 16–28', totalGross: 36_500, totalNet: 26_120, employeesPaid: 5, agentsPaid: 2, status: 'Processed' },
  { id: 'RUN-004', payDate: 'Feb 15, 2026', period: 'Feb 1–15', totalGross: 35_200, totalNet: 25_400, employeesPaid: 4, agentsPaid: 3, status: 'Processed' },
  { id: 'RUN-003', payDate: 'Feb 1, 2026', period: 'Jan 16–31', totalGross: 34_800, totalNet: 24_900, employeesPaid: 4, agentsPaid: 3, status: 'Failed' },
  { id: 'RUN-002', payDate: 'Jan 15, 2026', period: 'Jan 1–15', totalGross: 33_600, totalNet: 24_100, employeesPaid: 4, agentsPaid: 2, status: 'Processed' },
];

// ── Helpers ──
const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const runStatusCls = (s: RunStatus) => {
  switch (s) {
    case 'Processed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Failed': return 'bg-red-50 text-red-600 border-red-200';
  }
};

const runStatusIcon = (s: RunStatus) => {
  switch (s) {
    case 'Processed': return <CheckCircle className="w-3.5 h-3.5" />;
    case 'Pending': return <Clock className="w-3.5 h-3.5" />;
    case 'Failed': return <XCircle className="w-3.5 h-3.5" />;
  }
};

const categoryCls = (c: PayeeCategory) =>
  c === 'Employee'
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
    : 'bg-purple-50 text-purple-700 border-purple-200';

const typeCls = (t: string) => {
  switch (t) {
    case 'Salary': return 'bg-blue-50 text-blue-700';
    case 'Hourly': return 'bg-amber-50 text-amber-700';
    case 'Commission': return 'bg-emerald-50 text-emerald-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

// ── Stat Card ──
function StatCard({ label, value, icon, sub, highlight }: { label: string; value: string; icon: React.ReactNode; sub?: string; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-[8px] border p-5 ${highlight ? 'border-brand/30 ring-1 ring-brand/10' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        <div className={highlight ? 'text-brand' : 'text-gray-400'}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════
export function BackendPayroll() {
  const [tab, setTab] = useState<'upcoming' | 'history' | 'calendar'>('upcoming');

  const employeeItems = upcomingItems.filter(i => i.category === 'Employee');
  const agentItems = upcomingItems.filter(i => i.category === 'Agent Commission');

  const totalGross = upcomingItems.reduce((s, i) => s + i.grossPay, 0);
  const totalDeductions = upcomingItems.reduce((s, i) => s + i.deductions, 0);
  const totalTaxes = upcomingItems.reduce((s, i) => s + i.taxes, 0);
  const totalNet = upcomingItems.reduce((s, i) => s + i.netPay, 0);

  const lastPayroll = 27_650;
  const ytdPayroll = 312_480;

  return (
    <div className="h-full flex flex-col bg-canvas">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
            <p className="text-sm text-gray-600 mt-1">Manage employee and agent commission payouts</p>
          </div>
          <button className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2">
            <Banknote className="w-4 h-4" /> Run Payroll
          </button>
        </div>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Next Pay Date" value="Apr 15, 2026" icon={<Calendar className="w-5 h-5" />} sub="Semi-monthly — in 6 days" highlight />
          <StatCard label="Payroll Amount" value={fmt(totalNet)} icon={<DollarSign className="w-5 h-5" />} sub={`${upcomingItems.length} payees`} />
          <StatCard label="Last Payroll Paid" value={fmt(lastPayroll)} icon={<CheckCircle className="w-5 h-5" />} sub="Apr 1, 2026" />
          <StatCard label="YTD Payroll" value={fmt(ytdPayroll)} icon={<TrendingUp className="w-5 h-5" />} sub="Jan 1 – Apr 9, 2026" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {(['upcoming', 'history', 'calendar'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Upcoming Tab ── */}
        {tab === 'upcoming' && (
          <div className="space-y-6">
            {/* Pay period info */}
            <div className="flex items-center gap-4 px-4 py-3 bg-brand/5 border border-brand/15 rounded-[8px]">
              <Calendar className="w-5 h-5 text-brand" />
              <div>
                <p className="text-sm font-medium text-gray-900">Pay Period: Apr 1–15, 2026</p>
                <p className="text-xs text-gray-500">Scheduled for Apr 15, 2026 &middot; Semi-monthly cycle</p>
              </div>
            </div>

            {/* Employees Section */}
            <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-semibold text-gray-900">Employees</h3>
                <span className="text-xs text-gray-500">({employeeItems.length})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Type</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Gross Pay</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Deductions</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Taxes</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Net Pay</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employeeItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeCls(item.type)}`}>{item.type}</span></td>
                        <td className="px-5 py-3 text-sm text-gray-700 text-right">{fmt(item.grossPay)}</td>
                        <td className="px-5 py-3 text-sm text-gray-500 text-right">{item.deductions > 0 ? `-${fmt(item.deductions)}` : '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-500 text-right">-{fmt(item.taxes)}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(item.netPay)}</td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600">
                            {item.paymentMethod === 'Direct Deposit' ? <CreditCard className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            {item.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Agent Commissions Section */}
            <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Agent Commissions</h3>
                <span className="text-xs text-gray-500">({agentItems.length})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Agent</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Type</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Gross Pay</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Deductions</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Taxes</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Net Pay</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {agentItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeCls(item.type)}`}>{item.type}</span></td>
                        <td className="px-5 py-3 text-sm text-gray-700 text-right">{fmt(item.grossPay)}</td>
                        <td className="px-5 py-3 text-sm text-gray-500 text-right">{item.deductions > 0 ? `-${fmt(item.deductions)}` : '—'}</td>
                        <td className="px-5 py-3 text-sm text-gray-500 text-right">-{fmt(item.taxes)}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(item.netPay)}</td>
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-1.5 text-xs text-gray-600">
                            <CreditCard className="w-3.5 h-3.5" />{item.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Row */}
            <div className="bg-white rounded-[8px] border border-gray-200 p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Gross</p>
                  <p className="text-lg font-bold text-gray-900">{fmt(totalGross)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Deductions</p>
                  <p className="text-lg font-bold text-red-600">-{fmt(totalDeductions)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Taxes</p>
                  <p className="text-lg font-bold text-red-600">-{fmt(totalTaxes)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Net Pay</p>
                  <p className="text-lg font-bold text-brand">{fmt(totalNet)}</p>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Review all line items before approving. Approved payroll is final.
                </div>
                <button className="px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Approve & Run
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Calendar Tab ── */}
        {tab === 'calendar' && (
          <div className="space-y-6">
            {/* Calendar Grid */}
            <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Payroll Calendar — April 2026</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand" /> Pay Date</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400" /> Deadline</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-400" /> Completed</span>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-[8px] overflow-hidden">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                    <div key={d} className="bg-gray-50 px-2 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase">{d}</div>
                  ))}
                  {/* April 2026 starts on Wednesday */}
                  {[null, null, null].map((_, i) => <div key={`e${i}`} className="bg-white p-2 min-h-[72px]" />)}
                  {Array.from({length: 30}, (_, i) => i + 1).map(day => {
                    const isPayDay = day === 1 || day === 15;
                    const isDeadline = day === 10 || day === 25;
                    const isPast = day <= 9;
                    const isToday = day === 9;
                    return (
                      <div key={day} className={`bg-white p-2 min-h-[72px] ${isToday ? 'ring-2 ring-brand ring-inset' : ''}`}>
                        <span className={`text-xs font-medium ${isToday ? 'text-brand' : 'text-gray-700'}`}>{day}</span>
                        {isPayDay && (
                          <div className={`mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-brand/10 text-brand'}`}>
                            {isPast ? 'Paid' : 'Pay Day'}
                          </div>
                        )}
                        {isDeadline && (
                          <div className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700">
                            {day === 10 ? 'Tax Filing' : 'Timesheets Due'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Padding days */}
                  {[null, null].map((_, i) => <div key={`p${i}`} className="bg-white p-2 min-h-[72px]" />)}
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-[8px] border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Upcoming Deadlines</h3>
              <div className="space-y-2">
                {[
                  { date: 'Apr 10', label: 'Q1 Tax Filing Deadline', type: 'deadline' },
                  { date: 'Apr 15', label: 'Semi-Monthly Payroll — Employees + Agent Commissions', type: 'pay' },
                  { date: 'Apr 25', label: 'Timesheet Submission Deadline', type: 'deadline' },
                  { date: 'May 1', label: 'Semi-Monthly Payroll', type: 'pay' },
                ].map(item => (
                  <div key={item.date + item.label} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-[6px]">
                    <Calendar className={`w-4 h-4 shrink-0 ${item.type === 'pay' ? 'text-brand' : 'text-amber-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{item.label}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Commission Integration Summary */}
            <div className="bg-white rounded-[8px] border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserCircle className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Agent Commission Integration</h3>
                <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-0.5 font-medium">Live Sync</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Commission data auto-synced from Agent Commissions module. Last sync: 2 minutes ago.</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-[8px] p-3 text-center">
                  <p className="text-xl font-bold text-purple-700">$13,150</p>
                  <p className="text-[10px] text-purple-600 mt-0.5">Total Commissions This Period</p>
                </div>
                <div className="bg-purple-50 rounded-[8px] p-3 text-center">
                  <p className="text-xl font-bold text-purple-700">3</p>
                  <p className="text-[10px] text-purple-600 mt-0.5">Agents With Payouts</p>
                </div>
                <div className="bg-purple-50 rounded-[8px] p-3 text-center">
                  <p className="text-xl font-bold text-purple-700">7</p>
                  <p className="text-[10px] text-purple-600 mt-0.5">Deals Earning Commissions</p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-200 pt-3">
                <div className="space-y-2">
                  {[
                    { name: 'Sarah Johnson', deals: 3, amount: 4250 },
                    { name: 'Michael Chen', deals: 2, amount: 3800 },
                    { name: 'James Miller', deals: 2, amount: 5100 },
                  ].map(agent => (
                    <div key={agent.name} className="flex items-center justify-between text-sm px-3 py-2 bg-gray-50 rounded-[6px]">
                      <span className="text-gray-700 font-medium">{agent.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500">{agent.deals} deals</span>
                        <span className="font-semibold text-gray-900">${agent.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── History Tab ── */}
        {tab === 'history' && (
          <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Payroll History</h3>
              <p className="text-xs text-gray-500 mt-0.5">{pastRuns.length} payroll runs this year</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Pay Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Period</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Gross</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Net</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Employees</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Agents</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pastRuns.map(run => (
                    <tr key={run.id} className={`hover:bg-gray-50/50 ${run.status === 'Failed' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">{run.payDate}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{run.period}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 text-right">{fmt(run.totalGross)}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">{fmt(run.totalNet)}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 text-center">{run.employeesPaid}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 text-center">{run.agentsPaid}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${runStatusCls(run.status)}`}>
                          {runStatusIcon(run.status)}
                          {run.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors" title="View Detail">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors" title="Download Report">
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
