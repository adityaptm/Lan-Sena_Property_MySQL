'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Search, Plus, Edit, Package } from 'lucide-react';
import { InventoryItem } from '@/types';
import * as XLSX from 'xlsx';

export default function StokBarangPage() {
  const { items, addItem, updateItem } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [formData, setFormData] = useState({
    nama_barang: '',
    satuan: 'Rit',
    harga_satuan: 1110000,
    stok: 0,
    kategori: 'Material',
    min_stok: 5,
  });

  const filteredItems = items.filter(
    (item) =>
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.satuan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setSelectedItem(null);
    setFormData({
      nama_barang: '',
      satuan: 'Rit',
      harga_satuan: 1110000,
      stok: 0,
      kategori: 'Material',
      min_stok: 5,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      nama_barang: item.nama_barang,
      satuan: item.satuan,
      harga_satuan: item.harga_satuan,
      stok: item.stok,
      kategori: item.kategori || 'Material',
      min_stok: item.min_stok || 5,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_barang) return;

    if (selectedItem) {
      updateItem(selectedItem.id, {
        nama_barang: formData.nama_barang,
        satuan: formData.satuan,
        harga_satuan: formData.harga_satuan,
        stok: formData.stok,
        kategori: formData.kategori,
        min_stok: formData.min_stok,
      });
    } else {
      addItem({
        nama_barang: formData.nama_barang,
        satuan: formData.satuan,
        harga_satuan: formData.harga_satuan,
        stok: formData.stok,
        kategori: formData.kategori,
        min_stok: formData.min_stok,
      });
    }
    setIsModalOpen(false);
  };

  const formatRupiahDec = (val: number) => {
    return val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Stok Barang</h1>
            <p className="text-xs text-slate-400 mt-1">Master stok persediaan barang &amp; material gudang proyek</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-md self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Barang</span>
          </button>
        </div>

        {/* Main Table Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Show</span>
              <select className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none">
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4">Stok</th>
                  <th className="py-3 px-4 text-right">Harga</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">Tidak ada stok barang ditemukan.</td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{item.nama_barang}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{item.stok} {item.satuan}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{formatRupiahDec(item.harga_satuan)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition shadow-sm"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update / Add Item Form Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-800">Form {selectedItem ? 'Update' : 'Tambah'} Barang</h2>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  [X]
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_barang}
                    onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Abu batu"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan *</label>
                  <input
                    type="text"
                    required
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Rit / Sak / Pcs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga *</label>
                  <input
                    type="number"
                    required
                    value={formData.harga_satuan}
                    onChange={(e) => setFormData({ ...formData, harga_satuan: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    placeholder="1110000"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stok Saat Ini</label>
                  <input
                    type="number"
                    required
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-lg transition shadow-md"
                  >
                    Save Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
