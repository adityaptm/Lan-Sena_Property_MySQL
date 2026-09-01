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

    return { id: idFilter.value };
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
    case "insert":
      return handleInsert(action);
    case "update":
      return handleUpdate(action);
    case "delete":
      return handleDelete(action, session);
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
