import {apiRequest} from './apiClient';
import { supabase } from '../lib/supabaseClient';
import type { BookingDetail } from '../types/schedule';

export interface SupabaseCustomer {
  ma_khach_hang: string;
  ho_ten: string;
  so_dien_thoai: string;
  email?: string;
  ghi_chu?: string;
}

export interface SupabaseCourt {
  ma_san: string;
  ten_san: string;
  ma_bo_mon: string;
  vi_tri?: string;
  trang_thai: string;
}

export interface SupabaseBookingRow {
  ma_dat_san: string;
  ma_san: string;
  ma_khach_hang: string;
  ma_nhan_vien?: string;
  ngay_dat: string;
  gio_bat_dau: string;
  gio_ket_thuc: string;
  kenh_dat: 'ONLINE' | 'TAI_QUAY';
  don_gia_gio: number;
  tong_tien_san: number;
  trang_thai: 'CHO_THANH_TOAN' | 'DA_THANH_TOAN' | 'DANG_SU_DUNG' | 'HOAN_TAT' | 'DA_HUY';
  thoi_gian_checkin?: string;
  thoi_gian_checkout?: string;
  thoi_gian_huy?: string;
  ly_do_huy?: string;
  ma_nhan_vien_huy?: string;
  san?: SupabaseCourt;
  khach_hang?: SupabaseCustomer;
  hoan_tien?: any[];
}

/**
 * Map Sport ID to Sport Name
 */
function getSportName(maBoMon?: string): string {
  if (maBoMon === 'BM00000001') return 'Cầu Lông';
  if (maBoMon === 'BM00000002') return 'Bóng Chuyền';
  if (maBoMon === 'BM00000003') return 'Bóng Đá Mini';
  return 'Thể Thao';
}

function getSportSlug(maBoMon?: string): 'badminton' | 'volleyball' | 'football' {
  if (maBoMon === 'BM00000002') return 'volleyball';
  if (maBoMon === 'BM00000003') return 'football';
  return 'badminton';
}

/**
 * Format DD/MM/YYYY
 */
function formatDateVN(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
}

/**
 * Chuyển đổi bản ghi Supabase sang định dạng BookingDetail của UI
 */
export function mapSupabaseBookingToDetail(row: SupabaseBookingRow): BookingDetail {
  const startParts = (row.gio_bat_dau || '08:00').split(':').map(Number);
  const endParts = (row.gio_ket_thuc || '09:00').split(':').map(Number);
  const startH = startParts[0] || 0;
  const startM = startParts[1] || 0;
  const endH = endParts[0] || 0;
  const endM = endParts[1] || 0;

  const startFormatted = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
  const endFormatted = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

  const courtName = row.san?.ten_san || 'Sân Thể Thao';
  const courtCode = courtName.replace(/^Sân\s*/i, '');

  let status: BookingDetail['status'] = 'Đã đặt';
  if (row.trang_thai === 'DA_HUY') status = 'ĐÃ HỦY';
  else if (row.trang_thai === 'DANG_SU_DUNG') status = 'Đang sử dụng';
  else if (row.trang_thai === 'HOAN_TAT') status = 'Đã kết thúc';

  const totalNum = Number(row.tong_tien_san || 0);

  const [bYear, bMonth, bDay] = (row.ngay_dat || '').split('-').map(Number);
  let hoursUntilStart = 48;
  if (bYear && bMonth && bDay) {
    const startDateTime = new Date(bYear, bMonth - 1, bDay, startH, startM, 0).getTime();
    hoursUntilStart = Math.round(((startDateTime - Date.now()) / (1000 * 60 * 60)) * 10) / 10;
  }

  return {
    code: row.ma_dat_san,
    bookingDate: row.ngay_dat,
    hoursUntilStart,
    customerName: row.khach_hang?.ho_ten || 'Khách vãng lai',
    phone: row.khach_hang?.so_dien_thoai || '',
    court: courtName,
    courtCode,
    sport: getSportName(row.san?.ma_bo_mon),
    sportId: getSportSlug(row.san?.ma_bo_mon),
    startH,
    startM,
    endH,
    endM,
    time: `${startFormatted} - ${endFormatted}`,
    paymentStatus: row.trang_thai === 'DA_HUY' ? 'ĐÃ HOÀN TIỀN' : 'Đã thanh toán đủ qua VietQR',
    total: `${totalNum.toLocaleString('vi-VN')} VND`,
    paidAmount: `${totalNum.toLocaleString('vi-VN')} VND`,
    remaining: '0 VND',
    status,
  };
}

