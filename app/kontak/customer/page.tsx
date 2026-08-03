'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Customer } from '@/types';
import { Plus, UserPlus, Edit3, Trash2 } from 'lucide-react';

export default function CustomerPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    alamat: '',
    no_hp: '',
    email: '',
    status: 'Leads' as 'Leads' | 'Deal' | 'Batal',
    catatan: '',
    is_registered_before: false,
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat_ktp: '',
    alamat_domisili: '',
    pekerjaan: '',
    instansi: '',
    pendapatan_per_bulan: '',
    npwp: '',
    status_pernikahan: 'Belum Menikah',
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      nama: '',
      nik: '',
      alamat: '',
      no_hp: '',
      email: '',
      status: 'Leads',
      catatan: '',
      is_registered_before: false,
      tempat_lahir: '',
      tanggal_lahir: '',
      alamat_ktp: '',
      alamat_domisili: '',
      pekerjaan: '',
      instansi: '',
      pendapatan_per_bulan: '',
      npwp: '',
      status_pernikahan: 'Belum Menikah',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingId(c.id);
    setFormData({
      nama: c.nama,
      nik: c.nik,
      alamat: c.alamat || '',
      no_hp: c.no_hp,
      email: c.email || '',
      status: c.status,
      catatan: c.catatan || '',
      is_registered_before: !!c.is_registered_before,
      tempat_lahir: c.tempat_lahir || '',
      tanggal_lahir: c.tanggal_lahir || '',
      alamat_ktp: c.alamat_ktp || '',
      alamat_domisili: c.alamat_domisili || '',
      pekerjaan: c.pekerjaan || '',
      instansi: c.instansi || '',
      pendapatan_per_bulan: c.pendapatan_per_bulan || '',
      npwp: c.npwp || '',
      status_pernikahan: c.status_pernikahan || 'Belum Menikah',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.nik || !formData.no_hp || !formData.tanggal_lahir || !formData.alamat_ktp) return;

    const finalData = {
      ...formData,
      alamat: formData.alamat_ktp, // fallback compatibility
    };

    if (editingId) {
      updateCustomer(editingId, finalData);
    } else {
      addCustomer(finalData);
    }
    setIsModalOpen(false);
  };

  const columns: Column<Customer>[] = [
    { header: 'Nama Customer', accessorKey: 'nama', sortable: true },
    {
      header: 'NIK / KTP',
      accessorKey: (r) => <span className="font-mono text-xs text-slate-500">{r.nik}</span>,
      sortable: true,
    },
    { header: 'No. WhatsApp / HP', accessorKey: 'no_hp' },
    { header: 'Pekerjaan', accessorKey: (r) => r.pekerjaan || '-' },
    { header: 'Alamat KTP', accessorKey: (r) => r.alamat_ktp || r.alamat || '-' },
    {
      header: 'Status Pernikahan',
      accessorKey: (r) => <span className="text-xs">{r.status_pernikahan || 'Belum Menikah'}</span>,
    },
    {
      header: 'Status',
      accessorKey: (r) => (
        <Badge variant={r.status === 'Deal' ? 'emerald' : r.status === 'Leads' ? 'sky' : 'rose'}>
          {r.status}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Data Customer & Leads</h1>
          <p className="text-xs text-slate-400 mt-1">Daftar calon pembeli dan konsumen deal perumahan Lansena</p>
        </div>
      </div>

      <DataTable
        title="Daftar Customer"
        data={customers}
        columns={columns}
        searchPlaceholder="Cari nama, NIK, No HP..."
        exportFileName="Data_Customer_Lansena"
        headerAction={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Customer</span>
          </button>
        }
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition"
              title="Edit Data"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={async () => {
                if (!window.confirm(`Hapus data customer "${row.nama}"? PERHATIAN: Semua transaksi aktif atas nama customer ini akan otomatis dibatalkan dan unit akan dikembalikan ke status Tersedia.`)) return;
                try {
                  await deleteCustomer(row.id);
                } catch (err: any) {
                  alert(err.message || 'Gagal menghapus customer.');
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 transition"
              title="Hapus Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Customer' : 'Tambah Customer Baru'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar text-xs">
          {/* Question / Status */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
            <label className="block font-semibold text-slate-700 mb-2">
              Sudah pernah terdaftar sebagai Mandor/Suplier/Marketer?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                <input
                  type="radio"
                  name="is_registered_before"
                  checked={!formData.is_registered_before}
                  onChange={() => setFormData({ ...formData, is_registered_before: false })}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Belum pernah</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                <input
                  type="radio"
                  name="is_registered_before"
                  checked={formData.is_registered_before}
                  onChange={() => setFormData({ ...formData, is_registered_before: true })}
                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span>Sudah pernah</span>
              </label>
            </div>
          </div>

          {/* Nama & NIK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nama Lengkap"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">NIK (Nomor Induk Kependudukan) *</label>
              <input
                type="text"
                required
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="16 Digit NIK"
              />
            </div>
          </div>

          {/* Tempat & Tanggal Lahir */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Tempat Lahir</label>
              <input
                type="text"
                value={formData.tempat_lahir}
                onChange={(e) => setFormData({ ...formData, tempat_lahir: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Kota / Kabupaten"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Tanggal Lahir *</label>
              <input
                type="date"
                required
                value={formData.tanggal_lahir}
                onChange={(e) => setFormData({ ...formData, tanggal_lahir: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* No HP & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">No. Handphone / WhatsApp *</label>
              <input
                type="text"
                required
                value={formData.no_hp}
                onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Contoh: 0812..."
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="alamat@email.com"
              />
            </div>
          </div>

          {/* Alamat KTP & Domisili */}
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Alamat KTP *</label>
            <textarea
              rows={2}
              required
              value={formData.alamat_ktp}
              onChange={(e) => setFormData({ ...formData, alamat_ktp: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Tulis alamat lengkap sesuai KTP..."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Alamat Domisili / Kantor</label>
            <textarea
              rows={2}
              value={formData.alamat_domisili}
              onChange={(e) => setFormData({ ...formData, alamat_domisili: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Tulis alamat domisili atau alamat kantor jika berbeda..."
            />
          </div>

          {/* Pekerjaan & Institusi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Pekerjaan</label>
              <input
                type="text"
                value={formData.pekerjaan}
                onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Pekerjaan saat ini"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Institusi / Perusahaan</label>
              <input
                type="text"
                value={formData.instansi}
                onChange={(e) => setFormData({ ...formData, instansi: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nama Perusahaan / Instansi"
              />
            </div>
          </div>

          {/* Pendapatan & NPWP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Pendapatan per Bulan</label>
              <input
                type="text"
                value={formData.pendapatan_per_bulan}
                onChange={(e) => setFormData({ ...formData, pendapatan_per_bulan: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Contoh: Rp 5.000.000 - Rp 10.000.000"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">NPWP</label>
              <input
                type="text"
                value={formData.npwp}
                onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Nomor NPWP"
              />
            </div>
          </div>

          {/* Status Pernikahan & Status Prospek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Sudah Menikah?</label>
              <select
                value={formData.status_pernikahan}
                onChange={(e) => setFormData({ ...formData, status_pernikahan: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Belum Menikah">Belum Menikah</option>
                <option value="Sudah Menikah">Sudah Menikah</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Status Prospek</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Leads">Leads (Calon Pembeli)</option>
                <option value="Deal">Deal (Sudah Transaksi)</option>
                <option value="Batal">Batal / Unqualified</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Catatan Preferensi tipe rumah, rencana KPR, dll..."
            />
          </div>

          <p className="text-[10px] text-slate-400 font-medium">*) Wajib diisi.</p>

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
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

