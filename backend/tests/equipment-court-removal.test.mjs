import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration=await readFile(new URL('../migrations/20261103_remove_equipment_court.sql',import.meta.url),'utf8');
async function fixture(){
 const db=new PGlite();
 const schema=await readFile(new URL('../../frontend/docs/supabase_schema.sql',import.meta.url),'utf8');
 await db.exec(schema.slice(0,schema.indexOf('-- 3. CẤU HÌNH')).replace(/CREATE EXTENSION[^;]+;/g,''));
 await db.exec(await readFile(new URL('../migrations/20261103_facility_supabase.sql',import.meta.url),'utf8'));
 await db.exec(`INSERT INTO bo_mon(ma_bo_mon,ten_bo_mon,don_gia_gio) VALUES('BM00000001','Cầu lông',120000);
 INSERT INTO san(ma_san,ten_san,ma_bo_mon) VALUES('SAN00000001','Sân CL-01','BM00000001'),('SAN00000002','Sân CL-02','BM00000001');
 INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,so_dien_thoai,email,mat_khau) VALUES('NV00000001','Staff','0912345678','staff@test.invalid','test');
 INSERT INTO khach_hang(ma_khach_hang,ho_ten,so_dien_thoai) VALUES('KH00000001','Customer','0900000000');
 INSERT INTO dat_san(ma_dat_san,ma_san,ma_khach_hang,ngay_dat,gio_bat_dau,gio_ket_thuc,don_gia_gio,tong_tien_san,trang_thai)
 VALUES('DS00000001','SAN00000001','KH00000001','2026-11-03','08:00','09:00',120000,120000,'DA_THANH_TOAN'),
 ('DS00000002','SAN00000002','KH00000001','2026-11-03','08:00','09:00',120000,120000,'DA_THANH_TOAN');
 INSERT INTO thanh_toan(ma_thanh_toan,ma_dat_san,so_tien,loai_giao_dich) VALUES('TT00000001','DS00000001',120000,'THANH_TOAN_DAT_SAN'),('TT00000002','DS00000002',120000,'THANH_TOAN_DAT_SAN');`);
 return db;
}
const scalar=async(db,sql,params=[])=>Object.values((await db.query(sql,params)).rows[0])[0];
const rpc=(db,name,input)=>scalar(db,`SELECT ${name}($1::jsonb)`,[JSON.stringify(input)]);
const request=reports=>({bookingCode:'DS00000001',bookingDate:'2026-11-03',reference:'2026-11-03:DS00000001',courtName:'Sân CL-01',remainingBalance:0,reports,expectedAmount:150000,paymentConfirmed:true,bankTransactionCode:'BANK-DAMAGE-1'});
test('removing equipment court preserves atomic catalogue saves, check-in, damage checkout and shared catalogue reuse',async()=>{
 const db=await fixture();
 try{
  await db.exec(migration);await db.exec(migration);
  assert.equal(await scalar(db,"SELECT count(*)::int FROM information_schema.columns WHERE table_name='thiet_bi' AND column_name='ma_san'"),0);
  const code=await rpc(db,'courtx_save_equipment',{name:'Lưới cầu lông',compensationPrice:150000,sportType:'CauLong',isCatalogItem:true});
  const asset=(await db.query('SELECT * FROM thiet_bi WHERE ma_thiet_bi=$1',[code])).rows[0];
  assert.equal(asset.so_seri,null);assert.equal(asset.thong_tin_bo_sung.compensationPrice,150000);
  const priceId=asset.thong_tin_bo_sung.compensationItemId;
  await db.query("SELECT courtx_checkin('DS00000001','2026-11-03')");
  await db.query("SELECT courtx_checkin('DS00000002','2026-11-03')");
  const report={id:'new-damage',title:'Rách lưới',description:'Hỏng góc lưới',courtName:'Sân CL-01',reporterPhone:'0912345678',compensationItemId:priceId,liability:'DO_KHACH_LAM_HONG'};
  const result=await rpc(db,'courtx_checkout',request([report]));
  assert.equal(Number(result.receipt.amountPaid),150000);
  assert.equal(await scalar(db,'SELECT ma_thiet_bi FROM chi_tiet_su_co'),code);
  assert.equal(await scalar(db,'SELECT trang_thai FROM thiet_bi'),'san_sang');
  const venue=await rpc(db,'courtx_save_incident',{...report,id:'other-court',bookingCode:'DS00000002',courtName:'Sân CL-02',liability:'BAO_HANH_SAN_VAN_DONG'});
  assert.equal(Number(await scalar(db,'SELECT tong_tien_den_bu FROM bao_cao_su_co WHERE ma_su_co=$1',[venue])),0);
  const second=await rpc(db,'courtx_checkout',{...request([{...report,id:venue}]),bookingCode:'DS00000002',reference:'2026-11-03:DS00000002',courtName:'Sân CL-02',expectedAmount:0,paymentConfirmed:false,bankTransactionCode:''});
  assert.equal(Number(second.receipt.amountPaid),0);
 }finally{await db.close();}
});
test('migration refuses to discard an existing physical court assignment',async()=>{
 const db=await fixture();
 try{
  await db.exec("INSERT INTO thiet_bi(ma_thiet_bi,ten_thiet_bi,ma_san,thong_tin_bo_sung) VALUES('TB00000001','Existing physical equipment','SAN00000001','{\"isCatalogItem\":true}')");
  await assert.rejects(db.exec(migration),/Synchronize/);
  assert.equal(await scalar(db,'SELECT ma_san FROM thiet_bi'),'SAN00000001');
 }finally{await db.close();}
});
