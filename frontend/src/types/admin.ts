export interface Employee {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarText: string;
  avatarBg: string;
  avatarImage?: string;
  status: 'active' | 'inactive'; // Đang hoạt động / Ngừng hoạt động
  role: string;
  joinDate: string;
  currentShift?: {
    type: 'morning' | 'afternoon' | 'evening';
    title: string;
    time: string;
    status: 'working' | 'upcoming' | 'completed' | 'off';
    statusLabel: string;
  };
  schedule5Days: {
    dayLabel: string;
    date: string;
    shiftName?: string;
    time?: string;
    status: 'working' | 'scheduled' | 'off';
    statusLabel: string;
  }[];
}

export interface ShiftRegistration {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  shiftType: 'Ca 1' | 'Ca 2' | 'Ca 3' | string;
  shiftName: string;
  timeRange: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cancelReason?: string;
  courtArea?: string;
  notes?: string;
  taskDescription?: string;
  tasks?: string[];
}

export interface Transaction {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  type: 'booking' | 'refund';
  status: 'success' | 'pending_refund' | 'refunded';
  statusLabel: string;
  date: string;
  courtInfo: string;
  timeSlot: string;
  bankRef: string;
  ticketCode: string;
  refundReason?: string;
  refundProof?: string;
}

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'NV01',
    name: 'Nguyễn Văn An',
    phone: '0901 234 567',
    email: 'an.nguyen@example.com',
    avatarText: 'AN',
    avatarBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    avatarImage: '/images/hero_arena.jpg',
    status: 'active',
    role: 'Nhân viên vận hành sân COURTX',
    joinDate: '15/08/2026',
    currentShift: {
      type: 'afternoon',
      title: 'Ca 2: Chiều & Giải đấu',
      time: '11:00 - 17:00',
      status: 'working',
      statusLabel: 'ĐANG TRỰC'
    },
    schedule5Days: [
      { dayLabel: 'Hôm nay (16/10)', date: '16/10', shiftName: 'Ca 2: Chiều', time: '11:00 - 17:00', status: 'working', statusLabel: 'Đang trực' },
      { dayLabel: 'Ngày mai (17/10)', date: '17/10', shiftName: 'Nghỉ ca', time: '', status: 'off', statusLabel: 'Nghỉ ca' },
      { dayLabel: 'Chủ Nhật (18/10)', date: '18/10', shiftName: 'Ca 3: Tối', time: '17:00 - 23:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
      { dayLabel: 'Thứ Hai (19/10)', date: '19/10', shiftName: 'Nghỉ ca', time: '', status: 'off', statusLabel: 'Nghỉ ca' },
      { dayLabel: 'Thứ Ba (20/10)', date: '20/10', shiftName: 'Ca 1: Sáng', time: '05:00 - 11:00', status: 'scheduled', statusLabel: 'Đã phân ca' }
    ]
  },
  {
    id: 'NV02',
    name: 'Trần Thị Bình',
    phone: '0908 765 432',
    email: 'binh.tran@example.com',
    avatarText: 'TB',
    avatarBg: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    status: 'active',
    role: 'Nhân viên lễ tân & chăm sóc khách',
    joinDate: '01/09/2026',
    currentShift: {
      type: 'morning',
      title: 'Ca 1: Sáng sớm',
      time: '05:00 - 11:00',
      status: 'working',
      statusLabel: 'HOÀN THÀNH'
    },
    schedule5Days: []
  },
  {
    id: 'NV03',
    name: 'Lê Hoàng Long',
    phone: '0988 123 456',
    email: 'long.le@example.com',
    avatarText: 'HL',
    avatarBg: 'bg-blue-100 text-blue-800 border-blue-300',
    status: 'active',
    role: 'Quản lý bảo trì sân',
    joinDate: '20/07/2026',
    currentShift: {
      type: 'evening',
      title: 'Ca 3: Tối Giờ Vàng',
      time: '17:00 - 23:00',
      status: 'upcoming',
      statusLabel: 'SẮP TỚI'
    },
    schedule5Days: []
  },
  {
    id: 'NV04',
    name: 'Phạm Thu Trà',
    phone: '0911 555 666',
    email: 'tra.pham@example.com',
    avatarText: 'TT',
    avatarBg: 'bg-pink-100 text-pink-800 border-pink-300',
    status: 'inactive',
    role: 'Nhân viên phục vụ',
    joinDate: '05/10/2025',
    schedule5Days: []
  },
  {
    id: 'NV05',
    name: 'Hoàng Công Tiến',
    phone: '0903 888 999',
    email: 'tien.hoang@example.com',
    avatarText: 'CT',
    avatarBg: 'bg-orange-100 text-orange-800 border-orange-300',
    status: 'active',
    role: 'Nhân viên bảo vệ',
    joinDate: '10/01/2024',
    schedule5Days: []
  }
];

