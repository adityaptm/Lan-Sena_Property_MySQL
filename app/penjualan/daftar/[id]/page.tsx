'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { createClient } from '@/lib/supabase/client';
import { ChevronRight, Settings, Printer, Phone, Upload, Eye, FileText, CheckCircle, Clock, Edit3, Trash2 } from 'lucide-react';
import { formatRupiah } from '@/lib/format';
import { SaleAdditionalCost, SalePayment, SaleBillingLetter, SaleStepHistory } from '@/types';
import { CetakSerahTerimaKunciForm } from '@/components/penjualan/forms/CetakSerahTerimaKunciForm';
import { CetakSuratKomplenForm } from '@/components/penjualan/forms/CetakSuratKomplenForm';
import { PindahUnitForm } from '@/components/penjualan/forms/PindahUnitForm';
import { UpdateMarketerForm } from '@/components/penjualan/forms/UpdateMarketerForm';
import { UpdateBiayaTambahanForm } from '@/components/penjualan/forms/UpdateBiayaTambahanForm';
import { UpdateDataKonsumenForm } from '@/components/penjualan/forms/UpdateDataKonsumenForm';
import { CetakPersyaratanKprForm } from '@/components/penjualan/forms';

// Daftar rekening tujuan uang masuk (sesuaikan lagi kalau ada rekening baru)
const REKENING_OPTIONS = [
  'Bank BJB Purwakarta',
  'Bank BNI',
  'Bank BRI',
  'Bank BTN KC Karawang',
  'Bank BTN KC Purwakarta',
  'Bank Mandiri',
  'Bank Syariah Indonesia',
  'BPRS HIK Cibitung',
  'BTN KC SUBANG',
  'Kas Kantor',
];

// Ubah nomor HP lokal (08xx / +62 / 62) jadi format internasional murni angka untuk wa.me
function toWaNumber(phone: string): string {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (!digits.startsWith('62')) {
    digits = '62' + digits;
  }
  return digits;
}

