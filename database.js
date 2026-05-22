const fs = require('fs');
const path = require('path');

let db = null;
let isWasm = false;
let dbFilePath = '';
let backupsDirPath = '';
let saveWasmDatabase = () => {};

// 1. Veritabanını Başlat (better-sqlite3 -> fallback: sql.js)
async function initDatabase(appDataPath) {
  dbFilePath = path.join(appDataPath, 'cetele.db');
  backupsDirPath = path.join(appDataPath, 'backups');

  if (!fs.existsSync(backupsDirPath)) {
    fs.mkdirSync(backupsDirPath, { recursive: true });
  }

  runAutoDailyBackup();

  try {
    console.log("better-sqlite3 motoru yüklenmeye çalışılıyor...");
    const Database = require('better-sqlite3');
    db = new Database(dbFilePath);
    db.pragma('foreign_keys = ON');
    isWasm = false;
    console.log("BAŞARILI: better-sqlite3 motoru aktif.");
    createTables();
    migrateTables();
  } catch (err) {
    console.warn("better-sqlite3 yüklenemedi. sql.js WASM motoruna geçiş yapılıyor...", err.message);
    
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
      
      db.run('PRAGMA foreign_keys = ON;');
      isWasm = true;

      saveWasmDatabase = () => {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbFilePath, buffer);
      };

      console.log('Database engine:', isWasm ? 'sql.js fallback' : 'better-sqlite3');
      createTables();
      migrateTables();
      saveWasmDatabase(); 
    } catch (wasmErr) {
      console.error("KRİTİK HATA: Hiçbir veritabanı motoru başlatılamadı!", wasmErr.message);
      throw wasmErr;
    }
  }

  return { dbFilePath, isWasm };
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
  console.log("SQLite tabloları hazır.");
}

function migrateTables() {
  try {
    const checkCols = query("PRAGMA table_info(urunler);");
    const colNames = checkCols.map(c => c.name);
    if (!colNames.includes('tohum_markasi')) {
      run("ALTER TABLE urunler ADD COLUMN tohum_markasi TEXT;");
      run("ALTER TABLE urunler ADD COLUMN tohum_cesidi TEXT;");
      run("ALTER TABLE urunler ADD COLUMN tohum_notu TEXT;");
      console.log("urunler tablosuna tohum kolonları eklendi.");
    }
    if (!colNames.includes('tohum_marka')) {
      run("ALTER TABLE urunler ADD COLUMN tohum_marka TEXT;");
    }
    if (!colNames.includes('tohum_cesit')) {
      run("ALTER TABLE urunler ADD COLUMN tohum_cesit TEXT;");
    }
  } catch (e) {
    console.log("Migration hatası (göz ardı edilebilir):", e.message);
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
    console.log("Masraflar migration hatası (göz ardı edilebilir):", e.message);
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
    console.error(`Sorgu hatası [${sql}]:`, err.message);
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
    console.error(`Yazma hatası [${sql}]:`, err.message);
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
      console.log('Günlük otomatik yedek başarıyla oluşturuldu:', backupPath);

      cleanOlderBackups();
    } else {
      console.log('Bugün için otomatik yedek zaten mevcut, yeni yedek alınmadı.');
    }
  } catch (err) {
    console.error('Otomatik günlük yedekleme hatası:', err.message);
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
    console.error('Eski yedekleri temizleme hatası:', err.message);
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
    console.error('Yedek dışa aktarma hatası:', err.message);
    throw err;
  }
}

async function importBackup(srcPath) {
  try {
    if (isWasm) {
      if (db) {
        db.close();
      }
      fs.copyFileSync(srcPath, dbFilePath);
      
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
      fs.copyFileSync(srcPath, dbFilePath);
      
      const Database = require('better-sqlite3');
      db = new Database(dbFilePath);
      db.pragma('foreign_keys = ON');
    }
    console.log("Yedek başarıyla içe aktarıldı ve veritabanı yeniden bağlandı.");
    return { success: true };
  } catch (err) {
    console.error('Yedek içe aktarma hatası:', err.message);
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
    console.error('Yedek listeleme hatası:', err.message);
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
    console.error('Manuel yedekleme hatası:', err.message);
    throw err;
  }
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
  closeDatabase
};
