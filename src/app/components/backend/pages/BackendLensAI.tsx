import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  Send,
  Sparkles,
  Zap,
  Eye,
  Phone,
  DollarSign,
  Users,
  BarChart3,
  ArrowRight,
  MessageSquare,
  Clock,
  Activity,
  Target,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Tab = 'dashboard' | 'ask';

// ── Health Score Ring ──
function HealthRing({ score, size = 100 }: { score: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="delt-page-title">{score}</span>
        <span className="text-[10px] text-gray-500 -mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ── Data ──
const alerts = [
  {
    severity: 'critical' as const,
    title: 'Cash Shortfall Projected in 47 Days',
    desc: 'Based on current collection rates and upcoming capital obligations, net cash position will fall below the $50K safety threshold by late May. Three large COC payments due in the same week.',
    actions: ['View Forecast', 'Adjust Reserves'],
  },
  {
    severity: 'warning' as const,
    title: '3 Merchants Declining — Not Contacted 30+ Days',
    desc: 'Sunset Logistics, Coastal Seafood, and Riverdale Dental show declining ACH volumes with no agent touch-points in 30+ days. Estimated revenue at risk: $12,400/mo.',
    actions: ['Assign Outreach', 'View Merchants'],
  },
  {
    severity: 'warning' as const,
    title: 'Agent Commission Spike — Marcus J. +38% MoM',
    desc: 'Commission payout for Marcus J. increased 38% month-over-month. Driven by two large MCA deals funded in the same week. Review for compliance.',
    actions: ['Review Deals', 'Dismiss'],
  },
  {
    severity: 'info' as const,
    title: '4 Renewal Opportunities Ready',
    desc: 'Metro Diner, Bright Auto, Apex Fitness, and Peak Construction have all crossed the 50% repayment threshold. Combined renewal potential: $340K in new funding.',
    actions: ['Generate Offers', 'View Details'],
  },
  {
    severity: 'info' as const,
    title: 'Portfolio Concentration Alert — Transportation 28%',
    desc: 'Transportation & Logistics now represents 28% of deployed capital, exceeding the 25% sector concentration guideline. Consider diversifying new deal flow.',
    actions: ['View Breakdown', 'Acknowledge'],
  },
];

const sevConfig = {
  critical: { bg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100', icon: 'text-red-600', badge: 'bg-red-600 text-white' },
  warning: { bg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-100', icon: 'text-amber-600', badge: 'bg-amber-500 text-white' },
  info: { bg: 'bg-indigo-50/60 border-indigo-200', iconBg: 'bg-indigo-100', icon: 'text-indigo-600', badge: 'bg-indigo-600 text-white' },
};

const flowCastData = [
  { month: 'May', projected: 142000, low: 118000, high: 166000, actual: null },
  { month: 'Jun', projected: 155000, low: 125000, high: 185000, actual: null },
  { month: 'Jul', projected: 148000, low: 112000, high: 184000, actual: null },
  { month: 'Aug', projected: 162000, low: 128000, high: 196000, actual: null },
  { month: 'Sep', projected: 170000, low: 134000, high: 206000, actual: null },
  { month: 'Oct', projected: 178000, low: 140000, high: 216000, actual: null },
];

// prepend 2 months of actuals
const chartData = [
  { month: 'Mar', projected: 138000, low: 138000, high: 138000, actual: 138000 },
  { month: 'Apr', projected: 145000, low: 145000, high: 145000, actual: 131000 },
  ...flowCastData,
];

const suggestedPrompts = [
  { icon: Users, text: 'Which agents have the highest default rate over $50K?' },
  { icon: DollarSign, text: 'Projected cash position in 90 days?' },
  { icon: Phone, text: 'Merchants with declining volume not contacted 30 days.' },
  { icon: Target, text: 'What is our most profitable deal type this quarter?' },
];

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  table?: { headers: string[]; rows: string[][] };
  source?: string;
}

const sampleResponse: ChatMessage = {
  role: 'assistant',
  content:
    'Based on the current portfolio, **3 agents** have default rates exceeding the benchmark on deals over $50K. Marcus J. has the highest at 18.2%, driven primarily by two transportation-sector defaults in Q1 2026. Sarah K. follows at 12.5% with exposure concentrated in food & beverage. Devon R. sits at 8.3% — within acceptable range but trending upward.',
  table: {
    headers: ['Agent', 'Deals >$50K', 'Defaults', 'Default Rate', 'Total Exposure'],
    rows: [
      ['Marcus J.', '11', '2', '18.2%', '$142,000'],
      ['Sarah K.', '8', '1', '12.5%', '$81,000'],
      ['Devon R.', '12', '1', '8.3%', '$62,100'],
    ],
  },
  source: 'Analysis based on 31 deals funded since Jan 2025. Default defined as 60+ days delinquent. Data as of Apr 9, 2026.',
};

export function BackendLensAI() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text?: string) => {
    const msg = text || chatInput.trim();
    if (!msg) return;
    const userMsg: ChatMessage = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [...prev, sampleResponse]);
    }, 800);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="delt-page-title">Lens AI</h1>
            <p className="delt-page-subtitle">Predictive intelligence for your portfolio</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-[6px] p-0.5">
              <button
                onClick={() => setTab('dashboard')}
                className={`px-4 py-2 text-sm font-medium rounded-[4px] transition-all ${
                  tab === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setTab('ask')}
                className={`px-4 py-2 text-sm font-medium rounded-[4px] transition-all flex items-center gap-1.5 ${
                  tab === 'ask'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Lens
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {tab === 'dashboard' ? <DashboardTab /> : (
          <AskTab
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleSend={handleSend}
            chatEndRef={chatEndRef}
          />
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Dashboard Tab
// ════════════════════════════════════════
function DashboardTab() {
  return (
    <div className="space-y-6">
      {/* Portfolio Health Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Score */}
        <div className="delt-card p-5 flex flex-col items-center">
          <HealthRing score={74} size={96} />
          <p className="text-sm font-semibold text-gray-900 mt-3">Portfolio Health</p>
          <p className="text-xs text-gray-500">Good — 2 items need attention</p>
        </div>

        {/* Predicted Collections */}
        <div className="delt-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">+8.2%</span>
          </div>
          <p className="delt-page-title">$142K</p>
          <p className="delt-page-subtitle">Predicted Collections</p>
          <p className="text-xs text-gray-400 mt-0.5">Next 30 days</p>
        </div>

        {/* At-Risk Deals */}
        <div className="delt-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">+1 this week</span>
          </div>
          <p className="delt-page-title">5</p>
          <p className="delt-page-subtitle">At-Risk Deals</p>
          <p className="text-xs text-gray-400 mt-0.5">$214K total exposure</p>
        </div>

        {/* Renewal Opportunities */}
        <div className="delt-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">$340K potential</span>
          </div>
          <p className="delt-page-title">4</p>
          <p className="delt-page-subtitle">Renewal Opportunities</p>
          <p className="text-xs text-gray-400 mt-0.5">&gt;50% repaid</p>
        </div>
      </div>

      {/* Alerts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Intelligent Alerts</h2>
          <span className="text-xs text-gray-500">{alerts.length} active</span>
        </div>
        <div className="space-y-3">
          {alerts.map((alert, i) => {
            const sev = sevConfig[alert.severity];
            return (
              <div key={i} className={`${sev.bg} border rounded-[8px] p-4 sm:p-5 transition-all hover:shadow-sm`}>
                <div className="flex gap-4">
                  <div className={`w-9 h-9 ${sev.iconBg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {alert.severity === 'critical' ? (
                      <Zap className={`w-5 h-5 ${sev.icon}`} />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className={`w-5 h-5 ${sev.icon}`} />
                    ) : (
                      <Sparkles className={`w-5 h-5 ${sev.icon}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${sev.badge}`}>
                        {alert.severity}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900">{alert.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{alert.desc}</p>
                    <div className="flex items-center gap-2">
                      {alert.actions.map((action, j) => (
                        <button
                          key={j}
                          className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors ${
                            j === 0
                              ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
                              : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FlowCast Chart */}
      <div className="delt-card">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">FlowCast</h2>
            <p className="text-xs text-gray-500">Projected collections — 6 month outlook with confidence bands</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-indigo-600 rounded" />
              <span className="text-gray-600">Projected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-indigo-100 rounded-sm border border-indigo-200" />
              <span className="text-gray-600">Confidence Band</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600">Actuals</span>
            </div>
          </div>
        </div>
        <div className="px-5 py-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  domain={[80000, 'auto']}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '13px' }}
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = { projected: 'Projected', high: 'High', low: 'Low', actual: 'Actual' };
                    return [`$${value.toLocaleString()}`, labels[name] || name];
                  }}
                />
                {/* Confidence band */}
                <Area key="area-high" type="monotone" dataKey="high" stroke="none" fill="url(#bandGrad)" stackId="band" />
                <Area key="area-low" type="monotone" dataKey="low" stroke="none" fill="#fff" stackId="band-low" />
                {/* Projected line */}
                <Area key="area-projected" type="monotone" dataKey="projected" stroke="#6366F1" strokeWidth={2.5} fill="url(#projGrad)" />
                {/* Actuals */}
                <Area key="area-actual" type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2.5} fill="none" dot={(props: any) => {
                  if (props.payload?.actual == null) return null;
                  return <circle key={`dot-actual-${props.cx}-${props.cy}`} cx={props.cx} cy={props.cy} r={4} fill="#10B981" stroke="#fff" strokeWidth={2} />;
                }} connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Ask Lens Tab
// ════════════════════════════════════════
function AskTab({
  messages,
  chatInput,
  setChatInput,
  handleSend,
  chatEndRef,
}: {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  handleSend: (text?: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 260px)' }}>
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 max-w-xl mx-auto text-center">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
              <Sparkles className="w-7 h-7 text-brand" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Ask Lens anything</h2>
            <p className="text-sm text-gray-500 mb-8">
              Query your portfolio data using natural language. Lens analyzes deals, merchants, agents, and financial projections in real time.
            </p>
            <div className="w-full space-y-2.5">
              {suggestedPrompts.map((prompt, i) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt.text)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-white border border-gray-200 rounded-[8px] text-left hover:border-brand/30 hover:bg-indigo-50/30 transition-all group"
                  >
                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                      <Icon className="w-4 h-4 text-brand" />
                    </div>
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{prompt.text}</span>
                    <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-brand transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat Messages */
          <div className="max-w-3xl mx-auto space-y-6 py-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'user' ? (
                  <div className="max-w-md px-4 py-3 bg-brand text-white rounded-2xl rounded-br-md text-sm">
                    {msg.content}
                  </div>
                ) : (
                  <div className="max-w-2xl">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-1">
                        <Brain className="w-4 h-4 text-brand" />
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-5 py-4">
                        {/* Markdown-ish render */}
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {msg.content.split('**').map((part, j) =>
                            j % 2 === 1 ? (
                              <span key={j} className="font-semibold text-gray-900">{part}</span>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )}
                        </p>
                        {msg.table && (
                          <div className="mt-4 overflow-x-auto rounded-md border border-gray-200">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-gray-50">
                                  {msg.table.headers.map((h, j) => (
                                    <th key={j} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {msg.table.rows.map((row, j) => (
                                  <tr key={j}>
                                    {row.map((cell, k) => (
                                      <td key={k} className="px-3 py-2 text-gray-700 whitespace-nowrap">{cell}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        {msg.source && (
                          <p className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-1.5">
                            <Eye className="w-3 h-3" />
                            {msg.source}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="border-t border-gray-200 bg-white rounded-b-[8px] px-5 py-4 mt-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Lens about your portfolio..."
                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand focus:bg-white transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={!chatInput.trim()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] flex items-center justify-center transition-all ${
                  chatInput.trim() ? 'bg-brand hover:bg-brand-hover' : 'bg-gray-200'
                }`}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">Lens AI analyzes your live portfolio data. Responses are generated insights, not financial advice.</p>
        </div>
      </div>
    </div>
  );
}