export const INITIAL_SHIFTS: ShiftRegistration[] = [
  // --- TUẦN 15/10 - 21/10/2026 (KHUNG GIỜ HOẠT ĐỘNG: 05:00 - 23:00) ---
  // Thứ 5 (15/10/2026)
  {
    id: 'SH-15-1',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-15',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '05:00 - 11:00',
    status: 'completed',
    courtArea: 'Cụm Sân 01 - 04',
    taskDescription: 'Mở cửa sân lúc 05:00, bật điện chiếu sáng, đón khách tập sáng'
  },
  {
    id: 'SH-15-2',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-15',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'completed',
    courtArea: 'Cụm Sân 05 - 08',
    taskDescription: 'Trực các giải đấu mini & chuẩn bị sân'
  },
  {
    id: 'SH-15-3',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-15',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'completed',
    courtArea: 'Toàn bộ 8 sân',
    taskDescription: 'Giờ vàng các CLB, chạy máy lau sàn Karcher, đóng sân lúc 23:00'
  },

  // Thứ 6 (16/10/2026 - Hôm nay)
  {
    id: 'SH-16-1',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-16',
    dayOfWeek: 'Thứ 6',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '05:00 - 11:00',
    status: 'completed',
    courtArea: 'Cụm Sân 01 - 04',
    taskDescription: 'Mở cửa lúc 05:00, đón khách ca sáng, kiểm tra vệ sinh sàn'
  },
  {
    id: 'SH-16-2',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-16',
    dayOfWeek: 'Thứ 6',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'in_progress',
    courtArea: 'Cụm Sân 01 - 04 & Thiết bị kho',
    taskDescription: 'Trực giải đấu mini Pickleball, điều phối thiết bị lưu động'
  },
  {
    id: 'SH-16-3',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-16',
    dayOfWeek: 'Thứ 6',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'scheduled',
    courtArea: 'Toàn bộ 8 sân',
    taskDescription: 'Giờ cao điểm các CLB, kiểm tra bảo dưỡng thảm sân, đóng cửa 23:00'
  },

  // Thứ 7 (17/10/2026)
  {
    id: 'SH-17-1',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-17',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-17-2',
    employeeId: 'NV05',
    employeeName: 'Hoàng Công Tiến',
    date: '2026-10-17',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 05 - 08'
  },

  // Chủ Nhật (18/10/2026)
  {
    id: 'SH-18-1',
    employeeId: 'NV04',
    employeeName: 'Phạm Thu Trà',
    date: '2026-10-18',
    dayOfWeek: 'Chủ Nhật',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-18-2',
    employeeId: 'NV05',
    employeeName: 'Hoàng Công Tiến',
    date: '2026-10-18',
    dayOfWeek: 'Chủ Nhật',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-18-3',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-18',
    dayOfWeek: 'Chủ Nhật',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'scheduled',
    courtArea: 'Toàn bộ 8 sân',
    taskDescription: 'Tổng vệ sinh cuối tuần, kiểm kê kho thiết bị, đóng cửa 23:00'
  },

  // Thứ 2 (19/10/2026)
  {
    id: 'SH-19-1',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-19',
    dayOfWeek: 'Thứ 2',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-19-2',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-19',
    dayOfWeek: 'Thứ 2',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 05 - 08'
  },

  // Thứ 3 (20/10/2026)
  {
    id: 'SH-20-1',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-20',
    dayOfWeek: 'Thứ 3',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04',
    taskDescription: 'Mở cửa ca sáng lúc 05:00, phục vụ lớp Pickleball thiếu nhi'
  },
  {
    id: 'SH-20-2',
    employeeId: 'NV04',
    employeeName: 'Phạm Thu Trà',
    date: '2026-10-20',
    dayOfWeek: 'Thứ 3',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-20-3',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-20',
    dayOfWeek: 'Thứ 3',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'scheduled',
    courtArea: 'Toàn bộ 8 sân'
  },

  // Thứ 4 (21/10/2026)
  {
    id: 'SH-21-1',
    employeeId: 'NV04',
    employeeName: 'Phạm Thu Trà',
    date: '2026-10-21',
    dayOfWeek: 'Thứ 4',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-21-2',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-21',
    dayOfWeek: 'Thứ 4',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 05 - 08'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX01',
    code: '#TX-2024-9182',
    customerName: 'Hoàng Minh Đức',
    customerPhone: '0933 112 889',
    amount: 180000,
    type: 'refund',
    status: 'pending_refund',
    statusLabel: 'Chờ duyệt hoàn tiền VietQR',
    date: '01/10/2026 14:20',
    courtInfo: 'Cầu lông - Sân 03',
    timeSlot: '02/10/2026 · 18:00 - 19:30',
    bankRef: 'FT2427519920188',
    ticketCode: '#CX-88291',
    refundReason: 'Khách hủy vé trước >24h theo chính sách hoàn cọc 100%'
  },
  {
    id: 'TX02',
    code: '#TX-2024-9180',
    customerName: 'Đoàn Văn A',
    customerPhone: '0912 345 678',
    amount: 320000,
    type: 'booking',
    status: 'success',
    statusLabel: 'Thành công (Đã ghi nhận)',
    date: '01/10/2026 09:15',
    courtInfo: 'Bóng chuyền 1 (Gộp sân 1-4)',
    timeSlot: '01/10/2026 · 14:00 - 16:00',
    bankRef: 'FT24298177263011',
    ticketCode: '#APX-8921'
  },
  {
    id: 'TX03',
    code: '#TX-2024-9175',
    customerName: 'FC Vô Địch',
    customerPhone: '0978 889 999',
    amount: 960000,
    type: 'booking',
    status: 'success',
    statusLabel: 'Thành công (Đã cọc)',
    date: '01/10/2026 08:30',
    courtInfo: 'Bóng đá Full mặt sân (Sân 1-8)',
    timeSlot: '01/10/2026 · 17:00 - 19:00',
    bankRef: 'FT2429816550293',
    ticketCode: '#SOC-3912'
  }
];

