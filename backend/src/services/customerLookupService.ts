import {supabase} from '../lib/supabaseClient.js';
import {databaseError} from '../repositories/facilityRepository.js';
import {rentalPayment} from './rentalPayment.js';

export function normalizeLookupInput(input:unknown):{kind:'phone'|'code';value:string} {
  if(typeof input!=='string'||input.length>64)throw Object.assign(Error('Nhập mã đặt sân hoặc số điện thoại hợp lệ.'),{status:400});
  const query=input.trim();
  const phone=query.replace(/[\s().-]/g,'').replace(/^\+84/,'0').replace(/^84(?=\d{9}$)/,'0');
  if(/^0[35789]\d{8}$/.test(phone))return {kind:'phone',value:phone};
  const code=query.replace(/^#/,'').toUpperCase();
  if(/^DS\d{8}$/.test(code))return {kind:'code',value:code};
  throw Object.assign(Error('Nhập mã đặt sân gồm DS và 8 chữ số, hoặc số điện thoại 10 số.'),{status:400});
}
const money=(amount:number)=>`${amount.toLocaleString('vi-VN')}đ`;
export function mapCustomerBooking(row:any,instant=new Date()) {
  const total=Number(row.tong_tien_san);
  const {paid,remaining}=rentalPayment(row);
  const refunded=(row.hoan_tien||[]).filter((item:any)=>item.trang_thai==='THANH_CONG').reduce((sum:number,item:any)=>sum+Number(item.so_tien_hoan),0);
  const statuses:Record<string,string>={CHO_THANH_TOAN:'CHỜ THANH TOÁN',DA_THANH_TOAN:'ĐÃ XÁC NHẬN',DANG_SU_DUNG:'ĐANG SỬ DỤNG',HOAN_TAT:'ĐÃ KẾT THÚC',DA_HUY:'ĐÃ HỦY'};
  const sport=row.san.bo_mon.ten_bo_mon;
  return {code:row.ma_dat_san,name:row.khach_hang.ho_ten,phone:row.khach_hang.so_dien_thoai,sport,court:row.san.ten_san,
    bookingDate:row.ngay_dat,date:row.ngay_dat.split('-').reverse().join('/'),time:`${row.gio_bat_dau.slice(0,5)} - ${row.gio_ket_thuc.slice(0,5)}`,
    total:money(total),paidAmount:money(paid),remaining:money(remaining),
    status:statuses[row.trang_thai]||row.trang_thai,paymentStatus:paid>=total?'Đã thanh toán đủ qua VietQR':paid>0?'Chưa thanh toán đủ tiền sân':'Chưa thanh toán tiền sân',
    refundAmount:money(refunded),refundStatus:refunded>0?'Đã hoàn tiền':'Chưa có giao dịch hoàn tiền thành công',
    cancellationReason:row.ly_do_huy||undefined,cancelledAt:row.thoi_gian_huy||undefined,
    hoursUntilStart:(new Date(`${row.ngay_dat}T${row.gio_bat_dau}+07:00`).getTime()-instant.getTime())/3600000,
    sportId:/chuyền/i.test(sport)?'volleyball':/đá/i.test(sport)?'football':'badminton',
    canCancel:false}; // Customer cancellation needs its own verified backend flow.
}
export async function lookupCustomerBookings(input:unknown) {
  const query=normalizeLookupInput(input);
  let request=supabase.from('dat_san').select('ma_dat_san,ngay_dat,gio_bat_dau,gio_ket_thuc,trang_thai,tong_tien_san,ly_do_huy,thoi_gian_huy,khach_hang!inner(ho_ten,so_dien_thoai),san(ten_san,bo_mon(ten_bo_mon)),thanh_toan(so_tien,trang_thai,loai_giao_dich),hoan_tien(so_tien_hoan,trang_thai)');
  request=query.kind==='phone'?request.eq('khach_hang.so_dien_thoai',query.value):request.eq('ma_dat_san',query.value);
  const {data,error}=await request.order('ngay_dat',{ascending:false}).limit(100);
  if(error)databaseError(error);
  return (data||[]).map(row=>mapCustomerBooking(row));
}
