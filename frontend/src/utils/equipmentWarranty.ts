import { getVietnamToday } from '../hooks/useVietnamToday';

export function getEquipmentWarranty(expiry?: string, today = getVietnamToday()) {
  const value = expiry?.trim();
  const match = value?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return { active: false, label: 'Chưa có thông tin bảo hành' };
  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { active: false, label: 'Chưa có thông tin bảo hành' };
  }
  const active = date.getTime() >= new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return { active, label: active ? `Còn hạn đến ${value}` : `Hết hạn ${value}` };
}
