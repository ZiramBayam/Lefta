'use client';

import React from 'react';
import { Home as HomeIcon, Layers, History as HistoryIcon } from 'lucide-react';
import { useLanguage } from '@/context/AppContext';

interface BottomNavProps {
  activeTab: 'home' | 'templates' | 'history';
  setActiveTab: (tab: 'home' | 'templates' | 'history') => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { t } = useLanguage();

  return (
    <nav
      id="mobile-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center px-4 py-2 bg-surface-container-low/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(91,100,0,0.06)] border-t border-outline-variant/15 pb-6 pt-2.5 lg:hidden"
    >
      <button
        id="nav-btn-home"
        onClick={() => setActiveTab('home')}
        className={`flex-1 flex flex-col items-center justify-center rounded-xl py-1.5 active:scale-95 transition-all duration-200 min-h-[44px] cursor-pointer ${
          activeTab === 'home'
            ? 'bg-primary-container text-on-primary-container font-extrabold shadow-3xs'
            : 'text-on-surface-variant hover:text-on-surface font-semibold'
        }`}
      >
        <HomeIcon className="w-5 h-5 mb-0.5 stroke-[2.5]" />
        <span className="text-[10px] font-bold">{t('nav.home')}</span>
      </button>

      <button
        id="nav-btn-templates"
        onClick={() => setActiveTab('templates')}
        className={`flex-1 flex flex-col items-center justify-center rounded-xl py-1.5 active:scale-95 transition-all duration-200 min-h-[44px] cursor-pointer ${
          activeTab === 'templates'
            ? 'bg-primary-container text-on-primary-container font-extrabold shadow-3xs'
            : 'text-on-surface-variant hover:text-on-surface font-semibold'
        }`}
      >
        <Layers className="w-5 h-5 mb-0.5 stroke-[2.5]" />
        <span className="text-[10px] font-bold">{t('nav.templates')}</span>
      </button>

      <button
        id="nav-btn-history"
        onClick={() => setActiveTab('history')}
        className={`flex-1 flex flex-col items-center justify-center rounded-xl py-1.5 active:scale-95 transition-all duration-200 min-h-[44px] cursor-pointer ${
          activeTab === 'history'
            ? 'bg-primary-container text-on-primary-container font-extrabold shadow-3xs'
            : 'text-on-surface-variant hover:text-on-surface font-semibold'
        }`}
      >
        <HistoryIcon className="w-5 h-5 mb-0.5 stroke-[2.5]" />
        <span className="text-[10px] font-bold">{t('nav.history')}</span>
      </button>
    </nav>
  );
}
