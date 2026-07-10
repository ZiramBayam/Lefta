'use client';

import React from 'react';
import type { Allocation } from '@/types';

interface SplitPreviewProps {
  allocations: Allocation[];
  amount: bigint;
}

export function SplitPreview({ allocations, amount }: SplitPreviewProps) {
  if (allocations.length === 0) {
    return (
      <div className="p-md bg-surface-container rounded-lg">
        <p className="text-body-md text-outline text-center">
          Pilih template untuk melihat preview
        </p>
      </div>
    );
  }

  const splits = calculateSplits(allocations, amount);
  const totalUsdc = Number(amount) / 1_000_000;

  return (
    <div className="flex flex-col gap-sm">
      <h3 className="text-label-lg text-on-surface-variant">Preview Pembagian</h3>
      <div className="p-md bg-surface-container rounded-lg space-y-3">
        {splits.map((split, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-sm">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getColor(index) }}
              />
              <span className="text-body-md text-on-surface">{split.label}</span>
            </div>
            <div className="text-right">
              <span className="text-body-lg font-semibold text-on-surface">
                ${split.amountUsdc}
              </span>
              <span className="text-label-sm text-outline ml-1">
                ({split.percent}%)
              </span>
            </div>
          </div>
        ))}
        <div className="pt-2 border-t border-outline-variant flex items-center justify-between">
          <span className="text-label-lg text-on-surface">Total</span>
          <span className="text-headline-sm font-bold text-primary">
            ${totalUsdc.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface Split {
  label: string;
  amountUsdc: string;
  percent: string;
}

function calculateSplits(allocations: Allocation[], amount: bigint): Split[] {
  const total = Number(amount);
  const results: Split[] = [];
  let distributed = 0;

  allocations.forEach((alloc, index) => {
    const isLast = index === allocations.length - 1;
    const amountUsdc = isLast
      ? (total - distributed) / 1_000_000
      : (total * alloc.basisPoints) / 100 / 1_000_000;

    distributed += Number(amountUsdc * 1_000_000);

    results.push({
      label: alloc.label,
      amountUsdc: amountUsdc.toFixed(2),
      percent: (alloc.basisPoints / 100).toFixed(0),
    });
  });

  return results;
}

const COLORS = [
  '#5b6400', // primary
  '#5a5d70', // secondary
  '#d1e231', // primary-container
  '#dee1f8', // secondary-container
  '#ae2f34', // tertiary
];

function getColor(index: number): string {
  return COLORS[index % COLORS.length];
}
