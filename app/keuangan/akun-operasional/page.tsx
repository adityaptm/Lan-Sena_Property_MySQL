'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ChartOfAccount } from '@/types';
import { Plus } from 'lucide-react';

export default function AkunOperasionalPage() {
  const { chartOfAccounts, addChartOfAccount } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    kode_akun: '',
    nama_akun: '',
    kategori: 'Beban' as ChartOfAccount['kategori'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kode_akun || !formData.nama_akun) return;
    addChartOfAccount(formData);
    setIsModalOpen(false);
  };

  const columns: Column<ChartOfAccount>[] = [
    {
      header: 'Kode Akun',
      accessorKey: (r) => <span className="font-mono text-xs font-bold text-blue-600">{r.kode_akun}</span>,
      sortable: true,
    },
    { header: 'Nama Akun / COA', accessorKey: 'nama_akun', sortable: true },
    {
      header: 'Kategori Akuntansi',
      accessorKey: (r) => (
        <Badge
          variant={
            r.kategori === 'Aset'
              ? 'sky'
              : r.kategori === 'Pendapatan'
              ? 'emerald'
              : r.kategori === 'Beban'
              ? 'rose'
              : 'amber'
          }
        >
          {r.kategori}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Chart of Accounts (COA)</h1>
          <p className="text-xs text-slate-400 mt-1">Master akun operasional & pembukuan akuntansi developer perumahan</p>
        </div>
      </div>

      <DataTable
        title="Master Chart of Accounts"
        data={chartOfAccounts}
        columns={columns}
        searchPlaceholder="Cari kode akun, nama akun..."
        exportFileName="Chart_Of_Accounts_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kode Akun</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Kode Akun COA">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Akun *</label>
              <input
                type="text"
                required
                value={formData.kode_akun}
                onChange={(e) => setFormData({ ...formData, kode_akun: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-mono text-slate-800 focus:outline-none"
                placeholder="Contoh: 5030"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Akuntansi</label>
              <select
                value={formData.kategori}
                onChange={(e) => setFormData({ ...formData, kategori: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Aset">Aset</option>
                <option value="Kewajiban">Kewajiban</option>
                <option value="Ekuitas">Ekuitas</option>
                <option value="Pendapatan">Pendapatan</option>
                <option value="Beban">Beban</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Akun *</label>
            <input
              type="text"
              required
              value={formData.nama_akun}
              onChange={(e) => setFormData({ ...formData, nama_akun: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Beban Pemeliharaan Lapangan"
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
              Simpan Akun
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
