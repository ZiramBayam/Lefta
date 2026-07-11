"use client";

import { useState, useEffect } from "react";
import TopAppBar from "@/components/TopAppBar";
import BottomNav from "@/components/BottomNav";
import { getRecipientHistory } from "@/lib/contracts";
import { TransferRecord, stroopsToUsdc, truncateAddress } from "@/types";

export default function ReceiveHistoryPage() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock address for demo
        const mockAddress = "GMPQ...9R7T";
        const data = await getRecipientHistory(mockAddress);
        setTransfers(data);
      } catch (err) {
        console.error("Failed to load recipient history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-[100px]">
      <TopAppBar title="Riwayat Penerimaan" showBackButton />

      <main className="max-w-[480px] mx-auto px-container-padding pt-6 flex flex-col gap-stack-gap-lg">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-body-lg text-on-surface-variant">
              Belum ada riwayat penerimaan
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-headline-md text-on-surface font-semibold">
              Semua Penerimaan
            </h2>

            {transfers.map((transfer) => (
              <article
                key={transfer.id}
                className="
                  bg-surface-container rounded-xl p-4
                  flex flex-col gap-3
                "
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-label-lg text-on-surface-variant">
                      {formatDate(transfer.timestamp)}
                    </span>
                    <span className="text-body-md text-on-surface-variant">
                      Dari: {truncateAddress(transfer.sender, 4)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-headline-sm text-primary font-semibold">
                      {stroopsToUsdc(transfer.totalAmount)} USDC
                    </span>
                  </div>
                </div>

                {/* Split details */}
                <div className="border-t border-surface-variant pt-3 flex flex-col gap-2">
                  {transfer.splits
                    .filter((split) => split.recipient === "GMPQ...9R7T")
                    .map((split, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-body-md text-on-surface">
                          {split.label}
                        </span>
                        <span className="text-label-lg text-on-surface font-semibold">
                          {stroopsToUsdc(split.amount)} USDC
                        </span>
                      </div>
                    ))}
                </div>
              </article>
            ))}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
