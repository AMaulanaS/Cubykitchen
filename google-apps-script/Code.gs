/**
 * Cuby Kitchen V2 - Google Sheets API
 *
 * 1. Buka Extensions > Apps Script dari Google Sheet.
 * 2. Ganti kode dengan isi file ini.
 * 3. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 4. Salin URL /exec ke js/config.js.
 *
 * Sheet yang dibuat otomatis:
 * - PRODUK
 * - PESANAN
 * - DETAIL_PESANAN
 *
 * Kolom PRODUK:
 * id | no | name | cat | price | old | rating | sold | tag | badge | hot | img | specs | status | stok
 */
const SPREADSHEET_ID = '1-t04oImAo1x4fmhPI5zqrbQ4aKLVwugkwP73ExC6nM4';

function ss_(){ return SpreadsheetApp.openById(SPREADSHEET_ID); }
function json_(data){
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
function sheet_(name, headers){
  const ss=ss_(); let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) sh.getRange(1,1,1,headers.length).setValues([headers]);
  return sh;
}
function setup(){
  // Tidak menghapus atau menimpa baris lama; hanya membuat sheet/kolom yang belum ada.
  sheet_('PRODUK',['id','no','name','cat','price','old','rating','sold','tag','badge','hot','img','specs','status','stok']);
  sheet_('PESANAN',['orderNo','tanggal','nama','whatsapp','provinsi','kota','alamat','pengiriman','pembayaran','tenor','subtotal','ongkir','dp','sisa','total','status']);
  sheet_('DETAIL_PESANAN',['orderNo','productId','productName','qty','harga','subtotal']);
  sheet_('PENGATURAN',['key','value']);
  sheet_('PELANGGAN',['customerId','tanggal','nama','whatsapp','namaToko','tipePelanggan','statusAgen']);
  sheet_('MUTASI_STOK',['mutationId','tanggal','productId','namaProduk','jenisMutasi','qtyMasuk','qtyKeluar','stokSebelum','stokSesudah','orderNo','keterangan']);
  sheet_('LOG_AKTIVITAS',['tanggal','aktor','aksi','orderNo','keterangan']);
  ensureCols_('PRODUK',['berat','unggulan','desc','hargaAgen','minQtyAgen']);
  ensureCols_('PESANAN',['tipePelanggan','namaToko','metodeTerima','zonaAntar','statusBayar','requestId']);
  ensureCols_('DETAIL_PESANAN',['hargaNormal','hargaAgen','jenisHarga']);
  return 'OK';
}
function ensureCols_(name,cols){
  const sh=ss_().getSheetByName(name); const h=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(String);
  cols.forEach(c=>{ if(h.indexOf(c)<0){ sh.getRange(1,h.length+1).setValue(c); h.push(c); } });
}
// PIN admin. Ganti sesuai keinginan, lalu Save dan Deploy versi baru.
function auth_(t){ const expected=PropertiesService.getScriptProperties().getProperty('ADMIN_PIN'); return !!expected && String(t||'').trim()===expected; }

/* ================= WHATSAPP OTOMATIS (Fonnte) =================
 * Setiap order masuk, invoice PDF otomatis dikirim dari WA toko ke WA pemesan.
 * 1. Daftar di fonnte.com, hubungkan nomor WA toko (scan QR), salin TOKEN device.
 * 2. Tempel token di FONNTE_TOKEN di bawah. Save.
 * 3. Jalankan fungsi testKirimWa sekali (izinkan akses), lalu Deploy > New version.
 * Jika token kosong / gagal kirim, order TETAP tersimpan; hasilnya tercatat di sheet LOG_WA.
 */
const FONNTE_TOKEN = PropertiesService.getScriptProperties().getProperty('FONNTE_TOKEN') || ''; // atur melalui Script Properties
const WA_STORE_NAME = 'Toko Sembako';
const WA_SITE_URL = 'https://cofemurdigital-jpg.github.io/Cuby Kitchen/';                        // opsional, cth. https://namamu.github.io/toko (untuk link lacak pesanan)

