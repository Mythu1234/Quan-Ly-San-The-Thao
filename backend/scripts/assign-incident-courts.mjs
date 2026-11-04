import 'dotenv/config';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';

const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const apply=process.argv.includes('--apply');
async function run(query){const result=await query.abortSignal(AbortSignal.timeout(15000));if(result.error)throw result.error;return result.data;}
const targets={SC00000001:'SAN00000006',SC00000002:'SAN00000007',SC00000003:'SAN00000001',SC00000004:'SAN00000002'};
const [reports,courts]=await Promise.all([
 run(db.from('bao_cao_su_co').select('*')),
 run(db.from('san').select('ma_san,ten_san')),
]);
const missing=reports.filter(row=>!row.ma_dat_san&&!row.thong_tin_bo_sung?.courtId&&!row.thong_tin_bo_sung?.courtName);
const changes=missing.map(row=>{
 assert.ok(targets[row.ma_su_co],'Unexpected incident: review before assigning a court.');
 const court=courts.find(c=>c.ma_san===targets[row.ma_su_co]);assert.ok(court);
 return {row,court};
});
console.log(JSON.stringify({mode:apply?'apply':'preview',changes:changes.map(({row,court})=>({id:row.ma_su_co,court:court.ten_san}))}));
if(!apply)process.exit(0);
if(changes.length)await writeFile(new URL(`../incident-court-assignment-${Date.now()}.local`,import.meta.url),JSON.stringify(missing,null,2),{flag:'wx'});
for(const {row,court} of changes){
 const extra=row.thong_tin_bo_sung||{};
 const updated=await run(db.from('bao_cao_su_co').update({thong_tin_bo_sung:{...extra,courtId:court.ma_san,courtName:court.ten_san,
  courtAssignmentSource:'owner_requested_assignment',courtAssignedAt:new Date().toISOString()}})
  .eq('ma_su_co',row.ma_su_co).eq('thong_tin_bo_sung',JSON.stringify(extra)).select('ma_su_co'));
 assert.equal(updated.length,1,'Incident changed concurrently.');
}
const response=await fetch('http://localhost:5000/api/incidents',{signal:AbortSignal.timeout(15000)});
assert.ok(response.ok);const {data}=await response.json();
for(const {row,court} of changes){const saved=data.find(i=>i.id===row.ma_su_co);assert.equal(saved.courtId,court.ma_san);assert.equal(saved.courtName,court.ten_san);}
console.log(JSON.stringify({updated:changes.length,verified:true}));
