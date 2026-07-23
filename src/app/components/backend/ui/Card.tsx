/**
 * Card — standard white surface for the Delt backend.
 *
 * The canonical `bg-white border border-gray-200 rounded-[8px]` container,
 * so panels, tables, and tiles share one surface treatment.
 */

import React from 'react';
import { cn } from '../../ui/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Built-in padding. Use `false` for flush content like tables. */
  padded?: boolean;
}

export function Card({ padded = true, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-[8px]',
        padded && 'p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
