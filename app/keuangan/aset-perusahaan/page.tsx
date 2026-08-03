'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { CompanyAsset } from '@/types';
import { Plus, Box } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function AsetPerusahaanPage() {
  const { companyAssets, addCompanyAsset } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_aset: '',
    nilai_perolehan: 150000000,
    penyusutan: 15000000,
    tanggal_perolehan: new Date().toISOString().slice(0, 10),
    kondisi: 'Baik' as 'Baik' | 'Perlu Perbaikan' | 'Rusak',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_aset) return;
    addCompanyAsset(formData);
    setIsModalOpen(false);
  };

  const columns: Column<CompanyAsset>[] = [
    {
      header: 'Nama Aset Tetap',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Box className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800">{r.nama_aset}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Tanggal Perolehan', accessorKey: 'tanggal_perolehan', sortable: true },
    {
      header: 'Nilai Perolehan (Rp)',
      accessorKey: (r) => <span className="font-bold">Rp {r.nilai_perolehan.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    {
      header: 'Akumulasi Penyusutan (Rp)',
      accessorKey: (r) => <span className="text-red-600">Rp {r.penyusutan.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    {
      header: 'Nilai Buku Saat Ini (Rp)',
      accessorKey: (r) => (
        <span className="font-bold text-green-600">
          Rp {(r.nilai_perolehan - r.penyusutan).toLocaleString('id-ID')}
        </span>
      ),
      sortable: true,
    },
    { header: 'Kondisi Aset', accessorKey: 'kondisi' },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Aset Tetap Perusahaan</h1>
          <p className="text-xs text-slate-400 mt-1">Daftar aktiva tetap, nilai perolehan, dan akumulasi penyusutan aset</p>
        </div>
      </div>

      <DataTable
        title="Daftar Aset Perusahaan"
        data={companyAssets}
        columns={columns}
        searchPlaceholder="Cari aset..."
        exportFileName="Aset_Perusahaan_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aset Tetap</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Aset Tetap Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Aset Tetap *</label>
            <input
              type="text"
              required
              value={formData.nama_aset}
              onChange={(e) => setFormData({ ...formData, nama_aset: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Mobil Operational Proyek Toyota Hilux"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nilai Perolehan (Rp) *</label>
              <input
                type="text"
                required
                value={formatRupiah(formData.nilai_perolehan)}
                onChange={(e) => setFormData({ ...formData, nilai_perolehan: parseRupiah(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Penyusutan (Rp)</label>
              <input
                type="text"
                required
                value={formatRupiah(formData.penyusutan)}
                onChange={(e) => setFormData({ ...formData, penyusutan: parseRupiah(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Perolehan</label>
              <input
                type="date"
                required
                value={formData.tanggal_perolehan}
                onChange={(e) => setFormData({ ...formData, tanggal_perolehan: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kondisi Aset</label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Baik">Baik</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Rusak">Rusak</option>
              </select>
            </div>
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
              Simpan Aset
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
