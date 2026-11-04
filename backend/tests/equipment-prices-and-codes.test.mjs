import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration=await readFile(new URL('../migrations/20261103_equipment_prices_and_codes.sql',import.meta.url),'utf8');
const scalar=async(db,sql,params=[])=>Object.values((await db.query(sql,params)).rows[0])[0];
async function fixture(){
 const db=new PGlite();
 const schema=await readFile(new URL('../../frontend/docs/supabase_schema.sql',import.meta.url),'utf8');
 await db.exec(schema.slice(0,schema.indexOf('-- 3. CẤU HÌNH')).replace(/CREATE EXTENSION[^;]+;/g,''));
 await db.exec(await readFile(new URL('../migrations/20261103_facility_supabase.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../migrations/20261103_remove_equipment_court.sql',import.meta.url),'utf8'));
 await db.exec(`INSERT INTO bo_mon(ma_bo_mon,ten_bo_mon,don_gia_gio) VALUES('BM00000001','Cầu lông',120000);
 INSERT INTO san(ma_san,ten_san,ma_bo_mon) VALUES('SAN00000001','Sân CL-01','BM00000001');
 INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,so_dien_thoai,email,mat_khau) VALUES('NV00000001','Staff','0912345678','staff@test.invalid','test');
 INSERT INTO khach_hang(ma_khach_hang,ho_ten,so_dien_thoai) VALUES('KH00000001','Customer','0900000000');
 INSERT INTO dat_san(ma_dat_san,ma_san,ma_khach_hang,ngay_dat,gio_bat_dau,gio_ket_thuc,don_gia_gio,tong_tien_san,trang_thai,ket_qua_checkout)
 VALUES('DS00000001','SAN00000001','KH00000001','2026-11-03','08:00','09:00',120000,120000,'HOAN_TAT','{"equipmentIds":["TB00000021","TB00000041"],"receipt":{"amountPaid":0}}');`);
 for(let i=1;i<=21;i++){
  const asset='TB'+String(20+i).padStart(8,'0'),price='DB'+String(i).padStart(8,'0');
  const extra={isCatalogItem:true,compensationItemId:price,compensationPrice:150000,sportType:'CauLong',code:asset,...(i===1?{purchasePrice:250000}:{})};
  await db.query('INSERT INTO thiet_bi(ma_thiet_bi,ten_thiet_bi,thong_tin_bo_sung) VALUES($1,$2,$3::jsonb)',[asset,'Item '+i,JSON.stringify(extra)]);
  await db.query('INSERT INTO bang_gia_den_bu(ma_danh_muc_den_bu,ten_vat_tu,don_gia_den_bu,don_vi_tinh,mo_ta_hu_hai) VALUES($1,$2,150000,\'chiếc\',$3)',[price,'Item '+i,'asset:'+asset]);
 }
 await db.exec(`INSERT INTO bao_cao_su_co(ma_su_co,ma_dat_san,ma_nhan_vien,nguyen_nhan,tong_tien_den_bu,thong_tin_bo_sung)
 VALUES('SC00000001','DS00000001','NV00000001','DO_KHACH_LAM_HONG',90000,'{"equipmentCode":"TB00000021","damageItems":[{"equipmentCode":"TB00000021"}],"legacyEquipmentHistory":[{"equipment":{"ma_thiet_bi":"TB00000021","name":"Original snapshot"}}]}');
 INSERT INTO chi_tiet_su_co(ma_chi_tiet,ma_su_co,ma_thiet_bi,ma_danh_muc_den_bu,don_gia_ap_dung,thanh_tien) VALUES('CT00000001','SC00000001','TB00000021','DB00000001',90000,90000);`);
 return db;
}
test('price columns and overlapping ID renumbering preserve references, costs, checkout history and original snapshots; rerun is safe',async()=>{
 const db=await fixture();
 try{
  await db.exec(migration);
  const rows=(await db.query('SELECT * FROM thiet_bi ORDER BY ma_thiet_bi')).rows;
  assert.equal(rows.length,21);assert.equal(rows[0].ma_thiet_bi,'TB00000001');assert.equal(rows[20].ma_thiet_bi,'TB00000021');
  assert.equal(rows[0].ten_thiet_bi,'Item 1');assert.equal(rows[20].ten_thiet_bi,'Item 21');
  assert.equal(Number(rows[0].gia_mua),250000);assert.equal(rows[1].gia_mua,null);assert.equal(Number(rows[0].gia_boi_thuong),150000);
  const detail=(await db.query('SELECT * FROM chi_tiet_su_co')).rows[0];
  assert.equal(detail.ma_thiet_bi,'TB00000001');assert.equal(Number(detail.don_gia_ap_dung),90000);assert.equal(Number(detail.thanh_tien),90000);
  const meta=await scalar(db,'SELECT thong_tin_bo_sung FROM bao_cao_su_co');
  assert.equal(meta.equipmentCode,'TB00000001');assert.equal(meta.damageItems[0].equipmentCode,'TB00000001');
  assert.equal(meta.legacyEquipmentHistory[0].equipment.ma_thiet_bi,'TB00000021');
  assert.deepEqual((await scalar(db,'SELECT ket_qua_checkout FROM dat_san')).equipmentIds,['TB00000001','TB00000021']);
  assert.equal(await scalar(db,"SELECT mo_ta_hu_hai FROM bang_gia_den_bu WHERE ma_danh_muc_den_bu='DB00000001'"),'asset:TB00000001');
  await db.exec(migration);assert.equal(await scalar(db,'SELECT count(*)::int FROM thiet_bi'),21);
  assert.equal(await scalar(db,"SELECT courtx_next_id('TB')"),'TB00000022');
 }finally{await db.close();}
});
test('new form prices persist in explicit columns; Table Editor edits sync current prices without rewriting historical charges',async()=>{
 const db=await fixture();
 try{
  await db.exec(migration);
  const input={name:'New equipment',sportType:'BongDa',purchasePrice:300000,compensationPrice:200000,
   healthRate:'New',supplier:'Supplier',supplierPhone:'0900000001',warrantyAddress:'Service address',notes:'Notes',purchaseDate:'2026-11-03',warrantyExpire:'2027-11-03'};
  const code=await scalar(db,'SELECT courtx_save_equipment($1::jsonb)',[JSON.stringify(input)]);
  const row=(await db.query('SELECT * FROM thiet_bi WHERE ma_thiet_bi=$1',[code])).rows[0];
  assert.equal(code,'TB00000022');assert.equal(Number(row.gia_mua),300000);assert.equal(Number(row.gia_boi_thuong),200000);
  assert.equal(row.nha_cung_cap,'Supplier');assert.equal(row.sdt_ncc,'0900000001');assert.equal(row.thong_tin_bo_sung.warrantyAddress,'Service address');assert.equal(row.thong_tin_bo_sung.notes,'Notes');
  await db.exec("UPDATE thiet_bi SET gia_mua=NULL,gia_boi_thuong=180000 WHERE ma_thiet_bi='TB00000001'");
  assert.equal(await scalar(db,"SELECT thong_tin_bo_sung->'purchasePrice' FROM thiet_bi WHERE ma_thiet_bi='TB00000001'"),null);
  assert.equal(Number(await scalar(db,"SELECT don_gia_den_bu FROM bang_gia_den_bu WHERE ma_danh_muc_den_bu='DB00000001'")),180000);
  assert.equal(Number(await scalar(db,'SELECT don_gia_ap_dung FROM chi_tiet_su_co')),90000);
  const edited=await scalar(db,'SELECT courtx_save_equipment($1::jsonb,$2)',[JSON.stringify({...input,name:'Updated equipment',purchasePrice:null,compensationPrice:220000,supplier:'Updated supplier',notes:'Updated notes'}),code]);
  assert.equal(edited,code);
  const updated=(await db.query('SELECT * FROM thiet_bi WHERE ma_thiet_bi=$1',[code])).rows[0];
  assert.equal(updated.ten_thiet_bi,'Updated equipment');assert.equal(updated.gia_mua,null);
  assert.equal(Number(updated.gia_boi_thuong),220000);assert.equal(updated.nha_cung_cap,'Updated supplier');
  assert.equal(updated.thong_tin_bo_sung.notes,'Updated notes');
  assert.equal(Number(await scalar(db,'SELECT don_gia_den_bu FROM bang_gia_den_bu WHERE ma_danh_muc_den_bu=$1',[updated.thong_tin_bo_sung.compensationItemId])),220000);
  assert.equal(await scalar(db,'SELECT count(*)::int FROM thiet_bi'),22);
  assert.equal(Number(await scalar(db,'SELECT don_gia_ap_dung FROM chi_tiet_su_co')),90000);
  await assert.rejects(db.exec("UPDATE thiet_bi SET gia_mua=-1 WHERE ma_thiet_bi='TB00000001'"));
  await assert.rejects(db.exec("UPDATE thiet_bi SET gia_boi_thuong=1.5 WHERE ma_thiet_bi='TB00000001'"));
  await assert.rejects(db.exec("UPDATE thiet_bi SET gia_boi_thuong=NULL WHERE ma_thiet_bi='TB00000001'"));
 }finally{await db.close();}
});
