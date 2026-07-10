import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-primary-container text-on-primary-container hover:bg-opacity-90 focus:ring-primary',
    secondary: 'bg-surface-container text-on-surface hover:bg-surface-container-high focus:ring-secondary',
    tertiary: 'bg-tertiary-container text-on-tertiary-container hover:bg-opacity-90 focus:ring-tertiary',
    outline: 'border-2 border-secondary text-secondary bg-transparent hover:bg-surface-container focus:ring-secondary',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-label-lg min-h-[40px]',
    md: 'px-6 py-3 text-label-lg min-h-[48px]',
    lg: 'px-8 py-4 text-body-lg min-h-[56px]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
