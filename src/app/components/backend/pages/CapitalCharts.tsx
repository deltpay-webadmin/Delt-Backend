import React from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, AlertTriangle, Clock, Gauge } from 'lucide-react';

/**
 * Portfolio charts strip for the Capital dashboard.
 * All charts render at all times — when the underlying series is empty they
 * overlay a small "No data yet" hint, preserving the layout so the dashboard
 * looks the same with $0 deals as with a live book.
 */
export function PortfolioCharts({ M }: { M: any }) {
  const hasCollections = (M.trendDays || []).some((d: any) => d.collected > 0);
  const hasVintages = (M.vintageTrend || []).length > 0;
  const hasAging = (M.agingBuckets || []).some((b: any) => b.count > 0);
  const hasNsf = (M.nsfWeeks || []).some((w: any) => w.bounces > 0 || w.debits > 0);

  const tooltipProps = {
    contentStyle: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: 6,
      fontSize: 11,
      padding: '6px 8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    },
    labelStyle: { color: '#6b7280', fontWeight: 600, marginBottom: 2 },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard
        title="Collections (last 30 days)"
        subtitle="From loan_payments ledger"
        icon={<TrendingUp className="w-4 h-4 text-brand" />}
        empty={!hasCollections}
        emptyHint="Daily ACH collections will graph here once payments land."
        height={220}
      >
        <AreaChart data={M.trendDays} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="collectionsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
            width={50}
          />
          <Tooltip {...tooltipProps} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Collected']} />
          <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2} fill="url(#collectionsFill)" />
        </AreaChart>
      </ChartCard>

      <ChartCard
        title="Default Rate by Vintage"
        subtitle="% of deals in default by funded month"
        icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
        empty={!hasVintages}
        emptyHint="Vintage cohorts appear once deals fund across multiple months."
        height={220}
      >
        <LineChart data={M.vintageTrend} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}%`}
            width={40}
          />
          <Tooltip {...tooltipProps} formatter={(v: number) => [`${v.toFixed(1)}%`, 'Default rate']} />
          <Line type="monotone" dataKey="defaultRate" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} />
        </LineChart>
      </ChartCard>

      <ChartCard
        title="Outstanding by Aging Bucket"
        subtitle="Active book by days past due"
        icon={<Clock className="w-4 h-4 text-amber-500" />}
        empty={!hasAging}
        emptyHint="Outstanding balances bucket by DPD here once the book is live."
        height={220}
      >
        <BarChart data={M.agingBuckets} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`)}
            width={50}
          />
          <Tooltip
            {...tooltipProps}
            formatter={(v: number, _name: string, item: any) => [
              `$${v.toLocaleString()} · ${item.payload.count} deals`,
              'Outstanding',
            ]}
          />
          <Bar dataKey="outstanding" radius={[4, 4, 0, 0]}>
            {M.agingBuckets.map((_b: any, i: number) => {
              const color = i === 0 ? '#10b981' : i === 1 ? '#f59e0b' : i === 2 ? '#f97316' : '#ef4444';
              return <Cell key={i} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ChartCard>

      <ChartCard
        title="NSF & Debits (last 8 weeks)"
        subtitle="ACH attempts vs bounces"
        icon={<Gauge className="w-4 h-4 text-amber-500" />}
        empty={!hasNsf}
        emptyHint="Weekly NSF activity charts here once ACH debits run."
        height={220}
      >
        <BarChart data={M.nsfWeeks} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
          <Tooltip {...tooltipProps} />
          <Bar dataKey="debits" name="Debits" stackId="a" fill="#a5b4fc" />
          <Bar dataKey="bounces" name="NSF" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  icon,
  empty,
  emptyHint,
  height,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  empty?: boolean;
  emptyHint?: string;
  height: number;
  children: React.ReactElement;
}) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
      <div style={{ height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
        {empty && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[1px] rounded-[6px]">
            <span className="text-xs font-medium text-gray-500">No data yet</span>
            {emptyHint && (
              <span className="text-[11px] text-gray-400 mt-0.5 max-w-[260px] text-center px-2">{emptyHint}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
