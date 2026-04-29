/**
 * ────────────────────────────────────────────────────────────
 * OnboardingFlow — Stripe-inspired multi-step slide-over shell
 * ────────────────────────────────────────────────────────────
 * Right-side panel with:
 *   • Thin brand-colored progress bar
 *   • Numbered step pills with labels
 *   • Prev / Next / Submit footer
 *   • Esc-to-close, Enter-to-advance
 *   • Success state with checkmark + CTA
 *   • Mobile full-screen under 640px
 *
 * Used by NewMerchantFlow, NewDealFlow, NewLeadFlow, NewApplicationFlow.
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronLeft, Loader2, Upload, X, Plus, Trash2, FileText } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────

export interface OnboardingStep {
  title: string;
  description?: string;
  /** Return false/string to block advancing; true to allow. */
  validate?: () => true | string;
  render: () => React.ReactNode;
}

export interface OnboardingSuccess {
  title: string;
  description: string;
  /** Primary deep-link CTA (e.g., "View merchant"). */
  primaryCta?: { label: string; onClick: () => void };
  /** Secondary "Create another". Defaults to closing. */
  secondaryCta?: { label: string; onClick: () => void };
}

export interface OnboardingFlowProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  steps: OnboardingStep[];
  /** Called on final submit — do async work, then resolve. */
  onSubmit: () => Promise<OnboardingSuccess> | OnboardingSuccess;
  submitLabel?: string;
}

// ─── Component ──────────────────────────────────────────────

