'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useData } from '@/lib/data-context';
import { createClient } from '@/lib/sql/client';
import { ChevronRight, Settings, Printer, Phone, Upload, Eye, FileText, CheckCircle, Clock, Edit3, Trash2, Wallet, Landmark, XCircle, Plus } from 'lucide-react';
import { formatRupiah, bulanKeRomawi } from '@/lib/format';
import { FullAddress } from '@/components/ui/FullAddress';

import { SaleAdditionalCost, SalePayment, SaleBillingLetter, SaleStepHistory, SaleKprSubmission, MarketingFeeDisbursement, SaleDiscount } from '@/types';
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

function formatRibuan(raw: string): string {
  return raw.replace(/[^0-9]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function statusBadgeClass(status: string): string {
  if (status === 'ACCEPTED') return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700 border-red-300';
  if (status === 'PENDING') return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-slate-100 text-slate-600 border-slate-300';
}

/**
 * Hitung sisa tagihan konsumen berdasarkan status KPR terbaru.
 * - ACCEPTED → kredit_acc dari submission terbaru mengurangi sisa (clamp min 0)
 * - REJECTED → sisa otomatis 0 (dianggap tidak ada tagihan)
 * - PENDING / WAITING / lainnya → formula lama (base saja)
 * - Non-KPR → selalu formula lama
 */
function computeSisaTagihan(
  totalHargaFinal: number,
  uangMasuk: number,
  kprStatus: string,
  kreditAccTerbaru: number,
  isKpr: boolean
): number {
  const base = totalHargaFinal - uangMasuk;
  if (!isKpr) return base;
  if (kprStatus === 'ACCEPTED') return Math.max(0, base - kreditAccTerbaru);
  if (kprStatus === 'REJECTED') return 0;
  return base; // PENDING / WAITING / status lain
}

export default function DetailPenjualanPage() {
  const { id } = useParams() as { id: string };
  const { sales, customers, units, marketers, locations, blocks, banks, currentUser, salesSteps, certificateSteps, refresh, salePayments, cashBankAccounts } = useData();
  const supabase = useMemo(() => createClient(), []);
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
  const [kprSubmissions, setKprSubmissions] = useState<SaleKprSubmission[]>([]);
  const [marketingDisbursements, setMarketingDisbursements] = useState<MarketingFeeDisbursement[]>([]);
  const [discounts, setDiscounts] = useState<SaleDiscount[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const loadExtra = useCallback(async () => {
    if (!id) return;
    setLoadingExtra(true);
    try {
      const [acRes, payRes, billRes, histRes, kprRes, mfRes, discRes] = await Promise.all([
        supabase.from('sale_additional_costs').select('*').eq('sale_id', id),
        supabase.from('sale_payments').select('*').eq('sale_id', id).order('tanggal', { ascending: true }),
        supabase.from('sale_billing_letters').select('*').eq('sale_id', id),
        supabase.from('sale_step_history').select('*, users(nama)').eq('sale_id', id).order('created_at', { ascending: false }),
        supabase.from('sale_kpr_submissions').select('*').eq('sale_id', id).order('created_at', { ascending: false }),
        supabase.from('marketing_fee_disbursements').select('*').eq('sale_id', id).order('tanggal', { ascending: true }),
        supabase.from('sale_discounts').select('*').eq('sale_id', id).order('tanggal', { ascending: true }),
      ]);

      if (acRes.data) setAdditionalCosts(acRes.data);
      if (payRes.data) setPayments(payRes.data);
      if (billRes.data) setBillingLetters(billRes.data);
      if (kprRes.data) setKprSubmissions(kprRes.data);
      if (mfRes.data) setMarketingDisbursements(mfRes.data);
      if (discRes.data) setDiscounts(discRes.data);
      if (histRes.data) {
        setStepHistory(histRes.data.map((h: any) => ({
          ...h,
          changed_by_nama: h.users?.nama || 'System'
        })));
      }
    } catch (e) {
      console.error('Error loading extra details:', e);
    } finally {
      setLoadingExtra(false);
    }
  }, [id, supabase]);

  const triggerRefresh = async () => {
    await refresh();
    await loadExtra();
  };

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
  const [showApprovalModal, setShowApprovalModal] = useState(false);
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
  // Form Approval Pengajuan KPR — juga merangkap ganti bank tujuan (bank_id)
  const [approvalForm, setApprovalForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    bank_id: '',
    status: 'PENDING' as 'PENDING' | 'ACCEPTED' | 'REJECTED',
    kredit_acc: '',
    biaya_tambahan: '0',
    keterangan: '',
  });

  // Menyimpan id payment yang sedang diedit. null = mode tambah baru.
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // Menyimpan id submission KPR yang sedang diedit. null = mode tambah baru.
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);

  // States untuk modal/form diskon potongan
  const [showDiskonModal, setShowDiskonModal] = useState(false);
  const [diskonForm, setDiskonForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: '',
    keterangan: '',
  });
  const [editingDiskonId, setEditingDiskonId] = useState<string | null>(null);

  const [showUploadDokumenModal, setShowUploadDokumenModal] = useState(false);
  const [showDetailKonsumenModal, setShowDetailKonsumenModal] = useState(false);
  const [uploadingKtp, setUploadingKtp] = useState(false);
  const [uploadingKk, setUploadingKk] = useState(false);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'ktp' | 'kk') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'ktp') setUploadingKtp(true);
    else setUploadingKk(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      // Update customer in database
      const field = type === 'ktp' ? 'scan_ktp_url' : 'scan_kk_url';
      const { error } = await supabase
        .from('customers')
        .update({ [field]: result.url })
        .eq('id', customer?.id);

      if (error) throw error;

      alert(`Upload ${type.toUpperCase()} Berhasil!`);
      await triggerRefresh();
    } catch (err: any) {
      alert(err.message || `Gagal mengupload ${type.toUpperCase()}`);
    } finally {
      if (type === 'ktp') setUploadingKtp(false);
      else setUploadingKk(false);
    }
  };

  const handleDeleteFile = async (type: 'ktp' | 'kk') => {
    if (!customer?.id) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus file Scan ${type.toUpperCase()} milik ${customer.nama}?`)) return;

    if (type === 'ktp') setUploadingKtp(true);
    else setUploadingKk(true);

    try {
      const field = type === 'ktp' ? 'scan_ktp_url' : 'scan_kk_url';
      const { error } = await supabase
        .from('customers')
        .update({ [field]: null })
        .eq('id', customer.id);

      if (error) throw error;
      alert(`File Scan ${type.toUpperCase()} berhasil dihapus!`);
      await triggerRefresh();
    } catch (err: any) {
      alert(err.message || `Gagal menghapus file ${type.toUpperCase()}`);
    } finally {
      if (type === 'ktp') setUploadingKtp(false);
      else setUploadingKk(false);
    }
  };

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

  // Buka modal Potongan, selalu diisi dengan nilai potongan yang sedang berlaku
  const openPotonganModal = () => {
    setPotonganForm({
      nominal: sale?.potongan ? String(sale.potongan).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '',
      keterangan: '',
    });
    setShowPotonganModal(true);
  };

  // Buka modal Approval Pengajuan KPR, default bank & kredit_acc dari data sale/unit saat ini
  const openApprovalModal = () => {
    setEditingSubmissionId(null);
    setApprovalForm({
      tanggal: new Date().toISOString().slice(0, 10),
      bank_id: sale?.bank_id || '',
      status: 'PENDING',
      kredit_acc: sale?.kredit_pengajuan
        ? String(sale.kredit_pengajuan).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
        : unit?.maksimal_kredit
          ? String(unit.maksimal_kredit).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
          : '',
      biaya_tambahan: '0',
      keterangan: '',
    });
    setShowApprovalModal(true);
  };

  // Buka Form Approval dalam mode edit, isi dari data submission yang dipilih
  const openEditApprovalModal = (k: SaleKprSubmission) => {
    setEditingSubmissionId(k.id);
    setApprovalForm({
      tanggal: k.tanggal,
      bank_id: sale?.bank_id || '',
      status: k.status as 'PENDING' | 'ACCEPTED' | 'REJECTED',
      kredit_acc: String(k.kredit_acc || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      biaya_tambahan: '0',
      keterangan: k.keterangan || '',
    });
    setShowApprovalModal(true);
  };

  // Hapus data pembayaran (angsuran) berdasarkan id
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Yakin ingin menghapus data pembayaran ini? Nominal ini akan hilang dari total yang sudah dibayar.')) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('sale_payments').delete().eq('id', paymentId);
      if (error) throw error;
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus pembayaran.');
    } finally {
      setSaving(false);
    }
  };

  // Hapus satu baris biaya tambahan (kalau salah input, misalnya)
  const handleDeleteBiaya = async (biayaId: string) => {
    if (!confirm('Yakin ingin menghapus biaya tambahan ini?')) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('sale_additional_costs').delete().eq('id', biayaId);
      if (error) throw error;
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus biaya tambahan.');
    } finally {
      setSaving(false);
    }
  };

  // Batalkan satu entri riwayat pengajuan/return KPR
  const handleCancelSubmission = async (submissionId: string) => {
    if (!confirm('Yakin ingin membatalkan riwayat pengajuan KPR ini?')) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('sale_kpr_submissions').delete().eq('id', submissionId);
      if (error) throw error;
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal membatalkan pengajuan.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePotongan = async () => {
    setSaving(true);
    try {
      const nominalValue = potonganForm.nominal ? Number(potonganForm.nominal.replace(/\D/g, '')) : 0;
      await supabase.from('sales').update({ potongan: nominalValue }).eq('id', id);
      setShowPotonganModal(false);
      setPotonganForm({ nominal: '', keterangan: '' });
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan potongan.');
    } finally {
      setSaving(false);
    }
  };

  const openDiskonModal = () => {
    setEditingDiskonId(null);
    setDiskonForm({
      tanggal: new Date().toISOString().slice(0, 10),
      nominal: '',
      keterangan: '',
    });
    setShowDiskonModal(true);
  };

  const openEditDiskonModal = (d: SaleDiscount) => {
    setEditingDiskonId(d.id);
    setDiskonForm({
      tanggal: d.tanggal,
      nominal: String(d.nominal).replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      keterangan: d.keterangan || '',
    });
    setShowDiskonModal(true);
  };

  const handleSaveDiskon = async () => {
    if (!diskonForm.tanggal || !diskonForm.nominal) {
      alert('Tanggal dan Nominal wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const nominalValue = Number(diskonForm.nominal.replace(/\D/g, ''));
      const payload = {
        sale_id: id,
        tanggal: diskonForm.tanggal,
        nominal: nominalValue,
        keterangan: diskonForm.keterangan || '',
      };

      if (editingDiskonId) {
        const { error } = await supabase
          .from('sale_discounts')
          .update(payload)
          .eq('id', editingDiskonId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sale_discounts')
          .insert(payload);
        if (error) throw error;
      }

      setShowDiskonModal(false);
      setEditingDiskonId(null);
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan diskon.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDiskon = async (diskonId: string) => {
    if (!confirm('Yakin ingin menghapus diskon ini?')) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('sale_discounts').delete().eq('id', diskonId);
      if (error) throw error;
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menghapus diskon.');
    } finally {
      setSaving(false);
    }
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
        await triggerRefresh();
        return;
      }
      const dateObj = new Date(angsuranForm.tanggal);
      const year = dateObj.getFullYear();
      const monthRomawi = bulanKeRomawi(dateObj.getMonth() + 1);
      const prefix = `INV/INCOME/${year}/${monthRomawi}/`;

      // Cari nomor urutan tertinggi yang sudah ada di database untuk bulan & tahun ini
      const matchingPayments = salePayments.filter(p => p.no_kwitansi && p.no_kwitansi.startsWith(prefix));
      let maxSeq = 0;
      matchingPayments.forEach(p => {
        const parts = p.no_kwitansi.split('/');
        const seqStr = parts[parts.length - 1];
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      });
      const noKwitansi = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;

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
      if (inserted?.id) {
        window.open(`/penjualan/print-kwitansi?payment_id=${inserted.id}&sale_id=${id}`, '_blank');
      }
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan angsuran.');
    } finally {
      setSaving(false);
    }
  };

  // Simpan hasil Approval Pengajuan KPR: mode edit (update submission yang ada)
  // atau mode tambah baru (insert + catat biaya tambahan ke sale_additional_costs).
  const handleSaveApproval = async () => {
    if (!approvalForm.tanggal || !approvalForm.bank_id || !approvalForm.status || !approvalForm.kredit_acc) {
      alert('Tanggal, Bank Tujuan, Status, dan Kredit Acc wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const kreditAccValue = Number(approvalForm.kredit_acc.replace(/\D/g, ''));
      const kprStatusMap: Record<string, string> = {
        ACCEPTED: 'SP3K',
        REJECTED: 'REJECTED',
        PENDING: 'Wawancara',
      };

      if (editingSubmissionId) {
        // Mode edit: update submission yang sudah ada, tidak insert biaya tambahan lagi
        const { error: updateError } = await supabase
          .from('sale_kpr_submissions')
          .update({
            tanggal: approvalForm.tanggal,
            status: approvalForm.status,
            kredit_acc: kreditAccValue,
            keterangan: approvalForm.keterangan || '',
          })
          .eq('id', editingSubmissionId);
        if (updateError) throw updateError;

        // Kalau yang diedit adalah submission TERBARU, sinkronkan ke tabel sales
        // (supaya status KPR & kredit pengajuan di halaman ini ikut ter-update)
        const isLatest = kprSubmissions[0]?.id === editingSubmissionId;
        if (isLatest) {
          const updateFields: any = {
            bank_id: approvalForm.bank_id,
            kredit_pengajuan: kreditAccValue,
            kpr_status: kprStatusMap[approvalForm.status] || sale?.kpr_status,
          };
          if (approvalForm.status === 'REJECTED') {
            updateFields.status = 'Batal';
          }
          await supabase.from('sales').update(updateFields).eq('id', id);
        }

        if (approvalForm.status === 'REJECTED') {
          const kantorStep = salesSteps.find(s => s.nama_step.toLowerCase() === 'kantor');
          if (sale?.unit_id) {
            await supabase.from('units').update({
              status: 'Tersedia',
              sales_step_id: kantorStep?.id || null
            }).eq('id', sale.unit_id);
          }
          await supabase.from('sale_step_history').insert({
            sale_id: id,
            jenis_step: 'penjualan',
            status: 'Batal',
            keterangan: 'KPR Ditolak oleh Bank. Transaksi dibatalkan secara otomatis.',
            changed_by: currentUser?.id
          });
        }

        setShowApprovalModal(false);
        setEditingSubmissionId(null);
        await triggerRefresh();
        return;
      }

      // Mode tambah baru (logika lama, tidak berubah)
      const biayaTambahanValue = Number(approvalForm.biaya_tambahan.replace(/\D/g, '')) || 0;
      const noReferensi = `KPR/${new Date(approvalForm.tanggal).getFullYear()}/${String(new Date(approvalForm.tanggal).getMonth() + 1).padStart(2, '0')}/${String(kprSubmissions.length + 1).padStart(4, '0')}`;

      const { error: insertError } = await supabase.from('sale_kpr_submissions').insert({
        sale_id: id,
        no_referensi: noReferensi,
        tanggal: approvalForm.tanggal,
        status: approvalForm.status,
        kredit_acc: kreditAccValue,
        biaya_tambahan: biayaTambahanValue,
        keterangan: approvalForm.keterangan || '',
      });
      if (insertError) throw insertError;

      // Kalau ada biaya tambahan, catat juga ke sale_additional_costs
      // supaya kelihatan di tab Angsuran Konsumen (Total Tagihan / Sisa Tagihan ikut berubah)
      if (biayaTambahanValue > 0) {
        const { error: biayaError } = await supabase.from('sale_additional_costs').insert({
          sale_id: id,
          nominal: biayaTambahanValue,
          keterangan: `Biaya tambahan dari approval KPR ${noReferensi}${approvalForm.keterangan ? ' - ' + approvalForm.keterangan : ''}`,
        });
        if (biayaError) throw biayaError;
      }

      // Sinkronkan ke sales: bank tujuan, kredit_pengajuan & kpr_status ikut status approval terbaru
      const updateFields: any = {
        bank_id: approvalForm.bank_id,
        kredit_pengajuan: kreditAccValue,
        kpr_status: kprStatusMap[approvalForm.status] || sale?.kpr_status,
      };
      if (approvalForm.status === 'REJECTED') {
        updateFields.status = 'Batal';
      }
      await supabase.from('sales').update(updateFields).eq('id', id);

      if (approvalForm.status === 'REJECTED') {
        const kantorStep = salesSteps.find(s => s.nama_step.toLowerCase() === 'kantor');
        if (sale?.unit_id) {
          await supabase.from('units').update({
            status: 'Tersedia',
            sales_step_id: kantorStep?.id || null
          }).eq('id', sale.unit_id);
        }
        await supabase.from('sale_step_history').insert({
          sale_id: id,
          jenis_step: 'penjualan',
          status: 'Batal',
          keterangan: 'KPR Ditolak oleh Bank. Transaksi dibatalkan secara otomatis.',
          changed_by: currentUser?.id
        });
      }

      setShowApprovalModal(false);
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan approval pengajuan.');
    } finally {
      setSaving(false);
    }
  };

  const [editingProgresId, setEditingProgresId] = useState<string | null>(null);

  const openProgresModal = () => {
    setEditingProgresId(null);
    setProgresForm({ status: '', keterangan: '' });
    setShowProgresModal(true);
  };

  const openEditProgresModal = (hist: SaleStepHistory) => {
    setEditingProgresId(hist.id);
    setProgresForm({
      status: hist.status,
      keterangan: hist.keterangan || '',
    });
    setShowProgresModal(true);
  };

  const handleSaveProgres = async () => {
    if (!progresForm.status) return;
    setSaving(true);
    try {
      const payload = {
        sale_id: id,
        jenis_step: activeTab as any,
        status: progresForm.status,
        keterangan: progresForm.keterangan || '',
        changed_by: currentUser?.id
      };

      if (editingProgresId) {
        const { error } = await supabase
          .from('sale_step_history')
          .update(payload)
          .eq('id', editingProgresId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sale_step_history')
          .insert(payload);
        if (error) throw error;
      }

      // Update unit status if it's penjualan/sertifikat
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
      setShowProgresModal(false);
      setProgresForm({ status: '', keterangan: '' });
      setEditingProgresId(null);
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal menyimpan progres.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProgres = async (histId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data progres ini?')) return;
    try {
      const { error } = await supabase
        .from('sale_step_history')
        .delete()
        .eq('id', histId);
      if (error) throw error;
      alert('Data progres berhasil dihapus.');
      await triggerRefresh();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus progres.');
    }
  };

  // --- Marketing Fee Disbursements CRUD ---
  const [showMarketingFeeModal, setShowMarketingFeeModal] = useState(false);
  const [editingMarketingFeeId, setEditingMarketingFeeId] = useState<string | null>(null);
  const [marketingFeeForm, setMarketingFeeForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    rekening: '',
    nominal: '',
    keterangan: '',
  });

  const openMarketingFeeModal = () => {
    setEditingMarketingFeeId(null);
    setMarketingFeeForm({
      tanggal: new Date().toISOString().slice(0, 10),
      rekening: '',
      nominal: '',
      keterangan: '',
    });
    setShowMarketingFeeModal(true);
  };

  const openEditMarketingFeeModal = (mf: MarketingFeeDisbursement) => {
    setEditingMarketingFeeId(mf.id);
    setMarketingFeeForm({
      tanggal: mf.tanggal,
      rekening: mf.rekening || '',
      nominal: String(mf.nominal).replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
      keterangan: mf.keterangan || '',
    });
    setShowMarketingFeeModal(true);
  };

  const handleSaveMarketingFee = async () => {
    if (!marketingFeeForm.rekening || !marketingFeeForm.nominal) {
      alert('Semua field bertanda * wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        sale_id: id,
        tanggal: marketingFeeForm.tanggal,
        rekening: marketingFeeForm.rekening,
        nominal: Number(marketingFeeForm.nominal.replace(/\D/g, '')),
        keterangan: marketingFeeForm.keterangan || '',
      };

      if (editingMarketingFeeId) {
        const { error } = await supabase
          .from('marketing_fee_disbursements')
          .update(payload)
          .eq('id', editingMarketingFeeId);
        if (error) throw error;
        alert('Pencairan berhasil diperbarui.');
      } else {
        const { error } = await supabase
          .from('marketing_fee_disbursements')
          .insert(payload);
        if (error) throw error;
        alert('Pencairan berhasil ditambahkan.');
      }

      setShowMarketingFeeModal(false);
      await loadExtra();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pencairan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMarketingFee = async (mfId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pencairan ini?')) return;
    try {
      const { error } = await supabase
        .from('marketing_fee_disbursements')
        .delete()
        .eq('id', mfId);
      if (error) throw error;
      alert('Data pencairan berhasil dihapus.');
      await loadExtra();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pencairan.');
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
      setShowUbahHargaModal(false);
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || 'Gagal mengubah harga.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadExtra();
  }, [loadExtra]);

  if (!sale) return <AppLayout><div className="p-8 text-center text-slate-500">Loading atau data tidak ditemukan...</div></AppLayout>;

  // Calculations
  const totalBiayaTambahan = additionalCosts.reduce((sum, item) => sum + (item.nominal || 0), 0);
  const totalDiscounts = discounts.reduce((sum, item) => sum + (item.nominal || 0), 0);
  const totalHargaFinal = (sale.harga_jual_awal || sale.total_harga) - (sale.potongan || 0) - totalDiscounts + totalBiayaTambahan;
  const uangMasuk = payments.reduce((sum, item) => sum + (item.nominal || 0), 0);
  const isKpr = sale.metode_bayar === 'KPR';
  const kreditAccTerbaru = kprSubmissions[0]?.kredit_acc || 0;
  // Status KPR saat ini = status dari riwayat approval paling baru, atau WAITING kalau belum pernah diajukan
  const currentKprStatus = kprSubmissions[0]?.status || 'WAITING';
  const sisaTagihan = computeSisaTagihan(totalHargaFinal, uangMasuk, currentKprStatus, kreditAccTerbaru, isKpr);



  const waMessage = encodeURIComponent(
    `Halo ${customer?.nama || ''}, saya dari tim Lansena Property terkait unit ${unit?.no_unit ? 'No. ' + unit.no_unit : ''}${unit?.block_nama ? ' Blok ' + unit.block_nama : ''}${unit?.location_nama ? ' di ' + unit.location_nama : ''}. Mohon waktunya sebentar ya, terima kasih.`
  );

  const TABS = [
    { id: 'angsuran', label: 'Angsuran Konsumen' },
    ...(sale.metode_bayar === 'KPR' ? [{ id: 'info_kpr', label: 'Info KPR' }] : []),
    { id: 'penjualan', label: 'Step Penjualan' },
    { id: 'sertifikat', label: 'Step Sertifikat' },
    { id: 'posisi_sertifikat', label: 'Posisi Sertifikat' },
    { id: 'marketing_fee', label: 'Pencairan Marketing Fee' },
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
              <span>
                <FullAddress
                  kelurahanId={customer?.kelurahan_id}
                  kampungDusun={customer?.kampung_dusun}
                  rt={customer?.rt}
                  rw={customer?.rw}
                  fallback={customer?.domisili || customer?.alamat || '-'}
                />
              </span>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">NPWP</span><span>:</span>
              <span>{customer?.npwp || '-'}</span>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">Scan KTP</span><span>:</span>
              <div className="flex items-center gap-2">
                {customer?.scan_ktp_url ? (
                  <>
                    <a href={customer.scan_ktp_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">Lihat File</a>
                    <button onClick={() => handleDeleteFile('ktp')} className="text-xs text-red-500 hover:underline font-medium" title="Hapus Scan KTP">(Hapus)</button>
                  </>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-[130px_10px_1fr]">
              <span className="font-semibold text-slate-600">Scan KK</span><span>:</span>
              <div className="flex items-center gap-2">
                {customer?.scan_kk_url ? (
                  <>
                    <a href={customer.scan_kk_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-semibold">Lihat File</a>
                    <button onClick={() => handleDeleteFile('kk')} className="text-xs text-red-500 hover:underline font-medium" title="Hapus Scan KK">(Hapus)</button>
                  </>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center gap-4 text-xs font-semibold text-blue-600">
            <button onClick={() => setShowUploadDokumenModal(true)} className="flex items-center gap-1.5 hover:underline"><Upload className="w-3.5 h-3.5" /> Upload Dokumen Ktp & Kk</button>
            <button onClick={() => setShowDetailKonsumenModal(true)} className="flex items-center gap-1.5 hover:underline"><Eye className="w-3.5 h-3.5" /> Detail Konsumen</button>
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
              <div className="grid grid-cols-[130px_10px_1fr] pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-850 font-bold">Total Ketentuan</span><span>:</span>
                <span className="font-bold text-blue-700">
                  {formatRupiah((unit?.maksimal_kredit || 0) + (unit?.uang_muka || 0) + (unit?.booking_fee || 0))}
                </span>
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
                <div className="flex items-center gap-2">
                  <span className="text-red-500">- {formatRupiah(sale.potongan || 0)}</span>
                  <button onClick={openPotonganModal} className="text-[10px] text-blue-600 hover:underline">(Ubah/Hapus)</button>
                </div>
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
                <div>
                  <span className="font-bold text-red-600">{formatRupiah(sisaTagihan)}</span>
                  {isKpr && currentKprStatus === 'ACCEPTED' && kreditAccTerbaru > 0 && (
                    <span className="ml-2 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Sudah dikurangi kredit KPR {formatRupiah(kreditAccTerbaru)}
                    </span>
                  )}
                  {isKpr && currentKprStatus === 'REJECTED' && (
                    <span className="ml-2 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      Pengajuan KPR ditolak — tagihan dianggap lunas
                    </span>
                  )}
                </div>
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

        <div className="flex-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-md shadow-sm p-5">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-lg text-slate-800">{TABS.find(t => t.id === activeTab)?.label}</h3>
              {activeTab === 'angsuran' && (
                <div className="flex gap-2">
                  <button onClick={openAngsuranModal} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold">+ Input Angsuran Baru</button>
                  <button onClick={openPotonganModal} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-semibold">+ Input Potongan</button>
                  <button onClick={() => setShowBiayaModal(true)} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-semibold">+ Input Biaya Tambahan</button>
                </div>
              )}
              {activeTab === 'info_kpr' && (
                <div className="flex gap-2">
                  <button onClick={openApprovalModal} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> Approval Pengajuan
                  </button>
                </div>
              )}
              {(activeTab === 'penjualan' || activeTab === 'sertifikat' || activeTab === 'posisi_sertifikat') && (
                <button
                  onClick={openProgresModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                >
                  + Input Progres
                </button>
              )}
              {activeTab === 'marketing_fee' && (
                <button
                  onClick={openMarketingFeeModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                >
                  + Input Pencairan Baru
                </button>
              )}
            </div>

            {activeTab === 'angsuran' ? (
              <div className="space-y-6">
                {/* Summary Angsuran */}
                <div className={`grid gap-4 mb-6 ${isKpr && currentKprStatus === 'ACCEPTED' && kreditAccTerbaru > 0 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center">
                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Total Tagihan</p>
                    <p className="text-xl font-bold text-slate-800">{formatRupiah(totalHargaFinal)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-center">
                    <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">Sudah Dibayar</p>
                    <p className="text-xl font-bold text-blue-700">{formatRupiah(uangMasuk)}</p>
                  </div>
                  {isKpr && currentKprStatus === 'ACCEPTED' && kreditAccTerbaru > 0 && (
                    <div className="bg-emerald-50 p-4 rounded-md border border-emerald-200 text-center">
                      <p className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Landmark className="w-3.5 h-3.5" /> Kredit KPR Disetujui
                      </p>
                      <p className="text-xl font-bold text-emerald-700">{formatRupiah(kreditAccTerbaru)}</p>
                    </div>
                  )}
                  <div className="bg-red-50 p-4 rounded-md border border-red-200 text-center">
                    <p className="text-xs font-semibold text-red-600 mb-1 uppercase tracking-wider">Sisa</p>
                    <p className="text-xl font-bold text-red-700">{formatRupiah(sisaTagihan)}</p>
                    {isKpr && currentKprStatus === 'ACCEPTED' && kreditAccTerbaru > 0 && (
                      <p className="text-[10px] text-slate-500 mt-1">Sudah dikurangi kredit KPR</p>
                    )}
                    {isKpr && currentKprStatus === 'REJECTED' && (
                      <p className="text-[10px] text-red-500 mt-1">KPR ditolak — tagihan dianggap lunas</p>
                    )}
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

                {/* Daftar Biaya Tambahan */}
                <div className="pt-4 mt-6 border-t border-dashed border-slate-300">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-amber-500" /> Daftar Biaya Tambahan</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 w-12 text-center">No</th>
                          <th className="px-4 py-2">Keterangan</th>
                          <th className="px-4 py-2 text-right">Nominal</th>
                          <th className="px-4 py-2 w-20 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {additionalCosts.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-4 text-slate-500">Belum ada biaya tambahan.</td></tr>
                        ) : (
                          additionalCosts.map((c, i) => (
                            <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2 text-center">{i + 1}</td>
                              <td className="px-4 py-2">{c.keterangan || '-'}</td>
                              <td className="px-4 py-2 text-right font-semibold text-green-600">{formatRupiah(c.nominal)}</td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => handleDeleteBiaya(c.id)}
                                  className="p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                        {additionalCosts.length > 0 && (
                          <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                            <td colSpan={2} className="px-4 py-3 text-right">TOTAL BIAYA TAMBAHAN</td>
                            <td className="px-4 py-3 text-right text-green-700">{formatRupiah(totalBiayaTambahan)}</td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Daftar Potongan (Diskon) */}
                <div className="pt-4 mt-6 border-t border-dashed border-slate-300">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-500" /> Daftar Potongan (Diskon)
                    </h4>
                    <button
                      onClick={openDiskonModal}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Diskon</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 w-12 text-center">No</th>
                          <th className="px-4 py-2 w-32">Tanggal</th>
                          <th className="px-4 py-2">Keterangan</th>
                          <th className="px-4 py-2 text-right">Nominal</th>
                          <th className="px-4 py-2 w-28 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discounts.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-4 text-slate-500">Belum ada potongan diskon.</td></tr>
                        ) : (
                          discounts.map((d, i) => (
                            <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2 text-center">{i + 1}</td>
                              <td className="px-4 py-2">{new Date(d.tanggal).toLocaleDateString('id-ID')}</td>
                              <td className="px-4 py-2">{d.keterangan || '-'}</td>
                              <td className="px-4 py-2 text-right font-semibold text-rose-600">-{formatRupiah(d.nominal)}</td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditDiskonModal(d)}
                                    className="p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDiskon(d.id)}
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
                        {discounts.length > 0 && (
                          <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                            <td colSpan={3} className="px-4 py-3 text-right">TOTAL DISKON (POTONGAN)</td>
                            <td className="px-4 py-3 text-right text-rose-700">-{formatRupiah(totalDiscounts)}</td>
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
            ) : activeTab === 'info_kpr' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="font-semibold text-slate-600">Bank</span><span>:</span>
                    <span className="font-bold text-slate-800">{bank?.nama_bank || sale.bank_nama || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="font-semibold text-slate-600">Kredit Pengajuan</span><span>:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(sale.kredit_pengajuan || unit?.maksimal_kredit || 0)}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="font-semibold text-slate-600">Status</span><span>:</span>
                    <span className={`inline-block w-fit px-2 py-0.5 rounded border text-xs font-bold ${statusBadgeClass(currentKprStatus)}`}>
                      {currentKprStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-3 text-sm">Daftar Return</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200">
                      <thead className="bg-teal-600 text-white font-semibold">
                        <tr>
                          <th className="px-4 py-2">No Kwitansi & Tgl</th>
                          <th className="px-4 py-2">Keterangan</th>
                          <th className="px-4 py-2 text-right">Nominal</th>
                          <th className="px-4 py-2 w-24 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kprSubmissions.length === 0 ? (
                          <tr><td colSpan={4} className="text-center py-4 text-slate-500">Belum ada riwayat pengajuan.</td></tr>
                        ) : (
                          kprSubmissions.map((k) => (
                            <tr key={k.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2">
                                <div className="font-bold text-slate-800">{k.no_referensi || '-'}</div>
                                <div className="text-xs text-slate-500">{new Date(k.tanggal).toLocaleDateString('id-ID')}</div>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold mr-1 ${statusBadgeClass(k.status)}`}>{k.status}</span>
                                {k.keterangan || '-'}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold">{formatRupiah(k.kredit_acc)}</td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openEditApprovalModal(k)}
                                    className="p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded"
                                    title="Edit Status"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleCancelSubmission(k.id)}
                                    className="p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded"
                                    title="Batalkan"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'marketing_fee' ? (
              <div className="space-y-6">
                {/* Summary Marketing Fee */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center">
                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Marketing Fee</p>
                    <p className="text-xl font-bold text-slate-800">{formatRupiah(sale.fee_marketer || 0)}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-md border border-emerald-200 text-center">
                    <p className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wider font-bold">Sudah Cair</p>
                    <p className="text-xl font-bold text-emerald-700">
                      {formatRupiah(marketingDisbursements.reduce((sum, item) => sum + (item.nominal || 0), 0))}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-md border border-red-200 text-center">
                    <p className="text-xs font-semibold text-red-600 mb-1 uppercase tracking-wider font-bold">Sisa</p>
                    <p className="text-xl font-bold text-red-700">
                      {formatRupiah(Math.max(0, (sale.fee_marketer || 0) - marketingDisbursements.reduce((sum, item) => sum + (item.nominal || 0), 0)))}
                    </p>
                  </div>
                </div>

                {/* Table of Disbursements */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-teal-600" /> Riwayat Pencairan
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 w-12 text-center">No</th>
                          <th className="px-4 py-2 w-32">Tanggal</th>
                          <th className="px-4 py-2">Nominal</th>
                          <th className="px-4 py-2">Uang diambil dari</th>
                          <th className="px-4 py-2">Keterangan</th>
                          <th className="px-4 py-2 w-28 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketingDisbursements.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-slate-500">
                              Belum ada riwayat pencairan marketing fee.
                            </td>
                          </tr>
                        ) : (
                          marketingDisbursements.map((mf, i) => (
                            <tr key={mf.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2 text-center">{i + 1}</td>
                              <td className="px-4 py-2">
                                {new Date(mf.tanggal).toLocaleDateString('id-ID')}
                              </td>
                              <td className="px-4 py-2 font-semibold text-emerald-600">
                                {formatRupiah(mf.nominal)}
                              </td>
                              <td className="px-4 py-2">{mf.rekening || '-'}</td>
                              <td className="px-4 py-2 text-xs text-slate-600">{mf.keterangan || '-'}</td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openEditMarketingFeeModal(mf)}
                                    className="p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMarketingFee(mf.id)}
                                    className="p-1 bg-red-100 text-red-600 hover:bg-red-200 rounded"
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
                <div className="border-l-2 border-slate-200 ml-3 pl-4 space-y-6 mt-4">
                  {stepHistory.filter(h => h.jenis_step === activeTab).length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Belum ada riwayat aktivitas.</p>
                  ) : (
                    stepHistory.filter(h => h.jenis_step === activeTab).map((hist) => (
                      <div key={hist.id} className="relative">
                        <div className="absolute -left-[23px] top-1 w-3 h-3 bg-blue-500 rounded-full border-[3px] border-white shadow-sm" />
                        <div className="mb-0.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{hist.status}</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">{new Date(hist.created_at).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEditProgresModal(hist)}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors"
                              title="Edit Progres"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProgres(hist.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded transition-colors"
                              title="Hapus Progres"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
      </div>
    </AppLayout>

      {/* Modal Potongan */}
      {showPotonganModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Ubah Potongan Harga</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Nominal Potongan (Rp)</label>
                <input type="text" placeholder="Contoh: 5.000.000" value={potonganForm.nominal}
                  onChange={e => setPotonganForm({...potonganForm, nominal: formatRibuan(e.target.value)})}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                <button
                  type="button"
                  onClick={() => setPotonganForm({ ...potonganForm, nominal: '' })}
                  className="text-[11px] text-red-600 hover:underline mt-1"
                >
                  Kosongkan / set ke Rp 0
                </button>
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
                  onChange={e => setAngsuranForm({ ...angsuranForm, nominal: formatRibuan(e.target.value) })}
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

      {/* Modal Form Approval Pengajuan KPR (sekaligus Ganti Bank Tujuan) */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">{editingSubmissionId ? 'Edit Status Pengajuan' : 'Form Approval Pengajuan'}</h3>
              <button onClick={() => { setShowApprovalModal(false); setEditingSubmissionId(null); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Tanggal *</label>
                <input
                  type="date"
                  value={approvalForm.tanggal}
                  onChange={e => setApprovalForm({ ...approvalForm, tanggal: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Bank Tujuan *</label>
                <select
                  value={approvalForm.bank_id}
                  onChange={e => setApprovalForm({ ...approvalForm, bank_id: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Bank --</option>
                  {banks.map(b => (
                    <option key={b.id} value={b.id}>{b.nama_bank} {b.cabang ? `- ${b.cabang}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Status *</label>
                <select
                  value={approvalForm.status}
                  onChange={e => setApprovalForm({ ...approvalForm, status: e.target.value as any })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Kredit Acc (Rp) *</label>
                <input
                  type="text"
                  placeholder="Contoh: 160.000.000"
                  value={approvalForm.kredit_acc}
                  onChange={e => setApprovalForm({ ...approvalForm, kredit_acc: formatRibuan(e.target.value) })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              {!editingSubmissionId && (
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Biaya Tambahan (Rp) *</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={approvalForm.biaya_tambahan}
                    onChange={e => setApprovalForm({ ...approvalForm, biaya_tambahan: formatRibuan(e.target.value) })}
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nilai ini otomatis ikut ditambahkan ke Biaya Tambahan &amp; Total Tagihan di tab Angsuran Konsumen.</p>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Keterangan</label>
                <textarea
                  placeholder="Catatan tambahan (opsional)..."
                  value={approvalForm.keterangan}
                  onChange={e => setApprovalForm({ ...approvalForm, keterangan: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => { setShowApprovalModal(false); setEditingSubmissionId(null); }} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold">Batal</button>
              <button onClick={handleSaveApproval} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Biaya Tambahan */}
      {showBiayaModal && (
        <UpdateBiayaTambahanForm
          saleId={id}
          onClose={() => setShowBiayaModal(false)}
          onSuccess={triggerRefresh}
        />
      )}

      {/* Modal Serah Terima */}
      {showSerahTerimaModal && (
        <CetakSerahTerimaKunciForm
          saleId={id}
          onClose={() => setShowSerahTerimaModal(false)}
          onSuccess={triggerRefresh}
        />
      )}

      {/* Modal Komplen */}
      {showKomplenModal && (
        <CetakSuratKomplenForm
          saleId={id}
          onClose={() => setShowKomplenModal(false)}
          onSuccess={triggerRefresh}
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
          onSuccess={triggerRefresh}
        />
      )}

      {/* Modal Update Marketer */}
      {showUpdateMarketerModal && (
        <UpdateMarketerForm
          sale={sale}
          currentMarketer={marketer}
          marketers={marketers}
          onClose={() => setShowUpdateMarketerModal(false)}
          onSuccess={triggerRefresh}
        />
      )}

      {/* Modal Update Data Konsumen */}
      {showUpdateKonsumenModal && customer && (
        <UpdateDataKonsumenForm
          customer={customer}
          onClose={() => setShowUpdateKonsumenModal(false)}
          onSuccess={triggerRefresh}
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
                  onChange={e => setHargaPajakForm(formatRibuan(e.target.value))}
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

      {/* Modal Upload Dokumen KTP & KK */}
      {showUploadDokumenModal && customer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800 text-lg">Upload Dokumen KTP &amp; KK</h3>
              <button onClick={() => { setShowUploadDokumenModal(false); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs text-blue-700">
                Format file yang didukung: JPG, PNG, PDF, DOCX, dll. File akan tersimpan dengan aman pada server.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Scan KTP</label>
                <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded border">
                  {customer.scan_ktp_url ? (
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-green-600 font-medium">✓ File Tersedia</span>
                      <div className="flex items-center gap-3">
                        <a href={customer.scan_ktp_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Lihat File</a>
                        <button type="button" onClick={() => handleDeleteFile('ktp')} className="text-red-600 hover:underline font-semibold">Hapus File</button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 mb-1">Belum ada file KTP.</span>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => handleUploadFile(e, 'ktp')} 
                    disabled={uploadingKtp || uploadingKk}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadingKtp && <span className="text-[10px] text-blue-600 font-medium animate-pulse">Memproses...</span>}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Scan KK (Kartu Keluarga)</label>
                <div className="flex flex-col gap-2 p-3 bg-slate-50 rounded border">
                  {customer.scan_kk_url ? (
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-green-600 font-medium">✓ File Tersedia</span>
                      <div className="flex items-center gap-3">
                        <a href={customer.scan_kk_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Lihat File</a>
                        <button type="button" onClick={() => handleDeleteFile('kk')} className="text-red-600 hover:underline font-semibold">Hapus File</button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 mb-1">Belum ada file KK.</span>
                  )}
                  <input 
                    type="file" 
                    onChange={(e) => handleUploadFile(e, 'kk')} 
                    disabled={uploadingKtp || uploadingKk}
                    className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadingKk && <span className="text-[10px] text-blue-600 font-medium animate-pulse">Memproses...</span>}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 border-t pt-4">
              <button onClick={() => setShowUploadDokumenModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-sm">Selesai</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Konsumen */}
      {showDetailKonsumenModal && customer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800 text-lg">Detail Data Konsumen (Read-Only)</h3>
              <button onClick={() => setShowDetailKonsumenModal(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            
            <div className="space-y-6 text-sm">
              {/* Informasi Pribadi */}
              <div>
                <h4 className="font-bold text-teal-700 border-b border-teal-100 pb-1 mb-2 uppercase text-xs tracking-wider">Informasi Pribadi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Nama Lengkap</span><span>:</span><span className="font-semibold text-slate-800">{customer.nama || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">NIK (No. KTP)</span><span>:</span><span className="font-semibold text-slate-800">{customer.nik || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Tempat Lahir</span><span>:</span><span className="text-slate-800">{customer.tempat_lahir || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Tanggal Lahir</span><span>:</span><span className="text-slate-800">{customer.tanggal_lahir ? new Date(customer.tanggal_lahir).toLocaleDateString('id-ID') : '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">No. Handphone</span><span>:</span><span className="text-slate-800">{customer.no_hp || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Email</span><span>:</span><span className="text-slate-800">{customer.email || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Pekerjaan</span><span>:</span><span className="text-slate-800">{customer.pekerjaan || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Instansi</span><span>:</span><span className="text-slate-800">{customer.instansi || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Pendapatan/Bulan</span><span>:</span><span className="text-slate-800">{customer.pendapatan_per_bulan ? formatRupiah(Number(customer.pendapatan_per_bulan)) : '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">NPWP</span><span>:</span><span className="text-slate-800">{customer.npwp || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Status Pernikahan</span><span>:</span><span className="text-slate-800">{customer.status_pernikahan || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Data Alamat */}
              <div>
                <h4 className="font-bold text-teal-700 border-b border-teal-100 pb-1 mb-2 uppercase text-xs tracking-wider">Alamat</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Alamat KTP</span><span>:</span>
                    <span className="text-slate-800">
                      <FullAddress
                        kelurahanId={customer.kelurahan_id}
                        kampungDusun={customer.kampung_dusun}
                        rt={customer.rt}
                        rw={customer.rw}
                        fallback={customer.alamat_ktp || '-'}
                      />
                    </span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Alamat Domisili</span><span>:</span>
                    <span className="text-slate-800">
                      <FullAddress
                        kelurahanId={customer.kelurahan_id}
                        kampungDusun={customer.kampung_dusun}
                        rt={customer.rt}
                        rw={customer.rw}
                        fallback={customer.alamat_domisili || customer.domisili || customer.alamat || '-'}
                      />
                    </span>
                  </div>
                </div>
              </div>

              {/* Data Pasangan */}
              {(customer.status_pernikahan === 'Menikah' || customer.nama_pasangan) && (
                <div>
                  <h4 className="font-bold text-teal-700 border-b border-teal-100 pb-1 mb-2 uppercase text-xs tracking-wider">Informasi Pasangan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <div className="grid grid-cols-[130px_10px_1fr]">
                      <span className="text-slate-500">Nama Pasangan</span><span>:</span><span className="font-semibold text-slate-800">{customer.nama_pasangan || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[130px_10px_1fr]">
                      <span className="text-slate-500">NIK Pasangan</span><span>:</span><span className="text-slate-800">{customer.nik_pasangan || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[130px_10px_1fr]">
                      <span className="text-slate-500">Tempat Lahir</span><span>:</span><span className="text-slate-800">{customer.tempat_lahir_pasangan || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[130px_10px_1fr]">
                      <span className="text-slate-500">Tanggal Lahir</span><span>:</span><span className="text-slate-800">{customer.tanggal_lahir_pasangan ? new Date(customer.tanggal_lahir_pasangan).toLocaleDateString('id-ID') : '-'}</span>
                    </div>
                    <div className="grid grid-cols-[130px_10px_1fr]">
                      <span className="text-slate-500">No. HP Pasangan</span><span>:</span><span className="text-slate-800">{customer.no_hp_pasangan || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[130px_10px_1fr]">
                      <span className="text-slate-500">Pekerjaan</span><span>:</span><span className="text-slate-800">{customer.pekerjaan_pasangan || '-'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr] mt-2">
                    <span className="text-slate-500">Alamat Domisili</span><span>:</span><span className="text-slate-800">{customer.alamat_domisili_pasangan || '-'}</span>
                  </div>
                </div>
              )}

              {/* Data KPR */}
              <div>
                <h4 className="font-bold text-teal-700 border-b border-teal-100 pb-1 mb-2 uppercase text-xs tracking-wider">Rekening Bank KPR</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">Bank Rekening</span><span>:</span><span className="text-slate-800">{customer.bank_rekening_kpr || '-'}</span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500">No. Rekening</span><span>:</span><span className="text-slate-800">{customer.nomor_rekening_kpr || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Dokumen & Catatan */}
              <div>
                <h4 className="font-bold text-teal-700 border-b border-teal-100 pb-1 mb-2 uppercase text-xs tracking-wider">Dokumen &amp; Catatan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500 font-semibold">Scan KTP</span><span>:</span>
                    <div className="flex items-center gap-2">
                      {customer.scan_ktp_url ? (
                        <>
                          <a href={customer.scan_ktp_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Lihat KTP</a>
                          <button type="button" onClick={() => handleDeleteFile('ktp')} className="text-xs text-red-500 hover:underline font-medium">(Hapus)</button>
                        </>
                      ) : <span className="text-slate-400">-</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="text-slate-500 font-semibold">Scan KK</span><span>:</span>
                    <div className="flex items-center gap-2">
                      {customer.scan_kk_url ? (
                        <>
                          <a href={customer.scan_kk_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-bold">Lihat KK</a>
                          <button type="button" onClick={() => handleDeleteFile('kk')} className="text-xs text-red-500 hover:underline font-medium">(Hapus)</button>
                        </>
                      ) : <span className="text-slate-400">-</span>}
                    </div>
                  </div>
                </div>
                {customer.catatan && (
                  <div className="mt-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-slate-700">
                    <p className="font-semibold text-xs text-slate-500 mb-1">Catatan Tambahan:</p>
                    <p className="text-xs whitespace-pre-wrap">{customer.catatan}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 border-t pt-4">
              <button onClick={() => setShowDetailKonsumenModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-sm">Tutup</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Input / Edit Pencairan Marketing Fee */}
      {showMarketingFeeModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingMarketingFeeId ? 'Edit Pencairan Marketing Fee' : 'Form Input Cicilan'}
              </h3>
              <button
                onClick={() => { setShowMarketingFeeModal(false); setEditingMarketingFeeId(null); }}
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
                  value={marketingFeeForm.tanggal}
                  onChange={e => setMarketingFeeForm({ ...marketingFeeForm, tanggal: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Uang diambil dari *</label>
                <select
                  value={marketingFeeForm.rekening}
                  onChange={e => setMarketingFeeForm({ ...marketingFeeForm, rekening: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Rekening --</option>
                  {cashBankAccounts?.map(r => (
                    <option key={r.id} value={r.nama_akun}>{r.nama_akun} {r.no_rekening ? `(${r.no_rekening})` : ''}</option>
                  ))}
                  {REKENING_OPTIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Sebesar (Rp) *</label>
                <input
                  type="text"
                  placeholder="Contoh: 1.000.000"
                  value={marketingFeeForm.nominal}
                  onChange={e => setMarketingFeeForm({ ...marketingFeeForm, nominal: formatRibuan(e.target.value) })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Keterangan</label>
                <textarea
                  placeholder="Catatan tambahan (opsional)..."
                  value={marketingFeeForm.keterangan}
                  onChange={e => setMarketingFeeForm({ ...marketingFeeForm, keterangan: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => { setShowMarketingFeeModal(false); setEditingMarketingFeeId(null); }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveMarketingFee}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input / Edit Diskon (Potongan) */}
      {showDiskonModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingDiskonId ? 'Edit Potongan Diskon' : 'Tambah Potongan Diskon'}
              </h3>
              <button
                onClick={() => { setShowDiskonModal(false); setEditingDiskonId(null); }}
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
                  value={diskonForm.tanggal}
                  onChange={e => setDiskonForm({ ...diskonForm, tanggal: e.target.value })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Sebesar (Rp) *</label>
                <input
                  type="text"
                  placeholder="Contoh: 1.000.000"
                  value={diskonForm.nominal}
                  onChange={e => setDiskonForm({ ...diskonForm, nominal: formatRibuan(e.target.value) })}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Keterangan</label>
                <textarea
                  placeholder="Alasan / catatan diskon (opsional)..."
                  value={diskonForm.keterangan}
                  onChange={e => setDiskonForm({ ...diskonForm, keterangan: e.target.value })}
                  rows={2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => { setShowDiskonModal(false); setEditingDiskonId(null); }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveDiskon}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
  </>
  );
}