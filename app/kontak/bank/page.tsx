'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Bank } from '@/types';
import { Plus, Edit3, Trash2, Building } from 'lucide-react';

export default function BankPage() {
  const { banks, addBank, updateBank, deleteBank } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama_bank: '',
    cabang: '',
    pic_nama: '',
    pic_hp: '',
    pic_email: '',
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      nama_bank: '',
      cabang: '',
      pic_nama: '',
      pic_hp: '',
      pic_email: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (b: Bank) => {
    setEditingId(b.id);
    setFormData({
      nama_bank: b.nama_bank,
      cabang: b.cabang,
      pic_nama: b.pic_nama,
      pic_hp: b.pic_hp,
      pic_email: b.pic_email || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_bank || !formData.cabang || !formData.pic_nama) return;

    if (editingId) {
      updateBank(editingId, formData);
    } else {
      addBank(formData);
    }
    setIsModalOpen(false);
  };

  const columns: Column<Bank>[] = [
    {
      header: 'Nama Bank',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Building className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800">{r.nama_bank}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Cabang', accessorKey: 'cabang', sortable: true },
    { header: 'Nama PIC Marketing Bank', accessorKey: 'pic_nama' },
    { header: 'No. HP / WA PIC', accessorKey: 'pic_hp' },
    { header: 'Email PIC', accessorKey: (r) => r.pic_email || '-' },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Bank Partner KPR</h1>
          <p className="text-xs text-slate-400 mt-1">Daftar bank mitra penyedia fasilitas Kredit Pemilikan Rumah (KPR)</p>
        </div>
      </div>

      <DataTable
        title="Daftar Bank Partner"
        data={banks}
        columns={columns}
        searchPlaceholder="Cari bank, cabang, PIC..."
        exportFileName="Data_Bank_KPR_Lansena"
        headerAction={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bank Partner</span>
          </button>
        }
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition"
              title="Edit Bank"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteBank(row.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 transition"
              title="Hapus Bank"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Bank Partner' : 'Tambah Bank Partner Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Bank *</label>
              <input
                type="text"
                required
                value={formData.nama_bank}
                onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="Contoh: Bank BTN"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kantor Cabang *</label>
              <input
                type="text"
                required
                value={formData.cabang}
                onChange={(e) => setFormData({ ...formData, cabang: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="Contoh: KCP Serpong"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama PIC Bank *</label>
            <input
              type="text"
              required
              value={formData.pic_nama}
              onChange={(e) => setFormData({ ...formData, pic_nama: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Ahmad Fauzi"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">No. HP / WA PIC *</label>
              <input
                type="text"
                required
                value={formData.pic_hp}
                onChange={(e) => setFormData({ ...formData, pic_hp: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="0811..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email PIC</label>
              <input
                type="email"
                value={formData.pic_email}
                onChange={(e) => setFormData({ ...formData, pic_email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="pic@btn.co.id"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-md"
            >
              Simpan Bank
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
