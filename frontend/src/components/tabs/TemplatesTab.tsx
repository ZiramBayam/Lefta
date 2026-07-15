'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles, Home as HomeIcon, Briefcase, Hammer, GraduationCap, HeartPulse, CheckCircle2, Info, Send, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';
import { createTemplate, getTemplate, getUserTemplates, deactivateTemplate } from '@/contracts/api';

interface BudgetSplit {
  category: string;
  percentage: number;
}

interface BudgetTemplate {
  id: string;
  name: string;
  isCustom?: boolean;
  allocations: BudgetSplit[];
}

interface TemplatesTabProps {
  budgetTemplates: BudgetTemplate[];
  setBudgetTemplates: React.Dispatch<React.SetStateAction<BudgetTemplate[]>>;
  showCreateForm: boolean;
  setShowCreateForm: (show: boolean) => void;
  createTemplateName: string;
  setCreateTemplateName: (name: string) => void;
  createAllocations: BudgetSplit[];
  setCreateAllocations: React.Dispatch<React.SetStateAction<BudgetSplit[]>>;
  setIsSplitActive: (active: boolean) => void;
  setSplitPreset: (preset: string) => void;
  setSplitAllocations: (allocations: BudgetSplit[]) => void;
  setSendStep: (step: number) => void;
  setShowSendDrawer: (show: boolean) => void;
  stellarAddress: string;
  setIsSavingToContract?: (saving: boolean) => void;
}

