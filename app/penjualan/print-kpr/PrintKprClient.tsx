'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/lib/data-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { formatTanggalIndonesia } from '@/lib/format';
import { ChevronLeft, Edit, Printer, X, FileText, Check, Eye, Layers, AlertCircle } from 'lucide-react';
import { UpdateDataKonsumenForm } from '@/components/penjualan/forms/UpdateDataKonsumenForm';
import {
  BankPackageType,
  BANK_PACKAGES_CONFIG,
  DocumentItemDef,
  BankKprDocData
} from '@/components/penjualan/lampiran/BankKprDocumentViews';

interface Props {
  id?: string;
  lampiran5?: string;
  pejabat?: string;
  jabatan_pejabat?: string;
  cabang_pks?: string;
  no_pks?: string;
  tgl_pks?: string;
}

export default function PrintKprClient({ id }: Props) {
  const router = useRouter();
  const { sales, customers, units, blocks, locations, banks, refresh } = useData();

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<BankPackageType>('btn_update');
  const [viewMode, setViewMode] = useState<'all' | 'list'>('all');
  const [singleDocPreview, setSingleDocPreview] = useState<DocumentItemDef | null>(null);
  const hasUserSelectedRef = useRef<boolean>(false);

  const sale = sales.find((s) => s.id === id);
  const customer = customers.find((c) => c.id === sale?.customer_id);
  const unit = units.find((u) => u.id === sale?.unit_id);
  const block = blocks.find((b) => b.id === unit?.block_id);
  const location = locations.find((l) => l.id === block?.location_id);
  const bank = banks.find((b) => b.id === sale?.bank_id);

  // Auto-detect package based on bank name ONLY ON INITIAL LOAD if user hasn't chosen manually
  useEffect(() => {
    if (hasUserSelectedRef.current) return;
    if (bank?.nama_bank) {
      const bName = bank.nama_bank.toLowerCase();
      if (bName.includes('bjb')) {
        setSelectedPackage('bjb_update');
      } else if (bName.includes('bri')) {
        setSelectedPackage('bri_update');
      } else if (bName.includes('btn')) {
        setSelectedPackage('btn_update');
      }
    }
  }, [bank]);

  const handleSelectPackage = (pkgKey: BankPackageType) => {
    hasUserSelectedRef.current = true;
    setSelectedPackage(pkgKey);
    setSingleDocPreview(null);
  };

  const docData: BankKprDocData = useMemo(() => ({
    sale,
    customer: customer!,
    bank,
    unit,
    block,
    location
  }), [sale, customer, bank, unit, block, location]);

  const activeConfig = BANK_PACKAGES_CONFIG[selectedPackage];

  const handlePrintAll = () => {
    setViewMode('all');
    setSingleDocPreview(null);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handlePrintSingle = (doc: DocumentItemDef) => {
    setSingleDocPreview(doc);
    setTimeout(() => {
      window.print();
    }, 250);
  };

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

  return (
    <AppLayout>
      {/* ── Print CSS styles ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, nav, aside, .app-sidebar, .app-header, button {
            display: none !important;
          }
          .print-container {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .kpr-page {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 12mm 15mm !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
        }
      `}} />

      <div className="space-y-4 max-w-7xl mx-auto pb-16 no-print">
        {/* ── Breadcrumb Navigation ── */}
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <button
              onClick={() => router.push(`/penjualan/daftar/${id}`)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Daftar Customer</span>
            </button>
            <span>/</span>
            <span className="font-semibold text-slate-800">Cetak Dokumen Persyaratan KPR</span>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Ubah Data Customer</span>
          </button>
        </div>

        {/* ── Card 1: Data Customer Ringkas ── */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Informasi Transaksi & Debitur</h2>
            <span className="text-xs text-slate-500 font-medium">
              Unit: <strong className="text-slate-800">{block?.nama_blok || 'S22'} NO. {unit?.no_unit || '09'}</strong> ({location?.nama_lokasi || 'Benteng Mutiara Mas'})
            </span>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            <div>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 w-36 font-medium">Nama Pemohon</td><td className="py-1 font-bold text-slate-800 uppercase">{customer.nama}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">NIK</td><td className="py-1 font-mono font-medium">{customer.nik || '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">Tempat/Tgl Lahir</td><td className="py-1 uppercase">{customer.tempat_lahir || '-'}, {customer.tanggal_lahir ? formatTanggalIndonesia(customer.tanggal_lahir) : '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">Pekerjaan</td><td className="py-1 uppercase">{customer.pekerjaan || '-'}</td></tr>
                  <tr><td className="py-1 text-slate-500 font-medium">No. Telepon</td><td className="py-1">{customer.no_hp || '-'}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 w-36 font-medium">Nama Pasangan</td><td className="py-1 font-bold text-slate-800 uppercase">{customer.nama_pasangan || '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">NIK Pasangan</td><td className="py-1 font-mono font-medium">{(customer as any)?.nik_pasangan || '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">Tempat/Tgl Lahir</td><td className="py-1 uppercase">{(customer as any)?.tempat_lahir_pasangan || '-'}, {(customer as any)?.tanggal_lahir_pasangan ? formatTanggalIndonesia((customer as any).tanggal_lahir_pasangan) : '-'}</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-1 text-slate-500 font-medium">Pekerjaan Pasangan</td><td className="py-1 uppercase">{(customer as any)?.pekerjaan_pasangan || 'MENGURUS RUMAH TANGGA'}</td></tr>
                  <tr><td className="py-1 text-slate-500 font-medium">Bank Akad</td><td className="py-1 font-semibold text-blue-700">{bank?.nama_bank || 'Bank BTN'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Card 2: Pilihan Paket Bank & Aksi Cetak Semua ── */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-2xs p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <span>Pilih Format Paket Dokumen Bank</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih salah satu bank di bawah ini untuk menampilkan dan mencetak semua berkas persyaratan sekaligus.
              </p>
            </div>

            {/* Tombol Cetak Semua */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <button
                onClick={handlePrintAll}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Semua Dokumen ({activeConfig.docs.length} Halaman)</span>
              </button>
            </div>
          </div>

          {/* 4 Pilihan Paket Bank (Tabs) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {(Object.keys(BANK_PACKAGES_CONFIG) as BankPackageType[]).map((pkgKey) => {
              const cfg = BANK_PACKAGES_CONFIG[pkgKey];
              const isSelected = selectedPackage === pkgKey;
              return (
                <button
                  key={pkgKey}
                  onClick={() => handleSelectPackage(pkgKey)}
                  className={`flex flex-col items-start p-3 rounded-lg border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                      {cfg.title}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{cfg.subtitle}</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-2">
                    {cfg.docs.length} Dokumen Lampiran
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Package Confirmation Banner */}
          <div className="mt-3 p-2.5 bg-indigo-50 border border-indigo-100 rounded-md flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-indigo-900">Paket Aktif:</span>
              <span className="font-bold uppercase px-2 py-0.5 rounded bg-indigo-600 text-white text-[11px]">
                {activeConfig.title}
              </span>
              <span className="text-slate-600">
                — Hanya <strong>{activeConfig.docs.length} dokumen</strong> milik <strong>{activeConfig.title}</strong> yang akan dicetak. Dokumen bank lain tidak akan ikut terdorong.
              </span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Mode Tampilan:</span>
              <div className="inline-flex rounded-md shadow-2xs border border-slate-200 p-0.5 bg-slate-50">
                <button
                  onClick={() => { setViewMode('all'); setSingleDocPreview(null); }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'all' && !singleDocPreview ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua Halaman ({activeConfig.docs.length})
                </button>
                <button
                  onClick={() => { setViewMode('list'); setSingleDocPreview(null); }}
                  className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                    viewMode === 'list' && !singleDocPreview ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Daftar Tabel
                </button>
              </div>
            </div>

            <span className="text-slate-400 text-[11px] hidden sm:inline">
              *Setiap dokumen otomatis dipisah pas 1 lembar A4 saat dicetak (Ctrl + P)
            </span>
          </div>
        </div>

        {/* ── Mode 1: Daftar Tabel Dokumen ── */}
        {viewMode === 'list' && !singleDocPreview && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 uppercase">
                Daftar Dokumen Paket: <span className="text-indigo-700">{activeConfig.title}</span>
              </h3>
              <button
                onClick={handlePrintAll}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Semua</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-4 w-12 text-center font-bold">No</th>
                    <th className="py-2.5 px-4 w-36 font-bold">Kode</th>
                    <th className="py-2.5 px-4 font-bold">Nama Dokumen</th>
                    <th className="py-2.5 px-4 w-44 text-center font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeConfig.docs.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-indigo-700">{doc.code}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{doc.title}</td>
                      <td className="py-2.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSingleDocPreview(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Lihat</span>
                          </button>
                          <button
                            onClick={() => handlePrintSingle(doc)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-[11px] transition shadow-2xs cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── AREA CETAK / PRATINJAU DOKUMEN ── */}
      {/* Jika dalam mode Single Doc Preview */}
      {singleDocPreview && (
        <div className="max-w-5xl mx-auto pb-16">
          <div className="bg-slate-800 text-white p-3 rounded-lg flex items-center justify-between mb-4 no-print shadow-md">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSingleDocPreview(null)}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold cursor-pointer"
              >
                ← Kembali ke Semua Dokumen
              </button>
              <span className="text-xs text-slate-300">Menampilkan 1 Dokumen: <strong>{singleDocPreview.title}</strong></span>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Halaman Ini</span>
            </button>
          </div>

          <div className="print-container">
            <singleDocPreview.component data={docData} />
          </div>
        </div>
      )}

      {/* Jika dalam mode Semua Halaman (All Pages View) */}
      {viewMode === 'all' && !singleDocPreview && (
        <div className="print-container space-y-6">
          <div className="text-center py-2 bg-indigo-50 border border-indigo-200 rounded-md text-xs text-indigo-900 font-semibold mb-6 max-w-4xl mx-auto no-print">
            Menampilkan seluruh dokumen paket <strong>{activeConfig.title}</strong> ({activeConfig.docs.length} halaman). Klik tombol <span className="underline font-bold">Cetak Semua Dokumen</span> di atas untuk langsung mencetak atau simpan sebagai PDF.
          </div>

          {activeConfig.docs.map((docItem, index) => {
            const DocComponent = docItem.component;
            return (
              <div key={docItem.id} className="relative">
                <div className="no-print text-center text-xs font-bold text-slate-500 mb-1">
                  — Halaman {index + 1} dari {activeConfig.docs.length}: {docItem.title} —
                </div>
                <DocComponent
                  data={docData}
                  pageNum={index + 1}
                  totalPages={activeConfig.docs.length}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Ubah Data Konsumen ── */}
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
    </AppLayout>
  );
}