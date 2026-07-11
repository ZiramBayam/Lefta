"use client";

import { useState, useEffect } from "react";
import TopAppBar from "@/components/TopAppBar";
import BottomNav from "@/components/BottomNav";
import RecipientDashboard from "@/components/RecipientDashboard";
import { getRecipientHistory } from "@/lib/contracts";
import { TransferRecord } from "@/types";
import Link from "next/link";
import { Button, IconReceipt } from "@/components/ui";

export default function ReceivePage() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Mock address for demo - in production, get from wallet
        const mockAddress = "GMPQ...9R7T";
        setCurrentAddress(mockAddress);

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopAppBar />

      <main className="flex-1 px-container-padding py-stack-gap-md flex flex-col gap-section-margin">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <RecipientDashboard
            transfers={transfers}
            currentAddress={currentAddress}
          />
        )}
      </main>

      {/* Bottom Action */}
      <footer className="p-container-padding bg-background pb-8 pt-4">
        <Link href="/receive/history">
          <Button variant="secondary" fullWidth className="gap-2">
            <IconReceipt size={20} />
            Lihat Riwayat Lengkap
          </Button>
        </Link>
      </footer>

      <BottomNav />
    </div>
  );
}
