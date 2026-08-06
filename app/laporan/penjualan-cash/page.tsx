'use client';

import React, { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Sale } from '@/types';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import * as XLSX from 'xlsx';

export default function LaporanPenjualanCashPage() {
  const { sales } = useData();

  // Filter hanya penjualan Cash (Cash Keras & Cash Bertahap), bukan KPR
  const cashSales = useMemo(
    () => sales.filter((s) => s.metode_bayar !== 'KPR' && s.status !== 'Batal'),
    [sales]
  );

  const totalOmset = useMemo(
    () => cashSales.reduce((sum, s) => sum + (s.total_harga || 0), 0),
    [cashSales]
  );

  const handleExportExcel = () => {
    const data = cashSales.map((s, i) => ({
      No: i + 1,
      Konsumen: s.customer_nama || '-',
      'No. Unit': s.unit_no || '-',
      Lokasi: s.location_nama || '-',
      'Skema Bayar': s.metode_bayar,
      'Total Harga': s.total_harga,
      Status: s.status,
      'Tanggal Booking': s.tanggal_booking || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Penjualan_Cash');
    XLSX.writeFile(workbook, 'Laporan_Penjualan_Cash_Lansena.xlsx');
  };

  const columns: Column<Sale>[] = [
    {
      header: 'Nama Konsumen',
      accessorKey: (r) => <span className="font-bold text-slate-800">{r.customer_nama || '-'}</span>,
      sortable: true,
    },
    {
      header: 'No. Unit',
      accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.unit_no || '-'}</span>,
      sortable: true,
    },
    {
      header: 'Lokasi',
      accessorKey: (r) => r.location_nama || '-',
    },
    {
      header: 'Skema Bayar',
      accessorKey: (r) => (
        <Badge variant={r.metode_bayar === 'Cash Keras' ? 'emerald' : 'sky'}>
          {r.metode_bayar}
        </Badge>
      ),
      sortable: true,
    },
    {
      header: 'Total Harga',
      accessorKey: (r) => <span className="font-bold text-green-600">{formatRupiah(r.total_harga || 0)}</span>,
      sortable: true,
    },
    {
      header: 'Status',
      accessorKey: (r) => {
        const statusMap: Record<string, string> = {
          Booking: 'bg-amber-100 text-amber-700',
          DP: 'bg-orange-100 text-orange-700',
          Akad: 'bg-blue-100 text-blue-700',
          Lunas: 'bg-emerald-100 text-emerald-700',
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusMap[r.status] || 'bg-slate-100 text-slate-600'}`}>
            {r.status}
          </span>
        );
      },
      sortable: true,
    },
    {
      header: 'Tgl Booking',
      accessorKey: (r) => r.tanggal_booking ? new Date(r.tanggal_booking).toLocaleDateString('id-ID') : '-',
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Penjualan Cash</h1>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi penjualan dengan skema Cash Keras &amp; Cash Bertahap
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-300 transition"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Print Data</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-md text-xs transition shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Transaksi Cash</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{cashSales.length}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-green-600 uppercase font-semibold">Total Omset Cash</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatRupiah(totalOmset)}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-blue-600 uppercase font-semibold">Lunas</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{cashSales.filter(s => s.status === 'Lunas').length}</p>
        </div>
      </div>

      <DataTable
        title="Daftar Penjualan Cash"
        data={cashSales}
        columns={columns}
        searchPlaceholder="Cari konsumen, unit, lokasi..."
        exportFileName="Laporan_Penjualan_Cash_Lansena"
      />
    </AppLayout>
  );
}
