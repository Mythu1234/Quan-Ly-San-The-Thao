import { CourtStatusItem } from '../types/facility.js';

export const INITIAL_COURTS: CourtStatusItem[] = [
  ...(['CL', 'BC', 'BD'] as const).flatMap((prefix) =>
    Array.from({ length: prefix === 'BD' ? 4 : 5 }, (_, index) => {
      const code = `${prefix}-${String(index + 1).padStart(2, '0')}`;
      return {
        id: `SAN-${code}`, code, courtNumber: index + 1, name: `Sân ${code}`,
        sportId: prefix === 'CL' ? 'badminton' as const : prefix === 'BC' ? 'volleyball' as const : 'football' as const,
        isLocked: code === 'CL-03',
        ...(code === 'CL-03' ? { lockReason: 'Hư lưới' } : {}),
      };
    })),
];
