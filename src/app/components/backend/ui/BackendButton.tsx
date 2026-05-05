import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success' | 'info';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

interface BackendButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-hover disabled:bg-brand/50 focus-visible:ring-brand/40',
  secondary:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 focus-visible:ring-gray-300',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50 focus-visible:ring-gray-300',
  destructive:
    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 focus-visible:ring-red-300',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400 focus-visible:ring-emerald-300',
  info:
    'bg-info text-white hover:bg-info-hover disabled:opacity-50 focus-visible:ring-info/40',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5 rounded-[6px]',
  md: 'h-9 px-4 text-[13px] gap-2 rounded-[6px]',
  lg: 'h-10 px-5 text-sm gap-2 rounded-[8px]',
  icon: 'h-9 w-9 rounded-[6px]',
  'icon-sm': 'h-8 w-8 rounded-[6px]',
};

/**
 * BackendButton — single source of truth for buttons across Delt backend pages.
 * Replaces ad-hoc Tailwind class stacks (e.g. `px-4 py-2 bg-brand text-white rounded-[6px] ...`)
 * with a small set of variant + size combinations that match the design system.
 */
export const BackendButton = React.forwardRef<HTMLButtonElement, BackendButtonProps>(
  function BackendButton(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      disabled,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const base =
      'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed';
    const wide = fullWidth ? 'w-full' : '';
    const iconOnly = size === 'icon' || size === 'icon-sm';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${wide} ${className}`}
        {...rest}
      >
        {loading ? (
          <span
            className="h-3.5 w-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
            aria-hidden="true"
          />
        ) : (
          leftIcon
        )}
        {!iconOnly && children}
        {iconOnly && !loading && children}
        {!loading && rightIcon}
      </button>
    );
  },
);
