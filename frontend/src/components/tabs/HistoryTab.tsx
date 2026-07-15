'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Contact, Transaction } from '@/lib/types';
import { useLanguage } from '@/context/AppContext';

interface HistoryTabProps {
  filteredTransactions: Transaction[];
  txFilter: 'all' | 'sent' | 'received';
  setTxFilter: (filter: 'all' | 'sent' | 'received') => void;
  setSelectedTx: (tx: Transaction) => void;
  contacts: Contact[];
}

export function HistoryTab({
  filteredTransactions,
  txFilter,
  setTxFilter,
  setSelectedTx,
  contacts
}: HistoryTabProps) {
  const { t, language } = useLanguage();

  return (
    <motion.div
      id="history-tab-container"
      key="history-tab"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4 text-left"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-on-surface">{t('history.title')}</h2>
        <span className="text-xs text-on-surface-variant font-mono">{t('history.count', { count: filteredTransactions.length })}</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-surface-container-low p-1 rounded-xl gap-1">
        {(['all', 'sent', 'received'] as const).map(f => (
          <button
            key={f}
            onClick={() => setTxFilter(f)}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all capitalize cursor-pointer ${
              txFilter === f
                ? 'bg-white text-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {f === 'all' ? t('history.filter_all') : f === 'sent' ? t('history.filter_sent') : t('history.filter_received')}
          </button>
        ))}
      </div>

      {/* transactions list */}
      <div className="flex flex-col gap-3">
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant gap-2 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30">
            <HistoryIcon className="w-10 h-10 stroke-1 text-outline" />
            <p className="text-sm font-semibold">{t('history.empty_title')}</p>
            <p className="text-xs text-center px-6">{t('history.empty_desc')}</p>
          </div>
        ) : (
          filteredTransactions.map(tx => {
            const isSent = tx.type === 'sent';
            const contact = contacts.find(c => c.address === tx.destinationAddress || c.address === tx.sourceAddress);
            const displayTitle = isSent
              ? (contact ? t('history.sent_to', { name: contact.name }) : `Kirim ke ${tx.destinationAddress.slice(0, 4)}...${tx.destinationAddress.slice(-4)}`)
              : (contact ? t('history.received_from', { name: contact.name }) : t('history.received_sender'));

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className="bg-white hover:bg-surface-container-low border border-outline-variant/20 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs cursor-pointer active:scale-99 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSent ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {isSent ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-on-surface">{displayTitle}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {new Date(tx.timestamp).toLocaleString(language === 'ID' ? 'id-ID' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-sm font-bold ${isSent ? 'text-on-surface' : 'text-emerald-600'}`}>
                    {isSent ? '-' : '+'}{tx.amount} {tx.currency}
                  </span>
                  <span className="text-[11px] text-on-surface-variant mt-0.5">
                    Rp {tx.amountIdr.toLocaleString(language === 'ID' ? 'id-ID' : 'en-US')}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
