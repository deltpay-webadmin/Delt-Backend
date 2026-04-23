import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password' | 'date';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  inputMode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
  step?: string;
  min?: string | number;
  max?: string | number;
  disabled?: boolean;
  className?: string;
}

export function FormField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  icon,
  inputMode,
  step,
  min,
  max,
  disabled = false,
  className = '',
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-base text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-600 ml-1" aria-label="required">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          inputMode={inputMode}
          step={step}
          min={min}
          max={max}
          disabled={disabled}
          className={`
            w-full 
            ${icon ? 'pl-10' : 'pl-3'} 
            pr-3 
            py-3 
            min-h-[48px]
            text-base
            border 
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'}
            rounded-lg 
            focus:ring-2 
            focus:outline-none 
            disabled:bg-gray-100 
            disabled:cursor-not-allowed
            transition-colors
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
        />
      </div>
      
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {!error && helpText && (
        <p id={`${id}-help`} className="mt-2 text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
}
