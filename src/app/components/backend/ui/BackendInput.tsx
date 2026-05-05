import React from 'react';

const baseField =
  'w-full bg-white border border-gray-300 rounded-[6px] text-[13px] text-gray-900 placeholder:text-gray-400 transition-colors outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50 disabled:cursor-not-allowed';

interface BackendInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fieldClassName?: string;
}

/** Standard text input. Wrap in <label className="block"> with a label above. */
export const BackendInput = React.forwardRef<HTMLInputElement, BackendInputProps>(
  function BackendInput(
    { leftIcon, rightIcon, className = '', fieldClassName = '', ...rest },
    ref,
  ) {
    if (!leftIcon && !rightIcon) {
      return (
        <input
          ref={ref}
          className={`${baseField} h-9 px-3 ${className}`}
          {...rest}
        />
      );
    }
    return (
      <div className={`relative ${className}`}>
        {leftIcon ? (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={`${baseField} h-9 ${leftIcon ? 'pl-8' : 'pl-3'} ${
            rightIcon ? 'pr-8' : 'pr-3'
          } ${fieldClassName}`}
          {...rest}
        />
        {rightIcon ? (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </span>
        ) : null}
      </div>
    );
  },
);

interface BackendSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const BackendSelect = React.forwardRef<HTMLSelectElement, BackendSelectProps>(
  function BackendSelect({ className = '', children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={`${baseField} h-9 px-3 pr-8 cursor-pointer bg-no-repeat bg-[right_0.5rem_center] ${className}`}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

interface BackendTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const BackendTextarea = React.forwardRef<HTMLTextAreaElement, BackendTextareaProps>(
  function BackendTextarea({ className = '', rows = 3, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`${baseField} px-3 py-2 resize-y ${className}`}
        {...rest}
      />
    );
  },
);

interface BackendFieldLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  hint?: React.ReactNode;
}

export function BackendFieldLabel({
  required,
  hint,
  className = '',
  children,
  ...rest
}: BackendFieldLabelProps) {
  return (
    <label
      className={`block text-[12px] font-semibold text-gray-700 mb-1.5 ${className}`}
      {...rest}
    >
      <span>{children}</span>
      {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      {hint ? <span className="ml-1.5 text-[11px] text-gray-400 font-normal">{hint}</span> : null}
    </label>
  );
}
