'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Modal } from '@/components/ui/Modal';
import { CashflowEntry } from '@/types';
import { Plus, ArrowLeft, Trash2, Pencil, Calendar, Search, Wallet, ArrowDownRight, ArrowUpRight, Filter } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

type CashflowCategory = 'kasbon' | 'penjualan' | 'operasional';

interface CashflowRowItem {
  id: string;
  tanggal: string; // YYYY-MM-DD
  account_id?: string;
  account_nama: string;
  referensi: string; // Mandor / Customer / User
  keterangan: string;
  jenis: 'Masuk' | 'Keluar';
  nominal: number;
  kategori: CashflowCategory;
  rawEntry?: CashflowEntry;
}

function formatDateId(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatNumberId(num: number) {
  return Math.round(num || 0).toLocaleString('id-ID');
}

export default function CashflowClient() {
  const {
    cashflowEntries,
    cashBankAccounts,
    sales,
    salePayments,
    mandorAdvances,
    operationalExpenses,
    addCashflowEntry,
    updateCashflowEntry,
    deleteCashflowEntry,
  } = useData();

  const searchParams = useSearchParams();
  const router = useRouter();

  // Selected Account state (empty string = "General / Semua Akun")
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    searchParams.get('account_id') || ''
  );

  const selectedAccount = cashBankAccounts.find((a) => a.id === selectedAccountId);
  const accountTitle = selectedAccount ? selectedAccount.nama_akun : 'General';

  // Date range filter (default: 2026-08-01 to 2026-08-08)
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState('2026-08-08');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    account_id: selectedAccountId || (cashBankAccounts[0]?.id || ''),
    kategori: 'penjualan' as CashflowCategory,
    referensi: '',
    keterangan: '',
    jenis: 'Masuk' as 'Masuk' | 'Keluar',
    nominal: 0,
  });

  // 100% Dynamic Kasbon Rows (derived strictly from DB)
  const allKasbonRows = useMemo(() => {
    const list: CashflowRowItem[] = [];

    // From cashflowEntries with [KASBON] tag
    cashflowEntries.forEach((e) => {
      if ((e.keterangan || '').startsWith('[KASBON]')) {
        const acc = cashBankAccounts.find((a) => a.id === e.account_id);
        const stripped = e.keterangan.replace(/^\[KASBON\]\s*/, '');
        const parts = stripped.split(' | ');
        list.push({
          id: e.id,
          tanggal: e.tanggal,
          account_id: e.account_id,
          account_nama: acc ? acc.nama_akun : 'Kas Kantor',
          referensi: parts[0] || 'Mandor',
          keterangan: parts.slice(1).join(' | ') || parts[0] || '-',
          jenis: e.jenis,
          nominal: Number(e.nominal) || 0,
          kategori: 'kasbon',
          rawEntry: e,
        });
      }
    });

    // From mandorAdvances table
    mandorAdvances.forEach((ma) => {
      list.push({
        id: `ma-${ma.id}`,
        tanggal: (ma.tanggal || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        account_nama: 'Kas Kantor',
        referensi: ma.nama_mandor,
        keterangan: ma.keterangan || 'Kasbon Mandor',
        jenis: 'Keluar',
        nominal: Number(ma.nominal) || 0,
        kategori: 'kasbon',
      });
    });

    return list.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
  }, [cashflowEntries, mandorAdvances, cashBankAccounts]);

  // 100% Dynamic Penjualan Rows (derived strictly from DB)
  const allPenjualanRows = useMemo(() => {
    const list: CashflowRowItem[] = [];

    // From cashflowEntries with [PENJUALAN] tag
    cashflowEntries.forEach((e) => {
      if ((e.keterangan || '').startsWith('[PENJUALAN]')) {
        const acc = cashBankAccounts.find((a) => a.id === e.account_id);
        const stripped = e.keterangan.replace(/^\[PENJUALAN\]\s*/, '');
        const parts = stripped.split(' | ');
        list.push({
          id: e.id,
          tanggal: e.tanggal,
          account_id: e.account_id,
          account_nama: acc ? acc.nama_akun : 'Kas Kantor',
          referensi: parts[0] || 'Customer',
          keterangan: parts.slice(1).join(' | ') || parts[0] || '-',
          jenis: e.jenis,
          nominal: Number(e.nominal) || 0,
          kategori: 'penjualan',
          rawEntry: e,
        });
      }
    });

    // From salePayments table
    salePayments.forEach((sp) => {
      const sale = sales.find((s) => s.id === sp.sale_id);
      list.push({
        id: `sp-${sp.id}`,
        tanggal: sp.tanggal ? sp.tanggal.slice(0, 10) : new Date().toISOString().slice(0, 10),
        account_nama: sp.bank_tujuan || 'Kas Kantor',
        referensi: sp.diterima_dari || sale?.customer_nama || 'Customer',
        keterangan: sp.deskripsi || (sale ? `PEMBAYARAN UNIT ${sale.unit_no || ''}` : 'Pembayaran Penjualan'),
        jenis: 'Masuk',
        nominal: Number(sp.nominal) || 0,
        kategori: 'penjualan',
      });
    });

    return list.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
  }, [cashflowEntries, salePayments, sales, cashBankAccounts]);

  // 100% Dynamic Operasional Rows (derived strictly from DB)
  const allOperasionalRows = useMemo(() => {
    const list: CashflowRowItem[] = [];

    // From cashflowEntries with [OPERASIONAL] tag
    cashflowEntries.forEach((e) => {
      if ((e.keterangan || '').startsWith('[OPERASIONAL]')) {
        const acc = cashBankAccounts.find((a) => a.id === e.account_id);
        const stripped = e.keterangan.replace(/^\[OPERASIONAL\]\s*/, '');
        const parts = stripped.split(' | ');
        list.push({
          id: e.id,
          tanggal: e.tanggal,
          account_id: e.account_id,
          account_nama: acc ? acc.nama_akun : 'Kas Kantor',
          referensi: parts[0] || 'User',
          keterangan: parts.slice(1).join(' | ') || parts[0] || '-',
          jenis: e.jenis,
          nominal: Number(e.nominal) || 0,
          kategori: 'operasional',
          rawEntry: e,
        });
      }
    });

    // From operationalExpenses table
    operationalExpenses.forEach((oe) => {
      list.push({
        id: `oe-${oe.id}`,
        tanggal: (oe.tanggal || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        account_nama: 'Kas Kantor',
        referensi: oe.kategori || 'Operasional',
        keterangan: oe.keterangan || 'Biaya Operasional',
        jenis: 'Keluar',
        nominal: Number(oe.nominal) || 0,
        kategori: 'operasional',
      });
    });

    return list.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
  }, [cashflowEntries, operationalExpenses, cashBankAccounts]);

  // Filter rows by date range & selected account
  const filterByDateAndAccount = (rows: CashflowRowItem[]) => {
    return rows.filter((r) => {
      if (selectedAccountId && r.account_id && r.account_id !== selectedAccountId) {
        return false;
      }
      if (dateFrom && r.tanggal < dateFrom) return false;
      if (dateTo && r.tanggal > dateTo) return false;
      return true;
    });
  };

  const filteredKasbon = useMemo(() => filterByDateAndAccount(allKasbonRows), [allKasbonRows, dateFrom, dateTo, selectedAccountId]);
  const filteredPenjualan = useMemo(() => filterByDateAndAccount(allPenjualanRows), [allPenjualanRows, dateFrom, dateTo, selectedAccountId]);
  const filteredOperasional = useMemo(() => filterByDateAndAccount(allOperasionalRows), [allOperasionalRows, dateFrom, dateTo, selectedAccountId]);

  // Summary Card Totals
  const totalUangMasuk = useMemo(() => {
    const kasbonIn = filteredKasbon.filter((r) => r.jenis === 'Masuk').reduce((s, r) => s + r.nominal, 0);
    const penjualanIn = filteredPenjualan.filter((r) => r.jenis === 'Masuk').reduce((s, r) => s + r.nominal, 0);
    const operasionalIn = filteredOperasional.filter((r) => r.jenis === 'Masuk').reduce((s, r) => s + r.nominal, 0);
    return kasbonIn + penjualanIn + operasionalIn;
  }, [filteredKasbon, filteredPenjualan, filteredOperasional]);

  const totalUangKeluar = useMemo(() => {
    const kasbonOut = filteredKasbon.filter((r) => r.jenis === 'Keluar').reduce((s, r) => s + r.nominal, 0);
    const penjualanOut = filteredPenjualan.filter((r) => r.jenis === 'Keluar').reduce((s, r) => s + r.nominal, 0);
    const operasionalOut = filteredOperasional.filter((r) => r.jenis === 'Keluar').reduce((s, r) => s + r.nominal, 0);
    return kasbonOut + penjualanOut + operasionalOut;
  }, [filteredKasbon, filteredPenjualan, filteredOperasional]);

  // Modal Handlers
  const openAddModal = (kategori: CashflowCategory) => {
    setEditingId(null);
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      account_id: selectedAccountId || (cashBankAccounts[0]?.id || ''),
      kategori,
      referensi: '',
      keterangan: '',
      jenis: 'Masuk',
      nominal: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: CashflowRowItem) => {
    setEditingId(item.id);
    setFormData({
      tanggal: item.tanggal,
      account_id: item.account_id || (cashBankAccounts[0]?.id || ''),
      kategori: item.kategori,
      referensi: item.referensi,
      keterangan: item.keterangan,
      jenis: item.jenis,
      nominal: item.nominal,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefix = formData.kategori === 'kasbon' ? '[KASBON]' : formData.kategori === 'penjualan' ? '[PENJUALAN]' : '[OPERASIONAL]';
    const ref = formData.referensi.trim();
    const ket = formData.keterangan.trim();
    const fullKeterangan = `${prefix} ${ref}${ket ? ' | ' + ket : ''}`;

    if (editingId && !editingId.startsWith('sp-') && !editingId.startsWith('ma-') && !editingId.startsWith('oe-')) {
      await updateCashflowEntry(editingId, {
        account_id: formData.account_id,
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        nominal: formData.nominal,
        keterangan: fullKeterangan,
      });
    } else {
      await addCashflowEntry({
        account_id: formData.account_id,
        tanggal: formData.tanggal,
        jenis: formData.jenis,
        nominal: formData.nominal,
        keterangan: fullKeterangan,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      if (!deleteConfirmId.startsWith('sp-') && !deleteConfirmId.startsWith('ma-') && !deleteConfirmId.startsWith('oe-')) {
        await deleteCashflowEntry(deleteConfirmId);
      }
      setDeleteConfirmId(null);
    }
  };

  return (
    <AppLayout>
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/keuangan/kas-bank')}
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition shadow-2xs"
            title="Kembali ke Kas & Bank"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-600" />
              <span>Cashflow ({accountTitle})</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Arus kas aktual dari database transaksi
            </p>
          </div>
        </div>

        {/* Account Selector Dropdown */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md p-1 shadow-2xs">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-transparent py-1 pr-3 focus:outline-none"
          >
            <option value="">Semua Akun (General)</option>
            {cashBankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.nama_akun} ({acc.jenis})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Periode Tanggal:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-slate-400 font-bold">-</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Uang Masuk</span>
            <div className="p-2 bg-emerald-50 rounded-full text-emerald-600">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">
              {formatNumberId(totalUangMasuk)}
            </span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Uang Keluar</span>
            <div className="p-2 bg-rose-50 rounded-full text-rose-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-rose-600 tracking-tight">
              {formatNumberId(totalUangKeluar)}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Kasbon Mandor & Pembayaran Kasbon */}
      <CashflowTableSection
        title="Kasbon Mandor & Pembayaran Kasbon"
        refColumnHeader="Mandor"
        data={filteredKasbon}
        onAdd={() => openAddModal('kasbon')}
        onEdit={openEditModal}
        onDelete={(id) => setDeleteConfirmId(id)}
      />

      {/* SECTION 2: Penjualan Unit & Return */}
      <CashflowTableSection
        title="Penjualan Unit & Return"
        refColumnHeader="Customer"
        data={filteredPenjualan}
        onAdd={() => openAddModal('penjualan')}
        onEdit={openEditModal}
        onDelete={(id) => setDeleteConfirmId(id)}
      />

      {/* SECTION 3: Operasional Perusahaan */}
      <CashflowTableSection
        title="Operasional Perusahaan"
        refColumnHeader="User"
        data={filteredOperasional}
        onAdd={() => openAddModal('operasional')}
        onEdit={openEditModal}
        onDelete={(id) => setDeleteConfirmId(id)}
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Transaksi Cashflow' : 'Tambah Transaksi Cashflow'}>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Akun Kas / Bank *</label>
            <select
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {cashBankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.nama_akun} ({acc.jenis})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal *</label>
            <input
              type="date"
              required
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {formData.kategori === 'kasbon' ? 'Nama Mandor' : formData.kategori === 'penjualan' ? 'Nama Customer' : 'Nama User / Penerima'} *
            </label>
            <input
              type="text"
              required
              value={formData.referensi}
              onChange={(e) => setFormData({ ...formData, referensi: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Masukkan nama..."
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan Transaksi</label>
            <textarea
              rows={2}
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Deskripsi keperluan..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Transaksi *</label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value as 'Masuk' | 'Keluar' })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Masuk">Uang Masuk</option>
                <option value="Keluar">Uang Keluar</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nominal (Rp) *</label>
              <input
                type="number"
                min={0}
                required
                value={formData.nominal}
                onChange={(e) => setFormData({ ...formData, nominal: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Konfirmasi Hapus">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">Apakah Anda yakin ingin menghapus data transaksi ini?</p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────
// REUSABLE CASHFLOW TABLE SECTION COMPONENT
// ─────────────────────────────────────────────────────────────

interface CashflowTableSectionProps {
  title: string;
  refColumnHeader: string;
  data: CashflowRowItem[];
  onAdd: () => void;
  onEdit: (item: CashflowRowItem) => void;
  onDelete: (id: string) => void;
}

function CashflowTableSection({
  title,
  refColumnHeader,
  data,
  onAdd,
  onEdit,
  onDelete,
}: CashflowTableSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter search
  const filtered = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (r) =>
        r.tanggal.toLowerCase().includes(term) ||
        formatDateId(r.tanggal).includes(term) ||
        r.account_nama.toLowerCase().includes(term) ||
        r.referensi.toLowerCase().includes(term) ||
        r.keterangan.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Total sums for footer
  const totalUangMasuk = useMemo(() => {
    return filtered.filter((r) => r.jenis === 'Masuk').reduce((s, r) => s + r.nominal, 0);
  }, [filtered]);

  const totalUangKeluar = useMemo(() => {
    return filtered.filter((r) => r.jenis === 'Keluar').reduce((s, r) => s + r.nominal, 0);
  }, [filtered]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Show entries control */}
      <div className="text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-200 rounded">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-4">Tanggal</th>
              <th className="py-2.5 px-4">Kas/Bank</th>
              <th className="py-2.5 px-4">{refColumnHeader}</th>
              <th className="py-2.5 px-4">Keterangan</th>
              <th className="py-2.5 px-4 text-right">Uang Masuk</th>
              <th className="py-2.5 px-4 text-right">Uang Keluar</th>
              <th className="py-2.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No data available in table
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-mono">{formatDateId(row.tanggal)}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{row.account_nama}</td>
                  <td className="py-2.5 px-4 font-bold text-blue-700">{row.referensi}</td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate" title={row.keterangan}>
                    {row.keterangan}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                    {row.jenis === 'Masuk' ? formatNumberId(row.nominal) : '0'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-rose-600">
                    {row.jenis === 'Keluar' ? formatNumberId(row.nominal) : '0'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit(row)}
                        className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(row.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Showing counts */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-1">
        <div>
          Showing {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 font-medium"
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 5)
            .map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-2.5 py-1 rounded font-semibold ${
                  currentPage === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 font-medium"
          >
            Next
          </button>
        </div>
      </div>

      {/* Footer Total Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span>Total Uang Masuk</span>
          <span className="text-emerald-600 text-sm font-black">{formatNumberId(totalUangMasuk)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Total Uang Keluar</span>
          <span className="text-rose-600 text-sm font-black">{formatNumberId(totalUangKeluar)}</span>
        </div>
      </div>
    </div>
  );
}
