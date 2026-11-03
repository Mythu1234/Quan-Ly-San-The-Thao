import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const code=ts.transpileModule(readFileSync(new URL('../src/services/rentalPayment.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const exports={};vm.runInNewContext(code,{exports,require:name=>name==='../lib/supabaseClient.js'?{supabase:{}}:{databaseError:error=>{throw Error(error.message);}}});
const {rentalPayment,createRentalPaymentReconciler}=exports;
test('database paid/in-use status means 100% paid for legacy missing rental rows; pending/cancelled/failed payments are not inferred paid',()=>{
  for(const status of ['DA_THANH_TOAN','DANG_SU_DUNG','HOAN_TAT']){
    const payment=rentalPayment({tong_tien_san:120000,trang_thai:status,thanh_toan:[]});
    assert.equal(payment.paid,120000);assert.equal(payment.remaining,0);
  }
  for(const status of ['CHO_THANH_TOAN','DA_HUY'])assert.equal(rentalPayment({tong_tien_san:120000,trang_thai:status,thanh_toan:[]}).paid,0);
  const row={tong_tien_san:120000,trang_thai:'DA_THANH_TOAN',thanh_toan:[{loai_giao_dich:'THANH_TOAN_DAT_SAN',trang_thai:'THAT_BAI',so_tien:120000}]};
  assert.equal(rentalPayment(row).paid,0);
  row.thanh_toan=[{loai_giao_dich:'THANH_TOAN_DAT_SAN',trang_thai:'THANH_CONG',so_tien:50000},{loai_giao_dich:'THANH_TOAN_BOI_THUONG',trang_thai:'THANH_CONG',so_tien:70000}];
  assert.equal(rentalPayment(row).paid,50000);assert.equal(rentalPayment(row).remaining,70000);
});
function fixture(){
  const state={booking:{ma_dat_san:'DS00000001',ngay_dat:'2026-11-03',trang_thai:'DA_THANH_TOAN',tong_tien_san:120000},payments:[],fail:false};
  const db={from(table){const filters=[];let inserted;
    const run=()=>{
      if(state.fail)return {data:null,error:{message:'database unavailable'}};
      if(inserted){if(state.payments.some(payment=>payment.ma_thanh_toan===inserted.ma_thanh_toan))return {data:null,error:{code:'23505'}};state.payments.push(inserted);return {data:null,error:null};}
      const rows=table==='dat_san'?[{...state.booking,thanh_toan:state.payments.filter(payment=>payment.ma_dat_san===state.booking.ma_dat_san)}]:state.payments;
      return {data:rows.filter(row=>filters.every(([key,value])=>row[key]===value)),error:null};
    };
    const query={select(){return query;},eq(key,value){filters.push([key,value]);return query;},insert(value){inserted=value;return query;},async maybeSingle(){const result=run();return {...result,data:result.data?.[0]||null};},then(resolve,reject){return Promise.resolve().then(run).then(resolve,reject);}};
    return query;
  }};
  return {state,reconcile:createRentalPaymentReconciler(db)};
}
test('legacy payment normalization uses database amount and is safe for retry/concurrent actions and ID collisions',async()=>{
  const {state,reconcile}=fixture();state.payments.push({ma_thanh_toan:'TT00000001',ma_dat_san:'DS00000002',loai_giao_dich:'THANH_TOAN_BOI_THUONG',trang_thai:'THANH_CONG',so_tien:50000});
  await Promise.all([reconcile('DS00000001','2026-11-03'),reconcile('DS00000001','2026-11-03')]);await reconcile('DS00000001','2026-11-03');
  const rows=state.payments.filter(payment=>payment.ma_dat_san==='DS00000001');assert.equal(rows.length,1);
  assert.equal(rows[0].ma_thanh_toan,'TT00000002');assert.equal(rows[0].so_tien,120000);assert.equal(rows[0].ma_giao_dich_ngan_hang,null);
  assert.equal(rows[0].trang_thai,'THANH_CONG');assert.equal(state.booking.trang_thai,'DA_THANH_TOAN');
});
test('normalization never creates payments for pending/cancelled or partially/unsuccessfully paid rows, and surfaces failures',async()=>{
  for(const status of ['CHO_THANH_TOAN','DA_HUY','HOAN_TAT']){const {state,reconcile}=fixture();state.booking.trang_thai=status;await reconcile('DS00000001','2026-11-03');assert.equal(state.payments.length,0);}
  for(const status of ['THAT_BAI','THANH_CONG']){const {state,reconcile}=fixture();state.payments.push({ma_thanh_toan:'TT00000001',ma_dat_san:'DS00000001',loai_giao_dich:'THANH_TOAN_DAT_SAN',trang_thai:status,so_tien:100});await reconcile('DS00000001','2026-11-03');assert.equal(state.payments.length,1);}
  const {state,reconcile}=fixture();state.fail=true;await assert.rejects(reconcile('DS00000001','2026-11-03'),/unavailable/);assert.equal(state.payments.length,0);
});
test('checkout validates stored payment instead of trusting a stale browser balance',async()=>{
  let passed;
  const service={};
  const source=ts.transpileModule(readFileSync(new URL('../src/services/checkoutService.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{exports:service,require:name=>{
    if(name==='../lib/supabaseClient.js')return {supabase:{rpc:async(_name,args)=>{passed=args.p_request;return {data:{receipt:{}},error:null};}}};
    if(name==='./rentalPayment.js')return {reconcileConfirmedRental:async()=>{}};
    return {databaseError:error=>{throw Error(error.message);},facilityRepository:{expandCheckout:value=>value}};
  }});
  const input={reference:'2026-11-03:DS00000001',bookingCode:'DS00000001',bookingDate:'2026-11-03',reports:[],expectedAmount:0,remainingBalance:120000};
  await service.completeCheckout(input);assert.equal(passed.remainingBalance,0);assert.equal(input.remainingBalance,120000);assert.equal(passed.expectedAmount,0);
});
