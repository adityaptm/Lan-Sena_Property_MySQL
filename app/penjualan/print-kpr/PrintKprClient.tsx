'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatTanggalIndonesia } from '@/lib/format';
import {
  ChevronLeft,
  Edit,
  Printer,
  X,
  FileText,
  Check,
  Eye,
  Layers,
  Search,
  User,
  Users,
  Building2,
  MapPin,
  CreditCard,
  Calendar,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Home,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { UpdateDataKonsumenForm } from '@/components/penjualan/forms/UpdateDataKonsumenForm';
import {
  BankPackageType,
  BANK_PACKAGES_CONFIG,
  DocumentItemDef,
  BankKprDocData
} from '@/components/penjualan/lampiran/BankKprDocumentViews';
import { Customer } from '@/types';

interface Props {
  id?: string;
  lampiran5?: string;
  pejabat?: string;
  jabatan_pejabat?: string;
  cabang_pks?: string;
  no_pks?: string;
  tgl_pks?: string;
}

export default function PrintKprClient({
  id: initialId,
  lampiran5,
  pejabat,
  jabatan_pejabat,
  cabang_pks,
  no_pks,
  tgl_pks
}: Props) {
  const router = useRouter();
  const { sales, customers, units, blocks, locations, banks, refresh } = useData();

  const [currentId, setCurrentId] = useState<string | undefined>(initialId);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'kpr' | 'proses' | 'sp3k'>('all');
  const [selectedPackage, setSelectedPackage] = useState<BankPackageType>('btn_update');
  const [viewMode, setViewMode] = useState<'all' | 'list'>('all');
  const [singleDocPreview, setSingleDocPreview] = useState<DocumentItemDef | null>(null);
  const hasUserSelectedRef = useRef<boolean>(false);

  // Sync when initialId changes from URL / props
  useEffect(() => {
    if (initialId) {
      setCurrentId(initialId);
    }
  }, [initialId]);

  const sale = sales.find((s) => s.id === currentId);
  const customer = customers.find((c) => c.id === sale?.customer_id);
  const unit = units.find((u) => u.id === sale?.unit_id);
  const block = blocks.find((b) => b.id === unit?.block_id);
  const location = locations.find((l) => l.id === block?.location_id);
  const bank = banks.find((b) => b.id === sale?.bank_id);

  // Fallback customer object if sale has customer_nama but customer record is missing
  const activeCustomer = useMemo(() => {
    if (customer) return customer;
    if (sale && sale.customer_nama) {
      return {
        id: sale.customer_id || 'cust-fallback',
        nama: sale.customer_nama,
        nik: '',
        alamat: '',
        no_hp: '',
        status: 'Deal',
        created_at: sale.tanggal_booking || new Date().toISOString(),
      } as Customer;
    }
    return null;
  }, [customer, sale]);

  // Auto-detect package based on bank name ONLY ON INITIAL LOAD if user hasn't chosen manually
  useEffect(() => {
    if (hasUserSelectedRef.current) return;
    if (bank?.nama_bank) {
      const bName = bank.nama_bank.toLowerCase();
      if (bName.includes('bjb')) {
        setSelectedPackage('bjb_update');
      } else if (bName.includes('bri')) {
        setSelectedPackage('bri_update');
      } else if (bName.includes('btn')) {
        setSelectedPackage('btn_update');
      }
    }
  }, [bank]);

  const handleSelectPackage = (pkgKey: BankPackageType) => {
    hasUserSelectedRef.current = true;
    setSelectedPackage(pkgKey);
    setSingleDocPreview(null);
  };

  const handleSelectSale = (saleId: string) => {
    setCurrentId(saleId);
    setShowSwitchModal(false);
    hasUserSelectedRef.current = false;
    router.replace(`/penjualan/print-kpr?id=${saleId}`);
  };

  const docData: BankKprDocData = useMemo(() => ({
    sale,
    customer: activeCustomer!,
    bank,
    unit,
    block,
    location
  }), [sale, activeCustomer, bank, unit, block, location]);

  const activeConfig = BANK_PACKAGES_CONFIG[selectedPackage];

  const handlePrintAll = () => {
    setViewMode('all');
    setSingleDocPreview(null);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handlePrintSingle = (doc: DocumentItemDef) => {
    setSingleDocPreview(doc);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // ── Enriched Sales List for Search / Selection ──
  const enrichedSales = useMemo(() => {
    return sales
      .filter((s) => s.status !== 'Batal')
      .map((s) => {
        const cust = customers.find((c) => c.id === s.customer_id);
        const un = units.find((u) => u.id === s.unit_id);
        const blk = blocks.find((b) => b.id === un?.block_id);
        const loc = locations.find((l) => l.id === blk?.location_id);
        const bnk = banks.find((b) => b.id === s.bank_id);

        const customerNama = cust?.nama || s.customer_nama || 'Tanpa Nama';
        const customerNik = cust?.nik || '-';
        const customerHp = cust?.no_hp || '-';
        const blockNama = blk?.nama_blok || s.block_nama || '-';
        const unitNo = un?.no_unit || s.unit_no || '-';
        const locationNama = loc?.nama_lokasi || s.location_nama || '-';
        const bankNama = bnk?.nama_bank || s.bank_nama || '-';
        const metodeBayar = s.metode_bayar || 'KPR';
        const kprStatus = s.kpr_status || '-';
        const tgl = s.tanggal_booking || s.tanggal_transaksi || s.created_at || '';

        return {
          id: s.id,
          sale: s,
          customer: cust,
          unit: un,
          block: blk,
          location: loc,
          bank: bnk,
          customerNama,
          customerNik,
          customerHp,
          blockNama,
          unitNo,
          locationNama,
          bankNama,
          metodeBayar,
          kprStatus,
          tgl,
        };
      });
  }, [sales, customers, units, blocks, locations, banks]);

  // Counts for tabs
  const counts = useMemo(() => {
    let kprCount = 0;
    let prosesCount = 0;
    let sp3kCount = 0;

    enrichedSales.forEach((item) => {
      const met = (item.metodeBayar || '').toUpperCase();
      const kpr = (item.kprStatus || '').toUpperCase();

      if (met.includes('KPR') || (kpr !== '-' && kpr !== '')) {
        kprCount++;
      }
      if (kpr.includes('SP3K') || kpr.includes('AKAD') || kpr.includes('ACCEPT')) {
        sp3kCount++;
      } else if (
        kpr.includes('BERKAS') ||
        kpr.includes('WAWANCARA') ||
        kpr.includes('OTS') ||
        kpr.includes('WAITING') ||
        kpr.includes('PROSES')
      ) {
        prosesCount++;
      }
    });

    return {
      all: enrichedSales.length,
      kpr: kprCount,
      proses: prosesCount,
      sp3k: sp3kCount,
    };
  }, [enrichedSales]);

  // Filtered sales based on search query & active tab
  const filteredSales = useMemo(() => {
    let list = enrichedSales;

    if (filterCategory === 'kpr') {
      list = list.filter((item) => {
        const met = (item.metodeBayar || '').toUpperCase();
        const kpr = (item.kprStatus || '').toUpperCase();
        return met.includes('KPR') || (kpr !== '-' && kpr !== '');
      });
    } else if (filterCategory === 'sp3k') {
      list = list.filter((item) => {
        const kpr = (item.kprStatus || '').toUpperCase();
        return kpr.includes('SP3K') || kpr.includes('AKAD') || kpr.includes('ACCEPT');
      });
    } else if (filterCategory === 'proses') {
      list = list.filter((item) => {
        const kpr = (item.kprStatus || '').toUpperCase();
        return (
          kpr.includes('BERKAS') ||
          kpr.includes('WAWANCARA') ||
          kpr.includes('OTS') ||
          kpr.includes('WAITING') ||
          kpr.includes('PROSES')
        );
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const fullBlockUnit = `${item.blockNama} ${item.unitNo}`.toLowerCase();
        const blockUnitAlt = `${item.blockNama} no ${item.unitNo}`.toLowerCase();
        const blockUnitAlt2 = `${item.blockNama} no. ${item.unitNo}`.toLowerCase();
        return (
          item.customerNama.toLowerCase().includes(q) ||
          item.customerNik.toLowerCase().includes(q) ||
          item.customerHp.toLowerCase().includes(q) ||
          item.blockNama.toLowerCase().includes(q) ||
          item.unitNo.toLowerCase().includes(q) ||
          fullBlockUnit.includes(q) ||
          blockUnitAlt.includes(q) ||
          blockUnitAlt2.includes(q) ||
          item.locationNama.toLowerCase().includes(q) ||
          item.bankNama.toLowerCase().includes(q) ||
          item.metodeBayar.toLowerCase().includes(q) ||
          item.kprStatus.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [enrichedSales, filterCategory, searchQuery]);

  // ── Render Search & Selector Modal / View ──
  const renderSearchAndSelectContent = (isModal = false) => (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            <span>Pilih Konsumen atau Blok Perumahan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cari berdasarkan nama konsumen, nomor unit, blok perumahan, atau nama bank untuk mencetak berkas KPR.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium self-start sm:self-auto">
          {filteredSales.length} transaksi ditemukan
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ketik nama konsumen, blok (cth: S22, A), no unit (cth: 09), atau bank..."
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-2xs transition"
          autoFocus={!isModal}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
            title="Hapus pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
            filterCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Semua ({counts.all})
        </button>
        <button
          onClick={() => setFilterCategory('kpr')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
            filterCategory === 'kpr'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Metode KPR ({counts.kpr})
        </button>
        <button
          onClick={() => setFilterCategory('proses')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
            filterCategory === 'proses'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Dalam Proses ({counts.proses})
        </button>
        <button
          onClick={() => setFilterCategory('sp3k')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
            filterCategory === 'sp3k'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          SP3K / Akad ({counts.sp3k})
        </button>
      </div>

      {/* Results List */}
      <div className={`overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white shadow-2xs ${
        isModal ? 'max-h-[55vh]' : 'max-h-[600px]'
      }`}>
        {filteredSales.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada transaksi yang cocok</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Coba periksa kembali ejaan nama konsumen atau nomor blok/unit yang Anda ketikkan.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          filteredSales.map((item) => {
            const isSelected = item.id === currentId;
            const isKpr = (item.metodeBayar || '').toUpperCase().includes('KPR');
            const kprUp = (item.kprStatus || '').toUpperCase();

            return (
              <div
                key={item.id}
                onClick={() => handleSelectSale(item.id)}
                className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-indigo-50/50 transition cursor-pointer ${
                  isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : ''
                }`}
              >
                {/* Left info: Customer & Unit */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    {item.customerNama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-800 uppercase truncate">
                        {item.customerNama}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white">
                          Sedang Dipilih
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <Building2 className="w-3 h-3 text-indigo-600" />
                        Blok {item.blockNama} NO. {item.unitNo}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.locationNama}
                      </span>
                      {item.customerNik && item.customerNik !== '-' && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          NIK: {item.customerNik}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right info: Bank, status, and button */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-xs font-semibold text-blue-700">
                      {item.bankNama !== '-' ? item.bankNama : 'Bank Belum Dipilih'}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                        isKpr ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.metodeBayar}
                      </span>
                      {item.kprStatus && item.kprStatus !== '-' && (
                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.kprStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSale(item.id);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Cetak KPR' : 'Pilih & Cetak'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // ── Jika belum ada transaksi yang dipilih atau data tidak ditemukan ──
  if (!currentId || !sale || !activeCustomer) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-4 space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-xl p-6 text-white shadow-md">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-medium mb-2">
              <button
                onClick={() => router.push('/')}
                className="hover:text-white transition flex items-center gap-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
              <span>/</span>
              <button
                onClick={() => router.push('/penjualan/daftar')}
                className="hover:text-white transition cursor-pointer"
              >
                Penjualan
              </button>
              <span>/</span>
              <span className="text-white font-semibold">Cetak KPR</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                  <FileText className="w-7 h-7 text-indigo-300" />
                  <span>Cetak Dokumen Persyaratan KPR</span>
                </h1>
                <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-xl">
                  Pilih konsumen atau blok rumah di bawah ini untuk mencetak paket dokumen KPR lengkap (Bank BTN, Bank BJB, Bank BRI).
                </p>
              </div>

              <button
                onClick={() => router.push('/penjualan/daftar')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Daftar Penjualan</span>
              </button>
            </div>
          </div>

          {/* Search and Select Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 sm:p-6">
            {renderSearchAndSelectContent(false)}
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Jika transaksi sudah dipilih: Tampilkan Pratinjau & Tombol Cetak ──
  return (
    <AppLayout>
      {/* ── Print CSS styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, aside, .app-sidebar, .app-header, button {
            display: none !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .kpr-page {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 12mm 15mm !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
        }
      `}} />

      <div className="space-y-4 max-w-7xl mx-auto pb-16 no-print">
        {/* ── Breadcrumb Navigation ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600 flex-wrap">
            <button
              onClick={() => router.push(`/penjualan/daftar/${currentId}`)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Detail Penjualan</span>
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-800">Cetak Dokumen Persyaratan KPR</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tombol Ganti / Cari Konsumen & Blok */}
            <button
              onClick={() => setShowSwitchModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ganti Konsumen / Blok</span>
            </button>

            {/* Tombol Ubah Data Customer */}
            {activeCustomer && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Ubah Data Customer</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Card 1: Data Customer Ringkas ── */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Informasi Transaksi & Debitur</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Unit: <strong className="text-slate-800">{block?.nama_blok || sale?.block_nama || 'S22'} NO. {unit?.no_unit || sale?.unit_no || '09'}</strong> ({location?.nama_lokasi || sale?.location_nama || 'Benteng Mutiara Mas'})
              </span>
              <button
                onClick={() => setShowSwitchModal(true)}
                className="text-[11px] text-indigo-600 hover:underline font-semibold cursor-pointer ml-1"
              >
                (Ganti)
              </button>
            </div>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            <div>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 w-36 font-medium">Nama Pemohon</td><td className="py-1 font-bold text-slate-800 uppercase">{activeCustomer.nama}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">NIK</td><td className="py-1 font-mono font-medium">{activeCustomer.nik || '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">Tempat/Tgl Lahir</td><td className="py-1 uppercase">{activeCustomer.tempat_lahir || '-'}, {activeCustomer.tanggal_lahir ? formatTanggalIndonesia(activeCustomer.tanggal_lahir) : '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">Pekerjaan</td><td className="py-1 uppercase">{activeCustomer.pekerjaan || '-'}</td></tr>
                  <tr><td className="py-1 text-slate-500 font-medium">No. Telepon</td><td className="py-1">{activeCustomer.no_hp || '-'}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 w-36 font-medium">Nama Pasangan</td><td className="py-1 font-bold text-slate-800 uppercase">{activeCustomer.nama_pasangan || '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">NIK Pasangan</td><td className="py-1 font-mono font-medium">{(activeCustomer as any)?.nik_pasangan || '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">Tempat/Tgl Lahir</td><td className="py-1 uppercase">{(activeCustomer as any)?.tempat_lahir_pasangan || '-'}, {(activeCustomer as any)?.tanggal_lahir_pasangan ? formatTanggalIndonesia((activeCustomer as any).tanggal_lahir_pasangan) : '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">Pekerjaan Pasangan</td><td className="py-1 uppercase">{(activeCustomer as any)?.pekerjaan_pasangan || 'MENGURUS RUMAH TANGGA'}</td></tr>
                  <tr><td className="py-1 text-slate-500 font-medium">Bank Akad</td><td className="py-1 font-semibold text-blue-700">{bank?.nama_bank || sale?.bank_nama || 'Bank BTN'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Card 2: Pilihan Paket Bank & Aksi Cetak Semua ── */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Pilih Format Paket Dokumen Bank</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih salah satu bank di bawah ini untuk menampilkan dan mencetak semua berkas persyaratan sekaligus.
              </p>
            </div>

            {/* Tombol Cetak Semua */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <button
                onClick={handlePrintAll}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Semua Dokumen ({activeConfig.docs.length} Halaman)</span>
              </button>
            </div>
          </div>

          {/* 4 Pilihan Paket Bank (Tabs) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {(Object.keys(BANK_PACKAGES_CONFIG) as BankPackageType[]).map((pkgKey) => {
              const cfg = BANK_PACKAGES_CONFIG[pkgKey];
              const isSelected = selectedPackage === pkgKey;
              return (
                <button
                  key={pkgKey}
                  onClick={() => handleSelectPackage(pkgKey)}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                      {cfg.title}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{cfg.subtitle}</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2">
                    {cfg.docs.length} Dokumen Lampiran
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Package Confirmation Banner */}
          <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-900">Paket Aktif:</span>
              <span className="font-bold uppercase px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px]">
                {activeConfig.title}
              </span>
              <span className="text-slate-600">
                — Hanya <strong>{activeConfig.docs.length} dokumen</strong> milik <strong>{activeConfig.title}</strong> yang akan dicetak. Dokumen bank lain tidak akan ikut terdorong.
              </span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Mode Tampilan:</span>
              <div className="inline-flex rounded-md shadow-2xs border border-slate-200 p-0.5 bg-slate-50">
                <button
                  onClick={() => { setViewMode('all'); setSingleDocPreview(null); }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'all' && !singleDocPreview ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Halaman ({activeConfig.docs.length})
                </button>
                <button
                  onClick={() => { setViewMode('list'); setSingleDocPreview(null); }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'list' && !singleDocPreview ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daftar Tabel
                </button>
              </div>
            </div>

            <span className="text-slate-400 text-[11px] hidden sm:inline">
              *Setiap dokumen otomatis dipisah pas 1 lembar A4 saat dicetak (Ctrl + P)
            </span>
          </div>
        </div>

        {/* ── Mode 1: Daftar Tabel Dokumen ── */}
        {viewMode === 'list' && !singleDocPreview && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase">
                Daftar Dokumen Paket: <span className="text-indigo-700">{activeConfig.title}</span>
              </h3>
              <button
                onClick={handlePrintAll}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Semua</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-4 w-12 text-center font-bold">No</th>
                    <th className="py-2.5 px-4 w-36 font-bold">Kode</th>
                    <th className="py-2.5 px-4 font-bold">Nama Dokumen</th>
                    <th className="py-2.5 px-4 w-44 text-center font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeConfig.docs.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-indigo-700">{doc.code}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{doc.title}</td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSingleDocPreview(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                          <button
                            onClick={() => handlePrintSingle(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── AREA CETAK / PRATINJAU DOKUMEN ── */}
      {/* Jika dalam mode Single Doc Preview */}
      {singleDocPreview && (
        <div className="max-w-5xl mx-auto pb-16">
          <div className="bg-slate-800 text-white p-3 rounded-lg flex items-center justify-between mb-4 no-print shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSingleDocPreview(null)}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold cursor-pointer"
              >
                ← Kembali ke Semua Dokumen
              </button>
              <span className="text-xs text-slate-300">Menampilkan 1 Dokumen: <strong>{singleDocPreview.title}</strong></span>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Halaman Ini</span>
            </button>
          </div>

          <div className="print-container">
            <singleDocPreview.component data={docData} />
          </div>
        </div>
      )}

      {/* Jika dalam mode Semua Halaman (All Pages View) */}
      {viewMode === 'all' && !singleDocPreview && (
        <div className="print-container space-y-6">
          <div className="text-center py-2 bg-indigo-50 border border-indigo-200 rounded-md text-xs text-indigo-900 font-semibold mb-6 max-w-4xl mx-auto no-print">
            Menampilkan seluruh dokumen paket <strong>{activeConfig.title}</strong> ({activeConfig.docs.length} halaman). Klik tombol <span className="underline font-bold">Cetak Semua Dokumen</span> di atas untuk langsung mencetak atau simpan sebagai PDF.
          </div>

          {activeConfig.docs.map((docItem, index) => {
            const DocComponent = docItem.component;
            return (
              <div key={docItem.id} className="relative">
                <div className="no-print text-center text-xs font-bold text-slate-500 mb-1">
                  — Halaman {index + 1} dari {activeConfig.docs.length}: {docItem.title} —
                </div>
                <DocComponent
                  data={docData}
                  pageNum={index + 1}
                  totalPages={activeConfig.docs.length}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Ganti / Pilih Konsumen & Blok Lain ── */}
      {showSwitchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>Cari & Pilih Konsumen / Blok Lain</span>
              </h3>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-3 flex-1 overflow-hidden">
              {renderSearchAndSelectContent(true)}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Ubah Data Konsumen ── */}
      {showEditModal && activeCustomer && (
        <UpdateDataKonsumenForm
          customer={activeCustomer}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            refresh();
            setShowEditModal(false);
          }}
        />
      )}
    </AppLayout>
  );
}