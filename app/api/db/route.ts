import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { query } from "@/lib/db";
import { decryptToken } from "@/lib/auth-token";
import { hasPermission, canModifyUser, ActionType } from "@/lib/permissions";
import {
  TRASH_EXCLUDED_TABLES,
  archiveToTrash,
  restoreTrashRecord,
} from "@/lib/trash";

// --- Keamanan: hanya izinkan nama tabel/kolom alfanumerik + underscore ---
function validateIdentifier(name: string) {
  if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Nama tabel/kolom tidak valid: ${name}`);
  }
}

// Parse filter gaya "col.op.value,col2.op.value" (dipakai untuk pencarian OR)
function parseOrFilter(raw: string) {
  return raw.split(",").map((cond) => {
    const [column, op, ...rest] = cond.split(".");
    return { column, op, value: rest.join(".") };
  });
}

// Ubah value object/array (mis. field "items") jadi JSON string
function normalizeValue(v: any) {
  if (v === undefined) return null;
  if (v !== null && typeof v === "object") return JSON.stringify(v);
  return v;
}

function assertPlainObject(data: any, context: string) {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(
      `Data untuk "${context}" harus berupa object (bukan array/null/primitif). ` +
        `Diterima: ${Array.isArray(data) ? "array" : typeof data} -> ${JSON.stringify(data)?.slice(0, 200)}`,
    );
  }
}

async function verifyPermission(
  action: any,
  session: { role: string; id: string },
) {
  if (!action || typeof action !== "object") {
    throw new Error("Request action tidak valid");
  }

  // restore_trash punya pengecekan izin sendiri (hanya Super Admin / Programmer), tidak
  // beroperasi pada satu tabel tunggal jadi lewati pengecekan generic di bawah.
  if (action.action === "restore_trash") {
    if (session.role !== "Super Admin" && session.role !== "Programmer") {
      throw new Error(
        "Akses ditolak: hanya Super Admin yang dapat memulihkan data dari trash.",
      );
    }
    return;
  }

  const { table, action: actType, data, filters } = action;

  if (!table || !actType) {
    throw new Error("Nama tabel dan action wajib diisi");
  }

  // 1. Pengecekan standar RBAC via lib/permissions.ts
  const allowed = hasPermission(session.role, table, actType as ActionType);
  if (!allowed) {
    throw new Error(
      `Akses ditolak: role ${session.role} tidak memiliki izin '${actType}' pada tabel '${table}'.`,
    );
  }

  // 2. Proteksi Khusus Tabel Users
  if (table === "users" && actType !== "select") {
    let targetUserRole: string | undefined = undefined;

    if (actType === "update" || actType === "delete") {
      const idFilter = Array.isArray(filters)
        ? filters.find((f: any) => f.column === "id")
        : null;
      if (idFilter) {
        const rows = await query("SELECT role FROM users WHERE id = ?", [
          idFilter.value,
        ]);
        if (rows.length > 0) {
          targetUserRole = rows[0].role;
        }
      }
    }

    const newDataRole = data?.role;
    const userCheck = canModifyUser(session.role, targetUserRole, newDataRole);
    if (!userCheck.allowed) {
      throw new Error(
        userCheck.reason || "Akses ditolak untuk modifikasi user.",
      );
    }
  }
}

async function handleSelect(params: any) {
  const { table, filters, single } = params;
  validateIdentifier(table);

  let sql = `SELECT * FROM \`${table}\``;
  const values: any[] = [];
  const whereClauses: string[] = [];

  if (Array.isArray(filters)) {
    const eqFilters = filters.filter((f: any) => f.type === "eq");
    const orFilter = filters.find((f: any) => f.type === "or");

    for (const f of eqFilters) {
      validateIdentifier(f.column);
      whereClauses.push(`\`${f.column}\` = ?`);
      values.push(f.value);
    }

    if (orFilter) {
      const conds = parseOrFilter(orFilter.value);
      const orParts: string[] = [];
      for (const c of conds) {
        validateIdentifier(c.column);
        if (c.op === "ilike") {
          orParts.push(`LOWER(\`${c.column}\`) LIKE LOWER(?)`);
        } else if (c.op === "eq") {
          orParts.push(`\`${c.column}\` = ?`);
        } else {
          orParts.push(`\`${c.column}\` LIKE ?`);
        }
        values.push(c.value);
      }
      if (orParts.length) whereClauses.push(`(${orParts.join(" OR ")})`);
    }
  }

  if (whereClauses.length) sql += " WHERE " + whereClauses.join(" AND ");
  if (single) sql += " LIMIT 1";

  const rows = await query(sql, values);
  return single ? rows[0] || null : rows;
}

