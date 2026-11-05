import { supabase } from '../lib/supabaseClient';
import { downloadBookingReceipt, printBookingReceipt, type BookingReceiptData } from '../utils/bookingReceipt';
import { useMemo, useRef, useState, useEffect } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowRightLeft, Ban, Calendar, CalendarClock,
  Check, CheckCircle2, RefreshCw, ChevronDown, ChevronLeft, ChevronRight, CircleX, XCircle,
  Clock3, Cloud, CreditCard, Info, LayoutGrid, MapPin, Phone,
  Bell, Download, Printer, ReceiptText, Search, ShieldCheck, Undo2, UserRound, X, Zap, PlusCircle
} from 'lucide-react';
import AdminAddSportAndCourtModal from '../components/admin/AdminAddSportAndCourtModal';
import {
  type SportCategoryItem,
  getAdminSports,
  getAdminCourts,
  syncCourtsWithBackend,
  COURTS_UPDATED_EVENT,
  DEFAULT_ADMIN_COURTS,
} from '../utils/dynamicCourtStorage';
import QrCodeArtwork from '../components/QrCodeArtwork';
import CheckoutSettlementView from '../components/admin/CheckoutSettlementView';
import AdminBookingDialog from '../components/admin/AdminBookingDialog';
import { courtHoldService } from '../services/courtHoldService';
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

