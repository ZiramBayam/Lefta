"use client";

import { useState, useEffect } from "react";
import { Allocation } from "@/types";
import { Button, Input, IconAdd, IconClose } from "@/components/ui";

interface AllocationBuilderProps {
  initialAllocations?: Allocation[];
  onSave: (allocations: Allocation[]) => void;
  onCancel: () => void;
}

const MAX_ALLOCATIONS = 5;

export default function AllocationBuilder({
  initialAllocations = [],
  onSave,
  onCancel,
}: AllocationBuilderProps) {
  const [allocations, setAllocations] = useState<Allocation[]>(
    initialAllocations.length > 0
      ? initialAllocations
      : [{ label: "", recipient: "", basisPoints: 0 }]
  );
  const [errors, setErrors] = useState<Record<number, string>>({});

  const totalPercentage = allocations.reduce(
    (sum, a) => sum + a.basisPoints / 100,
    0
  );
  const remainingPercentage = 100 - totalPercentage;
  const isValid = totalPercentage === 100 && allocations.length > 0;

  const validateAllocation = (index: number): string | null => {
    const allocation = allocations[index];

    if (allocation.basisPoints < 0 || allocation.basisPoints > 10000) {
      return "Persentase harus antara 0-100%";
    }

    if (allocation.label && allocation.label.length > 20) {
      return "Label maksimal 20 karakter";
    }

    // Check for duplicate recipients
    const duplicates = allocations.filter(
      (a, i) => i !== index && a.recipient === allocation.recipient && a.recipient
    );
    if (duplicates.length > 0) {
      return "Penerima sudah digunakan";
    }

    return null;
  };

  const updateAllocation = (
    index: number,
    field: keyof Allocation,
    value: string | number
  ) => {
    setAllocations((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]:
          field === "basisPoints"
            ? Math.round((value as number) * 100)
            : (value as string),
      };
      return updated;
    });

    // Clear error when field changes
    if (errors[index]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  };

  const addAllocation = () => {
    if (allocations.length >= MAX_ALLOCATIONS) return;
    setAllocations((prev) => [
      ...prev,
      { label: "", recipient: "", basisPoints: 0 },
    ]);
  };

  const removeAllocation = (index: number) => {
    if (allocations.length <= 1) return;
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Validate all
    const newErrors: Record<number, string> = {};
    allocations.forEach((_, index) => {
      const error = validateAllocation(index);
      if (error) {
        newErrors[index] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Filter out empty allocations
    const validAllocations = allocations.filter(
      (a) => a.label && a.recipient && a.basisPoints > 0
    );

    if (validAllocations.length === 0) {
      setErrors({ 0: "Minimal harus ada 1 pos pembagian" });
      return;
    }

    onSave(validAllocations);
  };

  // Calculate progress bar color
  const getProgressColor = () => {
    if (totalPercentage < 100) return "bg-error";
    if (totalPercentage > 100) return "bg-error";
    return "bg-primary";
  };

  return (
    <div className="flex flex-col gap-section-margin">
      {/* Template Name */}
      <section className="flex flex-col gap-stack-gap-md">
        <Input
          label="Nama Template"
          placeholder="Contoh: Gaji Bulanan"
          className="w-full"
        />
      </section>

      {/* Allocation List */}
      <section className="flex flex-col gap-stack-gap-lg">
        <div className="flex justify-between items-end">
          <h2 className="text-headline-sm text-on-surface font-semibold">
            Pos Pembagian
          </h2>
          <span className="text-label-lg text-on-surface-variant">
            Max {MAX_ALLOCATIONS} pos
          </span>
        </div>

        <div className="flex flex-col gap-stack-gap-md">
          {allocations.map((allocation, index) => (
            <div
              key={index}
              className="bg-surface-container rounded-2xl p-5 flex flex-col gap-stack-gap-md relative"
            >
              {/* Remove button */}
              {allocations.length > 1 && (
                <button
                  onClick={() => removeAllocation(index)}
                  className="absolute top-4 right-4 text-outline hover:text-error transition-colors"
                  aria-label="Hapus pos"
                >
                  <IconClose size={20} />
                </button>
              )}

              {/* Label */}
              <div>
                <label className="text-label-lg text-on-surface-variant font-semibold block mb-stack-gap-sm">
                  Nama Pos
                </label>
                <Input
                  value={allocation.label}
                  onChange={(e) => updateAllocation(index, "label", e.target.value)}
                  placeholder="Contoh: Kebutuhan Harian"
                  error={errors[index]}
                />
              </div>

              {/* Recipient */}
              <div>
                <label className="text-label-lg text-on-surface-variant font-semibold block mb-stack-gap-sm">
                  Alamat Wallet Penerima
                </label>
                <Input
                  value={allocation.recipient}
                  onChange={(e) =>
                    updateAllocation(index, "recipient", e.target.value)
                  }
                  placeholder="G..."
                  className="font-mono-address"
                />
              </div>

              {/* Percentage */}
              <div>
                <label className="text-label-lg text-on-surface-variant font-semibold block mb-stack-gap-sm">
                  Persentase (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={allocation.basisPoints / 100}
                    onChange={(e) =>
                      updateAllocation(index, "basisPoints", parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    max="100"
                    className="
                      w-full h-touch-target-min
                      bg-surface border-none rounded-lg
                      pl-4 pr-12
                      text-headline-md text-on-surface
                      text-right
                      focus:ring-2 focus:ring-primary-container
                    "
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-body-lg text-on-surface-variant">
                    %
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        {allocations.length < MAX_ALLOCATIONS && (
          <Button
            onClick={addAllocation}
            variant="outline"
            className="w-full gap-2"
          >
            <IconAdd size={20} />
            Tambah Pos
          </Button>
        )}
      </section>

      {/* Fixed Bottom Summary */}
      <div
        className="
          fixed bottom-0 left-0 right-0 w-full z-40
          bg-surface/90 backdrop-blur-md
          border-t border-surface-variant
          pt-4 pb-6 px-4
        "
      >
        <div className="max-w-[480px] mx-auto flex flex-col gap-4">
          {/* Summary */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-body-md text-on-surface-variant">
                Total Alokasi
              </span>
              <span
                className={`text-headline-md font-semibold ${
                  totalPercentage === 100 ? "text-primary" : "text-error"
                }`}
              >
                {totalPercentage.toFixed(0)}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
              />
            </div>

            {totalPercentage !== 100 && (
              <span className="text-label-lg text-error text-right mt-1">
                {remainingPercentage > 0
                  ? `Masih kurang ${remainingPercentage.toFixed(0)}%`
                  : `Melebihi ${Math.abs(remainingPercentage).toFixed(0)}%`}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSave}
              disabled={!isValid}
              fullWidth
              className={!isValid ? "opacity-70 cursor-not-allowed" : ""}
            >
              Simpan Template
            </Button>
            <Button onClick={onCancel} variant="ghost" fullWidth>
              Batal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
