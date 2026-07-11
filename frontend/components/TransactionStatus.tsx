"use client";

import { TransactionStatus as TxStatus, SplitTemplate, truncateAddress } from "@/types";
import { getStellarExplorerUrl } from "@/lib/contracts";
import { Button, IconCheckCircle, IconError, IconKey, IconOpenInNew } from "@/components/ui";

interface TransactionStatusProps {
  status: TxStatus;
  template?: SplitTemplate;
  amount?: number;
  txHash?: string;
  errorMessage?: string;
  onRetry?: () => void;
  onCancel?: () => void;
  onBackToHome?: () => void;
}

export default function TransactionStatus({
  status,
  template,
  amount = 0,
  txHash,
  errorMessage,
  onRetry,
  onCancel,
  onBackToHome,
}: TransactionStatusProps) {
  if (status === "idle") return null;

  return (
    <div className="flex flex-col gap-section-margin">
      {/* Waiting for signature */}
      {status === "waiting" && (
        <section className="bg-surface-container rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-col items-center text-center gap-6 relative z-10">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary-container/20 pulse-ring" />
              <div className="absolute inset-2 rounded-full border-4 border-primary-container/30" />
              <div className="absolute inset-2 rounded-full border-4 border-primary-container border-t-transparent animate-spin" />
              <IconKey size={32} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-headline-md text-on-surface">Menunggu Tanda Tangan</h2>
              <p className="text-body-md text-on-surface-variant">
                Menunggu konfirmasi di wallet Anda. Mohon jangan tutup halaman ini.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Success */}
      {status === "success" && (
        <section className="bg-surface-container rounded-2xl p-6 shadow-[0px_4px_20px_rgba(91,100,0,0.06)]">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
              <IconCheckCircle size={40} />
            </div>

            <div className="space-y-1">
              <h2 className="text-headline-md text-on-surface">Transaksi Berhasil</h2>
              <div className="text-display-lg-mobile text-primary mt-2 font-bold">
                {amount.toFixed(2)} USDC
              </div>
            </div>

            {/* Split breakdown */}
            {template && (
              <div className="w-full bg-surface rounded-xl p-4 mt-2 space-y-4">
                {template.allocations.map((allocation, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b border-surface-variant pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-body-md text-on-surface">{allocation.label}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-label-lg text-on-surface font-semibold">
                        {((amount * allocation.basisPoints) / 10000).toFixed(2)} USDC
                      </div>
                      <div className="text-mono-address text-on-surface-variant text-xs mt-1">
                        {truncateAddress(allocation.recipient, 4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Explorer link */}
            {txHash && (
              <a
                href={getStellarExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-label-lg text-primary flex items-center gap-1 hover:underline mt-2"
              >
                Lihat detail transaksi
                <IconOpenInNew size={16} />
              </a>
            )}

            <Button
              onClick={onBackToHome}
              fullWidth
              className="mt-4"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </section>
      )}

      {/* Error */}
      {status === "error" && (
        <section className="bg-surface-container rounded-2xl p-6">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <IconError size={40} />
            </div>

            <div className="space-y-2">
              <h2 className="text-headline-md text-on-surface">Transaksi Gagal</h2>
              <p className="text-body-md text-on-surface-variant">
                {errorMessage || "Terjadi kesalahan saat mengirim transaksi."}
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 mt-4">
              {onRetry && (
                <Button onClick={onRetry} fullWidth>
                  Coba Lagi
                </Button>
              )}
              {onCancel && (
                <Button onClick={onCancel} variant="outline" fullWidth>
                  Batal
                </Button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
