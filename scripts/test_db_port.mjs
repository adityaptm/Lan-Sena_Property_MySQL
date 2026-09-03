import mysql from "mysql2/promise";

async function testPort(port) {
  try {
    const conn = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "lansena_property",
      port: port,
      connectTimeout: 2000,
    });
    console.log(`Port ${port} BERHASIL terhubung!`);
    
    // Cek kolom alasan_pindah
    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = 'lansena_property' AND TABLE_NAME = 'sales' AND COLUMN_NAME = 'alasan_pindah'`
    );
    if (cols.length === 0) {
      console.log("Menambahkan kolom alasan_pindah ke tabel sales...");
      await conn.query("ALTER TABLE `sales` ADD COLUMN `alasan_pindah` TEXT NULL AFTER `status`");
      console.log("SUKSES: Kolom alasan_pindah berhasil ditambahkan!");
    } else {
      console.log("Kolom alasan_pindah sudah ada di tabel sales.");
    }
    await conn.end();
    return true;
  } catch (e) {
    console.log(`Port ${port} gagal: ${e.message}`);
    return false;
  }
}

async function main() {
  for (const p of [3306, 3307, 8111]) {
    const ok = await testPort(p);
    if (ok) break;
  }
}

main();
