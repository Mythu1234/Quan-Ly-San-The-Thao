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

  return {
    code: row.ma_dat_san,
    bookingDate: row.ngay_dat,
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
    hoursUntilStart: Math.round(hoursUntilStart * 10) / 10,
    sportId: getSportSlug(row.san?.ma_bo_mon),
    cancellationReason: row.ly_do_huy,
    cancelledAt: row.thoi_gian_huy,
    isFromSupabase: true,
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
          .select('*, san(*), khach_hang!inner(*)')
          .eq('khach_hang.so_dien_thoai', cleanPhone)
          .order('ngay_dat', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapSupabaseToLookupTicket);
      }

      // 2. Nếu là mã đặt sân (vd: DS00000001, CX-88291, 00000001...)
      const cleanCode = clean.replace(/^#/, '').toUpperCase();
      const { data, error } = await supabase
        .from('dat_san')
        .select('*, san(*), khach_hang(*)')
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
        const nextHoanTienId = `HT${Date.now().toString().slice(-8)}`;
        try {
          // Lấy mã thanh toán gốc của đơn
          const { data: payData } = await supabase
            .from('thanh_toan')
            .select('ma_thanh_toan')
            .eq('ma_dat_san', params.code)
            .maybeSingle();
          const origPaymentId = payData?.ma_thanh_toan || 'TT00000001';

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
  async createBooking(booking: {
    courtCode: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    channel?: 'ONLINE' | 'TAI_QUAY';
    staffId?: string | null;
  }): Promise<{ success: boolean; code: string }> {
    try {
      // 1. Tìm hoặc tạo khách hàng
      let customerId = 'KH00000001';
      const { data: existingCust } = await supabase
        .from('khach_hang')
        .select('ma_khach_hang')
        .eq('so_dien_thoai', booking.customerPhone)
        .maybeSingle();

      if (existingCust) {
        customerId = existingCust.ma_khach_hang;
      } else {
        customerId = `KH${Date.now().toString().slice(-8)}`;
        try {
          await supabase.from('khach_hang').insert({
            ma_khach_hang: customerId,
            ho_ten: booking.customerName,
            so_dien_thoai: booking.customerPhone,
          });
        } catch {}
      }

      // 2. Map mã sân (vd: CL-01, Sân CL-01 -> SAN00000001)
      let courtId = 'SAN00000001';
      const codeMatch = booking.courtCode.match(/(CL|BC|BD)-\d{2}/i);
      const searchPattern = codeMatch ? codeMatch[0] : booking.courtCode;

      const { data: courtData } = await supabase
        .from('san')
        .select('ma_san')
        .ilike('ten_san', `%${searchPattern}%`)
        .maybeSingle();
      if (courtData) {
        courtId = courtData.ma_san;
      }

      // 3. Tạo mã đặt sân mới
      const newBookingId = `DS${Date.now().toString().slice(-8)}`;

      // 4. Lưu đơn vào dat_san
      const { error: insertErr } = await supabase.from('dat_san').insert({
        ma_dat_san: newBookingId,
        ma_san: courtId,
        ma_khach_hang: customerId,
        ma_nhan_vien: booking.staffId || null,
        ngay_dat: booking.bookingDate,
        gio_bat_dau: booking.startTime.length === 5 ? `${booking.startTime}:00` : booking.startTime,
        gio_ket_thuc: booking.endTime.length === 5 ? `${booking.endTime}:00` : booking.endTime,
        kenh_dat: booking.channel || 'ONLINE',
        don_gia_gio: booking.totalAmount,
        tong_tien_san: booking.totalAmount,
        trang_thai: 'DA_THANH_TOAN',
      });

      if (insertErr) {
        console.warn('Supabase createBooking insert warning:', insertErr);
      } else {
        // 5. Lưu bản ghi thanh toán VietQR 100% vào bảng thanh_toan
        const newPaymentId = `TT${Date.now().toString().slice(-8)}`;
        try {
          await supabase.from('thanh_toan').insert({
            ma_thanh_toan: newPaymentId,
            ma_dat_san: newBookingId,
            so_tien: booking.totalAmount,
            phuong_thuc_thanh_toan: 'VIETQR',
            loai_giao_dich: 'THANH_TOAN_DAT_SAN',
            trang_thai: 'THANH_CONG',
            ghi_chu: 'Thanh toán 100% qua VietQR lúc đặt sân',
          });
        } catch (payErr) {
          console.warn('Supabase thanh_toan insert warning:', payErr);
        }
      }

      return { success: true, code: newBookingId };
    } catch (err) {
      console.error('Supabase createBooking error:', err);
      return { success: false, code: `BK-${Math.floor(1000 + Math.random() * 9000)}` };
    }
  }
}

export const bookingApiService = new BookingApiService();
export default bookingApiService;
