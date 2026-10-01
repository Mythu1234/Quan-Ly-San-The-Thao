import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, BadgeCheck, Ban, CalendarCheck, CalendarClock, CheckCircle2, ChevronRight, CircleX, ClipboardList, Clock3, Cloud, CreditCard, FileText, Info, MapPin, Phone, QrCode, ReceiptText, Send, ShieldCheck, Undo2, UserRound, X, Zap } from 'lucide-react';

type BookingDetail = {
  code: string;
  customerName: string;
  phone: string;
  court: string;
  sport: string;
  time: string;
  paymentStatus: string;
  total: string;
  deposit: string;
  remaining: string;
  status: string;
};

const baseBooking: BookingDetail = {
  code: 'BK-8491',
  customerName: 'Anh Tuấn Hưng',
  phone: '0903.882.112',
  court: 'Sân 01',
  sport: 'Cầu lông',
  time: '06:00 - 07:30',
  paymentStatus: 'Đã đặt cọc 50%',
  total: '180.000 đ',
  deposit: '90.000 đ',
  remaining: '90.000 đ',
  status: 'Đã đặt',
};

type AdminSchedulePageProps = {
  onCheckoutModeChange?: (isCheckoutMode: boolean) => void;
};

export default function AdminSchedulePage({ onCheckoutModeChange }: AdminSchedulePageProps) {
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [checkinBooking, setCheckinBooking] = useState<BookingDetail | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<BookingDetail | null>(null);
  const [cancelBooking, setCancelBooking] = useState<BookingDetail | null>(null);
  const [cancelReviewBooking, setCancelReviewBooking] = useState<BookingDetail | null>(null);
  const [cancelApprovedBooking, setCancelApprovedBooking] = useState<BookingDetail | null>(null);
  const [cancelRejectedBooking, setCancelRejectedBooking] = useState<BookingDetail | null>(null);
  const [cancelErrorBooking, setCancelErrorBooking] = useState<BookingDetail | null>(null);
  const [showPendingCancelList, setShowPendingCancelList] = useState(false);
  const [cancelReviewBackTarget, setCancelReviewBackTarget] = useState<'timeline' | 'pendingList'>('timeline');
  const [cancelReason, setCancelReason] = useState('Khách bận đột xuất công tác liên tỉnh, gọi báo xin hủy ca tối nay.');
  const [courtView, setCourtView] = useState<'all' | 'badminton' | 'volleyball' | 'futsal'>('all');

  const timelineStartMinutes = 5 * 60;
  const timelineEndMinutes = 22 * 60 + 30;
  const slotWidth = 60;
  const rowHeight = 52;
  const leftCourtWidth = 80;

  const timelineTimes = useMemo(() => {
    const result: string[] = [];
    for (let minutes = timelineStartMinutes; minutes <= timelineEndMinutes; minutes += 30) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      result.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    }
    return result;
  }, [timelineStartMinutes, timelineEndMinutes]);

  const courts = [
    { id: 1, name: 'Sân 01' },
    { id: 2, name: 'Sân 02' },
    { id: 3, name: 'Sân 03' },
    { id: 4, name: 'Sân 04' },
    { id: 5, name: 'Sân 05' },
    { id: 6, name: 'Sân 06' },
    { id: 7, name: 'Sân 07' },
    { id: 8, name: 'Sân 08' },
  ];

  const displayedCourts = courts
    .map((court, originalIndex) => ({ ...court, originalIndex }))
    .filter((court) => {
      if (courtView === 'volleyball') return court.originalIndex <= 3;
      return true;
    });

  const getBookingStyle = (startH: number, startM: number, endH: number, endM: number, courtIndex: number, rowSpan = 1) => {
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const startOffsetMinutes = startMinutes - timelineStartMinutes;
    const durationMinutes = endMinutes - startMinutes;
    const pixelsPerMinute = slotWidth / 30;

    return {
      top: courtIndex * rowHeight + 4,
      left: leftCourtWidth + startOffsetMinutes * pixelsPerMinute + 2,
      width: durationMinutes * pixelsPerMinute - 4,
      height: rowHeight * rowSpan - 8,
    };
  };

  const getVisibleCourtPlacement = (originalCourtIndex: number, rowSpan = 1) => {
    const originalCourtIndexes = Array.from({ length: rowSpan }, (_, index) => originalCourtIndex + index);
    const visibleIndexes = displayedCourts
      .map((court, visibleIndex) => (originalCourtIndexes.includes(court.originalIndex) ? visibleIndex : -1))
      .filter((visibleIndex) => visibleIndex >= 0);

    if (visibleIndexes.length === 0) return null;

    return {
      courtIndex: visibleIndexes[0],
      rowSpan: visibleIndexes.length,
    };
  };

  const getFilteredBookingStyle = (
    startH: number,
    startM: number,
    endH: number,
    endM: number,
    originalCourtIndex: number,
    rowSpan = 1,
    bookingType: 'badminton' | 'volleyball' | 'futsal' = 'badminton',
  ) => {
    if (courtView !== 'all' && courtView !== bookingType) return { display: 'none' as const };

    const placement = getVisibleCourtPlacement(originalCourtIndex, rowSpan);
    if (!placement) return { display: 'none' as const };

    return getBookingStyle(startH, startM, endH, endM, placement.courtIndex, placement.rowSpan);
  };

  const highlightBandStyle = (startH: number, startM: number, endH: number, endM: number) => {
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const pixelsPerMinute = slotWidth / 30;

    return {
      left: leftCourtWidth + (startMinutes - timelineStartMinutes) * pixelsPerMinute,
      width: (endMinutes - startMinutes) * pixelsPerMinute,
    };
  };

  const openBooking = (booking: BookingDetail) => {
    setSelectedBooking(booking);
  };

  const openCheckinDetail = (booking: BookingDetail) => {
    setCheckinBooking(booking);
    setSelectedBooking(null);
    onCheckoutModeChange?.(true);
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'Đang sử dụng') return 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
    if (status === 'Chờ duyệt hủy') return 'bg-orange-50 text-orange-700 ring-1 ring-orange-300';
    return 'bg-blue-50 text-blue-700 ring-1 ring-blue-300';
  };

  const pendingCancelRequests: BookingDetail[] = [
    {
      code: 'BK-6184',
      customerName: 'Ngọc Mai',
      phone: '0908.224.118',
      court: 'Sân 02',
      sport: 'Cầu lông',
      time: '11:30 - 13:00',
      paymentStatus: 'Đã đặt cọc 50%',
      total: '180.000 đ',
      deposit: '90.000 đ',
      remaining: '90.000 đ',
      status: 'Chờ duyệt hủy',
    },
    {
      code: 'BK-7740',
      customerName: 'Minh Trí',
      phone: '0912.440.526',
      court: 'Sân 06',
      sport: 'Cầu lông',
      time: '14:00 - 15:30',
      paymentStatus: 'Đã đặt cọc 50%',
      total: '210.000 đ',
      deposit: '105.000 đ',
      remaining: '105.000 đ',
      status: 'Chờ duyệt hủy',
    },
    {
      code: 'BK-9023',
      customerName: 'Quang Thắng',
      phone: '0912.441.902',
      court: 'Sân 05',
      sport: 'Cầu lông',
      time: '07:00 - 08:30',
      paymentStatus: 'Đã đặt cọc 50%',
      total: '210.000 đ',
      deposit: '105.000 đ',
      remaining: '105.000 đ',
      status: 'Chờ duyệt hủy',
    },
  ];

  if (checkinBooking) {
    const courtNumber = checkinBooking.court.match(/\d+/)?.[0]?.padStart(2, '0') ?? '01';

    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f8f6ff] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setCheckinBooking(null);
            onCheckoutModeChange?.(false);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại lịch sân
        </button>

        <div className="mb-4">
          <div className="mb-2 flex justify-end">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 shadow-sm ring-1 ring-blue-300">
              Đã đặt chỗ
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 text-[17px] font-black uppercase tracking-tight text-slate-950">Chi tiết lượt đặt</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-black text-slate-600">
              Mã đặt: #{checkinBooking.code}
            </span>
          </div>
        </div>

        <section className="mb-4 flex items-center gap-3 rounded-2xl bg-indigo-100 p-4 shadow-sm ring-1 ring-indigo-100">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Clock3 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-black text-slate-950">Bắt đầu sau 35 phút nữa</h3>
            <p className="mt-0.5 text-[11px] font-medium text-slate-600">Sẵn sàng nhận khách lúc 17:50</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-blue-700" />
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-600">
              <UserRound className="h-4 w-4" />
              Thông tin khách hàng
            </h3>
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[9px] font-black text-slate-700">Standard Member</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[24px] font-black text-emerald-700">
              {checkinBooking.customerName.trim().charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-[15px] font-black text-slate-950">{checkinBooking.customerName}</h4>
              <p className="mt-1 text-[13px] font-semibold tracking-[0.08em] text-slate-600">{checkinBooking.phone}</p>
            </div>
            <button type="button" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-emerald-950 active:scale-95">
              <Phone className="h-5 w-5 fill-current" />
            </button>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
            <Clock3 className="h-4 w-4 text-amber-700" />
            Lịch sử: Đã chơi 14 trận • Không có vi phạm hủy muộn
          </p>
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-600">
              <MapPin className="h-4 w-4" />
              Sân đấu & Thời gian
            </h3>
            <span className="rounded-full bg-emerald-200 px-2.5 py-1 text-[9px] font-black text-emerald-900">{checkinBooking.sport} Trong Nhà</span>
          </div>
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-indigo-100 p-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-[18px] font-black text-white">
              S{courtNumber}
            </div>
            <div className="min-w-0">
              <h4 className="text-[16px] font-black uppercase text-slate-950">{checkinBooking.court} <span className="text-emerald-700">•</span></h4>
              <p className="mt-0.5 text-[11px] font-medium text-slate-600">Khu A tiêu chuẩn thảm Yonex • Tiêu chuẩn</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-indigo-50 p-3">
              <p className="text-[10px] font-black uppercase text-slate-600">Ngày thi đấu</p>
              <p className="mt-1 text-[15px] font-black text-slate-950">Hôm nay</p>
              <p className="text-[12px] font-medium text-slate-600">15/10/2026</p>
            </div>
            <div className="rounded-xl bg-indigo-50 p-3">
              <p className="text-[10px] font-black uppercase text-slate-600">Khung giờ chơi</p>
              <p className="mt-1 text-[15px] font-black text-blue-700">{checkinBooking.time}</p>
              <p className="text-[12px] font-medium text-slate-600">Tổng thời lượng: 90 phút</p>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wide text-slate-600">
              <CreditCard className="h-4 w-4" />
              Tài chính & Đặt cọc
            </h3>
            <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-slate-700">Tiền mặt / Chuyển khoản</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[13px] font-medium leading-snug text-slate-700">Tổng giá tiền sân (90 phút • 120.000 đ/h)</span>
              <span className="shrink-0 text-[15px] font-black text-slate-950">{checkinBooking.total}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-700">
                <span className="h-3 w-3 rounded-full bg-emerald-700" />
                Đã đặt cọc trước (50%)
              </span>
              <span className="text-[15px] font-black text-emerald-700">-{checkinBooking.deposit}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-indigo-100 pt-3">
              <span className="text-[14px] font-black text-slate-950">Khoản cần thu tại quầy:</span>
              <span className="text-[15px] font-black text-red-700">{checkinBooking.remaining}</span>
            </div>
          </div>
        </section>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setCheckinBooking(null);
              onCheckoutModeChange?.(false);
            }}
            className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-[14px] font-black text-white shadow-sm active:scale-[0.99]"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="truncate">Check-in Sân</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCancelBooking(checkinBooking);
              setCheckinBooking(null);
              onCheckoutModeChange?.(true);
            }}
            className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-[14px] font-black text-red-700 shadow-sm active:scale-[0.99]"
          >
            <CircleX className="h-5 w-5 shrink-0" />
            <span className="truncate">Hủy đặt sân</span>
          </button>
        </div>
      </div>
    );
  };

  if (cancelApprovedBooking) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f7f6ff] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setCancelReviewBooking(cancelApprovedBooking);
            setCancelApprovedBooking(null);
            onCheckoutModeChange?.(true);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại tiếp nhận yêu cầu hủy
        </button>
        <div className="mb-3 flex items-center gap-1.5 rounded-xl bg-indigo-100 p-1 text-[10px] font-black text-slate-600">
          <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white px-2 py-1.5 text-emerald-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-700" />
            Hủy thành công
          </span>
          <button
            type="button"
            onClick={() => {
              setCancelRejectedBooking(cancelApprovedBooking);
              setCancelApprovedBooking(null);
            }}
            className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-amber-700" />
            Chủ sân từ chối
          </button>
          <button
            type="button"
            onClick={() => {
              setCancelErrorBooking(cancelApprovedBooking);
              setCancelApprovedBooking(null);
            }}
            className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-red-700" />
            Lỗi hệ thống
          </button>
        </div>

        <section className="mb-3 overflow-hidden rounded-xl bg-emerald-700 p-4 text-white shadow-md">
          <div className="relative">
            <div className="absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-emerald-500/30" />
            <div className="relative z-10">
              <div className="mb-3 flex justify-end">
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase text-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-200" />
                  Đã giải phóng sân
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-200 text-emerald-800">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <h2 className="min-w-0 text-[16px] font-black uppercase leading-tight tracking-tight">Đã hủy đặt sân thành công</h2>
              </div>
              <p className="mt-2 text-[12px] font-medium leading-snug text-emerald-50">
                Yêu cầu đã được Admin ký duyệt và áp dụng đồng bộ toàn hệ thống.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-3 flex items-start gap-3 rounded-xl bg-indigo-50 p-4 shadow-sm ring-1 ring-indigo-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-emerald-700">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-emerald-700">Tác động timeline trực tiếp</p>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-800">
              Khung giờ <span className="font-black text-emerald-700">{cancelApprovedBooking.time}</span> tại <span className="font-black">{cancelApprovedBooking.court}</span> đã chuyển sang trạng thái <span className="font-black uppercase text-emerald-700">trống</span>, sẵn sàng nhận khách mới.
            </p>
          </div>
        </section>

        <section className="mb-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[16px] font-black text-slate-950">
              <ClipboardList className="h-5 w-5 text-slate-600" />
              Nhật ký Audit Log
            </h3>
            <span className="text-[15px] font-black text-emerald-700">#{cancelApprovedBooking.code}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Khách hàng:</span>
              <span className="text-right text-[13px] font-black text-slate-900">{cancelApprovedBooking.customerName}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Sân & Thời gian:</span>
              <span className="text-right text-[13px] font-black text-slate-900">{cancelApprovedBooking.court} <span className="font-semibold text-slate-500">({cancelApprovedBooking.time})</span></span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Người phê duyệt:</span>
              <span className="text-right text-[13px] font-black text-slate-900">Nguyễn Quốc Thái<br /><span className="text-[10px] font-bold text-slate-500">14:30 • 15/10/2024</span></span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Nhân viên thực hiện:</span>
              <span className="text-right text-[13px] font-black text-slate-900">Lê Hoàng Nam (NV-012)<br /><span className="text-[10px] font-bold text-slate-500">14:32 • 15/10/2024</span></span>
            </div>
            <div className="rounded-lg bg-indigo-50 px-3 py-3">
              <p className="text-[12px] font-semibold text-slate-500">Lý do hủy được duyệt:</p>
              <p className="mt-1 text-[13px] italic leading-relaxed text-slate-800">
                Khung giờ <span className="font-black text-emerald-700">{cancelApprovedBooking.time}</span> tại <span className="font-black">{cancelApprovedBooking.court}</span> đã chuyển sang trạng thái <span className="font-black uppercase text-emerald-700">trống</span>, sẵn sàng nhận khách mới.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-3 rounded-xl bg-indigo-100 p-4 text-[12px] font-medium leading-relaxed text-slate-600">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <p>Nghiệp vụ hoàn tiền cọc hoặc thanh toán chênh lệch được thực hiện riêng biệt tại sổ quỹ quầy giao dịch, không xử lý hay hiển thị số dư tại giao diện điều phối sân này.</p>
          </div>
        </section>

      </div>
    );
  }

  if (cancelRejectedBooking) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f7f6ff] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setCancelReviewBooking(cancelRejectedBooking);
            setCancelRejectedBooking(null);
            onCheckoutModeChange?.(true);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại tiếp nhận yêu cầu hủy
        </button>
        <div className="mb-3 flex items-center gap-1.5 rounded-xl bg-indigo-100 p-1 text-[10px] font-black text-slate-600">
          <button
            type="button"
            onClick={() => {
              setCancelApprovedBooking(cancelRejectedBooking);
              setCancelRejectedBooking(null);
            }}
            className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-700" />
            Hủy thành công
          </button>
          <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white px-2 py-1.5 text-amber-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-700" />
            Chủ sân từ chối
          </span>
          <button
            type="button"
            onClick={() => {
              setCancelErrorBooking(cancelRejectedBooking);
              setCancelRejectedBooking(null);
            }}
            className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-red-700" />
            Lỗi hệ thống
          </button>
        </div>

        <section className="mb-3 overflow-hidden rounded-xl bg-amber-700 p-4 text-white shadow-md">
          <div className="relative">
            <div className="absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-amber-500/30" />
            <div className="relative z-10">
              <div className="mb-3 flex justify-end">
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase text-amber-50">
                  <span className="h-2 w-2 rounded-full bg-amber-200" />
                  Giữ nguyên lịch đặt
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Ban className="h-6 w-6" />
                </div>
                <h2 className="min-w-0 text-[16px] font-black uppercase leading-tight tracking-tight">Chủ sân từ chối hủy lịch</h2>
              </div>
              <p className="mt-2 text-[12px] font-medium leading-snug text-amber-50">
                Yêu cầu hủy không được phê duyệt. Khung giờ vẫn được giữ trên timeline theo lịch đặt ban đầu.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-3 flex items-start gap-3 rounded-xl bg-amber-50 p-4 shadow-sm ring-1 ring-amber-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-amber-700">Tác động timeline trực tiếp</p>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-800">
              Khung giờ <span className="font-black text-amber-700">{cancelRejectedBooking.time}</span> tại <span className="font-black">{cancelRejectedBooking.court}</span> vẫn ở trạng thái <span className="font-black uppercase text-blue-700">đã đặt</span>, không giải phóng sân cho khách mới.
            </p>
          </div>
        </section>

        <section className="mb-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[16px] font-black text-slate-950">
              <ClipboardList className="h-5 w-5 text-slate-600" />
              Nhật ký xử lý
            </h3>
            <span className="text-[15px] font-black text-amber-700">#{cancelRejectedBooking.code}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Khách hàng:</span>
              <span className="text-right text-[13px] font-black text-slate-900">{cancelRejectedBooking.customerName}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Sân & Thời gian:</span>
              <span className="text-right text-[13px] font-black text-slate-900">{cancelRejectedBooking.court} <span className="font-semibold text-slate-500">({cancelRejectedBooking.time})</span></span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Người phê duyệt:</span>
              <span className="text-right text-[13px] font-black text-slate-900">Nguyễn Quốc Thái<br /><span className="text-[10px] font-bold text-slate-500">14:30 • 15/10/2024</span></span>
            </div>
            <div className="rounded-lg bg-amber-50 px-3 py-3 ring-1 ring-amber-100">
              <p className="text-[12px] font-semibold text-amber-700">Lý do từ chối:</p>
              <p className="mt-1 text-[13px] italic leading-relaxed text-slate-800">
                Lượt đặt vẫn còn hiệu lực và chưa đủ điều kiện hủy trong ngày theo quy định vận hành sân.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-3 rounded-xl bg-indigo-100 p-4 text-[12px] font-medium leading-relaxed text-slate-600">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <p>Nhân viên cần liên hệ lại khách để xác nhận lịch vẫn được giữ nguyên hoặc hướng dẫn khách gửi yêu cầu mới nếu phát sinh thay đổi.</p>
          </div>
        </section>

      </div>
    );
  }

  if (cancelErrorBooking) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f7f6ff] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setCancelReviewBooking(cancelErrorBooking);
            setCancelErrorBooking(null);
            onCheckoutModeChange?.(true);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại tiếp nhận yêu cầu hủy
        </button>
        <div className="mb-3 flex items-center gap-1.5 rounded-xl bg-indigo-100 p-1 text-[10px] font-black text-slate-600">
          <button
            type="button"
            onClick={() => {
              setCancelApprovedBooking(cancelErrorBooking);
              setCancelErrorBooking(null);
            }}
            className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-700" />
            Hủy thành công
          </button>
          <button
            type="button"
            onClick={() => {
              setCancelRejectedBooking(cancelErrorBooking);
              setCancelErrorBooking(null);
            }}
            className="flex flex-1 items-center justify-center gap-1 px-2 py-1.5"
          >
            <span className="h-2 w-2 rounded-full bg-amber-700" />
            Chủ sân từ chối
          </button>
          <span className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-white px-2 py-1.5 text-red-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-red-700" />
            Lỗi hệ thống
          </span>
        </div>

        <section className="mb-3 overflow-hidden rounded-xl bg-red-700 p-5 text-white shadow-md">
          <div className="relative">
            <div className="absolute -bottom-12 -right-10 h-32 w-32 rounded-full bg-red-500/30" />
            <div className="relative z-10">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase text-red-50">
                  <span className="h-2 w-2 rounded-full bg-red-200" />
                  Chưa áp dụng thay đổi
                </span>
              </div>
              <h2 className="text-[19px] font-black uppercase leading-tight tracking-tight">Lỗi hệ thống khi hủy lịch</h2>
              <p className="mt-2 text-[12px] font-medium leading-relaxed text-red-50">
                Hệ thống chưa thể hoàn tất xử lý yêu cầu. Timeline tạm thời giữ nguyên để tránh sai lệch lịch sân.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-3 flex items-start gap-3 rounded-xl bg-red-50 p-4 shadow-sm ring-1 ring-red-100">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-red-700">Tác động timeline trực tiếp</p>
            <p className="mt-1 text-[13px] font-medium leading-relaxed text-slate-800">
              Khung giờ <span className="font-black text-red-700">{cancelErrorBooking.time}</span> tại <span className="font-black">{cancelErrorBooking.court}</span> chưa được cập nhật. Vui lòng thử lại hoặc chuyển xử lý thủ công.
            </p>
          </div>
        </section>

        <section className="mb-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-[16px] font-black text-slate-950">
              <ClipboardList className="h-5 w-5 text-slate-600" />
              Nhật ký lỗi
            </h3>
            <span className="text-[15px] font-black text-red-700">#{cancelErrorBooking.code}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Khách hàng:</span>
              <span className="text-right text-[13px] font-black text-slate-900">{cancelErrorBooking.customerName}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-indigo-50 px-3 py-2.5">
              <span className="text-[12px] font-semibold text-slate-500">Sân & Thời gian:</span>
              <span className="text-right text-[13px] font-black text-slate-900">{cancelErrorBooking.court} <span className="font-semibold text-slate-500">({cancelErrorBooking.time})</span></span>
            </div>
            <div className="rounded-lg bg-red-50 px-3 py-3 ring-1 ring-red-100">
              <p className="text-[12px] font-semibold text-red-700">Mã lỗi:</p>
              <p className="mt-1 text-[13px] font-black text-slate-900">SYNC_CANCEL_409</p>
              <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-600">
                Không đồng bộ được trạng thái timeline trong phiên xử lý hiện tại.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-3 rounded-xl bg-indigo-100 p-4 text-[12px] font-medium leading-relaxed text-slate-600">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
            <p>Lịch đặt vẫn được bảo toàn cho đến khi hệ thống xử lý thành công hoặc quản trị viên xác nhận thao tác thủ công.</p>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setCancelErrorBooking(null);
              setCancelReviewBooking(cancelErrorBooking);
              onCheckoutModeChange?.(true);
            }}
            className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-red-700 px-2 text-[12px] font-black text-white shadow-sm active:scale-[0.99]"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate">Thử lại</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCancelApprovedBooking(null);
              setCancelRejectedBooking(null);
              setCancelErrorBooking(null);
              setCancelReviewBooking(null);
              onCheckoutModeChange?.(false);
            }}
            className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-100 px-2 text-[12px] font-black text-slate-800 active:scale-[0.99]"
          >
            <CalendarClock className="h-4 w-4 shrink-0" />
            <span className="truncate">Về Timeline</span>
          </button>
        </div>
      </div>
    );
  }

  if (showPendingCancelList) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f7f6ff] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setShowPendingCancelList(false);
            setCancelReviewBackTarget('timeline');
            onCheckoutModeChange?.(false);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại lịch sân
        </button>

        <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 text-[17px] font-black text-slate-950">
              <ReceiptText className="h-5 w-5 shrink-0 text-emerald-700" />
              Danh sách chờ duyệt
            </h2>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase text-orange-800">
              <span className="h-2 w-2 rounded-full bg-orange-700" />
              {pendingCancelRequests.length} chờ duyệt
            </span>
          </div>

          <div className="space-y-3">
            {pendingCancelRequests.map((request) => (
              <button
                key={request.code}
                type="button"
                onClick={() => {
                  setCancelReviewBooking(request);
                  setShowPendingCancelList(false);
                  setCancelReviewBackTarget('pendingList');
                  onCheckoutModeChange?.(true);
                }}
                className="w-full rounded-xl border border-slate-100 bg-white p-3 text-left shadow-sm active:scale-[0.99]"
              >
                <div className="rounded-xl bg-indigo-50 p-4 shadow-inner">
                  <div className="border-l-4 border-emerald-700 pl-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[17px] font-black text-slate-950">{request.court}</h3>
                        <div className="mt-1 flex items-center gap-2 text-[12px] font-bold">
                          <span className="text-emerald-700">#{request.code}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-400" />
                          <span className="text-[11px] text-slate-500">Sân tiêu chuẩn</span>
                        </div>
                      </div>
                      <UserRound className="h-7 w-7 shrink-0 text-emerald-700" />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="text-[9px] font-black text-slate-500">Khung giờ</p>
                          <p className="text-[15px] font-black text-slate-950">{request.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="text-[9px] font-black text-slate-500">Ngày chơi</p>
                          <p className="text-[15px] font-black text-slate-950">Hôm nay</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[15px] font-black text-slate-800">
                          {request.customerName.trim().charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-black text-slate-950">{request.customerName}</p>
                          <p className="text-[11px] font-semibold text-slate-500">{request.phone}</p>
                        </div>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                        <Phone className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-3">
                  <h3 className="flex items-center gap-2 text-[13px] font-black uppercase text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                    Yêu cầu hủy trong ngày
                  </h3>
                  <p className="mt-2 text-[12px] font-medium leading-relaxed text-slate-700">
                    Khung giờ vẫn được tạm giữ trên timeline cho đến khi có quyết định chính thức.
                  </p>
                </div>

                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-[12px] font-black text-slate-950">Lý do hủy lịch</h3>
                    <span className="text-[10px] font-black text-slate-500">Ghi nhận: 14:15</span>
                  </div>
                  <p className="rounded-lg bg-indigo-50 p-3 text-[12px] italic leading-relaxed text-slate-700">
                    “Khách bận đột xuất công tác liên tỉnh, gọi báo xin hủy ca tối nay.”
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (cancelReviewBooking) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f7f6ff] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setCancelReviewBooking(null);
            if (cancelReviewBackTarget === 'pendingList') {
              setShowPendingCancelList(true);
              onCheckoutModeChange?.(true);
            } else {
              onCheckoutModeChange?.(false);
            }
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {cancelReviewBackTarget === 'pendingList' ? 'Quay lại danh sách chờ duyệt' : 'Quay lại lịch sân'}
        </button>

        <section className="mb-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 text-[17px] font-black text-slate-950">
              <ReceiptText className="h-5 w-5 shrink-0 text-emerald-700" />
              Tiếp nhận yêu cầu hủy
            </h2>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black uppercase text-orange-800">
              <span className="h-2 w-2 rounded-full bg-orange-700" />
              Chờ duyệt
            </span>
          </div>

          <div className="rounded-xl bg-indigo-50 p-4 shadow-inner">
            <div className="border-l-4 border-emerald-700 pl-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[17px] font-black text-slate-950">{cancelReviewBooking.court}</h3>
                  <div className="mt-1 flex items-center gap-2 text-[12px] font-bold">
                    <span className="text-emerald-700">#{cancelReviewBooking.code}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-400" />
                    <span className="text-[11px] text-slate-500">Sân tiêu chuẩn</span>
                  </div>
                </div>
                <UserRound className="h-7 w-7 shrink-0 text-emerald-700" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-[9px] font-black text-slate-500">Khung giờ</p>
                    <p className="text-[15px] font-black text-slate-950">{cancelReviewBooking.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-[9px] font-black text-slate-500">Ngày chơi</p>
                    <p className="text-[15px] font-black text-slate-950">Hôm nay</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[15px] font-black text-slate-800">
                    {cancelReviewBooking.customerName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-black text-slate-950">{cancelReviewBooking.customerName}</p>
                    <p className="truncate text-[11px] font-semibold text-slate-500">{cancelReviewBooking.phone}</p>
                  </div>
                </div>
                <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 active:scale-95">
                  <Phone className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl bg-red-50 p-3 ring-1 ring-red-100">
            <h3 className="flex items-center gap-2 text-[13px] font-black uppercase text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Yêu cầu hủy trong ngày
            </h3>
            <p className="mt-2 text-[12px] font-medium leading-relaxed text-slate-600">
              Khung giờ vẫn được tạm giữ trên timeline cho đến khi có quyết định chính thức.
            </p>
          </div>

          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-[12px] font-black text-slate-900">Lý do hủy lịch (Ghi nhận từ khách)</h3>
              <span className="text-[10px] font-black text-slate-500">Ghi nhận: 14:15</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-indigo-50 p-3 text-[13px] italic leading-relaxed text-slate-800">
              <Info className="mt-1 h-4 w-4 shrink-0 text-slate-500" />
              <p>"{cancelReason}"</p>
            </div>
          </div>
        </section>

        <section className="mb-3 overflow-hidden rounded-xl bg-slate-900 shadow-sm">
          <div className="relative h-28 bg-[linear-gradient(135deg,#1e3a34_0%,#334155_50%,#0f172a_100%)]">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0, rgba(255,255,255,0.18) 1px, transparent 1px, transparent 44px)' }} />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-slate-950/90 to-transparent p-3 text-white">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-[13px] font-black leading-tight">Cụm sân cầu lông - Khu A<br />Tầng 2</p>
              </div>
              <span className="shrink-0 rounded bg-slate-900/75 px-2 py-1 text-[9px] font-black">Trạng thái: Đang giữ chỗ</span>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-black leading-tight text-slate-950">Duyệt yêu cầu hủy trong ngày</h2>
            </div>
          </div>

          <div className="mb-3 space-y-2 rounded-lg bg-indigo-50 p-3 text-[12px]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-500">Người phê duyệt:</span>
              <span className="text-right font-black text-slate-900">Nguyễn Quốc Thái</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-500">Tác động timeline:</span>
              <span className="text-right font-black text-emerald-700">Giải phóng ngay khung {cancelReviewBooking.time}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="font-bold text-slate-500">Trạng thái:</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-black uppercase text-red-700">Đã hủy</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCancelApprovedBooking(cancelReviewBooking);
                setCancelReviewBooking(null);
                onCheckoutModeChange?.(true);
              }}
              className="flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-red-700 px-2 text-[14px] font-black leading-none text-white shadow-sm active:scale-[0.99]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Chấp thuận hủy</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCancelRejectedBooking(cancelReviewBooking);
                setCancelReviewBooking(null);
                onCheckoutModeChange?.(true);
              }}
              className="flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-2 text-[14px] font-black leading-none text-slate-800 active:scale-[0.99]"
            >
              <CircleX className="h-4 w-4 shrink-0" />
              <span className="truncate">Từ chối hủy</span>
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (cancelBooking) {
    const reasonOptions = [
      { label: 'Khách bận đột xuất', icon: Zap, value: 'Khách bận đột xuất công tác liên tỉnh, gọi báo xin hủy ca tối nay.' },
      { label: 'Thời tiết/Sức khỏe', icon: Cloud, value: 'Lý do thời tiết/sức khỏe thành viên không đảm bảo, khách xin hủy lịch.' },
      { label: 'Trùng lịch thi đấu', icon: CalendarClock, value: 'Trùng lịch thi đấu giải công ty, khách xin dời lịch.' },
    ];
    const reasonLength = cancelReason.length;

    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-[#f7f6ff] px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setCancelBooking(null);
            onCheckoutModeChange?.(false);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại lịch sân
        </button>

        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="min-w-0 text-[17px] font-black uppercase tracking-tight text-slate-950">Yêu cầu hủy ca</h2>
          <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-black text-slate-600">
            Mã đặt: {cancelBooking.code}
          </span>
        </div>

        <section className="mb-3 overflow-hidden rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="border-l-4 border-amber-600 pl-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-emerald-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-[18px] font-black leading-tight text-slate-950">{cancelBooking.court}</h2>
                  <p className="text-[11px] font-black text-slate-600">{cancelBooking.sport}</p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 ring-1 ring-blue-200">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Đã giữ sân
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-indigo-50 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <UserRound className="h-5 w-5 shrink-0 text-slate-600" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-black text-slate-900">{cancelBooking.customerName}</p>
                  <p className="truncate text-[11px] font-bold text-slate-500">Khách đặt sân • {cancelBooking.phone}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-1 text-amber-700">
                  <Clock3 className="h-4 w-4" />
                  <span className="text-[14px] font-black">{cancelBooking.time}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500">Hôm nay</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-3 rounded-xl bg-orange-50 p-4 shadow-sm ring-1 ring-orange-100">
          <h3 className="mb-2 flex items-center gap-2 text-[12px] font-black uppercase text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Cảnh báo hủy lịch trong ngày
          </h3>
          <p className="text-[12px] font-medium leading-relaxed text-amber-950">
            Lượt đặt diễn ra trong ngày hôm nay. Theo quy định sân, nhân viên <strong className="font-black text-amber-800">không được</strong> tự ý hủy trực tiếp mà phải gửi yêu cầu phê duyệt đến Chủ sân.
          </p>
        </section>

        <section className="mb-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between gap-3">
            <label className="text-[12px] font-black text-slate-900">
              Lý do hủy lịch <span className="text-red-600">*</span>
              <span className="ml-1 text-[11px] font-semibold text-slate-500">(Bắt buộc từ khách)</span>
            </label>
            <span className="shrink-0 text-[11px] font-black text-slate-600">{reasonLength}/200</span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {reasonOptions.map(({ label, icon: Icon, value }) => (
              <button
                key={label}
                type="button"
                onClick={() => setCancelReason(value)}
                className="flex h-7 items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 text-[11px] font-black text-slate-600 active:scale-95"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          <textarea
            value={cancelReason}
            maxLength={200}
            onChange={(event) => setCancelReason(event.target.value)}
            className="h-24 w-full resize-none rounded-lg border border-indigo-50 bg-indigo-50 p-3 text-[13px] font-medium leading-relaxed text-slate-900 outline-none focus:border-emerald-200 focus:bg-white"
            placeholder="Nhập lý do khách yêu cầu hủy lịch..."
          />
        </section>

        <section className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-start gap-3 rounded-lg bg-indigo-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-emerald-700">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-slate-950">Xác nhận gửi kiểm duyệt</h3>
              <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-600">
                Sau khi gửi, yêu cầu sẽ chuyển trạng thái <span className="font-black text-amber-700">"Chờ Chủ sân duyệt"</span>. Lịch vẫn hiển thị trên sơ đồ sân.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setCancelReviewBooking(cancelBooking);
              setCancelReviewBackTarget('timeline');
              setCancelBooking(null);
              onCheckoutModeChange?.(true);
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-700 text-[14px] font-black text-white shadow-sm active:scale-[0.99]"
          >
            <Send className="h-5 w-5" />
            Gửi yêu cầu hủy
          </button>
          <div className="mt-3 flex items-start justify-center gap-1.5 text-center text-[10px] font-semibold leading-relaxed text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            Khi đóng hoặc quay lại, hệ thống cam kết giữ nguyên 100% lịch đặt.
          </div>
        </section>
      </div>
    );
  }

  if (checkoutBooking) {
    const amountDue = checkoutBooking.remaining;

    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-3 py-3">
        <button
          type="button"
          onClick={() => {
            setCheckoutBooking(null);
            onCheckoutModeChange?.(false);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-[11px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại lịch sân
        </button>

        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
              <FileText className="h-3.5 w-3.5 text-emerald-700" />
              <span>{checkoutBooking.court}</span>
            </div>
            <h2 className="mt-1 text-xl font-black uppercase tracking-tight text-slate-950">Quyết toán check-out</h2>
          </div>
          <span className="shrink-0 rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-black text-slate-600">
            Mã đặt: {checkoutBooking.code}
          </span>
        </div>

        <section className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <UserRound className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-[17px] font-black text-slate-950">{checkoutBooking.customerName}</h3>
                <span className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700 ring-1 ring-amber-100">
                  Hội viên VIP
                </span>
                <p className="mt-1 text-[12px] font-semibold text-slate-500">{checkoutBooking.phone} • Mã: KH-0482</p>
              </div>
            </div>
            <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 active:scale-95">
              <Phone className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
            <div className="rounded-lg bg-slate-100 px-2 py-2 text-center text-[10px] font-bold text-slate-500">Khách thân thiết</div>
            <div className="rounded-lg bg-slate-100 px-2 py-2 text-center text-[10px] font-bold text-slate-500">12 lượt đặt/tháng</div>
            <div className="rounded-lg bg-orange-100 px-2 py-2 text-center text-[10px] font-black text-orange-700">Đang sử dụng</div>
          </div>
        </section>

        <section className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[14px] font-black text-slate-900">
              <Clock3 className="h-4 w-4 text-emerald-700" />
              Thời gian sử dụng thực tế
            </h3>
            <span className="text-[11px] font-bold text-slate-500">Thứ 7, 24/10/2026</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-slate-100 p-3">
              <p className="text-[10px] font-bold text-slate-500">Check-in thực</p>
              <p className="mt-1 text-lg font-black text-slate-950">08:02</p>
              <p className="text-[10px] font-semibold text-slate-500">Sớm 8 phút</p>
            </div>
            <div className="rounded-lg bg-slate-100 p-3">
              <p className="text-[10px] font-bold text-slate-500">Hạn lịch đặt</p>
              <p className="mt-1 text-lg font-black text-slate-950">09:30</p>
              <p className="text-[10px] font-semibold text-slate-500">Tổng: 90 phút</p>
            </div>
            <div className="rounded-lg bg-emerald-100 p-3">
              <p className="text-[10px] font-bold text-emerald-700">Check-out hiện tại</p>
              <p className="mt-1 text-lg font-black text-emerald-800">09:38</p>
              <p className="text-[10px] font-black text-emerald-700">+8 phút lố</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-[12px] leading-relaxed text-slate-600">
            <p className="font-black text-emerald-700">Trong 10 phút nhắc nhở ân hạn (09:30 - 09:40) - Không tính phụ phí thêm giờ</p>
            <p className="mt-1">Chỉ sau mốc 10 phút ân hạn mới áp dụng phụ phí theo cấu hình hệ thống.</p>
          </div>
        </section>

        <section className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 text-[14px] font-black text-slate-900">
            <FileText className="h-4 w-4 text-blue-600" />
            Bảng kê chi tiết thanh toán & quyết toán
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-600">Tiền sân theo hợp đồng đặt (1.5h)</span>
              <span className="text-[15px] font-black text-slate-950">{checkoutBooking.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-600">Đã thanh toán trước / Tiền cọc</span>
              <span className="text-[15px] font-black text-emerald-700">-{checkoutBooking.deposit}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-600">Phụ phí thêm giờ</span>
              <span className="text-[15px] font-black text-slate-600">0đ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-slate-600">Khoản phát sinh đã ghi nhận</span>
              <span className="text-[15px] font-black text-slate-950">+45.000đ</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-500">Tổng giá trị thực tế tiêu dùng</span>
                <span className="text-[15px] font-black text-slate-950">285.000đ</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-indigo-100 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase text-slate-700">Số tiền còn phải thu</p>
                  <p className="text-[10px] font-black text-orange-700">Cần thu đủ trước khi bàn giao sân</p>
                </div>
                <p className="shrink-0 text-3xl font-black text-emerald-800">{amountDue}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-[14px] font-black text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Ghi nhận sự cố & thiết bị phát sinh
            </h3>
            <button type="button" className="text-[11px] font-black text-emerald-700">Thêm ghi chú</button>
          </div>
          <label className="text-[11px] font-bold text-slate-600">Mô tả tình trạng hiện trường trả sân:</label>
          <textarea
            className="mt-2 h-20 w-full resize-none rounded-lg border border-slate-100 bg-slate-100 p-3 text-[13px] outline-none"
            placeholder="Ví dụ: Hỏng lưới, gãy cán vợt thuê, mượn bóng chưa trả..."
          />
          <p className="mt-2 rounded-lg bg-indigo-50 p-2 text-[11px] font-semibold leading-relaxed text-slate-600">
            Không tự động tính tiền đền bù nếu chưa có mức được cấp thẩm quyền phê duyệt.
          </p>
        </section>

        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-[14px] font-black text-slate-900">Hình thức thu tiền</h3>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className="rounded-xl bg-indigo-100 px-2 py-4 text-[12px] font-black text-emerald-700">
              <QrCode className="mx-auto mb-1 h-5 w-5" />
              QR Chuyển khoản
            </button>
            <button type="button" className="rounded-xl bg-slate-100 px-2 py-4 text-[12px] font-black text-slate-600">
              <CreditCard className="mx-auto mb-1 h-5 w-5" />
              Tiền mặt
            </button>
            <button type="button" className="rounded-xl bg-slate-100 px-2 py-4 text-[12px] font-black text-slate-600">
              <CreditCard className="mx-auto mb-1 h-5 w-5" />
              Thẻ / POS
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-100 p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white">
              <QrCode className="h-7 w-7 text-slate-800" />
            </div>
            <div>
              <p className="text-[13px] font-black text-slate-900">Mã VietQR Động</p>
              <p className="text-[12px] font-semibold text-slate-500">Nội dung: CK {checkoutBooking.code.replace('BK-', '')} {amountDue.replace(/\D/g, '')}K</p>
            </div>
          </div>
        </section>

        <button
          type="button"
          onClick={() => {
            setCheckoutBooking(null);
            onCheckoutModeChange?.(false);
          }}
          className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-[14px] font-black text-white shadow-lg active:scale-[0.99]"
        >
          <CheckCircle2 className="h-5 w-5" />
          Xác nhận thu {amountDue} & Hoàn tất Check-out
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 bg-slate-50 relative overflow-hidden flex flex-col">
        <div className="shrink-0 bg-slate-50 px-2 py-1.5">
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[9px] font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setCourtView('all')}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-black ${
                courtView === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-white/80" />
              Tất cả sân (8)
            </button>
            <button
              type="button"
              onClick={() => setCourtView('badminton')}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-bold ${
                courtView === 'badminton' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-700" />
              Cầu lông (Sân 01 - Sân 08)
            </button>
            <button
              type="button"
              onClick={() => setCourtView('volleyball')}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-bold ${
                courtView === 'volleyball' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-blue-700" />
              Bóng chuyền (BC1)
            </button>
            <button
              type="button"
              onClick={() => setCourtView('futsal')}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-bold ${
                courtView === 'futsal' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-700" />
              Bóng đá mini Futsal
            </button>
            <span className="ml-auto flex shrink-0 items-center gap-1 pl-2 text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Thời gian thực: 15:42
            </span>
          </div>
        </div>

        <div className="mx-2 shrink-0 rounded-lg border border-indigo-100 bg-indigo-50/70 px-2 py-1.5 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-[9px] font-black uppercase text-slate-800">
            <Info className="h-3 w-3 text-teal-700" />
            Chú giải trạng thái
          </div>
          <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[9px] font-bold text-slate-700 min-[430px]:grid-cols-4">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-white ring-1 ring-slate-200" />
              Trống
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-blue-100 ring-1 ring-blue-300" />
              Đã đặt
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-emerald-600 ring-1 ring-emerald-500/20" />
              Đang đá/chơi
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-slate-300 ring-1 ring-slate-300" />
              Bảo trì
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-emerald-100/60 ring-1 ring-emerald-200/80" />
              Khóa cố định
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-red-600" />
              Quá giờ
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-orange-50 ring-1 ring-orange-300" />
              Chờ duyệt hủy
            </div>
          </div>
        </div>

        <div className="h-2 shrink-0 bg-slate-50" />

        <div ref={timelineScrollRef} className="flex-1 min-h-0 overflow-auto bg-slate-50 custom-scrollbar">
          <div
            className="relative select-none"
            style={{ width: leftCourtWidth + timelineTimes.length * slotWidth }}
          >
            <div className="sticky top-0 z-[70] flex h-10 bg-slate-100 border-b border-slate-200 shadow-[0_1px_0_rgba(148,163,184,0.2)]">
              <div
                className="sticky left-0 z-[80] h-full shrink-0 bg-slate-100 border-r border-slate-200 flex items-center justify-center shadow-[2px_0_10px_rgba(15,23,42,0.06)]"
                style={{ width: leftCourtWidth }}
              >
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Mã sân</span>
              </div>
              <div className="flex h-full">
                {timelineTimes.map((time) => {
                  const isFixed = time >= '05:30' && time < '09:00';
                  const isPriority = time >= '17:30' && time < '21:00';
                  const isNight = time >= '21:00';

                  return (
                    <div
                      key={time}
                      className={`w-[60px] shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-black ${
                        isFixed
                          ? 'text-emerald-700 bg-emerald-50/70'
                          : isPriority
                            ? 'text-slate-900 bg-blue-50/60'
                            : isNight
                              ? 'text-orange-700 bg-orange-50/60'
                              : 'text-slate-700'
                      }`}
                    >
                      {time}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative" style={{ height: displayedCourts.length * rowHeight }}>
              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none border-x border-emerald-200/80 bg-emerald-100/30"
                style={highlightBandStyle(5, 30, 9, 0)}
              >
                <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-black uppercase text-emerald-700 shadow-sm">
                  Khóa cố định
                </span>
              </div>
              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none"
                style={{
                  ...highlightBandStyle(17, 30, 21, 0),
                  backgroundColor: '#f8fafc',
                  backgroundImage: 'repeating-linear-gradient(135deg, rgba(148, 163, 184, 0.32) 0, rgba(148, 163, 184, 0.32) 1px, transparent 1px, transparent 6px)',
                }}
              >
                <span className="absolute left-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-black uppercase text-blue-700 shadow-sm">
                  Ưu tiên cầu lông 17:30 - 21:00
                </span>
              </div>

              {displayedCourts.map((court, rowIndex) => (
                <div
                  key={court.id}
                  className="absolute left-0 right-0 flex border-b border-slate-200/70"
                  style={{ top: rowIndex * rowHeight, height: rowHeight }}
                >
                  <div
                    className="sticky left-0 z-50 shrink-0 bg-white border-r border-slate-200 flex flex-col items-center justify-center shadow-[2px_0_10px_rgba(15,23,42,0.06)]"
                    style={{ width: leftCourtWidth }}
                  >
                    <span className="font-black text-[11px] text-slate-800 leading-tight">{court.name}</span>
                    <span className="mt-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-500">Cầu lông</span>
                  </div>
                  <div className="flex h-full">
                    {timelineTimes.map((time) => (
                      <div
                        key={`${court.id}-${time}`}
                        className="w-[60px] shrink-0 border-r border-slate-200/60 bg-white flex items-center justify-center"
                      >
                        <span className="h-2 w-px bg-slate-100" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => openBooking(baseBooking)}
                className="absolute z-20 rounded-lg bg-blue-50 border border-blue-300 px-2 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-transform overflow-hidden"
                style={getFilteredBookingStyle(6, 0, 7, 30, 0)}
              >
                <span className="text-[10px] font-black text-blue-950 truncate">Tuấn Hưng</span>
                <span className="text-[8px] font-semibold text-blue-700 truncate">06:00 - 07:30 • Đã đặt</span>
              </button>

              <button
                type="button"
                onClick={() => openBooking({
                  ...baseBooking,
                  code: 'BK-9023',
                  customerName: 'Quang Thắng',
                  phone: '0912.441.902',
                  court: 'Sân 05',
                  time: '07:00 - 08:30',
                  total: '210.000 đ',
                  deposit: '105.000 đ',
                  remaining: '105.000 đ',
                  status: 'Đang sử dụng',
                })}
                className="absolute z-20 rounded-lg bg-emerald-600 text-white px-2 flex flex-col justify-center text-left shadow-sm ring-1 ring-emerald-500/20 active:scale-[0.99] transition-transform overflow-hidden"
                style={getFilteredBookingStyle(7, 0, 8, 30, 4)}
              >
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-100 animate-ping" />
                  <span className="text-[10px] font-black truncate">Quang Thắng</span>
                </div>
                <span className="text-[8px] font-semibold text-emerald-50 truncate">07:00 - 08:30 • Đang dùng</span>
              </button>

              <button
                type="button"
                onClick={() => openBooking({
                  ...baseBooking,
                  code: 'BK-6184',
                  customerName: 'Ngọc Mai',
                  phone: '0908.224.118',
                  court: 'Sân 02',
                  time: '11:30 - 13:00',
                  total: '180.000 đ',
                  deposit: '90.000 đ',
                  remaining: '90.000 đ',
                })}
                className="absolute z-20 rounded-lg bg-blue-50 border border-blue-300 px-2 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-transform overflow-hidden"
                style={getFilteredBookingStyle(11, 30, 13, 0, 1)}
              >
                <span className="text-[10px] font-black text-blue-950 truncate">Ngọc Mai</span>
                <span className="text-[8px] font-semibold text-blue-700 truncate">11:30 - 13:00 • Đã đặt</span>
              </button>

              <button
                type="button"
                onClick={() => openBooking({
                  ...baseBooking,
                  code: 'BK-BC01',
                  customerName: 'CLB Vigor Volley',
                  phone: '0944.332.991',
                  court: 'Sân gộp BC1',
                  sport: 'Bóng chuyền',
                  time: '09:30 - 11:00',
                  total: '450.000 đ',
                  deposit: '225.000 đ',
                  remaining: '225.000 đ',
                })}
                className="absolute z-30 rounded-lg bg-blue-50 border border-blue-400 px-3 py-2 text-left shadow-[0_3px_14px_rgba(37,99,235,0.12)] overflow-hidden active:scale-[0.99] transition-transform"
                style={getFilteredBookingStyle(9, 30, 11, 0, 0, 4, 'volleyball')}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">Gộp 4 sân</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[8px] font-black text-blue-700">BC</span>
                </div>
                <div className="mt-3 text-xs font-black text-blue-950 leading-tight">BÓNG CHUYỀN BC1</div>
                <div className="mt-1 text-[10px] font-bold text-blue-700 truncate">CLB Vigor Volley</div>
                <div className="mt-0.5 text-[9px] font-medium text-blue-600 truncate">09:30 - 11:00 • Đã đặt</div>
              </button>

              <button
                type="button"
                onClick={() => openBooking({
                  ...baseBooking,
                  code: 'BK-7740',
                  customerName: 'Minh Trí',
                  phone: '0978.112.339',
                  court: 'Sân 06',
                  time: '14:00 - 15:30',
                  total: '150.000 đ',
                  deposit: '75.000 đ',
                  remaining: '75.000 đ',
                  status: 'Chờ duyệt hủy',
                })}
                className="absolute z-20 rounded-lg bg-orange-50 border border-orange-300 px-2 text-left shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
                style={getFilteredBookingStyle(14, 0, 15, 30, 5)}
              >
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  <span className="text-[10px] font-black text-slate-800 truncate">Minh Trí</span>
                </div>
                <span className="mt-0.5 block text-[8px] font-semibold text-orange-700 truncate">14:00 - 15:30 • Chờ duyệt hủy</span>
              </button>

              <button
                type="button"
                onClick={() => openBooking({
                  ...baseBooking,
                  code: 'BK-7328',
                  customerName: 'Trần Bảo',
                  phone: '0935.778.220',
                  court: 'Sân 08',
                  time: '15:30 - 16:30',
                  total: '120.000 đ',
                  deposit: '60.000 đ',
                  remaining: '60.000 đ',
                })}
                className="absolute z-20 rounded-lg bg-blue-50 border border-blue-300 px-2 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-transform overflow-hidden"
                style={getFilteredBookingStyle(15, 30, 16, 30, 7)}
              >
                <span className="text-[10px] font-black text-blue-950 truncate">Trần Bảo</span>
                <span className="text-[8px] font-semibold text-blue-700 truncate">15:30 - 16:30 • Đã đặt</span>
              </button>

              <button
                type="button"
                onClick={() => openBooking({
                  ...baseBooking,
                  code: 'BK-4830',
                  customerName: 'CLB Smash',
                  phone: '0981.442.500',
                  court: 'Sân 03',
                  time: '17:30 - 19:00',
                  total: '240.000 đ',
                  deposit: '120.000 đ',
                  remaining: '120.000 đ',
                })}
                className="absolute z-20 rounded-lg bg-blue-50 border border-blue-300 px-2 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-transform overflow-hidden"
                style={getFilteredBookingStyle(17, 30, 19, 0, 2)}
              >
                <span className="text-[10px] font-black text-blue-950 truncate">CLB Smash</span>
                <span className="text-[8px] font-semibold text-blue-700 truncate">17:30 - 19:00 • Đã đặt</span>
              </button>

              <button
                type="button"
                onClick={() => openBooking({
                  ...baseBooking,
                  code: 'BK-5107',
                  customerName: 'Hà Linh',
                  phone: '0966.120.775',
                  court: 'Sân 07',
                  time: '19:00 - 20:30',
                  total: '240.000 đ',
                  deposit: '120.000 đ',
                  remaining: '120.000 đ',
                })}
                className="absolute z-20 rounded-lg bg-blue-50 border border-blue-300 px-2 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-transform overflow-hidden"
                style={getFilteredBookingStyle(19, 0, 20, 30, 6)}
              >
                <span className="text-[10px] font-black text-blue-950 truncate">Hà Linh</span>
                <span className="text-[8px] font-semibold text-blue-700 truncate">19:00 - 20:30 • Đã đặt</span>
              </button>

              <button
                type="button"
                onClick={() => openBooking({
                  ...baseBooking,
                  code: 'BK-BD01',
                  customerName: 'FC Đại Nam',
                  phone: '0938.990.113',
                  court: 'Sân mini Futsal BĐ1',
                  sport: 'Bóng đá mini',
                  time: '21:00 - 22:30',
                  total: '800.000 đ',
                  deposit: '400.000 đ',
                  remaining: '400.000 đ',
                })}
                className="absolute z-30 rounded-lg bg-blue-50 border border-blue-400 px-3 py-2 text-left shadow-lg overflow-hidden active:scale-[0.99] transition-transform"
                style={getFilteredBookingStyle(21, 0, 22, 30, 0, 8, 'futsal')}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded bg-blue-600 px-2 py-0.5 text-[8px] font-black uppercase text-white">Gộp 8 sân toàn khu</span>
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[8px] font-black text-blue-700">BĐ</span>
                </div>
                <div className="mt-8 text-sm font-black text-blue-950 leading-tight">BÓNG ĐÁ MINI BĐ1</div>
                <div className="mt-1 text-[11px] font-bold text-blue-700 truncate">FC Đại Nam • Đã cọc 50%</div>
                <div className="mt-0.5 text-[9px] font-medium text-blue-600 truncate">21:00 - 22:30 • Đã đặt</div>
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-slate-50 px-2 py-1.5">
          <button
            type="button"
            onClick={() => {
              setShowPendingCancelList(true);
              onCheckoutModeChange?.(true);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-md border border-orange-100 bg-white px-2.5 py-1.5 text-left shadow-sm active:scale-[0.99]"
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-700">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-black text-slate-950">Danh sách chờ duyệt</p>
                <p className="truncate text-[9px] font-semibold text-slate-500">Yêu cầu hủy sân đang chờ xử lý</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[8px] font-black uppercase text-orange-800">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-700" />
              {pendingCancelRequests.length} đang chờ
            </span>
          </button>
        </div>

      </div>



      {selectedBooking && (
        <div className="absolute inset-0 z-[120] flex flex-col justify-end bg-slate-950/45 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="Đóng chi tiết"
            className="flex-1 cursor-default"
            onClick={() => setSelectedBooking(null)}
          />
          <section className="max-h-[86vh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <button
                type="button"
                aria-label="Mở chi tiết lượt đặt đầy đủ"
                onClick={() => openCheckinDetail(selectedBooking)}
                className="rounded-full px-4 py-1 active:scale-95"
              >
                <span className="block h-1.5 w-10 rounded-full bg-slate-300" />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-3 pt-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Mã đặt: {selectedBooking.code}</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-black text-slate-950">Chi tiết lượt đặt sân</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${getStatusBadgeClass(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng"
                onClick={() => setSelectedBooking(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition active:scale-95 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 bg-slate-50 px-3 py-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500">Khách hàng</p>
                    <p className="mt-0.5 text-[13px] font-black text-slate-900">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500">Số điện thoại</p>
                    <p className="mt-0.5 text-[13px] font-black text-emerald-700">{selectedBooking.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500">Sân & Bộ môn</p>
                    <p className="mt-0.5 text-[13px] font-black text-slate-900">{selectedBooking.court}</p>
                    <p className="text-[10px] font-semibold text-slate-500">{selectedBooking.sport}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500">Khung thời gian</p>
                    <p className="mt-0.5 text-[13px] font-black text-slate-900">{selectedBooking.time}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500">Trạng thái thanh toán</p>
                    <p className="mt-0.5 text-[12px] font-black text-orange-600">{selectedBooking.paymentStatus}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500">Tổng số tiền</p>
                    <p className="mt-0.5 text-[13px] font-black text-emerald-700">{selectedBooking.total}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[11px] font-bold text-slate-500">Đã đặt cọc trước (50%)</span>
                  <span className="text-[13px] font-black text-emerald-700">{selectedBooking.deposit}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-bold text-red-500">Còn lại cần thu khi nhận sân</span>
                  <span className="text-[13px] font-black text-red-600">{selectedBooking.remaining}</span>
                </div>
              </div>

              <div className="space-y-2">
                {selectedBooking.status === 'Đã đặt' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openCheckinDetail(selectedBooking)}
                      className="flex h-10 items-center justify-center gap-1.5 rounded bg-emerald-700 px-2 text-[11px] font-black text-white shadow-sm transition active:scale-[0.99]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Check-in sân</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelBooking(selectedBooking);
                        setSelectedBooking(null);
                        onCheckoutModeChange?.(true);
                      }}
                      className="flex h-10 items-center justify-center gap-1.5 rounded border border-red-100 bg-white px-2 text-[11px] font-black text-red-600 shadow-sm transition active:scale-[0.99]"
                    >
                      <Ban className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Hủy đặt sân</span>
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'Đang sử dụng' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutBooking(selectedBooking);
                        setSelectedBooking(null);
                        onCheckoutModeChange?.(true);
                      }}
                      className="flex h-10 items-center justify-center gap-1.5 rounded border border-slate-200 bg-white text-[11px] font-black text-slate-800 shadow-sm transition active:scale-[0.99]"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Kết thúc / Trả sân
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelBooking(selectedBooking);
                        setSelectedBooking(null);
                        onCheckoutModeChange?.(true);
                      }}
                      className="flex h-10 items-center justify-center gap-1.5 rounded border border-red-100 bg-white text-[11px] font-black text-red-600 shadow-sm transition active:scale-[0.99]"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Hủy đặt sân
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'Chờ duyệt hủy' && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[11px] font-bold leading-relaxed text-orange-700">
                    Lượt đặt đang chờ duyệt hủy. Không thể check-in hoặc trả sân trong lúc chờ xử lý.
                  </div>
                )}

                {selectedBooking.status === 'Đã hủy' && (
                  <div className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-[11px] font-bold leading-relaxed text-slate-600">
                    Lượt đặt đã hủy. Không còn thao tác sân khả dụng.
                  </div>
                )}
              </div>

              {(selectedBooking.status === 'Đã đặt' || selectedBooking.status === 'Đang sử dụng') && (
                <div className="flex items-start gap-1.5 px-1 text-[9px] italic leading-relaxed text-slate-400">
                  <Phone className="mt-0.5 h-3 w-3 shrink-0" />
                  <p>Lưu ý: Thao tác hủy thủ công sẽ gửi tin nhắn SMS xác nhận tự động hoàn tiền/cấn trừ cho khách.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
