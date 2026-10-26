import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Employee } from '../types/employee.js';
import { INITIAL_EMPLOYEES } from '../data/initialEmployees.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory and file path
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'employees.json');

export class EmployeeRepository {
  private employees: Employee[] = [];
  private isLoaded = false;

  constructor() {
    this.ensureDataLoaded();
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
        // Initialize with default seeds
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
    return `NV${nextNum.toString().padStart(2, '0')}`;
  }

  public create(newEmployee: Employee): Employee {
    this.ensureDataLoaded();
    this.employees.unshift(newEmployee);
    this.persist();
    return { ...newEmployee };
  }

  public update(id: string, updates: Partial<Employee>): Employee | null {
    this.ensureDataLoaded();
    const index = this.employees.findIndex((e) => e.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return null;

    const current = this.employees[index];
    const updated: Employee = {
      ...current,
      ...updates,
      id: current.id, // Preserve original ID
      updatedAt: new Date().toISOString(),
    };

    this.employees[index] = updated;
    this.persist();
    return { ...updated };
  }

  /**
   * Delete or deactivate employee.
   * In compliance with UC-11 (BR1: Soft Delete / Deactivate),
   * permanent=false sets status='inactive' and records deactivation metadata.
   */
  public delete(id: string, permanent = false, reason?: string): { success: boolean; employee?: Employee } {
    this.ensureDataLoaded();
    const index = this.employees.findIndex((e) => e.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return { success: false };

    if (permanent) {
      const [removed] = this.employees.splice(index, 1);
      this.persist();
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
      return { success: true, employee: deactivated };
    }
  }
}

export const employeeRepository = new EmployeeRepository();
