'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { CashBankAccount } from '@/types';
import { Plus, Pencil, BarChart3, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function KasBankPage() {
  const { cashBankAccounts, addCashBankAccount, updateCashBankAccount, deleteCashBankAccount } = useData();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nama_akun: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setFormData({ nama_akun: '' });
    setIsModalOpen(true);
  };

  const openEdit = (acc: CashBankAccount) => {
    setEditingId(acc.id);
    setFormData({ nama_akun: acc.nama_akun });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_akun.trim()) return;
    if (editingId) {
      await updateCashBankAccount(editingId, { nama_akun: formData.nama_akun });
    } else {
      await addCashBankAccount({ nama_akun: formData.nama_akun, jenis: 'Bank', saldo: 0 });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteCashBankAccount(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const columns: Column<CashBankAccount>[] = [
    {
      header: 'Nama Kas / Bank',
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
            onClick={() => router.push(`/keuangan/cashflow?account_id=${r.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Cashflow
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kas & Bank</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola daftar akun kas dan bank perusahaan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Akun"
        data={cashBankAccounts}
        columns={columns}
        searchPlaceholder="Cari nama kas / bank..."
        exportFileName="Kas_Bank_Lansena"
        headerAction={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kas/Bank</span>
          </button>
        }
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Kas / Bank' : 'Tambah Kas / Bank Baru'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Kas / Bank *</label>
            <input
              type="text"
              required
              value={formData.nama_akun}
              onChange={(e) => setFormData({ ...formData, nama_akun: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Bank BRI, Kas Kantor"
            />
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Konfirmasi Hapus">
        <p className="text-sm text-slate-600 mb-4">Apakah Anda yakin ingin menghapus akun kas/bank ini? Data yang sudah dihapus tidak dapat dikembalikan.</p>
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
