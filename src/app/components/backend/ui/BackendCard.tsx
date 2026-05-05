import React from 'react';

interface BackendCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds default inner padding (px-5 py-5). Use `false` when the card itself provides
   *  custom padding (e.g. cards with header/body sections). */
  padded?: boolean;
  /** Removes the border (still keeps the rounded surface). Useful inside larger panels. */
  flat?: boolean;
  /** Adds a subtle hover surface tint — for clickable cards. */
  interactive?: boolean;
}

/**
 * BackendCard — standardized white surface used across backend pages.
 * Replaces `bg-white rounded-[8px] border border-gray-200 ...` repeated in 170+ places.
 */
export function BackendCard({
  padded = false,
  flat = false,
  interactive = false,
  className = '',
  children,
  ...rest
}: BackendCardProps) {
  const border = flat ? '' : 'border border-gray-200';
  const pad = padded ? 'p-5' : '';
  const hover = interactive ? 'hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer' : '';
  return (
    <div
      className={`bg-white rounded-[8px] ${border} ${pad} ${hover} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

interface BackendCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

/** Standard card header row — title left, optional actions right, divider underneath. */
export function BackendCardHeader({
  title,
  subtitle,
  actions,
  icon,
  className = '',
  children,
  ...rest
}: BackendCardHeaderProps) {
  return (
    <div
      className={`px-5 py-3.5 border-b border-gray-200 flex items-center justify-between gap-3 ${className}`}
      {...rest}
    >
      {children ?? (
        <>
          <div className="min-w-0 flex items-center gap-2.5">
            {icon ? <span className="text-gray-500 shrink-0">{icon}</span> : null}
            <div className="min-w-0">
              {title ? (
                <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
              ) : null}
              {subtitle ? (
                <p className="text-[12px] text-gray-500 mt-0.5 truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>
          {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
        </>
      )}
    </div>
  );
}

/** Inner card body — provides standard horizontal/vertical padding. */
export function BackendCardBody({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`px-5 py-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}

/** Footer row inside a card (e.g. modal-style action footers). */
export function BackendCardFooter({
  className = '',
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
