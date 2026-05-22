const path = require('path');
const database = require('./database.js');
const fs = require('fs');

async function main() {
  const appDataPath = __dirname; // use project root
  console.log('Initializing database...');
  const { dbFilePath, isWasm } = await database.initDatabase(appDataPath);
  console.log('Database initialized. Engine:', isWasm ? 'sql.js (WASM fallback)' : 'better-sqlite3');
  // Verify db file exists
  const dbExists = fs.existsSync(dbFilePath);
  console.log('DB file exists:', dbExists);
  // Insert sample records
  console.log('Inserting sample records...');
  const uniqueTarlaName = `Deneme Tarla ${Date.now()}`;
  database.run(`INSERT INTO tarlalar (isim, donum, konum) VALUES (?, ?, ?)`, [uniqueTarlaName, 20, 'Adana/Seyhan']);
  const tarlaRow = database.query('SELECT id FROM tarlalar WHERE isim = ?', [uniqueTarlaName]);
  const tarlaId = tarlaRow[0].id;
  const uniqueUrunName = `Mısır ${Date.now()}`;
  database.run(`INSERT INTO urunler (isim, kategori) VALUES (?, ?)`, [uniqueUrunName, 'Tahıl']);
  const urunRow = database.query('SELECT id FROM urunler WHERE isim = ?', [uniqueUrunName]);
  const urunId = urunRow[0].id;
  // Masraf (Gübre)
  database.run(`INSERT INTO masraflar (tarla_id, kategori, urun_adi, miktar, birim, birim_fiyat, tutar, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [tarlaId, 'Gübre', '', 200, 'kilogram', 18, 200*18, new Date().toISOString(), '']);
  // Hasat
  database.run(`INSERT INTO hasatlar (tarla_id, urun_id, miktar, birim, birim_satis_fiyati, gelir, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [tarlaId, urunId, 8, 'ton', 9500, 8*9500, new Date().toISOString(), '']);
  // Verify inserts via queries
  const tarlalar = database.query('SELECT * FROM tarlalar WHERE id = ?', [tarlaId]);
  const urunler = database.query('SELECT * FROM urunler WHERE id = ?', [urunId]);
  const masraflar = database.query('SELECT * FROM masraflar WHERE tarla_id = ?', [tarlaId]);
  const hasatlar = database.query('SELECT * FROM hasatlar WHERE tarla_id = ?', [tarlaId]);
  console.log('Records retrieved:');
  console.log({ tarlalar, urunler, masraflar, hasatlar });
  // Compute expected aggregates
  const expense = 200 * 18;
  const revenue = 8 * 9500;
  const netProfit = revenue - expense;
  console.log('Expected expense', expense, 'revenue', revenue, 'net', netProfit);
  // Clean up: delete inserted rows
  // Clean up: delete inserted rows
  database.run('DELETE FROM hasatlar WHERE tarla_id = ?', [tarlaId]);
  database.run('DELETE FROM masraflar WHERE tarla_id = ?', [tarlaId]);
  database.run('DELETE FROM urunler WHERE id = ?', [urunId]);
  database.run('DELETE FROM tarlalar WHERE id = ?', [tarlaId]);
  // Close database connection
  if (typeof database.closeDatabase === 'function') {
    database.closeDatabase();
  }
  console.log('Cleanup done.');
  // Verify tables exist via sqlite_master query
  const tables = database.query(`SELECT name FROM sqlite_master WHERE type='table'`);
  console.log('Tables:', tables.map(t=>t.name));
}

main().catch(err => { console.error('ERROR:', err); process.exit(1); });
