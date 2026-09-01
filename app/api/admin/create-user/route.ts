import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Verify caller is Super Admin or Admin
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = decryptToken(token);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const callerRole = caller.role?.trim();
    const isSuperOrProgrammer = callerRole?.toLowerCase() === 'super admin' || callerRole?.toLowerCase() === 'programmer';

    if (!isSuperOrProgrammer && callerRole?.toLowerCase() !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Super Admin, Programmer, atau Admin yang dapat membuat akun pengguna.' },
        { status: 403 }
      );
    }

    const { email: rawEmail, password, nama, role } = await req.json();
    if (!rawEmail || !password || !nama || !role) {
      return NextResponse.json({ error: 'Email, password, nama, dan role wajib diisi' }, { status: 400 });
    }

    // Normalize email
    const email = rawEmail.includes('@')
      ? rawEmail.toLowerCase().trim()
      : `${rawEmail.toLowerCase().trim()}@lansena.id`;

    // Admin tidak boleh assign role Super Admin
    if (callerRole === 'Admin' && role === 'Super Admin') {
      return NextResponse.json(
        { error: 'Admin tidak dapat membuat akun dengan role Super Admin.' },
        { status: 403 }
      );
    }

    // Check if email already registered
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserId = crypto.randomUUID();

    // Insert user into MySQL database
    await query(
      'INSERT INTO users (id, nama, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [newUserId, nama, email, hashedPassword, role, true]
    );

    return NextResponse.json({ success: true, userId: newUserId, email });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
