'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Modal } from '@/components/ui/Modal';
import { Sale } from '@/types';
import { Plus, Eye, Trash2, Search, Printer, Download, Filter, X, CheckSquare, Square, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

function formatDateId(dateStr?: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatNumberId(num: number) {
  return Math.round(num || 0).toLocaleString('id-ID');
}

// Badge status penjualan
function StatusBadge({ metode, kprStatus }: { metode: string; kprStatus?: string }) {
  if (metode === 'Cash' || metode === 'Cash Bertahap' || metode === 'Cash Keras') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        CASH
      </span>
    );
  }
  const s = (kprStatus || 'WAITING').toUpperCase();
  if (s.includes('REJECT')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        KPR (REJECTED)
      </span>
    );
  }
  if (s.includes('ACCEPT') || s.includes('APPROV') || s.includes('DEAL') || s.includes('AKAD')) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
        KPR (ACCEPTED)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
      KPR (WAITING)
    </span>
  );
}

// Standard Master Step Options (if DB data is scarce)
const ALL_STEP_OPTIONS = [
  'BOOKING',
  'CASH - AKAD',
  'CASH - PROSES AJB',
  'CASH - BAYAR BPHTB & BPN',
  'CASH - PENYERAHAN SERTIFIKAT',
  'CASH - UPLOAD BUKTI PENYERAHAN SERTIFIKAT',
  'CASH - PENCAIRAN DANA I',
  'CASH - PENCAIRAN DANA II',
  'KPR - PEMBERKASAN BJB',
  'KPR - PEMBERKASAN MANDIRI',
  'KPR - PEMBERKASAN BNI',
  'KPR - PEMBERKASAN BTN',
  'KPR - BERKAS LENGKAP',
  'KPR - DIPERIKSA BANK MANDIRI',
  'KPR - DIPERIKSA BANK BNI',
  'KPR - DIPERIKSA BANK BRI',
  'KPR - DI PERIKSA BANK LAIN',
  'KPR - MASUK BTN SUBANG',
  'KPR - DIPERIKSA BANK BJB',
  'KPR - DIPERIKSA BANK BTN Karawang',
  'KPR - DIPERIKSA BANK BTN Purwakarta',
  'KPR - KELUAR SP3K Bank BJB',
  'KPR - KELUAR SP3K BTN Purwakarta',
  'KPR - KELUAR SP3K Bank Mandiri',
  'KPR - KELUAR SP3K BTN Karawang',
  'KPR - SIAP AKAD BRI',
  'KPR - SIAP AKAD BJB',
  'KPR - SIAP AKAD BTN PWK',
  'KPR - SIAP AKAD BTN KRW',
  'KPR - SIAP AKAD BNI',
  'KPR - AKAD BANK BRI',
  'KPR - AKAD BANK BJB SYARIAH',
  'KPR - AKAD KREDIT BANK MANDIRI',
  'KPR - AKAD KREDIT BANK BSI',
  'KPR - AKAD KREDIT BTN Karawang',
  'KPR - AKAD KREDIT Bank Lain',
  'KPR - AKAD KREDIT BTN Purwakarta',
  'KPR - AKAD KREDIT Bank BJB',
  'KPR - CANCEL/RIJEK',
  'KPR - DI GESER SEMENTARA',
];

const ALL_STATUS_OPTIONS = [
  'CASH',
  'KPR',
  'KPR - WAITING',
  'KPR - ACCEPTED',
  'KPR - REJECTED',
];

