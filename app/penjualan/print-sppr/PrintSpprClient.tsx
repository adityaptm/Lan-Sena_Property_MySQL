'use client';

import React, { useEffect, useState } from 'react';
import { fetchLogoBase64 } from '@/lib/logo-utils';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';

interface Props {
  id?: string;
}

export default function PrintSpprClient({ id }: Props) {
  const { sales, customers, units, saleDiscounts, saleAdditionalCosts, loading } = useData();

  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const sale = sales.find((s) => s.id === id);
  // Sesuaikan field ini kalau nama kolom relasi di tipe Sale lo beda
  // (misal customerId, id_customer, dst)
  const customer = customers.find((c) => c.id === sale?.customer_id);
  const unit = units.find((u) => u.id === sale?.unit_id);
  const discounts = (saleDiscounts || []).filter((d) => d.sale_id === id);
  const additionalCosts = (saleAdditionalCosts || []).filter((c) => c.sale_id === id);

  useEffect(() => {
    if (!sale || !customer || !unit) return;

    async function generatePdf() {
      // Narrowing ulang di dalam closure supaya TypeScript yakin
      // customer & unit tidak undefined di sini
      if (!customer || !unit) return;

      setIsLoading(true);

      try {
        const { pdf } = await import('@react-pdf/renderer');
        const { SpprDocument } = await import('@/components/pdf/SpprDocument');
        const logoSrc = await fetchLogoBase64();

        // Resolve alamat lengkap via API route (client component can't import lib/db)
        const addressRes = await fetch('/api/resolve-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kelurahanId: customer.kelurahan_id,
            kampungDusun: customer.kampung_dusun,
            rt: customer.rt,
            rw: customer.rw,
            fallback: customer.alamat_ktp || customer.alamat,
          }),
        });
        const addressData = await addressRes.json();
        const alamatLengkap = addressData.data || customer.alamat_ktp || customer.alamat || '-';

        const customerWithAddress = { ...customer, alamatLengkap };

        const blob = await pdf(
          <SpprDocument
            sale={sale}
            customer={customerWithAddress}
            unit={unit}
            discounts={discounts}
            additionalCosts={additionalCosts}
            baseUrl={window.location.origin}
            logoSrc={logoSrc}
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
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale, customer, unit]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat data penjualan...</p>
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
          Cetak SPPR
        </h1>

        <p className="text-sm text-slate-500">
          Pratinjau Surat Pernyataan Pembelian Rumah
        </p>
      </div>

      <div className="w-full h-[800px] border border-slate-300 rounded overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="w-full h-full flex flex-col gap-3 items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">
              Memuat Dokumen PDF...
            </p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title="SPPR Document"
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