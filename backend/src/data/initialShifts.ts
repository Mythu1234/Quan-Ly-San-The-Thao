import { ShiftRegistration } from '../types/shift.js';

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
  },
  {
    id: 'SH-21-3',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-21',
    dayOfWeek: 'Thứ 4',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'scheduled',
    courtArea: 'Toàn bộ 8 sân'
  },

  // --- TUẦN 1: 01/10 - 07/10/2026 (ĐÃ HOÀN THÀNH) ---
  {
    id: 'SH-01-1',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-01',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'completed',
    courtArea: 'Cụm Sân 01 - 04',
    taskDescription: 'Mở cửa sân, đón khách tập sáng'
  },
  {
    id: 'SH-01-2',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-01',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'completed',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-01-3',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-01',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'completed',
    courtArea: 'Toàn bộ 8 sân'
  },
  {
    id: 'SH-03-1',
    employeeId: 'NV04',
    employeeName: 'Phạm Thu Trà',
    date: '2026-10-03',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'completed',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-03-2',
    employeeId: 'NV05',
    employeeName: 'Hoàng Công Tiến',
    date: '2026-10-03',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'completed',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-05-1',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-05',
    dayOfWeek: 'Thứ 2',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'completed',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-05-2',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-05',
    dayOfWeek: 'Thứ 2',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'completed',
    courtArea: 'Toàn bộ 8 sân'
  },

  // --- TUẦN 2: 08/10 - 14/10/2026 (ĐÃ HOÀN THÀNH) ---
  {
    id: 'SH-08-1',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-08',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'completed',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-08-2',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-08',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'completed',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-08-3',
    employeeId: 'NV05',
    employeeName: 'Hoàng Công Tiến',
    date: '2026-10-08',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'completed',
    courtArea: 'Toàn bộ 8 sân'
  },
  {
    id: 'SH-10-1',
    employeeId: 'NV04',
    employeeName: 'Phạm Thu Trà',
    date: '2026-10-10',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'completed',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-10-2',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-10',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'completed',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-12-1',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-12',
    dayOfWeek: 'Thứ 2',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'completed',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-12-2',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-12',
    dayOfWeek: 'Thứ 2',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'completed',
    courtArea: 'Toàn bộ 8 sân'
  },

  // --- TUẦN 4: 22/10 - 28/10/2026 (KẾ HOẠCH PHÂN CA) ---
  {
    id: 'SH-22-1',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-22',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04',
    taskDescription: 'Mở cửa ca sáng, đón khách Pickleball'
  },
  {
    id: 'SH-22-2',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-22',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-22-3',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-22',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'scheduled',
    courtArea: 'Toàn bộ 8 sân'
  },
  {
    id: 'SH-24-1',
    employeeId: 'NV04',
    employeeName: 'Phạm Thu Trà',
    date: '2026-10-24',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-24-2',
    employeeId: 'NV05',
    employeeName: 'Hoàng Công Tiến',
    date: '2026-10-24',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-26-1',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-26',
    dayOfWeek: 'Thứ 2',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-26-2',
    employeeId: 'NV02',
    employeeName: 'Trần Thị Bình',
    date: '2026-10-26',
    dayOfWeek: 'Thứ 2',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'scheduled',
    courtArea: 'Toàn bộ 8 sân'
  },

  // --- TUẦN 5: 29/10 - 31/10/2026 ---
  {
    id: 'SH-29-1',
    employeeId: 'NV03',
    employeeName: 'Lê Hoàng Long',
    date: '2026-10-29',
    dayOfWeek: 'Thứ 5',
    shiftType: 'Ca 1',
    shiftName: 'Ca 1: Sáng sớm & Mở sân',
    timeRange: '05:00 - 11:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 01 - 04'
  },
  {
    id: 'SH-30-2',
    employeeId: 'NV01',
    employeeName: 'Nguyễn Văn An',
    date: '2026-10-30',
    dayOfWeek: 'Thứ 6',
    shiftType: 'Ca 2',
    shiftName: 'Ca 2: Chiều & Giải đấu',
    timeRange: '11:00 - 17:00',
    status: 'scheduled',
    courtArea: 'Cụm Sân 05 - 08'
  },
  {
    id: 'SH-31-3',
    employeeId: 'NV05',
    employeeName: 'Hoàng Công Tiến',
    date: '2026-10-31',
    dayOfWeek: 'Thứ 7',
    shiftType: 'Ca 3',
    shiftName: 'Ca 3: Tối Giờ Vàng & Đóng sân',
    timeRange: '17:00 - 23:00',
    status: 'scheduled',
    courtArea: 'Toàn bộ 8 sân'
  }
];
