import { useState, useMemo } from 'react';
import { Menu, User as UserIcon, AlertTriangle, Calendar, ChevronLeft, ChevronRight, LogOut, Settings, LayoutGrid } from 'lucide-react';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Dynamically generate time headers based on intervalMode
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

  // Hệ thống quy đổi chuẩn: 8 sân cầu lông (đơn vị nhỏ nhất)
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

  // Helper to place bookings exactly on the grid based on time and row span
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
    <div className="flex h-screen bg-slate-50 text-slate-900 w-full animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
      
      {/* 🟢 SIDEBAR (MOBILE DRAWER) */}
      {sidebarOpen && (
        <div className="absolute inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          
          {/* Menu Panel */}
          <div className="relative w-64 bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left-full duration-200">
            <div className="h-14 flex items-center px-4 border-b border-slate-100 bg-emerald-700">
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-emerald-700 font-black mr-2 text-xs">CX</div>
              <span className="font-black text-white tracking-tight">COURTX SPORT</span>
            </div>
            <div className="flex-1 py-4 px-3 space-y-1">
              <div className="flex items-center gap-3 bg-emerald-700 text-white px-3 py-3 rounded-xl font-bold text-sm shadow-sm cursor-pointer">
                <LayoutGrid className="w-4 h-4" /> Bảng lịch sân
              </div>
              <div className="flex items-center gap-3 text-slate-600 px-3 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 cursor-pointer">
                <Settings className="w-4 h-4" /> Cài đặt
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                  <UserIcon className="w-4 h-4 text-emerald-700"/>
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-700">Ban Quản Trị</div>
                  <div className="text-slate-500 scale-90 origin-left">admin@courtx.vn</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MAIN CONTENT */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        
        {/* Header */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-2 shrink-0 z-30 shadow-sm relative">
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center text-emerald-700 active:scale-95 bg-emerald-50 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="font-black text-slate-800 tracking-tight uppercase text-sm">COURTX HUB</span>
            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Đang mở cửa
            </span>
          </div>
          <button onClick={onLogout} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 hover:bg-red-50 hover:text-red-600 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Alert Banner */}
        <div className="bg-red-50 border-b border-red-100 px-3 py-2.5 flex gap-2 shrink-0 items-start">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-800 font-medium leading-relaxed pr-2">
            <strong className="font-bold">Nhắc nhở setup mặt sân:</strong> Cần setup lưới bóng chuyền khu A (Sân 1 - 4) trước <strong className="font-bold underline">16:00</strong>. Khách đã cọc bắt đầu thi đấu lúc 16:30.
          </p>
        </div>

        {/* Toolbar (Date & View Toggles) */}
        <div className="bg-white border-b border-slate-200 px-3 py-2.5 flex flex-col gap-2 shrink-0 z-20 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
          
          {/* Selectable Date Picker */}
          <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1 w-full relative">
            <button onClick={handlePrevDay} className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 relative z-10"><ChevronLeft className="w-4 h-4"/></button>
            
            <div 
              className="flex items-center justify-center flex-1 relative h-8 mx-2 cursor-pointer"
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input[type="date"]');
                if (input && 'showPicker' in input) {
                  try {
                    (input as HTMLInputElement).showPicker();
                  } catch (err) {}
                }
              }}
            >
              <div className="flex items-center gap-2 pointer-events-none">
                <span className="text-[13px] font-black text-slate-800">{dateDisplay}</span>
                <Calendar className="w-4 h-4 text-slate-600 shrink-0" strokeWidth={2.5} />
              </div>
              <input 
                type="date" 
                value={htmlDate} 
                onChange={(e) => { if (e.target.value) setSelectedDate(new Date(e.target.value)) }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            <button onClick={handleNextDay} className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 relative z-10"><ChevronRight className="w-4 h-4"/></button>
          </div>
          
          <div className="flex gap-2 mt-1">
            {/* Dynamic Timeline Interval Selector */}
            <div className="relative bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm shrink-0">
              <LayoutGrid className="w-3 h-3" /> Dòng thời gian {intervalMode === 30 ? '30p' : '1h'}
              <select 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                value={intervalMode}
                onChange={(e) => setIntervalMode(Number(e.target.value) as 30 | 60)}
              >
                <option value={30}>Dòng thời gian 30 phút</option>
                <option value={60}>Dòng thời gian 1 tiếng</option>
              </select>
            </div>
          </div>
        </div>

        {/* 🟢 MATRIX GANTT CHART (HORIZONTAL SCROLL) */}
        <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
          <div className="flex min-w-max">
            
            {/* Left Fixed Column (Courts Base) */}
            <div className="sticky left-0 z-20 flex flex-col bg-white border-r border-slate-200 w-[72px] shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.05)]">
              {/* Top empty corner cell */}
              <div className="h-10 border-b border-slate-200 bg-slate-100 flex flex-col items-center justify-center text-[8px] font-bold text-slate-500 uppercase">
                DANH SÁCH
              </div>
              
              {/* Court List - 8 atomic badminton courts */}
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
              
              {/* Header Row (Times) */}
              <div className="flex h-10 border-b border-slate-200 bg-slate-100 sticky top-0 z-10">
                {times.map((t, idx) => (
                  <div key={idx} className="w-[64px] shrink-0 border-r border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                    {t}
                  </div>
                ))}
              </div>

              {/* Grid Rows Background (Vertical & Horizontal separators) */}
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

                {/* 🎨 ABSOLUTE POSITIONED DYNAMIC BOOKING BLOCKS */}
                
                {/* DYNAMIC BLOCK 1: Bóng Chuyền covers Sân 01 -> 04 (courtIdx: 0, rowSpan: 4) */}
                <div 
                  className="absolute bg-[#eff6ff] border-l-4 border-blue-500 border-y border-r border-blue-200/60 rounded-r flex flex-col justify-center px-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden z-10"
                  style={getBookingStyle(14, 0, 16, 0, 0, 4)}
                >
                  <div className="text-xs font-black text-blue-900 leading-tight truncate">BÓNG CHUYỀN 1</div>
                  <div className="text-[10px] text-blue-700 font-bold truncate mt-1">Đoàn Văn A</div>
                  <div className="text-[9px] text-blue-600 font-medium truncate mt-0.5 flex items-center gap-1">14:00 - 16:00 (Gộp Sân 1-4)</div>
                </div>

                {/* DYNAMIC BLOCK 2: Cầu lông at Sân 05 (courtIdx: 4, rowSpan: 1) */}
                <div 
                  className="absolute bg-[#fffbeb] border-l-4 border-amber-400 border-y border-r border-amber-200/60 rounded flex flex-col justify-center px-2 shadow-sm overflow-hidden z-10"
                  style={getBookingStyle(14, 30, 15, 30, 4, 1)}
                >
                  <div className="text-[10px] font-bold text-slate-800 leading-tight truncate">Cầu lông • Lê Hoà</div>
                  <div className="text-[8px] text-amber-700 font-medium truncate mt-0.5 flex items-center gap-0.5">14:30 - 15:30 (Online)</div>
                </div>

                {/* DYNAMIC BLOCK 3: Cầu lông at Sân 06 (courtIdx: 5, rowSpan: 1) */}
                <div 
                  className="absolute bg-[#fffbeb] border-l-4 border-amber-400 border-y border-r border-amber-200/60 rounded flex flex-col justify-center px-2 shadow-sm overflow-hidden z-10"
                  style={getBookingStyle(15, 0, 16, 0, 5, 1)}
                >
                  <div className="text-[10px] font-bold text-slate-800 leading-tight truncate">Cầu lông • Trần B</div>
                  <div className="text-[8px] text-amber-700 font-medium truncate mt-0.5 flex items-center gap-0.5">15:00 - 16:00</div>
                </div>

                {/* DYNAMIC BLOCK 4: Bóng Đá covers Sân 01 -> 08 (courtIdx: 0, rowSpan: 8) */}
                <div 
                  className="absolute bg-[#f0fdf4] border-l-4 border-emerald-500 border-y border-r border-emerald-200/80 rounded-r flex flex-col justify-center px-4 shadow-[0_2px_15px_rgba(0,0,0,0.08)] overflow-hidden z-20"
                  style={getBookingStyle(17, 0, 19, 0, 0, 8)}
                >
                  <div className="text-base font-black text-emerald-900 leading-tight truncate">BÓNG ĐÁ (FULL MẶT SÂN)</div>
                  <div className="text-xs text-emerald-800 font-bold truncate mt-1">FC Vô Địch - Đã cọc</div>
                  <div className="text-[10px] text-emerald-700 font-medium truncate mt-1 flex items-center gap-1">17:00 - 19:00 (Gộp Sân 1-8)</div>
                </div>

              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Summary */}
        <div className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-3 shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-30">
          <div className="flex gap-4 items-center">
             <div className="text-[10px] text-slate-600">Tỉ lệ lấp đầy: <span className="font-bold text-emerald-600 text-xs">88.5%</span></div>
             <div className="text-[10px] text-slate-600">Tổng số lượt đặt: <span className="font-bold text-slate-800 text-xs">42</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
