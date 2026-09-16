import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';

function formatCurrency(num: any): string {
  if (num === null || num === undefined || num === '' || isNaN(Number(num))) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(num));
}

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

    // Auto-enrich data log terdahulu yang belum memuat nama konsumen / unit
    const enrichedRows = await Promise.all(
      rows.map(async (row: any) => {
        // Jika sudah memuat info konsumen, biarkan
        if (row.record_label && row.record_label.includes('Konsumen:')) {
          return row;
        }

        const actWord =
          row.action === 'insert' ? 'Menambahkan' : row.action === 'update' ? 'Mengedit' : 'Menghapus';

        try {
          // 1. Tabel sales
          if (row.table_name === 'sales' && row.record_id) {
            const sRows = await query(
              `SELECT s.id, s.no_penjualan, s.total_harga, s.metode_bayar, s.status,
                      c.nama AS customer_nama, u.no_unit, b.nama_blok
               FROM sales s
               LEFT JOIN customers c ON s.customer_id = c.id
               LEFT JOIN units u ON s.unit_id = u.id
               LEFT JOIN blocks b ON u.block_id = b.id
               WHERE s.id = ?`,
              [row.record_id],
            );
            if (sRows[0]?.customer_nama) {
              const uInfo = [sRows[0].nama_blok ? `Blok ${sRows[0].nama_blok}` : '', sRows[0].no_unit ? `No. ${sRows[0].no_unit}` : ''].filter(Boolean).join(' ');
              const newLabel = `Konsumen: ${sRows[0].customer_nama}${uInfo ? ` (${uInfo})` : ''}`;
              const newDetail = `${actWord} data penjualan konsumen ${sRows[0].customer_nama}${uInfo ? ` (${uInfo})` : ''}${sRows[0].status ? ` (Status: ${sRows[0].status})` : ''}`;
              row.record_label = newLabel;
              if (!row.detail || row.detail.includes('di tabel sales')) {
                row.detail = newDetail;
              }
              query('UPDATE activity_logs SET record_label = ?, detail = ? WHERE id = ?', [newLabel, row.detail, row.id]).catch(() => {});
            }
          }
          // 2. Tabel sale_payments
          else if (row.table_name === 'sale_payments' && row.record_id) {
            const pRows = await query(
              `SELECT p.nominal, p.no_kwitansi, p.deskripsi, p.diterima_dari,
                      c.nama AS customer_nama, u.no_unit, b.nama_blok
               FROM sale_payments p
               LEFT JOIN sales s ON p.sale_id = s.id
               LEFT JOIN customers c ON s.customer_id = c.id
               LEFT JOIN units u ON s.unit_id = u.id
               LEFT JOIN blocks b ON u.block_id = b.id
               WHERE p.id = ?`,
              [row.record_id],
            );
            if (pRows[0]) {
              const custNama = pRows[0].customer_nama || pRows[0].diterima_dari;
              if (custNama) {
                const uInfo = [pRows[0].nama_blok ? `Blok ${pRows[0].nama_blok}` : '', pRows[0].no_unit ? `No. ${pRows[0].no_unit}` : ''].filter(Boolean).join(' ');
                const nom = formatCurrency(pRows[0].nominal);
                const newLabel = `Konsumen: ${custNama}${uInfo ? ` (${uInfo})` : ''}`;
                const newDetail = `${actWord} pembayaran ${nom ? `${nom} ` : ''}untuk konsumen ${custNama}${uInfo ? ` (${uInfo})` : ''}${pRows[0].no_kwitansi ? ` - Kwitansi: ${pRows[0].no_kwitansi}` : ''}`;
                row.record_label = newLabel;
                if (!row.detail || row.detail.includes('di tabel sale_payments')) {
                  row.detail = newDetail;
                }
                query('UPDATE activity_logs SET record_label = ?, detail = ? WHERE id = ?', [newLabel, row.detail, row.id]).catch(() => {});
              }
            }
          }
          // 3. Tabel sale_step_history
          else if (row.table_name === 'sale_step_history' && row.record_id) {
            const hRows = await query(
              `SELECT h.jenis_step, h.status, h.keterangan,
                      c.nama AS customer_nama, u.no_unit, b.nama_blok
               FROM sale_step_history h
               LEFT JOIN sales s ON h.sale_id = s.id
               LEFT JOIN customers c ON s.customer_id = c.id
               LEFT JOIN units u ON s.unit_id = u.id
               LEFT JOIN blocks b ON u.block_id = b.id
               WHERE h.id = ?`,
              [row.record_id],
            );
            if (hRows[0]?.customer_nama) {
              const uInfo = [hRows[0].nama_blok ? `Blok ${hRows[0].nama_blok}` : '', hRows[0].no_unit ? `No. ${hRows[0].no_unit}` : ''].filter(Boolean).join(' ');
              const newLabel = `Konsumen: ${hRows[0].customer_nama}${uInfo ? ` (${uInfo})` : ''}`;
              const newDetail = `Update tahapan ${hRows[0].jenis_step || 'penjualan'} konsumen ${hRows[0].customer_nama}${uInfo ? ` (${uInfo})` : ''}: ${hRows[0].status || ''}${hRows[0].keterangan ? ` — ${hRows[0].keterangan}` : ''}`;
              row.record_label = newLabel;
              if (!row.detail || row.detail.includes('di tabel sale_step_history')) {
                row.detail = newDetail;
              }
              query('UPDATE activity_logs SET record_label = ?, detail = ? WHERE id = ?', [newLabel, row.detail, row.id]).catch(() => {});
            }
          }
          // 4. Tabel sale_kpr_submissions
          else if (row.table_name === 'sale_kpr_submissions' && row.record_id) {
            const kRows = await query(
              `SELECT k.status, k.kredit_acc, k.keterangan,
                      c.nama AS customer_nama, u.no_unit, b.nama_blok
               FROM sale_kpr_submissions k
               LEFT JOIN sales s ON k.sale_id = s.id
               LEFT JOIN customers c ON s.customer_id = c.id
               LEFT JOIN units u ON s.unit_id = u.id
               LEFT JOIN blocks b ON u.block_id = b.id
               WHERE k.id = ?`,
              [row.record_id],
            );
            if (kRows[0]?.customer_nama) {
              const uInfo = [kRows[0].nama_blok ? `Blok ${kRows[0].nama_blok}` : '', kRows[0].no_unit ? `No. ${kRows[0].no_unit}` : ''].filter(Boolean).join(' ');
              const acc = formatCurrency(kRows[0].kredit_acc);
              const newLabel = `Konsumen: ${kRows[0].customer_nama}${uInfo ? ` (${uInfo})` : ''}`;
              const newDetail = `${actWord} pengajuan KPR konsumen ${kRows[0].customer_nama}${uInfo ? ` (${uInfo})` : ''} - Status: ${kRows[0].status || '-'}${acc ? ` (ACC: ${acc})` : ''}`;
              row.record_label = newLabel;
              if (!row.detail || row.detail.includes('di tabel sale_kpr_submissions')) {
                row.detail = newDetail;
              }
              query('UPDATE activity_logs SET record_label = ?, detail = ? WHERE id = ?', [newLabel, row.detail, row.id]).catch(() => {});
            }
          }
          // 5. Tabel units
          else if (row.table_name === 'units' && row.record_id) {
            const uRows = await query(
              `SELECT u.no_unit, b.nama_blok, c.nama AS customer_nama
               FROM units u
               LEFT JOIN blocks b ON u.block_id = b.id
               LEFT JOIN sales s ON s.unit_id = u.id AND (s.status IS NULL OR s.status != 'Batal')
               LEFT JOIN customers c ON s.customer_id = c.id
               WHERE u.id = ?
               ORDER BY s.created_at DESC LIMIT 1`,
              [row.record_id],
            );
            if (uRows[0]) {
              const uInfo = [uRows[0].nama_blok ? `Blok ${uRows[0].nama_blok}` : '', uRows[0].no_unit ? `No. ${uRows[0].no_unit}` : ''].filter(Boolean).join(' ');
              const custText = uRows[0].customer_nama ? ` (Konsumen: ${uRows[0].customer_nama})` : '';
              const newLabel = `Unit ${uInfo || '-'}${custText}`;
              const newDetail = `${actWord} unit rumah ${uInfo || '-'}${custText}`;
              row.record_label = newLabel;
              if (!row.detail || row.detail.includes('di tabel units')) {
                row.detail = newDetail;
              }
              query('UPDATE activity_logs SET record_label = ?, detail = ? WHERE id = ?', [newLabel, row.detail, row.id]).catch(() => {});
            }
          }
        } catch (err: any) {
          console.warn(`[activity-logs] Error enriching log id=${row.id}:`, err.message);
        }

        return row;
      })
    );

    return NextResponse.json({ data: enrichedRows });
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
