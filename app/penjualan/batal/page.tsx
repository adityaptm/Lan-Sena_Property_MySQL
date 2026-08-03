'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Sale } from '@/types';

export default function PembatalanPage() {
  const { sales, cancelSale } = useData();

  const activeSales = sales.filter((s) => s.status !== 'Batal');
  const canceledSales = sales.filter((s) => s.status === 'Batal');

  const columns: Column<Sale>[] = [
    { header: 'Nama Konsumen', accessorKey: (r) => <span className="font-bold text-slate-800">{r.customer_nama}</span> },
    { header: 'No. Unit', accessorKey: (r) => <span className="font-mono text-xs text-red-600 font-bold">{r.unit_no}</span> },
    { header: 'Tanggal Transaksi', accessorKey: 'tanggal_transaksi' },
    {
      header: 'Total Kesepakatan',
      accessorKey: (r) => <span className="font-semibold text-slate-600">Rp {r.total_harga.toLocaleString('id-ID')}</span>,
    },
    {
      header: 'Status',
      accessorKey: (r) => <Badge variant="rose">Batal</Badge>,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pembatalan Transaksi Penjualan</h1>
          <p className="text-xs text-slate-400 mt-1">Daftar transaksi yang dibatalkan & proses pengembalian dana / rilis unit kembali tersedia</p>
        </div>
      </div>

      <DataTable
        title="Daftar Transaksi Batal"
        data={canceledSales}
        columns={columns}
        searchPlaceholder="Cari konsumen, unit..."
        exportFileName="Transaksi_Batal_Lansena"
      />
    </AppLayout>
  );
}
