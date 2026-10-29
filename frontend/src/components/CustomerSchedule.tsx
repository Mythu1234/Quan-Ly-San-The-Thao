import { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, LayoutGrid, CheckCircle2, ArrowRight } from 'lucide-react';

export interface CourtItem {
  id: string;
  code: string;
  name: string;
  sportId: 'badminton' | 'volleyball' | 'football';
  sportName: string;
  pricePerHour: number;
}

export const STANDARD_15_COURTS: CourtItem[] = [
  // 5 Sân Cầu lông (CL-01 -> CL-05): 120.000 VNĐ / giờ
  { id: 'SAN_CL_01', code: 'CL-01', name: 'Sân CL-01', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000 },
  { id: 'SAN_CL_02', code: 'CL-02', name: 'Sân CL-02', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000 },
  { id: 'SAN_CL_03', code: 'CL-03', name: 'Sân CL-03', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000 },
  { id: 'SAN_CL_04', code: 'CL-04', name: 'Sân CL-04', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000 },
  { id: 'SAN_CL_05', code: 'CL-05', name: 'Sân CL-05', sportId: 'badminton', sportName: 'Cầu Lông', pricePerHour: 120000 },

  // 5 Sân Bóng chuyền (BC-01 -> BC-05): 150.000 VNĐ / giờ
  { id: 'SAN_BC_01', code: 'BC-01', name: 'Sân BC-01', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000 },
  { id: 'SAN_BC_02', code: 'BC-02', name: 'Sân BC-02', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000 },
  { id: 'SAN_BC_03', code: 'BC-03', name: 'Sân BC-03', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000 },
  { id: 'SAN_BC_04', code: 'BC-04', name: 'Sân BC-04', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000 },
  { id: 'SAN_BC_05', code: 'BC-05', name: 'Sân BC-05', sportId: 'volleyball', sportName: 'Bóng Chuyền', pricePerHour: 150000 },

  // 5 Sân Bóng đá mini (BD-01 -> BD-05): 200.000 VNĐ / giờ
  { id: 'SAN_BD_01', code: 'BD-01', name: 'Sân BD-01', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000 },
  { id: 'SAN_BD_02', code: 'BD-02', name: 'Sân BD-02', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000 },
  { id: 'SAN_BD_03', code: 'BD-03', name: 'Sân BD-03', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000 },
  { id: 'SAN_BD_04', code: 'BD-04', name: 'Sân BD-04', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000 },
  { id: 'SAN_BD_05', code: 'BD-05', name: 'Sân BD-05', sportId: 'football', sportName: 'Bóng Đá Mini', pricePerHour: 200000 },
];

export interface CourtBookingRecord {
  id: string;
  courtCode: string;
  courtName: string;
  sportId: 'badminton' | 'volleyball' | 'football';
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  title?: string;
}

