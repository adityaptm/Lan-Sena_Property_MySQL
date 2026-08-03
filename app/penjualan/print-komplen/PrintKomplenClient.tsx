'use client';

import React, { useEffect, useState } from 'react';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';

interface Props {
  id?: string;
  tanggal?: string;
  penerima?: string;
  isi?: string;
}

export default function PrintKomplenClient({
  id,
  tanggal,
  penerima,
  isi,
}: Props) {
  const { sales, customers, units } = useData();

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
        const { SuratKomplenDocument } = await import(
          '@/components/pdf/SuratKomplenDocument'
        );

        const blob = await pdf(
          <SuratKomplenDocument
            sale={sale}
            customer={customer}
            unit={unit}
            tanggalKomplen={tanggal}
            penerimaKomplen={penerima}
            isiKomplen={isi}
            baseUrl={window.location.origin}
          />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    generatePdf();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [sale, customer, unit, tanggal, penerima, isi]);

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
          Cetak Surat Komplen Konsumen
        </h1>
        <p className="text-sm text-slate-500">
          Pratinjau Dokumen Surat Komplen
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
            title="Surat Komplen Document"
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