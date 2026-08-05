'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { SalePayment } from '@/types';

export default function PrintKwitansiClient() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id') || searchParams.get('id') || '';
  const saleId = searchParams.get('sale_id') || '';

  const { sales, customers, units, currentUser, loading } = useData();
  const supabase = createClient();

  const [payment, setPayment] = useState<SalePayment | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the payment data from Supabase
  useEffect(() => {
    async function loadPayment() {
      if (!paymentId) {
        setError('ID pembayaran tidak ditemukan.');
        setIsLoading(false);
        return;
      }
      try {
        const { data, error: err } = await supabase
          .from('sale_payments')
          .select('*')
          .eq('id', paymentId)
          .single();
        if (err || !data) {
          setError('Data pembayaran tidak ditemukan.');
          setIsLoading(false);
          return;
        }
        setPayment(data);
      } catch (e) {
        console.error(e);
        setError('Gagal memuat data pembayaran.');
        setIsLoading(false);
      }
    }
    loadPayment();
  }, [paymentId, supabase]);

  // Generate PDF document once payment and context data are ready
  useEffect(() => {
    if (loading || !payment) return;

    const currentPayment = payment;
    const targetSaleId = saleId || currentPayment.sale_id;
    const sale = sales.find((s) => s.id === targetSaleId);
    const customer = customers.find((c) => c.id === sale?.customer_id);
    const unit = units.find((u) => u.id === sale?.unit_id);

    async function generatePdf() {
      setIsLoading(true);
      try {
        const { pdf } = await import('@react-pdf/renderer');
        const { KwitansiDocument } = await import(
          '@/components/pdf/KwitansiDocument'
        );

        const blob = await pdf(
          <KwitansiDocument
            payment={currentPayment}
            sale={sale}
            unit={unit}
            customer={customer}
            petugasNama={currentUser?.nama || 'FAHRUL ROZI'}
            baseUrl={window.location.origin}
          />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (e) {
        console.error('Error generating Kwitansi PDF:', e);
        setError('Gagal membuat PDF.');
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

  }, [payment, loading, sales, customers, units, currentUser, saleId]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Memuat data kwitansi...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-red-500 font-bold">{error}</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Cetak Kwitansi Pembayaran
          </h1>
          <p className="text-sm text-slate-500">
            {payment?.no_kwitansi || 'Memuat kwitansi...'}
          </p>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download={`kwitansi-${payment?.no_kwitansi?.replace(/\//g, '-') || 'pembayaran'}.pdf`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition shadow-sm"
          >
            ↓ Unduh PDF
          </a>
        )}
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
            title="Kwitansi Pembayaran Document"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <p className="text-red-500 font-medium">Gagal memuat PDF.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