async function handleInsert(params: any) {
  const { table, data } = params;
  validateIdentifier(table);
  assertPlainObject(data, `insert:${table}`);

  const record = { ...data };
  if (!record.id) record.id = crypto.randomUUID();

  const columns = Object.keys(record);
  columns.forEach(validateIdentifier);

  const colNames = columns.map((c) => `\`${c}\``).join(", ");
  const placeholders = columns.map(() => "?").join(", ");
  const values = columns.map((c) => normalizeValue(record[c]));

  try {
    await query(
      `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`,
      values,
    );
  } catch (e: any) {
    console.error(
      `[api/db] INSERT gagal pada tabel "${table}". Payload:`,
      JSON.stringify(record),
    );
    throw e;
  }

  const rows = await query(`SELECT * FROM \`${table}\` WHERE id = ?`, [
    record.id,
  ]);
  return rows[0] || record;
}

async function handleUpdate(params: any) {
  const { table, data, filters } = params;
  validateIdentifier(table);
  assertPlainObject(data, `update:${table}`);

  const idFilter = Array.isArray(filters)
    ? filters.find((f: any) => f.column === "id")
    : null;
  if (!idFilter) throw new Error("Update memerlukan filter id");

  const columns = Object.keys(data);
  columns.forEach(validateIdentifier);
  if (columns.length === 0) {
    const rows = await query(`SELECT * FROM \`${table}\` WHERE id = ?`, [
      idFilter.value,
    ]);
    return rows[0] || null;
  }

  const setClause = columns.map((c) => `\`${c}\` = ?`).join(", ");
  const values = columns.map((c) => normalizeValue(data[c]));
  values.push(idFilter.value);

  try {
    await query(`UPDATE \`${table}\` SET ${setClause} WHERE id = ?`, values);
  } catch (e: any) {
    console.error(
      `[api/db] UPDATE gagal pada tabel "${table}" id=${idFilter.value}. Payload:`,
      JSON.stringify(data),
    );
    throw e;
  }

  const rows = await query(`SELECT * FROM \`${table}\` WHERE id = ?`, [
    idFilter.value,
  ]);
  return rows[0] || null;
}

async function handleDelete(
  params: any,
  session?: { id: string; role: string; nama?: string; email?: string },
) {
  const { table, filters, skipTrash, record_label: recordLabel } = params;
  validateIdentifier(table);

  const idFilter = Array.isArray(filters)
    ? filters.find((f: any) => f.column === "id")
    : null;
  if (!idFilter) throw new Error("Delete memerlukan filter id");

  try {
    const rows = await query(`SELECT * FROM \`${table}\` WHERE id = ?`, [
      idFilter.value,
    ]);
    if (rows.length === 0) {
      throw new Error(
        `Data pada tabel "${table}" dengan id "${idFilter.value}" tidak ditemukan (mungkin sudah terhapus sebelumnya).`,
      );
    }

    const deletedRecord = rows[0];

    if (!skipTrash && !TRASH_EXCLUDED_TABLES.has(table)) {
      try {
        await archiveToTrash(table, rows[0], session, recordLabel);
      } catch (trashErr: any) {
        console.error(
          `[api/db] Gagal arsip ke trash [table=${table}, id=${idFilter.value}]:`,
          trashErr.message,
        );
        throw new Error(
          `Gagal menghapus: tabel trash belum siap (${trashErr.message}). Jalankan "npm run db:ensure".`,
        );
      }
    }

    const result: any = await query(`DELETE FROM \`${table}\` WHERE id = ?`, [
      idFilter.value,
    ]);

    // Kalau tidak ada baris yang terhapus, kemungkinan id sudah tidak ada / sudah terhapus duluan
    if (result?.affectedRows === 0) {
      throw new Error(
        `Data pada tabel "${table}" dengan id "${idFilter.value}" tidak ditemukan (mungkin sudah terhapus sebelumnya).`,
      );
    }

    return { id: idFilter.value, deletedRecord };
  } catch (e: any) {
    // MySQL error code untuk FK constraint: ER_ROW_IS_REFERENCED_2 / errno 1451
    if (e?.code === "ER_ROW_IS_REFERENCED_2" || e?.errno === 1451) {
      console.error(
        `[api/db] DELETE gagal (FK constraint) pada tabel "${table}" id=${idFilter.value}:`,
        e.sqlMessage || e.message,
      );
      throw new Error(
        `Data ini tidak dapat dihapus karena masih direferensikan oleh data lain (misalnya barang masuk/keluar yang terkait). ` +
          `Hapus dulu data terkait tersebut, baru hapus data ini.`,
      );
    }
    console.error(
      `[api/db] DELETE gagal pada tabel "${table}" id=${idFilter.value}:`,
      e.sqlMessage || e.message,
    );
    throw e;
  }
}