// ==========================================
// CƠ SỞ VẬT CHẤT & THIẾT BỊ (FACILITY & ASSET)
// ==========================================

export type EquipmentCategory = 'tru_luoi' | 'tham_san' | 'chieu_sang' | 'dung_cu' | 've_sinh';
export type EquipmentStatus = 'san_sang' | 'dang_su_dung' | 'bao_tri' | 'hong';
export type EquipmentSportType = 'CauLong' | 'BongChuyen' | 'BongDa' | 'DungChung' | 'Pickleball';

export interface FacilityEquipment {
  id: string;               // EQ01, EQ02...
  code: string;             // MATB-01, MATB-02... (Mã thiết bị dán nhãn cố định)
  name: string;             // Bộ trụ & Lưới Yonex Pro, Thảm sàn Vinyl...
  category: EquipmentCategory;
  categoryLabel: string;    // Trụ & Lưới, Mặt thảm, Chiếu sáng, Dụng cụ, Vệ sinh
  sportType: EquipmentSportType;
  currentLocation: string;  // Sân 01, Sân 02, Sân 03, Sân 04, Sân 05, Sân 06, Sân 07, Sân 08, Kho chung (Lưu động linh hoạt)
  status: EquipmentStatus;
  statusLabel: string;      // Sẵn sàng, Đang sử dụng, Bảo trì, Hỏng
  healthRate: string;       // Mới 95%, Tốt, Cần bảo trì ngay, Đạt 500 Lux...
  purchaseDate: string;     // Ngày nhập
  warrantyExpire: string;   // Hạn bảo hành
  lastMaintenance?: string; // Ngày bảo dưỡng gần nhất
  notes?: string;

  // Ghi nhận ca đặt & checkout thiết bị lưu động:
  assignedBookingCode?: string; // Ví dụ: 'BK-8491'
  assignedTimeSlot?: string;    // Ví dụ: '06:00 - 07:30'
  assignedCustomer?: string;    // Ví dụ: 'Anh Tuấn Hưng'
  assignedCourt?: string;       // Sân 01
}

export interface CourtStatusItem {
  id: string;               // SAN-01 .. SAN-08
  courtNumber: number;      // 1 .. 8
  name: string;             // Sân 01 (Tiêu chuẩn A), Sân 03 (Trong nhà VIP)...
  isLocked: boolean;        // true = Đang khóa bảo trì, false = Đang mở
  lockReason?: string;      // Sửa thảm & đèn, Thay lưới...
  lockedAt?: string;
  lockedBy?: string;
}

export interface IncidentDamageItem {
  id: string;
  equipmentCode?: string;   // MATB-02
  title: string;
  riskBadge: string;        // Nguy cơ cao, Cần căn chỉnh, Hỏng nhẹ
  riskColor: 'rose' | 'amber' | 'blue' | 'slate';
  description: string;
  imageLabel?: string;      // Hiện trường góc giao bóng
  imageUrl?: string;        // /images/court_vinyl_damage.jpg
}

export interface IncidentTimelineLog {
  id: string;
  time: string;             // 08:00
  title: string;            // Tiếp nhận & chuẩn bị vật tư dán nhiệt
  description: string;
  active?: boolean;
}

export interface FacilityIncident {
  id: string;               // SC-2024-8921 / SC-8921
  courtId?: string;
  courtName: string;        // Sân 03 (Trong nhà VIP)
  courtZone?: string;       // Khu A
  courtSubtype?: string;    // Sân Cầu Lông Tiêu Chuẩn Quốc Tế
  isCourtLocked?: boolean;
  equipmentCode?: string;   // MATB-02
  equipmentName?: string;
  title: string;
  description: string;
  severity: 'khan_cap' | 'trung_binh' | 'thap';
  severityLabel: string;    // Khẩn cấp, Trung bình, Thấp
  status: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc';
  statusLabel: string;      // Chờ xử lý, Đang sửa chữa, Đã khắc phục
  reportedAt: string;       // 07:15 • 24/10/2024
  reporterName: string;     // Nguyễn Văn An
  reporterRole?: string;    // Nhân viên trực ca 1 • 05:00 - 11:00
  reporterPhone?: string;   // 0912.345.678
  damageItems?: IncidentDamageItem[];
  timelineLogs?: IncidentTimelineLog[];
  technicianNote?: string;
}

