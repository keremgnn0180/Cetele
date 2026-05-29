const fs = require('fs');
const path = require('path');

let db = null;
let isWasm = false;
let dbFilePath = '';
let backupsDirPath = '';
let saveWasmDatabase = () => {};

// 1. VeritabanÄ±nÄ± BaÅŸlat (better-sqlite3 -> fallback: sql.js)
async function initDatabase(appDataPath) {
  dbFilePath = path.join(appDataPath, 'cetele.db');
  backupsDirPath = path.join(appDataPath, 'backups');

  if (!fs.existsSync(backupsDirPath)) {
    fs.mkdirSync(backupsDirPath, { recursive: true });
  }

  runAutoDailyBackup();

  try {
    console.log("better-sqlite3 motoru yÃ¼klenmeye Ã§alÄ±ÅŸÄ±lÄ±yor...");
    const Database = require('better-sqlite3');
    isWasm = false;
    db = new Database(dbFilePath);
    applyPragmas();
    console.log("BAÅARILI: better-sqlite3 motoru aktif.");
    createTables();
    migrateTables();
  } catch (err) {
    console.warn("better-sqlite3 yÃ¼klenemedi. sql.js WASM motoruna geÃ§iÅŸ yapÄ±lÄ±yor...", err.message);
    
    try {
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();
      
      let dbData = null;
      if (fs.existsSync(dbFilePath)) {
        dbData = fs.readFileSync(dbFilePath);
        db = new SQL.Database(dbData);
      } else {
        db = new SQL.Database();
      }
      
      isWasm = true;

      saveWasmDatabase = () => {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbFilePath, buffer);
      };

      console.log('Database engine:', isWasm ? 'sql.js fallback' : 'better-sqlite3');
      applyPragmas();
      createTables();
      migrateTables();
      saveWasmDatabase(); 
    } catch (wasmErr) {
      console.error("KRÄ°TÄ°K HATA: HiÃ§bir veritabanÄ± motoru baÅŸlatÄ±lamadÄ±!", wasmErr.message);
      throw wasmErr;
    }
  }

  return { dbFilePath, isWasm };
}

function applyPragmas() {
  const pragmas = [
    'foreign_keys = ON',
    'busy_timeout = 5000',
    'journal_mode = WAL'
  ];

  pragmas.forEach((pragma) => {
    try {
      if (isWasm) db.run(`PRAGMA ${pragma};`);
      else db.pragma(pragma);
    } catch (err) {
      console.warn(`SQLite pragma skipped [${pragma}]:`, err.message);
    }
  });
}

function createTables() {
  const tableQueries = [
    `CREATE TABLE IF NOT EXISTS tarlalar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isim TEXT NOT NULL UNIQUE,
      donum REAL NOT NULL,
      konum TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS urunler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isim TEXT NOT NULL UNIQUE,
      kategori TEXT,
      tohum_markasi TEXT,
      tohum_marka TEXT,
      tohum_cesidi TEXT,
      tohum_cesit TEXT,
      tohum_notu TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS ekimler (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarla_id INTEGER NOT NULL,
      urun_id INTEGER NOT NULL,
      miktar REAL NOT NULL,
      birim TEXT NOT NULL,
      tarih TEXT NOT NULL,
      aciklama TEXT,
      FOREIGN KEY (tarla_id) REFERENCES tarlalar(id) ON DELETE CASCADE,
      FOREIGN KEY (urun_id) REFERENCES urunler(id) ON DELETE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS masraflar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarla_id INTEGER,
      kategori TEXT NOT NULL,
      urun_adi TEXT,
      gubre_marka TEXT,
      gubre_turu TEXT,
      gubre_cesit TEXT,
      miktar REAL NOT NULL,
      birim TEXT NOT NULL,
      birim_fiyat REAL NOT NULL,
      tutar REAL NOT NULL,
      tarih TEXT NOT NULL,
      aciklama TEXT,
      FOREIGN KEY (tarla_id) REFERENCES tarlalar(id) ON DELETE SET NULL
    );`,
    `CREATE TABLE IF NOT EXISTS hasatlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tarla_id INTEGER NOT NULL,
      urun_id INTEGER NOT NULL,
      miktar REAL NOT NULL,
      birim TEXT NOT NULL,
      birim_satis_fiyati REAL NOT NULL,
      gelir REAL NOT NULL,
      tarih TEXT NOT NULL,
      aciklama TEXT,
      FOREIGN KEY (tarla_id) REFERENCES tarlalar(id) ON DELETE CASCADE,
      FOREIGN KEY (urun_id) REFERENCES urunler(id) ON DELETE CASCADE
    );`
  ];

  if (isWasm) {
    tableQueries.forEach(q => db.run(q));
  } else {
    tableQueries.forEach(q => db.exec(q));
  }
  createIndexes();
  ensureMigrationTable();
  console.log("SQLite tablolarÄ± hazÄ±r.");
}

