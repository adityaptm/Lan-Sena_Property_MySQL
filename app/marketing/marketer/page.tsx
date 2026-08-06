'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Marketer } from '@/types';
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';

export default function MarketerPage() {
  const { marketers, marketerTypes, addMarketer, updateMarketerData, deleteMarketerData } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarketer, setEditingMarketer] = useState<Marketer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Marketer | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    marketer_type_id: '',
    no_hp: '',
    email: '',
    bank_rekening: '',
    no_rekening: '',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      nama: '',
      marketer_type_id: marketerTypes[0]?.id || '',
      no_hp: '',
      email: '',
      bank_rekening: '',
      no_rekening: '',
      is_active: true,
    });
    setEditingMarketer(null);
  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (m: Marketer) => {
    setEditingMarketer(m);
    setFormData({
      nama: m.nama,
      marketer_type_id: m.marketer_type_id || marketerTypes[0]?.id || '',
      no_hp: m.no_hp || '',
      email: m.email || '',
      bank_rekening: m.bank_rekening || '',
      no_rekening: m.no_rekening || '',
      is_active: m.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.no_hp) return;

    if (editingMarketer) {
      await updateMarketerData(editingMarketer.id, formData);
    } else {
      await addMarketer(formData);
    }
    setIsModalOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteMarketerData(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const columns: Column<Marketer>[] = [
    {
      header: 'Nama Marketer',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
            {r.nama.charAt(0)}
          </div>
          <span className="font-bold text-slate-800">{r.nama}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Kategori Marketer', accessorKey: (r) => r.marketer_type_nama || '-', sortable: true },
    { header: 'No. HP / WA', accessorKey: 'no_hp' },
    { header: 'Email', accessorKey: (r) => r.email || '-' },
    {
      header: 'Rekening',
      accessorKey: (r) => (
        <div className="flex flex-col">
          <span className="text-slate-700">{r.bank_rekening || '-'}</span>
          <span className="text-xs text-slate-400 font-mono">{r.no_rekening || '-'}</span>
        </div>
      ),
    },
    {
      header: 'Unit Ditangani',
      accessorKey: (r) => <span className="font-bold text-blue-600">{r.units_handled || 0} unit</span>,
      sortable: true,
    },
    {
      header: 'Status',
      accessorKey: (r) => (
        <Badge variant={r.is_active ? 'emerald' : 'slate'}>
          {r.is_active ? 'Aktif' : 'Non-Aktif'}
        </Badge>
      ),
      sortable: true,
    },
    {
      header: 'Aksi',
      accessorKey: (r) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => openEdit(r)}
            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded transition"
            title="Edit Marketer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDeleteConfirm(r)}
            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded transition"
            title="Hapus Marketer"
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Marketer / Sales</h1>
          <p className="text-xs text-slate-400 mt-1">Tim penjualan perumahan internal, agent freelance, dan agency partner</p>
        </div>
      </div>

      <DataTable
        title="Daftar Tim Marketing"
        data={marketers}
        columns={columns}
        searchPlaceholder="Cari nama, no hp, email..."
        exportFileName="Data_Marketers_BMM"
        headerAction={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Marketer</span>
          </button>
        }
      />

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title={editingMarketer ? 'Edit Marketer' : 'Tambah Marketer Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Contoh: Doni Kurniawan"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Marketer *</label>
              <select
                value={formData.marketer_type_id}
                onChange={(e) => setFormData({ ...formData, marketer_type_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                {marketerTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama_jenis}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">No. HP / WA *</label>
              <input
                type="text"
                required
                value={formData.no_hp}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0812..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="marketer@email.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Bank</label>
              <input
                type="text"
                value={formData.bank_rekening}
                onChange={(e) => setFormData({ ...formData, bank_rekening: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Contoh: BCA, Mandiri, BRI"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor Rekening</label>
              <input
                type="text"
                value={formData.no_rekening}
                onChange={(e) => setFormData({ ...formData, no_rekening: e.target.value.replace(/\D/g, '') })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Untuk pencairan fee marketer"
              />
            </div>
          </div>

          {editingMarketer && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select
                value={formData.is_active ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="true">Aktif</option>
                <option value="false">Non-Aktif</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="px-4 py-2 bg-slate-50 text-slate-600 rounded-md text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-md text-xs"
            >
              {editingMarketer ? 'Update' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-2">Hapus Marketer</h3>
            <p className="text-sm text-slate-600 mb-5">
              Apakah Anda yakin ingin menghapus marketer <strong className="text-red-600">{deleteConfirm.nama}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold transition">Batal</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md font-bold transition">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}