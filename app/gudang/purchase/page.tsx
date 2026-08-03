'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Purchase } from '@/types';
import { Plus, CheckCircle, FileText } from 'lucide-react';

export default function PurchasePage() {
  const { purchases, addPurchase, updatePurchaseStatus } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    no_po: `PO-2026-08-00${purchases.length + 1}`,
    supplier: '',
    tanggal: new Date().toISOString().slice(0, 10),
    total_harga: 15000000,
    status: 'Approved' as Purchase['status'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier) return;
    addPurchase(formData);
    setIsModalOpen(false);
  };

  const columns: Column<Purchase>[] = [
    {
      header: 'No. PO',
      accessorKey: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold font-mono text-xs">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-800 font-mono text-xs">{r.no_po}</span>
        </div>
      ),
      sortable: true,
    },
    { header: 'Supplier', accessorKey: 'supplier', sortable: true },
    { header: 'Tanggal PO', accessorKey: 'tanggal', sortable: true },
    {
      header: 'Total Pembelian (Rp)',
      accessorKey: (r) => <span className="font-bold text-blue-600">Rp {r.total_harga.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    {
      header: 'Status PO',
      accessorKey: (r) => (
        <Badge variant={r.status === 'Received' ? 'emerald' : r.status === 'Approved' ? 'sky' : 'amber'}>
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Purchase Order (PO) Material</h1>
          <p className="text-xs text-slate-400 mt-1">Pengajuan & pencatatan pesanan pembelian material bangunan ke supplier</p>
        </div>
      </div>

      <DataTable
        title="Daftar Purchase Order"
        data={purchases}
        columns={columns}
        searchPlaceholder="Cari PO, supplier..."
        exportFileName="Purchase_Orders_Lansena"
        headerAction={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Buat PO Baru</span>
          </button>
        }
        actions={(row) =>
          row.status === 'Approved' ? (
            <button
              onClick={() => updatePurchaseStatus(row.id, 'Received')}
              className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-600 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold transition border border-green-200"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Set Received</span>
            </button>
          ) : null
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Purchase Order Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor PO *</label>
              <input
                type="text"
                required
                value={formData.no_po}
                onChange={(e) => setFormData({ ...formData, no_po: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-mono text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Supplier *</label>
              <input
                type="text"
                required
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
                placeholder="PT Material Utama Jaya"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal PO</label>
              <input
                type="date"
                required
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Total Biaya (Rp)</label>
              <input
                type="number"
                required
                value={formData.total_harga}
                onChange={(e) => setFormData({ ...formData, total_harga: Number(e.target.value) })}
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
              Simpan PO
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
