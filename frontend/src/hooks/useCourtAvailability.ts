import { useEffect, useSyncExternalStore } from 'react';
import type { SetStateAction } from 'react';
import type { CourtStatusItem } from '../types/admin';
import { facilityApiService } from '../services/facilityService';

const listeners = new Set<() => void>();
let subscribers = 0;
let polling: ReturnType<typeof setInterval> | undefined;
export const refreshCourtAvailability = async () => {
  try {
    setSharedCourtStatuses(await facilityApiService.getCourts());
  } catch { /* Retain saved states while offline. */ }
};
export const normalizeCourtCode = (value: string) =>
  value.toUpperCase().replace(/Đ/g, 'D').match(/(?:CL|BC|BD)[-_]\d{2}/)?.[0].replace('_', '-');
let courts: CourtStatusItem[] = [];
export function setSharedCourtStatuses(action: SetStateAction<CourtStatusItem[]>) {
  const next = typeof action === 'function' ? action(courts) : action;
  // SAN... is a database ID, not a sport code. Keep real API courts even when code is absent.
  const valid = next.filter(c => c.id && c.name).map(c=>({...c,code:normalizeCourtCode(c.code||'')||normalizeCourtCode(c.name)||c.code}));
  if (JSON.stringify(valid) === JSON.stringify(courts)) return;
  courts = valid;
  listeners.forEach(listener => listener());
}

export function isCourtLocked(value: string) {
  const code = normalizeCourtCode(value);
  return !!code && courts.some(c => c.isLocked && normalizeCourtCode(c.code || c.name || c.id) === code);
}

export default function useCourtAvailability() {
  const statuses = useSyncExternalStore(listener => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, () => courts);
  useEffect(() => {
    void refreshCourtAvailability();
    if (subscribers++ === 0) {
      polling = setInterval(() => { void refreshCourtAvailability(); }, 5000);
      window.addEventListener('focus', refreshCourtAvailability);
    }
    return () => {
      if (--subscribers === 0) {
        clearInterval(polling);
        window.removeEventListener('focus', refreshCourtAvailability);
      }
    };
  }, []);
  return [statuses, setSharedCourtStatuses] as const;
}
