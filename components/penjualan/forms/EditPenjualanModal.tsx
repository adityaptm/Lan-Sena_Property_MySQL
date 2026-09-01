"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useData } from "@/lib/data-context";
import { formatRupiah } from "@/lib/format";
import {
  X,
  Save,
  User,
  Home,
  Wallet,
  Building2,
  Calendar,
  Percent,
  DollarSign,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { Sale, Customer, Unit, Marketer, Bank } from "@/types";

interface EditPenjualanModalProps {
  sale: Sale | any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditPenjualanModal({
  sale,
  isOpen,
  onClose,
  onSuccess,
}: EditPenjualanModalProps) {
  const {
    customers,
    units,
    blocks,
    locations,
    marketers,
    banks,
    updateSale,
    refresh,
  } = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [customerId, setCustomerId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [marketerId, setMarketerId] = useState("");
  const [feeMarketer, setFeeMarketer] = useState<number>(0);
  const [metodeBayar, setMetodeBayar] = useState<
    "Cash" | "Cash Bertahap" | "Cash Keras" | "KPR"
  >("KPR");
  const [bankId, setBankId] = useState("");
  const [kprStatus, setKprStatus] = useState("WAITING");
  const [status, setStatus] = useState<
    "Booking" | "DP" | "Akad" | "Lunas" | "Batal"
  >("Booking");
  const [tanggalBooking, setTanggalBooking] = useState("");
  const [hargaKesepakatan, setHargaKesepakatan] = useState<number>(0);
  const [potongan, setPotongan] = useState<number>(0);
  const [bookingFee, setBookingFee] = useState<number>(0);
  const [dpNominal, setDpNominal] = useState<number>(0);
  const [kreditPengajuan, setKreditPengajuan] = useState<number>(0);
  const [komitmenPembayaran, setKomitmenPembayaran] = useState("");

  // Initialize form when sale changes
  useEffect(() => {
    if (!sale) return;
    setCustomerId(sale.customer_id || "");
    setUnitId(sale.unit_id || "");
    setMarketerId(sale.marketer_id || "");
    setFeeMarketer(Number(sale.fee_marketer || 0));
    setMetodeBayar(sale.metode_bayar || "KPR");
    setBankId(sale.bank_id || "");
    setKprStatus(sale.kpr_status || "WAITING");
    setStatus(sale.status || "Booking");
    setTanggalBooking(
      sale.tanggal_booking
        ? new Date(sale.tanggal_booking).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    );
    const initialHarga = Number(
      sale.harga_kesepakatan || sale.harga_jual_awal || sale.total_harga || 0,
    );
    const initialPotongan = Number(sale.potongan || sale.diskon || 0);
    setHargaKesepakatan(initialHarga);
    setPotongan(initialPotongan);
    setBookingFee(Number(sale.booking_fee || 0));
    setDpNominal(Number(sale.dp_nominal || 0));
    setKreditPengajuan(Number(sale.kredit_pengajuan || 0));
    setKomitmenPembayaran(sale.komitmen_pembayaran || "");
    setErrorMsg("");
  }, [sale]);

  // Selected unit details
  const selectedUnit = useMemo(
    () => units.find((u) => u.id === unitId),
    [units, unitId],
  );

  // Total Harga Final calculated
  const totalHargaFinal = Math.max(0, hargaKesepakatan - potongan);

  if (!isOpen || !sale) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale?.id) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const selectedCust = customers.find((c) => c.id === customerId);
      const selectedMkt = marketers?.find((m) => m.id === marketerId);
      const selectedBnk = banks?.find((b) => b.id === bankId);

      const updatePayload: Partial<Sale> = {
        customer_id: customerId || sale.customer_id,
        customer_nama: selectedCust?.nama || sale.customer_nama,
        customer_hp: selectedCust?.no_hp || sale.customer_hp,
        customer_job:
          selectedCust?.instansi ||
          selectedCust?.pekerjaan ||
          sale.customer_job,
        customer_nik: selectedCust?.nik || sale.customer_nik,
        unit_id: unitId || sale.unit_id,
        unit_no: selectedUnit?.no_unit || sale.unit_no,
        block_nama: selectedUnit?.block_nama || sale.block_nama,
        location_nama: selectedUnit?.location_nama || sale.location_nama,
        marketer_id: marketerId || undefined,
        marketer_nama: selectedMkt?.nama || undefined,
        fee_marketer: feeMarketer,
        metode_bayar: metodeBayar,
        bank_id: metodeBayar === "KPR" ? bankId || undefined : undefined,
        bank_nama:
          metodeBayar === "KPR" ? selectedBnk?.nama_bank || undefined : undefined,
        kpr_status: metodeBayar === "KPR" ? kprStatus : undefined,
        status: status,
        tanggal_booking: tanggalBooking,
        harga_kesepakatan: hargaKesepakatan,
        harga_jual_awal: hargaKesepakatan,
        potongan: potongan,
        diskon: potongan,
        total_harga: totalHargaFinal,
        booking_fee: bookingFee,
        dp_nominal: dpNominal,
        kredit_pengajuan:
          metodeBayar === "KPR" ? kreditPengajuan : undefined,
        komitmen_pembayaran: komitmenPembayaran || undefined,
      };

      await updateSale(sale.id, updatePayload);

      // If unit changed, update old unit status to Tersedia and new unit status to sales status
      if (sale.unit_id && unitId && sale.unit_id !== unitId) {
        await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            table: "units",
            data: { status: "Tersedia" },
            filters: [{ column: "id", op: "eq", value: sale.unit_id }],
          }),
        });
        await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            table: "units",
            data: {
              status: status === "Batal" ? "Tersedia" : status,
            },
            filters: [{ column: "id", op: "eq", value: unitId }],
          }),
        });
      }

      await refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Gagal mengupdate penjualan:", err);
      setErrorMsg(err.message || "Gagal menyimpan perubahan penjualan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-3.5 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight leading-tight">
                Edit Data Penjualan
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                {sale.customer_nama} — BLOK {sale.block_nama} No {sale.unit_no}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Customer & Marketer */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Konsumen &amp; Marketer</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Konsumen / Pembeli <span className="text-red-500">*</span>
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Konsumen --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama} {c.no_hp ? `(${c.no_hp})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Marketer / Sales
                </label>
                <select
                  value={marketerId}
                  onChange={(e) => setMarketerId(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Tanpa Marketer (Direct) --</option>
                  {marketers?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Fee Marketer (Rp)
                </label>
                <input
                  type="number"
                  value={feeMarketer || ""}
                  onChange={(e) => setFeeMarketer(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Tanggal Booking / Transaksi
                </label>
                <input
                  type="date"
                  value={tanggalBooking}
                  onChange={(e) => setTanggalBooking(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Unit Rumah */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-teal-600" />
              <span>2. Unit Rumah &amp; Lokasi</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">
                  Pilih Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Unit --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      BLOK {u.block_nama} No {u.no_unit} ({u.location_nama} - {u.unit_type_nama || "Rumah"}) — {u.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Metode Bayar & Status */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Metode Pembayaran &amp; Status</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Metode Pembayaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={metodeBayar}
                  onChange={(e) =>
                    setMetodeBayar(e.target.value as any)
                  }
                  required
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                >
                  <option value="KPR">KPR</option>
                  <option value="Cash">Cash</option>
                  <option value="Cash Bertahap">Cash Bertahap</option>
                  <option value="Cash Keras">Cash Keras</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Status Transaksi
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                >
                  <option value="Booking">Booking</option>
                  <option value="DP">DP (Uang Muka)</option>
                  <option value="Akad">Akad</option>
                  <option value="Lunas">Lunas</option>
                  <option value="Batal">Batal / Refund</option>
                </select>
              </div>

              {metodeBayar === "KPR" && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Bank Partner KPR
                    </label>
                    <select
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Bank --</option>
                      {banks?.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nama_bank} {b.cabang ? `(${b.cabang})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Status Approval KPR
                    </label>
                    <select
                      value={kprStatus}
                      onChange={(e) => setKprStatus(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    >
                      <option value="WAITING">WAITING (Menunggu / Proses)</option>
                      <option value="ACCEPTED">ACCEPTED (Disetujui Bank)</option>
                      <option value="REJECTED">REJECTED (Ditolak / Batal)</option>
                      <option value="SP3K">SP3K</option>
                      <option value="Akad">Akad KPR</option>
                      <option value="Berkas Lengkap">Berkas Lengkap</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: Nilai Transaksi & Harga */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-600" />
              <span>4. Rincian Harga &amp; Finansial</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Harga Kesepakatan (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={hargaKesepakatan || ""}
                  onChange={(e) => setHargaKesepakatan(Number(e.target.value))}
                  required
                  placeholder="0"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Potongan / Diskon (Rp)
                </label>
                <input
                  type="number"
                  value={potongan || ""}
                  onChange={(e) => setPotongan(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-rose-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Total Harga Final (Rp)
                </label>
                <div className="px-2.5 py-1.5 bg-slate-200/80 border border-slate-300 rounded font-bold text-slate-900">
                  {formatRupiah(totalHargaFinal)}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Booking Fee (Rp)
                </label>
                <input
                  type="number"
                  value={bookingFee || ""}
                  onChange={(e) => setBookingFee(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  Uang Muka / DP (Rp)
                </label>
                <input
                  type="number"
                  value={dpNominal || ""}
                  onChange={(e) => setDpNominal(Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {metodeBayar === "KPR" && (
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">
                    Kredit Pengajuan (Rp)
                  </label>
                  <input
                    type="number"
                    value={kreditPengajuan || ""}
                    onChange={(e) => setKreditPengajuan(Number(e.target.value))}
                    placeholder="0"
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-teal-700 font-semibold"
                  />
                </div>
              )}

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-600 mb-1">
                  Komitmen Pembayaran / Catatan Khusus
                </label>
                <textarea
                  rows={2}
                  value={komitmenPembayaran}
                  onChange={(e) => setKomitmenPembayaran(e.target.value)}
                  placeholder="Contoh: PEMBELIAN CASH BERTAHAP HARGA 166 JT BELUM TERMASUK BIAYA BALIK NAMA DAN PAJAK..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
