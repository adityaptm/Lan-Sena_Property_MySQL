'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useData } from '@/lib/data-context';
import { canAccessModule, ModuleName } from '@/lib/permissions';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const { currentUser, loading } = useData();
  const router = useRouter();
  const pathname = usePathname();

  // Load saved sidebar state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lansena_sidebar_open');
      if (saved !== null) {
        setDesktopOpen(saved === 'true');
      }
    } catch {}
  }, []);

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopOpen((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('lansena_sidebar_open', String(next));
        } catch {}
        return next;
      });
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!currentUser && pathname !== '/login') {
      window.location.replace('/login');
      return;
    }

    if (currentUser) {
      const role = currentUser.role;

      // Viewer only has access to '/' (Dashboard)
      if (role === 'Viewer' && pathname !== '/' && pathname !== '/login') {
        router.replace('/');
        return;
      }

      // Check module permissions by pathname
      let requiredModule: ModuleName | null = null;
      if (pathname.startsWith('/kontak')) requiredModule = 'Kontak';
      else if (pathname.startsWith('/unit-rumah')) requiredModule = 'Unit Rumah';
      else if (pathname.startsWith('/marketing')) requiredModule = 'Marketing';
      else if (pathname.startsWith('/gudang')) requiredModule = 'Gudang';
      else if (pathname.startsWith('/keuangan')) requiredModule = 'Keuangan';
      else if (pathname.startsWith('/penjualan')) requiredModule = 'Penjualan';
      else if (pathname.startsWith('/laporan')) requiredModule = 'Laporan';
      else if (pathname.startsWith('/pengguna')) requiredModule = 'Pengguna';

      if (requiredModule && !canAccessModule(role, requiredModule)) {
        router.replace('/');
      }
    }
  }, [loading, currentUser, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex flex-col items-center justify-center p-4 text-slate-600">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Memuat sistem & autentikasi...</p>
      </div>
    );
  }

  if (!currentUser && pathname !== '/login') {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white bg-[#F5F6F8]">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        desktopOpen={desktopOpen}
        setDesktopOpen={setDesktopOpen}
      />

      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          desktopOpen ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        <Header
          onToggleSidebar={handleToggleSidebar}
          isSidebarOpen={desktopOpen}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}