export const STANDARD_15_BOOKINGS: CourtBookingRecord[] = [
  // Cầu lông
  { id: 'b-cl1-1', courtCode: 'CL-01', courtName: 'Sân CL-01', sportId: 'badminton', startH: 6, startM: 0, endH: 7, endM: 0, title: 'Đã đặt' },
  { id: 'b-cl1-2', courtCode: 'CL-01', courtName: 'Sân CL-01', sportId: 'badminton', startH: 17, startM: 0, endH: 19, endM: 0, title: 'Đã đặt' },
  { id: 'b-cl2-1', courtCode: 'CL-02', courtName: 'Sân CL-02', sportId: 'badminton', startH: 8, startM: 0, endH: 9, endM: 30, title: 'Đã đặt' },
  { id: 'b-cl2-2', courtCode: 'CL-02', courtName: 'Sân CL-02', sportId: 'badminton', startH: 18, startM: 0, endH: 20, endM: 0, title: 'Đã đặt' },
  { id: 'b-cl3-1', courtCode: 'CL-03', courtName: 'Sân CL-03', sportId: 'badminton', startH: 14, startM: 0, endH: 16, endM: 0, title: 'Đã đặt' },
  { id: 'b-cl4-1', courtCode: 'CL-04', courtName: 'Sân CL-04', sportId: 'badminton', startH: 19, startM: 0, endH: 21, endM: 0, title: 'Đã đặt' },
  { id: 'b-cl5-1', courtCode: 'CL-05', courtName: 'Sân CL-05', sportId: 'badminton', startH: 7, startM: 0, endH: 8, endM: 30, title: 'Đã đặt' },

  // Bóng chuyền
  { id: 'b-bc1-1', courtCode: 'BC-01', courtName: 'Sân BC-01', sportId: 'volleyball', startH: 8, startM: 0, endH: 10, endM: 0, title: 'Đã đặt' },
  { id: 'b-bc1-2', courtCode: 'BC-01', courtName: 'Sân BC-01', sportId: 'volleyball', startH: 16, startM: 0, endH: 18, endM: 0, title: 'Đã đặt' },
  { id: 'b-bc2-1', courtCode: 'BC-02', courtName: 'Sân BC-02', sportId: 'volleyball', startH: 15, startM: 0, endH: 17, endM: 0, title: 'Đã đặt' },
  { id: 'b-bc3-1', courtCode: 'BC-03', courtName: 'Sân BC-03', sportId: 'volleyball', startH: 18, startM: 0, endH: 20, endM: 0, title: 'Đã đặt' },
  { id: 'b-bc5-1', courtCode: 'BC-05', courtName: 'Sân BC-05', sportId: 'volleyball', startH: 19, startM: 0, endH: 21, endM: 0, title: 'Đã đặt' },

  // Bóng đá mini
  { id: 'b-bd1-1', courtCode: 'BD-01', courtName: 'Sân BD-01', sportId: 'football', startH: 6, startM: 0, endH: 7, endM: 30, title: 'Đã đặt' },
  { id: 'b-bd1-2', courtCode: 'BD-01', courtName: 'Sân BD-01', sportId: 'football', startH: 17, startM: 0, endH: 19, endM: 0, title: 'Đã đặt' },
  { id: 'b-bd2-1', courtCode: 'BD-02', courtName: 'Sân BD-02', sportId: 'football', startH: 18, startM: 0, endH: 20, endM: 0, title: 'Đã đặt' },
  { id: 'b-bd3-1', courtCode: 'BD-03', courtName: 'Sân BD-03', sportId: 'football', startH: 19, startM: 0, endH: 21, endM: 0, title: 'Đã đặt' },
  { id: 'b-bd4-1', courtCode: 'BD-04', courtName: 'Sân BD-04', sportId: 'football', startH: 17, startM: 30, endH: 19, endM: 0, title: 'Đã đặt' },
];

export interface ScheduleBooking {
  id: string;
  sport: 'badminton' | 'volleyball' | 'football';
  sportName: string;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  courtCode: string;
  courtName: string;
}

interface CustomerScheduleProps {
  initialSport?: 'all' | 'badminton' | 'volleyball' | 'football';
  initialDate?: Date;
  selectedCourtName?: string;
  selectedTimeStr?: string;
  selectedDurationMinutes?: number;
  onSelectSlot?: (
    sportId: 'badminton' | 'volleyball' | 'football', 
    courtName: string, 
    time: string, 
    date: string
  ) => void;
  isInlineBookingMode?: boolean;
  isModalMode?: boolean;
  hideHeaderControls?: boolean;
}

