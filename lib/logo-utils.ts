/**
 * Fetch logo.jpg dari public folder dan konversi ke base64 data URI.
 * @react-pdf/renderer sering gagal memuat gambar via URL (CORS / fetch issue),
 * sehingga kita convert ke base64 agar pasti terbaca.
 */
export async function fetchLogoBase64(baseUrl?: string): Promise<string> {
  try {
    const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const response = await fetch(`${origin}/logo.jpg`);
    if (!response.ok) throw new Error(`Logo fetch failed: ${response.status}`);
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load logo as base64:', error);
    // Return empty string jika gagal — logo tidak akan ditampilkan tapi PDF tetap jalan
    return '';
  }
}
