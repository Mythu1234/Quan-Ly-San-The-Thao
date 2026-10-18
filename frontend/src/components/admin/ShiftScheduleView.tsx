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
  ChevronRight,
  Sparkles,
  Award,
  Trash2,
  UserMinus,
  Calendar,
  CalendarCheck,
  Search,
  CheckSquare,
  Square,
  MapPin,
  ClipboardList,
  Flame,
  Info,
  Zap,
  Sliders,
} from 'lucide-react';
import type { Employee, ShiftRegistration } from '../../types/admin';
import { INITIAL_SHIFTS } from '../../types/admin';

export interface StandardShiftConfig {
  type: string;
  name: string;
  time: string;
  hours: number;
  icon?: any;
  color: string;
  accentColor: string;
  badgeColor: string;
  description: string;
  subNote: string;
  wageMultiplier: number;
  isActive: boolean;
}

interface ShiftScheduleViewProps {
  employees: Employee[];
  shifts: ShiftRegistration[];
  onAddShift?: (shift: ShiftRegistration) => void;
  onAddMultipleShifts?: (newShifts: ShiftRegistration[]) => void;
  onDeleteMultipleShifts?: (shiftIds: string[], permanent?: boolean, reason?: string) => void;
  onUpdateShift?: (shift: ShiftRegistration) => void;
  onDeleteShift?: (shiftId: string, reason: string, permanent?: boolean) => void;
  isAdmin?: boolean;
}

