'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { DisbursementRequest } from '@/types';
import { Plus, Check, X, Clock } from 'lucide-react';
import { formatRupiah, parseRupiah } from '@/lib/format';

export default function PengajuanPencairanPage() {
  const { disbursementRequests, currentUser, addDisbursementRequest, updateDisbursementStatus } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    jenis_pengajuan: 'Pencairan Pembelian Material Hebel',
    nominal: 12500000,
    tanggal: new Date().toISOString().slice(0, 10),
    requested_by: currentUser?.nama || 'Admin',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.jenis_pengajuan) return;
    addDisbursementRequest({ ...formData, status_approval: 'Diajukan' });
    setIsModalOpen(false);
  };

  const columns: Column<DisbursementRequest>[] = [
    {
      header: 'Jenis / Peruntukan Pengajuan',
      accessorKey: (r) => <span className="font-bold text-slate-800">{r.jenis_pengajuan}</span>,
      sortable: true,
    },
    {
      header: 'Nominal (Rp)',
      accessorKey: (r) => <span className="font-bold text-orange-600">Rp {r.nominal.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    { header: 'Pengaju', accessorKey: 'requested_by', sortable: true },
    { header: 'Tanggal', accessorKey: 'tanggal', sortable: true },
    {
      header: 'Status Approval',
      accessorKey: (r) => (
        <Badge
          variant={
            r.status_approval === 'Dicairkan'
              ? 'emerald'
              : r.status_approval === 'Disetujui'
              ? 'teal'
              : r.status_approval === 'Diajukan'
              ? 'amber'
              : 'rose'
          }
        >
          {r.status_approval}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pengajuan Pencairan Dana</h1>
          <p className="text-xs text-slate-400 mt-1">Alur approval multi-level pencairan kas/bank (Diajukan → Disetujui → Dicairkan)</p>
        </div>
      </div>

      <DataTable
        title="Daftar Form Pengajuan Pencairan"
        data={disbursementRequests}
        columns={columns}
        searchPlaceholder="Cari pengajuan, pengaju..."
        exportFileName="Pengajuan_Pencairan_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Form Pengajuan</span>
          </button>
        }
        actions={(row) =>
          row.status_approval === 'Diajukan' ? (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => updateDisbursementStatus(row.id, 'Disetujui')}
                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-teal-500/30 transition border border-blue-200 flex items-center gap-1 text-xs font-semibold"
                title="Setuju Pengajuan"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Setujui</span>
              </button>
              <button
                onClick={() => updateDisbursementStatus(row.id, 'Ditolak')}
                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-rose-500/30 transition border border-rose-500/30"
                title="Tolak Pengajuan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : row.status_approval === 'Disetujui' ? (
            <button
              onClick={() => updateDisbursementStatus(row.id, 'Dicairkan')}
              className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-emerald-500/30 transition border border-green-200 flex items-center gap-1 text-xs font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Tandai Dicairkan</span>
            </button>
          ) : null
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Pengajuan Pencairan Dana">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Peruntukan / Jenis Pengajuan *</label>
            <input
              type="text"
              required
              value={formData.jenis_pengajuan}
              onChange={(e) => setFormData({ ...formData, jenis_pengajuan: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              placeholder="Contoh: Pembelian Semen Gresik 100 Sak"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Pengajuan</label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
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
              Kirim Pengajuan
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
