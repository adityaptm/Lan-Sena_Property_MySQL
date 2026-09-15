import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';

// GET: Ambil semua activity logs
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = decryptToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // Hanya Super Admin dan Programmer yang bisa akses
    const allowedRoles = ['Super Admin', 'Programmer'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Akses ditolak: Hanya Super Admin dan Programmer yang dapat melihat riwayat aktivitas.' }, { status: 403 });
    }

    const rows = await query(
      `SELECT id, user_id, user_nama, user_role, action, table_name, 
              record_id, record_label, detail, ip_address, created_at 
       FROM activity_logs 
       ORDER BY created_at DESC 
       LIMIT 1000`
    );

    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error('GET /api/activity-logs error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Hapus activity logs (mendukung bulk delete)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = decryptToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    // Hanya Super Admin & Programmer yang bisa hapus log
    const allowedRoles = ['Super Admin', 'Programmer'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Hanya Super Admin yang dapat menghapus riwayat aktivitas.' }, { status: 403 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Tidak ada data yang dipilih untuk dihapus.' }, { status: 400 });
    }

    // Sanitize: pastikan semua ID adalah string
    const safeIds = ids.filter((id: any) => typeof id === 'string' && id.length > 0);
    if (safeIds.length === 0) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    const placeholders = safeIds.map(() => '?').join(',');
    await query(`DELETE FROM activity_logs WHERE id IN (${placeholders})`, safeIds);

    return NextResponse.json({ success: true, deleted: safeIds.length });
  } catch (err: any) {
    console.error('DELETE /api/activity-logs error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
