/* Katalog awal Cuby Kitchen. Harga dan stok contoh: sesuaikan dengan data Google Sheets sebelum website dipublikasikan. */
const U=id=>`https://images.unsplash.com/${id}?q=80&w=800&auto=format&fit=crop`;
const PRODUCTS=[
{id:'p1',no:'001',name:'Beras Premium 5 kg',cat:'BERAS & POKOK',price:78000,img:U('photo-1586201375761-83865001e31c'),rating:'4.8',sold:'',tag:'Beras pulen untuk kebutuhan keluarga sehari-hari.',badge:'LARIS',hot:true,unggulan:true,specs:['Kemasan 5 kg','Pilihan untuk konsumsi harian','Stok dan harga dikonfirmasi saat checkout']},
{id:'p2',no:'002',name:'Minyak Goreng 1 L',cat:'MINYAK & BUMBU',price:18000,img:U('photo-1474979266404-7eaacbcd87c5'),rating:'4.8',tag:'Minyak goreng untuk masak sehari-hari.',hot:true,specs:['Kemasan 1 liter','Merek mengikuti stok toko']},
{id:'p3',no:'003',name:'Gula Pasir 1 kg',cat:'BERAS & POKOK',price:17500,img:U('photo-1581441363689-1f3c3c414635'),rating:'4.7',tag:'Gula pasir untuk minuman dan masakan.',specs:['Kemasan 1 kg','Simpan di tempat kering']},
{id:'p4',no:'004',name:'Telur Ayam 1 kg',cat:'DAPUR & PROTEIN',price:30000,img:U('photo-1506976785307-8732e854ad03'),rating:'4.8',tag:'Telur untuk menu keluarga sehari-hari.',badge:'FAVORIT',hot:true,specs:['Dijual per kilogram','Kondisi diperiksa sebelum dikirim']},
{id:'p5',no:'005',name:'Mi Instan',cat:'MAKANAN PRAKTIS',price:3500,img:U('photo-1569718212165-3a8278d5f624'),rating:'4.7',tag:'Pilihan praktis untuk stok dapur.',specs:['Harga contoh per bungkus','Varian rasa mengikuti stok']},
{id:'p6',no:'006',name:'Tepung Terigu 1 kg',cat:'BAHAN KUE',price:14000,img:U('photo-1627485937980-221c88ac04f9'),rating:'4.7',tag:'Bahan serbaguna untuk gorengan dan kue.',specs:['Kemasan 1 kg','Merek mengikuti stok toko']},
{id:'p7',no:'007',name:'Kopi Sachet',cat:'MINUMAN',price:2000,img:U('photo-1447933601403-0c6688de566e'),rating:'4.6',tag:'Teman santai kapan saja.',specs:['Harga contoh per sachet','Varian mengikuti stok']},
{id:'p8',no:'008',name:'Sabun Cuci Piring',cat:'KEBERSIHAN',price:7000,img:U('photo-1585421514738-01798e348b17'),rating:'4.6',tag:'Bantu menjaga peralatan makan tetap bersih.',specs:['Ukuran dan merek mengikuti stok']},
{id:'p9',no:'009',name:'Air Mineral 600 ml',cat:'MINUMAN',price:3500,img:U('photo-1560023907-5f339617ea30'),rating:'4.7',tag:'Air minum kemasan untuk kebutuhan harian.',specs:['Harga contoh per botol']},
{id:'p10',no:'010',name:'Garam Dapur 500 g',cat:'MINYAK & BUMBU',price:5000,img:U('photo-1518110925495-5fe2fda0442d'),rating:'4.6',tag:'Pelengkap bumbu dapur.',specs:['Kemasan contoh 500 gram']},
{id:'p11',no:'011',name:'Susu Kental Manis',cat:'MINUMAN',price:12000,img:U('photo-1550583724-b2692b85b150'),rating:'4.6',tag:'Pelengkap minuman dan hidangan.',specs:['Ukuran dan merek mengikuti stok']},
{id:'p12',no:'012',name:'Tisu Serbaguna',cat:'KEBERSIHAN',price:9000,img:U('photo-1583947215259-38e31be8751f'),rating:'4.6',tag:'Praktis untuk kebutuhan rumah.',specs:['Ukuran mengikuti stok toko']}
];
