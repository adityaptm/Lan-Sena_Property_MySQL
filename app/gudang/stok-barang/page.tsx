'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { InventoryItem } from '@/types';
import { Plus, AlertTriangle, Package } from 'lucide-react';

export default function StokBarangPage() {
  const { items, addItem, updateItem } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_barang: '',
    satuan: 'Sak',
    kategori: 'Material Bangunan',
    stok: 100,
    min_stok: 20,
    harga_satuan: 50000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_barang) return;
    addItem(formData);
    setIsModalOpen(false);
  };

  const columns: Column<InventoryItem>[] = [
    {
      header: 'Nama Barang / Material',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-indigo-500/30 flex items-center justify-center text-blue-600 font-bold">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-800">{r.nama_barang}</p>
            <p className="text-[10px] text-slate-400">Min. Stok: {r.min_stok} {r.satuan}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    { header: 'Kategori', accessorKey: 'kategori', sortable: true },
    { header: 'Satuan', accessorKey: 'satuan' },
    {
      header: 'Stok Saat Ini',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <span className={`font-bold text-sm ${r.stok <= r.min_stok ? 'text-red-600 font-mono' : 'text-green-600 font-mono'}`}>
            {r.stok} {r.satuan}
          </span>
          {r.stok <= r.min_stok && (
            <Badge variant="rose">
              <AlertTriangle className="w-3 h-3 mr-1 inline" />
              Menipis
            </Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Harga Satuan (Rp)',
      accessorKey: (r) => <span className="font-semibold">Rp {r.harga_satuan.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Stok Barang Gudang</h1>
          <p className="text-xs text-slate-400 mt-1">Master persediaan material & bahan bangunan proyek perumahan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Material & Barang"
        data={items}
        columns={columns}
        searchPlaceholder="Cari barang, kategori..."
        exportFileName="Stok_Barang_Gudang_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Material / Barang Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Barang *</label>
            <input
              type="text"
              required
              value={formData.nama_barang}
              onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Semen Padang 50kg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Material</label>
              <input
                type="text"
                required
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="Material Bangunan"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Satuan</label>
              <input
                type="text"
                required
                value={formData.satuan}
                onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="Sak / m3 / Batang"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Stok Awal</label>
              <input
                type="number"
                required
                value={formData.stok}
                onChange={(e) => setFormData({ ...formData, stok: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min. Stok Warning</label>
              <input
                type="number"
                required
                value={formData.min_stok}
                onChange={(e) => setFormData({ ...formData, min_stok: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Harga Satuan (Rp)</label>
              <input
                type="number"
                required
                value={formData.harga_satuan}
                onChange={(e) => setFormData({ ...formData, harga_satuan: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none"
              />
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
              Simpan Barang
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
