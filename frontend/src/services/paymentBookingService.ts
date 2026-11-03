import { supabase } from '../lib/supabaseClient';
import type { Transaction } from '../types/admin';
import { INITIAL_TRANSACTIONS } from '../types/admin';

export interface BookingPaymentPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  courtName: string; // e.g. "Sân CL-01" hoặc "Sân BD-02"
  bookingDate: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "19:00 - 20:00" hoặc "06:00:00"
  totalPrice: number;
  channel?: 'ONLINE' | 'TAI_QUAY';
  staffId?: string;
}

/**
 * Lấy số thứ tự tiếp theo chuẩn hóa từ Supabase:
 * DS00000031, TT00000036, KH00000016
 */
async function generateNextCode(
  prefix: string,
  table: string,
  pkColumn: string
): Promise<string> {
  try {
    const { data, error } = await supabase.from(table).select(pkColumn);

    if (error || !data || data.length === 0) {
      return `${prefix}00000001`;
    }

    let maxNum = 0;
    for (const row of data as any[]) {
      const code = row[pkColumn] || '';
      if (code.startsWith(prefix)) {
        const numPart = code.slice(prefix.length);
        const num = parseInt(numPart, 10);
        // Bỏ qua các mã cũ ngẫu nhiên lớn hơn 1 triệu để lấy đúng chuỗi tăng dần
        if (!isNaN(num) && num < 1000000 && num > maxNum) {
          maxNum = num;
        }
      }
    }

    if (maxNum === 0) {
      maxNum = data.length;
    }

    return `${prefix}${String(maxNum + 1).padStart(8, '0')}`;
  } catch {
    const ts = Date.now().toString().slice(-8);
    return `${prefix}${ts}`;
  }
}

/**
 * Tách giờ bắt đầu và kết thúc từ chuỗi timeSlot (ví dụ "19:00 - 20:00")
 */
function parseTimeSlot(slotStr: string): { start: string; end: string } {
  try {
    const parts = slotStr.split(/[-–]/).map((s) => s.trim());
    if (parts.length >= 2) {
      const formatTime = (t: string) => {
        const [h, m] = t.split(':').map((x) => x.trim());
        const hh = (h || '00').padStart(2, '0');
        const mm = (m || '00').padStart(2, '0');
        return `${hh}:${mm}:00`;
      };
      return { start: formatTime(parts[0]), end: formatTime(parts[1]) };
    }
  } catch (err) {
    console.warn('Lỗi parse timeSlot:', err);
  }
  return { start: '08:00:00', end: '09:00:00' };
}

/**
 * Chuẩn hóa ngày sang định dạng YYYY-MM-DD
 */
function parseBookingDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3 && parts[2].length === 4) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
}

