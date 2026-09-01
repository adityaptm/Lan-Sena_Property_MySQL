'use client';

import React from 'react';
import { Menu, Bell, AlertTriangle, CheckCircle, Search, LogOut } from 'lucide-react';
import { useData } from '@/lib/data-context';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onToggleSidebar, isSidebarOpen }: HeaderProps) {
  const { items, disbursementRequests, currentUser } = useData();

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
    <header className="sticky top-0 z-20 h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title={isSidebarOpen ? "Tutup Sidebar" : "Buka Sidebar"}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi, unit, customer..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell Dropdown indicator */}
        <div className="relative group">
          <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>

          {/* Hover Notification Box */}
          <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-md shadow-lg p-4 hidden group-hover:block z-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Notifikasi System</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold border border-blue-100">
                {totalNotifications} Baru
              </span>
            </div>

            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {lowStockItems.map((item) => (
                <div key={item.id} className="p-2.5 bg-red-50 border border-red-100 rounded-md text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-700">Stok Barang Menipis!</p>
                    <p className="text-[11px] text-red-600 mt-0.5">
                      {item.nama_barang} sisa <strong>{item.stok} {item.satuan}</strong> (Min. {item.min_stok})
                    </p>
                  </div>
                </div>
              ))}

              {pendingDisbursements.map((dr) => (
                <div key={dr.id} className="p-2.5 bg-orange-50 border border-orange-100 rounded-md text-xs flex gap-2">
                  <Bell className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-orange-700">Pengajuan Pencairan Perlu Approval</p>
                    <p className="text-[11px] text-orange-600 mt-0.5">
                      {dr.jenis_pengajuan} - Rp {dr.nominal.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}

              {totalNotifications === 0 && (
                <div className="py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Semua sistem berjalan lancar</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User info + Logout */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-md text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-blue-700 font-medium">{currentUser?.role || '...'}</span>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
