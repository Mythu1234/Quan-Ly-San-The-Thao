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
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
  Trash2,
  UserMinus,
  Calendar,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  Info,
  Sliders,
  RotateCcw,
  Bell,
  UserCheck,
  Table,
  Filter,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import type { Employee, ShiftRegistration } from '../../types/admin';
import { INITIAL_SHIFTS } from '../../types/admin';
import NotificationModal from './NotificationModal';
import AssignStaffShiftView from './AssignStaffShiftView';

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
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedShiftForDelete, setSelectedShiftForDelete] = useState<ShiftRegistration | null>(null);
  const [deleteActionContext, setDeleteActionContext] = useState<'unassign_employee' | 'delete_shift' | 'cancel_shift'>('unassign_employee');
  const [isPermanentDelete, setIsPermanentDelete] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Shift Detail Modal state (Xem chi tiết khi bấm vào cục ca trực)
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<ShiftRegistration | null>(null);

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

  // Admin Assign Staff Shift Screen state (Phân công nhân viên cho ca trực - Không modal)
  const [assigningShiftData, setAssigningShiftData] = useState<{
    shiftType: string;
    date: string;
    targetShift?: ShiftRegistration | null;
  } | null>(null);

  const handleOpenAssignShift = (
    shiftType?: string,
    date?: string,
    targetShift?: ShiftRegistration | null
  ) => {
    setAssigningShiftData({
      shiftType: shiftType || 'Ca 1',
      date: date || '2026-10-16',
      targetShift: targetShift || null,
    });
  };

  // Track slots where shifts were deleted in this session
  const [deletedSlotsHistory, setDeletedSlotsHistory] = useState<
    Record<string, { shiftName: string; employeeName: string; reason?: string }>
  >({});

  // View & Filter states
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('ALL');


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

  // Export Excel states (UC-10: Xuất Excel bảng phân ca & chấm công)
  const [exportMonth, setExportMonth] = useState('10');
  const [exportYear, setExportYear] = useState('2026');
  const [exportScope, setExportScope] = useState<'week_current' | 'all_month' | 'week_1' | 'week_2' | 'week_3' | 'week_4' | 'week_5'>('week_current');
  const [exportEmployeeId, setExportEmployeeId] = useState<string>('ALL');
  const [exportShiftType, setExportShiftType] = useState<string>('ALL');
  const [exportIncludeNightBonus, setExportIncludeNightBonus] = useState<boolean>(true);
  const [exportOnlyCompleted, setExportOnlyCompleted] = useState<boolean>(false);
  const [exportIncludeTasks, setExportIncludeTasks] = useState<boolean>(true);

  // Week selection state - Defaults to active week 15/10 - 21/10
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date('2026-10-15'));
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

  // Common popup system (thay thế cho alert / confirm mặc định của trình duyệt)
  const [commonPopup, setCommonPopup] = useState<{
    type: 'alert' | 'confirm' | 'danger';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  } | null>(null);

  const showCommonAlert = (title: string, message: string) => {
    setCommonPopup({ type: 'alert', title, message });
  };

  const showCommonConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    isDanger = false,
    confirmText = 'Có, xác nhận',
    cancelText = 'Không, quay lại'
  ) => {
    setCommonPopup({
      type: isDanger ? 'danger' : 'confirm',
      title,
      message,
      onConfirm,
      confirmText,
      cancelText,
    });
  };

  // Scope states for Shift Structure (1. Khoảng ngày, 2. Thứ trong tuần, 3. Nhiệm vụ mẫu)
  const [structureStartDate, setStructureStartDate] = useState('2026-10-15');
  const [structureEndDate, setStructureEndDate] = useState('2026-10-21');
  const [structureDaysOfWeek, setStructureDaysOfWeek] = useState<string[]>([
    'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN',
  ]);
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
        newStructure.forEach((config) => {
          const existingShift = effectiveShifts.find(
            (s) => s.date === curDateStr && s.shiftType === config.type && s.status !== 'cancelled'
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
      showCommonAlert(
        'Không tìm thấy ca trực',
        'Không tìm thấy ca trực nào phù hợp trong khoảng ngày và khung ca đã chọn để thực hiện xóa!'
      );
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

  // Số ngày có ca làm việc của nhân viên trong tuần
  const myWorkingDaysInWeek = new Set(myShiftsInWeek.map((s) => s.date)).size;

  // Active shifts in week for Admin
  const activeWeekShifts = effectiveShifts.filter(
    (s) => currentWeekDates.includes(s.date) && s.status !== 'cancelled'
  );

  // Unique employees working in this week
  const activeStaffIds = new Set(activeWeekShifts.map((s) => s.employeeId));



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

  // Helper: Lấy giờ công tiêu chuẩn của ca trực
  const getShiftStandardHours = (shiftType: string) => {
    const meta = standardShifts.find((c) => c.type === shiftType);
    return meta?.hours || 6;
  };

  // Helper: Lấy giờ công quy đổi (Hệ số ca đêm x1.3 cho Ca 3 theo BR2)
  const getShiftWeightedHours = (shiftType: string) => {
    const std = getShiftStandardHours(shiftType);
    if (exportIncludeNightBonus && (shiftType === 'Ca 3' || shiftType.toLowerCase().includes('tối'))) {
      return Math.round(std * 1.3 * 10) / 10;
    }
    return std;
  };

  // UC-10: Tính toán danh sách ca trực theo bộ lọc cấu hình xuất báo cáo
  const getFilteredExportShifts = () => {
    return effectiveShifts
      .filter((s) => {
        if (s.status === 'cancelled') return false;

        // 1. Lọc theo tháng và năm
        const parts = s.date.split('-');
        if (parts.length >= 3) {
          const sYear = parts[0];
          const sMonth = parts[1];
          const dayInt = parseInt(parts[2], 10);

          if (exportScope === 'week_current') {
            if (!currentWeekDates.includes(s.date)) return false;
          } else {
            if (sYear !== exportYear || sMonth !== exportMonth.padStart(2, '0')) {
              return false;
            }
            if (exportScope === 'week_1' && (dayInt < 1 || dayInt > 7)) return false;
            if (exportScope === 'week_2' && (dayInt < 8 || dayInt > 14)) return false;
            if (exportScope === 'week_3' && (dayInt < 15 || dayInt > 21)) return false;
            if (exportScope === 'week_4' && (dayInt < 22 || dayInt > 28)) return false;
            if (exportScope === 'week_5' && (dayInt < 29 || dayInt > 31)) return false;
          }
        }

        // 2. Lọc theo nhân sự
        if (exportEmployeeId !== 'ALL') {
          if (exportEmployeeId === 'PENDING') {
            if (s.employeeId !== 'PENDING') return false;
          } else {
            if (s.employeeId !== exportEmployeeId) return false;
          }
        }

        // 3. Lọc theo khung ca
        if (exportShiftType !== 'ALL') {
          if (s.shiftType !== exportShiftType) return false;
        }

        // 4. Lọc chỉ ca hoàn thành / đang trực
        if (exportOnlyCompleted) {
          if (s.status !== 'completed' && s.status !== 'in_progress') return false;
        }

        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.shiftType.localeCompare(b.shiftType));
  };

  // Helper tạo tên file xuất chuẩn nghiệp vụ UC-10
  const getExportFileName = (extension: 'xlsx' | 'csv' = 'xlsx') => {
    let scopeSlug = `Thang_${exportMonth}_${exportYear}`;
    if (exportScope === 'week_current') {
      scopeSlug = `Tuan_${weekDays[0].dayNum}_${weekDays[6].dayNum}_Thang_${exportMonth}_${exportYear}`;
    } else if (exportScope === 'week_1') {
      scopeSlug = `Tuan_1_Thang_${exportMonth}_${exportYear}`;
    } else if (exportScope === 'week_2') {
      scopeSlug = `Tuan_2_Thang_${exportMonth}_${exportYear}`;
    } else if (exportScope === 'week_3') {
      scopeSlug = `Tuan_3_Thang_${exportMonth}_${exportYear}`;
    } else if (exportScope === 'week_4') {
      scopeSlug = `Tuan_4_Thang_${exportMonth}_${exportYear}`;
    } else if (exportScope === 'week_5') {
      scopeSlug = `Tuan_5_Thang_${exportMonth}_${exportYear}`;
    }

    let staffSlug = '';
    if (exportEmployeeId !== 'ALL') {
      const emp = employees.find((e) => e.id === exportEmployeeId);
      const cleanName = emp ? emp.name.replace(/\s+/g, '_') : exportEmployeeId;
      staffSlug = `_${cleanName}`;
    }

    return `Bang_Phan_Ca_${scopeSlug}${staffSlug}_CourtX.${extension}`;
  };

  // Submit UC-10: Export Excel / CSV file
  const handleDownloadExcel = (format: 'xlsx' | 'csv' = 'xlsx') => {
    const exportList = getFilteredExportShifts();
    if (exportList.length === 0) {
      showCommonAlert(
        'Không có dữ liệu ca trực',
        'Không tìm thấy ca trực nào phù hợp với bộ lọc hiện tại để xuất file Excel. Vui lòng chọn lại kỳ hoặc phạm vi khác!'
      );
      return;
    }

    const headers = [
      'STT',
      'Mã Ca',
      'Ngày Trực',
      'Thứ',
      'Khung Ca',
      'Thời Gian',
      'Giờ Chuẩn (h)',
      'Giờ Quy Đổi (x1.3 Đêm)',
      'Mã NV',
      'Nhân Viên Phụ Trách',
      'Khu Vực Sân',
      'Trạng Thái',
      'Nhiệm Vụ Ca Trực',
    ];

    let totalStd = 0;
    let totalWeight = 0;

    const rows = exportList.map((s, idx) => {
      const stdH = getShiftStandardHours(s.shiftType);
      const weightH = getShiftWeightedHours(s.shiftType);
      totalStd += stdH;
      totalWeight += weightH;

      return [
        idx + 1,
        s.id,
        s.date,
        s.dayOfWeek || '',
        s.shiftType,
        s.timeRange,
        stdH,
        weightH,
        s.employeeId,
        `"${s.employeeName}"`,
        `"${s.courtArea || 'Toàn bộ 8 sân'}"`,
        s.status === 'in_progress' ? 'Đang trực' : s.status === 'completed' ? 'Đã xong' : 'Đã xác nhận',
        `"${(exportIncludeTasks ? (s.tasks && s.tasks.length > 0 ? s.tasks.join('; ') : s.taskDescription || '') : '').replace(/"/g, '""')}"`,
      ];
    });

    const summaryRow = [
      'TỔNG CỘNG',
      `"${exportList.length} ca trực"`,
      '',
      '',
      '',
      '',
      totalStd,
      Math.round(totalWeight * 10) / 10,
      '',
      `"${new Set(exportList.map((s) => s.employeeId).filter((id) => id !== 'PENDING')).size} nhân sự"`,
      '',
      '',
      '',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(',')), summaryRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = getExportFileName(format);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowExportModal(false);
    setSuccessToast(`Đã tải xuống tệp ${fileName} thành công (${exportList.length} ca trực, ${totalStd}h công)!`);
    setTimeout(() => setSuccessToast(null), 3500);
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
    const exportShifts = getFilteredExportShifts();
    const fileName = getExportFileName('xlsx');

    const totalStdHours = exportShifts.reduce((acc, s) => acc + getShiftStandardHours(s.shiftType), 0);
    const totalWeightedHours = Math.round(
      exportShifts.reduce((acc, s) => acc + getShiftWeightedHours(s.shiftType), 0) * 10
    ) / 10;
    const uniqueEmployees = Array.from(
      new Set(exportShifts.map((s) => s.employeeId).filter((id) => id !== 'PENDING'))
    );
    const assignedCount = exportShifts.filter((s) => s.employeeId !== 'PENDING').length;
    const matchPercentage = exportShifts.length > 0
      ? Math.round((assignedCount / exportShifts.length) * 100)
      : 100;

    const getScopeDisplayLabel = () => {
      if (exportScope === 'all_month') return `Toàn Bộ Tháng ${exportMonth}/${exportYear}`;
      if (exportScope === 'week_current') return `Tuần Hiện Tại (${weekDays[0].label} – ${weekDays[6].label}/${exportYear})`;
      if (exportScope === 'week_1') return `Tuần 1 (01 – 07/${exportMonth}/${exportYear})`;
      if (exportScope === 'week_2') return `Tuần 2 (08 – 14/${exportMonth}/${exportYear})`;
      if (exportScope === 'week_3') return `Tuần 3 (15 – 21/${exportMonth}/${exportYear})`;
      if (exportScope === 'week_4') return `Tuần 4 (22 – 28/${exportMonth}/${exportYear})`;
      if (exportScope === 'week_5') return `Tuần 5 (29 – 31/${exportMonth}/${exportYear})`;
      return `Tháng ${exportMonth}/${exportYear}`;
    };

    const selectedEmployeeObj = employees.find((e) => e.id === exportEmployeeId);

    const handleResetExportFilters = () => {
      setExportMonth('10');
      setExportYear('2026');
      setExportScope('week_current');
      setExportEmployeeId('ALL');
      setExportShiftType('ALL');
      setExportIncludeNightBonus(true);
      setExportOnlyCompleted(false);
      setExportIncludeTasks(true);
    };

    return (
      <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
        {/* 🟢 Top Badge & Navigation Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExportModal(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-2xs"
              title="Quay lại lịch trực"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              XUẤT BÁO CÁO PHÂN CA & BẢNG CÔNG
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 border border-slate-200 shadow-2xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx) / CSV</span>
          </div>
        </div>

        {/* 🟢 Main Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            CẤU HÌNH & XUẤT BÁO CÁO <span className="text-emerald-600">LỊCH TRỰC</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
            Chọn kỳ làm việc, nhân viên, khung ca và các tùy chọn đối soát để trích xuất file Excel / CSV tính lương.
          </p>
        </div>

        {/* 🟢 CARD 1: BỘ LỌC & CẤU HÌNH TRÍCH XUẤT (UC-10 STEP 2) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Bộ Lọc & Cấu Hình Trích Xuất (UC-10)
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Thiết lập kỳ làm việc, nhân sự và các tiêu chí tính công
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetExportFilters}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-xl transition cursor-pointer active:scale-95"
              title="Khôi phục thiết lập mặc định"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>
          </div>

          {/* 1. Chọn Kỳ Phân Ca (Tháng & Năm) + Phạm Vi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                1. KỲ PHÂN CA & PHẠM VI THỜI GIAN:
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                Tháng {exportMonth}/{exportYear}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">CHỌN THÁNG:</label>
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-black text-slate-800 outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m.padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">CHỌN NĂM:</label>
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-black text-slate-800 outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="2025">Năm 2025</option>
                  <option value="2026">Năm 2026</option>
                  <option value="2027">Năm 2027</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">PHẠM VI TRÍCH XUẤT:</label>
                <select
                  value={exportScope}
                  onChange={(e) => setExportScope(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-black text-slate-800 outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="week_current">Tuần hiện tại ({weekDays[0].label} – {weekDays[6].label})</option>
                  <option value="all_month">📅 Toàn bộ Tháng {exportMonth}/{exportYear}</option>
                  <option value="week_1">Tuần 1 (01/10 – 07/10)</option>
                  <option value="week_2">Tuần 2 (08/10 – 14/10)</option>
                  <option value="week_3">Tuần 3 (15/10 – 21/10)</option>
                  <option value="week_4">Tuần 4 (22/10 – 28/10)</option>
                  <option value="week_5">Tuần 5 (29/10 – 31/10)</option>
                </select>
              </div>
            </div>

            {/* Quick scope pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {[
                { id: 'all_month', label: `Cả tháng ${exportMonth}` },
                { id: 'week_current', label: 'Tuần này (15-21)' },
                { id: 'week_1', label: 'Tuần 1 (01-07)' },
                { id: 'week_2', label: 'Tuần 2 (08-14)' },
                { id: 'week_3', label: 'Tuần 3 (15-21)' },
                { id: 'week_4', label: 'Tuần 4 (22-28)' },
                { id: 'week_5', label: 'Tuần 5 (29-31)' },
              ].map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setExportScope(sc.id as any)}
                  className={`text-[10.5px] px-2.5 py-1 rounded-xl font-bold transition active:scale-95 cursor-pointer ${
                    exportScope === sc.id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Chọn Nhân Viên Phụ Trách (Bộ Lọc Nhân Sự) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                2. NHÂN VIÊN TRỰC CA (BỘ LỌC NHÂN SỰ):
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {exportEmployeeId === 'ALL'
                  ? 'Tất cả nhân sự'
                  : exportEmployeeId === 'PENDING'
                  ? 'Chờ nhận ca'
                  : selectedEmployeeObj?.name || exportEmployeeId}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-3">
                <select
                  value={exportEmployeeId}
                  onChange={(e) => setExportEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs font-black text-slate-800 outline-none focus:border-emerald-500 transition cursor-pointer"
                >
                  <option value="ALL">👥 Tất cả nhân sự ({employees.length} nhân viên)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      👤 {emp.id} - {emp.name} ({emp.role})
                    </option>
                  ))}
                  <option value="PENDING">⚠️ Chờ NV nhận ca (Ca chưa phân công)</option>
                </select>
              </div>
            </div>

            {/* Quick Staff avatar pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => setExportEmployeeId('ALL')}
                className={`text-[10.5px] px-2.5 py-1 rounded-xl font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  exportEmployeeId === 'ALL'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Tất cả</span>
                <span className="text-[9.5px] opacity-75">({employees.length})</span>
              </button>

              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setExportEmployeeId(emp.id)}
                  className={`text-[10.5px] px-2.5 py-1 rounded-xl font-bold transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                    exportEmployeeId === emp.id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-black ${
                      exportEmployeeId === emp.id
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {emp.avatarText || emp.name.charAt(0)}
                  </span>
                  <span>{emp.name.split(' ').slice(-2).join(' ')}</span>
                  <span className="text-[9px] opacity-70">({emp.id})</span>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setExportEmployeeId('PENDING')}
                className={`text-[10.5px] px-2.5 py-1 rounded-xl font-bold transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                  exportEmployeeId === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>⚠️ Ca trống</span>
              </button>
            </div>
          </div>

          {/* 3. Chọn Khung Ca Trực */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs font-black text-slate-800">
              <span className="flex items-center gap-1.5 text-slate-900">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                3. KHUNG CA TRỰC:
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                {exportShiftType === 'ALL' ? 'Tất cả các ca' : exportShiftType}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả ca' },
                { id: 'Ca 1', label: '☀️ Ca 1 (05:00 - 11:00)' },
                { id: 'Ca 2', label: '🌤️ Ca 2 (11:00 - 17:00)' },
                { id: 'Ca 3', label: '🌙 Ca 3 (17:00 - 23:00)' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setExportShiftType(st.id)}
                  className={`text-[10.5px] px-3 py-1.5 rounded-xl font-bold transition active:scale-95 cursor-pointer ${
                    exportShiftType === st.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Tùy Chọn Nghiệp Vụ & Tính Công (BR2, Task, Status) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              4. TÙY CHỌN TÍNH CÔNG & NỘI DUNG XUẤT (BUSINESS RULES):
            </span>

            <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exportIncludeNightBonus}
                  onChange={(e) => setExportIncludeNightBonus(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <div>
                  <span className="text-xs font-black text-slate-800 block">
                    Áp dụng hệ số ca đêm x1.3 cho Ca 3 (Theo BR2 quy chế CourtX)
                  </span>
                  <span className="text-[10.5px] text-slate-500 font-medium leading-relaxed block">
                    Tự động tính thêm cột & hàng tổng cộng Giờ quy đổi = 6 giờ × 1.3 = 7.8 giờ công phục vụ chấm lương.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-slate-200/50">
                <input
                  type="checkbox"
                  checked={exportIncludeTasks}
                  onChange={(e) => setExportIncludeTasks(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <div>
                  <span className="text-xs font-black text-slate-800 block">
                    Kèm phân bổ cụm sân & chi tiết nhiệm vụ giao ca
                  </span>
                  <span className="text-[10.5px] text-slate-500 font-medium leading-relaxed block">
                    Xuất đầy đủ khu vực sân phụ trách (Cụm 01-04, 05-08) và danh sách việc cần làm của từng ca.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-slate-200/50">
                <input
                  type="checkbox"
                  checked={exportOnlyCompleted}
                  onChange={(e) => setExportOnlyCompleted(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4"
                />
                <div>
                  <span className="text-xs font-black text-slate-800 block">
                    Chỉ xuất ca đã hoàn thành / đang trực (Bỏ qua ca dự kiến)
                  </span>
                  <span className="text-[10.5px] text-slate-500 font-medium leading-relaxed block">
                    Phù hợp khi kế toán cần chốt bảng công thực tế cuối tuần hoặc cuối tháng.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* 🟢 CARD 2: THẺ TÓM TẮT TRÍCH XUẤT (UC-10 STEP 4) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0 shadow-2xs">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block truncate" title={fileName}>
                Tệp xuất: {fileName}
              </span>
              <h2 className="text-base font-black tracking-tight text-slate-900 mt-0.5 truncate">
                {getScopeDisplayLabel()} {selectedEmployeeObj ? `· NV: ${selectedEmployeeObj.name}` : ''}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {matchPercentage}% Khớp ca
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200">
              <Table className="w-3.5 h-3.5 text-slate-500" />
              {exportShifts.length} ca trực
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {totalStdHours}h công chuẩn
            </span>
            {exportIncludeNightBonus && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 border border-purple-200">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                {totalWeightedHours}h quy đổi (x1.3)
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700 border border-teal-200">
              <Users className="w-3.5 h-3.5 text-teal-600" />
              {uniqueEmployees.length} nhân sự tham gia
            </span>
          </div>
        </div>

        {/* 🟢 CARD 3: BẢNG DỮ LIỆU SẼ XUẤT RA EXCEL (Preview Data Table) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <Table className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Bảng dữ liệu sẽ xuất ra Excel ({exportShifts.length} ca trực)
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {getScopeDisplayLabel()} {selectedEmployeeObj ? `· Lọc theo ${selectedEmployeeObj.name}` : '· Tất cả nhân sự'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl whitespace-nowrap">
              {exportShifts.length} bản ghi
            </span>
          </div>

          {/* Table Container */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-2xs">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">STT</th>
                  <th className="py-2.5 px-3">Ngày trực</th>
                  <th className="py-2.5 px-3">Khung ca</th>
                  <th className="py-2.5 px-3 text-center">Giờ công</th>
                  <th className="py-2.5 px-3">Nhân sự trực ca</th>
                  <th className="py-2.5 px-3">Khu vực & Nhiệm vụ</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exportShifts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 px-4 text-slate-400 font-medium">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Không tìm thấy ca trực nào phù hợp với bộ lọc đã chọn</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Vui lòng thử chọn tháng khác, đổi phạm vi hoặc nhấn nút đặt lại bộ lọc.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetExportFilters}
                        className="mt-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Khôi phục bộ lọc mặc định
                      </button>
                    </td>
                  </tr>
                ) : (
                  exportShifts.map((s, idx) => {
                    const isPending = s.employeeId === 'PENDING';
                    const shiftDateObj = new Date(s.date);
                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                    const dayLabel = dayNames[shiftDateObj.getDay()] || '';
                    const dateFormatted = s.date.split('-').reverse().slice(0, 2).join('/');
                    const stdH = getShiftStandardHours(s.shiftType);
                    const weightH = getShiftWeightedHours(s.shiftType);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-black text-slate-900 leading-tight">
                            {dayLabel}, {dateFormatted}
                          </div>
                          <div className="text-[9.5px] text-slate-400 font-medium">
                            {s.date}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-black text-slate-800 leading-tight">
                            {s.shiftType}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            {s.timeRange}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="font-black text-slate-900 text-xs">
                            {stdH}h
                          </div>
                          {exportIncludeNightBonus && weightH > stdH && (
                            <span className="inline-block text-[9.5px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              x1.3 = {weightH}h
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                              Chờ NV nhận ca
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[10px] shrink-0">
                                {s.employeeName.charAt(0)}
                              </div>
                              <div>
                                <span className="font-black text-slate-900 text-xs block leading-tight">
                                  {s.employeeName}
                                </span>
                                <span className="text-[9.5px] text-slate-400 font-medium">
                                  {s.employeeId}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-medium text-[11px] max-w-[200px]">
                          <div className="font-bold text-slate-800 truncate">
                            {s.courtArea || 'Toàn bộ 8 sân'}
                          </div>
                          {exportIncludeTasks && (s.tasks?.length || s.taskDescription) && (
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {s.tasks && s.tasks.length > 0 ? s.tasks.join('; ') : s.taskDescription}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${
                              s.status === 'in_progress'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s.status === 'in_progress'
                              ? 'Đang trực'
                              : s.status === 'completed'
                              ? 'Đã xong'
                              : 'Đã xác nhận'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer with Summary Row */}
              {exportShifts.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50/90 border-t-2 border-slate-200 text-xs font-black text-slate-900">
                    <td className="py-3 px-3 text-center font-black text-emerald-700">∑</td>
                    <td className="py-3 px-3 text-emerald-800 font-black">
                      TỔNG CỘNG
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-black">
                      {exportShifts.length} ca
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-black">
                      <div>{totalStdHours} giờ</div>
                      {exportIncludeNightBonus && totalWeightedHours > totalStdHours && (
                        <div className="text-[10px] text-purple-700 font-bold">
                          Quy đổi: {totalWeightedHours}h
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-black">
                      {uniqueEmployees.length} nhân sự
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-right text-[11px] font-bold text-slate-500">
                      Xuất định dạng Excel 2010+ chuẩn
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* 🟢 Footer Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setShowExportModal(false)}
            className="rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs text-center"
          >
            Hủy bỏ & Quay lại
          </button>

          <button
            type="button"
            onClick={() => handleDownloadExcel('csv')}
            disabled={exportShifts.length === 0}
            className="rounded-2xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 py-3.5 text-xs font-bold text-emerald-800 active:scale-95 transition cursor-pointer shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Tải file CSV (.csv)</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadExcel('xlsx')}
            disabled={exportShifts.length === 0}
            className="rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 text-xs font-black text-white shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Xác nhận & Tải Excel (.xlsx)</span>
          </button>
        </div>
      </div>
    );
  }

  // 🟣 Helper render popup xác nhận theo thiết kế chung chuẩn hệ thống
  const renderCommonPopupModal = () => {
    if (!commonPopup) return null;
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
          {/* Top Icon */}
          {commonPopup.type === 'danger' ? (
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Trash2 className="w-6 h-6 stroke-[2.2]" />
            </div>
          ) : commonPopup.type === 'confirm' ? (
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
          )}

          <h3 className="text-base sm:text-lg font-black text-slate-900">{commonPopup.title}</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">{commonPopup.message}</p>

          <div className={`mt-5 grid gap-2.5 ${commonPopup.type === 'alert' ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {commonPopup.type !== 'alert' && (
              <button
                type="button"
                onClick={() => setCommonPopup(null)}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
              >
                {commonPopup.cancelText || 'Không, quay lại'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const current = commonPopup;
                setCommonPopup(null);
                if (current.onConfirm) {
                  setTimeout(() => current.onConfirm!(), 10);
                }
              }}
              className={`rounded-xl py-3 text-xs font-black text-white active:scale-95 transition shadow-sm cursor-pointer ${
                commonPopup.type === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {commonPopup.confirmText || (commonPopup.type === 'alert' ? 'Đóng' : 'Có, xác nhận')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessToast = () => {
    if (!successToast) return null;
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[350] flex items-center gap-2.5 rounded-2xl bg-emerald-600 text-white px-4 py-3 text-xs font-bold shadow-2xl shadow-emerald-900/30 border border-emerald-500 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-200 w-[90%] max-w-[360px] justify-center text-center">
        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
        <span className="leading-snug break-words whitespace-normal text-left">{successToast}</span>
      </div>
    );
  };

  // 🟢 MODAL CHI TIẾT CA TRỰC KHI CLICK VÀO CỤC CA TRỰC
  const renderShiftDetailModal = () => {
    if (!selectedShiftDetail) return null;

    const matchedEmployee = employees.find(
      (e) => e.id === selectedShiftDetail.employeeId || e.name === selectedShiftDetail.employeeName
    );
    const matchedConfig = standardShifts.find((cfg) => cfg.type === selectedShiftDetail.shiftType);
    const ShiftIcon = matchedConfig?.icon || Clock;
    const isPending = selectedShiftDetail.employeeId === 'PENDING';
    const isToday = selectedShiftDetail.date === '2026-10-16';

    const allTasks = Array.from(
      new Set([
        ...(localAssignedTasks[selectedShiftDetail.id] || []),
        ...(selectedShiftDetail.tasks || []),
        ...(selectedShiftDetail.taskDescription ? [selectedShiftDetail.taskDescription] : []),
      ].filter(Boolean) as string[])
    );

    const getStatusBadge = () => {
      switch (selectedShiftDetail.status) {
        case 'completed':
          return { label: 'Đã hoàn thành', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
        case 'in_progress':
          return { label: 'Đang trực', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
        case 'cancelled':
          return { label: 'Đã hủy', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
        default:
          return { label: 'Đã phân công', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      }
    };

    const statusBadge = getStatusBadge();

    const dateFormatted = selectedShiftDetail.date
      ? selectedShiftDetail.date.split('-').reverse().join('/')
      : '';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
        <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                  matchedConfig?.color || 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <ShiftIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Chi tiết ca trực
                  </h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedShiftDetail.dayOfWeek || 'Ngày trực'} • {dateFormatted}</span>
                  {isToday && (
                    <span className="text-[9.5px] font-extrabold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                      Hôm nay
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedShiftDetail(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-xl hover:bg-slate-100 transition"
              title="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-5 space-y-3.5 max-h-[72vh] overflow-y-auto">
            {/* Box 1: Khung ca & Thời gian */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Khung ca làm việc
                </span>
                <div className="text-sm font-black text-slate-800 mt-0.5">
                  {selectedShiftDetail.shiftName || matchedConfig?.name || selectedShiftDetail.shiftType}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Thời gian trực
                </span>
                <div className="text-sm font-black text-emerald-700 flex items-center gap-1 justify-end mt-0.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{selectedShiftDetail.timeRange || matchedConfig?.time}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Thông tin nhân viên phụ trách */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Nhân viên trực ca
                </span>
                {!isPending && (
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    Mã NV: {selectedShiftDetail.employeeId}
                  </span>
                )}
              </div>

              {isPending ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold">Chưa phân công nhân viên (Ca mở)</span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        const s = selectedShiftDetail;
                        setSelectedShiftDetail(null);
                        handleOpenAssignShift(s.shiftType, s.date, s);
                      }}
                      className="px-2.5 py-1 text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer active:scale-95 transition"
                    >
                      Phân công ngay
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-3 pt-0.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center text-base font-black shrink-0 shadow-2xs">
                    {matchedEmployee?.avatarText || selectedShiftDetail.employeeName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="text-sm font-black text-slate-900 leading-snug">
                      {selectedShiftDetail.employeeName}
                    </div>
                    <div className="text-xs font-semibold text-slate-600">
                      {matchedEmployee?.role || 'Nhân viên vận hành nhà thi đấu CourtX'}
                    </div>
                    {(matchedEmployee?.phone || matchedEmployee?.email) && (
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                        {matchedEmployee?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {matchedEmployee.phone}
                          </span>
                        )}
                        {matchedEmployee?.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {matchedEmployee.email}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Box 3: Khu vực phân công */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs shrink-0">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Khu vực sân phân công
                  </span>
                  <div className="text-xs font-bold text-slate-800">
                    {selectedShiftDetail.courtArea || 'Toàn bộ 8 sân thi đấu'}
                  </div>
                </div>
              </div>
            </div>

            {/* Box 4: Nhiệm vụ trong ca */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Nhiệm vụ trong ca ({allTasks.length})
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      const s = selectedShiftDetail;
                      setSelectedShiftDetail(null);
                      handleOpenAddTaskModal(s.shiftType, s.date, s);
                    }}
                    className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                    <span>Thêm việc</span>
                  </button>
                )}
              </div>

              {allTasks.length > 0 ? (
                <div className="space-y-1.5 pt-0.5">
                  {allTasks.map((taskText, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs font-medium text-slate-800 flex items-start gap-2 leading-relaxed"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="flex-1">{taskText}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 font-medium">
                  Chưa có nhiệm vụ cụ thể được giao cho ca này. Ca trực diễn ra theo quy trình chuẩn.
                </div>
              )}
            </div>

            {/* Box 5: Ghi chú ca (nếu có) */}
            {selectedShiftDetail.notes && (
              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-black flex items-center gap-1 text-[11px] uppercase tracking-wider">
                  <Info className="w-3.5 h-3.5" /> Ghi chú ca trực
                </div>
                <div className="font-medium">{selectedShiftDetail.notes}</div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between gap-2.5">
            <div>
              {isAdmin && !isPending && (
                <button
                  type="button"
                  onClick={() => {
                    const s = selectedShiftDetail;
                    setSelectedShiftDetail(null);
                    setSelectedShiftForDelete(s);
                    setDeleteActionContext('unassign_employee');
                    setIsPermanentDelete(true);
                    setCancelReason('');
                    setDeleteError(null);
                  }}
                  className="px-3 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-black transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Gỡ nhân viên khỏi ca</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const s = selectedShiftDetail;
                    setSelectedShiftDetail(null);
                    handleOpenAddTaskModal(s.shiftType, s.date, s);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Thêm việc</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedShiftDetail(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-black transition cursor-pointer active:scale-95 shadow-2xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🟢 MÀN HÌNH QUẢN TRỊ CƠ CẤU CA & THAO TÁC CA HÀNG LOẠT (SUB-VIEW TOÀN MÀN HÌNH THEO THIẾT KẾ APP)
  if (showBulkModal) {
    return (
      <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
        {/* 🟢 Top Badge & Navigation (Đồng bộ chuẩn với các màn hình quản lý) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkModal(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-2xs"
              title="Quay lại lịch trực"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {bulkTab === 'structure' ? 'CẤU HÌNH CƠ CẤU CA' : 'XÓA CA HÀNG LOẠT'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (bulkTab === 'structure') {
                setEditingShifts(standardShifts);
              } else {
                setBulkDeleteStartDate(weekDays[0]?.date || '2026-10-15');
                setBulkDeleteEndDate(weekDays[6]?.date || '2026-10-21');
                setBulkDeleteShiftTypes(['Ca 1', 'Ca 2', 'Ca 3']);
              }
            }}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs"
            title="Khôi phục mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Đặt lại</span>
          </button>
        </div>

        {/* 🟢 Main Title */}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            {bulkTab === 'structure' ? (
              <>
                CẤU HÌNH CƠ CẤU <span className="text-emerald-600">CA TRỰC</span>
              </>
            ) : (
              <>
                QUẢN LÝ XÓA CA <span className="text-rose-600">HÀNG LOẠT</span>
              </>
            )}
          </h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
            {bulkTab === 'structure'
              ? 'Thiết lập khung giờ và cơ cấu các ca trực áp dụng cho toàn bộ hệ thống sân CourtX.'
              : 'Xóa bỏ nhanh các ca trực không còn phù hợp trong khoảng thời gian đã chọn.'}
          </p>
        </div>

        {/* 2 Tabs Navigation: Đổi cơ cấu ca | Xóa ca hàng loạt */}
        <div className="flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setEditingShifts(standardShifts);
              setBulkTab('structure');
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer font-black ${
              bulkTab === 'structure'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>Đổi cơ cấu ca</span>
          </button>

          <button
            type="button"
            onClick={() => setBulkTab('delete')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition cursor-pointer font-black ${
              bulkTab === 'delete'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa ca hàng loạt</span>
          </button>
        </div>

        {/* Nội dung chi tiết */}
        {bulkTab === 'structure' ? (
          <div className="space-y-4">
            {/* Box 1: Mẫu quy chuẩn (Chọn nhanh) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mẫu cơ cấu chuẩn (chọn nhanh):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">Vuốt ngang ❯</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x">
                {SHIFT_STRUCTURE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setEditingShifts(preset.shifts);
                    }}
                    className="w-[220px] shrink-0 snap-start p-3 rounded-2xl border text-left transition cursor-pointer bg-slate-50 hover:bg-emerald-50/60 hover:border-emerald-300 border-slate-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 truncate">
                          {preset.title.split('(')[0].trim()}
                        </span>
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 shrink-0">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-1 line-clamp-1 leading-tight">
                        {preset.desc}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {preset.shifts.map((s) => (
                        <span
                          key={s.type}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700"
                        >
                          {s.type} ({s.time.split(' - ')[0]})
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Box 2: Chi tiết khung ca áp dụng */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Chi tiết khung ca áp dụng ({editingShifts.length} ca):
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
                  <span>Thêm khung ca</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {editingShifts.map((sh, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-2xs space-y-2"
                  >
                    {/* Hàng 1: Số thứ tự + Tên ca + Thùng rác */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-black flex items-center justify-center shrink-0">
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
                          className="text-xs font-bold text-slate-900 border-b border-dashed border-slate-300 focus:border-emerald-500 outline-none pb-0.5 bg-transparent flex-1 min-w-0"
                          placeholder="Tên khung ca..."
                        />
                      </div>

                      {editingShifts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            showCommonConfirm(
                              'Xác nhận xóa khung ca',
                              `Bạn có chắc chắn muốn xóa "${sh.name}" (${sh.time}) khỏi cơ cấu ca của sân không?\n\n💡 Dữ liệu các ca trực cũ đã phân công trên lịch vẫn được lưu giữ an toàn trong hệ thống, chỉ tạm thời không hiển thị trên ma trận tuần mới.`,
                              () => {
                                setEditingShifts(editingShifts.filter((_, i) => i !== idx));
                              },
                              true,
                              'Xác nhận xóa',
                              'Không, quay lại'
                            );
                          }}
                          className="h-7 w-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer shrink-0"
                          title="Xóa khung ca này khỏi cơ cấu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Hàng 2: Khung giờ + Giờ công + Hệ số nằm trên CÙNG 1 HÀNG GỌN GÀNG */}
                    <div className="flex items-center gap-2 pt-0.5 text-xs">
                      <div className="flex-1 min-w-0">
                        <span className="text-[9.5px] font-bold text-slate-400 block mb-0.5">KHUNG GIỜ:</span>
                        <input
                          type="text"
                          value={sh.time}
                          onChange={(e) => {
                            const updated = [...editingShifts];
                            updated[idx] = { ...sh, time: e.target.value };
                            setEditingShifts(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                          placeholder="06:00 - 14:00"
                        />
                      </div>

                      <div className="w-18 shrink-0">
                        <span className="text-[9.5px] font-bold text-slate-400 block mb-0.5 text-center">GIỜ CÔNG:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={sh.hours}
                          onChange={(e) => {
                            const updated = [...editingShifts];
                            updated[idx] = { ...sh, hours: parseFloat(e.target.value) || 0 };
                            setEditingShifts(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 text-center"
                        />
                      </div>

                      <div className="w-18 shrink-0">
                        <span className="text-[9.5px] font-bold text-slate-400 block mb-0.5 text-center">HỆ SỐ:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={sh.wageMultiplier || 1.0}
                          onChange={(e) => {
                            const updated = [...editingShifts];
                            updated[idx] = { ...sh, wageMultiplier: parseFloat(e.target.value) || 1.0 };
                            setEditingShifts(updated);
                          }}
                          className="w-full px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 text-center"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Box 3: Phạm vi áp dụng & Nhiệm vụ bàn giao */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Thiết lập phạm vi áp dụng
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Linh hoạt theo ngày & thứ
                </span>
              </div>

              {/* 1. Khoảng ngày áp dụng */}
              <div>
                <label className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider">
                  1. Khoảng ngày áp dụng:
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400">Từ ngày:</span>
                    <input
                      type="date"
                      value={structureStartDate}
                      onChange={(e) => setStructureStartDate(e.target.value)}
                      className="w-full mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[9.5px] font-bold text-slate-400">Đến ngày:</span>
                    <input
                      type="date"
                      value={structureEndDate}
                      onChange={(e) => setStructureEndDate(e.target.value)}
                      className="w-full mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-amber-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Áp dụng theo thứ trong tuần */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider">
                    2. Áp dụng theo thứ trong tuần:
                  </label>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
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
                      T2-T6
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setStructureDaysOfWeek(['T7', 'CN'])}
                      className="hover:underline cursor-pointer"
                    >
                      T7,CN
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 mt-1.5">
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
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Nhiệm vụ mẫu bàn giao cho ca */}
              <div>
                <label className="text-[10.5px] font-black uppercase text-slate-700 tracking-wider">
                  3. Nhiệm vụ mẫu bàn giao cho ca:
                </label>
                <div className="space-y-1.5 mt-1.5">
                  {structureTasks.map((t, idx) => {
                    const isChecked = selectedStructureTasks.includes(t);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition cursor-pointer ${
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
                        <span className="flex-1 text-xs font-semibold leading-tight">{t}</span>
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
                    placeholder="Thêm việc tùy biến..."
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
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition active:scale-95 cursor-pointer whitespace-nowrap shadow-xs shadow-amber-600/20"
                  >
                    Thêm việc
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tab Xóa ca hàng loạt */}
            <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="text-xs text-rose-900 leading-snug font-medium">
                <strong>Lưu ý:</strong> Chức năng này cho phép dọn sạch hoặc hủy hàng loạt các ca trực trên lịch theo khoảng ngày.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                1. Khoảng ngày cần xóa:
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Từ ngày:</span>
                  <input
                    type="date"
                    value={bulkDeleteStartDate}
                    onChange={(e) => setBulkDeleteStartDate(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400">Đến ngày:</span>
                  <input
                    type="date"
                    value={bulkDeleteEndDate}
                    onChange={(e) => setBulkDeleteEndDate(e.target.value)}
                    className="w-full mt-0.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                2. Chọn các khung ca cần xóa:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
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
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        checked
                          ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <div className="text-xs font-black truncate">{st.name.split(':')[0]}</div>
                        <div className="text-[10px] text-slate-500 font-bold truncate">{st.time}</div>
                      </div>
                      {checked ? (
                        <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                3. Hình thức xóa:
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
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
                    <span className="text-xs font-black">Xóa hoàn toàn</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Đóng ca, đưa về ô trống</span>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
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
                    <span className="text-xs font-black">Chỉ gỡ NV</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1">Giữ lại ô ca để đăng ký</span>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-2">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                4. Lý do điều chỉnh:
              </label>
              <input
                type="text"
                value={bulkDeleteReason}
                onChange={(e) => setBulkDeleteReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white"
                placeholder="Nhập lý do xóa..."
              />
            </div>
          </div>
        )}

        {/* Action Buttons ở chân màn hình */}
        <div className="pt-2 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => setShowBulkModal(false)}
            className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer text-center"
          >
            Hủy bỏ
          </button>

          {bulkTab === 'structure' ? (
            <button
              type="button"
              onClick={() => handleSaveShiftStructure(editingShifts)}
              className="flex-2 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Lưu & Áp dụng cơ cấu ca</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExecuteBulkDelete}
              className="flex-2 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xác nhận xóa hàng loạt</span>
            </button>
          )}
        </div>

        {/* Render Common Confirm Popup nếu có */}
        {renderCommonPopupModal()}
        {renderSuccessToast()}
      </div>
    );
  }

  // Render Notification Screen if active
  if (showNotificationModal) {
    return (
      <NotificationModal
        onBack={() => setShowNotificationModal(false)}
      />
    );
  }

  // Render Assign Staff Shift Screen if active (Màn hình phân công nhân viên - không modal)
  if (assigningShiftData) {
    return (
      <AssignStaffShiftView
        initialShiftType={assigningShiftData.shiftType}
        initialDate={assigningShiftData.date}
        standardShifts={standardShifts}
        employees={employees}
        existingShifts={effectiveShifts}
        weekDays={weekDays}
        targetShift={assigningShiftData.targetShift}
        onBack={() => setAssigningShiftData(null)}
        onConfirmAssign={(assignedShift) => {
          if (assigningShiftData.targetShift) {
            onUpdateShift?.(assignedShift);
          } else {
            const existing = effectiveShifts.find(
              (s) =>
                s.date === assignedShift.date &&
                s.shiftType === assignedShift.shiftType &&
                s.status !== 'cancelled'
            );
            if (existing) {
              onUpdateShift?.({ ...assignedShift, id: existing.id });
            } else {
              onAddShift?.(assignedShift);
            }
          }

          const cellKey = `${assignedShift.shiftType}-${assignedShift.date}`;
          setDeletedSlotsHistory((prev) => {
            const next = { ...prev };
            delete next[cellKey];
            return next;
          });

          setAssigningShiftData(null);
          const empName =
            assignedShift.employeeId === 'PENDING'
              ? 'mở ca trống'
              : `nhân viên ${assignedShift.employeeName}`;
          setSuccessToast(
            `Đã phân công ${empName} cho ${assignedShift.shiftName} ngày ${assignedShift.date.split('-').reverse().join('/')} thành công!`
          );
          setTimeout(() => setSuccessToast(null), 3500);
        }}
      />
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* 🟢 Top Badge & System Indicator */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {isAdmin ? 'QUẢN TRỊ LỊCH TRỰC' : 'LỊCH TRỰC NHÂN VIÊN'}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hôm nay: T6, 16/10/2026</span>
          </div>

          <button
            type="button"
            onClick={() => setShowNotificationModal(true)}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
            title="Thông báo hệ thống"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-600 ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* 🟢 Title & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
            {isAdmin ? (
              <>
                LỊCH TRỰC TUẦN <span className="text-emerald-600">& PHÂN CÔNG CA</span>
              </>
            ) : (
              <>
                LỊCH TRỰC TUẦN <span className="text-emerald-600">& ĐĂNG KÝ CA</span>
              </>
            )}
          </h1>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
            {isAdmin
              ? 'Theo dõi lịch trực nhân sự và giao nhiệm vụ công việc cho từng ca trực nhà thi đấu CourtX.'
              : 'Xem lịch trực cá nhân, kiểm tra nhiệm vụ ca và đăng ký các ca làm việc còn trống.'}
          </p>
        </div>
      </div>

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

        {/* Action buttons for admin */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 flex-wrap sm:ml-auto">
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs active:scale-95 transition cursor-pointer"
              title="Xuất Excel bảng phân ca"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingShifts(standardShifts);
                setStructureStartDate(weekDays[0]?.date || '2026-10-15');
                setStructureEndDate(weekDays[6]?.date || '2026-10-21');
                setStructureDaysOfWeek(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
                setBulkTab('structure');
                setShowBulkModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-2xs active:scale-95 transition cursor-pointer"
              title="Thay đổi cơ cấu khung ca của sân"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Đổi cơ cấu ca</span>
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

      {/* 🟢 BẢNG MA TRẬN PHÂN CA TUẦN */}
        <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm overflow-x-auto relative">
          <table className="w-full table-fixed min-w-[700px] text-left border-collapse">
            <colgroup>
              <col className="w-[84px] sm:w-[92px]" />
              {weekDays.map((d) => (
                <col key={d.date} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="sticky left-0 z-20 w-[84px] sm:w-[92px] p-1 border-b border-r border-slate-200 bg-slate-50 text-[9.5px] font-black text-slate-500 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] align-middle text-center">
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
                    {/* Sticky Left Column: Shift Info (Thu gọn bề ngang) */}
                    <td className="sticky left-0 z-10 w-[84px] sm:w-[92px] p-1 sm:p-1.5 border-b border-r border-slate-200 align-middle bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex flex-col items-center text-center gap-0.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${shiftRow.color}`}
                          title={shiftRow.name}
                        >
                          <shiftRow.icon className="w-3 h-3" />
                        </div>
                        <div className={`text-[11px] font-black leading-tight truncate w-full ${shiftRow.accentColor}`}>
                          {shiftRow.name.split(':')[0]}
                        </div>
                        <div
                          className="text-[9px] font-medium text-slate-600 leading-tight truncate w-full px-0.5"
                          title={shiftRow.name.split(':')[1]?.trim() || ''}
                        >
                          {shiftRow.name.split(':')[1]?.trim() || ''}
                        </div>
                        <div className="text-[8px] sm:text-[8.5px] text-slate-500 font-semibold leading-tight mt-0.5 whitespace-nowrap">
                          {shiftRow.time}
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

                      const displayShifts = allCellShifts;

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
                            <div
                              onClick={() => {
                                setSelectedShiftDetail(
                                  myShiftInCell || {
                                    id: `SH-${shiftRow.type}-${day.date}`,
                                    employeeId: 'NV01',
                                    employeeName: 'Nguyễn Văn An',
                                    date: day.date,
                                    dayOfWeek: day.day,
                                    shiftType: shiftRow.type,
                                    shiftName: shiftRow.name,
                                    timeRange: shiftRow.time,
                                    status: 'scheduled',
                                    courtArea: 'Toàn bộ 8 sân',
                                  }
                                );
                              }}
                              className="w-full h-full rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md p-1.5 flex flex-col justify-between text-center relative overflow-hidden min-h-[75px] min-w-0 cursor-pointer hover:brightness-105 transition active:scale-[0.99]"
                              title="Bấm để xem chi tiết ca trực của bạn"
                            >
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
                                onClick={(e) => {
                                  e.stopPropagation();
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
                            /* Case 2: Assigned Shift(s) in cell - Bấm vào cục ca trực để hiện thông tin chi tiết */
                            <div className="flex flex-col gap-1 w-full h-full justify-center min-w-0 overflow-hidden">
                              {displayShifts.map((s) => (
                                <div
                                  key={s.id}
                                  onClick={() => setSelectedShiftDetail(s)}
                                  className="group relative flex flex-col gap-1 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 hover:border-emerald-400 hover:shadow-xs rounded-xl p-1.5 shadow-2xs transition min-w-0 overflow-hidden cursor-pointer active:scale-[0.99]"
                                  title="Nhấn để xem chi tiết ca trực này"
                                >
                                  {/* Staff info row */}
                                  <div className="flex items-center justify-between gap-1 min-w-0">
                                    <div className="flex items-center gap-1 min-w-0 flex-1">
                                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[9px] font-black shrink-0">
                                        {s.employeeName.charAt(0)}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-bold text-slate-800 truncate leading-tight" title={s.employeeName}>
                                          {s.employeeName}
                                        </p>
                                        {s.courtArea && (
                                          <p className="text-[8px] text-slate-400 font-medium truncate leading-tight" title={s.courtArea}>
                                            {s.courtArea}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Admin Action: Xóa nhân viên khỏi ca trực (Hủy phân công) */}
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
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

                                  {/* Nếu là ca chờ nhận người thì Admin có thể bấm Phân công nhân viên */}
                                  {isAdmin && s.employeeId === 'PENDING' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAssignShift(shiftRow.type, day.date, s);
                                      }}
                                      className="w-full mt-0.5 py-0.5 text-[9px] font-black text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 rounded-md transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                                      title="Phân công nhân viên cho ca trực này"
                                    >
                                      <UserCheck className="w-2.5 h-2.5" />
                                      <span>Phân công NV</span>
                                    </button>
                                  )}

                                  {/* Admin Nút Dấu Cộng: Thêm công việc cho ca đó */}
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenAddTaskModal(shiftRow.type, day.date, s);
                                      }}
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
                                    onClick={() => handleOpenAssignShift(shiftRow.type, day.date)}
                                    className="mt-0.5 py-0.5 px-2 bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 font-black text-[8.5px] rounded-lg border border-emerald-300 shadow-2xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-0.5"
                                    title="Phân công lại ca trực cho khung giờ này"
                                  >
                                    <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
                                    <span>Phân công lại</span>
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
                                  onClick={() => handleOpenAssignShift(shiftRow.type, day.date)}
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
      {/* 🟢 KHU VỰC THÔNG TIN: QUY CHUẨN 3 KHUNG CA */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight">
            Quy chuẩn các khung ca trực tại Nhà thi đấu CourtX
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



      {/* 🟢 MODAL CHI TIẾT CA TRỰC (KHI BẤM VÀO CỤC CA TRỰC) */}
      {renderShiftDetailModal()}

      {/* 🟣 POPUP THÔNG BÁO & XÁC NHẬN CHUNG (THEO THIẾT KẾ CHUẨN) */}
      {renderCommonPopupModal()}

      {/* 🟢 Toast thông báo thành công */}
      {renderSuccessToast()}
    </div>
  );
}