const formatWaitingTime = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} phút`;
  return minutes === 0 ? `${hours} giờ` : `${hours} giờ ${minutes} phút`;
};

import useSharedBookings, { refreshSharedBookings } from '../hooks/useSharedBookings';
import { bookingApiService } from '../services/bookingService';
import { calendarBookingDate } from '../utils/courtBookingWarnings';
import { validateCustomerName, validateCustomerPhone } from '../utils/bookingValidation';
import type { BookingDetail } from '../types/schedule';
export type { BookingDetail } from '../types/schedule';
export { INITIAL_ADMIN_BOOKINGS } from '../types/schedule';

export interface AdminCourtItem {
  id: string;
  code: string;
  name: string;
  sportId: string;
  sportName: string;
  pricePerHour: number;
  priceLabel: string;
}

export const STANDARD_ADMIN_COURTS: AdminCourtItem[] = DEFAULT_ADMIN_COURTS;

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
  const [showCancelledListModal, setShowCancelledListModal] = useState<boolean>(false);

  const [showPendingCancelList, setShowPendingCancelList] = useState(false);
  const [cancelReviewBackTarget, setCancelReviewBackTarget] = useState<'timeline' | 'pendingList'>('timeline');
  const [cancelReason, setCancelReason] = useState('Khách bận đột xuất công tác liên tỉnh, gọi báo xin hủy lịch đặt sân tối nay.');

  // State for Court Transfer (Phương án 1: Điều chuyển sân & đổi khung giờ thi đấu)
  const [transferBooking, setTransferBooking] = useState<BookingDetail | null>(null);
  const [selectedTargetCourt, setSelectedTargetCourt] = useState<AdminCourtItem | null>(null);
  const [transferStartTime, setTransferStartTime] = useState<string>('08:00');
  const [transferReason, setTransferReason] = useState<string>('Sân hiện tại gặp sự cố kỹ thuật / bảo trì');
  const [transferSuccessMsg, setTransferSuccessMsg] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  useEffect(() => {
    if (transferBooking) {
      const sh = (transferBooking.startH ?? 8).toString().padStart(2, '0');
      const sm = (transferBooking.startM ?? 0).toString().padStart(2, '0');
      setTransferStartTime(`${sh}:${sm}`);
      setSelectedTargetCourt(null);
      setTransferSuccessMsg(null);
    }
  }, [transferBooking]);

  // Popup thông báo hủy sân / hoàn tiền (đồng bộ 100% form với bên khách hàng TrangChu)
  const [cancelPopup, setCancelPopup] = useState<{
    type: 'processing' | 'cancel-success' | 'warning' | 'info';
    title: string;
    message: string;
    policyMessage?: string;
  } | null>(null);

  // Custom modal popup thay thế window.alert mặc định của trình duyệt
  const [schedulePopup, setSchedulePopup] = useState<{
    type?: 'warning' | 'info' | 'danger' | 'success';
    title: string;
    message: string;
  } | null>(null);

  const showAlert = (title: string, message: string, type: 'warning' | 'info' | 'danger' | 'success' = 'warning') => {
    setSchedulePopup({ title, message, type });
  };

  useEffect(() => {
    if (cancelPopup && cancelPopup.type === 'cancel-success') {
      const timer = setTimeout(() => {
        setCancelPopup(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [cancelPopup]);

  const [adminCourts, setAdminCourts] = useState<AdminCourtItem[]>(() => getAdminCourts());
  const [adminSports, setAdminSports] = useState<SportCategoryItem[]>(() => getAdminSports());
  const [showAddSportCourtModal, setShowAddSportCourtModal] = useState<boolean>(false);
  const [addSuccessToast, setAddSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (addSuccessToast) {
      const timer = setTimeout(() => setAddSuccessToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [addSuccessToast]);

  useEffect(() => {
    // Tự động đồng bộ danh sách sân thực tế từ Supabase khi mở màn hình
    void syncCourtsWithBackend();

    const handleCourtsUpdated = () => {
      setAdminCourts(getAdminCourts());
      setAdminSports(getAdminSports());
    };
    window.addEventListener(COURTS_UPDATED_EVENT, handleCourtsUpdated);
    return () => {
      window.removeEventListener(COURTS_UPDATED_EVENT, handleCourtsUpdated);
    };
  }, []);

  const [currentTime, setCurrentTime] = useState(getVietnamTime);
  const previousTodayRef = useRef(currentTime);
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() =>
    new Date(currentTime.getFullYear(), currentTime.getMonth(), 1));
  const [courtView, setCourtView] = useState<string>('all');
  const [intervalMode, setIntervalMode] = useState<30 | 60>(60);
  const [, setHoldsTicker] = useState(0);

  useEffect(() => {
    const unsub = courtHoldService.subscribe(() => {
      setHoldsTicker((t) => t + 1);
    });
    const ticker = setInterval(() => {
      setHoldsTicker((t) => t + 1);
    }, 1000);
    return () => {
      unsub();
      clearInterval(ticker);
    };
  }, []);

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
  const [allBookings, setAdminBookings, bookingsState] = useSharedBookings();
  const [checkinSaving,setCheckinSaving]=useState(false);
  const [checkinError,setCheckinError]=useState('');
  useEffect(() => {
    setCheckinBooking(previous => previous ? allBookings.find(booking => booking.code === previous.code) || previous : null);
    setCheckoutBooking(previous => previous ? allBookings.find(booking => booking.code === previous.code) || previous : null);
    setSelectedBooking(previous => previous ? allBookings.find(booking => booking.code === previous.code) || previous : null);
  }, [allBookings]);
  const adminBookings = allBookings.filter(booking => booking.bookingDate === calendarBookingDate(selectedDate));

  // Danh sách các đơn đã hủy trong ngày đang chọn
  const cancelledBookings = useMemo(() => {
    const curDateStr = calendarBookingDate(selectedDate);
    return adminBookings.filter(
      (b) => (b.bookingDate === curDateStr || !b.bookingDate) && (b.status === 'Đã hủy' || b.status === 'DA_HUY')
    );
  }, [adminBookings, selectedDate]);

  // Tra cứu lịch đặt sân để Check-in nhanh (theo SĐT hoặc Mã đặt sân)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const cleanDigits = q.replace(/\D/g, '');

    return allBookings
      .filter((b) => {
        const matchCode = (b.code || '').toLowerCase().includes(q);
        const matchName = (b.customerName || '').toLowerCase().includes(q);
        const bPhoneClean = (b.phone || '').replace(/\D/g, '');
        const matchPhone = (cleanDigits.length > 0 && bPhoneClean.includes(cleanDigits)) || (b.phone && b.phone.toLowerCase().includes(q));
        const matchCourt = (b.court || '').toLowerCase().includes(q) || (b.courtCode || '').toLowerCase().includes(q);
        return matchCode || matchName || matchPhone || matchCourt;
      })
      .sort((a, b) => {
        const curDateStr = calendarBookingDate(selectedDate);
        if (a.bookingDate === curDateStr && b.bookingDate !== curDateStr) return -1;
        if (b.bookingDate === curDateStr && a.bookingDate !== curDateStr) return 1;
        const score = (status: string) => {
          if (status === 'Đã đặt') return 1;
          if (status === 'Đang sử dụng') return 2;
          if (status === 'Đã kết thúc' || status === 'Hoàn tất') return 3;
          return 4;
        };
        return score(a.status) - score(b.status);
      });
  }, [allBookings, searchQuery, selectedDate]);

  const handleSelectSearchResult = (booking: BookingDetail, action: 'checkin' | 'view' = 'checkin') => {
    if (booking.bookingDate) {
      const [y, m, d] = booking.bookingDate.split('-').map(Number);
      if (y && m && d) {
        setSelectedDate(new Date(y, m - 1, d));
        setCalendarMonth(new Date(y, m - 1, 1));
      }
    }

    if (action === 'checkin') {
      openCheckinDetail(booking);
    } else {
      openBooking(booking);
    }

    setIsSearchFocused(false);
  };

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
  const [adminPaymentCountdown, setAdminPaymentCountdown] = useState<number>(60);
  const [adminPaymentSessionId, setAdminPaymentSessionId] = useState<string>('');
  const [bookingSaving, setBookingSaving] = useState(false);
  const [bookingSaveError, setBookingSaveError] = useState('');
  const [pendingBookingData, setPendingBookingData] = useState<BookingDetail | null>(null);
  const [paymentSuccessBooking, setPaymentSuccessBooking] = useState<BookingDetail | null>(null);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  const getAdminReceiptData = (): BookingReceiptData | null => paymentSuccessBooking ? ({
    bookingCode: paymentSuccessBooking.code,
    paymentCode: paymentSuccessBooking.paymentCode || '',
    customerName: paymentSuccessBooking.customerName,
    customerPhone: paymentSuccessBooking.phone,
    sport: paymentSuccessBooking.sport,
    court: paymentSuccessBooking.court,
    date: formatBookingDateVi(selectedDate),
    time: paymentSuccessBooking.time,
    total: paymentSuccessBooking.total,
  }) : null;
  const handleDownloadAdminReceipt = () => {
    const receipt = getAdminReceiptData();
    if (receipt) downloadBookingReceipt(receipt);
  };
  const handlePrintAdminReceipt = () => {
    const receipt = getAdminReceiptData();
    if (receipt) printBookingReceipt(receipt);
  };

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
    const base = courtView === 'all' ? adminCourts : adminCourts.filter((c) => c.sportId === courtView);
    return calendarBookingDate(selectedDate) < calendarBookingDate(currentTime) ? base : base.filter((c) => !isCourtLocked(c.code));
  }, [courtView, courtStatuses, sharedCourtStatuses, selectedDate, currentTime, adminCourts]);

  // Group displayed courts by Sport for clear visual separation
  const sportGroups = useMemo(() => {
    return adminSports
      .map((sp) => {
        const courtsInSport = displayedCourts.filter((c) => c.sportId === sp.id);
        return {
          id: sp.id,
          name: sp.name,
          icon: sp.icon,
          priceText: `${sp.pricePerHour.toLocaleString('vi-VN')} VND/h`,
          courts: courtsInSport,
        };
      })
      .filter((g) => g.courts.length > 0);
  }, [displayedCourts, adminSports]);

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

  const isPastDate = (targetDate: Date, refDate: Date = currentTime) => {
    const d1 = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const d2 = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
    return d1 < d2;
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

  const getBookingDateLabel = (dateStr?: string) => {
    if (!dateStr) return 'Hôm nay';
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return formatBookingDateVi(d);
    }
    return dateStr;
  };

  const getBookingDateDetails = (dateStr?: string) => {
    if (!dateStr) return { dayOfWeek: 'Hôm nay', fullDate: '' };
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      const dow = isToday(d) ? 'Hôm nay' : daysOfWeekVi[d.getDay()];
      const dStr = `${parts[2].toString().padStart(2, '0')}/${parts[1].toString().padStart(2, '0')}/${parts[0]}`;
      return { dayOfWeek: dow, fullDate: dStr };
    }
    return { dayOfWeek: dateStr, fullDate: '' };
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
      const dObj = new Date(year, month, i);
      days.push({
        dayNumber: i,
        dateObj: dObj,
        isCurrentMonth: true,
        isPast: isPastDate(dObj, currentTime),
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
      if (b.status === 'ĐÃ HỦY' || b.status === 'Đã hủy') return false;
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

  const [, setAdminHoldTrigger] = useState(0);
  useEffect(() => {
    return courtHoldService.subscribe(() => {
      setAdminHoldTrigger((v) => v + 1);
    });
  }, []);

  const adminBookingConflict = useMemo(() => {
    if (!bookingCourt || !bookingStartTime || !bookingDuration) return null;
    const reqStart = parseTimeToMinutes(bookingStartTime);
    const reqEnd = reqStart + bookingDuration;

    // 1. Kiểm tra với lịch đã đặt
    const booked = adminBookings.find((b) => {
      // Bỏ qua đơn đã hủy
      if (b.status === 'ĐÃ HỦY' || b.status === 'Đã hủy') return false;
      if (b.courtCode !== bookingCourt.code && b.court !== bookingCourt.name) return false;
      const bStart = (b.startH ?? 0) * 60 + (b.startM ?? 0);
      const bEnd = (b.endH ?? 0) * 60 + (b.endM ?? 0);
      return Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd);
    });

    if (booked) return booked;

    // 2. Kiểm tra xem có khách khác đang tạm giữ ưu tiên không
    const bDate = calendarBookingDate(selectedDate);
    const held = courtHoldService.isSlotHeldByAnother(
      bookingCourt.name,
      bDate,
      bookingStartTime,
      bookingDuration,
      adminPaymentSessionId
    );

    if (held) {
      return {
        customerName: 'Khách khác (đang tạm giữ thanh toán)',
        time: `${held.startTime} (${held.duration}p)`,
      } as any;
    }

    return null;
  }, [bookingCourt, bookingStartTime, bookingDuration, adminBookings, selectedDate, adminPaymentSessionId]);

  const validStartTimeOptions = useMemo(() => {
    if (!isToday(selectedDate)) {
      return START_TIME_OPTIONS;
    }
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    return START_TIME_OPTIONS.filter((t) => parseTimeToMinutes(t) > currentMins);
  }, [selectedDate, currentTime, START_TIME_OPTIONS]);

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
    if (isCourtLocked(court.code)) {
      showAlert('Sân đang bảo trì', 'Sân đang bị khóa bảo trì, vui lòng chọn sân khác.', 'warning');
      return;
    }
    if (isPastDate(selectedDate, currentTime)) {
      showAlert('Ngày không hợp lệ', 'Không thể đặt sân cho ngày trong quá khứ! Vui lòng chọn ngày hiện tại hoặc tương lai.', 'warning');
      return;
    }

    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const isTodaySelected = isToday(selectedDate);
    let chosenStart = time;
    if (isTodaySelected && parseTimeToMinutes(time) <= currentMins) {
      const nextSlot = START_TIME_OPTIONS.find((t) => parseTimeToMinutes(t) > currentMins);
      if (!nextSlot) {
        showAlert(
          'Hết khung giờ khả dụng hôm nay',
          'Hôm nay đã hết khung giờ khả dụng để đặt sân (Nhà thi đấu đóng cửa lúc 23:00).\n\nVui lòng chọn ngày tiếp theo trên thanh lịch để tiếp tục đặt chỗ!',
          'warning'
        );
        return;
      }
      chosenStart = nextSlot;
    }

    const held = courtHoldService.isSlotHeldByAnother(
      court.name,
      calendarBookingDate(selectedDate),
      chosenStart,
      duration,
      adminPaymentSessionId
    );
    if (held) {
      showAlert(
        'Khung giờ đang được tạm giữ!',
        `Khung giờ ${chosenStart} trên ${court.name} đang có khách khác giữ chỗ để quét mã VietQR.\n\nHệ thống đang chờ khách hoàn tất thanh toán (trong thời gian ưu tiên giữ sân). Vui lòng chọn khung giờ khác hoặc quay lại sau ít phút!`,
        'warning'
      );
      return;
    }

    setBookingCourt(court);
    setBookingStartTime(chosenStart);
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
    const errors: { name?: string; phone?: string; time?: string; date?: string; conflict?: string } = {};

    // 1. Ràng buộc ngày và giờ không ở quá khứ
    if (isPastDate(selectedDate, currentTime)) {
      errors.date = 'Không thể đặt sân cho ngày trong quá khứ!';
    } else if (isToday(selectedDate)) {
      const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
      const startMin = parseTimeToMinutes(bookingStartTime);
      if (startMin <= nowMin) {
        errors.time = `Giờ bắt đầu (${bookingStartTime}) phải sau giờ hiện tại (${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')})!`;
      }
    }

    // 2. Ràng buộc không trùng lịch
    if (adminBookingConflict) {
      errors.conflict = `Khung giờ ${bookingStartTime} - ${bookingEndTime} trên ${bookingCourt?.name} bị trùng với lịch của ${adminBookingConflict.customerName} (${adminBookingConflict.time}). Vui lòng chọn giờ hoặc sân khác!`;
    }

    const nameValidation = validateCustomerName(bookingCustomerName);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.error;
    }

    const phoneValidation = validateCustomerPhone(bookingCustomerPhone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
    }

    setBookingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdminBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCourt) return;
    if (isCourtLocked(bookingCourt.code)) {
      showAlert('Sân đang bị khóa', 'Sân đang bị khóa, vui lòng chọn sân khác.', 'warning');
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
      code: '', // Assigned by the database after the booking and payment commit.
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

    const newSession = 'PAY_ADMIN_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const bDate = pendingBooking.bookingDate || calendarBookingDate(selectedDate);
    setBookingSaveError('');
    setPendingBookingData(pendingBooking);
    setAdminPaymentSessionId(newSession);
    setAdminPaymentCountdown(60);

    courtHoldService.holdSlot({
      sessionId: newSession,
      courtName: bookingCourt.name,
      bookingDate: bDate,
      startTime: bookingStartTime,
      duration: bookingDuration,
      customerName: bookingCustomerName,
      customerPhone: bookingCustomerPhone,
      holdSeconds: 60,
    });

    setShowPaymentModal(true);
  };

  const handleConfirmPaymentSuccess = async () => {
    if (bookingSaving) return;
    if (!pendingBookingData) return;
    if (isCourtLocked(pendingBookingData.courtCode || pendingBookingData.court)) {
      showAlert('Sân đang bị khóa', 'Sân đang bị khóa, không thể xác nhận đặt sân.', 'warning');
      return;
    }

    const startMins = (pendingBookingData.startH ?? 0) * 60 + (pendingBookingData.startM ?? 0);
    const endMins = (pendingBookingData.endH ?? 0) * 60 + (pendingBookingData.endM ?? 0);
    const sH = Math.floor(startMins / 60).toString().padStart(2, '0');
    const sM = (startMins % 60).toString().padStart(2, '0');
    const eH = Math.floor(endMins / 60).toString().padStart(2, '0');
    const eM = (endMins % 60).toString().padStart(2, '0');
    const bDate = pendingBookingData.bookingDate || calendarBookingDate(selectedDate);

    // 1. Kiểm tra tranh chấp thực tế trên Database (Ai thanh toán trước thì tính cho khách đó)
    const conflictCheck = await courtHoldService.checkRealBookingConflict(
      pendingBookingData.court,
      bDate,
      `${sH}:${sM}`,
      endMins - startMins
    );

    if (conflictCheck.hasConflict) {
      setShowPaymentModal(false);
      setPendingBookingData(null);
      setAdminPaymentCountdown(60);
      courtHoldService.releaseSlot(adminPaymentSessionId);
      await refreshSharedBookings();
      showAlert(
        'Khung giờ đã có người thanh toán trước!',
        `Xung đột: ${conflictCheck.message || 'Khung giờ này vừa có khách khác hoàn tất thanh toán trước.'}\n\nDo đã hết thời gian ưu tiên giữ sân nên hệ thống ưu tiên khách thanh toán trước. Vui lòng chọn khung giờ khác!`,
        'danger'
      );
      return;
    }

    setBookingSaving(true);
    setBookingSaveError('');
    // Đồng bộ đơn đặt mới lên Supabase Online
    try {
      const autoBankCode = `VQR${Date.now().toString().slice(-8)}`;

      const saved = await bookingApiService.createBooking({
        courtCode: pendingBookingData.courtCode || pendingBookingData.court,
        bookingDate: bDate,
        startTime: `${sH}:${sM}`,
        endTime: `${eH}:${eM}`,
        customerName: pendingBookingData.customerName,
        customerPhone: pendingBookingData.phone,
        totalAmount: parseInt(pendingBookingData.total.replace(/\D/g, '') || '120000', 10),
        channel: 'TAI_QUAY',
        staffId: (currentUser as any)?.id?.startsWith('NV') ? (currentUser as any).id : null,
        bankTransactionCode: autoBankCode,
        paymentConfirmed: true,
      });
      courtHoldService.releaseSlot(adminPaymentSessionId);
      await refreshSharedBookings();
      setPaymentSuccessBooking(saved.booking);
      setShowPaymentModal(false);
      setBookingCourt(null);
    } catch (err: any) {
      console.warn('Chưa lưu được lượt đặt và thanh toán:', err);
      setBookingSaveError(err?.message || 'Chưa lưu được lượt đặt.');
    } finally {
      setBookingSaving(false);
    }
  };

  // URL xác nhận thanh toán mô phỏng cho điện thoại quét QR (sử dụng IP Wi-Fi thực tế của máy)
  const adminMobilePaymentUrl = useMemo(() => {
    if (!showPaymentModal || !pendingBookingData || !adminPaymentSessionId) return '';
    let host = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.65';
    if (host === 'localhost' || host === '127.0.0.1') {
      host = '192.168.1.65'; // IP mạng Wi-Fi thực tế của máy tính
    }
    const port = typeof window !== 'undefined' && window.location.port ? ':' + window.location.port : '';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const q = new URLSearchParams({
      view: 'phone-payment',
      session: adminPaymentSessionId,
      court: pendingBookingData.court,
      amount: pendingBookingData.total.replace(/\D/g, ''),
      phone: pendingBookingData.phone,
      time: pendingBookingData.time,
      name: pendingBookingData.customerName,
    });
    return protocol + '//' + host + port + '/?' + q.toString();
  }, [showPaymentModal, pendingBookingData, adminPaymentSessionId]);

  // URL mở trực tiếp trên trình duyệt máy tính mà không bị lỗi kết nối IP
  const adminLocalSimulatorUrl = useMemo(() => {
    if (!showPaymentModal || !pendingBookingData || !adminPaymentSessionId) return '';
    const q = new URLSearchParams({
      view: 'phone-payment',
      session: adminPaymentSessionId,
      court: pendingBookingData.court,
      amount: pendingBookingData.total.replace(/\D/g, ''),
      phone: pendingBookingData.phone,
      time: pendingBookingData.time,
      name: pendingBookingData.customerName,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return origin ? `${origin}/?${q.toString()}` : `/?${q.toString()}`;
  }, [showPaymentModal, pendingBookingData, adminPaymentSessionId]);

  // Lắng nghe tín hiệu xác nhận từ điện thoại qua Supabase Realtime & LocalStorage
  useEffect(() => {
    if (!showPaymentModal || !adminPaymentSessionId) return;

    const channel = supabase.channel('payment_session_' + adminPaymentSessionId);
    channel
      .on('broadcast', { event: 'PAYMENT_CONFIRMED' }, () => {
        void handleConfirmPaymentSuccess();
      })
      .on('broadcast', { event: 'PAYMENT_CANCELLED' }, () => {
        handleExecuteAdminCancelSubprocess();
      })
      .subscribe();

    const interval = setInterval(() => {
      try {
        const item = localStorage.getItem('courtx_confirmed_' + adminPaymentSessionId);
        if (item) {
          localStorage.removeItem('courtx_confirmed_' + adminPaymentSessionId);
          void handleConfirmPaymentSuccess();
        }
      } catch {
        // ignore
      }
    }, 600);

    return () => {
      clearInterval(interval);
      void channel.unsubscribe();
    };
  }, [showPaymentModal, adminPaymentSessionId]);

  // TOBE_CHAY.bpmn: Quản lý logic Thanh toán theo sơ đồ BPMN TOBE
  const [showAdminCancelSubprocessModal, setShowAdminCancelSubprocessModal] = useState<boolean>(false);
  const [adminPaymentTechnicalError, setAdminPaymentTechnicalError] = useState<string | null>(null);
  const [adminPaymentNotification, setAdminPaymentNotification] = useState<string | null>(null);

  const handleCancelPayment = () => {
    setShowAdminCancelSubprocessModal(true);
  };

  const handleExecuteAdminCancelSubprocess = () => {
    setShowAdminCancelSubprocessModal(false);
    setShowPaymentModal(false);
    setPendingBookingData(null);
    setAdminPaymentCountdown(60);
    setAdminPaymentTechnicalError(null);
    setAdminPaymentNotification(null);
    courtHoldService.releaseSlot(adminPaymentSessionId);
  };

  const handleRetryAdminPayment = () => {
    setAdminPaymentTechnicalError(null);
    setAdminPaymentCountdown(60);
  };

  const handleCancelAfterAdminPaymentError = () => {
    setAdminPaymentTechnicalError(null);
    setShowPaymentModal(false);
    setPendingBookingData(null);
    setAdminPaymentCountdown(60);
    courtHoldService.releaseSlot(adminPaymentSessionId);
  };

  const handleTriggerAdmin10MinTimeout = () => {
    courtHoldService.releaseSlot(adminPaymentSessionId);
    setAdminPaymentNotification(null);
  };

  // Tự động kiểm tra thời gian thanh toán theo TOBE_CHAY.bpmn (40s nhắc nhở, 1 phút hết hạn giữ ưu tiên)
  useEffect(() => {
    if (!showPaymentModal || adminPaymentTechnicalError || showAdminCancelSubprocessModal) {
      return;
    }
    // Khi trôi qua 40s (giả lập 8 phút trong BPMN, còn 20s: adminPaymentCountdown === 20): tự động kích hoạt Boundary Timer nhắc nhở
    if (adminPaymentCountdown === 20 && !adminPaymentNotification) {
      setAdminPaymentNotification('Nhắc nhở thanh toán: Sân tạm giữ sẽ hết hạn trong 20 giây tới, vui lòng quét mã QR để hoàn tất!');
    }
    // Khi hết 1 phút (60s): Hết thời gian ưu tiên giữ sân
    // Giải phóng lượt giữ độc quyền nhưng KHÔNG đóng modal, khách/nhân viên vẫn có thể thanh toán tiếp nếu chưa ai đặt trước!
    if (adminPaymentCountdown <= 0) {
      handleTriggerAdmin10MinTimeout();
      return;
    }
    const t = setTimeout(() => setAdminPaymentCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showPaymentModal, adminPaymentCountdown, bookingSaveError, adminPaymentTechnicalError, showAdminCancelSubprocessModal, adminPaymentNotification]);


  const handleFinishBooking = () => {
    setPaymentSuccessBooking(null);
    setPendingBookingData(null);
  };

  const transferDurationMinutes = useMemo(() => {
    if (!transferBooking) return 60;
    const bStart = (transferBooking.startH ?? 0) * 60 + (transferBooking.startM ?? 0);
    const bEnd = (transferBooking.endH ?? 0) * 60 + (transferBooking.endM ?? 0);
    const dur = bEnd - bStart;
    return dur > 0 ? dur : 60;
  }, [transferBooking]);

  const transferEndTime = useMemo(() => {
    const startMin = parseTimeToMinutes(transferStartTime || '08:00');
    const endMin = startMin + transferDurationMinutes;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  }, [transferStartTime, transferDurationMinutes]);

  const transferStartTimeOptions = useMemo(() => {
    if (!transferBooking) return START_TIME_OPTIONS;
    const isBookingDayToday = isToday(selectedDate);
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const origStartMin = (transferBooking.startH ?? 0) * 60 + (transferBooking.startM ?? 0);

    return START_TIME_OPTIONS.filter((t) => {
      const slotMin = parseTimeToMinutes(t);
      // Không vượt quá giờ đóng cửa (23:00)
      if (slotMin + transferDurationMinutes > 23 * 60) return false;
      // Nếu là ngày hôm nay: giữ nguyên slot ban đầu HOẶC chỉ chọn các slot chưa diễn ra
      if (isBookingDayToday) {
        return slotMin === origStartMin || slotMin > currentMins;
      }
      return true;
    });
  }, [transferBooking, selectedDate, currentTime, START_TIME_OPTIONS, transferDurationMinutes]);

  // Tìm danh sách các sân cùng bộ môn khả dụng để điều chuyển (theo khung giờ đã chọn)
  const candidateCourtsForTransfer = useMemo(() => {
    if (!transferBooking) return [];
    const startMin = parseTimeToMinutes(transferStartTime || '08:00');
    const endMin = startMin + transferDurationMinutes;

    const origStartMin = (transferBooking.startH ?? 0) * 60 + (transferBooking.startM ?? 0);
    const isSameSlotAsOriginal = startMin === origStartMin;

    const sameSportCourts = adminCourts.filter((c) => {
      if (c.sportId !== transferBooking.sportId) return false;
      // Nếu là cùng khung giờ cũ: ẩn sân hiện tại (vì điều chuyển cùng giờ thì phải chọn sân khác)
      // Nếu là khung giờ khác: cho phép cả sân hiện tại (khách đổi giờ thi đấu trên chính sân đó!)
      if (isSameSlotAsOriginal && c.name === transferBooking.court) return false;
      return true;
    });

    return sameSportCourts.map((court) => {
      const isCurrentCourt = court.name === transferBooking.court;
      const isLocked = isCourtLocked(court.code);

      const isOccupied = isLocked || adminBookings.some((b) => {
        if (b.court !== court.name || b.status === 'Đã hủy' || b.status === 'DA_HUY' || b.code === transferBooking.code) {
          return false;
        }
        const bStart = (b.startH ?? 0) * 60 + (b.startM ?? 0);
        const bEnd = (b.endH ?? 0) * 60 + (b.endM ?? 0);
        return Math.max(startMin, bStart) < Math.min(endMin, bEnd);
      });

      return {
        ...court,
        isOccupied,
        isCurrentCourt,
        isLocked,
      };
    });
  }, [transferBooking, transferStartTime, transferDurationMinutes, adminBookings]);

  const handleConfirmTransfer = async (targetCourt: AdminCourtItem) => {
    if (!transferBooking) return;
    const oldCourt = transferBooking.court;
    const startMin = parseTimeToMinutes(transferStartTime);
    const endMin = startMin + transferDurationMinutes;
    const newStartH = Math.floor(startMin / 60);
    const newStartM = startMin % 60;
    const newEndH = Math.floor(endMin / 60);
    const newEndM = endMin % 60;
    const newTimeStr = `${transferStartTime} - ${transferEndTime} (${transferDurationMinutes / 60} giờ)`;

    setIsTransferring(true);

    // 1. Cập nhật local state ngay lập tức để UI phản hồi mượt mà
    setAdminBookings((prev) =>
      prev.map((b) =>
        b.code === transferBooking.code
          ? {
              ...b,
              court: targetCourt.name,
              courtCode: targetCourt.code,
              startH: newStartH,
              startM: newStartM,
              endH: newEndH,
              endM: newEndM,
              time: newTimeStr,
            }
          : b
      )
    );

    // 2. Ghi nhận điều chuyển lên Supabase
    try {
      await bookingApiService.transferCourt({
        code: transferBooking.code,
        targetCourtName: targetCourt.name,
        targetCourtCode: targetCourt.code,
        gioBatDau: `${transferStartTime}:00`,
        gioKetThuc: `${transferEndTime}:00`,
      });
    } catch (err) {
      console.warn('Lỗi đồng bộ điều chuyển sang Supabase:', err);
    } finally {
      setIsTransferring(false);
    }

    const origStartMin = (transferBooking.startH ?? 0) * 60 + (transferBooking.startM ?? 0);
    const isSameSlot = startMin === origStartMin;
    const summaryMsg = isSameSlot
      ? `Đã chuyển sân từ ${oldCourt} sang ${targetCourt.name} (${transferStartTime} - ${transferEndTime}).`
      : targetCourt.name === oldCourt
      ? `Đã đổi khung giờ cho ${oldCourt} sang ${transferStartTime} - ${transferEndTime}.`
      : `Đã chuyển sang ${targetCourt.name} khung giờ mới (${transferStartTime} - ${transferEndTime}).`;

    setTransferSuccessMsg(
      `${summaryMsg} Hệ thống đã cập nhật lịch và sẵn sàng thi đấu!`
    );

    setTimeout(() => {
      setTransferBooking(null);
      setSelectedTargetCourt(null);
      setTransferSuccessMsg(null);
      setSelectedBooking(null);
    }, 2200);
  };

  // Điều kiện kiểm tra Check-in
  const getCheckinValidation = (booking: BookingDetail | null) => {
    if (!booking) return { canCheckin: false, message: '' };

    if (booking.status === 'Đang sử dụng') {
      return { canCheckin: false, message: 'Lịch đặt sân này đã Check-in rồi (Đang sử dụng).' };
    }
    if (booking.status === 'ĐÃ HỦY' || booking.status === 'Đã hủy') {
      return { canCheckin: false, message: 'Lịch đặt sân này đã bị hủy, không thể Check-in!' };
    }
    if (booking.status === 'Đã kết thúc' || booking.status === 'Hoàn tất') {
      return { canCheckin: false, message: 'Lượt đặt sân này đã hoàn tất!' };
    }
    if (Number(booking.remaining.replace(/\D/g, '')) > 0) {
      return { canCheckin: false, message: `Chưa ghi nhận đủ tiền sân. Còn thiếu ${booking.remaining}; cần đối soát giao dịch VietQR trước khi check-in.` };
    }

    const bookingD = booking.bookingDate || calendarBookingDate(selectedDate);
    const todayStr = calendarBookingDate(currentTime);
    if (bookingD < todayStr) {
      return { canCheckin: false, message: 'Lịch đặt sân này thuộc ngày trong quá khứ, không thể Check-in!' };
    }
    if (bookingD > todayStr) {
      return { canCheckin: false, message: `Chưa đến ngày thi đấu (${bookingD}). Chỉ có thể Check-in vào đúng ngày thi đấu!` };
    }

    const nowMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    const startMin = (booking.startH ?? 0) * 60 + (booking.startM ?? 0);
    const endMin = (booking.endH ?? 0) * 60 + (booking.endM ?? 0);

    // Cho phép check-in sớm tối đa 30 phút
    if (nowMin < startMin - 30) {
      const waitMin = (startMin - 30) - nowMin;
      const openTime = `${Math.floor((startMin - 30) / 60).toString().padStart(2, '0')}:${((startMin - 30) % 60).toString().padStart(2, '0')}`;
      return {
        canCheckin: false,
        message: `Chưa đến giờ check-in! Hệ thống chỉ mở check-in sớm tối đa 30 phút trước giờ bắt đầu (từ ${openTime}). Còn ${formatWaitingTime(waitMin)} nữa.`
      };
    }

    // Nếu đã quá giờ kết thúc
    if (nowMin > endMin) {
      return {
        canCheckin: false,
        message: `Khung giờ thi đấu này đã kết thúc (${booking.time}), không thể thực hiện Check-in!`
      };
    }

    return { canCheckin: true, message: 'Đủ điều kiện Check-in vào sân' };
  };

  // Điều kiện kiểm tra Hủy đặt sân
  // Điều kiện kiểm tra Điều chuyển / Đổi sân
  const getTransferValidation = (booking: BookingDetail | null) => {
    if (!booking) return { canTransfer: false, message: '' };

    const statusNormalized = (booking.status || '').toUpperCase().trim();
    if (statusNormalized === 'ĐÃ HỦY' || statusNormalized === 'DA HUY' || statusNormalized === 'DA_HUY') {
      return { canTransfer: false, message: 'Lịch đặt sân này đã bị hủy trước đó!' };
    }
    if (
      statusNormalized === 'ĐÃ KẾT THÚC' ||
      statusNormalized === 'DA KET THUC' ||
      statusNormalized === 'DA_KET_THUC' ||
      statusNormalized === 'HOÀN TẤT' ||
      statusNormalized === 'HOAN TAT' ||
      statusNormalized === 'HOAN_TAT'
    ) {
      return { canTransfer: false, message: 'Lượt đặt sân này đã kết thúc, không thể đổi sân!' };
    }

    const bookingD = booking.bookingDate || calendarBookingDate(selectedDate);
    const startH = booking.startH ?? 0;
    const startM = booking.startM ?? 0;
    const bStart = startH * 60 + startM;
    const bEnd = (booking.endH ?? 0) * 60 + (booking.endM ?? 0);
    const dur = bEnd > bStart ? bEnd - bStart : 60;
    const [bYear, bMonth, bDay] = (bookingD || '').split('-').map(Number);
    if (!bYear || !bMonth || !bDay) {
      return { canTransfer: false, message: 'Không xác định được thời gian đặt sân!' };
    }
    const startDateTime = new Date(bYear, bMonth - 1, bDay, startH, startM, 0).getTime();
    const endDateTime = new Date(bYear, bMonth - 1, bDay, Math.floor((bStart + dur) / 60), (bStart + dur) % 60, 0).getTime();
    const nowTime = currentTime.getTime();

    // Nếu trạng thái là 'Đã đặt' mà đã qua giờ bắt đầu -> lịch quá khứ, không thể đổi sân
    if (statusNormalized === 'ĐÃ ĐẶT' || statusNormalized === 'DA DAT' || statusNormalized === 'DA_DAT') {
      if (nowTime >= startDateTime) {
        return {
          canTransfer: false,
          message: 'Lịch đặt sân đã quá giờ thi đấu trong quá khứ, không thể đổi sân!',
        };
      }
    }

    // Nếu trạng thái là 'Đang sử dụng' mà đã quá giờ kết thúc -> không thể đổi sân, chỉ trả sân
    if (statusNormalized === 'ĐANG SỬ DỤNG' || statusNormalized === 'DANG SU DUNG' || statusNormalized === 'DANG_SU_DUNG') {
      if (nowTime >= endDateTime) {
        return {
          canTransfer: false,
          message: 'Ca thi đấu đã kết thúc, vui lòng thực hiện Trả sân thay vì Đổi sân!',
        };
      }
    }

    return { canTransfer: true, message: '' };
  };

  const getCancelValidation = (booking: BookingDetail | null) => {
    if (!booking) return { canCancel: false, message: '', isEligibleRefund: false };

    const statusNormalized = (booking.status || '').toUpperCase().trim();
    if (statusNormalized === 'ĐÃ HỦY' || statusNormalized === 'DA HUY' || statusNormalized === 'DA_HUY') {
      return { canCancel: false, message: 'Lịch đặt sân này đã bị hủy trước đó!', isEligibleRefund: false };
    }
    if (statusNormalized === 'ĐANG SỬ DỤNG' || statusNormalized === 'DANG SU DUNG' || statusNormalized === 'DANG_SU_DUNG') {
      return { canCancel: false, message: 'Sân đang có khách thi đấu, không thể hủy! Vui lòng chọn Đổi sân hoặc Kết thúc / Trả sân.', isEligibleRefund: false };
    }
    if (
      statusNormalized === 'ĐÃ KẾT THÚC' ||
      statusNormalized === 'DA KET THUC' ||
      statusNormalized === 'DA_KET_THUC' ||
      statusNormalized === 'HOÀN TẤT' ||
      statusNormalized === 'HOAN TAT' ||
      statusNormalized === 'HOAN_TAT'
    ) {
      return { canCancel: false, message: 'Lượt đặt sân này đã kết thúc trong quá khứ, không thể hủy!', isEligibleRefund: false };
    }

    const bookingD = booking.bookingDate || calendarBookingDate(selectedDate);
    const startH = booking.startH ?? 0;
    const startM = booking.startM ?? 0;
    const [bYear, bMonth, bDay] = (bookingD || '').split('-').map(Number);
    if (!bYear || !bMonth || !bDay) {
      return { canCancel: false, message: 'Không xác định được thời gian đặt sân!', isEligibleRefund: false };
    }
    const startDateTime = new Date(bYear, bMonth - 1, bDay, startH, startM, 0).getTime();
    const nowTime = currentTime.getTime();

    if (nowTime >= startDateTime) {
      return {
        canCancel: false,
        message: 'Lịch đặt sân đã bắt đầu hoặc đã qua giờ thi đấu trong quá khứ, không thể hủy!',
        isEligibleRefund: false,
      };
    }

    const diffHours = (startDateTime - nowTime) / (1000 * 60 * 60);
    const isEligibleRefund = diffHours >= 24;

    return {
      canCancel: true,
      message: isEligibleRefund ? 'Hủy trước 24h: Đủ điều kiện hoàn tiền 100%' : 'Hủy dưới 24h: Không được hoàn tiền',
      isEligibleRefund,
      diffHours,
    };
  };

  const openBooking = (booking: BookingDetail) => {
    setSelectedBooking(booking);
  };

  const openCheckinDetail = (booking: BookingDetail) => {
    setCheckinError('');
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
    const checkinStart=(checkinBooking.startH||0)*60+(checkinBooking.startM||0);
    const checkinEnd=(checkinBooking.endH||0)*60+(checkinBooking.endM||0);
    const checkinDuration=checkinEnd-checkinStart;
    const startAt=new Date(`${checkinBooking.bookingDate||calendarBookingDate(selectedDate)}T${checkinBooking.time.slice(0,5)}:00+07:00`);
    const minutesToStart=Math.ceil((startAt.getTime()-Date.now())/60000);
    const paymentOutstanding=Number(checkinBooking.remaining.replace(/\D/g,''))>0;
    const hasRecordedPayment=Number(checkinBooking.paidAmount.replace(/\D/g,''))>0;

    return (
      <div className="no-scrollbar flex-1 min-h-0 overflow-y-auto bg-white px-3 py-3">
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
            <p className="text-[12px] font-black text-slate-800">{minutesToStart>0?<>Bắt đầu sau <span className="text-red-600">{formatWaitingTime(minutesToStart)}</span></>:'Đã đến giờ sử dụng sân'}</p>
            <p className="text-[10px] font-medium text-slate-400">Giờ bắt đầu: {checkinBooking.time.slice(0,5)}</p>
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
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-black/15">Khách đặt sân</span>
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
                {checkinBooking.court} <span className="text-emerald-500">•</span>
              </p>
              <p className="text-[10px] font-medium text-slate-400">{checkinBooking.sport}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const bDate = checkinBooking.bookingDate || calendarBookingDate(selectedDate);
              const info = getBookingDateDetails(bDate);
              return (
                <div className="rounded-lg bg-white p-2.5 ring-1 ring-black/15">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">Ngày thi đấu</p>
                  <p className="mt-1 text-[13px] font-black text-slate-900">{info.dayOfWeek}</p>
                  <p className="text-[10px] font-medium text-emerald-700">{info.fullDate || bDate}</p>
                </div>
              );
            })()}
            <div className="rounded-lg bg-white p-2.5 ring-1 ring-black/15">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">Khung giờ</p>
              <p className="mt-1 text-[13px] font-black text-slate-900">{checkinBooking.time}</p>
              <p className="text-[10px] font-medium text-slate-400">{checkinDuration} phút</p>
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
              <span className="text-[11px] font-medium leading-snug text-slate-500">Tổng tiền sân ({checkinDuration} phút)</span>
              <span className="shrink-0 text-[13px] font-black text-slate-900">{checkinBooking.total}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className={`h-2 w-2 rounded-full ${hasRecordedPayment?'bg-emerald-500':'bg-amber-500'}`} />
                {hasRecordedPayment?'Đã ghi nhận qua VietQR':'Chưa ghi nhận thanh toán'}
              </span>
              <span className={`text-[13px] font-black ${hasRecordedPayment?'text-emerald-800':'text-slate-500'}`}>{hasRecordedPayment?'-':''}{checkinBooking.paidAmount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-2.5 py-2 ring-1 ring-black/15">
              <span className="text-[12px] font-black text-slate-700">Tiền sân chưa ghi nhận</span>
              <span className={`text-[14px] font-black ${paymentOutstanding?'text-red-600':'text-slate-900'}`}>{checkinBooking.remaining}</span>
            </div>
          </div>
        </section>

        {/* Banner kiểm tra điều kiện Check-in */}
        {(() => {
          const val = getCheckinValidation(checkinBooking);
          if (!val.canCheckin) {
            return (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900 shadow-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-black text-amber-950 uppercase text-[11px]">Chưa đủ điều kiện Check-in</p>
                  <p className="font-medium text-amber-900 text-[11px]">{val.message}</p>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Action buttons */}
        {checkinError && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{checkinError}</p>}
        {(() => {
          const cancelVal = getCancelValidation(checkinBooking);
          const checkinVal = getCheckinValidation(checkinBooking);
          const canCancel = cancelVal.canCancel;
          return (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={checkinSaving || !checkinVal.canCheckin}
                onClick={async () => {
                  if (checkinSaving || !checkinVal.canCheckin) return;
                  setCheckinSaving(true);
                  setCheckinError('');
                  try {
                    await bookingApiService.checkIn(checkinBooking.code, checkinBooking.bookingDate || calendarBookingDate(selectedDate));
                    await refreshSharedBookings();
                    window.dispatchEvent(new Event('courtx:facility-changed'));
                    setCheckinBooking(null);
                    onCheckoutModeChange?.(false);
                  } catch (error) {
                    setCheckinError(error instanceof Error ? error.message : 'Chưa check-in được.');
                  } finally {
                    setCheckinSaving(false);
                  }
                }}
                className={`flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl px-3 text-[11px] font-black shadow-sm transition ${
                  checkinVal.canCheckin
                    ? 'bg-emerald-700 text-white hover:bg-emerald-800 active:scale-[0.98] cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{checkinSaving ? 'Đang lưu...' : 'Check-In Sân'}</span>
              </button>
              {canCancel ? (
                <button
                  type="button"
                  onClick={() => {
                    setCancelBooking(checkinBooking);
                    setCheckinBooking(null);
                    onCheckoutModeChange?.(true);
                  }}
                  className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-red-50 px-3 text-[11px] font-black text-red-700 ring-1 ring-red-200 transition hover:bg-red-100 active:scale-[0.98] cursor-pointer"
                >
                  <CircleX className="h-4 w-4 shrink-0" />
                  <span className="truncate">Hủy đặt sân</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  title={cancelVal.message || 'Lịch đặt trong quá khứ không thể hủy'}
                  className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-[11px] font-bold text-slate-400 ring-1 ring-slate-200 cursor-not-allowed"
                >
                  <CircleX className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">Hủy đặt sân</span>
                </button>
              )}
            </div>
          );
        })()}
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
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs hover:border-emerald-300 transition">
                  <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs">
                        {request.courtCode || request.court.replace(/^Sân\s*/i, '')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-black leading-tight text-slate-950">{request.court}</h3>
                        <p className="text-[11px] text-emerald-700 font-bold mt-0.5">#{request.code}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 text-amber-800 px-2 py-0.5 text-[10px] font-black border border-amber-200">
                      Chờ duyệt
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                        {request.customerName.trim().charAt(0)}
                      </div>
                      <span className="truncate font-bold text-slate-800 text-[11px]">{request.customerName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] font-bold text-slate-700">{request.time}</span>
                      <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 text-[10px] font-black">
                        {getBookingDateLabel(request.bookingDate)}
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

          <div className="rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200 space-y-2.5">
            {/* Sân & Mã đặt */}
            <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs">
                  {cancelReviewBooking.courtCode || cancelReviewBooking.court.replace(/^Sân\s*/i, '')}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-black leading-tight text-slate-950 flex items-center gap-1.5">
                    {cancelReviewBooking.court}
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </h3>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] font-bold">
                    <span className="text-emerald-700">#{cancelReviewBooking.code}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-slate-500 font-semibold">{cancelReviewBooking.sport || 'Sân tiêu chuẩn'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Khách hàng - Hàng ngang thoáng đãng */}
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-black text-emerald-800">
                  {cancelReviewBooking.customerName.trim().charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-slate-900">{cancelReviewBooking.customerName}</p>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                    {cancelReviewBooking.phone}
                  </p>
                </div>
              </div>
              <button type="button" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition">
                <Phone className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Ngày thi đấu & Khung giờ - 2 ô cân đối, không bao giờ rớt dòng */}
            <div className="grid grid-cols-2 gap-2">
              {(() => {
                const dateInfo = getBookingDateDetails(cancelReviewBooking.bookingDate);
                return (
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày thi đấu</p>
                    <p className="mt-1 text-[13px] font-black text-slate-900 truncate">{dateInfo.dayOfWeek}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{dateInfo.fullDate || cancelReviewBooking.bookingDate}</p>
                  </div>
                );
              })()}

              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Khung giờ</p>
                <p className="mt-1 text-[13px] font-black text-slate-900 whitespace-nowrap">{cancelReviewBooking.time}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">Thời gian thi đấu</p>
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

        {/* Cảnh báo nếu không thể hủy sân (đã sử dụng / đã qua giờ) */}
        {(() => {
          const val = getCancelValidation(cancelBooking);
          if (!val.canCancel) {
            return (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-900 shadow-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-black text-red-950 uppercase text-[11px]">Không thể hủy lịch này</p>
                  <p className="font-medium text-red-900 text-[11px]">{val.message}</p>
                </div>
              </div>
            );
          }
          return null; // Giữ 1 thông báo chi tiết kèm số tiền hoàn ở phía dưới để tránh trùng lặp
        })()}

        <section className="mb-3 rounded-2xl bg-white p-3.5 shadow-xs border border-slate-200 space-y-2.5">
          {/* Sân & Trạng thái */}
          <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs">
                {cancelBooking.courtCode || cancelBooking.court.replace(/^Sân\s*/i, '')}
              </div>
              <div className="min-w-0">
                <h2 className="text-[15px] font-black leading-tight text-slate-950 flex items-center gap-1.5">
                  {cancelBooking.court}
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{cancelBooking.sport}</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase text-blue-700 border border-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              Đã giữ sân
            </span>
          </div>

          {/* Khách hàng - Hàng ngang thoáng đãng */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[12px] font-black text-emerald-800">
                {cancelBooking.customerName.trim().charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-slate-900">{cancelBooking.customerName}</p>
                <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                  {cancelBooking.phone}
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
              Khách đặt sân
            </span>
          </div>

          {/* Ngày thi đấu & Khung giờ - 2 ô cân đối, không bao giờ rớt dòng */}
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const bDate = cancelBooking.bookingDate || calendarBookingDate(selectedDate);
              const dateInfo = getBookingDateDetails(bDate);
              return (
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ngày thi đấu</p>
                  <p className="mt-1 text-[13px] font-black text-slate-900 truncate">{dateInfo.dayOfWeek}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">{dateInfo.fullDate || bDate}</p>
                </div>
              );
            })()}

            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Khung giờ</p>
              <p className="mt-1 text-[13px] font-black text-slate-900 whitespace-nowrap">{cancelBooking.time}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Thời gian thi đấu</p>
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
          const val = getCancelValidation(cancelBooking);
          if (!val.canCancel) {
            return (
              <section className="mb-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="mb-3 flex items-start gap-3 rounded-lg bg-red-50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-black text-red-950">Không thể hủy lịch đặt này</h3>
                    <p className="mt-1 text-[12px] font-medium leading-relaxed text-red-700">
                      {val.message || 'Lịch đặt sân trong quá khứ hoặc đang sử dụng không thể hủy.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-200 text-[14px] font-black text-slate-400 cursor-not-allowed"
                >
                  <Ban className="h-5 w-5" />
                  Không thể hủy sân
                </button>
              </section>
            );
          }
          const isEligible24h = val.isEligibleRefund;
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
                  // Đồng bộ hủy đơn và hoàn tiền lên Supabase Online
                  bookingApiService.cancelBooking({
                    code: booked.code,
                    isEligible: true,
                    reason: 'Admin xác nhận hủy sân trước >= 24h (Tự động hoàn tiền 100%)',
                    customerPhone: booked.phone,
                    customerName: booked.customerName,
                    refundAmount: parseInt(booked.total.replace(/\D/g, '') || '0', 10),
                  }).catch((err) => console.warn('Supabase cancel booking warning:', err));

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
                    Theo quy định của sân, lịch đặt hủy trong vòng dưới 24 giờ sẽ <strong>không được hoàn tiền (0 VND)</strong>. Thao tác này chỉ giải phóng sân cho khách khác đặt.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const booked = cancelBooking;
                  // Đồng bộ hủy đơn (không hoàn tiền) lên Supabase Online
                  bookingApiService.cancelBooking({
                    code: booked.code,
                    isEligible: false,
                    reason: 'Admin xác nhận hủy sân dưới 24h (Không hoàn tiền)',
                    customerPhone: booked.phone,
                    customerName: booked.customerName,
                    refundAmount: 0,
                  }).catch((err) => console.warn('Supabase cancel booking warning:', err));

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
        void refreshSharedBookings();
        setCheckoutBooking(null); onCheckoutModeChange?.(false);
      }} />;
  }

  return (
    <>
      <div className="flex-1 min-h-0 bg-slate-50 relative overflow-hidden flex flex-col">
        {bookingsState.loading&&<p className="p-3 text-xs text-slate-600">Đang tải lịch sân từ máy chủ...</p>}
        {bookingsState.error&&<p role="alert" className="bg-red-50 p-3 text-xs text-red-700">{bookingsState.error}<button onClick={()=>void refreshSharedBookings()} className="ml-2 underline">Thử lại</button></p>}
        {/* 1. TOP TOOLBAR & DATE CONTROLS */}
        <div className="bg-white border-b border-slate-200 p-2.5 space-y-2 shrink-0 shadow-xs relative z-[60]">
          
          {/* Ô TRA CỨU ĐẶT SÂN CHECK-IN (SĐT / MÃ ĐẶT SÂN) */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-emerald-600 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                placeholder="Tra cứu SĐT hoặc Mã đặt sân để check-in..."
                className="w-full h-9 pl-9 pr-8 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition placeholder:text-slate-400 placeholder:font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown kết quả tra cứu */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSearchFocused(false)}
                />
                <div className="absolute left-0 right-0 top-10.5 z-50 rounded-2xl bg-white p-2.5 shadow-2xl border border-slate-200 max-h-[360px] overflow-y-auto space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100 text-[11px] font-bold text-slate-500">
                  <span>Kết quả tra cứu ({filteredSearchResults.length})</span>
                  <button
                    type="button"
                    onClick={() => setIsSearchFocused(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    Đóng ✕
                  </button>
                </div>

                {filteredSearchResults.length === 0 ? (
                  <div className="py-5 text-center text-xs text-slate-500">
                    <Search className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    Không tìm thấy lịch đặt nào với từ khóa <strong className="text-slate-800 font-bold">"{searchQuery}"</strong>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredSearchResults.slice(0, 8).map((b) => {
                      const isTargetDate = b.bookingDate === calendarBookingDate(selectedDate);
                      const checkinVal = getCheckinValidation(b);
                      const isDone = b.status === 'Đã kết thúc' || b.status === 'Hoàn tất';
                      const isCancelled = b.status === 'Đã hủy' || b.status === 'DA_HUY';

                      return (
                        <div
                          key={b.code}
                          className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition group cursor-pointer"
                          onClick={() => handleSelectSearchResult(b, 'view')}
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[11px] font-extrabold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {b.code}
                              </span>
                              <span className="text-xs font-black text-slate-900 truncate">
                                {b.customerName}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {b.phone}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                              <span className="font-bold text-emerald-800">{b.court}</span>
                              <span>•</span>
                              <span className="font-bold text-slate-800">{b.time}</span>
                              <span>•</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isTargetDate ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                                {b.bookingDate || 'Hôm nay'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {b.status === 'Đã đặt' && (
                              <button
                                type="button"
                                disabled={!checkinVal.canCheckin}
                                onClick={() => handleSelectSearchResult(b, 'checkin')}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black shadow-xs transition active:scale-95 cursor-pointer ${
                                  checkinVal.canCheckin
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                                title={checkinVal.message || 'Check-in sân ngay'}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Check-in</span>
                              </button>
                            )}
                            {b.status === 'Đang sử dụng' && (
                              <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Đang dùng
                              </span>
                            )}
                            {isDone && (
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-slate-100 text-slate-500">
                                Hoàn tất
                              </span>
                            )}
                            {isCancelled && (
                              <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-red-100 text-red-700">
                                Đã hủy
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              </>
            )}
          </div>

          {/* Date Picker Bar */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1.5 border border-slate-200 relative">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrevDay(); }} 
              className="w-7 h-7 flex items-center justify-center rounded-lg shadow-xs z-20 transition text-slate-500 bg-white active:scale-95 cursor-pointer hover:bg-slate-50"
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

          {/* Sport Filter Tabs & Add Sport/Court Button */}
          <div className="flex items-center gap-2 pt-0.5 pb-0.5">
            {/* Dải nút bộ môn cuộn ngang với min-w-0 */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0 py-0.5">
              <button
                type="button"
                onClick={() => setCourtView('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  courtView === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả {adminCourts.length} sân
              </button>
              {adminSports.map((sp) => {
                const sportCourtsCount = adminCourts.filter((c) => c.sportId === sp.id).length;
                const isSelected = courtView === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => setCourtView(sp.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{sp.icon}</span>
                    <span>{sp.name} ({sportCourtsCount} sân)</span>
                  </button>
                );
              })}
            </div>

            {/* Nút Thêm Sân & Bộ Môn GẮN CỨNG cố định bên phải (không bị chạy khi cuộn) */}
            <div className="shrink-0 pl-1 border-l border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddSportCourtModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-black shadow-xs shadow-emerald-700/30 transition cursor-pointer whitespace-nowrap"
                title="Thêm sân mới hoặc tạo bộ môn mới"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Thêm sân / Bộ môn</span>
              </button>
            </div>
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
              {cancelledBookings.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCancelledListModal(true)}
                  className="flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[9px] font-black border border-red-200 hover:bg-red-100 transition cursor-pointer"
                  title="Nhấn để xem danh sách các đơn đã hủy trong ngày"
                >
                  <XCircle className="w-3 h-3" /> Đã hủy ({cancelledBookings.length})
                </button>
              )}
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
                      const courtBookings = adminBookings.filter((b) => b.courtCode === court.code && b.status !== 'Đã hủy' && b.status !== 'DA_HUY');

                      return (
                        <div
                          key={court.id}
                          style={{ height: `${rowHeight}px` }}
                          className="flex relative border-b border-slate-200/60"
                        >
                          {/* Background Time Slot Cells */}
                          {timelineTimes.map((time) => {
                            const cellStart = parseTimeToMinutes(time);
                            if(isPastDate(selectedDate,currentTime))return <div key={time} style={{width:`${slotWidth}px`}} className="shrink-0 border-r border-slate-200/50 bg-slate-100/50" title={`${court.name}: Ngày đã qua, chỉ xem lịch sử`}/>;
                            
                            const curDateStr = calendarBookingDate(selectedDate);

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

                              const secondHalfTime = `${time.slice(0, 2)}:30`;
                              const heldFirst = courtHoldService.isSlotHeldByAnother(court.name, curDateStr, time, 30, adminPaymentSessionId);
                              const heldSecond = courtHoldService.isSlotHeldByAnother(court.name, curDateStr, secondHalfTime, 30, adminPaymentSessionId);
                              const heldFull = courtHoldService.isSlotHeldByAnother(court.name, curDateStr, time, 60, adminPaymentSessionId);

                              if (bFirst && !bSecond) {
                                // First 30 mins occupied, second 30 mins
                                if (heldSecond) {
                                  return (
                                    <div key={time} style={{ width: `${slotWidth}px` }} className="shrink-0 flex border-r border-slate-200/50">
                                      <div style={{ width: `${slotWidth / 2}px` }} className="h-full bg-slate-100/70 flex items-center justify-center border-r border-slate-200/40 select-none">
                                        <span className="h-2 w-px bg-slate-200" />
                                      </div>
                                      <div 
                                        style={{ width: `${slotWidth / 2}px` }} 
                                        onClick={() => showAlert('Khung giờ đang được tạm giữ!', `Khung giờ ${secondHalfTime} trên ${court.name} đang có khách khác tạm giữ thanh toán!\n\nVui lòng chọn khung giờ khác hoặc chờ hết thời gian giữ sân.`, 'warning')}
                                        className="h-full bg-amber-100/90 hover:bg-amber-200 flex flex-col items-center justify-center text-center p-0.5 select-none transition cursor-pointer"
                                        title={`${court.name}: Khung giờ ${secondHalfTime} đang có khách tạm giữ`}
                                      >
                                        <span className="text-[8px] font-black text-amber-900 leading-none">🔒 Giữ</span>
                                      </div>
                                    </div>
                                  );
                                }
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
                                // First 30 mins, second 30 mins occupied
                                if (heldFirst) {
                                  return (
                                    <div key={time} style={{ width: `${slotWidth}px` }} className="shrink-0 flex border-r border-slate-200/50">
                                      <div 
                                        style={{ width: `${slotWidth / 2}px` }} 
                                        onClick={() => showAlert('Khung giờ đang được tạm giữ!', `Khung giờ ${time} trên ${court.name} đang có khách khác tạm giữ thanh toán!\n\nVui lòng chọn khung giờ khác hoặc chờ hết thời gian giữ sân.`, 'warning')}
                                        className="h-full bg-amber-100/90 hover:bg-amber-200 flex flex-col items-center justify-center text-center p-0.5 select-none transition cursor-pointer border-r border-amber-300"
                                        title={`${court.name}: Khung giờ ${time} đang có khách tạm giữ`}
                                      >
                                        <span className="text-[8px] font-black text-amber-900 leading-none">🔒 Giữ</span>
                                      </div>
                                      <div style={{ width: `${slotWidth / 2}px` }} className="h-full bg-slate-100/70 flex items-center justify-center select-none">
                                        <span className="h-2 w-px bg-slate-200" />
                                      </div>
                                    </div>
                                  );
                                }
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

                              // Cả 60 phút không có booking: Kiểm tra xem có đang bị tạm giữ không
                              if (heldFull || heldFirst || heldSecond) {
                                const holdObj = heldFull || heldFirst || heldSecond;
                                return (
                                  <div
                                    key={time}
                                    style={{ width: `${slotWidth}px` }}
                                    onClick={() => {
                                      showAlert('Khung giờ đang có người thanh toán!', `Khung giờ ${time} trên ${court.name} đang được một khách hàng khác tạm giữ thanh toán!\n\nHệ thống đang chờ khách hoàn tất thanh toán VietQR. Vui lòng chọn khung giờ khác hoặc chờ hết thời gian giữ sân.`, 'warning');
                                    }}
                                    className="shrink-0 border-r border-amber-300 bg-amber-100/90 hover:bg-amber-200 flex flex-col items-center justify-center text-center p-1 select-none transition cursor-pointer"
                                    title={`${court.name}: Khung giờ ${time} đang có người thực hiện thanh toán VietQR`}
                                  >
                                    <span className="text-[8.5px] font-black text-amber-950 uppercase leading-none bg-amber-200 px-1 py-0.5 rounded border border-amber-300 shadow-2xs flex items-center gap-0.5">
                                      🔒 ĐANG GIỮ
                                    </span>
                                    <span className="text-[7px] font-bold text-amber-800 leading-tight mt-0.5 truncate max-w-full px-0.5 text-center">
                                      {holdObj?.customerName ? holdObj.customerName.slice(0, 8) : 'Đang thanh toán'}
                                    </span>
                                  </div>
                                );
                              }

                              // Nếu ngày là Hôm nay và giờ này đã qua -> ẩn chữ TRỐNG, không cho bấm
                              const currentNowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                              const isPastSlot60 = isToday(selectedDate) && (cellStart + 60 <= currentNowMins);

                              if (isPastSlot60) {
                                return (
                                  <div
                                    key={time}
                                    style={{ width: `${slotWidth}px` }}
                                    className="shrink-0 border-r border-slate-200/50 bg-slate-100/50 flex items-center justify-center select-none cursor-default"
                                    title={`${court.name}: Khung giờ ${time} đã qua`}
                                  >
                                    <span className="h-2 w-px bg-slate-200" />
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

                              const held30 = courtHoldService.isSlotHeldByAnother(court.name, curDateStr, time, 30, adminPaymentSessionId);
                              if (held30) {
                                return (
                                  <div
                                    key={time}
                                    style={{ width: `${slotWidth}px` }}
                                    onClick={() => {
                                      showAlert('Khung giờ đang được tạm giữ!', `Khung giờ ${time} trên ${court.name} đang được khách khác tạm giữ thanh toán!\n\nHệ thống đang chờ khách hoàn tất quét mã VietQR (trong 10 phút). Vui lòng chọn khung giờ khác hoặc chờ hết thời gian giữ sân.`, 'warning');
                                    }}
                                    className="shrink-0 border-r border-amber-300 bg-amber-100/90 hover:bg-amber-200 flex flex-col items-center justify-center text-center p-1 select-none transition cursor-pointer"
                                    title={`${court.name}: Khung giờ ${time} đang có khách tạm giữ thanh toán (trong 10 phút)!`}
                                  >
                                    <span className="text-[8.5px] font-black text-amber-950 uppercase leading-none bg-amber-200 px-1 py-0.5 rounded border border-amber-300">
                                      🔒 ĐANG GIỮ
                                    </span>
                                  </div>
                                );
                              }

                              // Nếu ngày là Hôm nay và giờ này đã qua -> ẩn chữ TRỐNG, không cho bấm
                              const currentNowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
                              const isPastSlot30 = isToday(selectedDate) && (cellStart + 30 <= currentNowMins);

                              if (isPastSlot30) {
                                return (
                                  <div
                                    key={time}
                                    style={{ width: `${slotWidth}px` }}
                                    className="shrink-0 border-r border-slate-200/50 bg-slate-100/50 flex items-center justify-center select-none cursor-default"
                                    title={`${court.name}: Khung giờ ${time} đã qua`}
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

                            const hasSearch = Boolean(searchQuery.trim());
                            const isSearchMatch = hasSearch && (
                              (b.code || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                              (b.customerName || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                              (searchQuery.trim().replace(/\D/g, '') && (b.phone || '').replace(/\D/g, '').includes(searchQuery.trim().replace(/\D/g, '')))
                            );

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
                                  className={`absolute z-10 rounded-xl bg-emerald-600 text-white px-2 py-1 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-all overflow-hidden border border-emerald-500 cursor-pointer ${
                                    isSearchMatch
                                      ? 'ring-3 ring-amber-400 ring-offset-2 z-30 shadow-xl scale-[1.02]'
                                      : hasSearch
                                      ? 'opacity-35 hover:opacity-100'
                                      : ''
                                  }`}
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

                            const completed=b.status==='Đã kết thúc'||b.status==='Hoàn tất';
                            return (
                              <button
                                type="button"
                                key={b.code}
                                onClick={() => openBooking(b)}
                                title={`${b.customerName} (${b.court}) • ${b.time} • ${b.status}`}
                                style={{
                                  left: `${left + 2}px`,
                                  width: `${width}px`,
                                  top: '4px',
                                  bottom: '4px',
                                }}
                                className={`absolute z-10 rounded-xl border px-2 py-1 flex flex-col justify-center text-left shadow-sm active:scale-[0.99] transition-all overflow-hidden cursor-pointer ${completed?'bg-slate-100 border-slate-300 hover:bg-slate-200':'bg-blue-50 border-blue-300 hover:bg-blue-100/90'} ${
                                    isSearchMatch
                                      ? 'ring-3 ring-amber-400 ring-offset-2 z-30 shadow-xl scale-[1.02]'
                                      : hasSearch
                                      ? 'opacity-35 hover:opacity-100'
                                      : ''
                                  }`}
                              >
                                <span className="text-[10px] font-black text-blue-950 truncate leading-tight">{b.customerName}</span>
                                <span className="text-[9px] font-bold text-blue-700 truncate leading-tight mt-0.5">
                                  {b.time}
                                </span>
                                {completed&&<span className="mt-0.5 truncate text-[8px] font-semibold text-slate-600">Đã check-out</span>}
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



      {/* Modal hiển thị danh sách đơn đã hủy trong ngày - Bounded strictly inside phone screen */}
      {showCancelledListModal && (
        <div
          className="absolute inset-0 z-[150] flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-3 animate-fade-in"
          onClick={() => setShowCancelledListModal(false)}
        >
          <div
            className="w-[calc(100%-1.5rem)] max-w-sm rounded-2xl sm:rounded-3xl bg-white p-3.5 sm:p-4 shadow-2xl ring-1 ring-slate-100 max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5 truncate">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
                    <XCircle className="h-4 w-4" />
                  </span>
                  <span>Danh sách đơn đã hủy ({cancelledBookings.length})</span>
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
                  Ngày {calendarBookingDate(selectedDate)} • Sân đã giải phóng để nhận khách mới
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelledListModal(false)}
                className="shrink-0 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition"
                aria-label="Đóng danh sách"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 my-2.5 pr-1 custom-scrollbar">
              {cancelledBookings.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                  Không có đơn đặt sân nào bị hủy trong ngày này.
                </div>
              ) : (
                cancelledBookings.map((b) => (
                  <div
                    key={b.code}
                    className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100/90 hover:bg-slate-100/70 transition space-y-2"
                  >
                    {/* Dòng 1: Mã đơn, Sân, Tag ĐÃ HỦY và Trạng thái thanh toán */}
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black text-slate-900">{b.code}</span>
                        <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">{b.court}</span>
                        <span className="rounded-md bg-red-100 text-red-700 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide">ĐÃ HỦY</span>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap ${
                        b.paymentStatus === 'Đã hoàn tiền' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {b.paymentStatus || 'Đã hủy'}
                      </span>
                    </div>

                    {/* Dòng 2: Thông tin khách hàng & Nút xem chi tiết */}
                    <div className="flex items-end justify-between gap-2 pt-1 border-t border-slate-200/50">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {b.customerName} • <span className="text-slate-500 font-normal">{b.phone}</span>
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
                          Khung giờ: <strong className="text-slate-700">{b.time}</strong> • Tổng: <strong className="text-emerald-700">{b.total}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowCancelledListModal(false);
                          setSelectedBooking(b);
                        }}
                        className="shrink-0 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-0.5 py-1 px-1.5 rounded-lg active:bg-emerald-50 transition"
                      >
                        <span>Xem chi tiết</span>
                        <span className="text-sm">→</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCancelledListModal(false)}
                className="w-full rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition text-center cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
                    <p className="text-[10px] font-semibold text-slate-600">Ngày thi đấu</p>
                    <p className="mt-1 text-[13px] font-black leading-snug text-emerald-800">
                      {(() => {
                        const bDate = selectedBooking.bookingDate || calendarBookingDate(selectedDate);
                        const info = getBookingDateDetails(bDate);
                        return `${info.dayOfWeek} (${info.fullDate || bDate})`;
                      })()}
                    </p>
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

              {(selectedBooking.checkInAt||selectedBooking.checkOutAt)&&<div className="space-y-1 rounded-xl border border-slate-200 px-3 py-2 text-[11px]">
                <div className="flex justify-between gap-2"><span className="text-slate-600">Check-in thực tế</span><strong>{selectedBooking.checkInAt?new Date(selectedBooking.checkInAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'Chưa check-in'}</strong></div>
                <div className="flex justify-between gap-2"><span className="text-slate-600">Check-out thực tế</span><strong>{selectedBooking.checkOutAt?new Date(selectedBooking.checkOutAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'}):'Chưa check-out'}</strong></div>
              </div>}
              {/* Action buttons */}
              <div className="space-y-2">
                {selectedBooking.status === 'Đã đặt' && (
                  (() => {
                    const cancelVal = getCancelValidation(selectedBooking);
                    const transferVal = getTransferValidation(selectedBooking);
                    const checkinVal = getCheckinValidation(selectedBooking);

                    return (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={!checkinVal.canCheckin}
                          onClick={() => openCheckinDetail(selectedBooking)}
                          className={`flex h-10 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-bold shadow-sm transition active:scale-[0.99] ${
                            checkinVal.canCheckin
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800 cursor-pointer'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Check-in sân</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          {transferVal.canTransfer ? (
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
                          ) : (
                            <button
                              type="button"
                              disabled
                              title={transferVal.message || 'Lịch đặt trong quá khứ không thể đổi sân'}
                              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2 text-[11px] font-bold text-slate-400 shadow-sm cursor-not-allowed"
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">Đổi sân</span>
                            </button>
                          )}
                          {cancelVal.canCancel ? (
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
                          ) : (
                            <button
                              type="button"
                              disabled
                              title={cancelVal.message || 'Lịch đặt trong quá khứ không thể hủy'}
                              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2 text-[11px] font-bold text-slate-400 shadow-sm cursor-not-allowed"
                            >
                              <Ban className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">Hủy đặt sân</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}

                {selectedBooking.status === 'Đang sử dụng' && (
                  (() => {
                    const transferVal = getTransferValidation(selectedBooking);
                    return (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutBooking(selectedBooking);
                            setSelectedBooking(null);
                            onCheckoutModeChange?.(true);
                          }}
                          className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99] cursor-pointer"
                        >
                          <Undo2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Kết thúc / Trả sân</span>
                        </button>
                        {transferVal.canTransfer ? (
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
                        ) : (
                          <button
                            type="button"
                            disabled
                            title={transferVal.message || 'Ca thi đấu đã kết thúc, không thể đổi sân'}
                            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2 text-[11px] font-bold text-slate-400 shadow-sm cursor-not-allowed"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">Đổi sân</span>
                          </button>
                        )}
                      </div>
                    );
                  })()
                )}

                {selectedBooking.status === 'Đã hủy' && (
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-medium text-slate-500">
                    Lượt đặt đã hủy. Không còn thao tác sân khả dụng.
                  </div>
                )}
              </div>

            </div>
          </section>
        </div>
      )}

      {bookingCourt && (
        <AdminBookingDialog
          court={bookingCourt}
          dateLabel={formatBookingDateVi(selectedDate)}
          startTime={bookingStartTime}
          endTime={bookingEndTime}
          duration={bookingDuration}
          startOptions={validStartTimeOptions}
          endOptions={bookingEndTimeOptions}
          durations={availableDurations}
          customerName={bookingCustomerName}
          customerPhone={bookingCustomerPhone}
          note={bookingNote}
          sendZalo={bookingSendZalo}
          errors={bookingErrors}
          conflict={adminBookingConflict}
          onStartChange={handleBookingStartTimeChange}
          onEndChange={handleBookingEndTimeChange}
          onDurationChange={handleBookingDurationChange}
          onNameChange={value => {
            setBookingCustomerName(value);
            if (bookingErrors.name) {
              const res = validateCustomerName(value);
              setBookingErrors(previous => ({ ...previous, name: res.isValid ? undefined : res.error }));
            }
          }}
          onPhoneChange={value => {
            setBookingCustomerPhone(value);
            if (bookingErrors.phone) {
              const res = validateCustomerPhone(value);
              setBookingErrors(previous => ({ ...previous, phone: res.isValid ? undefined : res.error }));
            }
          }}
          onNoteChange={setBookingNote}
          onSendZaloChange={setBookingSendZalo}
          onClose={() => setBookingCourt(null)}
          onSubmit={handleAdminBookingSubmit}
        />
      )}

      {/* 🟡 MODAL THANH TOÁN (PAYMENT BOTTOM SHEET) - CHUẨN THEO TOBE_CHAY.bpmn */}
      {showPaymentModal && pendingBookingData && (
        <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col items-center max-h-[94vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-4 sm:hidden"></div>
            
            {/* Trạng thái Tạm giữ sân */}
            {adminPaymentCountdown > 0 ? (
              <div className="w-full mb-3 flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 text-[11px] text-emerald-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang tạm giữ {pendingBookingData.court}
                </span>
                <span className="text-[10px] font-semibold flex items-center gap-1">
                  <span className="text-emerald-800">Tạm giữ ưu tiên:</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded transition ${
                    adminPaymentCountdown <= 20
                      ? 'bg-amber-100 text-amber-800 animate-pulse ring-1 ring-amber-300'
                      : 'bg-emerald-100/90 text-emerald-900'
                  }`}>
                    {Math.floor(adminPaymentCountdown / 60)}:{(adminPaymentCountdown % 60).toString().padStart(2, '0')}
                  </span>
                </span>
              </div>
            ) : (
              <div className="w-full mb-3 flex items-start gap-2.5 bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-[11px] text-amber-900 leading-tight animate-in fade-in">
                <Clock3 className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-amber-950">Hết thời gian ưu tiên giữ sân</p>
                    <span className="rounded bg-amber-200/80 px-1 py-0.2 text-[9px] font-black text-amber-900">VẪN THANH TOÁN ĐƯỢC</span>
                  </div>
                  <p className="text-[10px] text-amber-800 mt-1 font-medium">
                    Nếu có khách khác thanh toán trước, hệ thống sẽ ưu tiên khách thanh toán trước.
                  </p>
                </div>
              </div>
            )}

            {/* Thông báo nhắc nhở sau 20s (chỉ hiển thị khi còn trong thời gian giữ sân adminPaymentCountdown > 0) */}
            {adminPaymentNotification && adminPaymentCountdown > 0 && (
              <div className="w-full mb-3 rounded-xl bg-amber-500 text-white p-2.5 text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] leading-tight">{adminPaymentNotification}</span>
                </div>
                <button type="button" onClick={() => setAdminPaymentNotification(null)} className="text-white/80 hover:text-white ml-2 text-xs">✕</button>
              </div>
            )}

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">THANH TOÁN ĐƠN HÀNG</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3 text-center">Quét mã VietQR bằng ứng dụng ngân hàng</p>

            {/* Trường hợp lỗi kỹ thuật thanh toán (Boundary Error Event Event_02s9rdl -> Activity_1mjvkbj) */}
            {adminPaymentTechnicalError ? (
              <div className="w-full space-y-4 my-2 animate-in fade-in">
                <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-center space-y-2">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-black text-red-950 uppercase tracking-wide">Thông báo lỗi kỹ thuật thanh toán</h4>
                  <p className="text-[11px] text-red-700 leading-relaxed font-medium">
                    {adminPaymentTechnicalError}
                  </p>
                </div>

                {/* Exclusive Gateway Gateway_1ukmj3e: Thanh toán lại ? */}
                <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-700">Khách có muốn thanh toán lại không?</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRetryAdminPayment}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Thanh toán lại
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAfterAdminPaymentError}
                    className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-4 relative overflow-hidden text-center">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-extrabold text-slate-900 text-sm">MB BANK</p>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">VIETQR</span>
                  </div>
                  
                  <QrCodeArtwork className="mx-auto h-36 w-36" value={adminMobilePaymentUrl} />
                  <div className="mt-2 text-center">
                    <p className="text-[11px] font-bold text-slate-700">📱 Lấy điện thoại quét mã QR để chuyển tiền</p>
                    <a
                      href={adminLocalSimulatorUrl || adminMobilePaymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      (Hoặc bấm vào đây để mở trang giả lập điện thoại)
                    </a>
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <p className="text-slate-500">Số tiền thanh toán:</p>
                    <p className="text-2xl font-black text-emerald-600">{pendingBookingData.total.replace(' ', '')}</p>
                    <p className="text-slate-500 mt-1.5">Nội dung chuyển khoản:</p>
                    <p className="font-mono font-bold text-slate-900 bg-white py-1 rounded border border-slate-200 uppercase text-xs">
                      CX {pendingBookingData.court.replace(/ /g, '').toUpperCase()} {pendingBookingData.phone.replace(/[\s.-]/g, '')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center gap-2.5 w-full">
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-5 w-5 rounded-full bg-emerald-500 items-center justify-center">
                      <span className="h-1.5 w-1.5 bg-white rounded-full"></span>
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-700 text-center">
                    Đang chờ ghi nhận thanh toán qua VietQR…
                  </p>
                </div>

                {bookingSaveError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-2.5 text-xs text-red-700">{bookingSaveError}</p>}
                
                <div className="w-full mt-3">
                  <button
                    type="button"
                    onClick={handleCancelPayment}
                    className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95 transition"
                  >
                    Hủy giao dịch
                  </button>
                </div>


              </>
            )}
          </div>
        </div>
      )}

      {/* 🔴 EVENT SUB-PROCESS: KHÁCH XÁC NHẬN THOÁT KHỎI QUÁ TRÌNH THANH TOÁN ĐẶT SÂN (Activity_1clhmdn) */}
      {showAdminCancelSubprocessModal && pendingBookingData && (
        <div className="fixed inset-0 z-[170] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-amber-300 bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col items-center justify-center text-center border-b border-slate-100 pb-3 gap-2">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">Xác nhận hủy thanh toán</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Hủy yêu cầu đặt sân</p>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50/70 p-3.5 text-sm font-semibold text-amber-900 border border-amber-200/70 text-center">
              Bạn xác nhận muốn hủy không?
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAdminCancelSubprocessModal(false)}
                className="rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
              >
                Tiếp tục thanh toán
              </button>
              <button
                type="button"
                onClick={handleExecuteAdminCancelSubprocess}
                className="rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition cursor-pointer"
              >
                Xác nhận hủy
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
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mã thanh toán: <span className="font-mono font-bold text-blue-700">{paymentSuccessBooking.paymentCode || paymentSuccessBooking.code.replace('DS', 'TT')}</span>
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
              Số điện thoại liên hệ cho lượt đặt: <strong className="text-slate-900">{paymentSuccessBooking.phone}</strong>.
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
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDownloadAdminReceipt}
                  className="rounded-lg p-1 text-slate-400 hover:bg-emerald-100 hover:text-emerald-700 cursor-pointer transition"
                  aria-label="Tải xuống biên nhận"
                  title="Tải ảnh biên nhận (.png)"
                >
                  <Download className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceipt(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition"
                  aria-label="Đóng biên nhận"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Chi tiết biên nhận */}
            <div className="space-y-2 rounded-2xl bg-slate-50/90 p-3.5 border border-slate-200/80 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã biên nhận (Vé):</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">#{paymentSuccessBooking.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã thanh toán:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{paymentSuccessBooking.paymentCode || paymentSuccessBooking.code.replace('DS', 'TT')}</span>
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
                onClick={handlePrintAdminReceipt}
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
      {/* 🟢 MODAL ĐIỀU CHUYỂN SÂN & ĐỔI KHUNG GIỜ THI ĐẤU */}
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
                    Điều chuyển sân & Khung giờ
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Đổi sân thi đấu hoặc dời khung giờ linh hoạt theo yêu cầu
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
                <span className="text-slate-500">Sân hiện tại:</span>
                <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{transferBooking.court} ({transferBooking.sport})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngày thi đấu:</span>
                <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {(() => {
                    const bDate = transferBooking.bookingDate || calendarBookingDate(selectedDate);
                    const info = getBookingDateDetails(bDate);
                    return `${info.dayOfWeek} (${info.fullDate || bDate})`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Khung giờ gốc:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{transferBooking.time}</span>
              </div>
            </div>

            {/* Chọn khung giờ thi đấu mới */}
            <div className="space-y-1.5 rounded-2xl bg-amber-50/40 p-3 border border-amber-200/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-amber-700" />
                  Khung giờ thi đấu:
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 bg-white text-amber-800">
                  Thời lượng: {transferDurationMinutes} phút
                </span>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex-1">
                  <select
                    value={transferStartTime}
                    onChange={(e) => {
                      setTransferStartTime(e.target.value);
                      setSelectedTargetCourt(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 focus:border-amber-500 focus:outline-none shadow-sm cursor-pointer"
                  >
                    {transferStartTimeOptions.map((timeStr) => {
                      const origStartStr = `${(transferBooking.startH ?? 0).toString().padStart(2, '0')}:${(transferBooking.startM ?? 0).toString().padStart(2, '0')}`;
                      const isOrig = timeStr === origStartStr;
                      return (
                        <option key={timeStr} value={timeStr}>
                          {timeStr} {isOrig ? '★ (Giờ ban đầu)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 px-3 py-2 bg-white rounded-xl border border-amber-200 text-xs shadow-sm">
                  <span className="text-slate-500 text-[11px]">Đến:</span>
                  <span className="font-extrabold text-amber-900">{transferEndTime}</span>
                </div>
              </div>

              {transferStartTime !== `${(transferBooking.startH ?? 0).toString().padStart(2, '0')}:${(transferBooking.startM ?? 0).toString().padStart(2, '0')}` ? (
                <p className="text-[10.5px] text-amber-800 font-semibold flex items-center gap-1 pt-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  Đang chọn dời sang khung giờ mới: {transferStartTime} – {transferEndTime}
                </p>
              ) : (
                <p className="text-[10.5px] text-slate-500 font-medium pt-0.5">
                  Giữ nguyên khung giờ ban đầu ({transferBooking.time})
                </p>
              )}
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
                <option value="Khách hàng yêu cầu đổi sân / đổi giờ">Khách hàng yêu cầu đổi sân / đổi giờ</option>
                <option value="Sân hiện tại gặp sự cố kỹ thuật / bảo trì">Sân hiện tại gặp sự cố kỹ thuật / bảo trì</option>
                <option value="Hỏng bóng đèn / rách lưới cần sửa gấp">Hỏng đèn / rách lưới cần sửa gấp</option>
                <option value="Điều phối mặt sân nội bộ">Điều phối mặt sàn nội bộ</option>
              </select>
            </div>

            {/* Danh sách sân cùng bộ môn khả dụng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Chọn sân chuyển đến:
                </label>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {candidateCourtsForTransfer.filter(c => !c.isOccupied).length} sân trống ({transferStartTime} - {transferEndTime})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto p-1">
                {candidateCourtsForTransfer.map((court) => {
                  const isSelected = selectedTargetCourt?.id === court.id;
                  return (
                    <button
                      key={court.id}
                      type="button"
                      disabled={court.isOccupied}
                      onClick={() => setSelectedTargetCourt(court)}
                      className={`relative flex flex-col p-3 rounded-2xl border-2 text-left transition-all outline-none ${
                        court.isOccupied
                          ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed z-0'
                          : isSelected
                          ? 'border-amber-500 bg-amber-50/90 shadow-sm z-10'
                          : 'border-slate-200 bg-white hover:border-amber-400 hover:bg-amber-50/20 active:scale-[0.98] cursor-pointer z-0'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900">{court.name}</span>
                        {court.isLocked ? (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">Bảo trì</span>
                        ) : court.isOccupied ? (
                          <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Đã kín</span>
                        ) : (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Khả dụng</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-500">{court.priceLabel}</span>
                        {court.isCurrentCourt && (
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded">Sân hiện tại</span>
                        )}
                      </div>
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
                disabled={!selectedTargetCourt || candidateCourtsForTransfer.find(c => c.id === selectedTargetCourt.id)?.isOccupied || isTransferring || !getTransferValidation(transferBooking).canTransfer}
                onClick={() => selectedTargetCourt && handleConfirmTransfer(selectedTargetCourt)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs text-white transition shadow-sm flex items-center justify-center gap-1.5 ${
                  !selectedTargetCourt || candidateCourtsForTransfer.find(c => c.id === selectedTargetCourt.id)?.isOccupied || isTransferring
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 active:scale-95 cursor-pointer'
                }`}
              >
                {isTransferring ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : selectedTargetCourt ? (
                  <span>Đổi sang {selectedTargetCourt.name} ({transferStartTime} - {transferEndTime})</span>
                ) : (
                  <span>Chọn sân để chuyển</span>
                )}
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

      {/* 🟣 CUSTOM POPUP MODAL THAY THẾ WINDOW.ALERT MẶC ĐỊNH */}
      {schedulePopup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            {schedulePopup.type === 'danger' ? (
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <CircleX className="w-6 h-6 stroke-[2.2]" />
              </div>
            ) : schedulePopup.type === 'success' ? (
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
            )}

            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
              {schedulePopup.title}
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-line">
              {schedulePopup.message}
            </p>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setSchedulePopup(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white shadow-sm active:scale-95 transition cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast thông báo nhẹ nhàng ở góc màn hình khi thêm sân / bộ môn (không giật màn hình, không mở modal đè) */}
      {addSuccessToast && (
        <div className="fixed top-5 right-5 z-[400] flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-800 text-white shadow-2xl border border-emerald-600/50 text-xs font-bold animate-in slide-in-from-top-3 fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          <span>{addSuccessToast}</span>
          <button
            type="button"
            onClick={() => setAddSuccessToast(null)}
            className="ml-2 text-emerald-300 hover:text-white cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal Thêm Sân & Bộ Môn cho Chủ */}
      <AdminAddSportAndCourtModal
        isOpen={showAddSportCourtModal}
        onClose={() => setShowAddSportCourtModal(false)}
        onSuccess={(msg, sportId) => {
          setAddSuccessToast(msg);
          if (sportId) setCourtView(sportId);
        }}
      />
    </>
  );
}
