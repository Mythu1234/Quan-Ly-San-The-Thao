import { useState } from 'react';
import {
  CalendarClock,
  Plus,
  FileSpreadsheet,
  Trash2,
  CheckCircle2,
  X,
  Download,
  Moon,
  Sun,
  Sunset,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import type { Employee, ShiftRegistration } from '../../types/admin';

interface ShiftScheduleViewProps {
  employees: Employee[];
  shifts: ShiftRegistration[];
  onAddShift: (shift: ShiftRegistration) => void;
  onDeleteShift: (shiftId: string, reason: string) => void;
}

export default function ShiftScheduleView({
  employees,
  shifts,
  onAddShift,
  onDeleteShift,
}: ShiftScheduleViewProps) {
  const [selectedDay, setSelectedDay] = useState<string>('2026-10-01');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedShiftForDelete, setSelectedShiftForDelete] = useState<ShiftRegistration | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states for UC-08 (Register Shift)
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [newShiftDate, setNewShiftDate] = useState<string>('2026-10-01');
  const [newShiftType, setNewShiftType] = useState<'Ca 1' | 'Ca 2' | 'Ca 3'>('Ca 1');
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Export Excel states (UC-10)
  const [exportMonth, setExportMonth] = useState('10');
  const [exportYear, setExportYear] = useState('2026');
  const [includeNightBonus, setIncludeNightBonus] = useState(true);

  // Week selection state
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date('2026-10-01')); // Default to the demo week

  // Calculate days in the current week
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      date: `${yyyy}-${mm}-${dd}`,
      day: dayNames[d.getDay()],
      label: `${dd}/${mm}`,
    };
  });

  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
    // Don't auto-change selected day, just let the week slide
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  // Standard Shifts definition (UC-08)
  const standardShifts = [
    {
      type: 'Ca 1' as const,
      name: 'Ca 1: Sáng sớm & Thể dục',
      time: '06:00 - 14:00',
      icon: Sun,
      color: 'border-blue-200 bg-blue-50/60 text-blue-900',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      type: 'Ca 2' as const,
      name: 'Ca 2: Chiều tối Giờ Vàng',
      time: '14:00 - 22:00',
      icon: Sunset,
      color: 'border-emerald-200 bg-emerald-50/60 text-emerald-900',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      type: 'Ca 3' as const,
      name: 'Ca 3: Đêm muộn & Bảo trì mặt sân',
      time: '22:00 - 02:00',
      icon: Moon,
      color: 'border-amber-200 bg-amber-50/60 text-amber-900',
      badgeColor: 'bg-amber-100 text-amber-800',
      extra: 'Hệ số x1.3',
    },
  ];

  // Get shifts for the selected date
  const dayShifts = shifts.filter((s) => s.date === selectedDay && s.status !== 'cancelled');

  // Submit UC-08: Add Shift
  const handleRegisterShift = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp) {
      setRegisterError('Vui lòng chọn nhân viên hợp lệ!');
      return;
    }

    // BR: check duplicate shift for same employee on same date & shiftType
    const duplicate = shifts.find(
      (s) =>
        s.employeeId === selectedEmpId &&
        s.date === newShiftDate &&
        s.shiftType === newShiftType &&
        s.status !== 'cancelled'
    );
    if (duplicate) {
      setRegisterError(
        `Nhân viên ${emp.name} đã được phân ${newShiftType} trong ngày này rồi!`
      );
      return;
    }

    const shiftMeta = standardShifts.find((s) => s.type === newShiftType)!;
    const newShift: ShiftRegistration = {
      id: `SH-${Date.now().toString().slice(-4)}`,
      employeeId: emp.id,
      employeeName: emp.name,
      date: newShiftDate,
      dayOfWeek: 'Ngày trực',
      shiftType: newShiftType,
      shiftName: shiftMeta.name,
      timeRange: shiftMeta.time,
      status: 'scheduled',
      nightShiftMultiplier: newShiftType === 'Ca 3' ? 1.3 : 1.0,
    };

    onAddShift(newShift);
    setShowAddModal(false);
    setRegisterError(null);
  };

  // Submit UC-09: Delete Shift
  const handleConfirmDeleteShift = () => {
    if (!cancelReason.trim()) {
      setDeleteError('Vui lòng nhập lý do hủy ca trực!');
      return;
    }
    if (selectedShiftForDelete) {
      onDeleteShift(selectedShiftForDelete.id, cancelReason);
      setSelectedShiftForDelete(null);
      setCancelReason('');
      setDeleteError(null);
    }
  };

  // Submit UC-10: Export Excel file
  const handleDownloadExcel = () => {
    // Generate real CSV download
    const headers = ['Mã Ca', 'Nhân Viên', 'Ngày Trực', 'Ca Trực', 'Khung Giờ', 'Hệ Số Đêm', 'Trạng Thái'];
    const rows = shifts.map((s) => [
      s.id,
      s.employeeName,
      s.date,
      s.shiftType,
      s.timeRange,
      s.shiftType === 'Ca 3' && includeNightBonus ? '1.3' : '1.0',
      s.status === 'cancelled' ? 'Đã hủy' : 'Hợp lệ',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bang_Phan_Ca_Thang_${exportMonth}_${exportYear}_CourtX.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportModal(false);
  };

  const [assignedCells, setAssignedCells] = useState<Record<string, boolean>>({});

  const handleAssignClick = (shiftType: string, date: string) => {
    if (window.confirm(`Xác nhận đăng ký nhận ${shiftType} ngày ${date}?`)) {
      setAssignedCells(prev => ({ ...prev, [`${shiftType}-${date}`]: true }));
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0 overflow-hidden">
      {/* 🟢 Top Badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        NHÂN VIÊN: CA TRỰC CỦA TÔI
      </div>

      {/* 🟢 Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight break-words">
          LỊCH TRỰC TUẦN <span className="text-[#1b4d3e]">& ĐĂNG KÝ CA</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Xem lịch trực và chủ động đăng ký các ca làm việc còn trống trong tuần.
        </p>
      </div>

      {/* 🟢 Summary Cards (Employee) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
          <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide truncate">Ca đã đăng ký</div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 truncate">4<span className="text-[10px] font-bold text-emerald-600/70 ml-1">ca</span></div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
          <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide truncate">Tổng giờ làm</div>
          <div className="text-lg sm:text-xl font-black text-blue-700 truncate">26<span className="text-[10px] font-bold text-blue-600/70 ml-1">giờ</span></div>
        </div>
      </div>

      {/* 🟢 Week Days Slider */}
      <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <button type="button" onClick={handlePrevWeek} className="p-1 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 transition shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 text-center whitespace-nowrap">
              Tuần từ {weekDays[0].label} - {weekDays[6].label}
            </span>
            <button type="button" onClick={handleNextWeek} className="p-1 rounded bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 transition shrink-0">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* 🟢 Calendar Matrix (Bảng phân bổ ca trực) */}
      <div className="mt-6 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm overflow-x-auto relative">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-24 md:w-32 p-3 border-b border-r border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-middle">
                KHUNG CA LÀM
              </th>
              {weekDays.map(day => {
                const isSelected = selectedDay === day.date;
                return (
                  <th 
                    key={day.date} 
                    className={['p-2 md:p-3 border-b border-r border-slate-200 text-center', isSelected ? 'bg-emerald-50' : 'bg-slate-50'].join(' ')}
                  >
                    <div className={['text-xs font-black', isSelected ? 'text-emerald-700' : 'text-slate-800'].join(' ')}>
                      {day.day}
                    </div>
                    <div className={['text-[10px] mt-0.5 font-bold', isSelected ? 'text-emerald-600' : 'text-slate-500'].join(' ')}>
                      {day.label}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {standardShifts.map(shiftRow => (
              <tr key={shiftRow.type}>
                <td className="sticky left-0 z-10 p-3 border-b border-r border-slate-200 align-top bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <div className="flex items-start gap-2">
                    <div className={['w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', shiftRow.color].join(' ')}>
                      <shiftRow.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={['text-xs font-black leading-tight', shiftRow.type === 'Ca 1' ? 'text-emerald-700' : shiftRow.type === 'Ca 2' ? 'text-blue-700' : 'text-amber-700'].join(' ')}>{shiftRow.name.split(':')[0]}</div>
                      <div className={['text-[9px] font-bold mt-0.5 opacity-80', shiftRow.type === 'Ca 1' ? 'text-emerald-700' : shiftRow.type === 'Ca 2' ? 'text-blue-700' : 'text-amber-700'].join(' ')}>{shiftRow.name.split(':')[1]?.trim() || ''}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-1 leading-tight flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {shiftRow.time}
                      </div>
                    </div>
                  </div>
                </td>
                
                {weekDays.map(day => {
                  const cellShifts = shifts.filter(s => s.date === day.date && s.shiftType === shiftRow.type && s.status !== 'cancelled');
                  
                  const dayDate = new Date(day.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isPast = dayDate < today; 
                  
                  const isNewlyAssigned = assignedCells[`${shiftRow.type}-${day.date}`];
                  
                  return (
                    <td key={`${shiftRow.type}-${day.date}`} className="p-2 border-b border-r border-slate-200 align-middle h-24 bg-white relative">
                      {isNewlyAssigned ? (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md flex flex-col items-center justify-center text-center relative min-h-[70px] overflow-hidden group">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                          <CheckCircle2 className="w-4 h-4 text-white mb-1 opacity-90 drop-shadow-sm" />
                          <span className="text-xs font-black text-white drop-shadow-sm">Ca của tôi</span>
                          <span className="text-[9px] font-semibold text-emerald-100 mt-0.5">Chờ duyệt</span>
                        </div>
                      ) : cellShifts.length > 0 ? (
                        <div className="flex flex-col gap-1.5 w-full h-full justify-center px-1">
                          {cellShifts.map(s => (
                            <div key={s.id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                              <div className="w-4 h-4 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                                {s.employeeName.charAt(0)}
                              </div>
                              <span className="text-[11px] font-bold text-slate-700 truncate">
                                {s.employeeName.split(' ').pop()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : isPast ? (
                        <div className="w-full h-full flex flex-col items-center justify-center min-h-[70px] opacity-40">
                          <div className="w-6 h-1 rounded bg-slate-200 mb-2"></div>
                          <span className="text-xs text-slate-400 font-bold">Đã qua</span>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center min-h-[70px] px-1">
                          <button 
                            onClick={() => handleAssignClick(shiftRow.type, day.date)}
                            className="w-full py-2.5 px-1 bg-white text-emerald-600 font-bold text-[11px] rounded-xl border border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-md transition-all flex flex-col items-center justify-center gap-0.5 group"
                          >
                            <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>Đăng ký ca</span>
                          </button>
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

      {/* 🔴 MODAL UC-08: ĐĂNG KÝ CA TRỰC */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-black uppercase text-slate-900">
                  Đăng Ký Ca Trực (UC-08)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registerError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterShift} className="space-y-3">
              {/* Chọn Nhân viên */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nhân viên nhận ca <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn Ngày trực */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Ngày trực <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={newShiftDate}
                  onChange={(e) => setNewShiftDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:bg-white"
                />
              </div>

              {/* Chọn Ca trực */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Khung ca trực chuẩn <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {standardShifts.map((s) => (
                    <div
                      key={s.type}
                      onClick={() => setNewShiftType(s.type)}
                      className={[
                        'flex items-center justify-between rounded-xl p-2.5 border cursor-pointer transition',
                        newShiftType === s.type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700',
                      ].join(' ')}
                    >
                      <div>
                        <span className="text-xs font-bold block">{s.name}</span>
                        <span className="text-[10px] text-slate-500">{s.time}</span>
                      </div>
                      {newShiftType === s.type && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info rule */}
              <div className="rounded-xl bg-slate-50 p-2.5 text-[10px] text-slate-500 leading-relaxed border border-slate-100">
                <strong>Quy định nghiệp vụ (BR):</strong> Định biên tối thiểu 1 NV/ca. Đảm bảo thời gian nghỉ giữa 2 ca liên tiếp tối thiểu 8 giờ.
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#1b4d3e] hover:bg-[#143d31] py-3 text-xs font-black text-white shadow-sm cursor-pointer"
                >
                  Lưu & Phân ca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔴 MODAL UC-09: XÓA CA TRỰC ĐÃ TẠO */}
      {selectedShiftForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-600 font-black text-sm uppercase">
              <ShieldAlert className="w-5 h-5" />
              <span>Hủy / Xóa Ca Trực (UC-09)</span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Nhân viên:</span>
                <span className="font-bold text-slate-900">
                  {selectedShiftForDelete.employeeName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ca trực:</span>
                <span className="font-bold text-slate-900">
                  {selectedShiftForDelete.shiftName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ngày:</span>
                <span className="font-bold text-slate-900">
                  {selectedShiftForDelete.date}
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200">
              Cảnh báo: Nếu xóa ca này, vui lòng đảm bảo đã có người trực thay thế nếu vi phạm định biên quân số tối thiểu.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Lý do hủy ca <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Nhân viên xin nghỉ đột xuất / đổi ca học..."
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setDeleteError(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-rose-500 focus:bg-white"
              />
              {deleteError && (
                <span className="text-[11px] font-bold text-rose-600 mt-1 block">
                  {deleteError}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedShiftForDelete(null);
                  setDeleteError(null);
                }}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteShift}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 py-3 text-xs font-black text-white shadow-sm cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 MODAL UC-10: XUẤT EXCEL BẢNG PHÂN CA */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black uppercase text-slate-900">
                  Xuất Bảng Phân Ca Excel (UC-10)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tháng làm việc
                  </label>
                  <select
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="10">Tháng 10</option>
                    <option value="11">Tháng 11</option>
                    <option value="12">Tháng 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Năm
                  </label>
                  <select
                    value={exportYear}
                    onChange={(e) => setExportYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>

              {/* Night bonus checkbox */}
              <label className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNightBonus}
                  onChange={(e) => setIncludeNightBonus(e.target.checked)}
                  className="rounded text-emerald-600 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Tính hệ số ca đêm x1.3 (Ca 3: 22h - 02h)
                </span>
              </label>

              {/* Summary box */}
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 space-y-1">
                <span className="font-black uppercase tracking-wider block text-[10px] text-emerald-800">
                  TÓM TẮT TRÍCH XUẤT
                </span>
                <p>• Tổng số ca trực: <strong>{shifts.length} ca</strong></p>
                <p>• Nhân sự tham gia: <strong>{employees.length} người</strong></p>
                <p className="text-[11px] text-emerald-700 truncate">
                  • Tệp: <code>Bang_Phan_Ca_Thang_{exportMonth}_{exportYear}_CourtX.xlsx</code>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1b4d3e] hover:bg-[#143d31] py-3 text-xs font-black text-white shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải tệp Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
