import {supabase} from '../lib/supabaseClient.js';
import {databaseError} from '../repositories/facilityRepository.js';

const statuses:Record<string,string>={CHO_THANH_TOAN:'Chờ thanh toán',DA_THANH_TOAN:'Đã đặt',DANG_SU_DUNG:'Đang sử dụng',HOAN_TAT:'Đã kết thúc',DA_HUY:'Đã hủy'};
const money=(value:number)=>`${value.toLocaleString('vi-VN')} VND`;
export async function listBookings() {
  const {data,error}=await supabase.from('dat_san').select('ma_dat_san,ngay_dat,gio_bat_dau,gio_ket_thuc,trang_thai,tong_tien_san,khach_hang(ho_ten,so_dien_thoai),san(ma_san,ten_san,bo_mon(ten_bo_mon)),thanh_toan(so_tien,trang_thai,loai_giao_dich)').order('ngay_dat');
  if(error)databaseError(error);
  return (data||[]).map((row:any)=>{
    const total=Number(row.tong_tien_san),paid=(row.thanh_toan||[]).filter((payment:any)=>payment.trang_thai==='THANH_CONG'&&payment.loai_giao_dich==='THANH_TOAN_DAT_SAN').reduce((sum:number,p:any)=>sum+Number(p.so_tien),0);
    const start=row.gio_bat_dau.slice(0,5),end=row.gio_ket_thuc.slice(0,5),sport=row.san.bo_mon.ten_bo_mon;
    return {code:row.ma_dat_san,bookingDate:row.ngay_dat,customerName:row.khach_hang.ho_ten,phone:row.khach_hang.so_dien_thoai,
      court:row.san.ten_san,courtId:row.san.ma_san,courtCode:row.san.ten_san.match(/(?:CL|BC|BD)-\d{2}/)?.[0],sport,
      sportId:/chuyền/i.test(sport)?'volleyball':/đá/i.test(sport)?'football':'badminton',
      time:`${start} - ${end}`,startH:Number(start.slice(0,2)),startM:Number(start.slice(3)),endH:Number(end.slice(0,2)),endM:Number(end.slice(3)),
      paymentStatus:paid>=total?'Đã thanh toán đủ qua VietQR':'Chưa thanh toán đủ',total:money(total),paidAmount:money(paid),remaining:money(Math.max(0,total-paid)),status:statuses[row.trang_thai]||row.trang_thai};
  });
}
export async function checkInBooking(code:string,date:string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Ngày đặt không hợp lệ.');
  const {error}=await supabase.rpc('courtx_checkin',{p_code:code,p_date:date});
  if(error)databaseError(error);
  return (await listBookings()).find(booking=>booking.code===code);
}
