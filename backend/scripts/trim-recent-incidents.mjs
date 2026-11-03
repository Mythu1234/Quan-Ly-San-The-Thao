import 'dotenv/config';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';

// One-time cleanup requested by the owner. Preview by default; --apply writes.
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const apply=process.argv.includes('--apply');
async function request(query){const result=await query.abortSignal(AbortSignal.timeout(20000));if(result.error)throw result.error;return result.data;}
const [reports,details,equipment,prices,bookings]=await Promise.all([
  request(db.from('bao_cao_su_co').select('*').order('ngay_tao',{ascending:false}).order('ma_su_co',{ascending:false})),
  request(db.from('chi_tiet_su_co').select('*')),
  request(db.from('thiet_bi').select('*')),
  request(db.from('bang_gia_den_bu').select('*')),
  request(db.from('dat_san').select('ma_dat_san,ket_qua_checkout')),
]);
const retained=reports.slice(0,4),removed=reports.slice(4),removedIds=removed.map(r=>r.ma_su_co);
// Explicit corrections to the four legacy reports; never rewrite customer charges.
const targets={SC00000022:'TB00000004',SC00000023:'TB00000006',SC00000024:'TB00000020',SC00000025:'TB00000018'};
assert.deepEqual(retained.map(r=>r.ma_su_co).sort(),Object.keys(targets).sort(),'Dataset changed; review the latest reports before applying.');
const changes=retained.map(report=>{
  assert.equal(report.nguyen_nhan,'BAO_HANH_SAN_VAN_DONG');assert.equal(Number(report.tong_tien_den_bu),0);
  const items=details.filter(d=>d.ma_su_co===report.ma_su_co);assert.equal(items.length,1);
  const asset=equipment.find(e=>e.ma_thiet_bi===targets[report.ma_su_co]&&!e.da_xoa);assert.ok(asset);
  const price=prices.find(p=>p.ma_danh_muc_den_bu===asset.thong_tin_bo_sung.compensationItemId&&!p.da_an);assert.ok(price);
  assert.equal(price.ten_vat_tu,asset.ten_thiet_bi);assert.equal(Number(price.don_gia_den_bu),Number(asset.gia_boi_thuong));
  return {report,detail:items[0],asset,price};
});
console.log(JSON.stringify({mode:apply?'apply':'preview',deleteReports:removed.length,keep:changes.map(c=>({id:c.report.ma_su_co,equipment:c.asset.ten_thiet_bi,unitPrice:Number(c.asset.gia_boi_thuong),quantity:c.detail.so_luong_hu_hai,customerCharge:0}))}));
if(!apply)process.exit(0);
const now=new Date().toISOString();
const backup=new URL(`../incident-cleanup-${now.replace(/[:.]/g,'-')}.local`,import.meta.url);
await writeFile(backup,JSON.stringify({createdAt:now,reports,details,equipment,prices,bookings},null,2),{flag:'wx'});
// Keep the original incident records inside any completed settlement that references them.
for(const booking of bookings){
  const checkout=booking.ket_qua_checkout;if(!checkout)continue;
  const refs=new Set([...(checkout.incidentIds||[]),...(checkout.receipt?.incidentIds||[])]);
  const archived=removed.filter(r=>refs.has(r.ma_su_co));if(!archived.length)continue;
  const history=[...(checkout.archivedIncidents||[])];
  for(const report of archived)if(!history.some(h=>h.report.ma_su_co===report.ma_su_co))history.push({report,details:details.filter(d=>d.ma_su_co===report.ma_su_co),archivedAt:now});
  const saved=await request(db.from('dat_san').update({ket_qua_checkout:{...checkout,archivedIncidents:history}}).eq('ma_dat_san',booking.ma_dat_san).eq('ket_qua_checkout',JSON.stringify(checkout)).select('ma_dat_san'));
  assert.equal(saved.length,1,'Settlement changed during cleanup.');
}
for(const {report,detail,asset,price} of changes){
  const unit=Number(asset.gia_boi_thuong);
  const saved=await request(db.from('chi_tiet_su_co').update({ma_thiet_bi:asset.ma_thiet_bi,ma_danh_muc_den_bu:price.ma_danh_muc_den_bu,don_gia_ap_dung:unit,thanh_tien:unit*Number(detail.so_luong_hu_hai)}).eq('ma_chi_tiet',detail.ma_chi_tiet).select('ma_chi_tiet'));
  assert.equal(saved.length,1);
  const metadata={...report.thong_tin_bo_sung,title:`Sự cố ${asset.ten_thiet_bi}`,equipmentName:asset.ten_thiet_bi,
    compensationPaymentStatus:'not_required',catalogCorrection:report.thong_tin_bo_sung?.catalogCorrection||{at:now,originalReport:report,originalDetail:detail}};
  // Rebuild detail display from database joins rather than stale cached damageItems.
  delete metadata.damageItems;
  const updated=await request(db.from('bao_cao_su_co').update({thong_tin_bo_sung:metadata}).eq('ma_su_co',report.ma_su_co).select('ma_su_co'));
  assert.equal(updated.length,1);
}
if(removedIds.length){
  // FK ON DELETE CASCADE removes the associated chi_tiet_su_co rows atomically.
  const deleted=await request(db.from('bao_cao_su_co').delete().in('ma_su_co',removedIds).select('ma_su_co'));
  assert.equal(deleted.length,removedIds.length);
}
const remaining=await request(db.from('bao_cao_su_co').select('ma_su_co'));
assert.deepEqual(remaining.map(r=>r.ma_su_co).sort(),retained.map(r=>r.ma_su_co).sort());
const remainingDetails=await request(db.from('chi_tiet_su_co').select('*'));
assert.equal(remainingDetails.length,4);
for(const {report,asset,price} of changes){const d=remainingDetails.find(d=>d.ma_su_co===report.ma_su_co);assert.ok(d);assert.equal(d.ma_thiet_bi,asset.ma_thiet_bi);assert.equal(d.ma_danh_muc_den_bu,price.ma_danh_muc_den_bu);assert.equal(Number(d.don_gia_ap_dung),Number(asset.gia_boi_thuong));}
console.log(JSON.stringify({deleted:removedIds.length,remainingReports:remaining.length,remainingDetails:remainingDetails.length,verified:true,backup:backup.pathname.split('/').pop()}));