async function handleRestoreTrash(params: any) {
  const { trashId } = params;
  if (!trashId) throw new Error("trashId wajib diisi");

  const rows = await query(`SELECT * FROM \`trash\` WHERE id = ?`, [trashId]);
  if (rows.length === 0) {
    throw new Error(
      "Item trash tidak ditemukan (mungkin sudah dipulihkan/dihapus).",
    );
  }

  try {
    await restoreTrashRecord(rows[0]);
  } catch (e: any) {
    console.error(
      `[api/db] Gagal restore trash id=${trashId}:`,
      e.sqlMessage || e.message,
    );
    throw new Error(
      `Gagal memulihkan data: ${e.message || "terjadi kesalahan tidak diketahui"}.`,
    );
  }

  await query(`DELETE FROM \`trash\` WHERE id = ?`, [trashId]);

  return { success: true };
}

function formatCurrency(num: any): string {
  if (num === null || num === undefined || num === '' || isNaN(Number(num))) return '';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(num));
}

function getTableDisplayName(table: string): string {
  const map: Record<string, string> = {
    users: 'Pengguna',
    customers: 'Konsumen',
    banks: 'Bank',
    locations: 'Lokasi',
    blocks: 'Blok',
    unit_types: 'Tipe Unit',
    units: 'Unit Rumah',
    sales: 'Penjualan',
    items: 'Barang',
    purchases: 'Pembelian',
    goods_in: 'Barang Masuk',
    goods_out: 'Barang Keluar',
    cash_bank_accounts: 'Kas/Bank',
    cashflow_entries: 'Cashflow',
    mandor_advances: 'Kasbon Mandor',
    operational_expenses: 'Biaya Operasional',
    disbursement_requests: 'Pengajuan Pencairan',
    company_assets: 'Aset Perusahaan',
    company_settings: 'Pengaturan Perusahaan',
    marketers: 'Marketer',
    marketer_rights: 'Hak Marketer',
    online_bookings: 'Booking Online',
    sale_payments: 'Pembayaran',
    sale_additional_costs: 'Biaya Tambahan',
    sale_discounts: 'Diskon',
    bank_loans: 'Hutang Bank',
    chart_of_accounts: 'Akun Keuangan',
    trash: 'Kotak Sampah',
    sale_step_history: 'Tahapan Penjualan',
    sale_kpr_submissions: 'Pengajuan KPR',
    sale_billing_letters: 'Surat Tagihan',
  };
  return map[table] || table;
}

