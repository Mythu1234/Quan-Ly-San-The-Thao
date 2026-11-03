import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('processing progress is independent of liability, including legacy data and new reports',async()=>{
 const db=new PGlite();
 try{
  const schema=await readFile(new URL('../../frontend/docs/supabase_schema.sql',import.meta.url),'utf8');
  await db.exec(schema.slice(0,schema.indexOf('-- 3. CẤU HÌNH')).replace(/CREATE EXTENSION[^;]+;/g,''));
  await db.exec(await readFile(new URL('../migrations/20261103_facility_supabase.sql',import.meta.url),'utf8'));
  await db.exec(`INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,so_dien_thoai,email,mat_khau)
    VALUES('NV00000001','Staff','0912345678','staff@example.invalid','test');
    INSERT INTO bang_gia_den_bu(ma_danh_muc_den_bu,ten_vat_tu,don_gia_den_bu,don_vi_tinh)
    VALUES('DB00000001','Net',150000,'unit');
    INSERT INTO bao_cao_su_co(ma_su_co,ma_nhan_vien,nguyen_nhan,tong_tien_den_bu)
    VALUES('SC00000001','NV00000001','BAO_HANH_SAN_VAN_DONG',0),
    ('SC00000002','NV00000001','DO_KHACH_LAM_HONG',150000);
    INSERT INTO chi_tiet_su_co(ma_chi_tiet,ma_su_co,ma_danh_muc_den_bu,don_gia_ap_dung,thanh_tien)
    VALUES('CT00000001','SC00000001','DB00000001',100000,100000);`);
  const migration=await readFile(new URL('../migrations/20261104_incident_processing_status.sql',import.meta.url),'utf8');
  await db.exec(migration);await db.exec(migration);
  const row=async id=>(await db.query('SELECT * FROM bao_cao_su_co WHERE ma_su_co=$1',[id])).rows[0];
  assert.equal((await row('SC00000001')).trang_thai_xu_ly,'CHO_XU_LY');
  assert.equal((await row('SC00000002')).trang_thai_xu_ly,'CHO_XU_LY');
  assert.equal(Number((await row('SC00000002')).tong_tien_den_bu),150000);
  for(const [status,column] of [['dang_sua_chua','DANG_SUA_CHUA'],['da_khac_phuc','DA_XU_LY'],['cho_xu_ly','CHO_XU_LY']]){
   await db.query('SELECT courtx_patch_incident($1,$2::jsonb)',['SC00000001',JSON.stringify({status})]);
   const report=await row('SC00000001');assert.equal(report.trang_thai_xu_ly,column);
   assert.equal(report.thong_tin_bo_sung.status,status);assert.equal(report.thong_tin_bo_sung.compensationPaymentStatus,'not_required');
  }
  await db.query("SELECT courtx_patch_incident('SC00000001',$1::jsonb)",[JSON.stringify({newLog:{id:'log-1',title:'Repair progress'}})]);
  assert.equal((await row('SC00000001')).thong_tin_bo_sung.timelineLogs.length,1);
  await assert.rejects(db.query("SELECT courtx_patch_incident('SC00000001','{\"status\":\"invalid\"}')"),/Trạng thái/);
  for(const liability of ['BAO_HANH_SAN_VAN_DONG','DO_KHACH_LAM_HONG']){
   const result=await db.query('SELECT courtx_save_incident($1::jsonb) AS id',[JSON.stringify({title:'Damage',description:'Net damaged',reporterPhone:'0912345678',compensationItemId:'DB00000001',liability})]);
   const saved=await row(result.rows[0].id);assert.equal(saved.trang_thai_xu_ly,'CHO_XU_LY');
   assert.equal(Number(saved.tong_tien_den_bu),liability==='DO_KHACH_LAM_HONG'?150000:0);
  }
  // Old RPCs that explicitly write the old enum remain compatible.
  await db.exec("UPDATE bao_cao_su_co SET trang_thai_xu_ly='CHO_BOI_THUONG',tong_tien_den_bu=999 WHERE ma_su_co='SC00000001'");
  assert.equal((await row('SC00000001')).trang_thai_xu_ly,'CHO_XU_LY');
  assert.equal(Number((await row('SC00000001')).tong_tien_den_bu),0);
  assert.equal(Number((await db.query('SELECT don_gia_ap_dung FROM chi_tiet_su_co')).rows[0].don_gia_ap_dung),100000);
 }finally{await db.close();}
});
