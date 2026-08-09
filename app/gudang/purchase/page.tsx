"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/lib/data-context";
import { Search, Plus, Edit, Eye, Printer, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import type { Purchase } from "@/types";

interface FormItemRow {
  item_id: string;
  qty: number;
  harga_satuan: number;
}

interface PurchaseFormState {
  id?: string;
  no_po?: string;
  tanggal: string;
  admin: string;
  supplier: string;
  toko_alamat: string;
  toko_telepon: string;
  lokasi: string;
  blok: string;
  catatan: string;
  termin: string;
  biaya_pengiriman: number;
  pajak: number;
  metode_pembayaran: string;
  status: Purchase["status"];
  penerima: string;
  alamat_kirim: string;
  items: FormItemRow[];
}

const emptyForm: PurchaseFormState = {
  tanggal: new Date().toISOString().slice(0, 10),
  admin: "",
  supplier: "",
  toko_alamat: "",
  toko_telepon: "",
  lokasi: "Benteng Mutiara Mas",
  blok: "",
  catatan: "",
  termin: "30 HARI",
  biaya_pengiriman: 0,
  pajak: 0,
  metode_pembayaran: "Transfer",
  status: "Belum ditanggapi",
  penerima: "",
  alamat_kirim: "DESA BENTENG - PURWAKARTA",
  items: [{ item_id: "", qty: 1, harga_satuan: 0 }],
};

export default function PurchasePage() {
  const {
    purchases,
    items,
    addPurchase,
    updatePurchase,
    deletePurchase,
    currentUser,
  } = useData();

  const [searchQuery, setSearchQuery] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<Purchase | null>(null);
  const [formState, setFormState] = useState<PurchaseFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const filteredPurchases = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return purchases.filter(
      (p) =>
        (p.supplier || "").toLowerCase().includes(q) ||
        (p.lokasi || "").toLowerCase().includes(q) ||
        (p.blok || "").toLowerCase().includes(q) ||
        (p.admin || "").toLowerCase().includes(q) ||
        (p.status || "").toLowerCase().includes(q),
    );
  }, [purchases, searchQuery]);

  const handleOpenAdd = () => {
    setFormState({
      ...emptyForm,
      admin: currentUser?.nama || "",
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (po: Purchase) => {
    setFormState({
      id: po.id,
      no_po: po.no_po,
      tanggal: po.tanggal,
      admin: po.admin || "",
      supplier: po.supplier,
      toko_alamat: po.toko_alamat || "",
      toko_telepon: po.toko_telepon || "",
      lokasi: po.lokasi || "",
      blok: po.blok || "",
      catatan: po.catatan || "",
      termin: po.termin || "",
      biaya_pengiriman: po.biaya_pengiriman || 0,
      pajak: po.pajak || 0,
      metode_pembayaran: po.metode_pembayaran || "",
      status: po.status,
      penerima: po.penerima || "",
      alamat_kirim: po.alamat_kirim || "",
      items:
        po.items.length > 0
          ? po.items.map((it) => ({
              item_id: it.item_id,
              qty: it.qty,
              harga_satuan: it.harga_satuan,
            }))
          : [{ item_id: "", qty: 1, harga_satuan: 0 }],
    });
    setIsFormOpen(true);
  };

  const handleOpenDetail = (po: Purchase) => {
    setSelectedPo(po);
    setIsDetailOpen(true);
  };

  const handleOpenPrint = (po: Purchase) => {
    setSelectedPo(po);
    setIsPrintOpen(true);
  };

  const handleAddItemRow = () => {
    setFormState((prev) => ({
      ...prev,
      items: [...prev.items, { item_id: "", qty: 1, harga_satuan: 0 }],
    }));
  };

  const handleRemoveItemRow = (idx: number) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleItemPick = (idx: number, itemId: string) => {
    const master = items.find((i) => i.id === itemId);
    setFormState((prev) => {
      const updated = [...prev.items];
      updated[idx] = {
        ...updated[idx],
        item_id: itemId,
        harga_satuan: master ? master.harga_satuan : updated[idx].harga_satuan,
      };
      return { ...prev, items: updated };
    });
  };

  const handleSaveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.supplier || !formState.tanggal) return;

    const validItems = formState.items.filter((it) => it.item_id);
    if (validItems.length === 0) {
      alert("Pilih minimal 1 barang untuk Purchase Order ini.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        no_po: formState.no_po,
        tanggal: formState.tanggal,
        admin: formState.admin,
        supplier: formState.supplier,
        toko_alamat: formState.toko_alamat,
        toko_telepon: formState.toko_telepon,
        lokasi: formState.lokasi,
        blok: formState.blok,
        catatan: formState.catatan,
        termin: formState.termin,
        biaya_pengiriman: formState.biaya_pengiriman,
        pajak: formState.pajak,
        metode_pembayaran: formState.metode_pembayaran,
        status: formState.status,
        penerima: formState.penerima,
        alamat_kirim: formState.alamat_kirim,
        items: validItems,
      };

      if (formState.id) {
        await updatePurchase(formState.id, payload);
      } else {
        await addPurchase(payload);
      }

      setIsFormOpen(false);
    } catch (err: any) {
      alert(
        `Gagal menyimpan Purchase Order: ${err?.message || "Cek console log."}`,
      );
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (po: Purchase) => {
    if (!confirm(`Hapus Purchase Order (${po.no_po}) ke ${po.supplier}?`))
      return;
    try {
      await deletePurchase(po.id);
    } catch (err: any) {
      alert(err?.message || "Gagal menghapus Purchase Order.");
    }
  };

  const handleExportExcel = () => {
    const data = filteredPurchases.map((p) => ({
      Tanggal: p.tanggal,
      "Dibuat Oleh": p.admin,
      "Toko Tujuan": p.supplier,
      Lokasi: `${p.lokasi || ""} ${p.blok || ""}`.trim(),
      Catatan: p.catatan,
      Status: p.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar_Purchase");
    XLSX.writeFile(workbook, "Daftar_Purchase_Lansena.xlsx");
  };

  const formSubtotal = formState.items.reduce(
    (s, it) => s + (it.qty || 0) * (it.harga_satuan || 0),
    0,
  );
  const formTotal =
    formSubtotal +
    (Number(formState.biaya_pengiriman) || 0) +
    (Number(formState.pajak) || 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Daftar Purchase
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pencatatan &amp; pengelolaan Purchase Order (PO) material proyek
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition border border-emerald-200"
            >
              Export Excel
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Purchase Order</span>
            </button>
          </div>
        </div>

        {/* Main Purchase Table Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="relative w-full sm:w-64 sm:ml-auto">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. PO</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Dibuat Oleh</th>
                  <th className="py-3 px-4">Toko Tujuan</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Tidak ada purchase order ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((po) => (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium">
                        {po.no_po}
                      </td>
                      <td className="py-3 px-4 font-mono">{po.tanggal}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {po.admin || "-"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {po.supplier}
                      </td>
                      <td className="py-3 px-4">
                        {po.lokasi} {po.blok}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            po.status === "Disetujui" || po.status === "Selesai"
                              ? "bg-emerald-100 text-emerald-700"
                              : po.status === "Ditolak"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetail(po)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                            title="Detail Purchase"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>Detail</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(po)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition"
                            title="Edit Form"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleOpenPrint(po)}
                            className="px-2.5 py-1 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded text-xs font-bold inline-flex items-center gap-1 transition shadow-sm"
                            title="Print PO"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>
                          <button
                            onClick={() => handleDelete(po)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-xs font-semibold inline-flex items-center gap-1 transition border border-rose-200"
                            title="Hapus Purchase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
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

        {/* 1. Form Edit / Add Purchase Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h2 className="text-lg font-bold text-slate-800">
                  {formState.id ? "Edit Purchase Order" : "Form Purchase Baru"}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  [X]
                </button>
              </div>

              <form onSubmit={handleSaveData} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tanggal *
                    </label>
                    <input
                      type="date"
                      required
                      value={formState.tanggal}
                      onChange={(e) =>
                        setFormState({ ...formState, tanggal: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Dibuat Oleh (Admin)
                    </label>
                    <input
                      type="text"
                      value={formState.admin}
                      onChange={(e) =>
                        setFormState({ ...formState, admin: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Toko Tujuan *
                    </label>
                    <input
                      type="text"
                      required
                      value={formState.supplier}
                      onChange={(e) =>
                        setFormState({ ...formState, supplier: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="PT. TRIPILAR ABADI BANGUN PERSADA"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      No. Telepon Toko
                    </label>
                    <input
                      type="text"
                      value={formState.toko_telepon}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          toko_telepon: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Alamat Toko
                  </label>
                  <input
                    type="text"
                    value={formState.toko_alamat}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        toko_alamat: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Lokasi Proyek
                    </label>
                    <input
                      type="text"
                      value={formState.lokasi}
                      onChange={(e) =>
                        setFormState({ ...formState, lokasi: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Blok
                    </label>
                    <input
                      type="text"
                      value={formState.blok}
                      onChange={(e) =>
                        setFormState({ ...formState, blok: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Catatan
                    </label>
                    <input
                      type="text"
                      value={formState.catatan}
                      onChange={(e) =>
                        setFormState({ ...formState, catatan: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="CASH"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Termin
                    </label>
                    <input
                      type="text"
                      value={formState.termin}
                      onChange={(e) =>
                        setFormState({ ...formState, termin: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="30 HARI"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Biaya Pengiriman
                    </label>
                    <input
                      type="number"
                      value={formState.biaya_pengiriman}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          biaya_pengiriman: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pajak
                    </label>
                    <input
                      type="number"
                      value={formState.pajak}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          pajak: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formState.status}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          status: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
                    >
                      <option value="Belum ditanggapi">Belum ditanggapi</option>
                      <option value="Disetujui">Disetujui</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Ditolak">Ditolak</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Penerima
                    </label>
                    <input
                      type="text"
                      value={formState.penerima}
                      onChange={(e) =>
                        setFormState({ ...formState, penerima: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Nama (No HP)"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alamat Kirim
                    </label>
                    <input
                      type="text"
                      value={formState.alamat_kirim}
                      onChange={(e) =>
                        setFormState({
                          ...formState,
                          alamat_kirim: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <input
                    type="text"
                    value={formState.metode_pembayaran}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        metode_pembayaran: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Transfer"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    *) Gunakan tanda koma (,) jika metode pembayaran lebih dari
                    satu
                  </p>
                </div>

                {/* Sub Table Item Purchase — dipilih dari data gudang */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">
                      Daftar Item Barang *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded text-[11px] inline-flex items-center gap-1 border border-blue-200"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Item</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formState.items.map((it, idx) => {
                      const master = items.find((i) => i.id === it.item_id);
                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200"
                        >
                          <div className="col-span-5">
                            <select
                              required
                              value={it.item_id}
                              onChange={(e) =>
                                handleItemPick(idx, e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs"
                            >
                              <option value="">-- Pilih Barang --</option>
                              {items.map((im) => (
                                <option key={im.id} value={im.id}>
                                  {im.nama_barang}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="Qty"
                              min={1}
                              value={it.qty}
                              onChange={(e) => {
                                const updated = [...formState.items];
                                updated[idx].qty = Number(e.target.value);
                                setFormState({ ...formState, items: updated });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </div>
                          <div className="col-span-2 text-center text-slate-500 font-semibold">
                            {master?.satuan || "-"}
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              placeholder="Harga"
                              value={it.harga_satuan}
                              onChange={(e) => {
                                const updated = [...formState.items];
                                updated[idx].harga_satuan = Number(
                                  e.target.value,
                                );
                                setFormState({ ...formState, items: updated });
                              }}
                              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                            />
                          </div>
                          <div className="col-span-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end text-xs font-bold text-slate-700 pt-2">
                    Total: Rp {formTotal.toLocaleString("id-ID")}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-lg transition shadow-md disabled:opacity-50"
                  >
                    {isSaving ? "Menyimpan..." : "Save Data"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. Detail Purchase Modal */}
        {isDetailOpen && selectedPo && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Daftar Purchase
                  </h2>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    Detail Purchase
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  Tutup [X]
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-1">
                  Informasi Purchase
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      No. PO:
                    </span>{" "}
                    <span className="font-mono">{selectedPo.no_po}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      Tanggal:
                    </span>{" "}
                    <span className="font-mono">{selectedPo.tanggal}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      Dibuat Oleh:
                    </span>{" "}
                    <span className="font-bold text-slate-800">
                      {selectedPo.admin || "-"}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      Untuk Lokasi:
                    </span>{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedPo.lokasi} {selectedPo.blok}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      Catatan:
                    </span>{" "}
                    <span>{selectedPo.catatan || "-"}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500 inline-block w-28">
                      Status:
                    </span>{" "}
                    <span className="font-bold text-emerald-600">
                      {selectedPo.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-sm">
                  Daftar Item Purchase
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12 text-center">No</th>
                        <th className="p-3">Nama Barang</th>
                        <th className="p-3 text-center">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPo.items.map((item, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-3 text-center font-bold text-slate-500">
                            {idx + 1}.
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {item.nama_barang || "-"}
                          </td>
                          <td className="p-3 text-center font-bold text-blue-600 font-mono">
                            {item.qty} {item.satuan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Official Print Purchase Order Modal */}
        {isPrintOpen && selectedPo && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 space-y-6 text-slate-900 my-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                <p className="text-xs text-slate-500 font-bold">
                  Pratinjau Print Purchase Order
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak PO</span>
                  </button>
                  <button
                    onClick={() => setIsPrintOpen(false)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                  >
                    Tutup [X]
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white font-sans text-xs text-slate-900 leading-normal space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.jpg"
                      alt="Logo"
                      className="h-16 w-auto object-contain"
                    />
                    <div>
                      <h1 className="text-xl font-black text-slate-900 tracking-wider">
                        PT LAN SENA JAYA
                      </h1>
                      <p className="text-xs font-bold text-slate-800 tracking-wider">
                        DEVELOPER &amp; CONTRACTOR
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Perum Benteng Mutiara Mas Ruko No. 16 Babakan Situ
                        004/002
                      </p>
                      <p className="text-[10px] text-slate-600">
                        Desa Benteng Kec. Cempaka Kab. Purwakarta (0264) -
                        8308450 Jawa Barat 41181
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center py-2">
                  <h2 className="text-base font-extrabold tracking-widest text-slate-900 uppercase underline decoration-2 underline-offset-4">
                    PURCHASE ORDER
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/80 p-3.5 rounded-lg border border-slate-300">
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        Kepada:
                      </span>{" "}
                      <span className="font-bold">{selectedPo.supplier}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        Alamat:
                      </span>{" "}
                      <span>{selectedPo.toko_alamat || "-"}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        Telepon:
                      </span>{" "}
                      <span>{selectedPo.toko_telepon || "-"}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        PO Number:
                      </span>{" "}
                      <span className="font-bold font-mono">
                        {selectedPo.no_po}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        Tanggal:
                      </span>{" "}
                      <span>{selectedPo.tanggal}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        Proyek:
                      </span>{" "}
                      <span className="font-bold">{selectedPo.lokasi}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        Termin:
                      </span>{" "}
                      <span className="font-bold">{selectedPo.termin}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        Penerima:
                      </span>{" "}
                      <span>{selectedPo.penerima || "-"}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-600 inline-block w-24">
                        Alamat Kirim:
                      </span>{" "}
                      <span>{selectedPo.alamat_kirim || "-"}</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    A. Bahan Material
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="border border-slate-300 p-2 w-10 text-center">
                          No
                        </th>
                        <th className="border border-slate-300 p-2 text-left">
                          Description
                        </th>
                        <th className="border border-slate-300 p-2 w-16 text-center">
                          Qty
                        </th>
                        <th className="border border-slate-300 p-2 w-20 text-center">
                          Satuan
                        </th>
                        <th className="border border-slate-300 p-2 w-28 text-right">
                          Harga
                        </th>
                        <th className="border border-slate-300 p-2 w-32 text-right">
                          Jumlah
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPo.items.map((it, idx) => {
                        const jumlah = it.qty * it.harga_satuan;
                        return (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-2 text-center">
                              {idx + 1}.
                            </td>
                            <td className="border border-slate-300 p-2 font-bold">
                              {it.nama_barang}
                            </td>
                            <td className="border border-slate-300 p-2 text-center font-bold">
                              {it.qty}
                            </td>
                            <td className="border border-slate-300 p-2 text-center">
                              {it.satuan}
                            </td>
                            <td className="border border-slate-300 p-2 text-right font-mono">
                              {it.harga_satuan.toLocaleString("id-ID")}
                            </td>
                            <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                              Rp{jumlah.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        const subtotal = selectedPo.items.reduce(
                          (s, i) => s + i.qty * i.harga_satuan,
                          0,
                        );
                        const grandTotal =
                          subtotal +
                          (selectedPo.pajak || 0) +
                          (selectedPo.biaya_pengiriman || 0);
                        return (
                          <>
                            <tr>
                              <td
                                colSpan={5}
                                className="border border-slate-300 p-2 text-right font-bold bg-slate-50"
                              >
                                Subtotal
                              </td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-bold bg-slate-50">
                                Rp{subtotal.toLocaleString("id-ID")}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={5}
                                className="border border-slate-300 p-2 text-right font-bold bg-slate-50"
                              >
                                Pajak
                              </td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-bold bg-slate-50">
                                Rp
                                {(selectedPo.pajak || 0).toLocaleString(
                                  "id-ID",
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colSpan={5}
                                className="border border-slate-300 p-2 text-right font-bold bg-slate-50"
                              >
                                Biaya Pengiriman
                              </td>
                              <td className="border border-slate-300 p-2 text-right font-mono font-bold bg-slate-50">
                                Rp
                                {(
                                  selectedPo.biaya_pengiriman || 0
                                ).toLocaleString("id-ID")}
                              </td>
                            </tr>
                            <tr className="font-extrabold text-sm">
                              <td
                                colSpan={5}
                                className="border border-slate-300 p-2 text-right uppercase bg-slate-100"
                              >
                                Total
                              </td>
                              <td className="border border-slate-300 p-2 text-right font-mono bg-slate-100 text-blue-700">
                                Rp{grandTotal.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          </>
                        );
                      })()}
                    </tfoot>
                  </table>
                </div>

                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">
                    B. Sistem Pembayaran
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-800 border-b border-slate-300">
                        <th className="border border-slate-300 p-2 w-10 text-center">
                          No
                        </th>
                        <th className="border border-slate-300 p-2 text-left">
                          Metode Pembayaran
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPo.metode_pembayaran || "-")
                        .split(",")
                        .map((metode, idx) => (
                          <tr key={idx}>
                            <td className="border border-slate-300 p-2 text-center">
                              {idx + 1}.
                            </td>
                            <td className="border border-slate-300 p-2 font-semibold">
                              {metode.trim()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Received by</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="text-[10px] text-slate-400 italic">
                        Official Stamp &amp; Signature
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Prepared by</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="font-bold text-slate-900 underline">
                        {selectedPo.admin || "-"}
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Purchasing
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Approved by</p>
                    <div className="h-16 flex items-end justify-center">
                      <p className="font-bold text-slate-900 underline">
                        Alan Suherlan
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-500 font-semibold">
                      Director
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
