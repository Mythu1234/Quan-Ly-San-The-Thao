import type { Employee } from '../types/admin';
import { INITIAL_EMPLOYEES } from '../types/admin';
import { supabase } from '../lib/supabaseClient';

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

const AVATAR_BG_PRESETS = [
  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-amber-100 text-amber-800 border-amber-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-rose-100 text-rose-800 border-rose-300',
  'bg-teal-100 text-teal-800 border-teal-300',
];

/**
 * Helper to compute 2-character initials for avatar
 */
function generateAvatarText(name: string): string {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0]) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return 'NV';
}

/**
 * Format timestamp to DD/MM/YYYY
 */
function formatDateVN(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('vi-VN');
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

/**
 * Transform Supabase row in table `nhan_vien` to frontend `Employee` object
 */
export function mapRowToEmployee(row: any, index = 0): Employee {
  const roleDisplay =
    row.vai_tro === 'ADMIN'
      ? 'Chủ sân (Quản trị viên)'
      : 'Nhân viên vận hành sân COURTX';

  const avatarBg =
    row.vai_tro === 'ADMIN'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : AVATAR_BG_PRESETS[(index + 1) % AVATAR_BG_PRESETS.length];

  return {
    id: row.ma_nhan_vien,
    name: row.ho_ten || 'Chưa đặt tên',
    phone: row.so_dien_thoai || '',
    email: row.email || '',
    avatarText: generateAvatarText(row.ho_ten || ''),
    avatarBg,
    status: row.trang_thai_hoat_dong ? 'active' : 'inactive',
    role: roleDisplay,
    joinDate: formatDateVN(row.ngay_tao),
  };
}

class EmployeeApiService {
  /**
   * Helper to generate standardized next employee ID: NV + 8 digits (e.g. NV00000006)
   */
  public async getNextEmployeeId(): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('nhan_vien')
        .select('ma_nhan_vien')
        .order('ma_nhan_vien', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        return 'NV00000001';
      }

      let maxNum = 0;
      for (const item of data) {
        const match = (item.ma_nhan_vien || '').match(/(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }

      const nextNum = maxNum + 1;
      return `NV${nextNum.toString().padStart(8, '0')}`;
    } catch {
      return `NV0000000${Math.floor(Math.random() * 90) + 10}`;
    }
  }

  /**
   * Fetch all employees from online Supabase database table `nhan_vien`
   * with optional filters.
   */
  async getEmployees(params?: EmployeeFilterParams): Promise<{
    employees: Employee[];
    stats?: EmployeeStats;
    isBackendOnline: boolean;
  }> {
    try {
      let query = supabase
        .from('nhan_vien')
        .select('*')
        .order('ma_nhan_vien', { ascending: true });

      if (params?.status && params.status !== 'all') {
        const isActive = params.status === 'active';
        query = query.eq('trang_thai_hoat_dong', isActive);
      }

      if (params?.search && params.search.trim()) {
        const s = params.search.trim();
        query = query.or(
          `ho_ten.ilike.%${s}%,so_dien_thoai.ilike.%${s}%,email.ilike.%${s}%,ma_nhan_vien.ilike.%${s}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase query nhan_vien error:', error);
        throw error;
      }

      const employees: Employee[] = (data || []).map((row, idx) => mapRowToEmployee(row, idx));

      const total = employees.length;
      const active = employees.filter((e) => e.status === 'active').length;
      const inactive = total - active;

      return {
        employees,
        stats: {
          total,
          active,
          inactive,
          currentlyWorking: active,
        },
        isBackendOnline: true,
      };
    } catch (error) {
      console.warn('Online Supabase fetch failed, falling back to local data:', error);
      return {
        employees: INITIAL_EMPLOYEES,
        isBackendOnline: false,
      };
    }
  }

  /**
   * Fetch details of a single employee from online Supabase
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('nhan_vien')
        .select('*')
        .eq('ma_nhan_vien', id)
        .single();

      if (error || !data) return null;
      return mapRowToEmployee(data);
    } catch (error) {
      console.warn(`Error fetching employee ${id} from Supabase:`, error);
      return null;
    }
  }

  /**
   * Create a new employee on online Supabase database
   */
  async createEmployee(data: Partial<Employee> & { password?: string }): Promise<Employee> {
    const nextId = await this.getNextEmployeeId();
    const rawRole = (data.role || '').toUpperCase();
    const vaiTro = rawRole.includes('ADMIN') || rawRole.includes('CHỦ') ? 'ADMIN' : 'STAFF';
    const isActive = data.status !== 'inactive';

    const insertPayload = {
      ma_nhan_vien: nextId,
      ho_ten: (data.name || '').trim(),
      so_dien_thoai: (data.phone || '').trim(),
      email: (data.email || `${nextId.toLowerCase()}@courtx.vn`).trim(),
      mat_khau: data.password || 'staff@123',
      vai_tro: vaiTro,
      trang_thai_hoat_dong: isActive,
    };

    const { data: created, error } = await supabase
      .from('nhan_vien')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      console.error('Supabase create employee error:', error);
      throw new Error(error.message || 'Lỗi khi thêm nhân viên vào Supabase');
    }

    return mapRowToEmployee(created);
  }

  /**
   * Update existing employee on online Supabase database
   */
  async updateEmployee(id: string, data: Partial<Employee> & { password?: string }): Promise<Employee> {
    const rawRole = (data.role || '').toUpperCase();
    const vaiTro = rawRole.includes('ADMIN') || rawRole.includes('CHỦ') ? 'ADMIN' : 'STAFF';

    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload.ho_ten = data.name.trim();
    if (data.phone !== undefined) updatePayload.so_dien_thoai = data.phone.trim();
    if (data.email !== undefined) updatePayload.email = data.email.trim();
    if (data.role !== undefined) updatePayload.vai_tro = vaiTro;
    if (data.status !== undefined) updatePayload.trang_thai_hoat_dong = data.status === 'active';
    if (data.password) updatePayload.mat_khau = data.password;

    const { data: updated, error } = await supabase
      .from('nhan_vien')
      .update(updatePayload)
      .eq('ma_nhan_vien', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update employee error:', error);
      throw new Error(error.message || 'Lỗi khi cập nhật nhân viên trên Supabase');
    }

    return mapRowToEmployee(updated);
  }

  /**
   * Toggle employee active status in Supabase (Soft lock / Unlock)
   */
  async toggleStatus(id: string): Promise<Employee> {
    const { data: current, error: getErr } = await supabase
      .from('nhan_vien')
      .select('trang_thai_hoat_dong')
      .eq('ma_nhan_vien', id)
      .single();

    if (getErr || !current) {
      throw new Error('Không tìm thấy nhân viên cần đổi trạng thái');
    }

    const nextStatus = !current.trang_thai_hoat_dong;
    const { data: updated, error: updateErr } = await supabase
      .from('nhan_vien')
      .update({ trang_thai_hoat_dong: nextStatus })
      .eq('ma_nhan_vien', id)
      .select()
      .single();

    if (updateErr) {
      console.error('Supabase toggleStatus error:', updateErr);
      throw new Error(updateErr.message || 'Lỗi khi chuyển trạng thái nhân viên');
    }

    return mapRowToEmployee(updated);
  }

  /**
   * Delete or soft-delete (UC-11) employee on Supabase
   * In compliance with Business Requirements (Section 9 & 10):
   * Soft delete (trang_thai_hoat_dong = false) is standard to preserve financial, incident & booking history.
   */
  async deleteEmployee(
    id: string,
    _reason?: string,
    permanent = false
  ): Promise<{ success: boolean; message: string; employee?: Employee }> {
    if (permanent) {
      const { error } = await supabase
        .from('nhan_vien')
        .delete()
        .eq('ma_nhan_vien', id);

      if (error) {
        console.error('Supabase hard delete error:', error);
        throw new Error(error.message || 'Lỗi khi xóa nhân viên');
      }

      return {
        success: true,
        message: 'Đã xóa vĩnh viễn nhân viên khỏi cơ sở dữ liệu!',
      };
    } else {
      // Soft delete: Vô hiệu hóa tài khoản, bảo lưu lịch sử
      const { data: updated, error } = await supabase
        .from('nhan_vien')
        .update({ trang_thai_hoat_dong: false })
        .eq('ma_nhan_vien', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase soft delete error:', error);
        throw new Error(error.message || 'Lỗi khi vô hiệu hóa tài khoản nhân viên');
      }

      const emp = mapRowToEmployee(updated);
      return {
        success: true,
        message: `Đã vô hiệu hóa tài khoản nhân viên "${emp.name}" (Mã: ${emp.id}). Toàn bộ lịch sử vận hành được bảo toàn.`,
        employee: emp,
      };
    }
  }
}

export const employeeApiService = new EmployeeApiService();
export default employeeApiService;