export const INITIAL_COURT_STATUSES: CourtStatusItem[] = [
  { id: 'SAN-01', courtNumber: 1, name: 'Sân 01 (Tiêu chuẩn A)', isLocked: false },
  { id: 'SAN-02', courtNumber: 2, name: 'Sân 02 (Tiêu chuẩn A)', isLocked: false },
  { id: 'SAN-03', courtNumber: 3, name: 'Sân 03 (Trong nhà VIP)', isLocked: true, lockReason: 'Sửa thảm & đèn', lockedAt: '14:20 Hôm nay', lockedBy: 'Nguyễn Văn An' },
  { id: 'SAN-04', courtNumber: 4, name: 'Sân 04 (Tiêu chuẩn B)', isLocked: false },
  { id: 'SAN-05', courtNumber: 5, name: 'Sân 05 (Tiêu chuẩn B)', isLocked: false },
  { id: 'SAN-06', courtNumber: 6, name: 'Sân 06 (Tiêu chuẩn B)', isLocked: false },
  { id: 'SAN-07', courtNumber: 7, name: 'Sân 07 (Tiêu chuẩn A)', isLocked: false },
  { id: 'SAN-08', courtNumber: 8, name: 'Sân 08 (Tiêu chuẩn A)', isLocked: false },
];

