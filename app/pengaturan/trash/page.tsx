'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useData } from '@/lib/data-context';
import { TrashItem } from '@/types';
import { Trash2, RotateCcw, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';

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
  const { trashItems, currentUser, restoreFromTrash, permanentlyDeleteTrash, refresh } = useData();
  const [selectedItem, setSelectedItem] = useState<TrashItem | null>(null);
  const [modalType, setModalType] = useState<'restore' | 'delete' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const handleRestoreConfirm = async () => {
    if (!selectedItem) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await restoreFromTrash(selectedItem.id);
      setSuccess(`Data "${selectedItem.record_label || selectedItem.record_id}" berhasil dipulihkan.`);
      setModalType(null);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || 'Gagal memulihkan data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermanentConfirm = async () => {
    if (!selectedItem) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await permanentlyDeleteTrash(selectedItem.id);
      setSuccess(`Data "${selectedItem.record_label || selectedItem.record_id}" telah dihapus secara permanen.`);
      setModalType(null);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data secara permanen.');
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<TrashItem>[] = [
    {
      header: 'Tabel Sumber',
      accessorKey: (r) => (
        <Badge variant="sky" className="font-mono text-[11px] uppercase">
          {r.source_table}
        </Badge>
      ),
      sortable: true,
    },
    {
      header: 'Label / Informasi Record',
      accessorKey: (r) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800 text-xs">{r.record_label || r.record_id}</span>
          <span className="text-[10px] text-slate-400 font-mono">ID: {r.record_id}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Dihapus Oleh',
      accessorKey: (r) => (
        <span className="text-xs font-semibold text-slate-700">
          {r.deleted_by_nama || 'System'}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Tanggal Dihapus',
      accessorKey: (r) => (
        <span className="text-xs text-slate-500 font-mono">
          {formatDateId(r.deleted_at)}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Aksi',
      accessorKey: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedItem(r);
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
              setSelectedItem(r);
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
      ),
    },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-rose-600" />
            <span>Kotak Sampah (Trash & Audit Log)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar data terhapus (soft delete) yang dapat dipulihkan atau dihapus permanen
          </p>
        </div>

        <button
          onClick={() => refresh()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Role Guard */}
      {!isSuperAdmin && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Akses Terbatas</p>
            <p className="text-xs text-rose-600 mt-0.5">
              Hanya Super Admin yang memiliki wewenang untuk melihat, memulihkan, atau menghapus permanen data di Kotak Sampah.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-semibold mb-4">
          {success}
        </div>
      )}

      {/* Data Table */}
      {isSuperAdmin && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <DataTable
            data={trashItems}
            columns={columns}
            title="Daftar Data di Kotak Sampah"
            searchPlaceholder="Cari label, ID, atau tabel sumber..."
            exportFileName="Trash_Audit_Log_Lansena"
          />
        </div>
      )}

      {/* Restore Modal */}
      <Modal isOpen={modalType === 'restore'} onClose={() => setModalType(null)} title="Konfirmasi Pulihkan Data">
        {selectedItem && (
          <div className="space-y-4 text-xs">
            {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md">{error}</div>}

            <p className="text-slate-700">
              Apakah Anda yakin ingin memulihkan data <strong>"{selectedItem.record_label || selectedItem.record_id}"</strong> dari tabel <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{selectedItem.source_table}</code>?
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
                onClick={handleRestoreConfirm}
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

      {/* Permanently Delete Modal */}
      <Modal isOpen={modalType === 'delete'} onClose={() => setModalType(null)} title="Hapus Data Secara Permanen">
        {selectedItem && (
          <div className="space-y-4 text-xs">
            {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-md">{error}</div>}

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">⚠️ PERINGATAN KERAS!</p>
                <p className="mt-1">
                  Tindakan ini akan menghapus data <strong>"{selectedItem.record_label || selectedItem.record_id}"</strong> secara permanen dari database. <strong>Tindakan ini TIDAK BISA DIBATALKAN.</strong>
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
                onClick={handleDeletePermanentConfirm}
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
    </AppLayout>
  );
}
