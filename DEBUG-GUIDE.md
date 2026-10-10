# Panduan Debug — Cuby Kitchen

## Konfigurasi yang sudah diganti di ZIP ini
- Google Sheet baru → `SPREADSHEET_ID` di `google-apps-script/Code.gs`
- URL Apps Script baru → `apiUrl` di `js/config.js`
- Token Fonnte → TIDAK ada di kode. Isi lewat Script Properties (langkah 2).

## Langkah wajib (urut)
1. Buka Apps Script **dari project yang menjadi pemilik URL /exec**. Tempel seluruh isi `google-apps-script/Code.gs`, Save.
2. Project Settings > Script Properties, tambah:
   - `ADMIN_PIN` = PIN admin baru
   - `FONNTE_TOKEN` = token device Fonnte (rotasi token lama bila sudah pernah dibagikan)
   - `SITE_URL` = alamat website (opsional, untuk link lacak di WA)
3. Jalankan fungsi `setup()` sekali, izinkan akses (akun harus Editor di Sheet baru).
4. Deploy > Manage deployments > Edit (ikon pensil) > Version: **New version** > Deploy. Execute as: Me, Access: Anyone. Memakai "New deployment" akan membuat URL baru.
5. Upload ulang file website, lalu buka `debug.html`.

## Cara debug
- `debug.html` → cek 1 (publik): config, koneksi API, akses Sheet, produk, pengaturan.
- `debug.html` → cek 2 (PIN): status Script Properties, sheet, jumlah data, log WA terakhir.
- `debug.html` → cek 3: kirim WA tes dan lihat jawaban mentah Fonnte.
- Tambah `?debug=1` di URL toko untuk panel log request di pojok layar (`?debug=0` untuk mematikan).
- Sheet `LOG_WA` mencatat setiap pengiriman WA (TERKIRIM/GAGAL + alasan). Sheet `LOG_AKTIVITAS` mencatat order & perubahan status.
