/**
 * Buat tabel yang sering belum ada di MySQL lokal (sale_discounts, trash).
 *
 * Jalankan:
 *   npm run db:ensure
 *
 * Membaca MYSQL_* dari .env.local / .env
 */
import mysql from "mysql2/promise";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    const filePath = resolve(process.cwd(), file);
    if (!existsSync(filePath)) continue;

    for (const line of readFileSync(filePath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvFile();

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
};

const statements = [
  `
  CREATE TABLE IF NOT EXISTS sale_discounts (
    id VARCHAR(36) NOT NULL,
    sale_id VARCHAR(36) NOT NULL,
    tanggal DATE NOT NULL,
    nominal DECIMAL(18,2) NOT NULL DEFAULT 0,
    keterangan TEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_sale_discounts_sale_id (sale_id),
    CONSTRAINT fk_sale_discounts_sale
      FOREIGN KEY (sale_id) REFERENCES sales(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS trash (
    id VARCHAR(36) NOT NULL,
    source_table VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    record_label VARCHAR(255) NULL,
    record_data LONGTEXT NOT NULL,
    deleted_by VARCHAR(36) NULL,
    deleted_by_nama VARCHAR(255) NULL,
    deleted_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_trash_source_table (source_table),
    KEY idx_trash_deleted_at (deleted_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    user_nama VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NULL,
    action VARCHAR(20) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(36) NULL,
    record_label VARCHAR(255) NULL,
    detail TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_activity_logs_user_id (user_id),
    KEY idx_activity_logs_action (action),
    KEY idx_activity_logs_table_name (table_name),
    KEY idx_activity_logs_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
  `
  CREATE TABLE IF NOT EXISTS login_logs (
    id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Success',
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_login_logs_user_id (user_id),
    KEY idx_login_logs_email (email),
    KEY idx_login_logs_status (status),
    KEY idx_login_logs_created_at (created_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
];

async function tableExists(conn, tableName) {
  const [rows] = await conn.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [config.database, tableName],
  );
  return rows.length > 0;
}

async function tableUsable(conn, tableName) {
  try {
    await conn.query(`SELECT 1 FROM \`${tableName}\` LIMIT 1`);
    return true;
  } catch (err) {
    return err?.code === "ER_NO_SUCH_TABLE" ? false : Promise.reject(err);
  }
}

async function main() {
  console.log(`Connecting to MySQL database "${config.database}"...`);
  const conn = await mysql.createConnection(config);

  try {
    for (const table of ["sale_discounts", "trash", "activity_logs", "login_logs"]) {
      const exists = await tableExists(conn, table);
      const usable = exists ? await tableUsable(conn, table) : false;

      if (exists && !usable) {
        console.warn(
          `[WARN] Tabel "${table}" rusak ("doesn't exist in engine"). Drop & recreate...`,
        );
        await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
      }
    }

    for (const sql of statements) {
      await conn.query(sql);
    }

    console.log("OK: sale_discounts, trash, activity_logs & login_logs siap dipakai.");
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error("Migration gagal:", err.message);
  process.exit(1);
});
