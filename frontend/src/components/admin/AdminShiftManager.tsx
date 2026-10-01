import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import type { Employee, ShiftRegistration } from '../../types/admin';

interface AdminShiftManagerProps {
  employees: Employee[];
  shifts: ShiftRegistration[];
}

export default function AdminShiftManager({ shifts }: AdminShiftManagerProps) {
  // Week selection state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date('2026-10-19')); // Default to match image

  // Calculate days in the current week (Thứ 2 to Chủ Nhật)
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const shortDayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    // Simulate "Hôm nay"
    const isToday = dateStr === '2026-10-22';

    return {
      date: dateStr,
      day: dayNames[d.getDay()],
      shortDay: shortDayNames[d.getDay()],
      label: `${dd}/${mm}`,
      isToday,
    };
  });

  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const shiftsConfig = [
    { id: 'Ca 1', name: 'Ca 1 (Sáng)', time: '04:00 - 12:00 (8h)', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { id: 'Ca 2', name: 'Ca 2 (Chiều)', time: '12:00 - 18:00 (6h)', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'Ca 3', name: 'Ca 3 (Tối)', time: '18:00 - 23:00 (5h)', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  const [assignedCells, setAssignedCells] = useState<Record<string, boolean>>({});

  const handleAssignClick = (shiftId: string, date: string) => {
    if (window.confirm(`Xác nhận phân công bạn vào ${shiftId} ngày ${date}?`)) {
      setAssignedCells(prev => ({ ...prev, [`${shiftId}-${date}`]: true }));
    }
  };

  return (
    <div className="flex-1 p-2 sm:p-4 lg:p-6 space-y-6 pb-28 bg-white min-h-screen w-full max-w-full min-w-0 overflow-hidden">
      
      {/* 🟢 Header */}
      <div className="flex flex-wrap justify-between gap-4 items-start md:items-center">
        <div className="flex-1 min-w-[250px]">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Quản lý & Phân bổ ca trực
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Theo dõi tổng quan và điều phối nhân sự cho các ca làm việc trong tuần.
          </p>
        </div>
        
        {/* Week Selector */}
        <div className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-full md:w-auto shrink-0">
          <button type="button" onClick={handlePrevWeek} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="text-sm font-bold text-slate-700 px-2 text-center whitespace-nowrap">
            Tuần 42 ({weekDays[0].label} - {weekDays[6].label})
          </span>
          <button type="button" onClick={handleNextWeek} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      {/* 🟢 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">Tổng ca tuần</div>
          <div className="text-lg sm:text-xl font-black text-slate-800 truncate">21<span className="text-[10px] font-bold text-slate-400 ml-1">ca</span></div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide truncate">Đã phân công</div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 truncate">16<span className="text-[10px] font-bold text-emerald-600/70 ml-1">ca</span></div>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
          <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wide truncate">Còn trống</div>
          <div className="text-lg sm:text-xl font-black text-rose-700 truncate">5<span className="text-[10px] font-bold text-rose-600/70 ml-1">ca</span></div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">Chi phí dự kiến</div>
          <div className="text-lg sm:text-xl font-black text-slate-800 truncate">3.2M<span className="text-[10px] font-bold text-slate-400 ml-1">VNĐ</span></div>
        </div>
      </div>

      {/* 🟢 Filters */}
      <div className="flex flex-wrap justify-between bg-slate-50 border border-slate-200 p-3 rounded-2xl gap-4 items-center">
        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm nhân sự..." 
              className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[150px]">
            <span className="text-sm text-slate-600 font-medium shrink-0">Ca trực:</span>
            <select className="bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm font-medium focus:outline-none w-full">
              <option>Tất cả (1, 2, 3)</option>
              <option>Ca 1 (Sáng)</option>
              <option>Ca 2 (Chiều)</option>
              <option>Ca 3 (Tối)</option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-600 rounded-sm"></span><span className="text-xs text-slate-600 font-medium">Ca 1</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-600 rounded-sm"></span><span className="text-xs text-slate-600 font-medium">Ca 2</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-600 rounded-sm"></span><span className="text-xs text-slate-600 font-medium">Ca 3</span></div>
          </div>
        </div>
      </div>

      {/* 🟢 Calendar Matrix */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm overflow-x-auto relative">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-24 md:w-32 p-3 border-b border-r border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle">
                KHUNG CA LÀM
              </th>
              {weekDays.map(day => (
                <th 
                  key={day.date} 
                  className={['p-2 md:p-3 border-b border-r border-slate-200 text-center', day.isToday ? 'bg-emerald-50' : 'bg-slate-50'].join(' ')}
                >
                  <div className={['text-xs font-black', day.isToday ? 'text-emerald-700' : 'text-slate-800', day.day === 'Chủ Nhật' ? 'text-rose-600' : ''].join(' ')}>
                    {day.day} {day.isToday && <span className="hidden md:inline">(Hôm nay)</span>}
                  </div>
                  <div className={['text-[10px] mt-0.5 font-bold', day.isToday ? 'text-emerald-600' : 'text-slate-500'].join(' ')}>
                    {day.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shiftsConfig.map(shiftRow => (
              <tr key={shiftRow.id}>
                <td className="sticky left-0 z-10 p-3 border-b border-r border-slate-200 align-top bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <div className={['text-xs font-black leading-tight', shiftRow.color].join(' ')}>{shiftRow.name.split('(')[0].trim()}</div>
                  {shiftRow.name.includes('(') && (
                    <div className={['text-[9px] font-bold mt-0.5 opacity-80', shiftRow.color].join(' ')}>({shiftRow.name.split('(')[1]}</div>
                  )}
                  <div className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">{shiftRow.time.split(' ')[0]} - {shiftRow.time.split(' ')[2]}</div>
                </td>
                
                {weekDays.map(day => {
                  const dayDate = new Date(day.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = dayDate < today; 
                  const isToday = day.isToday;
                  const cellShifts = shifts.filter(s => s.date === day.date && s.shiftType === shiftRow.id);
                  const isNewlyAssigned = assignedCells[`${shiftRow.id}-${day.date}`];
                  const hasMyShift = (isToday && shiftRow.id === 'Ca 1') || isNewlyAssigned; // Mocking "Tôi"
                  
                  return (
                    <td key={`${shiftRow.id}-${day.date}`} className={['p-2 border-b border-r border-slate-200 align-top h-24 relative group', isToday ? 'bg-emerald-50/30' : 'bg-white'].join(' ')}>
                      {hasMyShift ? (
                        <div className="w-full h-full border-2 border-emerald-500 rounded-lg p-2 bg-white shadow-sm flex flex-col items-center justify-center text-center relative min-h-[70px]">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">Văn An <span className="bg-emerald-700 text-white text-[9px] px-1 rounded">Tôi</span></span>
                          <span className="text-xs text-slate-500 mt-0.5">Thị Mai</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1"></span>
                        </div>
                      ) : cellShifts.length > 0 || isPast || Math.random() > 0.5 ? (
                        <div className="w-full h-full rounded-lg p-2 flex flex-col items-center justify-center text-center min-h-[70px]">
                          <span className="text-xs font-bold text-slate-700">Quốc Bảo</span>
                          <span className="text-xs text-slate-500 mt-0.5">Minh Tuấn</span>
                        </div>
                      ) : (
                        <div 
                          onClick={() => handleAssignClick(shiftRow.id, day.label)}
                          className="w-full h-full border border-dashed border-emerald-300 rounded-lg p-2 bg-emerald-50/50 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-emerald-100 hover:border-emerald-400 transition min-h-[70px]"
                        >
                          <Plus className="w-4 h-4 text-emerald-600 mb-1" />
                          <span className="text-xs font-bold text-emerald-700">+ Phân công</span>
                          <span className="text-[10px] text-emerald-600/80 mt-0.5">Đang trống</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <span className="w-4 h-4 flex items-center justify-center border border-slate-300 rounded text-[10px] text-slate-400 font-bold">+</span>
          Nhân viên click vào nút [+] tại các ca trống để đăng ký nhận ca trực. Lịch đăng ký sẽ được tự động ghi nhận vào hệ thống.
        </div>
        <div className="text-sm font-bold text-slate-800">
          Nguyễn Văn An (NV-048)
        </div>
      </div>
    </div>
  );
}
