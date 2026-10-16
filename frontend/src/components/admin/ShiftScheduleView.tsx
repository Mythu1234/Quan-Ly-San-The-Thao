import { useState } from 'react';
import {
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Download,
  Moon,
  Sun,
  Sunset,
  Clock,
  AlertTriangle,
  Share2,
  MoreVertical,
  User,
  Users,
  RefreshCw,
  ChevronLeft,
  Sparkles,
  Award,
} from 'lucide-react';
import type { Employee, ShiftRegistration } from '../../types/admin';

interface ShiftScheduleViewProps {
  employees: Employee[];
  shifts: ShiftRegistration[];
  onAddShift?: (shift: ShiftRegistration) => void;
  onDeleteShift?: (shiftId: string, reason: string) => void;
  isAdmin?: boolean;
}

export default function ShiftScheduleView({
  employees,
  shifts,
  onAddShift,
  onDeleteShift,
  isAdmin = false,
}: ShiftScheduleViewProps) {
  const [selectedDay] = useState<string>('2026-10-01');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedShiftForDelete, setSelectedShiftForDelete] = useState<ShiftRegistration | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const quickCancelReasons = [
    'Bận việc đột xuất',
    'Bị ốm / Sức khỏe không tốt',
    'Trùng lịch học / thi cử',
    'Có việc gia đình',
    'Xin đổi sang ca trực khác',
  ];

  // Export Excel states (UC-10)
  const [exportMonth] = useState('10');
  const [exportYear] = useState('2026');
  const [includeNightBonus] = useState(true);

  // Week selection state - Defaults to current week starting around 15/10
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date('2026-10-15'));

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

  // Submit UC-09: Delete / Cancel Shift
  const handleConfirmDeleteShift = () => {
    if (!cancelReason.trim()) {
      setDeleteError('Vui lòng nhập lý do hủy ca trực!');
      return;
    }
    if (selectedShiftForDelete) {
      onDeleteShift?.(selectedShiftForDelete.id, cancelReason.trim());

      const cellKey = `${selectedShiftForDelete.shiftType}-${selectedShiftForDelete.date}`;
      setAssignedCells((prev) => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });

      const empName = selectedShiftForDelete.employeeName;
      const sName = selectedShiftForDelete.shiftName;
      setSelectedShiftForDelete(null);
      setCancelReason('');
      setDeleteError(null);
      setSuccessToast(`Đã hủy ca trực ${sName} của ${empName} thành công!`);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  // Submit UC-10: Export Excel file
  const handleDownloadExcel = () => {
    const headers = ['Mã Ca', 'Nhân Viên', 'Ngày Trực', 'Ca Trực', 'Khung Giờ', 'Hệ Số Đêm', 'Trạng Thái'];
    const rows = shifts.map((s) => [
      s.id,
      s.employeeName,
      s.date,
      s.shiftType,
      s.timeRange,
      s.shiftType === 'Ca 3' && includeNightBonus ? '1.3' : '1.0',
      s.status === 'cancelled' ? 'Đã hủy' : 'Đã xác nhận',
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

  // 🟢 CUSTOM POPUP MODAL STATE: ĐĂNG KÝ CA TRỰC (Thay thế native window.confirm)
  const [registerModalData, setRegisterModalData] = useState<{
    shiftType: string;
    shiftName: string;
    timeRange: string;
    date: string;
  } | null>(null);

  const handleOpenRegisterModal = (shiftType: string, date: string) => {
    if (isAdmin) return;
    const shiftMeta = standardShifts.find((s) => s.type === shiftType);
    setRegisterModalData({
      shiftType,
      shiftName: shiftMeta?.name || shiftType,
      timeRange: shiftMeta?.time || '06:00 - 14:00',
      date,
    });
  };

  const handleConfirmRegister = () => {
    if (!registerModalData) return;
    const { shiftType, shiftName, timeRange, date } = registerModalData;
    setAssignedCells((prev) => ({ ...prev, [`${shiftType}-${date}`]: true }));
    onAddShift?.({
      id: `SH-${Date.now().toString().slice(-4)}`,
      employeeId: employees[0]?.id || 'NV01',
      employeeName: 'Nguyễn Văn An',
      date,
      dayOfWeek: 'Ngày trực',
      shiftType: shiftType as 'Ca 1' | 'Ca 2' | 'Ca 3',
      shiftName,
      timeRange,
      status: 'scheduled',
      nightShiftMultiplier: shiftType === 'Ca 3' ? 1.3 : 1.0,
    });
    setRegisterModalData(null);
  };

  if (showExportModal) {
    return (
      <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
        {/* 🟢 Top Navigation Bar */}
        <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExportModal(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                  HỆ THỐNG COURTX
                </span>
              </div>
              <h1 className="text-sm font-black text-slate-900 truncate">
                Xuất Excel Bảng Phân Ca
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'Bảng Phân Ca', text: 'Bảng Phân Ca Trực CourtX' }).catch(() => {});
                }
              }}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition"
              title="Chia sẻ"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs shadow-2xs">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 🟢 XLSX Banner Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 shadow-2xs">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                XLSX BANG_PHAN_CA_THANG_10_2026.XLSX
              </span>
              <h2 className="text-base font-black tracking-tight text-slate-900 mt-0.5 truncate">
                Lịch Trực Tuần 43 (21/10 – 27/10)
              </h2>
            </div>
          </div>

          {/* 3 Status Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              100% Khớp ca
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              24 ca đủ quân số
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 border border-teal-200">
              <RefreshCw className="w-3 h-3 text-teal-600" />
              3 ca bổ sung
            </span>
          </div>
        </div>

        {/* 🟢 Shift Color Legend & Scroll Hint */}
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-[11px]">Ca 1 (Sáng)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-[11px]">Ca 2 (Chiều)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <span className="text-[11px]">Ca 3 (Đêm)</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <RefreshCw className="w-3 h-3" />
            <span>Cuộn ngang</span>
          </div>
        </div>

        {/* 🟢 Excel Preview Formula Bar & Sheet Tab */}
        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono font-black text-emerald-600">fx</span>
            <span className="font-mono font-bold text-slate-800">=SUM(C2:I5)</span>
            <span className="text-slate-400 text-[11px] font-semibold">[Tổng giờ: 176h]</span>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600 border border-slate-200 shadow-2xs">
            Sheet1
          </span>
        </div>

        {/* 🟢 Excel Matrix Table Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[580px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="sticky left-0 z-10 bg-slate-50 p-2.5 font-black text-slate-600 uppercase text-[10px] tracking-wider border-r border-slate-200 min-w-[125px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    NHÂN VIÊN
                  </th>
                  <th className="p-2.5 font-black text-slate-700 text-center min-w-[65px] border-r border-slate-100">
                    <div>T2</div>
                    <div className="text-[10px] font-bold text-slate-400">21/10</div>
                  </th>
                  <th className="p-2.5 font-black text-slate-700 text-center min-w-[65px] border-r border-slate-100">
                    <div>T3</div>
                    <div className="text-[10px] font-bold text-slate-400">22/10</div>
                  </th>
                  <th className="p-2.5 font-black text-slate-700 text-center min-w-[65px] border-r border-slate-100">
                    <div>T4</div>
                    <div className="text-[10px] font-bold text-slate-400">23/10</div>
                  </th>
                  <th className="p-2.5 font-black text-slate-700 text-center min-w-[65px] border-r border-slate-100">
                    <div>T5</div>
                    <div className="text-[10px] font-bold text-slate-400">24/10</div>
                  </th>
                  <th className="p-2.5 font-black text-slate-700 text-center min-w-[65px] border-r border-slate-100">
                    <div>T6</div>
                    <div className="text-[10px] font-bold text-slate-400">25/10</div>
                  </th>
                  <th className="p-2.5 font-black text-slate-700 text-center min-w-[65px] border-r border-slate-100">
                    <div>T7</div>
                    <div className="text-[10px] font-bold text-slate-400">26/10</div>
                  </th>
                  <th className="p-2.5 font-black text-slate-700 text-center min-w-[65px]">
                    <div>CN</div>
                    <div className="text-[10px] font-bold text-slate-400">27/10</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Row 1: Nguyễn Văn An */}
                <tr>
                  <td className="sticky left-0 z-10 bg-white p-2.5 font-bold text-slate-800 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-black shrink-0">
                        A
                      </div>
                      <span className="truncate max-w-[95px]">Nguyễn Văn An</span>
                    </div>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Ca 1</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Ca 1</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">Nghỉ</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Ca 1</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Ca 1</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">Nghỉ</span>
                  </td>
                </tr>

                {/* Row 2: Trần Quốc Bảo */}
                <tr>
                  <td className="sticky left-0 z-10 bg-white p-2.5 font-bold text-slate-800 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black shrink-0">
                        B
                      </div>
                      <span className="truncate max-w-[95px]">Trần Quốc Bảo</span>
                    </div>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">Nghỉ</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">Nghỉ</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Ca 1</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Ca 1</span>
                  </td>
                </tr>

                {/* Row 3: Lê Thị Mai */}
                <tr>
                  <td className="sticky left-0 z-10 bg-white p-2.5 font-bold text-slate-800 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[10px] font-black shrink-0">
                        M
                      </div>
                      <span className="truncate max-w-[95px]">Lê Thị Mai</span>
                    </div>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">Ca 2</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">Nghỉ</span>
                  </td>
                </tr>

                {/* Row 4: Phạm Minh Tuấn */}
                <tr>
                  <td className="sticky left-0 z-10 bg-white p-2.5 font-bold text-slate-800 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-[10px] font-black shrink-0">
                        T
                      </div>
                      <span className="truncate max-w-[95px]">Phạm Minh Tuấn</span>
                    </div>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">Nghỉ</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Ca 3</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Ca 3</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-400">Nghỉ</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Ca 3</span>
                  </td>
                  <td className="p-2 text-center border-r border-slate-100">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Ca 3</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className="rounded bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">Ca 3</span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-black text-slate-700 border-t border-slate-200">
                  <td className="sticky left-0 z-10 bg-slate-50 p-2.5 text-[11px] uppercase tracking-wider text-slate-700 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)]">
                    Định biên/ngày
                  </td>
                  <td className="p-2 text-center text-emerald-700 border-r border-slate-100 font-black">3 ca</td>
                  <td className="p-2 text-center text-emerald-700 border-r border-slate-100 font-black">3 ca</td>
                  <td className="p-2 text-center text-emerald-700 border-r border-slate-100 font-black">3 ca</td>
                  <td className="p-2 text-center text-emerald-700 border-r border-slate-100 font-black">3 ca</td>
                  <td className="p-2 text-center text-emerald-700 border-r border-slate-100 font-black">3 ca</td>
                  <td className="p-2 text-center text-emerald-700 border-r border-slate-100 font-black">3 ca</td>
                  <td className="p-2 text-center text-emerald-700 font-black">3 ca</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 🟢 2 Summary Analytics Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>TRỰC NHIỀU NHẤT</span>
            </div>
            <div className="text-sm font-black text-slate-900">Lê Thị Mai</div>
            <div className="text-[11px] font-medium text-slate-500">6 ca trực • 48 giờ tuần</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-800 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ĐỐI SOÁT CA TRỐNG</span>
            </div>
            <div className="text-sm font-black text-emerald-700">0 ca bị trống</div>
            <div className="text-[11px] font-medium text-slate-500">Đảm bảo 100% vận hành</div>
          </div>
        </div>

        {/* 🟢 Download Button */}
        <button
          type="button"
          onClick={handleDownloadExcel}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0f5132] hover:bg-[#0c3e27] py-3.5 text-sm font-black text-white shadow-md active:scale-95 transition cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Xác nhận & Tải tệp Excel về máy</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0 overflow-hidden">
      {/* 🟢 Top Badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        {isAdmin ? 'BAN QUẢN LÝ: THEO DÕI LỊCH TRỰC' : 'NHÂN VIÊN: CA TRỰC CỦA TÔI'}
      </div>

      {/* 🟢 Title */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight break-words">
            LỊCH TRỰC TUẦN {isAdmin ? <span className="text-emerald-600">NHÂN VIÊN</span> : <span className="text-emerald-600">& ĐĂNG KÝ CA</span>}
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {isAdmin 
              ? 'Theo dõi phân bổ các ca làm việc do nhân viên tự đăng ký trong tuần.'
              : 'Xem lịch trực và chủ động đăng ký các ca làm việc còn trống trong tuần.'}
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>
        )}
      </div>

      {/* 🟢 Summary Cards */}
      {isAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">Tổng ca tuần</div>
            <div className="text-lg sm:text-xl font-black text-slate-800 truncate">21<span className="text-[10px] font-bold text-slate-400 ml-1">ca</span></div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide truncate">Đã có người trực</div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 truncate">{16 + Object.keys(assignedCells).length}<span className="text-[10px] font-bold text-emerald-600/70 ml-1">ca</span></div>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
            <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wide truncate">Ca còn trống</div>
            <div className="text-lg sm:text-xl font-black text-rose-700 truncate">{Math.max(0, 5 - Object.keys(assignedCells).length)}<span className="text-[10px] font-bold text-rose-600/70 ml-1">ca</span></div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide truncate">Nhân sự tham gia</div>
            <div className="text-lg sm:text-xl font-black text-blue-700 truncate">{employees.length}<span className="text-[10px] font-bold text-blue-600/70 ml-1">người</span></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide truncate">Ca đã đăng ký</div>
            <div className="text-lg sm:text-xl font-black text-emerald-700 truncate">{4 + Object.keys(assignedCells).length}<span className="text-[10px] font-bold text-emerald-600/70 ml-1">ca</span></div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 shadow-sm flex flex-col justify-center gap-0.5 overflow-hidden">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide truncate">Tổng giờ làm</div>
            <div className="text-lg sm:text-xl font-black text-blue-700 truncate">{26 + Object.keys(assignedCells).length * 8}<span className="text-[10px] font-bold text-blue-600/70 ml-1">giờ</span></div>
          </div>
        </div>
      )}

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
                );
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
                  const isMyShift = !isAdmin && cellShifts.some(s => s.employeeName === 'Nguyễn Văn An' || s.employeeId === 'NV01');
                  
                  return (
                    <td key={`${shiftRow.type}-${day.date}`} className="p-2 border-b border-r border-slate-200 align-middle h-24 bg-white relative">
                      {(isNewlyAssigned || isMyShift) ? (
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md p-1.5 flex flex-col items-center justify-between text-center relative min-h-[74px] overflow-hidden">
                          <div className="flex flex-col items-center">
                            <span className="text-[11px] font-black text-white flex items-center gap-1 drop-shadow-sm">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Ca của tôi
                            </span>
                            <span className="text-[9px] font-bold text-white bg-emerald-700/60 px-1.5 py-0.5 rounded mt-0.5">
                              Đã xác nhận
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const existingShift = cellShifts.find(s => s.employeeName === 'Nguyễn Văn An' || s.employeeId === 'NV01');
                              setSelectedShiftForDelete(existingShift || {
                                id: `SH-${shiftRow.type}-${day.date}`,
                                employeeId: 'NV01',
                                employeeName: 'Nguyễn Văn An',
                                date: day.date,
                                dayOfWeek: 'Ngày trực',
                                shiftType: shiftRow.type,
                                shiftName: shiftRow.name,
                                timeRange: shiftRow.time,
                                status: 'scheduled',
                              });
                              setCancelReason('');
                              setDeleteError(null);
                            }}
                            className="mt-1 inline-flex items-center gap-1 rounded-md bg-white/20 hover:bg-rose-600 hover:text-white px-2 py-0.5 text-[10px] font-bold text-white transition active:scale-95 cursor-pointer shadow-2xs"
                            title="Hủy ca trực này"
                          >
                            <X className="w-3 h-3" />
                            <span>Hủy ca</span>
                          </button>
                        </div>
                      ) : cellShifts.length > 0 ? (
                        <div className="flex flex-col gap-1.5 w-full h-full justify-center px-1">
                          {cellShifts.map(s => (
                            <div 
                              key={s.id} 
                              className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <div className="w-4 h-4 rounded-full bg-slate-200 flex flex-shrink-0 items-center justify-center text-[8px] font-black text-slate-500 uppercase">
                                  {s.employeeName.charAt(0)}
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 truncate">
                                  {s.employeeName.split(' ').pop()}
                                </span>
                              </div>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedShiftForDelete(s);
                                    setCancelReason('');
                                    setDeleteError(null);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title={`Hủy ca của ${s.employeeName}`}
                                >
                                  <X className="w-3.5 h-3.5 text-rose-500" />
                                </button>
                              )}
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
                          {isAdmin ? (
                            <div className="w-full py-2.5 px-1 bg-slate-50/60 text-slate-400 font-bold text-[11px] rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-0.5">
                              <span>Trống ca</span>
                              <span className="text-[9px] font-normal text-slate-400">Chờ NV đăng ký</span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleOpenRegisterModal(shiftRow.type, day.date)}
                              className="w-full py-2.5 px-1 bg-white text-emerald-600 font-bold text-[11px] rounded-xl border border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-md transition-all flex flex-col items-center justify-center gap-0.5 group cursor-pointer"
                            >
                              <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                              <span>Đăng ký ca</span>
                            </button>
                          )}
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

      {/* 🔴 MODAL: HỦY CA TRỰC NHÂN VIÊN (CÓ GHI LÝ DO) */}
      {selectedShiftForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-2xs">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                  HỦY CA TRỰC NHÂN VIÊN
                </h3>
                <p className="text-[10px] font-medium text-slate-500">
                  Xác nhận hủy phân công ca làm việc
                </p>
              </div>
            </div>

            {/* Chi tiết ca trực bị hủy */}
            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Nhân viên:</span>
                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {selectedShiftForDelete.employeeName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Ca trực:</span>
                <span className="font-bold text-slate-800">
                  {selectedShiftForDelete.shiftName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Ngày trực:</span>
                <span className="font-bold text-slate-800">
                  {selectedShiftForDelete.date}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Khung giờ:</span>
                <span className="font-semibold text-emerald-700">
                  {selectedShiftForDelete.timeRange}
                </span>
              </div>
            </div>

            {/* Nhập lý do hủy ca */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Lý do hủy ca trực <span className="text-rose-500">*</span>
              </label>

              {/* Nút chọn nhanh lý do */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {quickCancelReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setCancelReason(reason);
                      setDeleteError(null);
                    }}
                    className={`text-[10px] px-2 py-1 rounded-full border transition cursor-pointer font-medium ${
                      cancelReason === reason
                        ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                placeholder="Nhập chi tiết lý do hủy ca trực (bắt buộc)..."
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setDeleteError(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition"
              />
              {deleteError && (
                <span className="text-[11px] font-bold text-rose-600 mt-1 block">
                  {deleteError}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedShiftForDelete(null);
                  setDeleteError(null);
                  setCancelReason('');
                }}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                Giữ lại ca
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteShift}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 py-3 text-xs font-black text-white shadow-md shadow-rose-600/25 active:scale-95 transition cursor-pointer"
              >
                Xác nhận hủy ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 CUSTOM POPUP: XÁC NHẬN ĐĂNG KÝ CA TRỰC (KHÔNG DÙNG NATIVE ALERT) */}
      {registerModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Xác nhận đăng ký ca
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Nhận ca làm việc tại nhà thi đấu CourtX
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegisterModalData(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Khung ca:</span>
                <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {registerModalData.shiftName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Thời gian:</span>
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  {registerModalData.timeRange}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Ngày trực:</span>
                <span className="font-black text-slate-900">{registerModalData.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Nhân viên:</span>
                <span className="font-bold text-emerald-700">Nguyễn Văn An (NV-01)</span>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200/80 p-2.5 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-900 leading-relaxed font-medium">
                <strong>Xác nhận ngay lập tức:</strong> Ca làm việc sẽ được phê duyệt tự động vào lịch cá nhân mà không cần chờ chủ sân duyệt.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRegisterModalData(null)}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRegister}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-xs font-black text-white shadow-md shadow-emerald-500/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận đăng ký</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Toast thông báo thành công */}
      {successToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-slate-900/90 text-white px-4 py-2.5 text-xs font-bold shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
}
