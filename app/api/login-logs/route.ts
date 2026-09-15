import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';
import crypto from 'crypto';

// GET: Ambil data riwayat login (Super Admin & Programmer only)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = decryptToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const allowedRoles = ['Super Admin', 'Programmer'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Super Admin dan Programmer yang dapat melihat riwayat login.' },
        { status: 403 }
      );
    }

    const rows = await query(
      `SELECT id, user_id, nama, email, role, status, ip_address, user_agent, created_at 
       FROM login_logs 
       ORDER BY created_at DESC 
       LIMIT 1000`
    );

    return NextResponse.json({ data: rows });
  } catch (err: any) {
    console.error('GET /api/login-logs error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Hapus data riwayat login (Super Admin & Programmer only)
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = decryptToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const allowedRoles = ['Super Admin', 'Programmer'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Super Admin dan Programmer yang dapat menghapus riwayat login.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { ids, all } = body;

    if (all) {
      const res: any = await query('DELETE FROM login_logs');
      const count = res?.affectedRows || 0;

      // Log ke activity_logs
      try {
        await query(
          `INSERT INTO activity_logs (id, user_id, user_nama, user_role, action, table_name, detail, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            crypto.randomUUID(),
            session.id,
            session.nama || '-',
            session.role || '-',
            'delete',
            'login_logs',
            `Mengosongkan seluruh riwayat login (${count} data dihapus)`,
          ]
        );
      } catch {}

      return NextResponse.json({ success: true, count });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Pilih data yang ingin dihapus.' }, { status: 400 });
    }

    const safeIds = ids.filter((id: any) => typeof id === 'string' && id.length > 0);
    if (safeIds.length === 0) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    const placeholders = safeIds.map(() => '?').join(',');
    const res: any = await query(`DELETE FROM login_logs WHERE id IN (${placeholders})`, safeIds);
    const count = res?.affectedRows || safeIds.length;

    // Log ke activity_logs
    try {
      await query(
        `INSERT INTO activity_logs (id, user_id, user_nama, user_role, action, table_name, detail, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          crypto.randomUUID(),
          session.id,
          session.nama || '-',
          session.role || '-',
          'delete',
          'login_logs',
          `Menghapus ${count} catatan riwayat login`,
        ]
      );
    } catch {}

    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    console.error('DELETE /api/login-logs error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
