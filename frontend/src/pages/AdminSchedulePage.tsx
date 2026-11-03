import { useMemo, useRef, useState, useEffect } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRightLeft, Ban, Calendar, CalendarClock,
  Check, CheckCircle2, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, CircleX,
  Clock3, Cloud, CreditCard, Info, LayoutGrid, MapPin, Phone,
  Printer, ReceiptText, ShieldCheck, Undo2, UserRound, X, Zap
} from 'lucide-react';
import QrCodeArtwork from '../components/QrCodeArtwork';
import CheckoutSettlementView from '../components/admin/CheckoutSettlementView';
import type { FacilityEquipment, FacilityIncident } from '../types/admin';
import type { IncidentReporter } from '../utils/incidentStorage';
import type { CheckoutRequest, CheckoutResult } from '../utils/checkoutSettlement';
import useCourtAvailability, { isCourtLocked } from '../hooks/useCourtAvailability';

// Calendar values use Vietnam wall time, independently of the browser time zone.
const getVietnamTime = (instant = new Date()) => {
  const vietnam = new Date(instant.getTime() + 7 * 60 * 60 * 1000);
  return new Date(vietnam.getUTCFullYear(), vietnam.getUTCMonth(), vietnam.getUTCDate(),
    vietnam.getUTCHours(), vietnam.getUTCMinutes(), vietnam.getUTCSeconds());
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

import useSharedBookings from '../hooks/useSharedBookings';
import { calendarBookingDate } from '../utils/courtBookingWarnings';
import type { BookingDetail } from '../types/schedule';
export type { BookingDetail } from '../types/schedule';
export { INITIAL_ADMIN_BOOKINGS } from '../types/schedule';

export interface AdminCourtItem {
  id: string;
  code: string;
  name: string;
  sportId: 'badminton' | 'volleyball' | 'football';
  sportName: string;
  pricePerHour: number;
  priceLabel: string;
}

export const STANDARD_ADMIN_COURTS: AdminCourtItem[] = [
  // 5 Sân Cầu lông (CL-01 -> CL-05): 120.000 VNĐ / giờ
  { id: 'SAN_CL_01', code: 'CL-01', name: 'Sân CL-01', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },
  { id: 'SAN_CL_02', code: 'CL-02', name: 'Sân CL-02', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },
  { id: 'SAN_CL_03', code: 'CL-03', name: 'Sân CL-03', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },
  { id: 'SAN_CL_04', code: 'CL-04', name: 'Sân CL-04', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },
  { id: 'SAN_CL_05', code: 'CL-05', name: 'Sân CL-05', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000, priceLabel: '120k/h' },

  // 5 Sân Bóng chuyền (BC-01 -> BC-05): 150.000 VNĐ / giờ
  { id: 'SAN_BC_01', code: 'BC-01', name: 'Sân BC-01', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },
  { id: 'SAN_BC_02', code: 'BC-02', name: 'Sân BC-02', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },
  { id: 'SAN_BC_03', code: 'BC-03', name: 'Sân BC-03', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },
  { id: 'SAN_BC_04', code: 'BC-04', name: 'Sân BC-04', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },
  { id: 'SAN_BC_05', code: 'BC-05', name: 'Sân BC-05', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000, priceLabel: '150k/h' },

  // 4 Sân Bóng đá mini (BD-01 -> BD-04): 200.000 VNĐ / giờ
  { id: 'SAN_BD_01', code: 'BD-01', name: 'Sân BD-01', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000, priceLabel: '200k/h' },
  { id: 'SAN_BD_02', code: 'BD-02', name: 'Sân BD-02', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000, priceLabel: '200k/h' },
  { id: 'SAN_BD_03', code: 'BD-03', name: 'Sân BD-03', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000, priceLabel: '200k/h' },
  { id: 'SAN_BD_04', code: 'BD-04', name: 'Sân BD-04', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000, priceLabel: '200k/h' },
];

type AdminSchedulePageProps = {
  onCheckoutModeChange?: (isCheckoutMode: boolean) => void;
  equipments: FacilityEquipment[];
  incidents: FacilityIncident[];
  currentUser: IncidentReporter;
  onCompleteCheckout: (request: CheckoutRequest) => Promise<CheckoutResult>;
  courtStatuses?: { code?: string; isLocked: boolean }[];
};

export default function AdminSchedulePage({ onCheckoutModeChange, equipments, incidents, currentUser, onCompleteCheckout, courtStatuses = [] }: AdminSchedulePageProps) {
  const [sharedCourtStatuses] = useCourtAvailability();
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [checkinBooking, setCheckinBooking] = useState<BookingDetail | null>(null);
  const [checkoutBooking, setCheckoutBooking] = useState<BookingDetail | null>(null);
  const [cancelBooking, setCancelBooking] = useState<BookingDetail | null>(null);
  const [cancelReviewBooking, setCancelReviewBooking] = useState<BookingDetail | null>(null);
  const [showPendingCancelList, setShowPendingCancelList] = useState(false);
  const [cancelReviewBackTarget, setCancelReviewBackTarget] = useState<'timeline' | 'pendingList'>('timeline');
  const [cancelReason, setCancelReason] = useState('Khách bận đột xuất công tác liên tỉnh, gọi báo xin hủy lịch đặt sân tối nay.');

  // State for Court Transfer (Phương án 1: Điều chuyển sân trống cùng loại khi có sự cố)
  const [transferBooking, setTransferBooking] = useState<BookingDetail | null>(null);
  const [selectedTargetCourt, setSelectedTargetCourt] = useState<AdminCourtItem | null>(null);
  const [transferReason, setTransferReason] = useState<string>('Sân hiện tại gặp sự cố kỹ thuật / bảo trì');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);

  // Popup thông báo hủy sân / hoàn tiền (đồng bộ 100% form với bên khách hàng TrangChu)
  const [cancelPopup, setCancelPopup] = useState<{
    type: 'processing' | 'cancel-success' | 'warning' | 'info';
    title: string;
    message: string;
    policyMessage?: string;
  } | null>(null);

  useEffect(() => {
    if (cancelPopup && cancelPopup.type === 'cancel-success') {
      const timer = setTimeout(() => {
        setCancelPopup(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [cancelPopup]);

  const [currentTime, setCurrentTime] = useState(getVietnamTime);
  const previousTodayRef = useRef(currentTime);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    new Date(currentTime.getFullYear(), currentTime.getMonth(), 1));
  const [intervalMode, setIntervalMode] = useState<30 | 60>(60);
  const [courtView, setCourtView] = useState<'all' | 'badminton' | 'volleyball' | 'football'>('all');

  useEffect(() => {
    const updateClock = () => {
      const next = getVietnamTime();
      const previous = previousTodayRef.current;
      if (!isSameDay(previous, next)) {
        setSelectedDate((selected) => isSameDay(selected, previous)
          ? new Date(next.getFullYear(), next.getMonth(), next.getDate()) : selected);
        setCalendarMonth((month) => month.getFullYear() === previous.getFullYear() && month.getMonth() === previous.getMonth()
          ? new Date(next.getFullYear(), next.getMonth(), 1) : month);
      }
      previousTodayRef.current = next;
      setCurrentTime(next);
    };
    const handleVisibility = () => { if (!document.hidden) updateClock(); };
    const timer = window.setInterval(updateClock, 1000);
    window.addEventListener('focus', updateClock);
    document.addEventListener('visibilitychange', handleVisibility);
    updateClock();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', updateClock);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Active Admin Bookings State
  const [allBookings, setAdminBookings] = useSharedBookings();
  const adminBookings = allBookings.filter(booking => booking.bookingDate === calendarBookingDate(selectedDate));

  // Booking Modal State (Đặt sân tại quầy trực tiếp trên lịch)
  const [bookingCourt, setBookingCourt] = useState<AdminCourtItem | null>(null);
  const [bookingStartTime, setBookingStartTime] = useState<string>('08:00');
  const [bookingDuration, setBookingDuration] = useState<number>(60);
  const [bookingCustomerName, setBookingCustomerName] = useState<string>('');
  const [bookingCustomerPhone, setBookingCustomerPhone] = useState<string>('');
  const [bookingNote, setBookingNote] = useState<string>('');
  const [bookingSendZalo, setBookingSendZalo] = useState<boolean>(true);
  const [bookingErrors, setBookingErrors] = useState<{ name?: string; phone?: string }>({});
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [pendingBookingData, setPendingBookingData] = useState<BookingDetail | null>(null);
  const [paymentSuccessBooking, setPaymentSuccessBooking] = useState<BookingDetail | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  const START_TIME_OPTIONS = useMemo(() => {
    const list: string[] = [];
    for (let h = 5; h <= 22; h++) {
      list.push(`${h.toString().padStart(2, '0')}:00`);
      list.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return list;
  }, []);

  const startHour = 5;
  const endHour = 22;
  const slotWidth = intervalMode === 30 ? 52 : 68;
  const rowHeight = 60;

  // Slots cover the full operating day from 05:00 through 23:00.
  const timelineTimes = useMemo(() => {
    const result: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
      if (intervalMode === 30) {
        result.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }
    return result;
  }, [intervalMode, startHour, endHour]);

  // Filtered Courts
  const displayedCourts = useMemo(() => {
    const base = courtView === 'all' ? STANDARD_ADMIN_COURTS : STANDARD_ADMIN_COURTS.filter((c) => c.sportId === courtView);
    return base.filter(c => !isCourtLocked(c.code));
  }, [courtView, courtStatuses, sharedCourtStatuses]);

  // Group displayed courts by Sport for clear visual separation
  const sportGroups = useMemo(() => {
    const sports: Array<{
      id: 'badminton' | 'volleyball' | 'football';
      name: string;
      icon: string;
      priceText: string;
      courts: AdminCourtItem[];
    }> = [
      {
        id: 'badminton',
        name: 'Cầu Lông',
        icon: '🏸',
        priceText: '120.000 VND/h',
        courts: displayedCourts.filter((c) => c.sportId === 'badminton'),
      },
      {
        id: 'volleyball',
        name: 'Bóng Chuyền',
        icon: '🏐',
        priceText: '150.000 VND/h',
        courts: displayedCourts.filter((c) => c.sportId === 'volleyball'),
      },
      {
        id: 'football',
        name: 'Bóng Đá Mini',
        icon: '⚽',
        priceText: '200.000 VND/h',
        courts: displayedCourts.filter((c) => c.sportId === 'football'),
      },
    ];
    return sports.filter((g) => g.courts.length > 0);
  }, [displayedCourts]);

  // Position today's timeline near the current Vietnam time when opening or changing views.
  useEffect(() => {
    if (timelineScrollRef.current) {
      const now = getVietnamTime();
      const minutes = isSameDay(selectedDate, now) ? now.getHours() * 60 + now.getMinutes() : startHour * 60;
      const offset = ((minutes - startHour * 60) / intervalMode) * slotWidth;
      timelineScrollRef.current.scrollLeft = Math.max(0, offset - 20);
    }
  }, [intervalMode, slotWidth, selectedDate]);

  // Calendar logic
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const isToday = (d: Date) => {
    return isSameDay(d, currentTime);
  };

  const daysOfWeekVi = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  const formatDateVi = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const y = d.getFullYear();
    const prefix = isToday(d) ? 'Hôm nay, ' : '';
    return `${prefix}${day}/${m}/${y}`;
  };

  const formatBookingDateVi = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const dow = d.getDay();
    const label = isToday(d) ? 'Hôm nay' : daysOfWeekVi[dow];
    return `${label} (${day}/${m})`;
  };

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startingDayOfWeek = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon is 0
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    // Prev month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({
        dayNumber: d,
        dateObj: new Date(year, month - 1, d),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        dayNumber: i,
        dateObj: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month days to complete 7-day rows
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        dateObj: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    return days;
  }, [calendarMonth]);

  const handleSelectCalendarDay = (dateObj: Date) => {
    setSelectedDate(dateObj);
    setIsDatePickerOpen(false);
  };

  const parseTimeToMinutes = (t: string) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const isSlotCovered = (courtCode: string, startMin: number, endMin: number) => {
    return adminBookings.some((b) => {
      if (b.courtCode !== courtCode) return false;
      const bStartMin = (b.startH ?? 0) * 60 + (b.startM ?? 0);
      const bEndMin = (b.endH ?? 0) * 60 + (b.endM ?? 0);
      return Math.max(startMin, bStartMin) < Math.min(endMin, bEndMin);
    });
  };

  const bookingEndTime = useMemo(() => {
    if (!bookingStartTime) return '';
    const totalMins = parseTimeToMinutes(bookingStartTime) + bookingDuration;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, [bookingStartTime, bookingDuration]);

  const bookingEndTimeOptions = useMemo(() => {
    if (!bookingStartTime) return [];
    const startMins = parseTimeToMinutes(bookingStartTime);
    const maxEndMins = Math.min(23 * 60, startMins + 240);
    const list: string[] = [];
    for (let m = startMins + 30; m <= maxEndMins; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      list.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
    return list;
  }, [bookingStartTime]);

  const handleBookingStartTimeChange = (newStart: string) => {
    setBookingStartTime(newStart);
    const newStartMins = parseTimeToMinutes(newStart);
    if (newStartMins + bookingDuration > 23 * 60) {
      setBookingDuration(Math.max(30, 23 * 60 - newStartMins));
    }
  };

  const handleBookingEndTimeChange = (newEnd: string) => {
    const startMins = parseTimeToMinutes(bookingStartTime);
    const endMins = parseTimeToMinutes(newEnd);
    if (endMins > startMins) {
      setBookingDuration(endMins - startMins);
    }
  };

  const adminBookingConflict = useMemo(() => {
    if (!bookingCourt || !bookingStartTime || !bookingDuration) return null;
    const reqStart = parseTimeToMinutes(bookingStartTime);
    const reqEnd = reqStart + bookingDuration;

    return adminBookings.find((b) => {
      if (b.courtCode !== bookingCourt.code && b.court !== bookingCourt.name) return false;
      const bStart = (b.startH ?? 0) * 60 + (b.startM ?? 0);
      const bEnd = (b.endH ?? 0) * 60 + (b.endM ?? 0);
      return Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd);
    });
  }, [bookingCourt, bookingStartTime, bookingDuration, adminBookings]);

  const getAvailableDurations = (startTimeStr: string) => {
    const possibleDurations = [30, 60, 90, 120, 150, 180, 210, 240];
    if (!startTimeStr) return possibleDurations;
    const startMinutes = parseTimeToMinutes(startTimeStr);
    const closingTimeMinutes = 23 * 60;
    return possibleDurations.filter((d) => startMinutes + d <= closingTimeMinutes);
  };

  const availableDurations = useMemo(
    () => getAvailableDurations(bookingStartTime),
    [bookingStartTime]
  );

  const handleBookingDurationChange = (newDur: number) => {
    setBookingDuration(newDur);
  };

  const handleOpenBookingModal = (court: AdminCourtItem, time: string, duration: number = 60) => {
    if (isCourtLocked(court.code)) return;
    setBookingCourt(court);
    setBookingStartTime(time);
    setBookingDuration(duration);
    setBookingCustomerName('');
    setBookingCustomerPhone('');
    setBookingNote('');
    setBookingSendZalo(true);
    setBookingErrors({});
    setShowPaymentModal(false);
    setPendingBookingData(null);
  };

  const validateBookingForm = () => {
    const errors: { name?: string; phone?: string } = {};
    const trimmedName = bookingCustomerName.trim();
    if (!trimmedName) {
      errors.name = 'Vui lòng nhập họ và tên khách hàng!';
    } else if (trimmedName.length < 2) {
      errors.name = 'Họ và tên quá ngắn (tối thiểu 2 ký tự)!';
    }

    const cleanPhone = bookingCustomerPhone.trim().replace(/[\s.-]/g, '');
    if (!cleanPhone) {
      errors.phone = 'Vui lòng nhập số điện thoại!';
    } else if (!/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(cleanPhone) && cleanPhone.length !== 10) {
      errors.phone = 'Số điện thoại không hợp lệ (cần 10 chữ số, VD: 0912.345.678)!';
    }

    setBookingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdminBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCourt) return;
    if (isCourtLocked(bookingCourt.code)) {
      window.alert('Sân đang bị khóa, vui lòng chọn sân khác.');
      return;
    }

    if (!validateBookingForm()) {
      return;
    }

    if (adminBookingConflict) {
      return;
    }

    const startMin = parseTimeToMinutes(bookingStartTime);
    const endMin = startMin + bookingDuration;
    const durHours = bookingDuration / 60;
    const totalAmount = Math.round(bookingCourt.pricePerHour * durHours);

    const pendingBooking: BookingDetail = {
      bookingDate: calendarBookingDate(selectedDate),
      code: `BK-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: bookingCustomerName.trim(),
      phone: bookingCustomerPhone.trim(),
      court: bookingCourt.name,
      courtCode: bookingCourt.code,
      sport: bookingCourt.sportName,
      sportId: bookingCourt.sportId,
      startH: Math.floor(startMin / 60),
      startM: startMin % 60,
      endH: Math.floor(endMin / 60),
      endM: endMin % 60,
      time: `${bookingStartTime} - ${bookingEndTime}`,
      paymentStatus: 'Đã thanh toán đủ qua VietQR',
      total: `${totalAmount.toLocaleString('vi-VN')} VND`,
      paidAmount: `${totalAmount.toLocaleString('vi-VN')} VND`,
      remaining: '0 VND',
      status: 'Đã đặt',
    };

    setPendingBookingData(pendingBooking);
    setShowPaymentModal(true);
  };

  const handleConfirmPaymentSuccess = () => {
    if (!pendingBookingData) return;
    if (isCourtLocked(pendingBookingData.courtCode || pendingBookingData.court)) {
      window.alert('Sân đang bị khóa, không thể xác nhận đặt sân.');
      return;
    }
    setAdminBookings((prev) => [...prev, pendingBookingData]);
    setPaymentSuccessBooking(pendingBookingData);
    setShowPaymentModal(false);
    setBookingCourt(null);
  };

  const handleCancelPayment = () => {
    setShowPaymentModal(false);
  };

  const handleFinishBooking = () => {
    setPaymentSuccessBooking(null);
    setPendingBookingData(null);
  };

  // Tìm danh sách các sân cùng bộ môn khả dụng để điều chuyển (Phương án 1)
  const candidateCourtsForTransfer = useMemo(() => {
    if (!transferBooking) return [];
    const bStartH = transferBooking.startH ?? 0;
    const bStartM = transferBooking.startM ?? 0;
    const bEndH = transferBooking.endH ?? 0;
    const bEndM = transferBooking.endM ?? 0;
    const startMin = bStartH * 60 + bStartM;
    const endMin = bEndH * 60 + bEndM;

    const sameSportCourts = STANDARD_ADMIN_COURTS.filter(
      (c) => c.sportId === transferBooking.sportId && c.name !== transferBooking.court
    );

    return sameSportCourts.map((court) => {
      const isOccupied = adminBookings.some((b) => {
        if (b.court !== court.name || b.status === 'Đã hủy' || b.code === transferBooking.code) return false;
        const bStart = (b.startH ?? 0) * 60 + (b.startM ?? 0);
        const bEnd = (b.endH ?? 0) * 60 + (b.endM ?? 0);
        return Math.max(startMin, bStart) < Math.min(endMin, bEnd);
      });
      return {
        ...court,
        isOccupied,
      };
    });
  }, [transferBooking, adminBookings]);

  const handleConfirmTransfer = (targetCourt: AdminCourtItem) => {
    if (!transferBooking) return;
    const oldCourt = transferBooking.court;
    setAdminBookings((prev) =>
      prev.map((b) =>
        b.code === transferBooking.code
          ? {
              ...b,
              court: targetCourt.name,
              courtCode: targetCourt.code,
            }
          : b
      )
    );
    setTransferSuccessMsg(
      `Đã chuyển lịch của ${transferBooking.customerName} từ ${oldCourt} sang ${targetCourt.name} (${transferBooking.time}). Hệ thống đã tự động gửi tin nhắn báo sân mới cho khách!`
    );
    setTimeout(() => {
      setTransferBooking(null);
      setSelectedTargetCourt(null);
      setTransferSuccessMsg(null);
      setSelectedBooking(null);
    }, 2500);
  };

  const openBooking = (booking: BookingDetail) => {
    setSelectedBooking(booking);
  };

  const openCheckinDetail = (booking: BookingDetail) => {
    setCheckinBooking(booking);
    setSelectedBooking(null);
    onCheckoutModeChange?.(true);
  };

  const pendingCancelRequests: BookingDetail[] = [
    {
      code: 'BK-6184',
      customerName: 'Ngọc Mai',
      phone: '0908.224.118',
      court: 'Sân 02',
      sport: 'Cầu lông',
      time: '11:30 - 13:00',
      paymentStatus: 'Đã thanh toán đủ qua VietQR',
      total: '180.000 VND',
      paidAmount: '180.000 VND',
      remaining: '0 VND',
      status: 'Chờ duyệt hủy',
    },
    {
      code: 'BK-7740',
      customerName: 'Minh Trí',
      phone: '0912.440.526',
      court: 'Sân 06',
      sport: 'Cầu lông',
      time: '14:00 - 15:30',
      paymentStatus: 'Đã thanh toán đủ qua VietQR',
      total: '210.000 VND',
      paidAmount: '210.000 VND',
      remaining: '0 VND',
      status: 'Chờ duyệt hủy',
    },
    {
      code: 'BK-9023',
      customerName: 'Quang Thắng',
      phone: '0912.441.902',
      court: 'Sân 05',
      sport: 'Cầu lông',
      time: '07:00 - 08:30',
      paymentStatus: 'Đã thanh toán đủ qua VietQR',
      total: '210.000 VND',
      paidAmount: '210.000 VND',
      remaining: '0 VND',
      status: 'Chờ duyệt hủy',
    },
  ];

  if (checkinBooking) {
    const courtNumber = checkinBooking.court.match(/\d+/)?.[0]?.padStart(2, '0') ?? '01';

    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-white px-3 py-3">
        {/* Back button */}
        <button
          type="button"
          onClick={() => {
            setCheckinBooking(null);
            onCheckoutModeChange?.(false);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-slate-700 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại lịch sân
        </button>

        {/* Header */}
        <div className="mb-3">
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-slate-700">Chi tiết lượt đặt</p>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-black tracking-tight text-slate-900">#{checkinBooking.code}</h2>
            <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-black/15">
              Đã đặt chỗ
            </span>
          </div>
        </div>

        {/* Countdown banner */}
        <section className="mb-2 flex items-center gap-2.5 rounded-xl bg-white p-3 ring-1 ring-black/15">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-800 ring-1 ring-black/15">
            <Clock3 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-black text-slate-800">Bắt đầu sau <span className="text-emerald-800">35 phút nữa</span></p>
            <p className="text-[10px] font-medium text-slate-400">Sẵn sàng nhận khách lúc 17:50</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
        </section>

        {/* Customer info */}
        <section className="mb-2 rounded-xl bg-white p-3 ring-1 ring-black/15">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              <UserRound className="h-3 w-3" />
              Khách hàng
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-black/15">Standard Member</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[17px] font-black text-emerald-800 ring-1 ring-black/15">
              {checkinBooking.customerName.trim().charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-black text-slate-900">{checkinBooking.customerName}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium tracking-[0.06em] text-slate-500">
                <Phone className="h-3 w-3 shrink-0" />
                {checkinBooking.phone}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-black/15">
            <Clock3 className="h-3 w-3 shrink-0 text-emerald-800" />
            <p className="text-[10px] font-medium text-slate-500">Đã chơi 14 trận • Không có vi phạm hủy muộn</p>
          </div>
        </section>

        {/* Court & Time */}
        <section className="mb-2 rounded-xl bg-white p-3 ring-1 ring-black/15">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              <MapPin className="h-3 w-3" />
              Sân & Thời gian
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-black/15">{checkinBooking.sport}</span>
          </div>
          <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-white p-2.5 ring-1 ring-black/15">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-[14px] font-black text-white">
              S{courtNumber}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-black text-slate-900">
                SÂN CL-{courtNumber} <span className="text-emerald-500">•</span>
              </p>
              <p className="text-[10px] font-medium text-slate-400">Khu A • Thảm Yonex tiêu chuẩn</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white p-2.5 ring-1 ring-black/15">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">Ngày thi đấu</p>
              <p className="mt-1 text-[13px] font-black text-slate-900">{isToday(selectedDate) ? 'Hôm nay' : daysOfWeekVi[selectedDate.getDay()]}</p>
              <p className="text-[10px] font-medium text-slate-400">{selectedDate.toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="rounded-lg bg-white p-2.5 ring-1 ring-black/15">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">Khung giờ</p>
              <p className="mt-1 text-[13px] font-black text-slate-900">{checkinBooking.time}</p>
              <p className="text-[10px] font-medium text-slate-400">90 phút</p>
            </div>
          </div>
        </section>

        {/* Finance */}
        <section className="mb-3 rounded-xl bg-white p-3 ring-1 ring-black/15">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              <CreditCard className="h-3 w-3" />
              Tài chính & Thanh toán
            </div>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-black/15">VietQR • 100%</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-[11px] font-medium leading-snug text-slate-500">Tổng tiền sân (90 phút • 120.000 VND/h)</span>
              <span className="shrink-0 text-[13px] font-black text-slate-900">{checkinBooking.total}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Đã thanh toán qua VietQR
              </span>
              <span className="text-[13px] font-black text-emerald-800">-{checkinBooking.paidAmount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-2 ring-1 ring-black/15">
              <span className="text-[12px] font-black text-slate-700">Khoản cần thu tại quầy</span>
              <span className="text-[14px] font-black text-slate-900">{checkinBooking.remaining}</span>
            </div>
          </div>
        </section>

        {/* Action buttons */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setAdminBookings(previous => previous.map(booking => booking.code === checkinBooking.code
                && booking.bookingDate === calendarBookingDate(selectedDate) ? {...booking,status:'Đang sử dụng'} : booking));
              setCheckinBooking(null);
              onCheckoutModeChange?.(false);
            }}
            className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">Check-In Sân</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCancelBooking(checkinBooking);
              setCheckinBooking(null);
              onCheckoutModeChange?.(true);
            }}
            className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 text-[11px] font-black text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 active:scale-[0.98]"
          >
            <CircleX className="h-4 w-4 shrink-0" />
            <span className="truncate">Hủy đặt sân</span>
          </button>
        </div>
      </div>
    );
  };

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
                    “Khách bận đột xuất công tác liên tỉnh, gọi báo xin hủy lịch đặt sân tối nay.”
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
                const booked = cancelReviewBooking;
                setCancelReviewBooking(null);
                setSelectedBooking(null);
                onCheckoutModeChange?.(false);
                setCancelPopup({
                  type: 'processing',
                  title: 'Đang xử lý hoàn tiền...',
                  message: 'Hệ thống đang kết nối cổng thanh toán để hoàn tiền tự động...',
                });
                setTimeout(() => {
                  setAdminBookings((prev) =>
                    prev.map((b) =>
                      b.code === booked.code
                        ? { ...b, status: 'Đã hủy', paymentStatus: 'Đã hoàn tiền' }
                        : b
                    )
                  );
                  setCancelPopup({
                    type: 'cancel-success',
                    title: 'Hoàn tiền thành công!',
                    message: 'Lịch đặt sân đã được hủy thành công.',
                    policyMessage: `Khoản tiền ${booked.total} đã được hệ thống hoàn trả tự động qua cổng thanh toán liên kết về tài khoản khách hàng.`,
                  });
                }, 1500);
              }}
              className="flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2 text-[14px] font-black leading-none text-white shadow-sm active:scale-[0.99] cursor-pointer hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="truncate">Chấp thuận hủy</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCancelReviewBooking(null);
                setSelectedBooking(null);
                onCheckoutModeChange?.(false);
                setCancelPopup({
                  type: 'warning',
                  title: 'Từ chối hủy đặt sân',
                  message: 'Yêu cầu hủy đặt sân đã bị từ chối.',
                });
              }}
              className="flex h-12 min-w-0 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 text-[14px] font-black leading-none text-slate-700 active:scale-[0.99] cursor-pointer hover:bg-slate-200"
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
      { label: 'Khách bận đột xuất', icon: Zap, value: 'Khách bận đột xuất công tác liên tỉnh, gọi báo xin hủy lịch đặt sân tối nay.' },
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
          <h2 className="min-w-0 text-[17px] font-black uppercase tracking-tight text-slate-950">Hủy lịch đặt sân</h2>
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

        {(() => {
          const isEligible24h = ((cancelBooking as any).hoursUntilStart ?? 0) >= 24;
          return isEligible24h ? (
            <section className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-3 flex items-start gap-3 rounded-lg bg-emerald-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-slate-950">Hủy trước ≥ 24h: Đủ điều kiện hoàn tiền</h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-600">
                    Hệ thống sẽ <strong className="text-emerald-700">tự động hoàn tiền</strong> ({cancelBooking.total}) qua cổng thanh toán và <strong className="text-emerald-700">giải phóng sân ngay lập tức</strong>.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const booked = cancelBooking;
                  setCancelBooking(null);
                  setSelectedBooking(null);
                  onCheckoutModeChange?.(false);
                  setCancelPopup({
                    type: 'processing',
                    title: 'Đang xử lý hoàn tiền...',
                    message: 'Hệ thống đang kết nối cổng thanh toán để hoàn tiền tự động...',
                  });
                  setTimeout(() => {
                    setAdminBookings((prev) =>
                      prev.map((b) =>
                        b.code === booked.code
                          ? { ...b, status: 'Đã hủy', paymentStatus: 'Đã hoàn tiền' }
                          : b
                      )
                    );
                    setCancelPopup({
                      type: 'cancel-success',
                      title: 'Hoàn tiền thành công!',
                      message: 'Lịch đặt sân đã được hủy thành công.',
                      policyMessage: `Khoản tiền ${booked.total} đã được hệ thống hoàn trả tự động qua cổng thanh toán liên kết về tài khoản khách hàng.`,
                    });
                  }, 1500);
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-[14px] font-black text-white shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <CheckCircle2 className="h-5 w-5" />
                Xác nhận hủy sân & Hoàn tiền
              </button>
            </section>
          ) : (
            <section className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
              <div className="mb-3 flex items-start gap-3 rounded-lg bg-red-50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-red-950">Hủy dưới 24h: Không được hoàn tiền</h3>
                  <p className="mt-1 text-[12px] font-medium leading-relaxed text-red-700">
                    Theo quy định của sân, lịch đặt hủy trong vòng dưới 24 giờ sẽ <strong>không được hoàn tiền (0đ)</strong>. Thao tác này chỉ giải phóng sân cho khách khác đặt.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const booked = cancelBooking;
                  setAdminBookings((prev) =>
                    prev.map((b) =>
                      b.code === booked.code
                        ? { ...b, status: 'Đã hủy', paymentStatus: 'Không hoàn tiền' }
                        : b
                    )
                  );
                  setCancelBooking(null);
                  setSelectedBooking(null);
                  onCheckoutModeChange?.(false);
                  setCancelPopup({
                    type: 'cancel-success',
                    title: 'Hủy sân thành công!',
                    message: 'Lịch đặt sân đã được hủy.',
                    policyMessage: 'Đơn không được hoàn tiền do hủy dưới 24 giờ.',
                  });
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-[14px] font-black text-white shadow-sm active:scale-[0.99] cursor-pointer"
              >
                <Ban className="h-5 w-5" />
                Hủy sân (Không hoàn tiền)
              </button>
            </section>
          );
        })()}
      </div>
    );
  }

  if (checkoutBooking) {
    return <CheckoutSettlementView key={checkoutBooking.code} booking={checkoutBooking} date={selectedDate}
      equipments={equipments} incidents={incidents} currentUser={currentUser} onComplete={onCompleteCheckout}
      onBack={() => { setCheckoutBooking(null); onCheckoutModeChange?.(false); }}
      onFinished={() => {
        setAdminBookings(previous => previous.map(booking => booking.code === checkoutBooking.code
          && booking.bookingDate === calendarBookingDate(selectedDate) ? { ...booking, status:'Đã kết thúc' } : booking));
        setCheckoutBooking(null); onCheckoutModeChange?.(false);
      }} />;
  }

  return (
    <>
      <div className="flex-1 min-h-0 bg-slate-50 relative overflow-hidden flex flex-col">
        {/* 1. TOP TOOLBAR & DATE CONTROLS */}
        <div className="bg-white border-b border-slate-200 p-2.5 space-y-2 shrink-0 shadow-xs z-30">
          {/* Date Picker Bar */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1.5 border border-slate-200 relative">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrevDay(); }} 
              className="w-7 h-7 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-xs active:scale-95 z-20 cursor-pointer"
              title="Ngày trước"
            >
              <ChevronLeft className="w-4 h-4"/>
            </button>
            
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black text-slate-800 tracking-wide z-10 cursor-pointer hover:text-emerald-700 transition"
              title="Bấm để xổ lịch chọn ngày"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{formatDateVi(selectedDate)}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDatePickerOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>

            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNextDay(); }} 
              className="w-7 h-7 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-xs active:scale-95 z-20 cursor-pointer"
              title="Ngày sau"
            >
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>

          {/* Monthly Calendar Popover */}
          {isDatePickerOpen && (
            <div className="rounded-2xl border-2 border-emerald-400 bg-white p-3.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 active:scale-95 transition cursor-pointer"
                  title="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    Tháng {calendarMonth.getMonth() + 1}, {calendarMonth.getFullYear()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 active:scale-95 transition cursor-pointer"
                  title="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                <div>T2</div>
                <div>T3</div>
                <div>T4</div>
                <div>T5</div>
                <div>T6</div>
                <div className="text-emerald-700 font-extrabold">T7</div>
                <div className="text-red-500 font-extrabold">CN</div>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1 text-xs">
                {calendarDays.map((item, idx) => {
                  const isSelected = selectedDate.getFullYear() === item.dateObj.getFullYear() &&
                                     selectedDate.getMonth() === item.dateObj.getMonth() &&
                                     selectedDate.getDate() === item.dateObj.getDate();
                  const isTodayDay = isToday(item.dateObj);

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectCalendarDay(item.dateObj)}
                      className={[
                        'h-9 w-full rounded-xl flex flex-col items-center justify-center font-bold transition text-xs relative',
                        !item.isCurrentMonth ? 'text-slate-300' : 'text-slate-800',
                        'cursor-pointer hover:bg-emerald-50 hover:text-emerald-800 active:scale-95',
                        isSelected ? 'bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-300' : '',
                        isTodayDay && !isSelected ? 'border border-emerald-500 text-emerald-700 font-black' : ''
                      ].filter(Boolean).join(' ')}
                    >
                      <span>{item.dayNumber}</span>
                      {isTodayDay && !isSelected && (
                        <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick footer */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const today = getVietnamTime();
                    setSelectedDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
                    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                    setIsDatePickerOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer text-[11px]"
                >
                  Hôm nay ({currentTime.getDate().toString().padStart(2, '0')}/{(currentTime.getMonth() + 1).toString().padStart(2, '0')})
                </button>

                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(false)}
                  className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition cursor-pointer text-[11px]"
                >
                  Đóng lịch ✕
                </button>
              </div>
            </div>
          )}

          {/* Sport Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => setCourtView('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                courtView === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả 14 sân
            </button>
            <button
              type="button"
              onClick={() => setCourtView('badminton')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                courtView === 'badminton'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cầu lông (5 sân)
            </button>
            <button
              type="button"
              onClick={() => setCourtView('volleyball')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                courtView === 'volleyball'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bóng chuyền (5 sân)
            </button>
            <button
              type="button"
              onClick={() => setCourtView('football')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                courtView === 'football'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bóng đá mini (4 sân)
            </button>
          </div>

          {/* Sub-toolbar: Interval Toggle & Legends */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
            <div className="relative bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs shrink-0 cursor-pointer">
              <LayoutGrid className="w-3 h-3" /> Dòng thời gian: {intervalMode === 30 ? '30 phút' : '1 tiếng'}
              <select 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={intervalMode}
                onChange={(e) => setIntervalMode(Number(e.target.value) as 30 | 60)}
              >
                <option value={30}>30 phút</option>
                <option value={60}>1 tiếng</option>
              </select>
            </div>

            <div className="flex items-center gap-2 font-bold text-slate-600 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 
                Đang dùng
              </span>
              <span className="flex items-center gap-1 text-blue-800">
                <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-400"></span> 
                Đã đặt
              </span>
              <span className="flex items-center gap-1 text-amber-800">
                <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400"></span> 
                Có thể đặt
              </span>
            </div>
          </div>
        </div>

        {/* 2. TIMELINE MATRIX GRID */}
        <div ref={timelineScrollRef} className="no-scrollbar flex-1 min-h-0 overflow-auto bg-slate-50 border-b border-slate-200">
          <div className="flex min-w-max">
            {/* Sticky Left Column: Court names and Price */}
            <div className="sticky left-0 z-30 flex flex-col bg-white border-r border-slate-200 w-[78px] shrink-0 shadow-[2px_0_6px_rgba(0,0,0,0.05)]">
              <div className="h-10 border-b border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-[9px] font-black text-slate-700 uppercase tracking-wider sticky top-0 z-40">
                DANH MỤC SÂN
              </div>
              {sportGroups.map((group, groupIdx) => (
                <div key={group.id} className="flex flex-col">
                  {/* Khoảng cách màu trắng ngăn cách giữa các môn (không có chữ) */}
                  {groupIdx > 0 && (
                    <div 
                      style={{ height: '14px' }}
                      className="bg-white border-b border-slate-200/60 shrink-0"
                    />
                  )}

                  {/* Courts in group */}
                  {group.courts.map((court) => (
                    <div 
                      key={court.id} 
                      style={{ height: `${rowHeight}px` }}
                      className="border-b border-slate-200/70 flex flex-col justify-center items-center px-1 bg-white hover:bg-slate-50/80 transition"
                    >
                      <span className="font-black text-[11px] text-slate-900 truncate w-full text-center leading-tight">
                        {court.name}
                      </span>
                      <span className="text-[9px] font-extrabold text-emerald-600 mt-0.5">
                        {court.priceLabel}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Right Timeline Grid */}
            <div className="flex flex-col relative z-0" style={{ width: `${timelineTimes.length * slotWidth}px` }}>
              {/* Header Row: Time labels */}
              <div className="flex h-10 border-b border-slate-200 bg-slate-100 sticky top-0 z-20">
                {timelineTimes.map((time) => {
                  const isNight = time >= '21:00';
                  return (
                    <div
                      key={time}
                      style={{ width: `${slotWidth}px` }}
                      className={`shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-extrabold ${
                        isNight ? 'text-orange-700 bg-orange-50/60' : 'text-slate-700'
                      }`}
                    >
                      {time}
                    </div>
                  );
                })}
              </div>

              {/* Rows for each court grouped by sport */}
              <div className="relative">
                {sportGroups.map((group, groupIdx) => (
                  <div key={group.id} className="flex flex-col">
                    {/* Khoảng cách màu trắng ngăn cách giữa các môn trên timeline (không có chữ) */}
                    {groupIdx > 0 && (
                      <div 
                        style={{ height: '14px' }}
                        className="bg-white border-b border-slate-200/60 shrink-0"
                      />
                    )}

                    {group.courts.map((court) => {
                      const courtBookings = adminBookings.filter((b) => b.courtCode === court.code);

                      return (
                        <div
                          key={court.id}
                          style={{ height: `${rowHeight}px` }}
                          className="flex relative border-b border-slate-200/60"
                        >
                          {/* Background Time Slot Cells */}
                          {timelineTimes.map((time) => {
                            const cellStart = parseTimeToMinutes(time);
                            if (intervalMode === 60) {
                              const bFirst = isSlotCovered(court.code, cellStart, cellStart + 30);
                              const bSecond = isSlotCovered(court.code, cellStart + 30, cellStart + 60);

                              if (bFirst && bSecond) {
                                return (
                                  <div
                                    key={time}
                                    style={{ width: `${slotWidth}px` }}
                                    className="shrink-0 border-r border-slate-200/50 bg-slate-100/70 flex items-center justify-center select-none"
                                  >
                                    <span className="h-2 w-px bg-slate-200" />
                                  </div>
                                );
                              }

                              if (bFirst && !bSecond) {
                                // First 30 mins occupied, second 30 mins is TRỐNG
                                const secondHalfTime = `${time.slice(0, 2)}:30`;
                                return (
                                  <div key={time} style={{ width: `${slotWidth}px` }} className="shrink-0 flex border-r border-slate-200/50">
                                    <div style={{ width: `${slotWidth / 2}px` }} className="h-full bg-slate-100/70 flex items-center justify-center border-r border-slate-200/40 select-none">
                                      <span className="h-2 w-px bg-slate-200" />
                                    </div>
                                    <div 
                                      style={{ width: `${slotWidth / 2}px` }} 
                                      onClick={() => handleOpenBookingModal(court, secondHalfTime, 30)}
                                      className="h-full bg-amber-50/80 hover:bg-amber-100 active:scale-95 flex flex-col items-center justify-center text-center p-0.5 select-none transition cursor-pointer"
                                      title={`${court.name}: Nhấn để đặt lúc ${secondHalfTime} (30 phút)`}
                                    >
                                      <span className="text-[10px] font-black text-amber-700/80 leading-none select-none">+</span>
                                    </div>
                                  </div>
                                );
                              }

                              if (!bFirst && bSecond) {
                                // First 30 mins TRỐNG, second 30 mins occupied
                                return (
                                  <div key={time} style={{ width: `${slotWidth}px` }} className="shrink-0 flex border-r border-slate-200/50">
                                    <div 
                                      style={{ width: `${slotWidth / 2}px` }} 
                                      onClick={() => handleOpenBookingModal(court, time, 30)}
                                      className="h-full bg-amber-50/80 hover:bg-amber-100 active:scale-95 flex flex-col items-center justify-center text-center p-0.5 select-none transition cursor-pointer border-r border-amber-200/40"
                                      title={`${court.name}: Nhấn để đặt lúc ${time} (30 phút)`}
                                    >
                                      <span className="text-[10px] font-black text-amber-700/80 leading-none select-none">+</span>
                                    </div>
                                    <div style={{ width: `${slotWidth / 2}px` }} className="h-full bg-slate-100/70 flex items-center justify-center select-none">
                                      <span className="h-2 w-px bg-slate-200" />
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={time}
                                  style={{ width: `${slotWidth}px` }}
                                  onClick={() => handleOpenBookingModal(court, time, 60)}
                                  className="shrink-0 border-r border-amber-200/60 bg-amber-50/70 hover:bg-amber-100 active:scale-[0.98] flex flex-col items-center justify-center text-center p-1 select-none transition cursor-pointer"
                                  title={`${court.name}: Nhấn để đặt lúc ${time} (1 tiếng)`}
                                >
                                  <span className="text-[9px] font-black text-amber-800 uppercase leading-none">TRỐNG</span>
                                </div>
                              );
                            } else {
                              // intervalMode === 30
                              const cellEnd = cellStart + 30;
                              const isOccupied = isSlotCovered(court.code, cellStart, cellEnd);

                              if (isOccupied) {
                                return (
                                  <div
                                    key={time}
                                    style={{ width: `${slotWidth}px` }}
                                    className="shrink-0 border-r border-slate-200/50 bg-slate-100/70 flex items-center justify-center select-none"
                                  >
                                    <span className="h-2 w-px bg-slate-200" />
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={time}
                                  style={{ width: `${slotWidth}px` }}
                                  onClick={() => handleOpenBookingModal(court, time, 30)}
                                  className="shrink-0 border-r border-amber-200/60 bg-amber-50/70 hover:bg-amber-100 active:scale-[0.98] flex flex-col items-center justify-center text-center p-1 select-none transition cursor-pointer"
                                  title={`${court.name}: Nhấn để đặt lúc ${time} (30 phút)`}
                                >
                                  <span className="text-[9px] font-black text-amber-800 uppercase leading-none">TRỐNG</span>
                                </div>
                              );
                            }
                          })}

                          {/* Bookings cards positioned on top */}
                          {courtBookings.map((b) => {
                            const bStartMin = (b.startH ?? 0) * 60 + (b.startM ?? 0);
                            const bEndMin = (b.endH ?? 0) * 60 + (b.endM ?? 0);
                            const startTimelineMin = startHour * 60;
                            const left = ((bStartMin - startTimelineMin) / intervalMode) * slotWidth;
                            const width = Math.max(46, ((bEndMin - bStartMin) / intervalMode) * slotWidth - 3);

                            if (b.status === 'Đang sử dụng') {
                              return (
                                <button
                                  type="button"
                                  key={b.code}
                                  onClick={() => openBooking(b)}
                                  title={`${b.customerName} (${b.court}) • ${b.time} • Đang sử dụng`}
                                  style={{
                                    left: `${left + 2}px`,
                                    width: `${width}px`,
                                    top: '4px',
                                    bottom: '4px',
                                  }}
                                  className="absolute z-10 rounded-xl bg-emerald-600 text-white px-2 py-1 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-transform overflow-hidden border border-emerald-500 cursor-pointer"
                                >
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-100 shrink-0 animate-ping" />
                                    <span className="text-[10px] font-black truncate">{b.customerName}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-emerald-100 truncate mt-0.5">
                                    {b.time}
                                  </span>
                                </button>
                              );
                            }

                            return (
                              <button
                                type="button"
                                key={b.code}
                                onClick={() => openBooking(b)}
                                title={`${b.customerName} (${b.court}) • ${b.time} • Đã đặt`}
                                style={{
                                  left: `${left + 2}px`,
                                  width: `${width}px`,
                                  top: '4px',
                                  bottom: '4px',
                                }}
                                className="absolute z-10 rounded-xl bg-blue-50 border border-blue-300 px-2 py-1 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-transform overflow-hidden cursor-pointer hover:bg-blue-100/90"
                              >
                                <span className="text-[10px] font-black text-blue-950 truncate leading-tight">{b.customerName}</span>
                                <span className="text-[9px] font-bold text-blue-700 truncate leading-tight mt-0.5">
                                  {b.time}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            <div className="flex justify-center pt-2 pb-0">
              <button
                type="button"
                aria-label="Mở chi tiết lượt đặt đầy đủ"
                onClick={() => openCheckinDetail(selectedBooking)}
                className="rounded-full px-4 py-1 active:scale-95"
              >
                <span className="block h-1 w-8 rounded-full bg-slate-200" />
              </button>
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-2 pt-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-emerald-800 ring-1 ring-black/15">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">Mã đặt: {selectedBooking.code}</p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-bold text-slate-900">Chi tiết lượt đặt sân</h2>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-emerald-800 ring-1 ring-black/15">
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

            <div className="space-y-2 bg-white px-3 py-2.5">
              {/* Info grid */}
              <div className="rounded-xl border border-black/15 bg-white p-3">
                <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600">Khách hàng</p>
                    <p className="mt-1 text-[14px] font-bold leading-snug text-slate-900">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600">Số điện thoại</p>
                    <p className="mt-1 text-[13px] font-bold leading-snug text-slate-900">{selectedBooking.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600">Sân & Bộ môn</p>
                    <p className="mt-1 text-[13px] font-bold leading-snug text-slate-900">{selectedBooking.court}</p>
                    <p className="text-[10px] font-medium text-slate-600">{selectedBooking.sport}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600">Khung thời gian</p>
                    <p className="mt-1 text-[13px] font-bold leading-snug text-slate-900">{selectedBooking.time}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600">Trạng thái thanh toán</p>
                    <p className="mt-1 text-[11px] font-semibold leading-relaxed text-emerald-800">{selectedBooking.paymentStatus}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600">Tổng tiền</p>
                    <p className="mt-1 text-[14px] font-bold leading-snug text-slate-900">{selectedBooking.total}</p>
                  </div>
                </div>
              </div>

              {/* Payment summary */}
              <div className="rounded-xl border border-black/15 bg-white px-3 py-2">
                <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-2">
                  <span className="text-[10px] font-medium text-slate-600">Đã thanh toán qua VietQR</span>
                  <span className="text-[12px] font-bold text-emerald-800">{selectedBooking.paidAmount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] font-semibold text-slate-700">Còn lại cần thu khi nhận sân</span>
                  <span className="text-[14px] font-bold text-slate-900">{selectedBooking.remaining}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {selectedBooking.status === 'Đã đặt' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openCheckinDetail(selectedBooking)}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99]"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Check-in sân</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTransferBooking(selectedBooking);
                          setSelectedTargetCourt(null);
                        }}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2 text-[11px] font-black text-amber-800 shadow-sm transition active:scale-[0.99] cursor-pointer hover:bg-amber-100"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                        <span className="truncate">Đổi sân</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCancelBooking(selectedBooking);
                          setSelectedBooking(null);
                          onCheckoutModeChange?.(true);
                        }}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2 text-[11px] font-black text-red-700 shadow-sm transition active:scale-[0.99] cursor-pointer hover:bg-red-100"
                      >
                        <Ban className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Hủy đặt sân</span>
                      </button>
                    </div>
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
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99]"
                    >
                      <Undo2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Kết thúc / Trả sân</span>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTransferBooking(selectedBooking);
                          setSelectedTargetCourt(null);
                        }}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-2 text-[11px] font-black text-amber-800 shadow-sm transition active:scale-[0.99] cursor-pointer hover:bg-amber-100"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                        <span className="truncate">Đổi sân</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCancelBooking(selectedBooking);
                          setSelectedBooking(null);
                          onCheckoutModeChange?.(true);
                        }}
                        className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-2 text-[11px] font-black text-red-700 shadow-sm transition active:scale-[0.99] cursor-pointer hover:bg-red-100"
                      >
                        <Ban className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Hủy đặt sân</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedBooking.status === 'Đã hủy' && (
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-medium text-slate-500">
                    Lượt đặt đã hủy. Không còn thao tác sân khả dụng.
                  </div>
                )}
              </div>

              {(selectedBooking.status === 'Đã đặt' || selectedBooking.status === 'Đang sử dụng') && (
                <div className="flex items-start gap-1.5 px-0.5 text-[10px] leading-relaxed text-slate-600">
                  <Phone className="mt-0.5 h-3 w-3 shrink-0" />
                  <p>Lưu ý: Thao tác hủy thủ công sẽ gửi tin nhắn SMS xác nhận tự động hoàn tiền/cấn trừ cho khách.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* 4. MODAL ĐẶT SÂN TẠI QUẦY (ĐỒNG BỘ GIAO DIỆN CHUẨN KHÁCH HÀNG) */}
      {bookingCourt && (
        <div className="fixed top-0 bottom-0 left-0 right-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-slate-50 p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh] overflow-y-auto space-y-4 border border-slate-100 flex flex-col">
            
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-1 mx-auto sm:hidden shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-black">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">CHI TIẾT ĐẶT SÂN</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Kiểm tra thông tin & tiến hành thanh toán</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBookingCourt(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleAdminBookingSubmit} className="space-y-4">
              
              {/* Card 4: TÓM TẮT ĐƠN ĐẶT SÂN */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">4</span>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">TÓM TẮT ĐƠN ĐẶT SÂN</h3>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ĐÃ CHỌN SÂN
                  </span>
                </div>

                <div className="space-y-2.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Môn thi đấu</span>
                    <span className="font-bold text-slate-900">{bookingCourt.sportName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sân thi đấu</span>
                    <span className="font-black text-emerald-700 text-sm">{bookingCourt.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ngày đặt</span>
                    <span className="font-bold text-slate-900">{formatBookingDateVi(selectedDate)}</span>
                  </div>

                  {/* Start Time Selector */}
                  <div className="flex items-center justify-between border-t border-slate-200/80 pt-2">
                    <span className="text-slate-600 font-bold">Giờ bắt đầu:</span>
                    <select
                      value={bookingStartTime}
                      onChange={(e) => handleBookingStartTimeChange(e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-black outline-none cursor-pointer transition ${
                        adminBookingConflict 
                          ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' 
                          : 'border-slate-300 bg-white text-slate-800 focus:border-emerald-500'
                      }`}
                    >
                      {START_TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* End Time Selector */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-600 font-bold">Giờ kết thúc:</span>
                    <select
                      value={bookingEndTime}
                      onChange={(e) => handleBookingEndTimeChange(e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-black outline-none cursor-pointer transition ${
                        adminBookingConflict 
                          ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' 
                          : 'border-slate-300 bg-white text-slate-800 focus:border-emerald-500'
                      }`}
                    >
                      {bookingEndTimeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Duration Selector */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-600 font-bold">Thời lượng thuê:</span>
                    <select
                      value={bookingDuration}
                      onChange={(e) => handleBookingDurationChange(Number(e.target.value))}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-black text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {availableDurations.map((dur) => (
                        <option key={dur} value={dur}>
                          {dur === 30 ? '30 phút' : dur % 60 === 0 ? `${dur / 60} tiếng` : `${Math.floor(dur / 60)} tiếng 30 phút`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Khung giờ</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      adminBookingConflict
                        ? 'text-red-700 bg-red-100 border border-red-300'
                        : 'text-emerald-800 bg-emerald-100/70'
                    }`}>
                      {bookingStartTime} – {bookingEndTime} ({bookingDuration === 30 ? '30 phút' : `${bookingDuration / 60} tiếng`})
                    </span>
                  </div>

                  {/* 🚨 RED CONFLICT WARNING BANNER */}
                  {adminBookingConflict && (
                    <div className="rounded-xl border-2 border-red-500 bg-red-50 p-3 text-xs text-red-700 space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-black text-red-800 uppercase text-[11px]">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>KHÔNG THỂ ĐẶT — KHUNG GIỜ ĐÃ BỊ TRÙNG!</span>
                      </div>
                      <p className="text-[11px] font-medium text-red-700 leading-relaxed">
                        Khung giờ <span className="font-black text-red-900 bg-red-100 px-1.5 py-0.5 rounded">{bookingStartTime} – {bookingEndTime}</span> bị trùng với lịch đặt trước trên {bookingCourt.name}:
                      </p>
                      <div className="rounded-lg bg-white border border-red-200 px-2.5 py-1 text-[11px] font-black text-red-900">
                        📌 {adminBookingConflict.customerName} ({adminBookingConflict.time})
                      </div>
                      <p className="text-[10px] font-bold text-red-600">
                        👉 Vui lòng đổi Giờ bắt đầu hoặc Giờ kết thúc để chọn khung giờ còn trống!
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Đơn giá niêm yết</span>
                    <span className="font-bold text-slate-700">{bookingCourt.pricePerHour.toLocaleString('vi-VN')}đ / giờ</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                    <span className="text-slate-700 font-black text-sm">TỔNG THANH TOÁN</span>
                    <span className={`text-2xl font-black ${adminBookingConflict ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>
                      {(Math.round(bookingCourt.pricePerHour * (bookingDuration / 60))).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 5: THÔNG TIN NGƯỜI ĐẶT */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">5</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">THÔNG TIN NGƯỜI ĐẶT</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                        HỌ VÀ TÊN *
                      </label>
                      {bookingErrors.name && (
                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {bookingErrors.name}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      value={bookingCustomerName}
                      onChange={(e) => {
                        setBookingCustomerName(e.target.value);
                        if (bookingErrors.name) setBookingErrors((prev) => ({ ...prev, name: undefined }));
                      }}
                      placeholder="Nhập họ và tên..."
                      className={`w-full rounded-xl border px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition ${
                        bookingErrors.name
                          ? 'border-red-400 bg-red-50/50 focus:border-red-500 ring-2 ring-red-100'
                          : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                        SỐ ĐIỆN THOẠI *
                      </label>
                      {bookingErrors.phone && (
                        <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {bookingErrors.phone}
                        </span>
                      )}
                    </div>
                    <input
                      type="tel"
                      required
                      value={bookingCustomerPhone}
                      onChange={(e) => {
                        setBookingCustomerPhone(e.target.value);
                        if (bookingErrors.phone) setBookingErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="Nhập số điện thoại (10 số)..."
                      className={`w-full rounded-xl border px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition ${
                        bookingErrors.phone
                          ? 'border-red-400 bg-red-50/50 focus:border-red-500 ring-2 ring-red-100'
                          : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                      GHI CHÚ THÊM (TÙY CHỌN)
                    </label>
                    <input
                      type="text"
                      value={bookingNote}
                      onChange={(e) => setBookingNote(e.target.value)}
                      placeholder="VD: Cần mượn thêm vợt, bóng..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={bookingSendZalo}
                      onChange={(e) => setBookingSendZalo(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-slate-700 text-xs font-semibold">Gửi vé điện tử & thông báo nhắc lịch qua Zalo/SMS</span>
                  </label>
                </div>
              </div>

              {/* Submit Button & Conflict Alert */}
              {adminBookingConflict && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-[11px] font-bold text-red-700 animate-in fade-in flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Khung giờ đã bị trùng lịch! Vui lòng chọn giờ khác để tiếp tục.</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBookingCourt(null)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={Boolean(adminBookingConflict)}
                  className={`flex-[2] flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black uppercase tracking-wider transition ${
                    adminBookingConflict
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  TIẾN HÀNH THANH TOÁN ({(Math.round(bookingCourt.pricePerHour * (bookingDuration / 60))).toLocaleString('vi-VN')}đ)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟡 MODAL THANH TOÁN (PAYMENT BOTTOM SHEET) - GIỐNG HỆT THIẾT KẾ MẪU */}
      {showPaymentModal && pendingBookingData && (
        <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col items-center max-h-[94vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-4 sm:hidden"></div>
            
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">THANH TOÁN ĐƠN HÀNG</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 text-center">Quét mã VietQR bằng ứng dụng ngân hàng</p>

            <div className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-5 relative overflow-hidden text-center">
              <div className="flex justify-between items-center mb-3">
                <p className="font-extrabold text-slate-900 text-sm">MB BANK</p>
                <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">VIETQR</span>
              </div>
              
              <QrCodeArtwork className="mx-auto h-40 w-40" />

              <div className="mt-4 space-y-1 text-xs">
                <p className="text-slate-500">Số tiền thanh toán:</p>
                <p className="text-2xl font-black text-emerald-600">{pendingBookingData.total.replace(' ', '')}</p>
                <p className="text-slate-500 mt-2">Nội dung chuyển khoản:</p>
                <p className="font-mono font-bold text-slate-900 bg-white py-1 rounded border border-slate-200 uppercase">
                  CX {pendingBookingData.court.replace(/ /g, '').toUpperCase()} {pendingBookingData.phone.replace(/[\s.-]/g, '')}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-6 w-6 rounded-full bg-emerald-500 items-center justify-center">
                  <span className="h-2 w-2 bg-white rounded-full"></span>
                </span>
              </div>
              <button type="button" onClick={handleConfirmPaymentSuccess} className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-bold text-white">Xác nhận đã nhận thanh toán VietQR</button>
            </div>

            <div className="w-full mt-6">
              <button
                type="button"
                onClick={handleCancelPayment}
                className="w-full rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95"
              >
                Hủy giao dịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 MODAL XÁC NHẬN ĐẶT SÂN & THANH TOÁN THÀNH CÔNG */}
      {paymentSuccessBooking && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-300 bg-white p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600 border border-emerald-300">
              ✓
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">ĐẶT SÂN THÀNH CÔNG!</h3>
              <p className="mt-1 text-xs text-slate-600">
                Mã đơn của khách là <span className="font-mono font-bold text-emerald-700">#{paymentSuccessBooking.code}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-left text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-900">{paymentSuccessBooking.customerName} ({paymentSuccessBooking.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Môn & Sân:</span>
                <span className="font-black text-emerald-700">{paymentSuccessBooking.sport} · {paymentSuccessBooking.court}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khung giờ:</span>
                <span className="font-bold text-slate-900">{paymentSuccessBooking.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày đặt:</span>
                <span className="font-bold text-slate-900">{formatBookingDateVi(selectedDate)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Đã thanh toán đủ qua VietQR:</span>
                <span className="font-black text-emerald-600 text-sm">{paymentSuccessBooking.total}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Hệ thống đã tự động gửi vé điện tử và thông báo nhắc lịch qua Zalo/SMS tới SĐT <strong className="text-slate-900">{paymentSuccessBooking.phone}</strong>.
            </p>

            <p className="text-center text-[11px] text-amber-800 bg-amber-50 border border-amber-200/90 rounded-xl py-2 px-3">
              ⚠️ <strong>Lưu ý:</strong> Vui lòng in biên nhận để kiểm tra vé tại quầy.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                className="w-full rounded-xl border border-emerald-600 bg-emerald-50/70 py-3 text-xs font-bold uppercase tracking-wider text-emerald-800 hover:bg-emerald-100 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
              >
                <ReceiptText className="w-4 h-4 text-emerald-700" />
                Biên nhận
              </button>

              <button
                type="button"
                onClick={handleFinishBooking}
                className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-600 cursor-pointer active:scale-95 transition shadow-sm shadow-emerald-500/20"
              >
                HOÀN TẤT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 MODAL BIÊN NHẬN THANH TOÁN (RECEIPT MODAL) */}
      {showReceipt && paymentSuccessBooking && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            {/* Header Biên nhận */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Biên nhận đặt sân</h4>
                  <p className="text-[11px] text-slate-500">CourtX Arena · Hóa đơn điện tử</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition"
                aria-label="Đóng biên nhận"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chi tiết biên nhận */}
            <div className="space-y-2 rounded-2xl bg-slate-50/90 p-3.5 border border-slate-200/80 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã biên nhận (Vé):</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">#{paymentSuccessBooking.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-900">{paymentSuccessBooking.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-medium text-slate-700">{paymentSuccessBooking.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bộ môn & Sân:</span>
                <span className="font-bold text-slate-900">{paymentSuccessBooking.sport} · {paymentSuccessBooking.court}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-semibold text-slate-800">{formatBookingDateVi(selectedDate)} · {paymentSuccessBooking.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-bold text-emerald-700">VietQR (100%)</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-700">Tổng tiền thanh toán:</span>
                <span className="font-black text-emerald-600">{paymentSuccessBooking.total}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1 text-slate-500">
                <span>Trạng thái:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  <Check className="h-3 w-3" /> Đã thanh toán
                </span>
              </div>
            </div>

            <p className="text-center text-[11px] text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl py-2 px-3">
              ⚠️ <strong>Lưu ý:</strong> Vui lòng in biên nhận để kiểm tra vé tại quầy.
            </p>

            {/* Nút hành động */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                In biên nhận
              </button>
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-bold text-white active:scale-95 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🟢 MODAL ĐIỀU CHUYỂN SÂN KHI CÓ SỰ CỐ BẢO TRÌ (PHƯƠNG ÁN 1) */}
      {transferBooking && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh] overflow-y-auto space-y-4 border border-slate-100 flex flex-col">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-1 mx-auto sm:hidden shrink-0"></div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Điều chuyển sân thi đấu
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Áp dụng khi sân gặp sự cố hoặc cần bảo trì
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTransferBooking(null)}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Thông tin đơn đặt hiện tại */}
            <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2 border border-slate-200 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-extrabold text-slate-900">{transferBooking.customerName} ({transferBooking.phone})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Khung giờ:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{transferBooking.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Sân hiện tại:</span>
                <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{transferBooking.court} ({transferBooking.sport})</span>
              </div>
            </div>

            {/* Lý do chuyển sân */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Lý do điều chuyển:
              </label>
              <select
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
              >
                <option value="Sân hiện tại gặp sự cố kỹ thuật / bảo trì">Sân gặp sự cố kỹ thuật / bảo trì</option>
                <option value="Hỏng bóng đèn / rách lưới cần sửa gấp">Hỏng đèn / rách lưới cần sửa gấp</option>
                <option value="Khách hàng yêu cầu đổi sân">Khách hàng yêu cầu đổi sân</option>
                <option value="Điều phối mặt sân nội bộ">Điều phối mặt sàn nội bộ</option>
              </select>
            </div>

            {/* Danh sách sân cùng bộ môn khả dụng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Chọn sân chuyển đến:
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {candidateCourtsForTransfer.filter(c => !c.isOccupied).length} sân trống cùng giờ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {candidateCourtsForTransfer.map((court) => {
                  const isSelected = selectedTargetCourt?.id === court.id;
                  return (
                    <button
                      key={court.id}
                      type="button"
                      disabled={court.isOccupied}
                      onClick={() => setSelectedTargetCourt(court)}
                      className={`flex flex-col p-3 rounded-2xl border text-left transition ${
                        court.isOccupied
                          ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                          : 'border-slate-200 bg-white hover:border-amber-300 active:scale-95 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{court.name}</span>
                        {court.isOccupied ? (
                          <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Đã kín</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Khả dụng</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">{court.priceLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {transferSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold leading-relaxed flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <p>{transferSuccessMsg}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferBooking(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!selectedTargetCourt || candidateCourtsForTransfer.find(c => c.id === selectedTargetCourt.id)?.isOccupied}
                onClick={() => selectedTargetCourt && handleConfirmTransfer(selectedTargetCourt)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-sm ${
                  !selectedTargetCourt || candidateCourtsForTransfer.find(c => c.id === selectedTargetCourt.id)?.isOccupied
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 active:scale-95 cursor-pointer'
                }`}
              >
                Xác nhận chuyển sân
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟣 POPUP MODAL HOÀN TIỀN / HỦY SÂN (ĐỒNG BỘ 100% FORM VỚI BÊN KHÁCH HÀNG TRANG CHỦ) */}
      {cancelPopup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            {cancelPopup.type === 'processing' ? (
              <div className="space-y-3 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{cancelPopup.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{cancelPopup.message}</p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full w-fit mx-auto border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Đang giao dịch qua cổng thanh toán...
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 12 4 4 8-9" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900">{cancelPopup.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{cancelPopup.message}</p>
                <p className="text-xs font-semibold leading-relaxed text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  {cancelPopup.policyMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setCancelPopup(null)}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer active:scale-95 transition"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
