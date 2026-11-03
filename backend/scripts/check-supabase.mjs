import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
if(!process.env.SUPABASE_URL||!process.env.SUPABASE_ANON_KEY)throw Error('Thiếu backend/.env');
const client=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const timeout=setTimeout(()=>{console.error('Kết nối Supabase hết thời gian chờ.');process.exit(1);},20000);
try {
  const results=await Promise.all(['san','thiet_bi','dat_san','thanh_toan','bao_cao_su_co','chi_tiet_su_co','bang_gia_den_bu'].map(async table=>{
    const {count,error}=await client.from(table).select('*',{head:true,count:'exact'}).abortSignal(AbortSignal.timeout(15000));
    if(error)throw Error(`${table}: ${error.message}`);
    return {table,rows:count};
  }));
  console.table(results);
  const {data,error}=await client.rpc('courtx_facility_schema_version');
  if(error||data!==1)throw Error('Chưa áp dụng migration cơ sở vật chất. Chạy migrations/20261103_facility_supabase.sql trong Supabase SQL Editor.');
  console.log('OK: Supabase và migration check-in / checkout / cơ sở vật chất đã sẵn sàng.');
  // Empty input is rejected before any write; checks the new RPC without creating test rows.
  const booking=await client.rpc('courtx_create_paid_booking',{p_request:{}});
  if(booking.error?.code==='PGRST202')throw Error('Chưa áp dụng migration đặt sân/thanh toán. Chạy migrations/20261103_booking_payment.sql trong Supabase SQL Editor.');
  if(booking.error?.code!=='P0001')throw Error('Chưa xác nhận được hàm tạo đơn/thanh toán: '+(booking.error?.message||'Kết quả không mong đợi'));
  console.log('OK: Hàm lưu đồng thời lượt đặt và thanh toán đã sẵn sàng.');
}catch(error){console.error(error.message);process.exitCode=1;}finally{clearTimeout(timeout);}
