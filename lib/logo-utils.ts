import { LOGO_BASE64 } from './logo-base64';

/**
 * Return LOGO_BASE64 langsung untuk @react-pdf/renderer
 * Menggunakan base64 embedded yang sudah pre-bundled sehingga tidak memerlukan network request
 * dan pasti berhasil ter-render pada PDF.
 */
export async function fetchLogoBase64(_baseUrl?: string): Promise<string> {
  return LOGO_BASE64;
}