function rp_(n){ return 'Rp '+String(Math.round(Number(n)||0)).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
function esc_(v){ return String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function waNumber_(raw){
  let n=String(raw||'').replace(/[^0-9]/g,'');
  if(n.startsWith('0')) n='62'+n.slice(1);
  else if(n.startsWith('8')) n='62'+n;
  return n;
}
function invoiceBlob_(no,d){
  const t=d.totals||{}, c=d.customer||{};
  const tgl=Utilities.formatDate(new Date(),'Asia/Jakarta','dd MMM yyyy, HH:mm')+' WIB';
  const rows=(d.items||[]).map(it=>'<tr><td style="border-bottom:1px solid #E5E7EB">'+esc_(it.name)+'</td><td align="center" style="border-bottom:1px solid #E5E7EB">'+Number(it.qty)+'</td><td align="right" style="border-bottom:1px solid #E5E7EB">'+rp_(it.price)+'</td><td align="right" style="border-bottom:1px solid #E5E7EB">'+rp_(it.qty*it.price)+'</td></tr>').join('');
  const line=(a,b,bold)=>'<tr><td style="padding:3px 0;'+(bold?'font-weight:bold;font-size:14px':'color:#6F7278')+'">'+a+'</td><td align="right" style="padding:3px 0;'+(bold?'font-weight:bold;font-size:14px;color:#03AC0E':'')+'">'+b+'</td></tr>';
  const html='<html><body style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1B2229;padding:28px">'
   +'<table width="100%"><tr><td><div style="font-size:24px;font-weight:bold;color:#03AC0E">'+esc_(WA_STORE_NAME).toUpperCase()+'</div><div style="color:#6F7278">Indonesia</div></td>'
   +'<td align="right"><div style="font-size:20px;font-weight:bold">INVOICE</div><div style="font-weight:bold">'+esc_(no)+'</div><div style="color:#6F7278">'+tgl+'</div></td></tr></table>'
   +'<hr style="border:0;border-top:1px solid #E5E7EB;margin:14px 0">'
   +'<div style="color:#6F7278;font-size:10px">DITAGIHKAN KEPADA</div>'
   +'<div style="font-weight:bold;font-size:14px">'+esc_(c.name)+'</div>'
   +'<div>'+esc_(c.wa)+'</div><div>'+esc_(c.addr)+', '+esc_(c.city)+'</div><br>'
   +'<table width="100%" cellspacing="0" cellpadding="7" style="border-collapse:collapse"><thead><tr style="background:#E8F8EB">'
   +'<th align="left">Produk</th><th align="center">Qty</th><th align="right">Harga</th><th align="right">Subtotal</th></tr></thead><tbody>'+rows+'</tbody></table><br>'
   +'<table width="55%" align="right" cellspacing="0">'
   +line('Subtotal',rp_(t.sub))+line('Ongkir ('+esc_(d.shipping&&d.shipping.label)+')',t.ship?rp_(t.ship):'Gratis')
   +(t.dp?line('DP 30% (dibayar saat pesan)',rp_(t.dp)):'')
   +line('Total',rp_(t.total),true)
   +(t.dp?line('Sisa'+(d.tenor?' (cicil '+d.tenor+'x)':''),rp_(t.sisa)):'')
   +'</table><div style="clear:both"></div><br><br>'
   +'<div style="color:#6F7278">Metode pembayaran: <b style="color:#1B2229">'+esc_(d.payment&&d.payment.label)+'</b><br>Pengiriman: <b style="color:#1B2229">'+esc_(d.shipping&&d.shipping.label)+(d.shipping&&d.shipping.eta?' · '+esc_(d.shipping.eta):'')+'</b></div>'
   +'<p style="margin-top:28px;color:#6F7278;font-size:10px">Terima kasih telah berbelanja di '+esc_(WA_STORE_NAME)+'. Dokumen ini dibuat otomatis.</p>'
   +'</body></html>';
  return Utilities.newBlob(html,'text/html',no+'.html').getAs('application/pdf').setName('Invoice-'+no+'.pdf');
}
function waLog_(no,target,ok,info){
  try{ sheet_('LOG_WA',['waktu','orderNo','tujuan','status','keterangan']).appendRow([new Date(),no,target,ok?'TERKIRIM':'GAGAL',String(info||'').slice(0,300)]); }catch(_){}
}
function sendOrderWa_(no,d){
  const target=waNumber_(d.customer&&d.customer.wa);
  try{
    if(!FONNTE_TOKEN) throw new Error('FONNTE_TOKEN belum diisi');
    if(target.length<10) throw new Error('Nomor WA tidak valid');
    const t=d.totals||{};
    const msg='Halo *'+(d.customer&&d.customer.name||'')+'*, terima kasih sudah order di *'+WA_STORE_NAME+'* 🙏\n\n'
      +'Pesanan kamu sudah kami terima.\n'
      +'No. Order: *'+no+'*\n'
      +'Total: *'+rp_(t.total)+'*'+(t.dp?'\nDP 30% sekarang: '+rp_(t.dp):'')+'\n'
      +'Pengiriman: '+(d.shipping&&d.shipping.label||'-')+'\n\n'
      +'Invoice PDF terlampir. Instruksi pembayaran akan dikirim tim kami di chat ini maksimal 1×24 jam.'
      +(WA_SITE_URL?'\n\nLacak pesanan: '+WA_SITE_URL.replace(/\/$/,'')+'/tracking.html':'');
    const pdf=invoiceBlob_(no,d);
    const res=UrlFetchApp.fetch('https://api.fonnte.com/send',{
      method:'post',
      headers:{Authorization:FONNTE_TOKEN},
      payload:{target:target,message:msg,file:pdf,filename:'Invoice-'+no+'.pdf',countryCode:'62'},
      muteHttpExceptions:true
    });
    const body=res.getContentText(); let j={}; try{j=JSON.parse(body)}catch(_){}
    if(res.getResponseCode()!==200 || j.status===false) throw new Error(j.reason||body||('HTTP '+res.getResponseCode()));
    waLog_(no,target,true,body);
    return {sent:true};
  }catch(err){
    waLog_(no,target,false,err&&err.message||err);
    return {sent:false,reason:String(err&&err.message||err)};
  }
}
// Jalankan sekali dari editor: mengizinkan akses & mengirim invoice contoh ke WA toko.
function testKirimWa(){
  const wa=PropertiesService.getScriptProperties().getProperty('STORE_WA_TEST')||'';
  if(!wa) throw new Error('Tambahkan STORE_WA_TEST ke Script Properties sebelum menjalankan tes WhatsApp.');
  const r=sendOrderWa_('COFFEMUR-AG-TEST',{customer:{name:'Tes Cuby Kitchen',wa:wa,city:'Makassar',addr:'Jl. Contoh No. 1'},shipping:{label:'JNE',eta:'2–5 hari kerja'},payment:{label:'Transfer'},tenor:'',
    totals:{sub:100000,ship:15000,dp:0,sisa:115000,total:115000},items:[{name:'Produk Contoh',qty:2,price:50000}]});
  Logger.log(JSON.stringify(r)); return r;
}
function doGet(e){
  setup();
  const action=(e && e.parameter && e.parameter.action)||'health';
  if(['dashboard','report','orders','adminProducts'].includes(action) && !auth_(e.parameter.token)) return json_({ok:false,error:'Unauthorized'});
  if(action==='adminProducts') return json_({ok:true,products:getProducts_(true)});
  if(action==='health') return json_({ok:true,service:'Cuby Kitchen API',time:new Date().toISOString()});
  if(action==='products') return json_({ok:true,products:getProducts_()});
  if(action==='settings') return json_({ok:true,settings:getSettings_()});
  if(action==='dashboard') return getDashboard_();
  if(action==='report') return getReport_(e.parameter.month||'');
  if(action==='invoice') return getInvoice_(e.parameter.orderNo||'', e.parameter.wa||'');
  if(action==='orders') return getOrders_(e.parameter.status||'');
  if(action==='tracking') return getTracking_(e.parameter.orderNo||'', e.parameter.wa||'');
  return json_({ok:false,error:'Unknown action'});
}
function doPost(e){
  try{
    setup();
    const data=JSON.parse((e.postData&&e.postData.contents)||'{}');
    if(['updateStatus','saveProduct','deleteProduct','saveSettings','uploadImage'].includes(data.action) && !auth_(data.token)) return json_({ok:false,error:'Unauthorized'});
    if(data.action==='saveProduct') return saveProduct_(data);
    if(data.action==='saveSettings') return saveSettings_(data);
    if(data.action==='uploadImage') return uploadImage_(data);
    if(data.action==='deleteProduct') return deleteProduct_(data);
    if(data.action==='order') return saveOrder_(data);
    if(data.action==='updateStatus') return updateStatus_(data);
    return json_({ok:false,error:'Unknown action'});
  }catch(err){ return json_({ok:false,error:String(err)}); }
}
function getProducts_(all){
  const sh=ss_().getSheetByName('PRODUK');
  const values=sh.getDataRange().getValues(); if(values.length<2) return [];
  const h=values.shift().map(String);
  return values.filter(r=>r[0]).filter(r=>all||String(r[h.indexOf('status')]||'').toUpperCase()!=='NONAKTIF').map(r=>{
    const o={}; h.forEach((k,i)=>o[k]=r[i]);
    o.price=Number(o.price)||0; o.old=Number(o.old)||0; o.rating=String(o.rating||''); o.hot=String(o.hot).toLowerCase()==='true'; o.specs=String(o.specs||'').split('||').filter(Boolean); o.stok=o.stok===''?null:Number(o.stok); o.berat=Number(o.berat)||0; o.unggulan=String(o.unggulan).toLowerCase()==='true'; o.desc=String(o.desc||''); return o;
  });
}
function findHeader_(headers, name){ return headers.indexOf(name); }
function findCustomer_(wa){
  const sh=ss_().getSheetByName('PELANGGAN'); if(!sh) return null;
  const v=sh.getDataRange().getValues(); if(v.length<2)return null; const h=v[0].map(String), wc=h.indexOf('whatsapp'), sc=h.indexOf('statusAgen');
  const normalized=waNumber_(wa);
  for(let i=1;i<v.length;i++) if(waNumber_(v[i][wc])===normalized) return {row:i+1,values:v[i],headers:h,status:sc>=0?String(v[i][sc]||'').toUpperCase():''};
  return null;
}
function upsertCustomer_(c, type){
  const sh=ss_().getSheetByName('PELANGGAN'), h=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String), found=findCustomer_(c.wa);
  const status=type==='AGEN'?(found&&found.status==='DISETUJUI'?'DISETUJUI':'MENUNGGU_PERSETUJUAN'):(found&&found.status==='DISETUJUI'?'DISETUJUI':'BUKAN_AGEN');
  const vals={customerId:found?found.values[h.indexOf('customerId')]:'CUS-'+Utilities.getUuid().slice(0,8).toUpperCase(),tanggal:found?found.values[h.indexOf('tanggal')]:new Date(),nama:c.name,whatsapp:waNumber_(c.wa),namaToko:c.store||'',tipePelanggan:type,statusAgen:status};
  const row=Array(h.length).fill('');h.forEach((k,i)=>{if(Object.prototype.hasOwnProperty.call(vals,k))row[i]=vals[k]});
  if(found)sh.getRange(found.row,1,1,h.length).setValues([row]);else sh.appendRow(row);
  return {statusAgen:status,approved:type==='AGEN'&&status==='DISETUJUI'};
}
function settingObject_(){
  const s=getSettings_()||{}; return s;
}
function serverShippingCost_(shipping){
  if(shipping.method==='AMBIL') return 0;
  if(shipping.method!=='ANTAR') throw new Error('Metode penerimaan tidak valid');
  const s=settingObject_(), zones=(s.shipping&&s.shipping.localZones)||{'Zona 1':5000,'Zona 2':10000,'Zona 3':15000};
  const zone=String(shipping.zone||''); if(!Object.prototype.hasOwnProperty.call(zones,zone)) throw new Error('Zona antar tidak valid. Perbarui pengaturan ongkir toko.');
  const price=Number(zones[zone]); if(!Number.isFinite(price)||price<0)throw new Error('Tarif zona belum valid'); return Math.round(price);
}
function saveOrder_(d){
  const c=d.customer||{}, shipping=d.shipping||{}, payment=d.payment||{};
  const name=String(c.name||'').trim(), wa=waNumber_(c.wa), type=String(c.type||'ECERAN').toUpperCase();
  if(name.length<2) return json_({ok:false,error:'Nama pemesan wajib diisi'});
  if(wa.length<10||wa.length>15) return json_({ok:false,error:'Nomor WhatsApp tidak valid'});
  if(!['ECERAN','AGEN'].includes(type)) return json_({ok:false,error:'Jenis pelanggan tidak valid'});
  if(type==='AGEN'&&String(c.store||'').trim().length<2) return json_({ok:false,error:'Nama toko agen wajib diisi'});
  if(!['cash','transfer'].includes(String(payment.key||''))) return json_({ok:false,error:'Metode pembayaran tidak tersedia'});
  if(!Array.isArray(d.items)||!d.items.length||d.items.length>100) return json_({ok:false,error:'Keranjang kosong atau jumlah item tidak valid'});
  const requestId=String(d.requestId||'').slice(0,100); if(!requestId) return json_({ok:false,error:'ID permintaan tidak valid'});
  const lock=LockService.getScriptLock(); lock.waitLock(15000);
  let result;
  try{
    setup();
    // Cegah pesanan duplikat ketika browser mengirim ulang permintaan yang sama.
    const existing=rows_('PESANAN').find(o=>String(o.requestId||'')===requestId);
    if(existing) return json_({ok:true,orderNo:String(existing.orderNo),totals:{sub:Number(existing.subtotal)||0,ship:Number(existing.ongkir)||0,total:Number(existing.total)||0},agentStatus:String(existing.statusAgen||''),duplicate:true});
    const existingCustomer=findCustomer_(wa);
    const agentPriceAllowed=type==='AGEN'&&!!existingCustomer&&existingCustomer.status==='DISETUJUI';
    const ps=ss_().getSheetByName('PRODUK'), values=ps.getDataRange().getValues(); if(values.length<2)throw new Error('Produk belum tersedia');
    const ph=values[0].map(String), col=k=>ph.indexOf(k), byId={};
    for(let i=1;i<values.length;i++){const id=String(values[i][col('id')]||'');if(id)byId[id]={row:i+1,values:values[i]};}
    const merged={}; d.items.forEach(it=>{const id=String(it.id||'');const qty=Number(it.qty);if(!id||!Number.isInteger(qty)||qty<1||qty>10000)throw new Error('Produk atau jumlah barang tidak valid');merged[id]=(merged[id]||0)+qty;});
    let sub=0, details=[], stockChanges=[];
    Object.keys(merged).forEach(id=>{
      const p=byId[id]; if(!p)throw new Error('Produk tidak ditemukan: '+id);
      const v=p.values, nameIdx=col('name'), priceIdx=col('price'), statusIdx=col('status'), stockIdx=col('stok');
      if(String(v[statusIdx]||'').toUpperCase()==='NONAKTIF')throw new Error('Produk sedang tidak tersedia: '+String(v[nameIdx]));
      const normal=Number(v[priceIdx]);if(!Number.isFinite(normal)||normal<0)throw new Error('Harga produk belum valid: '+String(v[nameIdx]));
      const agentIdx=col('hargaAgen'), minIdx=col('minQtyAgen'); const agent=agentIdx>=0&&v[agentIdx]!==''&&Number(v[agentIdx])>0?Number(v[agentIdx]):normal; const min= minIdx>=0&&Number(v[minIdx])>0?Number(v[minIdx]):1;
      const qty=merged[id], useAgent=agentPriceAllowed&&qty>=min; const price=useAgent?agent:normal;
      if(!Number.isFinite(price)||price<0)throw new Error('Harga agen tidak valid: '+String(v[nameIdx]));
      const current=stockIdx>=0&&v[stockIdx]!==''&&v[stockIdx]!==null?Number(v[stockIdx]):null;
      if(current!==null&&(!Number.isFinite(current)||current<qty))throw new Error('Stok '+String(v[nameIdx])+' tidak mencukupi. Stok tersedia: '+current);
      const line=price*qty;sub+=line;details.push({id,name:String(v[nameIdx]||id),qty,price,normal,agent,useAgent,line,row:p.row,stock:current});
      if(current!==null)stockChanges.push({row:p.row,id,name:String(v[nameIdx]||id),before:current,after:current-qty,qty});
    });
    const ship=serverShippingCost_(shipping), total=sub+ship;
    const customerStatus=upsertCustomer_({name,wa,store:String(c.store||'').trim()},type);
    const no='CUBY-'+Utilities.formatDate(new Date(),'Asia/Jakarta','yyMMdd')+'-'+Utilities.getUuid().slice(0,6).toUpperCase();
    const orderSheet=ss_().getSheetByName('PESANAN'), oh=orderSheet.getRange(1,1,1,orderSheet.getLastColumn()).getValues()[0].map(String), row=Array(oh.length).fill('');
    const vals={orderNo:no,tanggal:new Date(),nama,whatsapp:wa,provinsi:'',kota:shipping.zone||'',alamat:shipping.method==='ANTAR'?String(shipping.address||''):'Ambil di toko',pengiriman:shipping.method==='ANTAR'?'Antar lokal':'Ambil di toko',pembayaran:payment.key==='transfer'?'Transfer bank':'Tunai saat ambil/terima',tenor:'',subtotal:sub,ongkir:ship,dp:0,sisa:0,total,status:'BARU',tipePelanggan:type,namaToko:String(c.store||''),metodeTerima:shipping.method,zonaAntar:shipping.zone||'',statusBayar:payment.key==='transfer'?'MENUNGGU_PEMBAYARAN':'BELUM_DIBAYAR',requestId,statusAgen:customerStatus.statusAgen};
    // ensure statusAgen header exists for clear audit trail
    ensureCols_('PESANAN',['statusAgen']); const oh2=orderSheet.getRange(1,1,1,orderSheet.getLastColumn()).getValues()[0].map(String); if(row.length!==oh2.length)row.length=oh2.length; oh2.forEach((k,i)=>{if(Object.prototype.hasOwnProperty.call(vals,k))row[i]=vals[k]});
    orderSheet.appendRow(row);
    const ds=ss_().getSheetByName('DETAIL_PESANAN'), dh=ds.getRange(1,1,1,ds.getLastColumn()).getValues()[0].map(String);
    details.forEach(it=>{const r=Array(dh.length).fill(''), dv={orderNo:no,productId:it.id,productName:it.name,qty:it.qty,harga:it.price,subtotal:it.line,hargaNormal:it.normal,hargaAgen:it.agent,jenisHarga:it.useAgent?'AGEN':'ECERAN'};dh.forEach((k,i)=>{if(Object.prototype.hasOwnProperty.call(dv,k))r[i]=dv[k]});ds.appendRow(r);});
    stockChanges.forEach(sc=>{const stc=col('stok');ps.getRange(sc.row,stc+1).setValue(sc.after);ss_().getSheetByName('MUTASI_STOK').appendRow(['MUT-'+Utilities.getUuid().slice(0,8),new Date(),sc.id,sc.name,'PENJUALAN',0,sc.qty,sc.before,sc.after,no,'Pengurangan stok dari checkout']);});
    ss_().getSheetByName('LOG_AKTIVITAS').appendRow([new Date(),'SISTEM','PESANAN_BARU',no,'Checkout tervalidasi server']);
    result={ok:true,orderNo:no,totals:{sub,ship,total},agentStatus:customerStatus.statusAgen,wa:{sent:false}};
  } finally { lock.releaseLock(); }
  // WhatsApp/invoice bersifat opsional. Kegagalan pengiriman tidak membatalkan transaksi.
  try{const detailItems=(d.items||[]).map(it=>({id:it.id,name:it.name,qty:it.qty,price:it.price}));const wa=sendOrderWa_(result.orderNo,{customer:{name,wa,city:shipping.zone||'',addr:shipping.address||'Ambil di toko'},shipping:{label:shipping.method==='ANTAR'?'Antar lokal — '+shipping.zone:'Ambil di toko'},payment:{label:payment.key==='transfer'?'Transfer bank':'Tunai saat ambil'},totals:result.totals,items:detailItems});result.wa={sent:!!wa.sent};}catch(_){ }
  return json_(result);
}

function rows_(name){
  const sh=ss_().getSheetByName(name); if(!sh) return [];
  const values=sh.getDataRange().getValues(); if(values.length<2) return [];
  const h=values.shift().map(String);
  return values.filter(r=>r.some(v=>v!==''&&v!==null)).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]);return o;});
}
function getOrders_(status){
  let orders=rows_('PESANAN');
  if(status) orders=orders.filter(o=>String(o.status||'')===status);
  orders.reverse();
  return json_({ok:true,orders:orders.slice(0,500).map(orderPublic_) });
}
function orderPublic_(o){
  const copy={...o};
  if(copy.tanggal instanceof Date) copy.tanggal=copy.tanggal.toISOString();
  copy.subtotal=Number(copy.subtotal)||0; copy.ongkir=Number(copy.ongkir)||0; copy.dp=Number(copy.dp)||0; copy.sisa=Number(copy.sisa)||0; copy.total=Number(copy.total)||0;
  return copy;
}
function getTracking_(orderNo,wa){
  orderNo=String(orderNo||'').trim(); wa=String(wa||'').replace(/[^0-9]/g,'');
  if(!orderNo) return json_({ok:false,error:'Nomor order wajib diisi'});
  const order=rows_('PESANAN').find(o=>String(o.orderNo).trim().toUpperCase()===orderNo.toUpperCase());
  if(!order) return json_({ok:false,error:'Pesanan tidak ditemukan'});
  const stored=String(order.whatsapp||'').replace(/[^0-9]/g,'');
  if(wa && stored!==wa) return json_({ok:false,error:'Nomor WhatsApp tidak cocok'});
  if(!wa) return json_({ok:false,error:'Nomor WhatsApp wajib diisi'});
  const items=rows_('DETAIL_PESANAN').filter(x=>String(x.orderNo)===String(order.orderNo)).map(x=>({name:x.productName,qty:Number(x.qty)||0,price:Number(x.harga)||0,subtotal:Number(x.subtotal)||0}));
  return json_({ok:true,order:orderPublic_(order),items});
}
function getDashboard_(){
  const orders=rows_('PESANAN');
  const detail=rows_('DETAIL_PESANAN');
  const products=getProducts_();
  const countStatus=s=>orders.filter(o=>String(o.status||'BARU')===s).length;
  const omzet=orders.filter(o=>String(o.status||'')!=='DIBATALKAN').reduce((n,o)=>n+(Number(o.total)||0),0);
  const todayKey=Utilities.formatDate(new Date(), Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM-dd');
  const today=orders.filter(o=>o.tanggal && Utilities.formatDate(new Date(o.tanggal),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy-MM-dd')===todayKey);
  const sold={}; detail.forEach(x=>{const k=String(x.productName||'Tanpa Nama');sold[k]=(sold[k]||0)+(Number(x.qty)||0)});
  const best=Object.entries(sold).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name,qty])=>({name,qty}));
  const low=products.filter(p=>p.stok!==null && Number(p.stok)<=5).map(p=>({id:p.id,name:p.name,stok:Number(p.stok)}));
  return json_({ok:true,stats:{orders:orders.length,new:countStatus('BARU'),processing:countStatus('DIPROSES'),shipped:countStatus('DIKIRIM'),done:countStatus('SELESAI'),cancelled:countStatus('DIBATALKAN'),omzet,todayOrders:today.length,todayOmzet:today.reduce((n,o)=>n+(Number(o.total)||0),0)},best,low,orders:orders.slice(-10).reverse().map(orderPublic_)});
}

