import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';

export async function DELETE(req: NextRequest) {
  try {
    // Hanya Super Admin yang bisa menghapus user
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = decryptToken(token);
    if (!caller || caller.role !== 'Super Admin') {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Super Admin yang dapat menghapus akun pengguna.' },
        { status: 403 }
      );
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId wajib diisi' }, { status: 400 });
    }

    // Tidak bisa hapus diri sendiri
    if (userId === caller.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
    }

    // Hapus dari users MySQL database
    await query('DELETE FROM users WHERE id = ?', [userId]);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
