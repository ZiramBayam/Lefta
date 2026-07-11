"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const borderSizeMap = {
    sm: "border-2",
    md: "border-3",
    lg: "border-4",
  };

  return (
    <div
      className={`
        ${sizeMap[size]}
        ${borderSizeMap[size]}
        border-primary-container
        border-t-transparent
        rounded-full
        animate-spin
        ${className}
      `}
      role="status"
      aria-label="Memuat..."
    >
      <span className="sr-only">Memuat...</span>
    </div>
  );
}

// Pulse dot for subtle loading indication
export function PulseDot({ className = "" }: { className?: string }) {
  return (
    <span
      className={`
        inline-block w-2 h-2
        bg-primary
        rounded-full
        pulse-ring
        ${className}
      `}
      aria-hidden="true"
    />
  );
}
