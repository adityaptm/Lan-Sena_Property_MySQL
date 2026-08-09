"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/lib/data-context";
import { Modal } from "@/components/ui/Modal";
import { MarketerType, MarketingFee, KATEGORI_UNIT_LIST } from "@/types";
import { Plus, Edit, Trash2 } from "lucide-react";

const formatRupiah = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "";
  return new Intl.NumberFormat("id-ID").format(value);
};

type FeeDraft = Record<string, { booking_fee: string; akad_fee: string }>;

export default function JenisMarketerPage() {
  const {
    marketerTypes,
    marketingFees,
    addMarketerType,
    deleteMarketerType,
    updateMarketingFees,
  } = useData();

  const handleDelete = async (type: MarketerType) => {
    if (confirm(`Yakin ingin menghapus jenis marketer "${type.nama_jenis}"?`)) {
      try {
        await deleteMarketerType(type.id);
      } catch (err: any) {
        alert("Gagal menghapus jenis marketer: " + (err.message || err));
      }
    }
  };

  // Modal: tambah jenis marketer baru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama_jenis: "",
    skema_komisi_default: "",
  });

  // Modal: update matrix fee untuk satu jenis marketer
  const [editingType, setEditingType] = useState<MarketerType | null>(null);
  const [feeDraft, setFeeDraft] = useState<FeeDraft>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feesByType = useMemo(() => {
    const map = new Map<string, Map<string, MarketingFee>>();
    for (const fee of marketingFees) {
      if (!map.has(fee.marketer_type_id))
        map.set(fee.marketer_type_id, new Map());
      map.get(fee.marketer_type_id)!.set(fee.kategori_unit, fee);
    }
    return map;
  }, [marketingFees]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_jenis) return;
    await addMarketerType(formData);
    setFormData({ nama_jenis: "", skema_komisi_default: "" });
    setIsAddModalOpen(false);
  };

  const openEditModal = (type: MarketerType) => {
    const existing = feesByType.get(type.id);
    const draft: FeeDraft = {};
    for (const kategori of KATEGORI_UNIT_LIST) {
      const fee = existing?.get(kategori);
      draft[kategori] = {
        booking_fee:
          fee?.booking_fee != null ? String(fee.booking_fee) : "",
        akad_fee: fee?.akad_fee != null ? String(fee.akad_fee) : "",
      };
    }
    setFeeDraft(draft);
    setEditingType(type);
  };

  const handleDraftChange = (
    kategori: string,
    field: "booking_fee" | "akad_fee",
    value: string,
  ) => {
    // bersihkan karakter non-digit kecuali kosong
    const cleanVal = value.replace(/\D/g, "");
    setFeeDraft((prev) => ({
      ...prev,
      [kategori]: { ...prev[kategori], [field]: cleanVal },
    }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;
    setIsSubmitting(true);

    try {
      const updates = KATEGORI_UNIT_LIST.map((kategori) => ({
        kategori_unit: kategori,
        booking_fee:
          feeDraft[kategori]?.booking_fee === ""
            ? null
            : Number(feeDraft[kategori].booking_fee),
        akad_fee:
          feeDraft[kategori]?.akad_fee === ""
            ? null
            : Number(feeDraft[kategori].akad_fee),
      }));

      await updateMarketingFees(editingType.id, updates);
      setEditingType(null);
    } catch (err: any) {
      alert("Gagal mengupdate marketing fee: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Jenis Marketer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Daftar Jenis Marketer</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jenis Marketer</span>
          </button>
        </div>

        {/* Matrix Table */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-700">
            <thead>
              <tr className="bg-[#0097a7] text-white font-bold">
                <th
                  rowSpan={2}
                  className="px-3 py-2.5 text-left border-r border-b border-teal-500 min-w-[120px] font-bold"
                >
                  Jenis
                </th>
                {KATEGORI_UNIT_LIST.map((kategori) => (
                  <th
                    key={kategori}
                    colSpan={2}
                    className="px-3 py-2 text-center border-r border-b border-teal-500 font-bold whitespace-nowrap"
                  >
                    {kategori}
                  </th>
                ))}
                <th
                  rowSpan={2}
                  className="px-3 py-2.5 text-center border-b border-teal-500 font-bold min-w-[80px]"
                >
                  Aksi
                </th>
              </tr>
              <tr className="bg-[#0097a7] text-white font-bold">
                {KATEGORI_UNIT_LIST.map((kategori) => (
                  <React.Fragment key={kategori}>
                    <th className="px-3 py-1.5 text-center border-r border-b border-teal-500 whitespace-nowrap font-semibold">
                      Booking Fee
                    </th>
                    <th className="px-3 py-1.5 text-center border-r border-b border-teal-500 whitespace-nowrap font-semibold">
                      Akad Fee
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {marketerTypes.map((type, idx) => {
                const typeFees = feesByType.get(type.id);
                return (
                  <tr
                    key={type.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                  >
                    <td className="px-3 py-3 font-semibold text-slate-800 border-r border-slate-200 uppercase">
                      {type.nama_jenis}
                    </td>
                    {KATEGORI_UNIT_LIST.map((kategori) => {
                      const fee = typeFees?.get(kategori);
                      return (
                        <React.Fragment key={kategori}>
                          <td className="px-3 py-3 text-left border-r border-slate-200 text-slate-800">
                            {fee?.booking_fee !== undefined &&
                            fee?.booking_fee !== null
                              ? formatRupiah(fee.booking_fee)
                              : ""}
                          </td>
                          <td className="px-3 py-3 text-left border-r border-slate-200 text-slate-800">
                            {fee?.akad_fee !== undefined &&
                            fee?.akad_fee !== null
                              ? formatRupiah(fee.akad_fee)
                              : ""}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-2 py-2 text-center border-slate-200">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditModal(type)}
                          className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[11px] transition shadow-sm"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
                          className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] transition shadow-sm"
                          title="Hapus Jenis Marketer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {marketerTypes.length === 0 && (
                <tr>
                  <td
                    colSpan={KATEGORI_UNIT_LIST.length * 2 + 2}
                    className="px-4 py-8 text-center text-slate-400"
                  >
                    Belum ada data jenis marketer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal: Tambah Jenis Marketer */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Tambah Jenis Marketer"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Jenis Marketer *
              </label>
              <input
                type="text"
                required
                value={formData.nama_jenis}
                onChange={(e) =>
                  setFormData({ ...formData, nama_jenis: e.target.value })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Contoh: AGEN"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Skema Komisi Default
              </label>
              <textarea
                rows={3}
                value={formData.skema_komisi_default}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skema_komisi_default: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Deskripsi skema komisi..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded transition shadow-sm"
              >
                Simpan
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Update Matrix Fee per Jenis Marketer */}
        <Modal
          isOpen={!!editingType}
          onClose={() => setEditingType(null)}
          title="Form"
        >
          {editingType && (
            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Jenis Marketer *
                </label>
                <input
                  type="text"
                  readOnly
                  value={editingType.nama_jenis}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-slate-700 font-bold focus:outline-none cursor-not-allowed uppercase"
                />
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
                {KATEGORI_UNIT_LIST.map((kategori) => (
                  <div
                    key={kategori}
                    className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2"
                  >
                    <p className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1">
                      Setting Marketing Fee untuk {kategori}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Booking Fee
                        </label>
                        <input
                          type="text"
                          value={
                            feeDraft[kategori]?.booking_fee !== ""
                              ? formatRupiah(
                                  Number(feeDraft[kategori]?.booking_fee),
                                )
                              : ""
                          }
                          onChange={(e) =>
                            handleDraftChange(
                              kategori,
                              "booking_fee",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Akad Fee
                        </label>
                        <input
                          type="text"
                          value={
                            feeDraft[kategori]?.akad_fee !== ""
                              ? formatRupiah(
                                  Number(feeDraft[kategori]?.akad_fee),
                                )
                              : ""
                          }
                          onChange={(e) =>
                            handleDraftChange(
                              kategori,
                              "akad_fee",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 italic">
                *) Wajib diisi.
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
