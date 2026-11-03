import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const fixture={ma_dat_san:'DS00000001',ngay_dat:'2026-11-04',gio_bat_dau:'12:00:00',gio_ket_thuc:'13:00:00',trang_thai:'DA_THANH_TOAN',tong_tien_san:120000,
  khach_hang:{ho_ten:'Khách kiểm thử',so_dien_thoai:'0901234567'},san:{ten_san:'Sân CL-01',bo_mon:{ten_bo_mon:'Cầu lông'}},
  thanh_toan:[{so_tien:120000,trang_thai:'THANH_CONG',loai_giao_dich:'THANH_TOAN_DAT_SAN'},{so_tien:150000,trang_thai:'THANH_CONG',loai_giao_dich:'THANH_TOAN_BOI_THUONG'}],hoan_tien:[]};
let filter,queryCount=0,failure=false;
const rentalExports={};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/services/rentalPayment.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:rentalExports,require:name=>name==='../lib/supabaseClient.js'?{supabase:{}}:{databaseError:error=>{throw Error(error.message);}}});
const source=readFileSync(new URL('../src/services/customerLookupService.ts',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};
vm.runInNewContext(code,{exports,Date,Error,console,require:name=>{
  if(name==='./rentalPayment.js')return rentalExports;
  if(name==='../repositories/facilityRepository.js')return {databaseError:error=>{throw Error(error.message);}};
  if(name==='../lib/supabaseClient.js')return {supabase:{from:table=>{
    assert.equal(table,'dat_san');queryCount++;
    return {select:columns=>{
      assert.ok(columns.includes('khach_hang!inner'));
      return {eq:(field,value)=>{filter={field,value};return {order:()=>({limit:async()=>({error:failure?{message:'Database offline'}:null,
        data:field==='ma_dat_san'&&value===fixture.ma_dat_san||field==='khach_hang.so_dien_thoai'&&value===fixture.khach_hang.so_dien_thoai?[fixture]:[]})})};}};
    }};
  }}};
  throw Error(`Unexpected dependency ${name}`);
}});
const {normalizeLookupInput:normalize,mapCustomerBooking:map,lookupCustomerBookings:lookup}=exports;
test('phone and code normalization accept exact identifiers only',()=>{
  assert.equal(normalize('  #ds00000001 ').value,'DS00000001');
  for(const input of ['090 123 4567','+84 90 123 4567','84901234567'])assert.equal(normalize(input).value,'0901234567');
  for(const input of ['',null,'0901','%','DS00000001 OR true','DS00000001%'])assert.throws(()=>normalize(input),{status:400});
});
test('lookup filters Supabase by exact booking code or phone, with no demo fallback',async()=>{
  const rows=await lookup('DS00000001');
  assert.equal(rows.length,1);assert.equal(rows[0].name,fixture.khach_hang.ho_ten);
  assert.equal(filter.field,'ma_dat_san');assert.equal(filter.value,fixture.ma_dat_san);
  assert.equal((await lookup('+84 90 123 4567')).length,1);
  assert.equal(filter.field,'khach_hang.so_dien_thoai');
  assert.equal((await lookup('DS99999999')).length,0);
  const before=queryCount;await assert.rejects(lookup('%'));assert.equal(queryCount,before);
  failure=true;
  try{await assert.rejects(lookup('DS00000001'),/Database offline/);}finally{failure=false;}
});
test('lookup uses stored amounts/status and Vietnam time instead of fixed sample values',()=>{
  const row=map(fixture,new Date('2026-11-03T05:00:00Z'));
  assert.equal(row.hoursUntilStart,24);assert.equal(row.total,'120.000đ');assert.equal(row.paidAmount,'120.000đ');
  assert.equal(row.remaining,'0đ');assert.equal(row.status,'ĐÃ XÁC NHẬN');assert.equal(row.canCancel,false);
  const cancelled=map({...fixture,trang_thai:'DA_HUY',hoan_tien:[{so_tien_hoan:120000,trang_thai:'THANH_CONG'},{so_tien_hoan:50000,trang_thai:'THAT_BAI'}]});
  assert.equal(cancelled.refundAmount,'120.000đ');assert.equal(cancelled.refundStatus,'Đã hoàn tiền');
});
