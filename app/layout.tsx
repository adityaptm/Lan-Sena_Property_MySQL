import type { Metadata } from 'next';
import './globals.css';
import { DataProvider } from '@/lib/data-context';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

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
    <html lang="id" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('lansena_theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-[#F5F6F8] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              {children}
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}