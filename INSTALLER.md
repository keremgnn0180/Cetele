# Installer Rehberi (Windows)

Bu proje `electron-builder` ile NSIS tabanlı kurulum dosyası üretir.

## Ön Koşullar

- Node.js 18+
- npm
- Windows ortamı (NSIS çıktısı için önerilir)

## 1) Bağımlılıkları Kur

```bash
npm install
```

## 2) Setup (.exe) Üret

```bash
npm run installer
```

Bu komut:

1. Frontend’i production modda build eder
2. Electron uygulamasını paketler
3. NSIS installer üretir

## 3) Çıktı Dosyaları

Kurulum dosyaları `release/` klasörüne yazılır.

Beklenen örnek çıktı:

- `Çetele Setup 1.0.0.exe`
- `Çetele Setup 1.0.0.exe.blockmap`
- `latest.yml`

## Portable Sürüm

```bash
npm run installer:portable
```

## Sık Kullanılan Sorunlar

- `better-sqlite3` derleme sorunu:  
  Uygulama fallback olarak `sql.js` kullanır, yine de Node sürümünüzü güncellemeniz önerilir.

- SmartScreen "tanınmayan uygulama" uyarısı:  
  İmzalanmamış EXE dosyalarında beklenen davranıştır. Kurumsal dağıtımda EV/OV Code Signing sertifikası ile imzalama yapılmalıdır.

- Büyük chunk uyarısı:  
  Çalışmayı engellemez, optimizasyon amaçlıdır.

