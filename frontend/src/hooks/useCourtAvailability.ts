import { useEffect, useSyncExternalStore } from 'react';
import type { SetStateAction } from 'react';
import type { CourtStatusItem } from '../types/admin';
import { facilityApiService } from '../services/facilityService';

const listeners = new Set<() => void>();
let subscribers = 0;
let polling: ReturnType<typeof setInterval> | undefined;
const refresh = async () => {
  try {
    setSharedCourtStatuses(await facilityApiService.getCourts());
  } catch { /* Retain saved states while offline. */ }
};
export const normalizeCourtCode = (value: string) =>
  value.toUpperCase().replace(/Đ/g, 'D').match(/(?:CL|BC|BD)[-_]\d{2}/)?.[0].replace('_', '-');
let courts: CourtStatusItem[] = [];
export function setSharedCourtStatuses(action: SetStateAction<CourtStatusItem[]>) {
  const next = typeof action === 'function' ? action(courts) : action;
  // Legacy API courts without sport codes must not replace the current court catalogue.
  const valid = next.filter(c => normalizeCourtCode(c.code || c.id || c.name));
  if (JSON.stringify(valid) === JSON.stringify(courts)) return;
  courts = valid;
  listeners.forEach(listener => listener());
}

export function isCourtLocked(value: string) {
  const code = normalizeCourtCode(value);
  return courts.some(c => c.isLocked && normalizeCourtCode(c.code || c.id || c.name) === code);
}

export default function useCourtAvailability() {
  const statuses = useSyncExternalStore(listener => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, () => courts);
  useEffect(() => {
    if (subscribers++ === 0) {
      void refresh();
      polling = setInterval(() => { void refresh(); }, 5000);
      window.addEventListener('focus', refresh);
    }
    return () => {
      if (--subscribers === 0) {
        clearInterval(polling);
        window.removeEventListener('focus', refresh);
      }
    };
  }, []);
  return [statuses, setSharedCourtStatuses] as const;
}
