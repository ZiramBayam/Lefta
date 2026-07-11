"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      fullWidth = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-label-lg font-semibold
      rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-primary-container/50
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-[0.98]
    `;

    const sizeStyles = {
      sm: "h-12 px-4 text-sm",
      md: "h-14 px-6 text-base",
      lg: "h-[72px] px-8 text-lg",
    };

    const variantStyles = {
      primary: `
        bg-primary-container text-on-primary-container
        hover:bg-primary-fixed
        shadow-sm
      `,
      secondary: `
        bg-surface-container text-on-surface
        hover:bg-surface-container-high
        shadow-sm
      `,
      outline: `
        bg-transparent border-2 border-primary text-primary
        hover:bg-primary/5
      `,
      ghost: `
        bg-transparent text-on-surface-variant
        hover:bg-surface-container
      `,
      danger: `
        bg-tertiary-container text-on-tertiary-container
        hover:bg-error-container
      `,
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
