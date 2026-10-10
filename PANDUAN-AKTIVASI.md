# Panduan Aktivasi — Toko Sembako

Ikuti `PANDUAN-PEROMBAKAN-SEMBOLAK.md` sebagai panduan utama untuk deployment versi ini. Instruksi lama di file sumber sudah tidak berlaku karena PIN/token tidak lagi ditanam di kode.

## Ringkasnya
1. Backup spreadsheet (File > Make a copy) dan simpan ZIP asli.
2. Tempel `google-apps-script/Code.gs` ke Apps Script yang terhubung ke spreadsheet yang benar.
3. Di Project Settings > Script Properties, tambahkan `ADMIN_PIN` dengan PIN baru yang kuat. Tambahkan `FONNTE_TOKEN` hanya jika memakai Fonnte. Untuk tes WA, tambahkan `STORE_WA_TEST` secara eksplisit.
4. Jalankan `setup()` satu kali dan izinkan akses. Sheet/kolom tambahan dibuat tanpa menghapus baris lama.
5. Deploy sebagai Web app (Execute as: Me). Salin URL `/exec` ke `js/config.js`, lalu deploy ulang frontend.
6. Atur lokasi toko dan tarif zona di `admin-pengaturan.html`. Isi produk sembako yang sebenarnya di sheet `PRODUK`.
7. Uji checkout, validasi stok, status agen, dan pembayaran sebelum dipakai pelanggan.

Jangan memakai URL tes dengan PIN contoh. Jangan menaruh PIN admin atau token WhatsApp di frontend atau repository publik.
