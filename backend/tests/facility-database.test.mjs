import {before,after,beforeEach,test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

const db=new PGlite();
const sql=async(text,params=[])=>db.query(text,params);
const scalar=async(text,params=[])=>Object.values((await sql(text,params)).rows[0])[0];
const rpc=(name,value)=>scalar(`SELECT ${name}($1::jsonb)`,[JSON.stringify(value)]);
const request=(reports=[],expectedAmount=0)=>({reference:'2026-11-03:DS00000001',bookingCode:'DS00000001',bookingDate:'2026-11-03',courtName:'Sân CL-01',remainingBalance:0,expectedAmount,paymentConfirmed:expectedAmount>0,reports,bankTransactionCode:'TEST-QR-001'});
const report=(liability='DO_KHACH_LAM_HONG')=>({id:'draft-id',title:'Rách lưới',description:'Lưới bị rách tại góc trái',reporterPhone:'0912345678',courtName:'Sân CL-01',compensationItemId:'DB00000001',equipmentCode:'TB00000001',liability,compensationPrice:1,images:['data:image/png;base64,test']});
before(async()=>{
  const schema=await readFile(new URL('../../frontend/docs/supabase_schema.sql',import.meta.url),'utf8');
  await db.exec(schema.slice(0,schema.indexOf('-- 3. CẤU HÌNH')).replace(/CREATE EXTENSION[^;]+;/g,''));
  const migration=await readFile(new URL('../migrations/20261103_facility_supabase.sql',import.meta.url),'utf8');
  await db.exec(migration);
  await db.exec(migration); // Safe to re-run without losing existing rows.
});
beforeEach(async()=>{
  await db.exec(`TRUNCATE nhan_vien,khach_hang,bo_mon,san,dat_san,thanh_toan,hoan_tien,thiet_bi,bang_gia_den_bu,bao_cao_su_co,chi_tiet_su_co CASCADE;
    INSERT INTO nhan_vien(ma_nhan_vien,ho_ten,so_dien_thoai,email,mat_khau) VALUES('NV00000001','Nhân viên thử','0912345678','test@example.invalid','test');
    INSERT INTO khach_hang(ma_khach_hang,ho_ten,so_dien_thoai) VALUES('KH00000001','Khách thử','0900000000');
    INSERT INTO bo_mon(ma_bo_mon,ten_bo_mon,don_gia_gio) VALUES('BM00000001','Cầu lông',120000);
    INSERT INTO san(ma_san,ten_san,ma_bo_mon) VALUES('SAN00000001','Sân CL-01','BM00000001');
    INSERT INTO dat_san(ma_dat_san,ma_san,ma_khach_hang,ngay_dat,gio_bat_dau,gio_ket_thuc,don_gia_gio,tong_tien_san,trang_thai)
      VALUES('DS00000001','SAN00000001','KH00000001','2026-11-03','08:00','09:00',120000,120000,'DA_THANH_TOAN');
    INSERT INTO thanh_toan(ma_thanh_toan,ma_dat_san,so_tien,loai_giao_dich) VALUES('TT00000001','DS00000001',120000,'THANH_TOAN_DAT_SAN');
    INSERT INTO thiet_bi(ma_thiet_bi,ten_thiet_bi,ma_san,so_seri) VALUES('TB00000001','Lưới cầu lông','SAN00000001','SERIAL-001'),('TB00000002','Cột trụ','SAN00000001','SERIAL-002');
    INSERT INTO bang_gia_den_bu(ma_danh_muc_den_bu,ten_vat_tu,don_gia_den_bu,don_vi_tinh) VALUES('DB00000001','Lưới cầu lông',150000,'tấm');`);
});
after(()=>db.close());
const checkin=()=>sql("SELECT courtx_checkin('DS00000001','2026-11-03')");
test('check-in requires paid booking and an unlocked, available court; repeated check-in is safe',async()=>{
  await sql("UPDATE san SET trang_thai='bao_tri'");
  await assert.rejects(checkin(),/khóa/);
  assert.equal(await scalar('SELECT thoi_gian_checkin FROM dat_san'),null);
  await sql("UPDATE san SET trang_thai='san_sang'");
  await sql('UPDATE thanh_toan SET so_tien=100');
  await assert.rejects(checkin(),/100%/);
  await sql('UPDATE thanh_toan SET so_tien=120000');
  await checkin();await checkin();
  assert.equal(await scalar('SELECT trang_thai FROM dat_san'),'DANG_SU_DUNG');
  assert.equal(await scalar('SELECT trang_thai FROM san'),'dang_su_dung');
  assert.equal(await scalar("SELECT count(*)::int FROM thiet_bi WHERE trang_thai='dang_su_dung'"),2);
});
test('checkout without damage recalls equipment and creates no extra payment',async()=>{
  await checkin();
  await sql("UPDATE thiet_bi SET trang_thai='bao_tri' WHERE ma_thiet_bi='TB00000002'");
  const result=await rpc('courtx_checkout',request());
  assert.equal(result.receipt.amountPaid,0);
  assert.equal(await scalar('SELECT count(*)::int FROM thanh_toan'),1);
  assert.equal(await scalar('SELECT trang_thai FROM dat_san'),'HOAN_TAT');
  assert.equal(await scalar('SELECT count(*)::int FROM thiet_bi WHERE ma_san IS NULL'),2);
  assert.equal(await scalar("SELECT trang_thai FROM thiet_bi WHERE ma_thiet_bi='TB00000002'"),'bao_tri');
  assert.deepEqual(await rpc('courtx_checkout',request()),result);
});
test('customer damage uses database price; payment/price failures roll back reports and equipment changes',async()=>{
  await checkin();
  await assert.rejects(rpc('courtx_checkout',request([report()],1)),/thay đổi/);
  assert.equal(await scalar('SELECT count(*)::int FROM bao_cao_su_co'),0);
  assert.equal(await scalar("SELECT trang_thai FROM thiet_bi WHERE ma_thiet_bi='TB00000001'"),'dang_su_dung');
  await assert.rejects(rpc('courtx_checkout',{...request([report()],150000),paymentConfirmed:false}),/VietQR/);
  await assert.rejects(rpc('courtx_checkout',{...request([report()],150000),bankTransactionCode:''}),/mã giao dịch/);
  assert.equal(await scalar('SELECT count(*)::int FROM bao_cao_su_co'),0);
  const result=await rpc('courtx_checkout',request([report()],150000));
  assert.equal(result.receipt.amountPaid,150000);
  assert.equal(await scalar("SELECT so_tien::int FROM thanh_toan WHERE loai_giao_dich='THANH_TOAN_BOI_THUONG'"),150000);
  assert.equal(await scalar("SELECT trang_thai FROM thiet_bi WHERE ma_thiet_bi='TB00000001'"),'hong');
  assert.equal(await scalar("SELECT don_gia_ap_dung::int FROM chi_tiet_su_co"),150000);
  assert.deepEqual(await rpc('courtx_checkout',request([report()],150000)),result);
  assert.equal(await scalar('SELECT count(*)::int FROM thanh_toan'),2);
});
test('venue liability has no compensation payment but retains damage history and images',async()=>{
  await checkin();
  await rpc('courtx_checkout',request([report('BAO_HANH_SAN_VAN_DONG')]));
  assert.equal(await scalar('SELECT count(*)::int FROM thanh_toan'),1);
  assert.equal(await scalar('SELECT tong_tien_den_bu::int FROM bao_cao_su_co'),0);
  assert.deepEqual(await scalar("SELECT thong_tin_bo_sung->'images' FROM bao_cao_su_co"),report().images);
});
test('existing report keeps historical price and may not be omitted at checkout',async()=>{
  await checkin();
  const id=await rpc('courtx_save_incident',{...report(),bookingCode:'DS00000001'});
  await sql('UPDATE bang_gia_den_bu SET don_gia_den_bu=300000');
  await assert.rejects(rpc('courtx_checkout',request()),/Còn báo cáo/);
  await rpc('courtx_checkout',request([{...report(),id}],150000));
  assert.equal(await scalar('SELECT count(*)::int FROM bao_cao_su_co'),1);
  assert.equal(await scalar('SELECT don_gia_ap_dung::int FROM chi_tiet_su_co'),150000);
});
test('serial identity, supplier, warranty and per-asset price persist; duplicate serial is rejected',async()=>{
  const asset={name:'Thiết bị mới',serialNumber:'SERIAL-003',currentLocation:'Kho chung',status:'san_sang',purchaseDate:'2026-11-03',warrantyExpire:'2027-11-03',supplier:'NCC thử',supplierPhone:'0901111111',compensationPrice:450000,category:'tru_luoi'};
  const id=await scalar('SELECT courtx_save_equipment($1::jsonb)',[JSON.stringify(asset)]);
  assert.match(id,/^TB\d{8}$/);
  assert.equal(await scalar('SELECT nha_cung_cap FROM thiet_bi WHERE ma_thiet_bi=$1',[id]),asset.supplier);
  assert.equal(await scalar("SELECT don_gia_den_bu::int FROM bang_gia_den_bu WHERE mo_ta_hu_hai=$1",['asset:'+id]),450000);
  await assert.rejects(scalar('SELECT courtx_save_equipment($1::jsonb)',[JSON.stringify(asset)]),/unique/);
});
test('maintenance acceptance updates equipment and preserves one timeline entry on retry',async()=>{
  const id=await rpc('courtx_save_incident',report('BAO_HANH_SAN_VAN_DONG'));
  await sql('SELECT courtx_complete_maintenance($1)',['TB00000001']);
  await sql('SELECT courtx_complete_maintenance($1)',['TB00000001']);
  assert.equal(await scalar("SELECT trang_thai FROM thiet_bi WHERE ma_thiet_bi='TB00000001'"),'san_sang');
  assert.equal(await scalar("SELECT jsonb_array_length(thong_tin_bo_sung->'timelineLogs') FROM bao_cao_su_co WHERE ma_su_co=$1",[id]),1);
});
