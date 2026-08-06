import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/auth-token';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const payload = decryptToken(token);
    if (!payload?.id) {
      return NextResponse.json({ user: null });
    }

    // Ambil ulang data user dari DB supaya role/is_active selalu up to date
    const users = await query(
      'SELECT id, email, nama, role, is_active FROM users WHERE id = ?',
      [payload.id]
    );

    if (users.length === 0 || !users[0].is_active) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: users[0] });
  } catch (e: any) {
    console.error('auth/user error:', e.message);
    return NextResponse.json({ user: null });
  }
}