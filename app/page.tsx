'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/Badge';
import {
  Home,
  CheckCircle,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Users,
  PlusCircle,
  ArrowUpRight,
  Building2,
  FileSpreadsheet,
  Megaphone
} from 'lucide-react';

export default function DashboardPage() {
  const { units, sales, cashBankAccounts, items, customers, currentUser } = useData();

  // Metrics
  const availableUnits = units.filter((u) => u.status === 'Tersedia');
  const bookedUnits = units.filter((u) => u.status === 'Booking' || u.status === 'DP');
  const soldUnits = units.filter((u) => u.status === 'Akad' || u.status === 'Lunas');

  const totalSalesRevenue = sales.reduce((acc, curr) => acc + curr.total_harga, 0);
  const totalCashBankBalance = cashBankAccounts.reduce((acc, curr) => acc + curr.saldo, 0);

  const lowStockItems = items.filter((i) => i.stok <= i.min_stok);

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan operasional — {currentUser?.nama || 'Loading...'} ({currentUser?.role || '...'})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/penjualan/input"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Penjualan</span>
          </Link>
          <Link
            href="/unit-rumah"
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Lihat Unit</span>
          </Link>
        </div>
      </div>

      {/* Low Stock Warning */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-md flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="font-semibold text-orange-800">Peringatan Stok Gudang Menipis</p>
              <p className="text-xs text-orange-600 mt-0.5">
                {lowStockItems.length} barang material sudah mencapai batas minimum ({lowStockItems.map(i => i.nama_barang).join(', ')}).
              </p>
            </div>
          </div>
          <Link
            href="/gudang/stok-barang"
            className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-md text-xs font-semibold transition-colors shrink-0 border border-orange-200"
          >
            Cek Gudang
          </Link>
        </div>
      )}

      {/* Key Metric Cards — simple, one-line style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Units */}
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unit Tersedia</span>
            <Home className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{availableUnits.length}</span>
            <span className="text-xs text-slate-500">dari {units.length} total</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Booking/DP: {bookedUnits.length}</span>
            <Link href="/unit-rumah" className="text-blue-600 hover:underline flex items-center gap-0.5">
              Detail <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Sold Units */}
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Unit Terjual</span>
            <CheckCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{soldUnits.length}</span>
            <span className="text-xs text-green-600 font-semibold">Akad / Lunas</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Total Closing</span>
            <Link href="/penjualan/daftar" className="text-blue-600 hover:underline flex items-center gap-0.5">
              Lihat Sales <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Omset Penjualan */}
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Omset Penjualan</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">
              Rp {(totalSalesRevenue / 1000000000).toFixed(2)} M
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>{sales.length} Transaksi terdata</span>
            <Link href="/laporan/penjualan-kpr" className="text-blue-600 hover:underline flex items-center gap-0.5">
              Laporan <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Saldo Kas & Bank */}
        <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kas & Bank</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">
              Rp {(totalCashBankBalance / 1000000000).toFixed(2)} M
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>{cashBankAccounts.length} Rekening</span>
            <Link href="/keuangan/kas-bank" className="text-blue-600 hover:underline flex items-center gap-0.5">
              Mutasi <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access — flat horizontal links, not flashy cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Akses Cepat</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {[
            { href: '/kontak/customer', icon: Users, label: 'Customer' },
            { href: '/unit-rumah', icon: Building2, label: 'Unit Rumah' },
            { href: '/marketing/booking-online', icon: Megaphone, label: 'Booking Online' },
            { href: '/penjualan/print-kpr', icon: FileSpreadsheet, label: 'Cetak KPR' },
            { href: '/keuangan/pengajuan-pencairan', icon: Wallet, label: 'Pencairan Dana' },
            { href: '/laporan/summary-unit', icon: TrendingUp, label: 'Laporan Summary' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3 transition-colors group"
            >
              <item.icon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-medium text-slate-700">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Penjualan Terbaru</h3>
            <p className="text-xs text-slate-500 mt-0.5">Transaksi unit rumah yang baru disepakati</p>
          </div>
          <Link href="/penjualan/daftar" className="text-xs font-semibold text-blue-600 hover:underline">
            Lihat Semua →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Konsumen</th>
                <th className="py-3 px-5">No. Unit</th>
                <th className="py-3 px-5">Lokasi</th>
                <th className="py-3 px-5">Skema</th>
                <th className="py-3 px-5">Harga</th>
                <th className="py-3 px-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-5 font-medium text-slate-800">{sale.customer_nama}</td>
                  <td className="py-3 px-5 font-mono text-xs text-slate-600">{sale.unit_no}</td>
                  <td className="py-3 px-5 text-xs text-slate-500">{sale.location_nama}</td>
                  <td className="py-3 px-5">
                    <Badge variant={sale.metode_bayar === 'KPR' ? 'sky' : 'emerald'}>
                      {sale.metode_bayar}
                    </Badge>
                  </td>
                  <td className="py-3 px-5 font-medium">
                    Rp {sale.total_harga.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-5">
                    <Badge
                      variant={
                        sale.status === 'Lunas'
                          ? 'emerald'
                          : sale.status === 'Akad'
                          ? 'teal'
                          : sale.status === 'DP'
                          ? 'amber'
                          : 'sky'
                      }
                    >
                      {sale.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
