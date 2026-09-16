import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';
import { archiveToTrash } from '@/lib/trash';

export async function DELETE(req: NextRequest) {
  try {
    // Hanya Super Admin yang bisa menghapus user
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const caller = decryptToken(token);
    const role = caller?.role?.trim()?.toLowerCase();
    if (!caller || (role !== 'super admin' && role !== 'programmer')) {
      return NextResponse.json(
        { error: 'Forbidden: Hanya Super Admin dan Programmer yang dapat menghapus akun pengguna.' },
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

    const rows = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 });
    }

    await archiveToTrash(
      'users',
      rows[0],
      { id: caller.id, nama: caller.nama, email: caller.email },
      rows[0].nama || rows[0].email || userId,
    );

    await query('DELETE FROM users WHERE id = ?', [userId]);

    // Log ke activity_logs
    try {
      await query(
        `INSERT INTO activity_logs (id, user_id, user_nama, user_role, action, table_name, record_id, record_label, detail, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          crypto.randomUUID(),
          caller.id,
          caller.nama || '-',
          caller.role || '-',
          'delete',
          'users',
          userId,
          `Pengguna: ${rows[0].nama || rows[0].email || '-'} (${rows[0].role || '-'})`.substring(0, 255),
          `Menghapus akun pengguna: ${rows[0].nama || '-'} (${rows[0].email || '-'})`,
        ]
      );
    } catch {}

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
