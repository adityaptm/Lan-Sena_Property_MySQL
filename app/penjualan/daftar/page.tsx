'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Modal } from '@/components/ui/Modal';
import {
  Plus, Eye, Trash2, Search, Printer, Download, Filter, RefreshCw,
  Clock, TrendingDown, XCircle, CheckCircle2, Wallet, AlertTriangle,
  ChevronDown, ChevronRight, FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDateId(dateStr?: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatNumberId(num: number) {
  return Math.round(num || 0).toLocaleString('id-ID');
}

/** Jumlah hari antara tanggal booking dan hari ini */
function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

/** Hitung jumlah hari kerja (Senin-Jumat) dari tanggal booking hingga sekarang */
function getWorkdaysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  if (isNaN(start.getTime())) return 0;
  const end = new Date();
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  return count;
}

/** Threshold hari kerja untuk dianggap "Progres Lambat" (14 hari kerja) */
const LAMBAT_THRESHOLD_WORKDAYS = 14;

// ─── Badge Komponen ─────────────────────────────────────────────────────────

function StatusBadge({ metode, kprStatus }: { metode: string; kprStatus?: string }) {
  const isCash = metode === 'Cash' || metode === 'Cash Bertahap' || metode === 'Cash Keras';
  if (isCash) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
        CASH
      </span>
    );
  }
  const s = (kprStatus || 'WAITING').toUpperCase();
  if (s.includes('REJECT')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase tracking-wider">
        KPR (REJECTED)
      </span>
    );
  }
  if (s.includes('ACCEPT') || s === 'SP3K' || s === 'AKAD') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
        KPR (ACCEPTED)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
      KPR (WAITING)
    </span>
  );
}

