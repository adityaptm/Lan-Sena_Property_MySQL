import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';

// --- Keamanan: hanya izinkan nama tabel/kolom alfanumerik + underscore ---
function validateIdentifier(name: string) {
  if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
    throw new Error(`Nama tabel/kolom tidak valid: ${name}`);
  }
}

// Parse filter gaya "col.op.value,col2.op.value" (dipakai untuk pencarian OR)
function parseOrFilter(raw: string) {
  return raw.split(',').map((cond) => {
    const [column, op, ...rest] = cond.split('.');
    return { column, op, value: rest.join('.') };
  });
}

// Ubah value object/array (mis. field "items") jadi JSON string supaya aman
// disimpan ke kolom JSON/TEXT, alih-alih bikin mysql2 bingung.
// undefined -> null (MySQL tidak menerima undefined sama sekali).
function normalizeValue(v: any) {
  if (v === undefined) return null;
  if (v !== null && typeof v === 'object') return JSON.stringify(v);
  return v;
}

// Pastikan payload "data" untuk insert/update memang object biasa,
// bukan array / null / primitif — ini akar penyebab error
// "Unknown column '0' in 'field list'".
function assertPlainObject(data: any, context: string) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(
      `Data untuk "${context}" harus berupa object (bukan array/null/primitif). ` +
      `Diterima: ${Array.isArray(data) ? 'array' : typeof data} -> ${JSON.stringify(data)?.slice(0, 200)}`
    );
  }
}

async function handleSelect(params: any) {
  const { table, filters, single } = params;
  validateIdentifier(table);

  let sql = `SELECT * FROM \`${table}\``;
  const values: any[] = [];
  const whereClauses: string[] = [];

  if (Array.isArray(filters)) {
    const eqFilters = filters.filter((f: any) => f.type === 'eq');
    const orFilter = filters.find((f: any) => f.type === 'or');

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
        if (c.op === 'ilike') {
          orParts.push(`LOWER(\`${c.column}\`) LIKE LOWER(?)`);
        } else if (c.op === 'eq') {
          orParts.push(`\`${c.column}\` = ?`);
        } else {
          orParts.push(`\`${c.column}\` LIKE ?`);
        }
        values.push(c.value);
      }
      if (orParts.length) whereClauses.push(`(${orParts.join(' OR ')})`);
    }
  }

  if (whereClauses.length) sql += ' WHERE ' + whereClauses.join(' AND ');
  if (single) sql += ' LIMIT 1';

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

  const colNames = columns.map((c) => `\`${c}\``).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const values = columns.map((c) => normalizeValue(record[c]));

  try {
    await query(`INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders})`, values);
  } catch (e: any) {
    console.error(`[api/db] INSERT gagal pada tabel "${table}". Payload:`, JSON.stringify(record));
    throw e;
  }

  const rows = await query(`SELECT * FROM \`${table}\` WHERE id = ?`, [record.id]);
  return rows[0] || record;
}

async function handleUpdate(params: any) {
  const { table, data, filters } = params;
  validateIdentifier(table);
  assertPlainObject(data, `update:${table}`);

  const idFilter = Array.isArray(filters) ? filters.find((f: any) => f.column === 'id') : null;
  if (!idFilter) throw new Error('Update memerlukan filter id');

  const columns = Object.keys(data);
  columns.forEach(validateIdentifier);
  if (columns.length === 0) {
    const rows = await query(`SELECT * FROM \`${table}\` WHERE id = ?`, [idFilter.value]);
    return rows[0] || null;
  }

  const setClause = columns.map((c) => `\`${c}\` = ?`).join(', ');
  const values = columns.map((c) => normalizeValue(data[c]));
  values.push(idFilter.value);

  try {
    await query(`UPDATE \`${table}\` SET ${setClause} WHERE id = ?`, values);
  } catch (e: any) {
    console.error(`[api/db] UPDATE gagal pada tabel "${table}" id=${idFilter.value}. Payload:`, JSON.stringify(data));
    throw e;
  }

  const rows = await query(`SELECT * FROM \`${table}\` WHERE id = ?`, [idFilter.value]);
  return rows[0] || null;
}

async function handleDelete(params: any) {
  const { table, filters } = params;
  validateIdentifier(table);

  const idFilter = Array.isArray(filters) ? filters.find((f: any) => f.column === 'id') : null;
  if (!idFilter) throw new Error('Delete memerlukan filter id');

  await query(`DELETE FROM \`${table}\` WHERE id = ?`, [idFilter.value]);
  return { id: idFilter.value };
}

async function handleAction(action: any) {
  if (!action || typeof action !== 'object') {
    throw new Error(`Request action tidak valid: ${JSON.stringify(action)}`);
  }
  switch (action.action) {
    case 'select':
      return handleSelect(action);
    case 'insert':
      return handleInsert(action);
    case 'update':
      return handleUpdate(action);
    case 'delete':
      return handleDelete(action);
    default:
      throw new Error(`Aksi tidak dikenal: ${action.action}`);
  }
}

export async function POST(req: NextRequest) {
  // --- Cek session ---
  const token = req.cookies.get('lansena_session')?.value;
  const session = token ? decryptToken(token) : null;

  if (!session?.id) {
    return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Body request tidak valid' }, { status: 400 });
  }

  try {
    // Batch request (dipakai loadAll di data-context.tsx)
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map(async (action) => {
          try {
            const data = await handleAction(action);
            return { data };
          } catch (e: any) {
            console.error(`[api/db] Batch error [table=${action?.table}, action=${action?.action}]:`, e.message);
            return { data: [], error: e.message };
          }
        })
      );
      return NextResponse.json(results);
    }

    // Single request
    const data = await handleAction(body);
    return NextResponse.json({ data });
  } catch (e: any) {
    console.error(`[api/db] Error [table=${body?.table}, action=${body?.action}]:`, e.message);
    return NextResponse.json({ error: e.message || 'Terjadi kesalahan server' }, { status: 500 });
  }
}