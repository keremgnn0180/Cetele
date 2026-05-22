# Çetele

Çetele, tarım işletmeleri için geliştirilmiş modern bir masaüstü takip uygulamasıdır.
Tarla, ürün, ekim, masraf ve hasat/satış kayıtlarını tek yerden yönetmeyi sağlar.

## Özellikler

- Tarla, ürün, ekim, masraf ve hasat kayıt yönetimi
- Dashboard üzerinde özet göstergeler ve son kayıtlar
- Gelişmiş filtreleme ve arama
- Masraf kayıtlarında ekleme, silme ve düzenleme
- SQLite tabanlı yerel veri saklama
- Yedek alma / geri yükleme
- Electron tabanlı Windows masaüstü uygulaması
- NSIS installer (kurulum sihirbazı) üretimi

## Teknoloji Yığını

- Electron
- React + Vite
- SQLite (`better-sqlite3`, fallback: `sql.js`)
- Electron Builder

## Proje Yapısı

```text
src/                 React arayüzü
src/components/      Sayfa ve bileşenler
main.js              Electron ana süreç + IPC
preload.js           Güvenli API köprüsü
database.js          SQLite işlemleri
assets/              Uygulama ikonları ve görseller
```

## Kurulum (Geliştirme)

```bash
npm install
npm run dev
```

Bu komut Vite ve Electron'u birlikte başlatır.

## Üretim Build

```bash
npm run build
```

Build çıktıları:

- `dist/` -> frontend bundle
- `release/` -> Windows paketleri ve setup

## Installer Üretimi

Windows kurulum dosyası üretmek için:

```bash
npm run installer
```

Portable exe üretmek için:

```bash
npm run installer:portable
```

Detaylı dağıtım notları için:

- [INSTALLER.md](./INSTALLER.md)

## Uygulama Nasıl Çalışır?

1. Electron, `main.js` ile uygulama penceresini açar.
2. React arayüzü `src/` içinden yüklenir.
3. Arayüz, `preload.js` üzerinden güvenli IPC çağrıları yapar.
4. Veri işlemleri `database.js` ile SQLite üzerinde gerçekleşir.
5. Tüm veriler yerelde tutulur.

## Veri Güvenliği

- Veriler varsayılan olarak cihazda yerel SQLite dosyasında tutulur.
- Yedekleme araçları ile manuel dışa aktarma/içe aktarma yapılabilir.

## Sürümleme ve Yayın

`package.json` içindeki `build.publish` alanı GitHub release altyapısına göre ayarlanmıştır.
Yayın sürecinde repo sahipliği ve kimlik doğrulama ayarlarının doğrulanması gerekir.

## Lisans

ISC
