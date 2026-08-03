'use client';

import React, { useState } from 'react';
import { DataProvider } from '@/lib/data-context';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <DataProvider>
      <div className="min-h-screen flex flex-col font-sans selection:bg-blue-600 selection:text-white">
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
          <Header onMobileMenuToggle={() => setMobileOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
