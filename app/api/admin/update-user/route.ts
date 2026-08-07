import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';
import bcrypt from 'bcryptjs';
import { canModifyUser } from '@/lib/permissions';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = decryptToken(token);
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const callerRole = caller.role;
    if (callerRole !== 'Super Admin' && callerRole !== 'Admin') {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Super Admin atau Admin yang dapat mengubah data akun pengguna.' },
        { status: 403 }
      );
    }

    const { userId, nama, role, password } = await req.json();
    if (!userId || !nama || !role) {
      return NextResponse.json({ error: 'userId, nama, dan role wajib diisi' }, { status: 400 });
    }

    // Ambil data user target dari database
    const targetRows = await query('SELECT id, role FROM users WHERE id = ?', [userId]);
    if (targetRows.length === 0) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const targetUser = targetRows[0];

    // Cek otorisasi modifikasi user via lib/permissions.ts
    const userCheck = canModifyUser(callerRole, targetUser.role, role);
    if (!userCheck.allowed) {
      return NextResponse.json({ error: userCheck.reason }, { status: 403 });
    }

    // Jika password diisi, hash password baru
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      await query('UPDATE users SET nama = ?, role = ?, password = ? WHERE id = ?', [
        nama,
        role,
        hashedPassword,
        userId,
      ]);
    } else {
      await query('UPDATE users SET nama = ?, role = ? WHERE id = ?', [nama, role, userId]);
    }

    return NextResponse.json({ success: true, message: 'Data pengguna & password berhasil diperbarui.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
