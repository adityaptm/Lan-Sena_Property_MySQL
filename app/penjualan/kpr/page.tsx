'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Sale } from '@/types';
import { CheckCircle2 } from 'lucide-react';

export default function KPRStatusPage() {
  const { sales, updateKprStatus } = useData();

  const kprSales = sales.filter((s) => s.metode_bayar === 'KPR');

  const columns: Column<Sale>[] = [
    {
      header: 'Nama Konsumen',
      accessorKey: (r) => <span className="font-bold text-slate-800">{r.customer_nama}</span>,
      sortable: true,
    },
    {
      header: 'No. Unit',
      accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.unit_no}</span>,
      sortable: true,
    },
    { header: 'Bank Pengaju', accessorKey: (r) => r.bank_nama || 'Bank Partner', sortable: true },
    {
      header: 'Total KPR (Rp)',
      accessorKey: (r) => <span className="font-bold text-green-600">Rp {r.total_harga.toLocaleString('id-ID')}</span>,
      sortable: true,
    },
    {
      header: 'Status Pengajuan KPR',
      accessorKey: (r) => (
        <Badge
          variant={
            r.kpr_status === 'Akad'
              ? 'emerald'
              : r.kpr_status === 'SP3K'
              ? 'teal'
              : r.kpr_status === 'OTS'
              ? 'sky'
              : 'amber'
          }
        >
          {r.kpr_status || 'Berkas Lengkap'}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Monitoring Progres KPR Bank</h1>
          <p className="text-xs text-slate-400 mt-1">Tahapan pengajuan KPR konsumen (Berkas Lengkap → Wawancara → OTS → SP3K → Akad)</p>
        </div>
      </div>

      <DataTable
        title="Daftar Pengajuan KPR"
        data={kprSales}
        columns={columns}
        searchPlaceholder="Cari konsumen, unit, bank..."
        exportFileName="Monitoring_KPR_Lansena"
        actions={(row) => (
          <div className="flex items-center justify-end gap-1">
            {row.kpr_status !== 'Akad' && (
              <select
                value={row.kpr_status || 'Berkas Lengkap'}
                onChange={(e) => updateKprStatus(row.id, e.target.value as any)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs text-blue-600 font-semibold focus:outline-none"
              >
                <option value="Berkas Lengkap">Berkas Lengkap</option>
                <option value="Wawancara">Wawancara Bank</option>
                <option value="OTS">OTS (Survey Lapangan)</option>
                <option value="SP3K">SP3K Terbit</option>
                <option value="Akad">Akad Kredit</option>
              </select>
            )}
          </div>
        )}
      />
    </AppLayout>
  );
}
