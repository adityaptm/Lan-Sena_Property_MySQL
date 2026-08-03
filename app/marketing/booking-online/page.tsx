'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { OnlineBooking } from '@/types';
import { ShoppingCart, ArrowRight } from 'lucide-react';

export default function BookingOnlinePage() {
  const { onlineBookings, convertBookingToSale } = useData();

  const columns: Column<OnlineBooking>[] = [
    {
      header: 'Nama Customer',
      accessorKey: (r) => <span className="font-bold text-slate-800">{r.customer_nama}</span>,
      sortable: true,
    },
    { header: 'No. HP', accessorKey: (r) => r.customer_hp || '-' },
    {
      header: 'Unit Dibooking',
      accessorKey: (r) => <span className="font-mono text-xs text-blue-600 font-bold">{r.unit_no}</span>,
      sortable: true,
    },
    { header: 'Tanggal Booking', accessorKey: 'tanggal_booking', sortable: true },
    { header: 'Sumber', accessorKey: 'sumber' },
    {
      header: 'Status',
      accessorKey: (r) => (
        <Badge
          variant={
            r.status === 'Deal'
              ? 'emerald'
              : r.status === 'Baru'
              ? 'amber'
              : r.status === 'Diproses'
              ? 'sky'
              : 'rose'
          }
        >
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Booking Online Website</h1>
          <p className="text-xs text-slate-400 mt-1">Daftar pemesanan unit langsung dari landing page website untuk dikonversi menjadi penjualan</p>
        </div>
      </div>

      <DataTable
        title="Daftar Online Booking"
        data={onlineBookings}
        columns={columns}
        searchPlaceholder="Cari customer, unit..."
        exportFileName="Online_Bookings_Lansena"
        actions={(row) =>
          row.status !== 'Deal' ? (
            <button
              onClick={() => convertBookingToSale(row.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-md"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Konversi ke Transaksi</span>
            </button>
          ) : (
            <span className="text-xs text-green-600 font-semibold flex items-center justify-end gap-1">
              Terproses <ArrowRight className="w-3 h-3" />
            </span>
          )
        }
      />
    </AppLayout>
  );
}
