import 'dotenv/config';
import {writeFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const apply=process.argv.includes('--apply');
const result=await db.from('thiet_bi').select('*').order('ma_thiet_bi').abortSignal(AbortSignal.timeout(20000));
if(result.error)throw result.error;
const rows=result.data.filter(row=>!row.da_xoa&&row.thong_tin_bo_sung?.isCatalogItem);
const changes=rows.filter(row=>row.gia_mua===null).map(row=>{
 const compensation=Number(row.gia_boi_thuong);
 if(!Number.isSafeInteger(compensation)||compensation<=0||!Number.isSafeInteger(compensation+50000))throw Error('Invalid compensation price: '+row.ma_thiet_bi);
 return {row,purchase:compensation+50000};
});
console.log(JSON.stringify({mode:apply?'apply':'preview',missingPurchasePrices:changes.length,rule:'compensation + 50000 VND'}));
if(!apply)process.exit(0);
if(changes.length)await writeFile(new URL('../purchase-prices-backup.local',import.meta.url),JSON.stringify(changes.map(c=>c.row),null,2),{flag:'wx'}).catch(error=>{if(error.code!=='EEXIST')throw error;});
for(const {row,purchase} of changes){
 const updated=await db.from('thiet_bi').update({gia_mua:purchase,thong_tin_bo_sung:{...row.thong_tin_bo_sung,
  purchasePrice:purchase,purchasePriceSource:'compensation_plus_50000_user_requested'}})
  .eq('ma_thiet_bi',row.ma_thiet_bi).is('gia_mua',null).eq('gia_boi_thuong',row.gia_boi_thuong)
  .eq('thong_tin_bo_sung',JSON.stringify(row.thong_tin_bo_sung)).select('ma_thiet_bi,gia_mua,gia_boi_thuong')
  .abortSignal(AbortSignal.timeout(20000));
 if(updated.error)throw updated.error;
 if(updated.data.length!==1)throw Error('Equipment changed concurrently: '+row.ma_thiet_bi);
 console.log(JSON.stringify(updated.data[0]));
}
if(changes.length){
 const saved=await db.from('thiet_bi').select('ma_thiet_bi,gia_mua,gia_boi_thuong,thong_tin_bo_sung').in('ma_thiet_bi',changes.map(c=>c.row.ma_thiet_bi)).abortSignal(AbortSignal.timeout(20000));
 if(saved.error)throw saved.error;
 if(saved.data.length!==changes.length)throw Error('Verification count differs');
 for(const change of changes){const row=saved.data.find(r=>r.ma_thiet_bi===change.row.ma_thiet_bi);
  if(Number(row.gia_mua)!==change.purchase||Number(row.thong_tin_bo_sung.purchasePrice)!==change.purchase||Number(row.gia_boi_thuong)!==Number(change.row.gia_boi_thuong))throw Error('Price verification failed: '+row.ma_thiet_bi);
 }
}
console.log(JSON.stringify({updated:changes.length,verified:true}));
