'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ==================== LANGUAGE CONTEXT ====================

type Language = 'ID' | 'EN';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ID: {
    'brand.sub': 'Layanan Remitansi Web3',
    'network.simulated': 'Simulasi Lokal',
    'network.testnet': 'Stellar Testnet',
    'network.mainnet': 'Stellar Mainnet',
    'btn.close': 'Tutup',
    'btn.back': 'Kembali',
    'btn.continue': 'Lanjutkan',
    'btn.cancel': 'Batal',
    'btn.save': 'Simpan',
    'btn.delete': 'Hapus',
    'btn.use': 'Gunakan',
    'btn.copy': 'Salin',
    'btn.copied': 'Berhasil',
    'nav.home': 'Beranda',
    'nav.templates': 'Kelola Anggaran',
    'nav.history': 'Riwayat',
    'home.available_balance': 'SALDO TERSEDIA',
    'home.sync_tooltip': 'Singkronkan Saldo Blockchain',
    'home.sync_live': 'Live',
    'home.sync_offline': 'Mock/Offline',
    'home.equivalent_idr': 'Setara ≈ Rp {val} IDR',
    'home.btn_send': 'Kirim Remitansi',
    'home.btn_check': 'Cek Penerimaan',
    'home.btn_deposit': 'Isi Saldo (Deposit)',
    'home.edu_title': 'Keunggulan Pengiriman Lefta',
    'home.edu_desc': 'Menggunakan teknologi Stellar Blockchain. Pengiriman uang dari luar negeri ke Indonesia hanya memakan waktu 3 detik dengan biaya Rp 15 per transaksi!',
    'templates.title': 'Template Anggaran',
    'templates.desc': 'Kelola pembagian otomatis dana belanja keluarga untuk meningkatkan kedisiplinan pengeluaran.',
    'templates.btn_create': 'Buat Template Kustom Baru',
    'templates.btn_save_tpl': 'Simpan Template Baru',
    'templates.form_title': 'Buat Template Baru',
    'templates.form_name': 'Nama Template:',
    'templates.form_name_placeholder': 'Misal: Sembako & Renovasi',
    'templates.form_alloc': 'Alokasi Tiap Kategori (%):',
    'templates.form_total_alloc': 'Total Alokasi',
    'templates.btn_use_remittance': 'Gunakan untuk Kirim Remittance',
    'cat.household': 'Kebutuhan Rumah Tangga',
    'cat.business': 'Modal Usaha',
    'cat.renovation': 'Renovasi Rumah',
    'cat.education': 'Pendidikan Keluarga',
    'cat.emergency': 'Dana Darurat & Kesehatan',
    'history.title': 'Riwayat Transaksi',
    'history.count': '{count} transaksi',
    'history.filter_all': 'Semua',
    'history.filter_sent': 'Terkirim',
    'history.filter_received': 'Diterima',
    'history.empty_title': 'Tidak ada transaksi ditemukan',
    'history.empty_desc': 'Lakukan pengiriman untuk melihat riwayat.',
    'history.sent_to': 'Kirim ke {name}',
    'history.received_from': 'Terima dari {name}',
    'history.received_sender': 'Terima dari Pengirim',
    'wallet.title': 'Pengaturan Stellar Wallet',
    'wallet.desc': 'Aplikasi ini terhubung langsung ke Stellar Blockchain.',
    'wallet.address_label': 'Alamat Publik Stellar (G...)',
    'wallet.btn_change': 'Ubah Alamat',
    'wallet.btn_saving': 'Menyimpan...',
    'wallet.btn_reset_desc': 'Hapus Data & Atur Ulang Simulator',
    'wallet.btn_reset_btn': 'Reset Cache',
    'tx.title': 'Detail Transaksi',
    'tx.status': 'Status',
    'tx.status_success': 'Sukses',
    'tx.status_pending': 'Memproses',
    'tx.status_failed': 'Gagal',
    'tx.hash': 'ID Transaksi (Hash)',
    'tx.time': 'Waktu Transaksi',
    'tx.from': 'Dari',
    'tx.to': 'Ke',
    'tx.type': 'Tipe Transaksi',
    'tx.type_deposit': 'Isi Saldo (Deposit)',
    'tx.type_send': 'Kirim Uang (Remittance)',
    'tx.memo': 'Catatan / Memo',
    'tx.splits': 'Rincian Alokasi Anggaran',
    'deposit.title': 'Isi Saldo (Deposit)',
    'deposit.step1_title': 'Masukkan Jumlah Deposit',
    'deposit.step1_desc': 'Saldo Rupiah Anda akan dikonversi secara real-time.',
    'deposit.label_amount': 'Jumlah Deposit (Rupiah)',
    'deposit.asset_label': 'Konversi Menjadi Aset',
    'deposit.rate_desc': 'Kurs Konversi: 1 {asset} ≈ Rp {rate}',
    'deposit.btn_next': 'Lanjutkan Pembayaran',
    'deposit.step2_title': 'Pembayaran Virtual Account',
    'deposit.step2_desc': 'Silakan transfer tepat sesuai nominal berikut.',
    'deposit.bank_label': 'Bank Transfer (Simulasi)',
    'deposit.va_label': 'Nomor Virtual Account',
    'deposit.status_waiting': 'Menunggu Transfer...',
    'deposit.btn_confirm': 'Saya Sudah Transfer',
    'deposit.step3_title': 'Deposit Berhasil',
    'deposit.step3_desc': 'Saldo Anda telah diperbarui secara instan.',
    'deposit.btn_instant_testnet': 'Isi Instan +1.000 USDC (Demo)',
    'send.title': 'Kirim Uang (Remittance)',
    'send.step1_title': 'Pilih Kontak Keluarga',
    'send.step1_search': 'Cari kontak keluarga...',
    'send.step1_or': 'ATAU MASUKKAN ALAMAT STELLAR',
    'send.step1_custom_label': 'Alamat Wallet Stellar (G...)',
    'send.step1_custom_placeholder': 'Masukkan Alamat Stellar',
    'send.step2_recipient': 'Kirim ke:',
    'send.step2_change': 'Ubah',
    'send.step2_asset_label': 'Pilih Aset Kripto',
    'send.step2_method_label': 'Metode Pengiriman',
    'send.step2_method_direct': 'Kirim Langsung',
    'send.step2_method_direct_desc': 'Dana masuk instan ke wallet penerima.',
    'send.step2_amount_label': 'Masukkan Jumlah Kiriman',
    'send.step2_amount_bal': 'Saldo:',
    'send.step2_equiv_label': 'Keluarga Menerima (IDR)',
    'send.step2_rate_label': 'Kurs Jaringan',
    'send.step2_fee_label': 'Biaya Jaringan',
    'send.step2_fee_val': '0.0001 XLM (≈ Rp 0,15) • INSTAN',
    'send.step2_notes_label': 'Pesan / Catatan (Opsional)',
    'send.step2_notes_placeholder': 'Contoh: Uang bulanan belanja Ibu',
    'send.step2_split_label': 'Atur Alokasi Pos Anggaran (Split)',
    'send.step2_split_desc': 'Bagi dana untuk kebutuhan keluarga',
    'send.step2_split_preset': 'Pilih Template Alokasi:',
    'send.step2_split_save_custom': 'Simpan Template Baru',
    'send.step2_split_custom_title': 'Nama Template:',
    'send.step2_split_custom_placeholder': 'Misal: Sembako & Pendidikan',
    'send.step2_btn_review': 'Tinjau Kiriman',
    'send.step3_title': 'Tinjauan Terakhir',
    'send.step3_total': 'Total Dikirim',
    'send.step3_recipient': 'Penerima',
    'send.step3_method': 'Metode',
    'send.step3_method_direct': 'Kirim Langsung (Wallet)',
    'send.step3_fee': 'Biaya Jaringan',
    'send.step3_notes': 'Memo / Catatan',
    'send.step3_splits_title': 'Ringkasan Alokasi Pos Anggaran',
    'send.step3_disclaimer_direct': 'Transaksi blockchain bersifat permanen.',
    'send.step3_btn_confirm': 'Konfirmasi & Kirim Sekarang',
    'send.step3_btn_edit': 'Kembali Edit',
    'send.step4_title': 'Status Transaksi',
    'send.step4_desc': 'Demonstrasi status transaksi.',
    'send.step4_waiting': 'Menunggu Tanda Tangan',
    'send.step4_waiting_desc': 'Menunggu konfirmasi di wallet Anda.',
    'send.step5_success': 'Transaksi Berhasil',
    'send.step5_btn_finish': 'Selesai & Tutup',
    'sidebar.title': 'Informasi Akun',
    'sidebar.address_label': 'ALAMAT STELLAR AKUN ANDA',
    'sidebar.btn_copy': 'Salin Alamat',
    'sidebar.btn_copied': 'Tersalin!',
    'sidebar.system_desc': 'Sistem Remitansi Lefta mendemonstrasikan keandalan jaringan Stellar blockchain.'
  },
  EN: {
    'brand.sub': 'Web3 Remittance Service',
    'network.simulated': 'Local Simulation',
    'network.testnet': 'Stellar Testnet',
    'network.mainnet': 'Stellar Mainnet',
    'btn.close': 'Close',
    'btn.back': 'Back',
    'btn.continue': 'Continue',
    'btn.cancel': 'Cancel',
    'btn.save': 'Save',
    'btn.delete': 'Delete',
    'btn.use': 'Use',
    'btn.copy': 'Copy',
    'btn.copied': 'Copied',
    'nav.home': 'Home',
    'nav.templates': 'Budget Templates',
    'nav.history': 'History',
    'home.available_balance': 'AVAILABLE BALANCE',
    'home.sync_tooltip': 'Sync Blockchain Balances',
    'home.sync_live': 'Live',
    'home.sync_offline': 'Mock/Offline',
    'home.equivalent_idr': 'Equivalent ≈ Rp {val} IDR',
    'home.btn_send': 'Send Remittance',
    'home.btn_check': 'Check Receipt',
    'home.btn_deposit': 'Deposit Balance',
    'home.edu_title': 'Benefits of Sending with Lefta',
    'home.edu_desc': 'Powered by Stellar Blockchain. Send money from abroad to Indonesia takes only 3 seconds with near-zero fees!',
    'templates.title': 'Budget Templates',
    'templates.desc': 'Manage automatic division of family spending funds.',
    'templates.btn_create': 'Create Custom Template',
    'templates.btn_save_tpl': 'Save New Template',
    'templates.form_title': 'Create New Template',
    'templates.form_name': 'Template Name:',
    'templates.form_name_placeholder': 'e.g., Groceries & Renovation',
    'templates.form_alloc': 'Allocation per Category (%):',
    'templates.form_total_alloc': 'Total Allocation',
    'templates.btn_use_remittance': 'Use for Sending Remittance',
    'cat.household': 'Household Needs',
    'cat.business': 'Business Capital',
    'cat.renovation': 'Home Renovation',
    'cat.education': 'Family Education',
    'cat.emergency': 'Emergency Fund & Health',
    'history.title': 'Transaction History',
    'history.count': '{count} transactions',
    'history.filter_all': 'All',
    'history.filter_sent': 'Sent',
    'history.filter_received': 'Received',
    'history.empty_title': 'No transactions found',
    'history.empty_desc': 'Send remittance to see history.',
    'history.sent_to': 'Sent to {name}',
    'history.received_from': 'Received from {name}',
    'history.received_sender': 'Received from Sender',
    'wallet.title': 'Stellar Wallet Settings',
    'wallet.desc': 'This application connects directly to Stellar Blockchain.',
    'wallet.address_label': 'Stellar Public Address (G...)',
    'wallet.btn_change': 'Edit Address',
    'wallet.btn_saving': 'Saving...',
    'wallet.btn_reset_desc': 'Clear Local Cache & Reset Simulator',
    'wallet.btn_reset_btn': 'Reset Cache',
    'tx.title': 'Transaction Details',
    'tx.status': 'Status',
    'tx.status_success': 'Success',
    'tx.status_pending': 'Processing',
    'tx.status_failed': 'Failed',
    'tx.hash': 'Transaction ID (Hash)',
    'tx.time': 'Transaction Time',
    'tx.from': 'From',
    'tx.to': 'To',
    'tx.type': 'Transaction Type',
    'tx.type_deposit': 'Deposit Balance',
    'tx.type_send': 'Send Remittance',
    'tx.memo': 'Notes / Memo',
    'tx.splits': 'Budget Allocation Breakdown',
    'deposit.title': 'Deposit Balance',
    'deposit.step1_title': 'Enter Deposit Amount',
    'deposit.step1_desc': 'Your Rupiah balance will be converted in real-time.',
    'deposit.label_amount': 'Deposit Amount (Rupiah)',
    'deposit.asset_label': 'Convert Into Asset',
    'deposit.rate_desc': 'Exchange Rate: 1 {asset} ≈ Rp {rate}',
    'deposit.btn_next': 'Proceed to Payment',
    'deposit.step2_title': 'Virtual Account Payment',
    'deposit.step2_desc': 'Please transfer the exact amount below.',
    'deposit.bank_label': 'Bank Transfer (Simulation)',
    'deposit.va_label': 'Virtual Account Number',
    'deposit.status_waiting': 'Waiting for Transfer...',
    'deposit.btn_confirm': 'I Have Transferred',
    'deposit.step3_title': 'Deposit Successful',
    'deposit.step3_desc': 'Your balance has been updated instantly.',
    'deposit.btn_instant_testnet': 'Instant Demo +1,000 USDC',
    'send.title': 'Send Remittance',
    'send.step1_title': 'Choose Family Contact',
    'send.step1_search': 'Search family contact...',
    'send.step1_or': 'OR ENTER STELLAR ADDRESS',
    'send.step1_custom_label': 'Stellar Wallet Address (G...)',
    'send.step1_custom_placeholder': 'Enter Stellar Address',
    'send.step2_recipient': 'Send to:',
    'send.step2_change': 'Change',
    'send.step2_asset_label': 'Select Crypto Asset',
    'send.step2_method_label': 'Delivery Method',
    'send.step2_method_direct': 'Direct Transfer',
    'send.step2_method_direct_desc': 'Funds arrive instantly to recipient wallet.',
    'send.step2_amount_label': 'Enter Remittance Amount',
    'send.step2_amount_bal': 'Balance:',
    'send.step2_equiv_label': 'Family Receives (IDR)',
    'send.step2_rate_label': 'Network Exchange Rate',
    'send.step2_fee_label': 'Network Fee',
    'send.step2_fee_val': '0.0001 XLM (≈ Rp 0.15) • INSTANT',
    'send.step2_notes_label': 'Additional Message (Optional)',
    'send.step2_notes_placeholder': 'e.g., Mom\'s monthly grocery funds',
    'send.step2_split_label': 'Set Budget Split Allocation',
    'send.step2_split_desc': 'Split funds for family needs',
    'send.step2_split_preset': 'Select Allocation Template:',
    'send.step2_split_save_custom': 'Save as New Template',
    'send.step2_split_custom_title': 'Template Name:',
    'send.step2_split_custom_placeholder': 'e.g., Groceries & Education',
    'send.step2_btn_review': 'Review Remittance',
    'send.step3_title': 'Final Review',
    'send.step3_total': 'Total Sent',
    'send.step3_recipient': 'Recipient',
    'send.step3_method': 'Method',
    'send.step3_method_direct': 'Direct Send (Wallet)',
    'send.step3_fee': 'Network Fee',
    'send.step3_notes': 'Memo / Notes',
    'send.step3_splits_title': 'Budget Allocation Summary',
    'send.step3_disclaimer_direct': 'Blockchain transactions are permanent.',
    'send.step3_btn_confirm': 'Confirm & Send Now',
    'send.step3_btn_edit': 'Edit Settings',
    'send.step4_title': 'Transaction Status',
    'send.step4_desc': 'Transaction status demonstration.',
    'send.step4_waiting': 'Awaiting Signature',
    'send.step4_waiting_desc': 'Waiting for wallet confirmation.',
    'send.step5_success': 'Transaction Successful',
    'send.step5_btn_finish': 'Finish & Close',
    'sidebar.title': 'Account Information',
    'sidebar.address_label': 'YOUR STELLAR WALLET ADDRESS',
    'sidebar.btn_copy': 'Copy Address',
    'sidebar.btn_copied': 'Copied!',
    'sidebar.system_desc': 'Lefta Remittance Service demonstrates Stellar blockchain reliability.'
  }
};

