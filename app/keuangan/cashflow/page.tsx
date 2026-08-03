'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { CashflowEntry } from '@/types';
import { Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function CashflowPage() {
  const { cashflowEntries, cashBankAccounts, addCashflowEntry } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    account_id: cashBankAccounts[0]?.id || '',
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: 'Masuk' as 'Masuk' | 'Keluar',
    nominal: 10000000,
    keterangan: '',
  });

  const totalIn = cashflowEntries.filter((c) => c.jenis === 'Masuk').reduce((acc, curr) => acc + curr.nominal, 0);
  const totalOut = cashflowEntries.filter((c) => c.jenis === 'Keluar').reduce((acc, curr) => acc + curr.nominal, 0);
  const netCashflow = totalIn - totalOut;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.keterangan) return;
    addCashflowEntry(formData);
    setIsModalOpen(false);
  };

  const columns: Column<CashflowEntry>[] = [
    { header: 'Tanggal', accessorKey: 'tanggal', sortable: true },
    { header: 'Akun Kas/Bank', accessorKey: (r) => r.account_nama || '-', sortable: true },
    {
      header: 'Jenis Mutasi',
      accessorKey: (r) => (
        <Badge variant={r.jenis === 'Masuk' ? 'emerald' : 'rose'}>
          {r.jenis === 'Masuk' ? <ArrowDownLeft className="w-3 h-3 mr-1 inline" /> : <ArrowUpRight className="w-3 h-3 mr-1 inline" />}
          {r.jenis}
        </Badge>
      ),
      sortable: true,
    },
    {
      header: 'Nominal (Rp)',
      accessorKey: (r) => (
        <span className={`font-bold ${r.jenis === 'Masuk' ? 'text-green-600' : 'text-red-600'}`}>
          {r.jenis === 'Masuk' ? '+' : '-'} Rp {r.nominal.toLocaleString('id-ID')}
        </span>
      ),
      sortable: true,
    },
    { header: 'Keterangan Transaksi', accessorKey: 'keterangan' },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Arus Kas (Cashflow)</h1>
          <p className="text-xs text-slate-400 mt-1">Pencatatan & analisa transaksi penerimaan dan pengeluaran kas berjalan</p>
        </div>
      </div>

      {/* Cashflow Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Arus Kas Masuk</p>
          <p className="text-2xl font-bold text-green-600 mt-1">Rp {totalIn.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Arus Kas Keluar</p>
          <p className="text-2xl font-bold text-red-600 mt-1">Rp {totalOut.toLocaleString('id-ID')}</p>
        </div>
        <div className="p-4 bg-white/60 border border-slate-200 rounded-md">
          <p className="text-xs font-semibold text-slate-400 uppercase">Net Cashflow Periode</p>
          <p className={`text-2xl font-bold mt-1 ${netCashflow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            Rp {netCashflow.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      <DataTable
        title="Daftar Mutasi Cashflow"
        data={cashflowEntries}
        columns={columns}
        searchPlaceholder="Cari keterangan, akun..."
        exportFileName="Cashflow_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Mutasi Kas</span>
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Mutasi Cashflow">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Akun Kas / Bank *</label>
            <select
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            >
              {cashBankAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nama_akun} (Saldo: Rp {a.saldo.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Transaksi</label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              >
                <option value="Masuk">Kas Masuk (Penerimaan)</option>
                <option value="Keluar">Kas Keluar (Pengeluaran)</option>
              </select>
            </div>
             <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal (Rp) *</label>
              <input
                type="text"
                required
                value={formatRupiah(formData.nominal)}
                onChange={(e) => {
                  const cleanVal = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, nominal: Number(cleanVal) || 0 });
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Transaksi</label>
            <input
              type="date"
              required
              value={formData.tanggal}
              onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan Transaksi *</label>
            <textarea
              rows={2}
              required
              value={formData.keterangan}
              onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Detail peruntukan atau sumber dana..."
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
              Simpan Mutasi
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
