export const NOTIFICATION_STORAGE_KEY = 'courtx_system_notifications_v1';

export interface SystemNotification {
  id: string;
  type: 'incident' | 'booking' | 'staff' | 'system';
  typeLabel: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  priority?: 'high' | 'normal';
}

// Three calendar months in Vietnam time; clamp month-end dates to the last day.
export function notificationExpiresAt(createdAt: string): number {
  const offset = 7 * 60 * 60 * 1000;
  const date = new Date(Date.parse(createdAt) + offset);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 3);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime() - offset;
}

export function retainNotifications(items: SystemNotification[], now = Date.now()) {
  return items.filter((item) => Number.isFinite(Date.parse(item.createdAt)) && notificationExpiresAt(item.createdAt) > now);
}

export function readNotifications(fallback: SystemNotification[] = []): SystemNotification[] {
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored === null) return retainNotifications(fallback);
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return retainNotifications(parsed.filter((item): item is SystemNotification =>
      item !== null && typeof item === 'object'
      && typeof item.id === 'string' && typeof item.createdAt === 'string'
      && ['incident', 'booking', 'staff', 'system'].includes(item.type)
      && typeof item.typeLabel === 'string' && typeof item.title === 'string'
      && typeof item.message === 'string' && typeof item.isRead === 'boolean'));
  } catch {
    return retainNotifications(fallback);
  }
}

export function writeNotifications(items: SystemNotification[]) {
  try {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(retainNotifications(items)));
  } catch {
    // The current session remains usable if browser storage is unavailable.
  }
}
