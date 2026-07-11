"use client";

import { useState, useEffect } from "react";
import { WalletState, truncateAddress } from "@/types";
import { checkFreighterInstalled, connectWallet, getWalletAddress } from "@/lib/freighter";
import { Button, PulseDot } from "@/components/ui";

interface WalletButtonProps {
  onConnected?: (address: string) => void;
  onDisconnected?: () => void;
}

export default function WalletButton({
  onConnected,
  onDisconnected,
}: WalletButtonProps) {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isLoading: true,
    error: null,
  });

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const address = await getWalletAddress();
        setWalletState({
          address,
          isConnected: !!address,
          isLoading: false,
          error: null,
        });
        if (address) {
          onConnected?.(address);
        }
      } catch {
        setWalletState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    };

    checkConnection();
  }, [onConnected]);

  const handleConnect = async () => {
    setWalletState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if Freighter is installed
      const isInstalled = await checkFreighterInstalled();
      if (!isInstalled) {
        setWalletState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Freighter wallet tidak ditemukan",
        }));
        return;
      }

      // Connect wallet
      const address = await connectWallet();
      setWalletState({
        address,
        isConnected: true,
        isLoading: false,
        error: null,
      });
      onConnected?.(address);
    } catch (err) {
      setWalletState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Gagal menghubungkan wallet",
      }));
    }
  };

  const handleDisconnect = () => {
    setWalletState({
      address: null,
      isConnected: false,
      isLoading: false,
      error: null,
    });
    onDisconnected?.();
  };

  // Loading state
  if (walletState.isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-surface-container">
        <PulseDot />
        <span className="text-label-sm text-on-surface-variant">Menghubungkan...</span>
      </div>
    );
  }

  // Not connected
  if (!walletState.isConnected) {
    return (
      <Button
        onClick={handleConnect}
        variant="outline"
        size="sm"
        className="rounded-full"
      >
        Connect Wallet
      </Button>
    );
  }

  // Connected - show truncated address
  return (
    <button
      onClick={handleDisconnect}
      className="
        flex items-center gap-2
        px-3 py-1.5
        rounded-full
        bg-surface-container
        text-mono-address text-on-surface-variant
        hover:bg-primary-container/20
        transition-colors
        cursor-pointer
      "
      title="Klik untuk memutuskan koneksi"
    >
      <PulseDot />
      <span className="font-mono-address text-mono-address font-medium">
        {truncateAddress(walletState.address!, 4)}
      </span>
    </button>
  );
}
