import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encryptToken } from '@/lib/auth-token';

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, password } = await req.json();

    if (!rawEmail || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const email = rawEmail.includes('@')
      ? rawEmail.toLowerCase().trim()
      : `${rawEmail.toLowerCase().trim()}@lansena.id`;

    // Query user by email
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 400 });
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json({ error: 'Akun Anda dinonaktifkan. Silakan hubungi Super Admin.' }, { status: 403 });
    }

    // Verify password
    let passwordMatches = false;
    if (user.password) {
      passwordMatches = await bcrypt.compare(password, user.password);
    } else {
      // If password is not set in DB (e.g. legacy/social), allow fallback if password matches email (just for debug/fallback, but let's be secure: if no password, they can't login unless set)
      passwordMatches = false;
    }

    if (!passwordMatches) {
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 400 });
    }

    // Update last_login_at
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    const sessionPayload = {
      id: user.id,
      email: user.email,
      nama: user.nama,
      role: user.role,
    };

    const token = encryptToken(sessionPayload);

    // Set cookie
    const response = NextResponse.json({
      user: sessionPayload,
      session: { access_token: token, user: sessionPayload }
    });

    response.cookies.set('lansena_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
