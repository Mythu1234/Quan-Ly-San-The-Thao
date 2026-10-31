import { useMemo, useRef, useState, useEffect } from 'react';
import { 
  AlertTriangle, ArrowLeft, BadgeCheck, Ban, Calendar, CalendarCheck, CalendarClock, 
  CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleX, ClipboardList, 
  Clock3, Cloud, CreditCard, FileText, Info, LayoutGrid, MapPin, Phone, 
  QrCode, ReceiptText, Send, ShieldCheck, Undo2, UserRound, X, Zap 
} from 'lucide-react';
import QrCodeArtwork from '../components/QrCodeArtwork';

export type BookingDetail = {
  code: string;
  customerName: string;
  phone: string;
  court: string;
  courtCode?: string;
  sport: string;
  sportId?: 'badminton' | 'volleyball' | 'football';
  time: string;
  startH?: number;
  startM?: number;
  endH?: number;
  endM?: number;
  paymentStatus: string;
  total: string;
  paidAmount: string;
  remaining: string;
  status: string;
};

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

export const INITIAL_ADMIN_BOOKINGS: BookingDetail[] = [
  // Cầu lông
  {
    code: 'BK-8491',
    customerName: 'Tuấn Hưng',
    phone: '0903.882.112',
    court: 'Sân CL-01',
    courtCode: 'CL-01',
    sport: 'Cầu lông',
    sportId: 'badminton',
    startH: 6,
    startM: 0,
    endH: 7,
    endM: 30,
    time: '06:00 - 07:30',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '180.000 VND',
    paidAmount: '180.000 VND',
    remaining: '0 VND',
    status: 'Đang sử dụng',
  },
  {
    code: 'BK-9023',
    customerName: 'Quang Thắng',
    phone: '0912.441.902',
    court: 'Sân CL-05',
    courtCode: 'CL-05',
    sport: 'Cầu lông',
    sportId: 'badminton',
    startH: 7,
    startM: 0,
    endH: 8,
    endM: 30,
    time: '07:00 - 08:30',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '210.000 VND',
    paidAmount: '210.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-6184',
    customerName: 'Ngọc Mai',
    phone: '0908.224.118',
    court: 'Sân CL-02',
    courtCode: 'CL-02',
    sport: 'Cầu lông',
    sportId: 'badminton',
    startH: 8,
    startM: 0,
    endH: 9,
    endM: 30,
    time: '08:00 - 09:30',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '180.000 VND',
    paidAmount: '180.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-7740',
    customerName: 'Minh Trí',
    phone: '0912.440.526',
    court: 'Sân CL-03',
    courtCode: 'CL-03',
    sport: 'Cầu lông',
    sportId: 'badminton',
    startH: 14,
    startM: 0,
    endH: 15,
    endM: 30,
    time: '14:00 - 15:30',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '210.000 VND',
    paidAmount: '210.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-5521',
    customerName: 'Thành Long',
    phone: '0938.991.223',
    court: 'Sân CL-04',
    courtCode: 'CL-04',
    sport: 'Cầu lông',
    sportId: 'badminton',
    startH: 19,
    startM: 0,
    endH: 21,
    endM: 0,
    time: '19:00 - 21:00',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '240.000 VND',
    paidAmount: '240.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },

  // Bóng chuyền
  {
    code: 'BK-BC01',
    customerName: 'CLB Vigor Volley',
    phone: '0944.332.991',
    court: 'Sân BC-01',
    courtCode: 'BC-01',
    sport: 'Bóng chuyền',
    sportId: 'volleyball',
    startH: 8,
    startM: 0,
    endH: 10,
    endM: 0,
    time: '08:00 - 10:00',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '300.000 VND',
    paidAmount: '300.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-BC02',
    customerName: 'Hồng Quân',
    phone: '0978.552.114',
    court: 'Sân BC-02',
    courtCode: 'BC-02',
    sport: 'Bóng chuyền',
    sportId: 'volleyball',
    startH: 15,
    startM: 0,
    endH: 17,
    endM: 0,
    time: '15:00 - 17:00',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '300.000 VND',
    paidAmount: '300.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-BC03',
    customerName: 'Đội Trẻ Quận 7',
    phone: '0901.884.221',
    court: 'Sân BC-03',
    courtCode: 'BC-03',
    sport: 'Bóng chuyền',
    sportId: 'volleyball',
    startH: 18,
    startM: 0,
    endH: 20,
    endM: 0,
    time: '18:00 - 20:00',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '300.000 VND',
    paidAmount: '300.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-BC05',
    customerName: 'Hoàng Nam',
    phone: '0907.331.882',
    court: 'Sân BC-05',
    courtCode: 'BC-05',
    sport: 'Bóng chuyền',
    sportId: 'volleyball',
    startH: 19,
    startM: 0,
    endH: 21,
    endM: 0,
    time: '19:00 - 21:00',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '300.000 VND',
    paidAmount: '300.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },

  // Bóng đá mini
  {
    code: 'BK-BD01',
    customerName: 'Văn Hoàng',
    phone: '0981.332.909',
    court: 'Sân BD-01',
    courtCode: 'BD-01',
    sport: 'Bóng đá mini',
    sportId: 'football',
    startH: 6,
    startM: 0,
    endH: 7,
    endM: 30,
    time: '06:00 - 07:30',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '300.000 VND',
    paidAmount: '300.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-BD02',
    customerName: 'Bảo Long FC',
    phone: '0933.118.822',
    court: 'Sân BD-02',
    courtCode: 'BD-02',
    sport: 'Bóng đá mini',
    sportId: 'football',
    startH: 18,
    startM: 0,
    endH: 20,
    endM: 0,
    time: '18:00 - 20:00',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '400.000 VND',
    paidAmount: '400.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-BD03',
    customerName: 'Huy Khánh',
    phone: '0909.112.443',
    court: 'Sân BD-03',
    courtCode: 'BD-03',
    sport: 'Bóng đá mini',
    sportId: 'football',
    startH: 19,
    startM: 0,
    endH: 21,
    endM: 0,
    time: '19:00 - 21:00',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '400.000 VND',
    paidAmount: '400.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
  {
    code: 'BK-BD04',
    customerName: 'Anh Em FC',
    phone: '0918.554.331',
    court: 'Sân BD-04',
    courtCode: 'BD-04',
    sport: 'Bóng đá mini',
    sportId: 'football',
    startH: 17,
    startM: 30,
    endH: 19,
    endM: 0,
    time: '17:30 - 19:00',
    paymentStatus: 'Đã thanh toán đủ qua VietQR',
    total: '300.000 VND',
    paidAmount: '300.000 VND',
    remaining: '0 VND',
    status: 'Đã đặt',
  },
];

type AdminSchedulePageProps = {
  onCheckoutModeChange?: (isCheckoutMode: boolean) => void;
  onBookingCheckout?: (court: string, time?: string) => void;
};

export default function AdminSchedulePage({ onCheckoutModeChange, onBookingCheckout }: AdminSchedulePageProps) {
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

  // Date & Calendar State (Default to today: 30/10/2026)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 9, 30));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(2026, 9, 1));
  const [intervalMode, setIntervalMode] = useState<30 | 60>(60);
  const [courtView, setCourtView] = useState<'all' | 'badminton' | 'volleyball' | 'football'>('all');

  // Active Admin Bookings State
  const [adminBookings, setAdminBookings] = useState<BookingDetail[]>(() => INITIAL_ADMIN_BOOKINGS);

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

  // Operating timeline times: 05:00 to 22:00
  const timelineTimes = useMemo(() => {
    const result: string[] = [];
    for (let h = startHour; h <= endHour; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
      if (intervalMode === 30 && h < endHour) {
        result.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }
    return result;
  }, [intervalMode, startHour, endHour]);

  // Filtered Courts
  const displayedCourts = useMemo(() => {
    if (courtView === 'all') return STANDARD_ADMIN_COURTS;
    return STANDARD_ADMIN_COURTS.filter((c) => c.sportId === courtView);
  }, [courtView]);

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

  // Auto scroll to 08:00
  useEffect(() => {
    if (timelineScrollRef.current) {
      const offset = (8 - startHour) * (intervalMode === 30 ? slotWidth * 2 : slotWidth);
      timelineScrollRef.current.scrollLeft = Math.max(0, offset - 20);
    }
  }, [intervalMode, slotWidth]);

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
    return d.getDate() === 30 && d.getMonth() === 9 && d.getFullYear() === 2026;
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
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-3 py-3">
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
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Chi tiết lượt đặt</p>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-black tracking-tight text-slate-900">#{checkinBooking.code}</h2>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-500 ring-1 ring-blue-100">
              Đã đặt chỗ
            </span>
          </div>
        </div>

        {/* Countdown banner */}
        <section className="mb-2 flex items-center gap-2.5 rounded-xl bg-indigo-50 p-3 ring-1 ring-indigo-100">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-400">
            <Clock3 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-black text-slate-800">Bắt đầu sau <span className="text-red-500">35 phút nữa</span></p>
            <p className="text-[10px] font-medium text-slate-400">Sẵn sàng nhận khách lúc 17:50</p>
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
        </section>

        {/* Customer info */}
        <section className="mb-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <UserRound className="h-3 w-3" />
              Khách hàng
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Standard Member</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[17px] font-black text-indigo-600">
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
          <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5">
            <Clock3 className="h-3 w-3 shrink-0 text-amber-500" />
            <p className="text-[10px] font-medium text-slate-500">Đã chơi 14 trận • Không có vi phạm hủy muộn</p>
          </div>
        </section>

        {/* Court & Time */}
        <section className="mb-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <MapPin className="h-3 w-3" />
              Sân & Thời gian
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200">{checkinBooking.sport}</span>
          </div>
          <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-[14px] font-black text-white">
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
            <div className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ngày thi đấu</p>
              <p className="mt-1 text-[13px] font-black text-slate-900">Hôm nay</p>
              <p className="text-[10px] font-medium text-slate-400">15/10/2026</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Khung giờ</p>
              <p className="mt-1 text-[13px] font-black text-slate-900">{checkinBooking.time}</p>
              <p className="text-[10px] font-medium text-slate-400">90 phút</p>
            </div>
          </div>
        </section>

        {/* Finance */}
        <section className="mb-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <CreditCard className="h-3 w-3" />
              Tài chính & Thanh toán
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">VietQR • 100%</span>
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
              <span className="text-[13px] font-black text-emerald-600">-{checkinBooking.paidAmount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
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
              setCheckinBooking(null);
              onCheckoutModeChange?.(false);
            }}
            className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[11px] font-black text-white shadow-md active:scale-[0.98]"
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
            className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-3 text-[11px] font-black text-white shadow-sm active:scale-[0.98]"
          >
            <CircleX className="h-4 w-4 shrink-0" />
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
            <p>Nghiệp vụ hoàn tiền khoản đã chuyển khoản hoặc thanh toán chênh lệch được thực hiện riêng biệt tại sổ quỹ quầy giao dịch, không xử lý hay hiển thị số dư tại giao diện điều phối sân này.</p>
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
    const equipmentDamage = 45_000; // Khoản bồi thường thiết bị hư hỏng (0 nếu không có)
    const bookingBalance = Number(checkoutBooking.remaining.replace(/\D/g, ''));
    const amountDue = bookingBalance + equipmentDamage;
    const amountDueStr = `${amountDue.toLocaleString('vi-VN')} VND`;
    const hasExtraCharge = amountDue > 0;

    return (
      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-3 py-3">
        {/* Back button */}
        <button
          type="button"
          onClick={() => {
            setCheckoutBooking(null);
            onCheckoutModeChange?.(false);
          }}
          className="mb-3 flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:text-slate-700 active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại lịch sân
        </button>

        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              <FileText className="h-3 w-3 text-amber-500" />
              {checkoutBooking.court}
            </p>
            <h2 className="text-[17px] font-black tracking-tight text-slate-900">Quyết toán Check-Out</h2>
          </div>
          <span className="mt-0.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-200">
            {checkoutBooking.code}
          </span>
        </div>

        {/* Customer info */}
        <section className="mb-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-black text-slate-900">{checkoutBooking.customerName}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-600 ring-1 ring-amber-100">Hội viên VIP</span>
                <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Phone className="h-3 w-3 shrink-0" />
                  {checkoutBooking.phone}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5 border-t border-slate-50 pt-2.5">
            <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center text-[9px] font-semibold text-slate-500 ring-1 ring-slate-100">Khách thân thiết</div>
            <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-center text-[9px] font-semibold text-slate-500 ring-1 ring-slate-100">12 lượt/tháng</div>
            <div className="rounded-lg bg-orange-50 px-2 py-1.5 text-center text-[9px] font-black text-orange-600 ring-1 ring-orange-100">Đang sử dụng</div>
          </div>
        </section>

        {/* Time section */}
        <section className="mb-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Clock3 className="h-3 w-3 text-emerald-500" />
              Thời gian sử dụng
            </div>
            <span className="text-[10px] font-medium text-slate-400">Thứ 7, 24/10/2026</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Check-in thực</p>
              <p className="mt-1 text-[15px] font-black text-slate-900">08:02</p>
              <p className="text-[9px] font-medium text-slate-400">Sớm 8 phút</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 ring-1 ring-slate-100">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Hạn lịch đặt</p>
              <p className="mt-1 text-[15px] font-black text-slate-900">09:30</p>
              <p className="text-[9px] font-medium text-slate-400">90 phút</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2.5 ring-1 ring-emerald-100">
              <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">Check-out</p>
              <p className="mt-1 text-[15px] font-black text-emerald-700">09:38</p>
              <p className="text-[9px] font-medium text-slate-400">Trả sân</p>
            </div>
          </div>
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 ring-1 ring-slate-100">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
            <p className="text-[10px] font-medium text-slate-500">
              Khách đã thanh toán đủ 100% trước. Không tính phụ phí thêm giờ — muốn đá tiếp vui lòng đặt sân mới.
            </p>
          </div>
        </section>

        {/* Payment breakdown */}
        <section className="mb-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <FileText className="h-3 w-3 text-blue-400" />
            Bảng kê thanh toán & quyết toán
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500">Tiền sân theo lịch đặt (1.5h)</span>
              <span className="text-[13px] font-black text-slate-900">{checkoutBooking.total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Đã thanh toán 100% qua VietQR
              </span>
              <span className="text-[13px] font-black text-emerald-600">-{checkoutBooking.paidAmount}</span>
            </div>

            {/* Bồi thường thiết bị — chỉ hiện khi có phát sinh */}
            {equipmentDamage > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-red-50 px-2.5 py-1.5 ring-1 ring-red-100">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Bồi thường thiết bị hư hỏng
                </span>
                <span className="text-[13px] font-black text-red-600">+{equipmentDamage.toLocaleString('vi-VN')} VND</span>
              </div>
            )}

            {/* Tổng kết */}
            {hasExtraCharge ? (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-slate-700">Số tiền cần thu thêm</p>
                  <p className="text-[9px] font-semibold text-orange-500">Bồi thường thiết bị theo bảng giá</p>
                </div>
                <p className="text-[22px] font-black text-red-600">{amountDueStr}</p>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2.5 ring-1 ring-emerald-100">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">Thanh toán hoàn tất</p>
                  <p className="text-[9px] font-medium text-slate-500">Khách đã thanh toán đủ 100% — không có khoản phát sinh</p>
                </div>
                <p className="text-[17px] font-black text-emerald-600">0 VND</p>
              </div>
            )}
          </div>
        </section>

        {/* Incident notes */}
        <section className="mb-2 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Ghi nhận sự cố & thiết bị phát sinh
            </div>
            <button type="button" className="text-[10px] font-black text-emerald-600">Thêm ghi chú</button>
          </div>
          <label className="text-[10px] font-semibold text-slate-500">Mô tả tình trạng hiện trường trả sân:</label>
          <textarea
            className="mt-1.5 h-16 w-full resize-none rounded-lg bg-slate-50 p-2.5 text-[12px] outline-none ring-1 ring-slate-100 placeholder:text-slate-300"
            placeholder="Ví dụ: Hỏng lưới, gãy cán vợt thuê, mượn bóng chưa trả..."
          />

        </section>

        {/* Payment method — chỉ hiện khi có khoản cần thu thêm */}
        {hasExtraCharge && (
          <section className="mb-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Thu tiền bồi thường qua VietQR</div>
            <div className="flex flex-col items-center gap-1.5">
              <img
                src="/images/QR.png"
                alt="Mã VietQR thanh toán"
                className="w-48 rounded-2xl"
              />
              <div className="text-center">
                <p className="text-[12px] font-black text-slate-900">TRINH THI MY THU</p>
                <p className="text-[10px] font-medium text-slate-500">5125 3918 888</p>
                <p className="mt-1 text-[10px] font-medium text-slate-400">
                  Nội dung: CK {checkoutBooking.code.replace('BK-', '')} {amountDue.toLocaleString('vi-VN').replace(/\D/g, '')}K
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Confirm button */}
        <button
          type="button"
          onClick={() => {
            onBookingCheckout?.(checkoutBooking.court, checkoutBooking.time);
            setCheckoutBooking(null);
            onCheckoutModeChange?.(false);
          }}
          className="mb-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[12px] font-black text-white shadow-md active:scale-[0.99] cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Xác nhận Check-out</span>
        </button>
      </div>
    );
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
                    setSelectedDate(new Date(2026, 9, 30));
                    setIsDatePickerOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer text-[11px]"
                >
                  Hôm nay (30/10)
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

            <div className="space-y-2 bg-slate-50 px-3 py-2.5">
              {/* Info grid */}
              <div className="rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Khách hàng</p>
                    <p className="mt-0.5 text-[12px] font-black text-slate-900">{selectedBooking.customerName}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Số điện thoại</p>
                    <p className="mt-0.5 text-[12px] font-black text-emerald-600">{selectedBooking.phone}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Sân & Bộ môn</p>
                    <p className="mt-0.5 text-[12px] font-black text-slate-900">{selectedBooking.court}</p>
                    <p className="text-[9px] font-medium text-slate-400">{selectedBooking.sport}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Khung thời gian</p>
                    <p className="mt-0.5 text-[12px] font-black text-slate-900">{selectedBooking.time}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Trạng thái Thanh toán</p>
                    <p className="mt-0.5 text-[11px] font-black text-emerald-600">{selectedBooking.paymentStatus}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">Tổng tiền</p>
                    <p className="mt-0.5 text-[12px] font-black text-slate-900">{selectedBooking.total}</p>
                  </div>
                </div>
              </div>

              {/* Payment summary */}
              <div className="rounded-lg border border-slate-100 bg-white px-2.5 py-2 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 pb-1.5">
                  <span className="text-[10px] font-medium text-slate-500">Đã thanh toán qua VietQR</span>
                  <span className="text-[12px] font-black text-emerald-600">{selectedBooking.paidAmount}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-[10px] font-bold text-red-500">Còn lại cần thu khi nhận sân</span>
                  <span className="text-[12px] font-black text-red-500">{selectedBooking.remaining}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2">
                {selectedBooking.status === 'Đã đặt' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openCheckinDetail(selectedBooking)}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2 text-[11px] font-black text-white shadow-sm transition active:scale-[0.99]"
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
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-2 text-[11px] font-black text-white shadow-sm transition active:scale-[0.99]"
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
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-2 text-[11px] font-black text-white shadow-sm transition active:scale-[0.99]"
                    >
                      <Undo2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Kết thúc / Trả sân</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCancelBooking(selectedBooking);
                        setSelectedBooking(null);
                        onCheckoutModeChange?.(true);
                      }}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-2 text-[11px] font-black text-white shadow-sm transition active:scale-[0.99]"
                    >
                      <Ban className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Hủy đặt sân</span>
                    </button>
                  </div>
                )}

                {selectedBooking.status === 'Đã hủy' && (
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-medium text-slate-500">
                    Lượt đặt đã hủy. Không còn thao tác sân khả dụng.
                  </div>
                )}
              </div>

              {(selectedBooking.status === 'Đã đặt' || selectedBooking.status === 'Đang sử dụng') && (
                <div className="flex items-start gap-1.5 px-0.5 text-[9px] italic leading-relaxed text-slate-400">
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
                <p className="mt-2 text-[10px] text-slate-500">Mã QR minh họa, chưa dùng để chuyển khoản thật.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-2">
              <div className="relative flex h-10 w-10 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-6 w-6 rounded-full bg-emerald-500 items-center justify-center">
                  <span className="h-2 w-2 bg-white rounded-full"></span>
                </span>
              </div>
              <p className="text-xs font-bold text-emerald-600">Đang lắng nghe giao dịch...</p>
              <p className="text-[10px] text-slate-400">Tự động xác nhận khi có biến động số dư</p>
            </div>

            <div className="w-full mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCancelPayment}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95"
              >
                Hủy giao dịch
              </button>
              <button
                type="button"
                onClick={handleConfirmPaymentSuccess}
                className="rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer active:scale-95"
              >
                Mô phỏng Đã CK
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

            <button
              type="button"
              onClick={handleFinishBooking}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-600/30 active:scale-95 transition cursor-pointer"
            >
              HOÀN TẤT & XEM LỊCH SÂN
            </button>
          </div>
        </div>
      )}
    </>
  );
}
