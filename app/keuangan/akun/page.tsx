'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { ChartOfAccount } from '@/types';

export default function SubAkunKeuanganPage() {
  const { chartOfAccounts } = useData();

  const columns: Column<ChartOfAccount>[] = [
    { header: 'Kode Sub-Akun', accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.kode_akun}-SUB</span> },
    { header: 'Nama Sub-Akun Detail', accessorKey: (r) => `${r.nama_akun} (Detail Proyek)` },
    { header: 'Kategori', accessorKey: 'kategori' },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Detail Sub-Akun Keuangan</h1>
          <p className="text-xs text-slate-400 mt-1">Rincian sub-akun per proyek perumahan dan cabang kantor</p>
        </div>
      </div>

      <DataTable
        title="Daftar Sub-Akun Proyek"
        data={chartOfAccounts}
        columns={columns}
        searchPlaceholder="Cari sub-akun..."
        exportFileName="Sub_Akun_Keuangan_Lansena"
      />
    </AppLayout>
  );
}
