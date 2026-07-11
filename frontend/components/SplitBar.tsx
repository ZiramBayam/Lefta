"use client";

import { Allocation } from "@/types";

interface SplitBarProps {
  allocations: Allocation[];
}

const COLORS = [
  "bg-primary",
  "bg-primary-container",
  "bg-secondary",
  "bg-secondary-container",
  "bg-tertiary",
];

export default function SplitBar({ allocations }: SplitBarProps) {
  return (
    <div className="w-full h-3 rounded-full flex overflow-hidden gap-1 bg-surface-variant">
      {allocations.map((allocation, index) => (
        <div
          key={index}
          className={`h-full ${COLORS[index % COLORS.length]}`}
          style={{ width: `${allocation.basisPoints / 100}%` }}
        />
      ))}
    </div>
  );
}

// Legend for the split bar
export function SplitBarLegend({ allocations }: SplitBarProps) {
  return (
    <div className="grid grid-cols-2 gap-y-2 mt-2">
      {allocations.map((allocation, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${COLORS[index % COLORS.length]}`}
          />
          <span className="text-label-lg text-on-surface-variant">
            {allocation.label}{" "}
            <span className="text-body-md text-on-surface">
              {allocation.basisPoints / 100}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