function getReport_(month){
  const tz=Session.getScriptTimeZone()||'Asia/Jakarta';
  month=String(month||Utilities.formatDate(new Date(),tz,'yyyy-MM'));
  const orders=rows_('PESANAN').filter(o=>{
    if(!o.tanggal) return false;
    return Utilities.formatDate(new Date(o.tanggal),tz,'yyyy-MM')===month;
  });
  const valid=orders.filter(o=>String(o.status||'')!=='DIBATALKAN');
  const omzet=valid.reduce((n,o)=>n+(Number(o.total)||0),0);
  const byStatus={}; valid.forEach(o=>{const s=String(o.status||'BARU');byStatus[s]=(byStatus[s]||0)+1;});
  const byDay={}; valid.forEach(o=>{const d=Utilities.formatDate(new Date(o.tanggal),tz,'dd');byDay[d]=(byDay[d]||0)+(Number(o.total)||0);});
  const byPayment={}; valid.forEach(o=>{const k=String(o.pembayaran||'Lainnya');byPayment[k]=(byPayment[k]||0)+(Number(o.total)||0);});
  return json_({ok:true,month,stats:{orders:orders.length,validOrders:valid.length,cancelled:orders.length-valid.length,omzet,average:valid.length?omzet/valid.length:0},byStatus,byDay,byPayment});
}
function getInvoice_(orderNo,wa){
  orderNo=String(orderNo||'').trim(); wa=String(wa||'').replace(/[^0-9]/g,'');
  const order=rows_('PESANAN').find(o=>String(o.orderNo).trim().toUpperCase()===orderNo.toUpperCase());
  if(!order) return json_({ok:false,error:'Pesanan tidak ditemukan'});
  const stored=String(order.whatsapp||'').replace(/[^0-9]/g,'');
  if(!wa || stored!==wa) return json_({ok:false,error:'Nomor WhatsApp tidak cocok'});
  const items=rows_('DETAIL_PESANAN').filter(x=>String(x.orderNo)===String(order.orderNo)).map(x=>({name:x.productName,qty:Number(x.qty)||0,price:Number(x.harga)||0,subtotal:Number(x.subtotal)||0}));
  return json_({ok:true,order:orderPublic_(order),items,store:{name:'Toko Sembako',city:'Indonesia'}});
}

