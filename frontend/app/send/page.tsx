"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopAppBar from "@/components/TopAppBar";
import BottomNav from "@/components/BottomNav";
import { Button, Input, IconSend, IconExpandMore } from "@/components/ui";
import SplitPreview from "@/components/SplitPreview";
import TransactionStatus from "@/components/TransactionStatus";
import { SplitTemplate, TransactionStatus as TxStatus, ERROR_MESSAGES } from "@/types";
import { getSenderTemplates, transfer } from "@/lib/contracts";
import { usdcToStroops } from "@/types";

export default function SendPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<SplitTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getSenderTemplates("current-user");
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplateId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
      }
    };

    loadTemplates();
  }, []);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleSend = async () => {
    if (!selectedTemplate || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      setErrorMessage(ERROR_MESSAGES.BelowMinimumAmount);
      setTxStatus("error");
      return;
    }

    setIsLoading(true);
    setTxStatus("waiting");
    setErrorMessage("");

    try {
      // Call the transfer function
      const result = await transfer(
        "current-user",
        selectedTemplateId,
        usdcToStroops(amountNum)
      );

      setTxHash(result.txHash);
      setTxStatus("success");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : ERROR_MESSAGES.NETWORK_ERROR
      );
      setTxStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setTxStatus("idle");
    setErrorMessage("");
  };

  const handleCancel = () => {
    setTxStatus("idle");
    setErrorMessage("");
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopAppBar title="Kirim USDC" showBackButton />

      <main className="flex-1 px-container-padding py-stack-gap-md flex flex-col gap-section-margin">
        {txStatus !== "idle" ? (
          <TransactionStatus
            status={txStatus}
            template={selectedTemplate}
            amount={parseFloat(amount) || 0}
            txHash={txHash}
            errorMessage={errorMessage}
            onRetry={handleRetry}
            onCancel={handleCancel}
            onBackToHome={handleBackToHome}
          />
        ) : (
          <>
            {/* Template Selection */}
            <section className="flex flex-col gap-stack-gap-sm">
              <label
                htmlFor="template-select"
                className="text-label-lg text-on-surface-variant font-semibold"
              >
                Pilih Template Pembagian
              </label>
              <div className="relative w-full">
                <select
                  id="template-select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="
                    w-full h-touch-target-min
                    bg-surface-container border-none rounded-lg
                    px-4 appearance-none
                    text-body-lg text-on-surface
                    focus:ring-2 focus:ring-primary-container
                    transition-shadow
                    pr-12
                  "
                  aria-label="Pilih Template Pembagian"
                >
                  {templates.length === 0 ? (
                    <option value="">Belum ada template</option>
                  ) : (
                    templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.allocations.map((a) => a.label).join(", ")}
                      </option>
                    ))
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                  <IconExpandMore size={24} />
                </div>
              </div>

              {templates.length === 0 && (
                <Button
                  onClick={() => router.push("/send/templates")}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                >
                  Buat Template Baru
                </Button>
              )}
            </section>

            {/* Amount Input */}
            <section className="flex flex-col gap-stack-gap-sm">
              <label
                htmlFor="amount-input"
                className="text-label-lg text-on-surface-variant font-semibold"
              >
                Jumlah Kirim (USDC)
              </label>
              <div
                className="
                  bg-surface rounded-lg px-4 py-3
                  flex flex-col justify-center h-24
                  focus-within:ring-2 focus-within:ring-primary-container
                  transition-shadow shadow-sm
                "
              >
                <div className="flex items-end gap-2">
                  <span className="text-headline-md text-on-surface-variant mb-1">$</span>
                  <input
                    type="number"
                    id="amount-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    step="0.01"
                    className="
                      bg-transparent border-none p-0
                      focus:ring-0
                      text-display-lg-mobile text-on-surface
                      w-full h-12
                    "
                    aria-label="Jumlah dalam USDC"
                  />
                </div>
              </div>
            </section>

            {/* Split Preview */}
            {selectedTemplate && parseFloat(amount) > 0 && (
              <section className="flex flex-col gap-stack-gap-md">
                <h2 className="text-label-lg text-on-surface-variant font-semibold">
                  Preview Pembagian
                </h2>
                <SplitPreview
                  template={selectedTemplate}
                  amount={parseFloat(amount) || 0}
                />
              </section>
            )}

            {/* Spacer */}
            <div className="flex-grow" />
          </>
        )}
      </main>

      {/* Footer Action */}
      {txStatus === "idle" && (
        <footer className="p-container-padding bg-background pb-8 pt-4">
          <Button
            onClick={handleSend}
            disabled={!selectedTemplate || !amount || isLoading}
            isLoading={isLoading}
            fullWidth
            className="gap-2"
          >
            <IconSend size={20} />
            Kirim
          </Button>
        </footer>
      )}

      <BottomNav />
    </div>
  );
}
