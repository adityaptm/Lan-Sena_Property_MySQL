import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'lansena_property',
    port: Number(process.env.MYSQL_PORT) || 8111,
  });

  console.log('Connected to MySQL database.');

  // 1. Create table kpr_steps
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS kpr_steps (
      id VARCHAR(36) PRIMARY KEY,
      nama_step VARCHAR(255) NOT NULL,
      urutan INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('Table kpr_steps created or already exists.');

  // 2. Check if kpr_steps has data
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM kpr_steps');
  if (rows[0].count === 0) {
    const defaultSteps = [
      'Berkas Lengkap',
      'Wawancara',
      'OTS',
      'SP3K',
      'Akad'
    ];
    for (let i = 0; i < defaultSteps.length; i++) {
      const id = crypto.randomUUID();
      await connection.execute(
        'INSERT INTO kpr_steps (id, nama_step, urutan) VALUES (?, ?, ?)',
        [id, defaultSteps[i], i + 1]
      );
    }
    console.log('Default KPR steps inserted.');
  }

  // 3. Find Sale for Catherina Vallencia / BLOK S25 No 20
  const [sales] = await connection.execute(`
    SELECT s.id as sale_id, c.nama as customer_nama, u.no_unit, b.nama_blok
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN units u ON s.unit_id = u.id
    LEFT JOIN blocks b ON u.block_id = b.id
    WHERE c.nama LIKE '%Catherina%' OR u.no_unit LIKE '%20%' OR c.no_hp LIKE '%081391664927%'
  `);

  console.log('Found sales:', sales);

  if (sales.length > 0) {
    const saleId = sales[0].sale_id;

    // Check existing kpr_berkas history
    const [existingHistory] = await connection.execute(
      `SELECT * FROM sale_step_history WHERE sale_id = ? AND jenis_step = 'kpr_berkas'`,
      [saleId]
    );

    if (existingHistory.length === 0) {
      // Insert BRI Rijek
      await connection.execute(`
        INSERT INTO sale_step_history (id, sale_id, jenis_step, status, keterangan, created_at)
        VALUES (?, ?, 'kpr_berkas', 'DIPERIKSA BANK BRI', 'RIJEK, DATA KERJA DIRAGUKAN', '2026-06-01 10:00:00')
      `, [crypto.randomUUID(), saleId]);

      // Insert BTN Purwakarta
      await connection.execute(`
        INSERT INTO sale_step_history (id, sale_id, jenis_step, status, keterangan, created_at)
        VALUES (?, ?, 'kpr_berkas', 'DIPERIKSA BANK BTN Purwakarta', 'MASUK BTN PWK', '2026-06-12 09:00:00')
      `, [crypto.randomUUID(), saleId]);

      console.log('Added initial KPR step history for sale:', saleId);
    } else {
      console.log('KPR step history already exists for sale:', saleId);
    }
  } else {
    console.log('No sale found for Catherina Vallencia yet.');
  }

  await connection.end();
  console.log('Database setup complete.');
}

run().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