export default function ShiftScheduleView({
  employees,
  shifts,
  onAddShift,
  onAddMultipleShifts,
  onDeleteMultipleShifts,
  onUpdateShift,
  onDeleteShift,
  isAdmin = false,
}: ShiftScheduleViewProps) {
  // Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedShiftForDelete, setSelectedShiftForDelete] = useState<ShiftRegistration | null>(null);
  const [deleteActionContext, setDeleteActionContext] = useState<'unassign_employee' | 'delete_shift' | 'cancel_shift'>('unassign_employee');
  const [isPermanentDelete, setIsPermanentDelete] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Admin Add Task Modal state (Giao việc cho ca trực)
  const [taskModalData, setTaskModalData] = useState<{
    shiftType: string;
    shiftName: string;
    timeRange: string;
    date: string;
    shift?: ShiftRegistration;
  } | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskArea, setTaskArea] = useState('Toàn bộ 8 sân');
  const [taskPriority, setTaskPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [taskError, setTaskError] = useState<string | null>(null);
  const [localAssignedTasks, setLocalAssignedTasks] = useState<Record<string, string[]>>({});

  // Admin Create Shift Modal state (Thêm ca trực vào lịch)
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
  const [createShiftDate, setCreateShiftDate] = useState('2026-10-16');
  const [createShiftType, setCreateShiftType] = useState<string>('Ca 1');
  const [createShiftEmployeeId, setCreateShiftEmployeeId] = useState('');
  const [createShiftArea, setCreateShiftArea] = useState('Toàn bộ 8 sân');
  const [createShiftNotes, setCreateShiftNotes] = useState('');
  const [createShiftError, setCreateShiftError] = useState<string | null>(null);

  // Track slots where shifts were deleted in this session
  const [deletedSlotsHistory, setDeletedSlotsHistory] = useState<
    Record<string, { shiftName: string; employeeName: string; reason?: string }>
  >({});

  // View & Filter states
  const [viewFilter, setViewFilter] = useState<'all' | 'my'>('all');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('ALL');
  const [adminViewMode, setAdminViewMode] = useState<'matrix' | 'list'>('matrix');
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>('ALL');

  // Checklist state for today's tasks (Employee view)
  const [taskChecklist, setTaskChecklist] = useState<Record<string, boolean>>({
    't1': true,
    't2': false,
    't3': false,
    't4': false,
  });

  const toggleTask = (taskId: string) => {
    setTaskChecklist((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const quickCancelReasons = [
    'Chủ sân xóa ca khỏi lịch',
    'Điều chỉnh lịch ca trực',
    'Thay đổi định biên nhân sự',
    'Bận việc đột xuất',
    'Bị ốm / Sức khỏe không tốt',
    'Trùng lịch học / thi cử',
    'Có việc gia đình',
    'Xin đổi sang ca trực khác',
  ];

  // Export Excel states (UC-10)
  const [exportMonth] = useState('10');
  const [exportYear] = useState('2026');

  // Week selection state - Defaults to active week 15/10 - 21/10
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date('2026-10-15'));
  const [viewDaysSpan, setViewDaysSpan] = useState<7 | 14>(7);

  // Calculate days in the current week (7 days for Matrix view)
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
      dayNum: dd,
      monthNum: mm,
      year: yyyy,
      isToday: `${yyyy}-${mm}-${dd}` === '2026-10-16',
    };
  });

  // Calculate days for List/Calendar view (7 or 14 days)
  const displayDays = Array.from({ length: viewDaysSpan }).map((_, i) => {
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
      dayNum: dd,
      monthNum: mm,
      year: yyyy,
      isToday: `${yyyy}-${mm}-${dd}` === '2026-10-16',
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

  const handleResetToCurrentWeek = () => {
    setCurrentWeekStart(new Date('2026-10-15'));
  };

  // Default Standard Shifts definition (UC-08)
  const DEFAULT_SHIFTS_CONFIG: StandardShiftConfig[] = [
    {
      type: 'Ca 1',
      name: 'Ca 1: Sáng sớm & Mở sân',
      time: '05:00 - 11:00',
      hours: 6,
      icon: Sun,
      color: 'border-blue-200 bg-blue-50/80 text-blue-900',
      accentColor: 'text-blue-700',
      badgeColor: 'bg-blue-100 text-blue-800',
      description: 'Mở cửa sân 05:00, đón khách tập thể dục, bật hệ thống đèn & quạt thông gió',
      subNote: 'Mở sân 05:00',
      wageMultiplier: 1.0,
      isActive: true,
    },
    {
      type: 'Ca 2',
      name: 'Ca 2: Chiều & Giải đấu',
      time: '11:00 - 17:00',
      hours: 6,
      icon: Sunset,
      color: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
      accentColor: 'text-emerald-700',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'Trực trưa & chiều, đón CLB phong trào, điều phối thiết bị lưu động vào sân',
      subNote: 'Giải đấu & CLB',
      wageMultiplier: 1.0,
      isActive: true,
    },
    {
      type: 'Ca 3',
      name: 'Ca 3: Tối Giờ Vàng & Đóng sân',
      time: '17:00 - 23:00',
      hours: 6,
      icon: Moon,
      color: 'border-amber-200 bg-amber-50/80 text-amber-900',
      accentColor: 'text-amber-700',
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Giờ cao điểm các CLB, bảo dưỡng sàn thi đấu, kiểm kê kho & đóng cửa 23:00',
      subNote: 'Đóng sân 23:00',
      wageMultiplier: 1.0,
      isActive: true,
    },
  ];

  // Dynamic state for Shift Structure (Cơ cấu ca trực)
  const [standardShifts, setStandardShifts] = useState<StandardShiftConfig[]>(DEFAULT_SHIFTS_CONFIG);

  // Preset templates for Shift Structure
  const SHIFT_STRUCTURE_PRESETS = [
    {
      id: 'p1_standard_3',
      title: '3 Ca 6 tiếng (Tiêu chuẩn 05:00 - 23:00)',
      badge: 'Phổ biến',
      desc: '3 ca x 6 tiếng: Sáng 05:00-11:00, Chiều 11:00-17:00, Tối 17:00-23:00.',
      shifts: [
        {
          type: 'Ca 1',
          name: 'Ca 1: Sáng sớm & Mở sân',
          time: '05:00 - 11:00',
          hours: 6,
          icon: Sun,
          color: 'border-blue-200 bg-blue-50/80 text-blue-900',
          accentColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800',
          description: 'Mở cửa sân 05:00, đón khách tập thể dục, bật hệ thống đèn & quạt',
          subNote: 'Mở sân 05:00',
          wageMultiplier: 1.0,
          isActive: true,
        },
        {
          type: 'Ca 2',
          name: 'Ca 2: Chiều & Giải đấu',
          time: '11:00 - 17:00',
          hours: 6,
          icon: Sunset,
          color: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
          accentColor: 'text-emerald-700',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          description: 'Trực trưa & chiều, đón CLB phong trào, điều phối thiết bị lưu động',
          subNote: 'Giải đấu & CLB',
          wageMultiplier: 1.0,
          isActive: true,
        },
        {
          type: 'Ca 3',
          name: 'Ca 3: Tối Giờ Vàng & Đóng sân',
          time: '17:00 - 23:00',
          hours: 6,
          icon: Moon,
          color: 'border-amber-200 bg-amber-50/80 text-amber-900',
          accentColor: 'text-amber-700',
          badgeColor: 'bg-amber-100 text-amber-800',
          description: 'Giờ cao điểm các CLB, bảo dưỡng sàn thi đấu, kiểm kê kho & đóng cửa 23:00',
          subNote: 'Đóng sân 23:00',
          wageMultiplier: 1.0,
          isActive: true,
        },
      ],
    },
    {
      id: 'p2_arena_night',
      title: '3 Ca Chuẩn Arena (Quy chế THPTTKHTTT - Ca Đêm Phụ cấp 1.3)',
      badge: 'Quy chế môn học',
      desc: 'Ca 1 (06:00-14:00, 8h), Ca 2 (14:00-22:00, 8h), Ca 3 Đêm (22:00-02:00, 4h lương x1.3).',
      shifts: [
        {
          type: 'Ca 1',
          name: 'Ca 1: Sáng sớm & Thể dục',
          time: '06:00 - 14:00',
          hours: 8,
          icon: Sun,
          color: 'border-blue-200 bg-blue-50/80 text-blue-900',
          accentColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800',
          description: 'Mở cửa 06:00, đón khách tập sáng sớm & buổi trưa',
          subNote: 'Hệ số 1.0 (8h)',
          wageMultiplier: 1.0,
          isActive: true,
        },
        {
          type: 'Ca 2',
          name: 'Ca 2: Chiều tối Giờ Vàng',
          time: '14:00 - 22:00',
          hours: 8,
          icon: Sunset,
          color: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
          accentColor: 'text-emerald-700',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          description: 'Giờ cao điểm các CLB và giải đấu phong trào',
          subNote: 'Hệ số 1.0 (8h)',
          wageMultiplier: 1.0,
          isActive: true,
        },
        {
          type: 'Ca 3',
          name: 'Ca 3: Đêm muộn & Bảo dưỡng',
          time: '22:00 - 02:00',
          hours: 4,
          icon: Moon,
          color: 'border-purple-200 bg-purple-50/80 text-purple-900',
          accentColor: 'text-purple-700',
          badgeColor: 'bg-purple-100 text-purple-800',
          description: 'Trực ca đêm muộn, bảo dưỡng thảm thi đấu, an ninh sân bãi',
          subNote: 'Hệ số 1.3 (Phụ cấp đêm)',
          wageMultiplier: 1.3,
          isActive: true,
        },
      ],
    },
    {
      id: 'p3_two_shifts',
      title: '2 Ca 8 tiếng (Thể thao ban ngày 06:00 - 22:00)',
      badge: 'Đóng sớm',
      desc: 'Hoạt động 2 ca 8 tiếng trong ngày, đóng cửa lúc 22:00, không có ca đêm.',
      shifts: [
        {
          type: 'Ca 1',
          name: 'Ca 1: Sáng & Trưa',
          time: '06:00 - 14:00',
          hours: 8,
          icon: Sun,
          color: 'border-blue-200 bg-blue-50/80 text-blue-900',
          accentColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800',
          description: 'Mở cửa 06:00, quản lý sân ban ngày',
          subNote: '8 tiếng / ca',
          wageMultiplier: 1.0,
          isActive: true,
        },
        {
          type: 'Ca 2',
          name: 'Ca 2: Chiều & Tối Giờ Vàng',
          time: '14:00 - 22:00',
          hours: 8,
          icon: Sunset,
          color: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
          accentColor: 'text-emerald-700',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          description: 'Giờ cao điểm, tổng kết két tiền và đóng cửa 22:00',
          subNote: '8 tiếng / ca',
          wageMultiplier: 1.0,
          isActive: true,
        },
      ],
    },
    {
      id: 'p4_four_shifts',
      title: '4 Ca Linh hoạt (Chia nhỏ 4.5 tiếng/ca)',
      badge: 'Bán thời gian',
      desc: 'Phù hợp sinh viên làm bán thời gian 4.5h/ca xoay vòng linh hoạt.',
      shifts: [
        {
          type: 'Ca 1',
          name: 'Ca 1: Sáng sớm',
          time: '05:00 - 09:30',
          hours: 4.5,
          icon: Sun,
          color: 'border-blue-200 bg-blue-50/80 text-blue-900',
          accentColor: 'text-blue-700',
          badgeColor: 'bg-blue-100 text-blue-800',
          description: 'Mở sân & đón khách thể dục',
          subNote: '4.5h',
          wageMultiplier: 1.0,
          isActive: true,
        },
        {
          type: 'Ca 2',
          name: 'Ca 2: Trưa',
          time: '09:30 - 14:00',
          hours: 4.5,
          icon: Sun,
          color: 'border-cyan-200 bg-cyan-50/80 text-cyan-900',
          accentColor: 'text-cyan-700',
          badgeColor: 'bg-cyan-100 text-cyan-800',
          description: 'Trực trưa & kiểm tra cơ sở vật chất',
          subNote: '4.5h',
          wageMultiplier: 1.0,
          isActive: true,
        },
        {
          type: 'Ca 3',
          name: 'Ca 3: Chiều',
          time: '14:00 - 18:30',
          hours: 4.5,
          icon: Sunset,
          color: 'border-emerald-200 bg-emerald-50/80 text-emerald-900',
          accentColor: 'text-emerald-700',
          badgeColor: 'bg-emerald-100 text-emerald-800',
          description: 'Đón các câu lạc bộ phong trào',
          subNote: '4.5h',
          wageMultiplier: 1.0,
          isActive: true,
        },
        {
          type: 'Ca 4',
          name: 'Ca 4: Tối Giờ Vàng',
          time: '18:30 - 23:00',
          hours: 4.5,
          icon: Moon,
          color: 'border-amber-200 bg-amber-50/80 text-amber-900',
          accentColor: 'text-amber-700',
          badgeColor: 'bg-amber-100 text-amber-800',
          description: 'Giờ vàng thi đấu, bảo dưỡng thảm & đóng cửa',
          subNote: '4.5h',
          wageMultiplier: 1.0,
          isActive: true,
        },
      ],
    },
  ];

  // Modal: Quản lý Cơ cấu & Thao tác Ca (Tabs: Đổi cơ cấu ca | Xóa ca hàng loạt)
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkTab, setBulkTab] = useState<'structure' | 'delete'>('structure');
  const [editingShifts, setEditingShifts] = useState<StandardShiftConfig[]>(DEFAULT_SHIFTS_CONFIG);

  // Scope states for Shift Structure (1. Khoảng ngày, 2. Thứ trong tuần, 3. Khung ca, 6. Nhiệm vụ mẫu)
  const [structureStartDate, setStructureStartDate] = useState('2026-10-15');
  const [structureEndDate, setStructureEndDate] = useState('2026-10-21');
  const [structureDaysOfWeek, setStructureDaysOfWeek] = useState<string[]>([
    'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN',
  ]);
  const [structureShiftTypes, setStructureShiftTypes] = useState<string[]>(['Ca 1', 'Ca 2', 'Ca 3']);
  const [structureTasks, setStructureTasks] = useState<string[]>([
    'Mở/đóng cửa và kiểm tra hệ thống điện chiếu sáng',
    'Đón tiếp khách, soát mã đặt sân và thu phí',
    'Vệ sinh sàn thi đấu, kiểm kê và thu hồi dụng cụ',
  ]);
  const [selectedStructureTasks, setSelectedStructureTasks] = useState<string[]>([
    'Mở/đóng cửa và kiểm tra hệ thống điện chiếu sáng',
    'Đón tiếp khách, soát mã đặt sân và thu phí',
    'Vệ sinh sàn thi đấu, kiểm kê và thu hồi dụng cụ',
  ]);
  const [structureCustomTaskInput, setStructureCustomTaskInput] = useState('');

  const handleAddStructureTask = () => {
    if (!structureCustomTaskInput.trim()) return;
    const newTask = structureCustomTaskInput.trim();
    if (!structureTasks.includes(newTask)) {
      setStructureTasks((prev) => [...prev, newTask]);
      setSelectedStructureTasks((prev) => [...prev, newTask]);
    }
    setStructureCustomTaskInput('');
  };

  // Bulk Delete form states
  const [bulkDeleteStartDate, setBulkDeleteStartDate] = useState('2026-10-15');
  const [bulkDeleteEndDate, setBulkDeleteEndDate] = useState('2026-10-21');
  const [bulkDeleteShiftTypes, setBulkDeleteShiftTypes] = useState<string[]>(['Ca 1', 'Ca 2', 'Ca 3']);
  const [bulkDeleteMode, setBulkDeleteMode] = useState<'full_delete' | 'unassign_only'>('full_delete');
  const [bulkDeleteReason, setBulkDeleteReason] = useState('Chủ sân điều chỉnh cơ cấu ca hàng loạt');

  // Apply Shift Structure changes across selected date range, days of week, and shift types
  const handleSaveShiftStructure = (newStructure: StandardShiftConfig[]) => {
    setStandardShifts(newStructure);

    const start = new Date(structureStartDate);
    const end = new Date(structureEndDate);
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayCodes = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const newShiftsToCreate: ShiftRegistration[] = [];
    let updatedCount = 0;

    const cur = new Date(start);
    while (cur <= end) {
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const curDateStr = `${yyyy}-${mm}-${dd}`;
      const dayOfWeekIdx = cur.getDay();
      const dayCode = dayCodes[dayOfWeekIdx];

      if (structureDaysOfWeek.includes(dayCode)) {
        structureShiftTypes.forEach((shType) => {
          const config = newStructure.find((s) => s.type === shType);
          if (!config) return;

          const existingShift = effectiveShifts.find(
            (s) => s.date === curDateStr && s.shiftType === shType && s.status !== 'cancelled'
          );

          if (existingShift) {
            onUpdateShift?.({
              ...existingShift,
              shiftName: config.name,
              timeRange: config.time,
              tasks: selectedStructureTasks.length > 0 ? selectedStructureTasks : existingShift.tasks,
            });
            updatedCount++;
          } else {
            const newShift: ShiftRegistration = {
              id: `SH-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 900 + 100)}`,
              employeeId: 'PENDING',
              employeeName: 'Chờ NV nhận ca',
              shiftType: config.type,
              shiftName: config.name,
              timeRange: config.time,
              date: curDateStr,
              dayOfWeek: dayNames[dayOfWeekIdx],
              status: 'scheduled',
              tasks: selectedStructureTasks,
              taskDescription: config.description || 'Ca trực vận hành sân',
              courtArea: 'Toàn bộ 8 sân',
            };
            newShiftsToCreate.push(newShift);
          }
        });
      }

      cur.setDate(cur.getDate() + 1);
    }

    if (newShiftsToCreate.length > 0) {
      if (onAddMultipleShifts) {
        onAddMultipleShifts(newShiftsToCreate);
      } else {
        newShiftsToCreate.forEach((s) => onAddShift?.(s));
      }
    }

    setShowBulkModal(false);
    const totalApplied = updatedCount + newShiftsToCreate.length;
    setSuccessToast(
      `Đã cập nhật cơ cấu ca cho ${totalApplied} ca (${newShiftsToCreate.length} ca mới, ${updatedCount} ca điều chỉnh) từ ${structureStartDate.split('-').reverse().join('/')} đến ${structureEndDate.split('-').reverse().join('/')}!`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Execute Bulk Delete Shifts
  const handleExecuteBulkDelete = () => {
    const matchingShifts = effectiveShifts.filter((s) => {
      return (
        s.date >= bulkDeleteStartDate &&
        s.date <= bulkDeleteEndDate &&
        bulkDeleteShiftTypes.includes(s.shiftType) &&
        s.status !== 'cancelled'
      );
    });

    if (matchingShifts.length === 0) {
      alert('Không tìm thấy ca trực nào trong khoảng ngày và khung ca đã chọn!');
      return;
    }

    const shiftIds = matchingShifts.map((s) => s.id);
    if (bulkDeleteMode === 'full_delete') {
      if (onDeleteMultipleShifts) {
        onDeleteMultipleShifts(shiftIds, true, bulkDeleteReason);
      } else {
        shiftIds.forEach((id) => onDeleteShift?.(id, bulkDeleteReason, true));
      }
      setSuccessToast(`🗑️ Đã xóa hoàn toàn ${matchingShifts.length} ca trực khỏi lịch!`);
    } else {
      matchingShifts.forEach((s) => {
        onUpdateShift?.({
          ...s,
          employeeId: 'PENDING',
          employeeName: 'Chờ NV nhận ca',
        });
      });
      setSuccessToast(`Đã gỡ nhân viên khỏi ${matchingShifts.length} ca (giữ lại ca trống)!`);
    }

    setShowBulkModal(false);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Fallback to INITIAL_SHIFTS only if shifts prop was not passed
  const effectiveShifts = shifts ?? INITIAL_SHIFTS;

  // Employee's shifts in current week
  const currentWeekDates = weekDays.map((d) => d.date);
  const myShiftsInWeek = effectiveShifts.filter(
    (s) =>
      (s.employeeName === 'Nguyễn Văn An' || s.employeeId === 'NV01') &&
      currentWeekDates.includes(s.date) &&
      s.status !== 'cancelled'
  );

  const totalMyHoursInWeek = myShiftsInWeek.reduce((acc, s) => {
    const shiftMeta = standardShifts.find((m) => m.type === s.shiftType);
    return acc + (shiftMeta?.hours || 8);
  }, 0);

  // Active shifts in week for Admin
  const activeWeekShifts = effectiveShifts.filter(
    (s) => currentWeekDates.includes(s.date) && s.status !== 'cancelled'
  );

  // Unique employees working in this week
  const activeStaffIds = new Set(activeWeekShifts.map((s) => s.employeeId));

  // Admin UC-08: Open Create Shift Modal (Thêm ca trực vào lịch)
  const handleOpenCreateShiftModal = (
    shiftType?: string,
    date?: string
  ) => {
    if (shiftType) setCreateShiftType(shiftType);
    if (date) setCreateShiftDate(date);
    else setCreateShiftDate('2026-10-16');
    setCreateShiftEmployeeId('');
    setCreateShiftArea('Toàn bộ 8 sân');
    setCreateShiftNotes('');
    setCreateShiftError(null);
    setShowCreateShiftModal(true);
  };

  // Admin UC-08: Confirm Create Shift (Tạo ca trực mới trên lịch)
  const handleConfirmCreateShift = () => {
    if (!createShiftDate) {
      setCreateShiftError('Vui lòng chọn ngày trực!');
      return;
    }

    // Kiểm tra xem ca này trong ngày đã có chưa
    const existing = effectiveShifts.find(
      (s) => s.date === createShiftDate && s.shiftType === createShiftType && s.status !== 'cancelled'
    );
    if (existing) {
      setCreateShiftError(
        `Khung ${createShiftType} ngày ${createShiftDate.split('-').reverse().join('/')} đã có ca trực (mã: ${existing.id})! Vui lòng xóa ca cũ hoặc chọn khung ca/ngày khác.`
      );
      return;
    }

    const shiftMeta = standardShifts.find((s) => s.type === createShiftType);
    const selectedEmp = employees.find((e) => e.id === createShiftEmployeeId);
    const shiftDateObj = new Date(createShiftDate);
    const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayOfWeek = dayNames[shiftDateObj.getDay()] || 'Ngày trực';

    const newShift: ShiftRegistration = {
      id: `SH-${Date.now().toString().slice(-4)}`,
      employeeId: selectedEmp ? selectedEmp.id : 'PENDING',
      employeeName: selectedEmp ? selectedEmp.name : 'Chờ NV nhận ca',
      date: createShiftDate,
      dayOfWeek,
      shiftType: createShiftType,
      shiftName: shiftMeta?.name || createShiftType,
      timeRange: shiftMeta?.time || '05:00 - 11:00',
      status: 'scheduled',
      courtArea: createShiftArea,
      taskDescription: createShiftNotes.trim() || 'Ca trực được tạo bởi Chủ sân',
      tasks: createShiftNotes.trim() ? [createShiftNotes.trim()] : [],
    };

    onAddShift?.(newShift);
    const createdCellKey = `${createShiftType}-${createShiftDate}`;
    setDeletedSlotsHistory((prev) => {
      const next = { ...prev };
      delete next[createdCellKey];
      return next;
    });
    setShowCreateShiftModal(false);
    setSuccessToast(`Đã thêm ${newShift.shiftName} ngày ${createShiftDate.split('-').reverse().join('/')} vào lịch ca trực!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Submit UC-09: Delete / Cancel Shift or Unassign Employee
  const handleConfirmDeleteShift = () => {
    if (!cancelReason.trim()) {
      setDeleteError(
        deleteActionContext === 'unassign_employee'
          ? 'Vui lòng chọn hoặc nhập lý do gỡ nhân viên khỏi ca!'
          : 'Vui lòng chọn hoặc nhập lý do hủy/xóa ca trực!'
      );
      return;
    }
    if (selectedShiftForDelete) {
      onDeleteShift?.(selectedShiftForDelete.id, cancelReason.trim(), isPermanentDelete);

      const cellKey = `${selectedShiftForDelete.shiftType}-${selectedShiftForDelete.date}`;
      setAssignedCells((prev) => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });

      // Chỉ ghi nhận vào deletedSlotsHistory nếu THỰC SỰ LÀ XÓA CA KHỎI LỊCH (ở Tab 2)
      if (deleteActionContext === 'delete_shift') {
        setDeletedSlotsHistory((prev) => ({
          ...prev,
          [cellKey]: {
            shiftName: selectedShiftForDelete.shiftName,
            employeeName: selectedShiftForDelete.employeeName,
            reason: cancelReason.trim(),
          },
        }));
      }

      const empName = selectedShiftForDelete.employeeName;
      const sName = selectedShiftForDelete.shiftName;
      setSelectedShiftForDelete(null);
      setCancelReason('');
      setDeleteError(null);

      if (deleteActionContext === 'unassign_employee') {
        setSuccessToast(`Đã gỡ nhân viên ${empName} khỏi ca trực! Khung ca hiện đang trống.`);
      } else if (deleteActionContext === 'delete_shift') {
        setSuccessToast(`Đã xóa ca trực ${sName} khỏi lịch vận hành thành công!`);
      } else {
        setSuccessToast(`Đã hủy ca trực ${sName} thành công!`);
      }

      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  // Admin: Open Add Task Modal for a shift (Giao việc cho ca trực)
  const handleOpenAddTaskModal = (
    shiftType: string,
    date: string,
    existingShift?: ShiftRegistration
  ) => {
    const shiftMeta = standardShifts.find((s) => s.type === shiftType);
    setTaskModalData({
      shiftType,
      shiftName: shiftMeta?.name || shiftType,
      timeRange: shiftMeta?.time || '05:00 - 11:00',
      date,
      shift: existingShift,
    });
    setTaskTitle('');
    setTaskArea(existingShift?.courtArea || 'Toàn bộ 8 sân');
    setTaskPriority('normal');
    setTaskError(null);
  };

  // Admin: Confirm Add Task to shift
  const handleConfirmAddTask = () => {
    if (!taskTitle.trim()) {
      setTaskError('Vui lòng nhập nội dung công việc cần giao!');
      return;
    }
    if (!taskModalData) return;

    const taskText = taskTitle.trim();
    if (taskModalData.shift) {
      const updatedShift: ShiftRegistration = {
        ...taskModalData.shift,
        courtArea: taskArea !== 'Toàn bộ 8 sân' ? taskArea : taskModalData.shift.courtArea,
        taskDescription: taskModalData.shift.taskDescription
          ? `${taskModalData.shift.taskDescription}; ${taskText}`
          : taskText,
        tasks: [...(taskModalData.shift.tasks || []), taskText],
      };
      if (onUpdateShift) {
        onUpdateShift(updatedShift);
      } else {
        onAddShift?.(updatedShift);
      }
      setLocalAssignedTasks((prev) => ({
        ...prev,
        [taskModalData.shift!.id]: [
          ...(prev[taskModalData.shift!.id] || taskModalData.shift!.tasks || []),
          taskText,
        ],
      }));
    } else {
      const shiftDateObj = new Date(taskModalData.date);
      const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      const dayOfWeek = dayNames[shiftDateObj.getDay()] || 'Ngày trực';

      const newShiftWithTask: ShiftRegistration = {
        id: `SH-${Date.now().toString().slice(-5)}`,
        employeeId: 'PENDING',
        employeeName: 'Chờ NV nhận ca',
        date: taskModalData.date,
        dayOfWeek,
        shiftType: taskModalData.shiftType,
        shiftName: taskModalData.shiftName,
        timeRange: taskModalData.timeRange,
        status: 'scheduled',
        courtArea: taskArea,
        taskDescription: taskText,
        tasks: [taskText],
      };
      onAddShift?.(newShiftWithTask);
    }

    setSuccessToast(`Đã thêm công việc cho ${taskModalData.shiftName} ngày ${taskModalData.date}!`);
    setTimeout(() => setSuccessToast(null), 3500);
    setTaskModalData(null);
    setTaskTitle('');
    setTaskError(null);
  };

  // Submit UC-10: Export Excel file
  const handleDownloadExcel = () => {
    const headers = ['Mã Ca', 'Nhân Viên', 'Ngày Trực', 'Ca Trực', 'Khung Giờ', 'Trạng Thái'];
    const rows = effectiveShifts.map((s) => [
      s.id,
      s.employeeName,
      s.date,
      s.shiftType,
      s.timeRange,
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

  // Employee Quick Register Modal State
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
      timeRange: shiftMeta?.time || '05:00 - 11:00',
      date,
    });
  };

  const handleConfirmRegister = () => {
    if (!registerModalData) return;
    const { shiftType, shiftName, timeRange, date } = registerModalData;
    setAssignedCells((prev) => ({ ...prev, [`${shiftType}-${date}`]: true }));
    onAddShift?.({
      id: `SH-${Date.now().toString().slice(-4)}`,
      employeeId: 'NV01',
      employeeName: 'Nguyễn Văn An',
      date,
      dayOfWeek: 'Ngày trực',
      shiftType,
      shiftName,
      timeRange,
      status: 'scheduled',
      courtArea: 'Cụm Sân 01 - 04',
      taskDescription: 'Nhân viên tự đăng ký ca trực tuần',
    });
    setRegisterModalData(null);
    setSuccessToast(`Đã đăng ký ${shiftName} ngày ${date} thành công!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };



  if (showExportModal) {
    return (
      <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
        {/* Top Navigation Bar */}
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

        {/* XLSX Banner Card */}
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
                Lịch Trực Tuần (15/10 – 21/10/2026)
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              100% Khớp ca
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              {activeWeekShifts.length} ca đã gán quân số
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 border border-teal-200">
              <RefreshCw className="w-3 h-3 text-teal-600" />
              Khung giờ mở cửa: 05:00 - 23:00
            </span>
          </div>
        </div>

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
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* 🟢 Top Badge & System Indicator */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {isAdmin ? 'BAN QUẢN LÝ: THEO DÕI & ĐIỀU PHỐI LỊCH TRỰC' : 'NHÂN VIÊN: CA TRỰC CỦA TÔI'}
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hôm nay: T6, 16/10/2026</span>
        </div>
      </div>

      {/* 🟢 Title & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            LỊCH TRỰC TUẦN{' '}
            {isAdmin ? (
              <span className="text-emerald-600">NHÂN VIÊN</span>
            ) : (
              <span className="text-emerald-600">& ĐĂNG KÝ CA</span>
            )}
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            {isAdmin
              ? 'Theo dõi lịch trực nhân sự và giao nhiệm vụ công việc cho từng ca trực nhà thi đấu CourtX.'
              : 'Xem lịch trực cá nhân, kiểm tra nhiệm vụ ca và đăng ký các ca làm việc còn trống.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              {/* Nút Thêm ca trực / Thêm công việc ca trực cho Admin */}
              <button
                type="button"
                onClick={() => {
                  if (adminViewMode === 'list') {
                    handleOpenCreateShiftModal(undefined, '2026-10-16');
                  } else {
                    handleOpenAddTaskModal('Ca 1', '2026-10-16');
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-black text-white shadow-md shadow-emerald-600/20 active:scale-95 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>{adminViewMode === 'list' ? 'Thêm ca trực' : 'Thêm công việc ca'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Xuất Excel</span>
              </button>
            </>
          )}

          {!isAdmin && (
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewFilter === 'all'
                    ? 'bg-white text-emerald-700 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ca trực
              </button>
              <button
                type="button"
                onClick={() => setViewFilter('my')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  viewFilter === 'my'
                    ? 'bg-emerald-600 text-white shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ca của tôi ({myShiftsInWeek.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🟢 STATS CARDS (Hiển thị rõ ràng, không bị cắt xén chữ hay tràn viền) */}
      {isAdmin ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full">
          {/* Card 1: Tổng ca tuần */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-[13px] font-bold text-slate-600 leading-tight">
                Tổng ca tuần
              </span>
              <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">21</span>
              <span className="text-xs font-bold text-slate-400">ca</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-1 leading-tight">
              3 ca/ngày × 7 ngày
            </div>
          </div>

          {/* Card 2: Đã phân công */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 text-emerald-800">
              <span className="text-xs sm:text-[13px] font-bold leading-tight">
                Đã phân công
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 leading-none">
                {activeWeekShifts.length}
              </span>
              <span className="text-xs font-bold text-emerald-600/80">ca</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1 leading-tight">
              Đạt {Math.round((activeWeekShifts.length / 21) * 100)}% lịch tuần
            </div>
          </div>

          {/* Card 3: Ca còn trống */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 text-rose-800">
              <span className="text-xs sm:text-[13px] font-bold leading-tight">
                Ca còn trống
              </span>
              <div className="w-7 h-7 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-rose-700 leading-none">
                {Math.max(0, 21 - activeWeekShifts.length)}
              </span>
              <span className="text-xs font-bold text-rose-600/80">ca</span>
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1 leading-tight">
              Chờ xếp lịch trực
            </div>
          </div>

          {/* Card 4: Nhân sự trực */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 text-blue-800">
              <span className="text-xs sm:text-[13px] font-bold leading-tight">
                Nhân sự trực
              </span>
              <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-700">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-blue-800 leading-none">
                {activeStaffIds.size}
              </span>
              <span className="text-xs font-bold text-blue-600/80">người</span>
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-1 leading-tight">
              {employees.length} tổng nhân sự
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 w-full">
          {/* Card 1: Ca đã đăng ký */}
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 text-emerald-800">
              <span className="text-xs sm:text-[13px] font-bold leading-tight">
                Ca đăng ký
              </span>
              <div className="w-7 h-7 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                <CalendarCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-emerald-800 leading-none">
                {myShiftsInWeek.length}
              </span>
              <span className="text-xs font-bold text-emerald-600/80">ca</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1 leading-tight">
              Đã xác nhận vào lịch
            </div>
          </div>

          {/* Card 2: Tổng giờ làm */}
          <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 text-blue-800">
              <span className="text-xs sm:text-[13px] font-bold leading-tight">
                Tổng giờ làm
              </span>
              <div className="w-7 h-7 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-700">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-blue-800 leading-none">
                {totalMyHoursInWeek}
              </span>
              <span className="text-xs font-bold text-blue-600/80">giờ</span>
            </div>
            <div className="text-[11px] text-blue-700 font-medium mt-1 leading-tight">
              Tuần 15 – 21/10
            </div>
          </div>

          {/* Card 3: Chuyên cần */}
          <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 text-purple-800">
              <span className="text-xs sm:text-[13px] font-bold leading-tight">
                Chuyên cần
              </span>
              <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 text-purple-700">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-purple-800 leading-none">
                100%
              </span>
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-1 leading-tight">
              Đúng giờ
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Navigation Bar (Week Selector + Mode Tabs) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition cursor-pointer"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-1.5 px-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Tuần từ {weekDays[0].label} – {weekDays[6].label}/2026
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextWeek}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition cursor-pointer"
            title="Tuần sau"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={handleResetToCurrentWeek}
            className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer ml-1"
          >
            Tuần này
          </button>
        </div>

        {/* Admin Matrix vs List mode toggle */}
        {isAdmin && (
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAdminViewMode('matrix')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                adminViewMode === 'matrix'
                  ? 'bg-white text-emerald-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ma trận tuần
            </button>
            <button
              type="button"
              onClick={() => setAdminViewMode('list')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                adminViewMode === 'list'
                  ? 'bg-white text-emerald-700 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Lịch ca trực ({activeWeekShifts.length})</span>
            </button>
          </div>
        )}

        {/* Action buttons for admin */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 flex-wrap sm:ml-auto">
            <button
              type="button"
              onClick={() => {
                setEditingShifts(standardShifts);
                setStructureStartDate(weekDays[0]?.date || '2026-10-15');
                setStructureEndDate(weekDays[6]?.date || '2026-10-21');
                setStructureDaysOfWeek(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
                setStructureShiftTypes(standardShifts.map((s) => s.type));
                setBulkTab('structure');
                setShowBulkModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-2xs active:scale-95 transition cursor-pointer"
              title="Thay đổi cơ cấu khung ca của sân"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Đổi cơ cấu ca</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBulkTab('delete');
                setBulkDeleteStartDate(weekDays[0].date);
                setBulkDeleteEndDate(weekDays[6].date);
                setShowBulkModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-black border border-rose-200 shadow-2xs active:scale-95 transition cursor-pointer"
              title="Xóa ca hàng loạt theo khoảng ngày"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ca hàng loạt</span>
            </button>
          </div>
        )}

        {/* Filter chips for shifts */}
        <div className="flex items-center gap-1">
          {['ALL', ...standardShifts.map(s => s.type)].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setShiftTypeFilter(type)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                shiftTypeFilter === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type === 'ALL' ? 'Tất cả ca' : type}
            </button>
          ))}
        </div>
      </div>

      {/* 🟢 VIEW 1: BẢNG MA TRẬN PHÂN CA TUẦN */}
      {(!isAdmin || adminViewMode === 'matrix') && (
        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm overflow-x-auto relative">
          <table className="w-full table-fixed min-w-[880px] text-left border-collapse">
            <colgroup>
              <col className="w-32 md:w-36" />
              {weekDays.map((d) => (
                <col key={d.date} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 z-20 w-32 md:w-36 p-1.5 border-b border-r border-slate-200 bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] align-middle text-center">
                  KHUNG CA
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.date}
                    className={`p-1.5 border-b border-r border-slate-200 text-center transition ${
                      day.isToday ? 'bg-emerald-50/80 border-b-2 border-b-emerald-500' : 'bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={`text-xs font-black ${
                          day.isToday ? 'text-emerald-700 font-extrabold' : 'text-slate-800'
                        }`}
                      >
                        {day.day}
                      </span>
                      {day.isToday && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </div>
                    <div
                      className={`text-[9.5px] mt-0.5 font-bold ${
                        day.isToday ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {day.label}
                      {day.isToday && ' (Hôm nay)'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standardShifts
                .filter((s) => shiftTypeFilter === 'ALL' || s.type === shiftTypeFilter)
                .map((shiftRow) => (
                  <tr key={shiftRow.type} className="hover:bg-slate-50/30 transition">
                    {/* Sticky Left Column: Shift Info */}
                    <td className="sticky left-0 z-10 w-32 md:w-36 p-2 border-b border-r border-slate-200 align-middle bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex flex-col items-center text-center gap-1">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${shiftRow.color}`}
                        >
                          <shiftRow.icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 w-full px-0.5">
                          <div className={`text-xs font-black leading-tight truncate ${shiftRow.accentColor}`}>
                            {shiftRow.name.split(':')[0]}
                          </div>
                          <div className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5 whitespace-normal">
                            {shiftRow.name.split(':')[1]?.trim() || ''}
                          </div>
                          <div className="text-[8.5px] text-slate-500 font-semibold mt-1 leading-tight flex items-center justify-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{shiftRow.time}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 7 Days Columns */}
                    {weekDays.map((day) => {
                      const allCellShifts = effectiveShifts.filter(
                        (s) =>
                          s.date === day.date &&
                          s.shiftType === shiftRow.type &&
                          s.status !== 'cancelled'
                      );

                      const isNewlyAssigned = assignedCells[`${shiftRow.type}-${day.date}`];
                      const myShiftInCell = allCellShifts.find(
                        (s) => s.employeeName === 'Nguyễn Văn An' || s.employeeId === 'NV01'
                      );
                      const isMyShift = !isAdmin && (!!myShiftInCell || isNewlyAssigned);

                      // Filter view if employee chose "Chỉ ca của tôi"
                      const displayShifts =
                        !isAdmin && viewFilter === 'my'
                          ? allCellShifts.filter(
                              (s) => s.employeeName === 'Nguyễn Văn An' || s.employeeId === 'NV01'
                            )
                          : allCellShifts;

                      const dayDate = new Date(day.date);
                      const today = new Date('2026-10-16');
                      today.setHours(0, 0, 0, 0);
                      const isPast = dayDate < today;

                      return (
                        <td
                          key={`${shiftRow.type}-${day.date}`}
                          className={`p-1 sm:p-1.5 border-b border-r border-slate-200 align-middle min-h-[85px] h-24 overflow-hidden ${
                            day.isToday ? 'bg-emerald-50/20' : 'bg-white'
                          }`}
                        >
                          {/* Case 1: My Shift for Employee */}
                          {isMyShift ? (
                            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md p-1.5 flex flex-col justify-between text-center relative overflow-hidden min-h-[75px] min-w-0">
                              <div className="flex flex-col items-center min-w-0">
                                <span className="text-[10px] font-black text-white flex items-center gap-1 drop-shadow-sm truncate">
                                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                                  Ca của tôi
                                </span>
                                <span className="text-[8.5px] font-bold text-white bg-emerald-700/70 px-1.5 py-0.5 rounded-full mt-0.5 truncate">
                                  {myShiftInCell?.status === 'in_progress'
                                    ? 'Đang trực'
                                    : myShiftInCell?.status === 'completed'
                                    ? 'Đã xong'
                                    : 'Đã xác nhận'}
                                </span>
                                {myShiftInCell?.courtArea && (
                                  <span className="text-[8.5px] text-emerald-100 font-medium truncate max-w-full mt-0.5">
                                    {myShiftInCell.courtArea}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedShiftForDelete(
                                    myShiftInCell || {
                                      id: `SH-${shiftRow.type}-${day.date}`,
                                      employeeId: 'NV01',
                                      employeeName: 'Nguyễn Văn An',
                                      date: day.date,
                                      dayOfWeek: 'Ngày trực',
                                      shiftType: shiftRow.type,
                                      shiftName: shiftRow.name,
                                      timeRange: shiftRow.time,
                                      status: 'scheduled',
                                    }
                                  );
                                  setDeleteActionContext('cancel_shift');
                                  setIsPermanentDelete(false);
                                  setCancelReason('');
                                  setDeleteError(null);
                                }}
                                className="mt-1 inline-flex items-center justify-center gap-0.5 rounded-lg bg-white/20 hover:bg-rose-600 hover:text-white px-1.5 py-0.5 text-[9px] font-bold text-white transition active:scale-95 cursor-pointer shadow-2xs"
                                title="Hủy ca trực này"
                              >
                                <X className="w-2.5 h-2.5" />
                                <span>Hủy ca</span>
                              </button>
                            </div>
                          ) : displayShifts.length > 0 ? (
                            /* Case 2: Assigned Shift(s) in cell */
                            <div className="flex flex-col gap-1 w-full h-full justify-center min-w-0 overflow-hidden">
                              {displayShifts.map((s) => (
                                <div
                                  key={s.id}
                                  className="group relative flex flex-col gap-1 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-xl p-1.5 shadow-2xs transition min-w-0 overflow-hidden"
                                >
                                  {/* Staff info row */}
                                  <div className="flex items-center justify-between gap-1 min-w-0">
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[9px] font-black shrink-0">
                                        {s.employeeName.charAt(0)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10.5px] font-bold text-slate-800 truncate leading-tight" title={s.employeeName}>
                                          {s.employeeName}
                                        </p>
                                        {s.courtArea && (
                                          <p className="text-[8.5px] text-slate-400 font-medium truncate leading-tight" title={s.courtArea}>
                                            {s.courtArea}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Admin Action: Xóa nhân viên khỏi ca trực (Hủy phân công) */}
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedShiftForDelete(s);
                                          setDeleteActionContext('unassign_employee');
                                          setIsPermanentDelete(true);
                                          setCancelReason('');
                                          setDeleteError(null);
                                        }}
                                        className="h-5 w-5 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 flex items-center justify-center transition cursor-pointer shrink-0"
                                        title={`Gỡ nhân viên ${s.employeeName} khỏi ca trực`}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>

                                  {/* Hiển thị các công việc đã giao cho ca này (nếu có) */}
                                  {(s.taskDescription || (s.tasks && s.tasks.length > 0) || (localAssignedTasks[s.id] && localAssignedTasks[s.id].length > 0)) && (
                                    <div className="mt-0.5 pt-0.5 border-t border-slate-200/60 space-y-0.5 min-w-0 overflow-hidden">
                                      {((localAssignedTasks[s.id] || s.tasks || [s.taskDescription]).filter(Boolean) as string[]).slice(0, 2).map((taskItem, tIdx) => (
                                        <div
                                          key={tIdx}
                                          className="flex items-center gap-1 text-[8.5px] text-slate-700 bg-emerald-50/90 border border-emerald-200/70 rounded px-1 py-0.5 font-medium min-w-0 overflow-hidden"
                                          title={taskItem}
                                        >
                                          <CheckSquare className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                          <span className="truncate flex-1 min-w-0">{taskItem}</span>
                                        </div>
                                      ))}
                                      {((localAssignedTasks[s.id] || s.tasks || [s.taskDescription]).filter(Boolean) as string[]).length > 2 && (
                                        <span className="text-[8px] text-slate-500 font-bold pl-0.5 block truncate">
                                          +{((localAssignedTasks[s.id] || s.tasks || [s.taskDescription]).filter(Boolean) as string[]).length - 2} việc khác
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Admin Nút Dấu Cộng: Thêm công việc cho ca đó */}
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddTaskModal(shiftRow.type, day.date, s)}
                                      className="w-full mt-0.5 py-0.5 text-[9px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50/90 hover:bg-emerald-100 rounded-md border border-dashed border-emerald-300 transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                      title="Thêm công việc cho ca trực này"
                                    >
                                      <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                                      <span>Thêm việc</span>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                        ) : isAdmin ? (
                          /* Case 3: Empty or Deleted slot for Admin (Never show 'Đã qua' for Admin) */
                          (() => {
                            const cellKey = `${shiftRow.type}-${day.date}`;
                            const isDeletedSlot = !!deletedSlotsHistory[cellKey];

                            if (isDeletedSlot) {
                              return (
                                <div className="w-full h-full flex flex-col items-center justify-center p-1 rounded-xl border border-dashed border-rose-300 bg-rose-50/70 text-center gap-0.5 animate-in fade-in duration-200 min-w-0 overflow-hidden">
                                  <div className="flex items-center justify-center gap-0.5 text-[9px] font-black text-rose-700 leading-tight">
                                    <Trash2 className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                                    <span className="truncate">ĐÃ XÓA CA</span>
                                  </div>
                                  <span className="text-[8.5px] text-slate-500 font-medium truncate">
                                    Khung ca trống
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCreateShiftModal(shiftRow.type, day.date)}
                                    className="mt-0.5 py-0.5 px-2 bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 font-black text-[8.5px] rounded-lg border border-emerald-300 shadow-2xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                                    title="Thêm lại ca trực cho khung giờ này"
                                  >
                                    <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                                    <span>Thêm lại ca</span>
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div className="w-full h-full flex flex-col items-center justify-center min-h-[65px] p-1.5 rounded-xl border border-dashed border-slate-300/80 bg-slate-50/50 hover:bg-emerald-50/40 hover:border-emerald-300 transition group text-center gap-1.5 min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700 truncate">
                                  Trống ca
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenCreateShiftModal(shiftRow.type, day.date)}
                                  className="w-full py-1 px-1.5 bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 font-bold text-[9px] rounded-lg border border-emerald-300 shadow-2xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 truncate"
                                  title="Phân công nhân viên cho ca trực này"
                                >
                                  <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                                  <span>Phân công</span>
                                </button>
                              </div>
                            );
                          })()
                        ) : isPast ? (
                          /* Case 4: Past day for Employee */
                          <div className="w-full h-full flex flex-col items-center justify-center min-h-[70px] opacity-40">
                            <div className="w-5 h-1 rounded bg-slate-200 mb-1.5" />
                            <span className="text-[11px] text-slate-400 font-bold">Đã qua</span>
                          </div>
                        ) : (
                          /* Case 5: Empty slot for Employee */
                          <div className="w-full h-full flex flex-col items-center justify-center min-h-[70px] p-1">
                            <button
                              type="button"
                              onClick={() => handleOpenRegisterModal(shiftRow.type, day.date)}
                              className="w-full py-3 px-1.5 bg-white text-emerald-600 font-bold text-[11px] rounded-xl border border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white hover:shadow-md transition-all flex flex-col items-center justify-center gap-1 group cursor-pointer"
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
      )}

      {/* 🟢 VIEW 2: LỊCH BIỂU CHI TIẾT THEO NGÀY (LỊCH TRỰC QUAN THAY CHO BẢNG CŨ) */}
      {isAdmin && adminViewMode === 'list' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
          {/* Top Title & Search & Quick Date Picker & Bulk Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Lịch trực & Giao việc
                </h2>
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {viewDaysSpan === 7 ? 'Tuần (7 ngày)' : '2 tuần (14 ngày)'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  {standardShifts.length} khung ca
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Xem lịch trực quan theo ngày, thêm công việc và quản lý ca trực đã tạo
              </p>
            </div>

            {/* Right: Actions + Quick Date Picker + Search Box */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {isAdmin && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkTab('delete');
                      setBulkDeleteStartDate(displayDays[0].date);
                      setBulkDeleteEndDate(displayDays[displayDays.length - 1].date);
                      setShowBulkModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold active:scale-95 transition cursor-pointer"
                    title="Xoá ca trực hàng loạt trong khoảng thời gian đã chọn"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Xoá ca hàng loạt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingShifts(standardShifts);
                      setStructureStartDate(displayDays[0]?.date || '2026-10-15');
                      setStructureEndDate(displayDays[displayDays.length - 1]?.date || '2026-10-21');
                      setStructureDaysOfWeek(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
                      setStructureShiftTypes(standardShifts.map((s) => s.type));
                      setBulkTab('structure');
                      setShowBulkModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-sm active:scale-95 transition cursor-pointer"
                    title="Thay đổi cơ cấu khung ca của sân (số lượng ca, giờ bắt đầu/kết thúc)"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Đổi cơ cấu ca</span>
                  </button>
                </div>
              )}

              {/* Direct HTML5 Date Picker */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs hover:border-emerald-400 transition">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Chọn ngày:</span>
                <input
                  type="date"
                  value={calendarSelectedDate === 'ALL' ? '' : calendarSelectedDate}
                  onChange={(e) => {
                    if (e.target.value) {
                      const pickedDateStr = e.target.value;
                      setCalendarSelectedDate(pickedDateStr);
                      const picked = new Date(pickedDateStr);
                      setCurrentWeekStart(picked);
                    }
                  }}
                  className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
                />
              </div>

              {/* Search Box */}
              <div className="relative min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên, ca..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* 🟢 Quick Bulk Actions Bar (Cơ cấu ca & Xóa ca hàng loạt) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 pb-1">
              <span className="text-[10.5px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>Thao tác nhanh:</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setEditingShifts(standardShifts);
                  setStructureStartDate(displayDays[0]?.date || '2026-10-15');
                  setStructureEndDate(displayDays[displayDays.length - 1]?.date || '2026-10-21');
                  setStructureDaysOfWeek(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
                  setStructureShiftTypes(standardShifts.map((s) => s.type));
                  setBulkTab('structure');
                  setShowBulkModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-2xs transition cursor-pointer active:scale-95"
                title="Cấu hình cơ cấu ca trực (số ca, khung giờ, hệ số lương)"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>⚙️ Cấu hình cơ cấu ca</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkTab('delete');
                  setBulkDeleteStartDate(displayDays[0].date);
                  setBulkDeleteEndDate(displayDays[displayDays.length - 1].date);
                  setShowBulkModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition cursor-pointer active:scale-95"
                title="Xóa nhanh các ca trực trong kỳ này"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa ca hàng loạt</span>
              </button>
            </div>
          )}

          {/* 🟢 Thanh điều hướng tuần & Chế độ xem ngày (7 ngày / 14 ngày) */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            {/* Week navigation buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(currentWeekStart);
                  d.setDate(d.getDate() - viewDaysSpan);
                  setCurrentWeekStart(d);
                }}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title={viewDaysSpan === 7 ? 'Tuần trước' : 'Kỳ trước'}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>

              <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {displayDays[0].label} – {displayDays[displayDays.length - 1].label}/{displayDays[0].year}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const d = new Date(currentWeekStart);
                  d.setDate(d.getDate() + viewDaysSpan);
                  setCurrentWeekStart(d);
                }}
                className="h-8 w-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 cursor-pointer"
                title={viewDaysSpan === 7 ? 'Tuần sau' : 'Kỳ sau'}
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentWeekStart(new Date('2026-10-15'));
                  setCalendarSelectedDate('2026-10-16');
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer active:scale-95 ml-0.5"
              >
                Hôm nay
              </button>
            </div>

            {/* View options: Span toggle (7 ngày / 14 ngày) & Xem tất cả */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setViewDaysSpan(7)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    viewDaysSpan === 7
                      ? 'bg-white text-emerald-700 font-black shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setViewDaysSpan(14)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    viewDaysSpan === 14
                      ? 'bg-white text-emerald-700 font-black shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  14 ngày (2 tuần)
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCalendarSelectedDate('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  calendarSelectedDate === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs font-black'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Xem tất cả ({viewDaysSpan} ngày)
              </button>
            </div>
          </div>

          {/* 🟢 Khung chọn ngày dạng LỊCH TUẦN 7 CỘT (Tất cả ngày luôn hiển thị đồng đều 100%, không bị cắt ngang) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {displayDays.map((day) => {
              const dayShiftsCount = effectiveShifts.filter(
                (s) => s.date === day.date && s.status !== 'cancelled'
              ).length;
              const isSelected = calendarSelectedDate === day.date;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setCalendarSelectedDate(day.date)}
                  className={`relative p-2 sm:p-2.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all cursor-pointer group border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30 scale-[1.02] ring-2 ring-emerald-400/40'
                      : day.isToday
                      ? 'bg-emerald-50/70 text-slate-800 border-emerald-300 hover:bg-emerald-100/70 hover:border-emerald-400'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {/* Day of Week */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                      isSelected
                        ? 'text-emerald-100'
                        : day.isToday
                        ? 'text-emerald-700 font-extrabold'
                        : 'text-slate-500'
                    }`}
                  >
                    {day.day}
                  </span>

                  {/* Date Number */}
                  <div className="my-0.5 flex items-baseline gap-0.5">
                    <span
                      className={`text-sm sm:text-base font-black ${
                        isSelected
                          ? 'text-white'
                          : day.isToday
                          ? 'text-emerald-950 font-black'
                          : 'text-slate-800'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    <span
                      className={`text-[9px] font-bold ${
                        isSelected ? 'text-emerald-200' : 'text-slate-400'
                      }`}
                    >
                      /{day.monthNum}
                    </span>
                  </div>

                  {/* Shift count or Today badge */}
                  <div className="w-full mt-0.5">
                    {day.isToday && !isSelected ? (
                      <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Hôm nay
                      </span>
                    ) : (
                      <span
                        className={`inline-block text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : dayShiftsCount > 0
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}
                      >
                        {dayShiftsCount}/{standardShifts.length} ca
                      </span>
                    )}
                  </div>

                  {/* Top-right Today pulse indicator */}
                  {day.isToday && (
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 🟢 Danh sách các ngày theo định dạng LỊCH TRỰC QUAN */}
          <div className="space-y-4">
            {(calendarSelectedDate === 'ALL'
              ? displayDays
              : displayDays.filter((d) => d.date === calendarSelectedDate).length > 0
              ? displayDays.filter((d) => d.date === calendarSelectedDate)
              : [
                  {
                    date: calendarSelectedDate,
                    day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][new Date(calendarSelectedDate).getDay()] || 'Ngày',
                    label: `${calendarSelectedDate.split('-')[2]}/${calendarSelectedDate.split('-')[1]}`,
                    dayNum: calendarSelectedDate.split('-')[2],
                    monthNum: calendarSelectedDate.split('-')[1],
                    year: parseInt(calendarSelectedDate.split('-')[0]),
                    isToday: calendarSelectedDate === '2026-10-16',
                  },
                ]
            ).map((day) => {
              // Lấy các khung ca của ngày
              const dayShifts = standardShifts
                .filter((st) => shiftTypeFilter === 'ALL' || st.type === shiftTypeFilter)
                .map((st) => {
                  const assignedShift = effectiveShifts.find(
                    (s) => s.date === day.date && s.shiftType === st.type && s.status !== 'cancelled'
                  );
                  return {
                    meta: st,
                    shift: assignedShift,
                  };
                });

              // Lọc theo từ khóa tìm kiếm nếu có
              const visibleShifts = dayShifts.filter(({ shift, meta }) => {
                if (!listSearchQuery.trim()) return true;
                const q = listSearchQuery.toLowerCase();
                return (
                  meta.name.toLowerCase().includes(q) ||
                  (shift &&
                    (shift.employeeName.toLowerCase().includes(q) ||
                      (shift.courtArea && shift.courtArea.toLowerCase().includes(q)) ||
                      (shift.taskDescription && shift.taskDescription.toLowerCase().includes(q))))
                );
              });

              if (visibleShifts.length === 0 && listSearchQuery.trim()) {
                return null;
              }

              return (
                <div
                  key={day.date}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4 space-y-3"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          day.isToday
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white text-slate-800 border border-slate-200'
                        }`}
                      >
                        {day.day}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black text-slate-900">
                            {day.day === 'CN' ? 'Chủ Nhật' : `Thứ ${day.day.replace('T', '')}`},{' '}
                            {day.date.split('-').reverse().join('/')}
                          </span>
                          {day.isToday && (
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              Hôm nay
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Khung giờ vận hành: {standardShifts[0]?.time.split('-')[0]?.trim() || '05:00'} - {standardShifts[standardShifts.length - 1]?.time.split('-')[1]?.trim() || '23:00'} ({standardShifts.length} ca tiêu chuẩn)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCreateShiftModal(undefined, day.date)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition active:scale-95 cursor-pointer shadow-sm shadow-emerald-600/20"
                      title={`Thêm ca trực mới cho ngày ${day.date.split('-').reverse().join('/')}`}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Thêm ca trực</span>
                    </button>
                  </div>

                  {/* Shifts Cards in a Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {visibleShifts.map(({ meta, shift }) => {
                      const hasShift = !!shift;
                      const cellKey = `${meta.type}-${day.date}`;
                      const isDeletedSlotInTab2 =
                        !hasShift && !!deletedSlotsHistory[cellKey];

                      const allTasks = [
                        ...(shift?.tasks || []),
                        ...(localAssignedTasks[shift?.id || ''] || []),
                        shift?.taskDescription,
                      ].filter(Boolean) as string[];

                      return (
                        <div
                          key={meta.type}
                          className={`rounded-2xl border p-3 flex flex-col justify-between transition-all ${
                            hasShift
                              ? 'bg-white border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-sm'
                              : isDeletedSlotInTab2
                              ? 'bg-rose-50/30 border-dashed border-rose-300'
                              : 'bg-white/60 border-dashed border-slate-300/80'
                          }`}
                        >
                          {/* Card Top: Shift Type & Time */}
                          <div>
                            <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                              <div className="flex items-center gap-2 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${meta.color}`}
                                >
                                  <meta.icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-slate-900 leading-tight truncate">
                                    {meta.name}
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{meta.time} ({meta.hours || 6}h)</span>
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                                  hasShift
                                    ? shift.status === 'in_progress'
                                      ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                                      : shift.status === 'completed'
                                      ? 'bg-slate-100 text-slate-700'
                                      : 'bg-blue-100 text-blue-800'
                                    : isDeletedSlotInTab2
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                                }`}
                              >
                                {hasShift
                                  ? shift.status === 'in_progress'
                                    ? 'Đang trực'
                                    : shift.status === 'completed'
                                    ? 'Đã xong'
                                    : 'Đã nhận ca'
                                  : isDeletedSlotInTab2
                                  ? 'Đã xóa ca'
                                  : 'Chưa có ca'}
                              </span>
                            </div>

                            {/* Card Body: Staff & Tasks */}
                            <div className="py-2.5 space-y-2">
                              {hasShift ? (
                                <>
                                  {/* Nhân viên trực */}
                                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[10px] shrink-0">
                                        {shift.employeeName.charAt(0)}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-900 truncate">
                                          {shift.employeeName}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 truncate">
                                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                          <span className="truncate">
                                            {shift.courtArea || 'Toàn bộ 8 sân'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200/80">
                                      {shift.id}
                                    </span>
                                  </div>

                                  {/* Danh sách nhiệm vụ công việc */}
                                  {allTasks.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                                        Nhiệm vụ ca ({allTasks.length})
                                      </span>
                                      <div className="space-y-1">
                                        {allTasks.map((t, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-start gap-1.5 p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-xs text-slate-800 font-medium"
                                          >
                                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                            <span className="text-[11px] leading-snug">{t}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : isDeletedSlotInTab2 ? (
                                <div className="p-3.5 rounded-xl bg-rose-50/60 border border-dashed border-rose-300 text-center space-y-1">
                                  <div className="text-xs font-black text-rose-700 flex items-center justify-center gap-1">
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                    <span>Ca trực đã xóa khỏi lịch</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-medium block">
                                    Khung giờ đang trống, có thể bấm nút bên dưới để thêm lại
                                  </span>
                                </div>
                              ) : (
                                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-dashed border-slate-300/80 text-center space-y-1">
                                  <span className="text-xs font-bold text-slate-500 block">
                                    Chưa kích hoạt ca này
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium block">
                                    Khung giờ trống chưa có ca trực trên lịch
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Bottom: Chỉ THÊM CA hoặc XÓA CA KHỎI LỊCH */}
                          <div className="pt-2 border-t border-slate-100">
                            {hasShift ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedShiftForDelete(shift);
                                  setDeleteActionContext('delete_shift');
                                  setIsPermanentDelete(true);
                                  setCancelReason('Chủ sân xóa ca khỏi lịch');
                                  setDeleteError(null);
                                }}
                                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white active:scale-95 text-rose-600 font-bold text-xs border border-rose-200 transition cursor-pointer shadow-2xs"
                                title={`Xóa ca trực ${shift.shiftName} (${shift.employeeName}) khỏi lịch`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Xóa ca khỏi lịch</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenCreateShiftModal(meta.type, day.date)}
                                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-sm shadow-emerald-600/20 transition cursor-pointer"
                                title={`Thêm ca trực ${meta.name} cho ngày ${day.date.split('-').reverse().join('/')}`}
                              >
                                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>{isDeletedSlotInTab2 ? '+ Thêm lại ca trực này' : '+ Thêm ca trực này'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🟢 KHU VỰC THÊM: CA TRỰC HÔM NAY & NHIỆM VỤ (DÀNH CHO NHÂN VIÊN) */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card Ca trực hôm nay */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Flame className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight">
                    Ca trực hôm nay của bạn
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Thứ 6, 16/10/2026</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                ĐANG DIỄN RA
              </span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 space-y-2.5 text-xs border border-slate-100">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 shrink-0">Khung ca:</span>
                <span className="font-black text-slate-900 text-right">Ca 2: Chiều & Giải đấu</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 shrink-0">Giờ trực:</span>
                <span className="font-bold text-emerald-700 text-right flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  11:00 – 17:00 (6h)
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 shrink-0">Khu vực:</span>
                <span className="font-bold text-slate-800 text-right flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  Sân 01 - 04 & Kho thiết bị
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500 shrink-0">Đồng nghiệp:</span>
                <span className="font-bold text-slate-800 text-right">Trần Thị Bình (NV-02)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="flex-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-center">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  ✓ Đã Check-in: 10:55 (Đúng giờ)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSuccessToast('Đã lưu báo cáo & bàn giao ca trực thành công!');
                  setTimeout(() => setSuccessToast(null), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs active:scale-95 transition cursor-pointer text-center shrink-0"
              >
                Báo cáo ca
              </button>
            </div>
          </div>

          {/* Checklist nhiệm vụ ca trực */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 shrink-0">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight truncate">
                    Checklist nhiệm vụ ca
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    Tiêu chuẩn vận hành CourtX
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg shrink-0">
                {Object.values(taskChecklist).filter(Boolean).length}/4
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { id: 't1', title: 'Nhận bàn giao ca 1 & kiểm kê số lượng thiết bị tại kho' },
                { id: 't2', title: 'Đón tiếp các CLB chiều & chuẩn bị thiết bị giải đấu phong trào' },
                { id: 't3', title: 'Kiểm tra điều phối thiết bị lưu động vào sân khi khách đặt' },
                { id: 't4', title: 'Bàn giao ca 3 (17:00) cho ca trực tối & chuẩn bị đóng sân' },
              ].map((task) => {
                const isDone = taskChecklist[task.id];
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl border text-left transition cursor-pointer ${
                      isDone
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 font-medium'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-[11px] ${isDone ? 'line-through opacity-75' : ''}`}>
                      {task.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 KHU VỰC THÔNG TIN: QUY CHUẨN 3 KHUNG CA */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight">
            Quy chuẩn 3 khung ca trực tại Nhà thi đấu CourtX
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {standardShifts.map((shift) => (
            <div
              key={shift.type}
              className={`rounded-2xl border p-3.5 shadow-2xs flex flex-col items-center justify-between text-center overflow-hidden ${shift.color}`}
            >
              <div className="space-y-1.5 flex flex-col items-center text-center w-full">
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className={`text-xs font-black tracking-wider uppercase ${shift.accentColor}`}>
                    {shift.name.split(':')[0]}
                  </span>
                  <span className="text-[10px] font-black text-slate-700 bg-white/90 px-3 py-0.5 rounded-full border border-slate-200/80 shadow-2xs whitespace-nowrap">
                    {shift.time}
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900 leading-snug text-center">
                  {shift.name.split(':')[1]?.trim()}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium text-center">
                  {shift.description}
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-200/60 w-full flex items-center justify-center text-[10px] font-bold text-slate-600">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{shift.hours} giờ / ca</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🔴 MODAL 1: HỦY / XÓA CA TRỰC HOẶC GỠ NHÂN VIÊN */}
      {selectedShiftForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-2xs ${
                  deleteActionContext === 'unassign_employee'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                }`}
              >
                {deleteActionContext === 'unassign_employee' ? (
                  <UserMinus className="w-5 h-5 stroke-[2.2]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                  {deleteActionContext === 'unassign_employee'
                    ? 'GỠ NHÂN VIÊN KHỎI CA TRỰC'
                    : deleteActionContext === 'delete_shift'
                    ? 'XÓA CA TRỰC ĐÃ TẠO KHỎI LỊCH'
                    : 'HỦY CA TRỰC NHÂN VIÊN'}
                </h3>
                <p className="text-[10px] font-medium text-slate-500">
                  {deleteActionContext === 'unassign_employee'
                    ? 'Gỡ nhân viên khỏi ca. Khung ca sẽ trở về trạng thái trống.'
                    : deleteActionContext === 'delete_shift'
                    ? 'Xác nhận xóa bỏ khung ca trực này khỏi lịch làm việc'
                    : 'Xác nhận hủy đăng ký ca làm việc'}
                </p>
              </div>
            </div>

            {/* Chi tiết ca trực bị hủy/xóa */}
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
                  {selectedShiftForDelete.date.split('-').reverse().join('/')} ({selectedShiftForDelete.dayOfWeek})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Khung giờ:</span>
                <span className="font-semibold text-emerald-700">
                  {selectedShiftForDelete.timeRange}
                </span>
              </div>
            </div>

            {/* Nhập lý do */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {deleteActionContext === 'unassign_employee'
                  ? 'Lý do gỡ nhân viên khỏi ca'
                  : 'Lý do xóa / hủy ca trực'}{' '}
                <span className="text-rose-500">*</span>
              </label>

              {/* Nút chọn nhanh lý do */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(deleteActionContext === 'unassign_employee'
                  ? [
                      'NV bận việc đột xuất',
                      'Đổi nhân sự trực ca',
                      'NV xin nghỉ phép',
                      'Điều phối lại ca trực',
                    ]
                  : quickCancelReasons
                ).map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => {
                      setCancelReason(reason);
                      setDeleteError(null);
                    }}
                    className={`text-[10px] px-2 py-1 rounded-full border transition cursor-pointer font-medium ${
                      cancelReason === reason
                        ? deleteActionContext === 'unassign_employee'
                          ? 'bg-amber-50 border-amber-300 text-amber-700 font-bold'
                          : 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                placeholder={
                  deleteActionContext === 'unassign_employee'
                    ? 'Nhập lý do gỡ nhân viên khỏi ca...'
                    : 'Nhập chi tiết lý do (bắt buộc)...'
                }
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  setDeleteError(null);
                }}
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none transition ${
                  deleteActionContext === 'unassign_employee'
                    ? 'focus:border-amber-500 focus:bg-white'
                    : 'focus:border-rose-500 focus:bg-white'
                }`}
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
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteShift}
                className={`rounded-xl py-3 text-xs font-black text-white shadow-md active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  deleteActionContext === 'unassign_employee'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                }`}
              >
                {deleteActionContext === 'unassign_employee' ? (
                  <>
                    <UserMinus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Gỡ nhân viên</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{isAdmin ? 'Xác nhận xóa ca' : 'Xác nhận hủy'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL THÊM CA TRỰC VÀO LỊCH (DÀNH CHO CHỦ SÂN / ADMIN) */}
      {showCreateShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-2xs">
                  <Calendar className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Thêm ca trực vào lịch
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Khởi tạo ca làm việc và phân công nhân sự trên lịch vận hành
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateShiftModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              {/* 1. Chọn ngày trực */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Ngày trực <span className="text-rose-500">*</span>
                </label>
                {/* Quick date chips from current week */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mb-2">
                  {weekDays.map((d) => {
                    const isSelected = createShiftDate === d.date;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => {
                          setCreateShiftDate(d.date);
                          setCreateShiftError(null);
                        }}
                        className={`py-1.5 px-1 rounded-xl border text-center transition cursor-pointer text-[10px] ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white font-black shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <div className="leading-tight">{d.day}</div>
                        <div className="text-[9px] opacity-80">{d.label}</div>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  value={createShiftDate}
                  onChange={(e) => {
                    setCreateShiftDate(e.target.value);
                    setCreateShiftError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* 2. Chọn khung ca làm */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Khung ca trực tiêu chuẩn (05:00 - 23:00) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {standardShifts.map((st) => {
                    const isSelected = createShiftType === st.type;
                    return (
                      <button
                        key={st.type}
                        type="button"
                        onClick={() => {
                          setCreateShiftType(st.type);
                          setCreateShiftError(null);
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition cursor-pointer relative ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/60 shadow-2xs ring-1 ring-emerald-500'
                            : 'border-slate-200 bg-slate-50 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <st.icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <span className={`font-black text-xs ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>
                            {st.type}
                          </span>
                        </div>
                        <div className="text-[10px] font-bold text-slate-500">
                          {st.time} (6h)
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Phân công nhân sự */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Nhân sự trực ca
                </label>
                <select
                  value={createShiftEmployeeId}
                  onChange={(e) => setCreateShiftEmployeeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="">-- Mở ca trống (Để nhân viên tự nhận ca) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role}) - SĐT: {emp.phone}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  {createShiftEmployeeId
                    ? 'Nhân viên được chọn sẽ nhận ca và hiển thị phân công trên lịch.'
                    : 'Nếu để trống, ca trực sẽ ở trạng thái mở cho nhân viên tự đăng ký.'}
                </p>
              </div>

              {/* 4. Khu vực phụ trách */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Khu vực sân phụ trách
                </label>
                <select
                  value={createShiftArea}
                  onChange={(e) => setCreateShiftArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
                >
                  <option value="Toàn bộ 8 sân">Toàn bộ 8 sân (Sân 01 - 08)</option>
                  <option value="Cụm Sân 01 - 04">Cụm Sân 01 - 04 (Khu A)</option>
                  <option value="Cụm Sân 05 - 08">Cụm Sân 05 - 08 (Khu B)</option>
                  <option value="Khu vực Sân VIP & Khán đài">Khu vực Sân VIP & Khán đài</option>
                  <option value="Khu vực Quầy lễ tân & Dịch vụ">Khu vực Quầy lễ tân & Dịch vụ</option>
                </select>
              </div>

              {/* 5. Ghi chú / Nhiệm vụ ban đầu */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Ghi chú hoặc nhiệm vụ ban đầu cho ca
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mở sân 05:00, kiểm tra hệ thống đèn chiếu sáng & chuẩn bị thảm..."
                  value={createShiftNotes}
                  onChange={(e) => setCreateShiftNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              {/* Error Message */}
              {createShiftError && (
                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{createShiftError}</span>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCreateShiftModal(false)}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmCreateShift}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Xác nhận thêm ca</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL 2: GIAO VIỆC / THÊM CÔNG VIỆC CHO CA TRỰC (DÀNH CHO ADMIN) */}
      {taskModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <ClipboardList className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">
                    Thêm công việc ca trực
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Giao nhiệm vụ và công việc vận hành cho ca trực
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTaskModalData(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin ca trực */}
            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Khung ca:</span>
                <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {taskModalData.shiftName} ({taskModalData.timeRange})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Ngày trực:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {taskModalData.date}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Nhân sự nhận ca:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  {taskModalData.shift?.employeeName || 'Chờ nhân viên nhận ca'}
                </span>
              </div>
            </div>

            {/* Danh sách việc đã giao của ca này */}
            {taskModalData.shift && (taskModalData.shift.taskDescription || (taskModalData.shift.tasks && taskModalData.shift.tasks.length > 0)) && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Công việc hiện tại của ca
                </label>
                <div className="space-y-1">
                  {((taskModalData.shift.tasks || [taskModalData.shift.taskDescription]).filter(Boolean) as string[]).map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <span className="text-slate-700 font-medium flex items-center gap-1.5 truncate">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{t}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Nhập công việc mới */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nội dung công việc cần giao <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Kiểm tra đèn chiếu sáng sân 3, chuẩn bị 10 bóng Pickleball cho CLB, lau sàn..."
                  value={taskTitle}
                  onChange={(e) => {
                    setTaskTitle(e.target.value);
                    setTaskError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Mẫu công việc nhanh */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  Chọn nhanh công việc mẫu:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Kiểm tra thảm & căng lưới sân',
                    'Đón tiếp CLB & giải đấu mini',
                    'Điều phối thiết bị lưu động vào sân',
                    'Bảo dưỡng dàn đèn LED trần',
                    'Vệ sinh sàn thi đấu & kiểm kê kho',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTaskTitle(preset)}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Khu vực phân công */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Khu vực sân áp dụng
                </label>
                <select
                  value={taskArea}
                  onChange={(e) => setTaskArea(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="Toàn bộ 8 sân">Toàn bộ 8 sân thi đấu</option>
                  <option value="Cụm Sân 01 - 04">Cụm Sân 01 - 04 (Sân Cầu Lông)</option>
                  <option value="Cụm Sân 05 - 08">Cụm Sân 05 - 08 (Pickleball & Đa năng)</option>
                  <option value="Kho thiết bị chung">Kho thiết bị chung & Lễ tân</option>
                </select>
              </div>

              {/* Mức độ ưu tiên */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Mức độ ưu tiên
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'normal', label: 'Tiêu chuẩn', color: 'border-slate-200 bg-slate-50 text-slate-700' },
                    { id: 'important', label: 'Quan trọng', color: 'border-amber-200 bg-amber-50 text-amber-800' },
                    { id: 'urgent', label: 'Khẩn cấp', color: 'border-rose-200 bg-rose-50 text-rose-800' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTaskPriority(p.id as any)}
                      className={`py-2 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                        taskPriority === p.id
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                          : p.color
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {taskError && (
                <div className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl">
                  {taskError}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTaskModalData(null)}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmAddTask}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Giao công việc</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟢 MODAL 3: XÁC NHẬN ĐĂNG KÝ CA TRỰC (DÀNH CHO NHÂN VIÊN) */}
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
                <strong>Xác nhận tự động:</strong> Ca làm việc sẽ được phê duyệt tức thì vào lịch
                cá nhân mà không cần chờ chủ sân duyệt thủ công.
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

      {/* 🟢 MODAL QUẢN TRỊ CƠ CẤU CA & THAO TÁC CA HÀNG LOẠT (ĐỔI CƠ CẤU CA | XÓA CA HÀNG LOẠT) */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[250] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm ${
                    bulkTab === 'structure' ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {bulkTab === 'structure' ? (
                    <Sliders className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  ) : (
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {bulkTab === 'structure'
                      ? 'Cấu hình Cơ cấu Ca Trực (Shift Structure)'
                      : 'Xóa Ca Trực Hàng Loạt'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                    {bulkTab === 'structure'
                      ? 'Tùy chỉnh số lượng khung ca, thời gian bắt đầu/kết thúc hoặc áp dụng mẫu quy chuẩn'
                      : 'Dọn sạch ca trực theo khoảng ngày hoặc gỡ phân công nhân sự'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="h-8 w-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2 Tabs Navigation: Đổi cơ cấu ca | Xóa ca hàng loạt */}
            <div className="flex items-center border-b border-slate-100 bg-white px-3 sm:px-4 pt-1.5 gap-1">
              <button
                type="button"
                onClick={() => {
                  setEditingShifts(standardShifts);
                  setBulkTab('structure');
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-black border-b-2 transition cursor-pointer ${
                  bulkTab === 'structure'
                    ? 'border-slate-900 text-slate-900 bg-slate-100/70 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>Đổi cơ cấu ca</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkTab('delete')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-black border-b-2 transition cursor-pointer ${
                  bulkTab === 'delete'
                    ? 'border-rose-500 text-rose-700 bg-rose-50/60 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa ca hàng loạt</span>
              </button>
            </div>

            {/* Modal Body */}
            {bulkTab === 'structure' ? (
              <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                {/* Preset Templates */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Mẫu cơ cấu ca quy chuẩn (Chọn áp dụng nhanh):</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SHIFT_STRUCTURE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setEditingShifts(preset.shifts);
                          setStructureShiftTypes(preset.shifts.map((s) => s.type));
                        }}
                        className="p-3 rounded-2xl border text-left transition cursor-pointer bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-300 group border-slate-200"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700">
                            {preset.title}
                          </span>
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-200 group-hover:bg-emerald-200 group-hover:text-emerald-800 text-slate-700">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                          {preset.desc}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {preset.shifts.map((s) => (
                            <span
                              key={s.type}
                              className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700"
                            >
                              {s.type}: {s.time}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* List of Shifts in Structure */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Chi tiết các khung ca đang áp dụng ({editingShifts.length} ca):
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextIdx = editingShifts.length + 1;
                        const newShiftType = `Ca ${nextIdx}`;
                        setEditingShifts([
                          ...editingShifts,
                          {
                            type: newShiftType,
                            name: `${newShiftType}: Ca tăng cường`,
                            time: '18:00 - 22:00',
                            hours: 4,
                            icon: Sunset,
                            color: 'border-indigo-200 bg-indigo-50/80 text-indigo-900',
                            accentColor: 'text-indigo-700',
                            badgeColor: 'bg-indigo-100 text-indigo-800',
                            description: 'Ca tăng cường theo nhu cầu vận hành',
                            subNote: 'Ca bổ sung',
                            wageMultiplier: 1.0,
                            isActive: true,
                          },
                        ]);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm khung ca mới</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {editingShifts.map((sh, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-black flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={sh.name}
                              onChange={(e) => {
                                const updated = [...editingShifts];
                                updated[idx] = { ...sh, name: e.target.value };
                                setEditingShifts(updated);
                              }}
                              className="text-xs font-black text-slate-900 border-b border-dashed border-slate-300 focus:border-emerald-500 outline-none pb-0.5 bg-transparent"
                              placeholder="Tên khung ca..."
                            />
                          </div>

                          {editingShifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingShifts(editingShifts.filter((_, i) => i !== idx));
                              }}
                              className="h-6 w-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                              title="Xóa khung ca này khỏi cơ cấu"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 text-xs">
                          <div className="sm:col-span-6">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Khung giờ:</label>
                            <input
                              type="text"
                              value={sh.time}
                              onChange={(e) => {
                                const updated = [...editingShifts];
                                updated[idx] = { ...sh, time: e.target.value };
                                setEditingShifts(updated);
                              }}
                              className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                              placeholder="VD: 06:00 - 14:00"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:col-span-6">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Giờ công:</label>
                              <input
                                type="number"
                                step="0.5"
                                value={sh.hours}
                                onChange={(e) => {
                                  const updated = [...editingShifts];
                                  updated[idx] = { ...sh, hours: parseFloat(e.target.value) || 0 };
                                  setEditingShifts(updated);
                                }}
                                className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Hệ số lương:</label>
                              <input
                                type="number"
                                step="0.1"
                                value={sh.wageMultiplier || 1.0}
                                onChange={(e) => {
                                  const updated = [...editingShifts];
                                  updated[idx] = { ...sh, wageMultiplier: parseFloat(e.target.value) || 1.0 };
                                  setEditingShifts(updated);
                                }}
                                className="w-full mt-0.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 🟢 PHẠM VI ÁP DỤNG & NHIỆM VỤ BÀN GIAO (MỤC 1, 2, 3, 6) */}
                <div className="pt-4 border-t border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Thiết lập phạm vi áp dụng cơ cấu ca
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Linh hoạt theo ngày & thứ
                    </span>
                  </div>

                  {/* 1. Khoảng ngày áp dụng */}
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                      1. Khoảng ngày áp dụng:
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400">Từ ngày:</span>
                        <input
                          type="date"
                          value={structureStartDate}
                          onChange={(e) => setStructureStartDate(e.target.value)}
                          className="w-full mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400">Đến ngày:</span>
                        <input
                          type="date"
                          value={structureEndDate}
                          onChange={(e) => setStructureEndDate(e.target.value)}
                          className="w-full mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Áp dụng cho các thứ trong tuần */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                        2. Áp dụng cho các thứ trong tuần:
                      </label>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                        <button
                          type="button"
                          onClick={() => setStructureDaysOfWeek(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'])}
                          className="hover:underline cursor-pointer"
                        >
                          Tất cả
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setStructureDaysOfWeek(['T2', 'T3', 'T4', 'T5', 'T6'])}
                          className="hover:underline cursor-pointer"
                        >
                          T2 – T6
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setStructureDaysOfWeek(['T7', 'CN'])}
                          className="hover:underline cursor-pointer"
                        >
                          T7, CN
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5 mt-2">
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => {
                        const isSelected = structureDaysOfWeek.includes(d);
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                if (structureDaysOfWeek.length > 1) {
                                  setStructureDaysOfWeek(structureDaysOfWeek.filter((item) => item !== d));
                                }
                              } else {
                                setStructureDaysOfWeek([...structureDaysOfWeek, d]);
                              }
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer text-center ${
                              isSelected
                                ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Chọn các khung ca áp dụng */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                        3. Chọn các khung ca muốn áp dụng:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const allTypes = editingShifts.map((s) => s.type);
                          if (structureShiftTypes.length === allTypes.length) {
                            setStructureShiftTypes([allTypes[0]]);
                          } else {
                            setStructureShiftTypes(allTypes);
                          }
                        }}
                        className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        {structureShiftTypes.length === editingShifts.length ? 'Chọn lại' : 'Chọn tất cả'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                      {editingShifts.map((st) => {
                        const checked = structureShiftTypes.includes(st.type);
                        return (
                          <button
                            key={st.type}
                            type="button"
                            onClick={() => {
                              if (checked) {
                                if (structureShiftTypes.length > 1) {
                                  setStructureShiftTypes(structureShiftTypes.filter((t) => t !== st.type));
                                }
                              } else {
                                setStructureShiftTypes([...structureShiftTypes, st.type]);
                              }
                            }}
                            className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                              checked
                                ? 'bg-amber-50/70 border-amber-400 text-amber-950 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <div className="text-xs font-black">{st.name.split(':')[0]}</div>
                              <div className="text-[10px] text-slate-500 font-bold">{st.time}</div>
                            </div>
                            {checked ? (
                              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 6. Nhiệm vụ mẫu bàn giao cho ca */}
                  <div>
                    <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                      6. Nhiệm vụ mẫu bàn giao cho ca:
                    </label>
                    <div className="space-y-1.5 mt-1.5">
                      {structureTasks.map((t, idx) => {
                        const isChecked = selectedStructureTasks.includes(t);
                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition cursor-pointer ${
                              isChecked
                                ? 'bg-amber-50/50 border-amber-300 text-slate-900'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedStructureTasks(selectedStructureTasks.filter((item) => item !== t));
                                } else {
                                  setSelectedStructureTasks([...selectedStructureTasks, t]);
                                }
                              }}
                              className="w-4 h-4 rounded accent-amber-600 cursor-pointer shrink-0"
                            />
                            <span className="flex-1 text-xs font-semibold leading-snug">{t}</span>
                            {structureTasks.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setStructureTasks(structureTasks.filter((_, i) => i !== idx));
                                  setSelectedStructureTasks(selectedStructureTasks.filter((item) => item !== t));
                                }}
                                className="text-slate-400 hover:text-rose-500 p-0.5 transition cursor-pointer shrink-0"
                                title="Xóa nhiệm vụ này khỏi mẫu"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="Thêm nhiệm vụ tùy biến khác..."
                        value={structureCustomTaskInput}
                        onChange={(e) => setStructureCustomTaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddStructureTask();
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddStructureTask}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition active:scale-95 cursor-pointer whitespace-nowrap shadow-sm shadow-amber-600/20"
                      >
                        Thêm việc
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-rose-900 leading-relaxed font-medium">
                    <strong>Lưu ý quan trọng:</strong> Chức năng này cho phép dọn sạch hoặc hủy hàng loạt các ca trực trên lịch theo khoảng ngày mà không cần bấm xóa từng ô.
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                    1. Khoảng ngày cần xóa:
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400">Từ ngày:</span>
                      <input
                        type="date"
                        value={bulkDeleteStartDate}
                        onChange={(e) => setBulkDeleteStartDate(e.target.value)}
                        className="w-full mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400">Đến ngày:</span>
                      <input
                        type="date"
                        value={bulkDeleteEndDate}
                        onChange={(e) => setBulkDeleteEndDate(e.target.value)}
                        className="w-full mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                    2. Chọn các khung ca cần xóa:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                    {standardShifts.map((st) => {
                      const checked = bulkDeleteShiftTypes.includes(st.type);
                      return (
                        <button
                          key={st.type}
                          type="button"
                          onClick={() => {
                            if (checked) {
                              setBulkDeleteShiftTypes(bulkDeleteShiftTypes.filter((t) => t !== st.type));
                            } else {
                              setBulkDeleteShiftTypes([...bulkDeleteShiftTypes, st.type]);
                            }
                          }}
                          className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
                            checked
                              ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-black">{st.name.split(':')[0]}</div>
                            <div className="text-[10px] text-slate-500 font-bold">{st.time}</div>
                          </div>
                          {checked ? (
                            <CheckCircle2 className="w-4 h-4 text-rose-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                    3. Hình thức xóa:
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <label
                      className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        bulkDeleteMode === 'full_delete'
                          ? 'bg-rose-50 border-rose-300 text-rose-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="bulkDeleteMode"
                          checked={bulkDeleteMode === 'full_delete'}
                          onChange={() => setBulkDeleteMode('full_delete')}
                          className="accent-rose-600"
                        />
                        <span className="text-xs font-black">Xóa hoàn toàn ca</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">Đóng ca, đưa về trạng thái trống chưa mở</span>
                    </label>

                    <label
                      className={`p-3 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        bulkDeleteMode === 'unassign_only'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="bulkDeleteMode"
                          checked={bulkDeleteMode === 'unassign_only'}
                          onChange={() => setBulkDeleteMode('unassign_only')}
                          className="accent-amber-600"
                        />
                        <span className="text-xs font-black">Chỉ gỡ nhân viên</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">Giữ lại ca trống để nhân viên khác đăng ký</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                    4. Lý do điều chỉnh:
                  </label>
                  <input
                    type="text"
                    value={bulkDeleteReason}
                    onChange={(e) => setBulkDeleteReason(e.target.value)}
                    className="w-full mt-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                    placeholder="Nhập lý do xóa hàng loạt..."
                  />
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer text-center"
              >
                Hủy bỏ
              </button>

              {bulkTab === 'structure' ? (
                <button
                  type="button"
                  onClick={() => handleSaveShiftStructure(editingShifts)}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Lưu & Áp dụng cơ cấu ca</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteBulkDelete}
                  className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xác nhận xóa hàng loạt</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🟢 Toast thông báo thành công */}
      {successToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-slate-900/95 text-white px-4 py-2.5 text-xs font-bold shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
}
