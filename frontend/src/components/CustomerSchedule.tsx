import { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

export default function CustomerSchedule() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [intervalMode, setIntervalMode] = useState<30 | 60>(30); // 30 mins or 60 mins

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

  const startHour = 14;
  const endHour = 20;
  const slotWidth = 64; // px width per interval slot
  const rowHeight = 56; // px height per court row

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

  const courts = [
    { id: 1, name: 'Sân 01' },
    { id: 2, name: 'Sân 02' },
    { id: 3, name: 'Sân 03' },
    { id: 4, name: 'Sân 04' },
    { id: 5, name: 'Sân 05' },
    { id: 6, name: 'Sân 06' },
    { id: 7, name: 'Sân 07' },
    { id: 8, name: 'Sân 08' },
  ];

  const getBookingStyle = (startH: number, startM: number, endH: number, endM: number, courtIndex: number, rowSpan: number = 1) => {
    const startOffsetMinutes = (startH - startHour) * 60 + startM;
    const durationMinutes = (endH - startH) * 60 + (endM - startM);
    const pixelsPerMinute = slotWidth / intervalMode;

    return {
      top: courtIndex * rowHeight + 4,
      left: startOffsetMinutes * pixelsPerMinute + 2,
      width: durationMinutes * pixelsPerMinute - 4,
      height: (rowHeight * rowSpan) - 8,
    };
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-slate-50 animate-in fade-in pb-20">
      
      {/* Toolbar (Date & View Toggles) */}
      <div className="bg-white border-b border-slate-200 px-3 py-3 flex flex-col gap-2 shrink-0 z-20 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
        
        <div 
            className="flex items-center justify-center flex-1 relative h-9 mx-2 cursor-pointer bg-slate-100 rounded-lg"
            onClick={(e) => {
              const input = e.currentTarget.querySelector('input[type="date"]');
              if (input && 'showPicker' in input) {
                try {
                  (input as HTMLInputElement).showPicker();
                } catch (err) {}
              }
            }}
          >
            <button onClick={(e) => { e.stopPropagation(); handlePrevDay(); }} className="absolute left-1 w-7 h-7 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 z-20"><ChevronLeft className="w-4 h-4"/></button>
            <div className="flex items-center gap-2 pointer-events-none z-10">
              <span className="text-[13px] font-black text-slate-800">{dateDisplay}</span>
              <Calendar className="w-4 h-4 text-slate-600 shrink-0" strokeWidth={2.5} />
            </div>
            <input 
              type="date" 
              value={htmlDate} 
              onChange={(e) => { if (e.target.value) setSelectedDate(new Date(e.target.value)) }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button onClick={(e) => { e.stopPropagation(); handleNextDay(); }} className="absolute right-1 w-7 h-7 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 z-20"><ChevronRight className="w-4 h-4"/></button>
        </div>
        
        <div className="flex gap-2 mt-1">
          <div className="relative bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm shrink-0">
            <LayoutGrid className="w-3 h-3" /> Dòng thời gian {intervalMode === 30 ? '30p' : '1h'}
            <select 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={intervalMode}
              onChange={(e) => setIntervalMode(Number(e.target.value) as 30 | 60)}
            >
              <option value={30}>30 phút</option>
              <option value={60}>1 tiếng</option>
            </select>
          </div>
          <div className="flex items-center gap-1 ml-auto text-[10px] font-bold text-slate-500">
             <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></span> Đã đặt
          </div>
        </div>
      </div>

      {/* MATRIX GANTT CHART */}
      <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
        <div className="flex min-w-max">
          
          {/* Left Fixed Column */}
          <div className="sticky left-0 z-20 flex flex-col bg-white border-r border-slate-200 w-[72px] shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
            <div className="h-10 border-b border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-[8px] font-bold text-slate-500 uppercase">
              DANH SÁCH
            </div>
            {courts.map((c, i) => (
              <div key={i} className="h-[56px] border-b border-slate-100 flex flex-col justify-center items-center px-1 bg-white relative z-10">
                <span className="font-bold text-[11px] text-slate-800 truncate text-center w-full">{c.name}</span>
                <span className="text-[8px] mt-0.5 w-fit px-1.5 py-0.5 rounded font-bold bg-slate-100 text-slate-500">
                  Cầu lông
                </span>
              </div>
            ))}
          </div>

          {/* Right Timeline Grid */}
          <div className="flex flex-col relative" style={{ width: `${times.length * slotWidth}px` }}>
            {/* Header */}
            <div className="flex h-10 border-b border-slate-200 bg-slate-100 sticky top-0 z-10">
              {times.map((t, idx) => (
                <div key={idx} className="w-[64px] shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                  {t}
                </div>
              ))}
            </div>

            {/* Grid Rows Background */}
            <div className="relative">
              {courts.map((_, rIdx) => (
                <div key={rIdx} className="flex h-[56px] border-b border-slate-200/50">
                  {times.map((__, cIdx) => (
                    <div key={cIdx} className="w-[64px] shrink-0 border-r border-slate-200/50 flex items-center justify-center bg-white">
                      <div className="w-[1px] h-2 bg-slate-100"></div>
                    </div>
                  ))}
                </div>
              ))}

              {/* ANONYMIZED BOOKING BLOCKS */}
              
              <div 
                className="absolute bg-slate-200/80 border border-slate-300 rounded flex flex-col justify-center px-2 shadow-sm overflow-hidden z-10"
                style={getBookingStyle(14, 0, 16, 0, 0, 4)}
              >
                <div className="text-[10px] font-bold text-slate-600 leading-tight truncate text-center">Đã đặt (Gộp sân)</div>
              </div>

              <div 
                className="absolute bg-slate-200/80 border border-slate-300 rounded flex flex-col justify-center px-2 shadow-sm overflow-hidden z-10"
                style={getBookingStyle(14, 30, 15, 30, 4, 1)}
              >
                <div className="text-[10px] font-bold text-slate-600 leading-tight truncate text-center">Đã đặt</div>
              </div>

              <div 
                className="absolute bg-slate-200/80 border border-slate-300 rounded flex flex-col justify-center px-2 shadow-sm overflow-hidden z-10"
                style={getBookingStyle(15, 0, 16, 0, 5, 1)}
              >
                <div className="text-[10px] font-bold text-slate-600 leading-tight truncate text-center">Đã đặt</div>
              </div>

              <div 
                className="absolute bg-slate-200/80 border border-slate-300 rounded flex flex-col justify-center px-4 shadow-sm overflow-hidden z-20"
                style={getBookingStyle(17, 0, 19, 0, 0, 8)}
              >
                <div className="text-[11px] font-black text-slate-600 leading-tight truncate text-center">Đã đặt (Full sân)</div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
