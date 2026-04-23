import React from 'react';

interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  showLabel?: 'always' | 'desktop' | 'never';
  className?: string;
  ariaLabel?: string;
}

const variantStyles = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  secondary: 'bg-blue-600 hover:bg-blue-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
};

const sizeStyles = {
  sm: 'px-2 py-2 text-sm gap-1.5',
  md: 'px-3 py-2 text-base gap-2',
  lg: 'px-4 py-3 text-lg gap-2',
};

const minHeights = {
  sm: 'min-h-[36px]',
  md: 'min-h-[44px]',
  lg: 'min-h-[52px]',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function ActionButton({
  onClick,
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  showLabel = 'desktop',
  className = '',
  ariaLabel,
}: ActionButtonProps) {
  const labelClasses = {
    always: '',
    desktop: 'hidden sm:inline',
    never: 'sr-only',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${minHeights[size]}
        rounded-lg
        transition-colors
        disabled:opacity-50 
        disabled:cursor-not-allowed
        ${className}
      `}
      aria-label={ariaLabel || label}
    >
      <span className={iconSizes[size]} aria-hidden="true">
        {icon}
      </span>
      <span className={labelClasses[showLabel]}>
        {label}
      </span>
    </button>
  );
}
