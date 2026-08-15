'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { fetchLogoBase64 } from '@/lib/logo-utils';

export default function PrintSerahTerimaKunciClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const nomor = searchParams.get('nomor') || '';
  const tanggal = searchParams.get('tanggal') || new Date().toISOString().split('T')[0];
  const penyerah = searchParams.get('penyerah') || '';
  const pemeliharaan = searchParams.get('pemeliharaan') || '100';
  const catatan = searchParams.get('catatan') || 'tidak merenovasi dan memperbaiki sendiri';

  const { sales, customers, units, loading } = useData();

  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const sale = sales.find((s) => s.id === id);
  const customer = customers.find((c) => c.id === sale?.customer_id);
  const unit = units.find((u) => u.id === sale?.unit_id);

  useEffect(() => {
    async function generatePdf() {
      if (!sale) return;

      setIsLoading(true);

      try {
        const logoSrc = await fetchLogoBase64();
        const { pdf } = await import('@react-pdf/renderer');
        const { SerahTerimaKunciDocument } = await import(
          '@/components/pdf/SerahTerimaKunciDocument'
        );

        const blob = await pdf(
          <SerahTerimaKunciDocument
            sale={sale}
            customer={customer}
            unit={unit}
            nomorSurat={nomor}
            tanggalSerahTerima={tanggal}
            yangMenyerahkan={penyerah}
            masaPemeliharaan={pemeliharaan}
            catatanPemeliharaan={catatan}
            baseUrl={window.location.origin}
            logoSrc={logoSrc}
          />
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

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [sale, customer, unit, nomor, tanggal, penyerah, pemeliharaan, catatan]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat data serah terima kunci...</p>
        </div>
      </AppLayout>
    );
  }

  if (!id || !sale) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-red-500 font-bold">
          Data penjualan tidak ditemukan atau ID tidak valid.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">
          Cetak Berita Acara Serah Terima Kunci
        </h1>
        <p className="text-sm text-slate-500">
          Pratinjau Dokumen Berita Acara Serah Terima Kunci
        </p>
      </div>

      <div className="w-full h-[800px] border border-slate-300 rounded overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="w-full h-full flex flex-col gap-3 items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">
              Memuat Dokumen PDF...
            </p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title="Serah Terima Kunci Document"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <p className="text-red-500 font-medium">
              Gagal memuat PDF.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}