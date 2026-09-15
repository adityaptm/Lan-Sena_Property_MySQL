'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
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
  ShieldAlert,
  ShieldCheck,
  Globe,
  Monitor,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface LoginLog {
  id: string;
  user_id: string | null;
  nama: string;
  email: string;
  role: string | null;
  status: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function parseUserAgent(ua?: string | null) {
  if (!ua || ua === '-') return 'Tidak diketahui';
  if (ua.includes('Edg/')) return 'Microsoft Edge';
  if (ua.includes('Chrome/')) return 'Google Chrome';
  if (ua.includes('Firefox/')) return 'Mozilla Firefox';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Apple Safari';
  if (ua.includes('Android')) return 'Android Browser';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS Safari';
  return ua.slice(0, 35) + '...';
}

export default function RiwayatLoginPage() {
  const { currentUser } = useData();
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal confirm states
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showEmptyAllModal, setShowEmptyAllModal] = useState(false);

  // Search, filter & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSuperAdminOrProgrammer =
    currentUser?.role === 'Super Admin' || currentUser?.role === 'Programmer';

  const fetchLogs = useCallback(async () => {
    if (!isSuperAdminOrProgrammer) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login-logs');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat riwayat login');
      setLogs(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdminOrProgrammer]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter data
  const filteredData = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      log.nama?.toLowerCase().includes(q) ||
      log.email?.toLowerCase().includes(q) ||
      log.role?.toLowerCase().includes(q) ||
      log.status?.toLowerCase().includes(q) ||
      log.ip_address?.toLowerCase().includes(q) ||
      log.user_agent?.toLowerCase().includes(q) ||
      parseUserAgent(log.user_agent).toLowerCase().includes(q);

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'SUCCESS' && log.status.toLowerCase().includes('berhasil')) ||
      (statusFilter === 'FAILED' && !log.status.toLowerCase().includes('berhasil'));

    return matchSearch && matchStatus;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIdx, startIdx + pageSize);

  // Selection
  const currentPageIds = paginatedData.map((l) => l.id);
  const allCurrentSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds(new Set(filteredData.map((l) => l.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Actions
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/login-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus');
      setSuccess(`${json.count} riwayat login berhasil dihapus.`);
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      await fetchLogs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleEmptyAllConfirm = async () => {
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/login-logs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal mengosongkan riwayat login');
      setSuccess(`Seluruh riwayat login (${json.count} data) berhasil dikosongkan.`);
      setSelectedIds(new Set());
      setShowEmptyAllModal(false);
      await fetchLogs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const exportData = filteredData.map((r) => ({
      'Waktu Login': formatDateTime(r.created_at),
      Nama: r.nama,
      'Email / ID Login': r.email,
      Role: r.role || '-',
      Status: r.status,
      'IP Address': r.ip_address || '-',
      Perangkat: parseUserAgent(r.user_agent),
      'User Agent Detail': r.user_agent || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Riwayat Login');
    XLSX.writeFile(
      workbook,
      `Riwayat_Login_Lansena_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const getStatusBadge = (status: string) => {
    if (status.toLowerCase().includes('berhasil')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-200">
          <CheckCircle className="w-3.5 h-3.5" /> Berhasil
        </span>
      );
    }
    if (status.toLowerCase().includes('ditolak')) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5" /> {status}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5" /> {status}
      </span>
    );
  };

  const getRoleBadge = (role?: string | null) => {
    if (!role || role === '-') return <Badge variant="slate">-</Badge>;
    if (role === 'Super Admin' || role === 'Programmer') return <Badge variant="sky">{role}</Badge>;
    if (role === 'Admin') return <Badge variant="teal">{role}</Badge>;
    if (role === 'Marketing') return <Badge variant="emerald">{role}</Badge>;
    if (role === 'Finance') return <Badge variant="amber">{role}</Badge>;
    return <Badge variant="slate">{role}</Badge>;
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>Riwayat Login Akun</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log sesi login akun pengguna, waktu akses, IP address, dan perangkat pengakses
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isSuperAdminOrProgrammer && logs.length > 0 && (
            <button
              onClick={() => {
                setError('');
                setSuccess('');
                setShowEmptyAllModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition"
              title="Hapus semua riwayat login"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan Riwayat</span>
            </button>
          )}

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Role Guard */}
      {!isSuperAdminOrProgrammer && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Akses Dibatasi Khusus Super Admin & Programmer</p>
            <p className="text-xs text-rose-600 mt-0.5">
              Hanya akun dengan hak akses Super Admin atau Programmer yang diizinkan untuk melihat catatan riwayat login.
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
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

      {isSuperAdminOrProgrammer && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search & Status Filter */}
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, email, role, IP..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-slate-300 rounded-md text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="SUCCESS">Hanya Berhasil</option>
                  <option value="FAILED">Hanya Gagal / Ditolak</option>
                </select>

                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {filteredData.length} data
                </span>
              </div>

              {/* Print & Export */}
              <div className="flex items-center gap-2 justify-end">
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

                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded transition shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih ({selectedIds.size})</span>
                </button>
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
                    <th className="py-3.5 px-4">Waktu Login</th>
                    <th className="py-3.5 px-4">Pengguna</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">IP Address</th>
                    <th className="py-3.5 px-4">Perangkat / Browser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2 text-xs">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Memuat riwayat login...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-semibold">Belum ada catatan riwayat login.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((log) => (
                      <tr
                        key={log.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          selectedIds.has(log.id) ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleSelectOne(log.id)}
                            className="text-slate-500 hover:text-slate-800 flex items-center justify-center mx-auto"
                          >
                            {selectedIds.has(log.id) ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs">{log.nama}</span>
                            <span className="text-[11px] text-slate-500 font-mono">{log.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">{getRoleBadge(log.role)}</td>
                        <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            <Globe className="w-3 h-3 text-slate-400" />
                            <span>{log.ip_address || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span title={log.user_agent || undefined}>
                              {parseUserAgent(log.user_agent)}
                            </span>
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
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title={`Hapus ${selectedIds.size} Riwayat Login Terpilih`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Konfirmasi Penghapusan</p>
              <p className="mt-1">
                Anda akan menghapus <strong>{selectedIds.size} data riwayat login</strong>. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteConfirm}
              disabled={deleting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Menghapus...' : `Ya, Hapus (${selectedIds.size})`}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Empty All Modal */}
      <Modal
        isOpen={showEmptyAllModal}
        onClose={() => setShowEmptyAllModal(false)}
        title="Kosongkan Seluruh Riwayat Login"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-rose-100 border border-rose-300 rounded-lg text-rose-900 flex items-start gap-2.5">
            <AlertTriangle className="w-6 h-6 shrink-0 text-rose-700 mt-0.5" />
            <div>
              <p className="font-bold text-sm">⚠️ PERINGATAN KERAS!</p>
              <p className="mt-1 font-semibold">
                Anda akan menghapus SEMUA catatan riwayat login ({logs.length} data) secara permanen.
              </p>
              <p className="mt-1">
                Data audit sesi login tidak akan bisa dipulihkan kembali.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowEmptyAllModal(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleEmptyAllConfirm}
              disabled={deleting}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Mengosongkan...' : 'Ya, Kosongkan Semua'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
