'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { createClient } from '@/lib/supabase/client';
import { ChevronRight, Settings, Printer, Phone, Upload, Eye, FileText, CheckCircle, Clock } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { SaleAdditionalCost, SalePayment, SaleBillingLetter, SaleStepHistory } from '@/types';
import { CetakSerahTerimaKunciForm } from '@/components/penjualan/forms/CetakSerahTerimaKunciForm';
import { CetakSuratKomplenForm } from '@/components/penjualan/forms/CetakSuratKomplenForm';
import { PindahUnitForm } from '@/components/penjualan/forms/PindahUnitForm';
import { UpdateMarketerForm } from '@/components/penjualan/forms/UpdateMarketerForm';
import { UpdateBiayaTambahanForm } from '@/components/penjualan/forms/UpdateBiayaTambahanForm';
import { UpdateDataKonsumenForm } from '@/components/penjualan/forms/UpdateDataKonsumenForm';
import { CetakPersyaratanKprForm } from '@/components/penjualan/forms';

export default function DetailPenjualanPage() {
  const { id } = useParams() as { id: string };
  const { sales, customers, units, marketers, locations, blocks, banks, currentUser } = useData();
  const supabase = createClient();
  const router = useRouter();

  // Sale Data
  const sale = useMemo(() => sales.find(s => s.id === id), [sales, id]);
  const customer = useMemo(() => customers.find(c => c.id === sale?.customer_id), [customers, sale]);
  const unit = useMemo(() => units.find(u => u.id === sale?.unit_id), [units, sale]);
  const marketer = useMemo(() => marketers.find(m => m.id === sale?.marketer_id), [marketers, sale]);

  // Additional Data States
  const [additionalCosts, setAdditionalCosts] = useState<SaleAdditionalCost[]>([]);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [billingLetters, setBillingLetters] = useState<SaleBillingLetter[]>([]);
  const [stepHistory, setStepHistory] = useState<SaleStepHistory[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  // Tab State
  const [activeTab, setActiveTab] = useState('angsuran');

  // Modal States
  const [showPotonganModal, setShowPotonganModal] = useState(false);
  const [showBiayaModal, setShowBiayaModal] = useState(false);
  const [showSerahTerimaModal, setShowSerahTerimaModal] = useState(false);
  const [showKomplenModal, setShowKomplenModal] = useState(false);
  const [showPersyaratanModal, setShowPersyaratanModal] = useState(false);
  const [showPindahUnitModal, setShowPindahUnitModal] = useState(false);
  const [showUpdateMarketerModal, setShowUpdateMarketerModal] = useState(false);
  const [showUpdateKonsumenModal, setShowUpdateKonsumenModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [potonganForm, setPotonganForm] = useState({ nominal: '', keterangan: '' });

  const handleSavePotongan = async () => {
    if (!potonganForm.nominal) return;
    setSaving(true);
    await supabase.from('sales').update({ potongan: Number(potonganForm.nominal.replace(/\D/g,'')) }).eq('id', id);
    setShowPotonganModal(false); setPotonganForm({ nominal: '', keterangan: '' });
    setSaving(false); window.location.reload();
  };

  useEffect(() => {
    async function loadExtra() {
      if (!id) return;
      setLoadingExtra(true);
      const [acRes, payRes, billRes, histRes] = await Promise.all([
        supabase.from('sale_additional_costs').select('*').eq('sale_id', id),
        supabase.from('sale_payments').select('*').eq('sale_id', id).order('tanggal', { ascending: true }),
        supabase.from('sale_billing_letters').select('*').eq('sale_id', id),
        supabase.from('sale_step_history').select('*, users(nama)').eq('sale_id', id).order('created_at', { ascending: false })
      ]);

      if (acRes.data) setAdditionalCosts(acRes.data);
      if (payRes.data) setPayments(payRes.data);
      if (billRes.data) setBillingLetters(billRes.data);
      if (histRes.data) {
        setStepHistory(histRes.data.map((h: any) => ({
          ...h,
          changed_by_nama: h.users?.nama || 'System'
        })));
      }
      setLoadingExtra(false);
    }
    loadExtra();
  }, [id, supabase]);

  if (!sale) return <AppLayout><div className="p-8 text-center text-slate-500">Loading atau data tidak ditemukan...</div></AppLayout>;

  // Calculations
  const totalBiayaTambahan = additionalCosts.reduce((sum, item) => sum + (item.nominal || 0), 0);
  const totalHargaFinal = (sale.harga_jual_awal || sale.total_harga) - (sale.potongan || 0) + totalBiayaTambahan;
  const uangMasuk = payments.reduce((sum, item) => sum + (item.nominal || 0), 0);
  const sisaTagihan = totalHargaFinal - uangMasuk;

  // Render Tabs
  const TABS = [
    { id: 'penjualan', label: 'Step Penjualan' },
    { id: 'sertifikat', label: 'Step Sertifikat' },
    { id: 'posisi_sertifikat', label: 'Posisi Sertifikat' },
    { id: 'marketing_fee', label: 'Pencairan Marketing Fee' },
    { id: 'angsuran', label: 'Angsuran Konsumen' },
  ];

  return (
    <>
    <AppLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-6">
        <Link href="/penjualan/daftar" className="hover:underline">Daftar Penjualan</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500">Detail Penjualan</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">Informasi Penjualan</h1>
        <div className="relative group">
          <button className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md font-semibold text-sm transition">
            <Settings className="w-4 h-4" />
            <span>Kumpulan Aksi</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 py-1">
            <button onClick={() => setShowPersyaratanModal(true)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
              <Printer className="w-3.5 h-3.5" /> Cetak Persyaratan KPR
            </button>
            <button onClick={() => window.open(`/penjualan/print-sppr?id=${id}`)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
              <Printer className="w-3.5 h-3.5" /> Cetak SPPR
            </button>
            <button onClick={() => setShowSerahTerimaModal(true)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
              <Printer className="w-3.5 h-3.5" /> Cetak Serah Terima Kunci
            </button>
            <button onClick={() => setShowKomplenModal(true)} className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 border-b border-slate-100">
              <Printer className="w-3.5 h-3.5" /> Cetak Surat Komplen
            </button>
            <button onClick={() => setShowPindahUnitModal(true)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium mt-1">Pindah Unit</button>
            <button onClick={() => setShowUpdateMarketerModal(true)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium">Update Marketer</button>
            <button onClick={() => setShowBiayaModal(true)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium">Update Biaya Tambahan</button>
            <button onClick={() => setShowUpdateKonsumenModal(true)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 font-medium">Update Data Konsumen</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Section Konsumen */}
        <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col">
          <div className="bg-teal-600 px-4 py-2.5">
            <h2 className="text-white font-bold text-sm tracking-wide">Konsumen</h2>
          </div>
          <div className="p-4 space-y-3 text-sm flex-1">
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">Nama</span><span>:</span>
              <span className="font-bold text-slate-800">{customer?.nama || '-'}</span>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">No Handphone</span><span>:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{customer?.no_hp || '-'}</span>
                {customer?.no_hp && (
                  <a href={`https://wa.me/${customer.no_hp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 hover:bg-green-100 transition">
                    <Phone className="w-3 h-3" /> Hubungi
                  </a>
                )}
              </div>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">Email</span><span>:</span>
              <span>{customer?.email || '-'}</span>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">Domisili</span><span>:</span>
              <span>{customer?.domisili || customer?.alamat || '-'}</span>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">NPWP</span><span>:</span>
              <span>{customer?.npwp || '-'}</span>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">Scan KTP</span><span>:</span>
              <span>{customer?.scan_ktp_url ? <a href={customer.scan_ktp_url} target="_blank" className="text-blue-600 hover:underline">Lihat File</a> : '-'}</span>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">Scan KK</span><span>:</span>
              <span>{customer?.scan_kk_url ? <a href={customer.scan_kk_url} target="_blank" className="text-blue-600 hover:underline">Lihat File</a> : '-'}</span>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center gap-4 text-xs font-semibold text-blue-600">
            <button className="flex items-center gap-1.5 hover:underline"><Upload className="w-3.5 h-3.5" /> Upload Dokumen Ktp & Kk</button>
            <Link href="/kontak/customer" className="flex items-center gap-1.5 hover:underline"><Eye className="w-3.5 h-3.5" /> Detail Konsumen</Link>
          </div>
        </div>

        {/* Section Unit & Penjualan (Stacked) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
            <div className="bg-teal-600 px-4 py-2.5">
              <h2 className="text-white font-bold text-sm tracking-wide">Unit</h2>
            </div>
            <div className="p-4 space-y-2.5 text-sm">
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Jenis Rumah</span><span>:</span>
                <span className="font-bold text-slate-800">{unit?.subsidy_type_nama || '-'}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Lokasi</span><span>:</span>
                <span className="font-bold text-slate-800">{unit?.location_nama || '-'}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Blok</span><span>:</span>
                <span className="font-bold text-slate-800">{unit?.block_nama || '-'}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">No Unit</span><span>:</span>
                <span className="font-bold text-slate-800">{unit?.no_unit || '-'}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Tipe</span><span>:</span>
                <span className="font-bold text-slate-800">{unit?.unit_type_nama || '-'}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">NOP</span><span>:</span>
                <span>{unit?.nop || '-'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
            <div className="bg-teal-600 px-4 py-2.5">
              <h2 className="text-white font-bold text-sm tracking-wide">Penjualan</h2>
            </div>
            <div className="p-4 space-y-2.5 text-sm">
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">No Penjualan</span><span>:</span>
                <span className="font-bold text-red-600">{sale.no_penjualan || '-'}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Tgl Penjualan</span><span>:</span>
                <span className="font-bold text-slate-800">{sale.tanggal_akad || sale.tanggal_booking ? new Date(sale.tanggal_akad || sale.tanggal_booking).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Jenis Penjualan</span><span>:</span>
                <span className="font-bold text-slate-800">{sale.metode_bayar}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Marketer</span><span>:</span>
                <span className="font-bold text-slate-800">{marketer?.nama || '-'}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-600">Harga Jual Awal</span><span>:</span>
                <span>{formatRupiah(sale.harga_jual_awal || sale.total_harga)}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Potongan</span><span>:</span>
                <span className="text-red-500">- {formatRupiah(sale.potongan || 0)}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Biaya Tambahan</span><span>:</span>
                <span className="text-green-600">+ {formatRupiah(totalBiayaTambahan)}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-800">Harga Jual Final</span><span>:</span>
                <span className="font-bold text-slate-800">{formatRupiah(totalHargaFinal)}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Uang Masuk</span><span>:</span>
                <span className="text-blue-600 font-bold">{formatRupiah(uangMasuk)}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                <span className="font-bold text-red-600">Sisa Tagihan</span><span>:</span>
                <span className="font-bold text-red-600">{formatRupiah(sisaTagihan)}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-600">Harga Jual (PAJAK)</span><span>:</span>
                <div className="flex items-center gap-2">
                  <span>{formatRupiah(sale.harga_jual_pajak || 0)}</span>
                  <button className="text-[10px] text-blue-600 hover:underline">(Ubah Harga)</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-left px-4 py-3 text-sm font-semibold rounded-md transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <h3 className="font-bold text-lg text-slate-800">{TABS.find(t => t.id === activeTab)?.label}</h3>
            {activeTab === 'angsuran' && (
              <div className="flex gap-2">
                <button onClick={() => setShowPotonganModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-semibold">+ Input Potongan</button>
                <button onClick={() => setShowBiayaModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-semibold">+ Input Biaya Tambahan</button>
              </div>
            )}
          </div>

          {activeTab === 'angsuran' ? (
            <div className="space-y-6">
              {/* Summary Angsuran */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center">
                  <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Tagihan</p>
                  <p className="text-xl font-bold text-slate-800">{formatRupiah(totalHargaFinal)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-center">
                  <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">Sudah Dibayar</p>
                  <p className="text-xl font-bold text-blue-700">{formatRupiah(uangMasuk)}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-md border border-red-200 text-center">
                  <p className="text-xs font-semibold text-red-600 mb-1 uppercase tracking-wider">Sisa</p>
                  <p className="text-xl font-bold text-red-700">{formatRupiah(sisaTagihan)}</p>
                </div>
              </div>

              {/* Daftar Pembayaran */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Daftar Pembayaran</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border border-slate-200">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 w-12 text-center">No</th>
                        <th className="px-4 py-2 w-32">Tanggal</th>
                        <th className="px-4 py-2">No Kwitansi & Deskripsi</th>
                        <th className="px-4 py-2 text-right">Nominal</th>
                        <th className="px-4 py-2 w-20 text-center">Cetak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-4 text-slate-500">Belum ada pembayaran.</td></tr>
                      ) : (
                        payments.map((p, i) => (
                          <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-2 text-center">{i + 1}</td>
                            <td className="px-4 py-2">{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-2">
                              <div className="font-bold text-slate-800">{p.no_kwitansi}</div>
                              <div className="text-xs text-slate-500">{p.deskripsi}</div>
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-green-600">{formatRupiah(p.nominal)}</td>
                            <td className="px-4 py-2 text-center">
                              <button className="p-1 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded" title="Cetak Kwitansi"><Printer className="w-4 h-4 mx-auto" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                      {payments.length > 0 && (
                        <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                          <td colSpan={3} className="px-4 py-3 text-right">TOTAL PEMBAYARAN</td>
                          <td className="px-4 py-3 text-right text-blue-700">{formatRupiah(uangMasuk)}</td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Daftar Surat Tagihan */}
              <div className="pt-4 mt-6 border-t border-dashed border-slate-300">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-amber-500" /> Daftar Surat Tagihan</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border border-slate-200">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2">Tgl Tagihan</th>
                        <th className="px-4 py-2">Jatuh Tempo</th>
                        <th className="px-4 py-2 text-right">Kekurangan</th>
                        <th className="px-4 py-2 w-20 text-center">Cetak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingLetters.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-4 text-slate-500">Tidak ada surat tagihan.</td></tr>
                      ) : (
                        billingLetters.map((b) => (
                          <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-2">{new Date(b.tgl_tagihan).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-2 text-red-600 font-medium">{new Date(b.jatuh_tempo).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-2 text-right font-semibold">{formatRupiah(b.kekurangan)}</td>
                            <td className="px-4 py-2 text-center">
                              <button className="p-1 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded" title="Cetak Surat"><Printer className="w-4 h-4 mx-auto" /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Timeline display for other tabs */}
              <div className="border-l-2 border-slate-200 ml-3 pl-4 space-y-6 mt-4">
                {stepHistory.filter(h => h.jenis_step === activeTab).length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Belum ada riwayat aktivitas.</p>
                ) : (
                  stepHistory.filter(h => h.jenis_step === activeTab).map((hist, idx) => (
                    <div key={hist.id} className="relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 bg-blue-500 rounded-full border-[3px] border-white shadow-sm" />
                      <div className="mb-0.5 flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{hist.status}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{new Date(hist.created_at).toLocaleString('id-ID')}</span>
                      </div>
                      <p className="text-sm text-slate-600">{hist.keterangan || 'Tidak ada keterangan tambahan.'}</p>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Diupdate oleh: {hist.changed_by_nama}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>

      {/* Modal Potongan */}
      {showPotonganModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Input Potongan Harga</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nominal Potongan (Rp) *</label>
                <input type="text" placeholder="Contoh: 5.000.000" value={potonganForm.nominal}
                  onChange={e => setPotonganForm({...potonganForm, nominal: e.target.value.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.')})}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Keterangan</label>
                <input type="text" placeholder="Alasan potongan..." value={potonganForm.keterangan}
                  onChange={e => setPotonganForm({...potonganForm, keterangan: e.target.value})}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowPotonganModal(false)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold">Batal</button>
              <button onClick={handleSavePotongan} disabled={saving} className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Biaya Tambahan */}
      {showBiayaModal && (
        <UpdateBiayaTambahanForm 
          saleId={id} 
          onClose={() => setShowBiayaModal(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}

      {/* Modal Serah Terima */}
      {showSerahTerimaModal && (
        <CetakSerahTerimaKunciForm 
          saleId={id} 
          onClose={() => setShowSerahTerimaModal(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}

      {/* Modal Komplen */}
      {showKomplenModal && (
        <CetakSuratKomplenForm 
          saleId={id} 
          onClose={() => setShowKomplenModal(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}

      {/* Modal Pindah Unit */}
      {showPindahUnitModal && (
        <PindahUnitForm 
          sale={sale}
          currentUnit={unit}
          locations={locations}
          blocks={blocks}
          units={units}
          onClose={() => setShowPindahUnitModal(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}

      {/* Modal Update Marketer */}
      {showUpdateMarketerModal && (
        <UpdateMarketerForm 
          sale={sale}
          currentMarketer={marketer}
          marketers={marketers}
          onClose={() => setShowUpdateMarketerModal(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}

      {/* Modal Update Data Konsumen */}
      {showUpdateKonsumenModal && customer && (
        <UpdateDataKonsumenForm 
          customer={customer}
          onClose={() => setShowUpdateKonsumenModal(false)} 
          onSuccess={() => window.location.reload()} 
        />
      )}

      {/* Modal Cetak Persyaratan KPR */}
      {showPersyaratanModal && customer && (
        <CetakPersyaratanKprForm 
          saleId={id}
          customer={customer}
          bank={banks.find(b => b.id === sale?.bank_id)}
          onClose={() => setShowPersyaratanModal(false)}
        />
      )}
  </>
  );
}
