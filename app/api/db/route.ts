import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { decryptToken } from '@/lib/auth-token';
import crypto from 'crypto';

const buildWhereClause = (filters: any[]) => {
  let where = '';
  const params: any[] = [];

  if (filters && filters.length > 0) {
    const clauses: string[] = [];
    for (const f of filters) {
      if (f.type === 'eq') {
        if (f.value === null) {
          clauses.push(`\`${f.column}\` IS NULL`);
        } else {
          clauses.push(`\`${f.column}\` = ?`);
          params.push(f.value);
        }
      } else if (f.type === 'or') {
        const orParts = f.value.split(',');
        const orClauses: string[] = [];
        for (const part of orParts) {
          const match = part.match(/([a-zA-Z0-9_]+)\.(ilike|eq)\.(.+)/);
          if (match) {
            const col = match[1];
            const op = match[2];
            let val = match[3];
            if (op === 'ilike') {
              orClauses.push(`\`${col}\` LIKE ?`);
              val = val.replace(/%/g, '');
              params.push(`%${val}%`);
            } else {
              orClauses.push(`\`${col}\` = ?`);
              params.push(val);
            }
          }
        }
        if (orClauses.length > 0) {
          clauses.push(`(${orClauses.join(' OR ')})`);
        }
      }
    }
    if (clauses.length > 0) {
      where = ` WHERE ${clauses.join(' AND ')}`;
    }
  }

  return { where, params };
};

export async function POST(req: NextRequest) {
  try {
    // Auth Check
    const token = req.cookies.get('lansena_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }
    const user = decryptToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body = await req.json();
    const isBatch = Array.isArray(body);
    const requests = isBatch ? body : [body];
    const results = [];

    for (const reqObj of requests) {
      const { action, table, select, filters, limit, single, data, orderField, orderAscending } = reqObj;

      if (!table) {
        results.push({ error: 'Table name is required' });
        continue;
      }

      // 1. SELECT action
      if (action === 'select') {
        const { where, params: whereParams } = buildWhereClause(filters);
        
        let selectCols = '*';
        let isJoinUsers = false;

        if (select && typeof select === 'string' && select !== '*') {
          if (select.includes('users(') || select.includes('users(nama)')) {
            isJoinUsers = true;
            selectCols = `\`${table}\`.*, \`users\`.\`nama\` AS \`users_nama\``;
          } else {
            selectCols = select.split(',').map(c => `\`${c.trim()}\``).join(', ');
          }
        }

        let sql = '';
        if (isJoinUsers && table === 'sale_step_history') {
          sql = `SELECT ${selectCols} FROM \`${table}\` LEFT JOIN \`users\` ON \`${table}\`.\`changed_by\` = \`users\`.\`id\`${where}`;
        } else {
          sql = `SELECT ${selectCols} FROM \`${table}\`${where}`;
        }

        // Add ordering
        if (orderField) {
          sql += ` ORDER BY \`${orderField}\` ${orderAscending !== false ? 'ASC' : 'DESC'}`;
        }

        if (limit) {
          sql += ` LIMIT ${Number(limit)}`;
        }

        let rows = await query(sql, whereParams);

        if (isJoinUsers) {
          rows = rows.map((r: any) => {
            const { users_nama, ...rest } = r;
            return {
              ...rest,
              users: users_nama ? { nama: users_nama } : null
            };
          });
        }

        results.push({ data: single ? (rows[0] || null) : rows });
        continue;
      }

      // 2. INSERT action
      if (action === 'insert') {
        const records = Array.isArray(data) ? data : [data];
        const insertedRecords: any[] = [];

        for (const rec of records) {
          // Generate UUID if not present
          if (!rec.id) {
            rec.id = crypto.randomUUID();
          }

          const cols = Object.keys(rec);
          const placeholders = cols.map(() => '?').join(', ');
          const values = Object.values(rec);

          const sql = `INSERT INTO \`${table}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;
          await query(sql, values);
          insertedRecords.push(rec);
        }

        results.push({ data: insertedRecords });
        continue;
      }

      // 3. UPDATE action
      if (action === 'update') {
        const { where, params: whereParams } = buildWhereClause(filters);
        const cols = Object.keys(data);
        const setClause = cols.map(c => `\`${c}\` = ?`).join(', ');
        const setValues = Object.values(data);

        const sql = `UPDATE \`${table}\` SET ${setClause}${where}`;
        await query(sql, [...setValues, ...whereParams]);

        // Fetch updated rows to return
        const selectSql = `SELECT * FROM \`${table}\`${where}`;
        const updatedRows = await query(selectSql, whereParams);

        results.push({ data: updatedRows });
        continue;
      }

      // 4. DELETE action
      if (action === 'delete') {
        const { where, params: whereParams } = buildWhereClause(filters);

        // Fetch rows before deleting
        const selectSql = `SELECT * FROM \`${table}\`${where}`;
        const deletedRows = await query(selectSql, whereParams);

        const sql = `DELETE FROM \`${table}\`${where}`;
        await query(sql, whereParams);

        results.push({ data: deletedRows });
        continue;
      }

      results.push({ error: `Unsupported action: ${action}` });
    }

    return NextResponse.json(isBatch ? results : results[0]);
  } catch (e: any) {
    console.error('Database API route error:', e);
    return NextResponse.json({ error: e.message || 'Internal database error' }, { status: 500 });
  }
}
