'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { useData } from '@/lib/data-context';
import {
  Search,
  Trash2,
  CheckSquare,
  Square,
  MinusSquare,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id: string;
  user_nama: string;
  user_role: string;
  action: string;
  table_name: string;
  record_id: string;
  record_label: string | null;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

// Mapping nama tabel ke label yang lebih ramah pengguna
const TABLE_LABELS: Record<string, string> = {
  users: 'Pengguna',
  customers: 'Konsumen',
  banks: 'Bank',
  locations: 'Lokasi',
  blocks: 'Blok',
  unit_types: 'Tipe Unit',
  units: 'Unit Rumah',
  sales: 'Penjualan',
  items: 'Barang',
  purchases: 'Pembelian',
  goods_in: 'Barang Masuk',
  goods_out: 'Barang Keluar',
  cash_bank_accounts: 'Kas/Bank',
  cashflow_entries: 'Cashflow',
  mandor_advances: 'Kasbon Mandor',
  operational_expenses: 'Biaya Operasional',
  disbursement_requests: 'Pengajuan Pencairan',
  company_assets: 'Aset Perusahaan',
  company_settings: 'Pengaturan Perusahaan',
  marketers: 'Marketer',
  marketer_rights: 'Hak Marketer',
  online_bookings: 'Booking Online',
  sale_payments: 'Pembayaran',
  sale_additional_costs: 'Biaya Tambahan',
  sale_discounts: 'Diskon',
  bank_loans: 'Hutang Bank',
  chart_of_accounts: 'Akun Keuangan',
  trash: 'Kotak Sampah',
  sale_step_history: 'Tahapan Penjualan',
  sale_kpr_submissions: 'Pengajuan KPR',
  sale_billing_letters: 'Surat Tagihan',
  sales_steps: 'Master Tahapan Penjualan',
  certificate_steps: 'Master Tahapan Sertifikat',
  kpr_steps: 'Master Tahapan KPR',
  price_items: 'Item Harga',
  subsidy_types: 'Jenis Subsidi',
  marketer_types: 'Jenis Marketer',
  purchase_items: 'Item Pembelian',
  goods_in_items: 'Item Barang Masuk',
  goods_out_items: 'Item Barang Keluar',
  marketing_fees: 'Marketing Fee',
  login_logs: 'Riwayat Login',
  activity_logs: 'Riwayat Aktivitas',
};

function getTableLabel(tableName: string): string {
  return TABLE_LABELS[tableName] || tableName;
}

function getActionBadge(action: string) {
  switch (action) {
    case 'insert':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200">
          <Plus className="w-3 h-3" /> Tambah
        </span>
      );
    case 'update':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          <Edit2 className="w-3 h-3" /> Edit
        </span>
      );
    case 'delete':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3" /> Hapus
        </span>
      );
    default:
      return <Badge variant="slate">{action}</Badge>;
  }
}

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function RiwayatAktivitasPage() {
  const { currentUser } = useData();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSuperAdmin =
    currentUser?.role === 'Super Admin' || currentUser?.role === 'Programmer';

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/activity-logs');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data');
      setLogs(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter data berdasarkan search
  const filteredData = logs.filter((log) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.user_nama?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q) ||
      log.table_name?.toLowerCase().includes(q) ||
      getTableLabel(log.table_name)?.toLowerCase().includes(q) ||
      log.record_label?.toLowerCase().includes(q) ||
      log.detail?.toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const pageData = filteredData.slice(startIdx, startIdx + pageSize);

  // Select all logic (untuk halaman saat ini)
  const allPageIds = pageData.map((l) => l.id);
  const allSelected =
    allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected =
    allPageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      // Select all on current page
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPageIds.forEach((id) => next.add(id));
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
    setSelectedIds(new Set(filteredData.map((l) => l.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Anda yakin ingin menghapus ${selectedIds.size} riwayat aktivitas? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/activity-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus');
      setSuccess(`${json.deleted} riwayat berhasil dihapus.`);
      setSelectedIds(new Set());
      await fetchLogs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Riwayat Aktivitas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Log terakhir pengguna yang menambahkan, mengedit, atau menghapus data
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-md transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Role Guard */}
      {!isSuperAdmin && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-3 my-4">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Akses Dibatasi Khusus Super Admin & Programmer</p>
            <p className="text-xs text-rose-600 mt-0.5">
              Hanya Super Admin dan Programmer yang memiliki hak akses untuk melihat log riwayat aktivitas.
            </p>
          </div>
        </div>
      )}

      {/* Pesan error/sukses */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}

      {/* Toolbar: Search + Bulk Actions */}
      {isSuperAdmin && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, aksi, tabel..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-md text-sm w-72 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              {filteredData.length} data ditemukan
            </span>
          </div>

          {isSuperAdmin && selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">
                {selectedIds.size} dipilih
              </span>
              <button
                onClick={handleSelectAllFiltered}
                className="text-xs px-3 py-1.5 font-medium bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-md transition-colors"
              >
                Pilih Semua ({filteredData.length})
              </button>
              <button
                onClick={handleClearSelection}
                className="text-xs px-3 py-1.5 font-medium bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
              >
                Batal Pilih
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-medium bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Menghapus...' : `Hapus (${selectedIds.size})`}
              </button>
            </div>
          )}
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-left">
                {isSuperAdmin && (
                  <th className="px-4 py-3 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-500 hover:text-slate-800"
                      title={allSelected ? 'Batal pilih semua' : 'Pilih semua di halaman ini'}
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4.5 h-4.5 text-blue-600" />
                      ) : someSelected ? (
                        <MinusSquare className="w-4.5 h-4.5 text-blue-400" />
                      ) : (
                        <Square className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Waktu
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Pengguna
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Aksi
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Modul / Tabel
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Memuat riwayat...</span>
                    </div>
                  </td>
                </tr>
              ) : pageData.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Belum ada riwayat aktivitas.</p>
                  </td>
                </tr>
              ) : (
                pageData.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      selectedIds.has(log.id) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {isSuperAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSelectOne(log.id)}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          {selectedIds.has(log.id) ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800">
                          {log.user_nama}
                        </span>
                        <span className="text-xs text-slate-400">
                          {log.user_role}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm text-slate-800 font-semibold">
                          {getTableLabel(log.table_name)}
                        </span>
                        {log.record_label && (
                          <span
                            className="inline-block text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200/80 rounded px-2 py-0.5 max-w-[280px] break-words"
                            title={log.record_label}
                          >
                            {log.record_label}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p
                        className="text-xs text-slate-600 leading-relaxed max-w-[450px] whitespace-normal break-words"
                        title={log.detail || ''}
                      >
                        {log.detail || '-'}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Tampilkan</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                className="p-1.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-600 px-2">
                Hal {currentPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </AppLayout>
  );
}