export default function DaftarPenjualanPage() {
  const { sales, customers, units, blocks, locations, salesSteps, deleteSale } = useData();
  const router = useRouter();

  // --- Search & Pagination ---
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Modal Filter state ---
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);

  // --- Enriched Sales Data ---
  const enrichedSales = useMemo(() => {
    return sales.map((s) => {
      const cust = customers.find((c) => c.id === s.customer_id);
      const u = units.find((unit) => unit.id === s.unit_id);
      const b = blocks.find((blk) => blk.id === u?.block_id);
      const loc = locations.find((l) => l.id === b?.location_id);

      const locNama = s.location_nama || loc?.nama_lokasi || 'Benteng Mutiara Mas';
      const blkNama = s.block_nama || b?.nama_blok || 'BLOK Q11';
      const blockKey = `${locNama} - ${blkNama}`;

      // Dynamic Step Terakhir text
      let stepTerakhir = u?.sales_step_nama || s.kpr_status || s.status || 'AKAD KREDIT Bank BJB';
      if (s.metode_bayar === 'KPR' && s.kpr_status) {
        stepTerakhir = s.kpr_status.startsWith('KPR') ? s.kpr_status : `KPR - ${s.kpr_status}`;
      }

      // Unit type info (e.g. 30/60)
      const tipeUnit = u?.unit_type_nama || (u?.luas_bangunan && u?.luas_tanah ? `${u.luas_bangunan}/${u.luas_tanah}` : '30/60');

      return {
        ...s,
        block_key: blockKey,
        location_nama: locNama,
        block_nama: blkNama,
        unit_no: s.unit_no || u?.no_unit || '-',
        tipe_unit: tipeUnit,
        step_terakhir: stepTerakhir,
        customer_hp: cust?.no_hp || '-',
        customer_job: cust?.pekerjaan || cust?.instansi || '-',
      };
    });
  }, [sales, customers, units, blocks, locations]);

  // --- Dynamic Option Lists ---
  const availableBlockOptions = useMemo(() => {
    const list = new Set<string>();
    // Add blocks from actual DB locations & blocks
    blocks.forEach((b) => {
      const loc = locations.find((l) => l.id === b.location_id);
      const locName = loc ? loc.nama_lokasi : 'Benteng Mutiara Mas';
      list.add(`${locName} - ${b.nama_blok}`);
    });
    // Add blocks from actual sales
    enrichedSales.forEach((s) => {
      if (s.block_key) list.add(s.block_key);
    });
    return Array.from(list).sort();
  }, [blocks, locations, enrichedSales]);

  const availableStepOptions = useMemo(() => {
    const list = new Set<string>(ALL_STEP_OPTIONS);
    salesSteps.forEach((ss) => list.add(ss.nama_step));
    enrichedSales.forEach((s) => {
      if (s.step_terakhir) list.add(s.step_terakhir);
    });
    return Array.from(list);
  }, [salesSteps, enrichedSales]);

  // --- Filtering Logic ---
  const filteredSales = useMemo(() => {
    return enrichedSales.filter((s) => {
      // Search filter
      if (searchValue) {
        const q = searchValue.toLowerCase();
        const match =
          s.customer_nama?.toLowerCase().includes(q) ||
          s.block_nama?.toLowerCase().includes(q) ||
          s.unit_no?.toLowerCase().includes(q) ||
          s.marketer_nama?.toLowerCase().includes(q) ||
          s.customer_job?.toLowerCase().includes(q) ||
          s.customer_hp?.toLowerCase().includes(q) ||
          s.no_penjualan?.toLowerCase().includes(q);
        if (!match) return false;
      }

      // Block filter
      if (selectedBlocks.length > 0) {
        if (!selectedBlocks.includes(s.block_key) && !selectedBlocks.includes(s.block_nama)) {
          return false;
        }
      }

      // Status filter
      if (selectedStatuses.length > 0) {
        const isCash = s.metode_bayar === 'Cash' || s.metode_bayar === 'Cash Bertahap' || s.metode_bayar === 'Cash Keras';
        const st = (s.kpr_status || '').toUpperCase();

        let sTag = 'KPR - WAITING';
        if (isCash) sTag = 'CASH';
        else if (st.includes('REJECT')) sTag = 'KPR - REJECTED';
        else if (st.includes('ACCEPT') || st.includes('APPROV') || st.includes('DEAL') || st.includes('AKAD')) sTag = 'KPR - ACCEPTED';
        else if (s.metode_bayar === 'KPR') sTag = 'KPR';

        const matchStatus = selectedStatuses.some(
          (sel) => sel === sTag || sel === s.metode_bayar || (sel === 'KPR' && s.metode_bayar === 'KPR')
        );
        if (!matchStatus) return false;
      }

      // Step Terakhir filter
      if (selectedSteps.length > 0) {
        const matchStep = selectedSteps.some((step) => s.step_terakhir?.toLowerCase().includes(step.toLowerCase()));
        if (!matchStep) return false;
      }

      return true;
    });
  }, [enrichedSales, searchValue, selectedBlocks, selectedStatuses, selectedSteps]);

  // --- Pagination ---
  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  // Handlers
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data penjualan ini? Unit terkait akan dikembalikan ke status Tersedia.')) return;
    try {
      await deleteSale(id);
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus data penjualan.');
    }
  };

  const handleExportExcel = (r: any) => {
    const rowData = [
      {
        Tanggal: formatDateId(r.tanggal_booking || r.created_at),
        'Blok / Unit': `BLOK ${r.block_nama} No ${r.unit_no}`,
        Lokasi: r.location_nama,
        Tipe: r.tipe_unit,
        'Step Terakhir': r.step_terakhir,
        Harga: r.total_harga || 0,
        Konsumen: r.customer_nama,
        'No HP': r.customer_hp,
        Instansi: r.customer_job,
        Marketer: r.marketer_nama,
        'Fee Marketer': r.fee_marketer || 0,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rowData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Penjualan');
    XLSX.writeFile(wb, `Penjualan_${r.customer_nama || 'konsumen'}.xlsx`);
  };

  const toggleSelectBlock = (b: string) => {
    setSelectedBlocks((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));
  };

  const toggleSelectStatus = (st: string) => {
    setSelectedStatuses((prev) => (prev.includes(st) ? prev.filter((x) => x !== st) : [...prev, st]));
  };

  const toggleSelectStep = (step: string) => {
    setSelectedSteps((prev) => (prev.includes(step) ? prev.filter((x) => x !== step) : [...prev, step]));
  };

  const resetAllFilters = () => {
    setSelectedBlocks([]);
    setSelectedStatuses([]);
    setSelectedSteps([]);
    setSearchValue('');
  };

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Penjualan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filteredSales.length} dari {enrichedSales.length} total transaksi tercatat
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-xs transition border border-slate-300 shadow-2xs"
          >
            <Filter className="w-4 h-4 text-slate-600" />
            <span>Filter</span>
            {(selectedBlocks.length > 0 || selectedStatuses.length > 0 || selectedSteps.length > 0) && (
              <span className="w-2 h-2 rounded-full bg-blue-600 ml-0.5 animate-pulse" />
            )}
          </button>

          <Link
            href="/penjualan/input"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Input Penjualan</span>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-4">
        {/* Search & Show entries bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama konsumen, blok, unit, marketer..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(selectedBlocks.length > 0 || selectedStatuses.length > 0 || selectedSteps.length > 0 || searchValue) && (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
            <span className="font-bold text-slate-600">Filter Aktif:</span>
            {selectedBlocks.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold">
                Blok: {b}
                <button onClick={() => toggleSelectBlock(b)} className="hover:text-blue-900 font-bold">×</button>
              </span>
            ))}
            {selectedStatuses.map((st) => (
              <span key={st} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold">
                Status: {st}
                <button onClick={() => toggleSelectStatus(st)} className="hover:text-emerald-900 font-bold">×</button>
              </span>
            ))}
            {selectedSteps.map((step) => (
              <span key={step} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-semibold">
                Step: {step}
                <button onClick={() => toggleSelectStep(step)} className="hover:text-amber-900 font-bold">×</button>
              </span>
            ))}
            {searchValue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px] font-semibold">
                "{searchValue}"
                <button onClick={() => setSearchValue('')} className="hover:text-purple-900 font-bold">×</button>
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold underline ml-auto flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Semua Filter
            </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tgl & Tipe Penjualan</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Step Terakhir</th>
                <th className="py-3 px-4 text-right">Harga</th>
                <th className="py-3 px-4">Konsumen</th>
                <th className="py-3 px-4">Marketer</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data penjualan yang cocok dengan filter
                  </td>
                </tr>
              ) : (
                paginatedSales.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    {/* Tgl & Tipe */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="font-mono text-slate-600">{formatDateId(r.tanggal_booking || r.created_at)}</span>
                        <StatusBadge metode={r.metode_bayar} kprStatus={r.kpr_status} />
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">BLOK {r.block_nama} No {r.unit_no}</span>
                        <span className="text-[11px] text-slate-500">{r.location_nama}</span>
                      </div>
                    </td>

                    {/* Tipe */}
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.tipe_unit}</td>

                    {/* Step Terakhir */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 uppercase">{r.step_terakhir}</span>
                        <span className="text-[11px] text-slate-500">{formatDateId(r.tanggal_akad || r.tanggal_booking)}</span>
                      </div>
                    </td>

                    {/* Harga */}
                    <td className="py-3 px-4 text-right font-black text-slate-800">
                      {formatNumberId(r.total_harga || 0)}
                    </td>

                    {/* Konsumen */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-700">{r.customer_nama}</span>
                        <span className="text-[11px] text-slate-600 font-mono">{r.customer_hp}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{r.customer_job}</span>
                      </div>
                    </td>

                    {/* Marketer */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{r.marketer_nama || '-'}</span>
                        <span className="text-[11px] text-slate-500">
                          Fee : {formatNumberId(r.fee_marketer || 0)}
                        </span>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/penjualan/daftar/${r.id}`}
                          className="p-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded transition shadow-2xs"
                          title="Lihat Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => window.open(`/penjualan/print-sppr?id=${r.id}`)}
                          className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition shadow-2xs"
                          title="Cetak SPPR"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExportExcel(r)}
                          className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-2xs"
                          title="Download Excel"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded transition shadow-2xs"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Showing entries & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2">
          <div>
            Showing {filteredSales.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredSales.length)} of {filteredSales.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 font-semibold"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 5)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 rounded font-bold ${
                    currentPage === p ? 'bg-blue-600 text-white' : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* FILTER POPUP MODAL */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filter Data Penjualan">
        <div className="space-y-5 text-xs max-h-[70vh] overflow-y-auto pr-1">
          {/* SECTION 1: Blok yang ditampilkan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Blok yang ditampilkan :</h4>
              <button
                type="button"
                onClick={() =>
                  setSelectedBlocks(
                    selectedBlocks.length === availableBlockOptions.length ? [] : [...availableBlockOptions]
                  )
                }
                className="text-blue-600 hover:underline font-semibold text-[11px]"
              >
                {selectedBlocks.length === availableBlockOptions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded p-2.5 bg-slate-50">
              {availableBlockOptions.map((blkOption) => {
                const isChecked = selectedBlocks.includes(blkOption);
                return (
                  <label
                    key={blkOption}
                    className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-200/60 rounded cursor-pointer text-slate-700 transition"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectBlock(blkOption)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{blkOption}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Status yang ditampilkan */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Status yang ditampilkan :</h4>
              <button
                type="button"
                onClick={() =>
                  setSelectedStatuses(
                    selectedStatuses.length === ALL_STATUS_OPTIONS.length ? [] : [...ALL_STATUS_OPTIONS]
                  )
                }
                className="text-blue-600 hover:underline font-semibold text-[11px]"
              >
                {selectedStatuses.length === ALL_STATUS_OPTIONS.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 border border-slate-200 rounded p-2.5 bg-slate-50">
              {ALL_STATUS_OPTIONS.map((st) => {
                const isChecked = selectedStatuses.includes(st);
                return (
                  <label
                    key={st}
                    className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-200/60 rounded cursor-pointer text-slate-700 transition"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectStatus(st)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{st}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Step Terakhir */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Step Terakhir :</h4>
              <button
                type="button"
                onClick={() =>
                  setSelectedSteps(
                    selectedSteps.length === availableStepOptions.length ? [] : [...availableStepOptions]
                  )
                }
                className="text-blue-600 hover:underline font-semibold text-[11px]"
              >
                {selectedSteps.length === availableStepOptions.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded p-2.5 bg-slate-50">
              {availableStepOptions.map((step) => {
                const isChecked = selectedSteps.includes(step);
                return (
                  <label
                    key={step}
                    className="flex items-center gap-2 py-1 px-1.5 hover:bg-slate-200/60 rounded cursor-pointer text-slate-700 transition"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectStep(step)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{step}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-xs transition"
            >
              Reset Filter
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs shadow-sm transition"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