async function resolveActivityInfo(
  action: 'insert' | 'update' | 'delete',
  table: string,
  record: any,
  explicitLabel?: string,
): Promise<{ label: string; detail: string }> {
  try {
    const actWord =
      action === 'insert' ? 'Menambahkan' : action === 'update' ? 'Mengedit' : 'Menghapus';

    // 1. SALES
    if (table === 'sales') {
      let custNama = '';
      if (record.customer_id) {
        const custs = await query(`SELECT nama, no_hp FROM customers WHERE id = ?`, [
          record.customer_id,
        ]);
        if (custs[0]?.nama) custNama = custs[0].nama;
      }
      let unitInfo = '';
      if (record.unit_id) {
        const uRows = await query(
          `SELECT u.no_unit, b.nama_blok, l.nama_lokasi 
           FROM units u 
           LEFT JOIN blocks b ON u.block_id = b.id 
           LEFT JOIN locations l ON b.location_id = l.id 
           WHERE u.id = ?`,
          [record.unit_id],
        );
        if (uRows[0]) {
          const parts = [];
          if (uRows[0].nama_blok) parts.push(`Blok ${uRows[0].nama_blok}`);
          if (uRows[0].no_unit) parts.push(`No. ${uRows[0].no_unit}`);
          unitInfo = parts.join(' ');
        }
      }
      const label = custNama
        ? `Konsumen: ${custNama}${unitInfo ? ` (${unitInfo})` : ''}`
        : unitInfo
        ? `Unit ${unitInfo}`
        : record.no_penjualan || explicitLabel || 'Penjualan';

      let detail = '';
      if (action === 'insert') {
        detail = `Menambahkan penjualan baru untuk konsumen ${custNama || '-'}${unitInfo ? ` di ${unitInfo}` : ''}${record.metode_bayar ? ` - Skema ${record.metode_bayar}` : ''}${record.total_harga ? ` - Total ${formatCurrency(record.total_harga)}` : ''}`;
      } else if (action === 'update') {
        detail = `Mengedit data penjualan konsumen ${custNama || '-'}${unitInfo ? ` di ${unitInfo}` : ''}${record.status ? ` (Status: ${record.status})` : ''}${record.kpr_status ? ` (KPR: ${record.kpr_status})` : ''}`;
      } else {
        detail = `Menghapus data penjualan konsumen ${custNama || '-'}${unitInfo ? ` di ${unitInfo}` : ''}`;
      }
      return { label, detail };
    }

    // 2. TABEL-TABEL TRANSAKSI PENJUALAN (sale_payments, sale_step_history, sale_kpr_submissions, sale_additional_costs, sale_discounts, sale_billing_letters)
    if (
      table === 'sale_payments' ||
      table === 'sale_step_history' ||
      table === 'sale_kpr_submissions' ||
      table === 'sale_additional_costs' ||
      table === 'sale_discounts' ||
      table === 'sale_billing_letters'
    ) {
      let custNama = '';
      let unitInfo = '';
      let saleId = record.sale_id;

      if (!saleId && record.id) {
        const curRows = await query(`SELECT sale_id FROM \`${table}\` WHERE id = ?`, [record.id]);
        if (curRows[0]?.sale_id) saleId = curRows[0].sale_id;
      }

      if (saleId) {
        const sRows = await query(
          `SELECT s.id, s.no_penjualan, c.nama AS customer_nama, u.no_unit, b.nama_blok
           FROM sales s
           LEFT JOIN customers c ON s.customer_id = c.id
           LEFT JOIN units u ON s.unit_id = u.id
           LEFT JOIN blocks b ON u.block_id = b.id
           WHERE s.id = ?`,
          [saleId],
        );
        if (sRows[0]) {
          custNama = sRows[0].customer_nama || '';
          const parts = [];
          if (sRows[0].nama_blok) parts.push(`Blok ${sRows[0].nama_blok}`);
          if (sRows[0].no_unit) parts.push(`No. ${sRows[0].no_unit}`);
          unitInfo = parts.join(' ');
        }
      }

      if (!custNama && record.diterima_dari) {
        custNama = record.diterima_dari;
      }

      const label = custNama
        ? `Konsumen: ${custNama}${unitInfo ? ` (${unitInfo})` : ''}`
        : unitInfo
        ? `Unit ${unitInfo}`
        : explicitLabel || getTableDisplayName(table);

      let detail = '';
      if (table === 'sale_payments') {
        const nom = formatCurrency(record.nominal);
        if (action === 'insert') {
          detail = `Menambahkan pembayaran ${nom ? `${nom} ` : ''}untuk konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''}${record.no_kwitansi ? ` - Kwitansi: ${record.no_kwitansi}` : ''}${record.deskripsi ? ` (${record.deskripsi})` : ''}`;
        } else if (action === 'update') {
          detail = `Mengedit pembayaran ${nom ? `${nom} ` : ''}konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''}${record.no_kwitansi ? ` - Kwitansi: ${record.no_kwitansi}` : ''}`;
        } else {
          detail = `Menghapus pembayaran ${nom ? `${nom} ` : ''}konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''}`;
        }
      } else if (table === 'sale_step_history') {
        if (action === 'insert') {
          detail = `Update tahapan ${record.jenis_step || 'penjualan'} konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''}: ${record.status || ''}${record.keterangan ? ` — ${record.keterangan}` : ''}`;
        } else {
          detail = `${actWord} tahapan penjualan konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''}: ${record.status || ''}`;
        }
      } else if (table === 'sale_kpr_submissions') {
        const acc = formatCurrency(record.kredit_acc);
        detail = `${actWord} pengajuan KPR konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''} - Status: ${record.status || '-'}${acc ? ` (ACC: ${acc})` : ''}${record.keterangan ? ` — ${record.keterangan}` : ''}`;
      } else if (table === 'sale_additional_costs') {
        const nom = formatCurrency(record.nominal);
        detail = `${actWord} biaya tambahan ${nom} untuk konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''}${record.keterangan ? `: ${record.keterangan}` : ''}`;
      } else if (table === 'sale_discounts') {
        const nom = formatCurrency(record.nominal);
        detail = `${actWord} diskon ${nom} untuk konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''}${record.keterangan ? `: ${record.keterangan}` : ''}`;
      } else if (table === 'sale_billing_letters') {
        detail = `${actWord} surat tagihan konsumen ${custNama || '-'}${unitInfo ? ` (${unitInfo})` : ''}${record.jatuh_tempo ? ` (Jatuh tempo: ${record.jatuh_tempo})` : ''}`;
      }

      return { label, detail };
    }

    // 3. UNITS
    if (table === 'units') {
      let unitTitle = record.no_unit ? `No. ${record.no_unit}` : '';
      if (record.block_id) {
        const bRows = await query(`SELECT nama_blok FROM blocks WHERE id = ?`, [record.block_id]);
        if (bRows[0]?.nama_blok) {
          unitTitle = `Blok ${bRows[0].nama_blok} ${unitTitle}`.trim();
        }
      }
      let custText = '';
      if (record.id) {
        const sRows = await query(
          `SELECT c.nama FROM sales s JOIN customers c ON s.customer_id = c.id WHERE s.unit_id = ? AND (s.status IS NULL OR s.status != 'Batal') ORDER BY s.created_at DESC LIMIT 1`,
          [record.id],
        );
        if (sRows[0]?.nama) custText = ` (Konsumen: ${sRows[0].nama})`;
      }
      const label = `Unit ${unitTitle || '-'}${custText}`;
      const detail = `${actWord} unit rumah ${unitTitle || '-'}${custText}${record.status ? ` - Status: ${record.status}` : ''}${record.harga_dasar ? ` (${formatCurrency(record.harga_dasar)})` : ''}`;
      return { label, detail };
    }

    // 4. CUSTOMERS
    if (table === 'customers') {
      const label = `Konsumen: ${record.nama || '-'}`;
      const detail = `${actWord} data konsumen ${record.nama || '-'}${record.no_hp && record.no_hp !== '-' ? ` (HP: ${record.no_hp})` : ''}${record.nik && !record.nik.startsWith('00000') ? ` (NIK: ${record.nik})` : ''}`;
      return { label, detail };
    }

    // 5. MARKETER RIGHTS
    if (table === 'marketer_rights') {
      let custNama = '';
      let mktNama = '';
      if (record.sale_id) {
        const sRows = await query(
          `SELECT c.nama FROM sales s JOIN customers c ON s.customer_id = c.id WHERE s.id = ?`,
          [record.sale_id],
        );
        if (sRows[0]?.nama) custNama = sRows[0].nama;
      }
      if (record.marketer_id) {
        const mRows = await query(`SELECT nama FROM marketers WHERE id = ?`, [record.marketer_id]);
        if (mRows[0]?.nama) mktNama = mRows[0].nama;
      }
      const label = `Fee Marketer: ${mktNama || '-'}${custNama ? ` (Konsumen: ${custNama})` : ''}`;
      const detail = `${actWord} hak fee marketer ${mktNama || '-'} untuk penjualan konsumen ${custNama || '-'} (${formatCurrency(record.nominal_fee)})`;
      return { label, detail };
    }

    // 6. ONLINE BOOKINGS
    if (table === 'online_bookings') {
      let custNama = record.customer_nama || '';
      if (!custNama && record.customer_id) {
        const cRows = await query(`SELECT nama FROM customers WHERE id = ?`, [record.customer_id]);
        if (cRows[0]?.nama) custNama = cRows[0].nama;
      }
      const label = `Booking Online: ${custNama || '-'}`;
      const detail = `${actWord} booking online konsumen ${custNama || '-'}${record.status ? ` (Status: ${record.status})` : ''}`;
      return { label, detail };
    }

    // 7. USERS
    if (table === 'users') {
      const label = `Pengguna: ${record.nama || '-'} (${record.role || '-'})`;
      const detail = `${actWord} akun pengguna ${record.nama || '-'}${record.email ? ` [${record.email}]` : ''} - Role: ${record.role || '-'}`;
      return { label, detail };
    }

    // 8. ITEMS
    if (table === 'items') {
      const label = `Barang: ${record.nama_barang || '-'}`;
      const detail = `${actWord} master barang ${record.nama_barang || '-'}${record.stok !== undefined ? ` (Stok: ${record.stok} ${record.satuan || ''})` : ''}`;
      return { label, detail };
    }

    // 9. PURCHASES
    if (table === 'purchases') {
      const label = `PO: ${record.no_po || '-'} (${record.supplier || '-'})`;
      const detail = `${actWord} PO pembelian ${record.no_po || '-'} dari supplier ${record.supplier || '-'}${record.total_harga ? ` (Total: ${formatCurrency(record.total_harga)})` : ''}`;
      return { label, detail };
    }

    // 10. GOODS IN / OUT
    if (table === 'goods_in') {
      const label = `Barang Masuk (PO: ${record.no_po || '-'})`;
      const detail = `${actWord} penerimaan barang masuk (PO: ${record.no_po || '-'}) ${record.catatan ? ` - ${record.catatan}` : ''}`;
      return { label, detail };
    }
    if (table === 'goods_out') {
      const label = `Barang Keluar: ${record.tujuan_pemakaian || '-'}`;
      const detail = `${actWord} pengeluaran barang untuk ${record.tujuan_pemakaian || '-'}${record.catatan ? ` (${record.catatan})` : ''}`;
      return { label, detail };
    }

    // 11. FINANCE & CASHFLOW
    if (table === 'cashflow_entries') {
      const label = `Cashflow ${record.jenis || ''}: ${formatCurrency(record.nominal)}`;
      const detail = `${actWord} arus kas ${record.jenis || ''} sebesar ${formatCurrency(record.nominal)}${record.keterangan ? ` - ${record.keterangan}` : ''}`;
      return { label, detail };
    }
    if (table === 'mandor_advances') {
      const label = `Kasbon: ${record.nama_mandor || '-'}`;
      const detail = `${actWord} kasbon mandor ${record.nama_mandor || '-'} sebesar ${formatCurrency(record.nominal)}${record.keterangan ? ` (${record.keterangan})` : ''}`;
      return { label, detail };
    }
    if (table === 'operational_expenses') {
      const label = `Operasional: ${record.kategori || '-'}`;
      const detail = `${actWord} biaya operasional ${record.kategori || '-'} sebesar ${formatCurrency(record.nominal)}${record.keterangan ? ` (${record.keterangan})` : ''}`;
      return { label, detail };
    }
    if (table === 'disbursement_requests') {
      const label = `Pencairan: ${record.jenis_pengajuan || '-'}`;
      const detail = `${actWord} pengajuan pencairan dana ${record.jenis_pengajuan || '-'} sebesar ${formatCurrency(record.nominal)} (Status: ${record.status_approval || 'Diajukan'})`;
      return { label, detail };
    }
    if (table === 'company_assets') {
      const label = `Aset: ${record.nama_aset || '-'}`;
      const detail = `${actWord} aset perusahaan ${record.nama_aset || '-'}${record.nilai_perolehan ? ` (${formatCurrency(record.nilai_perolehan)})` : ''}`;
      return { label, detail };
    }
    if (table === 'banks') {
      const label = `Bank: ${record.nama_bank || '-'}`;
      const detail = `${actWord} mitra bank ${record.nama_bank || '-'}${record.cabang ? ` Cabang ${record.cabang}` : ''}`;
      return { label, detail };
    }
    if (table === 'bank_loans') {
      const label = `Hutang Bank: ${record.bank_nama || '-'}`;
      const detail = `${actWord} hutang bank ${record.bank_nama || '-'} sebesar ${formatCurrency(record.total_hutang)}`;
      return { label, detail };
    }
    if (table === 'cash_bank_accounts') {
      const label = `Kas/Bank: ${record.nama_akun || '-'}`;
      const detail = `${actWord} akun kas/bank ${record.nama_akun || '-'} (${record.jenis || 'Kas'})`;
      return { label, detail };
    }
    if (table === 'chart_of_accounts') {
      const label = `COA: ${record.kode_akun || '-'} - ${record.nama_akun || '-'}`;
      const detail = `${actWord} akun COA ${record.kode_akun || '-'} - ${record.nama_akun || '-'}`;
      return { label, detail };
    }
    if (table === 'marketers') {
      const label = `Marketer: ${record.nama || '-'}`;
      const detail = `${actWord} data marketer ${record.nama || '-'}${record.no_hp ? ` (HP: ${record.no_hp})` : ''}`;
      return { label, detail };
    }
    if (table === 'locations') {
      const label = `Lokasi: ${record.nama_lokasi || '-'}`;
      const detail = `${actWord} master lokasi ${record.nama_lokasi || '-'}`;
      return { label, detail };
    }
    if (table === 'blocks') {
      const label = `Blok: ${record.nama_blok || '-'}`;
      const detail = `${actWord} master blok ${record.nama_blok || '-'}`;
      return { label, detail };
    }
    if (table === 'unit_types') {
      const label = `Tipe: ${record.nama_type || '-'}`;
      const detail = `${actWord} master tipe unit ${record.nama_type || '-'}`;
      return { label, detail };
    }

    // Default Fallback
    const fallbackLabel =
      explicitLabel ||
      record.nama ||
      record.nama_barang ||
      record.nama_akun ||
      record.nama_step ||
      record.nama_item ||
      record.keterangan ||
      record.no_po ||
      record.no_kwitansi ||
      record.id ||
      '';
    const cleanLabel = fallbackLabel ? String(fallbackLabel) : '';
    const detail = `${actWord} data di tabel ${getTableDisplayName(table)}${cleanLabel ? `: ${cleanLabel}` : ''}`;
    return { label: cleanLabel, detail };
  } catch (err: any) {
    console.warn('[resolveActivityInfo] Gagal resolve metadata:', err.message);
    const fallback = explicitLabel || record?.nama || record?.keterangan || '';
    return {
      label: fallback ? String(fallback) : '',
      detail: `${action === 'insert' ? 'Menambahkan data baru' : action === 'update' ? 'Mengedit data' : 'Menghapus data'} di tabel ${getTableDisplayName(table)}`,
    };
  }
}

