import type {
  FacilityEquipment,
  CourtStatusItem,
  FacilityIncident,
} from '../types/admin';
import type { CheckoutRequest, CheckoutResult } from '../utils/checkoutSettlement';
import {
  INITIAL_EQUIPMENT,
  INITIAL_COURT_STATUSES,
  INITIAL_INCIDENTS,
} from '../types/admin';

export interface FacilityDashboardStats {
  totalEquipments: number;
  readyEquipments: number;
  inUseEquipments: number;
  maintenanceEquipments: number;
  totalCourts: number;
  lockedCourts: number;
  openCourts: number;
  totalIncidents: number;
  urgentIncidents: number;
  pendingIncidents: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export class FacilitySaveError extends Error {}

class FacilityApiService {
  async getCheckoutReceipt(reference:string):Promise<CheckoutResult|undefined> {
    const response=await fetch(`${API_BASE_URL}/checkout-settlements/${encodeURIComponent(reference)}`,{signal:AbortSignal.timeout(5000)});
    if(!response.ok)return undefined;
    const result=await response.json();
    return result.success?{receipt:result.data,incidents:[],equipments:[]}:undefined;
  }
  async completeCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
    const response = await fetch(`${API_BASE_URL}/checkout-settlements`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(request) });
    if (response.status === 404) throw new TypeError('Checkout service unavailable');
    const result = await response.json();
    if (!response.ok || !result.success) throw new FacilitySaveError(result.message || 'Chưa hoàn tất được trả sân.');
    return result.data;
  }
  /**
   * Load all facility datasets in parallel on initial mount
   */
  async loadAllFacilityData(): Promise<{
    equipments: FacilityEquipment[];
    courts: CourtStatusItem[];
    incidents: FacilityIncident[];
    stats?: FacilityDashboardStats;
    isBackendOnline: boolean;
  }> {
    try {
      const [eqRes, courtRes, incRes, statRes] = await Promise.all([
        fetch(`${API_BASE_URL}/equipments`),
        fetch(`${API_BASE_URL}/courts`),
        fetch(`${API_BASE_URL}/incidents`),
        fetch(`${API_BASE_URL}/facilities/dashboard`),
      ]);

      if (!eqRes.ok || !courtRes.ok || !incRes.ok) {
        throw new Error('One or more facility endpoints returned an error');
      }

      const eqData = await eqRes.json();
      const courtData = await courtRes.json();
      const incData = await incRes.json();
      const statData = statRes.ok ? await statRes.json() : null;

      return {
        equipments: eqData.data,
        courts: courtData.data,
        incidents: incData.data,
        stats: statData?.data,
        isBackendOnline: true,
      };
    } catch (error) {
      console.warn('Facility API unavailable, falling back to initial data:', error);
      return {
        equipments: INITIAL_EQUIPMENT,
        courts: INITIAL_COURT_STATUSES,
        incidents: INITIAL_INCIDENTS,
        isBackendOnline: false,
      };
    }
  }

  // ==========================================
  // EQUIPMENT ENDPOINTS
  // ==========================================
  async getEquipments(filters?: { location?: string; category?: string; status?: string; search?: string }): Promise<FacilityEquipment[]> {
    try {
      const url = new URL(`${API_BASE_URL}/equipments`, window.location.origin);
      if (filters?.location) url.searchParams.set('location', filters.location);
      if (filters?.category) url.searchParams.set('category', filters.category);
      if (filters?.status) url.searchParams.set('status', filters.status);
      if (filters?.search) url.searchParams.set('search', filters.search);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch equipments');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Error fetching equipments:', err);
      return INITIAL_EQUIPMENT;
    }
  }

  async createEquipment(newEq: Partial<FacilityEquipment>): Promise<FacilityEquipment> {
    const res = await fetch(`${API_BASE_URL}/equipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEq),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new FacilitySaveError(result.message || 'Lỗi khi thêm thiết bị');
    }
    return result.data;
  }

  async updateEquipment(id: string, updates: Partial<FacilityEquipment>): Promise<FacilityEquipment> {
    const res = await fetch(`${API_BASE_URL}/equipments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi cập nhật thiết bị');
    }
    return result.data;
  }

  async relocateEquipment(
    code: string,
    targetLocation: string,
    bookingDetails?: { bookingCode?: string; timeSlot?: string; customerName?: string }
  ): Promise<FacilityEquipment> {
    const res = await fetch(`${API_BASE_URL}/equipments/${code}/relocate`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetLocation,
        ...bookingDetails,
      }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi điều chuyển thiết bị');
    }
    return result.data;
  }

  async returnToWarehouse(code: string): Promise<FacilityEquipment> {
    const res = await fetch(`${API_BASE_URL}/equipments/${code}/return-warehouse`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi thu hồi thiết bị về kho');
    }
    return result.data;
  }

  async checkoutCourtEquipments(courtName: string): Promise<FacilityEquipment[]> {
    const res = await fetch(`${API_BASE_URL}/equipments/checkout-court`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courtName }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi checkout thiết bị sân');
    }
    return result.data;
  }

  // ==========================================
  // COURT STATUS & MASTER LOCK
  // ==========================================
  async getCourts(): Promise<CourtStatusItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/courts`);
      if (!res.ok) throw new Error('Failed to fetch courts');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Error fetching courts:', err);
      return INITIAL_COURT_STATUSES;
    }
  }

  async toggleCourtLock(courtId: string, isLocked: boolean, reason?: string): Promise<CourtStatusItem> {
    const res = await fetch(`${API_BASE_URL}/courts/${courtId}/lock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isLocked, reason }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi khóa/mở sân');
    }
    return result.data;
  }

  // ==========================================
  // INCIDENT REPORTING & AUDIT TIMELINE
  // ==========================================
  async getIncidents(filters?: { status?: string; severity?: string; courtId?: string }): Promise<FacilityIncident[]> {
    try {
      const url = new URL(`${API_BASE_URL}/incidents`, window.location.origin);
      if (filters?.status) url.searchParams.set('status', filters.status);
      if (filters?.severity) url.searchParams.set('severity', filters.severity);
      if (filters?.courtId) url.searchParams.set('courtId', filters.courtId);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to fetch incidents');
      const data = await res.json();
      return data.data;
    } catch (err) {
      console.warn('Error fetching incidents:', err);
      return INITIAL_INCIDENTS;
    }
  }

  async deleteIncident(id: string): Promise<FacilityIncident | undefined> {
    const response = await fetch(`${API_BASE_URL}/incidents/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (response.status === 404) return undefined;
    const result = await response.json();
    if (!response.ok || !result.success) throw new FacilitySaveError(result.message || 'Không xóa được báo cáo sự cố.');
    return result.data;
  }

  async createIncident(incident: Partial<FacilityIncident> & { lockCourt?: boolean }): Promise<{ incident: FacilityIncident; courtLocked: boolean }> {
    const res = await fetch(`${API_BASE_URL}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi báo cáo sự cố');
    }
    return {
      incident: result.data,
      courtLocked: result.courtLocked,
    };
  }

  async updateIncidentStatus(
    incidentId: string,
    newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc',
    unlockCourt = false,
    technicianNote?: string
  ): Promise<{ incident: FacilityIncident; courtUnlocked: boolean }> {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        unlockCourt,
        technicianNote,
      }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi cập nhật trạng thái sự cố');
    }
    return {
      incident: result.data,
      courtUnlocked: result.courtUnlocked,
    };
  }

  async addTimelineLog(incidentId: string, title: string, description: string, images: string[] = []): Promise<FacilityIncident> {
    const res = await fetch(`${API_BASE_URL}/incidents/${incidentId}/timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, images }),
    });
    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi thêm nhật ký tiến độ sự cố');
    }
    return result.data;
  }
}

export const facilityApiService = new FacilityApiService();
