import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail, password, nama: rawNama } = await req.json();

    if (!rawEmail || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const email = rawEmail.includes('@')
      ? rawEmail.toLowerCase().trim()
      : `${rawEmail.toLowerCase().trim()}@lansena.id`;

    const nama = rawNama ? rawNama.trim() : email.split('@')[0];

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Check if this is the first user. If yes, make them Super Admin. Otherwise, default to Viewer.
    const allUsers = await query('SELECT id FROM users LIMIT 1');
    const role = allUsers.length === 0 ? 'Super Admin' : 'Viewer';

    await query(
      'INSERT INTO users (id, nama, email, password, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, nama, email, hashedPassword, role, true]
    );

    const userPayload = {
      id: userId,
      email,
      nama,
      role,
    };

    return NextResponse.json({
      success: true,
      user: userPayload
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
