import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * API route untuk resolve alamat lengkap dari kelurahan_id.
 * Dipanggil oleh client components yang tidak bisa import lib/db langsung.
 */
export async function POST(req: NextRequest) {
  try {
    const { kelurahanId, kampungDusun, rt, rw, fallback } = await req.json();

    if (!kelurahanId) {
      return NextResponse.json({ data: fallback || '-' });
    }

    // 1. Get kelurahan
    const villageRows = await query('SELECT * FROM kelurahan WHERE id = ?', [kelurahanId]);
    const village = villageRows[0];
    if (!village) {
      return NextResponse.json({ data: fallback || '-' });
    }

    // 2. Get kecamatan
    const districtRows = await query('SELECT * FROM kecamatan WHERE id = ?', [village.kecamatan_id]);
    const district = districtRows[0];
    if (!district) {
      return NextResponse.json({ data: fallback || '-' });
    }

    // 3. Get kabupaten
    const regencyRows = await query('SELECT * FROM kabupaten_kota WHERE id = ?', [district.kabupaten_kota_id]);
    const regency = regencyRows[0];
    if (!regency) {
      return NextResponse.json({ data: fallback || '-' });
    }

    // 4. Get provinsi
    const provinceRows = await query('SELECT * FROM provinsi WHERE id = ?', [regency.provinsi_id]);
    const province = provinceRows[0];
    if (!province) {
      return NextResponse.json({ data: fallback || '-' });
    }

    const rtPart = rt ? `RT ${rt}` : '';
    const rwPart = rw ? `RW ${rw}` : '';
    const rtRwCombined = [rtPart, rwPart].filter(Boolean).join('/');
    const rtRwPart = rtRwCombined ? ` ${rtRwCombined}` : '';
    const kampungPart = kampungDusun ? `${kampungDusun}` : '';

    const fullAddress = `${kampungPart}${rtRwPart ? (kampungPart ? ',' + rtRwPart : rtRwPart) : ''}, Kel. ${village.nama}, Kec. ${district.nama}, ${regency.nama}, ${province.nama}`;

    return NextResponse.json({ data: fullAddress });
  } catch (e: any) {
    console.error('Error resolving full address:', e);
    return NextResponse.json(
      { error: e.message || 'Failed to resolve address' },
      { status: 500 }
    );
  }
}
