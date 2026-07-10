'use client';

import React from 'react';
import type { Allocation } from '@/types';

interface SplitBarProps {
  allocations: Allocation[];
}

const COLORS = [
  '#5b6400',
  '#5a5d70',
  '#d1e231',
  '#dee1f8',
  '#ae2f34',
];

export function SplitBar({ allocations }: SplitBarProps) {
  if (allocations.length === 0) {
    return <div className="w-full h-3 bg-surface-container rounded-full" />;
  }

  return (
    <div className="flex w-full h-3 rounded-full overflow-hidden">
      {allocations.map((alloc, index) => (
        <div
          key={index}
          className="h-full transition-all duration-300"
          style={{
            width: `${alloc.basisPoints / 100}%`,
            backgroundColor: COLORS[index % COLORS.length],
          }}
          title={`${alloc.label}: ${alloc.basisPoints / 100}%`}
        />
      ))}
    </div>
  );
}
