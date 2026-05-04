import React from 'react';

type Tone = 'default' | 'brand' | 'emerald' | 'amber' | 'red' | 'blue' | 'violet';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ElementType;
  tone?: Tone;
  trend?: { value: string; isPositive: boolean };
  onClick?: () => void;
}

const toneTopBorder: Record<Tone, string> = {
  default: 'border-t-gray-200',
  brand: 'border-t-brand',
  emerald: 'border-t-emerald-500',
  amber: 'border-t-amber-500',
  red: 'border-t-red-500',
  blue: 'border-t-blue-500',
  violet: 'border-t-violet-500',
};

const toneIcon: Record<Tone, string> = {
  default: 'text-gray-400',
  brand: 'text-brand',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  red: 'text-red-500',
  blue: 'text-blue-500',
  violet: 'text-violet-500',
};

export function KpiCard({ label, value, sub, icon: Icon, tone = 'default', trend, onClick }: KpiCardProps) {
  const interactive = !!onClick;
  return (
    <div
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={`bg-white rounded-[8px] border border-gray-200 border-t-[3px] ${toneTopBorder[tone]} px-4 py-3.5 ${
        interactive ? 'cursor-pointer hover:shadow-sm hover:border-gray-300 transition-all' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className={`w-3.5 h-3.5 ${toneIcon[tone]}`} />}
        <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-[22px] leading-tight font-bold tabular-nums text-gray-900">{value}</p>
        {trend && (
          <span className={`text-[11px] font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
