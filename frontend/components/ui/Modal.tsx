'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-on-surface bg-opacity-30"
        onClick={onClose}
      />
      <div className="relative bg-surface-container-lowest rounded-lg p-lg shadow-xl max-w-md w-full mx-md">
        <div className="flex items-center justify-between mb-md">
          <h2 className="text-headline-sm text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="p-sm text-on-surface-variant hover:text-on-surface transition-colors rounded-full hover:bg-surface-container"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
