"use client";

import { SplitTemplate } from "@/types";
import { truncateAddress } from "@/types";
import { IconWallet } from "@/components/ui";

interface SplitPreviewProps {
  template: SplitTemplate;
  amount: number;
}

export default function SplitPreview({ template, amount }: SplitPreviewProps) {
  const calculateAmount = (basisPoints: number) => {
    return ((amount * basisPoints) / 10000).toFixed(2);
  };

  return (
    <div className="flex flex-col gap-stack-gap-sm">
      {template.allocations.map((allocation, index) => (
        <div
          key={index}
          className="
            bg-surface rounded-xl p-5
            flex items-center justify-between
            shadow-sm
          "
        >
          <div className="flex flex-col gap-1">
            <span className="font-body-lg text-on-surface font-medium">
              {allocation.label} ({allocation.basisPoints / 100}%)
            </span>
            <div className="flex items-center gap-2">
              <IconWallet size={16} className="text-on-surface-variant" />
              <span className="text-mono-address text-on-surface-variant font-medium">
                {truncateAddress(allocation.recipient, 4)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-headline-md text-primary font-semibold">
              {calculateAmount(allocation.basisPoints)}
            </span>
            <span className="text-body-md text-on-surface-variant ml-1">USDC</span>
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="bg-surface-container rounded-xl p-5 flex items-center justify-between mt-2">
        <span className="text-body-lg text-on-surface font-medium">Total</span>
        <div className="text-right">
          <span className="text-headline-md text-on-surface font-bold">{amount.toFixed(2)}</span>
          <span className="text-body-md text-on-surface-variant ml-1">USDC</span>
        </div>
      </div>
    </div>
  );
}