export function TemplatesTab({
  budgetTemplates,
  setBudgetTemplates,
  showCreateForm,
  setShowCreateForm,
  createTemplateName,
  setCreateTemplateName,
  createAllocations,
  setCreateAllocations,
  setIsSplitActive,
  setSplitPreset,
  setSplitAllocations,
  setSendStep,
  setShowSendDrawer,
  stellarAddress,
  setIsSavingToContract,
}: TemplatesTabProps) {
  const { t, language } = useLanguage();
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getCategoryTranslation = (catName: string) => {
    switch (catName) {
      case 'Kebutuhan Rumah Tangga':
        return t('cat.household');
      case 'Modal Usaha':
        return t('cat.business');
      case 'Renovasi Rumah':
        return t('cat.renovation');
      case 'Pendidikan Keluarga':
        return t('cat.education');
      case 'Dana Darurat & Kesehatan':
        return t('cat.emergency');
      default:
        return catName;
    }
  };

  // Fetch on-chain templates on mount
  useEffect(() => {
    if (!stellarAddress) return;
    (async () => {
      setIsLoadingContract(true);
      try {
        const ids = await getUserTemplates(stellarAddress);
        if (!ids || ids.length === 0) return;
        const fetched: BudgetTemplate[] = [];
        for (const id of ids) {
          const tpl = await getTemplate(id);
          if (tpl && tpl.isActive) {
            fetched.push({
              id: tpl.id,
              name: tpl.name || `Template ${id.slice(0, 8)}`,
              allocations: tpl.allocations.map(a => ({
                category: a.category,
                percentage: a.percentage,
              })),
            });
          }
        }
        if (fetched.length > 0) {
          setBudgetTemplates(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newOnes = fetched.filter(t => !existingIds.has(t.id));
            return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
          });
        }
      } catch {
        // silent — contract not available
      } finally {
        setIsLoadingContract(false);
      }
    })();
  }, [stellarAddress, setBudgetTemplates]);

  const handleCreateTemplate = async () => {
    const totalPct = createAllocations.reduce((sum, x) => sum + x.percentage, 0);
    if (!createTemplateName.trim() || totalPct !== 100) return;

    const newTpl: BudgetTemplate = {
      id: `custom-${Date.now()}`,
      name: `✨ ${createTemplateName.trim()}`,
      isCustom: true,
      allocations: [...createAllocations],
    };

    setBudgetTemplates(prev => [...prev, newTpl]);
    setCreateTemplateName('');
    setShowCreateForm(false);

    // Also save to contract if wallet connected
    if (stellarAddress) {
      setIsSaving(true);
      setIsSavingToContract?.(true);
      try {
        const allocs = createAllocations.map(a => ({
          label: a.category,
          recipient: stellarAddress,
          percentage: a.percentage,
        }));
        const txHash = await createTemplate(stellarAddress, allocs);
      } catch {
        // contract save failed silently — template still exists locally
      } finally {
        setIsSaving(false);
        setIsSavingToContract?.(false);
      }
    }
  };

  const handleDeleteTemplate = async (tplId: string) => {
    setBudgetTemplates(prev => prev.filter(t => t.id !== tplId));

    if (stellarAddress && /^[0-9a-f]{64}$/i.test(tplId)) {
      try {
        await deactivateTemplate(stellarAddress, tplId);
      } catch {
        // silent
      }
    }
  };

  return (
    <motion.div
      id="templates-tab-container"
      key="templates-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4 text-left"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-on-surface">{t('templates.title')}</h2>
        <p className="text-[11px] text-on-surface-variant leading-relaxed">
          {t('templates.desc')}
        </p>
      </div>

      {/* Create template trigger button */}
      {!showCreateForm ? (
        <button
          onClick={() => {
            setShowCreateForm(true);
            setCreateTemplateName('');
            setCreateAllocations([
              { category: 'Kebutuhan Rumah Tangga', percentage: 30 },
              { category: 'Modal Usaha', percentage: 20 },
              { category: 'Renovasi Rumah', percentage: 10 },
              { category: 'Pendidikan Keluarga', percentage: 20 },
              { category: 'Dana Darurat & Kesehatan', percentage: 20 },
            ]);
          }}
          className="w-full py-3 bg-primary text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {t('templates.btn_create')}
        </button>
      ) : (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> {t('templates.form_title')}
            </span>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-on-surface-variant hover:text-on-surface text-xs font-semibold cursor-pointer"
            >
              {t('btn.cancel')}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant">{t('templates.form_name')}</label>
            <input
              type="text"
              placeholder={t('templates.form_name_placeholder')}
              value={createTemplateName}
              onChange={(e) => setCreateTemplateName(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-xl border border-outline-variant/30 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-on-surface-variant">{t('templates.form_alloc')}</label>
            {createAllocations.map(cat => (
              <div key={cat.category} className="flex justify-between items-center bg-white p-2 rounded-xl border border-outline-variant/10 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-on-surface-variant">
                  {cat.category === 'Kebutuhan Rumah Tangga' && <HomeIcon className="w-3.5 h-3.5 text-sky-600" />}
                  {cat.category === 'Modal Usaha' && <Briefcase className="w-3.5 h-3.5 text-emerald-600" />}
                  {cat.category === 'Renovasi Rumah' && <Hammer className="w-3.5 h-3.5 text-amber-600" />}
                  {cat.category === 'Pendidikan Keluarga' && <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                  {cat.category === 'Dana Darurat & Kesehatan' && <HeartPulse className="w-3.5 h-3.5 text-rose-600" />}
                  <span>{getCategoryTranslation(cat.category)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateAllocations(prev => prev.map(item => {
                        if (item.category === cat.category) {
                          return { ...item, percentage: Math.max(0, item.percentage - 5) };
                        }
                        return item;
                      }));
                    }}
                    className="w-6 h-6 bg-surface-container hover:bg-surface-container-high active:scale-90 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-mono font-bold text-xs w-9 text-center">{cat.percentage}%</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateAllocations(prev => prev.map(item => {
                        if (item.category === cat.category) {
                          return { ...item, percentage: Math.min(100, item.percentage + 5) };
                        }
                        return item;
                      }));
                    }}
                    className="w-6 h-6 bg-surface-container hover:bg-surface-container-high active:scale-90 rounded flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(() => {
            const totalPct = createAllocations.reduce((sum, x) => sum + x.percentage, 0);
            const isCorrect = totalPct === 100;
            return (
              <div className="flex flex-col gap-2.5">
                <div className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold ${
                  isCorrect
                    ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Info className="w-4 h-4 text-amber-600" />}
                    <span>{t('templates.form_total_alloc')}</span>
                  </div>
                  <span className="font-mono text-sm">{totalPct}% / 100%</span>
                </div>

                <button
                  type="button"
                  disabled={!isCorrect || !createTemplateName.trim() || isSaving}
                  onClick={handleCreateTemplate}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    isCorrect && createTemplateName.trim() && !isSaving
                      ? 'bg-primary text-white hover:scale-102 active:scale-98'
                      : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                  }`}
                >
                  {isSaving ? (
                    <span className="flex items-center justify-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...</span>
                  ) : (
                    t('templates.btn_save_tpl')
                  )}
                </button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Templates List */}
      <div className="flex flex-col gap-3">
        {budgetTemplates.map(tpl => {
          return (
            <div key={tpl.id} className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-4 flex flex-col gap-3 shadow-2xs">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-on-surface">{tpl.name}</span>
                {tpl.isCustom && (
                  <button
                    onClick={() => handleDeleteTemplate(tpl.id)}
                    className="text-xs font-bold text-error bg-error/5 hover:bg-error/10 px-2 py-1 rounded-lg cursor-pointer"
                  >
                    {t('btn.delete')}
                  </button>
                )}
              </div>

              {/* Visual distribution progress bar */}
              <div className="flex h-2.5 rounded-full overflow-hidden w-full bg-surface-container">
                {tpl.allocations.filter((a) => a.percentage > 0).map((alloc, idx) => {
                  const bgColors = [
                    'bg-sky-500',
                    'bg-emerald-500',
                    'bg-amber-500',
                    'bg-indigo-500',
                    'bg-rose-500'
                  ];
                  return (
                    <div
                      key={alloc.category}
                      style={{ width: `${alloc.percentage}%` }}
                      className={`${bgColors[idx % bgColors.length]} h-full`}
                      title={`${getCategoryTranslation(alloc.category)}: ${alloc.percentage}%`}
                    />
                  );
                })}
              </div>

              {/* Allocation values */}
              <div className="flex flex-col gap-1.5">
                {tpl.allocations.filter((a) => a.percentage > 0).map((alloc) => (
                  <div key={alloc.category} className="flex justify-between items-center text-[11px] font-semibold text-on-surface-variant">
                    <div className="flex items-center gap-1.5">
                      {alloc.category === 'Kebutuhan Rumah Tangga' && <HomeIcon className="w-3.5 h-3.5 text-sky-600" />}
                      {alloc.category === 'Modal Usaha' && <Briefcase className="w-3.5 h-3.5 text-emerald-600" />}
                      {alloc.category === 'Renovasi Rumah' && <Hammer className="w-3.5 h-3.5 text-amber-600" />}
                      {alloc.category === 'Pendidikan Keluarga' && <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                      {alloc.category === 'Dana Darurat & Kesehatan' && <HeartPulse className="w-3.5 h-3.5 text-rose-600" />}
                      <span>{getCategoryTranslation(alloc.category)}</span>
                    </div>
                    <span className="font-mono font-bold text-on-surface text-xs">{alloc.percentage}%</span>
                  </div>
                ))}
              </div>

              <div className="h-px bg-outline-variant/10 my-1"></div>

              {/* Gunakan Template Trigger */}
              <button
                onClick={() => {
                  setIsSplitActive(true);
                  setSplitPreset(tpl.id);
                  setSplitAllocations(tpl.allocations);
                  setSendStep(1);
                  setShowSendDrawer(true);
                }}
                className="w-full py-2 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> {t('templates.btn_use_remittance')}
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