export const INITIAL_EQUIPMENT: FacilityEquipment[] = [
  // --- SÂN 01 ---
  {
    id: 'EQ01',
    code: 'MATB-01',
    name: 'Bộ trụ & Lưới Yonex Pro di động',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'CauLong',
    currentLocation: 'Sân 01',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Mới 95%)',
    purchaseDate: '15/01/2026',
    warrantyExpire: '15/01/2028',
    lastMaintenance: '01/10/2026',
    notes: 'Bộ trụ đế gang bánh xe di động, dây cáp căng đều',
    assignedBookingCode: 'BK-8491',
    assignedTimeSlot: '06:00 - 07:30',
    assignedCustomer: 'Anh Tuấn Hưng',
    assignedCourt: 'Sân 01'
  },
  {
    id: 'EQ09',
    code: 'MATB-09',
    name: 'Ghế trọng tài hợp kim nhôm',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'CauLong',
    currentLocation: 'Sân 01',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '15/01/2026',
    warrantyExpire: '15/01/2028',
    notes: 'Chiều cao ghế 1.55m, đệm ngồi êm ái',
    assignedBookingCode: 'BK-8491',
    assignedTimeSlot: '06:00 - 07:30',
    assignedCustomer: 'Anh Tuấn Hưng',
    assignedCourt: 'Sân 01'
  },
  {
    id: 'EQ11',
    code: 'MATB-11',
    name: 'Thảm sàn Vinyl BWF 4.5mm Court 1',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'CauLong',
    currentLocation: 'Sân 01',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Mới 98%)',
    purchaseDate: '15/01/2026',
    warrantyExpire: '15/01/2029',
    notes: 'Mặt thảm xanh ngọc tiêu chuẩn giải trẻ quốc gia'
  },
  {
    id: 'EQ12',
    code: 'MATB-12',
    name: 'Dàn đèn LED Chống lóa 500 Lux Line 1',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Sân 01',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Đạt 520 Lux)',
    purchaseDate: '10/02/2026',
    warrantyExpire: '10/02/2029'
  },

  // --- SÂN 02 ---
  {
    id: 'EQ03',
    code: 'MATB-03',
    name: 'Bảng điểm lật tay kim loại 2 mặt',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Sân 02',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '20/02/2026',
    warrantyExpire: '20/02/2027',
    notes: 'Bảng 2 mặt số chuẩn thi đấu',
    assignedBookingCode: 'BK-8492',
    assignedTimeSlot: '07:30 - 09:00',
    assignedCustomer: 'Nguyễn Hoàng Nam',
    assignedCourt: 'Sân 02'
  },
  {
    id: 'EQ13',
    code: 'MATB-13',
    name: 'Bộ trụ & Lưới Victor Master di động',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'CauLong',
    currentLocation: 'Sân 02',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '20/02/2026',
    warrantyExpire: '20/02/2028',
    assignedBookingCode: 'BK-8492',
    assignedTimeSlot: '07:30 - 09:00',
    assignedCustomer: 'Nguyễn Hoàng Nam',
    assignedCourt: 'Sân 02'
  },
  {
    id: 'EQ14',
    code: 'MATB-14',
    name: 'Thảm sàn Vinyl BWF 4.5mm Court 2',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'CauLong',
    currentLocation: 'Sân 02',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (96%)',
    purchaseDate: '20/02/2026',
    warrantyExpire: '20/02/2029'
  },
  {
    id: 'EQ15',
    code: 'MATB-15',
    name: 'Dàn đèn LED Chống lóa 500 Lux Line 2',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Sân 02',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (510 Lux)',
    purchaseDate: '20/02/2026',
    warrantyExpire: '20/02/2029'
  },

  // --- SÂN 03 (VIP ĐANG BẢO TRÌ) ---
  {
    id: 'EQ02',
    code: 'MATB-02',
    name: 'Thảm sàn Vinyl BWF 4.5mm Court 3',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'CauLong',
    currentLocation: 'Sân 03',
    status: 'bao_tri',
    statusLabel: 'Bảo trì',
    healthRate: 'Cần bảo trì ngay',
    purchaseDate: '10/08/2025',
    warrantyExpire: '10/08/2028',
    lastMaintenance: '15/09/2026',
    notes: 'Bong mép dán góc chữ T, kỹ thuật viên đang xử lý keo nóng'
  },
  {
    id: 'EQ08',
    code: 'MATB-08',
    name: 'Đèn LED Chống lóa 200W Line 2 Sân 3',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Sân 03',
    status: 'bao_tri',
    statusLabel: 'Bảo trì',
    healthRate: 'Chập chờn tụ điện',
    purchaseDate: '01/03/2026',
    warrantyExpire: '01/03/2029',
    notes: 'Đang chờ kỹ thuật viên thay thế tụ kích điện'
  },
  {
    id: 'EQ16',
    code: 'MATB-16',
    name: 'Bộ trụ & Lưới Lining Carbon di động',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'CauLong',
    currentLocation: 'Sân 03',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '01/03/2026',
    warrantyExpire: '01/03/2028'
  },
  {
    id: 'EQ17',
    code: 'MATB-17',
    name: 'Bảng điểm điện tử LED hiển thị số',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Sân 03',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Mới 99%)',
    purchaseDate: '01/03/2026',
    warrantyExpire: '01/03/2028'
  },

  // --- SÂN 04 ---
  {
    id: 'EQ04',
    code: 'MATB-04',
    name: 'Đèn LED Chống lóa 200W Sân 4',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Sân 04',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Đạt 500 Lux)',
    purchaseDate: '01/03/2026',
    warrantyExpire: '01/03/2029',
    notes: 'Dàn 8 bóng Line 1 hoạt động ổn định'
  },
  {
    id: 'EQ18',
    code: 'MATB-18',
    name: 'Bộ trụ & Lưới Yonex Pro Court 4',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'CauLong',
    currentLocation: 'Sân 04',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (95%)',
    purchaseDate: '01/03/2026',
    warrantyExpire: '01/03/2028',
    assignedBookingCode: 'BK-8495',
    assignedTimeSlot: '15:00 - 17:00',
    assignedCustomer: 'CLB Cầu Lông Trẻ',
    assignedCourt: 'Sân 04'
  },
  {
    id: 'EQ19',
    code: 'MATB-19',
    name: 'Thảm sàn Vinyl BWF 4.5mm Court 4',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'CauLong',
    currentLocation: 'Sân 04',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '01/03/2026',
    warrantyExpire: '01/03/2029'
  },
  {
    id: 'EQ20',
    code: 'MATB-20',
    name: 'Bảng điểm lật tay số to Sân 4',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Sân 04',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '01/03/2026',
    warrantyExpire: '01/03/2027'
  },

  // --- SÂN 05 (PICKLEBALL / ĐA NĂNG) ---
  {
    id: 'EQ21',
    code: 'MATB-21',
    name: 'Bộ cột & Lưới Pickleball di động chân chữ T',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'Pickleball',
    currentLocation: 'Sân 05',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Mới 98%',
    purchaseDate: '10/03/2026',
    warrantyExpire: '10/03/2028',
    assignedBookingCode: 'BK-8501',
    assignedTimeSlot: '17:00 - 18:30',
    assignedCustomer: 'Trần Quang Đăng',
    assignedCourt: 'Sân 05'
  },
  {
    id: 'EQ22',
    code: 'MATB-22',
    name: 'Thảm sàn PVC thể thao giảm chấn 6mm Sân 5',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'Pickleball',
    currentLocation: 'Sân 05',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Mới 99%)',
    purchaseDate: '10/03/2026',
    warrantyExpire: '10/03/2029'
  },
  {
    id: 'EQ23',
    code: 'MATB-23',
    name: 'Dàn đèn LED 400 Lux Sân 5',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Sân 05',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (450 Lux)',
    purchaseDate: '10/03/2026',
    warrantyExpire: '10/03/2029'
  },

  // --- SÂN 06 (PICKLEBALL / ĐA NĂNG) ---
  {
    id: 'EQ24',
    code: 'MATB-24',
    name: 'Bộ cột & Lưới Pickleball tiêu chuẩn USAPA',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'Pickleball',
    currentLocation: 'Sân 06',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Mới 95%',
    purchaseDate: '10/03/2026',
    warrantyExpire: '10/03/2028'
  },
  {
    id: 'EQ25',
    code: 'MATB-25',
    name: 'Thảm sàn PVC thể thao giảm chấn 6mm Sân 6',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'Pickleball',
    currentLocation: 'Sân 06',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '10/03/2026',
    warrantyExpire: '10/03/2029'
  },
  {
    id: 'EQ26',
    code: 'MATB-26',
    name: 'Dàn đèn LED 400 Lux Sân 6',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Sân 06',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (460 Lux)',
    purchaseDate: '10/03/2026',
    warrantyExpire: '10/03/2029'
  },
  {
    id: 'EQ27',
    code: 'MATB-27',
    name: 'Ghế nghỉ VĐV hợp kim nhôm 4 chỗ Sân 6',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Sân 06',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '10/03/2026',
    warrantyExpire: '10/03/2028'
  },

  // --- SÂN 07 ---
  {
    id: 'EQ28',
    code: 'MATB-28',
    name: 'Bộ trụ & Lưới Cầu lông thi đấu Yonex Pro Court 7',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'CauLong',
    currentLocation: 'Sân 07',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Mới 96%)',
    purchaseDate: '15/03/2026',
    warrantyExpire: '15/03/2028'
  },
  {
    id: 'EQ29',
    code: 'MATB-29',
    name: 'Thảm sàn Vinyl BWF 4.5mm Court 7',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'CauLong',
    currentLocation: 'Sân 07',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '15/03/2026',
    warrantyExpire: '15/03/2029'
  },
  {
    id: 'EQ30',
    code: 'MATB-30',
    name: 'Dàn đèn LED Chống lóa 500 Lux Sân 7',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Sân 07',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Đạt 515 Lux)',
    purchaseDate: '15/03/2026',
    warrantyExpire: '15/03/2029'
  },
  {
    id: 'EQ31',
    code: 'MATB-31',
    name: 'Bảng lật số điểm kim loại Sân 7',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Sân 07',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '15/03/2026',
    warrantyExpire: '15/03/2027'
  },

  // --- SÂN 08 ---
  {
    id: 'EQ32',
    code: 'MATB-32',
    name: 'Bộ trụ & Lưới Cầu lông thi đấu Yonex Pro Court 8',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'CauLong',
    currentLocation: 'Sân 08',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Mới 95%)',
    purchaseDate: '15/03/2026',
    warrantyExpire: '15/03/2028'
  },
  {
    id: 'EQ33',
    code: 'MATB-33',
    name: 'Thảm sàn Vinyl BWF 4.5mm Court 8',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'CauLong',
    currentLocation: 'Sân 08',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '15/03/2026',
    warrantyExpire: '15/03/2029'
  },
  {
    id: 'EQ34',
    code: 'MATB-34',
    name: 'Dàn đèn LED Chống lóa 500 Lux Sân 8',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Sân 08',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt (Đạt 510 Lux)',
    purchaseDate: '15/03/2026',
    warrantyExpire: '15/03/2029'
  },
  {
    id: 'EQ35',
    code: 'MATB-35',
    name: 'Thùng chứa cầu tập luyện & bóng inox Sân 8',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Sân 08',
    status: 'dang_su_dung',
    statusLabel: 'Đang sử dụng',
    healthRate: 'Tốt',
    purchaseDate: '15/03/2026',
    warrantyExpire: '15/03/2028'
  },

  // --- KHO CHUNG (THIẾT BỊ CƠ ĐỘNG LƯU ĐỘNG) ---
  {
    id: 'EQ05',
    code: 'MATB-05',
    name: 'Máy lau sàn tự động Karcher BR 30/4C',
    category: 've_sinh',
    categoryLabel: 'Vệ sinh',
    sportType: 'DungChung',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Sẵn sàng điều phối',
    purchaseDate: '05/01/2026',
    warrantyExpire: '05/01/2028',
    lastMaintenance: '28/09/2026',
    notes: 'Đã sạc đầy pin 100%, sẵn sàng vệ sinh sau mỗi hiệp'
  },
  {
    id: 'EQ06',
    code: 'MATB-06',
    name: 'Cột & Lưới bóng chuyền di động tăng đơ',
    category: 'tru_luoi',
    categoryLabel: 'Trụ & Lưới',
    sportType: 'BongChuyen',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Mới 90%',
    purchaseDate: '12/12/2025',
    warrantyExpire: '12/12/2027',
    notes: 'Cột tăng giảm độ cao thi đấu nam/nữ, lưu kho sẵn sàng điều phối ra cụm 1-4'
  },
  {
    id: 'EQ07',
    code: 'MATB-07',
    name: 'Cặp khung thành mini di động (2 cái)',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'BongDa',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Tốt',
    purchaseDate: '01/11/2025',
    warrantyExpire: '01/11/2027',
    notes: 'Khung nhôm sơn tĩnh điện có bánh xe đẩy, phục vụ gộp cả 8 ô sân'
  },
  {
    id: 'EQ10',
    code: 'MATB-10',
    name: 'Xe đẩy thu gom cầu & bóng 2 tầng',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Mới 98%',
    purchaseDate: '25/03/2026',
    warrantyExpire: '25/03/2027',
    notes: 'Giỏ thép chứa tối đa 200 quả cầu'
  },
  {
    id: 'EQ36',
    code: 'MATB-36',
    name: 'Máy bắn cầu tự động thông minh Robot S202',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'CauLong',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Mới 99%',
    purchaseDate: '01/04/2026',
    warrantyExpire: '01/04/2028',
    notes: 'Máy điều khiển từ xa, hỗ trợ huấn luyện viên và khách thuê tập'
  },
  {
    id: 'EQ37',
    code: 'MATB-37',
    name: 'Bộ quạt thổi công nghiệp làm mát di động (4 máy)',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Tốt',
    purchaseDate: '15/02/2026',
    warrantyExpire: '15/02/2028'
  },
  {
    id: 'EQ38',
    code: 'MATB-38',
    name: 'Bộ còi, cờ biên & thẻ phạt trọng tài BWF',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Mới 100%',
    purchaseDate: '01/02/2026',
    warrantyExpire: '01/02/2027'
  },
  {
    id: 'EQ39',
    code: 'MATB-39',
    name: 'Cuộn thảm sàn Vinyl dự phòng 15m x 1.8m',
    category: 'tham_san',
    categoryLabel: 'Mặt thảm',
    sportType: 'CauLong',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Mới 100%',
    purchaseDate: '15/01/2026',
    warrantyExpire: '15/01/2029',
    notes: 'Thảm dự phòng phục vụ vá đè hoặc dán mở rộng'
  },
  {
    id: 'EQ40',
    code: 'MATB-40',
    name: 'Dàn bóng LED chống lóa dự phòng (6 bóng)',
    category: 'chieu_sang',
    categoryLabel: 'Chiếu sáng',
    sportType: 'DungChung',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Mới 100%',
    purchaseDate: '01/03/2026',
    warrantyExpire: '01/03/2029'
  },
  {
    id: 'EQ41',
    code: 'MATB-41',
    name: 'Thang nhôm rút chữ A phục vụ sửa đèn trần',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Tốt',
    purchaseDate: '10/01/2026',
    warrantyExpire: '10/01/2028'
  },
  {
    id: 'EQ42',
    code: 'MATB-42',
    name: 'Túi cứu thương y tế & nẹp chấn thương thể thao',
    category: 'dung_cu',
    categoryLabel: 'Dụng cụ',
    sportType: 'DungChung',
    currentLocation: 'Kho chung',
    status: 'san_sang',
    statusLabel: 'Sẵn sàng',
    healthRate: 'Đầy đủ vật tư',
    purchaseDate: '01/04/2026',
    warrantyExpire: '01/04/2027'
  }
];

