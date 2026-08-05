'use client';

import React, { useEffect, useState } from 'react';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { createClient } from '@/lib/supabase/client';
import { SalePayment } from '@/types';

interface Props {
  paymentId?: string;
  saleId?: string;
}

export default function PrintKwitansiClient({ paymentId, saleId }: Props) {
  const { sales, customers, units, currentUser, loading } = useData();
  const supabase = createClient();

  const [payment, setPayment] = useState<SalePayment | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load the payment data
  useEffect(() => {
    async function loadPayment() {
      if (!paymentId) { setError('ID pembayaran tidak ditemukan.'); setIsLoading(false); return; }
      const { data, error: err } = await supabase
        .from('sale_payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      if (err || !data) { setError('Data pembayaran tidak ditemukan.'); setIsLoading(false); return; }
      setPayment(data);
    }
    loadPayment();
  }, [paymentId, supabase]);

  // Generate PDF once we have all data
  useEffect(() => {
    if (loading || !payment) return;

    // Capture ke variabel lokal agar TypeScript tahu non-null di dalam closure async
    const currentPayment = payment;
    const targetSaleId = saleId || currentPayment.sale_id;
    const sale = sales.find(s => s.id === targetSaleId);
    const customer = customers.find(c => c.id === sale?.customer_id);
    const unit = units.find(u => u.id === sale?.unit_id);

    async function generatePdf() {
      setIsLoading(true);
      try {
        const { pdf } = await import('@react-pdf/renderer');
        const { KwitansiDocument } = await import('@/components/pdf/KwitansiDocument');

        const blob = await pdf(
          <KwitansiDocument
            payment={currentPayment}
            sale={sale}
            unit={unit}
            customer={customer}
            petugasNama={currentUser?.nama || ''}
            baseUrl={window.location.origin}
          />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (e) {
        console.error(e);
        setError('Gagal membuat PDF.');
      } finally {
        setIsLoading(false);
      }
    }
    generatePdf();

    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment, loading, sales, customers, units, currentUser]);

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
          <h1 className="text-xl font-bold text-slate-800">Kwitansi Pembayaran</h1>
          <p className="text-sm text-slate-500">{payment?.no_kwitansi || 'Memuat...'}</p>
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download={`kwitansi-${payment?.no_kwitansi?.replace(/\//g, '-') || 'pembayaran'}.pdf`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition"
          >
            ↓ Unduh PDF
          </a>
        )}
      </div>

      <div className="w-full h-[800px] border border-slate-300 rounded overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="w-full h-full flex flex-col gap-3 items-center justify-center bg-slate-50">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Memuat Dokumen PDF...</p>
          </div>
        ) : pdfUrl ? (
          <iframe src={pdfUrl} className="w-full h-full" title="Kwitansi Pembayaran" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-50">
            <p className="text-red-500 font-medium">Gagal memuat PDF.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
