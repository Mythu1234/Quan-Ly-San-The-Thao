import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const migration=await readFile(new URL('../migrations/20261103_normalize_customer_codes.sql',import.meta.url),'utf8');
async function fixture(){
 const db=new PGlite();
 await db.exec(`CREATE TABLE khach_hang(ma_khach_hang text PRIMARY KEY,ho_ten text,so_dien_thoai text,ngay_tao timestamptz);
 CREATE TABLE dat_san(code text PRIMARY KEY,ma_khach_hang text REFERENCES khach_hang,trang_thai text);
 INSERT INTO khach_hang VALUES('KH00000017','Existing','0900000017','2026-11-03'),
 ('KH10988930','Customer A','0900000018','2026-11-03 04:37:32+00'),
 ('KH08546729','Customer B','0900000023','2026-11-03 12:22:27+00');
 INSERT INTO dat_san VALUES('DS00000038','KH10988930','DANG_SU_DUNG'),
 ('DS00000040','KH10988930','HOAN_TAT'),('DS00000047','KH08546729','DANG_SU_DUNG');`);
 return db;
}
test('customer normalization preserves identity and all bookings, restores constraints and supports reruns',async()=>{
 const db=await fixture();
 try{
  const original=(await db.query('SELECT ho_ten,so_dien_thoai,ngay_tao FROM khach_hang ORDER BY ho_ten')).rows;
  const boundary=migration.indexOf('END $normalize$;')+'END $normalize$;'.length;
  await db.exec(migration.slice(0,boundary));await db.exec(migration.slice(boundary));
  assert.deepEqual((await db.query('SELECT ho_ten,so_dien_thoai,ngay_tao FROM khach_hang ORDER BY ho_ten')).rows,original);
  assert.deepEqual((await db.query('SELECT ma_khach_hang FROM dat_san ORDER BY code')).rows.map(r=>r.ma_khach_hang),['KH00000018','KH00000018','KH00000023']);
  assert.equal((await db.query("SELECT condeferrable FROM pg_constraint WHERE contype='f'")).rows[0].condeferrable,false);
  await db.exec(migration);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM khach_hang')).rows[0].n,3);
  const allocation=await readFile(new URL('../migrations/20261103_booking_payment.sql',import.meta.url),'utf8');
  await db.exec(allocation.slice(allocation.indexOf('CREATE OR REPLACE FUNCTION'),allocation.indexOf('CREATE OR REPLACE FUNCTION public.courtx_create_paid_booking')));
  assert.equal((await db.query("SELECT courtx_booking_next_id('KH') AS code")).rows[0].code,'KH00000024');
 }finally{await db.close();}
});
test('destination collision aborts without changing customers or booking links',async()=>{
 const db=await fixture();
 try{
  await db.exec("INSERT INTO khach_hang(ma_khach_hang) VALUES('KH00000018')");
  await assert.rejects(db.exec(migration),/Destination customer ID already exists/);
  assert.equal((await db.query("SELECT ma_khach_hang FROM dat_san WHERE code='DS00000038'")).rows[0].ma_khach_hang,'KH10988930');
 }finally{await db.close();}
});
