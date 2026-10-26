import { CourtStatusItem } from '../types/facility.js';

export const INITIAL_COURTS: CourtStatusItem[] = [
  { id: 'SAN-01', courtNumber: 1, name: 'Sân 01 (Tiêu chuẩn A)', isLocked: false },
  { id: 'SAN-02', courtNumber: 2, name: 'Sân 02 (Tiêu chuẩn A)', isLocked: false },
  {
    id: 'SAN-03',
    courtNumber: 3,
    name: 'Sân 03 (Trong nhà VIP)',
    isLocked: true,
    lockReason: 'Sửa thảm & đèn',
    lockedAt: '14:20 Hôm nay',
    lockedBy: 'Nguyễn Văn An',
  },
  { id: 'SAN-04', courtNumber: 4, name: 'Sân 04 (Tiêu chuẩn B)', isLocked: false },
  { id: 'SAN-05', courtNumber: 5, name: 'Sân 05 (Tiêu chuẩn B)', isLocked: false },
  { id: 'SAN-06', courtNumber: 6, name: 'Sân 06 (Tiêu chuẩn B)', isLocked: false },
  { id: 'SAN-07', courtNumber: 7, name: 'Sân 07 (Tiêu chuẩn A)', isLocked: false },
  { id: 'SAN-08', courtNumber: 8, name: 'Sân 08 (Tiêu chuẩn A)', isLocked: false },
];
