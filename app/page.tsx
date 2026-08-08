'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { Badge } from '@/components/ui/Badge';
import { DashboardProgress, STANDARD_KPR_STATUSES } from '@/components/dashboard/DashboardProgress';
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
  Megaphone,
  Search,
  Calendar,
  CheckCircle2,
  CircleDashed,
  CreditCard,
  Receipt,
  SlidersHorizontal
} from 'lucide-react';

function formatRupiah(amount: number) {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
}

export default function DashboardPage() {
  const {
    units,
    sales,
    cashBankAccounts,
    items,
    mandors,
    operationalExpenses,
    disbursementRequests,
    onlineBookings,
    currentUser
  } = useData();

  // Metrics
  const availableUnits = units.filter((u) => u.status === 'Tersedia');
  const bookedUnits = units.filter((u) => u.status === 'Booking' || u.status === 'DP');
  const soldUnits = units.filter((u) => u.status === 'Akad' || u.status === 'Lunas');

  const totalSalesRevenue = sales.reduce((acc, curr) => acc + (curr.total_harga || 0), 0);
  const totalCashBankBalance = cashBankAccounts.reduce((acc, curr) => acc + (curr.saldo || 0), 0);
  const lowStockItems = items.filter((i) => i.stok <= i.min_stok);

  // 1. DYNAMIC DATA: Progress Pembangunan (Belum Selesai)
  const progressBelumSelesai = useMemo(() => {
    const list: { blok: string; count: number }[] = [];

    // From Mandors table
    mandors.forEach((m) => {
      if (m.belum_selesai && m.belum_selesai > 0) {
        list.push({
          blok: `${m.nama_mandor}${m.spesialis ? ` (${m.spesialis})` : ''}`,
          count: m.belum_selesai,
        });
      }
    });

    // Group units in construction / Booking / DP by block
    const map: Record<string, number> = {};
    units.forEach((u) => {
      if (u.status === 'Booking' || u.status === 'DP') {
        const key = u.block_nama ? `${u.location_nama || 'Perumahan'} ${u.block_nama}` : 'Blok Pembangunan';
        map[key] = (map[key] || 0) + 1;
      }
    });

    Object.entries(map).forEach(([blok, count]) => {
      list.push({ blok, count });
    });

    return list;
  }, [mandors, units]);

  // 2. DYNAMIC DATA: Progress Pembangunan (Selesai)
  const progressSelesai = useMemo(() => {
    const list: { blok: string; count: number }[] = [];

    // From Mandors table
    mandors.forEach((m) => {
      if (m.selesai && m.selesai > 0) {
        list.push({
          blok: `${m.nama_mandor}${m.spesialis ? ` (${m.spesialis})` : ''}`,
          count: m.selesai,
        });
      }
    });

    // Group units finished (Ready/Akad/Lunas) by block
    const map: Record<string, number> = {};
    units.forEach((u) => {
      if (u.status === 'Tersedia' || u.status === 'Akad' || u.status === 'Lunas') {
        const key = u.block_nama ? `${u.location_nama || 'Perumahan'} ${u.block_nama}` : 'Blok Selesai';
        map[key] = (map[key] || 0) + 1;
      }
    });

    Object.entries(map).forEach(([blok, count]) => {
      list.push({ blok, count });
    });

    return list;
  }, [mandors, units]);

  // 3. DYNAMIC DATA: Unit Ready Summary
  const unitReadySummary = useMemo(() => {
    const readyUnits = units.filter((u) => u.status === 'Tersedia');
    const map: Record<string, { lokasi: string; blok: string; count: number }> = {};

    readyUnits.forEach((u) => {
      const loc = u.location_nama || 'Perumahan';
      const blk = u.block_nama || 'Utama';
      const key = `${loc}||${blk}`;
      if (!map[key]) {
        map[key] = { lokasi: loc, blok: blk, count: 0 };
      }
      map[key].count += 1;
    });

    return Object.values(map);
  }, [units]);

  // 4. DYNAMIC DATA: Booking Terbaru
  const bookingTerbaru = useMemo(() => {
    const list: {
      unit: string;
      tglBooking: string;
      konsumen: string;
      noHp: string;
      marketing: string | null;
    }[] = [];

    // From sales table
    sales.forEach((s) => {
      list.push({
        unit: s.unit_no ? `BLOK ${s.block_nama || ''} NO ${s.unit_no}`.trim() : `Unit Sales #${s.id.slice(0, 4)}`,
        tglBooking: s.tanggal_booking ? new Date(s.tanggal_booking).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Terbaru',
        konsumen: s.customer_nama || 'Konsumen',
        noHp: s.customer_id ? '-' : '0',
        marketing: s.marketer_nama || null,
      });
    });

    // From online bookings table
    onlineBookings.forEach((ob) => {
      list.push({
        unit: ob.unit_no ? `UNIT ${ob.unit_no}` : 'Online Booking',
        tglBooking: ob.tanggal_booking ? new Date(ob.tanggal_booking).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Terbaru',
        konsumen: ob.customer_nama || 'Konsumen Online',
        noHp: ob.customer_hp || '-',
        marketing: 'Online Booking',
      });
    });

    return list.slice(0, 10);
  }, [sales, onlineBookings]);

  // 5. DYNAMIC DATA: Progres KPR Status Aggregation
  const progresKpr = useMemo(() => {
    return STANDARD_KPR_STATUSES.map((statusName) => {
      const count = sales.filter((s) => {
        const kpr = (s.kpr_status || '').toUpperCase();
        const st = (s.status || '').toUpperCase();
        const target = statusName.toUpperCase();
        return kpr === target || st === target || kpr.includes(target) || target.includes(kpr && kpr.length > 3 ? kpr : 'XYZ123');
      }).length;

      return {
        keterangan: statusName,
        count: count,
      };
    });
  }, [sales]);

  // 6. DYNAMIC DATA: Operasional & Pengajuan Pencairan
  const operasionalList = useMemo(() => {
    const list: { penerima: string; keterangan: string; jumlah: number; sisa: number }[] = [];

    disbursementRequests.forEach((dr) => {
      list.push({
        penerima: dr.requested_by || 'Pengaju',
        keterangan: dr.jenis_pengajuan || 'Pengajuan Dana',
        jumlah: dr.nominal || 0,
        sisa: dr.status_approval === 'Dicairkan' ? 0 : dr.nominal || 0,
      });
    });

    operationalExpenses.forEach((oe) => {
      list.push({
        penerima: oe.kategori || 'Operasional',
        keterangan: oe.keterangan || 'Biaya Operasional',
        jumlah: oe.nominal || 0,
        sisa: oe.nominal || 0,
      });
    });

    return list;
  }, [disbursementRequests, operationalExpenses]);

  const totalOperasionalBelumTerbayar = useMemo(() => {
    return operasionalList.reduce((acc, curr) => acc + curr.sisa, 0);
  }, [operasionalList]);

  // Table pagination & search states
  const [searchBelum, setSearchBelum] = useState('');
  const [pageBelum, setPageBelum] = useState(1);
  const filteredBelum = useMemo(
    () => progressBelumSelesai.filter((item) => item.blok.toLowerCase().includes(searchBelum.toLowerCase())),
    [progressBelumSelesai, searchBelum]
  );
  const paginatedBelum = useMemo(() => filteredBelum.slice((pageBelum - 1) * 10, pageBelum * 10), [filteredBelum, pageBelum]);

  const [searchSelesai, setSearchSelesai] = useState('');
  const [pageSelesai, setPageSelesai] = useState(1);
  const filteredSelesai = useMemo(
    () => progressSelesai.filter((item) => item.blok.toLowerCase().includes(searchSelesai.toLowerCase())),
    [progressSelesai, searchSelesai]
  );
  const paginatedSelesai = useMemo(() => filteredSelesai.slice((pageSelesai - 1) * 10, pageSelesai * 10), [filteredSelesai, pageSelesai]);

  const [searchUnitReady, setSearchUnitReady] = useState('');
  const [pageUnitReady, setPageUnitReady] = useState(1);
  const filteredUnitReadySummary = useMemo(
    () => unitReadySummary.filter((item) => item.lokasi.toLowerCase().includes(searchUnitReady.toLowerCase()) || item.blok.toLowerCase().includes(searchUnitReady.toLowerCase())),
    [unitReadySummary, searchUnitReady]
  );
  const paginatedUnitReadySummary = useMemo(() => filteredUnitReadySummary.slice((pageUnitReady - 1) * 10, pageUnitReady * 10), [filteredUnitReadySummary, pageUnitReady]);

  const [pageOperasional, setPageOperasional] = useState(1);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan operasional — {currentUser?.nama || 'Pengguna'} ({currentUser?.role || 'User'})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard-progress"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md transition shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Dashboard Progress</span>
          </Link>
          <Link
            href="/penjualan/input"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Penjualan</span>
          </Link>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-800">Peringatan Stok Gudang Menipis</p>
              <p className="text-amber-600 mt-0.5">
                {lowStockItems.length} barang material mencapai batas minimum ({lowStockItems.map((i) => i.nama_barang).join(', ')}).
              </p>
            </div>
          </div>
          <Link
            href="/gudang/stok-barang"
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md text-xs font-bold transition shrink-0"
          >
            Cek Stok
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit Tersedia</span>
            <Home className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{availableUnits.length}</span>
            <span className="text-xs text-slate-500">dari {units.length} total unit</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Booking/DP: {bookedUnits.length}</span>
            <Link href="/unit-rumah" className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium">
              Detail <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unit Terjual</span>
            <CheckCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{soldUnits.length}</span>
            <span className="text-xs text-emerald-600 font-bold">Akad / Lunas</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>Total Closing</span>
            <Link href="/penjualan/daftar" className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium">
              Lihat Sales <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Omset Penjualan</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">
              Rp {(totalSalesRevenue / 1000000000).toFixed(2)} M
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>{sales.length} Transaksi</span>
            <Link href="/laporan/penjualan-kpr" className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium">
              Laporan <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kas &amp; Bank</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-800">
              Rp {(totalCashBankBalance / 1000000000).toFixed(2)} M
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span>{cashBankAccounts.length} Rekening</span>
            <Link href="/keuangan/kas-bank" className="text-blue-600 hover:underline flex items-center gap-0.5 font-medium">
              Mutasi <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Akses Cepat Links */}
      <div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Akses Cepat</h3>
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
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-md flex items-center gap-3 transition group shadow-2xs"
            >
              <item.icon className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Section 1: Progress Pembangunan (Belum Selesai & Selesai) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Progress Pembangunan (Belum Selesai) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CircleDashed className="w-4 h-4 text-amber-500" />
                <span>Progress Pembangunan (Belum Selesai)</span>
              </h3>
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchBelum}
                onChange={(e) => {
                  setSearchBelum(e.target.value);
                  setPageBelum(1);
                }}
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Blok</th>
                  <th className="py-2.5 px-4 text-right">Jml Pengerjaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedBelum.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-slate-400">Belum ada data pengerjaan</td>
                  </tr>
                ) : (
                  paginatedBelum.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{item.blok}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-amber-600">{item.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Show 10 entries</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageBelum((p) => Math.max(1, p - 1))}
                disabled={pageBelum === 1}
                className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(filteredBelum.length / 10) }, (_, i) => i + 1)
                .slice(0, 4)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPageBelum(p)}
                    className={`px-2.5 py-1 rounded font-semibold ${
                      pageBelum === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPageBelum((p) => Math.min(Math.ceil(filteredBelum.length / 10), p + 1))}
                disabled={pageBelum >= Math.ceil(filteredBelum.length / 10)}
                className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Table 2: Progress Pembangunan (Selesai) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Progress Pembangunan (Selesai)</span>
              </h3>
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchSelesai}
                onChange={(e) => {
                  setSearchSelesai(e.target.value);
                  setPageSelesai(1);
                }}
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Blok</th>
                  <th className="py-2.5 px-4 text-right">Jml Pengerjaan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedSelesai.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-slate-400">Belum ada data pengerjaan selesai</td>
                  </tr>
                ) : (
                  paginatedSelesai.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{item.blok}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{item.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Show 10 entries</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageSelesai((p) => Math.max(1, p - 1))}
                disabled={pageSelesai === 1}
                className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(filteredSelesai.length / 10) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPageSelesai(p)}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    pageSelesai === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPageSelesai((p) => Math.min(Math.ceil(filteredSelesai.length / 10), p + 1))}
                disabled={pageSelesai >= Math.ceil(filteredSelesai.length / 10)}
                className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Unit Ready & Booking Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 3: Unit Ready Summary */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                <span>Unit Ready</span>
              </h3>
            </div>
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchUnitReady}
                onChange={(e) => {
                  setSearchUnitReady(e.target.value);
                  setPageUnitReady(1);
                }}
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Lokasi</th>
                  <th className="py-2.5 px-4">Blok</th>
                  <th className="py-2.5 px-4 text-right">Unit Ready</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedUnitReadySummary.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-slate-400">Belum ada unit ready di database</td>
                  </tr>
                ) : (
                  paginatedUnitReadySummary.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-medium text-slate-800">{item.lokasi}</td>
                      <td className="py-2.5 px-4 font-semibold text-blue-700">{item.blok}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-emerald-600">{item.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Show 10 entries</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageUnitReady((p) => Math.max(1, p - 1))}
                disabled={pageUnitReady === 1}
                className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(filteredUnitReadySummary.length / 10) }, (_, i) => i + 1)
                .slice(0, 6)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPageUnitReady(p)}
                    className={`px-2.5 py-1 rounded font-semibold ${
                      pageUnitReady === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                onClick={() => setPageUnitReady((p) => Math.min(Math.ceil(filteredUnitReadySummary.length / 10), p + 1))}
                disabled={pageUnitReady >= Math.ceil(filteredUnitReadySummary.length / 10)}
                className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: Booking Terbaru */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-orange-500" />
                <span>Booking Terbaru</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Total Data : {bookingTerbaru.length}</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded text-xs font-medium text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Hari ini / Terbaru</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
            {bookingTerbaru.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">Belum ada booking transaksi baru</div>
            ) : (
              bookingTerbaru.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs hover:border-blue-300 transition"
                >
                  <div>
                    <div className="font-bold text-blue-800 text-sm">{item.unit}</div>
                    <div className="text-slate-500 mt-0.5">
                      Booking : <span className="font-semibold text-slate-700">{item.tglBooking}</span>
                    </div>
                    {item.marketing && (
                      <div className="text-slate-500">
                        Marketing : <span className="font-semibold text-slate-700">{item.marketing}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-800">{item.konsumen}</div>
                    <div className="font-mono text-slate-500 mt-0.5">{item.noHp}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Progres KPR & Operasional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 5: Progres KPR */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Progres KPR</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Rekapitulasi tahapan KPR konsumen</p>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-bold text-xs">
              {progresKpr.reduce((acc, curr) => acc + curr.count, 0)} Total Unit
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200 sticky top-0 bg-slate-50">
                <tr>
                  <th className="py-2.5 px-4">Keterangan</th>
                  <th className="py-2.5 px-4 text-right">Jml Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {progresKpr.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-4 font-medium text-slate-800">{item.keterangan}</td>
                    <td className="py-2 px-4 text-right">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          item.count > 0 ? 'bg-blue-100 text-blue-800' : 'text-slate-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 6: Operasional / Pengajuan Pencairan Dana */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-600" />
                  <span>Pengajuan Pencairan Dana &amp; Operasional</span>
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <Link href="/keuangan/pengajuan-pencairan" className="text-blue-600 hover:underline">
                  Lihat Semua Pengajuan
                </Link>
                <span className="text-slate-300">|</span>
                <Link href="/keuangan/operasional" className="text-blue-600 hover:underline">
                  Lihat Semua Operasional
                </Link>
              </div>
            </div>

            {/* Outstanding Banner */}
            <div className="my-4 p-4 bg-rose-50 border border-rose-200 rounded-md">
              <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Total operasional belum terbayar :
              </p>
              <p className="text-2xl font-black text-rose-700 mt-1">
                {formatRupiah(totalOperasionalBelumTerbayar)}
              </p>
            </div>

            {/* Operasional Table */}
            <div className="overflow-x-auto border border-slate-200 rounded">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Penerima</th>
                    <th className="py-2.5 px-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {operasionalList.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-slate-400">Belum ada pengajuan operasional</td>
                    </tr>
                  ) : (
                    operasionalList.slice((pageOperasional - 1) * 4, pageOperasional * 4).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{item.penerima}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.keterangan}</div>
                          {item.sisa > 0 && (
                            <div className="text-[11px] text-rose-600 font-semibold mt-0.5">
                              Sisa: {formatRupiah(item.sisa)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-800 align-top">
                          {formatRupiah(item.jumlah)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operasional Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Menampilkan {operasionalList.length > 0 ? (pageOperasional - 1) * 4 + 1 : 0} - {Math.min(pageOperasional * 4, operasionalList.length)} dari {operasionalList.length} data</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPageOperasional((p) => Math.max(1, p - 1))}
                disabled={pageOperasional === 1}
                className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.ceil(operasionalList.length / 4) }, (_, i) => i + 1).slice(0, 4).map((p) => (
                <button
                  key={p}
                  onClick={() => setPageOperasional(p)}
                  className={`px-2.5 py-1 rounded font-semibold ${
                    pageOperasional === p ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPageOperasional((p) => Math.min(Math.ceil(operasionalList.length / 4) || 1, p + 1))}
                disabled={pageOperasional >= Math.ceil(operasionalList.length / 4)}
                className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: DASHBOARD PROGRESS */}
      <div className="pt-4 border-t border-slate-200">
        <DashboardProgress />
      </div>
    </AppLayout>
  );
}