/**
 * Chuyển đổi cho trang Tra cứu khách hàng (TrangChu.tsx)
 */
export function mapSupabaseToLookupTicket(row: SupabaseBookingRow) {
  const startParts = (row.gio_bat_dau || '08:00').split(':').map(Number);
  const endParts = (row.gio_ket_thuc || '09:00').split(':').map(Number);
  const startH = startParts[0] || 0;
  const startM = startParts[1] || 0;
  const endH = endParts[0] || 0;
  const endM = endParts[1] || 0;

  const startFormatted = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
  const endFormatted = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

  const durHours = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;
  const totalNum = Number(row.tong_tien_san || 0);

  // Tính số giờ còn lại từ bây giờ tới giờ bắt đầu
  let hoursUntilStart = 48;
  try {
    const [y, m, d] = row.ngay_dat.split('-').map(Number);
    const startDateTime = new Date(y, m - 1, d, startH, startM, 0).getTime();
    hoursUntilStart = (startDateTime - Date.now()) / (1000 * 60 * 60);
  } catch {
    hoursUntilStart = 24;
  }

  let statusText = 'ĐÃ XÁC NHẬN';
  let paymentText = 'Đã thanh toán qua VietQR';
  if (row.trang_thai === 'DA_HUY') {
    statusText = 'ĐÃ HỦY';
    paymentText = 'ĐÃ HOÀN TIỀN';
  } else if (row.trang_thai === 'DANG_SU_DUNG') {
    statusText = 'ĐANG THI ĐẤU';
  } else if (row.trang_thai === 'HOAN_TAT') {
    statusText = 'HOÀN TẤT';
  }

  const refunded = (row.hoan_tien || [])
    .filter((item: any) => item.trang_thai === 'THANH_CONG')
    .reduce((sum: number, item: any) => sum + Number(item.so_tien_hoan || 0), 0);

  const canCancel = (row.trang_thai === 'DA_THANH_TOAN' || row.trang_thai === 'CHO_THANH_TOAN') && hoursUntilStart >= 0;

  return {
    code: row.ma_dat_san,
    name: row.khach_hang?.ho_ten || 'Khách đặt sân',
    phone: row.khach_hang?.so_dien_thoai || '',
    sport: getSportName(row.san?.ma_bo_mon),
    court: row.san?.ten_san || 'Sân Thể Thao',
    date: formatDateVN(row.ngay_dat),
    time: `${startFormatted} - ${endFormatted} (${durHours} giờ)`,
    total: `${totalNum.toLocaleString('vi-VN')}đ`,
    rawTotal: totalNum,
    status: statusText,
    paymentStatus: paymentText,
    refundAmount: refunded > 0 ? `${refunded.toLocaleString('vi-VN')}đ` : undefined,
    refundStatus: refunded > 0 ? 'Đã hoàn tiền' : undefined,
    hoursUntilStart: Math.round(hoursUntilStart * 10) / 10,
    sportId: getSportSlug(row.san?.ma_bo_mon),
    cancellationReason: row.ly_do_huy,
    cancelledAt: row.thoi_gian_huy,
    isFromSupabase: true,
    canCancel,
  };
}

