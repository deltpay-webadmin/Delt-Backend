import React from 'react';

interface BackendPageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Right-aligned action buttons (rendered with gap-2). */
  actions?: React.ReactNode;
  /** Optional eyebrow text shown above the title (e.g. category, breadcrumb). */
  eyebrow?: React.ReactNode;
  /** Optional badge/pill rendered next to the title. */
  titleBadge?: React.ReactNode;
  className?: string;
}

/**
 * BackendPageHeader — standard top-of-page block.
 *
 *   <BackendPageHeader title="Leads" subtitle="Track and qualify deals"
 *     actions={<BackendButton>+ New Lead</BackendButton>} />
 *
 * Replaces the repeating pattern:
 *   <div className="flex items-start justify-between flex-wrap gap-4">
 *     <div>
 *       <h1 className="text-2xl font-bold text-gray-900">…</h1>
 *       <p className="text-sm text-gray-500 mt-0.5">…</p>
 *     </div>
 *     <button className="px-4 py-2 bg-brand text-white …">…</button>
 *   </div>
 */
export function BackendPageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  titleBadge,
  className = '',
}: BackendPageHeaderProps) {
  return (
    <div className={`flex items-start justify-between flex-wrap gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            {eyebrow}
          </p>
        ) : null}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {titleBadge ? <span className="shrink-0">{titleBadge}</span> : null}
        </div>
        {subtitle ? (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * BackendPageContainer — standard outer page padding/spacing.
 * Wraps page contents in `px-6 py-6 space-y-6`.
 */
export function BackendPageContainer({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`px-6 py-6 space-y-6 ${className}`}>{children}</div>;
}

/** Optional sub-section heading within a page (between cards / groups of cards). */
export function BackendSectionHeading({
  title,
  subtitle,
  actions,
  className = '',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-3 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle ? (
          <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
