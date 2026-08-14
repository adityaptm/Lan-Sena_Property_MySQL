import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
});

export async function query<T = any>(
  sql: string,
  params?: any[],
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export default pool;
