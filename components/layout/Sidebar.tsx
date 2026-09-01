'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Home,
  Megaphone,
  Warehouse,
  Wallet,
  ShoppingCart,
  FileSpreadsheet,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Building2,
  LogOut,
  ShieldCheck,
  X,
  Menu,
} from 'lucide-react';
import { useData } from '@/lib/data-context';
import type { UserRole } from '@/types';
import { canAccessModule, ModuleName } from '@/lib/permissions';

interface NavGroup {
  title: ModuleName;
  icon: React.ElementType;
  roles?: UserRole[];
  items: {
    label: string;
    href: string;
    roles?: UserRole[];
  }[];
}

const NAV_MENU: NavGroup[] = [
  {
    title: 'Kontak',
    icon: Users,
    items: [
      { label: 'Customer', href: '/kontak/customer' },
      { label: 'Bank Partner', href: '/kontak/bank' },
    ],
  },
  {
    title: 'Unit Rumah',
    icon: Home,
    items: [{ label: 'Master Data & Unit', href: '/unit-rumah' }],
  },
  {
    title: 'Penjualan',
    icon: ShoppingCart,
    items: [
      { label: 'Input Penjualan Baru', href: '/penjualan/input' },
      { label: 'Daftar Penjualan', href: '/penjualan/daftar' },
    ],
  },
  {
    title: 'Marketing',
    icon: Megaphone,
    items: [
      { label: 'Jenis Marketer', href: '/marketing/jenis-marketer' },
      { label: 'Marketer / Sales', href: '/marketing/marketer' },
      { label: 'Booking Online', href: '/marketing/booking-online' },
      { label: 'Hak & Fee Marketer', href: '/marketing/hak-marketer' },
    ],
  },
  {
    title: 'Gudang',
    icon: Warehouse,
    items: [
      { label: 'Stok Barang', href: '/gudang/stok-barang' },
      { label: 'Purchase PO', href: '/gudang/purchase' },
      { label: 'Barang Masuk', href: '/gudang/barang-masuk' },
      { label: 'Barang Keluar', href: '/gudang/barang-keluar' },
    ],
  },
  {
    title: 'Keuangan',
    icon: Wallet,
    items: [
      { label: 'Kas & Bank', href: '/keuangan/kas-bank' },
      { label: 'Akun Operasional (COA)', href: '/keuangan/akun-operasional' },
      { label: 'Hutang Bank', href: '/keuangan/hutang-bank' },
      { label: 'Sub-Akun Keuangan', href: '/keuangan/akun' },
      { label: 'Cashflow', href: '/keuangan/cashflow' },
      { label: 'Kasbon Mandor', href: '/keuangan/kasbon-mandor' },
      { label: 'Biaya Operasional', href: '/keuangan/operasional' },
      { label: 'Pengajuan Pencairan', href: '/keuangan/pengajuan-pencairan' },
      { label: 'Laporan Akuntansi', href: '/keuangan/laporan-akuntansi' },
      { label: 'Aset Perusahaan', href: '/keuangan/aset-perusahaan' },
    ],
  },
  {
    title: 'Laporan',
    icon: FileSpreadsheet,
    items: [
      { label: 'Penjualan Cash', href: '/laporan/penjualan-cash' },
      { label: 'Penjualan KPR', href: '/laporan/penjualan-kpr' },
      { label: 'Summary Unit', href: '/laporan/summary-unit' },
      { label: 'Pekerjaan Mandor', href: '/laporan/pekerjaan-mandor' },
      { label: 'Hutang Piutang', href: '/laporan/hutang-piutang' },
      { label: 'Marketing Fee', href: '/laporan/marketing-fee' },
    ],
  },
  {
    title: 'Pengguna',
    icon: UserCheck,
    items: [
      { label: 'Manajemen User', href: '/pengguna' },
      { label: 'Kotak Sampah (Trash)', href: '/pengaturan/trash', roles: ['Super Admin'] },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  desktopOpen?: boolean;
  setDesktopOpen?: (open: boolean) => void;
}

export function Sidebar({
  mobileOpen,
  setMobileOpen,
  desktopOpen = true,
  setDesktopOpen,
}: SidebarProps) {
  const pathname = usePathname();
  const { currentUser } = useData();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Kontak: false,
    'Unit Rumah': false,
    Marketing: false,
    Gudang: false,
    Keuangan: false,
    Penjualan: false,
    Laporan: false,
    Pengguna: false,
  });

  // Auto-open group when child is active
  useEffect(() => {
    NAV_MENU.forEach((group) => {
      const hasActiveItem = group.items.some((item) => pathname === item.href);
      if (hasActiveItem) {
        setOpenGroups((prev) => ({ ...prev, [group.title]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const isLinkActive = (href: string) => pathname === href;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#1E2530] w-64 text-slate-300 shadow-xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded overflow-hidden flex items-center justify-center shrink-0 p-0.5">
            <img src="/logo.jpg" alt="PT. LAN SENA JAYA" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight leading-none">
              PT. LAN SENA JAYA
            </h1>
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Property System
            </span>
          </div>
        </Link>
        <button
          onClick={() => {
            setMobileOpen(false);
            if (setDesktopOpen) setDesktopOpen(false);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition cursor-pointer"
          title="Tutup Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Current User Info */}
      <div className="px-4 py-3 bg-[#171C25] border-b border-slate-700/50 flex items-center gap-2.5 text-xs">
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 text-xs">
          {currentUser?.nama?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate text-xs">{currentUser?.nama || 'Loading...'}</p>
          <p className="text-slate-400 truncate" style={{ fontSize: '10px' }}>{currentUser?.role || ''}</p>
        </div>
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 custom-scrollbar">
        {/* Main Dashboard Link */}
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors border-l-4 ${
            isLinkActive('/')
              ? 'bg-[#2D3748] text-white border-blue-500'
              : 'border-transparent text-slate-300 hover:bg-[#2D3748] hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/dashboard-progress"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors border-l-4 ${
            isLinkActive('/dashboard-progress')
              ? 'bg-[#2D3748] text-white border-blue-500'
              : 'border-transparent text-slate-300 hover:bg-[#2D3748] hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Dashboard Progress</span>
        </Link>

        {/* Dynamic Groups */}
        {NAV_MENU.map((group) => {
          if (!canAccessModule(currentUser?.role, group.title)) {
            return null;
          }

          const Icon = group.icon;
          const isOpen = !!openGroups[group.title];
          const hasActiveItem = group.items.some((item) => isLinkActive(item.href));

          return (
            <div key={group.title} className="pt-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.title)}
                className="w-full px-5 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between hover:text-white hover:bg-[#2D3748]/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                  <span>{group.title}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => {
                    if (item.roles && (!currentUser?.role || !item.roles.includes(currentUser.role as UserRole))) {
                      return null;
                    }
                    const active = isLinkActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-5 py-2 text-sm font-medium transition-colors border-l-4 ${
                          active
                            ? 'bg-[#2D3748] text-white border-blue-500'
                            : 'border-transparent text-slate-300 hover:bg-[#2D3748] hover:text-white'
                        }`}
                      >
                        <div className="w-4 flex justify-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500' : 'bg-slate-500 border border-slate-500 bg-transparent'}`} />
                        </div>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Profile */}
      <div className="p-4 border-t border-slate-700/50 bg-[#171C25] flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {currentUser?.nama?.charAt(0) || 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">{currentUser?.nama || 'Loading...'}</p>
            <p className="text-[10px] text-slate-400 font-medium">{currentUser?.role || ''}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            if (!window.confirm('Apakah kamu yakin ingin keluar dari website?')) return;
            await fetch('/api/auth/signout', { method: 'POST' });
            window.location.href = '/login';
          }}
          title="Sign Out"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out ${
          desktopOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
