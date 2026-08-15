'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { FileSpreadsheet, Printer, Search, ExternalLink, Building2, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';

// Columns requested for KPR report
const KPR_COLUMNS = [
  'BOOKING',
  'PEMBERKASAN BTN',
  'PEMBERKASAN BNI',
  'PEMBERKASAN BJB',
  'PEMBERKASAN MANDIRI',
  'BERKAS LENGKAP',
  'DIPERIKSA BANK MANDIRI',
  'DIPERIKSA BANK BRI',
  'MASUK BTN SUBANG',
  'DI PERIKSA BANK LAIN',
  'DIPERIKSA BANK BNI',
  'DIPERIKSA BANK BTN Purwakarta',
  'DIPERIKSA BANK BJB',
  'DIPERIKSA BANK BTN Karawang',
  'KELUAR SP3K Bank BJB',
  'KELUAR SP3K BTN Purwakarta',
  'KELUAR SP3K Bank Mandiri',
  'KELUAR SP3K BTN Karawang',
  'SIAP AKAD BRI',
  'SIAP AKAD BJB',
  'SIAP AKAD BTN PWK',
  'SIAP AKAD BTN KRW',
  'SIAP AKAD BNI',
  'AKAD BANK BRI',
  'AKAD BANK BJB SYARIAH',
  'AKAD KREDIT BANK MANDIRI',
  'AKAD KREDIT BANK BSI',
  'AKAD KREDIT BTN Karawang',
  'AKAD KREDIT Bank Lain',
  'AKAD KREDIT Bank BJB',
  'AKAD KREDIT BTN Purwakarta',
  'DI GESER SEMENTARA',
  'CANCEL/RIJEK',
];

interface UnitDetailItem {
  saleId: string;
  nomorUnit: string;
  konsumenNama: string;
  konsumenInstansi: string;
  noTelp: string;
  hargaJual: number;
  uangMasuk: number;
  sisa: number;
}