function ProgresBadge({ isLambat, days }: { isLambat: boolean; days: number }) {
  if (!isLambat) return null;
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">
      <TrendingDown className="w-2.5 h-2.5" />
      LAMBAT {days}H
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DaftarPenjualanPage() {
  const { sales, customers, units, blocks, locations, salesSteps, deleteSale } = useData();
  const router = useRouter();

  // ── State Filter ──
  const [kategoriFilter, setKategoriFilter] = useState<'semua' | 'lambat' | 'reject'>('semua');
  const [searchTarget, setSearchTarget] = useState<'konsumen' | 'blok' | 'tipe' | 'semua'>('konsumen');
  const [searchValue, setSearchValue] = useState('');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Expanded row detail
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // ── Enriched Data ──
  const enrichedSales = useMemo(() => {
    return sales.map((s) => {
      const cust = customers.find((c) => c.id === s.customer_id);
      const u = units.find((unit) => unit.id === s.unit_id);
      const b = blocks.find((blk) => blk.id === u?.block_id);
      const loc = locations.find((l) => l.id === b?.location_id);

      const locNama = s.location_nama || loc?.nama_lokasi || 'Benteng Mutiara Mas';
      const blkNama = s.block_nama || b?.nama_blok || '-';
      const blockKey = `${locNama} - ${blkNama}`;

      const stepTerakhir =
        u?.sales_step_nama && u.sales_step_nama !== 'Kantor'
          ? u.sales_step_nama
          : s.status || 'BOOKING';

      const tipeUnit = u?.unit_type_nama || (u?.luas_bangunan && u?.luas_tanah ? `${u.luas_bangunan}/${u.luas_tanah}` : '30/60');
      const workdays = getWorkdaysSince(s.tanggal_booking || s.created_at);
      const days = daysSince(s.tanggal_booking || s.created_at);
      const finalStatus = (s.status || '').toUpperCase();
      const kprUp = (s.kpr_status || '').toUpperCase();

      // Progres Lambat: durasi >= 14 hari kerja (atau 14 hari), status belum Akad/Lunas/Batal/Reject
      const isLambat =
        (workdays >= LAMBAT_THRESHOLD_WORKDAYS || days >= 14) &&
        finalStatus !== 'AKAD' &&
        finalStatus !== 'LUNAS' &&
        finalStatus !== 'BATAL' &&
        !kprUp.includes('REJECT');

      // Reject: kpr_status REJECTED atau status Batal
      const isReject = kprUp.includes('REJECT') || finalStatus === 'BATAL';

      // Accepted: kpr_status ACCEPTED / SP3K / Akad
      const isAccepted = kprUp.includes('ACCEPT') || kprUp === 'SP3K' || kprUp === 'AKAD';

      const tanggalStep = formatDateId(s.tanggal_booking || s.created_at);

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
        days_since: days,
        is_lambat: isLambat,
        is_reject: isReject,
        is_accepted: isAccepted,
        tanggal_step: tanggalStep,
      };
    });
  }, [sales, customers, units, blocks, locations]);

  // ── Filtering Logic ──
  const filteredSales = useMemo(() => {
    return enrichedSales.filter((s) => {
      // 1. Kategori Filter (Semua, Progres Lambat, Reject)
      if (kategoriFilter === 'lambat' && !s.is_lambat) return false;
      if (kategoriFilter === 'reject' && !s.is_reject) return false;

      // 2. Search Text berdasarkan Search Target
      if (searchValue.trim()) {
        const q = searchValue.toLowerCase().trim();
        if (searchTarget === 'konsumen') {
          if (!s.customer_nama?.toLowerCase().includes(q) && !s.customer_hp?.toLowerCase().includes(q)) {
            return false;
          }
        } else if (searchTarget === 'blok') {
          const unitFull = `blok ${s.block_nama} no ${s.unit_no}`.toLowerCase();
          if (!unitFull.includes(q) && !s.block_nama?.toLowerCase().includes(q) && !s.unit_no?.toLowerCase().includes(q)) {
            return false;
          }
        } else if (searchTarget === 'tipe') {
          if (!s.tipe_unit?.toLowerCase().includes(q) && !s.metode_bayar?.toLowerCase().includes(q)) {
            return false;
          }
        } else {
          // Semua Field
          const match =
            s.customer_nama?.toLowerCase().includes(q) ||
            s.block_nama?.toLowerCase().includes(q) ||
            s.unit_no?.toLowerCase().includes(q) ||
            s.tipe_unit?.toLowerCase().includes(q) ||
            s.marketer_nama?.toLowerCase().includes(q) ||
            s.customer_job?.toLowerCase().includes(q) ||
            s.customer_hp?.toLowerCase().includes(q) ||
            s.no_penjualan?.toLowerCase().includes(q);
          if (!match) return false;
        }
      }

      return true;
    });
  }, [enrichedSales, kategoriFilter, searchTarget, searchValue]);

  // ── Pagination ──
  const totalPages = Math.ceil(filteredSales.length / pageSize) || 1;
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  // ── Handlers ──
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data penjualan ini? Unit terkait akan dikembalikan ke status Tersedia.')) return;
    try {
      await deleteSale(id);
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus data penjualan.');
    }
  };

  const handleExportAllExcel = () => {
    const exportData = filteredSales.map((r) => ({
      Tanggal: formatDateId(r.tanggal_booking || r.created_at),
      'No Penjualan': r.no_penjualan || '-',
      'Blok / Unit': `BLOK ${r.block_nama} No ${r.unit_no}`,
      Lokasi: r.location_nama,
      Tipe: r.tipe_unit,
      'Step Terakhir': r.step_terakhir,
      'Metode Bayar': r.metode_bayar,
      'Status KPR': r.kpr_status || '-',
      Harga: r.total_harga || 0,
      Konsumen: r.customer_nama || '-',
      'No HP': r.customer_hp || '-',
      Instansi: r.customer_job || '-',
      Marketer: r.marketer_nama || '-',
      'Fee Marketer': r.fee_marketer || 0,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Penjualan');
    XLSX.writeFile(wb, `Daftar_Penjualan_${kategoriFilter}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportSingleRowExcel = (r: any) => {
    const ws = XLSX.utils.json_to_sheet([{
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
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Penjualan');
    XLSX.writeFile(wb, `Penjualan_${r.customer_nama || 'konsumen'}.xlsx`);
  };

  return (
    <AppLayout>
      {/* ── Header Atas ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 mb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Daftar Penjualan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar Penjualan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/penjualan/input"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00a65a] hover:bg-emerald-700 text-white font-semibold rounded text-xs transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Input Penjualan</span>
          </Link>
          <button
            onClick={handleExportAllExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f39c12] hover:bg-amber-600 text-white font-semibold rounded text-xs transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="bg-white border border-slate-200 rounded p-3 shadow-xs space-y-3">
        {/* ── Toolbar Filter Atas Tabel ── */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Dropdown Kategori Penjualan */}
            <select
              value={kategoriFilter}
              onChange={(e) => {
                setKategoriFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              <option value="semua">Semua Penjualan</option>
              <option value="lambat">Penjualan Progres Lambat</option>
              <option value="reject">Penjualan KPR Reject</option>
            </select>

            {/* Dropdown Field Target Search */}
            <select
              value={searchTarget}
              onChange={(e) => {
                setSearchTarget(e.target.value as any);
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
            >
              <option value="konsumen">Nama Konsumen</option>
              <option value="blok">Nama Blok / Unit</option>
              <option value="tipe">Type Penjualan</option>
              <option value="semua">Semua Field</option>
            </select>

            {/* Input Search Box & Tombol Cari */}
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder={
                  searchTarget === 'konsumen'
                    ? 'Cari nama konsumen...'
                    : searchTarget === 'blok'
                    ? 'Cari blok / no unit...'
                    : searchTarget === 'tipe'
                    ? 'Cari tipe unit...'
                    : 'Cari kata kunci...'
                }
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setCurrentPage(1);
                }}
                className="w-48 sm:w-64 border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => setCurrentPage(1)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#00c0ef] hover:bg-sky-600 text-white font-bold rounded text-xs transition shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Cari</span>
              </button>
            </div>
          </div>

          {/* Show Entries */}
          <div className="text-xs text-slate-600 flex items-center justify-end gap-1.5">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-xs whitespace-nowrap border-collapse">
            <thead className="bg-[#0097a7] text-white font-bold border-b border-cyan-800">
              <tr>
                <th className="py-2.5 px-3">Tgl & Tipe Penjualan</th>
                <th className="py-2.5 px-3">Unit</th>
                <th className="py-2.5 px-3">Tipe</th>
                <th className="py-2.5 px-3">Step Terakhir</th>
                <th className="py-2.5 px-3 text-right">Harga</th>
                <th className="py-2.5 px-3">Konsumen</th>
                <th className="py-2.5 px-3">Marketer</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    Tidak ada data penjualan yang cocok dengan filter
                  </td>
                </tr>
              ) : (
                paginatedSales.map((r) => {
                  const isExpanded = expandedRowId === r.id;

                  return (
                    <React.Fragment key={r.id}>
                      <tr className={`hover:bg-slate-50 transition-colors ${
                        r.is_reject ? 'bg-rose-50/30' : r.is_lambat ? 'bg-amber-50/20' : ''
                      }`}>
                        {/* Tgl & Tipe Penjualan */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-mono text-slate-700 font-medium">
                              {formatDateId(r.tanggal_booking || r.created_at)}
                            </span>
                            <StatusBadge metode={r.metode_bayar} kprStatus={r.kpr_status} />
                            {r.is_lambat && (
                              <ProgresBadge isLambat={r.is_lambat} days={r.days_since} />
                            )}
                          </div>
                        </td>

                        {/* Unit */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 uppercase">
                              BLOK {r.block_nama} No {r.unit_no}
                            </span>
                            <span className="text-[11px] text-slate-500">{r.location_nama}</span>
                          </div>
                        </td>

                        {/* Tipe */}
                        <td className="py-2.5 px-3 font-medium text-slate-800">{r.tipe_unit}</td>

                        {/* Step Terakhir */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="font-bold text-slate-800 text-xs uppercase tracking-tight">
                              {r.step_terakhir}
                            </span>
                            {r.tanggal_step && r.tanggal_step !== '-' && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                {r.tanggal_step}
                              </span>
                            )}
                            {r.is_lambat && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold bg-[#dc2626] text-white shadow-2xs">
                                <AlertTriangle className="w-3 h-3 text-white fill-white/20 shrink-0" />
                                Progres Lambat
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Harga */}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatNumberId(r.total_harga || 0)}
                        </td>

                        {/* Konsumen */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 uppercase">{r.customer_nama}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{r.customer_hp}</span>
                            <span className="text-[10px] text-slate-400 uppercase">{r.customer_job}</span>
                          </div>
                        </td>

                        {/* Marketer */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 uppercase">{r.marketer_nama || '-'}</span>
                            {r.fee_marketer ? (
                              <span className="text-[11px] text-slate-500">
                                Fee : {formatNumberId(r.fee_marketer)}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link
                              href={`/penjualan/daftar/${r.id}`}
                              className="p-1.5 bg-[#00c0ef] hover:bg-sky-600 text-white rounded transition shadow-2xs"
                              title="Lihat Detail"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => window.open(`/penjualan/print-sppr?id=${r.id}`)}
                              className="p-1.5 bg-[#dd4b39] hover:bg-red-700 text-white rounded transition shadow-2xs"
                              title="Cetak SPPR"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleExportSingleRowExcel(r)}
                              className="p-1.5 bg-[#f39c12] hover:bg-amber-600 text-white rounded transition shadow-2xs"
                              title="Export Excel"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-1.5 bg-[#3c8dbc] hover:bg-blue-700 text-white rounded transition shadow-2xs"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expandable Detail Row ── */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={8} className="px-4 py-3 text-xs">
                            <div className="bg-white p-3.5 rounded border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                              <div>
                                <p className="text-[11px] font-semibold text-slate-500">Nama Konsumen</p>
                                <p className="font-bold text-blue-700 uppercase">{r.customer_nama}</p>
                                <p className="text-slate-500 font-mono text-[11px]">{r.customer_hp}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-slate-500">Nama Blok / Unit</p>
                                <p className="font-bold text-slate-800">BLOK {r.block_nama} No {r.unit_no}</p>
                                <p className="text-slate-500 text-[11px]">{r.location_nama}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-slate-500">Type Penjualan</p>
                                <p className="font-bold text-slate-800">{r.metode_bayar} ({r.tipe_unit})</p>
                                <p className="text-slate-500 text-[11px]">Harga: {formatNumberId(r.total_harga || 0)}</p>
                              </div>
                              <div className="flex flex-col items-start gap-1 bg-amber-50 p-2 rounded border border-amber-200">
                                <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> CARA MENGUBAH PROGRES
                                </p>
                                <p className="text-[11px] text-slate-600 leading-tight">
                                  Klik tombol <b>Update Progres</b> di bawah untuk mengubah step/progres terbaru agar status <i>Progres Lambat</i> otomatis hilang.
                                </p>
                                <Link
                                  href={`/penjualan/daftar/${r.id}`}
                                  className="mt-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded transition flex items-center gap-1 shadow-2xs"
                                >
                                  <Plus className="w-3 h-3" /> Update Progres Sekarang
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Showing entries & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-1">
          <div>
            Showing {filteredSales.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredSales.length)} of {filteredSales.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 font-semibold"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`px-2.5 py-1 rounded font-bold ${
                  currentPage === p
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 font-semibold"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
