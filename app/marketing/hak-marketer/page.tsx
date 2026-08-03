'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { MarketerRight } from '@/types';

export default function HakMarketerPage() {
  const { marketerRights } = useData();

  const columns: Column<MarketerRight>[] = [
    {
      header: 'Nama Marketer',
      accessorKey: (r) => <span className="font-bold text-slate-800">{r.marketer_nama}</span>,
      sortable: true,
    },
    { header: 'Konsumen Pembeli', accessorKey: (r) => r.customer_nama || '-' },
    { header: 'No. Unit', accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.unit_no}</span> },
    { header: 'Persentase Fee', accessorKey: (r) => `${r.persen_fee}%` },
    {
      header: 'Nominal Fee (Rp)',
      accessorKey: (r) => <span className="font-bold text-blue-600">Rp {r.nominal_fee.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    {
      header: 'Status Pencairan',
      accessorKey: (r) => (
        <Badge variant={r.status_pencairan === 'Lunas' ? 'emerald' : r.status_pencairan === 'Sebagian' ? 'amber' : 'rose'}>
          {r.status_pencairan}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hak & Fee Marketer</h1>
          <p className="text-xs text-slate-400 mt-1">Pengaturan komisi fee marketing per transaksi penjualan unit dan riwayat pencairan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Hak Komisi Marketer"
        data={marketerRights}
        columns={columns}
        searchPlaceholder="Cari marketer, customer, unit..."
        exportFileName="Hak_Marketer_Lansena"
      />
    </AppLayout>
  );
}
