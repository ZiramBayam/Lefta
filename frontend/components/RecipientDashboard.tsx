'use client';

import React from 'react';
import type { TransferRecord } from '@/types';
import { stroopsToUsdc, truncateAddress, formatDate } from '@/types';

interface RecipientDashboardProps {
  transfers: TransferRecord[];
  currentAddress: string;
}

export function RecipientDashboard({ transfers, currentAddress }: RecipientDashboardProps) {
  // Filter transfers where current address is a recipient
  const incomingTransfers = transfers.filter(t =>
    t.splits.some(s => s.recipient === currentAddress)
  );

  // Aggregate by label for current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTotals: Record<string, { amount: bigint; count: number }> = {};

  incomingTransfers.forEach(transfer => {
    const transferDate = new Date(transfer.timestamp * 1000);
    if (transferDate.getMonth() === currentMonth && transferDate.getFullYear() === currentYear) {
      transfer.splits.forEach(split => {
        if (split.recipient === currentAddress) {
          if (!monthlyTotals[split.label]) {
            monthlyTotals[split.label] = { amount: BigInt(0), count: 0 };
          }
          monthlyTotals[split.label].amount += split.amount;
          monthlyTotals[split.label].count += 1;
        }
      });
    }
  });

  const totalThisMonth = Object.values(monthlyTotals).reduce(
    (sum, t) => sum + BigInt(t.amount),
    BigInt(0)
  );

  return (
    <div className="flex flex-col gap-lg">
      {/* Summary card */}
      <div className="p-lg bg-primary-container rounded-lg">
        <p className="text-label-lg text-on-primary-container mb-sm">Total Bulan Ini</p>
        <p className="text-display-lg text-on-primary-container">
          ${(Number(totalThisMonth) / 1_000_000).toFixed(2)} USDC
        </p>
        <p className="text-label-sm text-on-primary-container mt-sm">
          {incomingTransfers.length} transaksi diterima
        </p>
      </div>

      {/* Breakdown by label */}
      {Object.entries(monthlyTotals).length > 0 ? (
        <div className="space-y-sm">
          <h3 className="text-label-lg text-on-surface-variant">Rincian per Pos</h3>
          {Object.entries(monthlyTotals).map(([label, data]) => (
            <div
              key={label}
              className="p-md bg-surface-container rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-sm">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-body-md text-on-surface">{label}</span>
              </div>
              <div className="text-right">
                <p className="text-body-lg font-semibold text-on-surface">
                  ${(Number(data.amount) / 1_000_000).toFixed(2)} USDC
                </p>
                <p className="text-label-sm text-outline">{data.count}x transfer</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-lg bg-surface-container rounded-lg text-center">
          <p className="text-body-md text-outline">
            Belum ada penerimaan bulan ini
          </p>
        </div>
      )}

      {/* Recent transfers */}
      {incomingTransfers.length > 0 && (
        <div className="space-y-sm">
          <h3 className="text-label-lg text-on-surface-variant">Transaksi Terbaru</h3>
          {incomingTransfers.slice(0, 5).map(transfer => {
            const mySplit = transfer.splits.find(s => s.recipient === currentAddress);
            if (!mySplit) return null;

            return (
              <div
                key={transfer.id}
                className="p-md bg-surface-container rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="text-body-md text-on-surface">
                    {truncateAddress(transfer.sender)}
                  </p>
                  <p className="text-label-sm text-outline">{formatDate(transfer.timestamp)}</p>
                </div>
                <div className="text-right">
                  <p className="text-body-lg font-semibold text-primary">
                    +${stroopsToUsdc(mySplit.amount)} USDC
                  </p>
                  <p className="text-label-sm text-outline">{mySplit.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