export function OnboardingFlow({
  open,
  onClose,
  title,
  subtitle,
  steps,
  onSubmit,
  submitLabel = 'Create',
}: OnboardingFlowProps) {
  const [idx, setIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<OnboardingSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setIdx(0);
      setSubmitting(false);
      setSuccess(null);
      setError(null);
    }
  }, [open]);

  // Esc to close, Enter to advance
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Enter' && !success && !submitting) {
        // Don't hijack when user is typing in textarea
        const tgt = e.target as HTMLElement;
        if (tgt?.tagName === 'TEXTAREA') return;
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idx, success, submitting]);

  // Focus panel when opening
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => panelRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [open]);

  const isLast = idx === steps.length - 1;
  const current = steps[idx];

  const handleNext = async () => {
    setError(null);
    const v = current?.validate?.();
    if (v !== undefined && v !== true) {
      setError(typeof v === 'string' ? v : 'Please complete this step.');
      return;
    }
    if (!isLast) {
      setIdx(i => Math.min(i + 1, steps.length - 1));
      return;
    }
    // Final submit
    try {
      setSubmitting(true);
      const result = await onSubmit();
      setSuccess(result);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrev = () => {
    setError(null);
    setIdx(i => Math.max(i - 1, 0));
  };

  const progress = success ? 100 : ((idx + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          {/* Panel — top-down partial sheet (covers ~85vh, page peeks at bottom) */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="absolute left-0 right-0 top-0 mx-auto w-full max-w-[1200px] h-[88vh] bg-white shadow-2xl flex flex-col outline-none rounded-b-2xl overflow-hidden"
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ type: 'spring', damping: 34, stiffness: 320 }}
          >
            {/* Thin progress bar at the very top */}
            <div className="h-[3px] bg-gray-100 relative overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-brand"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-[17px] font-semibold text-gray-900 leading-tight">{title}</h2>
                {subtitle && (
                  <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="p-2 -mr-2 -mt-1 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step pills (hidden on success) */}
            {!success && (
              <div className="px-6 pt-5 pb-1 flex items-center gap-2">
                {steps.map((s, i) => {
                  const done = i < idx;
                  const active = i === idx;
                  return (
                    <React.Fragment key={s.title}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 transition-colors ${
                            done
                              ? 'bg-brand text-white'
                              : active
                              ? 'bg-brand text-white ring-4 ring-brand/15'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                        </div>
                        <span
                          className={`text-[12px] font-medium truncate ${
                            active ? 'text-gray-900' : done ? 'text-gray-600' : 'text-gray-400'
                          }`}
                        >
                          {s.title}
                        </span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-px ${done ? 'bg-brand/40' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto w-full max-w-[860px]">
              {success ? (
                <SuccessPanel success={success} onClose={onClose} />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="mb-5">
                      <h3 className="text-[15px] font-semibold text-gray-900">{current.title}</h3>
                      {current.description && (
                        <p className="text-[13px] text-gray-500 mt-1">{current.description}</p>
                      )}
                    </div>
                    {current.render()}
                    {error && (
                      <div className="mt-4 text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-[8px] px-3 py-2">
                        {error}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
              </div>
            </div>

            {/* Footer */}
            {!success && (
              <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-white">
                {idx > 0 ? (
                  <button
                    onClick={handlePrev}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    disabled={submitting}
                    className="px-3.5 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50 rounded-[6px] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-brand hover:bg-brand-hover rounded-[6px] transition-colors shadow-sm disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving…
                      </>
                    ) : isLast ? (
                      submitLabel
                    ) : (
                      'Continue'
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Success panel ──────────────────────────────────────────

function SuccessPanel({
  success,
  onClose,
}: {
  success: OnboardingSuccess;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center py-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 260 }}
        className="w-14 h-14 rounded-full bg-brand/10 flex items-center justify-center mb-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', damping: 12, stiffness: 320 }}
          className="w-10 h-10 rounded-full bg-brand flex items-center justify-center"
        >
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>
      <h3 className="text-[17px] font-semibold text-gray-900">{success.title}</h3>
      <p className="text-[13px] text-gray-500 mt-1.5 max-w-[320px]">{success.description}</p>

      <div className="flex flex-col sm:flex-row gap-2 mt-6 w-full max-w-[320px]">
        {success.primaryCta && (
          <button
            onClick={success.primaryCta.onClick}
            className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-brand hover:bg-brand-hover rounded-[6px] transition-colors shadow-sm"
          >
            {success.primaryCta.label}
          </button>
        )}
        <button
          onClick={success.secondaryCta?.onClick || onClose}
          className="flex-1 px-4 py-2.5 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-[6px] hover:bg-gray-50 transition-colors"
        >
          {success.secondaryCta?.label || 'Done'}
        </button>
      </div>
    </div>
  );
}

// ─── Reusable form primitives (Stripe-styled) ───────────────

export function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-[12px] font-medium text-gray-700 mb-1.5">
      {children}
      {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  optional,
  prefix,
  suffix,
  autoFocus,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  optional?: boolean;
  prefix?: string;
  suffix?: string;
  autoFocus?: boolean;
  inputMode?: 'numeric' | 'decimal' | 'tel' | 'email' | 'text';
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          autoFocus={autoFocus}
          type={type}
          value={value}
          inputMode={inputMode}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${prefix ? 'pl-6' : 'pl-3'} ${suffix ? 'pr-12' : 'pr-3'} py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors placeholder:text-gray-400`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-400 pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[];
  optional?: boolean;
}) {
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
      >
        {opts.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  optional?: boolean;
}) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <textarea
        rows={rows}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-[13px] text-gray-900 bg-white border border-gray-200 rounded-[6px] focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors placeholder:text-gray-400 resize-none"
      />
    </div>
  );
}

export function RadioCards<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; description?: string; icon?: React.ReactNode }[];
}) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div className="grid gap-2">
        {options.map(o => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={`text-left px-3.5 py-3 rounded-[8px] border transition-all flex items-start gap-3 ${
                active
                  ? 'border-brand bg-brand/[0.04] ring-2 ring-brand/15'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {o.icon && (
                <div
                  className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 ${
                    active ? 'bg-brand/10 text-brand' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {o.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={`text-[13px] font-semibold ${active ? 'text-gray-900' : 'text-gray-800'}`}>
                  {o.label}
                </div>
                {o.description && (
                  <div className="text-[12px] text-gray-500 mt-0.5">{o.description}</div>
                )}
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 ${
                  active ? 'border-brand bg-brand' : 'border-gray-300'
                }`}
              >
                {active && (
                  <div className="w-full h-full rounded-full bg-white scale-[0.4]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-100 last:border-0 gap-4">
      <span className="text-[12px] text-gray-500 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-gray-900 text-right break-words min-w-0">
        {value || <span className="text-gray-400 font-normal">—</span>}
      </span>
    </div>
  );
}

export function ReviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-gray-50/60 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Additional primitives for KYB flows ────────────────────────

export function Checkbox({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full text-left px-3.5 py-3 rounded-[8px] border flex items-start gap-3 transition-colors ${
        checked
          ? 'border-brand bg-brand/[0.04]'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          checked ? 'bg-brand border-brand' : 'border-gray-300'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-900">{label}</div>
        {description && (
          <div className="text-[12px] text-gray-500 mt-0.5">{description}</div>
        )}
      </div>
    </button>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = '%',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <FieldLabel>{label}</FieldLabel>
        <span className="text-[12px] font-semibold text-gray-900 tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-brand cursor-pointer"
      />
    </div>
  );
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
}

export function FileDrop({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  files,
  onAdd,
  onRemove,
  optional,
  hint,
}: {
  label: string;
  accept?: string;
  files: UploadedFile[];
  onAdd: (f: UploadedFile) => void;
  onRemove: (id: string) => void;
  optional?: boolean;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handlePick = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(f => {
      onAdd({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: f.name,
        size: f.size,
      });
    });
    if (inputRef.current) inputRef.current.value = '';
  };
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault();
          handlePick(e.dataTransfer.files);
        }}
        className="w-full border-2 border-dashed border-gray-200 hover:border-brand/40 hover:bg-brand/[0.02] rounded-[8px] px-4 py-5 flex flex-col items-center justify-center gap-1.5 transition-colors"
      >
        <Upload className="w-5 h-5 text-gray-400" />
        <span className="text-[13px] font-medium text-gray-700">Click or drag files here</span>
        <span className="text-[11px] text-gray-500">{hint || 'PDF, JPG, PNG up to 10MB'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={e => handlePick(e.target.files)}
      />
      {files.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {files.map(f => (
            <div
              key={f.id}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-[6px]"
            >
              <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-[12px] text-gray-700 truncate flex-1">{f.name}</span>
              <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => onRemove(f.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Remove file"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Stripe-style repeating section with Add / Remove. */
export function RepeaterSection({
  title,
  items,
  renderItem,
  onAdd,
  onRemove,
  addLabel = 'Add another',
  emptyHint,
}: {
  title?: string;
  items: { id: string }[];
  renderItem: (item: { id: string }, index: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (id: string) => void;
  addLabel?: string;
  emptyHint?: string;
}) {
  return (
    <div className="space-y-3">
      {title && <FieldLabel>{title}</FieldLabel>}
      {items.length === 0 && emptyHint && (
        <div className="text-[12px] text-gray-500 bg-gray-50 border border-gray-100 rounded-[6px] px-3 py-2.5">
          {emptyHint}
        </div>
      )}
      {items.map((item, i) => (
        <div
          key={item.id}
          className="rounded-[10px] border border-gray-200 px-4 py-3 relative bg-white"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              #{i + 1}
            </span>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-[12px] text-gray-400 hover:text-red-600 transition-colors inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Remove
            </button>
          </div>
          {renderItem(item, i)}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-medium text-brand bg-brand/[0.04] hover:bg-brand/[0.08] border border-dashed border-brand/30 rounded-[8px] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {addLabel}
      </button>
    </div>
  );
}
