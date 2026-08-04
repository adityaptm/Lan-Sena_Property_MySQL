'use client';

import React, { useEffect, useState } from 'react';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';

interface Props {
  id?: string;
  type?: string;
}

export default function PrintDokumenClient({
  id,
  type = 'persyaratan',
}: Props) {
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
        const { pdf } = await import('@react-pdf/renderer');
        const { GenericDocument } = await import(
          '@/components/pdf/GenericDocument'
        );

        const blob = await pdf(
          <GenericDocument
            sale={sale}
            customer={customer}
            unit={unit}
            type={type}
            baseUrl={window.location.origin}
          />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    generatePdf();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [sale, customer, unit, type]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat data dokumen...</p>
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

  let title = 'Cetak Dokumen';

  switch (type) {
    case 'persyaratan':
      title = 'Cetak Persyaratan KPR';
      break;
    case 'serah-terima':
      title = 'Cetak Berita Acara Serah Terima';
      break;
    case 'komplen':
      title = 'Cetak Surat Komplen';
      break;
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        <p className="text-sm text-slate-500">
          Pratinjau {title}
        </p>
      </div>

      <div className="w-full h-[800px] border rounded shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            title="PDF"
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-red-500">
            Gagal memuat PDF.
          </div>
        )}
      </div>
    </AppLayout>
  );
}