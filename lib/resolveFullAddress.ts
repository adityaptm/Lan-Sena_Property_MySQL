import { query } from '@/lib/db';

/**
 * Resolve alamat lengkap (Kampung/Jalan, RT/RW, Kel, Kec, Kab/Kota, Provinsi)
 * dari kelurahan_id. Logic-nya sama persis dengan komponen <FullAddress />,
 * tapi versi async function biasa supaya bisa dipanggil sebelum render
 * dokumen react-pdf (yang tidak mendukung useEffect / komponen async).
 * 
 * NOTE: This function is called server-side (for PDF generation), so it uses
 * direct database access via query() instead of fetch('/api/db') to avoid
 * HTTP round-trip from server to server.
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
    // 1. Get kelurahan
    const villageRows = await query('SELECT * FROM kelurahan WHERE id = ?', [kelurahanId]);
    const village = villageRows[0];
    if (!village) return fallback || '-';

    // 2. Get kecamatan
    const districtRows = await query('SELECT * FROM kecamatan WHERE id = ?', [village.kecamatan_id]);
    const district = districtRows[0];
    if (!district) return fallback || '-';

    // 3. Get kabupaten
    const regencyRows = await query('SELECT * FROM kabupaten_kota WHERE id = ?', [district.kabupaten_kota_id]);
    const regency = regencyRows[0];
    if (!regency) return fallback || '-';

    // 4. Get provinsi
    const provinceRows = await query('SELECT * FROM provinsi WHERE id = ?', [regency.provinsi_id]);
    const province = provinceRows[0];
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