import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
import {randomBytes,scryptSync} from 'node:crypto';
const passwords={ADMIN:process.env.COURTX_RESET_ADMIN_PASSWORD,STAFF:process.env.COURTX_RESET_STAFF_PASSWORD};
if(!Object.values(passwords).every(value=>value&&value.length>=6))throw Error('Set COURTX_RESET_ADMIN_PASSWORD and COURTX_RESET_STAFF_PASSWORD for this one-time operation.');
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const {data:rows,error}=await db.from('nhan_vien').select('ma_nhan_vien,vai_tro').order('ma_nhan_vien');
if(error)throw error;
for(const row of rows){
  if(!passwords[row.vai_tro])throw Error('Unexpected account role; not modified.');
  const salt=randomBytes(16).toString('hex');
  const hash=`scrypt:${salt}:${scryptSync(passwords[row.vai_tro],salt,64).toString('hex')}`;
  const saved=await db.from('nhan_vien').update({mat_khau:hash}).eq('ma_nhan_vien',row.ma_nhan_vien).eq('vai_tro',row.vai_tro).select('ma_nhan_vien');
  if(saved.error||saved.data?.length!==1)throw Error('Could not reset '+row.ma_nhan_vien);
  console.log(JSON.stringify({id:row.ma_nhan_vien,role:row.vai_tro,result:'password updated'}));
}
