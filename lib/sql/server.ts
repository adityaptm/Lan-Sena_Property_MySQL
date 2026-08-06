import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { decryptToken } from '@/lib/auth-token';
import crypto from 'crypto';

class ServerQueryBuilder {
  private tableName: string;
  private action: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private filters: any[] = [];
  private limitCount?: number;
  private singleResult: boolean = false;
  private selectColumns: string = '*';
  private payload: any = null;
  private orderField?: string;
  private orderAscending: boolean = true;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    this.action = 'select';
    this.selectColumns = columns;
    return this;
  }

  insert(data: any | any[]) {
    this.action = 'insert';
    this.payload = data;
    return this;
  }

  update(data: any) {
    this.action = 'update';
    this.payload = data;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  or(filterStr: string) {
    this.filters.push({ type: 'or', value: filterStr });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  order(column: string, { ascending = true }: { ascending?: boolean } = {}) {
    this.orderField = column;
    this.orderAscending = ascending;
    return this;
  }

  private buildWhereClause() {
    let where = '';
    const params: any[] = [];

    if (this.filters.length > 0) {
      const clauses: string[] = [];
      for (const f of this.filters) {
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
  }

  async then(onfulfilled?: (value: any) => any) {
    try {
      let dataVal: any = null;

      if (this.action === 'select') {
        const { where, params: whereParams } = this.buildWhereClause();
        
        let selectCols = '*';
        let isJoinUsers = false;

        if (this.selectColumns !== '*') {
          if (this.selectColumns.includes('users(') || this.selectColumns.includes('users(nama)')) {
            isJoinUsers = true;
            selectCols = `\`${this.tableName}\`.*, \`users\`.\`nama\` AS \`users_nama\``;
          } else {
            selectCols = this.selectColumns.split(',').map(c => `\`${c.trim()}\``).join(', ');
          }
        }

        let sql = '';
        if (isJoinUsers && this.tableName === 'sale_step_history') {
          sql = `SELECT ${selectCols} FROM \`${this.tableName}\` LEFT JOIN \`users\` ON \`${this.tableName}\`.\`changed_by\` = \`users\`.\`id\`${where}`;
        } else {
          sql = `SELECT ${selectCols} FROM \`${this.tableName}\`${where}`;
        }

        // Add ordering
        if (this.orderField) {
          sql += ` ORDER BY \`${this.orderField}\` ${this.orderAscending ? 'ASC' : 'DESC'}`;
        }

        if (this.limitCount) {
          sql += ` LIMIT ${Number(this.limitCount)}`;
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

        dataVal = this.singleResult ? (rows[0] || null) : rows;

      } else if (this.action === 'insert') {
        const records = Array.isArray(this.payload) ? this.payload : [this.payload];
        const insertedRecords: any[] = [];

        for (const rec of records) {
          if (!rec.id) {
            rec.id = crypto.randomUUID();
          }

          const cols = Object.keys(rec);
          const placeholders = cols.map(() => '?').join(', ');
          const values = Object.values(rec);

          const sql = `INSERT INTO \`${this.tableName}\` (${cols.map(c => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;
          await query(sql, values);
          insertedRecords.push(rec);
        }
        dataVal = !Array.isArray(this.payload) ? insertedRecords[0] : insertedRecords;

      } else if (this.action === 'update') {
        const { where, params: whereParams } = this.buildWhereClause();
        const cols = Object.keys(this.payload);
        const setClause = cols.map(c => `\`${c}\` = ?`).join(', ');
        const setValues = Object.values(this.payload);

        const sql = `UPDATE \`${this.tableName}\` SET ${setClause}${where}`;
        await query(sql, [...setValues, ...whereParams]);

        const selectSql = `SELECT * FROM \`${this.tableName}\`${where}`;
        const updatedRows = await query(selectSql, whereParams);
        dataVal = this.singleResult ? updatedRows[0] : updatedRows;

      } else if (this.action === 'delete') {
        const { where, params: whereParams } = this.buildWhereClause();

        const selectSql = `SELECT * FROM \`${this.tableName}\`${where}`;
        const deletedRows = await query(selectSql, whereParams);

        const sql = `DELETE FROM \`${this.tableName}\`${where}`;
        await query(sql, whereParams);
        dataVal = this.singleResult ? deletedRows[0] : deletedRows;
      }

      const val = { data: dataVal, error: null };
      return onfulfilled ? onfulfilled(val) : val;
    } catch (err: any) {
      const errorVal = { data: null, error: { message: err.message } };
      return onfulfilled ? onfulfilled(errorVal) : errorVal;
    }
  }
}

export async function createClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('lansena_session')?.value;

  const auth = {
    async getUser() {
      if (!token) return { data: { user: null }, error: null };
      const user = decryptToken(token);
      if (!user) return { data: { user: null }, error: null };
      return { data: { user }, error: null };
    },
  };

  return {
    from(tableName: string) {
      return new ServerQueryBuilder(tableName);
    },
    auth,
  };
}
