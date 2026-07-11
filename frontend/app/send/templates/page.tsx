"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TopAppBar from "@/components/TopAppBar";
import BottomNav from "@/components/BottomNav";
import { Button, IconSend, IconAdd, IconMoreVert } from "@/components/ui";
import SplitBar, { SplitBarLegend } from "@/components/SplitBar";
import AllocationBuilder from "@/components/AllocationBuilder";
import Modal from "@/components/ui/Modal";
import { SplitTemplate, Allocation } from "@/types";
import { getSenderTemplates, createTemplate, deactivateTemplate } from "@/lib/contracts";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<SplitTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllocationBuilder, setShowAllocationBuilder] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getSenderTemplates("current-user");
        setTemplates(data);
      } catch (err) {
        console.error("Failed to load templates:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const handleSaveTemplate = async (allocations: Allocation[]) => {
    try {
      await createTemplate("current-user", allocations);
      // Refresh templates
      const data = await getSenderTemplates("current-user");
      setTemplates(data);
      setShowAllocationBuilder(false);
    } catch (err) {
      console.error("Failed to create template:", err);
    }
  };

  const handleDeactivate = async (templateId: string) => {
    try {
      await deactivateTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setMenuOpen(null);
    } catch (err) {
      console.error("Failed to deactivate template:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-[100px]">
      <TopAppBar />

      <main className="max-w-[480px] mx-auto px-container-padding pt-6 flex flex-col gap-stack-gap-lg">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-headline-md text-on-surface font-semibold">
            Daftar Template
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-container border-t-transparent rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant">
            <p className="text-body-lg mb-4">Belum ada template</p>
            <Button onClick={() => setShowAllocationBuilder(true)}>
              Buat Template Pertama
            </Button>
          </div>
        ) : (
          templates.map((template) => (
            <article
              key={template.id}
              className="
                bg-surface-container rounded-2xl p-6
                flex flex-col gap-stack-gap-md
                transition-transform active:scale-[0.98]
              "
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <h3 className="text-headline-sm text-on-surface font-semibold">
                    {template.allocations[0]?.label || "Template"}
                  </h3>
                  <p className="text-body-md text-on-surface-variant text-sm mt-1">
                    {template.allocations.length} pos pembagian
                  </p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === template.id ? null : template.id)}
                    className="p-2 -mr-2 -mt-2 rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
                    aria-label="Menu"
                  >
                    <IconMoreVert size={24} />
                  </button>
                  {menuOpen === template.id && (
                    <div className="absolute right-0 top-12 bg-surface rounded-lg shadow-lg py-2 min-w-[160px] z-10">
                      <button
                        onClick={() => handleDeactivate(template.id)}
                        className="w-full px-4 py-2 text-left text-body-md text-error hover:bg-surface-container transition-colors"
                      >
                        Nonaktifkan
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Segmented Progress Bar */}
              <SplitBar allocations={template.allocations} />

              {/* Legend */}
              <SplitBarLegend allocations={template.allocations} />

              {/* Use Template Button */}
              <Link
                href={`/send?template=${template.id}`}
                className="
                  mt-2 w-full h-12 rounded-full
                  border-2 border-primary text-primary
                  text-label-lg font-semibold
                  flex items-center justify-center gap-2
                  hover:bg-primary/5 transition-colors
                "
              >
                <IconSend size={18} />
                Gunakan Template
              </Link>
            </article>
          ))
        )}
      </main>

      {/* Floating Action Button */}
      {templates.length > 0 && (
        <div
          className="
            fixed bottom-[90px] right-0 left-0
            max-w-[480px] mx-auto px-container-padding
            flex justify-end pointer-events-none z-40
          "
        >
          <button
            onClick={() => setShowAllocationBuilder(true)}
            className="
              pointer-events-auto
              h-touch-target-min px-6 rounded-2xl
              bg-primary-container text-on-primary-container
              text-label-lg font-semibold
              flex items-center gap-2
              shadow-[0px_4px_20px_rgba(91,100,0,0.06)]
              hover:brightness-95 active:scale-95
              transition-all
            "
          >
            <IconAdd size={20} />
            Buat Template Baru
          </button>
        </div>
      )}

      {/* Allocation Builder Modal */}
      <Modal
        isOpen={showAllocationBuilder}
        onClose={() => setShowAllocationBuilder(false)}
        title="Buat Template Baru"
      >
        <AllocationBuilder
          onSave={handleSaveTemplate}
          onCancel={() => setShowAllocationBuilder(false)}
        />
      </Modal>

      <BottomNav />
    </div>
  );
}
