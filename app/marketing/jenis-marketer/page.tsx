'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { MarketerType } from '@/types';
import { Plus, Megaphone } from 'lucide-react';

export default function JenisMarketerPage() {
  const { marketerTypes, addMarketerType } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_jenis: '',
    skema_komisi_default: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_jenis) return;
    addMarketerType(formData);
    setFormData({ nama_jenis: '', skema_komisi_default: '' });
    setIsModalOpen(false);
  };

  const columns: Column<MarketerType>[] = [
    {
      header: 'Kategori / Jenis Marketer',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-500/30 flex items-center justify-center text-purple-600 font-bold">
            <Megaphone className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800">{r.nama_jenis}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Skema Komisi Default', accessorKey: 'skema_komisi_default' },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Jenis & Skema Marketer</h1>
          <p className="text-xs text-slate-400 mt-1">Master kategori tenaga penjual (Internal, Freelance, Agency) dan skema insentif</p>
        </div>
      </div>

      <DataTable
        title="Daftar Kategori Marketer"
        data={marketerTypes}
        columns={columns}
        searchPlaceholder="Cari jenis marketer..."
        exportFileName="Jenis_Marketer_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jenis</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Jenis Marketer">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Jenis Marketer *</label>
            <input
              type="text"
              required
              value={formData.nama_jenis}
              onChange={(e) => setFormData({ ...formData, nama_jenis: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Freelance Partner"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Skema Komisi Default *</label>
            <textarea
              rows={3}
              required
              value={formData.skema_komisi_default}
              onChange={(e) => setFormData({ ...formData, skema_komisi_default: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: 2.5% Fee per unit lunas DP / akad"
            />
          </div>

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
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
