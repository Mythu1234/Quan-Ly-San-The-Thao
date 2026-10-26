import type { ShiftRegistration } from '../types/admin';
import { INITIAL_SHIFTS } from '../types/admin';

export interface ShiftFilterParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  month?: string;
  year?: string;
  employeeId?: string;
  shiftType?: string;
  status?: string;
  courtArea?: string;
}

export interface ShiftKpiStats {
  totalShifts: number;
  scheduledShifts: number;
  inProgressShifts: number;
  completedShifts: number;
  cancelledShifts: number;
  coverageRate: number;
  unassignedSlots: number;
  totalWorkingHours: number;
  shiftTypeBreakdown: {
    shift1: number;
    shift2: number;
    shift3: number;
  };
}

export interface ShiftExportPreviewData {
  month: string;
  year: string;
  scope: string;
  totalShifts: number;
  operationalDays: number;
  staffCount: number;
  standardHours: number;
  weightedHours: number;
  expectedFileName: string;
  shifts: ShiftRegistration[];
  staffSummary: {
    employeeId: string;
    employeeName: string;
    shiftCount: number;
    shift1Count: number;
    shift2Count: number;
    shift3Count: number;
    standardHours: number;
    weightedHours: number;
  }[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ShiftApiService {
  /**
   * Load shifts with filters, safe fallback to INITIAL_SHIFTS if backend offline
   */
  async getShifts(params?: ShiftFilterParams): Promise<{
    shifts: ShiftRegistration[];
    total: number;
    isBackendOnline: boolean;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/shifts`, window.location.origin);
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val && val !== 'ALL') url.searchParams.set(key, val);
        });
      }

      const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        shifts: data.shifts,
        total: data.total,
        isBackendOnline: true,
      };
    } catch (error) {
      console.warn('Backend API /shifts offline, using local INITIAL_SHIFTS:', error);
      return {
        shifts: INITIAL_SHIFTS,
        total: INITIAL_SHIFTS.length,
        isBackendOnline: false,
      };
    }
  }

  /**
   * UC-08: Validate shift business rules
   */
  async validateShift(shiftData: Partial<ShiftRegistration>): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/shifts/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Lỗi kiểm tra quy tắc ca trực');
      }

      const res = await response.json();
      return res.validation;
    } catch (error: any) {
      console.warn('Backend validate offline, passing local check:', error);
      return { valid: true, errors: [], warnings: [] };
    }
  }

  /**
   * UC-08: Register / Assign single shift
   */
  async createShift(shiftData: Partial<ShiftRegistration>, actor: string = 'Quản trị viên'): Promise<ShiftRegistration> {
    const response = await fetch(`${API_BASE_URL}/shifts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-name': actor,
      },
      body: JSON.stringify(shiftData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi tạo ca trực mới trên backend');
    }

    const res = await response.json();
    return res.shift;
  }

  /**
   * UC-08: Batch assign shifts
   */
  async createBatchShifts(shifts: Partial<ShiftRegistration>[], actor: string = 'Quản trị viên'): Promise<{
    createdCount: number;
    createdShifts: ShiftRegistration[];
  }> {
    const response = await fetch(`${API_BASE_URL}/shifts/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-name': actor,
      },
      body: JSON.stringify({ shifts, actor }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi phân bổ ca hàng loạt trên backend');
    }

    const res = await response.json();
    return {
      createdCount: res.createdCount,
      createdShifts: res.createdShifts,
    };
  }

  /**
   * Update shift
   */
  async updateShift(id: string, updates: Partial<ShiftRegistration>, actor: string = 'Quản trị viên'): Promise<ShiftRegistration> {
    const response = await fetch(`${API_BASE_URL}/shifts/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-name': actor,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi cập nhật ca trực trên backend');
    }

    const res = await response.json();
    return res.shift;
  }

  /**
   * UC-09: Delete / Cancel shift
   */
  async deleteShift(
    id: string,
    permanent: boolean = false,
    reason: string = 'Chủ sân hủy ca',
    actor: string = 'Quản lý ca'
  ): Promise<{
    success: boolean;
    warningQuotaZero?: boolean;
    warningMessage?: string;
  }> {
    const response = await fetch(
      `${API_BASE_URL}/shifts/${encodeURIComponent(id)}?permanent=${permanent}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-name': actor,
        },
        body: JSON.stringify({ permanent, reason }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi xóa/hủy ca trực trên backend');
    }

    return await response.json();
  }

  /**
   * UC-09: Batch delete shifts
   */
  async deleteBatchShifts(
    shiftIds: string[],
    permanent: boolean = false,
    reason: string = 'Hủy theo đợt',
    actor: string = 'Chủ sân'
  ): Promise<{ deletedCount: number; affectedIds: string[] }> {
    const response = await fetch(`${API_BASE_URL}/shifts/batch-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-name': actor,
      },
      body: JSON.stringify({ shiftIds, permanent, reason, actor }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi xóa ca hàng loạt trên backend');
    }

    return await response.json();
  }

