'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatTanggalIndonesia, formatRupiah } from '@/lib/format';
import { ChevronLeft, Edit, Printer, X, CheckCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { UpdateDataKonsumenForm } from '@/components/penjualan/forms/UpdateDataKonsumenForm';

interface Props {
  id?: string;
  lampiran5?: string;
  pejabat?: string;
  jabatan_pejabat?: string;
  cabang_pks?: string;
  no_pks?: string;
  tgl_pks?: string;
}

const LIST_LAMPIRAN = [
  { no: 1, title: 'SURAT PERNYATAAN PENYERAHAN DATA' },
  { no: 2, title: 'SURAT PERNYATAAN PENGHUNINAN RUMAH UMUM BERSUBSIDI' },
  { no: 3, title: 'SURAT KUASA PENDEBATAN DANA' },
  { no: 4, title: 'BERITA ACARA SERAH TERIMA RUMAH SEJAHTERA TAPAK' },
  { no: 5, title: 'SURAT PERNYATAAN PENYERAHAN SPT PPH' },
  { no: 6, title: 'SURAT PERNYATAAN PERSETUJUAN PENYALURAN KPR BERSUBSIDI TANPA MENGGUNAKAN SBUM' },
  { no: 7, title: 'SURAT PERSYARATAN KELOMPOK SASARAN' },
  { no: 8, title: 'SURAT PERMOHONAN SUBSIDI BANTUAN UANG MUKA (SBUM)' },
  { no: 9, title: 'SURAT PENGAKUAN KEKURANGAN BAYAR UANG MUKA' },
  { no: 10, title: 'SURAT KETERANGAN PEMINDAHBUKUAN DANA SBUM' },
  { no: 11, title: 'SURAT PERNYATAAN PENYELESAIAN PRASARANA, SARANA & UTILITAS PERUMAHAN' },
  { no: 12, title: 'SURAT KUASA 1' },
  { no: 13, title: 'SURAT PERNYATAAN PRASARANA, SARANA & UTILITAS PERUMAHAN' },
  { no: 14, title: 'SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN (Format Internal Bank)' },
  { no: 15, title: 'SURAT PERNYATAAN PEMOHON KPR BERSUBSIDI BTN (Format Kementrian PUPR)' },
  { no: 16, title: 'SURAT PERNYATAAN CALON DEBITUR KPR BERSUBSIDI BTN' },
  { no: 17, title: 'SURAT KUASA 2' },
  { no: 18, title: 'SURAT KETERANGAN PEMINDAHBUKUAN DANA SBUM' },
  { no: 19, title: 'SURAT PERNYATAAN TIDAK MEMILIKI RUMAH' },
  { no: 20, title: 'SURAT PERNYATAAN TIDAK BEKERJA' },
  { no: 21, title: 'KETETAPAN WAKTU UNTUK VERIFIKASI' },
];

export default function PrintKprClient({ id, lampiran5, pejabat, jabatan_pejabat, cabang_pks, no_pks, tgl_pks }: Props) {
  const router = useRouter();
  const { sales, customers, units, blocks, locations, banks, refresh } = useData();

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLampiran, setSelectedLampiran] = useState<number | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const sale = sales.find((s) => s.id === id);
  const customer = customers.find((c) => c.id === sale?.customer_id);
  const unit = units.find((u) => u.id === sale?.unit_id);
  const block = blocks.find((b) => b.id === unit?.block_id);
  const location = locations.find((l) => l.id === block?.location_id);
  const bank = banks.find((b) => b.id === sale?.bank_id);

  // Generate PDF ketika lampiran dipilih (persis seperti format SPPR)
  useEffect(() => {
    if (!selectedLampiran || !customer) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl('');
      }
      return;
    }

    let isCancelled = false;

    async function generateLampiranPdf() {
      setIsGeneratingPdf(true);
      try {
        const { pdf } = await import('@react-pdf/renderer');
        const { LampiranKprPdf } = await import('@/components/pdf/LampiranKprPdf');

        const blob = await pdf(
          <LampiranKprPdf
            no={selectedLampiran!}
            sale={sale}
            customer={customer}
            bank={bank}
            unit={unit}
            block={block}
            location={location}
          />
        ).toBlob();

        if (!isCancelled) {
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
        }
      } catch (err) {
        console.error('Error generating Lampiran PDF:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingPdf(false);
        }
      }
    }

    generateLampiranPdf();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLampiran, customer, unit, sale]);

  if (!id || !sale || !customer) {
    return (
      <AppLayout>
        <div className="p-8 max-w-lg mx-auto text-center mt-12 bg-white rounded-xl shadow-sm border border-slate-200">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">Data Penjualan / Konsumen Tidak Ditemukan</h2>
          <p className="text-sm text-slate-500 mb-5">
            Pastikan Anda memilih transaksi penjualan yang valid dari daftar penjualan.
          </p>
          <button
            onClick={() => router.push('/penjualan/daftar')}
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition"
          >
            Kembali ke Daftar Penjualan
          </button>
        </div>
      </AppLayout>
    );
  }

  const selectedLampiranItem = LIST_LAMPIRAN.find((l) => l.no === selectedLampiran);

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl mx-auto pb-12">
        {/* ── Breadcrumb Navigation ── */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <button
            onClick={() => router.push(`/penjualan/daftar/${id}`)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Daftar Customer</span>
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-800">Print Persyaratan KPR</span>
        </div>

        {/* ── Card 1: Data Customer ── */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
            <h2 className="text-sm font-bold text-slate-800">Data Customer</h2>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#007bff] hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Ubah Data Customer</span>
            </button>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-slate-700">
            {/* Kolom Kiri: Data Konsumen */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3">Data Konsumen</h3>
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 w-44 font-medium">Nama</td>
                    <td className="py-2.5 font-bold text-slate-800 uppercase">{customer.nama}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 font-medium">Tempat/Tgl Lahir</td>
                    <td className="py-2.5 uppercase font-medium">
                      {customer.tempat_lahir ? `${customer.tempat_lahir}, ` : ''}
                      {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 font-medium">No Telpon</td>
                    <td className="py-2.5 font-medium">{customer.no_hp || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 align-top font-medium">Alamat KTP</td>
                    <td className="py-2.5 align-top font-medium uppercase">{customer.alamat_ktp || customer.alamat || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 align-top font-medium">Alamat Domisili/Kantor</td>
                    <td className="py-2.5 align-top font-medium uppercase">{customer.alamat_domisili || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 font-medium">Pekerjaan</td>
                    <td className="py-2.5 uppercase font-medium">{customer.pekerjaan || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 font-medium">Institusi</td>
                    <td className="py-2.5 uppercase font-medium">{customer.instansi || '-'}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 font-medium">Penghasilan per Bulan</td>
                    <td className="py-2.5 font-semibold text-emerald-700">
                      {customer.pendapatan_per_bulan
                        ? isNaN(Number(customer.pendapatan_per_bulan))
                          ? customer.pendapatan_per_bulan
                          : `Rp ${formatRupiah(Number(customer.pendapatan_per_bulan))}`
                        : '0'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Kolom Kanan: Data Pasangan Konsumen */}
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3">Data Pasangan Konsumen</h3>
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 w-44 font-medium">Nama</td>
                    <td className="py-2.5 font-bold text-slate-800 uppercase">{customer.nama_pasangan || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 font-medium">NIK</td>
                    <td className="py-2.5 font-medium">{customer.nik_pasangan || '-'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 font-medium">Tempat/Tgl Lahir</td>
                    <td className="py-2.5 uppercase font-medium">
                      {customer.tempat_lahir_pasangan ? `${customer.tempat_lahir_pasangan}, ` : ''}
                      {customer.tanggal_lahir_pasangan ? formatTanggalIndonesia(customer.tanggal_lahir_pasangan) : '-'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2.5 text-slate-500 align-top font-medium">Alamat Domisili/Kantor</td>
                    <td className="py-2.5 align-top font-medium uppercase">
                      {customer.alamat_domisili_pasangan || customer.alamat_domisili || customer.alamat_ktp || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-500 font-medium">Pekerjaan</td>
                    <td className="py-2.5 uppercase font-medium">{customer.pekerjaan_pasangan || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Card 2: Print Lampiran ── */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-white">
            <h2 className="text-sm font-bold text-slate-800">Print Lampiran</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#00a896] text-white">
                  <th className="py-3 px-4 w-28 font-bold text-left">No Lampiran</th>
                  <th className="py-3 px-4 font-bold text-left">Keterangan</th>
                  <th className="py-3 px-4 w-28 font-bold text-center">Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {LIST_LAMPIRAN.map((item) => (
                  <tr key={item.no} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-slate-600">{item.no}.</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{item.title}</td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedLampiran(item.no)}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1 bg-[#6f42c1] hover:bg-purple-800 text-white rounded text-[11px] font-semibold transition shadow-xs cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modal Edit Data Konsumen ── */}
      {showEditModal && customer && (
        <UpdateDataKonsumenForm
          customer={customer}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            refresh();
            setShowEditModal(false);
          }}
        />
      )}

      {/* ── Modal Pratinjau PDF Persis Seperti Format SPPR (Ukuran A4 1 Halaman) ── */}
      {selectedLampiran !== null && selectedLampiranItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedLampiran}
                </span>
                <div className="truncate">
                  <h3 className="font-bold text-slate-800 text-sm truncate">
                    {selectedLampiranItem.title}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Ukuran A4 Standar SPPR — Tepat 1 Halaman Utuh
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {pdfUrl && (
                  <button
                    onClick={() => window.open(pdfUrl, '_blank')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold transition"
                    title="Buka PDF di Tab Baru"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Buka Tab Baru</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedLampiran(null);
                    if (pdfUrl) {
                      URL.revokeObjectURL(pdfUrl);
                      setPdfUrl('');
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF Viewer Iframe Persis seperti SPPR */}
            <div className="flex-1 bg-slate-100 relative">
              {isGeneratingPdf ? (
                <div className="w-full h-full flex flex-col gap-3 items-center justify-center bg-slate-50">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-slate-600 font-medium text-sm">Menyiapkan Dokumen PDF A4...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title={selectedLampiranItem.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                  <p className="text-red-500 font-medium text-sm">Gagal menghasilkan dokumen PDF.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}