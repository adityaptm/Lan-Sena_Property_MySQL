'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { FileSpreadsheet, Printer, Search, UserCheck, DollarSign, Wallet, Award, ArrowUpRight } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import * as XLSX from 'xlsx';

interface MarketerDetail {
  id: string;
  noMarketer: string;
  nama: string;
  rekening: string;
  noHp: string;
  alamat: string;
  totalPenjualan: number;
  totalKomisi: number;
  komisiDibayar: number;
  sisaKomisi: number;
  daftarPenjualan: Array<{
    saleId: string;
    typeAndUnit: string;
    konsumen: string;
    komisi: number;
    komisiCair: number;
    sisaKomisi: number;
  }>;
}

export default function LaporanMarketingFeePage() {
  const { sales, marketers, marketerRights, units } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarketer, setSelectedMarketer] = useState<MarketerDetail | null>(null);

  // Helper formatting for rupiah without fractional trailing zero if whole number
  const formatRupiahCustom = (val: number) => {
    if (val === 0) return '0,00';
    return val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Build Marketer Fee Summary List
  const marketerFeeList = useMemo(() => {
    const activeSales = sales.filter((s) => s.status !== 'Batal');

    // Grouping map by Marketer
    const map: Record<
      string,
      {
        id: string;
        noMarketer: string;
        nama: string;
        rekening: string;
        noHp: string;
        alamat: string;
        totalPenjualan: number;
        totalKomisi: number;
        komisiCair: number;
        sisa: number;
        salesList: any[];
      }
    > = {};

    // 1. Initialize known marketers
    marketers.forEach((m, idx) => {
      const formattedCode = (m as any).no_marketer || `M${String(idx + 1).padStart(5, '0')}`;
      const bankInfo = m.bank_rekening && m.no_rekening
        ? `${m.bank_rekening} ${m.no_rekening} A/N ${m.nama}`
        : m.bank_rekening || m.no_rekening || '-';

      map[m.id] = {
        id: m.id,
        noMarketer: formattedCode,
        nama: m.nama,
        rekening: bankInfo,
        noHp: m.no_hp || '-',
        alamat: (m as any).alamat || '-',
        totalPenjualan: 0,
        totalKomisi: 0,
        komisiCair: 0,
        sisa: 0,
        salesList: [],
      };
    });

    // 2. Iterate sales to calculate commissions
    activeSales.forEach((s) => {
      const mid = s.marketer_id || 'unknown';
      if (!map[mid]) {
        const fallbackIdx = Object.keys(map).length + 1;
        map[mid] = {
          id: mid,
          noMarketer: `M${String(fallbackIdx).padStart(5, '0')}`,
          nama: s.marketer_nama || 'Marketer Tanpa Nama',
          rekening: '-',
          noHp: '-',
          alamat: '-',
          totalPenjualan: 0,
          totalKomisi: 0,
          komisiCair: 0,
          sisa: 0,
          salesList: [],
        };
      }

      const item = map[mid];
      item.totalPenjualan += 1;
      item.salesList.push(s);

      // Fee per sale: use s.fee_marketer or default 2.5% of total_harga
      let feeSale = s.fee_marketer || 0;
      if (!feeSale && s.total_harga) {
        feeSale = Math.round((s.total_harga * 2.5) / 100);
      }

      // Check disbursed fee from marketerRights if available
      const mRight = marketerRights.find((mr) => mr.sale_id === s.id && mr.marketer_id === mid);
      let cairSale = 0;
      if (mRight) {
        if (mRight.status_pencairan === 'Lunas') {
          cairSale = mRight.nominal_fee || feeSale;
        } else if (mRight.status_pencairan === 'Sebagian') {
          cairSale = Math.round((mRight.nominal_fee || feeSale) / 2);
        }
      }

      item.totalKomisi += feeSale;
      item.komisiCair += cairSale;
    });

    // Recalculate sisa per marketer
    Object.values(map).forEach((item) => {
      item.sisa = Math.max(0, item.totalKomisi - item.komisiCair);
    });

    return Object.values(map);
  }, [sales, marketers, marketerRights]);

  // Filtered List for Search
  const filteredMarketers = useMemo(() => {
    return marketerFeeList.filter(
      (m) =>
        m.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.noMarketer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.noHp.includes(searchQuery)
    );
  }, [marketerFeeList, searchQuery]);

  // Open Detail Drill-down Modal
  const handleOpenDetail = (marketer: (typeof marketerFeeList)[0]) => {
    const daftarPenjualan = marketer.salesList.map((s) => {
      const unitObj = units.find((u) => u.id === s.unit_id);
      const typeAndUnit = `${unitObj?.location_nama || s.location_nama || 'Perumahan'} ${unitObj?.unit_type_nama ? `Type ${unitObj.unit_type_nama}` : ''} ${unitObj?.block_nama || s.block_nama || ''} No ${unitObj?.no_unit || s.unit_no || '-'}`;

      let komisi = s.fee_marketer || 0;
      if (!komisi && s.total_harga) {
        komisi = Math.round((s.total_harga * 2.5) / 100);
      }

      const mRight = marketerRights.find((mr) => mr.sale_id === s.id && mr.marketer_id === marketer.id);
      let komisiCair = 0;
      if (mRight) {
        if (mRight.status_pencairan === 'Lunas') komisiCair = mRight.nominal_fee || komisi;
        else if (mRight.status_pencairan === 'Sebagian') komisiCair = Math.round((mRight.nominal_fee || komisi) / 2);
      }

      const sisaKomisi = Math.max(0, komisi - komisiCair);

      return {
        saleId: s.id,
        typeAndUnit,
        konsumen: s.customer_nama || '-',
        komisi,
        komisiCair,
        sisaKomisi,
      };
    });

    setSelectedMarketer({
      id: marketer.id,
      noMarketer: marketer.noMarketer,
      nama: marketer.nama,
      rekening: marketer.rekening,
      noHp: marketer.noHp,
      alamat: marketer.alamat,
      totalPenjualan: marketer.totalPenjualan,
      totalKomisi: marketer.totalKomisi,
      komisiDibayar: marketer.komisiCair,
      sisaKomisi: marketer.sisa,
      daftarPenjualan,
    });
  };

  const handleExportExcel = () => {
    const exportData = filteredMarketers.map((m) => ({
      'No Marketer': m.noMarketer,
      'Nama Marketer': m.nama,
      Rekening: m.rekening,
      'No Handphone': m.noHp,
      'Total Penjualan': m.totalPenjualan,
      'Total Komisi': m.totalKomisi,
      'Komisi Cair': m.komisiCair,
      Sisa: m.sisa,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Marketing_Fee');
    XLSX.writeFile(workbook, 'Laporan_Marketing_Fee.xlsx');
  };

  const totalAllPenjualan = useMemo(() => filteredMarketers.reduce((a, b) => a + b.totalPenjualan, 0), [filteredMarketers]);
  const totalAllKomisi = useMemo(() => filteredMarketers.reduce((a, b) => a + b.totalKomisi, 0), [filteredMarketers]);
  const totalAllCair = useMemo(() => filteredMarketers.reduce((a, b) => a + b.komisiCair, 0), [filteredMarketers]);
  const totalAllSisa = useMemo(() => filteredMarketers.reduce((a, b) => a + b.sisa, 0), [filteredMarketers]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Marketing Fee</h1>
            <p className="text-xs text-slate-400 mt-1">Daftar rekapitulasi fee &amp; komisi marketer per proyek</p>
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

        {/* Main Table Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-base">Daftar Laporan Marketing Fee</h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search marketer, kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No Marketer</th>
                  <th className="py-3 px-4">Nama Marketer</th>
                  <th className="py-3 px-4 text-center">Total Penjualan</th>
                  <th className="py-3 px-4 text-right">Total Komisi</th>
                  <th className="py-3 px-4 text-right">Komisi Cair</th>
                  <th className="py-3 px-4 text-right">Sisa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMarketers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">Belum ada data marketing fee.</td>
                  </tr>
                ) : (
                  filteredMarketers.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="hover:underline text-left"
                        >
                          {item.noMarketer}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="font-bold text-slate-800 hover:text-blue-600 hover:underline text-left"
                        >
                          {item.nama}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{item.totalPenjualan}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{formatRupiahCustom(item.totalKomisi)}</td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatRupiahCustom(item.komisiCair)}</td>
                      <td className="py-3 px-4 text-right font-bold text-orange-600">{formatRupiahCustom(item.sisa)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                <tr>
                  <td colSpan={2} className="py-3 px-4 uppercase text-xs">Total Overall</td>
                  <td className="py-3 px-4 text-center text-blue-600">{totalAllPenjualan}</td>
                  <td className="py-3 px-4 text-right text-slate-800">{formatRupiahCustom(totalAllKomisi)}</td>
                  <td className="py-3 px-4 text-right text-emerald-600">{formatRupiahCustom(totalAllCair)}</td>
                  <td className="py-3 px-4 text-right text-orange-600">{formatRupiahCustom(totalAllSisa)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Drill-down Detail Modal: Detail Marketing Fee */}
        {selectedMarketer && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Laporan Marketing Fee</h2>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">Detail Marketing Fee</p>
                </div>
                <button
                  onClick={() => setSelectedMarketer(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Tutup [X]
                </button>
              </div>

              {/* Profile Card Header */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <p><span className="font-semibold text-slate-500 inline-block w-36">Nama / No Marketer:</span> <span className="font-bold text-slate-800 text-sm">{selectedMarketer.nama} / {selectedMarketer.noMarketer}</span></p>
                <p><span className="font-semibold text-slate-500 inline-block w-36">Rekening:</span> <span>{selectedMarketer.rekening}</span></p>
                <p><span className="font-semibold text-slate-500 inline-block w-36">No Handphone:</span> <span className="font-mono">{selectedMarketer.noHp}</span></p>
                <p><span className="font-semibold text-slate-500 inline-block w-36">Alamat:</span> <span>{selectedMarketer.alamat}</span></p>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-lg text-center">
                  <p className="text-[11px] text-blue-700 uppercase font-semibold">Total Penjualan</p>
                  <p className="text-xl font-extrabold text-blue-800 mt-1">{selectedMarketer.totalPenjualan}</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Komisi</p>
                  <p className="text-xl font-extrabold text-slate-800 mt-1">{formatRupiah(selectedMarketer.totalKomisi)}</p>
                </div>
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg text-center">
                  <p className="text-[11px] text-emerald-700 uppercase font-semibold">Komisi Dibayar</p>
                  <p className="text-xl font-extrabold text-emerald-800 mt-1">{formatRupiah(selectedMarketer.komisiDibayar)}</p>
                </div>
                <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-lg text-center">
                  <p className="text-[11px] text-orange-700 uppercase font-semibold">Sisa Komisi</p>
                  <p className="text-xl font-extrabold text-orange-800 mt-1">{formatRupiah(selectedMarketer.sisaKomisi)}</p>
                </div>
              </div>

              {/* Daftar Penjualan Sub-table */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-sm">Daftar Penjualan</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Type &amp; Nomor Unit</th>
                        <th className="p-3">Konsumen</th>
                        <th className="p-3 text-right">Komisi</th>
                        <th className="p-3 text-right">Komisi Cair</th>
                        <th className="p-3 text-right">Sisa Komisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedMarketer.daftarPenjualan.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">Tidak ada transaksi penjualan untuk marketer ini.</td>
                        </tr>
                      ) : (
                        selectedMarketer.daftarPenjualan.map((dp) => (
                          <tr key={dp.saleId} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold text-slate-800">{dp.typeAndUnit}</td>
                            <td className="p-3">{dp.konsumen}</td>
                            <td className="p-3 text-right font-bold text-slate-800">{formatRupiah(dp.komisi)}</td>
                            <td className="p-3 text-right font-bold text-emerald-600">{formatRupiah(dp.komisiCair)}</td>
                            <td className="p-3 text-right font-bold text-orange-600">{formatRupiah(dp.sisaKomisi)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
