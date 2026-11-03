import { useEffect, useSyncExternalStore } from 'react';
import { facilityApiService } from '../services/facilityService';
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

export const DATA: Record<SportTab, { label: string; emoji: string; color: string; items: PriceItem[] }> = {
  badminton: {
    label: 'Cầu lông',
    emoji: '🏸',
    color: 'emerald',
    items: [],
  },
  volleyball: {
    label: 'Bóng chuyền',
    emoji: '🏐',
    color: 'orange',
    items: [],
  },
  football: {
    label: 'Bóng đá',
    emoji: '⚽',
    color: 'blue',
    items: [],
  },
  common: {
    label: 'Thiết bị chung',
    emoji: '🔧',
    color: 'slate',
    items: [],
  },
};


let remoteRows: (PriceRow & {equipmentId?:string})[] = [];
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const snapshot = () => remoteRows;
let pending:Promise<void>|undefined;
export function refreshCompensationCatalog():Promise<void> {
  return pending ||= facilityApiService.getCompensationPrices().then(saved=>{remoteRows=saved;listeners.forEach(listener=>listener());}).finally(()=>{pending=undefined;});
}
export function getCompensationItems(equipments: FacilityEquipment[]): PriceRow[] {
  return remoteRows.map(row=>({...row,equipment:equipments.find(item=>item.id===row.equipmentId)}));
}
export function useCompensationCatalog(equipments: FacilityEquipment[]) {
  useSyncExternalStore(subscribe, snapshot);
  useEffect(()=>{void refreshCompensationCatalog().catch(console.error);},[]);
  return getCompensationItems(equipments);
}
export async function hideCompensationItem(id: string) {
  await facilityApiService.hideCompensationPrice(id);
  await refreshCompensationCatalog();
}
