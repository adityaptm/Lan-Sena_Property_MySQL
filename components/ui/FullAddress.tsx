'use client';

import React, { useEffect, useState } from 'react';

// Simple in-memory cache to avoid re-fetching the same regional hierarchy
const addressCache: Record<string, string> = {};

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
        // 1. Get kelurahan
        const villages = await dbRequest({
          action: 'select',
          table: 'kelurahan',
          filters: [{ type: 'eq', column: 'id', value: kelurahanId }],
          single: true,
        });
        const village = villages;
        if (!village) {
          if (isMounted) setResolvedAddress(fallback || '-');
          return;
        }

        // 2. Get kecamatan
        const districts = await dbRequest({
          action: 'select',
          table: 'kecamatan',
          filters: [{ type: 'eq', column: 'id', value: village.kecamatan_id }],
          single: true,
        });
        const district = districts;
        if (!district) {
          if (isMounted) setResolvedAddress(fallback || '-');
          return;
        }

        // 3. Get kabupaten
        const regencies = await dbRequest({
          action: 'select',
          table: 'kabupaten_kota',
          filters: [{ type: 'eq', column: 'id', value: district.kabupaten_kota_id }],
          single: true,
        });
        const regency = regencies;
        if (!regency) {
          if (isMounted) setResolvedAddress(fallback || '-');
          return;
        }

        // 4. Get provinsi
        const provinces = await dbRequest({
          action: 'select',
          table: 'provinsi',
          filters: [{ type: 'eq', column: 'id', value: regency.provinsi_id }],
          single: true,
        });
        const province = provinces;
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
