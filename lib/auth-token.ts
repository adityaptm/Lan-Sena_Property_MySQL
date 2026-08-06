import crypto from 'crypto';

const SECRET_KEY = process.env.JWT_SECRET || 'lansena-property-dashboard-secret-key-12345';
const ALGORITHM = 'aes-256-cbc';

// Helper to derive 32-byte key from string secret
const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
// 16-byte IV
const iv = crypto.createHash('md5').update(SECRET_KEY).digest();

export function encryptToken(payload: any): string {
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptToken(token: string): any | null {
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(token, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}
