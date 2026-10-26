import {
  Employee,
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  EmployeeFilterQuery,
  EmployeeStats,
} from '../types/employee.js';
import { employeeRepository } from '../repositories/employeeRepository.js';

export class EmployeeService {
  private avatarBgPresets = [
    'bg-blue-100 text-blue-800 border-blue-300',
    'bg-emerald-100 text-emerald-800 border-emerald-300',
    'bg-indigo-100 text-indigo-800 border-indigo-300',
    'bg-amber-100 text-amber-800 border-amber-300',
    'bg-purple-100 text-purple-800 border-purple-300',
    'bg-rose-100 text-rose-800 border-rose-300',
    'bg-teal-100 text-teal-800 border-teal-300',
  ];

  /**
   * Helper to compute initials from full name
   */
  private generateAvatarText(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
    } else if (words.length === 1 && words[0]) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return 'NV';
  }

  public getStats(): EmployeeStats {
    const all = employeeRepository.getAll();
    const active = all.filter((e) => e.status === 'active').length;
    const inactive = all.filter((e) => e.status === 'inactive').length;
    const currentlyWorking = all.filter(
      (e) => e.status === 'active' && e.currentShift?.status === 'working'
    ).length;

    return {
      total: all.length,
      active,
      inactive,
      currentlyWorking,
    };
  }

  public listEmployees(filters?: EmployeeFilterQuery): {
    employees: Employee[];
    stats: EmployeeStats;
  } {
    let list = employeeRepository.getAll();

    if (filters) {
      const { search, status, role } = filters;

      if (status && status !== 'all') {
        list = list.filter((e) => e.status === status);
      }

      if (role && role.trim()) {
        const rLower = role.trim().toLowerCase();
        list = list.filter((e) => e.role.toLowerCase().includes(rLower));
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
            e.email?.toLowerCase().includes(q) ||
            e.id.toLowerCase().includes(q) ||
            e.role.toLowerCase().includes(q)
        );
      }
    }

    const stats = this.getStats();

    return {
      employees: list,
      stats,
    };
  }

  public getEmployeeById(id: string): Employee {
    const employee = employeeRepository.getById(id);
    if (!employee) {
      throw new Error(`Không tìm thấy nhân viên với mã: ${id}`);
    }
    return employee;
  }

  public createEmployee(dto: CreateEmployeeDTO): Employee {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('Vui lòng nhập họ và tên nhân viên!');
    }

    if (!dto.phone || !dto.phone.trim()) {
      throw new Error('Vui lòng nhập số điện thoại nhân viên!');
    }

    // Check unique phone
    const existingPhone = employeeRepository.getByPhone(dto.phone);
    if (existingPhone) {
      throw new Error(`Số điện thoại "${dto.phone}" đã được sử dụng bởi nhân viên ${existingPhone.name} (${existingPhone.id})!`);
    }

    // Check unique email if provided
    if (dto.email && dto.email.trim()) {
      const existingEmail = employeeRepository.getByEmail(dto.email);
      if (existingEmail) {
        throw new Error(`Email "${dto.email}" đã tồn tại trên hệ thống!`);
      }
    }

    // Validate password if provided
    if (dto.password && dto.password.length < 6) {
      throw new Error('Mật khẩu ban đầu phải có ít nhất 6 ký tự!');
    }

    const newId = employeeRepository.getNextId();
    const avatarText = dto.avatarText?.trim() || this.generateAvatarText(dto.name);
    const avatarBg =
      dto.avatarBg ||
      this.avatarBgPresets[Math.floor(Math.random() * this.avatarBgPresets.length)];

    const now = new Date();
    const joinDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()}`;

    const newEmployee: Employee = {
      id: newId,
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      email: dto.email?.trim() || `${avatarText.toLowerCase()}@courtx.vn`,
      avatarText,
      avatarBg,
      avatarImage: dto.avatarImage || undefined,
      status: dto.status || 'active',
      role: dto.role?.trim() || 'Nhân viên vận hành sân COURTX',
      joinDate,
      currentShift: {
        type: 'morning',
        title: 'Ca 1: Sáng sớm',
        time: '05:00 - 11:00',
        status: 'working',
        statusLabel: 'SẴN SÀNG',
      },
      schedule5Days: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    return employeeRepository.create(newEmployee);
  }

  public updateEmployee(id: string, dto: UpdateEmployeeDTO): Employee {
    const existing = employeeRepository.getById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy nhân viên với mã: ${id}`);
    }

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new Error('Họ và tên nhân viên không được để trống!');
    }

    if (dto.phone !== undefined && !dto.phone.trim()) {
      throw new Error('Số điện thoại nhân viên không được để trống!');
    }

    // Phone uniqueness check
    if (dto.phone && dto.phone.trim() !== existing.phone.trim()) {
      const phoneHolder = employeeRepository.getByPhone(dto.phone);
      if (phoneHolder && phoneHolder.id.toLowerCase() !== id.toLowerCase()) {
        throw new Error(`Số điện thoại "${dto.phone}" đã thuộc về nhân viên khác (${phoneHolder.name})!`);
      }
    }

    // Email uniqueness check
    if (dto.email && dto.email.trim() && dto.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const emailHolder = employeeRepository.getByEmail(dto.email);
      if (emailHolder && emailHolder.id.toLowerCase() !== id.toLowerCase()) {
        throw new Error(`Email "${dto.email}" đã thuộc về nhân viên khác (${emailHolder.name})!`);
      }
    }

    // Password validation if updating
    if (dto.password) {
      if (dto.password.length < 6) {
        throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      }
    }

    const updates: Partial<Employee> = {};
    if (dto.name !== undefined) updates.name = dto.name.trim();
    if (dto.phone !== undefined) updates.phone = dto.phone.trim();
    if (dto.email !== undefined) updates.email = dto.email.trim();
    if (dto.role !== undefined) updates.role = dto.role.trim();
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.avatarText !== undefined) {
      updates.avatarText = dto.avatarText.trim() || this.generateAvatarText(dto.name || existing.name);
    }
    if (dto.avatarBg !== undefined) updates.avatarBg = dto.avatarBg;
    if (dto.avatarImage !== undefined) updates.avatarImage = dto.avatarImage;

    const result = employeeRepository.update(id, updates);
    if (!result) {
      throw new Error('Không thể cập nhật thông tin nhân viên.');
    }
    return result;
  }

  public toggleStatus(id: string): Employee {
    const existing = employeeRepository.getById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy nhân viên với mã: ${id}`);
    }

    const nextStatus = existing.status === 'active' ? 'inactive' : 'active';
    const updates: Partial<Employee> = {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };

    if (nextStatus === 'inactive') {
      updates.deactivatedAt = new Date().toISOString();
      updates.deactivationReason = 'Chuyển trạng thái sang Tạm dừng';
      updates.currentShift = undefined;
    } else {
      updates.deactivatedAt = undefined;
      updates.deactivationReason = undefined;
    }

    const updated = employeeRepository.update(id, updates);
    if (!updated) {
      throw new Error('Cập nhật trạng thái thất bại.');
    }
    return updated;
  }

  /**
   * Delete or soft-delete employee (UC-11)
   */
  public deleteEmployee(id: string, permanent = false, reason?: string): { success: boolean; message: string; employee?: Employee } {
    const existing = employeeRepository.getById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy nhân viên với mã: ${id}`);
    }

    const res = employeeRepository.delete(id, permanent, reason);
    if (!res.success) {
      throw new Error('Xóa/vô hiệu hóa nhân viên không thành công.');
    }

    const actionText = permanent ? 'Đã xóa vĩnh viễn' : 'Đã vô hiệu hóa (Soft Delete theo UC-11)';
    return {
      success: true,
      message: `${actionText} tài khoản nhân viên ${existing.name} (${existing.id}) thành công!`,
      employee: res.employee,
    };
  }
}

export const employeeService = new EmployeeService();
