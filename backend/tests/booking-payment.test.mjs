import {test,before,beforeEach,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
const db=new PGlite();
const scalar=async(sql,params=[])=>Object.values((await db.query(sql,params)).rows[0])[0];
const request=()=>({courtCode:'CL-01',bookingDate:'2099-11-03',startTime:'20:00',endTime:'21:30',customerName:'Khách thử',customerPhone:'0900000000',totalAmount:180000,bankTransactionCode:'BANK-TEST-001',paymentConfirmed:true});
const create=(input=request())=>scalar('SELECT courtx_create_paid_booking($1::jsonb)',[JSON.stringify(input)]);
before(async()=>{
  const schema=await readFile(new URL('../../frontend/docs/supabase_schema.sql',import.meta.url),'utf8');
  await db.exec(schema.slice(0,schema.indexOf('-- 3. CẤU HÌNH')).replace(/CREATE EXTENSION[^;]+;/g,''));
  const migration=await readFile(new URL('../migrations/20261103_booking_payment.sql',import.meta.url),'utf8');
  await db.exec(migration);await db.exec(migration);
});
beforeEach(async()=>{
  await db.exec(`TRUNCATE bo_mon,san,khach_hang,dat_san,thanh_toan CASCADE;
    INSERT INTO bo_mon(ma_bo_mon,ten_bo_mon,don_gia_gio) VALUES('BM00000001','Cầu lông',120000);
    INSERT INTO san(ma_san,ten_san,ma_bo_mon) VALUES('SAN00000001','Sân CL-01','BM00000001');`);
});
after(()=>db.close());
test('booking and VietQR payment persist together with database IDs and historical hourly rate',async()=>{
  assert.equal(await create(),'DS00000001');
  const booking=(await db.query('SELECT * FROM dat_san')).rows[0];
  const payment=(await db.query('SELECT * FROM thanh_toan')).rows[0];
  assert.equal(booking.ma_khach_hang,'KH00000001');assert.equal(Number(booking.don_gia_gio),120000);
  assert.equal(payment.ma_thanh_toan,'TT00000001');assert.equal(payment.ma_dat_san,booking.ma_dat_san);
  assert.equal(Number(payment.so_tien),180000);assert.equal(payment.ma_giao_dich_ngan_hang,'BANK-TEST-001');
  assert.equal(await create(),'DS00000001');assert.equal(await scalar('SELECT count(*)::int FROM thanh_toan'),1);
});
test('missing confirmation, bank reference, wrong price, occupied or locked court cannot create paid bookings',async()=>{
  for(const patch of [{paymentConfirmed:false},{bankTransactionCode:''},{totalAmount:1}])await assert.rejects(create({...request(),...patch}));
  assert.equal(await scalar('SELECT count(*)::int FROM dat_san'),0);
  await db.exec("UPDATE san SET trang_thai='bao_tri'");await assert.rejects(create(),/khóa/);
  await db.exec("UPDATE san SET trang_thai='san_sang'");await create();
  await assert.rejects(create({...request(),bankTransactionCode:'BANK-TEST-002'}),/lượt đặt khác/);
  await assert.rejects(create({...request(),endTime:'22:00',totalAmount:240000}),/giao dịch khác/);
});
test('a payment insert failure rolls back the booking and new customer',async()=>{
  await db.exec(`CREATE FUNCTION reject_payment_test() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'payment storage failed'; END$$;
    CREATE TRIGGER reject_payment_test BEFORE INSERT ON thanh_toan FOR EACH ROW EXECUTE FUNCTION reject_payment_test();`);
  try {await assert.rejects(create(),/payment storage failed/);
    assert.equal(await scalar('SELECT count(*)::int FROM dat_san'),0);
    assert.equal(await scalar('SELECT count(*)::int FROM khach_hang'),0);
  }finally{await db.exec('DROP TRIGGER reject_payment_test ON thanh_toan; DROP FUNCTION reject_payment_test();');}
});
test('sequential allocation retains existing historical IDs without renaming',async()=>{
  await create();
  assert.equal(await create({...request(),startTime:'18:00',endTime:'19:30',bankTransactionCode:'BANK-TEST-002'}),'DS00000002');
  assert.equal(await scalar("SELECT ma_thanh_toan FROM thanh_toan WHERE ma_dat_san='DS00000002'"),'TT00000002');
});
