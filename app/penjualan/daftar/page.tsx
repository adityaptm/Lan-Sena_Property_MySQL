'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Sale } from '@/types';
import { Plus, Eye, Trash2, Search, Printer, Download, ChevronDown } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import * as XLSX from 'xlsx';

// Badge khusus dengan warna berdasarkan status KPR/metode bayar
function StatusBadge({ metode, kprStatus }: { metode: string; kprStatus?: string }) {
  // Cash dan variannya
  if (metode === 'Cash' || metode === 'Cash Bertahap' || metode === 'Cash Keras') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
        CASH
      </span>
    );
  }
  // KPR — warna berdasarkan kpr_status
  const s = (kprStatus || 'WAITING').toUpperCase();
  if (s === 'REJECTED' || s === 'REJECT') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-300">
        KPR REJECTED
      </span>
    );
  }
  if (s === 'ACCEPTED' || s === 'APPROVED' || s === 'DEAL') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-300">
        KPR ACCEPTED
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700 border border-amber-300">
      KPR WAITING
    </span>
  );
}

export default function DaftarPenjualanPage() {
  const { sales, customers, units, blocks, deleteSale } = useData();
  const router = useRouter();

  // --- Filter states ---
  const [categoryFilter, setCategoryFilter] = useState('Semua');
  const [blokFilter, setBlokFilter] = useState('');
  const [konsumenFilter, setKonsumenFilter] = useState('');
  const [tipeFilter, setTipeFilter] = useState('');
  const [searchValue, setSearchValue] = useState('');

  // --- Enrich data with customer info ---
  const enrichedSales = useMemo(() => {
    return sales.map(s => {
      const cust = customers.find(c => c.id === s.customer_id);
      return {
        ...s,
        customer_hp: cust?.no_hp || '-',
        customer_job: cust?.pekerjaan || cust?.instansi || '-',
      };
    });
  }, [sales, customers]);

  // --- Unique dropdown options ---
  const uniqueBloks = useMemo(() =>
    [...new Set(enrichedSales.map(s => s.block_nama).filter(Boolean))].sort(),
    [enrichedSales]
  );
  const uniqueKonsumen = useMemo(() =>
    [...new Set(enrichedSales.map(s => s.customer_nama).filter(Boolean))].sort(),
    [enrichedSales]
  );
  const uniqueTipe = useMemo(() =>
    [...new Set(enrichedSales.map(s => s.metode_bayar).filter(Boolean))].sort(),
    [enrichedSales]
  );

  // --- Filtered data ---
  const filteredSales = useMemo(() => {
    return enrichedSales.filter(s => {
      // 1. Category filter
      if (categoryFilter === 'KPR Reject') {
        const st = (s.kpr_status || '').toUpperCase();
        if (s.metode_bayar !== 'KPR' || (st !== 'REJECTED' && st !== 'REJECT')) return false;
      } else if (categoryFilter === 'Progres Lambat') {
        // Penjualan yang masih Booking lebih dari 30 hari (belum naik status)
        if (!s.tanggal_booking) return false;
        const daysDiff = Math.floor((Date.now() - new Date(s.tanggal_booking).getTime()) / 86400000);
        if (!(s.status === 'Booking' && daysDiff > 30)) return false;
      }

      // 2. Blok filter
      if (blokFilter && s.block_nama !== blokFilter) return false;

      // 3. Konsumen filter
      if (konsumenFilter && s.customer_nama !== konsumenFilter) return false;

      // 4. Tipe penjualan filter
      if (tipeFilter && s.metode_bayar !== tipeFilter) return false;

      // 5. Search
      if (searchValue) {
        const q = searchValue.toLowerCase();
        const match =
          s.customer_nama?.toLowerCase().includes(q) ||
          s.block_nama?.toLowerCase().includes(q) ||
          s.unit_no?.toLowerCase().includes(q) ||
          s.marketer_nama?.toLowerCase().includes(q) ||
          s.no_penjualan?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [enrichedSales, categoryFilter, blokFilter, konsumenFilter, tipeFilter, searchValue]);

  // --- Handlers ---
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data penjualan ini? Unit terkait akan dikembalikan ke status Tersedia.')) return;
    try {
      await deleteSale(id);
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus data penjualan.');
    }
  };

  const handleSaveRow = (r: any) => {
    const rowData = [{
      'Tanggal': r.tanggal_booking || r.created_at?.split('T')[0] || '-',
      'No Penjualan': r.no_penjualan || '-',
      'Blok': r.block_nama || '-',
      'No Unit': r.unit_no || '-',
      'Lokasi': r.location_nama || '-',
      'Tipe Unit': r.unit_type_nama || '-',
      'Status': r.status || '-',
      'Metode Bayar': r.metode_bayar || '-',
      'KPR Status': r.kpr_status || '-',
      'Konsumen': r.customer_nama || '-',
      'No HP': r.customer_hp || '-',
      'Pekerjaan': r.customer_job || '-',
      'Marketer': r.marketer_nama || '-',
      'Harga': r.total_harga || 0,
      'Tanggal Akad': r.tanggal_akad || '-',
    }];
    const ws = XLSX.utils.json_to_sheet(rowData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Penjualan');
    const fileName = `Penjualan_${(r.customer_nama || 'konsumen').replace(/\s+/g, '_')}_${r.unit_no || 'unit'}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // --- Summary counts ---
  const countAll = enrichedSales.length;
  const countCash = enrichedSales.filter(s =>
    s.metode_bayar === 'Cash' || s.metode_bayar === 'Cash Bertahap' || s.metode_bayar === 'Cash Keras'
  ).length;
  const countKprWaiting = enrichedSales.filter(s => s.metode_bayar === 'KPR' && !['REJECTED', 'REJECT', 'ACCEPTED', 'APPROVED', 'DEAL'].includes((s.kpr_status || '').toUpperCase())).length;
  const countKprRejected = enrichedSales.filter(s => {
    const st = (s.kpr_status || '').toUpperCase();
    return s.metode_bayar === 'KPR' && (st === 'REJECTED' || st === 'REJECT');
  }).length;
  const countKprAccepted = enrichedSales.filter(s => {
    const st = (s.kpr_status || '').toUpperCase();
    return s.metode_bayar === 'KPR' && (st === 'ACCEPTED' || st === 'APPROVED' || st === 'DEAL');
  }).length;

  // --- Columns ---
  const columns: Column<any>[] = [
    {
      header: 'Tgl & Tipe',
      accessorKey: (r) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-xs text-slate-500">{r.tanggal_booking || r.created_at?.split('T')[0]}</span>
          <StatusBadge metode={r.metode_bayar} kprStatus={r.kpr_status} />
        </div>
      ),
    },
    {
      header: 'Unit',
      accessorKey: (r) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-sm">BLOK {r.block_nama} No {r.unit_no}</span>
          <span className="text-xs text-slate-500">{r.location_nama}</span>
        </div>
      ),
    },
    {
      header: 'Tipe',
      accessorKey: (r) => <span className="text-sm">{r.unit_type_nama || '-'}</span>
    },
    {
      header: 'Step',
      accessorKey: (r) => <span className="text-sm font-semibold text-slate-700">{r.sales_step_nama || r.status}</span>
    },
    {
      header: 'Harga',
      accessorKey: (r) => <span className="text-sm font-semibold">{formatRupiah(r.total_harga || 0)}</span>,
    },
    {
      header: 'Konsumen',
      accessorKey: (r) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-sm">{r.customer_nama}</span>
          <span className="text-xs text-slate-500">{r.customer_hp}</span>
          <span className="text-[10px] text-slate-400 uppercase">{r.customer_job}</span>
        </div>
      )
    },
    {
      header: 'Marketer',
      accessorKey: (r) => (
        <span className="text-sm text-slate-700">{r.marketer_nama || '-'}</span>
      )
    },
    {
      header: 'Aksi',
      accessorKey: (r) => (
        <div className="flex items-center gap-1">
          <Link href={`/penjualan/daftar/${r.id}`} className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded transition" title="Lihat Detail">
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => window.open(`/penjualan/print-sppr?id=${r.id}`)}
            className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition"
            title="Cetak SPPR"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleSaveRow(r)}
            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition"
            title="Simpan Data ke Excel"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition"
            title="Hapus"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Penjualan</h1>
          <p className="text-sm text-slate-500 mt-0.5">{countAll} total transaksi tercatat</p>
        </div>
        <Link
          href="/penjualan/input"
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded text-sm transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Input Penjualan</span>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{countCash}</p>
          <p className="text-xs font-semibold text-emerald-600 mt-0.5">CASH</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{countKprWaiting}</p>
          <p className="text-xs font-semibold text-amber-600 mt-0.5">KPR WAITING</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{countKprAccepted}</p>
          <p className="text-xs font-semibold text-blue-600 mt-0.5">KPR ACCEPTED</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{countKprRejected}</p>
          <p className="text-xs font-semibold text-red-600 mt-0.5">KPR REJECTED</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* Category filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tampilkan</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Penjualan</option>
              <option value="Progres Lambat">Progres Lambat (&gt;30 hari booking)</option>
              <option value="KPR Reject">KPR Reject</option>
            </select>
          </div>

          {/* Blok filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Blok</label>
            <select
              value={blokFilter}
              onChange={(e) => setBlokFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Blok</option>
              {uniqueBloks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Konsumen filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Konsumen</label>
            <select
              value={konsumenFilter}
              onChange={(e) => setKonsumenFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Konsumen</option>
              {uniqueKonsumen.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {/* Tipe penjualan filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Penjualan</label>
            <select
              value={tipeFilter}
              onChange={(e) => setTipeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Semua Tipe</option>
              {uniqueTipe.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cari Cepat</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nama, blok, no unit..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Active filter summary + reset */}
        {(categoryFilter !== 'Semua' || blokFilter || konsumenFilter || tipeFilter || searchValue) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-slate-500">Filter aktif:</span>
            {categoryFilter !== 'Semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {categoryFilter}
                <button onClick={() => setCategoryFilter('Semua')} className="ml-1 hover:text-blue-900">×</button>
              </span>
            )}
            {blokFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                Blok: {blokFilter}
                <button onClick={() => setBlokFilter('')} className="ml-1 hover:text-slate-900">×</button>
              </span>
            )}
            {konsumenFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                {konsumenFilter}
                <button onClick={() => setKonsumenFilter('')} className="ml-1 hover:text-slate-900">×</button>
              </span>
            )}
            {tipeFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                {tipeFilter}
                <button onClick={() => setTipeFilter('')} className="ml-1 hover:text-slate-900">×</button>
              </span>
            )}
            {searchValue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                "{searchValue}"
                <button onClick={() => setSearchValue('')} className="ml-1 hover:text-slate-900">×</button>
              </span>
            )}
            <button
              onClick={() => { setCategoryFilter('Semua'); setBlokFilter(''); setKonsumenFilter(''); setTipeFilter(''); setSearchValue(''); }}
              className="text-xs text-red-500 hover:text-red-700 underline ml-1"
            >
              Reset semua
            </button>
          </div>
        )}
      </div>

      {/* Tabel */}
      <div className="rounded-lg overflow-hidden">
        <DataTable
          title=""
          data={filteredSales}
          columns={columns}
          searchPlaceholder="Cari cepat di semua kolom..."
          exportFileName="Daftar_Penjualan"
        />
      </div>
    </AppLayout>
  );
}
