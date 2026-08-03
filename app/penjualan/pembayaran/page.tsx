'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Sale } from '@/types';

export default function PembayaranPenjualanPage() {
  const { sales } = useData();

  const columns: Column<Sale>[] = [
    { header: 'Nama Konsumen', accessorKey: (r) => <span className="font-bold text-slate-800">{r.customer_nama}</span> },
    { header: 'No. Unit', accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.unit_no}</span> },
    { header: 'Booking Fee', accessorKey: (r) => `Rp ${r.booking_fee.toLocaleString('id-ID')}` },
    { header: 'DP Terbayar', accessorKey: (r) => `Rp ${r.dp_nominal.toLocaleString('id-ID')}` },
    {
      header: 'Total Kesepakatan',
      accessorKey: (r) => <span className="font-bold text-green-600">Rp {r.total_harga.toLocaleString('id-ID')}</span>,
    },
    {
      header: 'Status Pembayaran',
      accessorKey: (r) => <Badge variant={r.status === 'Lunas' ? 'emerald' : 'amber'}>{r.status}</Badge>,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Jadwal & Riwayat Pembayaran</h1>
          <p className="text-xs text-slate-400 mt-1">Status pelunasan Booking Fee, DP, dan angsuran konsumen</p>
        </div>
      </div>

      <DataTable
        title="Daftar Pembayaran Konsumen"
        data={sales}
        columns={columns}
        searchPlaceholder="Cari konsumen, unit..."
        exportFileName="Pembayaran_Penjualan_Lansena"
      />
    </AppLayout>
  );
}
