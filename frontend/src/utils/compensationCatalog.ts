import { useSyncExternalStore } from 'react';
import type { FacilityEquipment } from '../types/admin';

export type SportTab = 'badminton' | 'volleyball' | 'football' | 'common';

interface PriceItem {
  name: string;
  price: number;
}

export interface PriceRow extends PriceItem {
  sport: SportTab;
  id: string;
  equipment?: FacilityEquipment;
}

const HIDDEN_ITEMS_KEY = 'courtx_hidden_compensation_items_v1';
const loadHiddenItems = (): string[] => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(HIDDEN_ITEMS_KEY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
};

const SPORT_TABS: Record<string, SportTab> = {
  CauLong: 'badminton', BongChuyen: 'volleyball', BongDa: 'football', DungChung: 'common',
};

export const DATA: Record<SportTab, { label: string; emoji: string; color: string; items: PriceItem[] }> = {
  badminton: {
    label: 'Cầu lông',
    emoji: '🏸',
    color: 'emerald',
    items: [
      { name: 'Lưới cầu lông', price: 250_000 },
      { name: 'Trụ lưới cầu lông', price: 500_000 },
      { name: 'Vợt cầu lông cho thuê', price: 150_000 },
      { name: 'Bảng điểm', price: 150_000 },
      { name: 'Ghế nhựa', price: 80_000 },
    ],
  },
  volleyball: {
    label: 'Bóng chuyền',
    emoji: '🏐',
    color: 'orange',
    items: [
      { name: 'Lưới bóng chuyền', price: 350_000 },
      { name: 'Trụ bóng chuyền', price: 800_000 },
      { name: 'Bóng chuyền cho thuê', price: 250_000 },
      { name: 'Ăng-ten lưới', price: 150_000 },
      { name: 'Bảng điểm', price: 150_000 },
    ],
  },
  football: {
    label: 'Bóng đá',
    emoji: '⚽',
    color: 'blue',
    items: [
      { name: 'Lưới khung thành', price: 400_000 },
      { name: 'Bóng đá cho thuê', price: 250_000 },
      { name: 'Áo bib phân đội', price: 50_000 },
      { name: 'Cờ góc sân', price: 100_000 },
      { name: 'Ghế nhựa', price: 80_000 },
    ],
  },
  common: {
    label: 'Thiết bị chung',
    emoji: '🔧',
    color: 'slate',
    items: [
      { name: 'Quạt treo tường', price: 350_000 },
      { name: 'Đèn LED chiếu sáng', price: 400_000 },
      { name: 'Thùng rác', price: 100_000 },
      { name: 'Bình nước giữ nhiệt', price: 150_000 },
      { name: 'Bơm bóng', price: 80_000 },
    ],
  },
};


let hiddenItems = loadHiddenItems();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => hiddenItems;
if (typeof window !== 'undefined') window.addEventListener('storage', event => {
  if (event.key === HIDDEN_ITEMS_KEY) { hiddenItems = loadHiddenItems(); listeners.forEach(listener => listener()); }
});
export function getCompensationItems(equipments: FacilityEquipment[], hidden: string[] = hiddenItems): PriceRow[] {
  return (Object.keys(DATA) as SportTab[]).flatMap(sport => [
    ...DATA[sport].items.map((item, index) => ({ ...item, sport, id: 'standard:' + sport + ':' + index })),
    ...equipments.filter(equipment => (SPORT_TABS[equipment.sportType] ?? 'common') === sport && equipment.compensationPrice !== undefined)
      .map(equipment => ({ id: 'equipment:' + equipment.id, sport, name: equipment.name, price: equipment.compensationPrice!, equipment })),
  ]).filter(item => !hidden.includes(item.id));
}
export function useCompensationCatalog(equipments: FacilityEquipment[]) {
  const hidden = useSyncExternalStore(subscribe, snapshot);
  return getCompensationItems(equipments, hidden);
}
export function hideCompensationItem(id: string) {
  hiddenItems = [...new Set([...hiddenItems, id])];
  try { localStorage.setItem(HIDDEN_ITEMS_KEY, JSON.stringify(hiddenItems)); } catch { /* Retain changes for this session. */ }
  listeners.forEach(listener => listener());
}
