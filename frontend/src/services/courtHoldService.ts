import { supabase } from '../lib/supabaseClient';

export interface CourtHold {
  sessionId: string;
  courtName: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  duration: number; // minutes
  customerName?: string;
  customerPhone?: string;
  heldAt: number; // timestamp ms
  expiresAt: number; // timestamp ms (hết hạn giữ ưu tiên)
}

const STORAGE_KEY = 'courtx_court_holds';
const HOLD_CHANNEL_NAME = 'courtx_hold_sync_channel';

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function normalizeCourtCode(str: string): string {
  return (str || '')
    .toUpperCase()
    .replace(/^SÂN\s+/i, '')
    .replace(/[\s_]/g, '-')
    .trim();
}

// Lắng nghe thay đổi trạng thái giữ sân từ tab khác / thiết bị khác
const holdListeners = new Set<() => void>();
let broadcastChannel: any = null;
let localBroadcast: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcast = new BroadcastChannel('courtx_court_holds_channel');
    localBroadcast.onmessage = () => {
      holdListeners.forEach((l) => l());
    };
  } catch {
    // fallback
  }
}

function initHoldRealtime() {
  if (typeof window === 'undefined') return;
  if (!broadcastChannel) {
    try {
      broadcastChannel = supabase.channel(HOLD_CHANNEL_NAME);
      broadcastChannel
        .on('broadcast', { event: 'HOLDS_CHANGED' }, () => {
          holdListeners.forEach((l) => l());
        })
        .subscribe();
    } catch {
      // ignore
    }
  }

  // Lắng nghe LocalStorage event giữa các tab cùng trình duyệt
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      holdListeners.forEach((l) => l());
    }
  });
}

initHoldRealtime();

