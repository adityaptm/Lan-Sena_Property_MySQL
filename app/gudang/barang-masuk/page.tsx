'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/auth-context';
import { PermissionGuard, RoleInfo } from '@/components/auth/PermissionGuard';
import { Search, Plus, Edit, Trash2, FileText, AlertTriangle, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryItem {
  id: string;
  nama_barang: string;
  satuan: string;
  stok: number;
}

interface GoodsInItem {
  item_id: string;
  nama_barang: string;
  qty: number;
  satuan: string;
}

interface GoodsInRecord {
  id: string;
  tanggal: string;
  catatan: string;
  items?: GoodsInItem[];
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

export default function BarangMasukPage() {
  const { canAccess } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<GoodsInRecord | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<GoodsInRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [goodsInRecords, setGoodsInRecords] = useState<GoodsInRecord[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    catatan: '',
    item_id: '',
    qty: 1,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [goodsIn, goodsInItems, items] = await Promise.all([
        dbRequest({ action: 'select', table: 'goods_in' }),
        dbRequest({ action: 'select', table: 'goods_in_items' }),
        dbRequest({ action: 'select', table: 'items' }),
      ]);

      setInventoryItems(items || []);

      const enrichedGoodsIn = (goodsIn || []).map((gi: any) => {
        const relatedItems = (goodsInItems || [])
          .filter((gii: any) => gii.goods_in_id === gi.id)
          .map((gii: any) => {
            const item = items.find((i: any) => i.id === gii.item_id);
            return {
              item_id: gii.item_id,
              nama_barang: item?.nama_barang || 'Unknown',
              qty: gii.qty,
              satuan: item?.satuan || '',
            };
          });
        return { ...gi, items: relatedItems };
      });

      setGoodsInRecords(enrichedGoodsIn);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredRecords = goodsInRecords.filter((record) =>
    (record.catatan && record.catatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (record.items && record.items.some((item) => item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const handleOpenAddModal = () => {
    setSelectedRecord(null);
    setFormData({
      tanggal: new Date().toISOString().slice(0, 10),
      catatan: '',
      item_id: inventoryItems[0]?.id || '',
      qty: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: GoodsInRecord) => {
    setSelectedRecord(record);
    const firstItem = record.items && record.items.length > 0 ? record.items[0] : null;
    setFormData({
      tanggal: record.tanggal,
      catatan: record.catatan || '',
      item_id: firstItem?.item_id || inventoryItems[0]?.id || '',
      qty: firstItem?.qty || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.item_id) {
      alert('Barang harus dipilih');
      return;
    }

    try {
      setLoading(true);
      const selectedItem = inventoryItems.find((i) => i.id === formData.item_id);
      if (!selectedItem) throw new Error('Item not found');

      if (selectedRecord) {
        // Update: revert old stock, apply new stock
        const oldQty = selectedRecord.items?.[0]?.qty || 0;
        const oldItemId = selectedRecord.items?.[0]?.item_id;

        // Revert old stock
        if (oldItemId) {
          const oldItem = inventoryItems.find((i) => i.id === oldItemId);
          if (oldItem) {
            await dbRequest({
              action: 'update',
              table: 'items',
              filters: [{ column: 'id', value: oldItemId }],
              data: { stok: oldItem.stok - oldQty },
            });
          }
        }

        // Update goods_in
        await dbRequest({
          action: 'update',
          table: 'goods_in',
          filters: [{ column: 'id', value: selectedRecord.id }],
          data: { tanggal: formData.tanggal, catatan: formData.catatan },
        });

        // Delete old goods_in_items
        const oldItems = await dbRequest({
          action: 'select',
          table: 'goods_in_items',
          filters: [{ column: 'goods_in_id', value: selectedRecord.id }],
        });
        for (const item of oldItems || []) {
          await dbRequest({
            action: 'delete',
            table: 'goods_in_items',
            filters: [{ column: 'id', value: item.id }],
          });
        }

        // Insert new goods_in_items with new stock
        await dbRequest({
          action: 'insert',
          table: 'goods_in_items',
          data: { goods_in_id: selectedRecord.id, item_id: formData.item_id, qty: formData.qty },
        });

        await dbRequest({
          action: 'update',
          table: 'items',
          filters: [{ column: 'id', value: formData.item_id }],
          data: { stok: selectedItem.stok + formData.qty },
        });
      } else {
        // Insert: create goods_in + goods_in_items + update stock
        const newGoodsIn = await dbRequest({
          action: 'insert',
          table: 'goods_in',
          data: { tanggal: formData.tanggal, catatan: formData.catatan, purchase_id: null },
        });

        await dbRequest({
          action: 'insert',
          table: 'goods_in_items',
          data: { goods_in_id: newGoodsIn.id, item_id: formData.item_id, qty: formData.qty },
        });

        await dbRequest({
          action: 'update',
          table: 'items',
          filters: [{ column: 'id', value: formData.item_id }],
          data: { stok: selectedItem.stok + formData.qty },
        });
      }

      await loadData();
      setIsModalOpen(false);
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = (record: GoodsInRecord) => {
    setRecordToDelete(record);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (recordToDelete) {
      try {
        setLoading(true);

        // Revert stock changes
        for (const item of recordToDelete.items || []) {
          const inventoryItem = inventoryItems.find((i) => i.id === item.item_id);
          if (inventoryItem) {
            await dbRequest({
              action: 'update',
              table: 'items',
              filters: [{ column: 'id', value: item.item_id }],
              data: { stok: inventoryItem.stok - item.qty },
            });
          }
        }

        // Delete goods_in_items
        const items = await dbRequest({
          action: 'select',
          table: 'goods_in_items',
          filters: [{ column: 'goods_in_id', value: recordToDelete.id }],
        });
        for (const item of items || []) {
          await dbRequest({
            action: 'delete',
            table: 'goods_in_items',
            filters: [{ column: 'id', value: item.id }],
          });
        }

        // Delete goods_in
        await dbRequest({
          action: 'delete',
          table: 'goods_in',
          filters: [{ column: 'id', value: recordToDelete.id }],
        });

        await loadData();
        setIsDeleteConfirmOpen(false);
        setRecordToDelete(null);
      } catch (error: any) {
        alert('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) return;

    const data = filteredRecords.map((record) => ({
      'Tanggal': record.tanggal,
      'Nama Barang': record.items?.[0]?.nama_barang || '-',
      'Qty': record.items?.[0]?.qty || '-',
      'Satuan': record.items?.[0]?.satuan || '-',
      'Catatan': record.catatan || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Barang_Masuk');
    XLSX.writeFile(workbook, 'Barang_Masuk_Lansena.xlsx');
  };

  const handleClearAllData = async () => {
    if (confirm('Hapus semua data barang masuk?')) {
      try {
        setLoading(true);
        for (const record of goodsInRecords) {
          // Revert stock
          for (const item of record.items || []) {
            const inventoryItem = inventoryItems.find((i) => i.id === item.item_id);
            if (inventoryItem) {
              await dbRequest({
                action: 'update',
                table: 'items',
                filters: [{ column: 'id', value: item.item_id }],
                data: { stok: inventoryItem.stok - item.qty },
              });
            }
          }

          // Delete goods_in_items
          const items = await dbRequest({
            action: 'select',
            table: 'goods_in_items',
            filters: [{ column: 'goods_in_id', value: record.id }],
          });
          for (const item of items || []) {
            await dbRequest({
              action: 'delete',
              table: 'goods_in_items',
              filters: [{ column: 'id', value: item.id }],
            });
          }

          // Delete goods_in
          await dbRequest({
            action: 'delete',
            table: 'goods_in',
            filters: [{ column: 'id', value: record.id }],
          });
        }
        await loadData();
      } catch (error: any) {
        alert('Error: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Barang Masuk Gudang</h1>
            <p className="text-xs text-slate-400 mt-1">Pencatatan penerimaan material (otomatis menambah stok barang)</p>
          </div>

          <div className="flex items-center gap-2">
            {goodsInRecords.length > 0 && (
              <PermissionGuard resource="gudang_masuk" action="read">
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

            <PermissionGuard resource="gudang_masuk" action="delete">
              {goodsInRecords.length > 0 && (
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

            <PermissionGuard resource="gudang_masuk" action="create">
              <button
                onClick={handleOpenAddModal}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-md disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Barang Masuk</span>
              </button>
            </PermissionGuard>
          </div>
        </div>

        <PermissionGuard resource="gudang_masuk" action="read" showError={true}>
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
                  placeholder="Cari barang, catatan..."
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
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Catatan</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <Package className="w-12 h-12 text-slate-300 animate-pulse mx-auto" />
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="w-12 h-12 text-slate-300" />
                          <p className="font-semibold">Tidak ada data</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-700">{record.tanggal}</td>
                        <td className="py-3 px-4 font-bold text-green-700">
                          {record.items && record.items.length > 0 ? record.items[0].nama_barang : '-'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {record.items && record.items.length > 0 ? `+${record.items[0].qty} ${record.items[0].satuan}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{record.catatan || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <PermissionGuard resource="gudang_masuk" action="update">
                              <button
                                onClick={() => handleOpenEditModal(record)}
                                disabled={loading}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            </PermissionGuard>
                            <PermissionGuard resource="gudang_masuk" action="delete">
                              <button
                                onClick={() => handleDeleteRecord(record)}
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
                    ))
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
                <h2 className="text-lg font-bold text-slate-800">
                  {selectedRecord ? 'Update' : 'Catat'} Barang Masuk
                </h2>
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
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Masuk *</label>
                  <input
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Barang *</label>
                  <select
                    required
                    value={formData.item_id}
                    onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">-- Pilih Barang --</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama_barang} (Stok: {item.stok} {item.satuan})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Qty Masuk *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.qty}
                    onChange={(e) => setFormData({ ...formData, qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                  <textarea
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Penerimaan barang sesuai PO"
                  />
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
                    {loading ? 'Menyimpan...' : (selectedRecord ? 'Update' : 'Simpan')} & Tambah Stok
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteConfirmOpen && recordToDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Konfirmasi Hapus</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Anda akan menghapus record barang masuk <strong>"{recordToDelete.items?.[0]?.nama_barang}"</strong>
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700">⚠️ Stok akan dikembalikan otomatis.</p>
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