export const INITIAL_INCIDENTS: FacilityIncident[] = [
  {
    id: 'SC-8921',
    courtId: 'SAN-03',
    courtName: 'Sân 03 (Trong nhà VIP)',
    courtZone: 'Khu A',
    courtSubtype: 'Sân Cầu Lông Tiêu Chuẩn Quốc Tế',
    isCourtLocked: true,
    equipmentCode: 'MATB-02',
    equipmentName: 'Thảm sàn Vinyl BWF 4.5mm',
    title: 'Sân 03 - Thảm Vinyl bong mép dán & Đèn LED Line 2 chập chờn',
    description: 'Đã điều kỹ thuật viên xử lý keo nóng và kiểm tra tụ điện trần Line 2 để bảo đảm an toàn cho các hiệp đấu tối.',
    severity: 'khan_cap',
    severityLabel: 'Khẩn cấp',
    status: 'dang_sua_chua',
    statusLabel: 'Đang sửa chữa',
    reportedAt: '07:15 • 24/10/2024',
    reporterName: 'Nguyễn Văn An',
    reporterRole: 'Nhân viên trực ca 1 • 05:00 - 11:00',
    reporterPhone: '0912.345.678',
    damageItems: [
      {
        id: 'DM-01',
        equipmentCode: 'MATB-02',
        title: 'Thảm Vinyl chuyên dụng 5 lớp',
        riskBadge: 'Nguy cơ cao',
        riskColor: 'rose',
        description: 'Bong mép dán 40cm khu vực góc giao bóng bên phải. Gờ cong vênh 1.5cm có thể gây vấp ngã hoặc rách dây chằng khi vận động viên di chuyển phanh gấp.',
        imageLabel: 'Hiện trường góc giao bóng',
        imageUrl: '/images/court_vinyl_damage.jpg'
      },
      {
        id: 'DM-02',
        equipmentCode: 'MATB-08',
        title: 'Hệ đèn LED 1000 Lux Line 2',
        riskBadge: 'Cần căn chỉnh',
        riskColor: 'blue',
        description: 'Nhấp nháy chập chờn do lỏng giắc cắm nguồn trần trên giàn đỡ số 2, gây chói mắt và không đủ chuẩn độ rọi tổ chức thi đấu.',
        imageLabel: 'Mô-đun đèn LED nhấp nháy',
        imageUrl: '/images/court_led_lights.jpg'
      }
    ],
    timelineLogs: [
      {
        id: 'TL-01',
        time: '08:00',
        title: 'Tiếp nhận & chuẩn bị vật tư dán nhiệt',
        description: 'Kỹ thuật viên Trần Minh Tuấn nhận điều động, mang bộ kích nhiệt keo chuyên dụng và thang thủy lực kiểm tra giắc nguồn.',
        active: true
      },
      {
        id: 'TL-02',
        time: '07:20',
        title: 'Khóa sân tự động & Phát cảnh báo',
        description: 'Hệ thống Master Lock kích hoạt đóng Sân 03. Gửi thông báo khẩn qua kênh điều phối Arena Admin.'
      },
      {
        id: 'TL-03',
        time: '07:15',
        title: 'Ghi nhận biên bản sự cố',
        description: 'Nguyễn Văn An kiểm tra ca sáng phát hiện sự cố bong sàn và chập giắc điện sau đợt dọn sân sớm.'
      }
    ],
    technicianNote: 'Đã hoàn thành 60% dán mép thảm, đang kiểm tra nguồn điện dàn đèn.'
  },
  {
    id: 'SC-8919',
    courtId: 'SAN-02',
    courtName: 'Sân 02 (Tiêu chuẩn A)',
    courtZone: 'Khu A',
    courtSubtype: 'Sân Cầu Lông Tiêu Chuẩn',
    isCourtLocked: false,
    equipmentCode: 'MATB-01',
    equipmentName: 'Lưới thi đấu Yonex Pro',
    title: 'Sân 02 - Lưới Yonex bị đứt dây căng góc trái',
    description: 'Dây thép định vị bị tưa sau trận bán kết. Đã xuất kho lưới dự phòng sẵn sàng thay thế trước 17:00.',
    severity: 'trung_binh',
    severityLabel: 'Trung bình',
    status: 'cho_xu_ly',
    statusLabel: 'Chờ xử lý',
    reportedAt: '09:15 Hôm qua',
    reporterName: 'Trần Quốc Bảo',
    reporterRole: 'Nhân viên trực ca 2 • 11:00 - 17:00',
    reporterPhone: '0988.112.233',
    damageItems: [
      {
        id: 'DM-03',
        equipmentCode: 'MATB-01',
        title: 'Bộ căng dây cáp lưới Yonex',
        riskBadge: 'Cần căn chỉnh',
        riskColor: 'amber',
        description: 'Dây cáp bọc nhựa bị xước đứt 3 tao cáp bên cọc số 1, độ căng giảm còn 65%.',
        imageLabel: 'Góc căng cáp cọc số 1'
      }
    ],
    timelineLogs: [
      {
        id: 'TL-04',
        time: '09:15',
        title: 'Ghi nhận sự cố lưới',
        description: 'Trần Quốc Bảo báo cáo cáp lưới trùng sau séc 3 giải phong trào.',
        active: true
      }
    ],
    technicianNote: 'Đã xuất kho lưới dự phòng MATB-06 để chuẩn bị căng thay thế.'
  },
  {
    id: 'SC-8915',
    courtId: 'SAN-04',
    courtName: 'Sân 04 (Tiêu chuẩn B)',
    courtZone: 'Khu B',
    courtSubtype: 'Sân Tập Luyện',
    isCourtLocked: false,
    equipmentCode: 'MATB-03',
    equipmentName: 'Bảng điểm lật tay kim loại',
    title: 'Sân 04 - Bảng điểm lật tay bị kẹt chốt lật số 7',
    description: 'Chốt số 7 bị rít do khô dầu. Kỹ thuật viên đã tra dầu mỡ bôi trơn và kiểm tra lật thử bình thường.',
    severity: 'thap',
    severityLabel: 'Thấp',
    status: 'da_khac_phuc',
    statusLabel: 'Đã khắc phục',
    reportedAt: '10:00 2 ngày trước',
    reporterName: 'Lê Thị Mai',
    reporterRole: 'Nhân viên phụ trách ca sáng',
    reporterPhone: '0903.456.789',
    timelineLogs: [
      {
        id: 'TL-05',
        time: '10:30',
        title: 'Đã nghiệm thu & kiểm tra lật số',
        description: 'Đã bôi trơn và kiểm tra lật mượt mà các số từ 00 đến 30.',
        active: true
      }
    ],
    technicianNote: 'Đã vệ sinh và tra mỡ bôi trơn chốt xoay, hoạt động hoàn hảo.'
  }
];

