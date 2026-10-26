import { Employee } from '../types/employee.js';

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
    ],
    createdAt: '2026-08-15T08:00:00.000Z',
    updatedAt: '2026-10-16T12:00:00.000Z'
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
      status: 'completed',
      statusLabel: 'HOÀN THÀNH'
    },
    schedule5Days: [
      { dayLabel: 'Hôm nay (16/10)', date: '16/10', shiftName: 'Ca 1: Sáng', time: '05:00 - 11:00', status: 'working', statusLabel: 'Hoàn thành' },
      { dayLabel: 'Ngày mai (17/10)', date: '17/10', shiftName: 'Ca 1: Sáng', time: '05:00 - 11:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
      { dayLabel: 'Chủ Nhật (18/10)', date: '18/10', shiftName: 'Nghỉ ca', time: '', status: 'off', statusLabel: 'Nghỉ ca' }
    ],
    createdAt: '2026-09-01T08:00:00.000Z',
    updatedAt: '2026-10-16T11:00:00.000Z'
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
    schedule5Days: [
      { dayLabel: 'Hôm nay (16/10)', date: '16/10', shiftName: 'Ca 3: Tối', time: '17:00 - 23:00', status: 'scheduled', statusLabel: 'Sắp tới' }
    ],
    createdAt: '2026-07-20T08:00:00.000Z',
    updatedAt: '2026-10-16T12:00:00.000Z'
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
    schedule5Days: [],
    deactivatedAt: '2026-09-30T17:00:00.000Z',
    deactivationReason: 'Kết thúc hợp đồng làm việc bán thời gian',
    createdAt: '2025-10-05T08:00:00.000Z',
    updatedAt: '2026-09-30T17:00:00.000Z'
  },
  {
    id: 'NV05',
    name: 'Hoàng Công Tiến',
    phone: '0903 888 999',
    email: 'tien.hoang@example.com',
    avatarText: 'CT',
    avatarBg: 'bg-orange-100 text-orange-800 border-orange-300',
    status: 'active',
    role: 'Nhân viên bảo vệ & an ninh',
    joinDate: '10/01/2024',
    currentShift: {
      type: 'morning',
      title: 'Ca 1: Sáng sớm',
      time: '05:00 - 11:00',
      status: 'working',
      statusLabel: 'SẴN SÀNG'
    },
    schedule5Days: [],
    createdAt: '2024-01-10T08:00:00.000Z',
    updatedAt: '2026-10-16T08:00:00.000Z'
  }
];
