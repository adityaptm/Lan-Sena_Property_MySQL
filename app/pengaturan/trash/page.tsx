'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useData } from '@/lib/data-context';
import { TrashItem } from '@/types';
import {
  Trash2,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Search,
  Printer,
  Download,
  CheckSquare,
  Square,
  MinusSquare,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';

function formatDateId(dateStr?: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export default function TrashPage() {
  const {
    trashItems,
    currentUser,
    restoreFromTrash,
    restoreFromTrashBatch,
    permanentlyDeleteTrash,
    permanentlyDeleteTrashBatch,
    emptyAllTrash,
    refresh,
  } = useData();

  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
  const [modalType, setModalType] = useState<
    'restore' | 'delete' | 'bulk_delete' | 'bulk_restore' | 'empty_all' | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Search & Sorting & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('deleted_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const isSuperAdmin =
    currentUser?.role === 'Super Admin' || currentUser?.role === 'Programmer';

  // Filter search
  const filteredData = trashItems.filter((item) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.source_table?.toLowerCase().includes(q) ||
      item.record_label?.toLowerCase().includes(q) ||
      item.record_id?.toLowerCase().includes(q) ||
      item.deleted_by_nama?.toLowerCase().includes(q) ||
      formatDateId(item.deleted_at)?.toLowerCase().includes(q)
    );
  });

  // Sort
  const sortedData = [...filteredData].sort((a, b) => {
    let valA: any = a[sortField as keyof TrashItem] ?? '';
    let valB: any = b[sortField as keyof TrashItem] ?? '';

    if (sortField === 'deleted_at') {
      const timeA = new Date(valA || 0).getTime();
      const timeB = new Date(valB || 0).getTime();
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    }

    valA = String(valA).toLowerCase();
    valB = String(valB).toLowerCase();
    return sortDirection === 'asc'
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIdx, startIdx + pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Selection Handlers
  const currentPageIds = paginatedData.map((t) => t.id);
  const allCurrentSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selectedIds.has(id));
  const someCurrentSelected =
    currentPageIds.some((id) => selectedIds.has(id)) && !allCurrentSelected;

  const handleSelectCurrentPage = () => {
    if (allCurrentSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredData.map((t) => t.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Export Excel
  const handleExportExcel = () => {
    const exportData = filteredData.map((r) => ({
      'Tabel Sumber': r.source_table,
      'Label Record': r.record_label || r.record_id,
      'ID Record': r.record_id,
      'Dihapus Oleh': r.deleted_by_nama || 'System',
      'Tanggal Dihapus': formatDateId(r.deleted_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kotak Sampah');
    XLSX.writeFile(
      workbook,
      `Kotak_Sampah_Lansena_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // Actions
  const handleRestoreSingleConfirm = async () => {
    if (!selectedItem) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await restoreFromTrash(selectedItem.id);
      setSuccess(
        `Data "${selectedItem.record_label || selectedItem.record_id}" berhasil dipulihkan.`
      );
      setModalType(null);
      setSelectedItem(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedItem.id);
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memulihkan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSingleConfirm = async () => {
    if (!selectedItem) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await permanentlyDeleteTrash(selectedItem.id);
      setSuccess(
        `Data "${selectedItem.record_label || selectedItem.record_id}" telah dihapus secara permanen.`
      );
      setModalType(null);
      setSelectedItem(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(selectedItem.id);
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data secara permanen.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const idsToDelete = Array.from(selectedIds);
      await permanentlyDeleteTrashBatch(idsToDelete);
      setSuccess(`${idsToDelete.length} data berhasil dihapus secara permanen.`);
      setSelectedIds(new Set());
      setModalType(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRestoreConfirm = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const idsToRestore = Array.from(selectedIds);
      await restoreFromTrashBatch(idsToRestore);
      setSuccess(`${idsToRestore.length} data berhasil dipulihkan.`);
      setSelectedIds(new Set());
      setModalType(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memulihkan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmptyAllConfirm = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await emptyAllTrash();
      setSuccess('Kotak sampah berhasil dikosongkan.');
      setSelectedIds(new Set());
      setModalType(null);
    } catch (err: any) {
      setError(err.message || 'Gagal mengosongkan kotak sampah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-600" />
            <span>Kotak Sampah (Trash & Audit Log)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar data terhapus (soft delete) yang dapat dipulihkan atau dihapus secara permanen
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdmin && trashItems.length > 0 && (
            <button
              onClick={() => {
                setError('');
                setSuccess('');
                setModalType('empty_all');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition"
              title="Hapus semua data di kotak sampah"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan Sampah</span>
            </button>
          )}

          <button
            onClick={() => refresh()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Role Guard */}
      {!isSuperAdmin && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Akses Terbatas</p>
            <p className="text-xs text-rose-600 mt-0.5">
              Hanya Super Admin dan Programmer yang memiliki wewenang untuk melihat, memulihkan, atau menghapus permanen data di Kotak Sampah.
            </p>
          </div>
        </div>
      )}

      {/* Success & Error Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md text-xs font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold mb-4">
          {success}
        </div>
      )}

      {isSuperAdmin && (
        <div className="space-y-4">
          {/* Toolbar: Search, Bulk Actions, Print, Export */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Left: Search input */}
              <div className="flex items-center gap-2.5 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari label, ID, atau tabel sumber..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {filteredData.length} data
                </span>
              </div>

              {/* Right: Print, Export, and Bulk Actions */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-xs font-medium text-slate-700 transition shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 text-xs font-medium text-slate-700 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>

            {/* Selection Toolbar Banner */}
            {selectedIds.size > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-blue-50/70 p-2.5 rounded-md border border-blue-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-900">
                    {selectedIds.size} data dipilih
                  </span>
                  <button
                    onClick={handleSelectAllFiltered}
                    className="text-xs px-2.5 py-1 font-semibold bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded transition"
                  >
                    Pilih Semua ({filteredData.length})
                  </button>
                  <button
                    onClick={handleClearSelection}
                    className="text-xs px-2.5 py-1 font-semibold bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded transition"
                  >
                    Batal Pilih
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setModalType('bulk_restore');
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded transition shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Pulihkan Terpilih ({selectedIds.size})</span>
                  </button>

                  <button
                    onClick={() => {
                      setError('');
                      setSuccess('');
                      setModalType('bulk_delete');
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded transition shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Terpilih ({selectedIds.size})</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-white bg-blue-600 uppercase font-semibold border-b border-blue-700 select-none">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">
                      <button
                        onClick={handleSelectCurrentPage}
                        className="text-white hover:text-blue-100 flex items-center justify-center mx-auto"
                        title={
                          allCurrentSelected
                            ? 'Batal pilih semua di halaman ini'
                            : 'Pilih semua di halaman ini'
                        }
                      >
                        {allCurrentSelected ? (
                          <CheckSquare className="w-4 h-4 text-white" />
                        ) : someCurrentSelected ? (
                          <MinusSquare className="w-4 h-4 text-blue-200" />
                        ) : (
                          <Square className="w-4 h-4 text-white/80" />
                        )}
                      </button>
                    </th>
                    <th
                      onClick={() => handleSort('source_table')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-blue-700 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Tabel Sumber</span>
                        <ArrowUpDown className="w-3 h-3 opacity-70" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('record_label')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-blue-700 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Label / Informasi Record</span>
                        <ArrowUpDown className="w-3 h-3 opacity-70" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('deleted_by_nama')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-blue-700 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Dihapus Oleh</span>
                        <ArrowUpDown className="w-3 h-3 opacity-70" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('deleted_at')}
                      className="py-3.5 px-4 cursor-pointer hover:bg-blue-700 transition"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Tanggal Dihapus</span>
                        <ArrowUpDown className="w-3 h-3 opacity-70" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-slate-400 text-xs"
                      >
                        <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-semibold">Kotak sampah kosong.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Tidak ada data yang cocok dengan kriteria pencarian.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          selectedIds.has(row.id) ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleSelectOne(row.id)}
                            className="text-slate-500 hover:text-slate-800 flex items-center justify-center mx-auto"
                          >
                            {selectedIds.has(row.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="sky"
                            className="font-mono text-[11px] uppercase font-semibold"
                          >
                            {row.source_table}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs">
                              {row.record_label || row.record_id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {row.record_id}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold text-slate-700">
                            {row.deleted_by_nama || 'System'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-slate-500 font-mono">
                            {formatDateId(row.deleted_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedItem(row);
                                setModalType('restore');
                                setError('');
                                setSuccess('');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded transition"
                              title="Pulihkan Data"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Pulihkan</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedItem(row);
                                setModalType('delete');
                                setError('');
                                setSuccess('');
                              }}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded transition"
                              title="Hapus Permanen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Permanen</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredData.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Tampilkan</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">
                    dari {filteredData.length} data
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-600 px-2 font-medium">
                    Hal {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Single Restore Modal */}
      <Modal
        isOpen={modalType === 'restore'}
        onClose={() => setModalType(null)}
        title="Konfirmasi Pulihkan Data"
      >
        {selectedItem && (
          <div className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md">
                {error}
              </div>
            )}

            <p className="text-slate-700">
              Apakah Anda yakin ingin memulihkan data{' '}
              <strong>
                "{selectedItem.record_label || selectedItem.record_id}"
              </strong>{' '}
              dari tabel{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">
                {selectedItem.source_table}
              </code>
              ?
            </p>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700">
              ℹ️ Data akan dimasukkan kembali ke tabel sumber utama.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRestoreSingleConfirm}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{loading ? 'Memulihkan...' : 'Ya, Pulihkan Data'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Single Delete Modal */}
      <Modal
        isOpen={modalType === 'delete'}
        onClose={() => setModalType(null)}
        title="Hapus Data Secara Permanen"
      >
        {selectedItem && (
          <div className="space-y-4 text-xs">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md">
                {error}
              </div>
            )}

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ PERINGATAN KERAS!</p>
                <p className="mt-1">
                  Tindakan ini akan menghapus data{' '}
                  <strong>
                    "{selectedItem.record_label || selectedItem.record_id}"
                  </strong>{' '}
                  secara permanen dari database.{' '}
                  <strong>Tindakan ini TIDAK BISA DIBATALKAN.</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSingleConfirm}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Menghapus...' : 'Ya, Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={modalType === 'bulk_delete'}
        onClose={() => setModalType(null)}
        title={`Hapus Permanen ${selectedIds.size} Data Terpilih`}
      >
        <div className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md">
              {error}
            </div>
          )}

          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">⚠️ PERINGATAN KERAS!</p>
              <p className="mt-1">
                Anda akan menghapus <strong>{selectedIds.size} data terpilih</strong>{' '}
                secara permanen dari database.{' '}
                <strong>Tindakan ini TIDAK BISA DIBATALKAN.</strong>
              </p>
            </div>
          </div>

          <p className="text-slate-600">
            Pastikan Anda benar-benar tidak memerlukan data ini lagi sebelum melanjutkan penghapusan.
          </p>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteConfirm}
              disabled={loading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? 'Menghapus...'
                  : `Ya, Hapus Permanen (${selectedIds.size})`}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Restore Modal */}
      <Modal
        isOpen={modalType === 'bulk_restore'}
        onClose={() => setModalType(null)}
        title={`Pulihkan ${selectedIds.size} Data Terpilih`}
      >
        <div className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md">
              {error}
            </div>
          )}

          <p className="text-slate-700">
            Apakah Anda yakin ingin memulihkan{' '}
            <strong>{selectedIds.size} data terpilih</strong> kembali ke tabel
            sumber masing-masing?
          </p>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-700">
            ℹ️ Semua record yang dipulihkan akan dikembalikan ke data operasional aktif.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleBulkRestoreConfirm}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>
                {loading
                  ? 'Memulihkan...'
                  : `Ya, Pulihkan (${selectedIds.size})`}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Empty All Trash Modal */}
      <Modal
        isOpen={modalType === 'empty_all'}
        onClose={() => setModalType(null)}
        title="Kosongkan Kotak Sampah"
      >
        <div className="space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md">
              {error}
            </div>
          )}

          <div className="p-4 bg-rose-100 border border-rose-300 rounded-lg text-rose-900 flex items-start gap-2.5">
            <AlertTriangle className="w-6 h-6 shrink-0 text-rose-700 mt-0.5" />
            <div>
              <p className="font-bold text-sm">⚠️ PERINGATAN BESAR!</p>
              <p className="mt-1 font-semibold">
                Anda akan mengosongkan SELURUH isi kotak sampah ({trashItems.length} record).
              </p>
              <p className="mt-1">
                Semua riwayat sampah akan dihapus secara permanen dan <strong>TIDAK BISA DIKEMBALIKAN LAGI</strong>.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleEmptyAllConfirm}
              disabled={loading}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {loading ? 'Mengosongkan...' : 'Ya, Kosongkan Semua Sampah'}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
