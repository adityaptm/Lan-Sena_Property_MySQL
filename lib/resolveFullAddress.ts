import { createClient } from '@/lib/sql/client';

/**
 * Resolve alamat lengkap (Kampung/Jalan, RT/RW, Kel, Kec, Kab/Kota, Provinsi)
 * dari kelurahan_id. Logic-nya sama persis dengan komponen <FullAddress />,
 * tapi versi async function biasa supaya bisa dipanggil sebelum render
 * dokumen react-pdf (yang tidak mendukung useEffect / komponen async).
 */
export async function resolveFullAddress({
  kelurahanId,
  kampungDusun,
  rt,
  rw,
  fallback,
}: {
  kelurahanId?: string | null;
  kampungDusun?: string;
  rt?: string;
  rw?: string;
  fallback?: string;
}): Promise<string> {
  if (!kelurahanId) {
    return fallback || '-';
  }

  try {
    const supabase = createClient();

    // 1. Get kelurahan
    const villageRes = await supabase.from('kelurahan').select('*').eq('id', kelurahanId).single();
    const village = villageRes.data;
    if (!village) return fallback || '-';

    // 2. Get kecamatan
    const districtRes = await supabase.from('kecamatan').select('*').eq('id', village.kecamatan_id).single();
    const district = districtRes.data;
    if (!district) return fallback || '-';

    // 3. Get kabupaten
    const regencyRes = await supabase.from('kabupaten_kota').select('*').eq('id', district.kabupaten_kota_id).single();
    const regency = regencyRes.data;
    if (!regency) return fallback || '-';

    // 4. Get provinsi
    const provinceRes = await supabase.from('provinsi').select('*').eq('id', regency.provinsi_id).single();
    const province = provinceRes.data;
    if (!province) return fallback || '-';

    const rtPart = rt ? `RT ${rt}` : '';
    const rwPart = rw ? `RW ${rw}` : '';
    const rtRwCombined = [rtPart, rwPart].filter(Boolean).join('/');
    const rtRwPart = rtRwCombined ? ` ${rtRwCombined}` : '';
    const kampungPart = kampungDusun ? `${kampungDusun}` : '';

    return `${kampungPart}${rtRwPart ? (kampungPart ? ',' + rtRwPart : rtRwPart) : ''}, Kel. ${village.nama}, Kec. ${district.nama}, ${regency.nama}, ${province.nama}`;
  } catch (e) {
    console.error('Error resolving full address:', e);
    return fallback || '-';
  }
}