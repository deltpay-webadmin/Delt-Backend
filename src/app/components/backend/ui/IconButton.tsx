/**
 * IconButton — square, icon-only action (row actions, close buttons, toolbar).
 *
 * Standardizes the many `p-2 hover:bg-gray-100 rounded-[8px]` icon buttons.
 * Always pass `aria-label` for accessibility.
 */

import React from 'react';
import { cn } from '../../ui/utils';

export type IconButtonVariant = 'ghost' | 'solid' | 'danger';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  'aria-label': string;
}

const VARIANTS: Record<IconButtonVariant, string> = {
  ghost: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700',
  solid: 'bg-brand text-white hover:bg-brand-hover',
  danger: 'text-gray-500 hover:bg-red-50 hover:text-red-600',
};

const SIZES: Record<IconButtonSize, string> = {
  sm: 'p-1.5 [&_svg]:w-3.5 [&_svg]:h-3.5',
  md: 'p-2 [&_svg]:w-4 [&_svg]:h-4',
};

export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-[8px] transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
