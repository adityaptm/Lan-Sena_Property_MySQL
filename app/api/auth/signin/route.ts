import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encryptToken } from '@/lib/auth-token';
import crypto from 'crypto';

async function logLogin(
  req: NextRequest,
  userId: string | null,
  nama: string,
  email: string,
  role: string | null,
  status: string
) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '-';

    await query(
      `INSERT INTO login_logs (id, user_id, nama, email, role, status, ip_address, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [crypto.randomUUID(), userId, nama, email, role, status, ip, userAgent]
    );
  } catch (err: any) {
    console.warn('[signin] Gagal mencatat login_logs:', err.message);
  }
}

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
      await logLogin(req, null, 'Tidak Terdaftar', email, null, 'Gagal (User Tidak Terdaftar)');
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 400 });
    }

    const user = users[0];

    if (!user.is_active) {
      await logLogin(req, user.id, user.nama || '-', user.email, user.role, 'Ditolak (Akun Dinonaktifkan)');
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
      await logLogin(req, user.id, user.nama || '-', user.email, user.role, 'Gagal (Kata Sandi Salah)');
      return NextResponse.json({ error: 'Email atau password salah.' }, { status: 400 });
    }

    // Update last_login_at & log successful login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    await logLogin(req, user.id, user.nama || '-', user.email, user.role, 'Berhasil');

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

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';

    response.cookies.set('lansena_session', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
