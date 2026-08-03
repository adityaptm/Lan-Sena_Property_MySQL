'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Sale } from '@/types';
import { Plus, Eye, Printer, Trash2, FileSpreadsheet, Search } from 'lucide-react';
import { formatRupiah } from '@/lib/format';

export default function DaftarPenjualanPage() {
  const { sales, customers, deleteSale } = useData();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState('Semua');
  const [searchCol, setSearchCol] = useState('Nama Konsumen');
  const [searchValue, setSearchValue] = useState('');

  // Get full customer data to get phone and job
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

  // Handle custom filtering
  const filteredSales = useMemo(() => {
    return enrichedSales.filter(s => {
      // 1. Status Filter
      if (statusFilter !== 'Semua') {
        const matchesType = s.metode_bayar === statusFilter;
        const matchesStatus = s.status === statusFilter || s.kpr_status === statusFilter;
        if (!matchesType && !matchesStatus) return false;
      }
      
      // 2. Search Filter
      if (searchValue) {
        const query = searchValue.toLowerCase();
        if (searchCol === 'Nama Konsumen') {
          if (!s.customer_nama?.toLowerCase().includes(query)) return false;
        } else if (searchCol === 'No Unit') {
          if (!s.unit_no?.toLowerCase().includes(query)) return false;
        } else if (searchCol === 'Marketer') {
          if (!s.marketer_nama?.toLowerCase().includes(query)) return false;
        }
      }

      return true;
    });
  }, [enrichedSales, statusFilter, searchCol, searchValue]);

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data penjualan ini?')) {
       // if deleteSale is not available in useData, just call supabase directly or warn
       // For now, let's assume it doesn't exist yet, we will just alert
       alert('Fitur hapus segera diaktifkan.');
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Tgl & Tipe Penjualan',
      accessorKey: (r) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="text-sm">{r.tanggal_booking || r.created_at?.split('T')[0]}</span>
          <Badge variant={r.metode_bayar === 'CASH' ? 'emerald' : 'amber'}>
            {r.metode_bayar === 'KPR' ? `KPR (${r.kpr_status || 'WAITING'})` : r.metode_bayar}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Unit',
      accessorKey: (r) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">BLOK {r.block_nama} No {r.unit_no}</span>
          <span className="text-xs text-slate-500">{r.location_nama}</span>
        </div>
      ),
    },
    { 
      header: 'Tipe', 
      accessorKey: (r) => <span className="text-sm">{r.unit_type_nama || '-'}</span> 
    },
    { 
      header: 'Step Terakhir', 
      accessorKey: (r) => <span className="text-sm font-semibold">{r.sales_step_nama || r.status}</span> 
    },
    {
      header: 'Harga',
      accessorKey: (r) => <span className="text-sm font-semibold">{formatRupiah(r.total_harga || 0)}</span>,
    },
    { 
      header: 'Konsumen', 
      accessorKey: (r) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{r.customer_nama}</span>
          <span className="text-xs text-slate-500">{r.customer_hp}</span>
          <span className="text-[10px] text-slate-400 uppercase">{r.customer_job}</span>
        </div>
      )
    },
    { 
      header: 'Marketer', 
      accessorKey: (r) => (
        <div className="flex flex-col">
          <span className="text-sm text-slate-700">{r.marketer_nama || '-'}</span>
          <span className="text-xs text-slate-500">Fee : {formatRupiah(0)}</span> {/* TODO: link to marketer rights */}
        </div>
      )
    },
    {
      header: 'Aksi',
      accessorKey: (r) => (
        <div className="flex items-center gap-1">
          <Link href={`/penjualan/daftar/${r.id}`} className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded transition" title="Lihat Detail">
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button onClick={() => window.open(`/penjualan/print-kpr?id=${r.id}`)} className="p-1.5 bg-slate-500 hover:bg-slate-600 text-white rounded transition" title="Cetak SPPR">
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => handleDelete(r.id)} className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition" title="Hapus">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Penjualan</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/penjualan/input"
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded text-sm transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Input Penjualan</span>
          </Link>
        </div>
      </div>

      <div className="bg-white p-4 border border-slate-200 rounded-md shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status Penjualan</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Semua">Semua Penjualan</option>
              <option value="CASH">CASH</option>
              <option value="KPR">KPR</option>
              <option value="Booking">Booking</option>
              <option value="Lunas">Lunas</option>
              <option value="Batal">Batal</option>
            </select>
          </div>
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-600 mb-1">Cari Berdasarkan</label>
            <select
              value={searchCol}
              onChange={(e) => setSearchCol(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Nama Konsumen">Nama Konsumen</option>
              <option value="No Unit">No Unit</option>
              <option value="Marketer">Marketer</option>
            </select>
          </div>
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder={`Cari ${searchCol}...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button className="absolute right-0 top-0 bottom-0 px-3 bg-blue-600 text-white rounded-r flex items-center justify-center hover:bg-blue-700">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-md overflow-hidden">
        <DataTable
          title=""
          data={filteredSales}
          columns={columns}
          searchPlaceholder="Cari cepat (Semua kolom)..."
          exportFileName="Daftar_Penjualan"
        />
      </div>
    </AppLayout>
  );
}
