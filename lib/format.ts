/**
 * Format a number as Indonesian Rupiah with thousand separators (dots).
 * Example: 10000000 → "10.000.000"
 */
export function formatRupiah(val: number | string): string {
  if (val === undefined || val === null || val === '') return '';
  const numStr = String(val).replace(/\D/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('id-ID');
}

/**
 * Parse a formatted Rupiah string back to a number.
 * Strips all non-digit characters.
 */
export function parseRupiah(val: string): number {
  return Number(val.replace(/\D/g, '')) || 0;
}

/**
 * Konversi nomor bulan (1-12) ke angka romawi.
 */
export function bulanKeRomawi(bulan: number): string {
  const romawi = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
  return romawi[bulan - 1] || '';
}

/**
 * Format a Date object or ISO string to ID date string (DD/MM/YYYY).
 * Example: "2026-08-09T17:00:00.000Z" → "10/08/2026"
 */
export function formatDateId(dateVal?: string | Date | null): string {
  if (!dateVal) return '-';
  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(date.getTime())) return String(dateVal);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a Date object or ISO string to Indonesian date string.
 * Example: "2026-08-09T17:00:00.000Z" → "10 Agustus 2026"
 */
export function formatTanggalIndonesia(dateVal: Date | string | null | undefined): string {
  if (!dateVal) return '-';
  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  if (isNaN(date.getTime())) return String(dateVal);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Konversi angka ke teks terbilang Bahasa Indonesia.
 * Contoh: 1500000 → "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(angka: number): string {
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas',
    'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
  const puluhan = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
    'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

  function konversi(n: number): string {
    if (n === 0) return '';
    if (n < 20) return satuan[n] + ' ';
    if (n < 100) return puluhan[Math.floor(n / 10)] + ' ' + konversi(n % 10);
    if (n < 200) return 'Seratus ' + konversi(n - 100);
    if (n < 1000) return satuan[Math.floor(n / 100)] + ' Ratus ' + konversi(n % 100);
    if (n < 2000) return 'Seribu ' + konversi(n - 1000);
    if (n < 1000000) return konversi(Math.floor(n / 1000)) + 'Ribu ' + konversi(n % 1000);
    if (n < 1000000000) return konversi(Math.floor(n / 1000000)) + 'Juta ' + konversi(n % 1000000);
    if (n < 1000000000000) return konversi(Math.floor(n / 1000000000)) + 'Miliar ' + konversi(n % 1000000000);
    return konversi(Math.floor(n / 1000000000000)) + 'Triliun ' + konversi(n % 1000000000000);
  }

  if (angka === 0) return 'Nol Rupiah';
  const hasil = konversi(Math.abs(Math.round(angka))).trim();
  return hasil + ' Rupiah';
}

/**
 * Urutan alami supaya "2" tampil sebelum "10", "Blok A2" sebelum "Blok A10" (natural sorting).
 */
export function naturalSort<T>(arr: T[], getKey: (item: T) => string): T[] {
  return [...arr].sort((a, b) =>
    getKey(a).localeCompare(getKey(b), undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}


