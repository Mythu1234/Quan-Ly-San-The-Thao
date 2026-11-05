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
/**
 * Lấy số thứ tự tuần tự chung cao nhất từ các bảng dat_san, thanh_toan, bien_nhan
 * để đảm bảo mã đặt sân (DS...), mã thanh toán (TT...), và mã biên nhận (BN...)
 * CÓ CÙNG MỘT SỐ THỨ TỰ ĐỒNG BỘ 100%!
 * Ví dụ: DS00000040, TT00000040, BN00000040
 */
async function getNextSharedBookingSequence(): Promise<number> {
  let maxSeq = 0;
  const tables = [
    { table: 'dat_san', col: 'ma_dat_san', prefix: 'DS' },
    { table: 'thanh_toan', col: 'ma_thanh_toan', prefix: 'TT' },
    { table: 'bien_nhan', col: 'ma_bien_nhan', prefix: 'BN' },
  ];

  for (const item of tables) {
    try {
      const { data, error } = await supabase.from(item.table).select(item.col);
      if (!error && data) {
        for (const row of data as any[]) {
          const code = (row[item.col] || '').trim();
          if (code.startsWith(item.prefix)) {
            const numPart = code.slice(item.prefix.length);
            const num = parseInt(numPart, 10);
            // Các mã tuần tự chuẩn hợp lệ nằm trong khoảng 1 -> 99999
            if (!isNaN(num) && num < 100000 && num > maxSeq) {
              maxSeq = num;
            }
          }
        }
      }
    } catch {
      // bỏ qua lỗi nếu bảng chưa có
    }
  }

  if (maxSeq === 0) {
    maxSeq = 39; // fallback an toàn dựa trên dữ liệu hiện tại
  }

  return maxSeq + 1;
}

/**
 * Lấy mã khách hàng tuần tự KH...
 */
async function generateNextCustomerCode(): Promise<string> {
  try {
    const { data, error } = await supabase.from('khach_hang').select('ma_khach_hang');
    if (error || !data || data.length === 0) return 'KH00000001';
    let maxNum = 0;
    for (const row of data as any[]) {
      const code = (row.ma_khach_hang || '').trim();
      if (code.startsWith('KH')) {
        const num = parseInt(code.slice(2), 10);
        if (!isNaN(num) && num < 100000 && num > maxNum) maxNum = num;
      }
    }
    return `KH${String(maxNum + 1).padStart(8, '0')}`;
  } catch {
    return `KH${Date.now().toString().slice(-8)}`;
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
        const newCustomerId = await generateNextCustomerCode();
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

      // 4. Tạo mã đặt sân, thanh toán và biên nhận ĐỒNG BỘ 100% CÙNG SỐ THỨ TỰ
      let bookingCode = '';
      let paymentCode = '';
      let receiptCode = '';

      try {
        const nextSeq = await getNextSharedBookingSequence();
        const seqStr = String(nextSeq).padStart(8, '0');
        bookingCode = `DS${seqStr}`;
        paymentCode = `TT${seqStr}`;
        receiptCode = `BN${seqStr}`;
      } catch {
        const fallbackSeq = Date.now().toString().slice(-8);
        bookingCode = `DS${fallbackSeq}`;
        paymentCode = `TT${fallbackSeq}`;
        receiptCode = `BN${fallbackSeq}`;
      }

      const bankRef = `VQR${Date.now().toString().slice(-8)}`;
      console.log('🔑 Mã mới sinh:', { bookingCode, paymentCode, bankRef });

      // 4.5. Kiểm tra tranh chấp (race condition): Đảm bảo chưa có khách nào thanh toán trước khung giờ này
      const { data: existingBookings } = await supabase
        .from('dat_san')
        .select('ma_dat_san, gio_bat_dau, gio_ket_thuc, trang_thai')
        .eq('ma_san', courtId)
        .eq('ngay_dat', dateFormatted)
        .neq('trang_thai', 'DA_HUY');

      if (existingBookings && existingBookings.length > 0) {
        const toMins = (t: string) => {
          const [h, m] = t.split(':').map(Number);
          return (h || 0) * 60 + (m || 0);
        };
        const reqStartMins = toMins(start);
        const reqEndMins = toMins(end);

        const hasConflict = existingBookings.some((eb: any) => {
          const ebStart = toMins((eb.gio_bat_dau || '').slice(0, 5));
          const ebEnd = toMins((eb.gio_ket_thuc || '').slice(0, 5));
          return Math.max(reqStartMins, ebStart) < Math.min(reqEndMins, ebEnd);
        });

        if (hasConflict) {
          console.warn('⚠️ Xung đột: Khung giờ đã có khách khác thanh toán trước!');
          return {
            success: false,
            conflict: true,
            error: new Error('Khung giờ này vừa có khách khác thanh toán trước. Hệ thống sẽ tự động hoàn tiền lại cho bạn.'),
          };
        }
      }

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

      // 7. Tạo biên nhận tự động sau khi thanh toán thành công (dùng cùng số thứ tự receiptCode)
      try {
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

        // Format: "dd/mm/yyyy HH:mm" to match WalletRevenueView's parseTransactionDate
        let dateStr = '01/10/2026 08:00';
        if (item.thoi_gian_thanh_toan) {
          const d = new Date(item.thoi_gian_thanh_toan);
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          const hh = String(d.getHours()).padStart(2, '0');
          const min = String(d.getMinutes()).padStart(2, '0');
          dateStr = `${dd}/${mm}/${yyyy} ${hh}:${min}`;
        } else if (ds?.ngay_dat) {
          const parts = (ds.ngay_dat as string).split('-');
          if (parts.length === 3) dateStr = `${parts[2]}/${parts[1]}/${parts[0]} 08:00`;
        }

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
