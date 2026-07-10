import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-label-lg text-on-surface">
        {label}
      </label>
      <input
        id={inputId}
        className={`
          w-full h-14 px-4 rounded-md bg-surface-container
          border ${error ? 'border-error' : 'border-outline-variant'}
          text-body-md text-on-surface placeholder:text-outline
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          transition-colors duration-200
          ${className}
        `}
        {...props}
      />
      {error && (
        <span className="text-label-sm text-error">{error}</span>
      )}
      {hint && !error && (
        <span className="text-label-sm text-outline">{hint}</span>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-label-lg text-on-surface">
        {label}
      </label>
      <select
        id={selectId}
        className={`
          w-full h-14 px-4 rounded-md bg-surface-container
          border ${error ? 'border-error' : 'border-outline-variant'}
          text-body-md text-on-surface
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          transition-colors duration-200
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && (
        <span className="text-label-sm text-error">{error}</span>
      )}
    </div>
  );
}
