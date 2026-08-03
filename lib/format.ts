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
 * Format a Date object to Indonesian date string.
 * Example: 17 Agustus 1945
 */
export function formatTanggalIndonesia(date: Date): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
