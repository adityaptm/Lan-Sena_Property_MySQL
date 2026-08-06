'use client';

import React, { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import * as XLSX from 'xlsx';

interface MarketingFeeRow {
  id: string;
  marketer_nama: string;
  jumlah_deal: number;
  total_omset: number;
  fee_persen: number;
  total_fee: number;
}

export default function LaporanMarketingFeePage() {
  const { sales, marketers, marketerRights } = useData();

  // Hitung data fee per marketer dari penjualan aktif (non-batal)
  const feeData = useMemo(() => {
    const activeSales = sales.filter((s) => s.status !== 'Batal');
    const grouped: Record<string, { nama: string; count: number; omset: number }> = {};

    activeSales.forEach((s) => {
      const mid = s.marketer_id || 'unknown';
      const nama = s.marketer_nama || 'Tidak Diketahui';
      if (!grouped[mid]) {
        grouped[mid] = { nama, count: 0, omset: 0 };
      }
      grouped[mid].count += 1;
      grouped[mid].omset += s.total_harga || 0;
    });

    return Object.entries(grouped).map(([id, data]) => {
      // Cari persentase fee dari marketer_rights (jika ada)
      const marketer = marketers.find(m => m.id === id);
      const right = marketerRights.find(mr => mr.marketer_id === id);
      const feePersen = right?.persen_fee || 2.5; // Default 2.5%

      return {
        id,
        marketer_nama: data.nama,
        jumlah_deal: data.count,
        total_omset: data.omset,
        fee_persen: feePersen,
        total_fee: Math.round(data.omset * feePersen / 100),
      };
    }).sort((a, b) => b.total_omset - a.total_omset);
  }, [sales, marketers, marketerRights]);

  const grandTotalFee = useMemo(() => feeData.reduce((s, r) => s + r.total_fee, 0), [feeData]);
  const grandTotalOmset = useMemo(() => feeData.reduce((s, r) => s + r.total_omset, 0), [feeData]);
  const grandTotalDeal = useMemo(() => feeData.reduce((s, r) => s + r.jumlah_deal, 0), [feeData]);

  const handleExportExcel = () => {
    const data = feeData.map((r, i) => ({
      No: i + 1,
      'Nama Marketer': r.marketer_nama,
      'Jumlah Deal': r.jumlah_deal,
      'Total Omset': r.total_omset,
      'Fee (%)': r.fee_persen,
      'Total Fee (Rp)': r.total_fee,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Marketing_Fee');
    XLSX.writeFile(workbook, 'Laporan_Marketing_Fee_Lansena.xlsx');
  };

  const columns: Column<MarketingFeeRow>[] = [
    {
      header: 'Nama Marketer',
      accessorKey: (r) => <span className="font-bold text-slate-800">{r.marketer_nama}</span>,
      sortable: true,
    },
    {
      header: 'Jumlah Deal',
      accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.jumlah_deal}</span>,
      sortable: true,
    },
    {
      header: 'Total Omset',
      accessorKey: (r) => <span className="font-bold text-green-600">{formatRupiah(r.total_omset)}</span>,
      sortable: true,
    },
    {
      header: 'Fee (%)',
      accessorKey: (r) => <span className="text-slate-600">{r.fee_persen}%</span>,
    },
    {
      header: 'Total Fee (Rp)',
      accessorKey: (r) => <span className="font-bold text-orange-600">{formatRupiah(r.total_fee)}</span>,
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Marketing Fee</h1>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi fee/komisi marketer berdasarkan penjualan unit perumahan
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Total Marketer</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{feeData.length}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-blue-600 uppercase font-semibold">Total Deal</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{grandTotalDeal}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-green-600 uppercase font-semibold">Total Omset</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatRupiah(grandTotalOmset)}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-orange-600 uppercase font-semibold">Total Fee</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatRupiah(grandTotalFee)}</p>
        </div>
      </div>

      <DataTable
        title="Rincian Fee Per Marketer"
        data={feeData}
        columns={columns}
        searchPlaceholder="Cari nama marketer..."
        exportFileName="Laporan_Marketing_Fee_Lansena"
      />
    </AppLayout>
  );
}