function updateStatus_(d){
  const allowed=['BARU','DIPROSES','DIKIRIM','SELESAI','DIBATALKAN'];
  const no=String(d.orderNo||'').trim(), status=String(d.status||'').trim().toUpperCase();
  if(!no||!allowed.includes(status)) return json_({ok:false,error:'Data status tidak valid'});
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const sh=ss_().getSheetByName('PESANAN'), values=sh.getDataRange().getValues(), h=values[0].map(String), noC=h.indexOf('orderNo'), stC=h.indexOf('status');
    if(noC<0||stC<0)return json_({ok:false,error:'Kolom pesanan tidak lengkap'});
    let rowNum=-1,oldStatus='';for(let i=1;i<values.length;i++)if(String(values[i][noC]).trim()===no){rowNum=i+1;oldStatus=String(values[i][stC]||'BARU').toUpperCase();break;}
    if(rowNum<0)return json_({ok:false,error:'Pesanan tidak ditemukan'});
    if(oldStatus==='DIBATALKAN'&&status!=='DIBATALKAN')return json_({ok:false,error:'Pesanan yang dibatalkan tidak dapat diaktifkan kembali. Buat pesanan baru.'});
    if(oldStatus!=='DIBATALKAN'&&status==='DIBATALKAN'){
      const ds=rows_('DETAIL_PESANAN').filter(x=>String(x.orderNo)===no), ps=ss_().getSheetByName('PRODUK'), pv=ps.getDataRange().getValues(), ph=pv[0].map(String), idc=ph.indexOf('id'), stc=ph.indexOf('stok'), nc=ph.indexOf('name');
      ds.forEach(it=>{
        const qty=Number(it.qty)||0;for(let i=1;i<pv.length;i++)if(String(pv[i][idc])===String(it.productId)){
          const cur=pv[i][stc];if(stc>=0&&cur!==''&&cur!==null&&Number.isFinite(Number(cur))){const before=Number(cur),after=before+qty;ps.getRange(i+1,stc+1).setValue(after);ss_().getSheetByName('MUTASI_STOK').appendRow(['MUT-'+Utilities.getUuid().slice(0,8),new Date(),it.productId,String(pv[i][nc]||it.productName),'PEMBATALAN',qty,0,before,after,no,'Pengembalian stok karena pesanan dibatalkan']);}break;
        }
      });
    }
    sh.getRange(rowNum,stC+1).setValue(status);
    const payC=h.indexOf('statusBayar');if(status==='DIBATALKAN'&&payC>=0)sh.getRange(rowNum,payC+1).setValue('DIBATALKAN');
    ss_().getSheetByName('LOG_AKTIVITAS').appendRow([new Date(),'ADMIN','UBAH_STATUS',no,oldStatus+' -> '+status]);
    return json_({ok:true,orderNo:no,status});
  }finally{lock.releaseLock();}
}