export const courtHoldService = {
  subscribe(listener: () => void) {
    holdListeners.add(listener);
    return () => {
      holdListeners.delete(listener);
    };
  },

  /**
   * Đọc tất cả các lượt giữ sân đang lưu trữ, tự động loại bỏ các lượt đã hết hạn lâu
   */
  getAllHolds(): CourtHold[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const list: CourtHold[] = JSON.parse(raw);
      const now = Date.now();
      // Giữ lại các lượt chưa hết hạn hoặc mới hết hạn dưới 10 phút để cảnh báo
      return list.filter((h) => h.expiresAt > now - 10 * 60 * 1000);
    } catch {
      return [];
    }
  },

  /**
   * Đăng ký phiên giữ sân mới (thời hạn giữ ưu tiên durationSeconds, mặc định 60 giây như code hiện có)
   */
  holdSlot(params: {
    sessionId: string;
    courtName: string;
    bookingDate: string;
    startTime: string;
    duration: number;
    customerName?: string;
    customerPhone?: string;
    holdSeconds?: number;
  }): CourtHold {
    const holdSeconds = params.holdSeconds || 60;
    const now = Date.now();
    const newHold: CourtHold = {
      sessionId: params.sessionId,
      courtName: params.courtName,
      bookingDate: params.bookingDate,
      startTime: params.startTime,
      duration: params.duration,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      heldAt: now,
      expiresAt: now + holdSeconds * 1000,
    };

    try {
      const existing = this.getAllHolds().filter((h) => h.sessionId !== params.sessionId);
      existing.push(newHold);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      if (broadcastChannel) {
        broadcastChannel.send({
          type: 'broadcast',
          event: 'HOLDS_CHANGED',
          payload: { sessionId: params.sessionId },
        });
      }
      if (localBroadcast) {
        try {
          localBroadcast.postMessage({ type: 'HOLDS_CHANGED', sessionId: params.sessionId });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }

    holdListeners.forEach((l) => l());
    return newHold;
  },

  /**
   * Giải phóng phiên giữ sân (khi khách hủy hoặc thanh toán thành công)
   */
  releaseSlot(sessionId: string) {
    if (!sessionId) return;
    try {
      const existing = this.getAllHolds().filter((h) => h.sessionId !== sessionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      if (broadcastChannel) {
        broadcastChannel.send({
          type: 'broadcast',
          event: 'HOLDS_CHANGED',
          payload: { sessionId, released: true },
        });
      }
      if (localBroadcast) {
        try {
          localBroadcast.postMessage({ type: 'HOLDS_CHANGED', sessionId, released: true });
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
    holdListeners.forEach((l) => l());
  },

  /**
   * Kiểm tra xem khung giờ này CÓ ĐANG ĐƯỢC NGƯỜI KHÁC TẠM GIỮ ƯU TIÊN (còn thời gian) hay không.
   * Nếu đã hết thời gian ưu tiên (now >= expiresAt) -> KHÔNG chặn người khác nữa (trả về null).
   */
  isSlotHeldByAnother(
    courtName: string,
    bookingDate: string,
    startTime: string,
    duration: number,
    mySessionId?: string
  ): CourtHold | null {
    const all = this.getAllHolds();
    const now = Date.now();
    const reqStart = parseTimeToMinutes(startTime);
    const reqEnd = reqStart + duration;
    const cleanReq = normalizeCourtCode(courtName);

    for (const h of all) {
      if (mySessionId && h.sessionId === mySessionId) continue;
      // Chỉ tính nếu CÒN trong thời gian giữ ưu tiên
      if (now >= h.expiresAt) continue;

      const cleanHold = normalizeCourtCode(h.courtName);
      const isSameCourt =
        cleanReq === cleanHold ||
        cleanReq.includes(cleanHold) ||
        cleanHold.includes(cleanReq);

      if (!isSameCourt) continue;
      if (h.bookingDate !== bookingDate) continue;

      const hStart = parseTimeToMinutes(h.startTime);
      const hEnd = hStart + h.duration;

      // Overlap: max(start1, start2) < min(end1, end2)
      if (Math.max(reqStart, hStart) < Math.min(reqEnd, hEnd)) {
        return h;
      }
    }

    return null;
  },

  /**
   * Kiểm tra trực tiếp trên Database xem khung giờ này ĐÃ CÓ LƯỢT ĐẶT THÀNH CÔNG NÀO CHƯA (tránh tranh chấp ai thanh toán trước thì được)
   */
  async checkRealBookingConflict(
    courtName: string,
    bookingDate: string,
    startTime: string,
    duration: number,
    excludeCustomerPhone?: string
  ): Promise<{ hasConflict: boolean; message?: string }> {
    try {
      const reqStart = parseTimeToMinutes(startTime);
      const reqEnd = reqStart + duration;

      // Tìm mã sân
      const { data: courtData } = await supabase
        .from('san')
        .select('ma_san, ten_san')
        .ilike('ten_san', `%${courtName.trim()}%`)
        .maybeSingle();

      const courtId = courtData?.ma_san;
      if (!courtId) return { hasConflict: false };

      // Tra cứu tất cả đơn đặt hợp lệ trên sân đó trong ngày
      const { data: bookings, error } = await supabase
        .from('dat_san')
        .select('ma_dat_san, gio_bat_dau, gio_ket_thuc, trang_thai, khach_hang(ho_ten, so_dien_thoai)')
        .eq('ma_san', courtId)
        .eq('ngay_dat', bookingDate)
        .neq('trang_thai', 'DA_HUY');

      if (error || !bookings) return { hasConflict: false };

      const cleanExcludePhone = excludeCustomerPhone ? excludeCustomerPhone.trim().replace(/[\s.-]/g, '') : '';

      for (const b of bookings as any[]) {
        const bPhone = (b.khach_hang?.so_dien_thoai || '').trim().replace(/[\s.-]/g, '');
        // Nếu đơn trên hệ thống trùng với chính số điện thoại của khách hàng đang hoàn tất thanh toán, bỏ qua không coi là xung đột
        if (cleanExcludePhone && bPhone && bPhone === cleanExcludePhone) {
          continue;
        }

        const bStart = parseTimeToMinutes((b.gio_bat_dau || '').slice(0, 5));
        const bEnd = parseTimeToMinutes((b.gio_ket_thuc || '').slice(0, 5));

        if (Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd)) {
          const customer = b.khach_hang?.ho_ten || 'Khách khác';
          return {
            hasConflict: true,
            message: `Khung giờ này vừa được ${customer} hoàn tất thanh toán trước (${b.ma_dat_san}).`,
          };
        }
      }

      return { hasConflict: false };
    } catch (err) {
      console.warn('Lỗi kiểm tra xung đột đặt sân trên DB:', err);
      return { hasConflict: false };
    }
  },
};
