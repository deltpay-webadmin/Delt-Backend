import React from 'react';

interface BackendEmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** When true, renders an outer card surface. Default true. */
  card?: boolean;
  className?: string;
  /** Vertical padding density. */
  size?: 'sm' | 'md' | 'lg';
}

const padBySize = {
  sm: 'py-8 px-6',
  md: 'py-12 px-6',
  lg: 'py-16 px-6',
};

export function BackendEmptyState({
  icon,
  title,
  description,
  action,
  card = true,
  className = '',
  size = 'md',
}: BackendEmptyStateProps) {
  const surface = card ? 'bg-white rounded-[8px] border border-gray-200' : '';
  return (
    <div
      className={`${surface} flex flex-col items-center justify-center text-center ${padBySize[size]} ${className}`}
    >
      {icon ? (
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      {description ? (
        <p className="text-[13px] text-gray-500 max-w-md leading-relaxed">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
