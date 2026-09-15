import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';
import { restoreTrashRecord } from '@/lib/trash';
import crypto from 'crypto';

// DELETE: Hapus permanen satu atau banyak data di Kotak Sampah, atau kosongkan semua
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = decryptToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const allowedRoles = ['Super Admin', 'Programmer'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: 'Hanya Super Admin & Programmer yang dapat menghapus data di Kotak Sampah.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { ids, all } = body;

    if (all) {
      const [res]: any = await query('DELETE FROM `trash`');
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
            'trash',
            `Mengosongkan semua data di Kotak Sampah (${count} data dihapus permanen)`,
          ]
        );
      } catch (logErr: any) {
        console.warn('[trash API] Gagal log activity:', logErr.message);
      }

      return NextResponse.json({ success: true, count });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Pilih data yang ingin dihapus terlebih dahulu.' },
        { status: 400 }
      );
    }

    const safeIds = ids.filter((id: any) => typeof id === 'string' && id.length > 0);
    if (safeIds.length === 0) {
      return NextResponse.json({ error: 'ID tidak valid.' }, { status: 400 });
    }

    const placeholders = safeIds.map(() => '?').join(',');
    const [res]: any = await query(`DELETE FROM \`trash\` WHERE id IN (${placeholders})`, safeIds);
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
          'trash',
          `Menghapus permanen ${count} data dari Kotak Sampah`,
        ]
      );
    } catch (logErr: any) {
      console.warn('[trash API] Gagal log activity:', logErr.message);
    }

    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    console.error('DELETE /api/trash error:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}

// POST: Pulihkan data (restore) secara batch
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const session = decryptToken(token);
    if (!session) return NextResponse.json({ error: 'Invalid session' }, { status: 401 });

    const allowedRoles = ['Super Admin', 'Programmer'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: 'Hanya Super Admin & Programmer yang dapat memulihkan data dari Kotak Sampah.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, ids, all } = body;

    if (action === 'restore_batch') {
      let targetIds = ids;
      if (all) {
        const rows = await query('SELECT id FROM `trash`');
        targetIds = rows.map((r: any) => r.id);
      }

      if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
        return NextResponse.json({ error: 'Tidak ada data yang dipilih untuk dipulihkan.' }, { status: 400 });
      }

      let restoredCount = 0;
      const errors: string[] = [];

      for (const tId of targetIds) {
        try {
          const rows = await query('SELECT * FROM `trash` WHERE id = ?', [tId]);
          if (rows.length > 0) {
            await restoreTrashRecord(rows[0]);
            await query('DELETE FROM `trash` WHERE id = ?', [tId]);
            restoredCount++;
          }
        } catch (e: any) {
          errors.push(`ID ${tId}: ${e.message}`);
        }
      }

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
            'insert',
            'trash',
            `Memulihkan ${restoredCount} data dari Kotak Sampah kembali ke tabel sumber`,
          ]
        );
      } catch (logErr: any) {
        console.warn('[trash API] Gagal log activity:', logErr.message);
      }

      return NextResponse.json({
        success: true,
        restored: restoredCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/trash error:', err);
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}
