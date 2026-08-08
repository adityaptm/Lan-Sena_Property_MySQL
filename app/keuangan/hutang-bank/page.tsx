'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { BankLoan } from '@/types';
import { Plus, Pencil, Trash2, Building } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function HutangBankPage() {
  const { bankLoans, cashBankAccounts, addBankLoan, updateBankLoan, deleteBankLoan } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    account_id: '',
    keterangan: '',
    total_hutang: 0,
  });

  // Filter only "Bank" accounts for dropdown
  const bankAccounts = cashBankAccounts.filter((a) => a.nama_akun.toLowerCase().includes('bank'));

  const openAdd = () => {
    setEditingId(null);
    setFormData({
      account_id: '',
      keterangan: '',
      total_hutang: 0,
    });
    setIsModalOpen(true);
  };

  const openEdit = (loan: BankLoan) => {
    setEditingId(loan.id);
    setFormData({
      account_id: loan.account_id || '',
      keterangan: loan.keterangan || '',
      total_hutang: Number(loan.total_hutang) || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.keterangan.trim()) return;
    if (editingId) {
      await updateBankLoan(editingId, {
        account_id: formData.account_id,
        keterangan: formData.keterangan,
        total_hutang: formData.total_hutang,
      });
    } else {
      await addBankLoan({
        account_id: formData.account_id,
        keterangan: formData.keterangan,
        total_hutang: formData.total_hutang,
        total_terbayar: 0,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteBankLoan(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const columns: Column<BankLoan>[] = [
    {
      header: 'Nama Bank',
      accessorKey: (r) => {
        const acc = cashBankAccounts.find((a) => a.id === r.account_id);
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <Building className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800">{acc?.nama_akun || r.bank_nama || '-'}</span>
          </div>
        );
      },
      sortable: true,
    },
    {
      header: 'Keterangan',
      accessorKey: (r) => r.keterangan || '-',
    },
    {
      header: 'Total',
      accessorKey: (r) => (
        <span className="font-semibold">{(Number(r.total_hutang) || 0).toLocaleString('id-ID')}</span>
      ),
      sortable: true,
    },
    {
      header: 'Total Terbayar',
      accessorKey: (r) => (
        <span className="font-semibold text-green-600">{(Number(r.total_terbayar) || 0).toLocaleString('id-ID')}</span>
      ),
      sortable: true,
    },
    {
      header: 'Total Sisa',
      accessorKey: (r) => {
        const sisa = (Number(r.total_hutang) || 0) - (Number(r.total_terbayar) || 0);
        return <span className="font-bold text-orange-600">{sisa.toLocaleString('id-ID')}</span>;
      },
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hutang Bank</h1>
          <p className="text-xs text-slate-400 mt-1">Pencatatan hutang bank perusahaan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Hutang"
        data={bankLoans}
        columns={columns}
        searchPlaceholder="Cari nama bank, keterangan..."
        exportFileName="Hutang_Bank_Lansena"
        headerAction={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Hutang</span>
          </button>
        }
      />

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Hutang Bank' : 'Tambah Hutang Bank'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Bank *</label>
            <select
              required
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            >
              <option value="">-- Pilih Bank --</option>
              {cashBankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama_akun}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan *</label>
            <input
              type="text"
              required
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: KYG dan Kpl Tahap 5 Subsidi"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Total Hutang *</label>
            <input
              type="text"
              required
              value={formatRupiah(formData.total_hutang)}
              onChange={(e) => setFormData({ ...formData, total_hutang: parseRupiah(e.target.value) })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
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

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Konfirmasi Hapus">
        <p className="text-sm text-slate-600 mb-4">Apakah Anda yakin ingin menghapus hutang ini?</p>
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
