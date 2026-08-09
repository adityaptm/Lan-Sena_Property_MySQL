'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import { PermissionGuard, RoleInfo } from '@/components/auth/PermissionGuard';
import { Search, Plus, Edit, Package, Trash2, FileText, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryItem {
  id: string;
  nama_barang: string;
  satuan: string;
  kategori: string;
  stok: number;
  min_stok: number;
  harga_satuan: number;
}

async function dbRequest(body: any): Promise<any> {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Database request failed');
  }
  const result = await res.json();
  return result.data;
}

export default function StokBarangPage() {
  const { canAccess } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [formData, setFormData] = useState({
    nama_barang: '',
    satuan: 'Pcs',
    harga_satuan: 0,
    stok: 0,
    kategori: 'Material',
    min_stok: 5,
  });

  // Load data on mount
  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoading(true);
      const data = await dbRequest({ action: 'select', table: 'items' });
      setItems(data || []);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter(
    (item) =>
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.satuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setSelectedItem(null);
    setFormData({ nama_barang: '', satuan: 'Pcs', harga_satuan: 0, stok: 0, kategori: 'Material', min_stok: 5 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      nama_barang: item.nama_barang,
      satuan: item.satuan,
      harga_satuan: item.harga_satuan,
      stok: item.stok,
      kategori: item.kategori,
      min_stok: item.min_stok,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_barang.trim()) {
      alert('Nama barang harus diisi');
      return;
    }

    try {
      setLoading(true);
      if (selectedItem) {
        await dbRequest({
          action: 'update',
          table: 'items',
          filters: [{ column: 'id', value: selectedItem.id }],
          data: formData,
        });
      } else {
        await dbRequest({ action: 'insert', table: 'items', data: formData });
      }
      await loadItems();
      setIsModalOpen(false);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setItemToDelete(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      try {
        setLoading(true);
        await dbRequest({
          action: 'delete',
          table: 'items',
          filters: [{ column: 'id', value: itemToDelete.id }],
        });
        await loadItems();
        setIsDeleteConfirmOpen(false);
        setItemToDelete(null);
      } catch (error: any) {
        alert('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportExcel = () => {
    if (filteredItems.length === 0) return;
    
    const data = filteredItems.map((item) => ({
      'Nama Barang': item.nama_barang,
      'Kategori': item.kategori,
      'Stok': item.stok,
      'Satuan': item.satuan,
      'Harga Satuan': item.harga_satuan,
      'Min Stok': item.min_stok,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stok_Barang');
    XLSX.writeFile(workbook, 'Stok_Barang_Lansena.xlsx');
  };

  const handleClearAllData = async () => {
    if (confirm('Hapus semua data stok barang?')) {
      try {
        setLoading(true);
        for (const item of items) {
          await dbRequest({
            action: 'delete',
            table: 'items',
            filters: [{ column: 'id', value: item.id }],
          });
        }
        await loadItems();
      } catch (error: any) {
        alert('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const minStok = item.min_stok || 5;
    if (item.stok === 0) {
      return { status: 'empty', color: 'text-red-600 bg-red-50', label: 'Habis' };
    } else if (item.stok <= minStok) {
      return { status: 'low', color: 'text-amber-600 bg-amber-50', label: 'Rendah' };
    } else {
      return { status: 'normal', color: 'text-green-600 bg-green-50', label: 'Normal' };
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daftar Stok Barang</h1>
            <p className="text-xs text-slate-400 mt-1">Master stok persediaan barang & material gudang proyek</p>
          </div>
          
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <PermissionGuard resource="gudang_stok" action="read">
                <button
                  onClick={handleExportExcel}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow-md disabled:opacity-50"
                >
                  <FileText className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </PermissionGuard>
            )}

            <PermissionGuard resource="gudang_stok" action="delete">
              {items.length > 0 && (
                <button
                  onClick={handleClearAllData}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition shadow-md disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Semua</span>
                </button>
              )}
            </PermissionGuard>

            <PermissionGuard resource="gudang_stok" action="create">
              <button
                onClick={handleOpenAddModal}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-md disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Barang</span>
              </button>
            </PermissionGuard>
          </div>
        </div>

        <PermissionGuard resource="gudang_stok" action="read" showError={true}>
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
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Stok</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Harga</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <Package className="w-12 h-12 text-slate-300 animate-pulse mx-auto" />
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-12 h-12 text-slate-300" />
                          <p className="font-semibold">Tidak ada data</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800">{item.nama_barang}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-semibold">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{item.stok} {item.satuan}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${stockStatus.color}`}>
                              {stockStatus.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                            Rp{item.harga_satuan.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <PermissionGuard resource="gudang_stok" action="update">
                                <button
                                  onClick={() => handleOpenEditModal(item)}
                                  disabled={loading}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                              </PermissionGuard>
                              <PermissionGuard resource="gudang_stok" action="delete">
                                <button
                                  onClick={() => handleDeleteItem(item)}
                                  disabled={loading}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-semibold inline-flex items-center gap-1 transition border border-rose-200 disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </PermissionGuard>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </PermissionGuard>

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
                  <label className="block font-semibold text-slate-700 mb-1">Nama Barang *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_barang}
                    onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Contoh: Semen Portland"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="Material">Material</option>
                      <option value="Tools">Tools</option>
                      <option value="Consumable">Consumable</option>
                      <option value="Equipment">Equipment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Satuan *</label>
                    <input
                      type="text"
                      required
                      value={formData.satuan}
                      onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Pcs / Kg / M3"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Harga Satuan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.harga_satuan}
                    onChange={(e) => setFormData({ ...formData, harga_satuan: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    placeholder="50000"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Stok Saat Ini</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stok}
                      onChange={(e) => setFormData({ ...formData, stok: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Min. Stok</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.min_stok}
                      onChange={(e) => setFormData({ ...formData, min_stok: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                      placeholder="5"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-lg transition shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : (selectedItem ? 'Update' : 'Simpan')} Data
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteConfirmOpen && itemToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Konfirmasi Hapus</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Anda akan menghapus barang <strong>"{itemToDelete.nama_barang}"</strong>
                  </p>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">⚠️ Tindakan ini tidak dapat dibatalkan.</p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
