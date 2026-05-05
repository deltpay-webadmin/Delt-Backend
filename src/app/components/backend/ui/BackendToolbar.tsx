import React from 'react';

interface BackendToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Left-aligned content (search, filters). */
  left?: React.ReactNode;
  /** Right-aligned content (view toggles, action buttons). */
  right?: React.ReactNode;
  /** When true, removes the surrounding card surface (use inside an existing card). */
  inline?: boolean;
}

/**
 * BackendToolbar — standard filter/action row above tables and lists.
 * Provides a consistent height, padding, and divider treatment.
 */
export function BackendToolbar({
  left,
  right,
  inline = false,
  className = '',
  children,
  ...rest
}: BackendToolbarProps) {
  const surface = inline ? '' : 'bg-white border border-gray-200 rounded-[8px]';
  return (
    <div
      className={`${surface} px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap ${className}`}
      {...rest}
    >
      {children ?? (
        <>
          <div className="flex items-center gap-2 flex-wrap min-w-0">{left}</div>
          {right ? <div className="flex items-center gap-2 flex-wrap shrink-0">{right}</div> : null}
        </>
      )}
    </div>
  );
}

/** Standard horizontal stack used for filter chips/buttons. */
export function BackendFilterRow({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>{children}</div>
  );
}
