'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/sql/client';

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

export function AddressSelector({
  kelurahanId,
  kampungDusun,
  rt,
  rw,
  onChange,
  disabled = false,
}: AddressSelectorProps) {
  const supabase = useMemo(() => createClient(), []);

  // Dropdown lists
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  // Selected values
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');

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
      const { data, error } = await supabase.from('provinsi').select('id, nama').order('nama');
      if (!error && data) {
        setProvinces(data);
      }
    }
    loadProvinces();
  }, [supabase]);

  // Load initial hierarchy if kelurahanId is set
  useEffect(() => {
    if (!kelurahanId) {
      setSelectedProvinceId('');
      setSelectedRegencyId('');
      setSelectedDistrictId('');
      setSelectedVillageId('');
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
        const villageRes = await supabase.from('kelurahan').select('*').eq('id', kelurahanId).single();
        if (villageRes.error || !villageRes.data) return;
        const village = villageRes.data;

        // 2. Get kecamatan info
        const districtRes = await supabase.from('kecamatan').select('*').eq('id', village.kecamatan_id).single();
        if (districtRes.error || !districtRes.data) return;
        const district = districtRes.data;

        // 3. Get kabupaten_kota info
        const regencyRes = await supabase.from('kabupaten_kota').select('*').eq('id', district.kabupaten_kota_id).single();
        if (regencyRes.error || !regencyRes.data) return;
        const regency = regencyRes.data;

        // 4. Fetch lists in parallel
        const [regenciesList, districtsList, villagesList] = await Promise.all([
          supabase.from('kabupaten_kota').select('id, nama').eq('provinsi_id', regency.provinsi_id).order('nama'),
          supabase.from('kecamatan').select('id, nama').eq('kabupaten_kota_id', regency.id).order('nama'),
          supabase.from('kelurahan').select('id, nama').eq('kecamatan_id', district.id).order('nama'),
        ]);

        if (regenciesList.data) setRegencies(regenciesList.data);
        if (districtsList.data) setDistricts(districtsList.data);
        if (villagesList.data) setVillages(villagesList.data);

        setSelectedProvinceId(regency.provinsi_id);
        setSelectedRegencyId(regency.id);
        setSelectedDistrictId(district.id);
        setSelectedVillageId(village.id);
      } catch (e) {
        console.error('Error loading address hierarchy:', e);
      } finally {
        setLoading(false);
      }
    }

    loadHierarchy();
  }, [kelurahanId, supabase]);

  // Handle province change
  const handleProvinceChange = async (provId: string) => {
    setSelectedProvinceId(provId);
    setSelectedRegencyId('');
    setSelectedDistrictId('');
    setSelectedVillageId('');

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
    const { data } = await supabase.from('kabupaten_kota').select('id, nama').eq('provinsi_id', provId).order('nama');
    if (data) setRegencies(data);
    setLoading(false);
  };

  // Handle regency change
  const handleRegencyChange = async (regId: string) => {
    setSelectedRegencyId(regId);
    setSelectedDistrictId('');
    setSelectedVillageId('');

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
    const { data } = await supabase.from('kecamatan').select('id, nama').eq('kabupaten_kota_id', regId).order('nama');
    if (data) setDistricts(data);
    setLoading(false);
  };

  // Handle district change
  const handleDistrictChange = async (distId: string) => {
    setSelectedDistrictId(distId);
    setSelectedVillageId('');

    setVillages([]);

    onChange({
      kelurahanId: null,
      kampungDusun: localKampung,
      rt: localRt,
      rw: localRw,
    });

    if (!distId) return;

    setLoading(true);
    const { data } = await supabase.from('kelurahan').select('id, nama').eq('kecamatan_id', distId).order('nama');
    if (data) setVillages(data);
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
    const clean = val.replace(/\D/g, '').slice(0, 5);
    setLocalRt(clean);
    onChange({
      kelurahanId: selectedVillageId || null,
      kampungDusun: localKampung,
      rt: clean,
      rw: localRw,
    });
  };

  const handleRwChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 5);
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
        {loading && <span className="text-[10px] text-blue-500 font-normal animate-pulse">Loading data wilayah...</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Provinsi */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Provinsi</label>
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
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kabupaten / Kota</label>
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
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kecamatan</label>
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
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kelurahan / Desa</label>
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
          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Kampung / Dusun / Jalan</label>
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
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">RT</label>
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
            <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">RW</label>
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
