import { supabase } from '../lib/supabaseClient';
import { downloadBookingReceipt, printBookingReceipt, type BookingReceiptData } from '../utils/bookingReceipt';
import {staffAuthService} from '../services/staffAuthService';
import AdminDashboard from './AdminDashboard';
import CustomerSchedule from '../components/CustomerSchedule';
import useSharedBookings, { refreshSharedBookings } from '../hooks/useSharedBookings';
import useVietnamToday from '../hooks/useVietnamToday';
import { scheduleBookingsForDate } from '../utils/courtBookingWarnings';
import { bookingApiService } from '../services/bookingService';
import { paymentBookingService } from '../services/paymentBookingService';
import { courtHoldService } from '../services/courtHoldService';
import { validateCustomerName, validateCustomerPhone } from '../utils/bookingValidation';
import QrCodeArtwork from '../components/QrCodeArtwork';
import IncidentSelect from '../components/admin/IncidentSelect';
import EmployeeDashboard from './employee/EmployeeDashboard';
import VipCustomerDashboard from './VipCustomerDashboard';
import { addBookingRequest } from '../types/bookingRequest';
import type { IncidentReporter } from '../utils/incidentStorage';
import { isCourtLocked } from '../hooks/useCourtAvailability';
import {
  type SportCategoryItem,
  type AdminCourtItem,
  getAdminSports,
  getAdminCourts,
  syncCourtsWithBackend,
  COURTS_UPDATED_EVENT,
} from '../utils/dynamicCourtStorage';
import { cancellationWorkflowService } from '../services/cancellationWorkflowService';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Search, MapPin, Phone, Clock, Play, Home, Calendar as CalendarIcon, X, Zap, User, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Trophy, CheckCircle2, RefreshCw, MessageSquare, Check, AlertTriangle, Bell, Sparkles } from 'lucide-react';

const venueDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('Đường số 6, An Hải, Đà Nẵng, Việt Nam')}`;

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

const TennisIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M17.93 6.07a10 10 0 0 1 0 11.86" />
    <path d="M6.07 17.93a10 10 0 0 1 0-11.86" />
  </svg>
);

export default function TrangChu() {
  const today=useVietnamToday();
  const [sharedBookings,,bookingsState]=useSharedBookings();
  const [currentUser, setCurrentUser] = useState<IncidentReporter | null>(null);

  // Danh sách môn và sân đồng bộ trực tiếp từ Supabase
  const [allSports, setAllSports] = useState<SportCategoryItem[]>(() => getAdminSports());
  const [allCourts, setAllCourts] = useState<AdminCourtItem[]>(() => getAdminCourts());

  useEffect(() => {
    void syncCourtsWithBackend();
    const handleUpdate = () => {
      setAllSports(getAdminSports());
      setAllCourts(getAdminCourts());
    };
    window.addEventListener(COURTS_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(COURTS_UPDATED_EVENT, handleUpdate);
  }, []);
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'booking' | 'lookup'>('booking');

  // Booking Form State
  const [selectedSportId, setSelectedSportId] = useState<string | null>(null);
  const [sportError, setSportError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string>('');

  // Time Selection State
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // minutes

  // Customer Info State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [sendZalo, setSendZalo] = useState<boolean>(true);
  const [bookingNameError, setBookingNameError] = useState<string>('');
  const [bookingPhoneError, setBookingPhoneError] = useState<string>('');
  const [bookingFormTouched, setBookingFormTouched] = useState<boolean>(false);

  const resetBookingFormErrors = () => {
    setBookingNameError('');
    setBookingPhoneError('');
    setBookingFormTouched(false);
  };

  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    if (bookingFormTouched || bookingNameError) {
      const res = validateCustomerName(val);
      setBookingNameError(res.isValid ? '' : (res.error || ''));
    }
  };

  const handleCustomerPhoneChange = (val: string) => {
    setCustomerPhone(val);
    if (bookingFormTouched || bookingPhoneError) {
      const res = validateCustomerPhone(val);
      setBookingPhoneError(res.isValid ? '' : (res.error || ''));
    }
  };

  const handleCustomerNameBlur = () => {
    if (customerName.trim().length > 0) {
      const res = validateCustomerName(customerName);
      setBookingNameError(res.isValid ? '' : (res.error || ''));
    }
  };

  const handleCustomerPhoneBlur = () => {
    if (customerPhone.trim().length > 0) {
      const res = validateCustomerPhone(customerPhone);
      setBookingPhoneError(res.isValid ? '' : (res.error || ''));
    }
  };

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
  const [loginSaving,setLoginSaving]=useState(false);
  const [loginError,setLoginError]=useState('');

  // User Credentials for Authentication & Password Recovery
  const [accountCredentials, setAccountCredentials] = useState<{
    [key: string]: { role: 'admin' | 'employee' | 'vip'; password: string; name: string; phone: string; email: string };
  }>({
    admin: {
      role: 'admin',
      password: 'admin',
      name: 'Ban Quản Trị (Admin)',
      phone: '0912345678',
      email: 'admin@courtx.vn',
    },
    nhanvien: {
      role: 'employee',
      password: 'nhanvien',
      name: 'Nguyễn Văn An (Nhân viên)',
      phone: '0901234567',
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
  const [forgotStep, setForgotStep] = useState<'account' | 'otp' | 'new_password' | 'success'>('account');
  const [forgotAccountInput, setForgotAccountInput] = useState<string>('');
  const [matchedAccountKey, setMatchedAccountKey] = useState<string>('');
  const [forgotOtpInput, setForgotOtpInput] = useState<string>('');
  const [forgotOtpCountdown, setForgotOtpCountdown] = useState<number>(60);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [forgotNewPassInput, setForgotNewPassInput] = useState<string>('');
  const [forgotConfirmPassInput, setForgotConfirmPassInput] = useState<string>('');
  const [showNewPass, setShowNewPass] = useState<boolean>(false);
  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [smsToast, setSmsToast] = useState<{
    sender: string;
    phone: string;
    message: string;
    otp?: string;
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
  const handleSendForgotOtp = async (targetPhone?: string) => {
    const raw = (targetPhone !== undefined ? targetPhone : forgotAccountInput).trim().replace(/\s+/g, '');
    if (!raw) {
      setForgotError('Vui lòng nhập số điện thoại.');
      return;
    }

    const phoneClean = raw.replace(/\D/g, '');
    if (!/^0[35789][0-9]{8}$/.test(phoneClean)) {
      setForgotError('Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      // 1. Gọi backend API
      const res = await staffAuthService.sendForgotOtp(phoneClean);
      const otp = res.otp || Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setMatchedAccountKey(phoneClean);
      setForgotStep('otp');
      setForgotOtpCountdown(60);
      setForgotOtpInput('');
      setSmsToast({
        sender: 'COURTX-OTP',
        phone: phoneClean,
        message: `Mã xác thực OTP của bạn là: ${otp} (hiệu lực 60s).`,
        otp,
      });
    } catch (err: any) {
      // 2. Fallback kiểm tra accountCredentials
      const matchedKey = Object.keys(accountCredentials).find(
        (k) => accountCredentials[k].phone.replace(/\s+/g, '') === phoneClean
      );
      if (matchedKey || phoneClean === '0901234567' || phoneClean === '0912345678' || phoneClean === '0988888888') {
        const key = matchedKey || (phoneClean === '0901234567' ? 'admin' : phoneClean === '0912345678' ? 'nhanvien' : 'vip');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setMatchedAccountKey(key);
        setForgotStep('otp');
        setForgotOtpCountdown(60);
        setForgotOtpInput('');
        setSmsToast({
          sender: 'COURTX-OTP',
          phone: phoneClean,
          message: `Mã xác thực OTP của bạn là: ${otp} (hiệu lực 60s).`,
          otp,
        });
      } else {
        setForgotError('Số điện thoại chưa được đăng ký trong hệ thống!');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyForgotOtp = async () => {
    const cleanOtp = forgotOtpInput.trim();
    if (!cleanOtp) {
      setForgotError('Vui lòng nhập mã OTP.');
      return;
    }

    const phoneClean = forgotAccountInput.trim().replace(/\D/g, '');
    setForgotLoading(true);
    setForgotError(null);

    try {
      await staffAuthService.verifyForgotOtp(phoneClean, cleanOtp);
      setForgotStep('new_password');
      setForgotNewPassInput('');
      setForgotConfirmPassInput('');
      setSmsToast(null);
    } catch {
      if (cleanOtp === generatedOtp) {
        setForgotStep('new_password');
        setForgotNewPassInput('');
        setForgotConfirmPassInput('');
        setSmsToast(null);
      } else {
        setForgotError('Mã OTP không chính xác. Vui lòng kiểm tra lại!');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Set New Password & Confirm Password
  const handleResetPassword = async () => {
    setForgotError(null);
    if (!forgotNewPassInput || forgotNewPassInput.length < 8) {
      setForgotError('Mật khẩu mới phải có tối thiểu 8 ký tự!');
      return;
    }
    if (!/[a-zA-Z]/.test(forgotNewPassInput)) {
      setForgotError('Mật khẩu mới phải chứa ít nhất 1 chữ cái!');
      return;
    }
    if (!/[0-9]/.test(forgotNewPassInput)) {
      setForgotError('Mật khẩu mới phải chứa ít nhất 1 chữ số!');
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(forgotNewPassInput)) {
      setForgotError('Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (VD: @, #, $, %, !...)!');
      return;
    }
    if (forgotNewPassInput !== forgotConfirmPassInput) {
      setForgotError('Mật khẩu xác nhận không khớp!');
      return;
    }

    const phoneClean = forgotAccountInput.trim().replace(/\D/g, '');

    // 1. Kiểm tra nhanh nếu trùng mật khẩu cũ đã lưu trên frontend
    const matchedCred = (matchedAccountKey && accountCredentials[matchedAccountKey]) ||
      Object.values(accountCredentials).find(
        (c) => c.phone.replace(/\D/g, '') === phoneClean
      );
    if (matchedCred && matchedCred.password === forgotNewPassInput) {
      setForgotError('Bạn đã nhập mật khẩu cũ. Vui lòng chọn mật khẩu mới khác với mật khẩu cũ!');
      return;
    }

    setForgotLoading(true);

    try {
      await staffAuthService.resetPassword(phoneClean, forgotOtpInput.trim(), forgotNewPassInput);
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('mật khẩu cũ') || errMsg.includes('mật khẩu hiện tại') || err?.status === 400) {
        setForgotError(errMsg || 'Bạn đã nhập mật khẩu cũ. Vui lòng chọn mật khẩu mới khác với mật khẩu cũ!');
        setForgotLoading(false);
        return;
      }
      console.warn('Backend reset password notice:', err);
    }

    if (matchedAccountKey) {
      setAccountCredentials((prev) => ({
        ...prev,
        [matchedAccountKey]: {
          ...prev[matchedAccountKey],
          password: forgotNewPassInput,
        },
      }));
    }

    setForgotStep('success');
    setForgotLoading(false);
  };

  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<boolean>(false);
  const [otpAction, setOtpAction] = useState<'booking' | 'lookup' | 'cancel'>('booking');
  const [bookingOtp, setBookingOtp] = useState<string>('123456');
  const [otpPhone, setOtpPhone] = useState<string>('');
  const [popup, setPopup] = useState<any>(null);
  const showAlert = (title: string, message: string) => setPopup({ type: 'alert', title, message });
  const [orderCode,setOrderCode] = useState<string>('');
  const [paymentCode,setPaymentCode]=useState('');
  const [showReceipt,setShowReceipt]=useState(false);
  const getReceiptData = (): BookingReceiptData => ({
    bookingCode: orderCode,
    paymentCode,
    customerName,
    customerPhone,
    sport: currentSport?.name || '',
    court: selectedCourt,
    date: selectedDate,
    time: selectedSlot,
    total: totalPrice.toLocaleString('vi-VN') + ' VND',
  });
  const handleDownloadReceipt = () => downloadBookingReceipt(getReceiptData());
  const handlePrintReceipt = () => printBookingReceipt(getReceiptData());

  // Lookup Search State
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [lookupResults, setLookupResults] = useState<any[]>([]);
  const [pendingLookupResults, setPendingLookupResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [lookupLoading,setLookupLoading]=useState(false);
  const [lookupError,setLookupError]=useState('');
  useEffect(()=>{setLookupResults([]);setLookupError('');setHasSearched(false);},[activeTab]);
  const [cancelConfirmation, setCancelConfirmation] = useState<any>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState<string>('');
  const [pendingCancelTicket, setPendingCancelTicket] = useState<any>(null);

  // Tự động tắt popup thông báo hủy thành công sau 3.5 giây
  useEffect(() => {
    if (popup && popup.type === 'cancel-success') {
      const timer = setTimeout(() => {
        setPopup(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [popup]);

  // Section Refs for smooth scrolling
  const introRef = useRef<HTMLDivElement>(null);
  const facilityRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const lookupRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: 'booking' | 'lookup') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBooking = (sportId?: string) => {
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

  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const bannerVideoRef = useRef<HTMLDivElement>(null);

  const handleSelectSlotFromSchedule = (
    sportId: string,
    courtName: string,
    time: string,
    dateStr: string,
    fromScheduleTab?: boolean
  ) => {
    // Nếu khách chưa chọn môn ở Bước 1 và bấm vào lịch thì báo chữ đỏ & cuộn lên Bước 1
    if (!selectedSportId && !fromScheduleTab) {
      setSportError('Vui lòng chọn môn thể thao ở Bước 1 trước khi chọn sân và giờ!');
      const el = document.getElementById('step-1-sport-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Nếu khách chưa chọn ngày ở Bước 2 và bấm vào lịch thì báo chữ đỏ & cuộn lên Bước 2
    if (!selectedDate && !fromScheduleTab) {
      setDateError('Vui lòng chọn ngày thi đấu ở Bước 2 trước khi chọn sân và giờ!');
      const el = document.getElementById('step-2-date-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (fromScheduleTab) {
      setSelectedSportId(sportId);
      setSportError(null);
    }

    // Kiểm tra xem khung giờ này có đang được người khác tạm giữ thanh toán không
    let checkDate = '';
    if (dateStr) {
      const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        checkDate = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }
    if (!checkDate && scheduleDateObj) {
      const dYear = scheduleDateObj.getFullYear();
      const dMonth = (scheduleDateObj.getMonth() + 1).toString().padStart(2, '0');
      const dDay = scheduleDateObj.getDate().toString().padStart(2, '0');
      checkDate = `${dYear}-${dMonth}-${dDay}`;
    }

    const held = courtHoldService.isSlotHeldByAnother(
      courtName,
      checkDate,
      time,
      30,
      paymentSessionId
    );

    if (held) {
      showAlert(
        'Sân đang tạm giữ thanh toán!',
        `Khung giờ ${time} trên ${courtName} hiện đang được một khách hàng khác tạm giữ để quét mã VietQR.\n\nVui lòng chọn khung giờ khác hoặc chờ hết thời gian giữ sân!`
      );
      return;
    }

    setSelectedStartTime(time);
    setSelectedCourt(courtName);

    // If starting on :30 or if 60 mins would conflict, default duration to 30 mins
    const startMins = parseTimeToMinutes(time);
    const hasConflictWith60 = liveSchedule.some((b) => {
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
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNote('');
    resetBookingFormErrors();
    setShowBookingPopup(true);
  };

  // Dynamic Sports Data Definitions based on Supabase and dynamicCourtStorage
  const sportsData = useMemo(() => {
    const baseMeta: Record<string, any> = {
      badminton: {
        badge: 'CẦU LÔNG',
        tagline: 'THI ĐẤU QUỐC TẾ',
        description: 'Mặt thảm BWF tiêu chuẩn 4.5mm chống trượt, hệ thống đèn chiếu sáng chống chói Lux LED 1000+, trần cao 11m.',
        specs: ['MẶT THẢM BWF', 'CHỐNG CHÓI', 'CHUẨN 4.5MM'],
        image: '/images/badminton.jpg',
        iconComp: ShuttlecockIcon,
      },
      football: {
        badge: 'BÓNG ĐÁ',
        tagline: 'SÂN CỎ NHÂN TẠO',
        description: 'Sân bóng đá cỏ nhân tạo đạt chuẩn thi đấu mini 5 - 7 người, hệ thống đèn LED chuyên nghiệp, bóng thi đấu đạt chuẩn.',
        specs: ['SÂN 5 - 7 NGƯỜI', 'ĐÈN LUX 1000', 'CỎ NHÂN TẠO'],
        image: '/images/hero_arena.jpg',
        iconComp: FootballIcon,
      },
      volleyball: {
        badge: 'BÓNG CHUYỀN',
        tagline: 'TRONG NHÀ CAO CẤP',
        description: 'Sân bóng chuyền trong nhà mái che cao 12m, thảm thi đấu Taraflex xịn, trụ và lưới căng chuẩn FIVB thi đấu.',
        specs: ['THẢM TARAFLEX', 'MÁI CHE 12M', 'ĐÈN LUX 1000'],
        image: '/images/volleyball.jpg',
        iconComp: VolleyballIcon,
      },
      tennis: {
        badge: 'TENNIS',
        tagline: 'MẶT SÂN CỨNG TIÊU CHUẨN',
        description: 'Sân tennis mặt sân cứng Acrylic chuyên nghiệp độ nảy chuẩn ITF, chống trơn trượt, đèn chiếu sáng ban đêm công suất lớn.',
        specs: ['MẶT SÂN ACRYLIC', 'CHUẨN ITF', 'ĐÈN ĐÊM LUX 1000+'],
        image: '/images/hero_arena.jpg',
        iconComp: TennisIcon,
      },
    };

    const map: Record<string, any> = {};
    allSports.forEach((sp) => {
      const courtsInSport = allCourts.filter((c) => c.sportId === sp.id);
      const courtNames = courtsInSport.map((c) => c.name);
      const meta = baseMeta[sp.id] || {
        badge: sp.name.toUpperCase(),
        tagline: 'TIÊU CHUẨN HIỆN ĐẠI',
        description: `Hệ thống sân ${sp.name} tiêu chuẩn chất lượng cao, hệ thống chiếu sáng chuyên nghiệp, thảm thi đấu hiện đại.`,
        specs: ['CHUẨN THI ĐẤU', 'ĐÈN LUX 1000+', 'KHÔNG GIAN THOÁNG'],
        image: '/images/hero_arena.jpg',
      };

      map[sp.id] = {
        id: sp.id,
        name: sp.name,
        badge: meta.badge,
        tagline: meta.tagline,
        title: `${courtsInSport.length} Sân ${sp.name}`,
        description: meta.description,
        specs: meta.specs,
        pricePerHour: sp.pricePerHour,
        priceLabel: `${sp.pricePerHour.toLocaleString('vi-VN')} VND / GIỜ`,
        image: meta.image,
        icon: sp.icon,
        iconComp: meta.iconComp,
        courts: courtNames.length > 0 ? courtNames : [`Sân ${sp.prefix}-01`],
        courtCount: courtsInSport.length,
      };
    });

    return map;
  }, [allSports, allCourts]);

  const currentSport = selectedSportId ? (sportsData as Record<string, any>)[selectedSportId] : null;


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

  // Generate dates from the current day in Vietnam.
  const availableDates = useMemo(() => {
    const list = [];
    for (let i = 0; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const dow = d.getDay();
      const label = i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : daysOfWeekVi[dow];
      const shortDate = `${day}/${month}`;
      list.push({
        label,
        date: shortDate, dateObj: d,
      });
    }
    return list;
  }, [today]);

  const scheduleDateObj = useMemo(() => {
    if (!selectedDate) return today;
    const fullMatch = selectedDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (fullMatch) {
      return new Date(parseInt(fullMatch[3], 10), parseInt(fullMatch[2], 10) - 1, parseInt(fullMatch[1], 10));
    }
    const match = selectedDate.match(/(\d{1,2})\/(\d{1,2})/);
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const known=availableDates.find(item=>item.date===`${String(day).padStart(2,'0')}/${String(month+1).padStart(2,'0')}`);
      return known?.dateObj || new Date(today.getFullYear(), month, day);
    }
    return today;
  }, [selectedDate,today,availableDates]);
  const liveSchedule=useMemo(()=>scheduleBookingsForDate(sharedBookings,scheduleDateObj),[sharedBookings,scheduleDateObj]);


  // --- INTERACTIVE MONTHLY CALENDAR DROPDOWN ---
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    if (isDatePickerOpen) {
      setCalendarMonth(new Date(scheduleDateObj.getFullYear(), scheduleDateObj.getMonth(), 1));
    }
  }, [isDatePickerOpen, scheduleDateObj]);

  const handlePrevMonth = () => {
    const todayBase = new Date(today.getFullYear(), today.getMonth(), 1);
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
    const todayZero = new Date(today);
    todayZero.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    if (target.getTime() < todayZero.getTime()) {
      return; // Tuyệt đối không chọn ngày quá khứ
    }

    const m = target.getMonth() + 1;
    const day = target.getDate();
    const dow = target.getDay();

    const isToday = target.getTime() === todayZero.getTime();
    const tomorrowZero = new Date(todayZero);
    tomorrowZero.setDate(todayZero.getDate() + 1);
    const isTomorrow = target.getTime() === tomorrowZero.getTime();

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

  // Kiểm tra ngày đang chọn có phải là hôm nay
  const isSelectedDateToday = useMemo(() => {
    if (!selectedDate) return false;
    if (selectedDate.includes('Hôm nay')) return true;
    const now = new Date();
    const dMatch = selectedDate.match(/(\d{1,2})\/(\d{1,2})/);
    if (dMatch) {
      const day = parseInt(dMatch[1], 10);
      const month = parseInt(dMatch[2], 10);
      return day === now.getDate() && month === (now.getMonth() + 1);
    }
    return false;
  }, [selectedDate]);

  // Danh sách giờ bắt đầu: ẨN HOÀN TOÀN các giờ đã qua nếu là ngày Hôm nay
  const filteredStartTimeOptions = useMemo(() => {
    if (!isSelectedDateToday) {
      return START_TIME_OPTIONS;
    }
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return START_TIME_OPTIONS.filter((t) => parseTimeToMinutes(t) > currentMins);
  }, [isSelectedDateToday, START_TIME_OPTIONS]);

  // Tự động gán khung giờ hợp lệ nếu giờ đang chọn nằm trong quá khứ
  useEffect(() => {
    if (isSelectedDateToday) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (!selectedStartTime || parseTimeToMinutes(selectedStartTime) <= currentMins) {
        if (filteredStartTimeOptions.length > 0) {
          setSelectedStartTime(filteredStartTimeOptions[0]);
        }
      }
    }
  }, [isSelectedDateToday, filteredStartTimeOptions, selectedStartTime]);

  const getAvailableDurations = (startTimeStr: string) => {
    const possibleDurations = [30, 60, 90, 120, 150, 180, 210, 240];
    if (!startTimeStr) return possibleDurations;

    const startMinutes = parseTimeToMinutes(startTimeStr);
    const closingTimeMinutes = 23 * 60;
    return possibleDurations.filter(duration => startMinutes + duration <= closingTimeMinutes);
  };

  useEffect(() => {
    if (selectedCourt && (isCourtLocked(selectedCourt) || (currentSport && !currentSport.courts.includes(selectedCourt)))) {
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

  const [paymentCd, setPaymentCd] = useState<number>(60);
  const [paymentSessionId, setPaymentSessionId] = useState<string>('');
  const paymentProcessedSessionRef = useRef<string | null>(null);
  const isProcessingPaymentRef = useRef<boolean>(false);
  const [holdTrigger, setHoldTrigger] = useState<number>(0);

  useEffect(() => {
    return courtHoldService.subscribe(() => {
      setHoldTrigger((v) => v + 1);
    });
  }, []);

  // Real-time Booking Conflict Detection:
  const conflictBooking = useMemo(() => {
    if (!selectedCourt || !selectedStartTime || !selectedDuration) return null;
    const reqStart = parseTimeToMinutes(selectedStartTime);
    const reqEnd = reqStart + selectedDuration;

    // 1. Kiểm tra với lịch đã đặt chính thức trên hệ thống
    const booked = liveSchedule.find((b) => {
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

    if (booked) return booked;

    // 2. Kiểm tra xem có khách khác đang tạm giữ sân trong thời gian ưu tiên không
    const dYear = scheduleDateObj.getFullYear();
    const dMonth = (scheduleDateObj.getMonth() + 1).toString().padStart(2, '0');
    const dDay = scheduleDateObj.getDate().toString().padStart(2, '0');
    const formattedDate = `${dYear}-${dMonth}-${dDay}`;

    const held = courtHoldService.isSlotHeldByAnother(
      selectedCourt,
      formattedDate,
      selectedStartTime,
      selectedDuration,
      paymentSessionId
    );

    if (held) {
      return {
        title: 'Đang có khách tạm giữ thanh toán',
        courtName: held.courtName,
        courtCode: held.courtName,
        startH: Math.floor(parseTimeToMinutes(held.startTime) / 60),
        startM: parseTimeToMinutes(held.startTime) % 60,
        endH: Math.floor((parseTimeToMinutes(held.startTime) + held.duration) / 60),
        endM: (parseTimeToMinutes(held.startTime) + held.duration) % 60,
      } as any;
    }

    return null;
  }, [selectedCourt, selectedStartTime, selectedDuration, liveSchedule, scheduleDateObj, paymentSessionId, holdTrigger]);

  // Price Calculation
  const durationHours = selectedDuration / 60;
  const totalPrice = currentSport ? Math.round(currentSport.pricePerHour * durationHours) : 0;
  const formattedPrice = totalPrice.toLocaleString('vi-VN') + ' VND';
  const selectedSlot = selectedStartTime ? `${selectedStartTime} - ${selectedEndTime}` : 'Chưa chọn giờ';

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Khong chan dat san neu backend loi ket noi
    if(bookingsState.error) { console.warn('Lịch sân warning:', bookingsState.error); }
    if (!selectedSportId) {
      setSportError('Vui lòng chọn môn thể thao ở Bước 1!');
      const el = document.getElementById('step-1-sport-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showAlert('Chưa chọn môn thể thao', 'Vui lòng chọn môn thể thao ở Bước 1!');
      return;
    }
    if (!selectedDate) {
      setDateError('Vui lòng chọn ngày thi đấu ở Bước 2!');
      const el = document.getElementById('step-2-date-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    const nameCheck = validateCustomerName(customerName);
    const phoneCheck = validateCustomerPhone(customerPhone);

    setBookingFormTouched(true);
    setBookingNameError(nameCheck.isValid ? '' : (nameCheck.error || ''));
    setBookingPhoneError(phoneCheck.isValid ? '' : (phoneCheck.error || ''));

    if (!nameCheck.isValid) {
      showAlert('Họ tên không hợp lệ', nameCheck.error || 'Vui lòng kiểm tra lại họ và tên.');
      return;
    }

    if (!phoneCheck.isValid) {
      showAlert('Số điện thoại không hợp lệ', phoneCheck.error || 'Vui lòng kiểm tra lại số điện thoại.');
      return;
    }

    const cleanPhone = customerPhone.trim().replace(/[\s.-]/g, '');
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setBookingOtp(newOtp);
    setOtpPhone(cleanPhone);
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

      if (otpAction === 'lookup') {
        setLookupResults(pendingLookupResults);
        setPendingLookupResults([]);
        setHasSearched(true);
        setOtpAction('booking');
        return;
      }

      if (otpAction === 'cancel') {
        if (pendingCancelTicket) {
          const ticket = pendingCancelTicket;
          const isEligible = (ticket.hoursUntilStart ?? 0) >= 24;
          setPendingCancelTicket(null);
          setOtpAction('booking');
          completeCancellation(ticket, isEligible);
        }
        return;
      }

      const newSession = 'PAY_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      paymentProcessedSessionRef.current = null;
      isProcessingPaymentRef.current = false;
      setPaymentSessionId(newSession);
      setPaymentCd(60);

      const dYear = scheduleDateObj.getFullYear();
      const dMonth = (scheduleDateObj.getMonth() + 1).toString().padStart(2, '0');
      const dDay = scheduleDateObj.getDate().toString().padStart(2, '0');
      const formattedDate = `${dYear}-${dMonth}-${dDay}`;

      courtHoldService.holdSlot({
        sessionId: newSession,
        courtName: selectedCourt,
        bookingDate: formattedDate,
        startTime: selectedStartTime,
        duration: selectedDuration,
        customerName,
        customerPhone,
        holdSeconds: 60,
      });

      setShowPayment(true);
    } else {
      setOtpError(true);
    }
  };

  // URL xác nhận thanh toán mô phỏng cho điện thoại quét QR (sử dụng IP Wi-Fi thực tế của máy)
  const mobilePaymentUrl = useMemo(() => {
    if (!showPayment || !paymentSessionId) return '';
    let host = typeof window !== 'undefined' ? window.location.hostname : '192.168.1.65';
    if (host === 'localhost' || host === '127.0.0.1') {
      host = '192.168.1.65'; // IP mạng Wi-Fi thực tế của máy tính
    }
    const port = typeof window !== 'undefined' && window.location.port ? ':' + window.location.port : '';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    const q = new URLSearchParams({
      view: 'phone-payment',
      session: paymentSessionId,
      court: selectedCourt,
      amount: String(totalPrice),
      phone: customerPhone,
      time: selectedStartTime + ' (' + selectedDuration + 'p)',
      name: customerName,
    });
    return protocol + '//' + host + port + '/?' + q.toString();
  }, [showPayment, paymentSessionId, selectedCourt, totalPrice, customerPhone, selectedStartTime, selectedDuration, customerName]);

  // URL mở trực tiếp trên trình duyệt máy tính mà không bị lỗi kết nối IP
  const localSimulatorUrl = useMemo(() => {
    if (!showPayment || !paymentSessionId) return '';
    const q = new URLSearchParams({
      view: 'phone-payment',
      session: paymentSessionId,
      court: selectedCourt,
      amount: String(totalPrice),
      phone: customerPhone,
      time: selectedStartTime + ' (' + selectedDuration + 'p)',
      name: customerName,
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return origin ? `${origin}/?${q.toString()}` : `/?${q.toString()}`;
  }, [showPayment, paymentSessionId, selectedCourt, totalPrice, customerPhone, selectedStartTime, selectedDuration, customerName]);

  // Lắng nghe tín hiệu xác nhận từ điện thoại qua Supabase Realtime & LocalStorage
  useEffect(() => {
    if (!showPayment || !paymentSessionId) return;
    let isHandled = false;

    const triggerConfirm = () => {
      if (isHandled) return;
      isHandled = true;
      try {
        localStorage.removeItem('courtx_confirmed_' + paymentSessionId);
      } catch {
        // ignore
      }
      void confirmPaymentReceived();
    };

    // Kênh Supabase Realtime Broadcast
    const channel = supabase.channel('payment_session_' + paymentSessionId);
    channel
      .on('broadcast', { event: 'PAYMENT_CONFIRMED' }, () => {
        triggerConfirm();
      })
      .on('broadcast', { event: 'PAYMENT_CANCELLED' }, () => {
        if (!isHandled) {
          isHandled = true;
          handleExecuteCancelSubprocess();
        }
      })
      .subscribe();

    // Fallback nếu mở giả lập cùng trình duyệt
    const interval = setInterval(() => {
      try {
        const item = localStorage.getItem('courtx_confirmed_' + paymentSessionId);
        if (item) {
          triggerConfirm();
        }
      } catch {
        // ignore
      }
    }, 500);

    return () => {
      clearInterval(interval);
      void channel.unsubscribe();
    };
  }, [showPayment, paymentSessionId]);

  // TOBE_CHAY.bpmn: Quản lý logic Thanh toán theo sơ đồ BPMN TOBE
  const [showCancelSubprocessModal, setShowCancelSubprocessModal] = useState<boolean>(false);
  const [paymentTechnicalError, setPaymentTechnicalError] = useState<string | null>(null);
  const [paymentNotification, setPaymentNotification] = useState<string | null>(null);

  // Kích hoạt Event Sub-process hủy thanh toán (Activity_1clhmdn)
  const handleCancelPaymentClick = () => {
    setShowCancelSubprocessModal(true);
  };

  // Xác nhận thực hiện Event Sub-process
  const handleExecuteCancelSubprocess = () => {
    setShowCancelSubprocessModal(false);
    setShowPayment(false);
    setPaymentCd(60);
    setPaymentTechnicalError(null);
    setPaymentNotification(null);
    courtHoldService.releaseSlot(paymentSessionId);
  };

  // Gateway_1ukmj3e: Chọn "Thanh toán lại" (Flow_0shou4r)
  const handleRetryPayment = () => {
    setPaymentTechnicalError(null);
    setPaymentCd(60);
  };

  // Gateway_1ukmj3e: Chọn "Hủy" (Flow_1tklgpa -> Activity_1sokaaf -> Event_0rjnoap)
  const handleCancelAfterPaymentError = () => {
    setPaymentTechnicalError(null);
    setShowPayment(false);
    setPaymentCd(60);
    courtHoldService.releaseSlot(paymentSessionId);
  };

  // Boundary Timer: Hết hạn giữ sân sau 1 phút
  // Quy định: Hết thời gian giữ ưu tiên thì giải phóng giữ độc quyền (người khác có thể đặt),
  // nhưng khách hiện tại VẪN THANH TOÁN ĐƯỢC nếu chưa có ai nhảy vào đặt trước!
  const handleTrigger10MinTimeout = () => {
    courtHoldService.releaseSlot(paymentSessionId);
    setPaymentNotification(null);
  };

  const confirmPaymentReceived = async () => {
    if (isProcessingPaymentRef.current) return;
    if (!showPayment || !paymentSessionId) return;
    // Ngăn chặn gọi trùng lặp nhiều lần cho cùng một phiên thanh toán
    if (paymentProcessedSessionRef.current === paymentSessionId) {
      console.log('ℹ️ Phiên thanh toán Khách đã được xử lý hoàn tất trước đó:', paymentSessionId);
      return;
    }
    paymentProcessedSessionRef.current = paymentSessionId;
    isProcessingPaymentRef.current = true;

    try {
      const dYear = scheduleDateObj.getFullYear();
      const dMonth = (scheduleDateObj.getMonth() + 1).toString().padStart(2, '0');
      const dDay = scheduleDateObj.getDate().toString().padStart(2, '0');
      const formattedDate = `${dYear}-${dMonth}-${dDay}`;

      // 1. Kiểm tra tranh chấp thực tế trên Database (Ai thanh toán trước thì tính cho khách đó, bỏ qua chính SĐT của khách này)
      const conflictCheck = await courtHoldService.checkRealBookingConflict(
        selectedCourt,
        formattedDate,
        selectedStartTime,
        selectedDuration,
        customerPhone
      );

      if (conflictCheck.hasConflict) {
        isProcessingPaymentRef.current = false;
        setShowPayment(false);
        setPaymentCd(60);
        courtHoldService.releaseSlot(paymentSessionId);
        void refreshSharedBookings();
        setPopup({
          type: 'alert',
          title: 'Khung giờ đã có người thanh toán trước!',
          message: `${conflictCheck.message || 'Khung giờ này vừa có khách khác hoàn tất thanh toán trước.'}\n\nDo bạn đã hết thời gian ưu tiên giữ sân nên hệ thống ưu tiên khách thanh toán trước. Nếu bạn đã chuyển khoản, số tiền sẽ được tự động hoàn lại 100% qua VietQR. Vui lòng chọn khung giờ khác!`,
        });
        return;
      }

      setShowPayment(false);
      setPaymentCd(60);
      courtHoldService.releaseSlot(paymentSessionId);
      setIsSubmitted(true);

      const sMins = parseTimeToMinutes(selectedStartTime);
      const eMins = sMins + selectedDuration;
      const eH = Math.floor(eMins / 60).toString().padStart(2, '0');
      const eM = (eMins % 60).toString().padStart(2, '0');
      const autoBankRef = `VQR${Date.now().toString().slice(-8)}`;

      const cleanPhone = customerPhone.trim().replace(/[\s.-]/g, '');
      const trimmedName = customerName.trim();

      // Ưu tiên lưu qua paymentBookingService trực tiếp Supabase để khớp số mã
      try {
        const res = await paymentBookingService.recordSuccessfulBookingPayment({
          customerName: trimmedName,
          customerPhone: cleanPhone,
          courtName: selectedCourt,
          bookingDate: formattedDate,
          timeSlot: `${selectedStartTime} - ${eH}:${eM}`,
          totalPrice,
          channel: 'ONLINE',
        });
        if (res.success) {
          if (res.bookingCode) setOrderCode(res.bookingCode);
          if (res.paymentCode) setPaymentCode(res.paymentCode);
        } else if ((res as any).conflict) {
          void refreshSharedBookings();
          setPopup({
            type: 'alert',
            title: 'Khung giờ đã có người thanh toán trước!',
            message: 'Rất tiếc! Khung giờ này vừa có khách khác hoàn tất thanh toán trước. Số tiền của bạn sẽ được hoàn lại tự động qua VietQR.',
          });
          return;
        }
      } catch {
        // Fallback qua backend API nếu có
        const saved = await bookingApiService.createBooking({
          courtCode: selectedCourt,
          bookingDate: formattedDate,
          startTime: selectedStartTime,
          endTime: `${eH}:${eM}`,
          customerName: trimmedName,
          customerPhone: cleanPhone,
          totalAmount: totalPrice,
          bankTransactionCode: autoBankRef,
          paymentConfirmed: true,
        });
        if (saved?.code) setOrderCode(saved.code);
        if (saved?.booking?.paymentCode) setPaymentCode(saved.booking.paymentCode);
      }
      window.dispatchEvent(new Event('focus'));
    } catch (err: any) {
      console.warn('Lỗi ghi đơn lên Supabase:', err);
      if (err?.message?.includes('Khung giờ đã có lượt đặt')) {
        void refreshSharedBookings();
        setPopup({
          type: 'alert',
          title: 'Khung giờ đã có người thanh toán trước!',
          message: 'Rất tiếc! Khung giờ này vừa có khách khác hoàn tất thanh toán trước. Số tiền của bạn sẽ được hoàn lại tự động qua VietQR.',
        });
      }
    } finally {
      isProcessingPaymentRef.current = false;
    }
  };

  // Tự động kiểm tra thời gian thanh toán theo TOBE_CHAY.bpmn (40s nhắc nhở, 1 phút hết hạn giữ ưu tiên)
  useEffect(() => {
    if (!showPayment || paymentTechnicalError || showCancelSubprocessModal) {
      return;
    }
    // Khi đã trôi qua 40 giây (giả lập 8 phút trong BPMN, còn 20s: paymentCd === 20): tự động kích hoạt Boundary Timer nhắc nhở
    if (paymentCd === 20 && !paymentNotification) {
      setPaymentNotification('Nhắc nhở thanh toán: Sân tạm giữ sẽ hết hạn trong 20 giây tới, vui lòng quét mã QR để hoàn tất!');
    }
    // Khi hết 1 phút (60 giây): Hết thời gian ưu tiên giữ sân
    // Giải phóng lượt giữ độc quyền nhưng KHÔNG đóng modal, khách vẫn có thể thanh toán tiếp nếu chưa ai đặt trước!
    if (paymentCd <= 0) {
      handleTrigger10MinTimeout();
      return;
    }
    const t = setTimeout(() => setPaymentCd((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showPayment, paymentCd, paymentTechnicalError, showCancelSubprocessModal, paymentNotification]);

  const handleLookupSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    if(lookupLoading)return;
    setLookupResults([]);setHasSearched(false);setLookupError('');
    if(!lookupQuery.trim()){setLookupError('Nhập số điện thoại hoặc mã đặt sân để tra cứu.');return;}
    setLookupLoading(true);
    try {
      const results=await bookingApiService.lookup(lookupQuery.trim());
      setLookupResults(results);setHasSearched(true);
    }catch(error){setLookupError(error instanceof Error?error.message:'Chưa tra cứu được dữ liệu. Vui lòng thử lại.');}
    finally{setLookupLoading(false);}
  };

  const handleProceedCancelWithOTP = (ticket: any) => {
    setCancelConfirmation(null);
    setPendingCancelTicket(ticket);
    const targetPhone = ticket.phone || '0912345678';
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setBookingOtp(newOtp);
    setOtpPhone(targetPhone);
    setOtpAction('cancel');
    setOtpInput('');
    setOtpError(false);
    setSmsToast({
      sender: 'COURTX-OTP',
      phone: targetPhone,
      message: `Mã OTP xác thực hủy đơn ${ticket.code} của quý khách là: ${newOtp} (hiệu lực 60s).`,
      otp: newOtp,
    });
    setShowOTP(true);
  };

  const handleCancelTicket = (ticket: any) => {
    if (ticket.status === 'ĐÃ HỦY') return;
    if (ticket.hoursUntilStart !== undefined && ticket.hoursUntilStart < 0) {
      showAlert('Không thể hủy vé', 'Lượt đặt sân này đã bắt đầu hoặc kết thúc nên không thể tự hủy trực tuyến.');
      return;
    }
    // Mở popup xác nhận hỏi rõ khách hàng trước khi hủy (cho cả nhánh >= 24h và < 24h theo đúng BPMN)
    setCancelReasonInput('');
    setCancelConfirmation(ticket);
  };

  const completeCancellation = async (ticket: any, refundEligible: boolean) => {
    setCancelConfirmation(null);
    setPopup({
      type: 'processing',
      title: 'Đang xử lý hủy đặt sân...',
      message: 'Hệ thống đang giải phóng khung giờ và xử lý lệnh hoàn tiền qua VietQR...',
    });

    try {
      const rawRefund = refundEligible
        ? (ticket.rawTotal || Number(String(ticket.total || '').replace(/\D/g, '')) || 120000)
        : 0;

      const fallbackReason = refundEligible
        ? 'Khách hàng tự hủy trên website trước >= 24h (Đủ điều kiện hoàn tiền 100%)'
        : 'Khách hàng tự hủy trên website dưới 24h (Không đủ điều kiện hoàn tiền)';

      const finalReason = cancelReasonInput.trim() || fallbackReason;

      // Kích hoạt phân loại AI & đồng bộ luồng n8n (Chương 4)
      void cancellationWorkflowService.processCancellation({
        booking_id: ticket.code || `DS_${Date.now()}`,
        customer_name: ticket.name,
        customer_phone: ticket.phone,
        court_name: ticket.court || 'Sân thi đấu',
        cancel_reason: finalReason,
        booking_date: ticket.date,
        booking_time: ticket.time,
        refund_amount: rawRefund,
      });

      const res = await bookingApiService.cancelBooking({
        code: ticket.code,
        isEligible: refundEligible,
        reason: finalReason,
        customerPhone: ticket.phone,
        customerName: ticket.name,
        refundAmount: rawRefund,
      });

      if (!res.success) {
        throw new Error(res.message);
      }

      // Cập nhật trạng thái hiển thị ngay trên danh sách tra cứu
      setLookupResults((prev) =>
        prev.map((t) =>
          t.code === ticket.code
            ? {
                ...t,
                status: 'ĐÃ HỦY',
                canCancel: false,
                refundAmount: refundEligible ? `${rawRefund.toLocaleString('vi-VN')} VND` : '0 VND',
                refundStatus: refundEligible ? 'Đã hoàn tiền' : 'Không hoàn tiền',
              }
            : t
        )
      );

      setPopup({
        type: 'cancel-success',
        title: 'Hủy đặt sân thành công!',
        message: `Lịch đặt mã ${ticket.code} (${ticket.court}) đã được hủy và giải phóng thành công.`,
        policyMessage: refundEligible
          ? `Hủy trước ≥ 24h: Hệ thống đã tạo lệnh tự động hoàn tiền 100% (${rawRefund.toLocaleString('vi-VN')} VND) qua VietQR cho quý khách.`
          : 'Hủy trước dưới 24h: Theo quy định, lượt đặt này không được hoàn tiền. Khung giờ đã được giải phóng cho khách khác.',
      });
    } catch (err: any) {
      setPopup({
        type: 'alert',
        title: 'Lỗi hủy đặt sân',
        message: err?.message || 'Không thể hủy đơn lúc này. Vui lòng liên hệ quầy sân để được hỗ trợ.',
      });
    }
  };

  if (isAdminLoggedIn) {
    return currentUser && <AdminDashboard currentUser={currentUser} onLogout={() => { setIsAdminLoggedIn(false); setCurrentUser(null); }} />;
  }

  if (isEmployeeLoggedIn) {
    return currentUser && <EmployeeDashboard currentUser={currentUser} onLogout={() => { setIsEmployeeLoggedIn(false); setCurrentUser(null); }} />;
  }

  if (isVipLoggedIn) {
    return <VipCustomerDashboard onLogout={() => setIsVipLoggedIn(false)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">

      {/* 🟢 TOP HEADER BAR (WHITE & GREEN) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-md shadow-xs">
        <div className="flex items-center justify-between">
          <div onClick={() => handleTabChange('booking')} className="flex items-center gap-2 cursor-pointer select-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
              <span className="text-lg font-black">C</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">COURT<span className="text-emerald-600">X</span></span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Nhà thi đấu đa năng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('lookup')}
              className={`flex h-9 px-3 items-center gap-1.5 rounded-full border text-xs font-bold transition active:scale-95 ${activeTab === 'lookup'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-xs'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100'
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
        <main className="flex-1 space-y-5 p-4 pt-3 pb-24">

          {/* ======================================================== */}
          {/* 1. GIỚI THIỆU TỔ HỢP / HERO SECTION (WHITE & GREEN)      */}
          {/* ======================================================== */}
          <section ref={introRef} className="scroll-mt-16 space-y-3">

            {/* Top Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              THẾ HỆ SÂN ĐẤU MỚI
            </div>

            {/* Hero Headlines */}
            <div>
              <h1 className="text-[24px] font-extrabold leading-[1.2] tracking-tight text-slate-900 min-[380px]:text-[26px]">
                BỨT PHÁ GIỚI HẠN <br />
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  THƯỢNG TRỊ MỌI MẶT SÂN
                </span>
              </h1>
              <p className="mt-2 text-[11px] leading-[1.7] text-slate-600">
                Hệ thống sân đấu đạt tiêu chuẩn thi đấu quốc tế, chiếu sáng chuyên nghiệp Lux LED 1000+, mặt thảm tiêu chuẩn BWF & FIVB mang lại trải nghiệm đỉnh cao.
              </p>
            </div>

            {/* Hero Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => scrollToBooking()}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-2 text-[11px] font-bold uppercase text-white shadow-sm shadow-emerald-500/20 transition active:scale-95 hover:bg-emerald-800 cursor-pointer"
              >
                <Zap className='w-4 h-4' /> ĐẶT SÂN NGAY
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlayingVideo((prev) => !prev);
                  if (!isPlayingVideo) {
                    bannerVideoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border px-2 text-[11px] font-bold uppercase shadow-xs transition active:scale-95 cursor-pointer ${
                  isPlayingVideo
                    ? 'border-emerald-600 bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <Play className={`w-4 h-4 fill-current ${isPlayingVideo ? 'text-white' : 'text-emerald-700'}`} />
                {isPlayingVideo ? 'ĐANG PHÁT VIDEO' : 'XEM VIDEO'}
              </button>
            </div>

            {/* Banner Photo Card / Inline Video Player */}
            <div 
              ref={bannerVideoRef}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-md group transition-all aspect-video w-full"
            >
              {isPlayingVideo ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                  <video
                    src="/video_san.mp4"
                    controls
                    autoPlay
                    playsInline
                    onEnded={() => setIsPlayingVideo(false)}
                    className="w-full h-full object-cover"
                  >
                    Trình duyệt của bạn không hỗ trợ phát video MP4.
                  </video>
                  {/* Nút thu nhỏ / đóng video trở lại ảnh bìa */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlayingVideo(false);
                    }}
                    className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white text-[10px] font-bold shadow-md backdrop-blur-xs transition cursor-pointer border border-white/20 active:scale-95"
                    title="Thu nhỏ và đóng video"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Thu nhỏ</span>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setIsPlayingVideo(true)}
                  className="relative w-full h-full cursor-pointer"
                  title="Bấm để phát video giới thiệu sân CourtX ngay tại đây"
                >
                  <img
                    src="/images/hero_arena.jpg"
                    alt="COURTX Arena Overview"
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent group-hover:bg-slate-950/40 transition"></div>
                  
                  {/* Play Badge Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-emerald-600/95 text-white flex items-center justify-center shadow-lg shadow-emerald-950/50 backdrop-blur-xs group-hover:scale-110 group-hover:bg-emerald-500 transition duration-200">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="rounded-md bg-emerald-500/90 px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-white backdrop-blur-md shadow">
                      CHUẨN THI ĐẤU BWF & FIVB
                    </span>
                    <span className="shrink-0 text-[8px] font-bold text-white shadow flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      <Play className="w-2.5 h-2.5 fill-current text-emerald-400" /> Xem video sân
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3 Stats Counters Grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                [allSports.length.toString().padStart(2, '0'), 'MÔN ĐỈNH CAO'],
                ['100%', 'SÂN THI ĐẤU'],
                ['1000', 'LUX LED'],
              ].map(([val, lbl]) => (
                <div key={lbl} className="rounded-xl border border-slate-200 bg-white px-1.5 py-2 text-center shadow-xs">
                  <p className="text-lg font-extrabold leading-tight text-emerald-600">{val}</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">{lbl}</p>
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
                <h2 className="mt-0.5 text-xl font-black text-slate-900">TỔ HỢP {allSports.length} MÔN CHUẨN ĐẤU</h2>
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
                      {sport.specs.map((spec: string) => (
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
                        className="rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-emerald-800 active:scale-95 cursor-pointer"
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
          <section ref={bookingRef} className="scroll-mt-16 space-y-3 pt-3 border-t border-slate-200">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                ● ĐẶT SÂN & LỊCH TRỐNG REAL-TIME
              </p>
              <h2 className="mt-1 text-base font-bold leading-snug text-slate-900">
                HỆ THỐNG ĐẶT SÂN NHANH, THANH TOÁN TỰ ĐỘNG
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                Chọn môn thể thao, ngày thi đấu và thời gian để giữ lịch thi đấu ngay.
              </p>
            </div>

            {/* ⚡ BƯỚC 1: CHỌN MÔN ĐẶT SÂN */}
            {/* ⚡ BƯỚC 1: CHỌN MÔN THỂ THAO & NIÊM YẾT GIÁ */}
            <div
              id="step-1-sport-section"
              className={`rounded-2xl bg-white p-3 space-y-2.5 shadow-xs scroll-mt-20 transition-all ${
                sportError ? 'border-2 border-rose-500 ring-4 ring-rose-100 shadow-md' : 'border border-slate-200'
              }`}
            >
              {/* Header: 1 CHỌN MÔN ĐẶT SÂN & NIÊM YẾT CHÍNH THỨC */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0 ${
                    sportError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-700'
                  }`}>1</span>
                  <h3 className={`text-[11px] font-bold uppercase ${sportError ? 'text-rose-600' : 'text-slate-900'}`}>
                    CHỌN MÔN ĐẶT SÂN
                  </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-bold uppercase text-emerald-800 border border-emerald-200">
                    NIÊM YẾT CHÍNH THỨC
                  </span>
                  <span className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[8px] font-semibold text-slate-500 border border-slate-200">
                    05:00 – 23:00
                  </span>
                </div>
              </div>

              {sportError && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs font-black text-rose-700 flex items-center gap-2 animate-bounce">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{sportError}</span>
                </div>
              )}

              {/* Bảng chọn các môn thể thao & giá niêm yết (Đồng bộ Real-time từ Supabase) */}
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
                {allSports.map((sportItem) => {
                  const spDetail = (sportsData as Record<string, any>)[sportItem.id] || sportItem;
                  const sportCourts = allCourts.filter((c) => c.sportId === sportItem.id);
                  const isSelected = selectedSportId === sportItem.id;
                  const IconComp = spDetail.iconComp;

                  return (
                    <div
                      key={sportItem.id}
                      onClick={() => {
                        setSelectedSportId(sportItem.id);
                        setSportError(null);
                      }}
                      className={`min-h-14 px-2.5 py-2.5 transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-50/90 border-l-4 border-l-emerald-700 shadow-2xs'
                          : 'hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition text-base ${
                            isSelected
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {IconComp ? (
                            <div className="[&>svg]:h-5 [&>svg]:w-5 flex items-center justify-center">
                              <IconComp />
                            </div>
                          ) : (
                            <span>{sportItem.icon || '🏅'}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-900">
                              {sportItem.name}
                            </span>
                            <span className="text-[8px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {sportCourts.length} sân
                            </span>
                            {isSelected && (
                              <span className="rounded-full bg-emerald-700 px-1.5 py-0.5 text-[8px] font-bold text-white flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" /> ĐÃ CHỌN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-700">
                          {sportItem.pricePerHour.toLocaleString('vi-VN')} VND
                        </div>
                        <div className="text-[9px] font-medium text-slate-400">
                          / giờ / sân
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Note bar */}
              <div className="flex flex-wrap items-center justify-between gap-1 text-[9px] leading-relaxed text-slate-500">
                <span>⚡ Đơn giá cố định, không phụ thu cuối tuần</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% VietQR
                </span>
              </div>
            </div>

            {/* ⚡ BƯỚC 2: CHỌN NGÀY THI ĐẤU */}
            <div
              id="step-2-date-section"
              className={`rounded-2xl bg-white p-3 space-y-2.5 shadow-xs transition-all ${dateError ? 'border-2 border-rose-500 ring-4 ring-rose-100 shadow-md' : 'border border-slate-200'
                }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${dateError ? 'bg-rose-500 animate-pulse' : 'bg-emerald-700'
                    }`}>2</span>
                  <h3 className={`text-[11px] font-bold uppercase ${dateError ? 'text-rose-600' : 'text-slate-900'
                    }`}>CHỌN NGÀY THI ĐẤU</h3>
                </div>

                {/* Interactive Calendar Picker Button */}
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className={`flex h-8 items-center gap-1 px-2 text-[10px] rounded-lg border transition active:scale-95 cursor-pointer ${isDatePickerOpen
                      ? 'border-emerald-600 bg-emerald-700 text-white font-black'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100'
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
                <div className="mx-auto w-full max-w-xs rounded-xl border border-emerald-100 bg-white p-2.5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 space-y-2">
                  {/* Month & Year header */}
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50/60 px-1 py-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="text-center">
                      <span className="text-[11px] font-bold text-slate-800">
                        Tháng {calendarMonth.getMonth() + 1}, {calendarMonth.getFullYear()}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
                      title="Tháng sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div className="grid grid-cols-7 gap-0.5 text-center text-[9px] font-semibold text-slate-400">
                    <div>T2</div>
                    <div>T3</div>
                    <div>T4</div>
                    <div>T5</div>
                    <div>T6</div>
                    <div className="text-emerald-700 font-extrabold">T7</div>
                    <div className="text-red-500 font-extrabold">CN</div>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-0.5 text-[11px]">
                    {calendarDays.map((item, idx) => {
                      const itemTime = new Date(item.dateObj.getFullYear(), item.dateObj.getMonth(), item.dateObj.getDate()).getTime();
                      const baseTime = today.getTime();
                      const isPast = itemTime < baseTime;
                      const isSelected = Boolean(selectedDate) &&
                        scheduleDateObj.getFullYear() === item.dateObj.getFullYear() &&
                        scheduleDateObj.getMonth() === item.dateObj.getMonth() &&
                        scheduleDateObj.getDate() === item.dateObj.getDate();
                      const isToday = itemTime === baseTime;

                      if (isPast) {
                        return (
                          <div
                            key={idx}
                            className="h-8 w-full rounded-lg flex flex-col items-center justify-center font-medium text-[11px] text-slate-300 select-none cursor-not-allowed pointer-events-none"
                          >
                            <span>{item.dayNumber}</span>
                          </div>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectCalendarDay(item.dateObj)}
                          className={[
                            'h-8 w-full rounded-lg flex flex-col items-center justify-center font-semibold transition text-[11px] relative',
                            !item.isCurrentMonth ? 'text-slate-300' : 'text-slate-800',
                            'cursor-pointer hover:bg-emerald-50 hover:text-emerald-800 active:scale-95',
                            isSelected ? 'bg-emerald-700 text-white font-bold hover:bg-emerald-800 hover:text-white shadow-sm' : '',
                            isToday && !isSelected ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold' : ''
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
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const dStr = now.getDate().toString().padStart(2, '0');
                        const mStr = (now.getMonth() + 1).toString().padStart(2, '0');
                        setSelectedDate(`Hôm nay (${dStr}/${mStr})`);
                        setDateError(null);
                        setIsDatePickerOpen(false);
                      }}
                      className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold hover:bg-emerald-100 transition cursor-pointer text-[10px]"
                    >
                      Hôm nay
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-2 py-1 rounded-md text-slate-500 font-semibold hover:bg-slate-50 transition cursor-pointer text-[10px]"
                    >
                      Đóng lịch ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Date Pills: 21 Days Horizon */}
              <div className="flex gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                {/* If user picked a custom date that's not in the 21 days */}
                {selectedDate && !availableDates.some((item) => `${item.label} (${item.date})` === selectedDate) && (
                  <button
                    type="button"
                    className="flex-shrink-0 flex h-12 flex-col items-center justify-center rounded-lg px-2.5 border border-emerald-600 bg-emerald-700 text-white font-bold shadow-sm"
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
                        'flex-shrink-0 flex h-12 min-w-16 flex-col items-center justify-center rounded-lg px-2.5 border transition active:scale-95 cursor-pointer',
                        isSelected
                          ? 'border-emerald-600 bg-emerald-700 text-white font-bold shadow-sm'
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
            <div id="booking-schedule-section" className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-xs scroll-mt-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">3</span>
                  <h3 className="text-[11px] font-bold uppercase text-slate-900">LỊCH SÂN TRỰC QUAN REAL-TIME</h3>
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
                    onClick={() => {
                      setCustomerName('');
                      setCustomerPhone('');
                      setCustomerNote('');
                      resetBookingFormErrors();
                      setShowBookingPopup(true);
                    }}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black px-3.5 py-2 active:scale-95 transition cursor-pointer shadow-xs shrink-0 flex items-center gap-1"
                  >
                    Mở màn hình đặt sân <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-2 py-2 text-center text-[10px] leading-relaxed text-amber-800">
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
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 border-t border-slate-100 pt-3">
              <p><MapPin className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Địa chỉ:</strong> Đường số 6, An Hải, Đà Nẵng</p>
              <p><Phone className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Hotline đặt sân:</strong> <a href="tel:0838598626" className="text-emerald-600 font-bold">0838 598 626</a></p>
              <p><Clock className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Giờ mở cửa:</strong> 05:00 - 23:00 (Tất cả các ngày trong tuần)</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:0838598626"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
              >
                <Phone className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> Gọi Hotline
              </a>
              <a
                href={venueDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
              >
                <MapPin className='w-3.5 h-3.5 inline mr-1' /> Chỉ đường Map
              </a>
            </div>
          </section>

        </main>
      )}

      {/* 🔍 TAB TRA CỨU THÔNG TIN ĐẶT SÂN */}
      {activeTab === 'lookup' && (
        <main className="flex-1 space-y-3 p-4 pt-3 pb-24 animate-in fade-in duration-200">
          <section ref={lookupRef} className="space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600">
                  ● KIỂM TRA LỊCH ĐÃ ĐẶT
                </p>
                <h2 className="mt-1 text-base font-bold leading-snug text-slate-900">
                  TRA CỨU THÔNG TIN ĐẶT SÂN
                </h2>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                  Tra cứu lịch đặt đã lưu bằng mã đặt sân hoặc số điện thoại của khách hàng.
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollToBooking()}
                className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 active:scale-95 transition shrink-0 bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 cursor-pointer"
              >
                <span>Đặt sân</span> →
              </button>
            </div>

            <form onSubmit={handleLookupSearch} className="flex gap-2">
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Mã đặt sân hoặc số điện thoại"
                disabled={lookupLoading}
                className="min-w-0 h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 shadow-xs"
              />
              <button
                type="submit"
                className="h-9 shrink-0 rounded-lg bg-emerald-700 px-3 text-[11px] font-bold uppercase text-white hover:bg-emerald-800 transition shadow-sm active:scale-95 cursor-pointer"
              >
                {lookupLoading?'ĐANG TRA CỨU...':'TRA CỨU'}
              </button>
            </form>

            {lookupLoading&&<p role="status" className="text-xs text-emerald-800">Đang tra cứu trên hệ thống...</p>}
            {lookupError&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{lookupError}</p>}
            {/* Lookup results returned by the backend */}
            {hasSearched ? (
              lookupResults.length > 0 ? (
                <div className="space-y-3">
                  {lookupResults.map((lookupResult) => (
                    <div key={lookupResult.code} className="rounded-xl border border-emerald-200 bg-white p-3 space-y-2 shadow-sm">
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
                        <div className="flex justify-between gap-2"><span className="text-slate-500">Thanh toán:</span><span className="text-right font-semibold text-emerald-800">{lookupResult.paymentStatus}</span></div>
                        {lookupResult.status === 'ĐÃ HỦY' && (
                          <div className="flex justify-between border-t border-slate-100 pt-1.5 mt-1.5">
                            <span className="text-slate-500">Hoàn tiền:</span>
                            <span className={'font-black ' + (lookupResult.paymentStatus === 'ĐÃ HOÀN TIỀN' ? 'text-emerald-600' : 'text-amber-500')}>
                              {lookupResult.refundStatus || 'Chưa có giao dịch hoàn tiền thành công'}
                            </span>
                          </div>
                        )}
                        {lookupResult.status === 'ĐÃ HỦY' && lookupResult.refundAmount && (
                          <div className="flex justify-between text-slate-500">
                            <span>Số tiền hoàn:</span>
                            <span className="font-bold text-slate-800">{lookupResult.refundAmount}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleCancelTicket(lookupResult)}
                          disabled={!lookupResult.canCancel || lookupResult.status === 'ĐÃ HỦY'}
                          className={'w-full rounded-xl border py-2 text-[11px] font-semibold active:scale-95 transition ' + (lookupResult.status === 'ĐÃ HỦY' ? 'border-slate-200 text-slate-400 bg-slate-50' : 'border-red-200 text-red-600 hover:bg-red-50')}
                        >
                          {lookupResult.status === 'ĐÃ HỦY' ? 'Đã hủy' : lookupResult.canCancel ? 'Hủy vé' : 'Không thể hủy (Đã quá giờ)'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center text-[11px] text-slate-500 shadow-xs">
                  <Search className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                  Không tìm thấy thông tin đơn đặt sân phù hợp với từ khóa "<span className="text-slate-900 font-bold">{lookupQuery}</span>".
                </div>
              )
            ) : (
              <p className="rounded-2xl border border-slate-200 bg-white p-2.5 text-[11px] leading-relaxed text-slate-600">Nhập số điện thoại đã dùng khi đặt sân hoặc mã đặt sân để xem thông tin.</p>
            )}
          </section>

          {/* Chính sách hủy vé & hoàn tiền */}
          <section className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2 text-[11px] shadow-xs">
            <h3 className="font-bold text-slate-900 uppercase text-[10px] tracking-wide flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" /> CHÍNH SÁCH HỦY VÉ & HOÀN TIỀN
            </h3>
            <ul className="space-y-1.5 text-slate-600 text-[10px] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Hủy trước ít nhất 24 giờ:</strong> Hoàn 100% số tiền đã thanh toán; khoản hoàn chờ xử lý.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">⚠</span>
                <span><strong>Hủy dưới 24 giờ:</strong> Bạn có thể tiếp tục hủy nhưng sẽ không được hoàn tiền.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Hỗ trợ kỹ thuật / thắc mắc:</strong> Liên hệ hotline <a href="tel:0838598626" className="font-semibold text-emerald-700">0838 598 626</a> để được giải quyết nhanh nhất.</span>
              </li>
            </ul>
          </section>

          {/* Section Liên hệ */}
          <section className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xl font-black">
                <Home className='w-5 h-5' />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">NHÀ THI ĐẤU ĐA NĂNG COURTX</h3>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] leading-relaxed text-slate-700 border-t border-slate-100 pt-2">
              <p><MapPin className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Địa chỉ:</strong> Đường số 6, An Hải, Đà Nẵng</p>
              <p><Phone className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Hotline đặt sân:</strong> <a href="tel:0838598626" className="text-emerald-600 font-bold">0838 598 626</a></p>
              <p><Clock className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> <strong>Giờ mở cửa:</strong> 05:00 - 23:00 (Tất cả các ngày trong tuần)</p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:0838598626"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 text-[11px] font-semibold text-slate-800 hover:bg-slate-100 transition"
              >
                <Phone className='w-3.5 h-3.5 inline mr-1 text-emerald-600' /> Gọi Hotline
              </a>
              <a
                href={venueDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
              >
                <MapPin className='w-3.5 h-3.5 inline mr-1' /> Chỉ đường Map
              </a>
            </div>
          </section>
        </main>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
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
                  {eventFinalPrice.toLocaleString('vi-VN')} VND
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" aria-labelledby="otp-title" className="flex max-h-[90dvh] w-full max-w-xs flex-col items-center overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200">

            <div className="mx-auto mb-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Phone className="h-4 w-4" />
            </div>

            <h3 id="otp-title" className="text-sm font-extrabold text-slate-900">
              {otpAction === 'lookup'
                ? 'Xác thực tra cứu'
                : otpAction === 'cancel'
                  ? 'Xác thực hủy đặt sân'
                  : 'Xác thực OTP'}
            </h3>
            <p className="mb-3 mt-1 text-center text-[11px] leading-relaxed text-slate-500">
              {otpAction === 'cancel' ? (
                <>
                  Nhập mã 6 số để xác nhận hủy vé <br />
                  <strong className="text-slate-800">{otpPhone}</strong>
                </>
              ) : (
                <>
                  Nhập mã xác thực 6 số cho <br />
                  <strong className="text-slate-800">{otpPhone}</strong>
                </>
              )}
            </p>

            {otpAction === 'cancel' && pendingCancelTicket && (
              <div className="w-full mb-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Mã đơn:</span>
                  <span className="font-mono font-bold text-slate-900">{pendingCancelTicket.code}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sân:</span>
                  <span className="font-bold text-slate-800">{pendingCancelTicket.court}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span>Hoàn tiền:</span>
                  <span className={`font-black ${((pendingCancelTicket.hoursUntilStart ?? 0) >= 24) ? 'text-emerald-600' : 'text-red-500'}`}>
                    {((pendingCancelTicket.hoursUntilStart ?? 0) >= 24) ? `${pendingCancelTicket.total} (Hoàn 100%)` : '0 VND (Hủy dưới 24h)'}
                  </span>
                </div>
              </div>
            )}

            <div className="w-full space-y-3">
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  aria-label="Mã OTP gồm 6 chữ số"
                  aria-invalid={otpError}
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/[^0-9]/g, ''));
                    setOtpError(false);
                  }}
                  placeholder="Nhập mã OTP"
                  className={'h-11 w-full rounded-xl border px-3 text-center text-base font-bold tracking-[0.2em] outline-none transition placeholder:text-xs placeholder:font-normal placeholder:tracking-normal focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 ' + (otpError ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 text-slate-900')}
                />
                {otpError && <p className="mt-2 text-center text-[10px] font-bold text-red-500">Mã OTP không chính xác. Vui lòng thử lại!</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowOTP(false);
                    setOtpInput('');
                    setOtpError(false);
                    if (otpAction === 'lookup') {
                      setPendingLookupResults([]);
                      setOtpAction('booking');
                    } else if (otpAction === 'cancel') {
                      setPendingCancelTicket(null);
                      setOtpAction('booking');
                    } else {
                      setShowBookingPopup(true);
                    }
                  }}
                  className="h-10 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 transition hover:bg-slate-50 cursor-pointer active:scale-[0.98]"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  className="h-10 rounded-xl bg-emerald-700 text-xs font-bold text-white transition hover:bg-emerald-800 cursor-pointer active:scale-[0.98]"
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
              <button
                onClick={() => setShowLogin(false)}
                className="rounded-full bg-emerald-700 px-3.5 py-2 text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1 hover:bg-emerald-800 active:scale-95 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> TRANG CHỦ
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col max-w-md mx-auto w-full">
            {loginView === 'login' ? (
              <>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  ĐĂNG NHẬP HỆ THỐNG
                </h2>

                {/* Form Card */}
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="space-y-3">
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
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-700 focus:bg-white transition"
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
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-12 pr-12 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-700 focus:bg-white transition tracking-widest"
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
                    <div className="flex items-center justify-between gap-2 py-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="flex h-4 w-4 items-center justify-center rounded bg-emerald-700 text-white flex-shrink-0">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">Ghi nhớ đăng nhập</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginView('forgot_password');
                          setForgotStep('account');
                          setForgotAccountInput(username.trim());
                          setForgotError(null);
                        }}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >Quên mật khẩu?</button>
                    </div>
                    {loginError&&<p role="alert" className="text-xs text-red-600">{loginError}</p>}
                    <button type="button" disabled={loginSaving}
                      onClick={async () => {
                        if(loginSaving)return;
                        setLoginSaving(true);setLoginError('');
                        try {
                          const account=await staffAuthService.login(username,passwordInput);
                          setCurrentUser({id:account.id,name:account.name,phone:account.phone,role:account.role});
                          setIsAdminLoggedIn(account.authRole==='ADMIN');
                          setIsEmployeeLoggedIn(account.authRole==='STAFF');
                          setShowLogin(false);setUsername('');setPasswordInput('');
                        }catch(error){
                          // Hỗ trợ đăng nhập fallback bằng tài khoản cục bộ / sau khi vừa đổi mật khẩu qua Quên mật khẩu
                          const cleanUser = username.trim().toLowerCase();
                          const matchedKey = Object.keys(accountCredentials).find(
                            k => k.toLowerCase() === cleanUser || accountCredentials[k].phone.replace(/\s+/g, '') === cleanUser.replace(/\s+/g, '')
                          );
                          if (matchedKey && accountCredentials[matchedKey].password === passwordInput) {
                            const cred = accountCredentials[matchedKey];
                            setCurrentUser({ id: matchedKey, name: cred.name, phone: cred.phone, role: cred.role as any });
                            setIsAdminLoggedIn(cred.role === 'admin');
                            setIsEmployeeLoggedIn(cred.role === 'employee');
                            setIsVipLoggedIn(cred.role === 'vip');
                            setShowLogin(false); setUsername(''); setPasswordInput('');
                            return;
                          }
                          setLoginError(error instanceof Error?error.message:'Chưa đăng nhập được.');
                        }
                        finally{setLoginSaving(false);}
                      }}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-xs font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.98] cursor-pointer"
                    >
                      {loginSaving?'Đang đăng nhập...':'ĐĂNG NHẬP HỆ THỐNG'} <Zap className="w-4 h-4 fill-current" />
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
                    setForgotStep('account');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-emerald-700 transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Quay lại Đăng nhập
                </button>

                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    QUÊN MẬT KHẨU
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Khôi phục mật khẩu tài khoản qua mã xác thực OTP.
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
                  <div className={`flex flex-col gap-1 text-center border-b-2 pb-1.5 transition ${forgotStep === 'new_password' || forgotStep === 'success' ? 'border-emerald-600 text-emerald-800' : 'border-slate-200 text-slate-400'}`}>
                    <span className="text-[10px] font-black uppercase">3. Mật khẩu mới</span>
                  </div>
                </div>

                {/* Error Banner (Không chứa gợi ý) */}
                {forgotError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700 animate-in fade-in flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {/* BƯỚC 1: NHẬP SỐ ĐIỆN THOẠI */}
                {forgotStep === 'account' && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
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
                          placeholder="Nhập số điện thoại đăng ký"
                          value={forgotAccountInput}
                          onChange={(e) => {
                            setForgotAccountInput(e.target.value);
                            setForgotError(null);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={() => handleSendForgotOtp()}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-800 active:scale-95 transition cursor-pointer"
                    >
                      {forgotLoading ? 'Đang gửi mã...' : 'Tiếp tục & Gửi mã OTP'} <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                )}

                {/* BƯỚC 2: NHẬP MÃ OTP */}
                {forgotStep === 'otp' && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3 flex items-center justify-between text-xs font-bold text-emerald-900">
                      <span>Mã xác thực đã gửi tới SĐT:</span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-lg bg-emerald-200/70 text-emerald-900 font-black">
                        {forgotAccountInput}
                      </span>
                    </div>

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
                          onClick={() => handleSendForgotOtp()}
                          className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Gửi lại mã OTP
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
                      disabled={forgotLoading}
                      onClick={handleVerifyForgotOtp}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-800 active:scale-95 transition cursor-pointer"
                    >
                      {forgotLoading ? 'Đang xác thực...' : 'Xác nhận mã OTP'} <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                )}

                {/* BƯỚC 3: NHẬP MẬT KHẨU MỚI VÀ XÁC NHẬN MẬT KHẨU */}
                {forgotStep === 'new_password' && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                    <p className="text-xs font-bold text-slate-700">
                      Tạo mật khẩu mới cho tài khoản SĐT <span className="text-emerald-700 font-black">{forgotAccountInput}</span>:
                    </p>

                    <div>
                      <label className="mb-1.5 block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                          value={forgotNewPassInput}
                          onChange={(e) => {
                            setForgotNewPassInput(e.target.value);
                            setForgotError(null);
                          }}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-11 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Ràng buộc mật khẩu */}
                      <p className="mt-2 text-[11px] font-bold text-slate-600 leading-normal">
                        * Phải có ít nhất 8 ký tự, gồm chữ cái, chữ số và ít nhất 1 ký tự đặc biệt
                      </p>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          placeholder="Nhập lại mật khẩu mới"
                          value={forgotConfirmPassInput}
                          onChange={(e) => {
                            setForgotConfirmPassInput(e.target.value);
                            setForgotError(null);
                          }}
                          className={`w-full rounded-2xl border py-3.5 pl-12 pr-11 text-sm font-bold text-slate-900 placeholder-slate-400 outline-none transition ${
                            forgotConfirmPassInput.length > 0
                              ? forgotConfirmPassInput === forgotNewPassInput
                                ? 'border-emerald-500 bg-emerald-50/20 focus:border-emerald-600 focus:bg-white'
                                : 'border-red-500 bg-red-50/30 focus:border-red-600 focus:bg-white'
                              : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:bg-white'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Thông báo kiểm tra khớp mật khẩu */}
                      {forgotConfirmPassInput.length > 0 && (
                        forgotConfirmPassInput === forgotNewPassInput ? (
                          <p className="mt-1.5 text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Mật khẩu xác nhận đã khớp
                          </p>
                        ) : (
                          <p className="mt-1.5 text-[11px] font-bold text-red-600 flex items-center gap-1 animate-in fade-in">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Mật khẩu xác nhận không khớp
                          </p>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={handleResetPassword}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-800 active:scale-95 transition cursor-pointer"
                    >
                      {forgotLoading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'} <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                )}

                {/* BƯỚC 4: THÀNH CÔNG */}
                {forgotStep === 'success' && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center space-y-4 animate-in zoom-in-95">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border-2 border-emerald-300">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase">
                        Đổi mật khẩu thành công!
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
                        Mật khẩu tài khoản SĐT <strong className="text-emerald-700 font-black">{forgotAccountInput}</strong> đã được cập nhật thành công. Vui lòng đăng nhập với mật khẩu mới.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginView('login');
                        setUsername(forgotAccountInput);
                        setPasswordInput(forgotNewPassInput);
                        setForgotStep('account');
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-800 active:scale-95 transition cursor-pointer"
                    >
                      Đăng nhập ngay <Zap className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Xác nhận hủy sân theo nhánh BPMN */}
      {cancelConfirmation && (() => {
        const isEligible = (cancelConfirmation.hoursUntilStart ?? 0) >= 24;
        return (
          <div
            className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-booking-title"
          >
            <div className="w-full max-w-sm space-y-4 rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-2">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isEligible ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                  {isEligible ? (
                    <CheckCircle2 className="h-7 w-7" />
                  ) : (
                    <AlertTriangle className="h-7 w-7" />
                  )}
                </div>
              </div>

              <div>
                <h3 id="cancel-booking-title" className="text-base font-black text-slate-900">
                  Xác nhận hủy đặt sân
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Mã đơn: <span className="font-mono font-bold text-slate-900">{cancelConfirmation.code}</span> · {cancelConfirmation.court}
                </p>
              </div>

              {isEligible ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs space-y-1">
                  <p className="font-bold text-emerald-800 flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    Đủ điều kiện hoàn tiền
                  </p>
                  <p className="text-slate-600 text-xs">
                    Số tiền hoàn lại: <strong className="text-emerald-700 font-extrabold">{cancelConfirmation.total}</strong>
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-xs space-y-1">
                  <p className="font-bold text-red-800 flex items-center justify-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    Hủy dưới 24h: Không được hoàn tiền
                  </p>
                  <p className="text-slate-600 text-xs">
                    Số tiền hoàn lại: <strong className="text-red-600 font-extrabold">0 VND</strong>
                  </p>
                </div>
              )}

              {/* Ô nhập lý do hủy (Phân loại AI n8n - Chương 4) */}
              <div className="text-left space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                  <span>Lý do hủy sân:</span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" /> Phân loại tự động AI
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="Nhập lý do hủy (VD: Trời mưa bão to ngập đường, bận việc đột xuất, thiếu người chơi...)"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition shadow-2xs"
                />
                <div className="flex items-center gap-1 flex-wrap text-[10px]">
                  {['Mưa bão ngập đường', 'Bận việc cá nhân', 'Đội hình thiếu người', 'Đặt nhầm ngày giờ'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setCancelReasonInput(sample)}
                      className="rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-1.5 py-0.5 transition cursor-pointer border border-slate-200"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-700 font-medium">
                Bạn có chắc chắn muốn hủy lịch đặt sân này?
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCancelConfirmation(null)}
                  className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedCancelWithOTP(cancelConfirmation)}
                  className={`rounded-xl py-2.5 text-xs font-bold text-white active:scale-95 transition cursor-pointer shadow-sm ${isEligible
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {isEligible ? 'Xác nhận hủy' : 'Vẫn hủy sân'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🟣 CUSTOM POPUP */}
      {popup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            {popup.type === 'processing' ? (
              <div className="space-y-3 py-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{popup.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{popup.message}</p>
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-full w-fit mx-auto border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Đang giao dịch qua cổng thanh toán...
                </div>
              </div>
            ) : popup.type === 'cancel-success' ? (
              <div className="space-y-3">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-600">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 12 4 4 8-9" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900">{popup.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{popup.message}</p>
                <p className="text-xs font-semibold leading-relaxed text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  {popup.policyMessage}
                </p>
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer active:scale-95 transition"
                >
                  Đóng
                </button>
              </div>
            ) : (
              <>
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
                      setPopup(null);
                      if (currentPopup.type === 'confirm' && currentPopup.onConfirm) {
                        setTimeout(() => currentPopup.onConfirm(), 10);
                      }
                    }}
                    className="rounded-xl bg-emerald-700 py-3.5 text-xs font-bold text-white hover:bg-emerald-800 active:scale-95 transition shadow-sm"
                  >
                    {popup.type === 'confirm' ? 'Có, xác nhận' : 'Đóng'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Booking details */}
      {showBookingPopup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" aria-labelledby="booking-popup-title" className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl animate-in slide-in-from-bottom-6 duration-200">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarIcon className="h-4 w-4" /></div>
                <div>
                  <h2 id="booking-popup-title" className="text-sm font-extrabold text-slate-900">Chi tiết đặt sân</h2>
                  <p className="mt-0.5 text-[11px] text-slate-500">Kiểm tra lịch và thông tin người đặt</p>
                </div>
              </div>
              <button type="button" aria-label="Đóng chi tiết đặt sân" onClick={() => { setShowBookingPopup(false); resetBookingFormErrors(); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-emerald-700"><X className="h-4 w-4" /></button>
            </div>

            <form onSubmit={handleBookingSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 py-3">
                <section aria-label="Thông tin sân và thời gian" className="space-y-3">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">{currentSport?.name || ''}</p>
                        <h3 className="mt-0.5 text-lg font-extrabold tracking-tight text-emerald-800">{selectedCourt}</h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Đã chọn sân</span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 border-t border-emerald-100 pt-2 text-xs font-semibold text-slate-700"><CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />{selectedDate}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="min-w-0 space-y-1">
                      <label htmlFor="customer-booking-start" className="block text-[11px] font-semibold text-slate-500">Giờ bắt đầu</label>
                      <IncidentSelect id="customer-booking-start" value={selectedStartTime} options={filteredStartTimeOptions.map(value => ({ value, label: value }))} placeholder="Chọn giờ" searchPlaceholder="Giờ bắt đầu" searchable={false} disabled={!filteredStartTimeOptions.length} onChange={handleStartTimeChange} />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <label htmlFor="customer-booking-end" className="block text-[11px] font-semibold text-slate-500">Giờ kết thúc</label>
                      <IncidentSelect id="customer-booking-end" value={selectedEndTime} options={endTimeOptions.map(value => ({ value, label: value }))} placeholder="Chọn giờ" searchPlaceholder="Giờ kết thúc" searchable={false} disabled={!endTimeOptions.length} onChange={handleEndTimeChange} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="booking-duration" className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Clock className="h-3.5 w-3.5" />Thời lượng</label>
                    <div className="w-36 max-w-[60%]">
                      <IncidentSelect id="booking-duration" value={String(selectedDuration)} options={availableDurations.map(dur => ({ value: String(dur), label: dur === 30 ? '30 phút' : dur % 60 === 0 ? `${dur / 60} giờ` : `${Math.floor(dur / 60)} giờ 30 phút` }))} placeholder="Chọn thời lượng" searchPlaceholder="Thời lượng" searchable={false} compact onChange={value => handleDurationChange(Number(value))} />
                    </div>
                  </div>
                  {conflictBooking && (
                    <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div><p className="font-bold">Khung giờ đã được đặt</p><p className="mt-1 leading-relaxed">{selectedStartTime} – {selectedEndTime} bị trùng lịch trên {selectedCourt}. Vui lòng chọn giờ khác.</p></div>
                    </div>
                  )}
                </section>

                <section className="space-y-2.5 border-t border-slate-100 pt-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900"><User className="h-3.5 w-3.5 text-emerald-700" />Thông tin người đặt</h3>
                  <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
                    <label className="space-y-1 text-[11px] font-semibold text-slate-500">
                      <span>Họ và tên <span className="text-red-500">*</span></span>
                      <input
                        type="text"
                        autoComplete="name"
                        value={customerName}
                        onChange={e => handleCustomerNameChange(e.target.value)}
                        onBlur={handleCustomerNameBlur}
                        placeholder="Nhập họ và tên (tối thiểu 5 ký tự)"
                        aria-invalid={Boolean(bookingNameError)}
                        className={`h-10 w-full rounded-xl border px-3 text-xs font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 ${
                          bookingNameError
                            ? 'border-red-400 bg-red-50/40 text-red-900 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                            : 'border-slate-200 bg-slate-50 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100'
                        }`}
                      />
                      {bookingNameError && (
                        <p role="alert" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-tight text-red-600">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                          <span>{bookingNameError}</span>
                        </p>
                      )}
                    </label>
                    <label className="space-y-1 text-[11px] font-semibold text-slate-500">
                      <span>Số điện thoại <span className="text-red-500">*</span></span>
                      <input
                        type="tel"
                        autoComplete="tel"
                        value={customerPhone}
                        onChange={e => handleCustomerPhoneChange(e.target.value)}
                        onBlur={handleCustomerPhoneBlur}
                        placeholder="Ví dụ: 0912345678 (10 số)"
                        maxLength={11}
                        aria-invalid={Boolean(bookingPhoneError)}
                        className={`h-10 w-full rounded-xl border px-3 text-xs font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 ${
                          bookingPhoneError
                            ? 'border-red-400 bg-red-50/40 text-red-900 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                            : 'border-slate-200 bg-slate-50 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100'
                        }`}
                      />
                      {bookingPhoneError && (
                        <p role="alert" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-tight text-red-600">
                          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                          <span>{bookingPhoneError}</span>
                        </p>
                      )}
                    </label>
                  </div>
                  <label className="block space-y-1 text-[11px] font-semibold text-slate-500">
                    <span>Ghi chú <span className="font-normal text-slate-400">(tùy chọn)</span></span>
                    <input type="text" value={customerNote} onChange={e => setCustomerNote(e.target.value)} placeholder="Yêu cầu thêm cho lượt đặt" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100" />
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 py-1 text-[11px] leading-relaxed text-slate-600">
                    <input type="checkbox" checked={sendZalo} onChange={e => setSendZalo(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-emerald-700" />
                    <span>Nhận vé và nhắc lịch qua Zalo/SMS</span>
                  </label>
                </section>
              </div>

              <div className="shrink-0 space-y-2.5 border-t border-slate-100 bg-white px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3">
                <div className="flex items-end justify-between gap-2">
                  <div><p className="text-xs font-bold text-slate-700">Tổng thanh toán</p><p className="mt-0.5 text-[10px] text-slate-400">{currentSport?.pricePerHour.toLocaleString('vi-VN')} VND/giờ · {selectedDuration} phút</p></div>
                  <strong className={`text-2xl font-extrabold tracking-tight ${conflictBooking ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>{formattedPrice}</strong>
                </div>
                <button type="submit" disabled={Boolean(conflictBooking)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">
                  Thanh toán qua VietQR <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟡 MODAL THANH TOÁN (PAYMENT BOTTOM SHEET) */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col items-center max-h-[92vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-4 sm:hidden"></div>

            {/* Trạng thái Tạm giữ sân */}
            {paymentCd > 0 ? (
              <div className="w-full mb-3 flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 text-[11px] text-emerald-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Đang tạm giữ {selectedCourt}
                </span>
                <span className="text-[10px] font-semibold flex items-center gap-1">
                  <span className="text-emerald-800">Tạm giữ ưu tiên:</span>
                  <span className={`font-mono font-bold px-1.5 py-0.5 rounded transition ${
                    paymentCd <= 20
                      ? 'bg-amber-100 text-amber-800 animate-pulse ring-1 ring-amber-300'
                      : 'bg-emerald-100/90 text-emerald-900'
                  }`}>
                    {Math.floor(paymentCd / 60)}:{(paymentCd % 60).toString().padStart(2, '0')}
                  </span>
                </span>
              </div>
            ) : (
              <div className="w-full mb-3 flex items-start gap-2.5 bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-[11px] text-amber-900 leading-tight animate-in fade-in">
                <Clock className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
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

            {/* Thông báo nhắc nhở sau 8 phút (chỉ hiển thị khi còn trong thời gian giữ sân paymentCd > 0) */}
            {paymentNotification && paymentCd > 0 && (
              <div className="w-full mb-3 rounded-xl bg-amber-500 text-white p-2.5 text-xs font-bold flex items-center justify-between shadow-md animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 shrink-0" />
                  <span className="text-[11px] leading-tight">{paymentNotification}</span>
                </div>
                <button type="button" onClick={() => setPaymentNotification(null)} className="text-white/80 hover:text-white ml-2 text-xs">✕</button>
              </div>
            )}

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wide">Thanh toán đơn hàng</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-3 text-center">Quét mã VietQR bằng ứng dụng ngân hàng</p>

            {/* Trường hợp lỗi kỹ thuật thanh toán (Boundary Error Event Event_02s9rdl -> Activity_1mjvkbj) */}
            {paymentTechnicalError ? (
              <div className="w-full space-y-4 my-2 animate-in fade-in">
                <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-center space-y-2">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-black text-red-950 uppercase tracking-wide">Thông báo lỗi kỹ thuật thanh toán</h4>
                  <p className="text-[11px] text-red-700 leading-relaxed font-medium">
                    {paymentTechnicalError}
                  </p>
                </div>

                {/* Exclusive Gateway Gateway_1ukmj3e: Thanh toán lại ? */}
                <div className="rounded-xl bg-slate-50 p-2.5 text-center border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-700">Khách có muốn thanh toán lại không?</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRetryPayment}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Thanh toán lại
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAfterPaymentError}
                    className="rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Thẻ VietQR chuẩn */}
                <div className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-4 relative overflow-hidden text-center">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-extrabold text-slate-900 text-sm">MB BANK</p>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700">VIETQR</span>
                  </div>

                  <QrCodeArtwork className="mx-auto h-36 w-36" value={mobilePaymentUrl} />
                  <div className="mt-2 text-center">
                    <p className="text-[11px] font-bold text-slate-700">📱 Lấy điện thoại quét mã QR để chuyển tiền</p>
                    <a
                      href={localSimulatorUrl || mobilePaymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block mt-0.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      (Hoặc bấm vào đây để mở trang giả lập điện thoại)
                    </a>
                  </div>

                  <div className="mt-3 space-y-1 text-xs">
                    <p className="text-slate-500">Số tiền thanh toán:</p>
                    <p className="text-2xl font-black text-emerald-600">{totalPrice.toLocaleString('vi-VN')} VND</p>
                    <p className="text-slate-500 mt-1.5">Nội dung chuyển khoản:</p>
                    <p className="font-mono font-bold text-slate-900 bg-white py-1 rounded border border-slate-200 uppercase text-xs">
                      CX {selectedCourt.replace(/ /g, '')} {customerPhone}
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

                <div className="w-full mt-3">
                  <button
                    onClick={handleCancelPaymentClick}
                    type="button"
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
      {showCancelSubprocessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
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
                onClick={() => setShowCancelSubprocessModal(false)}
                className="rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
              >
                Tiếp tục thanh toán
              </button>
              <button
                type="button"
                onClick={handleExecuteCancelSubprocess}
                className="rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 active:scale-95 transition cursor-pointer"
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🔴 MODAL XÁC NHẬN ĐẶT SÂN THÀNH CÔNG                    */}
      {/* ======================================================== */}
      {isSubmitted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-300 bg-white p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600 border border-emerald-300">
              ✓
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900">ĐẶT SÂN THÀNH CÔNG!</h3>
              <p className="mt-1 text-xs text-slate-600">
                Mã đơn của bạn là <span className="font-mono font-bold text-emerald-600">{orderCode}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mã thanh toán: <span className="font-mono font-bold text-blue-700">{paymentCode}</span>
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-left text-xs space-y-2 border border-slate-200">
              <div className="flex justify-between"><span className="text-slate-500">Môn:</span> <span className="font-bold text-slate-900">{currentSport?.name || ''}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Sân:</span> <span className="font-bold text-emerald-600">{selectedCourt}</span></div>
              <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3">
                <span className="text-slate-500">Ngày & giờ:</span>
                <span className="text-right font-bold text-slate-900">{selectedDate} · {selectedSlot}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Đã thanh toán đủ 100% qua VietQR:</span> <span className="font-black text-emerald-600">{totalPrice.toLocaleString('vi-VN')} VND</span></div>
            </div>

            <p className="text-[11px] text-slate-500">
              Số điện thoại liên hệ cho lượt đặt: <strong className="text-slate-900">{customerPhone}</strong>.
            </p>

            <div className="w-full rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700 text-center">
              ⚠ Lưu ý: Vui lòng in hoặc chụp lại biên nhận để nhận sân.
            </div>

            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowReceipt(true)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 cursor-pointer active:scale-95"
              >
                📋 BIÊN NHẬN
              </button>
              <button
                type="button"
                onClick={() => { setIsSubmitted(false); setShowReceipt(false); }}
                className="flex-1 rounded-xl bg-emerald-700 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-800"
              >
                HOÀN TẤT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📋 MODAL BIÊN NHẬN ĐẶT SÂN (KHÁCH HÀNG)                  */}
      {/* ======================================================== */}
      {showReceipt && isSubmitted && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-emerald-700 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <div>
                  <p className="text-xs font-black text-white uppercase tracking-wider">BIÊN NHẬN ĐẶT SÂN</p>
                  <p className="text-[10px] text-emerald-200">CourtX Arena · Hóa đơn điện tử</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  title="Tải ảnh biên nhận (.png)"
                  aria-label="Tải ảnh biên nhận (.png)"
                  className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-600/60 transition cursor-pointer flex items-center justify-center"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceipt(false)}
                  className="text-white/70 hover:text-white text-lg font-bold p-1 leading-none cursor-pointer"
                  title="Đóng"
                  aria-label="Đóng"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã biên nhận (Vé):</span>
                <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{orderCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Mã thanh toán:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{paymentCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="font-bold text-slate-900">{customerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-medium text-slate-700">{customerPhone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Bộ môn & Sân:</span>
                <span className="font-bold text-slate-900">{currentSport?.name || ''} · {selectedCourt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-bold text-slate-900">{selectedDate} · {selectedSlot}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Phương thức:</span>
                <span className="font-bold text-emerald-700">VietQR (100%)</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                <span className="font-bold text-slate-800">Tổng tiền thanh toán:</span>
                <span className="font-black text-emerald-600 text-sm">{totalPrice.toLocaleString('vi-VN')} VND</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">✓ Đã thanh toán</span>
              </div>
            </div>

            {/* Note */}
            <div className="mx-5 mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-700 text-center">
              ⚠ Lưu ý: Vui lòng in hoặc chụp lại biên nhận để nhận sân.
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-95"
              >
                🖨 In biên nhận
              </button>
              <button
                type="button"
                onClick={() => setShowReceipt(false)}
                className="flex-1 rounded-xl bg-emerald-700 py-3 text-xs font-black text-white hover:bg-emerald-800 cursor-pointer active:scale-95"
              >
                Đóng
              </button>
            </div>
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