export default function DetailPenjualanPage() {
  const { id } = useParams() as { id: string };
  const { sales, customers, units, marketers, locations, blocks, banks, currentUser, salesSteps, certificateSteps } = useData();
  const supabase = createClient();
  const router = useRouter();

  // Sale Data
  const sale = useMemo(() => sales.find(s => s.id === id), [sales, id]);
  const customer = useMemo(() => customers.find(c => c.id === sale?.customer_id), [customers, sale]);
  const unit = useMemo(() => units.find(u => u.id === sale?.unit_id), [units, sale]);
  const marketer = useMemo(() => marketers.find(m => m.id === sale?.marketer_id), [marketers, sale]);
  const bank = useMemo(() => banks.find(b => b.id === sale?.bank_id), [banks, sale]);

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
  const [showProgresModal, setShowProgresModal] = useState(false);
  const [showUbahHargaModal, setShowUbahHargaModal] = useState(false);
  const [showAngsuranModal, setShowAngsuranModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [potonganForm, setPotonganForm] = useState({ nominal: '', keterangan: '' });
  const [progresForm, setProgresForm] = useState({ status: '', keterangan: '' });
  const [hargaPajakForm, setHargaPajakForm] = useState('');
  const [angsuranForm, setAngsuranForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    bank_tujuan: '',
    nominal: '',
    diterima_dari: '',
    keterangan: '',
  });

  // Menyimpan id payment yang sedang diedit. null = mode tambah baru.
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const openAngsuranModal = () => {
    setEditingPaymentId(null);
    setAngsuranForm({
      tanggal: new Date().toISOString().slice(0, 10),
      bank_tujuan: '',
      nominal: '',
      diterima_dari: customer?.nama || '',
      keterangan: '',
    });
    setShowAngsuranModal(true);
  };

  // Buka modal Angsuran dalam mode edit, isi form dari data payment yang dipilih
  const openEditAngsuranModal = (p: SalePayment) => {
    setEditingPaymentId(p.id);
    setAngsuranForm({
      tanggal: p.tanggal,
      bank_tujuan: p.bank_tujuan || '',
      nominal: String(p.nominal).replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      diterima_dari: p.diterima_dari || '',
      keterangan: p.deskripsi || '',
    });
    setShowAngsuranModal(true);
  };

  // Hapus data pembayaran (angsuran) berdasarkan id
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Yakin ingin menghapus data pembayaran ini? Nominal ini akan hilang dari total yang sudah dibayar.')) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('sale_payments').delete().eq('id', paymentId);
      if (error) throw error;
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus pembayaran.');
      setSaving(false);
    }
  };

  const handleSavePotongan = async () => {
    if (!potonganForm.nominal) return;
    setSaving(true);
    await supabase.from('sales').update({ potongan: Number(potonganForm.nominal.replace(/\D/g,'')) }).eq('id', id);
    setShowPotonganModal(false); setPotonganForm({ nominal: '', keterangan: '' });
    setSaving(false); window.location.reload();
  };

  const handleSaveAngsuran = async () => {
    if (!angsuranForm.tanggal || !angsuranForm.bank_tujuan || !angsuranForm.nominal || !angsuranForm.diterima_dari) {
      alert('Tanggal, Uang Masuk ke, Sebesar, dan Diterima Dari wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const nominalValue = Number(angsuranForm.nominal.replace(/\D/g, ''));
      const deskripsi = angsuranForm.keterangan || `Diterima dari ${angsuranForm.diterima_dari} — masuk ke ${angsuranForm.bank_tujuan}`;

      if (editingPaymentId) {
        // MODE EDIT: update data yang sudah ada, no_kwitansi tidak berubah
        const { error } = await supabase
          .from('sale_payments')
          .update({
            tanggal: angsuranForm.tanggal,
            bank_tujuan: angsuranForm.bank_tujuan,
            diterima_dari: angsuranForm.diterima_dari,
            deskripsi,
            nominal: nominalValue,
          })
          .eq('id', editingPaymentId);
        if (error) throw error;
        setShowAngsuranModal(false);
        setEditingPaymentId(null);
        window.location.reload();
        return;
      }

      // MODE TAMBAH BARU (perilaku lama, tidak berubah)
      const noKwitansi = `INV/INCOME/${new Date(angsuranForm.tanggal).getFullYear()}/${String(new Date(angsuranForm.tanggal).getMonth() + 1).padStart(2, '0')}/${String(payments.length + 1).padStart(4, '0')}`;

      const { data: inserted, error } = await supabase.from('sale_payments').insert({
        sale_id: id,
        tanggal: angsuranForm.tanggal,
        no_kwitansi: noKwitansi,
        bank_tujuan: angsuranForm.bank_tujuan,
        diterima_dari: angsuranForm.diterima_dari,
        deskripsi,
        nominal: nominalValue,
      }).select().single();
      if (error) throw error;

      setShowAngsuranModal(false);
      // Buka halaman cetak kwitansi di tab baru
      if (inserted?.id) {
        window.open(`/penjualan/print-kwitansi?payment_id=${inserted.id}&sale_id=${id}`, '_blank');
      }
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan angsuran.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProgres = async () => {
    if (!progresForm.status) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('sale_step_history').insert({
        sale_id: id,
        jenis_step: activeTab as any,
        status: progresForm.status,
        keterangan: progresForm.keterangan || '',
        changed_by: currentUser?.id
      });
      if (error) throw error;

      // Update unit step
      if (activeTab === 'penjualan' && sale?.unit_id) {
        const selectedStep = salesSteps.find(s => s.nama_step === progresForm.status);
        if (selectedStep) {
          await supabase.from('units').update({ sales_step_id: selectedStep.id }).eq('id', sale.unit_id);
        }
      } else if (activeTab === 'sertifikat' && sale?.unit_id) {
        const selectedStep = certificateSteps.find(c => c.nama_step === progresForm.status);
        if (selectedStep) {
          await supabase.from('units').update({ certificate_step_id: selectedStep.id }).eq('id', sale.unit_id);
        }
      }

      alert('Progres berhasil disimpan.');
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan progres.');
    } finally {
      setSaving(false);
      setShowProgresModal(false);
      setProgresForm({ status: '', keterangan: '' });
    }
  };

  const handleSaveHargaPajak = async () => {
    setSaving(true);
    try {
      const nominalValue = Number(hargaPajakForm.replace(/\D/g, ''));
      const { error } = await supabase
        .from('sales')
        .update({ harga_jual_pajak: nominalValue })
        .eq('id', id);

      if (error) throw error;
      alert('Harga Pajak berhasil diperbarui.');
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah harga.');
    } finally {
      setSaving(false);
      setShowUbahHargaModal(false);
    }
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

  // Pesan WhatsApp otomatis ke konsumen terkait unit ini
  const waMessage = encodeURIComponent(
    `Halo ${customer?.nama || ''}, saya dari tim Lansena Property terkait unit ${unit?.no_unit ? 'No. ' + unit.no_unit : ''}${unit?.block_nama ? ' Blok ' + unit.block_nama : ''}${unit?.location_nama ? ' di ' + unit.location_nama : ''}. Mohon waktunya sebentar ya, terima kasih.`
  );

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
                  <a
                    href={`https://wa.me/${toWaNumber(customer.no_hp)}?text=${waMessage}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200 hover:bg-green-100 transition"
                  >
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
              <div className="grid grid-cols-[130px_10px_1fr] pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-600">Maksimal Kredit</span><span>:</span>
                <span className="font-bold text-slate-800">{formatRupiah(unit?.maksimal_kredit || 0)}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Uang Muka</span><span>:</span>
                <span className="font-bold text-slate-800">{formatRupiah(unit?.uang_muka || 0)}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Booking Fee</span><span>:</span>
                <span className="font-bold text-slate-800">{formatRupiah(unit?.booking_fee || 0)}</span>
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
                <span className="font-bold text-slate-800">{sale.metode_bayar}{sale.kpr_status ? ` (${sale.kpr_status})` : ''}</span>
              </div>
              {sale.metode_bayar === 'KPR' && (
                <>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span className="font-semibold text-slate-600">Bank KPR</span><span>:</span>
                    <span className="font-bold text-slate-800">{bank?.nama_bank || sale.bank_nama || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span className="font-semibold text-slate-600">Kredit Pengajuan</span><span>:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(sale.kredit_pengajuan || unit?.maksimal_kredit || 0)}</span>
                  </div>
                </>
              )}
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Marketer</span><span>:</span>
                <span className="font-bold text-slate-800">{marketer?.nama || '-'}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Fee Marketer</span><span>:</span>
                <span className="font-bold text-slate-800">{formatRupiah(sale.fee_marketer || 0)}</span>
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
              <div className="grid grid-cols-[160px_10px_1fr]">
                <span className="font-semibold text-slate-600">Biaya Tambahan Ket.</span><span>:</span>
                <span>{additionalCosts.map(a => a.keterangan).filter(Boolean).join(', ') || '-'}</span>
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
                <span className="font-semibold text-slate-600">Komitmen Pembayaran</span><span>:</span>
                <span className="font-medium text-slate-800">{sale.komitmen_pembayaran || '-'}</span>
              </div>
              <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-600">Harga Jual (PAJAK)</span><span>:</span>
                <div className="flex items-center gap-2">
                  <span>{formatRupiah(sale.harga_jual_pajak || 0)}</span>
                  <button
                    onClick={() => {
                      setHargaPajakForm(String(sale.harga_jual_pajak || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
                      setShowUbahHargaModal(true);
                    }}
                    className="text-[10px] text-blue-600 hover:underline"
                  >
                    (Ubah Harga)
                  </button>
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
                <button onClick={openAngsuranModal} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold">+ Input Angsuran Baru</button>
                <button onClick={() => setShowPotonganModal(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-semibold">+ Input Potongan</button>
                <button onClick={() => setShowBiayaModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-semibold">+ Input Biaya Tambahan</button>
              </div>
            )}
            {(activeTab === 'penjualan' || activeTab === 'sertifikat' || activeTab === 'posisi_sertifikat') && (
              <button
                onClick={() => setShowProgresModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
              >
                + Input Progres
              </button>
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
                        <th className="px-4 py-2 w-28 text-center">Aksi</th>
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
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => window.open(`/penjualan/print-kwitansi?payment_id=${p.id}&sale_id=${id}`, '_blank')}
                                  className="p-1 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded"
                                  title="Cetak Kwitansi"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditAngsuranModal(p)}
                                  className="p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded"
                                  title="Edit"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePayment(p.id)}
                                  className="p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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

      {/* Modal Input / Edit Angsuran */}
      {showAngsuranModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">{editingPaymentId ? 'Edit Data Pembayaran' : 'Form Input Cicilan'}</h3>
              <button
                onClick={() => { setShowAngsuranModal(false); setEditingPaymentId(null); }}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal *</label>
                <input
                  type="date"
                  value={angsuranForm.tanggal}
                  onChange={e => setAngsuranForm({ ...angsuranForm, tanggal: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Uang Masuk ke *</label>
                <select
                  value={angsuranForm.bank_tujuan}
                  onChange={e => setAngsuranForm({ ...angsuranForm, bank_tujuan: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Rekening --</option>
                  {REKENING_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Sebesar (Rp) *</label>
                <input
                  type="text"
                  placeholder="Contoh: 2.500.000"
                  value={angsuranForm.nominal}
                  onChange={e => setAngsuranForm({ ...angsuranForm, nominal: e.target.value.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Diterima Dari *</label>
                <input
                  type="text"
                  placeholder="Nama pengirim/pembayar..."
                  value={angsuranForm.diterima_dari}
                  onChange={e => setAngsuranForm({ ...angsuranForm, diterima_dari: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Keterangan</label>
                <textarea
                  placeholder="Catatan tambahan (opsional)..."
                  value={angsuranForm.keterangan}
                  onChange={e => setAngsuranForm({ ...angsuranForm, keterangan: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => { setShowAngsuranModal(false); setEditingPaymentId(null); }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button onClick={handleSaveAngsuran} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
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

      {/* Modal Input Progres */}
      {showProgresModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Input Progres - {TABS.find(t => t.id === activeTab)?.label}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Status/Step *</label>
                {activeTab === 'penjualan' ? (
                  <select
                    value={progresForm.status}
                    onChange={e => setProgresForm({...progresForm, status: e.target.value})}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Pilih Step Penjualan...</option>
                    {salesSteps.map(s => <option key={s.id} value={s.nama_step}>{s.nama_step}</option>)}
                  </select>
                ) : activeTab === 'sertifikat' ? (
                  <select
                    value={progresForm.status}
                    onChange={e => setProgresForm({...progresForm, status: e.target.value})}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Pilih Step Sertifikat...</option>
                    {certificateSteps.map(c => <option key={c.id} value={c.nama_step}>{c.nama_step}</option>)}
                  </select>
                ) : (
                  <select
                    value={progresForm.status}
                    onChange={e => setProgresForm({...progresForm, status: e.target.value})}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Pilih Posisi Sertifikat...</option>
                    <option value="Di Developer (Kantor)">Di Developer (Kantor)</option>
                    <option value="Di BPN / Proses Notaris">Di BPN / Proses Notaris</option>
                    <option value="Di Bank Partner (Jaminan)">Di Bank Partner (Jaminan)</option>
                    <option value="Diserahkan ke Konsumen">Diserahkan ke Konsumen</option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Keterangan / Progress Detail</label>
                <textarea
                  placeholder="Catatan tambahan..."
                  value={progresForm.keterangan}
                  onChange={e => setProgresForm({...progresForm, keterangan: e.target.value})}
                  rows={3}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => { setShowProgresModal(false); setProgresForm({ status: '', keterangan: '' }); }} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold">Batal</button>
              <button onClick={handleSaveProgres} disabled={saving || !progresForm.status} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Harga Pajak */}
      {showUbahHargaModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Ubah Harga Jual Pajak</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Harga Jual (untuk laporan penjualan - PAJAK) (Rp) *</label>
                <input
                  type="text"
                  placeholder="Contoh: 150.000.000"
                  value={hargaPajakForm}
                  onChange={e => setHargaPajakForm(e.target.value.replace(/[^0-9]/g,'').replace(/\B(?=(\d{3})+(?!\d))/g,'.'))}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowUbahHargaModal(false)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold">Batal</button>
              <button onClick={handleSaveHargaPajak} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
  </>
  );
}