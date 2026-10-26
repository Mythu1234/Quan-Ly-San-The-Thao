import { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, LayoutGrid, CheckCircle2, ArrowRight } from 'lucide-react';

export interface ScheduleBooking {
  id: string;
  sport: 'badminton' | 'volleyball' | 'football';
  sportName: string;
  startH: number;
  startM: number;
  endH: number;
  endM: number;
  courtStart: number; // 0..7 (corresponds to Sân 01 to Sân 08)
  courtCount: number; // 1 for badminton, 4 for volleyball, 8 for football
}

interface CustomerScheduleProps {
  onSelectSlot?: (
    sportId: 'badminton' | 'volleyball' | 'football', 
    courtName: string, 
    time: string, 
    date: string
  ) => void;
  isModalMode?: boolean;
}

export default function CustomerSchedule({ onSelectSlot, isModalMode = false }: CustomerScheduleProps) {
  const [selectedSport, setSelectedSport] = useState<'all' | 'badminton' | 'volleyball' | 'football'>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [intervalMode, setIntervalMode] = useState<30 | 60>(60); // 30 mins or 60 mins (default 1h)
  const [selectedSlotModal, setSelectedSlotModal] = useState<{
    sportId: 'badminton' | 'volleyball' | 'football';
    sportName: string;
    courtName: string;
    time: string;
    price: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to 14:00 (afternoon peak) on initial mount
  useEffect(() => {
    if (scrollRef.current) {
      const offset = 8 * (intervalMode === 30 ? 128 : 72);
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

  // Operating Hours: 06:00 to 22:00
  const startHour = 6;
  const endHour = 22;
  const slotWidth = intervalMode === 30 ? 64 : 72; // px per slot column

  const times = useMemo(() => {
    const result = [];
    for (let h = startHour; h <= endHour; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
      if (intervalMode === 30 && h < endHour) {
        result.push(`${h.toString().padStart(2, '0')}:30`);
      }
    }
    return result;
  }, [intervalMode]);

  // Base physical courts (8 units)
  const baseCourts = useMemo(() => [
    { id: 1, name: 'Sân 01' },
    { id: 2, name: 'Sân 02' },
    { id: 3, name: 'Sân 03' },
    { id: 4, name: 'Sân 04' },
    { id: 5, name: 'Sân 05' },
    { id: 6, name: 'Sân 06' },
    { id: 7, name: 'Sân 07' },
    { id: 8, name: 'Sân 08' },
  ], []);

  // Mock Bookings (Anonymized)
  const mockBookings: ScheduleBooking[] = useMemo(() => [
    {
      id: 'bk-m1',
      sport: 'volleyball',
      sportName: 'Bóng chuyền',
      startH: 8,
      startM: 0,
      endH: 10,
      endM: 0,
      courtStart: 0,
      courtCount: 4, // Sân 1-4
    },
    {
      id: 'bk-m2',
      sport: 'badminton',
      sportName: 'Cầu lông',
      startH: 9,
      startM: 0,
      endH: 10,
      endM: 30,
      courtStart: 5,
      courtCount: 1, // Sân 06
    },
    {
      id: 'bk-1',
      sport: 'volleyball',
      sportName: 'Bóng chuyền',
      startH: 14,
      startM: 0,
      endH: 16,
      endM: 0,
      courtStart: 0,
      courtCount: 4, // Sân 01 - Sân 04
    },
    {
      id: 'bk-2',
      sport: 'badminton',
      sportName: 'Cầu lông',
      startH: 14,
      startM: 30,
      endH: 15,
      endM: 30,
      courtStart: 4,
      courtCount: 1, // Sân 05
    },
    {
      id: 'bk-3',
      sport: 'badminton',
      sportName: 'Cầu lông',
      startH: 15,
      startM: 0,
      endH: 16,
      endM: 0,
      courtStart: 5,
      courtCount: 1, // Sân 06
    },
    {
      id: 'bk-4',
      sport: 'football',
      sportName: 'Bóng đá mini',
      startH: 17,
      startM: 0,
      endH: 19,
      endM: 0,
      courtStart: 0,
      courtCount: 8, // Sân 01 - Sân 08
    },
    {
      id: 'bk-5',
      sport: 'badminton',
      sportName: 'Cầu lông',
      startH: 19,
      startM: 30,
      endH: 21,
      endM: 0,
      courtStart: 1,
      courtCount: 1, // Sân 02
    },
    {
      id: 'bk-6',
      sport: 'badminton',
      sportName: 'Cầu lông',
      startH: 20,
      startM: 0,
      endH: 21,
      endM: 30,
      courtStart: 3,
      courtCount: 1, // Sân 04
    },
  ], []);

  // Helper: check if a specific court is occupied during [startMinutes, endMinutes]
  const isCourtOccupied = (courtIdx: number, startMin: number, endMin: number) => {
    return mockBookings.some((b) => {
      const bCourtEnd = b.courtStart + b.courtCount;
      const courtOverlaps = courtIdx >= b.courtStart && courtIdx < bCourtEnd;
      if (!courtOverlaps) return false;
      const bStartMin = b.startH * 60 + b.startM;
      const bEndMin = b.endH * 60 + b.endM;
      return Math.max(startMin, bStartMin) < Math.min(endMin, bEndMin);
    });
  };

  // Helper: find booking occupying court at [startMin, endMin]
  const getBookingAt = (courtIdx: number, startMin: number, endMin: number) => {
    return mockBookings.find((b) => {
      const bCourtEnd = b.courtStart + b.courtCount;
      const courtOverlaps = courtIdx >= b.courtStart && courtIdx < bCourtEnd;
      if (!courtOverlaps) return false;
      const bStartMin = b.startH * 60 + b.startM;
      const bEndMin = b.endH * 60 + b.endM;
      return Math.max(startMin, bStartMin) < Math.min(endMin, bEndMin);
    });
  };

  const parseTimeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const getBookingAbsoluteStyle = (
    startH: number,
    startM: number,
    endH: number,
    endM: number,
    courtIndex: number,
    rowSpan: number = 1,
    rowH: number = 56
  ) => {
    const startOffsetMinutes = (startH - startHour) * 60 + startM;
    const durationMinutes = (endH - startH) * 60 + (endM - startM);
    const pixelsPerMinute = slotWidth / intervalMode;

    return {
      top: courtIndex * rowH + 4,
      left: startOffsetMinutes * pixelsPerMinute + 2,
      width: durationMinutes * pixelsPerMinute - 4,
      height: rowH * rowSpan - 8,
    };
  };

  const handleSlotClick = (sportId: 'badminton' | 'volleyball' | 'football', courtName: string, time: string, price: string) => {
    setSelectedSlotModal({
      sportId,
      sportName: sportId === 'badminton' ? 'Cầu lông' : sportId === 'volleyball' ? 'Bóng chuyền' : 'Bóng đá mini',
      courtName,
      time,
      price,
    });
  };

  const confirmBookingFromModal = () => {
    if (!selectedSlotModal) return;
    if (onSelectSlot) {
      onSelectSlot(
        selectedSlotModal.sportId, 
        selectedSlotModal.courtName, 
        selectedSlotModal.time, 
        formatDate(selectedDate)
      );
    }
    setSelectedSlotModal(null);
  };

  return (
    <div className={`flex-1 flex flex-col w-full h-full overflow-hidden bg-slate-50 animate-in fade-in ${isModalMode ? 'pb-4' : 'pb-20'}`}>
      
      {/* 1. DATE TOOLBAR */}
      <div className="bg-white border-b border-slate-200 px-3 py-2.5 flex flex-col gap-2 shrink-0 z-20 shadow-xs">
        <div 
          className="flex items-center justify-center flex-1 relative h-9 mx-1 cursor-pointer bg-slate-100 rounded-xl"
          onClick={(e) => {
            const input = e.currentTarget.querySelector('input[type="date"]');
            if (input && 'showPicker' in input) {
              try {
                (input as HTMLInputElement).showPicker();
              } catch {}
            }
          }}
        >
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); handlePrevDay(); }} 
            className="absolute left-1 w-7 h-7 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-xs active:scale-95 z-20"
          >
            <ChevronLeft className="w-4 h-4"/>
          </button>
          
          <div className="flex items-center gap-2 pointer-events-none z-10">
            <span className="text-[13px] font-black text-slate-800">{dateDisplay}</span>
            <Calendar className="w-4 h-4 text-slate-600 shrink-0" strokeWidth={2.5} />
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
            className="absolute right-1 w-7 h-7 flex items-center justify-center text-slate-500 bg-white rounded-lg shadow-xs active:scale-95 z-20"
          >
            <ChevronRight className="w-4 h-4"/>
          </button>
        </div>

        {/* 2. SPORT FILTER BUTTONS (NO EMOJIS, CLEAN LABELS) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            type="button"
            onClick={() => setSelectedSport('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              selectedSport === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            type="button"
            onClick={() => setSelectedSport('badminton')}
            className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              selectedSport === 'badminton'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cầu lông
          </button>
          <button
            type="button"
            onClick={() => setSelectedSport('volleyball')}
            className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              selectedSport === 'volleyball'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bóng chuyền
          </button>
          <button
            type="button"
            onClick={() => setSelectedSport('football')}
            className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              selectedSport === 'football'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bóng đá mini
          </button>
        </div>

        {/* 3. SUB-TOOLBAR: TIME INTERVAL & LEGEND (YELLOW FOR AVAILABLE) */}
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

          <div className="flex items-center gap-2.5 font-bold text-slate-500">
            <span className="flex items-center gap-1 text-amber-800">
              <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400"></span> 
              Có thể đặt
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300"></span> 
              Đã đặt
            </span>
          </div>
        </div>
      </div>

      {/* 4. GANTT MATRIX SCHEDULER */}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
        <div className="flex min-w-max">
          
          {/* ==================================================== */}
          {/* CASE A: "ALL" MODE (TẤT CẢ CÁC SÂN)                  */}
          {/* ==================================================== */}
          {selectedSport === 'all' && (
            <>
              {/* Left Column: Sân 01 - Sân 08 (Higher z-index z-30 to prevent overlay bleeding) */}
              <div className="sticky left-0 z-30 flex flex-col bg-white border-r border-slate-200 w-[74px] shrink-0 shadow-[3px_0_8px_rgba(0,0,0,0.06)]">
                <div className="h-10 border-b border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-[9px] font-black text-slate-600 uppercase tracking-wider sticky top-0 z-40">
                  SÂN
                </div>
                {baseCourts.map((c, i) => (
                  <div key={i} className="h-[56px] border-b border-slate-100 flex flex-col justify-center items-center px-1 bg-white relative">
                    <span className="font-extrabold text-[12px] text-slate-800 truncate text-center w-full">{c.name}</span>
                  </div>
                ))}
              </div>

              {/* Right Timeline Grid */}
              <div className="flex flex-col relative z-0" style={{ width: `${times.length * slotWidth}px` }}>
                {/* Header row */}
                <div className="flex h-10 border-b border-slate-200 bg-slate-100 sticky top-0 z-20">
                  {times.map((t, idx) => (
                    <div key={idx} style={{ width: `${slotWidth}px` }} className="shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                      {t}
                    </div>
                  ))}
                </div>

                {/* Grid Rows Background */}
                <div className="relative">
                  {baseCourts.map((_, rIdx) => (
                    <div key={rIdx} className="flex h-[56px] border-b border-slate-200/50">
                      {times.map((t, cIdx) => {
                        const cellStart = parseTimeToMinutes(t);
                        const cellEnd = cellStart + intervalMode;
                        const occupied = isCourtOccupied(rIdx, cellStart, cellEnd);
                        return (
                          <div 
                            key={cIdx} 
                            style={{ width: `${slotWidth}px` }} 
                            className={`shrink-0 border-r border-slate-200/40 flex items-center justify-center transition ${
                              occupied ? 'bg-slate-50' : 'bg-white'
                            }`}
                          >
                            {!occupied && (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Overlaid Bookings (z-10 so they NEVER bleed over left column z-30) */}
                  {mockBookings.map((b) => {
                    const style = getBookingAbsoluteStyle(b.startH, b.startM, b.endH, b.endM, b.courtStart, b.courtCount, 56);
                    if (b.sport === 'football') {
                      return (
                        <div 
                          key={b.id}
                          className="absolute bg-slate-200/95 border border-slate-300 rounded-xl flex flex-col justify-center items-center px-4 shadow-xs overflow-hidden z-10 transition"
                          style={style}
                        >
                          <span className="text-[12px] font-black uppercase text-slate-800 tracking-wider">
                            Bóng đá mini
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 mt-0.5">
                            {b.startH}:00 - {b.endH}:00 • Đã đặt
                          </span>
                        </div>
                      );
                    }
                    if (b.sport === 'volleyball') {
                      return (
                        <div 
                          key={b.id}
                          className="absolute bg-slate-200/95 border border-slate-300 rounded-xl flex flex-col justify-center items-center px-2 shadow-xs overflow-hidden z-10 transition"
                          style={style}
                        >
                          <span className="text-[11px] font-black uppercase text-slate-800 tracking-wide">
                            Bóng chuyền (Sân {b.courtStart + 1} - {b.courtStart + b.courtCount})
                          </span>
                          <span className="text-[9px] font-bold text-slate-600">
                            {b.startH}:00 - {b.endH}:00 • Đã đặt
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div 
                        key={b.id}
                        className="absolute bg-slate-200/95 border border-slate-300 rounded-lg flex items-center justify-center px-2 shadow-xs overflow-hidden z-10 transition"
                        style={style}
                      >
                        <span className="text-[10px] font-bold text-slate-700 truncate">
                          Đã đặt
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ==================================================== */}
          {/* CASE B: "BADMINTON" MODE (CẦU LÔNG)                 */}
          {/* ==================================================== */}
          {selectedSport === 'badminton' && (
            <>
              {/* Left Column: Sân 01 - Sân 08 */}
              <div className="sticky left-0 z-30 flex flex-col bg-white border-r border-slate-200 w-[78px] shrink-0 shadow-[3px_0_8px_rgba(0,0,0,0.06)]">
                <div className="h-10 border-b border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-[9px] font-black text-slate-700 uppercase tracking-wider sticky top-0 z-40">
                  CẦU LÔNG
                </div>
                {baseCourts.map((c, i) => (
                  <div key={i} className="h-[56px] border-b border-slate-100 flex flex-col justify-center items-center px-1 bg-white relative">
                    <span className="font-extrabold text-[12px] text-slate-800 truncate text-center w-full">{c.name}</span>
                  </div>
                ))}
              </div>

              {/* Right Timeline Grid */}
              <div className="flex flex-col relative z-0" style={{ width: `${times.length * slotWidth}px` }}>
                {/* Header */}
                <div className="flex h-10 border-b border-slate-200 bg-slate-100 sticky top-0 z-20">
                  {times.map((t, idx) => (
                    <div key={idx} style={{ width: `${slotWidth}px` }} className="shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                      {t}
                    </div>
                  ))}
                </div>

                {/* Grid Rows for Badminton */}
                <div className="relative">
                  {baseCourts.map((court, rIdx) => (
                    <div key={rIdx} className="flex h-[56px] border-b border-slate-200/50">
                      {times.map((t, cIdx) => {
                        const cellStart = parseTimeToMinutes(t);
                        const cellEnd = cellStart + intervalMode;
                        const occupyingBooking = getBookingAt(rIdx, cellStart, cellEnd);

                        if (occupyingBooking) {
                          let label = 'Đã đặt';
                          if (occupyingBooking.sport === 'volleyball') label = 'Bận (Bóng chuyền)';
                          if (occupyingBooking.sport === 'football') label = 'Bận (Bóng đá)';
                          return (
                            <div 
                              key={cIdx} 
                              style={{ width: `${slotWidth}px` }} 
                              className="shrink-0 border-r border-slate-200/50 bg-slate-100/90 flex flex-col items-center justify-center text-center p-1"
                            >
                              <span className="text-[9px] font-bold text-slate-500 leading-tight">{label}</span>
                            </div>
                          );
                        }

                        // FREE SLOT (LIGHT YELLOW COLOR)
                        return (
                          <div 
                            key={cIdx} 
                            style={{ width: `${slotWidth}px` }} 
                            onClick={() => handleSlotClick('badminton', court.name, t, '120.000đ')}
                            className="shrink-0 border-r border-amber-200/70 bg-amber-50/70 hover:bg-amber-100 flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-95 group"
                          >
                            <span className="text-[9px] font-black text-amber-800 uppercase group-hover:scale-105 transition">Trống</span>
                            <span className="text-[8px] font-bold text-amber-700">120k</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ==================================================== */}
          {/* CASE C: "VOLLEYBALL" MODE (BÓNG CHUYỀN)             */}
          {/* ==================================================== */}
          {selectedSport === 'volleyball' && (
            <>
              {/* Left Column: 2 Volleyball Courts */}
              <div className="sticky left-0 z-30 flex flex-col bg-white border-r border-slate-200 w-[96px] shrink-0 shadow-[3px_0_8px_rgba(0,0,0,0.06)]">
                <div className="h-10 border-b border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-[9px] font-black text-slate-700 uppercase tracking-wider sticky top-0 z-40">
                  BÓNG CHUYỀN
                </div>
                
                {/* Court 1: Sân 1-4 */}
                <div className="h-[90px] border-b border-slate-100 flex flex-col justify-center items-center px-1.5 bg-white relative text-center">
                  <span className="font-black text-[12px] text-slate-900 leading-tight">Sân Bóng Chuyền 1</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">Sân 01 - 04</span>
                </div>

                {/* Court 2: Sân 5-8 */}
                <div className="h-[90px] border-b border-slate-100 flex flex-col justify-center items-center px-1.5 bg-white relative text-center">
                  <span className="font-black text-[12px] text-slate-900 leading-tight">Sân Bóng Chuyền 2</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">Sân 05 - 08</span>
                </div>
              </div>

              {/* Right Timeline Grid */}
              <div className="flex flex-col relative z-0" style={{ width: `${times.length * slotWidth}px` }}>
                {/* Header */}
                <div className="flex h-10 border-b border-slate-200 bg-slate-100 sticky top-0 z-20">
                  {times.map((t, idx) => (
                    <div key={idx} style={{ width: `${slotWidth}px` }} className="shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                      {t}
                    </div>
                  ))}
                </div>

                {/* Volleyball Rows: Sân 1 (0..3) & Sân 2 (4..7) */}
                <div className="relative">
                  {[
                    { name: 'Sân Bóng Chuyền 1', start: 0, end: 3 },
                    { name: 'Sân Bóng Chuyền 2', start: 4, end: 7 }
                  ].map((vbCourt, rIdx) => (
                    <div key={rIdx} className="flex h-[90px] border-b border-slate-200">
                      {times.map((t, cIdx) => {
                        const cellStart = parseTimeToMinutes(t);
                        const cellEnd = cellStart + intervalMode;
                        
                        // Check all 4 courts
                        let isBlocked = false;
                        let blockReason = '';
                        for (let c = vbCourt.start; c <= vbCourt.end; c++) {
                          const occ = getBookingAt(c, cellStart, cellEnd);
                          if (occ) {
                            isBlocked = true;
                            if (occ.sport === 'volleyball') blockReason = 'Đã đặt Bóng chuyền';
                            else if (occ.sport === 'football') blockReason = 'Bận (Bóng đá)';
                            else blockReason = 'Bận (Có người đang chơi)';
                            break;
                          }
                        }

                        if (isBlocked) {
                          return (
                            <div 
                              key={cIdx} 
                              style={{ width: `${slotWidth}px` }} 
                              className="shrink-0 border-r border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-center p-1.5"
                            >
                              <span className="text-[10px] font-bold text-slate-500 leading-tight">{blockReason}</span>
                            </div>
                          );
                        }

                        // FREE VOLLEYBALL (LIGHT YELLOW COLOR)
                        return (
                          <div 
                            key={cIdx} 
                            style={{ width: `${slotWidth}px` }} 
                            onClick={() => handleSlotClick('volleyball', vbCourt.name, t, '150.000đ')}
                            className="shrink-0 border-r border-amber-300 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400/40 flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-95 group p-1"
                          >
                            <span className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-amber-600" /> TRỐNG
                            </span>
                            <span className="text-[9px] font-extrabold text-amber-700 mt-0.5">150k / giờ</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ==================================================== */}
          {/* CASE D: "FOOTBALL" MODE (BÓNG ĐÁ MINI)               */}
          {/* ==================================================== */}
          {selectedSport === 'football' && (
            <>
              {/* Left Column: 1 Full Football Court */}
              <div className="sticky left-0 z-30 flex flex-col bg-white border-r border-slate-200 w-[96px] shrink-0 shadow-[3px_0_8px_rgba(0,0,0,0.06)]">
                <div className="h-10 border-b border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-[9px] font-black text-slate-700 uppercase tracking-wider sticky top-0 z-40">
                  BÓNG ĐÁ
                </div>
                
                <div className="h-[120px] border-b border-slate-100 flex flex-col justify-center items-center px-1.5 bg-white relative text-center">
                  <span className="font-black text-[12px] text-slate-900 leading-tight">Sân Bóng Đá Mini</span>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">Toàn sân</span>
                </div>
              </div>

              {/* Right Timeline Grid */}
              <div className="flex flex-col relative z-0" style={{ width: `${times.length * slotWidth}px` }}>
                {/* Header */}
                <div className="flex h-10 border-b border-slate-200 bg-slate-100 sticky top-0 z-20">
                  {times.map((t, idx) => (
                    <div key={idx} style={{ width: `${slotWidth}px` }} className="shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-extrabold text-slate-700">
                      {t}
                    </div>
                  ))}
                </div>

                {/* 1 Row for Football */}
                <div className="relative">
                  <div className="flex h-[120px] border-b border-slate-200">
                    {times.map((t, cIdx) => {
                      const cellStart = parseTimeToMinutes(t);
                      const cellEnd = cellStart + intervalMode;
                      
                      // Check all 8 courts
                      let isBlocked = false;
                      let blockReason = '';
                      for (let c = 0; c < 8; c++) {
                        const occ = getBookingAt(c, cellStart, cellEnd);
                        if (occ) {
                          isBlocked = true;
                          if (occ.sport === 'football') blockReason = 'Đã đặt Bóng đá mini';
                          else blockReason = 'Bận (Có người đang chơi)';
                          break;
                        }
                      }

                      if (isBlocked) {
                        return (
                          <div 
                            key={cIdx} 
                            style={{ width: `${slotWidth}px` }} 
                            className="shrink-0 border-r border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-center p-2"
                          >
                            <span className="text-[10px] font-bold text-slate-500 leading-tight">{blockReason}</span>
                          </div>
                        );
                      }

                      // FREE FOOTBALL (LIGHT YELLOW COLOR)
                      return (
                        <div 
                          key={cIdx} 
                          style={{ width: `${slotWidth}px` }} 
                          onClick={() => handleSlotClick('football', 'Sân Bóng Đá Mini', t, '200.000đ')}
                          className="shrink-0 border-r border-amber-300 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 flex flex-col items-center justify-center text-center cursor-pointer transition active:scale-95 group p-2"
                        >
                          <span className="text-[11px] font-black text-amber-800 uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> TRỐNG TOÀN SÂN
                          </span>
                          <span className="text-[10px] font-black text-amber-700 mt-1">200k / giờ</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>

      {/* 5. QUICK BOOKING CONFIRMATION MODAL ON SLOT TAP */}
      {selectedSlotModal && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6 duration-200 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="text-sm font-black text-slate-900 uppercase">Khung giờ khả dụng</h4>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedSlotModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1"
              >
                Đóng
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2 border border-slate-200 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Môn thi đấu:</span>
                <span className="font-extrabold text-slate-900">{selectedSlotModal.sportName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sân chọn:</span>
                <span className="font-extrabold text-emerald-600">{selectedSlotModal.courtName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thời gian:</span>
                <span className="font-bold text-slate-900">{dateDisplay} lúc {selectedSlotModal.time}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500">Đơn giá tiêu chuẩn:</span>
                <span className="font-black text-emerald-600">{selectedSlotModal.price} / giờ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSlotModal(null)}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
              >
                Xem tiếp lịch
              </button>
              <button
                type="button"
                onClick={confirmBookingFromModal}
                className="rounded-xl bg-emerald-500 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-emerald-600 shadow-sm active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                Đặt sân này <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
