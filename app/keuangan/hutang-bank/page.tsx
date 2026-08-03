'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { BankLoan } from '@/types';
import { Plus, Building } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function HutangBankPage() {
  const { bankLoans, banks, addBankLoan } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    bank_id: banks[0]?.id || '',
    nominal_pinjaman: 5000000000,
    bunga: 8.5,
    tenor: 36,
    sisa_hutang: 3200000000,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBankLoan(formData);
    setIsModalOpen(false);
  };

  const columns: Column<BankLoan>[] = [
    {
      header: 'Bank Pemberi Pinjaman',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            <Building className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800">{r.bank_nama}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Plafon Pinjaman (Rp)',
      accessorKey: (r) => <span className="font-semibold">Rp {r.nominal_pinjaman.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    { header: 'Bunga per Tahun', accessorKey: (r) => `${r.bunga}%` },
    { header: 'Tenor (Bulan)', accessorKey: (r) => `${r.tenor} Bulan` },
    {
      header: 'Sisa Hutang Pokok (Rp)',
      accessorKey: (r) => <span className="font-bold text-orange-600">Rp {r.sisa_hutang.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hutang Bank Perusahaan</h1>
          <p className="text-xs text-slate-400 mt-1">Pencatatan pinjaman fasilitas kredit konstruksi & modal kerja dari bank</p>
        </div>
      </div>

      <DataTable
        title="Daftar Pinjaman Bank"
        data={bankLoans}
        columns={columns}
        searchPlaceholder="Cari nama bank..."
        exportFileName="Hutang_Bank_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pinjaman Bank</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Catatan Pinjaman Bank">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Bank *</label>
            <select
              value={formData.bank_id}
              onChange={(e) => setFormData({ ...formData, bank_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama_bank} ({b.cabang})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Pinjaman (Rp) *</label>
              <input
                type="text"
                required
                value={formatRupiah(formData.nominal_pinjaman)}
                onChange={(e) => setFormData({ ...formData, nominal_pinjaman: parseRupiah(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bunga (% p.a)</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.bunga}
                onChange={(e) => setFormData({ ...formData, bunga: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tenor (Bulan)</label>
              <input
                type="number"
                required
                value={formData.tenor}
                onChange={(e) => setFormData({ ...formData, tenor: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sisa Hutang (Rp)</label>
              <input
                type="text"
                required
                value={formatRupiah(formData.sisa_hutang)}
                onChange={(e) => setFormData({ ...formData, sisa_hutang: parseRupiah(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
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
              Simpan Pinjaman
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