// ==================== EXCHANGE RATES CONTEXT ====================

interface ExchangeRatesContextType {
  USDC_TO_IDR: number;
  XLM_TO_IDR: number;
  IDR_TO_USDC: number;
  IDR_TO_XLM: number;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Default fallback rates (placeholder until API fetches)
const FALLBACK_RATES_WITHOUT_REFETCH = {
  USDC_TO_IDR: 15500,
  XLM_TO_IDR: 1450,
  IDR_TO_USDC: 1 / 15500,
  IDR_TO_XLM: 1 / 1450,
  lastUpdated: null as Date | null,
  isLoading: false,
  error: null as string | null,
};

// FALLBACK_RATES will be populated after fetchRates is defined

// ==================== COMBINED PROVIDER ====================

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  rates: ExchangeRatesContextType;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Language state
  const [language, setLanguage] = useState<Language>('ID');
  const [ratesState, setRatesState] = useState({
    ...FALLBACK_RATES_WITHOUT_REFETCH,
    refetch: () => {} // placeholder
  } as ExchangeRatesContextType);

  // Load saved language
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lefta_language');
      if (saved === 'ID' || saved === 'EN') {
        setLanguage(saved);
      }
    }
  }, []);

  // Save language
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lefta_language', language);
    }
  }, [language]);

  // Translation function
  const t = useCallback((key: string, replacements?: Record<string, string | number>) => {
    let text = translations[language][key] || translations['ID'][key] || key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [language]);

  // Fetch exchange rates
  const fetchRates = useCallback(async () => {
    setRatesState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const [fiatResponse, cryptoResponse] = await Promise.all([
        fetch('https://api.exchangerate-api.com/v4/latest/USD'),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd')
      ]);

      if (!fiatResponse.ok) {
        throw new Error('Failed to fetch fiat rates');
      }

      const fiatData = await fiatResponse.json();
      const usdToIdr = fiatData.rates?.IDR || FALLBACK_RATES_WITHOUT_REFETCH.USDC_TO_IDR;

      let xlmToUsd = 0.45;
      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json();
        if (cryptoData.stellar?.usd) {
          xlmToUsd = cryptoData.stellar.usd;
        }
      }

      const xlmToIdr = xlmToUsd * usdToIdr;

      setRatesState({
        USDC_TO_IDR: usdToIdr,
        XLM_TO_IDR: xlmToIdr,
        IDR_TO_USDC: 1 / usdToIdr,
        IDR_TO_XLM: 1 / xlmToIdr,
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
        refetch: fetchRates,
      });
    } catch (error) {
      console.error('[Lefta] Failed to fetch exchange rates:', error);
      setRatesState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch rates',
        refetch: fetchRates,
      }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  return (
    <AppContext.Provider value={{ language, setLanguage, t, rates: ratesState }}>
      {children}
    </AppContext.Provider>
  );
}

// ==================== HOOKS ====================

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export function useLanguage() {
  const { language, setLanguage, t } = useApp();
  return { language, setLanguage, t };
}

export function useExchangeRates() {
  const { rates } = useApp();
  return rates;
}

// Helper function to convert amounts
export function convertToIDR(amount: number, currency: 'USDC' | 'XLM', rates: ExchangeRatesContextType): number {
  if (currency === 'USDC') {
    return amount * rates.USDC_TO_IDR;
  }
  return amount * rates.XLM_TO_IDR;
}

export function formatCurrency(amount: number, currency: 'IDR' | 'USDC' | 'XLM'): string {
  if (currency === 'IDR') {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  }
  if (currency === 'USDC') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} XLM`;
}
