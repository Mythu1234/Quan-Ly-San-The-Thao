// One-time repair of the two exact bookings whose receipts the owner confirmed in chat.
// Run without --apply to inspect. No bank reference is invented.
import 'dotenv/config';
import {createClient} from '@supabase/supabase-js';
const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}});
const confirmed=[
  {code:'DS09398827',amount:180000,court:'Sân CL-03',start:'20:30:00',end:'22:00:00'},
  {code:'DS08547310',amount:120000,court:'Sân CL-02',start:'20:00:00',end:'21:00:00'},
];
async function inspect(expected){
  const {data,error}=await db.from('dat_san').select('ma_dat_san,ngay_dat,gio_bat_dau,gio_ket_thuc,tong_tien_san,trang_thai,san(ten_san),thanh_toan(ma_thanh_toan,so_tien,trang_thai,loai_giao_dich)').eq('ma_dat_san',expected.code).single();
  if(error)throw error;
  if(data.ngay_dat!=='2026-11-03'||data.san.ten_san!==expected.court||data.gio_bat_dau!==expected.start||data.gio_ket_thuc!==expected.end||Number(data.tong_tien_san)!==expected.amount||!['DA_THANH_TOAN','DANG_SU_DUNG'].includes(data.trang_thai))throw Error('Booking no longer matches the confirmed receipt: '+expected.code);
  const paid=data.thanh_toan.filter(p=>p.trang_thai==='THANH_CONG'&&p.loai_giao_dich==='THANH_TOAN_DAT_SAN').reduce((sum,p)=>sum+Number(p.so_tien),0);
  return paid;
}
for(const expected of confirmed){
  const paid=await inspect(expected);
  if(paid===expected.amount){console.log(JSON.stringify({code:expected.code,result:'already recorded',paid}));continue;}
  if(paid!==0)throw Error('Partial/unexpected payment requires separate reconciliation: '+expected.code);
  if(!process.argv.includes('--apply')){console.log(JSON.stringify({code:expected.code,result:'missing confirmed payment',amount:expected.amount}));continue;}
  const {data:id,error:idError}=await db.rpc('courtx_next_id',{p_prefix:'TT'});
  if(idError)throw idError;
  // Re-check immediately before inserting; a second run skips already recorded receipts.
  if(await inspect(expected)!==0)throw Error('Payment changed during reconciliation. Retry inspection only.');
  const {error}=await db.from('thanh_toan').insert({ma_thanh_toan:id,ma_dat_san:expected.code,so_tien:expected.amount,phuong_thuc_thanh_toan:'VIETQR',loai_giao_dich:'THANH_TOAN_DAT_SAN',trang_thai:'THANH_CONG',ma_giao_dich_ngan_hang:null,
    ghi_chu:'Bổ sung bản ghi bị thiếu từ luồng đặt cũ. Chủ sân xác nhận đã thu đủ qua VietQR trong phiên hỗ trợ ngày 03/11/2026. Chưa cung cấp mã giao dịch ngân hàng; không phải xác thực ngân hàng tự động.'});
  if(error)throw error;
  if(await inspect(expected)!==expected.amount)throw Error('Could not verify recorded payment: '+expected.code);
  console.log(JSON.stringify({code:expected.code,paymentId:id,result:'recorded owner-confirmed receipt',paid:expected.amount}));
}
