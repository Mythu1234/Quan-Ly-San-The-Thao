import 'dotenv/config';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';

// One-time renumbering after the owner-requested cleanup. Preview by default.
const apply=process.argv.includes('--apply');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
async function request(query){const r=await query.abortSignal(AbortSignal.timeout(20000));if(r.error)throw r.error;return r.data;}
const [reports,details,bookings]=await Promise.all([
  request(db.from('bao_cao_su_co').select('*').order('ngay_tao').order('ma_su_co')),
  request(db.from('chi_tiet_su_co').select('*').order('ma_chi_tiet')),
  request(db.from('dat_san').select('ma_dat_san,ket_qua_checkout')),
]);
const expected=['SC00000022','SC00000023','SC00000024','SC00000025'];
const target=expected.map((_,i)=>'SC'+String(i+1).padStart(8,'0'));
if(JSON.stringify(reports.map(r=>r.ma_su_co))===JSON.stringify(target)){
  console.log(JSON.stringify({alreadyNormalized:true,codes:target}));process.exit(0);
}
assert.deepEqual(reports.map(r=>r.ma_su_co),expected,'Reports changed: review before renumbering.');
assert.equal(details.length,4);
const map=new Map(expected.map((id,i)=>[id,target[i]]));
const detailMap=new Map();
for(const [index,report] of reports.entries()){
  const items=details.filter(d=>d.ma_su_co===report.ma_su_co);assert.equal(items.length,1);
  detailMap.set(items[0].ma_chi_tiet,'CT'+String(index+1).padStart(8,'0'));
}
const allCodes=new Map([...map,...detailMap]);
// Audit snapshots intentionally retain the original IDs, including deleted reports.
const archiveKeys=new Set(['archivedIncidents','catalogCorrection','legacyEquipmentHistory','legacyAssets']);
function rewrite(value){
  if(typeof value==='string')return allCodes.get(value)||value;
  if(Array.isArray(value))return value.map(rewrite);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,archiveKeys.has(key)?v:rewrite(v)]));
  return value;
}
console.log(JSON.stringify({mode:apply?'apply':'preview',reports:Object.fromEntries(map),details:Object.fromEntries(detailMap)}));
if(!apply)process.exit(0);
await writeFile(new URL(`../incident-renumber-${Date.now()}.local`,import.meta.url),JSON.stringify({reports,details,bookings},null,2),{flag:'wx'});
// Create destination parents before moving children: no disabling FK constraints.
const inserted=await request(db.from('bao_cao_su_co').insert(reports.map(r=>({...r,ma_su_co:map.get(r.ma_su_co),thong_tin_bo_sung:rewrite(r.thong_tin_bo_sung)}))).select('ma_su_co'));
assert.equal(inserted.length,4);
for(const detail of details){
  const updated=await request(db.from('chi_tiet_su_co').update({ma_su_co:map.get(detail.ma_su_co),ma_chi_tiet:detailMap.get(detail.ma_chi_tiet)})
    .eq('ma_chi_tiet',detail.ma_chi_tiet).eq('ma_su_co',detail.ma_su_co).select('ma_chi_tiet'));
  assert.equal(updated.length,1);
}
for(const booking of bookings){
  const old=booking.ket_qua_checkout;if(!old)continue;const next=rewrite(old);
  if(JSON.stringify(old)===JSON.stringify(next))continue;
  const updated=await request(db.from('dat_san').update({ket_qua_checkout:next}).eq('ma_dat_san',booking.ma_dat_san).eq('ket_qua_checkout',JSON.stringify(old)).select('ma_dat_san'));
  assert.equal(updated.length,1);
}
const removed=await request(db.from('bao_cao_su_co').delete().in('ma_su_co',expected).select('ma_su_co'));
assert.equal(removed.length,4);
const [savedReports,savedDetails]=await Promise.all([
  request(db.from('bao_cao_su_co').select('*').order('ma_su_co')),
  request(db.from('chi_tiet_su_co').select('*').order('ma_chi_tiet')),
]);
assert.equal(savedReports.length,4);assert.equal(savedDetails.length,4);
for(const old of reports){const saved=savedReports.find(r=>r.ma_su_co===map.get(old.ma_su_co));assert.ok(saved);
  assert.deepEqual(saved,{...old,ma_su_co:map.get(old.ma_su_co),thong_tin_bo_sung:rewrite(old.thong_tin_bo_sung)});
}
for(const old of details){const saved=savedDetails.find(r=>r.ma_chi_tiet===detailMap.get(old.ma_chi_tiet));assert.ok(saved);
  assert.deepEqual(saved,{...old,ma_su_co:map.get(old.ma_su_co),ma_chi_tiet:detailMap.get(old.ma_chi_tiet)});
}
console.log(JSON.stringify({verified:true,codes:savedReports.map(r=>r.ma_su_co),detailCodes:savedDetails.map(r=>r.ma_chi_tiet),pricesAndDatesPreserved:true}));
