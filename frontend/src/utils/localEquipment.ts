import type { FacilityEquipment } from '../types/admin';

const STORAGE_KEY = 'courtx_local_equipment_v1';

export function readLocalEquipment(): FacilityEquipment[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is FacilityEquipment =>
      item !== null && typeof item === 'object' && typeof item.id === 'string'
      && typeof item.code === 'string' && typeof item.name === 'string'
      && typeof item.sportType === 'string' && typeof item.healthRate === 'string') : [];
  } catch { return []; }
}

export function saveLocalEquipment(equipment: FacilityEquipment) {
  const items = readLocalEquipment().filter((item) => item.code !== equipment.code);
  // Let callers report a failure instead of displaying a successful save that will be lost.
  localStorage.setItem(STORAGE_KEY, JSON.stringify([equipment, ...items]));
}

export function withLocalEquipment(serverItems: FacilityEquipment[]) {
  const knownCodes = new Set(serverItems.map((item) => item.code));
  return [...readLocalEquipment().filter((item) => !knownCodes.has(item.code)), ...serverItems];
}