function saveProduct_(d){
  const p=d.product||{};
  if(!p.name||!p.cat||!(Number(p.price)>0)) return json_({ok:false,error:'Nama, kategori, dan harga wajib diisi'});
  const lock=LockService.getScriptLock(); lock.waitLock(10000);
  try{
    const sh=ss_().getSheetByName('PRODUK'); const v=sh.getDataRange().getValues(); const h=v[0].map(String);
    let row=0; if(p.id){ for(let i=1;i<v.length;i++) if(String(v[i][0])===String(p.id)){row=i+1;break;} }
    if(!row){ p.id='p'+Date.now().toString(36); p.no=String(v.length).padStart(3,'0'); if(p.rating===undefined)p.rating='5.0'; if(p.sold===undefined)p.sold='0'; }
    if(Array.isArray(p.specs)) p.specs=p.specs.join('||');
    p.price=Number(p.price); p.berat=Number(p.berat)||''; p.unggulan=!!p.unggulan; p.old=Number(p.old)||''; p.stok=(p.stok===''||p.stok==null)?'':Number(p.stok);
    const out=h.map((k,i)=>p[k]===undefined?(row?v[row-1][i]:''):p[k]);
    if(row) sh.getRange(row,1,1,h.length).setValues([out]); else sh.appendRow(out);
    return json_({ok:true,id:p.id});
  } finally { lock.releaseLock(); }
}
function deleteProduct_(d){
  const sh=ss_().getSheetByName('PRODUK'); const v=sh.getDataRange().getValues();
  for(let i=1;i<v.length;i++) if(String(v[i][0])===String(d.id)){ sh.deleteRow(i+1); return json_({ok:true}); }
  return json_({ok:false,error:'Produk tidak ditemukan'});
}

