"use client";

import React, { useState, useEffect } from "react";

interface AddressSelectorProps {
  kelurahanId: string | null;
  kampungDusun: string;
  rt: string;
  rw: string;
  onChange: (data: {
    kelurahanId: string | null;
    kampungDusun: string;
    rt: string;
    rw: string;
  }) => void;
  disabled?: boolean;
}

interface RegionItem {
  id: string;
  nama: string;
  kode?: string;
}

// ─── MySQL API Gateway Helper (sama pola dengan data-context.tsx) ──────────
async function dbRequest(body: Record<string, any>) {
  const res = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Database error");
  return json.data;
}

function sortByNama<T extends { nama: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

async function selectWhere(
  table: string,
  column: string,
  value: string,
): Promise<any[]> {
  try {
    const data = await dbRequest({
      action: "select",
      table,
      filters: [{ type: "eq", column, value }],
    });
    return (data || []) as any[];
  } catch (e: any) {
    console.warn(`AddressSelector: gagal memuat ${table}`, e.message);
    return [];
  }
}

async function selectSingle(
  table: string,
  id: string,
): Promise<Record<string, any> | null> {
  try {
    const data = await dbRequest({
      action: "select",
      table,
      filters: [{ type: "eq", column: "id", value: id }],
      single: true,
    });
    return data || null;
  } catch (e: any) {
    console.warn(`AddressSelector: gagal memuat single ${table}`, e.message);
    return null;
  }
}

async function selectAll(table: string): Promise<any[]> {
  try {
    const data = await dbRequest({ action: "select", table });
    return (data || []) as any[];
  } catch (e: any) {
    console.warn(`AddressSelector: gagal memuat ${table}`, e.message);
    return [];
  }
}
// ─────────────────────────────────────────────────────────────────────────

export function AddressSelector({
  kelurahanId,
  kampungDusun,
  rt,
  rw,
  onChange,
  disabled = false,
}: AddressSelectorProps) {
  // Dropdown lists
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  // Selected values
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>("");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedVillageId, setSelectedVillageId] = useState<string>("");

  const [localKampung, setLocalKampung] = useState(kampungDusun);
  const [localRt, setLocalRt] = useState(rt);
  const [localRw, setLocalRw] = useState(rw);

  const [loading, setLoading] = useState(false);

  // Sync text inputs
  useEffect(() => {
    setLocalKampung(kampungDusun);
  }, [kampungDusun]);

  useEffect(() => {
    setLocalRt(rt);
  }, [rt]);

  useEffect(() => {
    setLocalRw(rw);
  }, [rw]);

  // Load provinces on mount
  useEffect(() => {
    async function loadProvinces() {
      const data = await selectAll("provinsi");
      setProvinces(sortByNama(data as RegionItem[]));
    }
    loadProvinces();
  }, []);

  // Load initial hierarchy if kelurahanId is set
  useEffect(() => {
    if (!kelurahanId) {
      setSelectedProvinceId("");
      setSelectedRegencyId("");
      setSelectedDistrictId("");
      setSelectedVillageId("");
      setRegencies([]);
      setDistricts([]);
      setVillages([]);
      return;
    }

    // Prevent re-fetching if it's already set to current selectedVillageId
    if (kelurahanId === selectedVillageId) return;

    async function loadHierarchy() {
      setLoading(true);
      try {
        // 1. Get kelurahan info
        const village = await selectSingle("kelurahan", kelurahanId as string);
        if (!village) return;

        // 2. Get kecamatan info
        const district = await selectSingle("kecamatan", village.kecamatan_id);
        if (!district) return;

        // 3. Get kabupaten_kota info
        const regency = await selectSingle(
          "kabupaten_kota",
          district.kabupaten_kota_id,
        );
        if (!regency) return;

        // 4. Fetch lists in parallel
        const [regenciesList, districtsList, villagesList] = await Promise.all([
          selectWhere("kabupaten_kota", "provinsi_id", regency.provinsi_id),
          selectWhere("kecamatan", "kabupaten_kota_id", regency.id),
          selectWhere("kelurahan", "kecamatan_id", district.id),
        ]);

        setRegencies(sortByNama(regenciesList as RegionItem[]));
        setDistricts(sortByNama(districtsList as RegionItem[]));
        setVillages(sortByNama(villagesList as RegionItem[]));

        setSelectedProvinceId(regency.provinsi_id);
        setSelectedRegencyId(regency.id);
        setSelectedDistrictId(district.id);
        setSelectedVillageId(village.id);
      } catch (e) {
        console.error("Error loading address hierarchy:", e);
      } finally {
        setLoading(false);
      }
    }

    loadHierarchy();
  }, [kelurahanId]);

  // Handle province change
  const handleProvinceChange = async (provId: string) => {
    setSelectedProvinceId(provId);
    setSelectedRegencyId("");
    setSelectedDistrictId("");
    setSelectedVillageId("");

    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    onChange({
      kelurahanId: null,
      kampungDusun: localKampung,
      rt: localRt,
      rw: localRw,
    });

    if (!provId) return;

    setLoading(true);
    const data = await selectWhere("kabupaten_kota", "provinsi_id", provId);
    setRegencies(sortByNama(data as RegionItem[]));
    setLoading(false);
  };

  // Handle regency change
  const handleRegencyChange = async (regId: string) => {
    setSelectedRegencyId(regId);
    setSelectedDistrictId("");
    setSelectedVillageId("");

    setDistricts([]);
    setVillages([]);

    onChange({
      kelurahanId: null,
      kampungDusun: localKampung,
      rt: localRt,
      rw: localRw,
    });

    if (!regId) return;

    setLoading(true);
    const data = await selectWhere("kecamatan", "kabupaten_kota_id", regId);
    setDistricts(sortByNama(data as RegionItem[]));
    setLoading(false);
  };

  // Handle district change
  const handleDistrictChange = async (distId: string) => {
    setSelectedDistrictId(distId);
    setSelectedVillageId("");

    setVillages([]);

    onChange({
      kelurahanId: null,
      kampungDusun: localKampung,
      rt: localRt,
      rw: localRw,
    });

    if (!distId) return;

    setLoading(true);
    const data = await selectWhere("kelurahan", "kecamatan_id", distId);
    setVillages(sortByNama(data as RegionItem[]));
    setLoading(false);
  };

  // Handle village change
  const handleVillageChange = (villId: string) => {
    setSelectedVillageId(villId);
    onChange({
      kelurahanId: villId || null,
      kampungDusun: localKampung,
      rt: localRt,
      rw: localRw,
    });
  };

  const handleKampungChange = (val: string) => {
    setLocalKampung(val);
    onChange({
      kelurahanId: selectedVillageId || null,
      kampungDusun: val,
      rt: localRt,
      rw: localRw,
    });
  };

  const handleRtChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 5);
    setLocalRt(clean);
    onChange({
      kelurahanId: selectedVillageId || null,
      kampungDusun: localKampung,
      rt: clean,
      rw: localRw,
    });
  };

  const handleRwChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 5);
    setLocalRw(clean);
    onChange({
      kelurahanId: selectedVillageId || null,
      kampungDusun: localKampung,
      rt: localRt,
      rw: clean,
    });
  };

  return (
    <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5 mb-1 flex items-center justify-between">
        <span>Struktur Alamat Administratif</span>
        {loading && (
          <span className="text-[10px] text-blue-500 font-normal animate-pulse">
            Loading data wilayah...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Provinsi */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
            Provinsi
          </label>
          <select
            value={selectedProvinceId}
            onChange={(e) => handleProvinceChange(e.target.value)}
            disabled={disabled || loading}
            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          >
            <option value="">-- Pilih Provinsi --</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Kabupaten/Kota */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
            Kabupaten / Kota
          </label>
          <select
            value={selectedRegencyId}
            onChange={(e) => handleRegencyChange(e.target.value)}
            disabled={disabled || loading || !selectedProvinceId}
            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          >
            <option value="">-- Pilih Kabupaten/Kota --</option>
            {regencies.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Kecamatan */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
            Kecamatan
          </label>
          <select
            value={selectedDistrictId}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={disabled || loading || !selectedRegencyId}
            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          >
            <option value="">-- Pilih Kecamatan --</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Kelurahan */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
            Kelurahan / Desa
          </label>
          <select
            value={selectedVillageId}
            onChange={(e) => handleVillageChange(e.target.value)}
            disabled={disabled || loading || !selectedDistrictId}
            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          >
            <option value="">-- Pilih Kelurahan/Desa --</option>
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Kampung / Dusun */}
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
            Kampung / Dusun / Jalan
          </label>
          <input
            type="text"
            value={localKampung}
            onChange={(e) => handleKampungChange(e.target.value)}
            disabled={disabled}
            placeholder="Kp. Suka Maju / Jl. Mawar"
            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          />
        </div>

        {/* RT/RW */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
              RT
            </label>
            <input
              type="text"
              value={localRt}
              onChange={(e) => handleRtChange(e.target.value)}
              disabled={disabled}
              placeholder="001"
              maxLength={5}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
              RW
            </label>
            <input
              type="text"
              value={localRw}
              onChange={(e) => handleRwChange(e.target.value)}
              disabled={disabled}
              placeholder="002"
              maxLength={5}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
