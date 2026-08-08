'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/data-context';
import { Filter, X, Search, ChevronLeft, ChevronRight, Building2, CheckCircle2, SlidersHorizontal, RefreshCw } from 'lucide-react';

// Standard list of KPR progress statuses for reference filter options
export const STANDARD_KPR_STATUSES = [
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
  'KELUAR SP3K Bank Mandiri',
  'KELUAR SP3K BTN Karawang',
  'KELUAR SP3K BTN Purwakarta',
  'SIAP AKAD BRI',
  'SIAP AKAD BNI',
  'SIAP AKAD BTN PWK',
  'SIAP AKAD BTN KRW',
  'SIAP AKAD BJB',
  'AKAD KREDIT BANK MANDIRI',
  'AKAD KREDIT BANK BSI',
  'AKAD BANK BRI',
  'AKAD BANK BJB SYARIAH',
  'DI GESER SEMENTARA',
  'CANCEL/RIJEK',
];

export function DashboardProgress() {
  const { units, blocks, locations, sales, salesSteps } = useData();

  // Dynamic block list derived 100% from database (blocks, units, locations)
  const dynamicBlocks = useMemo(() => {
    const set = new Set<string>();
    blocks.forEach((b) => {
      const locName = b.location_nama || locations.find((l) => l.id === b.location_id)?.nama_lokasi || '';
      if (locName && b.nama_blok) {
        set.add(`${locName} - ${b.nama_blok}`);
      } else if (b.nama_blok) {
        set.add(b.nama_blok);
      }
    });
    units.forEach((u) => {
      if (u.block_nama) {
        if (u.location_nama) {
          set.add(`${u.location_nama} - ${u.block_nama}`);
        } else {
          set.add(u.block_nama);
        }
      }
    });
    return Array.from(set).sort();
  }, [blocks, locations, units]);

  // Dynamic list of KPR progress statuses (standard list + custom statuses from sales / steps in DB)
  const dynamicProgressStatuses = useMemo(() => {
    const set = new Set<string>(STANDARD_KPR_STATUSES);
    sales.forEach((s) => {
      if (s.kpr_status) set.add(s.kpr_status.toUpperCase());
    });
    salesSteps.forEach((ss) => {
      if (ss.nama_step) set.add(ss.nama_step.toUpperCase());
    });
    return Array.from(set);
  }, [sales, salesSteps]);

  // Filter state
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [selectedProgress, setSelectedProgress] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Initialize selected filters if not set yet
  const activeSelectedBlocks = selectedBlocks.length > 0 ? selectedBlocks : dynamicBlocks;
  const activeSelectedProgress = selectedProgress.length > 0 ? selectedProgress : dynamicProgressStatuses;

  // Search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Unit Ready data calculated ONLY from database units (status === 'Tersedia')
  const unitReadyData = useMemo(() => {
    const readyUnits = units.filter((u) => u.status === 'Tersedia');
    const map: Record<string, { lokasi: string; blok: string; numbers: string[] }> = {};

    readyUnits.forEach((u) => {
      const loc = u.location_nama || 'Perumahan';
      const blk = u.block_nama || 'Tanpa Blok';
      const key = `${loc}||${blk}`;
      if (!map[key]) {
        map[key] = { lokasi: loc, blok: blk, numbers: [] };
      }
      if (u.no_unit) {
        map[key].numbers.push(u.no_unit);
      }
    });

    return Object.values(map).map((item) => ({
      lokasi: item.lokasi,
      blok: item.blok,
      count: item.numbers.length,
      nomorUnit: item.numbers.length ? item.numbers.join(', ') + ',' : '-',
    }));
  }, [units]);

  // Filtered Unit Ready data
  const filteredData = useMemo(() => {
    return unitReadyData.filter((row) => {
      // Filter by selected blocks if filter is active
      if (selectedBlocks.length > 0) {
        const matchesBlock = selectedBlocks.some((selected) => {
          const blkPart = selected.includes(' - ') ? selected.split(' - ')[1] : selected;
          return (
            row.blok.toLowerCase().includes(blkPart.toLowerCase()) ||
            selected.toLowerCase().includes(row.blok.toLowerCase())
          );
        });
        if (!matchesBlock) return false;
      }

      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          row.lokasi.toLowerCase().includes(term) ||
          row.blok.toLowerCase().includes(term) ||
          row.nomorUnit.toLowerCase().includes(term)
        );
      }

      return true;
    });
  }, [unitReadyData, selectedBlocks, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Toggle handlers
  const toggleBlock = (block: string) => {
    if (selectedBlocks.length === 0) {
      setSelectedBlocks(dynamicBlocks.filter((b) => b !== block));
    } else {
      setSelectedBlocks((prev) =>
        prev.includes(block) ? prev.filter((b) => b !== block) : [...prev, block]
      );
    }
  };

  const toggleProgress = (status: string) => {
    if (selectedProgress.length === 0) {
      setSelectedProgress(dynamicProgressStatuses.filter((s) => s !== status));
    } else {
      setSelectedProgress((prev) =>
        prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
      );
    }
  };

  const selectAllBlocks = () => setSelectedBlocks([...dynamicBlocks]);
  const deselectAllBlocks = () => setSelectedBlocks([]);

  const selectAllProgress = () => setSelectedProgress([...dynamicProgressStatuses]);
  const deselectAllProgress = () => setSelectedProgress([]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Dashboard Progress</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi unit ready &amp; progres ketersediaan stok aktual perumahan
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold transition shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter Data</span>
            {(selectedBlocks.length > 0 || selectedProgress.length > 0) && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-white text-blue-600 rounded-full font-extrabold">
                Aktif
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Unit Ready Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Unit Ready</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar unit perumahan status tersedia (ready) berdasarkan database
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari lokasi, blok, nomor..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Lokasi</th>
                <th className="py-3 px-4">Blok</th>
                <th className="py-3 px-4 text-center">Jml Unit</th>
                <th className="py-3 px-4">Nomor Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                    Belum ada data unit ready dalam database
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{row.lokasi}</td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{row.blok}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs border border-emerald-200">
                        {row.count}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600 break-all max-w-md">
                      {row.nomorUnit}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 pt-2">
          <div>
            Menampilkan {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} dari {filteredData.length} data
          </div>

          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
            >
              <option value={5}>5 per halaman</option>
              <option value={10}>10 per halaman</option>
              <option value={25}>25 per halaman</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-1 font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER MODAL */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-base">Filter</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Section 1: Blok yang ditampilkan */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Blok yang ditampilkan :</h4>
                    <p className="text-xs text-slate-400">
                      {dynamicBlocks.length > 0
                        ? `Pilih blok dari ${dynamicBlocks.length} blok terdaftar`
                        : 'Belum ada data blok di database'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllBlocks}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllBlocks}
                      className="text-slate-500 hover:underline font-semibold"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50 text-xs">
                  {dynamicBlocks.length === 0 ? (
                    <div className="col-span-3 text-center text-slate-400 py-3">
                      Data blok tidak ditemukan
                    </div>
                  ) : (
                    dynamicBlocks.map((blokName) => {
                      const isChecked = activeSelectedBlocks.includes(blokName);
                      return (
                        <label
                          key={blokName}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${
                            isChecked
                              ? 'bg-blue-50 text-blue-800 font-medium'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBlock(blokName)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="truncate">{blokName}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Section 2: Progres yang ditampilkan */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Progres yang ditampilkan :</h4>
                    <p className="text-xs text-slate-400">Pilih tahapan progres KPR yang ditinjau</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllProgress}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllProgress}
                      className="text-slate-500 hover:underline font-semibold"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50 text-xs">
                  {dynamicProgressStatuses.map((statusName) => {
                    const isChecked = activeSelectedProgress.includes(statusName);
                    return (
                      <label
                        key={statusName}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-50 text-emerald-800 font-medium'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProgress(statusName)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="truncate">{statusName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedBlocks([]);
                  setSelectedProgress([]);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition shadow-sm"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
