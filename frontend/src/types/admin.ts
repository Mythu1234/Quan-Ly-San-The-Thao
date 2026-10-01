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
  shiftType: 'Ca 1' | 'Ca 2' | 'Ca 3';
  shiftName: string;
  timeRange: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  nightShiftMultiplier?: number;
  cancelReason?: string;
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
      type: 'morning',
      title: 'Ca sáng',
      time: '04:00 - 10:00',
      status: 'working',
      statusLabel: 'ĐANG TRỰC'
    },
    schedule5Days: [
      { dayLabel: 'Hôm nay (01/10)', date: '01/10', shiftName: 'Ca sáng', time: '04:00 - 10:00', status: 'working', statusLabel: 'Đang trực' },
      { dayLabel: 'Ngày mai (02/10)', date: '02/10', shiftName: 'Ca chiều', time: '10:00 - 17:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
      { dayLabel: 'Thứ Bảy (03/10)', date: '03/10', shiftName: 'Nghỉ ca thường lệ', time: '', status: 'off', statusLabel: 'Nghỉ ca' },
      { dayLabel: 'Chủ Nhật (04/10)', date: '04/10', shiftName: 'Ca tối', time: '17:00 - 23:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
      { dayLabel: 'Thứ Hai (05/10)', date: '05/10', shiftName: 'Ca sáng', time: '04:00 - 10:00', status: 'scheduled', statusLabel: 'Đã phân ca' }
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
      type: 'afternoon',
      title: 'Ca chiều',
      time: '10:00 - 17:00',
      status: 'upcoming',
      statusLabel: 'SẮP TỚI'
    },
    schedule5Days: [
      { dayLabel: 'Hôm nay (01/10)', date: '01/10', shiftName: 'Ca chiều', time: '10:00 - 17:00', status: 'scheduled', statusLabel: 'Sắp tới' },
      { dayLabel: 'Ngày mai (02/10)', date: '02/10', shiftName: 'Ca sáng', time: '04:00 - 10:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
      { dayLabel: 'Thứ Bảy (03/10)', date: '03/10', shiftName: 'Ca tối', time: '17:00 - 23:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
      { dayLabel: 'Chủ Nhật (04/10)', date: '04/10', shiftName: 'Nghỉ ca thường lệ', time: '', status: 'off', statusLabel: 'Nghỉ ca' },
      { dayLabel: 'Thứ Hai (05/10)', date: '05/10', shiftName: 'Ca chiều', time: '10:00 - 17:00', status: 'scheduled', statusLabel: 'Đã phân ca' }
    ]
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
      type: 'morning',
      title: 'Ca sáng',
      time: '06:00 - 14:00',
      status: 'working',
      statusLabel: 'ĐANG TRỰC'
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
  {
    id: 'SH-01',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-01',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '06:00 - 14:00',
    status: 'in_progress'
  },
  {
    id: 'SH-02',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-01',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều tối Giờ Vàng',
    timeRange: '14:00 - 22:00',
    status: 'scheduled'
  },
  {
    id: 'SH-03',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-02',
    dayOfWeek: 'Thứ 6',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều tối Giờ Vàng',
    timeRange: '14:00 - 22:00',
    status: 'scheduled'
  },
  {
    id: 'SH-04',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-02',
    dayOfWeek: 'Thứ 6',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Thể dục',
    timeRange: '06:00 - 14:00',
    status: 'scheduled'
  },
  {
    id: 'SH-05',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-04',
    dayOfWeek: 'Chủ Nhật',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Đêm muộn & Bảo trì mặt sân',
    timeRange: '22:00 - 02:00',
    status: 'scheduled',
    nightShiftMultiplier: 1.3
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