export default function CustomerSchedule({ 
  initialSport = 'all',
  initialDate,
  selectedCourtName,
  selectedTimeStr,
  selectedDurationMinutes = 60,
  onSelectSlot, 
  isInlineBookingMode = false,
  isModalMode: _isModalMode = false,
  hideHeaderControls = false,
}: CustomerScheduleProps) {
  const [selectedSport, setSelectedSport] = useState<'all' | 'badminton' | 'volleyball' | 'football'>(initialSport);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
  const [intervalMode, setIntervalMode] = useState<30 | 60>(60); // 30 mins or 60 mins (default 1h)
  const [selectedSlotModal, setSelectedSlotModal] = useState<{
    sportId: 'badminton' | 'volleyball' | 'football';
    sportName: string;
    courtName: string;
    time: string;
    price: string;
  } | null>(null);

  // Sync initialSport if provided
  useEffect(() => {
    if (initialSport) {
      setSelectedSport(initialSport);
    }
  }, [initialSport]);

  // Sync initialDate if provided
  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Operating Hours: 05:00 to 23:00 (last start slot 22:00)
  const startHour = 5;
  const endHour = 22;
  const slotWidth = intervalMode === 30 ? 68 : 80; // px per slot column

  // Auto-scroll to 14:00 (afternoon peak) on initial mount
  useEffect(() => {
    if (scrollRef.current) {
      const offset = (14 - startHour) * (intervalMode === 30 ? 136 : 80);
      scrollRef.current.scrollLeft = Math.max(0, offset - 40);
    }
  }, [intervalMode]);

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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const dateDisplay = (isToday(selectedDate) ? "Hôm nay, " : "") + formatDate(selectedDate);
  const htmlDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;

  const times = useMemo(() => {
    const result = [];
    for (let h = startHour; h <= endHour; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
      if (intervalMode === 30 && h < endHour) {
        result.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }
    return result;
  }, [intervalMode, startHour, endHour]);

  // Filter courts by sport
  const displayedCourts = useMemo(() => {
    if (selectedSport === 'all') return STANDARD_15_COURTS;
    return STANDARD_15_COURTS.filter((c) => c.sportId === selectedSport);
  }, [selectedSport]);

  const parseTimeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Check if a specific court is occupied
  const getBookingAt = (courtCode: string, startMin: number, endMin: number) => {
    return STANDARD_15_BOOKINGS.find((b) => {
      if (b.courtCode !== courtCode) return false;
      const bStartMin = b.startH * 60 + b.startM;
      const bEndMin = b.endH * 60 + b.endM;
      return Math.max(startMin, bStartMin) < Math.min(endMin, bEndMin);
    });
  };

  const handleSlotClick = (sportId: 'badminton' | 'volleyball' | 'football', courtName: string, time: string, price: string) => {
    if (isInlineBookingMode && onSelectSlot) {
      onSelectSlot(sportId, courtName, time, formatDate(selectedDate));
      return;
    }

    setSelectedSlotModal({
      sportId,
      sportName: sportId === 'badminton' ? 'Cầu lông' : sportId === 'volleyball' ? 'Bóng chuyền' : 'Bóng đá mini',
      courtName,
      time,
      price,
    });
  };

  return (
    <div className={`flex flex-col bg-slate-50 ${isInlineBookingMode ? 'w-full' : 'h-full flex-1'}`}>
      
      {/* Compact Toolbar when Header Controls are hidden (Inline Booking Mode) */}
      {hideHeaderControls && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border-b border-slate-200 text-[10px]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedSport(initialSport || 'badminton')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                selectedSport !== 'all' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
              }`}
            >
              5 sân môn đang chọn
            </button>
            <button
              type="button"
              onClick={() => setSelectedSport('all')}
              className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer ${
                selectedSport === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Xem tất cả 15 sân
            </button>
          </div>

          <div className="flex items-center gap-2.5 font-bold text-slate-600">
            <span className="flex items-center gap-1 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600"></span> 
              Đang chọn
            </span>
            <span className="flex items-center gap-1 text-amber-800">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400"></span> 
              Có thể đặt
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300"></span> 
              Đã đặt
            </span>
          </div>
        </div>
      )}

      {/* 1. TOP TOOLBAR & CONTROLS */}
      {!hideHeaderControls && (
        <div className="bg-white border-b border-slate-200 p-3 space-y-2.5 shrink-0 shadow-xs">
          {/* Date Picker Bar */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-1.5 border border-slate-200 relative">
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrevDay(); }} 
              className="absolute left-1 w-7 h-7 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-xs active:scale-95 z-20 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4"/>
            </button>
            
            <div className="flex-1 flex items-center justify-center gap-1.5 text-xs font-black text-slate-800 tracking-wide pointer-events-none z-10">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{dateDisplay}</span>
            </div>

            <input 
              type="date"
              value={htmlDate}
              onChange={(e) => { if (e.target.value) setSelectedDate(new Date(e.target.value)); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />

            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNextDay(); }} 
              className="absolute right-1 w-7 h-7 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-xs active:scale-95 z-20 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4"/>
            </button>
          </div>

          {/* Sport Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <button
              type="button"
              onClick={() => setSelectedSport('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedSport === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả 15 sân
            </button>
            <button
              type="button"
              onClick={() => setSelectedSport('badminton')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedSport === 'badminton'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Cầu lông (5 sân)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSport('volleyball')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedSport === 'volleyball'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bóng chuyền (5 sân)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSport('football')}
              className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedSport === 'football'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Bóng đá mini (5 sân)
            </button>
          </div>

          {/* Sub-toolbar: Interval & Legend */}
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

            <div className="flex items-center gap-2.5 font-bold text-slate-600">
              <span className="flex items-center gap-1 text-emerald-800">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600"></span> 
                Đang chọn
              </span>
              <span className="flex items-center gap-1 text-amber-800">
                <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400"></span> 
                Có thể đặt
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300"></span> 
                Đã đặt
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. TIMELINE MATRIX GRID (15 INDEPENDENT COURTS) */}
      <div 
        ref={scrollRef} 
        className={`overflow-auto bg-slate-50 relative custom-scrollbar border-b border-slate-200 ${
          isInlineBookingMode ? 'max-h-[460px] rounded-xl border border-slate-200' : 'flex-1'
        }`}
      >
        <div className="flex min-w-max">
          
          {/* Sticky Left Column: Court Names & Price Badge */}
          <div className="sticky left-0 z-30 flex flex-col bg-white border-r border-slate-200 w-[88px] shrink-0 shadow-[3px_0_8px_rgba(0,0,0,0.06)]">
            <div className="h-10 border-b border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-[9px] font-black text-slate-700 uppercase tracking-wider sticky top-0 z-40">
              DANH MỤC SÂN
            </div>
            {displayedCourts.map((court) => {
              const isCourtSelected = selectedCourtName === court.name;
              return (
                <div 
                  key={court.id} 
                  className={`h-[56px] border-b border-slate-100 flex flex-col justify-center items-center px-1 relative transition ${
                    isCourtSelected ? 'bg-emerald-50/80 border-r-2 border-r-emerald-500' : 'bg-white'
                  }`}
                >
                  <span className={`font-black text-[11px] truncate text-center w-full leading-tight ${
                    isCourtSelected ? 'text-emerald-800' : 'text-slate-900'
                  }`}>
                    {court.name}
                  </span>
                  <span className="text-[9px] font-extrabold text-emerald-600 mt-0.5">
                    {court.pricePerHour / 1000}k/h
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Timeline Grid */}
          <div className="flex flex-col relative z-0" style={{ width: `${times.length * slotWidth}px` }}>
            {/* Header row: Time labels */}
            <div className="flex h-10 border-b border-slate-200 bg-slate-100 sticky top-0 z-20">
              {times.map((t, idx) => (
                <div 
                  key={idx} 
                  style={{ width: `${slotWidth}px` }} 
                  className="shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-700"
                >
                  {t}
                </div>
              ))}
            </div>

            {/* Matrix Rows: 1 Row per Court */}
            <div className="relative">
              {displayedCourts.map((court) => (
                <div key={court.id} className="flex h-[56px] border-b border-slate-200/50">
                  {times.map((t, cIdx) => {
                    const cellStart = parseTimeToMinutes(t);
                    const cellEnd = cellStart + intervalMode;
                    const occupyingBooking = getBookingAt(court.code, cellStart, cellEnd);
                    const selStartMin = selectedTimeStr ? parseTimeToMinutes(selectedTimeStr) : -1;
                    const selEndMin = selStartMin >= 0 ? selStartMin + (selectedDurationMinutes || 60) : -1;
                    const isSelected = selectedCourtName === court.name && selStartMin >= 0 && cellStart >= selStartMin && cellStart < selEndMin;

                    // 1. OCCUPIED / BOOKED SLOT
                    if (occupyingBooking) {
                      return (
                        <div 
                          key={cIdx} 
                          style={{ width: `${slotWidth}px` }} 
                          className="shrink-0 border-r border-slate-200/60 bg-slate-100/90 flex flex-col items-center justify-center text-center p-1 select-none cursor-not-allowed"
                          title={`${court.name} đã được đặt lúc ${t}`}
                        >
                          <span className="text-[9px] font-bold text-slate-400 leading-tight">Đã đặt</span>
                        </div>
                      );
                    }

                    // 2. CURRENTLY SELECTED SLOT
                    if (isSelected) {
                      return (
                        <div 
                          key={cIdx} 
                          style={{ width: `${slotWidth}px` }} 
                          onClick={() => handleSlotClick(court.sportId, court.name, selectedTimeStr || t, `${court.pricePerHour.toLocaleString('vi-VN')}đ`)}
                          className="shrink-0 border-r border-emerald-600 bg-emerald-500 text-white flex flex-col items-center justify-center text-center p-1 shadow-inner shadow-emerald-700/30 cursor-pointer animate-in zoom-in-95 duration-150"
                        >
                          <span className="text-[10px] font-black uppercase flex items-center gap-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> CHỌN
                          </span>
                          <span className="text-[8px] font-extrabold opacity-90">{court.pricePerHour / 1000}k</span>
                        </div>
                      );
                    }

                    // 3. AVAILABLE / FREE SLOT
                    return (
                      <div 
                        key={cIdx} 
                        style={{ width: `${slotWidth}px` }} 
                        onClick={() => handleSlotClick(court.sportId, court.name, t, `${court.pricePerHour.toLocaleString('vi-VN')}đ`)}
                        className="shrink-0 border-r border-amber-200/70 bg-amber-50/70 hover:bg-amber-100 hover:border-amber-400 flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-95 group p-1"
                        title={`Bấm để chọn ${court.name} lúc ${t} (${court.pricePerHour.toLocaleString('vi-VN')}đ/h)`}
                      >
                        <span className="text-[9px] font-black text-amber-800 uppercase group-hover:scale-105 transition">
                          Trống
                        </span>
                        <span className="text-[8px] font-bold text-amber-700">
                          {court.pricePerHour / 1000}k
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODAL CONFIRMATION (WHEN NOT IN INLINE MODE) */}
      {!isInlineBookingMode && selectedSlotModal && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 space-y-4 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">XÁC NHẬN GIỮ LỊCH SÂN</h3>
                <p className="text-[11px] text-slate-500 font-medium">{selectedSlotModal.sportName} • {dateDisplay}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Sân đã chọn:</span>
                <span className="font-black text-emerald-700 text-sm">{selectedSlotModal.courtName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Khung giờ:</span>
                <span className="font-bold text-slate-800">{selectedSlotModal.time} (1 tiếng)</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                <span className="text-slate-600 font-bold">Đơn giá niêm yết:</span>
                <span className="font-black text-emerald-600 text-sm">{selectedSlotModal.price} / giờ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedSlotModal(null)}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                Chọn giờ khác
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSelectSlot) {
                    onSelectSlot(
                      selectedSlotModal.sportId,
                      selectedSlotModal.courtName,
                      selectedSlotModal.time,
                      formatDate(selectedDate)
                    );
                  }
                  setSelectedSlotModal(null);
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-xs font-black uppercase tracking-wider active:scale-95 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
              >
                Đặt sân ngay <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
