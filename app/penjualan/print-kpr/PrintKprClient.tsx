'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { PDFViewer } from '@react-pdf/renderer';
import { PersyaratanKprBundle } from '@/components/pdf/PersyaratanKprBundle';
import { formatTanggalIndonesia } from '@/lib/format';
import { ChevronLeft } from 'lucide-react';

interface Props {
  id?: string;
  lampiran5?: string;
  pejabat?: string;
  jabatan_pejabat?: string;
  cabang_pks?: string;
  no_pks?: string;
  tgl_pks?: string;
}

export default function PrintKprClient({
  id,
  lampiran5,
  pejabat,
  jabatan_pejabat,
  cabang_pks,
  no_pks,
  tgl_pks,
}: Props) {
  const router = useRouter();

  const {
    sales,
    customers,
    units,
    blocks,
    locations,
    banks,
    companySettings,
    loading,
  } = useData();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const sertakanLampiran5 = lampiran5 === '1';
  const namaPejabatBank = pejabat || '';
  const jabatanPejabatBank = jabatan_pejabat || '';
  const cabangPKS = cabang_pks || '';
  const nomorPKS = no_pks || '';
  const tanggalPKS = tgl_pks || '';

  if (loading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">
            Memuat dokumen persyaratan KPR...
          </p>
        </div>
      </div>
    );
  }

  const sale = sales.find((s) => s.id === id);

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Data Tidak Ditemukan
          </h2>

          <p className="text-slate-600 mb-6">
            Data penjualan tidak ditemukan atau Anda tidak memiliki akses.
          </p>

          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-slate-800 text-white rounded-md font-semibold hover:bg-slate-700"
          >
            Tutup Halaman
          </button>
        </div>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === sale.customer_id);
  const bank = banks.find((b) => b.id === sale.bank_id);
  const unit = units.find((u) => u.id === sale.unit_id);
  const block = blocks.find((b) => b.id === unit?.block_id);
  const location = locations.find((l) => l.id === block?.location_id);

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 font-medium">
          Data konsumen tidak ditemukan.
        </p>
      </div>
    );
  }

  const tanggalCetak = formatTanggalIndonesia(new Date());

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Cetak Persyaratan KPR Bersubsidi
            </h1>

            <p className="text-xs text-slate-500 mt-0.5">
              Atas nama:{' '}
              <span className="font-semibold text-blue-600">
                {customer.nama}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-5xl h-[calc(100vh-8rem)] rounded-xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
          <PDFViewer
            width="100%"
            height="100%"
            className="border-none"
          >
            <PersyaratanKprBundle
              customer={customer}
              bank={bank}
              companySettings={companySettings}
              location={location!}
              tanggalCetak={tanggalCetak}
              sertakanLampiran5={sertakanLampiran5}
              namaPejabatBank={namaPejabatBank}
              jabatanPejabatBank={jabatanPejabatBank}
              cabangPKS={cabangPKS}
              nomorPKS={nomorPKS}
              tanggalPKS={tanggalPKS}
            />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}