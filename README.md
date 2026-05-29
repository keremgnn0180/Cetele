# Çetele

Çetele, tarım işletmeleri için offline-first çalışan Windows masaüstü kayıt ve mali takip uygulamasıdır. Tarla, ürün, ekim, masraf, hasat, yedekleme ve raporlama süreçlerini tek ekranda yönetmeyi hedefler.

## Neden Var?

Küçük ve orta ölçekli tarım işletmelerinde masraf, ekim ve hasat kayıtları çoğu zaman defter, Excel veya dağınık notlarda tutulur. Çetele bu kayıtları yerel SQLite veritabanında saklar, hızlı raporlama sağlar ve internet bağlantısı olmadan çalışır.

## Özellikler

- Tarla, ürün, ekim, masraf ve hasat kayıtları
- Dashboard özetleri ve son işlemler
- Masraf düzenleme, silme ve arama
- Tarihe göre işlem arama
- Yerel SQLite veri saklama
- Manuel ve otomatik yedekleme
- Recovery Mode ve başlangıç sağlık kontrolü
- GitHub Releases üzerinden auto-update altyapısı
- Windows NSIS installer

## Teknoloji

- Electron
- React + Vite
- SQLite (`better-sqlite3`, fallback: `sql.js`)
- Zod schema validation
- Zustand + TanStack Query altyapısı
- Vitest + React Testing Library + Playwright hazırlığı

## Geliştirme

```bash
npm install
npm run dev
```

## Doğrulama

```bash
npm run typecheck
npm test
npm run build
```

## Üretim Build

```bash
npm run build
```

Build çıktıları `dist/` ve `release/` altında oluşur.

## Mimari ve Güvenlik

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SECURITY.md](./SECURITY.md)
- [RELEASE.md](./RELEASE.md)
- [CHANGELOG.md](./CHANGELOG.md)

## Lisans

ISC. Ticari dağıtım öncesi lisans modeli, code signing ve aktivasyon sistemi netleştirilmelidir.
