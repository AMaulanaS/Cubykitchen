# Cuby Kitchen — Toko Sembako & Kelontong

## Komponen utama
- `index.html`: katalog dan checkout.
- `css/`: styling storefront dan panel admin.
- `js/app.js`: katalog, keranjang, checkout ambil/antar lokal, tunai/transfer.
- `js/config.js`: URL Apps Script, identitas toko, tarif default zona lokal.
- `google-apps-script/Code.gs`: backend Sheets dengan validasi harga/stok di server.
- `admin.html`, `admin-produk.html`, `admin-pengaturan.html`: panel operasional.
- `PANDUAN-PEROMBAKAN-SEMBOLAK.md`: panduan deploy, keamanan, sheet, dan tes.

## Penting sebelum live
ZIP sumber yang diterima berisi katalog sembako contoh. Katalog dan data lama sengaja tidak dihapus otomatis untuk menghindari kehilangan data. Ganti produk lama di Google Sheets `PRODUK` dan fallback `js/products.js` dengan produk sembako yang benar sebelum dipublikasikan. File `PRODUK-SEMBOLAK-TEMPLATE.csv` adalah contoh kolom, bukan daftar produk atau harga final.

## Jalankan lokal
Buka folder dengan VS Code dan gunakan Live Server. Untuk checkout online, URL `/exec` di `js/config.js` harus menunjuk ke deployment Apps Script terbaru.

## Keamanan
Jangan memasukkan PIN admin atau token Fonnte ke file frontend/kode. Gunakan Apps Script > Project Settings > Script Properties: `ADMIN_PIN` dan, bila digunakan, `FONNTE_TOKEN`. Rotasi token yang pernah terpapar.

## Status pengujian
Pemeriksaan sintaks JavaScript lokal dilakukan. Integrasi Google Sheets, deploy Apps Script, notifikasi WhatsApp, dan checkout live belum diuji dalam akun/lingkungan pemilik. Ikuti checklist di `PANDUAN-PEROMBAKAN-SEMBOLAK.md`.
