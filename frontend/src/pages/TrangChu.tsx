import AdminDashboard from './AdminDashboard';
import CustomerSchedule from '../components/CustomerSchedule';
import QrCodeArtwork from '../components/QrCodeArtwork';
import EmployeeDashboard from './employee/EmployeeDashboard';
import VipCustomerDashboard from './VipCustomerDashboard';
import { addBookingRequest } from '../types/bookingRequest';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, MapPin, Phone, Clock, Play, Home, Calendar as CalendarIcon, X, Zap , User, Lock, Eye, EyeOff, Bell, Key, ArrowLeft, Trophy, LayoutGrid, CheckCircle2, RefreshCw, MessageSquare, Copy, Check } from 'lucide-react';

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
  const [popup, setPopup] = useState<any>(null);
  const showAlert = (title: string, message: string) => setPopup({ type: 'alert', title, message });
  const [orderCode] = useState<string>('CX-88291');

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

  // Dates list
  const availableDates = [
    { label: 'Hôm nay', date: '18/09' },
    { label: 'Thứ 6', date: '19/09' },
    { label: 'Thứ 7', date: '20/09' },
    { label: 'Chủ Nhật', date: '21/09' },
    { label: 'Thứ 2', date: '22/09' },
    { label: 'Thứ 3', date: '23/09' },
  ];

  const getAvailableDurations = (startTimeStr: string) => {
    const possibleDurations = [60, 90, 120, 150, 180, 210, 240];
    if (!startTimeStr) return possibleDurations;

    const [h, m] = startTimeStr.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const closingTimeMinutes = 23 * 60;
    return possibleDurations.filter(duration => startMinutes + duration <= closingTimeMinutes);
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
    if (
      !selectedDate ||
      !selectedStartTime ||
      !getAvailableDurations(selectedStartTime).includes(selectedDuration)
    ) return [];
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
    setOtpAction('booking');
    setOtpInput('');
    setOtpError(false);
    setShowOTP(true);
  };

  const handleVerifyOTP = () => {
    if (otpInput === '123456') {
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
        <section className="space-y-3 pt-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
            {/* Header */}
            <div className="border-b border-slate-100 pb-3">
              <span className="inline-block rounded-md bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200">
                Chính sách khách đoàn & hội viên
              </span>
              <h2 className="mt-1.5 text-base font-black text-slate-900 uppercase tracking-tight">
                Hợp đồng & Đặt sân theo gói
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Lịch VIP cố định được nhân viên tiếp nhận tại quầy; sự kiện và chuỗi ngày có thể gửi yêu cầu trực tuyến.
              </p>
            </div>

            {/* Segmented Controller (2 Tabs) - Clean, no icons */}
            <div className="mt-3 grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setContractMode('vip_subscription')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  contractMode === 'vip_subscription'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cố định tháng (1 - 12T)
              </button>

              <button
                type="button"
                onClick={() => setContractMode('event_series')}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  contractMode === 'event_series'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Sự kiện & Chuỗi ngày (7 - 14N)
              </button>
            </div>

            {/* TAB 1: VIP MONTHLY SUBSCRIPTION */}
            {contractMode === 'vip_subscription' && (
              <div className="mt-4 space-y-3 animate-in fade-in duration-150">
                {/* 3 Tier Cards - Compact & Clean */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-500">1 – 2 Tháng</div>
                      <div className="mt-1 text-xs font-black text-slate-800">Giá chuẩn</div>
                      <p className="mt-1 text-[11px] text-slate-500 leading-tight">Giữ cố định giờ vàng yêu thích</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-3 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase text-amber-700">3 – 6 Tháng</div>
                      <div className="mt-1 text-xs font-black text-amber-900">Giảm 10%/giờ</div>
                      <p className="mt-1 text-[11px] text-amber-800 leading-tight">Hạng VIP • Chia nhiều đợt đóng</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-400 bg-amber-100 p-3 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase text-amber-800">&gt; 6 – 12 Tháng</div>
                      <div className="mt-1 text-xs font-black text-amber-950">Giảm 15%/giờ</div>
                      <p className="mt-1 text-[11px] text-amber-900 leading-tight">VIP Thượng hạng • Ưu tiên vị trí sân</p>
                    </div>
                  </div>
                </div>

                {/* Policies & Benefits list */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-black">•</span>
                    <span><strong>Khóa sân độc quyền:</strong> Giữ cố định khung giờ trong tuần suốt kỳ hạn hợp đồng, không lo trùng lịch hay mất sân.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-black">•</span>
                    <span><strong>Thanh toán linh hoạt:</strong> Có thể thỏa thuận chia nhiều đợt tại quầy; thanh toán từng đợt qua mã QR VietQR của sân.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-black">•</span>
                    <span><strong>Đặc quyền đổi dời buổi:</strong> Hỗ trợ xin dời buổi thi đấu khi bận đột xuất; xuất đầy đủ hóa đơn điện tử VAT cho CLB & Doanh nghiệp.</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <a
                    href="tel:0901234567"
                    className="w-full rounded-xl bg-emerald-600 py-3 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-700 active:scale-95 transition text-center"
                  >
                    Liên hệ đăng ký lịch VIP tại quầy · 0901.234.567
                  </a>
                </div>
              </div>
            )}

            {/* TAB 2: EVENT & MULTI-DAY SERIES */}
            {contractMode === 'event_series' && (
              <div className="mt-4 space-y-3 animate-in fade-in duration-150">
                {/* 2 Packages - Compact & Clean */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-500">Chuỗi 7 – 30 Ngày</div>
                      <div className="mt-1 text-xs font-black text-slate-800">Tập huấn & Khóa học</div>
                      <p className="mt-1 text-[11px] text-slate-500 leading-tight">Khóa giữ nguyên cụm sân liên tục suốt đợt</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase text-emerald-700">Giải đấu / Đại hội</div>
                      <div className="mt-1 text-xs font-black text-emerald-900">Bao trọn 8 ô sàn</div>
                      <p className="mt-1 text-[11px] text-emerald-800 leading-tight">Phục vụ giải thể thao phong trào doanh nghiệp</p>
                    </div>
                  </div>
                </div>

                {/* Policies & Benefits list */}
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-black">•</span>
                    <span><strong>Ưu đãi giờ thấp điểm:</strong> Chiết khấu 5% – 10% khi thuê khung giờ sáng, chiều hoặc thuê trọn ngày.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-black">•</span>
                    <span><strong>Tài trợ thiết bị hậu cần:</strong> Miễn phí mượn bảng điểm lật tay, còi, áo pitch phân đội, hỗ trợ hệ thống loa mic trao giải.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 font-black">•</span>
                    <span><strong>Hỗ trợ vận hành:</strong> Tặng nước khoáng cho đoàn; điều phối viên hỗ trợ kỹ thuật và bố trí mặt sàn xuyên suốt giải.</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(true)}
                    className="w-full rounded-xl bg-emerald-600 py-3 px-4 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-700 active:scale-95 transition text-center cursor-pointer shadow-sm"
                  >
                    Đăng ký tổ chức sự kiện
                  </button>
                  <a
                    href="tel:0901234567"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition text-center"
                  >
                    Hotline tư vấn: 0901.234.567
                  </a>
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
                  <input
                    type="time"
                    min="05:00"
                    max="22:00"
                    step={60}
                    value={selectedStartTime}
                    onChange={(e) => handleStartTimeSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Thời Lượng</label>
                  <select 
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
                    {availableDurations.map(dur => (
                      <option key={dur} value={dur}>
                        {dur % 60 === 0 ? `${dur / 60} tiếng` : `${Math.floor(dur / 60)} tiếng 30 phút`}
                      </option>
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
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <button onClick={() => setShowOTP(false)} type="button" className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95">Quay lại</button>
                <button onClick={handleVerifyOTP} type="button" className="rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer active:scale-95">Xác nhận</button>
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
              <div className="flex justify-between"><span className="text-slate-500">Môn:</span> <span className="font-bold text-slate-900">{currentSport.name}</span></div>
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
                'flex flex-col items-center gap-1 transition active:scale-95',
                activeTab === 'lookup' ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              <Search className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] uppercase tracking-wider">Tra cứu</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('schedule')}
              className={[
                'flex flex-col items-center gap-1 transition active:scale-95',
                activeTab === 'schedule' ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-800',
              ].join(' ')}
            >
              <LayoutGrid className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] uppercase tracking-wider">Lịch sân</span>
            </button>
          </div>
        </footer>
    </div>
  );
}
