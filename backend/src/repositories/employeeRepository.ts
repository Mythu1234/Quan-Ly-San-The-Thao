import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Employee } from '../types/employee.js';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees.js';
import { supabase } from '../lib/supabaseClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory and file path
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'employees.json');

const AVATAR_BG_PRESETS = [
  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'bg-blue-100 text-blue-800 border-blue-300',
  'bg-amber-100 text-amber-800 border-amber-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-rose-100 text-rose-800 border-rose-300',
  'bg-teal-100 text-teal-800 border-teal-300',
];

function generateAvatarText(name: string): string {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  } else if (words.length === 1 && words[0]) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return 'NV';
}

function formatDateVN(dateStr?: string): string {
  if (!dateStr) return new Date().toLocaleDateString('vi-VN');
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('vi-VN');
  } catch {
    return dateStr;
  }
}

function mapSupabaseRowToEmployee(row: any, idx = 0): Employee {
  const roleDisplay =
    row.vai_tro === 'ADMIN'
      ? 'Chủ sân (Quản trị viên)'
      : 'Nhân viên vận hành sân COURTX';

  return {
    id: row.ma_nhan_vien,
    name: row.ho_ten || 'Chưa đặt tên',
    phone: row.so_dien_thoai || '',
    email: row.email || '',
    avatarText: generateAvatarText(row.ho_ten || ''),
    avatarBg:
      row.vai_tro === 'ADMIN'
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : AVATAR_BG_PRESETS[(idx + 1) % AVATAR_BG_PRESETS.length],
    status: row.trang_thai_hoat_dong ? 'active' : 'inactive',
    role: roleDisplay,
    joinDate: formatDateVN(row.ngay_tao),
    createdAt: row.ngay_tao,
  };
}

export class EmployeeRepository {
  private employees: Employee[] = [];
  private isLoaded = false;

  constructor() {
    this.ensureDataLoaded();
    this.syncWithSupabase();
  }

  public async syncWithSupabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('nhan_vien')
        .select('*')
        .order('ma_nhan_vien', { ascending: true });

      if (error) {
        console.warn('Supabase sync warning:', error.message);
        return;
      }

      if (data && data.length > 0) {
        this.employees = data.map((row, idx) => mapSupabaseRowToEmployee(row, idx));
        this.persist();
      }
    } catch (err) {
      console.warn('Could not sync with Supabase online database:', err);
    }
  }

  private ensureDataLoaded(): void {
    if (this.isLoaded) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.employees = JSON.parse(raw);
      } else {
        this.employees = [...INITIAL_EMPLOYEES];
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Failed to load employee data from JSON file, using in-memory defaults:', err);
      this.employees = [...INITIAL_EMPLOYEES];
      this.isLoaded = true;
    }
  }

  private persist(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.employees, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist employee data to JSON file:', err);
    }
  }

  public getAll(): Employee[] {
    this.ensureDataLoaded();
    return [...this.employees];
  }

  public getById(id: string): Employee | null {
    this.ensureDataLoaded();
    const found = this.employees.find((e) => e.id.toLowerCase() === id.toLowerCase());
    return found ? { ...found } : null;
  }

  public getByPhone(phone: string): Employee | null {
    this.ensureDataLoaded();
    const cleanPhone = phone.replace(/\s+/g, '');
    const found = this.employees.find(
      (e) => e.phone.replace(/\s+/g, '') === cleanPhone
    );
    return found ? { ...found } : null;
  }

  public getByEmail(email: string): Employee | null {
    this.ensureDataLoaded();
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const found = this.employees.find((e) => e.email?.trim().toLowerCase() === cleanEmail);
    return found ? { ...found } : null;
  }

  public getNextId(): string {
    this.ensureDataLoaded();
    let maxNum = 0;
    for (const emp of this.employees) {
      const match = emp.id.match(/^NV-?0*(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    // Standardized format: NV + 8 digits (e.g. NV00000006)
    return `NV${nextNum.toString().padStart(8, '0')}`;
  }

  public create(newEmployee: Employee, password?: string): Employee {
    this.ensureDataLoaded();
    this.employees.unshift(newEmployee);
    this.persist();

    // Async write to Supabase
    const vaiTro = newEmployee.role.toLowerCase().includes('admin') || newEmployee.role.toLowerCase().includes('chủ') ? 'ADMIN' : 'STAFF';
    supabase
      .from('nhan_vien')
      .insert([
        {
          ma_nhan_vien: newEmployee.id,
          ho_ten: newEmployee.name,
          so_dien_thoai: newEmployee.phone,
          email: newEmployee.email,
          mat_khau: password || (vaiTro==='ADMIN'?'admin@1234':'staff@1234'),
          vai_tro: vaiTro,
          trang_thai_hoat_dong: newEmployee.status === 'active',
        },
      ])
      .then(({ error }) => {
        if (error) console.error('Supabase async insert error:', error.message);
      });

    return { ...newEmployee };
  }

  public update(id: string, updates: Partial<Employee>, password?: string): Employee | null {
    this.ensureDataLoaded();
    const index = this.employees.findIndex((e) => e.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return null;

    const current = this.employees[index];
    const updated: Employee = {
      ...current,
      ...updates,
      id: current.id,
      updatedAt: new Date().toISOString(),
    };

    this.employees[index] = updated;
    this.persist();

    // Async update to Supabase
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.ho_ten = updates.name;
    if (updates.phone !== undefined) payload.so_dien_thoai = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.status !== undefined) payload.trang_thai_hoat_dong = updates.status === 'active';
    if (updates.role !== undefined) {
      payload.vai_tro = updates.role.toLowerCase().includes('admin') ? 'ADMIN' : 'STAFF';
    }
    if (password) payload.mat_khau = password;

    supabase
      .from('nhan_vien')
      .update(payload)
      .eq('ma_nhan_vien', id)
      .then(({ error }) => {
        if (error) console.error('Supabase async update error:', error.message);
      });

    return { ...updated };
  }

  public delete(id: string, permanent = false, reason?: string): { success: boolean; employee?: Employee } {
    this.ensureDataLoaded();
    const index = this.employees.findIndex((e) => e.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return { success: false };

    if (permanent) {
      const [removed] = this.employees.splice(index, 1);
      this.persist();

      supabase
        .from('nhan_vien')
        .delete()
        .eq('ma_nhan_vien', id)
        .then(({ error }) => {
          if (error) console.error('Supabase async delete error:', error.message);
        });

      return { success: true, employee: removed };
    } else {
      // Soft delete (UC-11)
      const current = this.employees[index];
      const deactivated: Employee = {
        ...current,
        status: 'inactive',
        deactivatedAt: new Date().toISOString(),
        deactivationReason: reason || 'Chủ sân vô hiệu hóa tài khoản (UC-11)',
        updatedAt: new Date().toISOString(),
        currentShift: undefined,
      };
      this.employees[index] = deactivated;
      this.persist();

      supabase
        .from('nhan_vien')
        .update({ trang_thai_hoat_dong: false })
        .eq('ma_nhan_vien', id)
        .then(({ error }) => {
          if (error) console.error('Supabase async soft delete error:', error.message);
        });

      return { success: true, employee: deactivated };
    }
  }
}

export const employeeRepository = new EmployeeRepository();
