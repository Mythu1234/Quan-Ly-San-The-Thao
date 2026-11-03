import 'dotenv/config';
import {writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const apply=process.argv.includes('--apply');
async function run(query){const result=await query.abortSignal(AbortSignal.timeout(20000));if(result.error)throw result.error;return result.data;}
const [assets,prices,details,reports,bookings]=await Promise.all([
 run(db.from('thiet_bi').select('*')),run(db.from('bang_gia_den_bu').select('*,bo_mon(ten_bo_mon)')),
 run(db.from('chi_tiet_su_co').select('*')),run(db.from('bao_cao_su_co').select('ma_su_co,thong_tin_bo_sung')),
 run(db.from('dat_san').select('ma_dat_san,ket_qua_checkout'))]);
const key=p=>JSON.stringify([p.ten_vat_tu.normalize('NFC').trim().toLocaleLowerCase('vi-VN'),p.ma_bo_mon,Number(p.don_gia_den_bu),p.don_vi_tinh]);
const unique=new Map(),aliases=new Map();
for(const price of prices.filter(p=>!p.da_an).sort((a,b)=>a.ma_danh_muc_den_bu.localeCompare(b.ma_danh_muc_den_bu))){
 if(!Number.isSafeInteger(Number(price.don_gia_den_bu))||Number(price.don_gia_den_bu)<0)throw Error('Invalid price '+price.ma_danh_muc_den_bu);
 const canonical=unique.get(key(price));
 if(canonical)aliases.set(price.ma_danh_muc_den_bu,canonical.ma_danh_muc_den_bu);else unique.set(key(price),price);
}
const legacy=assets.filter(a=>!a.thong_tin_bo_sung?.isCatalogItem);
console.log(JSON.stringify({catalogItems:unique.size,duplicatePrices:aliases.size,legacyAssets:legacy.length,mode:apply?'apply':'preview'}));
if(!apply)process.exit(0);
await writeFile(new URL('../equipment-catalog-backup.local',import.meta.url),JSON.stringify({assets,prices,details,reports,bookings},null,2),{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
let sequence=Math.max(0,...assets.map(a=>Number(a.ma_thiet_bi.match(/^TB(\d{8})$/)?.[1]||0)));
const catalogByPrice=new Map();
for(const price of unique.values()){
 let existing=assets.find(a=>a.thong_tin_bo_sung?.isCatalogItem&&!a.da_xoa
   &&(a.thong_tin_bo_sung.compensationItemId===price.ma_danh_muc_den_bu||price.mo_ta_hu_hai===`asset:${a.ma_thiet_bi}`));
 const sport=/chuyền/i.test(price.bo_mon?.ten_bo_mon||'')?'BongChuyen':/đá/i.test(price.bo_mon?.ten_bo_mon||'')?'BongDa':price.ma_bo_mon?'CauLong':'DungChung';
 const extra={...(existing?.thong_tin_bo_sung||{}),isCatalogItem:true,compensationItemId:price.ma_danh_muc_den_bu,
  compensationPrice:Number(price.don_gia_den_bu),sportType:sport,unit:price.don_vi_tinh,description:price.mo_ta_hu_hai};
 if(!existing){
  const id='TB'+String(++sequence).padStart(8,'0');
  existing=(await run(db.from('thiet_bi').insert({ma_thiet_bi:id,ten_thiet_bi:price.ten_vat_tu,so_seri:null,
   trang_thai:'san_sang',thong_tin_bo_sung:extra,da_xoa:false}).select('*')))[0];
 }else if(existing.ten_thiet_bi!==price.ten_vat_tu||JSON.stringify(existing.thong_tin_bo_sung)!==JSON.stringify(extra)){
  await run(db.from('thiet_bi').update({ten_thiet_bi:price.ten_vat_tu,thong_tin_bo_sung:extra}).eq('ma_thiet_bi',existing.ma_thiet_bi));
 }
 catalogByPrice.set(price.ma_danh_muc_den_bu,existing.ma_thiet_bi);
}
// Preserve the original equipment identity and detail row before relinking any history.
for(const report of reports){
 const linked=details.filter(d=>d.ma_su_co===report.ma_su_co&&legacy.some(a=>a.ma_thiet_bi===d.ma_thiet_bi));
 if(!linked.length)continue;
 const old=report.thong_tin_bo_sung||{};
 if(!old.legacyEquipmentHistory){
  const saved=await run(db.from('bao_cao_su_co').update({thong_tin_bo_sung:{...old,legacyEquipmentHistory:linked.map(d=>({detail:d,equipment:legacy.find(a=>a.ma_thiet_bi===d.ma_thiet_bi)}))}})
   .eq('ma_su_co',report.ma_su_co).eq('thong_tin_bo_sung',JSON.stringify(old)).select('ma_su_co'));
  if(saved.length!==1)throw Error('Report changed concurrently: '+report.ma_su_co);
 }
}
for(const booking of bookings){
 const value=booking.ket_qua_checkout;
 const oldAssets=legacy.filter(a=>value?.equipmentIds?.includes(a.ma_thiet_bi));
 if(oldAssets.length&&!value.legacyEquipmentHistory){
  const saved=await run(db.from('dat_san').update({ket_qua_checkout:{...value,legacyEquipmentHistory:oldAssets}})
   .eq('ma_dat_san',booking.ma_dat_san).eq('ket_qua_checkout',JSON.stringify(value)).select('ma_dat_san'));
  if(saved.length!==1)throw Error('Checkout changed concurrently: '+booking.ma_dat_san);
 }
}
for(const detail of details){
 const priceId=aliases.get(detail.ma_danh_muc_den_bu)||detail.ma_danh_muc_den_bu;
 const isLegacy=legacy.some(a=>a.ma_thiet_bi===detail.ma_thiet_bi);
 if(isLegacy||priceId!==detail.ma_danh_muc_den_bu){
  const patch={ma_danh_muc_den_bu:priceId,...(isLegacy?{ma_thiet_bi:catalogByPrice.get(priceId)||null}:{})};
  await run(db.from('chi_tiet_su_co').update(patch).eq('ma_chi_tiet',detail.ma_chi_tiet));
 }
}
for(const duplicate of aliases.keys())await run(db.from('bang_gia_den_bu').update({da_an:true}).eq('ma_danh_muc_den_bu',duplicate));
for(const asset of legacy){
 const references=await run(db.from('chi_tiet_su_co').select('ma_chi_tiet').eq('ma_thiet_bi',asset.ma_thiet_bi));
 if(references.length)throw Error('Legacy asset still referenced: '+asset.ma_thiet_bi);
 await run(db.from('thiet_bi').delete().eq('ma_thiet_bi',asset.ma_thiet_bi));
}
console.log(JSON.stringify({saved:catalogByPrice.size,hiddenDuplicates:aliases.size,removedLegacy:legacy.length}));
