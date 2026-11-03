import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const {data,error}=await db.from('nhan_vien').select('ma_nhan_vien,ho_ten,vai_tro').abortSignal(AbortSignal.timeout(20000));
if(error)throw error;
for(const row of data){
  if(row.vai_tro!=='STAFF')continue;
  const name=row.ho_ten.replace(/\s*\((?:thu ngân|vận hành|kỹ thuật|lễ tân)\)\s*$/iu,'').trim();
  if(name===row.ho_ten)continue;
  if(!process.argv.includes('--apply')){console.log(JSON.stringify({id:row.ma_nhan_vien,name}));continue;}
  const saved=await db.from('nhan_vien').update({ho_ten:name}).eq('ma_nhan_vien',row.ma_nhan_vien).eq('ho_ten',row.ho_ten).select('ma_nhan_vien,ho_ten,vai_tro').abortSignal(AbortSignal.timeout(20000));
  if(saved.error)throw saved.error;
  console.log(JSON.stringify(saved.data));
}
