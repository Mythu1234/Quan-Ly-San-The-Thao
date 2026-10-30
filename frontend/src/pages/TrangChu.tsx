import AdminDashboard from './AdminDashboard';
import CustomerSchedule, { STANDARD_15_BOOKINGS } from '../components/CustomerSchedule';
import QrCodeArtwork from '../components/QrCodeArtwork';
import EmployeeDashboard from './employee/EmployeeDashboard';
import VipCustomerDashboard from './VipCustomerDashboard';
import { addBookingRequest } from '../types/bookingRequest';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, Clock, Play, Home, Calendar as CalendarIcon, X, Zap , User, Lock, Eye, EyeOff, Bell, Key, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Trophy, CheckCircle2, RefreshCw, MessageSquare, Copy, Check, AlertTriangle } from 'lucide-react';

const parseTimeToMinutes = (t: string): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatMinutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

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
  const [activeTab, setActiveTab] = useState<'booking' | 'lookup'>('booking');

  // Booking Form State
  const [selectedSportId, setSelectedSportId] = useState<'badminton' | 'football' | 'volleyball' | null>(null);
  const [sportError, setSportError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
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
  const [showBookingPopup, setShowBookingPopup] = useState<boolean>(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showOTP, setShowOTP] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isEmployeeLoggedIn, setIsEmployeeLoggedIn] = useState<boolean>(false);
  const [isVipLoggedIn, setIsVipLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  // User Credentials for Authentication & Password Recovery
  const [accountCredentials, setAccountCredentials] = useState<{
    [key: string]: { role: 'admin' | 'employee' | 'vip'; password: string; name: string; phone: string; email: string };
  }>({
    admin: {
      role: 'admin',
      password: 'admin',
      name: 'Ban Quản Trị (Admin)',
      phone: '0901234567',
      email: 'admin@courtx.vn',
    },
    nhanvien: {
      role: 'employee',
      password: 'nhanvien',
      name: 'Nguyễn Văn An (Nhân viên)',
      phone: '0912345678',
      email: 'nhanvien@courtx.vn',
    },
    vip: {
      role: 'vip',
      password: 'vip',
      name: 'Trần Văn Hoàng (Khách VIP)',
      phone: '0988888888',
      email: 'vip@courtx.vn',
    },
    khachvip: {
      role: 'vip',
      password: '123456',
      name: 'Trần Văn Hoàng (Khách VIP)',
      phone: '0988888888',
      email: 'khachvip@courtx.vn',
    },
  });

  // Forgot Password Flow State
  const [loginView, setLoginView] = useState<'login' | 'forgot_password'>('login');
  const [forgotStep, setForgotStep] = useState<'account' | 'otp' | 'success'>('account');
  const [forgotAccountInput, setForgotAccountInput] = useState<string>('');
  const [matchedAccountKey, setMatchedAccountKey] = useState<string>('');
  const [forgotOtpInput, setForgotOtpInput] = useState<string>('');
  const [forgotOtpCountdown, setForgotOtpCountdown] = useState<number>(60);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [generatedNewPassword, setGeneratedNewPassword] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);
  const [customPasswordInput, setCustomPasswordInput] = useState<string>('');
  const [showCustomPasswordForm, setShowCustomPasswordForm] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [smsToast, setSmsToast] = useState<{
    sender: string;
    phone: string;
    message: string;
    otp?: string;
    newPassword?: string;
  } | null>(null);

  // Auto-dismiss SMS toast after 15s
  useEffect(() => {
    if (smsToast) {
      const t = setTimeout(() => {
        setSmsToast(null);
      }, 15000);
      return () => clearTimeout(t);
    }
  }, [smsToast]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (loginView === 'forgot_password' && forgotStep === 'otp' && forgotOtpCountdown > 0) {
      timer = setInterval(() => {
        setForgotOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loginView, forgotStep, forgotOtpCountdown]);

  // Step 1: Send OTP to Phone
  const handleSendForgotOtp = (targetPhone?: string) => {
    const raw = (targetPhone !== undefined ? targetPhone : forgotAccountInput).trim().replace(/\s+/g, '');
    if (!raw) {
      setForgotError('Vui lòng nhập số điện thoại đã đăng ký!');
      return;
    }

    const phoneClean = raw.replace(/\D/g, '');
    if (!/^0[0-9]{9}$/.test(phoneClean)) {
      setForgotError('Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại gồm 10 chữ số bắt đầu bằng 0 (ví dụ: 0912345678).');
      return;
    }

    // Match against accountCredentials by phone
    let foundKey = Object.keys(accountCredentials).find(
      (k) => accountCredentials[k].phone.replace(/\s+/g, '') === phoneClean
    );

    // If not found, match by standard demo phones
    if (!foundKey) {
      if (phoneClean === '0901234567') foundKey = 'admin';
      else if (phoneClean === '0912345678') foundKey = 'nhanvien';
      else if (phoneClean === '0988888888') foundKey = 'vip';
    }

    if (!foundKey) {
      setForgotError(`Số điện thoại "${phoneClean}" chưa được đăng ký trong hệ thống CourtX! Vui lòng kiểm tra lại số điện thoại (Gợi ý: Quản trị 0901234567, Nhân viên 0912345678, Khách VIP 0988888888).`);
      return;
    }

    // Generate real 6-digit random OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setMatchedAccountKey(foundKey);
    setForgotError(null);
    setForgotStep('otp');
    setForgotOtpCountdown(60);
    setForgotOtpInput('');

    // Trigger SMS Push Notification banner
    setSmsToast({
      sender: 'COURTX-OTP',
      phone: phoneClean,
      message: `Mã OTP xác thực đặt lại mật khẩu cho số điện thoại ${phoneClean} là: ${newOtp} (hiệu lực 60s). Tuyệt đối không chia sẻ mã này cho người khác.`,
      otp: newOtp,
    });
  };

  // Step 2: Verify OTP and automatically send new password via SMS
  const handleVerifyForgotOtp = () => {
    if (!forgotOtpInput.trim()) {
      setForgotError('Vui lòng nhập mã OTP xác thực (6 số) được gửi về tin nhắn SMS!');
      return;
    }

    if (forgotOtpInput.trim() !== generatedOtp) {
      setForgotError(`Mã OTP không chính xác! Vui lòng kiểm tra lại tin nhắn SMS vừa được gửi tới số điện thoại ${accountCredentials[matchedAccountKey]?.phone || forgotAccountInput}.`);
      return;
    }

    // Generate secure new password: CX@ + 4 random digits
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const newPass = `CX@${randomSuffix}`;
    setGeneratedNewPassword(newPass);
    setForgotNewPassword(newPass);

    // Save directly to accountCredentials
    if (matchedAccountKey) {
      setAccountCredentials((prev) => ({
        ...prev,
        [matchedAccountKey]: {
          ...prev[matchedAccountKey],
          password: newPass,
        },
      }));
    }

    setForgotError(null);
    setForgotStep('success');

    // Send new password via SMS to user's phone ("gửi mật khẩu về đoàng hoàng")
    const phone = accountCredentials[matchedAccountKey]?.phone || forgotAccountInput;
    setSmsToast({
      sender: 'COURTX-SECURITY',
      phone: phone,
      message: `COURTX: Mật khẩu mới cho tài khoản SĐT ${phone} của quý khách là: ${newPass}. Vui lòng sử dụng mật khẩu này để đăng nhập ngay.`,
      newPassword: newPass,
    });
  };

  // Optional: User custom password update
  const handleSaveCustomPassword = () => {
    if (!customPasswordInput || customPasswordInput.length < 6) {
      setForgotError('Mật khẩu tự chọn phải có tối thiểu 6 ký tự!');
      return;
    }

    if (matchedAccountKey) {
      setAccountCredentials((prev) => ({
        ...prev,
        [matchedAccountKey]: {
          ...prev[matchedAccountKey],
          password: customPasswordInput,
        },
      }));
    }

    setGeneratedNewPassword(customPasswordInput);
    setForgotNewPassword(customPasswordInput);
    setShowCustomPasswordForm(false);
    setForgotError(null);

    const phone = accountCredentials[matchedAccountKey]?.phone || forgotAccountInput;
    setSmsToast({
      sender: 'COURTX-SECURITY',
      phone: phone,
      message: `COURTX: Quý khách đã đổi sang mật khẩu tùy chỉnh: ${customPasswordInput}. Vui lòng ghi nhớ để đăng nhập.`,
      newPassword: customPasswordInput,
    });
  };

  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<boolean>(false);
  const [otpAction, setOtpAction] = useState<'booking' | 'cancel'>('booking');
  const [bookingOtp, setBookingOtp] = useState<string>('123456');
  const [popup, setPopup] = useState<any>(null);
  const showAlert = (title: string, message: string) => setPopup({ type: 'alert', title, message });
  const [orderCode] = useState<string>('CX-88291');

  // Lookup Search State
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Section Refs for smooth scrolling
  const introRef = useRef<HTMLDivElement>(null);
  const facilityRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const lookupRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: 'booking' | 'lookup') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBooking = (sportId?: 'badminton' | 'volleyball' | 'football') => {
    if (sportId) {
      setSelectedSportId(sportId);
      setSportError(null);
    }
    if (activeTab !== 'booking') {
      setActiveTab('booking');
      setTimeout(() => {
        bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToFacility = () => {
    if (activeTab !== 'booking') {
      setActiveTab('booking');
      setTimeout(() => {
        facilityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      facilityRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  const handleSelectSlotFromSchedule = (
    sportId: 'badminton' | 'volleyball' | 'football',
    courtName: string,
    time: string,
    dateStr: string,
    fromScheduleTab?: boolean
  ) => {
    // Tự động gán môn theo sân mà khách bấm chọn
    setSelectedSportId(sportId);
    setSportError(null);

    // Nếu khách chưa chọn ngày ở Bước 2 và bấm vào lịch thì báo chữ đỏ & cuộn lên Bước 2
    if (!selectedDate && !fromScheduleTab) {
      setDateError('Vui lòng chọn ngày thi đấu ở Bước 2 trước khi chọn sân và giờ!');
      const el = document.getElementById('step-2-date-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSelectedStartTime(time);
    setSelectedCourt(courtName);

    // If starting on :30 or if 60 mins would conflict, default duration to 30 mins
    const startMins = parseTimeToMinutes(time);
    const hasConflictWith60 = STANDARD_15_BOOKINGS.some((b) => {
      const isSameCourt = b.courtName === courtName || b.courtCode === courtName || courtName.includes(b.courtCode);
      if (!isSameCourt) return false;
      const bStart = b.startH * 60 + b.startM;
      const bEnd = b.endH * 60 + b.endM;
      return Math.max(startMins, bStart) < Math.min(startMins + 60, bEnd);
    });

    if (hasConflictWith60 || time.endsWith(':30')) {
      setSelectedDuration(30);
    } else {
      setSelectedDuration(60);
    }

    if (fromScheduleTab && dateStr) {
      const match = dateStr.match(/(\d{1,2})\/(\d{1,2})/);
      if (match) {
        const short = `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}`;
        const found = availableDates.find((item) => item.date === short);
        if (found) {
          setSelectedDate(`${found.label} (${found.date})`);
        } else {
          setSelectedDate(dateStr);
        }
      } else {
        setSelectedDate(dateStr);
      }
      setDateError(null);
    }
    handleTabChange('booking');
    setShowBookingPopup(true);
  };

  // Sports Data Definitions
  const sportsData = {
    badminton: {
      id: 'badminton',
      name: 'Cầu Lông',
      badge: 'CẦU LÔNG',
      tagline: 'THI ĐẤU QUỐC TẾ',
      title: 'Tổ hợp 5 sân Cầu Lông (CL-01 -> CL-05)',
      description: 'Mặt thảm BWF tiêu chuẩn 4.5mm chống trượt, hệ thống đèn chiếu sáng chống chói Lux LED 1000+, trần cao 11m.',
      specs: ['MẶT THẢM BWF', 'CHỐNG CHÓI', 'CHUẨN 4.5MM'],
      pricePerHour: 120000,
      priceLabel: '120.000đ / GIỜ',
      image: '/images/badminton.jpg',
      icon: ShuttlecockIcon,
      courts: ['Sân CL-01', 'Sân CL-02', 'Sân CL-03', 'Sân CL-04', 'Sân CL-05'],
    },
    football: {
      id: 'football',
      name: 'Bóng Đá',
      badge: 'BÓNG ĐÁ',
      tagline: 'SÂN CỎ NHÂN TẠO',
      title: '4 Sân Bóng Đá Mini (BD-01 -> BD-04)',
      description: 'Sân bóng đá cỏ nhân tạo đạt chuẩn thi đấu mini 5 - 7 người, hệ thống đèn LED chuyên nghiệp, bóng thi đấu đạt chuẩn.',
      specs: ['SÂN 5 - 7 NGƯỜI', 'ĐÈN LUX 1000', 'CỎ NHÂN TẠO'],
      pricePerHour: 200000,
      priceLabel: '200.000đ / GIỜ',
      image: '/images/hero_arena.jpg',
      icon: FootballIcon,
      courts: ['Sân BD-01', 'Sân BD-02', 'Sân BD-03', 'Sân BD-04'],
    },
    volleyball: {
      id: 'volleyball',
      name: 'Bóng Chuyền',
      badge: 'BÓNG CHUYỀN',
      tagline: 'TRONG NHÀ CAO CẤP',
      title: '5 Sân Bóng Chuyền (BC-01 -> BC-05)',
      description: 'Sân bóng chuyền trong nhà mái che cao 12m, thảm thi đấu Taraflex xịn, trụ và lưới căng chuẩn FIVB thi đấu.',
      specs: ['THẢM TARAFLEX', 'MÁI CHE 12M', 'ĐÈN LUX 1000'],
      pricePerHour: 150000,
      priceLabel: '150.000đ / GIỜ',
      image: '/images/volleyball.jpg',
      icon: VolleyballIcon,
      courts: ['Sân BC-01', 'Sân BC-02', 'Sân BC-03', 'Sân BC-04', 'Sân BC-05'],
    },
  };

  const currentSport = selectedSportId ? sportsData[selectedSportId] : null;


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

    // Save to shared booking requests for Admin
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const randomCode = `YC-SK-${Date.now().toString().slice(-4)}`;

    addBookingRequest({
      id: `REQ-${Date.now()}`,
      code: randomCode,
      customerName: eventOrgName.trim(),
      phone: eventPhone.trim(),
      customerType: 'event_series',
      customerTypeLabel: `Sự kiện (${eventDays} Ngày)`,
      sport: eventSport === 'all_arena' ? 'football' : (eventSport as any),
      sportLabel: eventSport === 'all_arena' ? 'Bao trọn 8 ô sàn' : sportsData[eventSport as keyof typeof sportsData]?.name || 'Đa môn',
      courtDetails: eventSport === 'all_arena' ? 'Toàn bộ 8 ô sàn' : eventSport === 'badminton' ? `${eventCourtCount} Sân` : 'Cụm sân tiêu chuẩn',
      preferredSchedule: eventStartDate.trim() || `${eventDays} ngày liên tiếp`,
      preferredTime: eventTimeSlot === 'morning' ? '08:00 - 11:00 (Sáng)' : eventTimeSlot === 'afternoon' ? '14:00 - 17:00 (Chiều)' : eventTimeSlot === 'evening' ? '18:00 - 21:00 (Tối)' : '08:00 - 17:00 (Cả ngày)',
      eventDays: eventDays,
      source: 'website',
      sourceLabel: 'Từ Website',
      notes: eventNotes.trim() || `Khách gửi yêu cầu chuỗi sự kiện ${eventDays} ngày từ Trang chủ.`,
      totalPrice: eventBasePrice,
      discountPercent: eventDiscountPercent,
      discountAmount: eventDiscountAmount,
      finalPrice: eventFinalPrice,
      paymentMode: 'full_100',
      paymentModeLabel: 'Thanh toán đủ 100% qua VietQR',
      paidAmount: 0,
      remainingDue: eventFinalPrice,
      paymentStatus: 'unpaid',
      paymentStatusLabel: 'Chưa đóng',
      status: 'pending',
      statusLabel: 'Chờ liên hệ',
      createdAt: dateStr,
      contactLogs: []
    });

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

  const daysOfWeekVi = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  // Dynamically generate 21 consecutive days from base date (29/10/2026)
  const availableDates = useMemo(() => {
    const list = [];
    const base = new Date(2026, 9, 29); // 29/10/2026
    for (let i = 0; i < 21; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const dow = d.getDay();
      const label = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : daysOfWeekVi[dow];
      const shortDate = `${day}/${month}`;
      list.push({
        label,
        date: shortDate,
      });
    }
    return list;
  }, []);

  const scheduleDateObj = useMemo(() => {
    if (!selectedDate) return new Date(2026, 9, 29);
    const fullMatch = selectedDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (fullMatch) {
      return new Date(parseInt(fullMatch[3], 10), parseInt(fullMatch[2], 10) - 1, parseInt(fullMatch[1], 10));
    }
    const match = selectedDate.match(/(\d{1,2})\/(\d{1,2})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const year = month < 9 ? 2027 : 2026;
      return new Date(year, month, day);
    }
    return new Date(2026, 9, 29);
  }, [selectedDate]);


  // --- INTERACTIVE MONTHLY CALENDAR DROPDOWN ---
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(2026, 9, 1)); // Oct 2026

  useEffect(() => {
    if (isDatePickerOpen) {
      setCalendarMonth(new Date(scheduleDateObj.getFullYear(), scheduleDateObj.getMonth(), 1));
    }
  }, [isDatePickerOpen, scheduleDateObj]);

  const handlePrevMonth = () => {
    const todayBase = new Date(2026, 9, 1);
    const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    if (prev.getTime() < todayBase.getTime()) {
      showAlert('Thông báo', 'Không thể xem lịch cho các tháng trước tháng hiện tại!');
      return;
    }
    setCalendarMonth(prev);
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0-indexed
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Convert to Mon = 0, ..., Sun = 6
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; 
    
    // Total days in current month
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      days.push({
        dayNumber: d,
        month: month - 1,
        year: year,
        dateObj: new Date(year, month - 1, d),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        dayNumber: i,
        month: month,
        year: year,
        dateObj: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }
    
    // Next month leading days to complete full rows (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        month: month + 1,
        year: year,
        dateObj: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }
    
    return days;
  }, [calendarMonth]);

  const handleSelectCalendarDay = (targetDate: Date) => {
    const baseToday = new Date(2026, 9, 29); // 29/10/2026
    baseToday.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    if (target.getTime() < baseToday.getTime()) {
      showAlert('Thông báo', 'Không thể chọn ngày trong quá khứ!');
      return;
    }

    const y = target.getFullYear();
    const m = target.getMonth() + 1;
    const day = target.getDate();
    const dow = target.getDay();

    const isToday = y === 2026 && m === 10 && day === 29;
    const isTomorrow = y === 2026 && m === 10 && day === 30;

    const dayStr = day.toString().padStart(2, '0');
    const monthStr = m.toString().padStart(2, '0');
    const label = isToday ? 'Hôm nay' : isTomorrow ? 'Ngày mai' : daysOfWeekVi[dow];

    setSelectedDate(`${label} (${dayStr}/${monthStr})`);
    setIsDatePickerOpen(false);
  };


  // Operating timeline list of start time options: 05:00 to 22:30 (30-minute intervals)
  const START_TIME_OPTIONS = useMemo(() => {
    const list: string[] = [];
    for (let h = 5; h <= 22; h++) {
      list.push(`${h.toString().padStart(2, '0')}:00`);
      list.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return list;
  }, []);

  const getAvailableDurations = (startTimeStr: string) => {
    const possibleDurations = [30, 60, 90, 120, 150, 180, 210, 240];
    if (!startTimeStr) return possibleDurations;

    const startMinutes = parseTimeToMinutes(startTimeStr);
    const closingTimeMinutes = 23 * 60;
    return possibleDurations.filter(duration => startMinutes + duration <= closingTimeMinutes);
  };

  useEffect(() => {
    if (selectedCourt && currentSport && !currentSport.courts.includes(selectedCourt)) {
      setSelectedCourt('');
      setSelectedStartTime('');
    }
  }, [selectedSportId, currentSport, selectedCourt]);

  const availableDurations = getAvailableDurations(selectedStartTime);

  const getEndTime = (start: string, durationMins: number) => {
    if (!start) return '';
    const totalMins = parseTimeToMinutes(start) + durationMins;
    return formatMinutesToTime(totalMins);
  };

  const selectedEndTime = selectedStartTime ? getEndTime(selectedStartTime, selectedDuration) : '';

  // End time dropdown options based on selectedStartTime
  const endTimeOptions = useMemo(() => {
    if (!selectedStartTime) return [];
    const startMins = parseTimeToMinutes(selectedStartTime);
    const maxEndMins = Math.min(23 * 60, startMins + 240); // Max 4 hours or closing 23:00
    const list: string[] = [];
    for (let m = startMins + 30; m <= maxEndMins; m += 30) {
      list.push(formatMinutesToTime(m));
    }
    return list;
  }, [selectedStartTime]);

  const handleStartTimeChange = (newStart: string) => {
    setSelectedStartTime(newStart);
    const newStartMins = parseTimeToMinutes(newStart);
    if (newStartMins + selectedDuration > 23 * 60) {
      const maxPossibleDur = Math.max(30, 23 * 60 - newStartMins);
      setSelectedDuration(maxPossibleDur);
    }
  };

  const handleEndTimeChange = (newEnd: string) => {
    if (!selectedStartTime) return;
    const startMins = parseTimeToMinutes(selectedStartTime);
    const endMins = parseTimeToMinutes(newEnd);
    if (endMins > startMins) {
      setSelectedDuration(endMins - startMins);
    }
  };

  const handleDurationChange = (newDur: number) => {
    setSelectedDuration(newDur);
  };

  // Real-time Booking Conflict Detection:
  const conflictBooking = useMemo(() => {
    if (!selectedCourt || !selectedStartTime || !selectedDuration) return null;
    const reqStart = parseTimeToMinutes(selectedStartTime);
    const reqEnd = reqStart + selectedDuration;

    return STANDARD_15_BOOKINGS.find((b) => {
      const isSameCourt = 
        b.courtName === selectedCourt || 
        b.courtCode === selectedCourt || 
        selectedCourt.includes(b.courtCode);
      if (!isSameCourt) return false;

      const bStart = b.startH * 60 + b.startM;
      const bEnd = b.endH * 60 + b.endM;

      // Overlap condition: Math.max(start1, start2) < Math.min(end1, end2)
      return Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd);
    });
  }, [selectedCourt, selectedStartTime, selectedDuration]);

  // Price Calculation
  const durationHours = selectedDuration / 60;
  const totalPrice = currentSport ? Math.round(currentSport.pricePerHour * durationHours) : 0;
  const formattedPrice = totalPrice.toLocaleString('vi-VN') + 'đ';
  const selectedSlot = selectedStartTime ? `${selectedStartTime} - ${selectedEndTime}` : 'Chưa chọn giờ';

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
    if (conflictBooking) {
      showAlert(
        'Khung giờ bị trùng lịch!',
        `Khung giờ ${selectedStartTime} - ${selectedEndTime} trên ${selectedCourt} đã bị trùng với lịch đã đặt (${conflictBooking.title || 'Đã đặt'}).\n\nVui lòng chọn khung giờ khác để tiếp tục đặt sân!`
      );
      return;
    }
    if (!getAvailableDurations(selectedStartTime).includes(selectedDuration)) {
      showAlert('Thời lượng không hợp lệ', 'Vui lòng chọn thời lượng kết thúc trước 23:00!');
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
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setBookingOtp(newOtp);
    setOtpAction('booking');
    setShowBookingPopup(false);
    setOtpInput('');
    setOtpError(false);
    setSmsToast(null);
    setShowOTP(true);
  };

  const handleVerifyOTP = () => {
    if (otpInput === '123456' || otpInput === bookingOtp) {
      setShowOTP(false);
      setOtpInput('');
      setOtpError(false);

      if (otpAction === 'booking') {
        setShowPayment(true);
        return;
      }

      showAlert('Đã gửi yêu cầu hoàn tiền', 'Hệ thống đã tiếp nhận yêu cầu hủy vé.\n\nVui lòng đợi xử lý trong vòng 24h và kiểm tra trạng thái hoàn tiền tại mục Tra cứu thông tin đặt sân.');
      setLookupResult((prev: any) => prev ? { ...prev, status: 'ĐÃ HỦY', paymentStatus: 'ĐANG XỬ LÝ HOÀN TIỀN' } : null);
    } else {
      setOtpError(true);
    }
  };

  const simulatePaymentSuccess = () => {
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

  if (isVipLoggedIn) {
    return <VipCustomerDashboard onLogout={() => setIsVipLoggedIn(false)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* 🟢 TOP HEADER BAR (WHITE & GREEN) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between">
          <div onClick={() => handleTabChange('booking')} className="flex items-center gap-3 cursor-pointer select-none">
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
              className={`flex h-9 px-3 items-center gap-1.5 rounded-full border text-xs font-bold transition active:scale-95 ${
                activeTab === 'lookup'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-emerald-500 hover:text-emerald-600'
              }`}
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

      {/* ⚪ TAB ĐẶT SÂN */}
      {activeTab === 'booking' && (
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
              onClick={() => scrollToBooking()}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 hover:bg-emerald-600 cursor-pointer"
            >
              <Zap className='w-4 h-4' /> ĐẶT SÂN NGAY
            </button>
            <button
              type="button"
              onClick={scrollToFacility}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-800 shadow-xs transition active:scale-95 hover:bg-slate-50 cursor-pointer"
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
        <section ref={facilityRef} id="facility-section" className="scroll-mt-16 space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                ● MẶT BẰNG & TRANG THIẾT BỊ
              </p>
              <h2 className="mt-0.5 text-xl font-black text-slate-900">TỔ HỢP 3 MÔN CHUẨN ĐẤU</h2>
            </div>
            <button
              type="button"
              onClick={() => scrollToBooking()}
              className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
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
                      onClick={() => scrollToBooking(sport.id as any)}
                      className="rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-600 active:scale-95 cursor-pointer"
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

          {/* ⚡ BƯỚC 1: CHỌN MÔN ĐẶT SÂN */}
          {/* ⚡ BƯỚC 1: CHỌN MÔN THỂ THAO & NIÊM YẾT GIÁ */}
          <div id="step-1-sport-section" className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs scroll-mt-20">
            {/* Header: 1 CHỌN MÔN ĐẶT SÂN & NIÊM YẾT CHÍNH THỨC */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white shrink-0">1</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                  CHỌN MÔN ĐẶT SÂN
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-200">
                  NIÊM YẾT CHÍNH THỨC
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                  05:00 – 23:00
                </span>
              </div>
            </div>

            {sportError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs font-bold text-red-600 flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{sportError}</span>
              </div>
            )}

            {/* Bảng chọn 3 môn thể thao & giá niêm yết */}
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
              {/* Cầu Lông */}
              <div 
                onClick={() => {
                  setSelectedSportId('badminton');
                  setSportError(null);
                }}
                className={`p-3 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedSportId === 'badminton' 
                    ? 'bg-emerald-50/90 border-l-4 border-l-emerald-600 shadow-2xs' 
                    : 'hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition ${
                    selectedSportId === 'badminton' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <ShuttlecockIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">Cầu Lông</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">5 sân</span>
                      {selectedSportId === 'badminton' && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> ĐÃ CHỌN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-emerald-600">120.000đ</div>
                  <div className="text-[10px] font-semibold text-slate-400">/ giờ / sân</div>
                </div>
              </div>

              {/* Bóng Chuyền */}
              <div 
                onClick={() => {
                  setSelectedSportId('volleyball');
                  setSportError(null);
                }}
                className={`p-3 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedSportId === 'volleyball' 
                    ? 'bg-emerald-50/90 border-l-4 border-l-emerald-600 shadow-2xs' 
                    : 'hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition ${
                    selectedSportId === 'volleyball' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <VolleyballIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">Bóng Chuyền</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">5 sân</span>
                      {selectedSportId === 'volleyball' && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> ĐÃ CHỌN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-emerald-600">150.000đ</div>
                  <div className="text-[10px] font-semibold text-slate-400">/ giờ / sân</div>
                </div>
              </div>

              {/* Bóng Đá Mini */}
              <div 
                onClick={() => {
                  setSelectedSportId('football');
                  setSportError(null);
                }}
                className={`p-3 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedSportId === 'football' 
                    ? 'bg-emerald-50/90 border-l-4 border-l-emerald-600 shadow-2xs' 
                    : 'hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition ${
                    selectedSportId === 'football' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <FootballIcon />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900">Bóng Đá Mini</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">4 sân</span>
                      {selectedSportId === 'football' && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black text-white flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> ĐÃ CHỌN
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-emerald-600">200.000đ</div>
                  <div className="text-[10px] font-semibold text-slate-400">/ giờ / sân</div>
                </div>
              </div>
            </div>

            {/* Note bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>⚡ Đơn giá cố định, không phụ thu cuối tuần</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% VietQR
              </span>
            </div>
          </div>

          {/* ⚡ BƯỚC 2: CHỌN NGÀY THI ĐẤU */}
          <div 
            id="step-2-date-section"
            className={`rounded-2xl bg-white p-4 space-y-3.5 shadow-xs transition-all ${
              dateError ? 'border-2 border-rose-500 ring-4 ring-rose-100 shadow-md' : 'border border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black text-white ${
                  dateError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
                }`}>2</span>
                <h3 className={`text-sm font-black uppercase tracking-wider ${
                  dateError ? 'text-rose-600' : 'text-slate-900'
                }`}>CHỌN NGÀY THI ĐẤU</h3>
              </div>

              {/* Interactive Calendar Picker Button */}
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition active:scale-95 shadow-2xs cursor-pointer ${
                  isDatePickerOpen
                    ? 'border-emerald-600 bg-emerald-600 text-white font-black'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-black hover:bg-emerald-100'
                }`}
                title="Bấm để xổ lịch chọn ngày"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{isDatePickerOpen ? 'Đóng lịch' : 'Chọn ngày khác'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDatePickerOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Red Warning Banner when customer clicks schedule without picking a date first */}
            {dateError && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs font-black text-rose-700 flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}

            {/* 📅 CALENDAR DROPDOWN: XỔ RA BẢNG LỊCH THÁNG TRỰC QUAN ĐỂ CHỌN */}
            {isDatePickerOpen && (
              <div className="rounded-2xl border-2 border-emerald-400 bg-white p-3.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
                {/* Month & Year header */}
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

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {calendarDays.map((item, idx) => {
                    const itemTime = new Date(item.dateObj.getFullYear(), item.dateObj.getMonth(), item.dateObj.getDate()).getTime();
                    const baseTime = new Date(2026, 9, 29).getTime(); // 29/10/2026
                    const isPast = itemTime < baseTime;
                    const isSelected = Boolean(selectedDate) && 
                                       scheduleDateObj.getFullYear() === item.dateObj.getFullYear() &&
                                       scheduleDateObj.getMonth() === item.dateObj.getMonth() &&
                                       scheduleDateObj.getDate() === item.dateObj.getDate();
                    const isToday = item.dateObj.getFullYear() === 2026 && item.dateObj.getMonth() === 9 && item.dateObj.getDate() === 29;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isPast}
                        onClick={() => handleSelectCalendarDay(item.dateObj)}
                        className={[
                          'h-9 w-full rounded-xl flex flex-col items-center justify-center font-bold transition text-xs relative',
                          !item.isCurrentMonth ? 'text-slate-300' : 'text-slate-800',
                          isPast ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-emerald-50 hover:text-emerald-800 active:scale-95',
                          isSelected ? 'bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-sm shadow-emerald-600/30 ring-2 ring-emerald-300' : '',
                          isToday && !isSelected ? 'border border-emerald-500 text-emerald-700 font-black' : ''
                        ].filter(Boolean).join(' ')}
                      >
                        <span>{item.dayNumber}</span>
                        {isToday && !isSelected && (
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
                      setSelectedDate('Hôm nay (29/10)');
                      setDateError(null);
                      setIsDatePickerOpen(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer text-[11px]"
                  >
                    Hôm nay (29/10)
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

            {/* Quick Date Pills: 21 Days Horizon */}
            <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
              {/* If user picked a custom date that's not in the 21 days */}
              {selectedDate && !availableDates.some((item) => `${item.label} (${item.date})` === selectedDate) && (
                <button
                  type="button"
                  className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-4 py-2.5 border-2 border-emerald-600 bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/25 ring-2 ring-emerald-300/50"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">⭐ Đã chọn</span>
                  <span className="text-xs font-black mt-0.5">{selectedDate}</span>
                </button>
              )}

              {availableDates.map((item) => {
                const fullDateStr = `${item.label} (${item.date})`;
                const isSelected = Boolean(selectedDate) && selectedDate === fullDateStr;

                return (
                  <button
                    key={item.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(fullDateStr);
                      setDateError(null);
                    }}
                    className={[
                      'flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-4 py-2.5 border transition active:scale-95 cursor-pointer',
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500 text-white font-black shadow-md shadow-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {item.label}
                    </span>
                    <span className="text-xs font-black mt-0.5">{item.date}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ⚡ BƯỚC 3: LỊCH SÂN TRỰC QUAN REAL-TIME */}
          <div id="booking-schedule-section" className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-xs scroll-mt-20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">3</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">LỊCH SÂN TRỰC QUAN REAL-TIME</h3>
              </div>
            </div>

            {/* Embedded Visual Interactive Schedule Grid */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
              <CustomerSchedule
                initialSport={selectedSportId || 'all'}
                initialDate={scheduleDateObj}
                selectedCourtName={selectedCourt}
                selectedTimeStr={selectedStartTime}
                selectedDurationMinutes={selectedDuration}
                hideHeaderControls={true}
                isInlineBookingMode={true}
                onSelectSlot={(sportId, courtName, time, dateStr) => {
                  handleSelectSlotFromSchedule(sportId, courtName, time, dateStr);
                }}
              />
            </div>

            {/* Slot Selection Feedback Card */}
            {selectedCourt && selectedStartTime && currentSport ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-emerald-950 uppercase">{selectedCourt}</span>
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {selectedStartTime} - {getEndTime(selectedStartTime, selectedDuration)}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {currentSport.name} • {selectedDuration === 30 ? '30 phút' : `${durationHours} tiếng`} • {formattedPrice}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBookingPopup(true)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-2 active:scale-95 transition cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                >
                  Mở màn hình đặt sân <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-3 text-center text-xs text-amber-800 animate-pulse">
                <p className="font-bold">👆 Quý khách vui lòng chạm vào một ô giờ còn trống (màu vàng) trên bảng lịch ở trên để bắt đầu đặt sân.</p>
              </div>
            )}
          </div>
        </section>


        {/* ======================================================== */}
        {/* 4. THÔNG TIN LIÊN HỆ & VỊ TRÍ                           */}
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

      {/* 🔍 TAB TRA CỨU THÔNG TIN ĐẶT SÂN */}
      {activeTab === 'lookup' && (
        <main className="flex-1 space-y-6 p-4 pb-28 animate-in fade-in duration-200">
          <section ref={lookupRef} className="space-y-4">
            <div className="flex items-center justify-between">
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
              <button
                type="button"
                onClick={() => scrollToBooking()}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 active:scale-95 transition shrink-0 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
              >
                <span>Đặt sân</span> →
              </button>
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
                className="rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-600 transition shadow-sm active:scale-95 cursor-pointer"
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

          {/* Chính sách hủy vé & hoàn tiền 100% VietQR */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5 text-xs shadow-xs">
            <h3 className="font-black text-slate-900 uppercase text-[11px] tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" /> CHÍNH SÁCH HỦY VÉ & HOÀN TIỀN
            </h3>
            <ul className="space-y-1.5 text-slate-600 text-[11px]">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Hủy trước 24 giờ:</strong> Hoàn tiền 100% tự động qua VietQR.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">⚠</span>
                <span><strong>Hủy trong vòng 24 giờ trước giờ đá:</strong> Không áp dụng chính sách hoàn phí.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Hỗ trợ kỹ thuật / thắc mắc:</strong> Liên hệ hotline 0912 345 678 để được giải quyết nhanh nhất.</span>
              </li>
            </ul>
          </section>

          {/* Section Liên hệ */}
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

      {/* 🟢 FLOATING BUBBLE: XEM LỊCH SÂN NGAY TRÊN TRANG ĐẶT SÂN */}
      {activeTab === 'booking' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-40 px-4 flex justify-end animate-in fade-in zoom-in-95 duration-300">
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('booking-schedule-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                setShowScheduleModal(true);
              }
            }}
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
              {/* Select Event Sport & Duration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Môn hoặc Toàn sàn
                  </label>
                  <select
                    value={eventSport}
                    onChange={(e) => setEventSport(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="badminton">Cầu Lông</option>
                    <option value="volleyball">Bóng Chuyền</option>
                    <option value="football">Bóng Đá Mini</option>
                    <option value="all_arena">Bao trọn 8 ô sàn</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Số ngày liên tiếp
                  </label>
                  <select
                    value={eventDays}
                    onChange={(e) => setEventDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value={7}>7 ngày (1 tuần)</option>
                    <option value={10}>10 ngày</option>
                    <option value={14}>14 ngày (2 tuần)</option>
                    <option value={21}>21 ngày (3 tuần)</option>
                    <option value={30}>30 ngày (1 tháng)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Khung giờ mỗi ngày
                  </label>
                  <select
                    value={eventTimeSlot}
                    onChange={(e) => setEventTimeSlot(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="morning">Sáng 08:00 - 11:00 (-5%)</option>
                    <option value="afternoon">Chiều 14:00 - 17:00 (-5%)</option>
                    <option value="evening">Tối 18:00 - 21:00 (Giờ vàng)</option>
                    <option value="fullday">Cả ngày 08:00 - 17:00 (-10%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Số sân (nếu Cầu Lông)
                  </label>
                  <select
                    value={eventCourtCount}
                    onChange={(e) => setEventCourtCount(Number(e.target.value))}
                    disabled={eventSport !== 'badminton'}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition disabled:opacity-50"
                  >
                    <option value={1}>1 sân cơ sở</option>
                    <option value={2}>2 sân</option>
                    <option value={4}>4 sân</option>
                    <option value={6}>6 sân</option>
                  </select>
                </div>
              </div>

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
                ℹ️ <strong>Quy trình xử lý sự kiện:</strong> Vì thuê dồn dập {eventDays} ngày liên tiếp có thể trùng một vài ô sân lẻ đã có khách đặt trước, điều phối viên sẽ kiểm tra sơ đồ sàn trên hệ thống và gọi lại cho quý khách trong vòng 15 phút để chốt cụm sân và hướng dẫn thanh toán đủ 100% qua VietQR.
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
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Mã mẫu thử nghiệm: <span className="font-mono font-bold text-emerald-600">{bookingOtp}</span> hoặc <span className="font-mono font-bold text-emerald-600">123456</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOTP(false);
                    if (otpAction === 'booking') setShowBookingPopup(true);
                  }}
                  className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  className="rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      
      
      {/* 🟢 SMS TOAST PUSH NOTIFICATION */}
      {smsToast && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[200] w-[94%] max-w-md animate-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div 
            onClick={() => {
              if (smsToast.otp && forgotStep === 'otp') {
                setForgotOtpInput(smsToast.otp);
                setForgotError(null);
              }
            }}
            className="flex items-start gap-3 rounded-2xl bg-slate-900/95 text-white p-3.5 shadow-2xl border border-slate-700/80 backdrop-blur-md cursor-pointer hover:bg-slate-900 transition"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wide flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  TIN NHẮN SMS • {smsToast.sender}
                </span>
                <span className="text-[10px] text-slate-400">Vừa xong</span>
              </div>
              <p className="mt-1 text-xs text-slate-200 leading-snug font-medium">
                {smsToast.message}
              </p>
              {smsToast.otp && forgotStep === 'otp' && (
                <p className="mt-1.5 text-[11px] font-bold text-emerald-300">
                  👉 Chạm vào đây để tự động điền mã OTP ({smsToast.otp})
                </p>
              )}
            </div>
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                setSmsToast(null);
              }}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
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
            {loginView === 'login' ? (
              <>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                  ĐĂNG NHẬP HỆ THỐNG
                </h2>
                
                {/* Banner */}
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex h-10 w-12 items-center justify-center rounded-xl bg-slate-900 text-white flex-shrink-0">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cổng đăng nhập hệ thống</p>
                    <p className="text-[11px] text-slate-500">Đăng nhập bằng Tên tài khoản hoặc Số điện thoại</p>
                  </div>
                </div>

                {/* Form Card */}
                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="space-y-4">
                    {/* Username or Phone */}
                    <div>
                      <label className="mb-1.5 block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Tài khoản hoặc Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Nhập số điện thoại hoặc tên tài khoản" 
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
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me & Forgot Password link */}
                    <div className="flex items-center justify-between pt-2 pb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-white flex-shrink-0">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Ghi nhớ đăng nhập</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginView('forgot_password');
                          setForgotStep('account');
                          setForgotError(null);
                          setForgotAccountInput(username || '');
                        }}
                        className="text-xs font-black text-emerald-600 hover:text-emerald-700 hover:underline transition cursor-pointer"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button 
                      type="button" 
                      onClick={() => {
                        const rawUser = username.trim().toLowerCase();
                        const phoneClean = username.trim().replace(/\s+/g, '');
                        // Match key or phone in accountCredentials
                        const targetKey = Object.keys(accountCredentials).find(
                          (k) =>
                            k.toLowerCase() === rawUser ||
                            accountCredentials[k].phone.replace(/\s+/g, '') === phoneClean
                        );
                        const targetAcc = targetKey ? accountCredentials[targetKey] : null;

                        // Match admin
                        if (
                          (rawUser === 'admin' && (passwordInput === 'admin' || (targetAcc && passwordInput === targetAcc.password))) ||
                          (targetAcc && targetAcc.role === 'admin' && passwordInput === targetAcc.password)
                        ) {
                          setIsAdminLoggedIn(true);
                          setShowLogin(false);
                          setUsername('');
                          setPasswordInput('');
                        } else if (
                          (rawUser === 'nhanvien' && (passwordInput === 'nhanvien' || (targetAcc && passwordInput === targetAcc.password))) ||
                          (targetAcc && targetAcc.role === 'employee' && passwordInput === targetAcc.password)
                        ) {
                          setIsEmployeeLoggedIn(true);
                          setShowLogin(false);
                          setUsername('');
                          setPasswordInput('');
                        } else if (
                          ((rawUser === 'vip' || rawUser === 'khachvip') && (passwordInput === 'vip' || passwordInput === '123456' || (targetAcc && passwordInput === targetAcc.password))) ||
                          (targetAcc && targetAcc.role === 'vip' && passwordInput === targetAcc.password)
                        ) {
                          setIsVipLoggedIn(true);
                          setShowLogin(false);
                          setUsername('');
                          setPasswordInput('');
                        } else {
                          showAlert('Sai thông tin đăng nhập', 'Tên tài khoản / số điện thoại hoặc mật khẩu không chính xác!\n\nNếu bạn vừa nhận mật khẩu mới qua SMS, hãy nhập số điện thoại và mật khẩu vừa nhận để đăng nhập.\nHoặc nhấn "Quên mật khẩu?" để hệ thống gửi lại mã OTP.');
                        }
                      }}
                      className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 active:scale-95 cursor-pointer"
                    >
                      ĐĂNG NHẬP HỆ THỐNG <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* 🟣 FORGOT PASSWORD WORKFLOW */
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Back to Login link */}
                <button
                  type="button"
                  onClick={() => {
                    setLoginView('login');
                    setForgotError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
                </button>

                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                    QUÊN MẬT KHẨU
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Khôi phục mật khẩu tài khoản CourtX an toàn và nhanh chóng qua mã OTP.
                  </p>
                </div>

                {/* Steps Indicator */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  <div className={`flex flex-col gap-1 text-center border-b-2 pb-1.5 transition ${forgotStep === 'account' ? 'border-emerald-600 text-emerald-800' : 'border-slate-200 text-slate-400'}`}>
                    <span className="text-[10px] font-black uppercase">1. Số điện thoại</span>
                  </div>
                  <div className={`flex flex-col gap-1 text-center border-b-2 pb-1.5 transition ${forgotStep === 'otp' ? 'border-emerald-600 text-emerald-800' : 'border-slate-200 text-slate-400'}`}>
                    <span className="text-[10px] font-black uppercase">2. Mã OTP</span>
                  </div>
                  <div className={`flex flex-col gap-1 text-center border-b-2 pb-1.5 transition ${forgotStep === 'success' ? 'border-emerald-600 text-emerald-800' : 'border-slate-200 text-slate-400'}`}>
                    <span className="text-[10px] font-black uppercase">3. Nhận mật khẩu</span>
                  </div>
                </div>

                {/* Error Banner */}
                {forgotError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 animate-in fade-in">
                    {forgotError}
                  </div>
                )}

                {/* STEP 1: PHONE NUMBER */}
                {forgotStep === 'account' && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <p className="text-xs font-bold text-slate-700">
                      Nhập số điện thoại đã đăng ký để nhận mã OTP và mật khẩu mới qua SMS:
                    </p>

                    <div>
                      <label className="mb-1.5 block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Số điện thoại đăng ký <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                          <Phone className="w-5 h-5" />
                        </div>
                        <input
                          type="tel"
                          placeholder="Ví dụ: 0912345678"
                          value={forgotAccountInput}
                          onChange={(e) => {
                            setForgotAccountInput(e.target.value);
                            setForgotError(null);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition"
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-slate-400 font-medium leading-relaxed">
                        Hệ thống sẽ gửi mã xác thực 6 số qua tin nhắn SMS tới số điện thoại này.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendForgotOtp()}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition cursor-pointer"
                    >
                      Tiếp tục & Gửi mã OTP qua SMS <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                )}

                {/* STEP 2: VERIFY OTP */}
                {forgotStep === 'otp' && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    {/* Header info */}
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3.5 flex items-center justify-between text-xs font-bold text-emerald-900">
                      <div>
                        <span className="text-[10px] text-emerald-600 uppercase block font-black">Khôi phục tài khoản:</span>
                        <span>{accountCredentials[matchedAccountKey]?.name || matchedAccountKey}</span>
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-emerald-200/70 text-emerald-900 font-black">
                        {accountCredentials[matchedAccountKey]?.phone || forgotAccountInput}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Mã xác thực OTP gồm 6 chữ số đã được gửi qua tin nhắn SMS tới số điện thoại{' '}
                      <strong className="text-slate-900 font-black">{accountCredentials[matchedAccountKey]?.phone || forgotAccountInput}</strong>.
                      Vui lòng kiểm tra tin nhắn và nhập mã xác thực bên dưới:
                    </p>

                    {/* OTP Input */}
                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700 uppercase tracking-wider text-center">
                        Nhập mã xác thực 6 số (OTP) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="••••••"
                        value={forgotOtpInput}
                        onChange={(e) => {
                          setForgotOtpInput(e.target.value.replace(/\D/g, ''));
                          setForgotError(null);
                        }}
                        className="w-full text-center text-3xl font-mono font-black tracking-[0.4em] rounded-2xl border border-slate-200 bg-slate-50 py-3.5 text-slate-900 placeholder-slate-300 outline-none focus:border-emerald-500 focus:bg-white transition"
                      />
                    </div>

                    {/* Countdown / Resend */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      {forgotOtpCountdown > 0 ? (
                        <span className="text-slate-400 font-medium">
                          Gửi lại mã sau: <span className="font-black text-slate-700">{forgotOtpCountdown}s</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
                            setGeneratedOtp(newOtp);
                            setForgotOtpCountdown(60);
                            setForgotError(null);
                            const phone = accountCredentials[matchedAccountKey]?.phone || forgotAccountInput;
                            setSmsToast({
                              sender: 'COURTX-OTP',
                              phone: phone,
                              message: `Mã OTP xác thực mới của quý khách là: ${newOtp} (hiệu lực 60s). Tuyệt đối không chia sẻ mã này.`,
                              otp: newOtp,
                            });
                          }}
                          className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Gửi lại mã OTP qua SMS
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setForgotStep('account');
                          setForgotError(null);
                        }}
                        className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                      >
                        Đổi số điện thoại khác
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyForgotOtp}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition cursor-pointer"
                    >
                      Xác nhận mã OTP & Nhận mật khẩu mới <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                )}

                {/* STEP 3: SUCCESS VIEW - RECEIVED NEW PASSWORD VIA SMS */}
                {forgotStep === 'success' && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4 animate-in zoom-in-95">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-300">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase">
                        Mật khẩu mới đã được gửi về SMS!
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
                        Hệ thống đã tạo và gửi mật khẩu mới qua tin nhắn SMS tới số điện thoại{' '}
                        <strong className="text-emerald-700 font-black">{accountCredentials[matchedAccountKey]?.phone || forgotAccountInput}</strong>.
                      </p>
                    </div>

                    {/* New Password Card */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2.5">
                      <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Tài khoản:</span>
                        <span className="font-black text-slate-800">{accountCredentials[matchedAccountKey]?.name || matchedAccountKey}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
                        <span className="text-slate-500 font-medium">Số điện thoại:</span>
                        <span className="font-mono font-bold text-slate-700">{accountCredentials[matchedAccountKey]?.phone || forgotAccountInput}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">MẬT KHẨU MỚI:</span>
                          <span className="font-mono font-black text-base text-emerald-700 tracking-wider">
                            {generatedNewPassword || forgotNewPassword}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedNewPassword || forgotNewPassword);
                            setCopiedPassword(true);
                            setTimeout(() => setCopiedPassword(false), 2000);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                        >
                          {copiedPassword ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã sao chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Option to customize password */}
                    {!showCustomPasswordForm ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomPasswordForm(true)}
                        className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer block mx-auto"
                      >
                        ✏️ Bạn muốn tự đổi mật khẩu theo ý muốn?
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-left space-y-2 animate-in fade-in">
                        <span className="text-xs font-black text-slate-800 block">Đặt mật khẩu tùy chỉnh của bạn:</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nhập mật khẩu mới (>= 6 ký tự)"
                            value={customPasswordInput}
                            onChange={(e) => setCustomPasswordInput(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600"
                          />
                          <button
                            type="button"
                            onClick={handleSaveCustomPassword}
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 text-xs font-black active:scale-95 transition cursor-pointer"
                          >
                            Lưu
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-800 text-left font-medium leading-relaxed">
                      💡 <strong>Lưu ý:</strong> Vui lòng ghi nhớ mật khẩu trên hoặc kiểm tra tin nhắn SMS để sử dụng cho các lần đăng nhập tiếp theo.
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginView('login');
                        setUsername(accountCredentials[matchedAccountKey]?.phone || matchedAccountKey);
                        setPasswordInput(generatedNewPassword || forgotNewPassword);
                        setForgotStep('account');
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition cursor-pointer"
                    >
                      Đăng nhập ngay với mật khẩu mới <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                )}
              </div>
            )}
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

      {/* 🟢 POPUP MODAL: MÀN HÌNH ĐẶT SÂN & THANH TOÁN (HIỆN KHI ẤN VÀO LỊCH SÂN) */}
      {showBookingPopup && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-slate-50 p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh] overflow-y-auto space-y-4 border border-slate-100 flex flex-col">
            
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mb-1 mx-auto sm:hidden shrink-0"></div>

            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 font-black">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">CHI TIẾT ĐẶT SÂN</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Kiểm tra thông tin & tiến hành thanh toán</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingPopup(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200/70 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              
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
                    <span className="font-bold text-slate-900">{currentSport?.name || ''}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sân thi đấu</span>
                    <span className="font-black text-emerald-700 text-sm">{selectedCourt}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Ngày đặt</span>
                    <span className="font-bold text-slate-900">{selectedDate}</span>
                  </div>

                  {/* Start Time Selector */}
                  <div className="flex items-center justify-between border-t border-slate-200/80 pt-2">
                    <span className="text-slate-600 font-bold">Giờ bắt đầu:</span>
                    <select
                      value={selectedStartTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-black outline-none cursor-pointer transition ${
                        conflictBooking 
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
                      value={selectedEndTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-black outline-none cursor-pointer transition ${
                        conflictBooking 
                          ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200' 
                          : 'border-slate-300 bg-white text-slate-800 focus:border-emerald-500'
                      }`}
                    >
                      {endTimeOptions.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Duration Selector */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-600 font-bold">Thời lượng thuê:</span>
                    <select
                      value={selectedDuration}
                      onChange={(e) => handleDurationChange(Number(e.target.value))}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-black text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      {availableDurations.map((dur) => (
                        <option key={dur} value={dur}>
                          {dur === 30 ? '30 phút (nửa tiếng)' : dur % 60 === 0 ? `${dur / 60} tiếng` : `${Math.floor(dur / 60)} tiếng 30 phút`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Khung giờ</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      conflictBooking
                        ? 'text-red-700 bg-red-100 border border-red-300'
                        : 'text-emerald-800 bg-emerald-100/70'
                    }`}>
                      {selectedSlot} ({selectedDuration === 30 ? '30 phút' : `${durationHours} tiếng`})
                    </span>
                  </div>

                  {/* 🚨 RED CONFLICT WARNING BANNER */}
                  {conflictBooking && (
                    <div className="rounded-xl border-2 border-red-500 bg-red-50 p-3 text-xs text-red-700 space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center gap-1.5 font-black text-red-800 uppercase text-[11px]">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>KHÔNG THỂ ĐẶT — KHUNG GIỜ ĐÃ BỊ TRÙNG!</span>
                      </div>
                      <p className="text-[11px] font-medium text-red-700 leading-relaxed">
                        Khung giờ <span className="font-black text-red-900 bg-red-100 px-1.5 py-0.5 rounded">{selectedStartTime} – {selectedEndTime}</span> bị trùng với lịch đặt trước trên {selectedCourt}:
                      </p>
                      <div className="rounded-lg bg-white border border-red-200 px-2.5 py-1 text-[11px] font-black text-red-900">
                        📌 {conflictBooking.title || `Đã đặt (${conflictBooking.startH.toString().padStart(2, '0')}:${conflictBooking.startM.toString().padStart(2, '0')} - ${conflictBooking.endH.toString().padStart(2, '0')}:${conflictBooking.endM.toString().padStart(2, '0')})`}
                      </div>
                      <p className="text-[10px] font-bold text-red-600">
                        👉 Vui lòng đổi Giờ bắt đầu hoặc Giờ kết thúc để chọn khung giờ còn trống!
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Đơn giá niêm yết</span>
                    <span className="font-bold text-slate-700">{currentSport ? `${currentSport.pricePerHour.toLocaleString('vi-VN')}đ / giờ` : ''}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                    <span className="text-slate-700 font-black text-sm">TỔNG THANH TOÁN</span>
                    <span className={`text-2xl font-black ${conflictBooking ? 'text-slate-400 line-through' : 'text-emerald-600'}`}>
                      {formattedPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 5: THÔNG TIN NGƯỜI ĐẶT */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">5</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">THÔNG TIN NGUỜI ĐẶT</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="mb-1 block font-bold uppercase text-slate-500 text-[10px] tracking-wider">
                      HỌ VÀ TÊN *
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
                      SỐ ĐIỆN THOẠI *
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
                      GHI CHÚ THÊM (TÙY CHỌN)
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
                      className="h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-slate-700 text-xs font-semibold">Gửi vé điện tử & thông báo nhắc lịch qua Zalo/SMS</span>
                  </label>
                </div>
              </div>

              {/* Submit Button & Conflict Alert */}
              {conflictBooking && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-center text-[11px] font-bold text-red-700 animate-in fade-in flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                  <span>Khung giờ đã bị trùng lịch! Vui lòng chọn giờ khác để tiếp tục.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={Boolean(conflictBooking)}
                className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black uppercase tracking-widest transition ${
                  conflictBooking
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95'
                }`}
              >
                TIẾN HÀNH THANH TOÁN ({formattedPrice})
              </button>
            </form>
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

            <div className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-5 relative overflow-hidden text-center">
              <div className="flex justify-between items-center mb-3">
                 <p className="font-extrabold text-slate-900 text-sm">MB BANK</p>
                 <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-black text-emerald-700">VIETQR</span>
              </div>
              
              <QrCodeArtwork className="mx-auto h-40 w-40" />

              <div className="mt-4 space-y-1 text-xs">
                <p className="text-slate-500">Số tiền thanh toán:</p>
                  <p className="text-2xl font-black text-emerald-600">{totalPrice.toLocaleString('vi-VN')}đ</p>
                <p className="text-slate-500 mt-2">Nội dung chuyển khoản:</p>
                <p className="font-mono font-bold text-slate-900 bg-white py-1 rounded border border-slate-200 uppercase">CX {selectedCourt.replace(/ /g, '')} {customerPhone}</p>
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
              <div className="flex justify-between"><span className="text-slate-500">Môn:</span> <span className="font-bold text-slate-900">{currentSport?.name || ''}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Sân:</span> <span className="font-bold text-emerald-600">{selectedCourt}</span></div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <span className="text-slate-500">Ngày & giờ:</span>
                <span className="text-right font-bold text-slate-900">{selectedDate} · {selectedSlot}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Đã thanh toán đủ 100% qua VietQR:</span> <span className="font-black text-emerald-600">{totalPrice.toLocaleString('vi-VN')}đ</span></div>
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

      {/* ======================================================== */}
      {/* 🟢 FIXED MOBILE BOTTOM NAVIGATION BAR (CONSTRAINED WRAPPER) */}
      {/* ======================================================== */}
      <footer className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-md border-t border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
          <div className="flex items-center justify-around text-center">
            <button
              type="button"
              onClick={() => handleTabChange('booking')}
              className={[
                'flex flex-col items-center gap-1 transition active:scale-95',
                activeTab === 'booking' ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              <CalendarIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] uppercase tracking-wider">Đặt sân</span>
            </button>
  
            <button
              type="button"
              onClick={() => handleTabChange('lookup')}
              className={[
                'flex flex-col items-center gap-1 transition active:scale-95 cursor-pointer',
                activeTab === 'lookup' ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              <Search className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] uppercase tracking-wider">Tra cứu</span>
            </button>
          </div>
        </footer>
    </div>
  );
}
