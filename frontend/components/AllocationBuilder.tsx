'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import type { Allocation } from '@/types';

interface AllocationBuilderProps {
  initialAllocations?: Allocation[];
  onSave: (allocations: Allocation[]) => void;
  onCancel: () => void;
}

const MAX_ALLOCATIONS = 5;
const MAX_LABEL_LENGTH = 20;

export function AllocationBuilder({ initialAllocations = [], onSave, onCancel }: AllocationBuilderProps) {
  const [allocations, setAllocations] = useState<Allocation[]>(
    initialAllocations.length > 0
      ? initialAllocations
      : [{ label: '', recipient: '', basisPoints: 0 }]
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  const totalPercentage = allocations.reduce((sum, a) => sum + a.basisPoints, 0);
  const isValid = totalPercentage === 10000 && allocations.every(a => a.label.length > 0 && a.recipient.length > 0);
  const hasDuplicates = new Set(allocations.map(a => a.recipient)).size !== allocations.length;

  const updateAllocation = (index: number, field: keyof Allocation, value: string | number) => {
    setAllocations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setErrors(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [index]: _, ...rest } = prev;
      return rest;
    });
  };

  const addAllocation = () => {
    if (allocations.length < MAX_ALLOCATIONS) {
      setAllocations(prev => [...prev, { label: '', recipient: '', basisPoints: 0 }]);
    }
  };

  const removeAllocation = (index: number) => {
    if (allocations.length > 1) {
      setAllocations(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<number, string> = {};

    allocations.forEach((alloc, index) => {
      if (!alloc.label.trim()) {
        newErrors[index] = 'Label harus diisi';
      } else if (alloc.label.length > MAX_LABEL_LENGTH) {
        newErrors[index] = `Label maksimal ${MAX_LABEL_LENGTH} karakter`;
      }
      if (!alloc.recipient.trim()) {
        newErrors[index] = 'Alamat wallet harus diisi';
      }
    });

    if (totalPercentage !== 10000) {
      // Global error
    }

    if (hasDuplicates) {
      newErrors[-1] = 'Satu wallet tidak bisa muncul dua kali';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate() && isValid) {
      onSave(allocations);
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-sm text-on-surface">Alokasi Penerima</h2>
        <span
          className={`text-label-lg ${
            totalPercentage === 10000 ? 'text-primary' : totalPercentage > 10000 ? 'text-error' : 'text-outline'
          }`}
        >
          {basisPointsToPercent(totalPercentage)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            totalPercentage === 10000 ? 'bg-primary' : totalPercentage > 10000 ? 'bg-error' : 'bg-primary-container'
          }`}
          style={{ width: `${Math.min(totalPercentage / 100, 100)}%` }}
        />
      </div>

      <div className="flex flex-col gap-md">
        {allocations.map((alloc, index) => (
          <div key={index} className="p-md bg-surface-container rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-label-lg text-on-surface-variant">Pos {index + 1}</span>
              {allocations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAllocation(index)}
                  className="p-1 text-tertiary hover:bg-tertiary-container rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            <Input
              label="Label"
              value={alloc.label}
              onChange={e => updateAllocation(index, 'label', e.target.value)}
              placeholder="Contoh: Kebutuhan Harian"
              error={errors[index] && alloc.label.length > MAX_LABEL_LENGTH ? errors[index] : undefined}
              maxLength={MAX_LABEL_LENGTH}
            />

            <Input
              label="Alamat Wallet"
              value={alloc.recipient}
              onChange={e => updateAllocation(index, 'recipient', e.target.value)}
              placeholder="GABC...XYZ"
              error={errors[index] && !alloc.recipient ? errors[index] : undefined}
            />

            <div className="flex items-center gap-md">
              <div className="flex-1">
                <Input
                  label="Persentase"
                  type="number"
                  value={alloc.basisPoints / 100 || ''}
                  onChange={e => updateAllocation(index, 'basisPoints', Math.round(Number(e.target.value) * 100))}
                  placeholder="0"
                  min={0}
                  max={100}
                />
              </div>
              <div className="flex items-center justify-center w-14 h-14 bg-surface-container-high rounded-md">
                <span className="text-headline-sm text-on-surface">
                  {(alloc.basisPoints / 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}

        {errors[-1] && (
          <div className="p-3 bg-error-container rounded-md">
            <span className="text-label-lg text-on-error-container">{errors[-1]}</span>
          </div>
        )}
      </div>

      {allocations.length < MAX_ALLOCATIONS && (
        <Button variant="secondary" onClick={addAllocation} className="self-start">
          + Tambah Pos
        </Button>
      )}

      {totalPercentage !== 10000 && (
        <div className="p-3 bg-surface-container rounded-md">
          <span className="text-label-lg text-outline">
            Total harus tepat 100%. Sekarang: {basisPointsToPercent(totalPercentage)}
          </span>
        </div>
      )}

      <div className="flex gap-md pt-md">
        <Button variant="secondary" onClick={onCancel} className="flex-1">
          Batal
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={!isValid || hasDuplicates}
          className="flex-1"
        >
          Simpan Template
        </Button>
      </div>
    </div>
  );
}

function basisPointsToPercent(bp: number): string {
  return (bp / 100).toFixed(0) + '%';
}
