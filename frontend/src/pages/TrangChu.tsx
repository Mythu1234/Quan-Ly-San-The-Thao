import AdminDashboard from './AdminDashboard';
import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Phone, Clock, Play, AlertCircle, Home, Calendar as CalendarIcon, Zap , User, Lock, Eye, Bell, Key, ArrowLeft} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'intro' | 'booking' | 'lookup'>('booking');

  // Booking Form State
  const [selectedSportId, setSelectedSportId] = useState<'badminton' | 'football' | 'volleyball'>('badminton');
  const [selectedDate, setSelectedDate] = useState<string>('Hôm nay (18/09)');
  const [selectedCourt, setSelectedCourt] = useState<string>('Sân 01');
  
  // Time Selection State
  const [selectedStartTime, setSelectedStartTime] = useState<string>('05:00');
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // minutes
  
  // Customer Info State
  const [customerName, setCustomerName] = useState<string>('Nguyễn Văn An');
  const [customerPhone, setCustomerPhone] = useState<string>('0912345678');
  const [customerNote, setCustomerNote] = useState<string>('');
  const [sendZalo, setSendZalo] = useState<boolean>(true);

  // Order Submission State
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [showOTP, setShowOTP] = useState<boolean>(false);
  const [showLogin, setShowLogin] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<boolean>(false);
  const [popup, setPopup] = useState<any>(null);
  const showAlert = (title: string, message: string) => setPopup({ type: 'alert', title, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setPopup({ type: 'confirm', title, message, onConfirm });
  const [orderCode, setOrderCode] = useState<string>('CX-88291');

  // Lookup Search State
  const [lookupQuery, setLookupQuery] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Section Refs for smooth scrolling
  const introRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const lookupRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: 'intro' | 'booking' | 'lookup') => {
    setActiveTab(tab);
    if (tab === 'intro' && introRef.current) {
      introRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'booking' && bookingRef.current) {
      bookingRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (tab === 'lookup' && lookupRef.current) {
      lookupRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
      pricePerHour: 300000,
      priceLabel: '300.000đ / GIỜ',
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
      pricePerHour: 200000,
      priceLabel: '200.000đ / GIỜ',
      image: '/images/volleyball.jpg',
      icon: VolleyballIcon,
      courts: [],
    },
  };

  const currentSport = sportsData[selectedSportId];

  // Dates list
  const availableDates = [
    { label: 'Hôm nay', date: '18/09' },
    { label: 'Thứ 6', date: '19/09' },
    { label: 'Thứ 7', date: '20/09' },
    { label: 'Chủ Nhật', date: '21/09' },
    { label: 'Thứ 2', date: '22/09' },
    { label: 'Thứ 3', date: '23/09' },
  ];

  // Logic for Time Generation (05:00 - 23:00, block 17:30 - 21:00)
  const generateStartTimes = () => {
    const times = [];
    for (let h = 5; h <= 22; h++) {
      for (let m of ['00', '30']) {
        const timeVal = h + (m === '30' ? 0.5 : 0);
        // Valid start times: <= 16.5 (so max duration can reach 17.5) OR >= 21
        if (timeVal <= 16.5 || (timeVal >= 21 && timeVal <= 22)) {
          times.push(`${h.toString().padStart(2, '0')}:${m}`);
        }
      }
    }
    return times;
  };

  const getAvailableDurations = (startTimeStr: string) => {
    if (!startTimeStr) return [60];
    const [h, m] = startTimeStr.split(':').map(Number);
    const startVal = h + m / 60;
    
    let maxEndVal = 23; // close at 23:00
    if (startVal <= 16.5) {
      maxEndVal = 17.5; // force end before 17:30 block
    }
    
    const maxDurationHours = maxEndVal - startVal;
    const durations = [];
    for (let d = 1; d <= maxDurationHours; d += 0.5) {
      durations.push(d * 60); // minutes
    }
    return durations;
  };

    // Dynamic capacity logic: 8 Badminton = 2 Volleyball = 1 Football
  const mockBookings = [
    { date: 'Hôm nay (18/09)', time: '17:00', sport: 'volleyball' }, // uses 4 capacity
  ];

  const getAvailableCourts = (sportId: string, date: string, time: string) => {
    let usedCapacity = 0;
    mockBookings.forEach(b => {
      if (b.date === date && b.time === time) {
        if (b.sport === 'football') usedCapacity += 8;
        if (b.sport === 'volleyball') usedCapacity += 4;
        if (b.sport === 'badminton') usedCapacity += 1;
      }
    });

    const available = 8 - usedCapacity;
    const courts = [];
    if (sportId === 'football') {
      const count = Math.floor(available / 8);
      for(let i=1; i<=count; i++) courts.push('Sân Bóng Đá ' + i);
    } else if (sportId === 'volleyball') {
      const count = Math.floor(available / 4);
      for(let i=1; i<=count; i++) courts.push('Sân Bóng Chuyền ' + i);
    } else {
      for(let i=1; i<=available; i++) courts.push('Sân Cầu Lông ' + i);
    }
    return courts.length > 0 ? courts : ['Hết sân trống'];
  };

  const availableCourts = getAvailableCourts(selectedSportId, selectedDate, selectedStartTime);

  useEffect(() => {
    if (!availableCourts.includes(selectedCourt)) {
      setSelectedCourt(availableCourts[0]);
    }
  }, [selectedSportId, selectedDate, selectedStartTime, availableCourts]);

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
  const selectedSlot = `${selectedStartTime} - ${getEndTime(selectedStartTime, selectedDuration)}`;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
      setShowPayment(true);
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
      showConfirm('Xác nhận hủy vé', 'Bạn có chắc chắn muốn hủy vé này không? Hành động này không thể hoàn tác.', () => {
        showAlert('Đã gửi yêu cầu hoàn tiền', 'Hệ thống đã tiếp nhận yêu cầu hủy vé.\n\nVui lòng đợi xử lý trong vòng 24h và kiểm tra trạng thái hoàn tiền tại mục Tra cứu thông tin đặt sân.');
        setLookupResult({ ...ticket, status: 'ĐÃ HỦY', paymentStatus: 'ĐANG XỬ LÝ HOÀN TIỀN' });
      });
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
              AN
            </button>
          </div>
        </div>
      </header>

      {/* ⚪ MAIN LIGHT CONTENT */}
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

          {/* ⚡ BƯỚC 3: LỰA CHỌN SÂN VÀ THỜI GIAN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">3</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">CHỌN SÂN & THỜI GIAN</h3>
              </div>
            </div>

            {/* Court sub-selector */}
            <div>
              <label className="mb-2 block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Chọn Sân</label>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {availableCourts.map((court) => {
                  const isCourtSelected = selectedCourt === court;
                  return (
                    <button
                      key={court}
                      type="button"
                      onClick={() => setSelectedCourt(court)}
                      className={[
                        'rounded-lg px-3 py-1.5 text-xs font-bold transition',
                        isCourtSelected
                          ? 'bg-emerald-50 border border-emerald-500 text-emerald-700 font-extrabold'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300',
                      ].join(' ')}
                    >
                      {court}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Giờ Bắt Đầu</label>
                  <select 
                    value={selectedStartTime}
                    onChange={(e) => handleStartTimeSelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  >
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
              
              <div className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-800">Khung giờ đã chọn:</span>
                <span className="text-sm font-black text-emerald-600">{selectedSlot}</span>
              </div>
            </div>

            {/* Notice Alert Box */}
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
              <p>
                <strong>Lưu ý:</strong> Khung giờ 17:30 - 21:00 hệ thống không nhận khách đặt sân do ưu tiên phục vụ khách lẻ (vãng lai).
              </p>
            </div>
          </div>

          {/* ⚡ BƯỚC 4: TÓM TẮT ĐƠN ĐẶT SÂN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
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
                  } else {
                    showAlert('Sai thông tin', 'Vui lòng nhập tài khoản: admin \n Mật khẩu: admin');
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
                <p className="text-2xl font-black text-emerald-600">{formattedPrice}</p>
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
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Tổng thanh toán:</span> <span className="font-black text-emerald-600">{formattedPrice}</span></div>
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
            onClick={() => handleTabChange('intro')}
            className={[
              'flex flex-col items-center gap-1 transition active:scale-95',
              activeTab === 'intro' ? 'text-emerald-600 font-extrabold' : 'text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            <span className="text-lg"><Home className='w-5 h-5' /></span>
            <span className="text-[10px] uppercase tracking-wider">Giới thiệu</span>
          </button>

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
        </div>
      </footer>
    </div>
  );
}
