"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/lib/data-context";
import {
  ChevronRight,
  Settings,
  Printer,
  Phone,
  Upload,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  Edit3,
  Trash2,
  Wallet,
  Landmark,
  XCircle,
  PlusCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import {
  SaleAdditionalCost,
  SalePayment,
  SaleBillingLetter,
  SaleStepHistory,
  SaleKprSubmission,
} from "@/types";
import { CetakSerahTerimaKunciForm } from "@/components/penjualan/forms/CetakSerahTerimaKunciForm";
import { CetakSuratKomplenForm } from "@/components/penjualan/forms/CetakSuratKomplenForm";
import { PindahUnitForm } from "@/components/penjualan/forms/PindahUnitForm";
import { UpdateMarketerForm } from "@/components/penjualan/forms/UpdateMarketerForm";
import { UpdateBiayaTambahanForm } from "@/components/penjualan/forms/UpdateBiayaTambahanForm";
import { UpdateDataKonsumenForm } from "@/components/penjualan/forms/UpdateDataKonsumenForm";
import { DetailKonsumenModal } from "@/components/penjualan/forms/DetailKonsumenModal";
import { CetakPersyaratanKprForm } from "@/components/penjualan/forms";

interface SaleDiscount {
  id: string;
  sale_id: string;
  tanggal: string;
  nominal: number;
  keterangan?: string | null;
  created_at?: string;
  updated_at?: string;
}

async function dbRequest(body: any): Promise<any> {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Database error");
  return json.data;
}

// Filter helpers yang sesuai kontrak app/api/db/route.ts (filters = array)
const eqFilter = (column: string, value: any) => [
  { column, type: "eq", value },
];
const byId = (value: any) => [{ column: "id", value }];

// Daftar rekening tujuan uang masuk (sesuaikan lagi kalau ada rekening baru)
const REKENING_OPTIONS = [
  "Bank BJB Purwakarta",
  "Bank BNI",
  "Bank BRI",
  "Bank BTN KC Karawang",
  "Bank BTN KC Purwakarta",
  "Bank Mandiri",
  "Bank Syariah Indonesia",
  "BPRS HIK Cibitung",
  "BTN KC SUBANG",
  "Kas Kantor",
];

// Ubah nomor HP lokal (08xx / +62 / 62) jadi format internasional murni angka untuk wa.me
function toWaNumber(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (!digits.startsWith("62")) {
    digits = "62" + digits;
  }
  return digits;
}

function formatRibuan(raw: string): string {
  return raw.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function statusBadgeClass(status: string): string {
  if (status === "ACCEPTED")
    return "bg-emerald-100 text-emerald-700 border-emerald-300";
  if (status === "REJECTED") return "bg-red-100 text-red-700 border-red-300";
  if (status === "PENDING")
    return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-slate-100 text-slate-600 border-slate-300";
}

export default function DetailPenjualanPage() {
  const { id } = useParams() as { id: string };
  const {
    sales,
    customers,
    units,
    marketers,
    locations,
    blocks,
    banks,
    currentUser,
    salesSteps,
    certificateSteps,
    refresh,
  } = useData();
  const router = useRouter();

  // Sale Data
  const sale = useMemo(() => sales.find((s) => s.id === id), [sales, id]);
  const customer = useMemo(
    () => customers.find((c) => c.id === sale?.customer_id),
    [customers, sale],
  );
  const unit = useMemo(
    () => units.find((u) => u.id === sale?.unit_id),
    [units, sale],
  );
  const marketer = useMemo(
    () => marketers.find((m) => m.id === sale?.marketer_id),
    [marketers, sale],
  );
  const bank = useMemo(
    () => banks.find((b) => b.id === sale?.bank_id),
    [banks, sale],
  );

  // Additional Data States
  const [additionalCosts, setAdditionalCosts] = useState<SaleAdditionalCost[]>(
    [],
  );
  const [discounts, setDiscounts] = useState<SaleDiscount[]>([]);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [billingLetters, setBillingLetters] = useState<SaleBillingLetter[]>([]);
  const [stepHistory, setStepHistory] = useState<SaleStepHistory[]>([]);
  const [kprSubmissions, setKprSubmissions] = useState<SaleKprSubmission[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);

  const loadExtra = useCallback(async () => {
    if (!id) return;
    setLoadingExtra(true);
    try {
      const [
        acData,
        discData,
        payData,
        billData,
        histData,
        kprData,
        usersData,
      ] = await Promise.all([
        dbRequest({
          action: "select",
          table: "sale_additional_costs",
          filters: eqFilter("sale_id", id),
        }),
        dbRequest({
          action: "select",
          table: "sale_discounts",
          filters: eqFilter("sale_id", id),
        }),
        dbRequest({
          action: "select",
          table: "sale_payments",
          filters: eqFilter("sale_id", id),
        }),
        dbRequest({
          action: "select",
          table: "sale_billing_letters",
          filters: eqFilter("sale_id", id),
        }),
        dbRequest({
          action: "select",
          table: "sale_step_history",
          filters: eqFilter("sale_id", id),
        }),
        dbRequest({
          action: "select",
          table: "sale_kpr_submissions",
          filters: eqFilter("sale_id", id),
        }),
        // Backend tidak punya join generik (beda dari Supabase
        // `.select("*, users(nama)")`), jadi kita ambil users terpisah
        // lalu di-map manual di client untuk resolve changed_by_nama.
        dbRequest({ action: "select", table: "users" }),
      ]);

      if (acData) setAdditionalCosts(acData);

      if (discData) {
        const sorted = [...discData].sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setDiscounts(sorted);
      }

      // Sorting dilakukan di client karena handleSelect di route.ts tidak
      // mendukung parameter "order".
      if (payData) {
        const sorted = [...payData].sort(
          (a: any, b: any) =>
            new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
        );
        setPayments(sorted);
      }

      if (billData) setBillingLetters(billData);

      if (kprData) {
        const sorted = [...kprData].sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setKprSubmissions(sorted);
      }

      if (histData) {
        const userMap = new Map(
          (usersData || []).map((u: any) => [u.id, u.nama]),
        );
        const sorted = [...histData].sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        setStepHistory(
          sorted.map((h: any) => ({
            ...h,
            changed_by_nama: userMap.get(h.changed_by) || "System",
          })),
        );
      }
    } catch (e) {
      console.error("Error loading extra details:", e);
    } finally {
      setLoadingExtra(false);
    }
  }, [id]);

  const triggerRefresh = async () => {
    await refresh();
    await loadExtra();
  };

  // Tab State
  const [activeTab, setActiveTab] = useState("angsuran");

  // Modal States
  const [showPotonganModal, setShowPotonganModal] = useState(false);
  const [showBiayaModal, setShowBiayaModal] = useState(false);
  const [showSerahTerimaModal, setShowSerahTerimaModal] = useState(false);
  const [showKomplenModal, setShowKomplenModal] = useState(false);
  const [showPersyaratanModal, setShowPersyaratanModal] = useState(false);
  const [showPindahUnitModal, setShowPindahUnitModal] = useState(false);
  const [showUpdateMarketerModal, setShowUpdateMarketerModal] = useState(false);
  const [showUpdateKonsumenModal, setShowUpdateKonsumenModal] = useState(false);
  const [showDetailKonsumenModal, setShowDetailKonsumenModal] = useState(false);
  const [showProgresModal, setShowProgresModal] = useState(false);
  const [showUbahHargaModal, setShowUbahHargaModal] = useState(false);
  const [showKomitmenModal, setShowKomitmenModal] = useState(false);
  const [showAngsuranModal, setShowAngsuranModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showGantiBankModal, setShowGantiBankModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  const [potonganForm, setPotonganForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    nominal: "",
    keterangan: "",
  });
  const [progresForm, setProgresForm] = useState({
    status: "",
    keterangan: "",
  });
  const [hargaPajakForm, setHargaPajakForm] = useState("");
  const [komitmenForm, setKomitmenForm] = useState("");
  const [angsuranForm, setAngsuranForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    bank_tujuan: "",
    nominal: "",
    diterima_dari: "",
    keterangan: "",
  });
  const [approvalForm, setApprovalForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    status: "PENDING" as "PENDING" | "ACCEPTED" | "REJECTED",
    kredit_acc: "",
    biaya_tambahan: "0",
    keterangan: "",
  });
  const [gantiBankId, setGantiBankId] = useState("");

  // Menyimpan id payment yang sedang diedit. null = mode tambah baru.
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  // Menyimpan id baris sale_discounts yang sedang diedit. null = mode tambah baru.
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(
    null,
  );
  // Menyimpan id baris sale_kpr_submissions yang sedang diedit. null = mode tambah baru.
  const [editingKprId, setEditingKprId] = useState<string | null>(null);
  // Menyimpan id baris sale_step_history yang sedang diedit. null = mode tambah baru.
  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const openAngsuranModal = () => {
    setEditingPaymentId(null);
    setAngsuranForm({
      tanggal: new Date().toISOString().slice(0, 10),
      bank_tujuan: "",
      nominal: "",
      diterima_dari: customer?.nama || "",
      keterangan: "",
    });
    setShowAngsuranModal(true);
  };

  // Buka modal Angsuran dalam mode edit, isi form dari data payment yang dipilih
  const openEditAngsuranModal = (p: SalePayment) => {
    setEditingPaymentId(p.id);
    setAngsuranForm({
      tanggal: p.tanggal,
      bank_tujuan: p.bank_tujuan || "",
      nominal: String(p.nominal).replace(/\B(?=(\d{3})+(?!\d))/g, "."),
      diterima_dari: p.diterima_dari || "",
      keterangan: p.deskripsi || "",
    });
    setShowAngsuranModal(true);
  };

  // Buka modal Potongan dalam mode tambah baris baru (kosong)
  const openPotonganModal = () => {
    setEditingDiscountId(null);
    setPotonganForm({
      tanggal: new Date().toISOString().slice(0, 10),
      nominal: "",
      keterangan: "",
    });
    setShowPotonganModal(true);
  };

  // Buka modal Potongan dalam mode edit, isi form dari baris sale_discounts yang dipilih
  const openEditPotonganModal = (d: SaleDiscount) => {
    setEditingDiscountId(d.id);
    setPotonganForm({
      tanggal: d.tanggal || new Date().toISOString().slice(0, 10),
      nominal: String(d.nominal).replace(/\B(?=(\d{3})+(?!\d))/g, "."),
      keterangan: d.keterangan || "",
    });
    setShowPotonganModal(true);
  };

  // Buka modal Approval Pengajuan KPR, default kredit_acc dari maksimal kredit unit
  const openApprovalModal = () => {
    setEditingKprId(null);
    setApprovalForm({
      tanggal: new Date().toISOString().slice(0, 10),
      status: "PENDING",
      kredit_acc: sale?.kredit_pengajuan
        ? String(sale.kredit_pengajuan).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
        : unit?.maksimal_kredit
          ? String(unit.maksimal_kredit).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
          : "",
      biaya_tambahan: "0",
      keterangan: "",
    });
    setShowApprovalModal(true);
  };

  // Buka modal Approval Pengajuan KPR dalam mode edit
  const openEditApprovalModal = (k: SaleKprSubmission) => {
    setEditingKprId(k.id);
    setApprovalForm({
      tanggal: k.tanggal
        ? new Date(k.tanggal).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      status: k.status as "PENDING" | "ACCEPTED" | "REJECTED",
      kredit_acc: formatRibuan(String(k.kredit_acc || 0)),
      biaya_tambahan: formatRibuan(String(k.biaya_tambahan || 0)),
      keterangan: k.keterangan || "",
    });
    setShowApprovalModal(true);
  };

  const openGantiBankModal = () => {
    setGantiBankId(sale?.bank_id || "");
    setShowGantiBankModal(true);
  };

  // Hapus data pembayaran (angsuran) berdasarkan id
  const handleDeletePayment = async (paymentId: string) => {
    if (
      !confirm(
        "Yakin ingin menghapus data pembayaran ini? Nominal ini akan hilang dari total yang sudah dibayar.",
      )
    )
      return;
    setSaving(true);
    try {
      await dbRequest({
        action: "delete",
        table: "sale_payments",
        filters: byId(paymentId),
      });
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus pembayaran.");
    } finally {
      setSaving(false);
    }
  };

  // Hapus satu baris biaya tambahan (kalau salah input, misalnya)
  const handleDeleteBiaya = async (biayaId: string) => {
    if (!confirm("Yakin ingin menghapus biaya tambahan ini?")) return;
    setSaving(true);
    try {
      await dbRequest({
        action: "delete",
        table: "sale_additional_costs",
        filters: byId(biayaId),
      });
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus biaya tambahan.");
    } finally {
      setSaving(false);
    }
  };

  // Hapus satu baris potongan
  const handleDeletePotongan = async (discountId: string) => {
    if (!confirm("Yakin ingin menghapus potongan ini?")) return;
    setSaving(true);
    try {
      await dbRequest({
        action: "delete",
        table: "sale_discounts",
        filters: byId(discountId),
      });
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus potongan.");
    } finally {
      setSaving(false);
    }
  };

  // Batalkan satu entri riwayat pengajuan/return KPR
  const handleCancelSubmission = async (submissionId: string) => {
    if (!confirm("Yakin ingin membatalkan riwayat pengajuan KPR ini?")) return;
    setSaving(true);
    try {
      await dbRequest({
        action: "delete",
        table: "sale_kpr_submissions",
        filters: byId(submissionId),
      });
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal membatalkan pengajuan.");
    } finally {
      setSaving(false);
    }
  };

  // Simpan potongan sebagai baris baru (atau update baris yang sedang
  // diedit) di tabel sale_discounts — bukan lagi menimpa kolom tunggal
  // sales.potongan, supaya riwayat & keterangan tiap potongan tersimpan.
  // Catatan: tabel sale_discounts tidak punya kolom created_by, tapi
  // kolom tanggal wajib diisi (NOT NULL tanpa default di SQL).
  const handleSavePotongan = async () => {
    if (!potonganForm.nominal || !potonganForm.tanggal) {
      alert("Tanggal dan Nominal potongan wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const nominalValue = Number(potonganForm.nominal.replace(/\D/g, ""));

      if (editingDiscountId) {
        await dbRequest({
          action: "update",
          table: "sale_discounts",
          data: {
            tanggal: potonganForm.tanggal,
            nominal: nominalValue,
            keterangan: potonganForm.keterangan || "",
          },
          filters: byId(editingDiscountId),
        });
      } else {
        await dbRequest({
          action: "insert",
          table: "sale_discounts",
          data: {
            sale_id: id,
            tanggal: potonganForm.tanggal,
            nominal: nominalValue,
            keterangan: potonganForm.keterangan || "",
          },
        });
      }

      setShowPotonganModal(false);
      setEditingDiscountId(null);
      setPotonganForm({
        tanggal: new Date().toISOString().slice(0, 10),
        nominal: "",
        keterangan: "",
      });
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal menyimpan potongan.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAngsuran = async () => {
    if (
      !angsuranForm.tanggal ||
      !angsuranForm.bank_tujuan ||
      !angsuranForm.nominal ||
      !angsuranForm.diterima_dari
    ) {
      alert("Tanggal, Uang Masuk ke, Sebesar, dan Diterima Dari wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const nominalValue = Number(angsuranForm.nominal.replace(/\D/g, ""));
      const deskripsi =
        angsuranForm.keterangan ||
        `Diterima dari ${angsuranForm.diterima_dari} — masuk ke ${angsuranForm.bank_tujuan}`;

      if (editingPaymentId) {
        await dbRequest({
          action: "update",
          table: "sale_payments",
          data: {
            tanggal: angsuranForm.tanggal,
            bank_tujuan: angsuranForm.bank_tujuan,
            diterima_dari: angsuranForm.diterima_dari,
            deskripsi,
            nominal: nominalValue,
          },
          filters: byId(editingPaymentId),
        });
        setShowAngsuranModal(false);
        setEditingPaymentId(null);
        await triggerRefresh();
        return;
      }

      const dateObj = new Date(angsuranForm.tanggal);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const prefix = `INV/INCOME/${year}/${month}/`;

      // Ambil seluruh sale_payments dari database untuk memastikan sequence global tidak duplikat
      const allExistingPayments = await dbRequest({
        action: "select",
        table: "sale_payments",
      });

      let maxSeq = 0;
      (allExistingPayments || []).forEach((p: any) => {
        if (p.no_kwitansi && p.no_kwitansi.startsWith(prefix)) {
          const parts = p.no_kwitansi.split("/");
          const seqStr = parts[parts.length - 1];
          const seqNum = parseInt(seqStr, 10);
          if (!isNaN(seqNum) && seqNum > maxSeq) {
            maxSeq = seqNum;
          }
        }
      });
      const urutan = String(maxSeq + 1).padStart(4, "0");
      const noKwitansi = `${prefix}${urutan}`;

      const inserted = await dbRequest({
        action: "insert",
        table: "sale_payments",
        data: {
          sale_id: id,
          tanggal: angsuranForm.tanggal,
          no_kwitansi: noKwitansi,
          bank_tujuan: angsuranForm.bank_tujuan,
          diterima_dari: angsuranForm.diterima_dari,
          deskripsi,
          nominal: nominalValue,
        },
      });

      setShowAngsuranModal(false);
      if (inserted?.id) {
        window.open(
          `/penjualan/print-kwitansi?payment_id=${inserted.id}&sale_id=${id}`,
          "_blank",
        );
      }
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal menyimpan angsuran.");
    } finally {
      setSaving(false);
    }
  };

  // Simpan hasil Approval Pengajuan KPR: catat sebagai riwayat baru di
  // sale_kpr_submissions, lalu sinkronkan status & kredit terbaru ke tabel sales
  // HANYA kalau statusnya sudah final (ACCEPTED/REJECTED). Kalau masih PENDING,
  // sales tidak diubah — cukup tercatat di riwayat, karena belum ada keputusan bank.
  //
  // - ACCEPTED  -> kpr_status jadi "SP3K", kredit_pengajuan diisi nilai yang di-ACC.
  //                Ini otomatis bikin transaksi kehitung sebagai piutang Bank di
  //                Laporan Hutang Piutang (tabel Penjualan Unit KPR (Bank) memfilter
  //                kpr_status 'SP3K' / 'Akad'), dan tagihan konsumen (KPR Cust)
  //                otomatis berkurang sebesar kredit yang di-ACC.
  // - REJECTED  -> kpr_status mundur ke "Wawancara" (siap diajukan ulang) dan
  //                kredit_pengajuan direset ke 0, supaya TIDAK ikut kehitung
  //                sebagai piutang bank, dan tagihan konsumen kembali penuh.
  const handleSaveApproval = async () => {
    if (
      !approvalForm.tanggal ||
      !approvalForm.status ||
      !approvalForm.kredit_acc
    ) {
      alert("Tanggal, Status, dan Kredit Acc wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const kreditAccValue = Number(approvalForm.kredit_acc.replace(/\D/g, ""));
      const biayaTambahanValue =
        Number(approvalForm.biaya_tambahan.replace(/\D/g, "")) || 0;
      const noReferensi = `KPR/${new Date(approvalForm.tanggal).getFullYear()}/${String(new Date(approvalForm.tanggal).getMonth() + 1).padStart(2, "0")}/${String(kprSubmissions.length + 1).padStart(4, "0")}`;

      // 1. Simpan atau perbarui riwayat pengajuan/approval KPR
      if (editingKprId) {
        await dbRequest({
          action: "update",
          table: "sale_kpr_submissions",
          data: {
            tanggal: approvalForm.tanggal,
            status: approvalForm.status,
            kredit_acc: kreditAccValue,
            biaya_tambahan: biayaTambahanValue,
            keterangan: approvalForm.keterangan || "",
          },
          filters: byId(editingKprId),
        });
      } else {
        await dbRequest({
          action: "insert",
          table: "sale_kpr_submissions",
          data: {
            sale_id: id,
            no_referensi: noReferensi,
            tanggal: approvalForm.tanggal,
            status: approvalForm.status,
            kredit_acc: kreditAccValue,
            biaya_tambahan: biayaTambahanValue,
            keterangan: approvalForm.keterangan || "",
          },
        });
      }

      // 2. Sinkronkan ke sales + catat Step Penjualan HANYA kalau statusnya final
      if (approvalForm.status === "ACCEPTED") {
        await dbRequest({
          action: "update",
          table: "sales",
          data: {
            kredit_pengajuan: kreditAccValue,
            kpr_status: "SP3K",
          },
          filters: byId(id),
        });

        await dbRequest({
          action: "insert",
          table: "sale_step_history",
          data: {
            sale_id: id,
            jenis_step: "penjualan",
            status: "SP3K",
            keterangan:
              approvalForm.keterangan ||
              `KPR disetujui oleh Bank (ACCEPTED) — kredit Rp ${kreditAccValue.toLocaleString("id-ID")}.`,
            changed_by: currentUser?.id,
          },
        });
      } else if (approvalForm.status === "REJECTED") {
        await dbRequest({
          action: "update",
          table: "sales",
          data: {
            kredit_pengajuan: 0,
            kpr_status: "REJECTED",
          },
          filters: byId(id),
        });

        await dbRequest({
          action: "insert",
          table: "sale_step_history",
          data: {
            sale_id: id,
            jenis_step: "penjualan",
            status: "REJECTED",
            keterangan:
              approvalForm.keterangan ||
              "Pengajuan KPR ditolak oleh Bank (REJECTED).",
            changed_by: currentUser?.id,
          },
        });
      }
      // PENDING: tidak mengubah apa pun di sales, cukup tercatat di riwayat kpr_submissions

      setShowApprovalModal(false);
      setEditingKprId(null);
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal menyimpan approval pengajuan.");
    } finally {
      setSaving(false);
    }
  };

  // Ganti bank tujuan pengajuan KPR untuk transaksi ini
  const handleSaveGantiBank = async () => {
    if (!gantiBankId) {
      alert("Silakan pilih bank tujuan.");
      return;
    }
    setSaving(true);
    try {
      await dbRequest({
        action: "update",
        table: "sales",
        data: { bank_id: gantiBankId },
        filters: byId(id),
      });
      setShowGantiBankModal(false);
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal mengganti bank tujuan.");
    } finally {
      setSaving(false);
    }
  };

  const openEditProgresModal = (hist: SaleStepHistory) => {
    setEditingStepId(hist.id);
    setProgresForm({
      status: hist.status || "",
      keterangan: hist.keterangan || "",
    });
    setShowProgresModal(true);
  };

  const handleDeleteProgres = async (stepId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus riwayat progres ini?")) return;
    setSaving(true);
    try {
      await dbRequest({
        action: "delete",
        table: "sale_step_history",
        filters: byId(stepId),
      });
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus riwayat progres.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProgres = async () => {
    if (!progresForm.status) {
      alert("Status/Step wajib dipilih.");
      return;
    }
    setSaving(true);
    try {
      if (editingStepId) {
        await dbRequest({
          action: "update",
          table: "sale_step_history",
          data: {
            status: progresForm.status,
            keterangan: progresForm.keterangan || "",
          },
          filters: byId(editingStepId),
        });
      } else {
        await dbRequest({
          action: "insert",
          table: "sale_step_history",
          data: {
            sale_id: id,
            jenis_step: activeTab,
            status: progresForm.status,
            keterangan: progresForm.keterangan || "",
            changed_by: currentUser?.id,
          },
        });
      }

      if (activeTab === "penjualan" && sale?.unit_id) {
        const selectedStep = salesSteps.find(
          (s) => s.nama_step === progresForm.status,
        );
        if (selectedStep) {
          await dbRequest({
            action: "update",
            table: "units",
            data: { sales_step_id: selectedStep.id },
            filters: byId(sale.unit_id),
          });
        }
      } else if (activeTab === "sertifikat" && sale?.unit_id) {
        const selectedStep = certificateSteps.find(
          (c) => c.nama_step === progresForm.status,
        );
        if (selectedStep) {
          await dbRequest({
            action: "update",
            table: "units",
            data: { certificate_step_id: selectedStep.id },
            filters: byId(sale.unit_id),
          });
        }
      }

      setShowProgresModal(false);
      setEditingStepId(null);
      setProgresForm({ status: "", keterangan: "" });
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal menyimpan progres.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHargaPajak = async () => {
    setSaving(true);
    try {
      const nominalValue = Number(hargaPajakForm.replace(/\D/g, ""));
      await dbRequest({
        action: "update",
        table: "sales",
        data: { harga_jual_pajak: nominalValue },
        filters: byId(id),
      });

      alert("Harga Pajak berhasil diperbarui.");
      setShowUbahHargaModal(false);
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal mengubah harga.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKomitmen = async () => {
    setSaving(true);
    try {
      await dbRequest({
        action: "update",
        table: "sales",
        data: { komitmen_pembayaran: komitmenForm },
        filters: byId(id),
      });

      alert("Komitmen Pembayaran berhasil diperbarui.");
      setShowKomitmenModal(false);
      await triggerRefresh();
    } catch (err: any) {
      alert(err?.message || "Gagal mengubah komitmen pembayaran.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadExtra();
  }, [loadExtra]);

  if (!sale)
    return (
      <AppLayout>
        <div className="p-8 text-center text-slate-500">
          Loading atau data tidak ditemukan...
        </div>
      </AppLayout>
    );

  // Calculations
  const totalBiayaTambahan = additionalCosts.reduce(
    (sum, item) => sum + (item.nominal || 0),
    0,
  );
  // Total potongan sekarang dijumlah dari tabel sale_discounts (riwayat),
  // atau fallback ke kolom sales.potongan / sales.diskon jika belum ada baris riwayat.
  const initialPotongan = Number(sale.potongan || sale.diskon || 0);
  const totalPotongan =
    discounts.length > 0
      ? discounts.reduce((sum, item) => sum + (item.nominal || 0), 0)
      : initialPotongan;
  const totalHargaFinal =
    (sale.harga_jual_awal || sale.total_harga) -
    totalPotongan +
    totalBiayaTambahan;
  const uangMasuk = payments.reduce(
    (sum, item) => sum + (item.nominal || 0),
    0,
  );

  // Status KPR saat ini = status dari riwayat approval paling baru, atau WAITING kalau belum pernah diajukan
  const currentKprStatus = kprSubmissions[0]?.status || "WAITING";
  const totalReturn = kprSubmissions.reduce(
    (sum, k) => sum + (k.kredit_acc || 0),
    0,
  );

  // KPR yang disetujui (ACCEPTED) dari bank
  const kreditKprAcc =
    kprSubmissions
      .filter((k) => k.status === "ACCEPTED")
      .reduce((sum, k) => sum + (k.kredit_acc || 0), 0) ||
    (sale.metode_bayar === "KPR" &&
    (currentKprStatus === "ACCEPTED" ||
      sale.kpr_status === "SP3K" ||
      sale.kpr_status === "Akad")
      ? sale.kredit_pengajuan || 0
      : 0);

  // Sisa tagihan ke konsumen berkurang jika KPR sudah di-ACC
  const sisaTagihan =
    sale.metode_bayar === "KPR"
      ? Math.max(0, totalHargaFinal - uangMasuk - kreditKprAcc)
      : Math.max(0, totalHargaFinal - uangMasuk);

  const waMessage = encodeURIComponent(
    `Halo ${customer?.nama || ""}, saya dari tim Lansena Property terkait unit ${unit?.no_unit ? "No. " + unit.no_unit : ""}${unit?.block_nama ? " Blok " + unit.block_nama : ""}${unit?.location_nama ? " di " + unit.location_nama : ""}. Mohon waktunya sebentar ya, terima kasih.`,
  );

  // Tab "Info KPR" cuma relevan untuk transaksi metode KPR
  const TABS = [
    { id: "angsuran", label: "Angsuran Konsumen" },
    ...(sale.metode_bayar === "KPR"
      ? [{ id: "info_kpr", label: "Info KPR" }]
      : []),
    { id: "penjualan", label: "Step Penjualan" },
    { id: "sertifikat", label: "Step Sertifikat" },
    { id: "posisi_sertifikat", label: "Posisi Sertifikat" },
    { id: "marketing_fee", label: "Pencairan Marketing Fee" },
  ];

  return (
    <>
      <AppLayout>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-6">
          <Link href="/penjualan/daftar" className="hover:underline">
            Daftar Penjualan
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Detail Penjualan</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-xl font-bold text-slate-800">
            Informasi Penjualan
          </h1>
          <div className="relative">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-md font-semibold text-xs sm:text-sm transition shadow-xs w-full sm:w-auto"
            >
              <Settings className="w-4 h-4" />
              <span>Kumpulan Aksi</span>
            </button>
            {showActionMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActionMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-xl z-20 py-1">
                  <button
                    onClick={() => {
                      setShowPersyaratanModal(true);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-xs sm:text-sm text-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Persyaratan KPR
                  </button>
                  <button
                    onClick={() => {
                      window.open(`/penjualan/print-sppr?id=${id}`);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-xs sm:text-sm text-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak SPPR
                  </button>
                  <button
                    onClick={() => {
                      setShowSerahTerimaModal(true);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-xs sm:text-sm text-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Serah Terima Kunci
                  </button>
                  <button
                    onClick={() => {
                      setShowKomplenModal(true);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-xs sm:text-sm text-slate-700 border-b border-slate-100"
                  >
                    <Printer className="w-3.5 h-3.5" /> Cetak Surat Komplen
                  </button>
                  <button
                    onClick={() => {
                      setShowPindahUnitModal(true);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs sm:text-sm text-slate-700 font-medium mt-1"
                  >
                    Pindah Unit
                  </button>
                  <button
                    onClick={() => {
                      setShowUpdateMarketerModal(true);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs sm:text-sm text-slate-700 font-medium"
                  >
                    Update Marketer
                  </button>
                  <button
                    onClick={() => {
                      setShowBiayaModal(true);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs sm:text-sm text-slate-700 font-medium"
                  >
                    Update Biaya Tambahan
                  </button>
                  <button
                    onClick={() => {
                      setShowUpdateKonsumenModal(true);
                      setShowActionMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs sm:text-sm text-slate-700 font-medium"
                  >
                    Update Data Konsumen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Section Konsumen */}
          <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col">
            <div className="bg-teal-600 px-4 py-2.5">
              <h2 className="text-white font-bold text-sm tracking-wide">
                Konsumen
              </h2>
            </div>
            <div className="p-4 space-y-3 text-sm flex-1">
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Nama</span>
                <span>:</span>
                <span className="font-bold text-slate-800">
                  {customer?.nama || "-"}
                </span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">
                  No Handphone
                </span>
                <span>:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">
                    {customer?.no_hp || "-"}
                  </span>
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
                <span className="font-semibold text-slate-600">Email</span>
                <span>:</span>
                <span>{customer?.email || "-"}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Domisili</span>
                <span>:</span>
                <span>{customer?.domisili || customer?.alamat || "-"}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">NPWP</span>
                <span>:</span>
                <span>{customer?.npwp || "-"}</span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Scan KTP</span>
                <span>:</span>
                <span>
                  {customer?.scan_ktp_url ? (
                    <a
                      href={customer.scan_ktp_url}
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Lihat File
                    </a>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
              <div className="grid grid-cols-[130px_10px_1fr]">
                <span className="font-semibold text-slate-600">Scan KK</span>
                <span>:</span>
                <span>
                  {customer?.scan_kk_url ? (
                    <a
                      href={customer.scan_kk_url}
                      target="_blank"
                      className="text-blue-600 hover:underline"
                    >
                      Lihat File
                    </a>
                  ) : (
                    "-"
                  )}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex items-center gap-4 text-xs font-semibold text-blue-600">
              <button
                onClick={() => setShowUpdateKonsumenModal(true)}
                className="flex items-center gap-1.5 hover:underline"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Dokumen Ktp & Kk
              </button>
              <button
                onClick={() => setShowDetailKonsumenModal(true)}
                className="flex items-center gap-1.5 hover:underline"
              >
                <Eye className="w-3.5 h-3.5" /> Detail Konsumen
              </button>
            </div>
          </div>

          {/* Section Unit & Penjualan (Stacked) */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
              <div className="bg-teal-600 px-4 py-2.5">
                <h2 className="text-white font-bold text-sm tracking-wide">
                  Unit
                </h2>
              </div>
              <div className="p-4 space-y-2.5 text-sm">
                <div className="grid grid-cols-[130px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Jenis Rumah
                  </span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {unit?.subsidy_type_nama || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[130px_10px_1fr]">
                  <span className="font-semibold text-slate-600">Lokasi</span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {unit?.location_nama || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[130px_10px_1fr]">
                  <span className="font-semibold text-slate-600">Blok</span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {unit?.block_nama || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[130px_10px_1fr]">
                  <span className="font-semibold text-slate-600">No Unit</span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {unit?.no_unit || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[130px_10px_1fr]">
                  <span className="font-semibold text-slate-600">Tipe</span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {unit?.unit_type_nama || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[130px_10px_1fr]">
                  <span className="font-semibold text-slate-600">NOP</span>
                  <span>:</span>
                  <span>{unit?.nop || "-"}</span>
                </div>
                <div className="grid grid-cols-[130px_10px_1fr] pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-600">
                    Maksimal Kredit
                  </span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(unit?.maksimal_kredit || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-[130px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Uang Muka
                  </span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(unit?.uang_muka || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-[130px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Booking Fee
                  </span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(unit?.booking_fee || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
              <div className="bg-teal-600 px-4 py-2.5">
                <h2 className="text-white font-bold text-sm tracking-wide">
                  Penjualan
                </h2>
              </div>
              <div className="p-4 space-y-2.5 text-sm">
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    No Penjualan
                  </span>
                  <span>:</span>
                  <span className="font-bold text-red-600">
                    {sale.no_penjualan || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Tgl Penjualan
                  </span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {sale.tanggal_akad || sale.tanggal_booking
                      ? new Date(
                          sale.tanggal_akad || sale.tanggal_booking,
                        ).toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Jenis Penjualan
                  </span>
                  <span>:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {sale.metode_bayar === "KPR" ? (
                      (() => {
                        const s = String(sale.kpr_status || currentKprStatus || "WAITING").toUpperCase();
                        const isReject = s.includes("REJECT");
                        const isAccept = s.includes("ACCEPT") || s === "SP3K" || s === "AKAD";
                        const label = isReject ? "KPR (REJECTED)" : isAccept ? "KPR (ACCEPTED)" : "KPR (WAITING)";
                        const badgeClass = isReject
                          ? "bg-rose-100 text-rose-700 border-rose-300"
                          : isAccept
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-amber-100 text-amber-700 border-amber-300";
                        return (
                          <span className={`text-[11px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider border ${badgeClass}`}>
                            {label}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="font-bold text-slate-800">
                        {sale.metode_bayar}
                      </span>
                    )}
                  </div>
                </div>
                {sale.metode_bayar === "KPR" && (
                  <>
                    <div className="grid grid-cols-[160px_10px_1fr]">
                      <span className="font-semibold text-slate-600">
                        Bank KPR
                      </span>
                      <span>:</span>
                      <span className="font-bold text-slate-800">
                        {bank?.nama_bank || sale.bank_nama || "-"}
                      </span>
                    </div>
                    <div className="grid grid-cols-[160px_10px_1fr]">
                      <span className="font-semibold text-slate-600">
                        Kredit Pengajuan
                      </span>
                      <span>:</span>
                      <span className="font-bold text-slate-800">
                        {formatRupiah(
                          sale.kredit_pengajuan || unit?.maksimal_kredit || 0,
                        )}
                      </span>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">Marketer</span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {marketer?.nama || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Fee Marketer
                  </span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(sale.fee_marketer || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-600">
                    Harga Jual Awal
                  </span>
                  <span>:</span>
                  <span>
                    {formatRupiah(sale.harga_jual_awal || sale.total_harga)}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">Potongan</span>
                  <span>:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">
                      - {formatRupiah(totalPotongan)}
                    </span>
                    <button
                      onClick={openPotonganModal}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      (+ Tambah)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Potongan Ket.
                  </span>
                  <span>:</span>
                  <span>
                    {discounts.length > 0
                      ? discounts
                          .map((d) => d.keterangan)
                          .filter(Boolean)
                          .join(", ") || "-"
                      : initialPotongan > 0
                      ? "Potongan Awal Transaksi"
                      : "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Biaya Tambahan
                  </span>
                  <span>:</span>
                  <span className="text-green-600">
                    + {formatRupiah(totalBiayaTambahan)}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Biaya Tambahan Ket.
                  </span>
                  <span>:</span>
                  <span>
                    {additionalCosts
                      .map((a) => a.keterangan)
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-800">
                    Harga Jual Final
                  </span>
                  <span>:</span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(totalHargaFinal)}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr]">
                  <span className="font-semibold text-slate-600">
                    Uang Masuk (Tunai)
                  </span>
                  <span>:</span>
                  <span className="text-blue-600 font-bold">
                    {formatRupiah(uangMasuk)}
                  </span>
                </div>
                {sale.metode_bayar === "KPR" && (
                  <div className="grid grid-cols-[160px_10px_1fr]">
                    <span className="font-semibold text-emerald-600">
                      KPR Disetujui (ACC)
                    </span>
                    <span>:</span>
                    <span className="text-emerald-700 font-bold">
                      {formatRupiah(kreditKprAcc)}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                  <span className="font-bold text-red-600">Sisa Tagihan</span>
                  <span>:</span>
                  <span className="font-bold text-red-600">
                    {formatRupiah(sisaTagihan)}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-600">
                    Komitmen Pembayaran
                  </span>
                  <span>:</span>
                  <div className="flex items-start gap-2">
                    <span className="font-medium text-slate-800 flex-1">
                      {sale.komitmen_pembayaran || "-"}
                    </span>
                    <button
                      onClick={() => {
                        setKomitmenForm(sale.komitmen_pembayaran || "");
                        setShowKomitmenModal(true);
                      }}
                      className="text-[10px] text-blue-600 hover:underline shrink-0 font-medium"
                    >
                      (Ubah Komitmen)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-[160px_10px_1fr] pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-600">
                    Harga Jual (PAJAK)
                  </span>
                  <span>:</span>
                  <div className="flex items-center gap-2">
                    <span>{formatRupiah(sale.harga_jual_pajak || 0)}</span>
                    <button
                      onClick={() => {
                        setHargaPajakForm(
                          String(sale.harga_jual_pajak || 0).replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ".",
                          ),
                        );
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
          <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5 pb-2 lg:pb-0 custom-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-left whitespace-nowrap px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-md transition shrink-0 lg:shrink ${activeTab === tab.id ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-white border border-slate-200 rounded-md shadow-sm p-4 sm:p-5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-bold text-base sm:text-lg text-slate-800">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              {activeTab === "angsuran" && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={openAngsuranModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    + Input Angsuran Baru
                  </button>
                  <button
                    onClick={openPotonganModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    + Input Potongan
                  </button>
                  <button
                    onClick={() => setShowBiayaModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    + Input Biaya Tambahan
                  </button>
                </div>
              )}
              {activeTab === "info_kpr" && (
                <div className="flex gap-2">
                  <button
                    onClick={openGantiBankModal}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Ganti Bank Tujuan
                  </button>
                  <button
                    onClick={openApprovalModal}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Approval Pengajuan
                  </button>
                </div>
              )}
              {(activeTab === "penjualan" ||
                activeTab === "sertifikat" ||
                activeTab === "posisi_sertifikat") && (
                <button
                  onClick={() => {
                    setEditingStepId(null);
                    setProgresForm({ status: "", keterangan: "" });
                    setShowProgresModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-semibold"
                >
                  + Input Progres
                </button>
              )}
            </div>

            {activeTab === "angsuran" ? (
              <div className="space-y-6">
                {/* Summary Angsuran */}
                <div
                  className={`grid ${
                    sale.metode_bayar === "KPR"
                      ? "grid-cols-2 sm:grid-cols-4"
                      : "grid-cols-1 sm:grid-cols-3"
                  } gap-4 mb-6`}
                >
                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center">
                    <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Total Tagihan
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-slate-800">
                      {formatRupiah(totalHargaFinal)}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-200 text-center">
                    <p className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">
                      Sudah Dibayar (Tunai)
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-blue-700">
                      {formatRupiah(uangMasuk)}
                    </p>
                  </div>
                  {sale.metode_bayar === "KPR" && (
                    <div className="bg-emerald-50 p-4 rounded-md border border-emerald-200 text-center">
                      <p className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wider">
                        KPR Disetujui (ACC)
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-emerald-700">
                        {formatRupiah(kreditKprAcc)}
                      </p>
                    </div>
                  )}
                  <div className="bg-red-50 p-4 rounded-md border border-red-200 text-center">
                    <p className="text-xs font-semibold text-red-600 mb-1 uppercase tracking-wider">
                      Sisa Tagihan
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-red-700">
                      {formatRupiah(sisaTagihan)}
                    </p>
                  </div>
                </div>

                {/* Daftar Pembayaran */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Daftar
                    Pembayaran
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200">
                      <thead className="bg-teal-600 text-white font-semibold border-b border-slate-200">
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
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-4 text-slate-500"
                            >
                              Belum ada pembayaran.
                            </td>
                          </tr>
                        ) : (
                          payments.map((p, i) => (
                            <tr
                              key={p.id}
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="px-4 py-2 text-center">{i + 1}</td>
                              <td className="px-4 py-2">
                                {new Date(p.tanggal).toLocaleDateString(
                                  "id-ID",
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <div className="font-bold text-slate-800">
                                  {p.no_kwitansi}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {p.deskripsi}
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-green-600">
                                {formatRupiah(p.nominal)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `/penjualan/print-kwitansi?payment_id=${p.id}&sale_id=${id}`,
                                        "_blank",
                                      )
                                    }
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
                            <td colSpan={3} className="px-4 py-3 text-right">
                              TOTAL PEMBAYARAN
                            </td>
                            <td className="px-4 py-3 text-right text-blue-700">
                              {formatRupiah(uangMasuk)}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Daftar Potongan */}
                <div className="pt-4 mt-6 border-t border-dashed border-slate-300">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-red-500" /> Daftar
                    Potongan
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200">
                      <thead className="bg-teal-600 text-white font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 w-12 text-center">No</th>
                          <th className="px-4 py-2">Keterangan</th>
                          <th className="px-4 py-2 text-right">Nominal</th>
                          <th className="px-4 py-2 w-24 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {discounts.length === 0 ? (
                          initialPotongan > 0 ? (
                            <tr className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-2 text-center">1</td>
                              <td className="px-4 py-2">
                                Potongan Awal Transaksi
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-red-600">
                                - {formatRupiah(initialPotongan)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => {
                                    setPotonganForm({
                                      tanggal:
                                        sale.tanggal_booking ||
                                        new Date().toISOString().slice(0, 10),
                                      nominal: formatRibuan(
                                        String(initialPotongan),
                                      ),
                                      keterangan: "Potongan Awal Transaksi",
                                    });
                                    setEditingDiscountId(null);
                                    setShowPotonganModal(true);
                                  }}
                                  className="p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded"
                                  title="Edit Potongan"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td
                                colSpan={4}
                                className="text-center py-4 text-slate-500"
                              >
                                Belum ada potongan.
                              </td>
                            </tr>
                          )
                        ) : (
                          discounts.map((d, i) => (
                            <tr
                              key={d.id}
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="px-4 py-2 text-center">{i + 1}</td>
                              <td className="px-4 py-2">
                                {d.keterangan || "-"}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-red-600">
                                - {formatRupiah(d.nominal)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => openEditPotonganModal(d)}
                                    className="p-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePotongan(d.id)}
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
                        {(discounts.length > 0 || initialPotongan > 0) && (
                          <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                            <td colSpan={2} className="px-4 py-3 text-right">
                              TOTAL POTONGAN
                            </td>
                            <td className="px-4 py-3 text-right text-red-700">
                              - {formatRupiah(totalPotongan)}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Daftar Biaya Tambahan */}
                <div className="pt-4 mt-6 border-t border-dashed border-slate-300">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-500" /> Daftar Biaya
                    Tambahan
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200">
                      <thead className="bg-teal-600 text-white font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 w-12 text-center">No</th>
                          <th className="px-4 py-2">Keterangan</th>
                          <th className="px-4 py-2 text-right">Nominal</th>
                          <th className="px-4 py-2 w-20 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {additionalCosts.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-4 text-slate-500"
                            >
                              Belum ada biaya tambahan.
                            </td>
                          </tr>
                        ) : (
                          additionalCosts.map((c, i) => (
                            <tr
                              key={c.id}
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="px-4 py-2 text-center">{i + 1}</td>
                              <td className="px-4 py-2">
                                {c.keterangan || "-"}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-green-600">
                                {formatRupiah(c.nominal)}
                              </td>
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
                            <td colSpan={2} className="px-4 py-3 text-right">
                              TOTAL BIAYA TAMBAHAN
                            </td>
                            <td className="px-4 py-3 text-right text-green-700">
                              {formatRupiah(totalBiayaTambahan)}
                            </td>
                            <td></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Daftar Surat Tagihan */}
                <div className="pt-4 mt-6 border-t border-dashed border-slate-300">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> Daftar Surat
                    Tagihan
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border border-slate-200">
                      <thead className="bg-teal-600 text-white font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2">Tgl Tagihan</th>
                          <th className="px-4 py-2">Jatuh Tempo</th>
                          <th className="px-4 py-2 text-right">Kekurangan</th>
                          <th className="px-4 py-2 w-20 text-center">Cetak</th>
                        </tr>
                      </thead>
                      <tbody>
                        {billingLetters.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="text-center py-4 text-slate-500"
                            >
                              Tidak ada surat tagihan.
                            </td>
                          </tr>
                        ) : (
                          billingLetters.map((b) => (
                            <tr
                              key={b.id}
                              className="border-b border-slate-100 hover:bg-slate-50"
                            >
                              <td className="px-4 py-2">
                                {new Date(b.tgl_tagihan).toLocaleDateString(
                                  "id-ID",
                                )}
                              </td>
                              <td className="px-4 py-2 text-red-600 font-medium">
                                {new Date(b.jatuh_tempo).toLocaleDateString(
                                  "id-ID",
                                )}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold">
                                {formatRupiah(b.kekurangan)}
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  className="p-1 bg-amber-100 text-amber-600 hover:bg-amber-200 rounded"
                                  title="Cetak Surat"
                                >
                                  <Printer className="w-4 h-4 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === "info_kpr" ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm mb-6">
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="font-semibold text-slate-600">Bank</span>
                    <span>:</span>
                    <span className="font-bold text-slate-800">
                      {bank?.nama_bank || sale.bank_nama || "-"}
                    </span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="font-semibold text-slate-600">
                      Kredit Pengajuan
                    </span>
                    <span>:</span>
                    <span className="font-bold text-slate-800">
                      {formatRupiah(
                        sale.kredit_pengajuan || unit?.maksimal_kredit || 0,
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-[130px_10px_1fr]">
                    <span className="font-semibold text-slate-600">Status</span>
                    <span>:</span>
                    <span
                      className={`inline-block w-fit px-2.5 py-0.5 rounded border text-xs font-bold ${statusBadgeClass(
                        sale.kpr_status === "REJECTED" ? "REJECTED" : currentKprStatus,
                      )}`}
                    >
                      {sale.kpr_status === "REJECTED" ? "REJECTED" : currentKprStatus}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 mb-3 text-base">
                  Daftar Return
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border border-slate-200">
                    <thead className="bg-teal-600 text-white font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2">No Kwitansi & Tgl</th>
                        <th className="px-4 py-2">Keterangan</th>
                        <th className="px-4 py-2 text-right">Nominal</th>
                        <th className="px-4 py-2 w-28 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kprSubmissions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-4 text-slate-500"
                          >
                            Belum ada riwayat pengajuan.
                          </td>
                        </tr>
                      ) : (
                        kprSubmissions.map((k) => (
                          <tr
                            key={k.id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-4 py-2">
                              <div className="font-bold text-slate-800">
                                {k.no_referensi || "-"}
                              </div>
                              <div className="text-xs text-slate-500">
                                {new Date(k.tanggal).toLocaleDateString(
                                  "id-ID",
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold mr-1 ${statusBadgeClass(k.status)}`}
                              >
                                {k.status}
                              </span>
                              {k.keterangan || "-"}
                            </td>
                            <td className="px-4 py-2 text-right font-semibold">
                              {formatRupiah(k.kredit_acc)}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openEditApprovalModal(k)}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border border-blue-200 transition"
                                  title="Edit Pengajuan KPR"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleCancelSubmission(k.id)}
                                  className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 transition"
                                  title="Hapus / Batalkan Pengajuan KPR"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold">
                        <td colSpan={2} className="px-4 py-3 text-right">
                          Total
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatRupiah(totalReturn)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-l-2 border-slate-200 ml-3 pl-4 space-y-6 mt-4">
                  {stepHistory.filter((h) => h.jenis_step === activeTab)
                    .length === 0 ? (
                    <p className="text-sm text-slate-500 italic">
                      Belum ada riwayat aktivitas.
                    </p>
                  ) : (
                    stepHistory
                      .filter((h) => h.jenis_step === activeTab)
                      .map((hist) => (
                        <div
                          key={hist.id}
                          className="relative group p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition shadow-xs"
                        >
                          <div className="absolute -left-[23px] top-4 w-3 h-3 bg-blue-500 rounded-full border-[3px] border-white shadow-sm" />
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm">
                                {hist.status}
                              </span>
                              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-semibold">
                                {new Date(hist.created_at).toLocaleString(
                                  "id-ID",
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                onClick={() => openEditProgresModal(hist)}
                                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                                title="Edit Progres"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProgres(hist.id)}
                                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
                                title="Hapus Riwayat Progres"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600">
                            {hist.keterangan ||
                              "Tidak ada keterangan tambahan."}
                          </p>
                          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Diupdate oleh:{" "}
                            {hist.changed_by_nama}
                          </p>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingDiscountId ? "Edit Potongan" : "Input Potongan Baru"}
              </h3>
              <button
                onClick={() => {
                  setShowPotonganModal(false);
                  setEditingDiscountId(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={potonganForm.tanggal}
                  onChange={(e) =>
                    setPotonganForm({
                      ...potonganForm,
                      tanggal: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Nominal Potongan (Rp) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 5.000.000"
                  value={potonganForm.nominal}
                  onChange={(e) =>
                    setPotonganForm({
                      ...potonganForm,
                      nominal: formatRibuan(e.target.value),
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Alasan potongan..."
                  value={potonganForm.keterangan}
                  onChange={(e) =>
                    setPotonganForm({
                      ...potonganForm,
                      keterangan: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => {
                  setShowPotonganModal(false);
                  setEditingDiscountId(null);
                }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSavePotongan}
                disabled={
                  saving || !potonganForm.nominal || !potonganForm.tanggal
                }
                className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input / Edit Angsuran */}
      {showAngsuranModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingPaymentId
                  ? "Edit Data Pembayaran"
                  : "Form Input Cicilan"}
              </h3>
              <button
                onClick={() => {
                  setShowAngsuranModal(false);
                  setEditingPaymentId(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={angsuranForm.tanggal}
                  onChange={(e) =>
                    setAngsuranForm({
                      ...angsuranForm,
                      tanggal: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Uang Masuk ke *
                </label>
                <select
                  value={angsuranForm.bank_tujuan}
                  onChange={(e) =>
                    setAngsuranForm({
                      ...angsuranForm,
                      bank_tujuan: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Rekening --</option>
                  {REKENING_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Sebesar (Rp) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2.500.000"
                  value={angsuranForm.nominal}
                  onChange={(e) =>
                    setAngsuranForm({
                      ...angsuranForm,
                      nominal: formatRibuan(e.target.value),
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Diterima Dari *
                </label>
                <input
                  type="text"
                  placeholder="Nama pengirim/pembayar..."
                  value={angsuranForm.diterima_dari}
                  onChange={(e) =>
                    setAngsuranForm({
                      ...angsuranForm,
                      diterima_dari: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Keterangan
                </label>
                <textarea
                  placeholder="Catatan tambahan (opsional)..."
                  value={angsuranForm.keterangan}
                  onChange={(e) =>
                    setAngsuranForm({
                      ...angsuranForm,
                      keterangan: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => {
                  setShowAngsuranModal(false);
                  setEditingPaymentId(null);
                }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveAngsuran}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Approval Pengajuan KPR */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingKprId ? "Edit Approval Pengajuan KPR" : "Form Approval Pengajuan KPR"}
              </h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setEditingKprId(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Tanggal *
                </label>
                <input
                  type="date"
                  value={approvalForm.tanggal}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      tanggal: e.target.value,
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Status *
                </label>
                <select
                  value={approvalForm.status}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      status: e.target.value as any,
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Kredit Acc (Rp) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 160.000.000"
                  value={approvalForm.kredit_acc}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      kredit_acc: formatRibuan(e.target.value),
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Biaya Tambahan (Rp) *
                </label>
                <input
                  type="text"
                  placeholder="0"
                  value={approvalForm.biaya_tambahan}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      biaya_tambahan: formatRibuan(e.target.value),
                    })
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Keterangan
                </label>
                <textarea
                  placeholder="Catatan tambahan (opsional)..."
                  value={approvalForm.keterangan}
                  onChange={(e) =>
                    setApprovalForm({
                      ...approvalForm,
                      keterangan: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveApproval}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ganti Bank Tujuan */}
      {showGantiBankModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">
              Ganti Bank Tujuan KPR
            </h3>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">
                Pilih Bank *
              </label>
              <select
                value={gantiBankId}
                onChange={(e) => setGantiBankId(e.target.value)}
                className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Pilih Bank --</option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama_bank} {b.cabang ? `- ${b.cabang}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setShowGantiBankModal(false)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveGantiBank}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
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

      {/* Modal Detail Konsumen */}
      {showDetailKonsumenModal && customer && (
        <DetailKonsumenModal
          customer={customer}
          onClose={() => setShowDetailKonsumenModal(false)}
          onEdit={() => {
            setShowDetailKonsumenModal(false);
            setShowUpdateKonsumenModal(true);
          }}
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
          bank={banks.find((b) => b.id === sale?.bank_id)}
          onClose={() => setShowPersyaratanModal(false)}
        />
      )}

      {/* Modal Input / Edit Progres */}
      {showProgresModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingStepId ? "Edit Progres" : "Input Progres"} -{" "}
                {TABS.find((t) => t.id === activeTab)?.label}
              </h3>
              <button
                onClick={() => {
                  setShowProgresModal(false);
                  setEditingStepId(null);
                  setProgresForm({ status: "", keterangan: "" });
                }}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Status/Step *
                </label>
                {activeTab === "penjualan" ? (
                  <select
                    value={progresForm.status}
                    onChange={(e) =>
                      setProgresForm({ ...progresForm, status: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Pilih Step Penjualan...</option>
                    {salesSteps.map((s) => (
                      <option key={s.id} value={s.nama_step}>
                        {s.nama_step}
                      </option>
                    ))}
                  </select>
                ) : activeTab === "sertifikat" ? (
                  <select
                    value={progresForm.status}
                    onChange={(e) =>
                      setProgresForm({ ...progresForm, status: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Pilih Step Sertifikat...</option>
                    {certificateSteps.map((c) => (
                      <option key={c.id} value={c.nama_step}>
                        {c.nama_step}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={progresForm.status}
                    onChange={(e) =>
                      setProgresForm({ ...progresForm, status: e.target.value })
                    }
                    className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Pilih Posisi Sertifikat...</option>
                    <option value="Di Developer (Kantor)">
                      Di Developer (Kantor)
                    </option>
                    <option value="Di BPN / Proses Notaris">
                      Di BPN / Proses Notaris
                    </option>
                    <option value="Di Bank Partner (Jaminan)">
                      Di Bank Partner (Jaminan)
                    </option>
                    <option value="Diserahkan ke Konsumen">
                      Diserahkan ke Konsumen
                    </option>
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Keterangan / Progress Detail
                </label>
                <textarea
                  placeholder="Catatan tambahan..."
                  value={progresForm.keterangan}
                  onChange={(e) =>
                    setProgresForm({
                      ...progresForm,
                      keterangan: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => {
                  setShowProgresModal(false);
                  setProgresForm({ status: "", keterangan: "" });
                }}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveProgres}
                disabled={saving || !progresForm.status}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Harga Pajak */}
      {showUbahHargaModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">
              Ubah Harga Jual Pajak
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Harga Jual (untuk laporan penjualan - PAJAK) (Rp) *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 150.000.000"
                  value={hargaPajakForm}
                  onChange={(e) =>
                    setHargaPajakForm(formatRibuan(e.target.value))
                  }
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setShowUbahHargaModal(false)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveHargaPajak}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Komitmen Pembayaran */}
      {showKomitmenModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-150">
            <h3 className="font-bold text-slate-800 text-lg mb-1">
              Ubah Komitmen Pembayaran
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan rincian kesepakatan atau komitmen pembayaran untuk unit ini.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">
                  Komitmen / Catatan Pembayaran
                </label>
                <textarea
                  rows={4}
                  placeholder="Contoh: PEMBELIAN CASH BERTAHAP HARGA 166 JT BELUM TERMASUK BIAYA BALIK NAMA DAN PAJAK"
                  value={komitmenForm}
                  onChange={(e) => setKomitmenForm(e.target.value)}
                  className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setShowKomitmenModal(false)}
                className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleSaveKomitmen}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Komitmen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
