'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { ChartOfAccount } from '@/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function AkunOperasionalPage() {
  const { chartOfAccounts, addChartOfAccount, updateChartOfAccount, deleteChartOfAccount } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama_akun: '', kode_akun: '', kategori: 'Beban' as ChartOfAccount['kategori'] });

  const openAdd = () => {
    setEditingId(null);
    setFormData({ nama_akun: '', kode_akun: '', kategori: 'Beban' });
    setIsModalOpen(true);
  };

  const openEdit = (coa: ChartOfAccount) => {
    setEditingId(coa.id);
    setFormData({ nama_akun: coa.nama_akun, kode_akun: coa.kode_akun, kategori: coa.kategori });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_akun.trim()) return;
    if (editingId) {
      await updateChartOfAccount(editingId, { nama_akun: formData.nama_akun, kode_akun: formData.kode_akun, kategori: formData.kategori });
    } else {
      await addChartOfAccount({ nama_akun: formData.nama_akun, kode_akun: formData.kode_akun, kategori: formData.kategori });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteChartOfAccount(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const columns: Column<ChartOfAccount>[] = [
    {
      header: 'Nama Akun',
      accessorKey: (r) => <span className="font-semibold text-slate-800">{r.nama_akun}</span>,
      sortable: true,
    },
    {
      header: 'Aksi',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(r)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold transition"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirmId(r.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-md text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Akun Operasional (Akuntansi)</h1>
          <p className="text-xs text-slate-400 mt-1">Master akun operasional untuk pembukuan perusahaan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Akun"
        data={chartOfAccounts}
        columns={columns}
        searchPlaceholder="Cari nama akun..."
        exportFileName="Akun_Operasional_Lansena"
        headerAction={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun</span>
          </button>
        }
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Akun Operasional' : 'Tambah Akun Operasional'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Akun *</label>
            <input
              type="text"
              required
              value={formData.nama_akun}
              onChange={(e) => setFormData({ ...formData, nama_akun: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Biaya Gaji/Upah Kerja"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Akun</label>
              <input
                type="text"
                value={formData.kode_akun}
                onChange={(e) => setFormData({ ...formData, kode_akun: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-mono text-slate-800 focus:outline-none"
                placeholder="Contoh: 5030"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Beban">Beban</option>
                <option value="Aset">Aset</option>
                <option value="Kewajiban">Kewajiban</option>
                <option value="Ekuitas">Ekuitas</option>
                <option value="Pendapatan">Pendapatan</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-slate-400">*) Wajib diisi.</p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-50 text-slate-600 rounded-md text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-md text-xs"
            >
              {editingId ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Konfirmasi Hapus">
        <p className="text-sm text-slate-600 mb-4">Apakah Anda yakin ingin menghapus akun ini?</p>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setDeleteConfirmId(null)}
            className="px-4 py-2 bg-slate-50 text-slate-600 rounded-md text-xs font-semibold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-xs"
          >
            Hapus
          </button>
        </div>
      </Modal>
    </AppLayout>
  );
}