export default function LaporanPenjualanKPRPage() {
  const { sales, salePayments, saleAdditionalCosts, saleDiscounts, customers, units } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearch, setModalSearch] = useState('');
  const [selectedGroupTitle, setSelectedGroupTitle] = useState<string | null>(null);
  const [selectedUnits, setSelectedUnits] = useState<UnitDetailItem[]>([]);

  // Filter KPR Sales
  const kprSales = useMemo(() => {
    return sales.filter((s) => s.metode_bayar === 'KPR');
  }, [sales]);

  // Aggregate Sales by Location & Block
  const matrixData = useMemo(() => {
    const groupMap: Record<
      string,
      {
        lokasi: string;
        blok: string;
        terjual: number;
        belumLunas: number;
        sudahLunas: number;
        stepCounts: Record<string, number>;
        salesList: any[];
      }
    > = {};

    kprSales.forEach((s) => {
      const unitObj = units.find((u) => u.id === s.unit_id);
      const lokasi = unitObj?.location_nama || s.location_nama || 'Lokasi General';
      const blok = unitObj?.block_nama || s.block_nama || 'Blok -';
      const key = `${lokasi}___${blok}`;

      if (!groupMap[key]) {
        groupMap[key] = {
          lokasi,
          blok,
          terjual: 0,
          belumLunas: 0,
          sudahLunas: 0,
          stepCounts: {},
          salesList: [],
        };
        KPR_COLUMNS.forEach((col) => (groupMap[key].stepCounts[col] = 0));
      }

      const item = groupMap[key];
      item.salesList.push(s);

      // Check step/status matching
      const currentStep = (s.kpr_status || s.status || '').toUpperCase().trim();
      const isRejected = currentStep === 'REJECTED' || currentStep.includes('REJECT');
      const isBatal = currentStep === 'BATAL' || s.status === 'Batal';

      if (isRejected || isBatal) {
        item.stepCounts['CANCEL/RIJEK'] = (item.stepCounts['CANCEL/RIJEK'] || 0) + 1;
        // REJECTED/BATAL tidak dihitung ke terjual/belumLunas/sudahLunas
      } else {
        if (s.status !== 'Batal') {
          item.terjual += 1;
          if (s.status === 'Lunas') {
            item.sudahLunas += 1;
          } else {
            item.belumLunas += 1;
          }
        }

        let matched = false;
        for (const col of KPR_COLUMNS) {
          if (col === currentStep || currentStep.includes(col) || col.includes(currentStep)) {
            item.stepCounts[col] = (item.stepCounts[col] || 0) + 1;
            matched = true;
            break;
          }
        }
        if (!matched && currentStep === 'BOOKING') {
          item.stepCounts['BOOKING'] = (item.stepCounts['BOOKING'] || 0) + 1;
        }
      }
    });

    return Object.values(groupMap);
  }, [kprSales, units]);

  // Filter matrix by search query
  const filteredMatrix = useMemo(() => {
    return matrixData.filter(
      (m) =>
        m.lokasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.blok.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [matrixData, searchQuery]);

  // Open detail modal for specific sales list
  const handleOpenUnitsModal = (title: string, rawSales: any[]) => {
    const list: UnitDetailItem[] = rawSales.map((s) => {
      const cust = customers.find((c) => c.id === s.customer_id);
      const unitObj = units.find((u) => u.id === s.unit_id);

      const payments = salePayments.filter((p) => p.sale_id === s.id);
      const addCosts = saleAdditionalCosts.filter((c) => c.sale_id === s.id);
      const discounts = saleDiscounts.filter((d) => d.sale_id === s.id);

      const totalBayar = payments.reduce((sum, p) => sum + (p.nominal || 0), 0);
      const totalAdd = addCosts.reduce((sum, c) => sum + (c.nominal || 0), 0);
      const totalDisc = discounts.reduce((sum, d) => sum + (d.nominal || 0), 0);

      const hargaJual = (s.total_harga || 0) + totalAdd - totalDisc;
      const sisa = Math.max(0, hargaJual - totalBayar);

      const nomorUnit = `${unitObj?.location_nama || s.location_nama || 'Perumahan'} ${unitObj?.block_nama || s.block_nama || ''} - ${unitObj?.no_unit || s.unit_no || '-'}`;

      return {
        saleId: s.id,
        nomorUnit,
        konsumenNama: cust?.nama || s.customer_nama || 'Tanpa Nama',
        konsumenInstansi: cust?.instansi || cust?.pekerjaan || '-',
        noTelp: cust?.no_hp || '-',
        hargaJual,
        uangMasuk: totalBayar,
        sisa,
      };
    });

    setSelectedGroupTitle(title);
    setSelectedUnits(list);
    setModalSearch('');
  };

  // Filter modal list
  const filteredModalUnits = useMemo(() => {
    return selectedUnits.filter(
      (u) =>
        u.nomorUnit.toLowerCase().includes(modalSearch.toLowerCase()) ||
        u.konsumenNama.toLowerCase().includes(modalSearch.toLowerCase()) ||
        u.noTelp.includes(modalSearch)
    );
  }, [selectedUnits, modalSearch]);

  const handleExportExcel = () => {
    const exportData = filteredMatrix.map((row) => {
      const base: Record<string, any> = {
        LOKASI: row.lokasi,
        BLOK: row.blok,
        TERJUAL: row.terjual,
        'BELUM LUNAS': row.belumLunas,
        'SUDAH LUNAS': row.sudahLunas,
      };
      KPR_COLUMNS.forEach((col) => {
        base[col] = row.stepCounts[col] || 0;
      });
      return base;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan_Penjualan_KPR');
    XLSX.writeFile(workbook, 'Laporan_Penjualan_KPR.xlsx');
  };

  const formatRupiahDec = (num: number) => {
    return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Penjualan KPR</h1>
            <p className="text-xs text-slate-400 mt-1">Daftar Laporan Penjualan KPR per Lokasi &amp; Blok</p>
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

        {/* Search & Main Matrix */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-base">Daftar Laporan Penjualan KPR</h3>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search lokasi, blok..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs whitespace-nowrap text-slate-600">
              <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200 uppercase">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-100 z-10 border-r border-slate-200">LOKASI</th>
                  <th className="p-3">BLOK</th>
                  <th className="p-3 text-center bg-blue-50 text-blue-800">TERJUAL</th>
                  <th className="p-3 text-center bg-amber-50 text-amber-800">BELUM LUNAS</th>
                  <th className="p-3 text-center bg-emerald-50 text-emerald-800">SUDAH LUNAS</th>
                  {KPR_COLUMNS.map((col) => (
                    <th key={col} className="p-3 text-center border-l border-slate-200">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={5 + KPR_COLUMNS.length} className="p-6 text-center text-slate-400">
                      Belum ada data laporan penjualan KPR.
                    </td>
                  </tr>
                ) : (
                  filteredMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-800 sticky left-0 bg-white border-r border-slate-200 shadow-sm">
                        {row.lokasi}
                      </td>
                      <td className="p-3 font-semibold text-slate-700">{row.blok}</td>
                      <td className="p-3 text-center font-bold text-blue-600 bg-blue-50/30">
                        <button
                          onClick={() => handleOpenUnitsModal(`${row.lokasi} - Blok ${row.blok} (TERJUAL)`, row.salesList)}
                          className="hover:underline"
                        >
                          {row.terjual}
                        </button>
                      </td>
                      <td className="p-3 text-center font-bold text-amber-600 bg-amber-50/30">
                        <button
                          onClick={() => handleOpenUnitsModal(`${row.lokasi} - Blok ${row.blok} (BELUM LUNAS)`, row.salesList.filter(s => s.status !== 'Lunas'))}
                          className="hover:underline"
                        >
                          {row.belumLunas}
                        </button>
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-600 bg-emerald-50/30">
                        <button
                          onClick={() => handleOpenUnitsModal(`${row.lokasi} - Blok ${row.blok} (SUDAH LUNAS)`, row.salesList.filter(s => s.status === 'Lunas'))}
                          className="hover:underline"
                        >
                          {row.sudahLunas}
                        </button>
                      </td>
                      {KPR_COLUMNS.map((col) => {
                        const count = row.stepCounts[col] || 0;
                        return (
                          <td key={col} className="p-3 text-center border-l border-slate-100">
                            {count > 0 ? (
                              <button
                                onClick={() => handleOpenUnitsModal(`${row.lokasi} - Blok ${row.blok} (${col})`, row.salesList)}
                                className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded hover:bg-blue-200 transition"
                              >
                                {count}
                              </button>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drilldown Modal: List Unit */}
        {selectedGroupTitle && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Laporan Penjualan KPR</h2>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">List Unit - {selectedGroupTitle}</p>
                </div>
                <button
                  onClick={() => setSelectedGroupTitle(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition self-start sm:self-auto"
                >
                  Tutup [X]
                </button>
              </div>

              {/* Modal Search Bar */}
              <div className="flex justify-between items-center gap-4 text-xs text-slate-500">
                <p>Showing {filteredModalUnits.length} entries</p>
                <div className="relative w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search unit, konsumen..."
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Modal Units Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-3">Nomor Unit</th>
                      <th className="p-3">Konsumen</th>
                      <th className="p-3">No Telp</th>
                      <th className="p-3 text-right">Harga Jual</th>
                      <th className="p-3 text-right">Uang Masuk</th>
                      <th className="p-3 text-right">Sisa</th>
                      <th className="p-3 text-center">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredModalUnits.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">Tidak ada unit ditemukan.</td>
                      </tr>
                    ) : (
                      filteredModalUnits.map((u) => (
                        <tr key={u.saleId} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-800">{u.nomorUnit}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{u.konsumenNama}</p>
                            <p className="text-[11px] text-slate-400">{u.konsumenInstansi}</p>
                          </td>
                          <td className="p-3 font-mono text-slate-700">{u.noTelp}</td>
                          <td className="p-3 text-right font-bold text-slate-800">{formatRupiahDec(u.hargaJual)}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">{formatRupiahDec(u.uangMasuk)}</td>
                          <td className="p-3 text-right font-bold text-rose-600">{formatRupiahDec(u.sisa)}</td>
                          <td className="p-3 text-center">
                            <Link
                              href={`/penjualan/daftar/${u.saleId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[11px] transition shadow-sm"
                            >
                              <span>Detail</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
