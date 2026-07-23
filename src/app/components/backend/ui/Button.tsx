/**
 * Button — the one button for the Delt backend.
 *
 * Replaces the assorted `bg-brand … rounded-[8px] …` / `bg-white border …`
 * button markup scattered across pages with a single component so every action
 * shares the same color, radius, sizing, focus ring, and disabled behavior.
 *
 *   <Button onClick={…}>Save</Button>                    // primary
 *   <Button variant="secondary" icon={<Plus/>}>New</Button>
 *   <Button variant="danger" size="sm">Delete</Button>
 *   <Button variant="ghost">Cancel</Button>
 */

import React from 'react';
import { cn } from '../../ui/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon (rendered before children). */
  icon?: React.ReactNode;
  /** Trailing icon (rendered after children). */
  trailingIcon?: React.ReactNode;
  /** Stretch to fill the container width. */
  block?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: '[&_svg]:w-3.5 [&_svg]:h-3.5',
  md: '[&_svg]:w-4 [&_svg]:h-4',
  lg: '[&_svg]:w-4 [&_svg]:h-4',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  block = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-[8px] transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        ICON_SIZE[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {trailingIcon}
    </button>
  );
}
