import { useEffect, useSyncExternalStore } from 'react';
import type { SetStateAction } from 'react';
import { INITIAL_COURT_STATUSES, type CourtStatusItem } from '../types/admin';

const KEY = 'courtx_court_statuses_v1';
const listeners = new Set<() => void>();
let subscribers = 0;
let polling: ReturnType<typeof setInterval> | undefined;
const refresh = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/courts`);
    if (!response.ok) return;
    const result = await response.json();
    if (Array.isArray(result.data)) setSharedCourtStatuses(result.data);
  } catch { /* Retain saved states while offline. */ }
};
export const normalizeCourtCode = (value: string) =>
  value.toUpperCase().replace(/Đ/g, 'D').match(/(?:CL|BC|BD)[-_]\d{2}/)?.[0].replace('_', '-');
let courts = INITIAL_COURT_STATUSES;
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (Array.isArray(saved) && saved.every(c => typeof c.id === 'string' && typeof c.isLocked === 'boolean')) courts = saved;
} catch { /* Use the initial court states when storage is unavailable. */ }

export function setSharedCourtStatuses(action: SetStateAction<CourtStatusItem[]>) {
  const next = typeof action === 'function' ? action(courts) : action;
  // Legacy API courts without sport codes must not replace the current court catalogue.
  const valid = next.filter(c => normalizeCourtCode(c.code || c.id || c.name));
  if (!valid.length || JSON.stringify(valid) === JSON.stringify(courts)) return;
  courts = valid;
  try { localStorage.setItem(KEY, JSON.stringify(courts)); } catch { /* Keep this session synchronized. */ }
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
    const sync = (event: StorageEvent) => {
      if (event.key !== KEY || !event.newValue) return;
      try { setSharedCourtStatuses(JSON.parse(event.newValue)); } catch { /* Ignore invalid storage. */ }
    };
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('storage', sync);
      if (--subscribers === 0) {
        clearInterval(polling);
        window.removeEventListener('focus', refresh);
      }
    };
  }, []);
  return [statuses, setSharedCourtStatuses] as const;
}
