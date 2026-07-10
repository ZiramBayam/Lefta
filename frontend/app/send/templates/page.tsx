'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/WalletButton';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AllocationBuilder } from '@/components/AllocationBuilder';
import { SplitBar } from '@/components/SplitBar';
import { Spinner } from '@/components/ui/Spinner';
import { getSenderTemplates, getTemplate, prepareCreateTemplate, parseCreateTemplateResult, prepareDeactivateTemplate } from '@/lib/contracts';
import type { SplitTemplate, Allocation } from '@/types';
import { truncateAddress } from '@/types';

export default function TemplatesPage() {
  const { address, isConnected, signAndSubmit } = useWallet();
  const [templates, setTemplates] = useState<SplitTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      loadTemplates();
    }
  }, [address]);

  const loadTemplates = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const ids = await getSenderTemplates(address);
      const loadedTemplates: SplitTemplate[] = [];
      for (const id of ids) {
        try {
          const template = await getTemplate(id);
          loadedTemplates.push(template);
        } catch {
          // Skip if can't load
        }
      }
      setTemplates(loadedTemplates);
    } catch (e) {
      console.error('Failed to load templates:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (allocations: Allocation[]) => {
    if (!address) return;
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const unsignedXdr = await prepareCreateTemplate(address, allocations);
      const result = await signAndSubmit(unsignedXdr);
      const templateId = parseCreateTemplateResult(result);
      setSuccess(`Template dibuat! ID: ${templateId.slice(0, 8)}...`);
      setShowBuilder(false);
      loadTemplates();
    } catch (e) {
      if (e instanceof Error) {
        if (e.message === 'USER_REJECTED') {
          setError('Transaksi dibatalkan');
        } else {
          setError(e.message);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (templateId: string) => {
    if (!address) return;
    try {
      const unsignedXdr = await prepareDeactivateTemplate(address, templateId);
      await signAndSubmit(unsignedXdr);
      loadTemplates();
    } catch (e) {
      if (e instanceof Error && e.message !== 'USER_REJECTED') {
        setError(e.message);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-margin-mobile">
          <p className="text-body-lg text-outline">Connect wallet dulu</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 px-margin-mobile py-lg space-y-lg max-w-md mx-auto w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-sm text-on-surface">Template Saya</h2>
          <Button variant="primary" onClick={() => setShowBuilder(true)}>
            + Buat Baru
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-xl">
            <Spinner />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-xl">
            <p className="text-body-md text-outline mb-md">Belum ada template</p>
            <Button variant="primary" onClick={() => setShowBuilder(true)}>
              Buat Template Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-md">
            {templates.map(template => (
              <div
                key={template.id}
                className={`p-md rounded-lg ${template.isActive ? 'bg-surface-container' : 'bg-surface-container-high opacity-60'}`}
              >
                <SplitBar allocations={template.allocations} />
                <div className="mt-md space-y-sm">
                  {template.allocations.map((alloc, i) => (
                    <div key={i} className="flex items-center justify-between text-body-sm">
                      <span className="text-on-surface">{alloc.label}</span>
                      <span className="text-outline">
                        {alloc.basisPoints / 100}% → {truncateAddress(alloc.recipient)}
                      </span>
                    </div>
                  ))}
                </div>
                {!template.isActive && (
                  <p className="mt-md text-label-sm text-tertiary">Template tidak aktif</p>
                )}
                {template.isActive && (
                  <button
                    onClick={() => handleDeactivate(template.id)}
                    className="mt-md text-label-sm text-tertiary hover:underline"
                  >
                    Nonaktifkan
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-md bg-error-container rounded-lg">
            <p className="text-body-md text-on-error-container">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-md bg-primary-container rounded-lg">
            <p className="text-body-md text-on-primary-container">{success}</p>
          </div>
        )}
      </main>

      <Modal
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        title="Buat Template Baru"
      >
        <AllocationBuilder
          onSave={handleSave}
          onCancel={() => setShowBuilder(false)}
        />
        {isSaving && (
          <div className="absolute inset-0 bg-background bg-opacity-50 flex items-center justify-center rounded-lg">
            <Spinner size="lg" />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Header() {
  return (
    <header className="p-margin-mobile pt-xl pb-lg flex items-center justify-between">
      <div className="flex items-center gap-md">
        <Link href="/send" className="text-on-surface hover:text-primary">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-headline-md text-on-surface font-bold">Templates</h1>
      </div>
      <WalletButton />
    </header>
  );
}
