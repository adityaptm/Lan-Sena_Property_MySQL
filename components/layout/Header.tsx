'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Bell, AlertTriangle, CheckCircle, LogOut, Calendar, ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

const ROUTE_TITLES: Record<string, { module: string; page: string }> = {
  '/': { module: 'Utama', page: 'Dashboard' },
  '/kontak/customer': { module: 'Kontak', page: 'Customer' },
  '/kontak/bank': { module: 'Kontak', page: 'Bank Partner' },
  '/unit-rumah': { module: 'Unit Rumah', page: 'Master Data & Unit' },
  '/penjualan/input': { module: 'Penjualan', page: 'Input Penjualan Baru' },
  '/penjualan/daftar': { module: 'Penjualan', page: 'Daftar Penjualan' },
  '/marketing/jenis-marketer': { module: 'Marketing', page: 'Jenis Marketer' },
  '/marketing/marketer': { module: 'Marketing', page: 'Marketer / Sales' },
  '/marketing/booking-online': { module: 'Marketing', page: 'Booking Online' },
  '/marketing/hak-marketer': { module: 'Marketing', page: 'Hak & Fee Marketer' },
  '/gudang/stok-barang': { module: 'Gudang', page: 'Stok Barang' },
  '/gudang/purchase': { module: 'Gudang', page: 'Purchase PO' },
  '/gudang/barang-masuk': { module: 'Gudang', page: 'Barang Masuk' },
  '/gudang/barang-keluar': { module: 'Gudang', page: 'Barang Keluar' },
  '/keuangan/kas-bank': { module: 'Keuangan', page: 'Kas & Bank' },
  '/keuangan/akun-operasional': { module: 'Keuangan', page: 'Akun Operasional (COA)' },
  '/keuangan/hutang-bank': { module: 'Keuangan', page: 'Hutang Bank' },
  '/keuangan/akun': { module: 'Keuangan', page: 'Sub-Akun Keuangan' },
  '/keuangan/cashflow': { module: 'Keuangan', page: 'Cashflow' },
  '/keuangan/kasbon-mandor': { module: 'Keuangan', page: 'Kasbon Mandor' },
  '/keuangan/operasional': { module: 'Keuangan', page: 'Biaya Operasional' },
  '/keuangan/pengajuan-pencairan': { module: 'Keuangan', page: 'Pengajuan Pencairan' },
  '/keuangan/laporan-akuntansi': { module: 'Keuangan', page: 'Laporan Akuntansi' },
  '/keuangan/aset-perusahaan': { module: 'Keuangan', page: 'Aset Perusahaan' },
  '/laporan/penjualan-cash': { module: 'Laporan', page: 'Penjualan Cash' },
  '/laporan/penjualan-kpr': { module: 'Laporan', page: 'Penjualan KPR' },
  '/laporan/summary-unit': { module: 'Laporan', page: 'Summary Unit' },
  '/laporan/pekerjaan-mandor': { module: 'Laporan', page: 'Pekerjaan Mandor' },
  '/laporan/hutang-piutang': { module: 'Laporan', page: 'Hutang Piutang' },
  '/laporan/marketing-fee': { module: 'Laporan', page: 'Marketing Fee' },
  '/pengguna': { module: 'Pengguna', page: 'Manajemen User' },
  '/pengguna/riwayat': { module: 'Pengguna', page: 'Riwayat Aktivitas' },
  '/pengguna/riwayat-login': { module: 'Pengguna', page: 'Riwayat Login' },
  '/pengaturan/trash': { module: 'Pengaturan', page: 'Kotak Sampah' },
};

function getRouteInfo(pathname: string) {
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];

  // Match prefix
  for (const [route, info] of Object.entries(ROUTE_TITLES)) {
    if (route !== '/' && pathname.startsWith(route)) {
      return info;
    }
  }

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return { module: 'Utama', page: 'Dashboard' };
  const moduleName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).replace(/-/g, ' ');
  const pageName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1).replace(/-/g, ' ') : moduleName;
  return { module: moduleName, page: pageName };
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const { items, disbursementRequests, currentUser } = useData();
  const pathname = usePathname();
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    const now = new Date();
    setTodayStr(
      now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    );
  }, []);

  const routeInfo = getRouteInfo(pathname || '/');

  const handleLogout = async () => {
    if (!window.confirm('Apakah kamu yakin ingin keluar dari website?')) return;
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/login';
  };

  // Low stock inventory items
  const lowStockItems = items.filter((i) => i.stok <= i.min_stok);
  // Pending disbursements
  const pendingDisbursements = disbursementRequests.filter(
    (d) => d.status_approval === 'Diajukan'
  );

  const totalNotifications = lowStockItems.length + pendingDisbursements.length;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white dark:bg-[#151C2C] border-b border-slate-200 dark:border-[#243048] px-4 lg:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb & Date Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">{routeInfo.module}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 hidden sm:inline" />
            <span className="text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm tracking-tight">{routeInfo.page}</span>
          </div>

          {todayStr && (
            <>
              <span className="text-slate-200 dark:text-slate-700 mx-1 hidden md:inline">|</span>
              <div className="hidden md:flex items-center gap-1.5 text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-[#0E1524] border border-slate-200/70 dark:border-[#243048] px-2.5 py-1 rounded-md">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="capitalize font-medium">{todayStr}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode & Light Mode Toggle */}
        <ThemeToggle />

        {/* Notification Bell Dropdown indicator */}
        <div className="relative group">
          <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer">
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Hover Notification Box */}
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#151C2C] border border-slate-200 dark:border-[#243048] rounded-md shadow-lg p-4 hidden group-hover:block z-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#243048]">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Notifikasi System</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold border border-blue-100 dark:border-blue-900/40">
                {totalNotifications} Baru
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-md text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-300">Stok Barang Menipis!</p>
                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                      {item.nama_barang} sisa <strong>{item.stok} {item.satuan}</strong> (Min. {item.min_stok})
                    </p>
                  </div>
                </div>
              ))}

              {pendingDisbursements.map((dr) => (
                <div key={dr.id} className="p-2.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 rounded-md text-xs flex gap-2">
                  <Bell className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-700 dark:text-orange-300">Pengajuan Pencairan Perlu Approval</p>
                    <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5">
                      {dr.jenis_pengajuan} - Rp {dr.nominal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}

              {totalNotifications === 0 && (
                <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Semua sistem berjalan lancar</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User info + Logout */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-md text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-700 dark:text-blue-300 font-medium">{currentUser?.role || '...'}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
