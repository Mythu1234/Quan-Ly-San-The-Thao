import {supabase} from '../lib/supabaseClient.js';
import {databaseError} from '../repositories/facilityRepository.js';
export function rentalPayment(row:any) {
  const total=Number(row.tong_tien_san)||0;
  const rows=(row.thanh_toan||[]).filter((payment:any)=>payment.loai_giao_dich==='THANH_TOAN_DAT_SAN');
  const recorded=rows.filter((payment:any)=>payment.trang_thai==='THANH_CONG').reduce((sum:number,payment:any)=>sum+Number(payment.so_tien),0);
  // Legacy bookings were saved as fully paid while the separate payment insert could fail.
  // A paid database status is authoritative only when no rental transaction contradicts it.
  const legacyConfirmed=rows.length===0&&['DA_THANH_TOAN','DANG_SU_DUNG','HOAN_TAT'].includes(row.trang_thai);
  return {paid:legacyConfirmed?total:recorded,remaining:Math.max(0,total-(legacyConfirmed?total:recorded)),legacyConfirmed};
}
export function createRentalPaymentReconciler(db:any=supabase) {
  return async(code:string,date:string)=>{
    const {data:row,error}=await db.from('dat_san').select('ma_dat_san,ngay_dat,trang_thai,tong_tien_san,thanh_toan(so_tien,trang_thai,loai_giao_dich)').eq('ma_dat_san',code).eq('ngay_dat',date).maybeSingle();
    if(error)databaseError(error);
    if(!row||!['DA_THANH_TOAN','DANG_SU_DUNG'].includes(row.trang_thai)||!rentalPayment(row).legacyConfirmed)return;
    const total=Number(row.tong_tien_san);
    if(!Number.isSafeInteger(total)||total<=0)throw Error('Tổng tiền sân không hợp lệ.');
    const sequence=Number(code.match(/\d+$/)?.[0]||1);
    // Deterministic candidates plus primary-key conflicts make repeat/concurrent repairs safe.
    // Never reuse an existing transaction ID belonging to another booking.
    for(let attempt=0;attempt<100;attempt++){
      const existing=await db.from('thanh_toan').select('ma_thanh_toan').eq('ma_dat_san',code).eq('loai_giao_dich','THANH_TOAN_DAT_SAN');
      if(existing.error)databaseError(existing.error);
      if(existing.data?.length)return;
      const id='TT'+String(((sequence-1+attempt)%99999999)+1).padStart(8,'0');
      const used=await db.from('thanh_toan').select('ma_thanh_toan').eq('ma_thanh_toan',id).maybeSingle();
      if(used.error)databaseError(used.error);
      if(used.data)continue;
      const saved=await db.from('thanh_toan').insert({ma_thanh_toan:id,ma_dat_san:code,so_tien:total,phuong_thuc_thanh_toan:'VIETQR',loai_giao_dich:'THANH_TOAN_DAT_SAN',trang_thai:'THANH_CONG',ma_giao_dich_ngan_hang:null,
        ghi_chu:'Đồng bộ dữ liệu cũ theo trạng thái '+row.trang_thai+' đã xác nhận đủ 100% tiền sân trong dat_san. Không thu tiền mới; không tạo mã giao dịch ngân hàng giả.'});
      if(saved.error?.code==='23505')continue;
      if(saved.error)databaseError(saved.error);
      return;
    }
    throw Error('Chưa cấp được mã đồng bộ thanh toán. Vui lòng thử lại.');
  };
}
export const reconcileConfirmedRental=createRentalPaymentReconciler();
