import 'dotenv/config';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const read=async table=>{const r=await db.from(table).select('*').abortSignal(AbortSignal.timeout(15000));if(r.error)throw r.error;return r.data;};
const [assets,prices,details]=await Promise.all(['thiet_bi','bang_gia_den_bu','chi_tiet_su_co'].map(read));
const visible=prices.filter(p=>!p.da_an);
assert.equal(assets.length,visible.length);
const unique=new Set();
for(const asset of assets){
 assert.equal(asset.thong_tin_bo_sung.isCatalogItem,true);
 const price=visible.find(p=>p.ma_danh_muc_den_bu===asset.thong_tin_bo_sung.compensationItemId||p.mo_ta_hu_hai===`asset:${asset.ma_thiet_bi}`);
 assert.ok(price);assert.equal(asset.ten_thiet_bi,price.ten_vat_tu);assert.equal(asset.thong_tin_bo_sung.compensationPrice,Number(price.don_gia_den_bu));
 const key=JSON.stringify([asset.ten_thiet_bi,asset.thong_tin_bo_sung.sportType]);assert.ok(!unique.has(key));unique.add(key);
}
const before=JSON.parse(await readFile(new URL('../equipment-catalog-backup.local',import.meta.url),'utf8'));
assert.equal(details.length,before.details.length);
for(const old of before.details){
 const current=details.find(d=>d.ma_chi_tiet===old.ma_chi_tiet);assert.ok(current);
 for(const field of ['ma_su_co','don_gia_ap_dung','so_luong_hu_hai','thanh_tien','mo_ta_chi_tiet'])assert.equal(current[field],old[field]);
}
for(const path of ['equipments','compensation-prices']){
 const result=await fetch(`http://localhost:5174/api/${path}`,{signal:AbortSignal.timeout(15000)});
 assert.equal(result.status,200);const response=await result.json();assert.equal(response.data.length,assets.length);
}
console.log(JSON.stringify({catalogItems:assets.length,hiddenDuplicates:prices.filter(p=>p.da_an).length,historicalDetailsPreserved:details.length,api:'OK'}));
