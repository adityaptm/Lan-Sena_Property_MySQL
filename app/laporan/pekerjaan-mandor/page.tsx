'use client';

import React, { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import * as XLSX from 'xlsx';

export default function LaporanPekerjaanMandorPage() {
  const { mandorAdvances } = useData();

  const totalKasbon = useMemo(
    () => mandorAdvances.reduce((s, ma) => s + (ma.nominal || 0), 0),
    [mandorAdvances]
  );

  const handleExportExcel = () => {
    const data = mandorAdvances.map((ma, i) => ({
      No: i + 1,
      'Nama Mandor': (ma as any).mandor_nama || (ma as any).nama_mandor || '-',
      Nominal: ma.nominal || 0,
      Keterangan: ma.keterangan || '-',
      Tanggal: (ma as any).tanggal || (ma as any).created_at || '-',
      Status: (ma as any).status || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pekerjaan_Mandor');
    XLSX.writeFile(workbook, 'Laporan_Pekerjaan_Mandor_Lansena.xlsx');
  };

  const columns: Column<any>[] = [
    {
      header: 'Nama Mandor',
      accessorKey: (r: any) => <span className="font-bold text-slate-800">{r.mandor_nama || r.nama_mandor || '-'}</span>,
      sortable: true,
    },
    {
      header: 'Nominal Kasbon',
      accessorKey: (r: any) => <span className="font-bold text-green-600">{formatRupiah(r.nominal || 0)}</span>,
      sortable: true,
    },
    {
      header: 'Keterangan',
      accessorKey: (r: any) => r.keterangan || '-',
    },
    {
      header: 'Tanggal',
      accessorKey: (r: any) => {
        const tgl = r.tanggal || r.created_at;
        return tgl ? new Date(tgl).toLocaleDateString('id-ID') : '-';
      },
      sortable: true,
    },
    {
      header: 'Status',
      accessorKey: (r: any) => {
        const status = r.status || 'Belum Lunas';
        const color = status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>{status}</span>;
      },
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Pekerjaan Mandor</h1>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi kasbon mandor &amp; progress pekerjaan di perumahan
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
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Transaksi Kasbon</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{mandorAdvances.length}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-orange-600 uppercase font-semibold">Total Kasbon Keluar</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatRupiah(totalKasbon)}</p>
        </div>
      </div>

      <DataTable
        title="Daftar Kasbon Mandor"
        data={mandorAdvances}
        columns={columns}
        searchPlaceholder="Cari nama mandor, keterangan..."
        exportFileName="Laporan_Pekerjaan_Mandor_Lansena"
      />
    </AppLayout>
  );
}
