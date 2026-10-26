import { useState } from 'react';
import {
  ChevronLeft,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  CheckSquare,
  Plus,
  Users,
  Sun,
  Sunset,
  Moon,
} from 'lucide-react';
import type { Employee, ShiftRegistration } from '../../types/admin';
import type { StandardShiftConfig } from './ShiftScheduleView';

interface AssignStaffShiftViewProps {
  initialShiftType: string;
  initialDate: string;
  standardShifts: StandardShiftConfig[];
  employees: Employee[];
  existingShifts: ShiftRegistration[];
  weekDays: { date: string; day: string; label: string; isToday: boolean }[];
  targetShift?: ShiftRegistration | null;
  onBack: () => void;
  onConfirmAssign: (assignedShift: ShiftRegistration) => void;
}

export default function AssignStaffShiftView({
  initialShiftType,
  initialDate,
  standardShifts,
  employees,
  existingShifts,
  weekDays,
  targetShift,
  onBack,
  onConfirmAssign,
}: AssignStaffShiftViewProps) {
  // Form states
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || '2026-10-16');
  const [selectedShiftType, setSelectedShiftType] = useState<string>(initialShiftType || 'Ca 1');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    targetShift && targetShift.employeeId !== 'PENDING' ? targetShift.employeeId : ''
  );
  const [selectedArea, setSelectedArea] = useState<string>(
    targetShift?.courtArea || 'Toàn bộ 8 sân'
  );
  const [notes, setNotes] = useState<string>(targetShift?.notes || '');
  const [customTaskInput, setCustomTaskInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Default common checklist tasks
  const defaultTasksList = [
    'Mở/đóng cửa và bật hệ thống điện chiếu sáng Lux LED',
    'Đón tiếp khách, soát mã QR đặt sân và thu phí',
    'Vệ sinh sàn thi đấu, kiểm kê và thu hồi dụng cụ',
    'Kiểm tra tình trạng thiết bị sân và tiếp nhận phản hồi sự cố',
  ];

  const [selectedTasks, setSelectedTasks] = useState<string[]>(
    targetShift?.tasks && targetShift.tasks.length > 0
      ? targetShift.tasks
      : [
          'Mở/đóng cửa và bật hệ thống điện chiếu sáng Lux LED',
          'Đón tiếp khách, soát mã QR đặt sân và thu phí',
        ]
  );

  const [allTasks, setAllTasks] = useState<string[]>(() => {
    const combined = [...defaultTasksList];
    if (targetShift?.tasks) {
      targetShift.tasks.forEach((t) => {
        if (!combined.includes(t)) combined.push(t);
      });
    }
    return combined;
  });

  const handleToggleTask = (taskText: string) => {
    if (selectedTasks.includes(taskText)) {
      setSelectedTasks(selectedTasks.filter((t) => t !== taskText));
    } else {
      setSelectedTasks([...selectedTasks, taskText]);
    }
  };

  const handleAddCustomTask = () => {
    if (!customTaskInput.trim()) return;
    const trimmed = customTaskInput.trim();
    if (!allTasks.includes(trimmed)) {
      setAllTasks((prev) => [...prev, trimmed]);
      setSelectedTasks((prev) => [...prev, trimmed]);
    }
    setCustomTaskInput('');
  };

  // Find shift config metadata
  const currentShiftMeta =
    standardShifts.find((s) => s.type === selectedShiftType) || standardShifts[0];

  const getShiftIcon = (type: string) => {
    if (type.includes('1')) return Sun;
    if (type.includes('2')) return Sunset;
    return Moon;
  };

  // Calculate shifts count per employee in the current active week
  const currentWeekDates = weekDays.map((d) => d.date);
  const employeeWeekShiftsCount: Record<string, number> = {};
  existingShifts.forEach((s) => {
    if (currentWeekDates.includes(s.date) && s.status !== 'cancelled' && s.employeeId !== 'PENDING') {
      employeeWeekShiftsCount[s.employeeId] = (employeeWeekShiftsCount[s.employeeId] || 0) + 1;
    }
  });

  // Calculate day of week label
  const dateObj = new Date(selectedDate);
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayOfWeekLabel = dayNames[dateObj.getDay()] || 'Ngày trực';

  const handleConfirm = () => {
    if (!selectedDate) {
      setErrorMessage('Vui lòng chọn ngày trực!');
      return;
    }

    // Check conflict: If not targetShift, check if this shift slot already has another shift
    const existing = existingShifts.find(
      (s) =>
        s.date === selectedDate &&
        s.shiftType === selectedShiftType &&
        s.status !== 'cancelled' &&
        (!targetShift || s.id !== targetShift.id)
    );

    if (existing && existing.employeeId !== 'PENDING') {
      setErrorMessage(
        `Khung ${selectedShiftType} ngày ${selectedDate.split('-').reverse().join('/')} đã được phân công cho nhân viên ${existing.employeeName}!`
      );
      return;
    }

    const selectedEmp = employees.find((e) => e.id === selectedEmployeeId);

    const assignedShift: ShiftRegistration = {
      id: targetShift ? targetShift.id : `SH-${Date.now().toString().slice(-4)}`,
      employeeId: selectedEmp ? selectedEmp.id : 'PENDING',
      employeeName: selectedEmp ? selectedEmp.name : 'Chờ NV nhận ca',
      date: selectedDate,
      dayOfWeek: dayOfWeekLabel,
      shiftType: selectedShiftType,
      shiftName: currentShiftMeta?.name || selectedShiftType,
      timeRange: currentShiftMeta?.time || '05:00 - 11:00',
      status: 'scheduled',
      courtArea: selectedArea,
      notes: notes.trim(),
      taskDescription: selectedTasks[0] || notes.trim() || 'Ca trực được phân công bởi Chủ sân',
      tasks: selectedTasks,
    };

    onConfirmAssign(assignedShift);
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* 🟢 Top Badge & Navigation Bar (Không modal) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Quay lại lịch trực"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            PHÂN CÔNG CA TRỰC NHÂN VIÊN
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 border border-slate-200 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>{dayOfWeekLabel}, {selectedDate.split('-').reverse().join('/')}</span>
        </div>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          PHÂN CÔNG NHÂN VIÊN <span className="text-emerald-600">& GIAO NHIỆM VỤ</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Chỉ định nhân sự trực ca, thiết lập phạm vi khu vực phụ trách và phân bổ nhiệm vụ vận hành nhà thi đấu.
        </p>
      </div>

      {/* 🟢 Card 1: Thông tin ca trực & Thời gian */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                1. Thông tin ca & Thời gian trực
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                Chọn khung ca, ngày làm việc và phạm vi sân phụ trách
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
            {currentShiftMeta?.hours || 6} tiếng / ca
          </span>
        </div>

        {/* Khung ca trực selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Khung ca trực tiêu chuẩn <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {standardShifts.map((st) => {
              const isSelected = selectedShiftType === st.type;
              const StIcon = st.icon || getShiftIcon(st.type);
              return (
                <button
                  key={st.type}
                  type="button"
                  onClick={() => {
                    setSelectedShiftType(st.type);
                    setErrorMessage(null);
                  }}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-slate-50/70 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <StIcon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                      <span className={`font-black text-xs ${isSelected ? 'text-emerald-950 font-black' : 'text-slate-800'}`}>
                        {st.type}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] font-bold text-slate-600">
                    {st.name.split(':')[1]?.trim() || st.name}
                  </div>
                  <div className="text-[9.5px] font-bold text-slate-400 mt-0.5">
                    {st.time} ({st.hours}h)
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ngày trực selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Ngày trực ca <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-2">
            {weekDays.map((d) => {
              const isSelected = selectedDate === d.date;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d.date);
                    setErrorMessage(null);
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition cursor-pointer text-[10.5px] ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white font-black shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                  }`}
                >
                  <div className="leading-tight">{d.day}</div>
                  <div className="text-[9px] opacity-80 mt-0.5">{d.label}</div>
                  {d.isToday && (
                    <div className="text-[8px] font-black text-emerald-300 mt-0.5">Nay</div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setErrorMessage(null);
              }}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
            />
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-2.5 rounded-xl border border-slate-200 whitespace-nowrap">
              {dayOfWeekLabel}
            </span>
          </div>
        </div>

        {/* Khu vực sân phụ trách */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            Khu vực sân phụ trách trong ca
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8.5 pr-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
            >
              <option value="Toàn bộ 8 sân">Toàn bộ 8 sân (Sân 01 - 08)</option>
              <option value="Cụm Sân 01 - 04">Cụm Sân 01 - 04 (Khu vực Cầu Lông A)</option>
              <option value="Cụm Sân 05 - 08">Cụm Sân 05 - 08 (Khu vực Cầu Lông & Pickleball B)</option>
              <option value="Khu vực Sân VIP & Khán đài">Khu vực Sân VIP & Khán đài chính</option>
              <option value="Khu vực Quầy lễ tân & Dịch vụ">Khu vực Quầy lễ tân & Cụm dịch vụ</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🟢 Card 2: Lựa chọn nhân sự phân công (Trực quan, danh sách rõ ràng) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                2. Chọn nhân sự phân công
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                Chọn nhân viên trực ca hoặc để mở ca trống cho nhân viên tự đăng ký
              </p>
            </div>
          </div>
        </div>

        {/* Tùy chọn Mở ca trống */}
        <div
          onClick={() => {
            setSelectedEmployeeId('');
            setErrorMessage(null);
          }}
          className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
            selectedEmployeeId === ''
              ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              selectedEmployeeId === '' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                Mở ca trống (Để nhân viên tự nhận ca)
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Ca trực sẽ ở trạng thái chờ tiếp nhận trên lịch, nhân viên có thể bấm "Đăng ký ca"
              </div>
            </div>
          </div>
          {selectedEmployeeId === '' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
        </div>

        {/* Danh sách nhân viên */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-slate-700">
            Hoặc chỉ định trực tiếp nhân viên dưới đây:
          </label>

          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {employees.map((emp) => {
              const isSelected = selectedEmployeeId === emp.id;
              const shiftsCount = employeeWeekShiftsCount[emp.id] || 0;

              // Kiểm tra xem nhân viên này đã có ca khác trong cùng ngày được chọn chưa
              const hasShiftOnSameDate = existingShifts.some(
                (s) =>
                  s.employeeId === emp.id &&
                  s.date === selectedDate &&
                  s.status !== 'cancelled' &&
                  (!targetShift || s.id !== targetShift.id)
              );

              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployeeId(emp.id);
                    setErrorMessage(null);
                  }}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {emp.name.charAt(0)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {emp.name}
                        </span>
                        <span className="text-[9.5px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {emp.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-slate-500 font-medium">
                        <span>SĐT: {emp.phone}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          {shiftsCount} ca tuần này
                        </span>
                      </div>

                      {hasShiftOnSameDate && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-amber-700 mt-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                          <span>Đã có ca trực khác trong ngày này</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-slate-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🟢 Card 3: Giao nhiệm vụ & Công việc ca trực */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                3. Giao nhiệm vụ vận hành cho ca
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">
                Tích chọn các công việc bàn giao để nhân viên thực hiện trong ca trực
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
            {selectedTasks.length} việc đã chọn
          </span>
        </div>

        {/* Checklist nhiệm vụ */}
        <div className="space-y-1.5">
          {allTasks.map((taskItem) => {
            const isChecked = selectedTasks.includes(taskItem);
            return (
              <label
                key={taskItem}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  isChecked
                    ? 'border-emerald-300 bg-emerald-50/60 text-slate-900 font-medium'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleTask(taskItem)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                />
                <span className="flex-1 leading-snug">{taskItem}</span>
              </label>
            );
          })}
        </div>

        {/* Thêm nhiệm vụ tùy biến */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Thêm nhiệm vụ phát sinh khác cho ca..."
            value={customTaskInput}
            onChange={(e) => setCustomTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomTask();
              }
            }}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
          />
          <button
            type="button"
            onClick={handleAddCustomTask}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Thêm việc
          </button>
        </div>

        {/* Ghi chú thêm */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Ghi chú / Lưu ý bổ sung của Chủ sân
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Lưu ý hôm nay có đoàn khách VIP thi đấu lúc 15:00..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 🟢 Footer Buttons (Không modal) */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs text-center"
        >
          Hủy bỏ & Quay lại
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs font-black text-white shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <UserCheck className="w-4 h-4 stroke-[2.5]" />
          <span>Xác nhận phân công</span>
        </button>
      </div>
    </div>
  );
}
