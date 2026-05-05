import React from 'react';
import {
  Store,
  DollarSign,
  TrendingUp,
  Percent,
  Phone,
  Mail,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Send,
  UserCheck,
  Banknote,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const agent = {
  name: 'Marcus Johnson',
  initials: 'MJ',
  role: 'Senior Sales Agent',
};

const summaryCards = [
  { label: 'My Merchants', value: '14', icon: Store, variant: 'indigo' as const, trend: '+2 this month' },
  { label: 'Monthly Volume', value: '$218,500', icon: DollarSign, variant: 'emerald' as const, trend: '+12.4% vs last month' },
  { label: "This Month's Commission", value: '$6,555', icon: Banknote, variant: 'purple' as const, trend: 'Payout: Apr 15' },
  { label: 'Conversion Rate', value: '34%', icon: Percent, variant: 'blue' as const, trend: '+3% vs avg' },
];

const variantMap = {
  indigo: { bg: 'bg-indigo-50 border-indigo-100', icon: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50 border-emerald-100', icon: 'text-emerald-600' },
  purple: { bg: 'bg-purple-50 border-purple-100', icon: 'text-purple-600' },
  blue: { bg: 'bg-blue-50 border-blue-100', icon: 'text-blue-600' },
};

const pipeline = [
  { stage: 'New', count: 8, color: 'bg-blue-500' },
  { stage: 'In Review', count: 5, color: 'bg-amber-500' },
  { stage: 'Approved', count: 3, color: 'bg-emerald-500' },
  { stage: 'Funded', count: 2, color: 'bg-indigo-600' },
  { stage: 'Declined', count: 1, color: 'bg-red-500' },
];

const pipelineTotal = pipeline.reduce((s, p) => s + p.count, 0);

const activity = [
  { icon: CheckCircle, iconColor: 'text-emerald-500', text: 'Metro Diner Group funded — $75,000 MCA', time: '2 hours ago' },
  { icon: Send, iconColor: 'text-indigo-500', text: 'Submitted Sunrise Cafe application to underwriting', time: '5 hours ago' },
  { icon: Phone, iconColor: 'text-blue-500', text: 'Follow-up call with Peak Construction — docs pending', time: 'Yesterday' },
  { icon: UserCheck, iconColor: 'text-purple-500', text: 'New lead assigned: Riverdale Dental Care', time: '2 days ago' },
  { icon: XCircle, iconColor: 'text-red-500', text: 'Greenfield Markets application declined — low credit', time: '3 days ago' },
];

const chartData = [
  { month: 'Nov', funded: 145000 },
  { month: 'Dec', funded: 95000 },
  { month: 'Jan', funded: 175000 },
  { month: 'Feb', funded: 120000 },
  { month: 'Mar', funded: 218500 },
  { month: 'Apr', funded: 75000 },
];

export function AgentDashboard() {
  return (
    <div className="px-6 py-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="delt-page-title">Welcome back, {agent.name}</h1>
        <p className="delt-page-subtitle">Here's your pipeline and performance overview for April 2026.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          const v = variantMap[card.variant];
          return (
            <div key={card.label} className={`${v.bg} border rounded-[8px] p-4 sm:p-5`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">{card.label}</p>
                <div className={v.icon}><Icon className="w-5 h-5" /></div>
              </div>
              <p className="text-xl sm:delt-page-title">{card.value}</p>
              <p className="text-xs mt-2 text-gray-500">{card.trend}</p>
            </div>
          );
        })}
      </div>

      {/* Pipeline + Activity row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini Pipeline */}
        <div className="delt-card">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Pipeline</h2>
            <p className="text-xs text-gray-500 mt-0.5">{pipelineTotal} total deals in pipeline</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            {/* Stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden">
              {pipeline.map((p) => (
                <div
                  key={p.stage}
                  className={`${p.color} transition-all`}
                  style={{ width: `${(p.count / pipelineTotal) * 100}%` }}
                />
              ))}
            </div>
            {/* Stage breakdown */}
            <div className="grid grid-cols-5 gap-2">
              {pipeline.map((p) => (
                <div key={p.stage} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${p.color}`} />
                    <span className="text-xs text-gray-500">{p.stage}</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{p.count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="delt-card">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="px-5 py-2">
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
                  <div className={`mt-0.5 ${a.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{a.text}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{a.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Funded Chart */}
      <div className="delt-card">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Monthly Funded Deals</h2>
          <p className="text-xs text-gray-500 mt-0.5">Your personal funding volume — last 6 months</p>
        </div>
        <div className="px-5 py-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Funded']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="funded" name="funded" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}