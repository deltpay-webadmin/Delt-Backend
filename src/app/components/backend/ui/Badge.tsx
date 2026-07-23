/**
 * Badge — standard status / category pill for the Delt backend.
 *
 * One pill shape (rounded-full) with a fixed tone palette so status and
 * category chips stop drifting across pages. Each tone is a bg-50 / text-700
 * pair (plus an optional matching border).
 *
 *   <Badge tone="green">Funded</Badge>
 *   <Badge tone="amber" bordered>At Risk</Badge>
 */

import React from 'react';
import { cn } from '../../ui/utils';

export type BadgeTone =
  | 'gray'
  | 'brand'
  | 'green'
  | 'amber'
  | 'red'
  | 'blue'
  | 'violet'
  | 'sky';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  tone?: BadgeTone;
  size?: BadgeSize;
  bordered?: boolean;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const TONES: Record<BadgeTone, { base: string; border: string }> = {
  gray: { base: 'bg-gray-100 text-gray-700', border: 'border border-gray-200' },
  brand: { base: 'bg-brand-50 text-brand', border: 'border border-brand-200' },
  green: { base: 'bg-emerald-50 text-emerald-700', border: 'border border-emerald-200' },
  amber: { base: 'bg-amber-50 text-amber-700', border: 'border border-amber-200' },
  red: { base: 'bg-red-50 text-red-700', border: 'border border-red-200' },
  blue: { base: 'bg-blue-50 text-blue-700', border: 'border border-blue-200' },
  violet: { base: 'bg-violet-50 text-violet-700', border: 'border border-violet-200' },
  sky: { base: 'bg-sky-50 text-sky-700', border: 'border border-sky-200' },
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px] gap-1 [&_svg]:w-3 [&_svg]:h-3',
  md: 'px-2.5 py-1 text-xs gap-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5',
};

export function Badge({
  tone = 'gray',
  size = 'md',
  bordered = false,
  icon,
  className,
  children,
}: BadgeProps) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        t.base,
        bordered && t.border,
        SIZES[size],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
