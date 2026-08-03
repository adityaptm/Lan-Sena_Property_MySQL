'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/lib/data-context';
import dynamic from 'next/dynamic';
import { AppLayout } from '@/components/layout/AppLayout';

// Dynamically import PDFViewer to avoid SSR issues with Node Canvas
export default function PrintSpprPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { sales, customers, units } = useData();

  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const sale = sales.find(s => s.id === id);
  const customer = customers.find(c => c.id === sale?.customer_id);
  const unit = units.find(u => u.id === sale?.unit_id);

  useEffect(() => {
    async function generatePdf() {
      if (!sale) return;
      setIsLoading(true);
      try {
        const { pdf } = await import('@react-pdf/renderer');
        const { SpprDocument } = await import('@/components/pdf/SpprDocument');
        
        const blob = await pdf(
          <SpprDocument sale={sale} customer={customer} unit={unit} baseUrl={window.location.origin} />
        ).toBlob();
        
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error('Error generating PDF:', error);
      } finally {
        setIsLoading(false);
      }
    }

    generatePdf();
  }, [sale, customer, unit]);

  if (!id || !sale) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-red-500 font-bold">Data penjualan tidak ditemukan atau ID tidak valid.</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">Cetak SPPR</h1>
        <p className="text-sm text-slate-500">Pratinjau Surat Pernyataan Pembelian Rumah</p>
      </div>
      
      <div className="w-full h-[800px] border border-slate-300 rounded overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="w-full h-full flex flex-col gap-3 items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Memuat Dokumen PDF...</p>
          </div>
        ) : pdfUrl ? (
          <iframe src={pdfUrl} className="w-full h-full" title="SPPR Document" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <p className="text-red-500 font-medium">Gagal memuat PDF.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
