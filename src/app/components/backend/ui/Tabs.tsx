/**
 * Tabs — the standard underline tab bar for the Delt backend.
 *
 * Consolidates the repeated `border-b-2 … border-brand text-brand` tab markup
 * into one controlled component.
 *
 *   <Tabs
 *     tabs={[{ id: 'leads', label: 'Leads' }, { id: 'referrals', label: 'Referrals' }]}
 *     active={tab}
 *     onChange={setTab}
 *   />
 */

import React from 'react';
import { cn } from '../../ui/utils';

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  /** Adds the bottom divider that spans the full row. Default true. */
  divider?: boolean;
}

export function Tabs<T extends string = string>({
  tabs,
  active,
  onChange,
  className,
  divider = true,
}: TabsProps<T>) {
  return (
    <div className={cn('flex items-center gap-1', divider && 'border-b border-gray-200', className)}>
      {tabs.map(tab => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              'focus:outline-none',
              isActive
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            )}
          >
            {tab.icon && <span className="[&_svg]:w-4 [&_svg]:h-4">{tab.icon}</span>}
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'ml-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  isActive ? 'bg-brand-50 text-brand' : 'bg-gray-100 text-gray-500',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
