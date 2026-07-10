'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/WalletButton';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { SplitPreview } from '@/components/SplitPreview';
import { getSenderTemplates, getTemplate, prepareTransfer, parseTransferResult } from '@/lib/contracts';
import { USDC_ISSUER } from '@/lib/freighter';
import type { SplitTemplate } from '@/types';
import { usdcToStroops } from '@/types';

export default function SendPage() {
  const { address, isConnected, signAndSubmit } = useWallet();
  const [templates, setTemplates] = useState<SplitTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<SplitTemplate | null>(null);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadTemplates();
    }
  }, [address]);

  const loadTemplates = async () => {
    if (!address) return;
    setIsLoadingTemplates(true);
    try {
      const ids = await getSenderTemplates(address);
      const loadedTemplates: SplitTemplate[] = [];
      for (const id of ids) {
        try {
          const template = await getTemplate(id);
          if (template.isActive) {
            loadedTemplates.push(template);
          }
        } catch {
          // Skip inactive templates
        }
      }
      setTemplates(loadedTemplates);
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      try {
        const template = await getTemplate(templateId);
        setSelectedTemplate(template);
      } catch (e) {
        console.error('Failed to load template:', e);
        setSelectedTemplate(null);
      }
    } else {
      setSelectedTemplate(null);
    }
  };

  const handleSend = async () => {
    if (!address || !selectedTemplateId || !amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      setError('Minimum transfer 1 USDC');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amountStroops = usdcToStroops(amountNum);
      const unsignedXdr = await prepareTransfer(address, selectedTemplateId, amountStroops, USDC_ISSUER);
      const result = await signAndSubmit(unsignedXdr);
      const transferId = parseTransferResult(result);
      setSuccess(`Transfer berhasil! ID: ${transferId.slice(0, 8)}...`);
      setAmount('');
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'USER_REJECTED') {
          setError('Transaksi dibatalkan');
        } else {
          setError(e.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile">
          <div className="text-center">
            <p className="text-body-lg text-outline mb-lg">
              Connect wallet dulu untuk mengirim
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-margin-mobile py-lg space-y-lg max-w-md mx-auto w-full">
        {/* Templates */}
        <div>
          <div className="flex items-center justify-between mb-sm">
            <label className="text-label-lg text-on-surface">Pilih Template</label>
            <Link href="/send/templates" className="text-label-lg text-primary hover:underline">
              + Buat Baru
            </Link>
          </div>
          {isLoadingTemplates ? (
            <div className="flex items-center justify-center py-lg">
              <Spinner />
            </div>
          ) : templates.length > 0 ? (
            <Select
              label=""
              value={selectedTemplateId}
              onChange={e => handleTemplateChange(e.target.value)}
            >
              <option value="">Pilih template...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.allocations.map(a => `${a.label} (${a.basisPoints / 100}%)`).join(', ')}
                </option>
              ))}
            </Select>
          ) : (
            <div className="text-center py-lg">
              <p className="text-body-md text-outline mb-md">Belum ada template</p>
              <Link href="/send/templates">
                <Button variant="primary">Buat Template Pertama</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Amount */}
        {selectedTemplate && (
          <>
            <Input
              label="Jumlah USDC"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              min={1}
              step={0.01}
            />

            {/* Preview */}
            {amount && parseFloat(amount) > 0 && (
              <SplitPreview
                allocations={selectedTemplate.allocations}
                amount={usdcToStroops(parseFloat(amount))}
              />
            )}

            {/* Send button */}
            <div className="pt-md">
              <Button
                variant="primary"
                size="lg"
                onClick={handleSend}
                disabled={!amount || parseFloat(amount) < 1}
                isLoading={isLoading}
                className="w-full"
              >
                Kirim
              </Button>
            </div>
          </>
        )}

        {/* History link */}
        <div className="pt-md text-center">
          <Link href="/send/history" className="text-label-lg text-secondary hover:underline">
            Lihat Riwayat →
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="p-md bg-error-container rounded-lg">
            <p className="text-body-md text-on-error-container">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="p-md bg-primary-container rounded-lg">
            <p className="text-body-md text-on-primary-container">{success}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="p-margin-mobile pt-xl pb-lg flex items-center justify-between">
      <div className="flex items-center gap-md">
        <Link href="/" className="text-on-surface hover:text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-headline-md text-on-surface font-bold">Kirim</h1>
      </div>
      <WalletButton />
    </header>
  );
}