function createIndexes() {
  const indexQueries = [
    'CREATE INDEX IF NOT EXISTS idx_ekimler_tarih ON ekimler(tarih);',
    'CREATE INDEX IF NOT EXISTS idx_masraflar_tarih ON masraflar(tarih);',
    'CREATE INDEX IF NOT EXISTS idx_hasatlar_tarih ON hasatlar(tarih);',
    'CREATE INDEX IF NOT EXISTS idx_ekimler_tarla ON ekimler(tarla_id);',
    'CREATE INDEX IF NOT EXISTS idx_masraflar_tarla ON masraflar(tarla_id);',
    'CREATE INDEX IF NOT EXISTS idx_hasatlar_tarla ON hasatlar(tarla_id);'
  ];

  indexQueries.forEach((sql) => {
    if (isWasm) db.run(sql);
    else db.exec(sql);
  });
}

function ensureMigrationTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `;
  if (isWasm) db.run(sql);
  else db.exec(sql);
}

function migrateTables() {
  try {
    const checkCols = query("PRAGMA table_info(urunler);");
    const colNames = checkCols.map(c => c.name);
    if (!colNames.includes('tohum_markasi')) {
      run("ALTER TABLE urunler ADD COLUMN tohum_markasi TEXT;");
      run("ALTER TABLE urunler ADD COLUMN tohum_cesidi TEXT;");
      run("ALTER TABLE urunler ADD COLUMN tohum_notu TEXT;");
      console.log("urunler tablosuna tohum kolonlarÄ± eklendi.");
    }
    if (!colNames.includes('tohum_marka')) {
      run("ALTER TABLE urunler ADD COLUMN tohum_marka TEXT;");
    }
    if (!colNames.includes('tohum_cesit')) {
      run("ALTER TABLE urunler ADD COLUMN tohum_cesit TEXT;");
    }
  } catch (e) {
    console.log("Migration hatasÄ± (gÃ¶z ardÄ± edilebilir):", e.message);
  }

  try {
    const expenseCols = query("PRAGMA table_info(masraflar);").map(c => c.name);
    if (!expenseCols.includes('gubre_marka')) {
      run("ALTER TABLE masraflar ADD COLUMN gubre_marka TEXT;");
    }
    if (!expenseCols.includes('gubre_turu')) {
      run("ALTER TABLE masraflar ADD COLUMN gubre_turu TEXT;");
    }
    if (!expenseCols.includes('gubre_cesit')) {
      run("ALTER TABLE masraflar ADD COLUMN gubre_cesit TEXT;");
    }
    if (!expenseCols.includes('birim')) {
      run("ALTER TABLE masraflar ADD COLUMN birim TEXT;");
    }
  } catch (e) {
    console.log("Masraflar migration hatasÄ± (gÃ¶z ardÄ± edilebilir):", e.message);
  }
}

function query(sql, params = []) {
  try {
    if (isWasm) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      return rows;
    } else {
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    }
  } catch (err) {
    console.error(`Sorgu hatasÄ± [${sql}]:`, err.message);
    throw err;
  }
}

function run(sql, params = []) {
  try {
    if (isWasm) {
      db.run(sql, params);
      saveWasmDatabase();

      const rowidRes = db.exec("SELECT last_insert_rowid() AS id");
      const lastInsertRowid = rowidRes[0]?.values[0][0] || null;
      const changesRes = db.exec("SELECT changes() AS count");
      const changes = changesRes[0]?.values[0][0] || 0;

      return { lastInsertRowid, changes };
    } else {
      const stmt = db.prepare(sql);
      const result = stmt.run(...params);
      return {
        lastInsertRowid: result.lastInsertRowid,
        changes: result.changes
      };
    }
  } catch (err) {
    console.error(`Yazma hatasÄ± [${sql}]:`, err.message);
    throw err;
  }
}

function runAutoDailyBackup() {
  if (!fs.existsSync(dbFilePath)) return;

  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const files = fs.readdirSync(backupsDirPath);
    
    const alreadyBackedUpToday = files.some(file => file.startsWith(`cetele-${todayStr}`));

    if (!alreadyBackedUpToday) {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const timeStr = `${todayStr}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
      
      const backupPath = path.join(backupsDirPath, `cetele-${timeStr}.db`);
      fs.copyFileSync(dbFilePath, backupPath);
      console.log('GÃ¼nlÃ¼k otomatik yedek baÅŸarÄ±yla oluÅŸturuldu:', backupPath);

      cleanOlderBackups();
    } else {
      console.log('BugÃ¼n iÃ§in otomatik yedek zaten mevcut, yeni yedek alÄ±nmadÄ±.');
    }
  } catch (err) {
    console.error('Otomatik gÃ¼nlÃ¼k yedekleme hatasÄ±:', err.message);
  }
}

