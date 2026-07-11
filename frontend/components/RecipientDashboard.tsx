"use client";

import { TransferRecord, truncateAddress } from "@/types";
import { stroopsToUsdc } from "@/types";

interface RecipientDashboardProps {
  transfers: TransferRecord[];
  currentAddress: string;
}

interface AggregatedData {
  label: string;
  total: number;
  count: number;
}

export default function RecipientDashboard({
  transfers,
  currentAddress,
}: RecipientDashboardProps) {
  // Filter transfers where current address is a recipient
  const incomingTransfers = transfers.filter((transfer) =>
    transfer.splits.some(
      (split) => split.recipient === currentAddress || split.recipient.includes(currentAddress.slice(0, 8)))
    )
  );

  // Aggregate by label for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransfers = incomingTransfers.filter((transfer) => {
    const date = new Date(transfer.timestamp);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Calculate totals by label
  const aggregatedByLabel: Record<string, AggregatedData> = {};

  monthlyTransfers.forEach((transfer) => {
    transfer.splits.forEach((split) => {
      if (split.recipient === currentAddress || split.recipient.includes(currentAddress.slice(0, 8))) {
        const amount = parseFloat(stroopsToUsdc(split.amount));
        if (!aggregatedByLabel[split.label]) {
          aggregatedByLabel[split.label] = {
            label: split.label,
            total: 0,
            count: 0,
          };
        }
        aggregatedByLabel[split.label].total += amount;
        aggregatedByLabel[split.label].count += 1;
      }
    });
  });

  const totalIncoming = Object.values(aggregatedByLabel).reduce(
    (sum, item) => sum + item.total,
    0
  );

  // Get month name
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const currentMonthName = monthNames[currentMonth];

  if (Object.keys(aggregatedByLabel).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-body-lg text-on-surface-variant">
          Belum ada penerimaan bulan ini
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-stack-gap-lg">
      {/* Summary Card */}
      <div
        className="
          bg-primary-container rounded-2xl p-6
          text-on-primary-container
        "
      >
        <p className="text-label-lg font-semibold mb-1">
          Total Terima {currentMonthName} {currentYear}
        </p>
        <p className="text-display-lg-mobile font-bold">
          {totalIncoming.toFixed(2)} USDC
        </p>
        <p className="text-body-md mt-1 opacity-80">
          Dari {monthlyTransfers.length} transaksi
        </p>
      </div>

      {/* Breakdown by Label */}
      <div className="flex flex-col gap-stack-gap-md">
        <h3 className="text-headline-sm text-on-surface font-semibold">
          Rincian per Pos
        </h3>

        {Object.values(aggregatedByLabel)
          .sort((a, b) => b.total - a.total)
          .map((item, index) => (
            <div
              key={item.label}
              className="
                bg-surface rounded-xl p-5
                flex items-center justify-between
                shadow-sm
              "
            >
              <div className="flex flex-col gap-1">
                <span className="text-body-lg text-on-surface font-medium">
                  {item.label}
                </span>
                <span className="text-label-md text-on-surface-variant">
                  {item.count} transaksi
                </span>
              </div>
              <div className="text-right">
                <span className="text-headline-md text-primary font-semibold">
                  {item.total.toFixed(2)}
                </span>
                <span className="text-body-md text-on-surface-variant ml-1">USDC</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
