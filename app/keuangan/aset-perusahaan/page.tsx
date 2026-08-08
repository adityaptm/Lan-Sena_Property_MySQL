'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Modal } from '@/components/ui/Modal';
import { CompanyAsset } from '@/types';
import { Plus, Search, Pencil, Trash2, Building2 } from 'lucide-react';

function formatDateId(dateStr?: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatNumberId(num: number) {
  return Math.round(num || 0).toLocaleString('id-ID');
}

// Initial Sample Data requested by User (used if DB is empty)
const INITIAL_SAMPLE_ASSETS: CompanyAsset[] = [
  {
    id: 'asset-ref003',
    nomor_aset: 'REF003',
    nama_aset: 'Kantor',
    keterangan: '',
    tanggal_perolehan: '2016-01-01',
    nilai_perolehan: 370000000,
    penyusutan: 111000000, // Nilai buku = 259.000.000
    kondisi: 'Baik',
  },
  {
    id: 'asset-ref004',
    nomor_aset: 'REF004',
    nama_aset: 'Kendaraan (Dum Truk)',
    keterangan: '',
    tanggal_perolehan: '2018-01-01',
    nilai_perolehan: 800000000,
    penyusutan: 400000000, // Nilai buku = 400.000.000
    kondisi: 'Baik',
  },
  {
    id: 'asset-ref002',
    nomor_aset: 'REF002',
    nama_aset: 'Peralatan Kerja (Mesin Molen)',
    keterangan: '',
    tanggal_perolehan: '2016-01-01',
    nilai_perolehan: 50000000,
    penyusutan: 37500000, // Nilai buku = 12.500.000
    kondisi: 'Baik',
  },
  {
    id: 'asset-ref001',
    nomor_aset: 'REF001',
    nama_aset: 'Perlengkapan Kantor',
    keterangan: '',
    tanggal_perolehan: '2016-01-01',
    nilai_perolehan: 30000000,
    penyusutan: 30000000, // Nilai buku = 0
    kondisi: 'Baik',
  },
  {
    id: 'asset-ref005',
    nomor_aset: 'REF005',
    nama_aset: 'Tanah/Sawah',
    keterangan: '',
    tanggal_perolehan: '2021-01-01',
    nilai_perolehan: 2100000000,
    penyusutan: 105000000, // Nilai buku = 1.995.000.000
    kondisi: 'Baik',
  },
];

export default function AsetPerusahaanPage() {
  const { companyAssets, addCompanyAsset, updateCompanyAsset, deleteCompanyAsset } = useData();

  // Search & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nomor_aset: '',
    nama_aset: '',
    keterangan: '',
    tanggal_perolehan: new Date().toISOString().slice(0, 10),
    nilai_perolehan: 0, // Harga Beli
    nilai_buku: 0, // Nilai Buku Saat Ini
  });

  // Merge DB companyAssets with INITIAL_SAMPLE_ASSETS if DB is empty
  const displayAssets = useMemo(() => {
    if (!companyAssets || companyAssets.length === 0) {
      return INITIAL_SAMPLE_ASSETS;
    }
    return companyAssets;
  }, [companyAssets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    if (!searchTerm) return displayAssets;
    const q = searchTerm.toLowerCase();
    return displayAssets.filter(
      (a) =>
        (a.nomor_aset || '').toLowerCase().includes(q) ||
        (a.nama_aset || '').toLowerCase().includes(q) ||
        (a.keterangan || '').toLowerCase().includes(q) ||
        formatDateId(a.tanggal_perolehan).includes(q)
    );
  }, [displayAssets, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / pageSize) || 1;
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAssets.slice(start, start + pageSize);
  }, [filteredAssets, currentPage, pageSize]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingId(null);
    const nextRef = `REF00${displayAssets.length + 1}`;
    setFormData({
      nomor_aset: nextRef,
      nama_aset: '',
      keterangan: '',
      tanggal_perolehan: new Date().toISOString().slice(0, 10),
      nilai_perolehan: 0,
      nilai_buku: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asset: CompanyAsset) => {
    setEditingId(asset.id);
    const nilaiBuku = asset.nilai_perolehan - (asset.penyusutan || 0);
    setFormData({
      nomor_aset: asset.nomor_aset || '',
      nama_aset: asset.nama_aset || '',
      keterangan: asset.keterangan || '',
      tanggal_perolehan: asset.tanggal_perolehan ? asset.tanggal_perolehan.slice(0, 10) : new Date().toISOString().slice(0, 10),
      nilai_perolehan: asset.nilai_perolehan || 0,
      nilai_buku: nilaiBuku,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_aset) return;

    // Penyusutan = Harga Beli - Nilai Buku
    const penyusutanCalculated = Math.max(0, formData.nilai_perolehan - formData.nilai_buku);

    const payload = {
      nomor_aset: formData.nomor_aset,
      nama_aset: formData.nama_aset,
      keterangan: formData.keterangan,
      tanggal_perolehan: formData.tanggal_perolehan,
      nilai_perolehan: formData.nilai_perolehan,
      penyusutan: penyusutanCalculated,
      kondisi: 'Baik' as const,
    };

    if (editingId && !editingId.startsWith('asset-')) {
      await updateCompanyAsset(editingId, payload);
    } else {
      await addCompanyAsset(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      if (!deleteConfirmId.startsWith('asset-')) {
        await deleteCompanyAsset(deleteConfirmId);
      }
      setDeleteConfirmId(null);
    }
  };

  return (
    <AppLayout>
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Aset Perusahaan</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data aktiva tetap, nilai beli, dan nilai buku aset perusahaan
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Aset</h3>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aset</span>
          </button>
        </div>

        {/* Search & Show entries */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded px-2 py-0.5 text-xs focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>

          <div className="relative max-w-xs w-full">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-semibold">
              Search:
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-16 pr-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Nomor Aset</th>
                <th className="py-2.5 px-4">Nama Aset</th>
                <th className="py-2.5 px-4">Keterangan</th>
                <th className="py-2.5 px-4">Tanggal Beli</th>
                <th className="py-2.5 px-4 text-right">Harga Beli</th>
                <th className="py-2.5 px-4 text-right">Nilai Buku</th>
                <th className="py-2.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada data aset
                  </td>
                </tr>
              ) : (
                paginatedAssets.map((r) => {
                  const nilaiBuku = r.nilai_perolehan - (r.penyusutan || 0);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{r.nomor_aset || '-'}</td>
                      <td className="py-2.5 px-4 font-bold text-blue-700">{r.nama_aset}</td>
                      <td className="py-2.5 px-4 text-slate-500">{r.keterangan || ''}</td>
                      <td className="py-2.5 px-4 font-mono">{formatDateId(r.tanggal_perolehan)}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                        {formatNumberId(r.nilai_perolehan)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">
                        {formatNumberId(nilaiBuku)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Showing counts & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-1">
          <div>
            Showing {filteredAssets.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filteredAssets.length)} of {filteredAssets.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 font-medium"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(0, 5)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    currentPage === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Aset Perusahaan' : 'Tambah Aset Perusahaan'}>
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Aset *</label>
              <input
                type="text"
                required
                value={formData.nomor_aset}
                onChange={(e) => setFormData({ ...formData, nomor_aset: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                placeholder="REF001"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Beli *</label>
              <input
                type="date"
                required
                value={formData.tanggal_perolehan}
                onChange={(e) => setFormData({ ...formData, tanggal_perolehan: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Aset *</label>
            <input
              type="text"
              required
              value={formData.nama_aset}
              onChange={(e) => setFormData({ ...formData, nama_aset: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Contoh: Kendaraan (Dum Truk)"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan</label>
            <input
              type="text"
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Catatan tambahan..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Harga Beli (Rp) *</label>
              <input
                type="number"
                min={0}
                required
                value={formData.nilai_perolehan}
                onChange={(e) => setFormData({ ...formData, nilai_perolehan: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nilai Buku (Rp) *</label>
              <input
                type="number"
                min={0}
                required
                value={formData.nilai_buku}
                onChange={(e) => setFormData({ ...formData, nilai_buku: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold shadow-sm"
            >
              Simpan Aset
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} title="Konfirmasi Hapus Aset">
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">Apakah Anda yakin ingin menghapus data aset perusahaan ini?</p>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold"
            >
              Hapus Aset
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