function cleanOlderBackups() {
  try {
    const files = fs.readdirSync(backupsDirPath)
      .filter(file => file.startsWith('cetele-') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupsDirPath, file),
        time: fs.statSync(path.join(backupsDirPath, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); 

    if (files.length > 10) {
      const toDelete = files.slice(10);
      toDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log('Eski yedek silindi:', file.name);
      });
    }
  } catch (err) {
    console.error('Eski yedekleri temizleme hatasÄ±:', err.message);
  }
}

function exportBackup(destPath) {
  try {
    if (isWasm) {
      saveWasmDatabase();
    }
    fs.copyFileSync(dbFilePath, destPath);
    return { success: true };
  } catch (err) {
    console.error('Yedek dÄ±ÅŸa aktarma hatasÄ±:', err.message);
    throw err;
  }
}

async function importBackup(srcPath) {
  try {
    const tempPath = `${dbFilePath}.restore-tmp`;
    if (isWasm) {
      if (db) {
        db.close();
      }
      fs.copyFileSync(srcPath, tempPath);
      fs.copyFileSync(tempPath, dbFilePath);
      fs.rmSync(tempPath, { force: true });
      
      const initSqlJs = require('sql.js');
      const SQL = await initSqlJs();
      const dbData = fs.readFileSync(dbFilePath);
      db = new SQL.Database(dbData);
      db.run('PRAGMA foreign_keys = ON;');
      
      saveWasmDatabase = () => {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbFilePath, buffer);
      };
    } else {
      if (db) {
        db.close();
      }
      fs.copyFileSync(srcPath, tempPath);
      fs.copyFileSync(tempPath, dbFilePath);
      fs.rmSync(tempPath, { force: true });
      
      const Database = require('better-sqlite3');
      db = new Database(dbFilePath);
      applyPragmas();
    }
    console.log("Yedek baÅŸarÄ±yla iÃ§e aktarÄ±ldÄ± ve veritabanÄ± yeniden baÄŸlandÄ±.");
    return { success: true };
  } catch (err) {
    console.error('Yedek iÃ§e aktarma hatasÄ±:', err.message);
    throw err;
  }
}

function getBackupsList() {
  try {
    if (!fs.existsSync(backupsDirPath)) return [];
    return fs.readdirSync(backupsDirPath)
      .filter(file => file.startsWith('cetele-') && file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupsDirPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          mtime: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime))
      .slice(0, 10);
  } catch (err) {
    console.error('Yedek listeleme hatasÄ±:', err.message);
    return [];
  }
}

function createManualBackup() {
  try {
    if (isWasm) saveWasmDatabase();
    const pad = (n) => String(n).padStart(2, '0');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${dateStr}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const destPath = path.join(backupsDirPath, `cetele-${timeStr}.db`);
    fs.copyFileSync(dbFilePath, destPath);
    cleanOlderBackups(); 
    return { success: true, fileName: `cetele-${timeStr}.db` };
  } catch (err) {
    console.error('Manuel yedekleme hatasÄ±:', err.message);
    throw err;
  }
}

function healthCheck() {
  const rows = query('SELECT name FROM sqlite_master WHERE type = ? LIMIT 1', ['table']);
  return {
    ok: true,
    message: rows.length >= 0 ? 'Database erişilebilir' : 'Database boş',
    dbFilePath,
    engine: isWasm ? 'sql.js' : 'better-sqlite3'
  };
}

function migrationHealthCheck() {
  const rows = query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'");
  if (!rows.length) throw new Error('schema_migrations tablosu yok');
  return { ok: true, message: 'Migration tablosu hazır' };
}

function backupHealthCheck() {
  if (!backupsDirPath || !fs.existsSync(backupsDirPath)) {
    throw new Error('Backup klasörü bulunamadı');
  }
  fs.accessSync(backupsDirPath, fs.constants.R_OK | fs.constants.W_OK);
  return { ok: true, message: 'Backup klasörü yazılabilir' };
}

function integrityCheck() {
  const result = query('PRAGMA integrity_check;');
  const value = Object.values(result[0] || {})[0];
  if (value !== 'ok') throw new Error(`SQLite integrity_check failed: ${value}`);
  return { ok: true };
}

function closeDatabase() {
  try {
    if (db) {
      if (isWasm) {
        saveWasmDatabase();
      } else {
        db.close();
      }
      console.log('Database connection closed.');
    }
  } catch (err) {
    console.error('Error closing database:', err.message);
  }
}

module.exports = {
  initDatabase,
  query,
  run,
  exportBackup,
  importBackup,
  getBackupsList,
  createManualBackup,
  healthCheck,
  migrationHealthCheck,
  backupHealthCheck,
  integrityCheck,
  closeDatabase
};

