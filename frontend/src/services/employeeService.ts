import type { Employee } from '../types/admin';
import { INITIAL_EMPLOYEES } from '../types/admin';

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  currentlyWorking: number;
}

export interface EmployeeFilterParams {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  role?: string;
}

// In dev with Vite proxy, use relative `/api/employees`, or full URL if configured
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class EmployeeApiService {
  /**
   * Fetch all employees from backend with optional filters.
   * If backend is not running, falls back safely to initial mock data.
   */
  async getEmployees(params?: EmployeeFilterParams): Promise<{
    employees: Employee[];
    stats?: EmployeeStats;
    isBackendOnline: boolean;
  }> {
    try {
      const url = new URL(`${API_BASE_URL}/employees`, window.location.origin);
      if (params?.search) url.searchParams.set('search', params.search);
      if (params?.status && params.status !== 'all') url.searchParams.set('status', params.status);
      if (params?.role) url.searchParams.set('role', params.role);

      const response = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resData = await response.json();
      return {
        employees: resData.data,
        stats: resData.stats,
        isBackendOnline: true,
      };
    } catch (error) {
      console.warn('Backend API unavailable, falling back to local data:', error);
      return {
        employees: INITIAL_EMPLOYEES,
        isBackendOnline: false,
      };
    }
  }

  /**
   * Fetch details of a single employee
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${id}`);
      if (!response.ok) return null;
      const json = await response.json();
      return json.data;
    } catch (error) {
      console.warn(`Error fetching employee ${id}:`, error);
      return null;
    }
  }

  /**
   * Create a new employee on backend
   */
  async createEmployee(data: Partial<Employee> & { password?: string }): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi thêm nhân viên');
    }

    return result.data;
  }

  /**
   * Update existing employee on backend
   */
  async updateEmployee(id: string, data: Partial<Employee> & { password?: string }): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi cập nhật nhân viên');
    }

    return result.data;
  }

  /**
   * Toggle employee active status
   */
  async toggleStatus(id: string): Promise<Employee> {
    const response = await fetch(`${API_BASE_URL}/employees/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi chuyển trạng thái nhân viên');
    }

    return result.data;
  }

  /**
   * Delete or soft-delete (UC-11) employee on backend
   */
  async deleteEmployee(id: string, reason?: string, permanent = false): Promise<{ success: boolean; message: string; employee?: Employee }> {
    const url = new URL(`${API_BASE_URL}/employees/${id}`, window.location.origin);
    if (permanent) url.searchParams.set('permanent', 'true');

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Lỗi khi xóa nhân viên');
    }

    return result;
  }
}

export const employeeApiService = new EmployeeApiService();