async function logActivity(
  session: { id: string; role: string; nama?: string } | undefined,
  action: string,
  tableName: string,
  recordId?: string,
  recordLabel?: string,
  detail?: string,
) {
  if (!session) return;
  // Jangan log perubahan pada tabel activity_logs sendiri (cegah infinite loop)
  if (tableName === 'activity_logs') return;
  try {
    await query(
      `INSERT INTO activity_logs (id, user_id, user_nama, user_role, action, table_name, record_id, record_label, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        crypto.randomUUID(),
        session.id,
        session.nama || '-',
        session.role || '-',
        action,
        tableName,
        recordId || null,
        recordLabel || null,
        detail || null,
      ],
    );
  } catch (e: any) {
    // Jangan gagalkan operasi utama jika logging gagal
    console.warn('[activity_logs] Gagal menulis log:', e.message);
  }
}

async function handleAction(
  action: any,
  session?: { id: string; role: string; nama?: string; email?: string },
) {
  if (!action || typeof action !== "object") {
    throw new Error(`Request action tidak valid: ${JSON.stringify(action)}`);
  }
  switch (action.action) {
    case "select":
      return handleSelect(action);
    case "insert": {
      const result = await handleInsert(action);
      // Log aktivitas insert dengan resolusi metadata informatif (termasuk nama konsumen & unit)
      try {
        const insertedId = result?.id || action.data?.id || '-';
        const record = result || action.data || {};
        const { label, detail } = await resolveActivityInfo('insert', action.table, record, action.record_label);
        await logActivity(session, 'insert', action.table, insertedId, label ? String(label).substring(0, 255) : undefined, detail);
      } catch (logErr: any) {
        console.warn('[api/db] Gagal memproses activity log insert:', logErr.message);
      }
      return result;
    }
    case "update": {
      const result = await handleUpdate(action);
      // Log aktivitas update dengan resolusi metadata informatif
      try {
        const updatedId = action.filters?.find((f: any) => f.column === 'id')?.value || '-';
        const record = { ...(action.data || {}), ...(result || {}) };
        if (!record.id) record.id = updatedId;
        const { label, detail } = await resolveActivityInfo('update', action.table, record, action.record_label);
        await logActivity(session, 'update', action.table, updatedId, label ? String(label).substring(0, 255) : undefined, detail);
      } catch (logErr: any) {
        console.warn('[api/db] Gagal memproses activity log update:', logErr.message);
      }
      return result;
    }
    case "delete": {
      const result = await handleDelete(action, session);
      // Log aktivitas delete dengan resolusi metadata informatif
      try {
        const deletedId = action.filters?.find((f: any) => f.column === 'id')?.value || '-';
        const record = result?.deletedRecord || { id: deletedId };
        const { label, detail } = await resolveActivityInfo('delete', action.table, record, action.record_label);
        await logActivity(session, 'delete', action.table, deletedId, label ? String(label).substring(0, 255) : undefined, detail);
      } catch (logErr: any) {
        console.warn('[api/db] Gagal memproses activity log delete:', logErr.message);
      }
      return result;
    }
    case "restore_trash":
      return handleRestoreTrash(action);
    default:
      throw new Error(`Aksi tidak dikenal: ${action.action}`);
  }
}

export async function POST(req: NextRequest) {
  // --- Cek session ---
  const token = req.cookies.get("lansena_session")?.value;
  const session = token ? decryptToken(token) : null;

  if (!session?.id) {
    return NextResponse.json(
      { error: "Unauthorized: Session missing" },
      { status: 401 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid" },
      { status: 400 },
    );
  }

  try {
    // Batch request (dipakai loadAll di data-context.tsx)
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map(async (action) => {
          try {
            await verifyPermission(action, session as any);
            const data = await handleAction(action, session as any);
            return { data };
          } catch (e: any) {
            console.error(
              `[api/db] Batch item forbidden/error [table=${action?.table}, action=${action?.action}]:`,
              e.message,
            );
            return { data: [], error: e.message };
          }
        }),
      );
      return NextResponse.json(results);
    }

    // Single request
    await verifyPermission(body, session as any);
    const data = await handleAction(body, session as any);
    return NextResponse.json({ data });
  } catch (e: any) {
    console.error(
      `[api/db] Error [table=${body?.table}, action=${body?.action}]:`,
      e.message,
    );
    const status = e.message.startsWith("Akses ditolak") ? 403 : 500;
    return NextResponse.json(
      { error: e.message || "Terjadi kesalahan server" },
      { status },
    );
  }
}
