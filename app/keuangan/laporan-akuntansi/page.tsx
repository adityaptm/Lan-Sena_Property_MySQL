'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { FileSpreadsheet, Download, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function LaporanAkuntansiPage() {
  const { chartOfAccounts, cashBankAccounts, sales, operationalExpenses, companyAssets } = useData();
  const [reportType, setReportType] = useState<'neraca' | 'labarugi' | 'bukubesardetail'>('labarugi');

  // Calculated totals for Income Statement
  const totalPendapatanPenjualan = sales.reduce((acc, curr) => acc + curr.total_harga, 0);
  const totalBebanOperasional = operationalExpenses.reduce((acc, curr) => acc + curr.nominal, 0);
  const labaKotor = totalPendapatanPenjualan;
  const labaBersih = labaKotor - totalBebanOperasional;

  // Calculated totals for Balance Sheet
  const totalKasBank = cashBankAccounts.reduce((acc, curr) => acc + curr.saldo, 0);
  const totalAsetTetap = companyAssets.reduce((acc, curr) => acc + curr.nilai_perolehan - curr.penyusutan, 0);
  const totalAktiva = totalKasBank + totalAsetTetap;

  const handleExportExcel = () => {
    const reportData = [
      { Kategori: 'Pendapatan Penjualan Rumah', Nominal: totalPendapatanPenjualan },
      { Kategori: 'Total Beban Operasional', Nominal: totalBebanOperasional },
      { Kategori: 'Laba Bersih Perusahaan', Nominal: labaBersih },
    ];
    const worksheet = XLSX.utils.json_to_sheet(reportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Akuntansi');
    XLSX.writeFile(workbook, `Laporan_Akuntansi_${reportType}_Lansena.xlsx`);
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Keuangan & Akuntansi</h1>
          <p className="text-xs text-slate-400 mt-1">Laporan standar akuntansi perusahaan developer (Neraca, Laba Rugi, Buku Besar)</p>
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
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-md w-fit">
        <button
          onClick={() => setReportType('labarugi')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition ${
            reportType === 'labarugi' ? 'bg-blue-50 text-blue-600 border border-teal-500/40' : 'text-slate-400'
          }`}
        >
          Laporan Laba Rugi
        </button>
        <button
          onClick={() => setReportType('neraca')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition ${
            reportType === 'neraca' ? 'bg-blue-50 text-blue-600 border border-teal-500/40' : 'text-slate-400'
          }`}
        >
          Laporan Neraca (Balance Sheet)
        </button>
        <button
          onClick={() => setReportType('bukubesardetail')}
          className={`px-4 py-2 rounded-md text-xs font-bold transition ${
            reportType === 'bukubesardetail' ? 'bg-blue-50 text-blue-600 border border-teal-500/40' : 'text-slate-400'
          }`}
        >
          Buku Besar COA
        </button>
      </div>

      {/* Report Card Content */}
      <div className="bg-white/60 border border-slate-200 rounded-md p-6 shadow-xl  space-y-6">
        {reportType === 'labarugi' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-800">PT LANSENA PROPERTY DEVELOPER</h2>
              <p className="text-xs text-blue-600 font-semibold uppercase">Laporan Laba Rugi (Income Statement)</p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                <span className="font-bold text-slate-700">1. Pendapatan Penjualan Unit Perumahan</span>
                <span className="font-bold text-green-600">Rp {totalPendapatanPenjualan.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200/60 pl-4 text-slate-400 text-xs">
                <span>- Omset Penjualan Unit KPR & Cash</span>
                <span>Rp {totalPendapatanPenjualan.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-200/60 pt-4">
                <span className="font-bold text-slate-700">2. Beban & Biaya Operasional</span>
                <span className="font-bold text-red-600">(Rp {totalBebanOperasional.toLocaleString('id-ID')})</span>
              </div>
              {operationalExpenses.map((oe) => (
                <div key={oe.id} className="flex justify-between items-center py-1 pl-4 text-slate-400 text-xs">
                  <span>- {oe.kategori} ({oe.keterangan})</span>
                  <span>Rp {oe.nominal.toLocaleString('id-ID')}</span>
                </div>
              ))}

              <div className="flex justify-between items-center py-3 bg-white px-4 rounded-md font-bold text-base border border-slate-200 mt-6">
                <span className="text-slate-800">LABA BERSIH PERIODE BERJALAN</span>
                <span className="text-blue-600">Rp {labaBersih.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        {reportType === 'neraca' && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-800">PT LANSENA PROPERTY DEVELOPER</h2>
              <p className="text-xs text-blue-600 font-semibold uppercase">Laporan Neraca (Balance Sheet)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aktiva */}
              <div className="space-y-3 bg-white/60 p-4 rounded-md border border-slate-200">
                <h3 className="font-bold text-blue-600 text-sm uppercase">AKTIVA (HARTA)</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Aset Lancar (Kas & Bank):</span>
                    <span className="font-mono text-slate-800">Rp {totalKasBank.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Aset Tetap (Kendaraan & Peralatan):</span>
                    <span className="font-mono text-slate-800">Rp {totalAsetTetap.toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 font-bold text-sm text-green-600">
                  <span>TOTAL AKTIVA</span>
                  <span>Rp {totalAktiva.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Pasiva */}
              <div className="space-y-3 bg-white/60 p-4 rounded-md border border-slate-200">
                <h3 className="font-bold text-orange-600 text-sm uppercase">PASIVA (KEWAJIBAN & EKUITAS)</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Hutang Bank KPR Proyek:</span>
                    <span className="font-mono text-slate-800">Rp 3,200,000,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Ekuitas & Laba Ditahan:</span>
                    <span className="font-mono text-slate-800">Rp {(totalAktiva - 3200000000).toLocaleString('id-ID')}</span>
                  </div>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-200 font-bold text-sm text-blue-600">
                  <span>TOTAL PASIVA</span>
                  <span>Rp {totalAktiva.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {reportType === 'bukubesardetail' && (
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Buku Besar Rincian Chart of Accounts</h3>
            <div className="divide-y divide-slate-800">
              {chartOfAccounts.map((coa) => (
                <div key={coa.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-600 mr-2">[{coa.kode_akun}]</span>
                    <span className="font-semibold text-slate-700">{coa.nama_akun}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600">{coa.kategori}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