  /**
   * Unassign staff from shift
   */
  async unassignStaff(id: string, reason?: string, actor: string = 'Quản lý'): Promise<ShiftRegistration> {
    const response = await fetch(`${API_BASE_URL}/shifts/${encodeURIComponent(id)}/unassign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-name': actor,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi gỡ phân công nhân viên');
    }

    const res = await response.json();
    return res.shift;
  }

  /**
   * Assign task to shift
   */
  async assignTask(
    id: string,
    taskTitle: string,
    courtArea?: string,
    priority: 'normal' | 'important' | 'urgent' = 'normal',
    actor: string = 'Quản lý'
  ): Promise<ShiftRegistration> {
    const response = await fetch(`${API_BASE_URL}/shifts/${encodeURIComponent(id)}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-actor-name': actor,
      },
      body: JSON.stringify({ taskTitle, courtArea, priority }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Lỗi khi giao nhiệm vụ');
    }

    const res = await response.json();
    return res.shift;
  }

  /**
   * UC-10: Preview Export Data
   */
  async getExportPreview(params: {
    month?: string;
    year?: string;
    scope?: string;
    employeeId?: string;
    shiftType?: string;
    includeNightBonus?: boolean;
    onlyCompleted?: boolean;
  }): Promise<ShiftExportPreviewData> {
    const url = new URL(`${API_BASE_URL}/shifts/export/preview`, window.location.origin);
    if (params.month) url.searchParams.set('month', params.month);
    if (params.year) url.searchParams.set('year', params.year);
    if (params.scope) url.searchParams.set('scope', params.scope);
    if (params.employeeId) url.searchParams.set('employeeId', params.employeeId);
    if (params.shiftType) url.searchParams.set('shiftType', params.shiftType);
    if (params.includeNightBonus !== undefined) url.searchParams.set('includeNightBonus', String(params.includeNightBonus));
    if (params.onlyCompleted !== undefined) url.searchParams.set('onlyCompleted', String(params.onlyCompleted));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Lỗi khi lấy thông tin xem trước trích xuất');
    }

    const res = await response.json();
    return res.preview;
  }

  /**
   * UC-10: Trigger CSV Download from backend
   */
  getExportDownloadUrl(params: {
    month?: string;
    year?: string;
    scope?: string;
    employeeId?: string;
    shiftType?: string;
    includeNightBonus?: boolean;
    onlyCompleted?: boolean;
  }): string {
    const url = new URL(`${API_BASE_URL}/shifts/export/download`, window.location.origin);
    if (params.month) url.searchParams.set('month', params.month);
    if (params.year) url.searchParams.set('year', params.year);
    if (params.scope) url.searchParams.set('scope', params.scope);
    if (params.employeeId) url.searchParams.set('employeeId', params.employeeId);
    if (params.shiftType) url.searchParams.set('shiftType', params.shiftType);
    if (params.includeNightBonus !== undefined) url.searchParams.set('includeNightBonus', String(params.includeNightBonus));
    if (params.onlyCompleted !== undefined) url.searchParams.set('onlyCompleted', String(params.onlyCompleted));
    return url.toString();
  }

  /**
   * Shift KPIs
   */
  async getStatistics(month?: string, year?: string): Promise<ShiftKpiStats> {
    const url = new URL(`${API_BASE_URL}/shifts/statistics/kpi`, window.location.origin);
    if (month) url.searchParams.set('month', month);
    if (year) url.searchParams.set('year', year);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('Lỗi khi lấy thống kê ca trực');
    }

    const res = await response.json();
    return res.statistics;
  }

  /**
   * UC-09 BR2: Get audit logs
   */
  async getAuditLogs(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/shifts/audit-logs`);
    if (!response.ok) {
      throw new Error('Lỗi khi lấy nhật ký đối soát');
    }
    const res = await response.json();
    return res.logs;
  }
}

export const shiftApiService = new ShiftApiService();