class BookingApiService {
  /**
   * Tra cứu đơn đặt sân từ Supabase Online (theo SĐT hoặc mã đơn)
   */
  async searchBookings(query: string): Promise<any[]> {
    try {
      const clean = query.trim();
      const cleanPhone = clean.replace(/[\s().-]/g, '');

      // 1. Nếu là số điện thoại (9-11 số)
      if (/^\d{9,11}$/.test(cleanPhone)) {
        const { data, error } = await supabase
          .from('dat_san')
          .select('*, san(*), khach_hang!inner(*), hoan_tien(*)')
          .eq('khach_hang.so_dien_thoai', cleanPhone)
          .order('ngay_dat', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapSupabaseToLookupTicket);
      }

      // 2. Nếu là mã đặt sân (vd: DS00000001, CX-88291, 00000001...)
      const cleanCode = clean.replace(/^#/, '').toUpperCase();
      const { data, error } = await supabase
        .from('dat_san')
        .select('*, san(*), khach_hang(*), hoan_tien(*)')
        .ilike('ma_dat_san', `%${cleanCode}%`)
        .order('ngay_dat', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapSupabaseToLookupTicket);
    } catch (err) {
      console.warn('⚠️ Supabase searchBookings error, will use fallback:', err);
      return [];
    }
  }

  /**
   * Lấy toàn bộ đơn đặt sân cho một ngày cụ thể trên Lịch Admin
   */
  async getBookingsByDate(dateStr: string): Promise<BookingDetail[]> {
    try {
      const { data, error } = await supabase
        .from('dat_san')
        .select('*, san(*), khach_hang(*)')
        .eq('ngay_dat', dateStr)
        .order('gio_bat_dau', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapSupabaseBookingToDetail);
    } catch (err) {
      console.warn(`⚠️ Supabase getBookingsByDate (${dateStr}) error:`, err);
      return [];
    }
  }

  /**
   * Hủy đơn đặt sân và tạo bản ghi hoàn tiền (nếu đủ điều kiện)
   */
  async cancelBooking(params: {
    code: string;
    isEligible: boolean;
    reason: string;
    customerPhone?: string;
    customerName?: string;
    refundAmount?: number;
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Kiểm tra trạng thái hiện tại trước khi hủy
      const { data: currentBooking } = await supabase
        .from('dat_san')
        .select('trang_thai, ngay_dat, gio_bat_dau')
        .eq('ma_dat_san', params.code)
        .maybeSingle();

      if (currentBooking) {
        const st = (currentBooking.trang_thai || '').toUpperCase();
        if (['DANG_SU_DUNG', 'DA_KET_THUC', 'HOAN_TAT', 'DA_HUY'].includes(st)) {
          return {
            success: false,
            message: 'Lịch đặt sân đã/đang sử dụng hoặc đã kết thúc, không thể hủy!'
          };
        }

        try {
          const [y, m, d] = (currentBooking.ngay_dat || '').split('-').map(Number);
          const [h, min] = (currentBooking.gio_bat_dau || '').split(':').map(Number);
          if (y && m && d) {
            const startMs = new Date(y, m - 1, d, h || 0, min || 0, 0).getTime();
            if (startMs <= Date.now()) {
              return {
                success: false,
                message: 'Lượt đặt sân đã bắt đầu hoặc đã qua giờ thi đấu trong quá khứ, không thể hủy!'
              };
            }
          }
        } catch {
          // ignore date parse error
        }
      }

      // 1. Cập nhật trạng thái đơn trong Supabase
      const { error: updateErr } = await supabase
        .from('dat_san')
        .update({
          trang_thai: 'DA_HUY',
          thoi_gian_huy: new Date().toISOString(),
          ly_do_huy: params.reason,
        })
        .eq('ma_dat_san', params.code);

      if (updateErr) {
        console.warn('Supabase cancel update failed:', updateErr);
      }

      // 2. Nếu đủ điều kiện >= 24h: Thêm bản ghi vào bảng hoan_tien
      if (params.isEligible && params.refundAmount) {
        let nextHoanTienId = 'HT00000021';
        try {
          // Lấy danh sách các mã hoàn tiền hiện có để tính số thứ tự tiếp theo dạng HT000000xx
          const { data: existingRefunds } = await supabase
            .from('hoan_tien')
            .select('ma_hoan_tien')
            .ilike('ma_hoan_tien', 'HT%')
            .limit(100);

          let maxNum = 0;
          if (existingRefunds && existingRefunds.length > 0) {
            for (const r of existingRefunds) {
              const match = (r.ma_hoan_tien || '').match(/^HT(\d+)$/);
              if (match) {
                const num = parseInt(match[1], 10);
                // Bỏ qua các mã timestamp cũ (như 29351443) để giữ số tuần tự chuẩn
                if (num < 1000000 && num > maxNum) {
                  maxNum = num;
                }
              }
            }
          }
          if (maxNum > 0) {
            nextHoanTienId = `HT${(maxNum + 1).toString().padStart(8, '0')}`;
          }
        } catch (e) {
          console.warn('Không thể tự động tính mã HT tuần tự, dùng fallback:', e);
        }

        try {
          // Lấy mã thanh toán gốc của đơn từ bảng thanh_toan
          const { data: payData } = await supabase
            .from('thanh_toan')
            .select('ma_thanh_toan')
            .eq('ma_dat_san', params.code)
            .maybeSingle();
          const origPaymentId = payData?.ma_thanh_toan || 'TT00000001';

          const now = new Date();
          const y = now.getFullYear();
          const m = (now.getMonth() + 1).toString().padStart(2, '0');
          const d = now.getDate().toString().padStart(2, '0');
          const dateStamp = `${y}${m}${d}`;
          const seqSuffix = nextHoanTienId.replace(/\D/g, '').slice(-2);
          const bankRefundCode = `REFUND${dateStamp}${seqSuffix}`;

          await supabase
            .from('hoan_tien')
            .insert({
              ma_hoan_tien: nextHoanTienId,
              ma_dat_san: params.code,
              ma_thanh_toan_goc: origPaymentId,
              so_tien_hoan: params.refundAmount,
              ly_do_hoan: params.reason || 'Khách hủy trước ít nhất 24 giờ (Hoàn tiền 100% qua VietQR)',
              stk_nhan_tien: params.customerPhone || '0912345678',
              ngan_hang: 'VietinBank',
              ten_chu_tai_khoan: params.customerName || 'KHÁCH HÀNG',
              ma_giao_dich_ngan_hang: bankRefundCode,
              trang_thai: 'THANH_CONG',
            });
        } catch (warnErr) {
          console.warn('Supabase hoan_tien insert warning:', warnErr);
        }
      }

      return { success: true, message: 'Hủy đơn thành công trên Supabase' };
    } catch (err: any) {
      console.error('cancelBooking error:', err);
      return { success: false, message: err?.message || 'Lỗi kết nối khi hủy đơn' };
    }
  }

  /**
   * Cập nhật trạng thái Check-in vào sân trên Supabase
   */
  async checkinBooking(code: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('dat_san')
        .update({
          trang_thai: 'DANG_SU_DUNG',
          thoi_gian_checkin: new Date().toISOString(),
        })
        .eq('ma_dat_san', code);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Điều chuyển sân và đổi khung giờ thi đấu trên Supabase
   */
  async transferCourt(params: {
    code: string;
    targetCourtName: string;
    targetCourtCode?: string;
    gioBatDau: string;
    gioKetThuc: string;
  }): Promise<boolean> {
    try {
      const { data: courtData } = await supabase
        .from('san')
        .select('ma_san')
        .ilike('ten_san', `%${params.targetCourtCode || params.targetCourtName}%`)
        .maybeSingle();

      const updatePayload: Record<string, any> = {
        gio_bat_dau: params.gioBatDau,
        gio_ket_thuc: params.gioKetThuc,
      };

      if (courtData?.ma_san) {
        updatePayload.ma_san = courtData.ma_san;
      }

      const { error } = await supabase
        .from('dat_san')
        .update(updatePayload)
        .eq('ma_dat_san', params.code);

      return !error;
    } catch (err) {
      console.warn('Supabase transferCourt error:', err);
      return false;
    }
  }

  /**
   * Cập nhật trạng thái Check-out hoàn tất lượt đặt trên Supabase
   */
  async checkoutBooking(code: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('dat_san')
        .update({
          trang_thai: 'HOAN_TAT',
          thoi_gian_checkout: new Date().toISOString(),
        })
        .eq('ma_dat_san', code);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Tạo đơn đặt sân mới trên Supabase
   */

}

export interface CustomerLookupResult {
  code:string;name:string;phone:string;sport:string;court:string;bookingDate:string;date:string;time:string;
  total:string;paidAmount:string;remaining:string;status:string;paymentStatus:string;refundAmount:string;refundStatus:string;
  cancellationReason?:string;cancelledAt?:string;hoursUntilStart:number;sportId:string;canCancel:boolean;
}
export interface CreatePaidBookingRequest {
  courtCode:string;bookingDate:string;startTime:string;endTime:string;customerName:string;customerPhone:string;
  totalAmount:number;channel?:'ONLINE'|'TAI_QUAY';staffId?:string|null;bankTransactionCode:string;paymentConfirmed:boolean;
}
const backendBookingApi={
  createBooking:(request:CreatePaidBookingRequest)=>apiRequest<{success:boolean;code:string;booking:BookingDetail}>('/bookings',{method:'POST',body:JSON.stringify(request)}),
  list:()=>apiRequest<BookingDetail[]>('/bookings'),
  lookup: async (query: string): Promise<CustomerLookupResult[]> => {
    try {
      const res = await apiRequest<CustomerLookupResult[]>('/bookings/lookup', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });
      if (res && res.length > 0) return res;
    } catch {
      // Backend unavailable, fallback to Supabase direct query
    }
    return new BookingApiService().searchBookings(query);
  },
  checkIn:(code:string,bookingDate:string)=>apiRequest<BookingDetail>(`/bookings/${encodeURIComponent(code)}/check-in`,{method:'POST',body:JSON.stringify({bookingDate})}),
};

export const bookingApiService = Object.assign(new BookingApiService(), backendBookingApi);
export default bookingApiService;
