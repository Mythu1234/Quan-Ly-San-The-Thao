import AdminDashboard from './AdminDashboard';
import CustomerSchedule from '../components/CustomerSchedule';
import EmployeeDashboard from './employee/EmployeeDashboard';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, Clock, Play, Home, Calendar as CalendarIcon, X, Zap , User, Lock, Eye, Bell, Key, ArrowLeft, Sparkles, Award, CheckCircle2, Calculator, Trophy, Gift} from 'lucide-react';

// Custom SVG Icons matching Figma design
const ShuttlecockIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v6" />
    <path d="M6 8l6-6 6 6" />
    <path d="M4 14l4-6h8l4 6" />
    <circle cx="12" cy="18" r="3" />
  </svg>
);

const FootballIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 22v-4" />
    <path d="M12 6V2" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
  </svg>
);

const VolleyballIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20" />
    <path d="M2 12a14.5 14.5 0 0 0 20 0" />
    <path d="M4.93 4.93a14.5 14.5 0 0 1 14.14 14.14" />
  </svg>
);



export default function TrangChu() {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'booking' | 'lookup' | 'schedule'>('booking');

  // Booking Form State
  const [selectedSportId, setSelectedSportId] = useState<'badminton' | 'football' | 'volleyball'>('badminton');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  
  // Time Selection State
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // minutes
  
  // Customer Info State
  const [customerName, setCustomerName] = useState<string>('Nguyễn Văn An');
  const [customerPhone, setCustomerPhone] = useState<string>('0912345678');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [sendZalo, setSendZalo] = useState<boolean>(true);

  // Order Submission State
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [paymentPercent, setPaymentPercent] = useState<50 | 100>(100);
  const [showOTP, setShowOTP] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isEmployeeLoggedIn, setIsEmployeeLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<boolean>(false);
  const [otpAction, setOtpAction] = useState<'booking' | 'cancel'>('booking');
  const [popup, setPopup] = useState<any>(null);
  const showAlert = (title: string, message: string) => setPopup({ type: 'alert', title, message });
    const [orderCode, setOrderCode] = useState<string>('CX-88291');

  // Lookup Search State
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Section Refs for smooth scrolling
  const introRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const lookupRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: 'booking' | 'lookup' | 'schedule') => {
    setActiveTab(tab);
    if (tab === 'booking' && bookingRef.current) {
      bookingRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'lookup' && lookupRef.current) {
      lookupRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  const handleSelectSlotFromSchedule = (
    sportId: 'badminton' | 'volleyball' | 'football',
    courtName: string,
    time: string,
    dateStr: string
  ) => {
    setSelectedSportId(sportId);
    setSelectedStartTime(time);
    setSelectedCourt(courtName);
    if (dateStr) {
      setSelectedDate(dateStr);
    }
    handleTabChange('booking');
    setTimeout(() => {
      const summaryEl = document.getElementById('booking-summary-section');
      if (summaryEl) {
        summaryEl.scrollIntoView({ behavior: 'smooth' });
      } else if (bookingRef.current) {
        bookingRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  // Sports Data Definitions
  const sportsData = {
    badminton: {
      id: 'badminton',
      name: 'Cầu Lông',
      badge: 'CẦU LÔNG',
      tagline: 'THI ĐẤU QUỐC TẾ',
      title: 'Tổ hợp 6 sân Cầu Lông',
      description: 'Mặt thảm BWF tiêu chuẩn 4.5mm chống trượt, hệ thống đèn chiếu sáng chống chói Lux LED 1000+, trần cao 11m.',
      specs: ['MẶT THẢM BWF', 'CHỐNG CHÓI', 'CHUẨN 4.5MM'],
      pricePerHour: 120000,
      priceLabel: '120.000đ / GIỜ',
      image: '/images/badminton.jpg',
      icon: ShuttlecockIcon,
      courts: [],
    },
    football: {
      id: 'football',
      name: 'Bóng Đá',
      badge: 'BÓNG ĐÁ',
      tagline: 'SÂN CỎ NHÂN TẠO',
      title: 'Sân Bóng Đá Tiêu Chuẩn',
      description: 'Sân bóng đá cỏ nhân tạo đạt chuẩn, không gian rộng rãi. 8 sân cầu lông có thể gộp thành 1 sân bóng đá.',
      specs: ['SÂN 7 NGƯỜI', 'ĐÈN LUX 1000', 'CỎ NHÂN TẠO'],
      pricePerHour: 200000,
      priceLabel: '200.000đ / GIỜ',
      image: '/images/hero_arena.jpg',
      icon: FootballIcon,
      courts: [],
    },
    volleyball: {
      id: 'volleyball',
      name: 'Bóng Chuyền',
      badge: 'BÓNG CHUYỀN',
      tagline: 'TRONG NHÀ CAO CẤP',
      title: 'Sân Bóng Chuyền Tiêu Chuẩn',
      description: 'Sân bóng chuyền trong nhà mái che cao 12m, thảm thi đấu Taraflex xịn, quạt thông gió công nghiệp mát mẻ.',
      specs: ['THẢM TARAFLEX', 'MÁI CHE 12M', 'ĐÈN LUX 1000'],
      pricePerHour: 150000,
      priceLabel: '150.000đ / GIỜ',
      image: '/images/volleyball.jpg',
      icon: VolleyballIcon,
      courts: [],
    },
  };

  const currentSport = sportsData[selectedSportId];

  // --- VIP / LONG-TERM BOOKING STATE & CALCULATOR ---
  const [vipSport, setVipSport] = useState<'badminton' | 'volleyball' | 'football'>('badminton');
  const [vipSessionsPerWeek, setVipSessionsPerWeek] = useState<number>(3);
  const [vipHoursPerSession, setVipHoursPerSession] = useState<number>(2);
  const [vipMonths, setVipMonths] = useState<number>(6); // Range: 3 to 12 months (max 1 year)
  const [showVipModal, setShowVipModal] = useState<boolean>(false);
  const [vipCustomerName, setVipCustomerName] = useState<string>('');
  const [vipCustomerPhone, setVipCustomerPhone] = useState<string>('');
  const [vipPreferredSchedule, setVipPreferredSchedule] = useState<string>('');
  const [vipCustomerNote, setVipCustomerNote] = useState<string>('');

  // VIP Calculator formulas
  const vipHourlyRate = useMemo(() => {
    return sportsData[vipSport].pricePerHour;
  }, [vipSport]);

  const vipDiscountPercent = useMemo(() => {
    // 1 - 2 months: 0% (Gói Trải Nghiệm - Giữ cố định giờ chơi)
    // 3 - 6 months: 10% / hour (Hạng VIP)
    // > 6 months (7 - 12 months): 15% / hour (Hạng VIP Thượng Hạng)
    if (vipMonths < 3) return 0;
    return vipMonths <= 6 ? 10 : 15;
  }, [vipMonths]);

  const vipTotalWeeks = useMemo(() => {
    return vipMonths * 4;
  }, [vipMonths]);

  const vipTotalSessions = useMemo(() => {
    return vipSessionsPerWeek * vipTotalWeeks;
  }, [vipSessionsPerWeek, vipTotalWeeks]);

  const vipTotalHours = useMemo(() => {
    return vipTotalSessions * vipHoursPerSession;
  }, [vipTotalSessions, vipHoursPerSession]);

  const vipBasePrice = useMemo(() => {
    return vipTotalHours * vipHourlyRate;
  }, [vipTotalHours, vipHourlyRate]);

  const vipDiscountAmount = useMemo(() => {
    return Math.round((vipBasePrice * vipDiscountPercent) / 100);
  }, [vipBasePrice, vipDiscountPercent]);

  const vipFinalPrice = useMemo(() => {
    return vipBasePrice - vipDiscountAmount;
  }, [vipBasePrice, vipDiscountAmount]);

  const vipMonthlyAverage = useMemo(() => {
    return Math.round(vipFinalPrice / vipMonths);
  }, [vipFinalPrice, vipMonths]);

  const handleVipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vipCustomerName.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập Họ tên hoặc Tên CLB / Doanh nghiệp đại diện!');
      return;
    }
    if (!vipCustomerPhone.trim() || !/^[0-9]{9,11}$/.test(vipCustomerPhone.trim())) {
      showAlert('Số điện thoại không hợp lệ', 'Vui lòng nhập số điện thoại hợp lệ (9 - 11 chữ số) để nhân viên liên hệ xác nhận.');
      return;
    }

    setShowVipModal(false);
    showAlert(
      'Gửi yêu cầu VIP thành công! 🎉',
      `Cảm ơn Quý khách ${vipCustomerName}!\n\nYêu cầu thuê sân cố định ${vipMonths} tháng (${sportsData[vipSport].name}) đã được hệ thống tiếp nhận.\n\nBộ phận quản lý sẽ liên hệ SĐT ${vipCustomerPhone} trong vòng 15 phút để hoàn tất ký hợp đồng và xếp lịch giữ sân cố định tại quầy.`
    );

    // Reset inputs
    setVipCustomerName('');
    setVipCustomerPhone('');
    setVipPreferredSchedule('');
    setVipCustomerNote('');
  };

  // Tab switch between: 'vip_subscription' (Hội viên 3-12 tháng) and 'event_series' (Sự kiện & Chuỗi ngày 7-14 ngày)
  const [contractMode, setContractMode] = useState<'vip_subscription' | 'event_series'>('vip_subscription');

  // --- EVENT & MULTI-DAY SERIES STATE & CALCULATOR ---
  const [eventSport, setEventSport] = useState<'badminton' | 'volleyball' | 'football' | 'all_arena'>('badminton');
  const [eventCourtCount, setEventCourtCount] = useState<number>(2); // For badminton: 1, 2, 4, 6 courts
  const [eventDays, setEventDays] = useState<number>(7); // 7, 10, 14, 21, or custom slider 3 to 30 days
  const [eventTimeSlot, setEventTimeSlot] = useState<'morning' | 'afternoon' | 'evening' | 'fullday'>('morning');
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [eventOrgName, setEventOrgName] = useState<string>('');
  const [eventPhone, setEventPhone] = useState<string>('');
  const [eventStartDate, setEventStartDate] = useState<string>('');
  const [eventNotes, setEventNotes] = useState<string>('');

  // Event hours per day based on slot
  const eventHoursPerDay = useMemo(() => {
    if (eventTimeSlot === 'morning') return 3; // 08:00 - 11:00 (3h)
    if (eventTimeSlot === 'afternoon') return 3; // 14:00 - 17:00 (3h)
    if (eventTimeSlot === 'evening') return 3; // 18:00 - 21:00 (3h)
    return 8; // fullday: 08:00 - 17:00 (8h)
  }, [eventTimeSlot]);

  // Event hourly rate
  const eventHourlyRate = useMemo(() => {
    if (eventSport === 'badminton') return 120000 * eventCourtCount;
    if (eventSport === 'volleyball') return 150000;
    if (eventSport === 'football') return 200000;
    return 500000; // all_arena (Bao trọn toàn bộ 8 ô thi đấu)
  }, [eventSport, eventCourtCount]);

  const eventTotalHours = useMemo(() => {
    return eventDays * eventHoursPerDay;
  }, [eventDays, eventHoursPerDay]);

  const eventBasePrice = useMemo(() => {
    return eventTotalHours * eventHourlyRate;
  }, [eventTotalHours, eventHourlyRate]);

  // Discount rule for events:
  // Off-peak (morning / afternoon): 5% discount (hoặc 8% nếu >= 14 ngày)
  // Peak (evening): 0% discount, but receives full free logistics gift pack
  // Fullday: 10% discount on fullday package
  const eventDiscountPercent = useMemo(() => {
    if (eventTimeSlot === 'fullday') return 10;
    if (eventTimeSlot === 'morning' || eventTimeSlot === 'afternoon') {
      if (eventDays >= 21) return 10; // Đợt dài từ 3 tuần - 1 tháng
      return eventDays >= 14 ? 8 : 5;
    }
    return 0; // evening peak: full price + free perks
  }, [eventTimeSlot, eventDays]);

  const eventDiscountAmount = useMemo(() => {
    return Math.round((eventBasePrice * eventDiscountPercent) / 100);
  }, [eventBasePrice, eventDiscountPercent]);

  const eventFinalPrice = useMemo(() => {
    return eventBasePrice - eventDiscountAmount;
  }, [eventBasePrice, eventDiscountAmount]);

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventOrgName.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập Tên Đơn vị / CLB / Đại diện tổ chức sự kiện!');
      return;
    }
    if (!eventPhone.trim() || !/^[0-9]{9,11}$/.test(eventPhone.trim())) {
      showAlert('Số điện thoại không hợp lệ', 'Vui lòng nhập số điện thoại hợp lệ (9 - 11 chữ số) để điều phối viên liên hệ.');
      return;
    }

    setShowEventModal(false);
    showAlert(
      'Tiếp nhận yêu cầu sự kiện thành công! 🎪',
      `Cảm ơn Quý khách ${eventOrgName}!\n\nYêu cầu đặt chuỗi ngày / tổ chức giải (${eventDays} ngày, ${eventSport === 'all_arena' ? 'Bao trọn toàn sàn' : sportsData[eventSport as keyof typeof sportsData]?.name || 'Đa môn'}) đã được tiếp nhận.\n\nĐiều phối viên sự kiện sẽ liên hệ qua SĐT ${eventPhone} trong vòng 15 phút để kiểm tra lịch trống trên sàn và báo giá chi tiết.`
    );

    setEventOrgName('');
    setEventPhone('');
    setEventStartDate('');
    setEventNotes('');
  };

  // Dates list
  const availableDates = [
    { label: 'Hôm nay', date: '18/09' },
    { label: 'Thứ 6', date: '19/09' },
    { label: 'Thứ 7', date: '20/09' },
    { label: 'Chủ Nhật', date: '21/09' },
    { label: 'Thứ 2', date: '22/09' },
    { label: 'Thứ 3', date: '23/09' },
  ];

  // Logic for Time Generation (05:00 - 23:00)
  const generateStartTimes = () => {
    const times = [];
    for (let h = 5; h <= 22; h++) {
      for (let m of ['00', '30']) {
        times.push(`${h.toString().padStart(2, '0')}:${m}`);
      }
    }
    return times;
  };

  const getAvailableDurations = (startTimeStr: string) => {
    if (!startTimeStr) return [60];
    const [h, m] = startTimeStr.split(':').map(Number);
    const startVal = h + m / 60;
    const maxEndVal = 23; // close at 23:00
    const maxDurationHours = Math.max(1, maxEndVal - startVal);
    const durations = [];
    for (let d = 1; d <= maxDurationHours && d <= 5; d += 0.5) {
      durations.push(d * 60); // minutes
    }
    return durations.length > 0 ? durations : [60];
  };

  const mockScheduleBookings = useMemo(() => [
    { startH: 8, startM: 0, endH: 10, endM: 0, courtStart: 0, courtCount: 4, sport: 'volleyball' }, // Sân 01-04
    { startH: 9, startM: 0, endH: 10, endM: 30, courtStart: 5, courtCount: 1, sport: 'badminton' }, // Sân 06
    { startH: 14, startM: 0, endH: 16, endM: 0, courtStart: 0, courtCount: 4, sport: 'volleyball' }, // Sân 01-04
    { startH: 14, startM: 30, endH: 15, endM: 30, courtStart: 4, courtCount: 1, sport: 'badminton' }, // Sân 05
    { startH: 15, startM: 0, endH: 16, endM: 0, courtStart: 5, courtCount: 1, sport: 'badminton' }, // Sân 06
    { startH: 17, startM: 0, endH: 19, endM: 0, courtStart: 0, courtCount: 8, sport: 'football' }, // Sân 01-08
    { startH: 19, startM: 30, endH: 21, endM: 0, courtStart: 1, courtCount: 1, sport: 'badminton' }, // Sân 02
    { startH: 20, startM: 0, endH: 21, endM: 30, courtStart: 3, courtCount: 1, sport: 'badminton' }, // Sân 04
  ], []);

  const availableCourts = useMemo(() => {
    if (!selectedDate || !selectedStartTime) return [];
    const [h, m] = selectedStartTime.split(':').map(Number);
    const startMin = h * 60 + m;
    const endMin = startMin + selectedDuration;

    const isCourtOccupied = (courtIdx: number) => {
      return mockScheduleBookings.some((b) => {
        const bCourtEnd = b.courtStart + b.courtCount;
        if (courtIdx < b.courtStart || courtIdx >= bCourtEnd) return false;
        const bStart = b.startH * 60 + b.startM;
        const bEnd = b.endH * 60 + b.endM;
        return Math.max(startMin, bStart) < Math.min(endMin, bEnd);
      });
    };

    const courts: string[] = [];
    if (selectedSportId === 'football') {
      let isAllFree = true;
      for (let c = 0; c < 8; c++) {
        if (isCourtOccupied(c)) {
          isAllFree = false;
          break;
        }
      }
      if (isAllFree) courts.push('Sân Bóng Đá Mini');
    } else if (selectedSportId === 'volleyball') {
      let isC1Free = true;
      for (let c = 0; c <= 3; c++) {
        if (isCourtOccupied(c)) {
          isC1Free = false;
          break;
        }
      }
      if (isC1Free) courts.push('Sân Bóng Chuyền 1');

      let isC2Free = true;
      for (let c = 4; c <= 7; c++) {
        if (isCourtOccupied(c)) {
          isC2Free = false;
          break;
        }
      }
      if (isC2Free) courts.push('Sân Bóng Chuyền 2');
    } else {
      for (let i = 1; i <= 8; i++) {
        if (!isCourtOccupied(i - 1)) {
          courts.push('Sân ' + i.toString().padStart(2, '0'));
        }
      }
    }
    return courts;
  }, [selectedSportId, selectedDate, selectedStartTime, selectedDuration, mockScheduleBookings]);

  useEffect(() => {
    if (availableCourts.length > 0) {
      if (!availableCourts.includes(selectedCourt)) {
        setSelectedCourt(availableCourts[0]);
      }
    } else {
      setSelectedCourt('');
    }
  }, [availableCourts, selectedCourt]);

  const allStartTimes = generateStartTimes();
  const availableDurations = getAvailableDurations(selectedStartTime);

  const handleStartTimeSelect = (time: string) => {
    setSelectedStartTime(time);
    const validDurations = getAvailableDurations(time);
    if (!validDurations.includes(selectedDuration)) {
      setSelectedDuration(60); // default to 1 hour if current duration is invalid
    }
  };

  const getEndTime = (start: string, durationMins: number) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const totalMins = h * 60 + m + durationMins;
    const endH = Math.floor(totalMins / 60);
    const endM = totalMins % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  // Price Calculation
  const durationHours = selectedDuration / 60;
  const totalPrice = currentSport.pricePerHour * durationHours;
  const formattedPrice = totalPrice.toLocaleString('vi-VN') + 'đ';
  const selectedSlot = selectedStartTime ? `${selectedStartTime} - ${getEndTime(selectedStartTime, selectedDuration)}` : 'Chưa chọn giờ';

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      showAlert('Chưa chọn ngày', 'Vui lòng chọn ngày thi đấu ở Bước 2!');
      return;
    }
    if (!selectedStartTime) {
      showAlert('Chưa chọn giờ', 'Vui lòng chọn giờ bắt đầu ở Bước 3!');
      return;
    }
    if (!selectedCourt) {
      showAlert('Chưa chọn sân', 'Vui lòng chọn một sân khả dụng ở Bước 3!');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      showAlert('Thiếu thông tin', 'Vui lòng nhập đầy đủ Họ tên và Số điện thoại!');
      return;
    }
    setShowOTP(true);
    setOtpInput('');
    setOtpError(false);
  };

  const handleVerifyOTP = () => {
    if (otpInput === '123456') {
      setShowOTP(false);
      if (otpAction === 'booking') {
        setShowPayment(true);
      } else {
        showAlert('Đã gửi yêu cầu hoàn tiền', 'Hệ thống đã tiếp nhận yêu cầu hủy vé.\n\nVui lòng đợi xử lý trong vòng 24h và kiểm tra trạng thái hoàn tiền tại mục Tra cứu thông tin đặt sân.');
        setLookupResult((prev: any) => prev ? { ...prev, status: 'ĐÃ HỦY', paymentStatus: 'ĐANG XỬ LÝ HOÀN TIỀN' } : null);
      }
    } else {
      setOtpError(true);
    }
  };

  const simulatePaymentSuccess = () => {
    const randomCode = 'CX-' + Math.floor(10000 + Math.random() * 90000);
    setOrderCode(randomCode);
    setShowPayment(false);
    setIsSubmitted(true);
  };

  const handleLookupSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (!lookupQuery.trim()) {
      setLookupResult(null);
      return;
    }

    // Demo match
    if (lookupQuery.includes('0912') || lookupQuery.toLowerCase().includes('cx') || lookupQuery.includes('88291')) {
      setLookupResult({
        code: '#CX-88291',
        name: 'Nguyễn Văn An',
        phone: '0912345678',
        sport: 'Bóng Đá',
        court: 'Sân Bóng Đá 1',
        date: '28/09/2026',
        time: '18:00 - 19:30 (1.5 giờ)',
        total: '450.000đ',
        status: 'ĐÃ XÁC NHẬN',
        paymentStatus: 'Đã thanh toán qua VietQR',
        hoursUntilStart: 12,
        sportId: 'football'
      });
    } else {
      setLookupResult(null);
    }
  };

  
  const handleCancelTicket = (ticket: any) => {
    if (ticket.hoursUntilStart <= 24) {
      showAlert('Không thể hủy vé', 'Vé của bạn sắp đến giờ thi đấu (dưới 24h). Vui lòng liên hệ chủ sân để được hỗ trợ.\n\nHotline: 0912 345 678');
    } else {
      setOtpAction('cancel');
      setShowOTP(true);
      setOtpInput('');
      setOtpError(false);
    }
  };

  const handleRebook = (ticket: any) => {
    setSelectedSportId(ticket.sportId);
    handleTabChange('booking');
    showAlert('Đặt lại vé', 'Hệ thống đã chọn lại môn ' + ticket.sport + '. Vui lòng chọn ngày và giờ thi đấu mới!');
  };

  if (isAdminLoggedIn) {
    return <AdminDashboard onLogout={() => setIsAdminLoggedIn(false)} />;
  }

  if (isEmployeeLoggedIn) {
    return <EmployeeDashboard onLogout={() => setIsEmployeeLoggedIn(false)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* 🟢 TOP HEADER BAR (WHITE & GREEN) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <span className="text-xl font-black">C</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">COURT<span className="text-emerald-600">X</span></span>
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Nhà thi đấu đa năng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('lookup')}
              className="flex h-9 px-3 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600 active:scale-95"
            >
              <Search className='w-3.5 h-3.5' />
              <span>Tra cứu</span>
            </button>
            <button type="button" onClick={() => setShowLogin(true)} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-extrabold text-xs shadow-xs hover:bg-emerald-200 active:scale-95 transition cursor-pointer">
                <User className="w-4 h-4" strokeWidth={2.5} />
              </button>
          </div>
        </div>
      </header>

      {/* ⚪ MAIN LIGHT CONTENT */}
      {activeTab !== 'schedule' && (
<main className="flex-1 space-y-6 p-4 pb-28">

        {/* ======================================================== */}
        {/* 1. GIỚI THIỆU TỔ HỢP / HERO SECTION (WHITE & GREEN)      */}
        {/* ======================================================== */}
        <section ref={introRef} className="scroll-mt-16 space-y-4">
          
          {/* Top Tagline Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 shadow-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            THẾ HỆ SÂN ĐẤU MỚI
          </div>

          {/* Hero Headlines */}
          <div>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900">
              BỨT PHÁ GIỚI HẠN <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                THƯỢNG TRỊ MỌI MẶT SÂN
              </span>
            </h1>
            <p className="mt-2.5 text-xs leading-5 text-slate-600">
              Hệ thống sân đấu đạt tiêu chuẩn thi đấu quốc tế, chiếu sáng chuyên nghiệp Lux LED 1000+, mặt thảm tiêu chuẩn BWF & FIVB mang lại trải nghiệm đỉnh cao.
            </p>
          </div>

          {/* Hero Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleTabChange('booking')}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 hover:bg-emerald-600"
            >
              <Zap className='w-4 h-4' /> ĐẶT SÂN NGAY
            </button>
            <button
              type="button"
              onClick={() => showAlert('Trải nghiệm không gian', 'Đang mở video trải nghiệm Nhà Thi Đấu COURTX!')}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-800 shadow-xs transition active:scale-95 hover:bg-slate-50"
            >
              <Play className='w-4 h-4 fill-current' /> XEM VIDEO
            </button>
          </div>

          {/* Banner Photo Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
            <img
              src="/images/hero_arena.jpg"
              alt="COURTX Arena Overview"
              className="h-48 w-full object-cover transition duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="rounded-md bg-emerald-500/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md shadow">
                CHUẨN THI ĐẤU BWF & FIVB
              </span>
              <span className="text-[10px] font-bold text-white shadow">1000 Lux LED</span>
            </div>
          </div>

          {/* 3 Stats Counters Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ['03', 'MÔN ĐỈNH CAO'],
              ['100%', 'SÂN THI ĐẤU'],
              ['1000', 'LUX LED'],
            ].map(([val, lbl]) => (
              <div key={lbl} className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-xs">
                <p className="text-xl font-black text-emerald-600">{val}</p>
                <p className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">{lbl}</p>
              </div>
            ))}
          </div>
        </section>


        {/* ======================================================== */}
        {/* 2. MẶT BẰNG & CÁC MÔN THỂ THAO NỔI BẬT                  */}
        {/* ======================================================== */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                ● MẶT BẰNG & TRANG THIẾT BỊ
              </p>
              <h2 className="mt-0.5 text-xl font-black text-slate-900">TỔ HỢP 3 MÔN CHUẨN ĐẤU</h2>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('booking')}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              Xem tất cả →
            </button>
          </div>

          {/* Sports Showcase Cards */}
          <div className="space-y-4">
            {Object.values(sportsData).map((sport) => (
              <div
                key={sport.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:border-emerald-500 hover:shadow-md"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow">
                    {sport.badge}
                  </span>
                  <span className="absolute top-3 right-3 rounded-full bg-slate-900/70 backdrop-blur px-2.5 py-1 text-[9px] font-bold tracking-wider text-white">
                    {sport.tagline}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">{sport.title}</h3>
                    <p className="mt-1 text-xs leading-4 text-slate-600">{sport.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {sport.specs.map((spec) => (
                      <span key={spec} className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Giá từ</p>
                      <p className="text-sm font-black text-emerald-600">{sport.priceLabel}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSportId(sport.id as any);
                        handleTabChange('booking');
                      }}
                      className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
                    >
                      Đặt ngay →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2.5 HỢP ĐỒNG KHÁCH ĐOÀN: VIP THÁNG & SỰ KIỆN CHUỖI NGÀY */}
        {/* ======================================================== */}
        <section className="space-y-4 pt-2">
          {/* Main Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 p-5 text-white shadow-xl border border-amber-500/30">
            {/* Background Glow */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"></div>
            <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

            {/* Header Badge & Title */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                DÀNH CHO KHÁCH ĐOÀN, CLB & DOANH NGHIỆP
              </div>

              <h2 className="mt-2 text-xl font-black text-white leading-tight">
                HỢP ĐỒNG & ĐẶT SÂN THEO GÓI
              </h2>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Chính sách ưu đãi và hỗ trợ vận hành riêng cho Hội viên gắn bó định kỳ hoặc Sự kiện / Giải đấu ngắn ngày.
              </p>

              {/* 2-TAB SEGMENTED CONTROLLER */}
              <div className="mt-4 grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setContractMode('vip_subscription')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer ${
                    contractMode === 'vip_subscription'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>CỐ ĐỊNH THÁNG (1 - 12T)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContractMode('event_series')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer ${
                    contractMode === 'event_series'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>SỰ KIỆN & CHUỖI NGÀY</span>
                </button>
              </div>
            </div>

            {/* ======================================================== */}
            {/* TAB 1: VIP MONTHLY SUBSCRIPTION (1 - 12 MONTHS)         */}
            {/* ======================================================== */}
            {contractMode === 'vip_subscription' && (
              <div className="mt-4 space-y-4 animate-in fade-in duration-200 relative z-10">
                {/* 3 Tier Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-white/5 border border-slate-700/60 p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-slate-300">Trải nghiệm</span>
                        <span className="rounded bg-slate-800 px-1 py-0.5 text-[8px] font-bold text-slate-300">
                          Giá chuẩn
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-black text-white">1 – 2 Tháng</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Giữ cố định giờ vàng yêu thích.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-amber-400/30 p-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-amber-300">Hạng VIP</span>
                        <span className="rounded bg-amber-400/20 px-1 py-0.5 text-[8px] font-extrabold text-amber-300 border border-amber-400/30">
                          -10%/h
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-black text-white">3 – 6 Tháng</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">Hỗ trợ chia nhiều đợt đóng.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-400/40 p-2.5 flex flex-col justify-between relative overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-amber-200">VIP Vàng</span>
                        <span className="rounded bg-amber-400 px-1 py-0.5 text-[8px] font-black text-slate-950">
                          -15%/h
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-black text-white">&gt; 6 – 12T</p>
                      <p className="text-[9px] text-amber-200/80 mt-0.5 leading-tight">Ưu tiên vị trí sân đẹp nhất.</p>
                    </div>
                  </div>
                </div>

                {/* Interactive VIP Calculator */}
                <div className="rounded-2xl bg-slate-950/70 p-4 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-200">DỰ TOÁN CHI PHÍ & TIẾT KIỆM</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold">Tính toán nhanh</span>
                  </div>

                  {/* Step 1: Chọn môn */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      1. Chọn bộ môn:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['badminton', 'volleyball', 'football'] as const).map((sKey) => {
                        const sp = sportsData[sKey];
                        const active = vipSport === sKey;
                        return (
                          <button
                            key={sKey}
                            type="button"
                            onClick={() => setVipSport(sKey)}
                            className={`rounded-xl py-2 px-2 text-center border transition active:scale-95 flex flex-col items-center cursor-pointer ${
                              active
                                ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 text-xs font-bold'
                            }`}
                          >
                            <span className="text-xs">{sp.name}</span>
                            <span className={`text-[9px] ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                              {sp.pricePerHour.toLocaleString('vi-VN')}đ/h
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Tần suất & Thời lượng */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Buổi / Tuần */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                        2. Buổi / Tuần:
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setVipSessionsPerWeek(s)}
                            className={`rounded-lg py-1.5 text-xs font-black transition active:scale-95 cursor-pointer ${
                              vipSessionsPerWeek === s
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            {s}b
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Giờ / Buổi */}
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                        3. Thời lượng / Buổi:
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {[1.5, 2, 3].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setVipHoursPerSession(h)}
                            className={`rounded-lg py-1.5 text-xs font-black transition active:scale-95 cursor-pointer ${
                              vipHoursPerSession === h
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Thời gian hợp đồng (1 - 12 tháng) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        4. Thời hạn thuê (1 đến 12 tháng):
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-amber-400">{vipMonths} Tháng</span>
                        {vipDiscountPercent > 0 ? (
                          <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black">
                            Giảm {vipDiscountPercent}%
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 text-[10px] font-bold">
                            Gói Trải Nghiệm
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Range Slider (min 1, max 12) */}
                    <input
                      type="range"
                      min={1}
                      max={12}
                      step={1}
                      value={vipMonths}
                      onChange={(e) => setVipMonths(Number(e.target.value))}
                      className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />

                    {/* Quick Select Buttons */}
                    <div className="mt-2 grid grid-cols-5 gap-1">
                      {[
                        { m: 1, label: '1T' },
                        { m: 2, label: '2T' },
                        { m: 3, label: '3T (-10%)' },
                        { m: 6, label: '6T (-10%)' },
                        { m: 12, label: '12T (-15%)' },
                      ].map((item) => (
                        <button
                          key={item.m}
                          type="button"
                          onClick={() => setVipMonths(item.m)}
                          className={`rounded-lg py-1 text-[10px] font-black transition active:scale-95 cursor-pointer ${
                            vipMonths === item.m
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Upsell Banner when vipMonths < 3 */}
                    {vipMonths < 3 && (
                      <div className="mt-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/10 border border-amber-400/30 p-2.5 flex items-start gap-2 text-xs">
                        <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-bold text-amber-300 text-[11px]">💡 Mẹo nâng hạng tiết kiệm:</p>
                          <p className="text-[10px] text-slate-300 mt-0.5 leading-relaxed">
                            Đăng ký từ 3 tháng trở lên để được nâng lên <strong className="text-amber-300">Hạng VIP</strong> và nhận chiết khấu <strong className="text-emerald-400">GIẢM NGAY 10%/giờ</strong> (tiết kiệm từ hàng trăm nghìn đến triệu đồng)!
                          </p>
                          <button
                            type="button"
                            onClick={() => setVipMonths(3)}
                            className="mt-1 text-[11px] font-black text-amber-300 hover:text-amber-200 underline cursor-pointer"
                          >
                            Nâng lên gói 3 Tháng VIP (-10%) ngay →
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="mt-2 text-[10px] text-slate-400 italic">
                      * Hợp đồng tối đa 12 tháng (1 năm). Khi hết hạn hợp đồng, quý khách được ưu tiên gia hạn cho năm kế tiếp.
                    </p>
                  </div>

                  {/* Financial Breakdown Box */}
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-emerald-500/10 border border-amber-400/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Quy mô dự kiến:</span>
                      <span className="font-bold text-white">~ {vipTotalSessions} buổi ({vipTotalHours} giờ thi đấu)</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Giá niêm yết:</span>
                      <span className={vipDiscountPercent > 0 ? "line-through text-slate-400 font-medium" : "font-bold text-white"}>
                        {vipBasePrice.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    {vipDiscountPercent > 0 ? (
                      <div className="flex justify-between items-center text-amber-300 font-bold">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Chiết khấu VIP ({vipDiscountPercent}%):
                        </span>
                        <span>- {vipDiscountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>Chính sách giá:</span>
                        <span className="text-slate-300 font-bold">Giá chuẩn (Được giữ cố định giờ vàng)</span>
                      </div>
                    )}

                    <div className="border-t border-slate-800 pt-2 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Tổng chi phí sau giảm:</span>
                        <span className="text-lg font-black text-emerald-400">{vipFinalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Trung bình hàng tháng:</span>
                        <span className="text-xs font-bold text-amber-300">~ {vipMonthlyAverage.toLocaleString('vi-VN')}đ / tháng</span>
                      </div>
                    </div>
                  </div>

                  {/* VIP Privileges Checklist */}
                  <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Cố định khung giờ vàng suốt hợp đồng (không lo mất sân)</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Hỗ trợ chia nhỏ nhiều đợt thanh toán linh hoạt tại quầy</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Linh hoạt đổi/dời buổi khi có lịch công tác hoặc bận đột xuất</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Xuất hóa đơn điện tử VAT đầy đủ cho doanh nghiệp & CLB</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVipModal(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition cursor-pointer"
                    >
                      <Award className="w-4 h-4" /> Đăng ký giữ lịch VIP
                    </button>

                    <a
                      href="tel:0901234567"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 px-4 text-xs font-bold text-white border border-slate-700 active:scale-95 transition"
                    >
                      <Phone className="w-4 h-4 text-amber-400" /> Hotline VIP: 0901.234.567
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: EVENT & MULTI-DAY SERIES                         */}
            {/* ======================================================== */}
            {contractMode === 'event_series' && (
              <div className="mt-4 space-y-4 animate-in fade-in duration-200 relative z-10">
                {/* Event Highlights */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl bg-white/5 border border-amber-400/20 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-300">Chuỗi ngày</span>
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-black text-emerald-300 border border-emerald-500/30">
                          7 – 14 Ngày
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-black text-white">Tập Huấn & Khóa Học</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Luyện tập dồn dập, khóa giữ nguyên cụm sân suốt đợt.</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-amber-400/40 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-200">Đại hội / Giải</span>
                        <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-slate-950">
                          Bao Trọn Sàn
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-black text-white">Giải Đấu Doanh Nghiệp</p>
                      <p className="text-[10px] text-amber-200/80 mt-0.5">Tài trợ trọn gói âm thanh, bảng điểm, còi & nước uống.</p>
                    </div>
                  </div>
                </div>

                {/* Event Calculator Box */}
                <div className="rounded-2xl bg-slate-950/70 p-4 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-200">DỰ TOÁN SỰ KIỆN / CHUỖI NGÀY</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">Báo giá theo đợt</span>
                  </div>

                  {/* Step 1: Chọn quy mô & môn */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      1. Chọn môn thi đấu hoặc Bao trọn sàn:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEventSport('badminton')}
                        className={`rounded-xl py-2 px-2 text-center border transition active:scale-95 flex flex-col items-center cursor-pointer ${
                          eventSport === 'badminton'
                            ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 text-xs font-bold'
                        }`}
                      >
                        <span className="text-xs font-black">Cầu Lông</span>
                        <span className={`text-[9px] ${eventSport === 'badminton' ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                          120.000đ/sân/h
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventSport('volleyball')}
                        className={`rounded-xl py-2 px-2 text-center border transition active:scale-95 flex flex-col items-center cursor-pointer ${
                          eventSport === 'volleyball'
                            ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 text-xs font-bold'
                        }`}
                      >
                        <span className="text-xs font-black">Bóng Chuyền</span>
                        <span className={`text-[9px] ${eventSport === 'volleyball' ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                          150.000đ/cụm/h
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventSport('football')}
                        className={`rounded-xl py-2 px-2 text-center border transition active:scale-95 flex flex-col items-center cursor-pointer ${
                          eventSport === 'football'
                            ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600 text-xs font-bold'
                        }`}
                      >
                        <span className="text-xs font-black">Bóng Đá Mini</span>
                        <span className={`text-[9px] ${eventSport === 'football' ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>
                          200.000đ/giờ (toàn sàn)
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventSport('all_arena')}
                        className={`rounded-xl py-2 px-2 text-center border transition active:scale-95 flex flex-col items-center cursor-pointer ${
                          eventSport === 'all_arena'
                            ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md ring-2 ring-amber-300'
                            : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-slate-600 text-xs font-bold'
                        }`}
                      >
                        <span className="text-xs font-black">🎪 Bao Trọn 8 Ô Sàn</span>
                        <span className={`text-[9px] ${eventSport === 'all_arena' ? 'text-slate-900 font-bold' : 'text-amber-400'}`}>
                          Gói Sự Kiện Toàn Sàn
                        </span>
                      </button>
                    </div>

                    {/* Số sân cầu lông nếu chọn cầu lông */}
                    {eventSport === 'badminton' && (
                      <div className="mt-2.5 flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800">
                        <span className="text-[11px] text-slate-300 font-bold">Số lượng sân thi đấu:</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 4, 6].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setEventCourtCount(num)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                                eventCourtCount === num
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {num} sân
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Thời lượng số ngày */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        2. Số ngày thuê liên tiếp:
                      </label>
                      <span className="text-sm font-black text-amber-400">{eventDays} Ngày</span>
                    </div>

                    <input
                      type="range"
                      min={3}
                      max={30}
                      step={1}
                      value={eventDays}
                      onChange={(e) => setEventDays(Number(e.target.value))}
                      className="w-full accent-amber-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />

                    <div className="mt-2 grid grid-cols-5 gap-1">
                      {[
                        { d: 7, label: '7N (1T)' },
                        { d: 10, label: '10N' },
                        { d: 14, label: '14N (2T)' },
                        { d: 21, label: '21N (3T)' },
                        { d: 30, label: '30N (1 Tháng)' },
                      ].map((item) => (
                        <button
                          key={item.d}
                          type="button"
                          onClick={() => setEventDays(item.d)}
                          className={`rounded-lg py-1.5 text-[10px] font-black transition active:scale-95 cursor-pointer ${
                            eventDays === item.d
                              ? 'bg-amber-400 text-slate-950 font-black'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Khung giờ mỗi ngày */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      3. Khung giờ thi đấu mỗi ngày:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEventTimeSlot('morning')}
                        className={`rounded-xl p-2.5 text-left border transition active:scale-95 cursor-pointer ${
                          eventTimeSlot === 'morning'
                            ? 'bg-amber-400/20 border-amber-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-amber-300">Buổi Sáng (3h)</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black">-5% Giờ Thấp Điểm</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">08:00 - 11:00 hàng ngày</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventTimeSlot('afternoon')}
                        className={`rounded-xl p-2.5 text-left border transition active:scale-95 cursor-pointer ${
                          eventTimeSlot === 'afternoon'
                            ? 'bg-amber-400/20 border-amber-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-amber-300">Buổi Chiều (3h)</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black">-5% Giờ Thấp Điểm</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">14:00 - 17:00 hàng ngày</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventTimeSlot('evening')}
                        className={`rounded-xl p-2.5 text-left border transition active:scale-95 cursor-pointer ${
                          eventTimeSlot === 'evening'
                            ? 'bg-amber-400/20 border-amber-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-amber-300">Buổi Tối (3h)</span>
                          <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-black">Giờ Vàng + Quà</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">18:00 - 21:00 hàng ngày</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEventTimeSlot('fullday')}
                        className={`rounded-xl p-2.5 text-left border transition active:scale-95 cursor-pointer ${
                          eventTimeSlot === 'fullday'
                            ? 'bg-amber-400/20 border-amber-400 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-amber-300">Cả Ngày (8h)</span>
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-black">-10% Gói Trọn Ngày</span>
                        </div>
                        <p className="text-[10px] text-slate-300 mt-0.5">08:00 - 17:00 liên tục</p>
                      </button>
                    </div>
                  </div>

                  {/* Financial Breakdown Box */}
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-emerald-500/10 border border-amber-400/30 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Quy mô chuỗi ngày:</span>
                      <span className="font-bold text-white">{eventDays} ngày liên tiếp ({eventTotalHours} giờ thi đấu)</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                      <span>Đơn giá giờ tạm tính:</span>
                      <span className="font-bold text-white">{eventHourlyRate.toLocaleString('vi-VN')}đ / giờ</span>
                    </div>
                    {eventDiscountPercent > 0 && (
                      <div className="flex justify-between items-center text-emerald-400 font-bold">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> Ưu đãi giờ thấp điểm ({eventDiscountPercent}%):
                        </span>
                        <span>- {eventDiscountAmount.toLocaleString('vi-VN')}đ</span>
                      </div>
                    )}
                    <div className="border-t border-slate-800 pt-2 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Dự toán toàn bộ đợt:</span>
                        <span className="text-lg font-black text-emerald-400">{eventFinalPrice.toLocaleString('vi-VN')}đ</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Đặt cọc giữ sàn:</span>
                        <span className="text-xs font-bold text-amber-300">~ {Math.round(eventFinalPrice / 2).toLocaleString('vi-VN')}đ (50%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Gói quà tặng & Hậu cần tài trợ */}
                  <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1 text-amber-400 font-black text-xs uppercase mb-1">
                      <Gift className="w-4 h-4" /> GÓI TIỆN ÍCH HẬU CẦN ĐI KÈM SỰ KIỆN:
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Tặng 2 thùng nước khoáng / nước điện giải cho giải đấu</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Miễn phí mượn bảng điểm lật tay, còi & áo pitch phân đội</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Hỗ trợ hệ thống âm thanh loa mic khai mạc & trao giải</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Khóa sàn liên tục, tránh gián đoạn các buổi tập huấn</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEventModal(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 px-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition cursor-pointer"
                    >
                      <Trophy className="w-4 h-4" /> Đăng ký sự kiện / Chuỗi ngày
                    </button>

                    <a
                      href="tel:0901234567"
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 py-3 px-4 text-xs font-bold text-white border border-slate-700 active:scale-95 transition"
                    >
                      <Phone className="w-4 h-4 text-amber-400" /> Điều phối giải: 0901.234.567
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. HỆ THỐNG ĐẶT SÂN TỰ ĐỘNG (LIGHT THEME)               */}
        {/* ======================================================== */}
        <section ref={bookingRef} className="scroll-mt-16 space-y-5 pt-4 border-t border-slate-200">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
              ● ĐẶT SÂN & LỊCH TRỐNG REAL-TIME
            </p>
            <h2 className="mt-0.5 text-xl font-black text-slate-900">
              HỆ THỐNG ĐẶT SÂN NHANH, THANH TOÁN TỰ ĐỘNG
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Chọn môn thể thao, ngày thi đấu và thời gian để giữ lịch thi đấu ngay.
            </p>
          </div>

          {/* ⚡ BƯỚC 1: CHỌN MÔN THỂ THAO */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">1</span>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">CHỌN MÔN THỂ THAO</h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(sportsData) as Array<keyof typeof sportsData>).map((key) => {
                const sp = sportsData[key];
                const IconComponent = sp.icon;
                const isSelected = selectedSportId === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedSportId(key as any)}
                    className={[
                      'flex flex-col items-center justify-center rounded-xl p-3 text-center border transition active:scale-95',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 font-bold hover:border-slate-300 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    <IconComponent />
                    <span className="mt-2 text-xs font-extrabold tracking-wide uppercase">{sp.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ⚡ BƯỚC 2: CHỌN NGÀY THI ĐẤU */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">2</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">CHỌN NGÀY THI ĐẤU</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600">Tháng 09/2026</span>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {selectedDate && !availableDates.some((item) => `${item.label} (${item.date})` === selectedDate) && (
                <button
                  type="button"
                  className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-4 py-2.5 border border-emerald-500 bg-emerald-500 text-white font-black shadow-sm"
                >
                  <span className="text-[10px] font-bold uppercase opacity-90">Đã chọn</span>
                  <span className="text-xs font-black mt-0.5">{selectedDate}</span>
                </button>
              )}
              {availableDates.map((item) => {
                const fullDateStr = `${item.label} (${item.date})`;
                const isSelected = selectedDate === fullDateStr;

                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => setSelectedDate(fullDateStr)}
                    className={[
                      'flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-4 py-2.5 border transition active:scale-95',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white font-black shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300',
                    ].join(' ')}
                  >
                    <span className="text-[10px] font-bold uppercase opacity-80">{item.label}</span>
                    <span className="text-xs font-black mt-0.5">{item.date}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ⚡ BƯỚC 3: LỰA CHỌN THỜI GIAN & SÂN KHẢ DỤNG */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">3</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">CHỌN THỜI GIAN & SÂN</h3>
              </div>
            </div>

            {/* 1. Time Selection (Always at top of Step 3) */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Giờ Bắt Đầu</label>
                  <select 
                    value={selectedStartTime}
                    onChange={(e) => handleStartTimeSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    <option value="">-- Chọn giờ bắt đầu --</option>
                    {allStartTimes.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Thời Lượng</label>
                  <select 
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    {availableDurations.map(dur => (
                      <option key={dur} value={dur}>{dur / 60} giờ ({dur} phút)</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {selectedStartTime && (
                <div className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-3 border border-emerald-100 animate-in fade-in duration-200">
                  <span className="text-xs font-semibold text-emerald-800">Khung giờ đã chọn:</span>
                  <span className="text-sm font-black text-emerald-600">{selectedSlot}</span>
                </div>
              )}
            </div>

            {/* 2. Available Courts (Shows ONLY AFTER date & time are selected) */}
            {!selectedDate || !selectedStartTime ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3.5 text-center text-xs text-slate-500">
                <p className="font-semibold text-slate-600">
                  {!selectedDate 
                    ? "Vui lòng chọn Ngày thi đấu để tiếp tục" 
                    : "Vui lòng chọn Giờ bắt đầu để hiển thị các sân khả dụng"}
                </p>
              </div>
            ) : (
              <div className="pt-3 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Sân khả dụng ({availableCourts.length} sân trống)
                  </label>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    {selectedSlot}
                  </span>
                </div>

                {availableCourts.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableCourts.map((court) => {
                      const isCourtSelected = selectedCourt === court;
                      return (
                        <button
                          key={court}
                          type="button"
                          onClick={() => setSelectedCourt(court)}
                          className={[
                            'rounded-xl px-3.5 py-2 text-xs font-bold transition active:scale-95 flex items-center gap-1.5 cursor-pointer',
                            isCourtSelected
                              ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-black shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/30',
                          ].join(' ')}
                        >
                          <span className={`w-2 h-2 rounded-full ${isCourtSelected ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                          {court}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-center text-xs text-amber-800 space-y-2">
                    <p className="font-bold">Khung giờ này hiện đã kín sân!</p>
                    <p className="text-[11px] text-amber-700">Vui lòng chọn giờ khác hoặc bấm nút "Xem lịch sân" ở góc dưới để tìm giờ trống.</p>
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(true)}
                      className="inline-flex items-center gap-1 rounded-lg bg-amber-600 text-white font-bold px-3 py-1.5 text-[11px] hover:bg-amber-700 active:scale-95 transition cursor-pointer"
                    >
                      Mở lịch sân xem giờ trống
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ⚡ BƯỚC 4: TÓM TẮT ĐƠN ĐẶT SÂN */}
          <div id="booking-summary-section" className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs scroll-mt-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">4</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">TÓM TẮT ĐƠN ĐẶT SÂN</h3>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-700 border border-emerald-200">
                Xác nhận
              </span>
            </div>

            <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Môn thi đấu</span>
                <span className="font-bold text-slate-900">{currentSport.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sân thi đấu</span>
                <span className="font-bold text-emerald-600">{selectedCourt}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Ngày đặt</span>
                <span className="font-bold text-slate-900">{selectedDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Khung giờ</span>
                <span className="font-bold text-slate-900">{selectedSlot} ({durationHours} giờ)</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                <span className="text-slate-600 font-bold">Tổng thanh toán</span>
                <span className="text-xl font-black text-emerald-600">{formattedPrice}</span>
              </div>
            </div>
          </div>

          {/* ⚡ BƯỚC 5: THÔNG TIN KHÁCH HÀNG & THANH TOÁN FORM */}
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">5</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">THÔNG TIN NGUỜI ĐẶT</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="mb-1 block font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                    Ghi chú thêm (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="VD: Cần mượn thêm vợt, bóng..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={sendZalo}
                    onChange={(e) => setSendZalo(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 text-xs font-semibold">Gửi vé điện tử & thông báo nhắc lịch qua Zalo/SMS</span>
                </label>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-600 active:scale-95"
            >
              TIẾN HÀNH THANH TOÁN
            </button>
          </form>
        </section>


        {/* ======================================================== */}
        {/* 4. TRA CỨU THÔNG TIN ĐẶT SÂN                            */}
        {/* ======================================================== */}
        <section ref={lookupRef} className="scroll-mt-16 space-y-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
              ● KIỂM TRA LỊCH ĐÃ ĐẶT
            </p>
            <h2 className="mt-0.5 text-xl font-black text-slate-900">
              TRA CỨU THÔNG TIN ĐẶT SÂN
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Nhập số điện thoại hoặc mã đơn hàng để kiểm tra lịch thi đấu và trạng thái thanh toán.
            </p>
          </div>

          <form onSubmit={handleLookupSearch} className="flex gap-2">
            <input
              type="text"
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
              placeholder="Nhập SĐT hoặc Mã đặt sân (Ví dụ: 0912345678)"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 shadow-xs"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-600 transition shadow-sm"
            >
              TRA CỨU
            </button>
          </form>

          {/* Lookup Demo Result */}
          {hasSearched ? (
            lookupResult ? (
              <div className="rounded-2xl border border-emerald-300 bg-white p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-mono text-sm font-extrabold text-slate-900">{lookupResult.code}</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                    {lookupResult.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between"><span className="text-slate-500">Khách hàng:</span> <span className="font-bold text-slate-900">{lookupResult.name} ({lookupResult.phone})</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Môn & Sân:</span> <span className="font-bold text-emerald-600">{lookupResult.sport} - {lookupResult.court}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Thời gian:</span> <span className="font-bold text-slate-900">{lookupResult.date} | {lookupResult.time}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Tổng tiền:</span> <span className="font-bold text-slate-900">{lookupResult.total}</span></div>
                    {lookupResult.status === 'ĐÃ HỦY' && (
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                        <span className="text-slate-500">Hoàn tiền:</span> 
                        <span className={'font-black ' + (lookupResult.paymentStatus === 'ĐÃ HOÀN TIỀN' ? 'text-emerald-600' : 'text-amber-500')}>
                          {lookupResult.paymentStatus || 'ĐANG XỬ LÝ HOÀN TIỀN'}
                        </span>
                      </div>
                    )}
                  </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => handleRebook(lookupResult)} className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition">
                    Đặt lại vé
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleCancelTicket(lookupResult)} 
                    disabled={lookupResult.status === 'ĐÃ HỦY'}
                    className={'flex-1 rounded-xl border py-2.5 text-xs font-bold active:scale-95 transition ' + (lookupResult.status === 'ĐÃ HỦY' ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-red-200 text-red-600 hover:bg-red-50')}
                  >
                    {lookupResult.status === 'ĐÃ HỦY' ? 'Đã hủy' : 'Hủy vé'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-xs">
                <Search className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                Không tìm thấy thông tin đơn đặt sân phù hợp với từ khóa "<span className="text-slate-900 font-bold">{lookupQuery}</span>".
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 text-xs shadow-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-bold">ĐƠN HÀNG MẪU:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => { setHasSearched(true); setLookupResult({
                    code: '#CX-11111', sport: 'Bóng Đá', court: 'Sân Bóng Đá 1', name: 'Nguyễn Văn An', phone: '0912345678', date: '26/09/2026', time: '14:00 - 15:30', total: '450.000đ', status: 'ĐÃ XÁC NHẬN', hoursUntilStart: 12, sportId: 'football'
                }); }} className="rounded-xl bg-slate-100 p-2 text-center font-bold text-slate-700 active:scale-95 hover:bg-slate-200">
                  Vé sắp đá (&lt; 24h)
                </button>
                <button type="button" onClick={() => { setHasSearched(true); setLookupResult({
                    code: '#CX-99999', sport: 'Cầu Lông', court: 'Sân Cầu Lông 2', name: 'Nguyễn Văn An', phone: '0912345678', date: '30/09/2026', time: '09:00 - 10:30', total: '180.000đ', status: 'ĐÃ XÁC NHẬN', hoursUntilStart: 48, sportId: 'badminton'
                }); }} className="rounded-xl bg-slate-100 p-2 text-center font-bold text-slate-700 active:scale-95 hover:bg-slate-200">
                  Vé tuần sau (&gt; 24h)
                </button>
                <button type="button" onClick={() => { setHasSearched(true); setLookupResult({
                    code: '#CX-77777', sport: 'Bóng Chuyền', court: 'Sân Bóng Chuyền 1', name: 'Nguyễn Văn An', phone: '0912345678', date: '20/09/2026', time: '08:00 - 09:30', total: '300.000đ', status: 'ĐÃ HỦY', paymentStatus: 'ĐÃ HOÀN TIỀN', hoursUntilStart: -24, sportId: 'volleyball'
                }); }} className="col-span-2 rounded-xl bg-red-50 border border-red-100 p-2 text-center font-bold text-red-600 active:scale-95 hover:bg-red-100">
                  Vé mẫu Đã Hủy & Hoàn Tiền
                </button>
              </div>
            </div>
          )}
        </section>


        {/* ======================================================== */}
        {/* 5. THÔNG TIN LIÊN HỆ & VỊ TRÍ                           */}
        {/* ======================================================== */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-xl font-black">
              <Home className='w-5 h-5' />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">NHÀ THI ĐẤU ĐA NĂNG COURTX</h3>
              <p className="text-[10px] text-slate-500">Hệ thống sân tiêu chuẩn thi đấu quốc tế</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-3">
            <p><MapPin className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Địa chỉ:</strong> Số 18 Đường Thi Đấu, Phường Thể Thao, Quận Đa Năng, TP.HCM</p>
            <p><Phone className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Hotline đặt sân:</strong> <span className="text-emerald-600 font-bold">0912 345 678</span></p>
            <p><Clock className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Giờ mở cửa:</strong> 05:00 - 23:00 (Tất cả các ngày trong tuần)</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href="tel:0912345678"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
            >
              <Phone className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> Gọi Hotline
            </a>
            <button
              type="button"
              onClick={() => showAlert('Chỉ đường', 'Đang mở bản đồ Google Maps tới Nhà thi đấu COURTX...')}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
            >
              <MapPin className='w-3.5 h-3.5 inline mr-1' /> Chỉ đường Map
            </button>
          </div>
        </section>

      </main>
)}
{activeTab === 'schedule' && (
  <CustomerSchedule 
    onSelectSlot={(sportId, courtName, time, dateStr) => {
      handleSelectSlotFromSchedule(sportId, courtName, time, dateStr);
    }}
  />
)}

      {/* 🟢 FLOATING BUBBLE: XEM LỊCH SÂN NGAY TRÊN TRANG ĐẶT SÂN */}
      {activeTab === 'booking' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-40 px-4 flex justify-end animate-in fade-in zoom-in-95 duration-300">
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 shadow-xl shadow-emerald-950/25 border-2 border-emerald-400 active:scale-95 transition-all group cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <CalendarIcon className="w-4 h-4 text-emerald-100 group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-black tracking-wide">Xem lịch sân</span>
          </button>
        </div>
      )}

      {/* 📱 MODAL BOTTOM SHEET: XEM LỊCH SÂN TRỰC TIẾP TRÊN TRANG ĐẶT SÂN */}
      {showScheduleModal && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex flex-col bg-slate-50 animate-in slide-in-from-bottom-8 duration-300 shadow-2xl border-x border-slate-200 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">BẢNG LỊCH SÂN</h3>
                <p className="text-[10px] text-slate-500 font-medium">Chạm ô trống để chọn & điền form tự động</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 active:scale-95 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Đóng
            </button>
          </header>

          {/* Schedule Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <CustomerSchedule
              isModalMode={true}
              onSelectSlot={(sportId, courtName, time, dateStr) => {
                handleSelectSlotFromSchedule(sportId, courtName, time, dateStr);
                setShowScheduleModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 👑 MODAL ĐĂNG KÝ THUÊ SÂN VIP CỐ ĐỊNH */}
      {showVipModal && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 max-h-[92vh] overflow-y-auto flex flex-col border border-slate-100">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3 mx-auto sm:hidden"></div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">Đăng ký giữ lịch VIP</h3>
                  <p className="text-[10px] text-slate-500">Giữ sân cố định • Hợp đồng tối đa 1 năm</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVipModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Package Summary Card */}
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Môn & Thời hạn:</span>
                <span className="font-extrabold text-slate-900">
                  {sportsData[vipSport].name} • {vipMonths} Tháng (Giảm {vipDiscountPercent}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tần suất dự kiến:</span>
                <span className="font-bold text-slate-800">
                  {vipSessionsPerWeek} buổi/tuần ({vipHoursPerSession}h/buổi)
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-amber-200/60 pt-1.5">
                <span className="text-slate-500">Dự toán sau giảm:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {vipFinalPrice.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <p className="text-[10px] text-amber-700 font-medium">
                ✨ Tiết kiệm {vipDiscountAmount.toLocaleString('vi-VN')}đ (~ {vipMonthlyAverage.toLocaleString('vi-VN')}đ/tháng, hỗ trợ chia nhiều đợt thanh toán tại quầy).
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleVipSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Họ tên người đại diện / Tên CLB / Doanh nghiệp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: CLB Cầu Lông Đam Mê / Nguyễn Văn A"
                  value={vipCustomerName}
                  onChange={(e) => setVipCustomerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Số điện thoại liên hệ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0901234567"
                  value={vipCustomerPhone}
                  onChange={(e) => setVipCustomerPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Khung giờ & Các thứ trong tuần mong muốn
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tối Thứ 2 - 4 - 6 từ 18:00 đến 20:00"
                  value={vipPreferredSchedule}
                  onChange={(e) => setVipPreferredSchedule(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Ghi chú hoặc yêu cầu thanh toán nhiều đợt
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Mong muốn thanh toán làm 3 đợt, cần xuất hóa đơn VAT cho công ty..."
                  value={vipCustomerNote}
                  onChange={(e) => setVipCustomerNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500 border border-slate-200 leading-relaxed">
                ℹ️ <strong>Quy trình xử lý VIP:</strong> Để đảm bảo mặt sân được giữ độc quyền và khóa va chạm không gian xuyên suốt chu kỳ hợp đồng, nhân viên quản lý sân sẽ kiểm tra lịch sàn và gọi điện thoại xác nhận trong vòng 15 phút, sau đó hướng dẫn ký hợp đồng trực tiếp tại quầy.
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowVipModal(false)}
                  className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition"
                >
                  GỬI YÊU CẦU VIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎪 MODAL ĐĂNG KÝ SỰ KIỆN & CHUỖI NGÀY */}
      {showEventModal && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 max-h-[92vh] overflow-y-auto flex flex-col border border-slate-100">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-3 mx-auto sm:hidden"></div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">Đăng ký sự kiện / Chuỗi ngày</h3>
                  <p className="text-[10px] text-slate-500">Giữ sân dồn dập • Hỗ trợ thiết bị giải đấu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Package Summary Card */}
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-amber-50 to-emerald-50 border border-amber-200 p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Môn & Quy mô:</span>
                <span className="font-extrabold text-slate-900">
                  {eventSport === 'all_arena' ? 'Bao trọn 8 ô sàn' : sportsData[eventSport as keyof typeof sportsData]?.name} {eventSport === 'badminton' ? `(${eventCourtCount} sân)` : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thời gian chuỗi:</span>
                <span className="font-bold text-slate-800">
                  {eventDays} ngày liên tiếp ({eventTotalHours} giờ)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Khung giờ mỗi ngày:</span>
                <span className="font-bold text-slate-800">
                  {eventTimeSlot === 'morning' ? 'Sáng (08:00 - 11:00)' : eventTimeSlot === 'afternoon' ? 'Chiều (14:00 - 17:00)' : eventTimeSlot === 'evening' ? 'Tối (18:00 - 21:00)' : 'Cả ngày (08:00 - 17:00)'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-amber-200/60 pt-1.5">
                <span className="text-slate-500">Dự toán toàn đợt:</span>
                <span className="font-black text-emerald-700 text-sm">
                  {eventFinalPrice.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <p className="text-[10px] text-amber-700 font-medium">
                🎁 Tặng kèm: 2 thùng nước khoáng + miễn phí mượn bảng điểm lật tay + còi + loa mic trao giải.
              </p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleEventSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Tên Đơn vị / CLB / Doanh nghiệp / Ban tổ chức <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Công ty Cổ phần ABC / Ban tổ chức giải Cúp Mùa Thu"
                  value={eventOrgName}
                  onChange={(e) => setEventOrgName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Số điện thoại người đại diện liên hệ <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ví dụ: 0901234567"
                  value={eventPhone}
                  onChange={(e) => setEventPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Ngày dự kiến bắt đầu đợt thi đấu
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bắt đầu từ Thứ Hai ngày 20/10/2026"
                  value={eventStartDate}
                  onChange={(e) => setEventStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Yêu cầu hậu cần đặc biệt & ghi chú
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Cần hỗ trợ 2 trọng tài bắt chính, hỗ trợ vị trí căng backdrop giải đấu, cần xuất hóa đơn VAT..."
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white transition resize-none"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500 border border-slate-200 leading-relaxed">
                ℹ️ <strong>Quy trình xử lý sự kiện:</strong> Vì thuê dồn dập {eventDays} ngày liên tiếp có thể trùng một vài ô sân lẻ đã có khách đặt trước, điều phối viên sẽ kiểm tra sơ đồ sàn trên hệ thống và gọi lại cho quý khách trong vòng 15 phút để chốt cụm sân và thủ tục đặt cọc 50%.
              </div>

              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3 text-xs font-black uppercase tracking-wider text-slate-950 shadow-md shadow-amber-500/20 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition cursor-pointer"
                >
                  GỬI YÊU CẦU SỰ KIỆN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}




                  {/* 🟠 MODAL XÁC THỰC OTP */}
      {showOTP && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col items-center">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-4 sm:hidden"></div>
            
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Phone className="h-6 w-6" />
            </div>
            
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Xác thực OTP</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
              Vui lòng nhập mã gồm 6 chữ số được gửi đến số điện thoại <br/>
              <strong className="text-slate-800">{customerPhone}</strong>
            </p>

            <div className="w-full space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/[^0-9]/g, ''));
                    setOtpError(false);
                  }}
                  placeholder="Nhập mã OTP (Mẫu: 123456)"
                  className={'w-full text-center text-2xl tracking-widest font-mono font-black rounded-xl border px-4 py-3 outline-none transition focus:border-emerald-500 ' + (otpError ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-900')}
                />
                {otpError && <p className="mt-2 text-center text-[10px] font-bold text-red-500">Mã OTP không chính xác. Vui lòng thử lại!</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button onClick={() => setShowOTP(false)} type="button" className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95">Quay lại</button>
                <button onClick={handleVerifyOTP} type="button" className="rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer active:scale-95">Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      
      
      {/* 🟢 LOGIN SCREEN OVERLAY */}
      {showLogin && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md flex flex-col bg-slate-50 animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-y-auto shadow-2xl border-x border-slate-200">
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-4 bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 border border-emerald-100">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v6" />
                  <path d="M6 8l6-6 6 6" />
                  <path d="M4 14l4-6h8l4 6" />
                  <circle cx="12" cy="18" r="3" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">COURTX</h1>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">Nhà thi đấu đa năng</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-slate-500" />
              <button 
                onClick={() => setShowLogin(false)}
                className="rounded-full bg-emerald-500 px-3.5 py-2 text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1 active:scale-95 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> TRANG CHỦ
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="p-5 flex-1 flex flex-col max-w-md mx-auto w-full">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
              ĐĂNG NHẬP HỆ THỐNG
            </h2>
            
            {/* Banner */}
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-slate-900 text-white flex-shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-slate-800">Dành cho chủ sân và nhân viên tại sân</p>
            </div>

            {/* Form Card */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Tài khoản <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Nhập tên tài khoản" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-700 uppercase tracking-wider">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition tracking-widest"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Remember me */}
                <label className="flex items-center gap-2.5 pt-2 pb-1 cursor-pointer">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-white flex-shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">Ghi nhớ đăng nhập trên thiết bị này</span>
                </label>

                {/* Submit Button */}
                <button 
                  type="button"
                  onClick={() => {
                  if (username === 'admin' && passwordInput === 'admin') {
                    setIsAdminLoggedIn(true);
                    setShowLogin(false);
                    setUsername('');
                    setPasswordInput('');
                  } else if (username === 'nhanvien' && passwordInput === 'nhanvien') {
                    setIsEmployeeLoggedIn(true);
                    setShowLogin(false);
                    setUsername('');
                    setPasswordInput('');
                  } else {
                    showAlert('Sai thông tin', 'Vui lòng nhập tài khoản: admin/admin hoặc nhanvien/nhanvien');
                  }
                }}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500 active:scale-95"
                >
                  ĐĂNG NHẬP HỆ THỐNG <Zap className="w-4 h-4 fill-current" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟣 CUSTOM POPUP */}
      {popup && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            <h3 className="text-lg font-black text-slate-900">{popup.title}</h3>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{popup.message}</p>
            
            <div className={'mt-6 grid gap-3 ' + (popup.type === 'confirm' ? 'grid-cols-2' : 'grid-cols-1')}>
              {popup.type === 'confirm' && (
                <button 
                  onClick={() => setPopup(null)} 
                  className="rounded-xl border border-slate-200 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
                >
                  Không, quay lại
                </button>
              )}
              <button 
                onClick={() => {
                  const currentPopup = popup;
                  // Clear current popup state first
                  setPopup(null);
                  
                  // Use setTimeout to allow state to clear before triggering a new popup in onConfirm
                  if (currentPopup.type === 'confirm' && currentPopup.onConfirm) {
                    setTimeout(() => currentPopup.onConfirm(), 10);
                  }
                }} 
                className="rounded-xl bg-emerald-500 py-3.5 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition shadow-sm"
              >
                {popup.type === 'confirm' ? 'Có, xác nhận' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟡 MODAL THANH TOÁN (PAYMENT BOTTOM SHEET) */}
      {showPayment && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col items-center">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-4 sm:hidden"></div>
            
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Thanh toán đơn hàng</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4 text-center">Quét mã VietQR bằng ứng dụng ngân hàng</p>

              <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold w-full">
                <button 
                  onClick={() => setPaymentPercent(100)} 
                  className={`flex-1 py-2 rounded-lg transition-all ${paymentPercent === 100 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Thanh toán 100%
                </button>
                <button 
                  onClick={() => setPaymentPercent(50)} 
                  className={`flex-1 py-2 rounded-lg transition-all ${paymentPercent === 50 ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cọc 50%
                </button>
              </div>

            <div className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-5 relative overflow-hidden text-center">
              <div className="flex justify-between items-center mb-3">
                 <p className="font-extrabold text-slate-900 text-sm">MB BANK</p>
                 <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">VIETQR</span>
              </div>
              
              <div className="mx-auto h-40 w-40 bg-white rounded-xl p-2 border border-slate-200 shadow-sm relative flex items-center justify-center">
                <div className="grid grid-cols-4 gap-1.5 w-full h-full p-2 bg-slate-100 rounded">
                  {Array.from({ length: 16 }).map((_, idx) => (
                    <div key={idx} className={'rounded ' + (idx % 3 === 0 ? 'bg-emerald-500' : 'bg-slate-800')}></div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <span className="bg-white text-emerald-600 px-3 py-1 font-black text-xs rounded-full shadow-md uppercase border border-emerald-100">COURTX</span>
                </div>
              </div>

              <div className="mt-4 space-y-1 text-xs">
                <p className="text-slate-500">Số tiền thanh toán:</p>
                  <p className="text-2xl font-black text-emerald-600">{(paymentPercent === 100 ? totalPrice : totalPrice / 2).toLocaleString('vi-VN') + 'đ'}</p>
                <p className="text-slate-500 mt-2">Nội dung chuyển khoản:</p>
                <p className="font-mono font-bold text-slate-900 bg-white py-1 rounded border border-slate-200 uppercase">CX {selectedCourt.replace(/ /g, '')} {customerPhone}</p>
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
              <button onClick={() => setShowPayment(false)} type="button" className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95">Hủy giao dịch</button>
              <button onClick={simulatePaymentSuccess} type="button" className="rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer active:scale-95">Mô phỏng Đã CK</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🔴 MODAL XÁC NHẬN ĐẶT SÂN THÀNH CÔNG                    */}
      {/* ======================================================== */}
      {isSubmitted && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-x border-slate-200 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-300 bg-white p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600 border border-emerald-300">
              ✓
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">ĐẶT SÂN THÀNH CÔNG!</h3>
              <p className="mt-1 text-xs text-slate-600">
                Mã đơn của bạn là <span className="font-mono font-bold text-emerald-600">{orderCode}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-left text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between"><span className="text-slate-500">Môn:</span> <span className="font-bold text-slate-900">{currentSport.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Sân:</span> <span className="font-bold text-emerald-600">{selectedCourt}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Khung giờ:</span> <span className="font-bold text-slate-900">{selectedDate} ({selectedSlot})</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Đã thanh toán {paymentPercent === 50 ? '(Cọc 50%)' : ''}:</span> <span className="font-black text-emerald-600">{(paymentPercent === 100 ? totalPrice : totalPrice / 2).toLocaleString('vi-VN')}đ</span></div>
            </div>

            <p className="text-[11px] text-slate-500">
              Thông tin xác nhận & vé QR đã được hệ thống gửi qua Zalo/SMS tới số <strong className="text-slate-900">{customerPhone}</strong>.
            </p>

            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="w-full rounded-xl bg-emerald-500 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-600"
            >
              HOÀN TẤT & QUAY LẠI
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
