"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useData } from "@/lib/data-context";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Unit } from "@/types";
import {
  Plus,
  Edit3,
  Trash2,
  Home,
  Settings,
  ClipboardList,
  FileCheck2,
  Wallet,
  MapPin,
  LandPlot,
  Building2,
  Tag,
  ChevronRight,
} from "lucide-react";
import { formatRupiah, parseRupiah } from "@/lib/format";
import { AddressSelector } from "@/components/ui/AddressSelector";

export default function UnitRumahPage() {
  const {
    units,
    locations,
    blocks,
    unitTypes,
    subsidyTypes,
    salesSteps,
    certificateSteps,
    priceItems,
    addUnit,
    updateUnit,
    deleteUnit,
    addSalesStep,
    updateSalesStep,
    deleteSalesStep,
    addCertificateStep,
    updateCertificateStep,
    deleteCertificateStep,
    addPriceItem,
    updatePriceItem,
    deletePriceItem,
    addLocation,
    updateLocation,
    deleteLocation,
    addBlock,
    updateBlock,
    deleteBlock,
    addUnitType,
    updateUnitType,
    deleteUnitType,
    addSubsidyType,
    updateSubsidyType,
    deleteSubsidyType,
  } = useData();

  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"units" | "master">("units");
  const [masterSubTab, setMasterSubTab] = useState<
    | "salesStep"
    | "certStep"
    | "priceItem"
    | "location"
    | "block"
    | "unitType"
    | "subsidyType"
  >("salesStep");

  // Modal Unit State
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  const [unitForm, setUnitForm] = useState({
    no_unit: "",
    location_id: "",
    block_id: "",
    block_nama: "",
    unit_type_nama: "",
    kategori_kpr: "Subsidi",
    sales_step_nama: "Kantor",
    certificate_step_id: "",
    harga_dasar: 0,
    maksimal_kredit: 0,
    uang_muka: 0,
    booking_fee: 0,
    status: "Tersedia" as Unit["status"],
  });

  // Modal Master Add State
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterFormText, setMasterFormText] = useState("");
  const [masterFormExtra, setMasterFormExtra] = useState({
    luas_tanah: 72,
    luas_bangunan: 36,
    nominal: 10000000,
    location_id: "",
    alamat: "",
    kode_lokasi: "",
    kampung_dusun: "",
    rt: "",
    rw: "",
    kelurahan_id: null as string | null,
  });

  const openAddUnitModal = () => {
    setEditingUnitId(null);
    setUnitForm({
      no_unit: "",
      location_id: locations[0]?.id || "",
      block_id: "",
      block_nama: "",
      unit_type_nama: "",
      kategori_kpr: "Subsidi",
      sales_step_nama: "Kantor",
      certificate_step_id: certificateSteps[0]?.id || "",
      harga_dasar: 0,
      maksimal_kredit: 0,
      uang_muka: 0,
      booking_fee: 0,
      status: "Tersedia",
    });
    setIsUnitModalOpen(true);
  };

  const openEditUnitModal = (u: Unit) => {
    setEditingUnitId(u.id);
    const foundBlock = blocks.find((b) => b.nama_blok === u.block_nama);
    setUnitForm({
      no_unit: u.no_unit,
      location_id: foundBlock?.location_id || "",
      block_id: foundBlock?.id || "",
      block_nama: u.block_nama || "",
      unit_type_nama: u.unit_type_nama || "30/60",
      kategori_kpr: u.subsidy_type_nama || "Subsidi",
      sales_step_nama: u.sales_step_nama || "Kantor",
      certificate_step_id: u.certificate_step_id || "",
      harga_dasar: u.harga_dasar,
      maksimal_kredit: u.maksimal_kredit || 0,
      uang_muka: u.uang_muka || 0,
      booking_fee: u.booking_fee || 0,
      status: u.status,
    });
    setIsUnitModalOpen(true);
  };

  const handleUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !unitForm.no_unit ||
      !unitForm.location_id ||
      !unitForm.block_id ||
      !unitForm.unit_type_nama
    ) {
      alert("Nomor Unit, Perumahan, Blok, dan Tipe Unit wajib diisi.");
      return;
    }

    if (editingUnitId) {
      updateUnit(editingUnitId, unitForm);
    } else {
      addUnit(unitForm);
    }
    setIsUnitModalOpen(false);
  };

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMasterId) {
        if (masterSubTab === "salesStep") {
          await updateSalesStep(editingMasterId, { nama_step: masterFormText });
        } else if (masterSubTab === "certStep") {
          await updateCertificateStep(editingMasterId, {
            nama_step: masterFormText,
          });
        } else if (masterSubTab === "priceItem") {
          await updatePriceItem(editingMasterId, {
            nama_item: masterFormText,
            nominal: masterFormExtra.nominal,
          });
        } else if (masterSubTab === "location") {
          await updateLocation(editingMasterId, {
            nama_lokasi: masterFormText,
            alamat: masterFormExtra.alamat || masterFormText,
            kode_lokasi: masterFormExtra.kode_lokasi,
            kampung_dusun: masterFormExtra.kampung_dusun,
            rt: masterFormExtra.rt,
            rw: masterFormExtra.rw,
            kelurahan_id: masterFormExtra.kelurahan_id || undefined,
          });
        } else if (masterSubTab === "block") {
          await updateBlock(editingMasterId, {
            location_id: masterFormExtra.location_id,
            nama_blok: masterFormText,
          });
        } else if (masterSubTab === "unitType") {
          await updateUnitType(editingMasterId, {
            nama_type: masterFormText,
            luas_tanah: masterFormExtra.luas_tanah,
            luas_bangunan: masterFormExtra.luas_bangunan,
          });
        } else if (masterSubTab === "subsidyType") {
          await updateSubsidyType(editingMasterId, {
            nama_type: masterFormText,
          });
        }
      } else {
        if (masterSubTab === "salesStep") {
          await addSalesStep({
            nama_step: masterFormText,
            urutan: salesSteps.length + 1,
          });
        } else if (masterSubTab === "certStep") {
          await addCertificateStep({
            nama_step: masterFormText,
            urutan: certificateSteps.length + 1,
          });
        } else if (masterSubTab === "priceItem") {
          if (!masterFormText) return;
          await addPriceItem({
            nama_item: masterFormText,
            nominal: masterFormExtra.nominal,
          });
        } else if (masterSubTab === "location") {
          if (!masterFormText) return;
          await addLocation({
            nama_lokasi: masterFormText,
            alamat: masterFormExtra.alamat || masterFormText,
            kode_lokasi: masterFormExtra.kode_lokasi,
            kampung_dusun: masterFormExtra.kampung_dusun,
            rt: masterFormExtra.rt,
            rw: masterFormExtra.rw,
            kelurahan_id: masterFormExtra.kelurahan_id || undefined,
          });
        } else if (masterSubTab === "block") {
          if (!masterFormText || !masterFormExtra.location_id) {
            alert("Pilih Perumahan terlebih dahulu!");
            return;
          }
          await addBlock({
            location_id: masterFormExtra.location_id,
            nama_blok: masterFormText,
          });
        } else if (masterSubTab === "unitType") {
          if (!masterFormText) return;
          await addUnitType({
            nama_type: masterFormText,
            luas_tanah: masterFormExtra.luas_tanah,
            luas_bangunan: masterFormExtra.luas_bangunan,
          });
        } else if (masterSubTab === "subsidyType") {
          if (!masterFormText) return;
          await addSubsidyType({
            nama_type: masterFormText,
            keterangan: "Skema pembiayaan",
          });
        }
      }

      setIsMasterModalOpen(false);
      setEditingMasterId(null);
      setMasterFormText("");
      setMasterFormExtra({
        luas_tanah: 72,
        luas_bangunan: 36,
        nominal: 10000000,
        location_id: "",
        alamat: "",
        kode_lokasi: "",
        kampung_dusun: "",
        rt: "",
        rw: "",
        kelurahan_id: null,
      });
    } catch (err: any) {
      alert("Gagal menyimpan master data: " + err.message);
    }
  };

  const openEditMasterModal = (tab: typeof masterSubTab, item: any) => {
    setEditingMasterId(item.id);
    setMasterSubTab(tab);
    if (tab === "salesStep" || tab === "certStep") {
      setMasterFormText(item.nama_step || "");
      setMasterFormExtra((prev) => ({ ...prev }));
    } else if (tab === "priceItem") {
      setMasterFormText(item.nama_item || "");
      setMasterFormExtra((prev) => ({ ...prev, nominal: item.nominal || 0 }));
    } else if (tab === "location") {
      setMasterFormText(item.nama_lokasi || "");
      setMasterFormExtra((prev) => ({
        ...prev,
        alamat: item.alamat || "",
        kode_lokasi: item.kode_lokasi || "",
        kampung_dusun: item.kampung_dusun || "",
        rt: item.rt || "",
        rw: item.rw || "",
        kelurahan_id: item.kelurahan_id || null,
      }));
    } else if (tab === "block") {
      setMasterFormText(item.nama_blok || "");
      setMasterFormExtra((prev) => ({
        ...prev,
        location_id: item.location_id || "",
      }));
    } else if (tab === "unitType") {
      setMasterFormText(item.nama_type || "");
      setMasterFormExtra((prev) => ({
        ...prev,
        luas_tanah: item.luas_tanah || 0,
        luas_bangunan: item.luas_bangunan || 0,
      }));
    } else if (tab === "subsidyType") {
      setMasterFormText(item.nama_type || "");
    }
    setIsMasterModalOpen(true);
  };

  const handleDeleteMaster = async (tab: typeof masterSubTab, id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus master data ini?"))
      return;
    try {
      if (tab === "salesStep") await deleteSalesStep(id);
      else if (tab === "certStep") await deleteCertificateStep(id);
      else if (tab === "priceItem") await deletePriceItem(id);
      else if (tab === "location") await deleteLocation(id);
      else if (tab === "block") await deleteBlock(id);
      else if (tab === "unitType") await deleteUnitType(id);
      else if (tab === "subsidyType") await deleteSubsidyType(id);
    } catch (err: any) {
      alert(
        "Gagal menghapus master data: " + (err.message || "terkait data lain."),
      );
    }
  };

  // ---- Presentational config only (does not touch data/logic) ----
  const MASTER_CATEGORIES: {
    id: typeof masterSubTab;
    label: string;
    icon: React.ElementType;
    accent: string; // text/icon color
    bg: string; // icon chip background
    ring: string; // active state ring/border
    count: number;
  }[] = [
    {
      id: "salesStep",
      label: "Step Penjualan",
      icon: ClipboardList,
      accent: "text-indigo-600",
      bg: "bg-indigo-50",
      ring: "border-indigo-400 bg-indigo-50/60",
      count: salesSteps.length,
    },
    {
      id: "certStep",
      label: "Step Sertifikat",
      icon: FileCheck2,
      accent: "text-cyan-600",
      bg: "bg-cyan-50",
      ring: "border-cyan-400 bg-cyan-50/60",
      count: certificateSteps.length,
    },
    {
      id: "priceItem",
      label: "Item Harga",
      icon: Wallet,
      accent: "text-amber-600",
      bg: "bg-amber-50",
      ring: "border-amber-400 bg-amber-50/60",
      count: priceItems.length,
    },
    {
      id: "location",
      label: "Lokasi Perumahan",
      icon: MapPin,
      accent: "text-teal-600",
      bg: "bg-teal-50",
      ring: "border-teal-400 bg-teal-50/60",
      count: locations.length,
    },
    {
      id: "block",
      label: "Blok Perumahan",
      icon: LandPlot,
      accent: "text-sky-600",
      bg: "bg-sky-50",
      ring: "border-sky-400 bg-sky-50/60",
      count: blocks.length,
    },
    {
      id: "unitType",
      label: "Tipe Unit",
      icon: Building2,
      accent: "text-violet-600",
      bg: "bg-violet-50",
      ring: "border-violet-400 bg-violet-50/60",
      count: unitTypes.length,
    },
    {
      id: "subsidyType",
      label: "Tipe Subsidi",
      icon: Tag,
      accent: "text-rose-600",
      bg: "bg-rose-50",
      ring: "border-rose-400 bg-rose-50/60",
      count: subsidyTypes.length,
    },
  ];
  const activeCategory = MASTER_CATEGORIES.find((c) => c.id === masterSubTab)!;

  const UNIT_STATUS_STATS: { label: Unit["status"]; dot: string }[] = [
    { label: "Tersedia", dot: "bg-sky-500" },
    { label: "Booking", dot: "bg-amber-500" },
    { label: "DP", dot: "bg-amber-500" },
    { label: "Akad", dot: "bg-emerald-500" },
    { label: "Lunas", dot: "bg-emerald-500" },
  ];
  // ---- end presentational config ----

  const unitColumns: Column<Unit>[] = [
    {
      header: "No. Unit",
      accessorKey: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Home className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800">{r.no_unit}</span>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Lokasi Perumahan",
      accessorKey: (r) => r.location_nama || "-",
      sortable: true,
    },
    { header: "Blok", accessorKey: (r) => r.block_nama || "-", sortable: true },
    {
      header: "Tipe Rumah",
      accessorKey: (r) => r.unit_type_nama || "-",
      sortable: true,
    },
    {
      header: "Kategori KPR",
      accessorKey: (r) => r.subsidy_type_nama || "-",
      sortable: true,
    },
    {
      header: "Harga Dasar",
      accessorKey: (r) => (
        <span className="font-semibold text-slate-800">
          Rp {r.harga_dasar.toLocaleString("id-ID")}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Step Penjualan",
      accessorKey: (r) => (
        <span className="inline-block text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
          {r.sales_step_nama || "-"}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Step Sertifikat",
      accessorKey: (r) => (
        <span className="inline-block text-[11px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
          {r.certificate_step_nama || "-"}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Status Unit",
      accessorKey: (r) => (
        <Badge
          variant={
            r.status === "Tersedia"
              ? "sky"
              : r.status === "Booking" || r.status === "DP"
                ? "amber"
                : "emerald"
          }
        >
          {r.status}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Data Unit Properti
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Kelola unit rumah dan seluruh referensi master data dalam satu
              tempat
            </p>
          </div>

          {/* Top View Selector Tabs */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-lg w-fit shadow-sm">
            <button
              onClick={() => setActiveTab("units")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                activeTab === "units"
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Unit Rumah</span>
            </button>
            <button
              onClick={() => setActiveTab("master")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all ${
                activeTab === "master"
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Master Data</span>
            </button>
          </div>
        </div>

        {activeTab === "units" ? (
          <div className="space-y-4">
            {/* Status overview strip — presentational only, derived from existing `units` data */}
            <div className="flex flex-wrap items-center gap-2">
              {UNIT_STATUS_STATS.map((s) => {
                const count = units.filter((u) => u.status === s.label).length;
                return (
                  <div
                    key={s.label}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs shadow-sm"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    <span className="text-slate-500 font-medium">
                      {s.label}
                    </span>
                    <span className="font-bold text-slate-800">{count}</span>
                  </div>
                );
              })}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg text-xs shadow-sm ml-auto sm:ml-0">
                <span className="text-slate-300 font-medium">Total Unit</span>
                <span className="font-bold text-white">{units.length}</span>
              </div>
            </div>

            <DataTable
              title="Tabel Gabungan Unit Rumah"
              data={units}
              columns={unitColumns}
              searchPlaceholder="Cari no. unit, lokasi, tipe, status..."
              exportFileName="Data_Unit_Lansena"
              headerAction={
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setMasterSubTab("location");
                      setMasterFormText("");
                      setMasterFormExtra({
                        luas_tanah: 72,
                        luas_bangunan: 36,
                        nominal: 10000000,
                        location_id: "",
                        alamat: "",
                        kode_lokasi: "",
                        kampung_dusun: "",
                        rt: "",
                        rw: "",
                        kelurahan_id: null,
                      });
                      setIsMasterModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 font-bold rounded-md text-xs transition shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Perumahan Baru</span>
                  </button>
                  <button
                    onClick={() => {
                      setMasterSubTab("block");
                      setMasterFormText("");
                      setMasterFormExtra({
                        luas_tanah: 72,
                        luas_bangunan: 36,
                        nominal: 10000000,
                        location_id: locations[0]?.id || "",
                        alamat: "",
                        kode_lokasi: "",
                        kampung_dusun: "",
                        rt: "",
                        rw: "",
                        kelurahan_id: null,
                      });
                      setIsMasterModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 font-bold rounded-md text-xs transition shadow-sm"
                  >
                    <LandPlot className="w-3.5 h-3.5" />
                    <span>Blok Baru</span>
                  </button>
                  <button
                    onClick={openAddUnitModal}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Unit Rumah</span>
                  </button>
                </div>
              }
              actions={(row) => (
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEditUnitModal(row)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit Unit"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Hapus unit ${row.no_unit}? Pastikan tidak ada transaksi aktif.`,
                        )
                      )
                        return;
                      try {
                        await deleteUnit(row.id);
                      } catch (err: any) {
                        alert(
                          err.message ||
                            "Gagal menghapus unit. Cek apakah masih ada transaksi terkait.",
                        );
                      }
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Hapus Unit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[520px]">
            {/* Category rail */}
            <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/60 p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
              {MASTER_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = masterSubTab === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setMasterSubTab(cat.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition border shrink-0 md:shrink ${
                      isActive
                        ? `${cat.ring} shadow-sm`
                        : "border-transparent hover:bg-white text-slate-500"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-md ${cat.bg} ${cat.accent} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span
                      className={`flex-1 whitespace-nowrap ${isActive ? "text-slate-800" : ""}`}
                    >
                      {cat.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? `${cat.bg} ${cat.accent}` : "bg-slate-200 text-slate-500"}`}
                    >
                      {cat.count}
                    </span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 hidden md:block text-slate-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category content */}
            <div className="flex-1 p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-9 h-9 rounded-lg ${activeCategory.bg} ${activeCategory.accent} flex items-center justify-center`}
                  >
                    <activeCategory.icon className="w-4.5 h-4.5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      {activeCategory.label}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {activeCategory.count} data tersimpan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingMasterId(null);
                    setMasterFormText("");
                    setMasterFormExtra({
                      luas_tanah: 72,
                      luas_bangunan: 36,
                      nominal: 10000000,
                      location_id: locations[0]?.id || "",
                      alamat: "",
                      kode_lokasi: "",
                      kampung_dusun: "",
                      rt: "",
                      rw: "",
                      kelurahan_id: null,
                    });
                    setIsMasterModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-xs font-bold transition shadow-sm shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Master Item List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {masterSubTab === "salesStep" && salesSteps.length === 0 && (
                  <EmptyState label="Belum ada step penjualan" />
                )}
                {masterSubTab === "salesStep" &&
                  salesSteps.map((s) => (
                    <MasterCard
                      key={s.id}
                      title={s.nama_step}
                      subtitle={`Urutan ${s.urutan}`}
                      onEdit={() => openEditMasterModal("salesStep", s)}
                      onDelete={() => handleDeleteMaster("salesStep", s.id)}
                    />
                  ))}

                {masterSubTab === "certStep" &&
                  certificateSteps.length === 0 && (
                    <EmptyState label="Belum ada step sertifikat" />
                  )}
                {masterSubTab === "certStep" &&
                  certificateSteps.map((c) => (
                    <MasterCard
                      key={c.id}
                      title={c.nama_step}
                      subtitle={`Urutan ${c.urutan}`}
                      onEdit={() => openEditMasterModal("certStep", c)}
                      onDelete={() => handleDeleteMaster("certStep", c.id)}
                    />
                  ))}

                {masterSubTab === "priceItem" && priceItems.length === 0 && (
                  <EmptyState label="Belum ada item harga" />
                )}
                {masterSubTab === "priceItem" &&
                  priceItems.map((p) => (
                    <MasterCard
                      key={p.id}
                      title={p.nama_item}
                      subtitle={`Rp ${p.nominal.toLocaleString("id-ID")}`}
                      subtitleClassName="text-amber-600 font-bold"
                      onEdit={() => openEditMasterModal("priceItem", p)}
                      onDelete={() => handleDeleteMaster("priceItem", p.id)}
                    />
                  ))}

                {masterSubTab === "location" && locations.length === 0 && (
                  <EmptyState label="Belum ada lokasi perumahan" />
                )}
                {masterSubTab === "location" &&
                  locations.map((l) => (
                    <MasterCard
                      key={l.id}
                      title={`${l.nama_lokasi}${l.kode_lokasi ? ` (${l.kode_lokasi})` : ""}`}
                      subtitle={l.alamat}
                      onEdit={() => openEditMasterModal("location", l)}
                      onDelete={() => handleDeleteMaster("location", l.id)}
                    />
                  ))}

                {masterSubTab === "block" && blocks.length === 0 && (
                  <EmptyState label="Belum ada blok perumahan" />
                )}
                {masterSubTab === "block" &&
                  blocks.map((b) => (
                    <MasterCard
                      key={b.id}
                      title={b.nama_blok}
                      subtitle={b.location_nama}
                      onEdit={() => openEditMasterModal("block", b)}
                      onDelete={() => handleDeleteMaster("block", b.id)}
                    />
                  ))}

                {masterSubTab === "unitType" && unitTypes.length === 0 && (
                  <EmptyState label="Belum ada tipe unit" />
                )}
                {masterSubTab === "unitType" &&
                  unitTypes.map((t) => (
                    <MasterCard
                      key={t.id}
                      title={t.nama_type}
                      subtitle={`LT ${t.luas_tanah}m² · LB ${t.luas_bangunan}m²`}
                      onEdit={() => openEditMasterModal("unitType", t)}
                      onDelete={() => handleDeleteMaster("unitType", t.id)}
                    />
                  ))}

                {masterSubTab === "subsidyType" &&
                  subsidyTypes.length === 0 && (
                    <EmptyState label="Belum ada tipe subsidi" />
                  )}
                {masterSubTab === "subsidyType" &&
                  subsidyTypes.map((s) => (
                    <MasterCard
                      key={s.id}
                      title={s.nama_type}
                      subtitle={s.keterangan}
                      onEdit={() => openEditMasterModal("subsidyType", s)}
                      onDelete={() => handleDeleteMaster("subsidyType", s.id)}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Unit */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title={editingUnitId ? "Edit Unit Rumah" : "Tambah Unit Rumah Baru"}
      >
        <form onSubmit={handleUnitSubmit} className="space-y-6">
          <FormSection title="Informasi Unit">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nomor Unit" required>
                <input
                  type="text"
                  required
                  value={unitForm.no_unit}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, no_unit: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  placeholder="Contoh: A-01"
                />
              </Field>
              <Field label="Harga Dasar (Rp)" required>
                <input
                  type="text"
                  required
                  value={formatRupiah(unitForm.harga_dasar)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, "");
                    setUnitForm({
                      ...unitForm,
                      harga_dasar: Number(cleanVal) || 0,
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
              </Field>
            </div>
          </FormSection>

          {/* Maksimal Kredit, Uang Muka, Booking Fee — nilai per-unit, otomatis mengalir
              ke form Input Penjualan begitu unit ini dipilih di sana */}
          <FormSection title="Harga & Kredit">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Maksimal Kredit (Rp)">
                <input
                  type="text"
                  value={formatRupiah(unitForm.maksimal_kredit)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, "");
                    setUnitForm({
                      ...unitForm,
                      maksimal_kredit: Number(cleanVal) || 0,
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  placeholder="Plafon KPR maksimal"
                />
              </Field>
              <Field label="Uang Muka / DP (Rp)">
                <input
                  type="text"
                  value={formatRupiah(unitForm.uang_muka)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, "");
                    setUnitForm({
                      ...unitForm,
                      uang_muka: Number(cleanVal) || 0,
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  placeholder="Nominal DP default"
                />
              </Field>
              <Field label="Booking Fee (Rp)">
                <input
                  type="text"
                  value={formatRupiah(unitForm.booking_fee)}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/\D/g, "");
                    setUnitForm({
                      ...unitForm,
                      booking_fee: Number(cleanVal) || 0,
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  placeholder="Nominal booking fee default"
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Lokasi & Tipe">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Perumahan / Lokasi" required>
                <select
                  required
                  value={unitForm.location_id}
                  onChange={(e) => {
                    const locId = e.target.value;
                    setUnitForm({
                      ...unitForm,
                      location_id: locId,
                      block_id: "",
                      block_nama: "",
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                >
                  <option value="">-- Pilih Perumahan --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nama_lokasi}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Blok Perumahan" required>
                <select
                  required
                  value={unitForm.block_id}
                  onChange={(e) => {
                    const bid = e.target.value;
                    const b = blocks.find((x) => x.id === bid);
                    setUnitForm({
                      ...unitForm,
                      block_id: bid,
                      block_nama: b ? b.nama_blok : "",
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                >
                  <option value="">-- Pilih Blok --</option>
                  {blocks
                    .filter((b) => b.location_id === unitForm.location_id)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nama_blok}
                      </option>
                    ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Tipe Unit" required>
                <select
                  required
                  value={unitForm.unit_type_nama}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, unit_type_nama: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                >
                  <option value="">-- Pilih Tipe Unit --</option>
                  {unitTypes.map((t) => (
                    <option key={t.id} value={t.nama_type}>
                      {t.nama_type}
                    </option>
                  ))}
                </select>
              </Field>
              {(() => {
                const selectedType = unitTypes.find(
                  (t) => t.nama_type === unitForm.unit_type_nama,
                );
                return (
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Luas Tanah (m²)">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={selectedType ? selectedType.luas_tanah : "-"}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-slate-100 text-slate-500 cursor-not-allowed"
                      />
                    </Field>
                    <Field label="Luas Bangunan (m²)">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={selectedType ? selectedType.luas_bangunan : "-"}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-slate-100 text-slate-500 cursor-not-allowed"
                      />
                    </Field>
                  </div>
                );
              })()}
            </div>
          </FormSection>

          <FormSection title="Status & Alur">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Kategori KPR">
                <select
                  value={unitForm.kategori_kpr}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, kategori_kpr: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                >
                  <option value="Subsidi">Subsidi</option>
                  <option value="Komersil">Komersil</option>
                </select>
              </Field>
              <Field label="Status Unit">
                <select
                  value={unitForm.status}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                >
                  <option value="Tersedia">Tersedia</option>
                  <option value="Booking">Booking</option>
                  <option value="DP">DP</option>
                  <option value="Akad">Akad</option>
                  <option value="Lunas">Lunas</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Step Penjualan">
                <select
                  value={unitForm.sales_step_nama}
                  onChange={(e) =>
                    setUnitForm({
                      ...unitForm,
                      sales_step_nama: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                >
                  <option value="Kantor">Kantor</option>
                  <option value="BTN">BTN</option>
                  <option value="BRI">BRI</option>
                  <option value="BJB">BJB</option>
                  <option value="Mandiri">Mandiri</option>
                </select>
              </Field>
              <Field label="Step Sertifikat">
                <select
                  value={unitForm.certificate_step_id}
                  onChange={(e) =>
                    setUnitForm({
                      ...unitForm,
                      certificate_step_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                >
                  {certificateSteps.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.nama_step}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </FormSection>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsUnitModalOpen(false)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-md"
            >
              Simpan Unit
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Add Master Data */}
      <Modal
        isOpen={isMasterModalOpen}
        onClose={() => setIsMasterModalOpen(false)}
        title={
          editingMasterId
            ? `Edit ${activeCategory.label}`
            : `Tambah ${activeCategory.label}`
        }
      >
        <form onSubmit={handleMasterSubmit} className="space-y-4">
          <Field label="Nama / Judul" required>
            <input
              type="text"
              required
              value={masterFormText}
              onChange={(e) => setMasterFormText(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              placeholder="Masukkan nama master item..."
            />
          </Field>

          {/* Location: Alamat & Kode Lokasi */}
          {masterSubTab === "location" && (
            <>
              <Field label="Lokasi / Alamat" required>
                <textarea
                  rows={2}
                  value={masterFormExtra.alamat}
                  onChange={(e) =>
                    setMasterFormExtra({
                      ...masterFormExtra,
                      alamat: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  placeholder="Alamat lengkap perumahan..."
                />
              </Field>
              <Field label="Kode Lokasi (untuk nomor surat, contoh: BMM)">
                <input
                  type="text"
                  value={masterFormExtra.kode_lokasi}
                  onChange={(e) =>
                    setMasterFormExtra({
                      ...masterFormExtra,
                      kode_lokasi: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  placeholder="Contoh: BMM"
                  maxLength={5}
                />
              </Field>
              <AddressSelector
                kelurahanId={masterFormExtra.kelurahan_id}
                kampungDusun={masterFormExtra.kampung_dusun}
                rt={masterFormExtra.rt}
                rw={masterFormExtra.rw}
                onChange={(val) => {
                  setMasterFormExtra({
                    ...masterFormExtra,
                    kelurahan_id: val.kelurahanId,
                    kampung_dusun: val.kampungDusun,
                    rt: val.rt,
                    rw: val.rw,
                  });
                }}
              />
            </>
          )}

          {/* Block: dropdown pilih Perumahan */}
          {masterSubTab === "block" && (
            <Field label="Perumahan" required>
              <select
                required
                value={masterFormExtra.location_id}
                onChange={(e) =>
                  setMasterFormExtra({
                    ...masterFormExtra,
                    location_id: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              >
                <option value="">-- Pilih Perumahan --</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nama_lokasi}
                  </option>
                ))}
              </select>
            </Field>
          )}

          {/* UnitType: preset dropdown + decoupled inputs for luas_tanah & luas_bangunan */}
          {masterSubTab === "unitType" && (
            <div className="space-y-3">
              <Field label="Preset Tipe (Opsional)">
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    setMasterFormText(val);
                    const m = val.match(/(\d+)\s*\/\s*(\d+)/);
                    if (m) {
                      setMasterFormExtra({
                        ...masterFormExtra,
                        luas_bangunan: parseInt(m[1]),
                        luas_tanah: parseInt(m[2]),
                      });
                    } else if (val === "Ruko") {
                      setMasterFormExtra({
                        ...masterFormExtra,
                        luas_bangunan: 60,
                        luas_tanah: 60,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-slate-50 text-slate-500"
                >
                  <option value="">-- Pilih Preset (Opsional) --</option>
                  <option value="30/60">Preset 30/60 (LB 30, LT 60)</option>
                  <option value="36/72">Preset 36/72 (LB 36, LT 72)</option>
                  <option value="45/78">Preset 45/78 (LB 45, LT 78)</option>
                  <option value="70/70">Preset 70/70 (LB 70, LT 70)</option>
                  <option value="67/67">Preset 67/67 (LB 67, LT 67)</option>
                  <option value="45/54">Preset 45/54 (LB 45, LT 54)</option>
                  <option value="Ruko">Preset Ruko (LB 60, LT 60)</option>
                </select>
              </Field>
              <Field label="Nama Tipe" required>
                <input
                  type="text"
                  required
                  value={masterFormText}
                  onChange={(e) => setMasterFormText(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  placeholder="Contoh: 30/60, Ruko 2 Lantai, dll."
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Luas Tanah (m²)">
                  <input
                    type="number"
                    value={masterFormExtra.luas_tanah}
                    onChange={(e) =>
                      setMasterFormExtra({
                        ...masterFormExtra,
                        luas_tanah: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  />
                </Field>
                <Field label="Luas Bangunan (m²)">
                  <input
                    type="number"
                    value={masterFormExtra.luas_bangunan}
                    onChange={(e) =>
                      setMasterFormExtra({
                        ...masterFormExtra,
                        luas_bangunan: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                  />
                </Field>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsMasterModalOpen(false)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-md text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs transition shadow-md"
            >
              Simpan Master
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

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <div className="space-y-3">{children}</div>
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

function MasterCard({
  title,
  subtitle,
  subtitleClassName,
  onEdit,
  onDelete,
}: {
  title: string;
  subtitle?: string;
  subtitleClassName?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs flex justify-between items-start gap-2 group hover:border-slate-300 hover:shadow-sm transition">
      <div className="space-y-0.5 min-w-0">
        <p className="font-bold text-slate-800 truncate">{title}</p>
        {subtitle && (
          <p
            className={
              subtitleClassName || "text-slate-400 text-[11px] truncate"
            }
          >
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={onEdit}
          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
          title="Edit"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
          title="Hapus"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-lg">
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[11px] mt-0.5">
        Klik &quot;Tambah&quot; untuk membuat data baru
      </p>
    </div>
  );
}
