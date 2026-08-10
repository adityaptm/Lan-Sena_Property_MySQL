"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/lib/data-context";
import {
  CheckCircle2,
  Search,
  ExternalLink,
  User,
  Home,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { Customer, Unit } from "@/types";

// Helper to query /api/db
async function dbRequest(body: any): Promise<any> {
  const res = await fetch('/api/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Database error');
  return json.data;
}

// Urutan alami supaya "2" tampil sebelum "10" (bukan urutan teks biasa)
function naturalSort<T>(arr: T[], getKey: (item: T) => string): T[] {
  return [...arr].sort((a, b) =>
    getKey(a).localeCompare(getKey(b), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

const INPUT =
  "w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition disabled:bg-slate-50 disabled:text-slate-400";

export default function InputPenjualanPage() {
  const router = useRouter();
  const {
    customers,
    units,
    marketers,
    banks,
    locations,
    blocks,
    addSale,
    searchCustomers,
  } = useData();

  // --- State pencarian Customer ---
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const customerBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = customerQuery.trim();
    if (q.length < 2) {
      setCustomerResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const result = await searchCustomers(q);
      setCustomerResults(result);
    }, 300);
    return () => clearTimeout(timeout);
  }, [customerQuery, searchCustomers]);

  // Tutup dropdown hasil pencarian kalau klik di luar box-nya
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerBoxRef.current &&
        !customerBoxRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePickCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerQuery(c.nama);
    setShowCustomerDropdown(false);
  };

  const handleCustomerQueryChange = (val: string) => {
    setCustomerQuery(val);
    setSelectedCustomerId(""); // ketik manual = dianggap customer baru sampai pilih dari list lagi
    setShowCustomerDropdown(true);
  };

  // --- State cascading Perumahan > Blok > No Unit ---
  const [locationId, setLocationId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [unitId, setUnitId] = useState("");

  const filteredBlocks = useMemo(
    () =>
      naturalSort(
        blocks.filter((b) => !locationId || b.location_id === locationId),
        (b) => b.nama_blok,
      ),
    [blocks, locationId],
  );

  const availableUnits = useMemo(() => {
    let list = units;

    if (blockId) {
      const selectedBlock = blocks.find((b) => b.id === blockId);
      const bNama = selectedBlock?.nama_blok?.toLowerCase();
      list = units.filter(
        (u) =>
          u.block_id === blockId ||
          (bNama && u.block_nama?.toLowerCase() === bNama),
      );
    } else if (locationId) {
      const selectedLoc = locations.find((l) => l.id === locationId);
      const locNama = selectedLoc?.nama_lokasi?.toLowerCase();
      list = units.filter((u) => {
        if (locNama && u.location_nama?.toLowerCase() === locNama) return true;
        const uBlock = blocks.find((b) => b.id === u.block_id || b.nama_blok === u.block_nama);
        return uBlock && uBlock.location_id === locationId;
      });
    }

    return naturalSort(list, (u) => `${u.block_nama || ''} ${u.no_unit || ''}`);
  }, [units, blockId, locationId, blocks, locations]);

  const selectedUnit: Unit | undefined = useMemo(
    () => units.find((u) => u.id === unitId),
    [units, unitId],
  );

  const handleLocationChange = (val: string) => {
    setLocationId(val);
    setBlockId("");
    setUnitId("");
  };

  const handleBlockChange = (val: string) => {
    setBlockId(val);
    setUnitId("");

    // Auto sync location jika perumahan belum dipilih
    if (val && !locationId) {
      const blk = blocks.find((b) => b.id === val);
      if (blk?.location_id) setLocationId(blk.location_id);
    }
  };

  // --- Form utama ---
  const [formData, setFormData] = useState({
    marketer_nama: "",
    metode_bayar: "KPR" as "KPR" | "Cash Bertahap" | "Cash Keras",
    bank_nama: "Mandiri",
    harga_kesepakatan: 0,
    diskon: 0,
    booking_fee: 0,
    dp_nominal: 0,
    status: "DP" as "Booking" | "DP" | "Akad" | "Lunas",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalHarga = formData.harga_kesepakatan - formData.diskon;

  // Auto-hitung Harga Kesepakatan jika skema KPR
  useEffect(() => {
    if (formData.metode_bayar === "KPR" && selectedUnit) {
      const plafon = selectedUnit.maksimal_kredit || 0;
      const dp = formData.dp_nominal ?? selectedUnit.uang_muka ?? 0;
      const booking = formData.booking_fee ?? selectedUnit.booking_fee ?? 0;
      if (plafon > 0) {
        setFormData((prev) => ({
          ...prev,
          harga_kesepakatan: plafon + dp + booking,
        }));
      }
    }
  }, [
    formData.metode_bayar,
    formData.dp_nominal,
    formData.booking_fee,
    selectedUnit,
  ]);

  // Begitu unit dipilih, auto-isi harga, DP, booking fee dari data master unit
  const handleUnitChange = (val: string) => {
    setUnitId(val);
    const u = units.find((x) => x.id === val);
    if (u) {
      // Auto sync block dan location jika belum diset
      if (!blockId && u.block_id) {
        setBlockId(u.block_id);
      } else if (!blockId && u.block_nama) {
        const foundB = blocks.find((b) => b.nama_blok?.toLowerCase() === u.block_nama?.toLowerCase());
        if (foundB) setBlockId(foundB.id);
      }

      if (!locationId && u.location_nama) {
        const foundL = locations.find((l) => l.nama_lokasi?.toLowerCase() === u.location_nama?.toLowerCase());
        if (foundL) setLocationId(foundL.id);
      }

      const bFee = u.booking_fee || 0;
      const dpNominal = u.uang_muka ?? (u as any).dp_minimal ?? 0;
      const maxKredit = u.maksimal_kredit || 0;
      const hgKesepakatan = maxKredit > 0
        ? maxKredit + dpNominal + bFee
        : (u.harga_dasar || 0) + bFee;

      setFormData((prev) => ({
        ...prev,
        booking_fee: bFee,
        dp_nominal: dpNominal,
        harga_kesepakatan: hgKesepakatan,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!unitId) {
      alert("Silakan pilih Perumahan, Blok, dan No Unit terlebih dahulu.");
      return;
    }
    if (!selectedCustomerId && !customerQuery.trim()) {
      alert("Silakan pilih atau ketik nama customer.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Resolve Customer ID (pakai yang dipilih dari pencarian, atau bikin baru dari nama yang diketik)
      let custId = selectedCustomerId;
      let custNama = customerQuery.trim();

      if (!custId) {
        const dummyNik =
          "0000000000000000-" + Math.floor(Math.random() * 10000);
        const newCustomer = await dbRequest({
          action: 'insert',
          table: 'customers',
          data: {
            nama: custNama,
            nik: dummyNik,
            alamat: "-",
            no_hp: "-",
          },
        });
        custId = newCustomer?.id;
      } else {
        const existing =
          customers.find((c) => c.id === custId) ||
          customerResults.find((c) => c.id === custId);
        if (existing) custNama = existing.nama;
      }

      // 2. Resolve Marketer ID
      let markId = marketers.find(
        (m) =>
          (m.nama || "").toLowerCase() === formData.marketer_nama.toLowerCase(),
      )?.id;

      if (!markId && formData.marketer_nama) {
        const newMarketer = await dbRequest({
          action: 'insert',
          table: 'marketers',
          data: { nama: formData.marketer_nama, no_hp: "-" },
        });
        if (newMarketer) markId = newMarketer?.id;
      }

      // 3. Resolve Bank ID
      let bankId: string | undefined = undefined;
      let finalBankNama: string | undefined = undefined;
      if (formData.metode_bayar === "KPR") {
        const bankRecord = banks.find(
          (b) =>
            (b.nama_bank || "").toLowerCase() ===
            formData.bank_nama.toLowerCase(),
        );
        if (bankRecord) {
          bankId = bankRecord.id;
          finalBankNama = bankRecord.nama_bank;
        } else {
          const newBank = await dbRequest({
            action: 'insert',
            table: 'banks',
            data: {
              nama_bank: formData.bank_nama,
              cabang: "Pusat",
              pic_nama: "-",
              pic_hp: "-",
            },
          });
          if (newBank) {
            bankId = newBank?.id;
            finalBankNama = formData.bank_nama;
          }
        }
      }

      // 4. Simpan Transaksi Penjualan (unit_id sudah pasti valid, tidak ada lagi create-unit di sini)
      const newSale = await addSale({
        customer_id: custId || "",
        customer_nama: custNama,
        unit_id: unitId,
        unit_no: selectedUnit?.no_unit,
        block_nama: selectedUnit?.block_nama,
        location_nama: selectedUnit?.location_nama,
        marketer_id: markId,
        marketer_nama: formData.marketer_nama,
        metode_bayar: formData.metode_bayar,
        bank_id: bankId,
        bank_nama: finalBankNama,
        harga_kesepakatan: formData.harga_kesepakatan,
        diskon: formData.diskon,
        total_harga: totalHarga,
        booking_fee: formData.booking_fee,
        dp_nominal: formData.dp_nominal,
        status: formData.status,
        kpr_status:
          formData.metode_bayar === "KPR" ? "Berkas Lengkap" : undefined,
        tanggal_booking: new Date().toISOString().slice(0, 10),
      });

      if (newSale?.id) {
        router.push(`/penjualan/daftar/${newSale.id}`);
      } else {
        router.push("/penjualan/daftar");
      }
    } catch (err: any) {
      console.error(err);
      alert(
        `Terjadi kesalahan saat menyimpan data: ${err?.message || "Cek console log."}`,
      );
      setIsSubmitting(false);
    }
  };

  // Presentational only — progress indicator derived from existing form state, no logic change
  const stepDone = {
    customer: Boolean(selectedCustomerId || customerQuery.trim()),
    unit: Boolean(unitId),
    payment: Boolean(formData.marketer_nama) && formData.harga_kesepakatan > 0,
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Form Input Penjualan Unit
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Pencatatan Surat Pemesanan Rumah (SPR) &amp; kesepakatan transaksi
              baru
            </p>
          </div>

          {/* Progress pill strip — presentational only */}
          <div className="flex items-center gap-1.5 shrink-0">
            <StepPill
              num={1}
              label="Pembeli"
              active={stepDone.customer}
              color="blue"
            />
            <Dash />
            <StepPill
              num={2}
              label="Unit"
              active={stepDone.unit}
              color="teal"
            />
            <Dash />
            <StepPill
              num={3}
              label="Bayar"
              active={stepDone.payment}
              color="emerald"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Customer */}
          <SectionCard
            num={1}
            color="blue"
            title="Identitas Pembeli"
            subtitle="Cari customer lama atau ketik nama baru"
          >
            <div className="relative" ref={customerBoxRef}>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Cari / Ketik Nama Customer{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ketik minimal 2 huruf untuk cari customer..."
                  value={customerQuery}
                  onChange={(e) => handleCustomerQueryChange(e.target.value)}
                  onFocus={() => setShowCustomerDropdown(true)}
                  className={`${INPUT} pl-10`}
                />
              </div>

              {showCustomerDropdown && customerQuery.trim().length >= 2 && (
                <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {customerResults.length === 0 ? (
                    <div className="px-3.5 py-3 text-xs text-slate-400">
                      Tidak ditemukan — lanjutkan ketik nama untuk buat customer
                      baru.
                    </div>
                  ) : (
                    customerResults.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => handlePickCustomer(c)}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0 transition"
                      >
                        <div className="text-sm font-semibold text-slate-800">
                          {c.nama}
                        </div>
                        <div className="text-xs text-slate-500">{c.no_hp}</div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedCustomerId && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1.5 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  Customer sudah ada di database, tidak akan dibuat data baru.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Section 2: Unit Rumah (cascading dari master data) */}
          <SectionCard
            num={2}
            color="teal"
            title="Pilih Unit Rumah"
            subtitle="Perumahan, blok, dan nomor unit yang akan dijual"
            headerAction={
              <Link
                href="/unit-rumah"
                target="_blank"
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline"
              >
                <span>+ Unit belum ada? Tambah di sini</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Perumahan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={locationId}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className={INPUT}
                >
                  <option value="">-- Pilih Perumahan --</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nama_lokasi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Blok <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  disabled={!locationId}
                  value={blockId}
                  onChange={(e) => handleBlockChange(e.target.value)}
                  className={INPUT}
                >
                  <option value="">
                    {locationId ? "-- Pilih Blok --" : "Pilih Perumahan dulu"}
                  </option>
                  {filteredBlocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama_blok}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  No Unit <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={unitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  className={INPUT}
                >
                  <option value="">
                    {blockId ? "-- Pilih No Unit --" : locationId ? "-- Pilih No Unit --" : "-- Pilih Unit Rumah --"}
                  </option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.block_nama ? `BLOK ${u.block_nama} ` : ''}No {u.no_unit} {u.unit_type_nama ? `(${u.unit_type_nama})` : ''} — {u.status || 'Tersedia'}
                    </option>
                  ))}
                </select>
                {availableUnits.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1.5 font-medium">
                    Tidak ada unit ditemukan untuk perumahan/blok ini.
                  </p>
                )}
              </div>
            </div>

            {selectedUnit && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-teal-50/60 border border-teal-100 rounded-lg p-3.5 text-xs">
                <div>
                  <span className="block text-teal-600/70 font-medium">
                    Tipe Unit
                  </span>
                  <span className="font-bold text-slate-700">
                    {selectedUnit.unit_type_nama || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-teal-600/70 font-medium">
                    Jenis Rumah
                  </span>
                  <span className="font-bold text-slate-700">
                    {selectedUnit.subsidy_type_nama || "-"}
                  </span>
                </div>
                <div>
                  <span className="block text-teal-600/70 font-medium">
                    Harga Dasar
                  </span>
                  <span className="font-bold text-slate-700">
                    {formatRupiah(selectedUnit.harga_dasar || 0)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Marketer / Sales Agent <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                list="marketers-list"
                placeholder="Ketik nama marketer..."
                value={formData.marketer_nama}
                onChange={(e) =>
                  setFormData({ ...formData, marketer_nama: e.target.value })
                }
                className={INPUT}
              />
              <datalist id="marketers-list">
                {marketers.map((m) => (
                  <option key={m.id} value={m.nama || ""} />
                ))}
              </datalist>
            </div>
          </SectionCard>

          {/* Section 3: Skema Pembiayaan & Harga */}
          <SectionCard
            num={3}
            color="emerald"
            title="Skema Pembayaran & Harga Transaksi"
            subtitle="Metode pembayaran, harga kesepakatan, dan pembayaran awal"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Skema Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.metode_bayar}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metode_bayar: e.target.value as any,
                    })
                  }
                  className={INPUT}
                >
                  <option value="KPR">KPR (Kredit Pemilikan Rumah)</option>
                  <option value="Cash Bertahap">Cash Bertahap (Inhouse)</option>
                  <option value="Cash Keras">Cash Keras (Pelunasan)</option>
                </select>
              </div>

              {formData.metode_bayar === "KPR" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Pilih Bank Pengaju KPR
                  </label>
                  <select
                    value={formData.bank_nama}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_nama: e.target.value })
                    }
                    className={INPUT}
                  >
                    <option value="Mandiri">Mandiri</option>
                    <option value="BTN">BTN</option>
                    <option value="BRI">BRI</option>
                    <option value="BJB">BJB</option>
                  </select>
                </div>
              )}
            </div>

            {formData.metode_bayar === "KPR" && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg p-3.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[11px] text-blue-500 font-semibold">
                    Maksimal Kredit (Plafon KPR Unit Ini)
                  </span>
                  <span className="text-sm font-bold text-blue-700">
                    {selectedUnit
                      ? formatRupiah(selectedUnit.maksimal_kredit || 0)
                      : "Pilih unit terlebih dahulu"}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Harga Kesepakatan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  readOnly={formData.metode_bayar === "KPR"}
                  value={formatRupiah(formData.harga_kesepakatan)}
                  onChange={(e) => {
                    if (formData.metode_bayar === "KPR") return;
                    const cleanVal = e.target.value.replace(/\D/g, "");
                    setFormData({
                      ...formData,
                      harga_kesepakatan: Number(cleanVal) || 0,
                    });
                  }}
                  className={`${INPUT} font-semibold ${formData.metode_bayar === "KPR" ? "cursor-not-allowed" : ""}`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Diskon / Potongan (Rp)
                </label>
                <input
                  type="text"
                  value={formatRupiah(formData.diskon)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, "");
                    setFormData({ ...formData, diskon: Number(cleanVal) || 0 });
                  }}
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Total Harga Net (Rp)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`Rp ${totalHarga.toLocaleString("id-ID")}`}
                  className={`${INPUT} bg-emerald-50 border-emerald-200 font-bold text-emerald-700 cursor-default`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Booking Fee (Rp)
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (otomatis dari unit, bisa diedit)
                  </span>
                </label>
                <input
                  type="text"
                  value={formatRupiah(formData.booking_fee)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, "");
                    setFormData({
                      ...formData,
                      booking_fee: Number(cleanVal) || 0,
                    });
                  }}
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Uang Muka (DP) (Rp)
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    (otomatis dari unit, bisa diedit)
                  </span>
                </label>
                <input
                  type="text"
                  value={formatRupiah(formData.dp_nominal)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, "");
                    setFormData({
                      ...formData,
                      dp_nominal: Number(cleanVal) || 0,
                    });
                  }}
                  className={INPUT}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Status Transaksi Initial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className={INPUT}
                >
                  <option value="Booking">Booking Fee Only</option>
                  <option value="DP">Terbayar DP</option>
                  <option value="Akad">Sudah Akad KPR</option>
                  <option value="Lunas">Lunas Cash</option>
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Sticky summary + submit bar */}
          <div className="sticky bottom-4 z-10">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block text-slate-400">Total Net</span>
                  <span className="font-bold text-emerald-600 text-sm">
                    Rp {totalHarga.toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Booking Fee</span>
                  <span className="font-bold text-slate-700 text-sm">
                    Rp {formData.booking_fee.toLocaleString("id-ID")}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400">Uang Muka</span>
                  <span className="font-bold text-slate-700 text-sm">
                    Rp {formData.dp_nominal.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => router.push("/penjualan/daftar")}
                  className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-md text-sm transition shadow-md ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

/* ---------------------------------------------------------------------- */
/* Small presentational helpers (no data/logic — purely layout & styling) */
/* ---------------------------------------------------------------------- */

const COLOR_MAP: Record<
  string,
  { ring: string; bg: string; text: string; grad: string }
> = {
  blue: {
    ring: "ring-blue-100",
    bg: "bg-blue-600",
    text: "text-blue-600",
    grad: "from-blue-500 to-blue-600",
  },
  teal: {
    ring: "ring-teal-100",
    bg: "bg-teal-600",
    text: "text-teal-600",
    grad: "from-teal-500 to-teal-600",
  },
  emerald: {
    ring: "ring-emerald-100",
    bg: "bg-emerald-600",
    text: "text-emerald-600",
    grad: "from-emerald-500 to-emerald-600",
  },
};

function SectionCard({
  num,
  color,
  title,
  subtitle,
  headerAction,
  children,
}: {
  num: number;
  color: "blue" | "teal" | "emerald";
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = COLOR_MAP[color];
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-full ${c.bg} text-white text-xs font-bold flex items-center justify-center shrink-0`}
          >
            {num}
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {headerAction}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function StepPill({
  num,
  label,
  active,
  color,
}: {
  num: number;
  label: string;
  active: boolean;
  color: "blue" | "teal" | "emerald";
}) {
  const c = COLOR_MAP[color];
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition ${
        active
          ? `${c.bg} text-white border-transparent shadow-sm`
          : "bg-white text-slate-400 border-slate-200"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${active ? "bg-white/25" : "bg-slate-100"}`}
      >
        {active ? <CheckCircle2 className="w-3 h-3" /> : num}
      </span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}

function Dash() {
  return <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
}
