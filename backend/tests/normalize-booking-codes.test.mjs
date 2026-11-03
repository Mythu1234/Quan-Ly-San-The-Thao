import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration=await readFile(new URL('../migrations/20261103_normalize_booking_codes.sql',import.meta.url),'utf8');
async function fixture(){
 const db=new PGlite();
 await db.exec(`CREATE TABLE dat_san(ma_dat_san text PRIMARY KEY,ngay_dat date,trang_thai text,tong_tien_san numeric,ket_qua_checkout jsonb);
 CREATE TABLE thanh_toan(ma_thanh_toan text PRIMARY KEY,ma_dat_san text REFERENCES dat_san,so_tien numeric,ma_giao_dich_ngan_hang text);
 CREATE TABLE bien_nhan(id text PRIMARY KEY,ma_dat_san text REFERENCES dat_san,ma_thanh_toan text REFERENCES thanh_toan);
 CREATE TABLE hoan_tien(id text PRIMARY KEY,ma_dat_san text REFERENCES dat_san,ma_thanh_toan_goc text REFERENCES thanh_toan);
 CREATE TABLE bao_cao_su_co(id text PRIMARY KEY,ma_dat_san text REFERENCES dat_san,thong_tin_bo_sung jsonb);
 CREATE TABLE thiet_bi(id text PRIMARY KEY,thong_tin_bo_sung jsonb);
 INSERT INTO dat_san VALUES('DS10199488','2026-11-03','DANG_SU_DUNG',120000,NULL),
 ('DS08547310','2026-11-03','HOAN_TAT',120000,'{"receipt":{"bookingCode":"DS08547310","reference":"2026-11-03:DS08547310","amountPaid":0}}');
 INSERT INTO thanh_toan VALUES('TT10199488','DS10199488',120000,'BANK-ORIGINAL'),('TT08547310','DS08547310',120000,NULL);
 INSERT INTO bien_nhan VALUES('BN1','DS10199488','TT10199488');
 INSERT INTO hoan_tien VALUES('HT1','DS08547310','TT08547310');
 INSERT INTO bao_cao_su_co VALUES('SC1','DS10199488','{"bookingCode":"DS10199488","timeline":[{"checkoutReference":"2026-11-03:DS10199488"}]}');
 INSERT INTO thiet_bi VALUES('TB1','{"assignedBookingCode":"DS10199488","serial":"SERIAL-1"}');`);
 return db;
}
test('normalization preserves money, bank references, foreign keys and nested checkout history; rerun is safe',async()=>{
 const db=await fixture();
 try{
  const constraints=(await db.query("SELECT conname,condeferrable,condeferred FROM pg_constraint WHERE contype='f' ORDER BY conname")).rows;
  // Execute the update and result query as separate autocommit requests, as an SQL editor may do.
  const boundary=migration.indexOf('END $normalize$;')+'END $normalize$;'.length;
  assert.ok(boundary>'END $normalize$;'.length);
  await db.exec(migration.slice(0,boundary));
  await db.exec(migration.slice(boundary));
  assert.deepEqual((await db.query('SELECT * FROM thanh_toan ORDER BY ma_thanh_toan')).rows,[
   {ma_thanh_toan:'TT00000043',ma_dat_san:'DS00000043',so_tien:'120000',ma_giao_dich_ngan_hang:null},
   {ma_thanh_toan:'TT00000044',ma_dat_san:'DS00000042',so_tien:'120000',ma_giao_dich_ngan_hang:'BANK-ORIGINAL'}]);
  assert.equal((await db.query('SELECT ma_thanh_toan FROM bien_nhan')).rows[0].ma_thanh_toan,'TT00000044');
  assert.equal((await db.query('SELECT ma_thanh_toan_goc FROM hoan_tien')).rows[0].ma_thanh_toan_goc,'TT00000043');
  assert.deepEqual((await db.query("SELECT ket_qua_checkout FROM dat_san WHERE ma_dat_san='DS00000043'")).rows[0].ket_qua_checkout,
   {receipt:{bookingCode:'DS00000043',reference:'2026-11-03:DS00000043',amountPaid:0}});
  assert.equal((await db.query('SELECT thong_tin_bo_sung FROM thiet_bi')).rows[0].thong_tin_bo_sung.assignedBookingCode,'DS00000042');
  assert.equal((await db.query('SELECT thong_tin_bo_sung FROM bao_cao_su_co')).rows[0].thong_tin_bo_sung.timeline[0].checkoutReference,'2026-11-03:DS00000042');
  assert.deepEqual((await db.query("SELECT conname,condeferrable,condeferred FROM pg_constraint WHERE contype='f' ORDER BY conname")).rows,constraints);
  await db.exec(migration);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM dat_san')).rows[0].n,2);
 }finally{await db.close();}
});
test('occupied destination aborts every change',async()=>{
 const db=await fixture();
 try{
  await db.exec("INSERT INTO dat_san(ma_dat_san) VALUES('DS00000042')");
  await assert.rejects(db.exec(migration),/Destination ID already exists/);
  assert.equal((await db.query("SELECT ma_dat_san FROM thanh_toan WHERE ma_thanh_toan='TT10199488'")).rows[0].ma_dat_san,'DS10199488');
 }finally{await db.close();}
});
test('a history write failure rolls back ID changes and restores original constraints',async()=>{
 const db=await fixture();
 try{
  await db.exec(`CREATE FUNCTION reject_history() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'history write failed'; END$$;
   CREATE TRIGGER reject_history BEFORE UPDATE ON thiet_bi FOR EACH ROW EXECUTE FUNCTION reject_history();`);
  await assert.rejects(db.exec(migration),/history write failed/);
  assert.equal((await db.query("SELECT ma_dat_san FROM thanh_toan WHERE ma_thanh_toan='TT10199488'")).rows[0].ma_dat_san,'DS10199488');
  assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_constraint WHERE contype='f' AND condeferrable")).rows[0].n,0);
 }finally{await db.close();}
});
