'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CashBankAccount } from '@/types';
import { Plus, Wallet, Building2 } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function KasBankPage() {
  const { cashBankAccounts, addCashBankAccount } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_akun: '',
    jenis: 'Bank' as 'Kas' | 'Bank',
    no_rekening: '',
    saldo: 10000000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_akun) return;
    addCashBankAccount(formData);
    setIsModalOpen(false);
  };

  const columns: Column<CashBankAccount>[] = [
    {
      header: 'Nama Akun / Rekening',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            {r.jenis === 'Kas' ? <Wallet className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
          </div>
          <span className="font-bold text-slate-800">{r.nama_akun}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Jenis',
      accessorKey: (r) => <Badge variant={r.jenis === 'Kas' ? 'amber' : 'sky'}>{r.jenis}</Badge>,
      sortable: true,
    },
    { header: 'No. Rekening', accessorKey: (r) => r.no_rekening || '-' },
    {
      header: 'Saldo Berjalan (Rp)',
      accessorKey: (r) => <span className="font-bold text-green-600">Rp {r.saldo.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Kas & Rekening Bank</h1>
          <p className="text-xs text-slate-400 mt-1">Akun saldo kas tunai dan rekening bank operasional perusahaan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Akun Kas & Bank"
        data={cashBankAccounts}
        columns={columns}
        searchPlaceholder="Cari nama akun, no rekening..."
        exportFileName="Kas_Bank_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Kas/Bank</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Akun Kas / Bank Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Akun *</label>
            <input
              type="text"
              required
              value={formData.nama_akun}
              onChange={(e) => setFormData({ ...formData, nama_akun: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Bank BCA Operasional"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Akun</label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Bank">Rekening Bank</option>
                <option value="Kas">Kas Tunai / Kas Kecil</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">No. Rekening</label>
              <input
                type="text"
                value={formData.no_rekening}
                onChange={(e) => setFormData({ ...formData, no_rekening: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="8830-..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Saldo Awal (Rp)</label>
            <input
              type="text"
              required
              value={formatRupiah(formData.saldo)}
              onChange={(e) => setFormData({ ...formData, saldo: parseRupiah(e.target.value) })}
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
              Simpan Akun
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
