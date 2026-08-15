"use client";

import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/lib/data-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Customer } from "@/types";
import {
  Plus,
  Edit3,
  Trash2,
  User,
  MapPin,
  Briefcase,
  Heart,
  Tag,
} from "lucide-react";
import { AddressSelector } from "@/components/ui/AddressSelector";
import { FullAddress } from "@/components/ui/FullAddress";

const INPUT =
  "w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition";

export default function CustomerPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<Customer["status"] | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    nik: "",
    alamat: "",
    no_hp: "",
    email: "",
    status: "Leads" as "Leads" | "Deal" | "Batal",
    is_registered_before: false,
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat_ktp: "",
    alamat_domisili: "",
    pekerjaan: "",
    instansi: "",
    pendapatan_per_bulan: "",
    npwp: "",
    status_pernikahan: "Belum Menikah",
    nama_pasangan: "",
    tempat_lahir_pasangan: "",
    tanggal_lahir_pasangan: "",
    pekerjaan_pasangan: "",
    nik_pasangan: "",
    no_hp_pasangan: "",
    alamat_domisili_pasangan: "",
    kampung_dusun_pasangan: "",
    rt_pasangan: "",
    rw_pasangan: "",
    kelurahan_id_pasangan: null as string | null,
    kampung_dusun: "",
    rt: "",
    rw: "",
    kelurahan_id: null as string | null,
  });

  // Format angka jadi "5.000.000" otomatis saat diketik, tanpa titik manual dari user
  const formatAngkaRibuan = (raw: any) => {
    const clean = String(raw || "").replace(/\D/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("id-ID");
  };

  const handlePendapatanChange = (raw: any) => {
    const clean = String(raw || "").replace(/\D/g, "");
    setFormData({ ...formData, pendapatan_per_bulan: clean });
  };

  const isMenikah = formData.status_pernikahan === "Sudah Menikah";

  const emptyForm = {
    nama: "",
    nik: "",
    alamat: "",
    no_hp: "",
    email: "",
    status: "Leads" as "Leads" | "Deal" | "Batal",
    is_registered_before: false,
    tempat_lahir: "",
    tanggal_lahir: "",
    alamat_ktp: "",
    alamat_domisili: "",
    pekerjaan: "",
    instansi: "",
    pendapatan_per_bulan: "",
    npwp: "",
    status_pernikahan: "Belum Menikah",
    nama_pasangan: "",
    tempat_lahir_pasangan: "",
    tanggal_lahir_pasangan: "",
    pekerjaan_pasangan: "",
    nik_pasangan: "",
    no_hp_pasangan: "",
    alamat_domisili_pasangan: "",
    kampung_dusun_pasangan: "",
    rt_pasangan: "",
    rw_pasangan: "",
    kelurahan_id_pasangan: null as string | null,
    kampung_dusun: "",
    rt: "",
    rw: "",
    kelurahan_id: null as string | null,
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingId(c.id);
    setFormData({
      nama: c.nama,
      nik: c.nik,
      alamat: c.alamat || "",
      no_hp: c.no_hp,
      email: c.email || "",
      status: c.status,
      is_registered_before: !!c.is_registered_before,
      tempat_lahir: c.tempat_lahir || "",
      tanggal_lahir: c.tanggal_lahir ? String(c.tanggal_lahir).slice(0, 10) : "",
      alamat_ktp: c.alamat_ktp || "",
      alamat_domisili: c.alamat_domisili || "",
      pekerjaan: c.pekerjaan || "",
      instansi: c.instansi || "",
      pendapatan_per_bulan: c.pendapatan_per_bulan || "",
      npwp: c.npwp || "",
      status_pernikahan: c.status_pernikahan || "Belum Menikah",
      nama_pasangan: c.nama_pasangan || "",
      tempat_lahir_pasangan: c.tempat_lahir_pasangan || "",
      tanggal_lahir_pasangan: c.tanggal_lahir_pasangan ? String(c.tanggal_lahir_pasangan).slice(0, 10) : "",
      pekerjaan_pasangan: c.pekerjaan_pasangan || "",
      nik_pasangan: c.nik_pasangan || "",
      no_hp_pasangan: c.no_hp_pasangan || "",
      alamat_domisili_pasangan: c.alamat_domisili_pasangan || "",
      kampung_dusun_pasangan: (c as any).kampung_dusun_pasangan || "",
      rt_pasangan: (c as any).rt_pasangan || "",
      rw_pasangan: (c as any).rw_pasangan || "",
      kelurahan_id_pasangan: (c as any).kelurahan_id_pasangan || null,
      kampung_dusun: c.kampung_dusun || "",
      rt: c.rt || "",
      rw: c.rw || "",
      kelurahan_id: c.kelurahan_id || null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.nama ||
      !formData.nik ||
      !formData.no_hp ||
      !formData.tanggal_lahir ||
      !formData.kelurahan_id
    ) {
      alert(
        "Mohon lengkapi Nama, NIK, No. HP, Tanggal Lahir, dan Wilayah Administratif alamat.",
      );
      return;
    }

    const fallbackAddress =
      `${formData.kampung_dusun || ""} RT ${formData.rt || "000"} RW ${formData.rw || "000"}`.trim();
    const finalData = {
      ...formData,
      alamat: fallbackAddress,
      alamat_ktp: fallbackAddress,
      kelurahan_id: formData.kelurahan_id || undefined,
    };

    if (editingId) {
      updateCustomer(editingId, finalData);
    } else {
      addCustomer(finalData);
    }
    setIsModalOpen(false);
  };

  const columns: Column<Customer>[] = [
    {
      header: "Nama Customer",
      accessorKey: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 text-xs font-bold">
            {r.nama?.charAt(0).toUpperCase() || "?"}
          </div>
          <span className="font-semibold text-slate-800">{r.nama}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "NIK / KTP",
      accessorKey: (r) => (
        <span className="font-mono text-xs text-slate-500">{r.nik}</span>
      ),
      sortable: true,
    },
    {
      header: "Tgl Lahir",
      accessorKey: (r) => {
        if (!r.tanggal_lahir) return "-";
        const clean = String(r.tanggal_lahir).slice(0, 10);
        const parts = clean.split("-");
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return clean;
      },
    },
    { header: "No. WhatsApp / HP", accessorKey: "no_hp" },
    { header: "Pekerjaan", accessorKey: (r) => r.pekerjaan || "-" },
    {
      header: "Alamat Lengkap",
      accessorKey: (r) => (
        <FullAddress
          kelurahanId={r.kelurahan_id}
          kampungDusun={r.kampung_dusun}
          rt={r.rt}
          rw={r.rw}
          fallback={r.alamat_ktp || r.alamat}
        />
      ),
    },
    {
      header: "Status Pernikahan",
      accessorKey: (r) => (
        <span className="text-xs text-slate-500">
          {r.status_pernikahan || "Belum Menikah"}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: (r) => (
        <Badge
          variant={
            r.status === "Deal"
              ? "emerald"
              : r.status === "Leads"
                ? "sky"
                : "rose"
          }
        >
          {r.status}
        </Badge>
      ),
      sortable: true,
    },
  ];

  const STATUS_STATS: { label: Customer["status"]; dot: string }[] = [
    { label: "Leads", dot: "bg-sky-500" },
    { label: "Deal", dot: "bg-emerald-500" },
    { label: "Batal", dot: "bg-rose-500" },
  ];

  const filteredCustomers = useMemo(() => {
    if (!activeStatusFilter) return customers;
    return customers.filter((c) => c.status === activeStatusFilter);
  }, [customers, activeStatusFilter]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Data Customer & Leads
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Daftar calon pembeli dan konsumen deal perumahan Lansena
            </p>
          </div>
        </div>

        {/* Status overview strip — Clickable filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_STATS.map((s) => {
            const count = customers.filter((c) => c.status === s.label).length;
            const isActive = activeStatusFilter === s.label;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() =>
                  setActiveStatusFilter(isActive ? null : s.label)
                }
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs shadow-xs transition border cursor-pointer select-none ${
                  isActive
                    ? "bg-blue-50 border-blue-500 ring-2 ring-blue-400 font-bold text-blue-900 shadow-md"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
                title={`Klik untuk memfilter customer status ${s.label}`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <span className={isActive ? "text-blue-900 font-bold" : "text-slate-600 font-medium"}>
                  {s.label}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveStatusFilter(null)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs shadow-xs transition border cursor-pointer select-none ml-auto sm:ml-0 ${
              activeStatusFilter === null
                ? "bg-slate-900 text-white border-slate-900 ring-2 ring-slate-400"
                : "bg-slate-700 hover:bg-slate-800 text-slate-200 border-slate-600"
            }`}
            title="Klik untuk melihat semua customer"
          >
            <span className="font-medium">Total Customer</span>
            <span className="font-bold text-white px-1.5 py-0.5 bg-slate-800 rounded-full text-[11px]">
              {customers.length}
            </span>
            {activeStatusFilter && (
              <span className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold ml-1 animate-pulse">
                Filter: {activeStatusFilter} (Reset)
              </span>
            )}
          </button>
        </div>

        <DataTable
          title={
            activeStatusFilter
              ? `Daftar Customer (Filter: ${activeStatusFilter})`
              : "Daftar Customer"
          }
          data={filteredCustomers}
          columns={columns}
          searchPlaceholder="Cari nama, NIK, No HP..."
          exportFileName="Data_Customer_Lansena"
          headerAction={
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs sm:text-sm transition shadow-md w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Customer</span>
            </button>
          }
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => openEditModal(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                title="Edit Data"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  if (
                    !window.confirm(
                      `Hapus data customer "${row.nama}"? PERHATIAN: Semua transaksi aktif atas nama customer ini akan otomatis dibatalkan dan unit akan dikembalikan ke status Tersedia.`,
                    )
                  )
                    return;
                  try {
                    await deleteCustomer(row.id);
                  } catch (err: any) {
                    alert(err.message || "Gagal menghapus customer.");
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Hapus Data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Edit Customer" : "Tambah Customer Baru"}
        maxWidth="2xl"
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-5 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar"
        >


          {/* Identitas Diri */}
          <FormGroup icon={User} color="blue" title="Identitas Diri">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nama Lengkap" required>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) =>
                    setFormData({ ...formData, nama: e.target.value })
                  }
                  className={INPUT}
                  placeholder="Nama Lengkap"
                />
              </Field>
              <Field label="NIK (Nomor Induk Kependudukan)" required>
                <input
                  type="text"
                  required
                  value={formData.nik}
                  onChange={(e) =>
                    setFormData({ ...formData, nik: e.target.value })
                  }
                  className={INPUT}
                  placeholder="16 Digit NIK"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Tempat Lahir">
                <input
                  type="text"
                  value={formData.tempat_lahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tempat_lahir: e.target.value })
                  }
                  className={INPUT}
                  placeholder="Kota / Kabupaten"
                />
              </Field>
              <Field label="Tanggal Lahir" required>
                <input
                  type="date"
                  required
                  value={formData.tanggal_lahir}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal_lahir: e.target.value })
                  }
                  className={INPUT}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="No. Handphone / WhatsApp" required>
                <input
                  type="text"
                  required
                  value={formData.no_hp}
                  onChange={(e) =>
                    setFormData({ ...formData, no_hp: e.target.value })
                  }
                  className={INPUT}
                  placeholder="Contoh: 0812..."
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={INPUT}
                  placeholder="alamat@email.com"
                />
              </Field>
            </div>
          </FormGroup>

          {/* Alamat */}
          <FormGroup icon={MapPin} color="teal" title="Alamat KTP">
            <Field label="Wilayah Administratif" required>
              <AddressSelector
                kelurahanId={formData.kelurahan_id}
                kampungDusun={formData.kampung_dusun}
                rt={formData.rt}
                rw={formData.rw}
                onChange={(val) => {
                  setFormData({
                    ...formData,
                    kelurahan_id: val.kelurahanId,
                    kampung_dusun: val.kampungDusun,
                    rt: val.rt,
                    rw: val.rw,
                  });
                }}
              />
            </Field>
          </FormGroup>

          {/* Pekerjaan & Keuangan */}
          <FormGroup
            icon={Briefcase}
            color="amber"
            title="Pekerjaan & Keuangan"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Pekerjaan">
                <input
                  type="text"
                  value={formData.pekerjaan}
                  onChange={(e) =>
                    setFormData({ ...formData, pekerjaan: e.target.value })
                  }
                  className={INPUT}
                  placeholder="Pekerjaan saat ini"
                />
              </Field>
              <Field label="Institusi / Perusahaan">
                <input
                  type="text"
                  value={formData.instansi}
                  onChange={(e) =>
                    setFormData({ ...formData, instansi: e.target.value })
                  }
                  className={INPUT}
                  placeholder="Nama Perusahaan / Instansi"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Pendapatan per Bulan">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatAngkaRibuan(formData.pendapatan_per_bulan)}
                  onChange={(e) => handlePendapatanChange(e.target.value)}
                  className={INPUT}
                  placeholder="Contoh: 5.000.000"
                />
              </Field>
              <Field label="NPWP">
                <input
                  type="text"
                  value={formData.npwp}
                  onChange={(e) =>
                    setFormData({ ...formData, npwp: e.target.value })
                  }
                  className={INPUT}
                  placeholder="Nomor NPWP"
                />
              </Field>
            </div>
          </FormGroup>

          {/* Status */}
          <FormGroup icon={Tag} color="violet" title="Status">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Sudah Menikah?">
                <select
                  value={formData.status_pernikahan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status_pernikahan: e.target.value,
                    })
                  }
                  className={INPUT}
                >
                  <option value="Belum Menikah">Belum Menikah</option>
                  <option value="Sudah Menikah">Sudah Menikah</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </Field>
              <Field label="Status Prospek">
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className={INPUT}
                >
                  <option value="Leads">Leads (Calon Pembeli)</option>
                  <option value="Deal">Deal (Sudah Transaksi)</option>
                  <option value="Batal">Batal / Unqualified</option>
                </select>
              </Field>
            </div>
          </FormGroup>

          {/* Biodata Pasangan - hanya muncul kalau status "Sudah Menikah" */}
          {isMenikah && (
            <FormGroup
              icon={Heart}
              color="rose"
              title="Biodata Pasangan (Suami/Istri)"
            >
              <Field label="Nama Pasangan">
                <input
                  type="text"
                  value={formData.nama_pasangan}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_pasangan: e.target.value })
                  }
                  className={INPUT}
                  placeholder="Nama lengkap pasangan"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Tempat Lahir Pasangan">
                  <input
                    type="text"
                    value={formData.tempat_lahir_pasangan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tempat_lahir_pasangan: e.target.value,
                      })
                    }
                    className={INPUT}
                  />
                </Field>
                <Field label="Tanggal Lahir Pasangan">
                  <input
                    type="date"
                    value={formData.tanggal_lahir_pasangan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggal_lahir_pasangan: e.target.value,
                      })
                    }
                    className={INPUT}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Pekerjaan Pasangan">
                  <input
                    type="text"
                    value={formData.pekerjaan_pasangan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pekerjaan_pasangan: e.target.value,
                      })
                    }
                    className={INPUT}
                  />
                </Field>
                <Field label="NIK Pasangan">
                  <input
                    type="text"
                    value={formData.nik_pasangan}
                    onChange={(e) =>
                      setFormData({ ...formData, nik_pasangan: e.target.value })
                    }
                    className={INPUT}
                  />
                </Field>
              </div>

              <Field label="No. Handphone Pasangan">
                <input
                  type="text"
                  value={(formData as any).no_hp_pasangan || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      no_hp_pasangan: e.target.value,
                    } as any)
                  }
                  className={INPUT}
                  placeholder="Contoh: 0812..."
                />
              </Field>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Alamat Domisili Pasangan
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        kelurahan_id_pasangan: prev.kelurahan_id,
                        kampung_dusun_pasangan: prev.kampung_dusun,
                        rt_pasangan: prev.rt,
                        rw_pasangan: prev.rw,
                      }));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                  >
                    Samakan dengan Alamat KTP Utama
                  </button>
                </div>
                <AddressSelector
                  title="Struktur Alamat Administratif Pasangan"
                  kelurahanId={formData.kelurahan_id_pasangan}
                  kampungDusun={formData.kampung_dusun_pasangan}
                  rt={formData.rt_pasangan}
                  rw={formData.rw_pasangan}
                  onChange={(val) => {
                    setFormData((prev) => ({
                      ...prev,
                      kelurahan_id_pasangan: val.kelurahanId,
                      kampung_dusun_pasangan: val.kampungDusun,
                      rt_pasangan: val.rt,
                      rw_pasangan: val.rw,
                    }));
                  }}
                />
              </div>
            </FormGroup>
          )}

          <p className="text-[11px] text-slate-400 font-medium">
            *) Wajib diisi.
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-md"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}

/* ---------------------------------------------------------------------- */
/* Small presentational helpers (no data/logic — purely layout & styling) */
/* ---------------------------------------------------------------------- */

const GROUP_COLOR: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  teal: { bg: "bg-teal-50", text: "text-teal-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  violet: { bg: "bg-violet-50", text: "text-violet-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
};

function FormGroup({
  icon: Icon,
  color,
  title,
  children,
}: {
  icon: React.ElementType;
  color: keyof typeof GROUP_COLOR;
  title: string;
  children: React.ReactNode;
}) {
  const c = GROUP_COLOR[color];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span
          className={`w-7 h-7 rounded-md ${c.bg} ${c.text} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-3.5 h-3.5" />
        </span>
        <p className="text-xs font-bold text-slate-700">{title}</p>
      </div>
      <div className="space-y-3 pl-9.5 sm:pl-[38px]">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
