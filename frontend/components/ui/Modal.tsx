"use client";

import { useEffect, useCallback } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className="
          relative
          w-full max-w-[480px]
          max-h-[90vh]
          bg-surface
          rounded-t-2xl sm:rounded-2xl
          shadow-lg
          overflow-hidden
          animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95
          duration-300
        "
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-container-padding py-4 border-b border-surface-container">
            {title && (
              <h2
                id="modal-title"
                className="text-headline-md text-on-surface font-semibold"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="
                  w-10 h-10
                  flex items-center justify-center
                  rounded-full
                  text-on-surface-variant
                  hover:bg-surface-container
                  transition-colors
                "
                aria-label="Tutup"
              >
                <span className="text-2xl">&times;</span>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-container-padding overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
