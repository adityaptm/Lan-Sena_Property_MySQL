'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { GoodsIn } from '@/types';
import { Plus, ArrowDownLeft } from 'lucide-react';

export default function BarangMasukPage() {
  const { goodsIn, purchases, items, addGoodsIn } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    purchase_id: purchases[0]?.id || '',
    tanggal: new Date().toISOString().slice(0, 10),
    catatan: 'Penerimaan barang dari PO supplier',
    item_id: items[0]?.id || '',
    qty: 50,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const po = purchases.find((p) => p.id === formData.purchase_id);
    const selectedItem = items.find((i) => i.id === formData.item_id);

    addGoodsIn({
      purchase_id: formData.purchase_id,
      no_po: po?.no_po || 'PO-DIRECT',
      tanggal: formData.tanggal,
      catatan: formData.catatan,
      items: selectedItem ? [{ item_id: selectedItem.id, item_nama: selectedItem.nama_barang, qty: formData.qty }] : [],
    });
    setIsModalOpen(false);
  };

  const columns: Column<GoodsIn>[] = [
    {
      header: 'No. PO Referensi',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center text-green-600 font-bold">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 font-mono text-xs">{r.no_po || 'Penerimaan Langsung'}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Tanggal Masuk', accessorKey: 'tanggal', sortable: true },
    {
      header: 'Rincian Barang',
      accessorKey: (r) =>
        r.items && r.items.length > 0 ? (
          <span className="font-semibold text-green-600">
            {r.items[0].item_nama} (+{r.items[0].qty})
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        ),
    },
    { header: 'Catatan Penerimaan', accessorKey: (r) => r.catatan || '-' },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Barang Masuk Gudang</h1>
          <p className="text-xs text-slate-400 mt-1">Pencatatan penerimaan material (secara otomatis menambah stok barang)</p>
        </div>
      </div>

      <DataTable
        title="Riwayat Barang Masuk"
        data={goodsIn}
        columns={columns}
        searchPlaceholder="Cari PO, catatan..."
        exportFileName="Barang_Masuk_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Barang Masuk</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pencatatan Barang Masuk">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Referensi Purchase Order (PO)</label>
            <select
              value={formData.purchase_id}
              onChange={(e) => setFormData({ ...formData, purchase_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            >
              {purchases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.no_po} - {p.supplier} (Rp {p.total_harga.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Material / Barang *</label>
              <select
                value={formData.item_id}
                onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nama_barang} (Stok: {i.stok} {i.satuan})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jumlah Masuk (Qty) *</label>
              <input
                type="number"
                required
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Masuk</label>
            <input
              type="date"
              required
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Penerimaan</label>
            <textarea
              rows={2}
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
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
              Simpan & Tambah Stok
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
