'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { MandorAdvance } from '@/types';
import { Plus, UserCheck } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function KasbonMandorPage() {
  const { mandorAdvances, addMandorAdvance } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_mandor: '',
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: 5000000,
    keterangan: '',
    status: 'Belum Lunas' as MandorAdvance['status'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_mandor || !formData.keterangan) return;
    addMandorAdvance(formData);
    setIsModalOpen(false);
  };

  const columns: Column<MandorAdvance>[] = [
    {
      header: 'Nama Mandor Proyek',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-50 border border-amber-500/30 flex items-center justify-center text-orange-600 font-bold text-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800">{r.nama_mandor}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Tanggal Pinjaman', accessorKey: 'tanggal', sortable: true },
    {
      header: 'Nominal Kasbon (Rp)',
      accessorKey: (r) => <span className="font-bold text-orange-600">Rp {r.nominal.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    { header: 'Keterangan Pekerjaan', accessorKey: 'keterangan' },
    {
      header: 'Status Pelunasan',
      accessorKey: (r) => <Badge variant={r.status === 'Lunas' ? 'emerald' : 'amber'}>{r.status}</Badge>,
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kasbon / Pinjaman Mandor</h1>
          <p className="text-xs text-slate-400 mt-1">Pencatatan pinjaman uang muka / upah borongan mandor proyek perumahan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Kasbon Mandor"
        data={mandorAdvances}
        columns={columns}
        searchPlaceholder="Cari mandor, keterangan..."
        exportFileName="Kasbon_Mandor_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Kasbon Mandor</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Catat Kasbon Mandor Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Mandor *</label>
            <input
              type="text"
              required
              value={formData.nama_mandor}
              onChange={(e) => setFormData({ ...formData, nama_mandor: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Mandor Slamet"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Kasbon (Rp) *</label>
              <input
                type="text"
                required
                value={formatRupiah(formData.nominal)}
                onChange={(e) => setFormData({ ...formData, nominal: parseRupiah(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan Pekerjaan *</label>
            <textarea
              rows={2}
              required
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Upah tukang minggu ini untuk Unit A-02..."
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
              Simpan Kasbon
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
