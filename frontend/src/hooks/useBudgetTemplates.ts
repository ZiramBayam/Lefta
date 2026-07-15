'use client';

import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface BudgetSplitAlloc {
  category: string;
  percentage: number;
}

export interface BudgetTemplate {
  id: string;
  name: string;
  isCustom?: boolean;
  allocations: BudgetSplitAlloc[];
}

const DEFAULT_TEMPLATES: BudgetTemplate[] = [
  {
    id: 'household',
    name: 'Belanja Ibu',
    allocations: [
      { category: 'Kebutuhan Rumah Tangga', percentage: 50 },
      { category: 'Modal Usaha', percentage: 10 },
      { category: 'Renovasi Rumah', percentage: 10 },
      { category: 'Pendidikan Keluarga', percentage: 20 },
      { category: 'Dana Darurat & Kesehatan', percentage: 10 },
    ],
  },
  {
    id: 'business',
    name: 'Modal Usaha',
    allocations: [
      { category: 'Kebutuhan Rumah Tangga', percentage: 25 },
      { category: 'Modal Usaha', percentage: 50 },
      { category: 'Renovasi Rumah', percentage: 10 },
      { category: 'Pendidikan Keluarga', percentage: 5 },
      { category: 'Dana Darurat & Kesehatan', percentage: 10 },
    ],
  },
  {
    id: 'equal',
    name: 'Sama Rata',
    allocations: [
      { category: 'Kebutuhan Rumah Tangga', percentage: 20 },
      { category: 'Modal Usaha', percentage: 20 },
      { category: 'Renovasi Rumah', percentage: 20 },
      { category: 'Pendidikan Keluarga', percentage: 20 },
      { category: 'Dana Darurat & Kesehatan', percentage: 20 },
    ],
  },
];

export function useBudgetTemplates() {
  const [budgetTemplates, setBudgetTemplates] = useLocalStorage<BudgetTemplate[]>('lefta_budget_templates', DEFAULT_TEMPLATES);

  const [newTemplateName, setNewTemplateName] = useState('');
  const [showSaveTemplateForm, setShowSaveTemplateForm] = useState(false);
  const [templateSaveSuccess, setTemplateSaveSuccess] = useState('');

  const [createTemplateName, setCreateTemplateName] = useState('');
  const [createAllocations, setCreateAllocations] = useState<BudgetSplitAlloc[]>([
    { category: 'Kebutuhan Rumah Tangga', percentage: 30 },
    { category: 'Modal Usaha', percentage: 20 },
    { category: 'Renovasi Rumah', percentage: 10 },
    { category: 'Pendidikan Keluarga', percentage: 20 },
    { category: 'Dana Darurat & Kesehatan', percentage: 20 },
  ]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  return {
    budgetTemplates, setBudgetTemplates,
    newTemplateName, setNewTemplateName,
    showSaveTemplateForm, setShowSaveTemplateForm,
    templateSaveSuccess, setTemplateSaveSuccess,
    createTemplateName, setCreateTemplateName,
    createAllocations, setCreateAllocations,
    showCreateForm, setShowCreateForm,
  };
}
