'use client';

import React, { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { FileSpreadsheet, Printer } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import * as XLSX from 'xlsx';

export default function LaporanHutangPiutangPage() {
  const { sales, salePayments, saleAdditionalCosts, bankLoans } = useData();

  // Piutang Konsumen: hitung sisa tagihan per sale yang belum lunas
  const piutangData = useMemo(() => {
    const activeSales = sales.filter((s) => s.status !== 'Batal' && s.status !== 'Lunas');

    return activeSales.map((s) => {
      const payments = salePayments.filter((p) => p.sale_id === s.id);
      const addCosts = saleAdditionalCosts.filter((c) => c.sale_id === s.id);
      const totalBayar = payments.reduce((sum, p) => sum + (p.nominal || 0), 0);
      const totalBiayaTambahan = addCosts.reduce((sum, c) => sum + (c.nominal || 0), 0);
      const totalTagihan = (s.total_harga || 0) + totalBiayaTambahan;
      const sisaTagihan = totalTagihan - totalBayar;

      return {
        id: s.id,
        customer_nama: s.customer_nama || '-',
        unit_no: s.unit_no || '-',
        location_nama: s.location_nama || '-',
        total_tagihan: totalTagihan,
        total_bayar: totalBayar,
        sisa: Math.max(0, sisaTagihan),
        status: s.status,
      };
    }).filter((r) => r.sisa > 0);
  }, [sales, salePayments, saleAdditionalCosts]);

  const totalPiutang = useMemo(() => piutangData.reduce((s, r) => s + r.sisa, 0), [piutangData]);
  const totalHutangBank = useMemo(() => bankLoans.reduce((s, bl) => s + ((bl as any).sisa_pokok || (bl as any).nominal || 0), 0), [bankLoans]);

  const handleExportExcel = () => {
    const piutangSheet = piutangData.map((r, i) => ({
      No: i + 1,
      Konsumen: r.customer_nama,
      'No. Unit': r.unit_no,
      Lokasi: r.location_nama,
      'Total Tagihan': r.total_tagihan,
      'Total Terbayar': r.total_bayar,
      'Sisa Piutang': r.sisa,
      Status: r.status,
    }));

    const hutangSheet = bankLoans.map((bl: any, i) => ({
      No: i + 1,
      'Nama Bank': bl.nama_bank || '-',
      'No. Pinjaman': bl.no_pinjaman || '-',
      'Nominal Pinjaman': bl.nominal || 0,
      'Sisa Pokok': bl.sisa_pokok || bl.nominal || 0,
      Status: bl.status || '-',
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(piutangSheet), 'Piutang_Konsumen');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hutangSheet), 'Hutang_Bank');
    XLSX.writeFile(wb, 'Laporan_Hutang_Piutang_Lansena.xlsx');
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Hutang Piutang</h1>
          <p className="text-xs text-slate-400 mt-1">
            Rekapitulasi piutang konsumen &amp; hutang bank perusahaan
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
          <p className="text-xs text-orange-600 uppercase font-semibold">Total Piutang Konsumen</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{formatRupiah(totalPiutang)}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-red-600 uppercase font-semibold">Total Hutang Bank</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatRupiah(totalHutangBank)}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md text-center">
          <p className="text-xs text-slate-400 uppercase font-semibold">Konsumen Menunggak</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{piutangData.length}</p>
        </div>
      </div>

      {/* Piutang Konsumen */}
      <div className="bg-white/60 border border-slate-200 rounded-md p-6 shadow-xl space-y-4 mt-4">
        <h3 className="font-bold text-slate-800 text-base">Piutang Konsumen (Sisa Tagihan)</h3>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-xs uppercase font-semibold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Konsumen</th>
                <th className="py-3 px-4">No. Unit</th>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-right">Sisa Piutang</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {piutangData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center text-slate-400 text-sm">
                    Tidak ada piutang konsumen yang menunggak.
                  </td>
                </tr>
              ) : (
                piutangData.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-400">{i + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.customer_nama}</td>
                    <td className="py-3 px-4 font-mono text-blue-600 font-bold text-xs">{r.unit_no}</td>
                    <td className="py-3 px-4">{r.location_nama}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatRupiah(r.total_tagihan)}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-semibold">{formatRupiah(r.total_bayar)}</td>
                    <td className="py-3 px-4 text-right text-orange-600 font-bold">{formatRupiah(r.sisa)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        r.status === 'DP' ? 'bg-orange-100 text-orange-700' :
                        r.status === 'Akad' ? 'bg-blue-100 text-blue-700' :
                        r.status === 'Booking' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hutang Bank */}
      <div className="bg-white/60 border border-slate-200 rounded-md p-6 shadow-xl space-y-4 mt-4">
        <h3 className="font-bold text-slate-800 text-base">Hutang Bank (Pinjaman Perusahaan)</h3>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-xs uppercase font-semibold text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Nama Bank</th>
                <th className="py-3 px-4">No. Pinjaman</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-right">Sisa Pokok</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bankLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-slate-400 text-sm">
                    Belum ada data hutang bank.
                  </td>
                </tr>
              ) : (
                bankLoans.map((bl: any, i) => (
                  <tr key={bl.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-xs text-slate-400">{i + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{bl.nama_bank || '-'}</td>
                    <td className="py-3 px-4 font-mono text-xs">{bl.no_pinjaman || '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatRupiah(bl.nominal || 0)}</td>
                    <td className="py-3 px-4 text-right text-red-600 font-bold">{formatRupiah(bl.sisa_pokok || bl.nominal || 0)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        bl.status === 'Lunas' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {bl.status || 'Aktif'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
