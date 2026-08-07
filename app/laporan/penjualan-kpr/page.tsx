'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Sale } from '@/types';
import { FileSpreadsheet, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function LaporanPenjualanKPRPage() {
  const { sales } = useData();

  const filteredSales = React.useMemo(() => sales.filter((s) => s.status !== 'Batal'), [sales]);

  const handleExportExcel = () => {
    const data = filteredSales.map((s) => ({
      Konsumen: s.customer_nama,
      Unit: s.unit_no,
      Lokasi: s.location_nama,
      Skema: s.metode_bayar,
      Bank: s.bank_nama || '-',
      TotalHarga: s.total_harga,
      Status: s.status,
      KPRStatus: s.kpr_status || '-',
      Tanggal: s.tanggal_booking || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Penjualan_KPR');
    XLSX.writeFile(workbook, 'Laporan_Penjualan_KPR_Lansena.xlsx');
  };

  const columns: Column<Sale>[] = [
    { header: 'Nama Konsumen', accessorKey: (r) => <span className="font-bold text-slate-800">{r.customer_nama}</span>, sortable: true },
    { header: 'No. Unit', accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.unit_no}</span>, sortable: true },
    { header: 'Skema Bayar', accessorKey: (r) => <Badge variant={r.metode_bayar === 'KPR' ? 'sky' : 'emerald'}>{r.metode_bayar}</Badge>, sortable: true },
    { header: 'Bank Partner', accessorKey: (r) => r.bank_nama || '-' },
    { header: 'Omset Transaksi', accessorKey: (r) => <span className="font-bold text-green-600">Rp {r.total_harga.toLocaleString('id-ID')}</span>, sortable: true },
    { header: 'Status KPR', accessorKey: (r) => r.kpr_status || '-' },
    { header: 'Tanggal', accessorKey: (r) => r.tanggal_booking ? new Date(r.tanggal_booking).toLocaleDateString('id-ID') : '-', sortable: true },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Penjualan KPR & Cash</h1>
          <p className="text-xs text-slate-400 mt-1">Rekapitulasi lengkap omset penjualan unit perumahan Lansena Property</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-300 transition"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>Cetak PDF</span>
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

      <DataTable
        title="Rekapitulasi Penjualan"
        data={filteredSales}
        columns={columns}
        searchPlaceholder="Cari konsumen, unit, bank..."
        exportFileName="Laporan_Penjualan_KPR_Lansena"
      />
    </AppLayout>
  );
}
