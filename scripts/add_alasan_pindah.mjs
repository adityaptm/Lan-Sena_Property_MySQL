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
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "lansena_property",
  port: Number(process.env.DB_PORT || 3306),
};

async function run() {
  console.log(`Menghubungkan ke database "${config.database}" di ${config.host}:${config.port}...`);
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log("Koneksi berhasil!");

    // Cek apakah kolom alasan_pindah sudah ada di tabel sales
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'alasan_pindah'`,
      [config.database]
    );

    if (columns.length === 0) {
      console.log("Kolom 'alasan_pindah' belum ada di tabel 'sales'. Menambahkan kolom...");
      await connection.query("ALTER TABLE `sales` ADD COLUMN `alasan_pindah` TEXT NULL AFTER `status`");
      console.log("Kolom 'alasan_pindah' berhasil ditambahkan ke tabel 'sales'!");
    } else {
      console.log("Kolom 'alasan_pindah' sudah ada di tabel 'sales'.");
    }

    await connection.end();
  } catch (err) {
    console.error("Gagal menjalankan migrasi:", err.message);
    if (connection) await connection.end();
  }
}

run();