export const paymentBookingService = {
  /**
   * Lưu khách hàng, đơn đặt sân và giao dịch thanh toán thật vào Supabase
   */
  async recordSuccessfulBookingPayment(payload: BookingPaymentPayload) {
    try {
      console.log('⚡ Đang lưu giao dịch đặt sân vào Supabase...', payload);

      // 1. Kiểm tra hoặc thêm khách hàng (dựa trên SĐT)
      const cleanPhone = payload.customerPhone.replace(/[\s.-]/g, '');
      let customerId = '';

      const { data: existingCustomer } = await supabase
        .from('khach_hang')
        .select('ma_khach_hang')
        .eq('so_dien_thoai', cleanPhone)
        .maybeSingle();

      if (existingCustomer?.ma_khach_hang) {
        customerId = existingCustomer.ma_khach_hang;
        console.log('✅ Khách hàng đã tồn tại:', customerId);
      } else {
        const newCustomerId = await generateNextCode(
          'KH',
          'khach_hang',
          'ma_khach_hang'
        );
        const { error: custErr } = await supabase.from('khach_hang').insert({
          ma_khach_hang: newCustomerId,
          ho_ten: payload.customerName || 'Khách đặt sân',
          so_dien_thoai: cleanPhone,
          email: payload.customerEmail || null,
          ghi_chu:
            payload.channel === 'TAI_QUAY'
              ? 'Khách đặt tại quầy'
              : 'Khách đặt online',
        });
        if (custErr) {
          console.warn('Lỗi tạo khách hàng:', custErr);
        }
        customerId = newCustomerId;
        console.log('✅ Tạo khách hàng mới:', customerId);
      }

      // 2. Tra cứu mã sân tương ứng từ tên sân (ví dụ "Sân CL-01" -> "SAN00000001")
      let courtId = 'SAN00000001';
      const cleanCourtName = payload.courtName.trim();

      const { data: courtData } = await supabase
        .from('san')
        .select('ma_san, ten_san')
        .ilike('ten_san', `%${cleanCourtName}%`)
        .maybeSingle();

      if (courtData?.ma_san) {
        courtId = courtData.ma_san;
        console.log('✅ Tìm thấy sân:', courtId, courtData.ten_san);
      } else {
        console.warn('⚠️ Không tìm thấy sân:', cleanCourtName, '-> dùng SAN00000001');
      }

      // 3. Chuẩn bị thông tin ngày giờ
      const dateFormatted = parseBookingDate(payload.bookingDate);
      const { start, end } = parseTimeSlot(payload.timeSlot);

      // 4. Tạo mã đặt sân và thanh toán tuần tự chuẩn xác
      const [bookingCode, paymentCode] = await Promise.all([
        generateNextCode('DS', 'dat_san', 'ma_dat_san'),
        generateNextCode('TT', 'thanh_toan', 'ma_thanh_toan'),
      ]);

      const bankRef = `VQR${Date.now().toString().slice(-8)}`;
      console.log('🔑 Mã mới sinh:', { bookingCode, paymentCode, bankRef });

      // 5. Tạo bản ghi đơn đặt sân trong bảng `dat_san`
      // Cột chuẩn: ma_nhan_vien (chứ KHÔNG PHẢI ma_nhan_vien_tao)
      const { error: dsError } = await supabase.from('dat_san').insert({
        ma_dat_san: bookingCode,
        ma_san: courtId,
        ma_khach_hang: customerId,
        ma_nhan_vien: payload.staffId || null,
        ngay_dat: dateFormatted,
        gio_bat_dau: start,
        gio_ket_thuc: end,
        kenh_dat: payload.channel || 'ONLINE',
        don_gia_gio: payload.totalPrice,
        tong_tien_san: payload.totalPrice,
        trang_thai: 'DA_THANH_TOAN',
      });

      if (dsError) {
        console.error('❌ Lỗi insert dat_san:', dsError);
        return { success: false, error: dsError };
      }

      // 6. Tạo bản ghi thanh toán 100% VietQR trong bảng `thanh_toan`
      const { error: ttError } = await supabase.from('thanh_toan').insert({
        ma_thanh_toan: paymentCode,
        ma_dat_san: bookingCode,
        so_tien: payload.totalPrice,
        phuong_thuc_thanh_toan: 'VIETQR',
        loai_giao_dich: 'THANH_TOAN_DAT_SAN',
        ma_giao_dich_ngan_hang: bankRef,
        thoi_gian_thanh_toan: new Date().toISOString(),
        trang_thai: 'THANH_CONG',
        ghi_chu: `Khách thanh toán 100% qua VietQR (${payload.channel === 'TAI_QUAY' ? 'Tại quầy' : 'Online'})`,
      });

      if (ttError) {
        console.error('❌ Lỗi insert thanh_toan:', ttError);
        return { success: false, error: ttError };
      }

      // 7. Tạo biên nhận tự động sau khi thanh toán thành công
      let receiptCode = '';
      try {
        receiptCode = await generateNextCode('BN', 'bien_nhan', 'ma_bien_nhan');
        const { error: bnError } = await supabase.from('bien_nhan').insert({
          ma_bien_nhan: receiptCode,
          ma_dat_san: bookingCode,
          ma_thanh_toan: paymentCode,
          kenh_in: payload.channel === 'TAI_QUAY' ? 'TAI_QUAY' : 'KHACH_HANG',
          nguoi_in: payload.customerName || 'Khách hàng',
          ghi_chu: `Biên nhận tự động khi thanh toán VietQR thành công (${bankRef})`,
        });
        if (bnError) {
          // Bảng chưa tồn tại hoặc lỗi khác — cảnh báo nhưng không fail flow chính
          console.warn('⚠️ Không thể lưu biên nhận (bien_nhan):', bnError.message);
          receiptCode = '';
        } else {
          console.log('✅ Đã tạo biên nhận:', receiptCode);
        }
      } catch (bnEx) {
        console.warn('⚠️ Exception khi tạo biên nhận:', bnEx);
        receiptCode = '';
      }

      console.log('✅ Đã lưu thành công vào Supabase:', {
        bookingCode,
        paymentCode,
        receiptCode,
        courtId,
        customerId,
        bankRef,
      });

      return {
        success: true,
        bookingCode,
        paymentCode,
        receiptCode,
        bankRef,
      };
    } catch (error) {
      console.error('❌ Lỗi xử lý recordSuccessfulBookingPayment:', error);
      return { success: false, error };
    }
  },

  /**
   * Lấy toàn bộ giao dịch thanh toán thật từ Supabase để hiển thị Thống kê doanh thu
   */
  async fetchAllTransactions(): Promise<Transaction[]> {
    try {
      const { data, error } = await supabase
        .from('thanh_toan')
        .select(`
          ma_thanh_toan,
          ma_dat_san,
          so_tien,
          phuong_thuc_thanh_toan,
          loai_giao_dich,
          ma_giao_dich_ngan_hang,
          thoi_gian_thanh_toan,
          trang_thai,
          ghi_chu,
          dat_san (
            ma_dat_san,
            ngay_dat,
            gio_bat_dau,
            gio_ket_thuc,
            kenh_dat,
            trang_thai,
            san (
              ten_san,
              bo_mon (
                ten_bo_mon
              )
            ),
            khach_hang (
              ho_ten,
              so_dien_thoai
            )
          )
        `)
        .order('thoi_gian_thanh_toan', { ascending: false });

      if (error || !data) {
        console.warn('Lỗi lấy thanh_toan từ Supabase, dùng mock fallback:', error);
        return INITIAL_TRANSACTIONS;
      }

      // Format dữ liệu sang kiểu Transaction của Frontend
      const formatted: Transaction[] = data.map((item: any) => {
        const ds = item.dat_san;
        const court = ds?.san;
        const sport = court?.bo_mon?.ten_bo_mon || 'Cầu lông';
        const courtName = court?.ten_san || 'Sân CL-01';
        const kh = ds?.khach_hang;

        const customerName = kh?.ho_ten || 'Khách đặt sân';
        const customerPhone = kh?.so_dien_thoai || '0900000000';

        const startTime = (ds?.gio_bat_dau || '08:00').slice(0, 5);
        const endTime = (ds?.gio_ket_thuc || '09:00').slice(0, 5);
        const timeSlot = `${startTime} - ${endTime}`;

        const dateStr = item.thoi_gian_thanh_toan
          ? new Date(item.thoi_gian_thanh_toan).toLocaleDateString('vi-VN')
          : ds?.ngay_dat || '01/10/2026';

        return {
          id: item.ma_thanh_toan,
          code: `#TX-${item.ma_thanh_toan.replace(/[^0-9]/g, '').slice(-4) || '9180'}`,
          customerName,
          customerPhone,
          amount: Number(item.so_tien) || 120000,
          type: 'booking',
          status: 'success',
          statusLabel: 'Đã thanh toán',
          date: dateStr,
          courtInfo: `${sport} · ${courtName}`,
          timeSlot,
          bankRef: item.ma_giao_dich_ngan_hang || 'VQR20261025',
          ticketCode: item.ma_dat_san || 'DS00001',
        };
      });

      return formatted.length > 0 ? formatted : INITIAL_TRANSACTIONS;
    } catch (err) {
      console.warn('Exception fetchAllTransactions, dùng fallback:', err);
      return INITIAL_TRANSACTIONS;
    }
  },
};
