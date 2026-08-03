'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { GoodsOut } from '@/types';
import { Plus, ArrowUpRight } from 'lucide-react';

export default function BarangKeluarPage() {
  const { goodsOut, units, items, addGoodsOut } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tujuan_pemakaian: 'Pekerjaan Struktur & Dinding Proyek',
    unit_id: units[0]?.id || '',
    tanggal: new Date().toISOString().slice(0, 10),
    catatan: 'Pengambilan material oleh tim mandor',
    item_id: items[0]?.id || '',
    qty: 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItem = items.find((i) => i.id === formData.item_id);

    addGoodsOut({
      tujuan_pemakaian: formData.tujuan_pemakaian,
      unit_id: formData.unit_id,
      tanggal: formData.tanggal,
      catatan: formData.catatan,
      items: selectedItem ? [{ item_id: selectedItem.id, item_nama: selectedItem.nama_barang, qty: formData.qty }] : [],
    });
    setIsModalOpen(false);
  };

  const columns: Column<GoodsOut>[] = [
    {
      header: 'Tujuan Pemakaian',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-rose-500/30 flex items-center justify-center text-red-600 font-bold">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800">{r.tujuan_pemakaian}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Unit Terkait', accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.unit_no || '-'}</span> },
    { header: 'Tanggal Keluar', accessorKey: 'tanggal', sortable: true },
    {
      header: 'Material Dikeluarkan',
      accessorKey: (r) =>
        r.items && r.items.length > 0 ? (
          <span className="font-semibold text-red-600">
            {r.items[0].item_nama} (-{r.items[0].qty})
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    { header: 'Catatan', accessorKey: (r) => r.catatan || '-' },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Barang Keluar Gudang</h1>
          <p className="text-xs text-slate-400 mt-1">Pencatatan pengeluaran stok material proyek (secara otomatis mengurangi stok barang)</p>
        </div>
      </div>

      <DataTable
        title="Riwayat Pengeluaran Material"
        data={goodsOut}
        columns={columns}
        searchPlaceholder="Cari tujuan, unit..."
        exportFileName="Barang_Keluar_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Barang Keluar</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pencatatan Barang Keluar">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tujuan Pemakaian / Pekerjaan *</label>
            <input
              type="text"
              required
              value={formData.tujuan_pemakaian}
              onChange={(e) => setFormData({ ...formData, tujuan_pemakaian: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Pembangunan Pondasi Unit A-02"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Unit Rumah (Opsional)</label>
              <select
                value={formData.unit_id}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.no_unit} ({u.location_nama})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Keluar</label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Barang *</label>
              <select
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nama_barang} (Stok Saat Ini: {i.stok} {i.satuan})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Keluar (Qty) *</label>
              <input
                type="number"
                required
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
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
              Simpan & Kurangi Stok
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