/* ===== Pengaturan toko (disimpan sebagai JSON di sheet PENGATURAN, sel B2) ===== */
function getSettings_(){
  const v=ss_().getSheetByName('PENGATURAN').getRange(2,2).getValue();
  try{ return v?JSON.parse(v):{}; }catch(_){ return {}; }
}
function saveSettings_(d){
  const s=d.settings; if(!s||typeof s!=='object') return json_({ok:false,error:'Data pengaturan tidak valid'});
  const j=JSON.stringify(s); if(j.length>45000) return json_({ok:false,error:'Pengaturan terlalu panjang (kurangi FAQ)'});
  ss_().getSheetByName('PENGATURAN').getRange(2,1,1,2).setValues([['config',j]]);
  return json_({ok:true});
}
/* ===== Upload foto produk ke Google Drive (folder "Cuby Kitchen-Produk") ===== */
function uploadImage_(d){
  const m=String(d.data||'').match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if(!m) return json_({ok:false,error:'Format gambar tidak valid'});
  const bytes=Utilities.base64Decode(m[2]); if(bytes.length>4000000) return json_({ok:false,error:'Gambar terlalu besar'});
  const it=DriveApp.getFoldersByName('Cuby Kitchen-Produk'); const folder=it.hasNext()?it.next():DriveApp.createFolder('Cuby Kitchen-Produk');
  const file=folder.createFile(Utilities.newBlob(bytes,m[1],'produk-'+Date.now()+'.'+m[1].split('/')[1]));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  return json_({ok:true,url:'https://lh3.googleusercontent.com/d/'+file.getId()+'=w800'});
}
