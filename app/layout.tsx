import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/lib/data-context';

export const metadata: Metadata = {
  title: 'Lansena Property Sistem',
  description:
    'Sistem ERP Properti Terpadu: Penjualan KPR/Cash, Stok Gudang, Keuangan & COA, Manajemen Marketer, dan Laporan Real-Time.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-[#F5F6F8] text-slate-800 font-sans">
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}