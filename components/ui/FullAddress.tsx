'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/sql/client';

// Simple in-memory cache to avoid re-fetching the same regional hierarchy
const addressCache: Record<string, string> = {};

interface FullAddressProps {
  kelurahanId?: string | null;
  kampungDusun?: string;
  rt?: string;
  rw?: string;
  fallback?: string;
}

export function FullAddress({
  kelurahanId,
  kampungDusun,
  rt,
  rw,
  fallback,
}: FullAddressProps) {
  const [resolvedAddress, setResolvedAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!kelurahanId) {
      setResolvedAddress(fallback || '-');
      return;
    }

    const cacheKey = `${kelurahanId}_${kampungDusun || ''}_${rt || ''}_${rw || ''}`;
    if (addressCache[cacheKey]) {
      setResolvedAddress(addressCache[cacheKey]);
      return;
    }

    let isMounted = true;
    async function resolve() {
      setLoading(true);
      try {
        const supabase = createClient();
        
        // 1. Get kelurahan
        const villageRes = await supabase.from('kelurahan').select('*').eq('id', kelurahanId).single();
        const village = villageRes.data;
        if (!village) {
          if (isMounted) setResolvedAddress(fallback || '-');
          return;
        }

        // 2. Get kecamatan
        const districtRes = await supabase.from('kecamatan').select('*').eq('id', village.kecamatan_id).single();
        const district = districtRes.data;
        if (!district) {
          if (isMounted) setResolvedAddress(fallback || '-');
          return;
        }

        // 3. Get kabupaten
        const regencyRes = await supabase.from('kabupaten_kota').select('*').eq('id', district.kabupaten_kota_id).single();
        const regency = regencyRes.data;
        if (!regency) {
          if (isMounted) setResolvedAddress(fallback || '-');
          return;
        }

        // 4. Get provinsi
        const provinceRes = await supabase.from('provinsi').select('*').eq('id', regency.provinsi_id).single();
        const province = provinceRes.data;
        if (!province) {
          if (isMounted) setResolvedAddress(fallback || '-');
          return;
        }

        const rtPart = rt ? `RT ${rt}` : '';
        const rwPart = rw ? `RW ${rw}` : '';
        const rtRwCombined = [rtPart, rwPart].filter(Boolean).join('/');
        const rtRwPart = rtRwCombined ? ` ${rtRwCombined}` : '';
        const kampungPart = kampungDusun ? `${kampungDusun}` : '';
        
        const full = `${kampungPart}${rtRwPart ? (kampungPart ? ',' + rtRwPart : rtRwPart) : ''}, Kel. ${village.nama}, Kec. ${district.nama}, ${regency.nama}, ${province.nama}`;
        
        addressCache[cacheKey] = full;
        if (isMounted) {
          setResolvedAddress(full);
        }
      } catch (e) {
        console.error('Error resolving full address:', e);
        if (isMounted) setResolvedAddress(fallback || '-');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    resolve();
    return () => {
      isMounted = false;
    };
  }, [kelurahanId, kampungDusun, rt, rw, fallback]);

  if (loading) return <span className="text-slate-400 animate-pulse">Memuat alamat...</span>;
  return <span>{resolvedAddress}</span>;
}
