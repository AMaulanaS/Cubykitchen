# Panduan Perombakan Checkout Toko Sembako

## Yang berubah
- Checkout dibagi menjadi pelanggan eceran atau pengajuan agen, pilihan ambil di toko atau antar lokal, dan pembayaran tunai atau transfer.
- Agen yang belum disetujui tetap dapat membuat pesanan dengan harga eceran. Harga agen hanya dipakai setelah `PELANGGAN.statusAgen` bernilai `DISETUJUI`.
- Ongkir lokal menggunakan tarif tetap pada `PENGATURAN` > `shipping.localZones`, misalnya Zona 1, Zona 2, Zona 3. Tarif ditentukan admin. Ambil di toko selalu Rp0.
- Backend menghitung ulang harga, subtotal, ongkir, dan total dari data Sheets; browser hanya mengirim ID produk dan jumlah.
- Stok yang berupa angka divalidasi dan dikurangi dalam lock; mutasi dicatat di `MUTASI_STOK`. Stok kosong dianggap tidak dilacak, sehingga isi stok untuk setiap produk sebelum toko online.
- Pesanan duplikat dicegah menggunakan `requestId`.
- Header baru ditambahkan tanpa menghapus baris lama. Tidak ada sheet lama yang dihapus oleh `setup()`.

## Wajib sebelum dipakai pelanggan
1. **Backup:** simpan ZIP asli dan buat salinan Google Spreadsheet (File > Make a copy).
2. Buka `js/config.js` dan pastikan `apiUrl` menunjuk ke URL `/exec` yang benar. Isi nama toko, lokasi, alamat, dan nomor WhatsApp yang valid.
3. Apps Script > Project Settings > Script Properties, buat properti `ADMIN_PIN` dengan PIN baru yang kuat. Jangan simpan PIN di kode.
4. Jika menggunakan WhatsApp Fonnte, tambahkan properti `FONNTE_TOKEN` di Script Properties. Token lama yang pernah dibagikan sebaiknya dicabut/dirotasi. Jika tidak menggunakan Fonnte, properti boleh tidak ada.
5. Tempel isi `google-apps-script/Code.gs` ke Apps Script yang terhubung ke spreadsheet yang benar. Jalankan `setup()` dan izinkan akses. Fungsi ini menambahkan sheet/kolom yang belum ada dan tidak menghapus data lama.
6. Deploy > Manage deployments > Edit > New version > Deploy. Gunakan Execute as: Me. Akses web app dapat tetap Anyone agar pelanggan bisa checkout; semua endpoint admin harus memakai PIN yang tersimpan di Script Properties.
7. Di `admin-pengaturan.html`, atur lokasi toko dan tarif Zona 1–3. Tarif contoh Rp5.000/Rp10.000/Rp15.000 hanya placeholder—ganti dengan ongkir usaha sebenarnya.
8. Di sheet `PRODUK`, periksa semua nama, kategori, harga, stok dan satuan. Tambahkan `hargaAgen` dan `minQtyAgen`. Harga agen hanya berlaku setelah admin menyetel `PELANGGAN.statusAgen` menjadi `DISETUJUI`.
9. ZIP asal berisi katalog elektronik. Data produk lama sengaja tidak dihapus atau diganti otomatis demi menjaga data lama. **Jangan publikasikan sebagai toko sembako sebelum produk elektronik lama diganti dengan katalog sembako yang benar.** `PRODUK-SEMBOLAK-TEMPLATE.csv` hanya contoh struktur dengan harga 0, bukan daftar harga siap jual.
10. Upload ulang file frontend ke hosting. Buka website dan lakukan semua tes pada daftar di bawah sebelum menerima pesanan sungguhan.

## Struktur sheet tambahan
- `PELANGGAN`: pelanggan dan status persetujuan agen.
- `MUTASI_STOK`: jejak stok masuk/keluar per transaksi.
- `LOG_AKTIVITAS`: catatan tindakan checkout.
- `PESANAN`: kolom baru untuk tipe pelanggan, metode terima, zona, status bayar, request ID, dan status agen.
- `DETAIL_PESANAN`: menyimpan harga yang dipakai saat transaksi sehingga perubahan harga produk berikutnya tidak mengubah riwayat.

## Tes wajib (belum diuji live)
- Ambil di toko menghasilkan ongkir Rp0.
- Antar lokal menerima hanya zona yang terdaftar dan menghitung tarif dari server.
- Harga/total yang dimanipulasi dari browser tidak dipakai server.
- Stok kurang ditolak; stok angka cukup dikurangi dan tercatat di `MUTASI_STOK`.
- Agen belum disetujui mendapat harga eceran dan status menunggu persetujuan. Agen yang disetujui dapat memakai `hargaAgen` jika memenuhi `minQtyAgen`.
- Pembayaran hanya tunai atau transfer.
- Klik ulang request yang sama tidak membuat order duplikat.
- Pembatalan dan pengembalian stok perlu dilakukan sesuai prosedur admin; jangan mengubah stok manual tanpa catatan mutasi.

Catatan: Google Sheets bukan database transaksional penuh. LockService mengurangi benturan checkout, tetapi untuk trafik/konkurensi tinggi gunakan database dengan transaksi atomik.
