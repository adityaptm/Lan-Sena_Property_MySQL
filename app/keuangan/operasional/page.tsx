'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { OperationalExpense } from '@/types';
import { Plus, Receipt } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function OperasionalPage() {
  const { operationalExpenses, addOperationalExpense } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    kategori: 'Listrik & PAM Kantor',
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: 1500000,
    bukti_url: 'https://example.com/receipt.jpg',
    keterangan: 'Pembayaran rekening kantor galery marketing',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addOperationalExpense(formData);
    setIsModalOpen(false);
  };

  const columns: Column<OperationalExpense>[] = [
    {
      header: 'Kategori Biaya',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-500/30 flex items-center justify-center text-sky-600 font-bold">
            <Receipt className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800">{r.kategori}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Tanggal', accessorKey: 'tanggal', sortable: true },
    {
      header: 'Nominal Biaya (Rp)',
      accessorKey: (r) => <span className="font-bold text-red-600">Rp {r.nominal.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    { header: 'Keterangan', accessorKey: (r) => r.keterangan || '-' },
    {
      header: 'Bukti Transaksi',
      accessorKey: (r) => (
        <span className="text-xs text-blue-600 underline cursor-pointer">Lihat Bukti Foto</span>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Biaya Operasional Harian</h1>
          <p className="text-xs text-slate-400 mt-1">Pencatatan beban operasional non-proyek (listrik, internet, iklan, ATK)</p>
        </div>
      </div>

      <DataTable
        title="Daftar Pengeluaran Operasional"
        data={operationalExpenses}
        columns={columns}
        searchPlaceholder="Cari kategori, keterangan..."
        exportFileName="Biaya_Operasional_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Operasional</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Biaya Operasional">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Biaya *</label>
            <input
              type="text"
              required
              value={formData.kategori}
              onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Listrik / Air / Iklan Ads / ATK"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal (Rp) *</label>
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan / Detail</label>
            <textarea
              rows={2}
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
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
              Simpan Biaya
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
