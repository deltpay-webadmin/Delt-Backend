import React from 'react';

type Tone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'violet'
  | 'amber';

interface BackendBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Subtle = light tinted background; solid = filled background; outline = border only. */
  appearance?: 'subtle' | 'solid' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

const subtle: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  brand: 'bg-brand/10 text-brand',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
  violet: 'bg-violet-50 text-violet-700',
  amber: 'bg-amber-50 text-amber-700',
};

const solid: Record<Tone, string> = {
  neutral: 'bg-gray-700 text-white',
  brand: 'bg-brand text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-600 text-white',
  info: 'bg-sky-600 text-white',
  violet: 'bg-violet-600 text-white',
  amber: 'bg-amber-500 text-white',
};

const outline: Record<Tone, string> = {
  neutral: 'border border-gray-200 text-gray-700',
  brand: 'border border-brand/30 text-brand',
  success: 'border border-emerald-200 text-emerald-700',
  warning: 'border border-amber-200 text-amber-700',
  danger: 'border border-red-200 text-red-700',
  info: 'border border-sky-200 text-sky-700',
  violet: 'border border-violet-200 text-violet-700',
  amber: 'border border-amber-200 text-amber-700',
};

const sizeClasses = {
  sm: 'h-5 px-1.5 text-[10px] gap-1 rounded',
  md: 'h-6 px-2 text-[11px] gap-1 rounded-[5px]',
};

export function BackendBadge({
  tone = 'neutral',
  appearance = 'subtle',
  size = 'md',
  icon,
  className = '',
  children,
  ...rest
}: BackendBadgeProps) {
  const palette =
    appearance === 'solid' ? solid[tone] : appearance === 'outline' ? outline[tone] : subtle[tone];
  return (
    <span
      className={`inline-flex items-center font-semibold whitespace-nowrap ${palette} ${sizeClasses[size]} ${className}`}
      {...rest}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </span>
  );
}
