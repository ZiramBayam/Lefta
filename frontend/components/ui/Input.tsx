"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-label-md text-on-surface-variant font-semibold"
          >
            {label}
          </label>
        )}
        <div
          className={`
            relative
            flex items-center
            bg-surface-container
            rounded-lg
            h-14
            transition-all duration-200
            ${isFocused ? "ring-2 ring-primary-container" : ""}
            ${error ? "ring-2 ring-error" : ""}
          `}
        >
          {leftIcon && (
            <span className="absolute left-4 text-on-surface-variant">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full h-full
              bg-transparent
              border-none
              px-4
              text-body-lg text-on-surface
              placeholder:text-outline-variant
              focus:outline-none
              ${leftIcon ? "pl-12" : ""}
              ${rightIcon ? "pr-12" : ""}
              ${className}
            `}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-4 text-on-surface-variant">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <span
            id={`${inputId}-error`}
            className="text-label-sm text-error"
            role="alert"
          >
            {error}
          </span>
        )}
        {helperText && !error && (
          <span className="text-label-sm text-on-surface-variant">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
