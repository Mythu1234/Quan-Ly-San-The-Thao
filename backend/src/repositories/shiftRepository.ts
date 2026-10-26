import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ShiftRegistration, ShiftAuditLog, ShiftFilterQuery } from '../types/shift.js';
import { INITIAL_SHIFTS } from '../data/initialShifts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const SHIFTS_FILE = path.join(DATA_DIR, 'shifts.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'shift_audit_logs.json');

export class ShiftRepository {
  private shifts: ShiftRegistration[] = [];
  private auditLogs: ShiftAuditLog[] = [];
  private isLoaded = false;

  constructor() {
    this.ensureLoaded();
  }

  private ensureLoaded(): void {
    if (this.isLoaded) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // 1. Shifts file
      if (fs.existsSync(SHIFTS_FILE)) {
        const raw = fs.readFileSync(SHIFTS_FILE, 'utf-8');
        this.shifts = JSON.parse(raw);
      } else {
        this.shifts = [...INITIAL_SHIFTS];
        this.persistShifts();
      }

      // 2. Audit logs file
      if (fs.existsSync(AUDIT_LOGS_FILE)) {
        const rawLogs = fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8');
        this.auditLogs = JSON.parse(rawLogs);
      } else {
        this.auditLogs = [
          {
            id: 'LOG-001',
            action: 'create',
            performedBy: 'Hệ thống CourtX (Khởi tạo)',
            timestamp: new Date().toISOString(),
            reason: 'Dữ liệu mẫu bảng phân ca trực tháng 10/2026',
          },
        ];
        this.persistAuditLogs();
      }

      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading shifts database:', error);
      this.shifts = [...INITIAL_SHIFTS];
    }
  }

  private persistShifts(): void {
    try {
      fs.writeFileSync(SHIFTS_FILE, JSON.stringify(this.shifts, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing shifts.json:', error);
    }
  }

  private persistAuditLogs(): void {
    try {
      fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(this.auditLogs, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error writing shift_audit_logs.json:', error);
    }
  }

  public getAll(filter?: ShiftFilterQuery): ShiftRegistration[] {
    this.ensureLoaded();
    let result = [...this.shifts];

    if (!filter) return result;

    if (filter.date) {
      result = result.filter((s) => s.date === filter.date);
    }
    if (filter.startDate) {
      result = result.filter((s) => s.date >= filter.startDate!);
    }
    if (filter.endDate) {
      result = result.filter((s) => s.date <= filter.endDate!);
    }
    if (filter.employeeId && filter.employeeId !== 'ALL') {
      result = result.filter((s) => s.employeeId === filter.employeeId);
    }
    if (filter.shiftType && filter.shiftType !== 'ALL') {
      result = result.filter((s) => s.shiftType === filter.shiftType);
    }
    if (filter.status && filter.status !== 'ALL') {
      result = result.filter((s) => s.status === filter.status);
    }
    if (filter.month && filter.year) {
      const monthPrefix = `${filter.year}-${filter.month.padStart(2, '0')}`;
      result = result.filter((s) => s.date.startsWith(monthPrefix));
    }

    return result;
  }

  public getById(id: string): ShiftRegistration | undefined {
    this.ensureLoaded();
    return this.shifts.find((s) => s.id === id);
  }

  public findByDate(date: string): ShiftRegistration[] {
    this.ensureLoaded();
    return this.shifts.filter((s) => s.date === date);
  }

  public findByEmployeeAndDate(employeeId: string, date: string): ShiftRegistration[] {
    this.ensureLoaded();
    return this.shifts.filter((s) => s.employeeId === employeeId && s.date === date && s.status !== 'cancelled');
  }

  public create(shift: ShiftRegistration): ShiftRegistration {
    this.ensureLoaded();
    this.shifts.unshift(shift);
    this.persistShifts();
    return shift;
  }

  public createBatch(newShifts: ShiftRegistration[]): ShiftRegistration[] {
    this.ensureLoaded();
    this.shifts.unshift(...newShifts);
    this.persistShifts();
    return newShifts;
  }

  public update(id: string, updates: Partial<ShiftRegistration>): ShiftRegistration | null {
    this.ensureLoaded();
    const index = this.shifts.findIndex((s) => s.id === id);
    if (index === -1) return null;

    this.shifts[index] = {
      ...this.shifts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persistShifts();
    return this.shifts[index];
  }

  public delete(
    id: string,
    permanent: boolean = false,
    reason?: string,
    actor: string = 'Quản lý sân'
  ): { success: boolean; shift?: ShiftRegistration } {
    this.ensureLoaded();
    const index = this.shifts.findIndex((s) => s.id === id);
    if (index === -1) return { success: false };

    const targetShift = this.shifts[index];

    if (permanent) {
      // Hard delete
      this.shifts.splice(index, 1);
    } else {
      // Soft delete: status = cancelled
      this.shifts[index] = {
        ...targetShift,
        status: 'cancelled',
        cancelReason: reason || 'Chủ sân hủy ca',
        updatedAt: new Date().toISOString(),
      };
    }

    this.persistShifts();

    // Record audit log (BR2 UC-09)
    this.addAuditLog({
      action: permanent ? 'delete' : 'cancel',
      shiftId: targetShift.id,
      employeeId: targetShift.employeeId,
      employeeName: targetShift.employeeName,
      date: targetShift.date,
      shiftType: targetShift.shiftType,
      reason: reason || (permanent ? 'Xóa vĩnh viễn khỏi bảng' : 'Hủy ca trực'),
      performedBy: actor,
    });

    return { success: true, shift: targetShift };
  }

  public deleteBatch(
    ids: string[],
    permanent: boolean = false,
    reason?: string,
    actor: string = 'Quản lý sân'
  ): { deletedCount: number; affectedIds: string[] } {
    this.ensureLoaded();
    const affectedIds: string[] = [];

    if (permanent) {
      this.shifts = this.shifts.filter((s) => {
        if (ids.includes(s.id)) {
          affectedIds.push(s.id);
          return false;
        }
        return true;
      });
    } else {
      this.shifts = this.shifts.map((s) => {
        if (ids.includes(s.id)) {
          affectedIds.push(s.id);
          return {
            ...s,
            status: 'cancelled',
            cancelReason: reason || 'Hủy ca theo đợt',
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
    }

    this.persistShifts();

    this.addAuditLog({
      action: permanent ? 'batch_delete' : 'cancel',
      reason: reason || (permanent ? `Xóa vĩnh viễn ${affectedIds.length} ca` : `Hủy ${affectedIds.length} ca`),
      performedBy: actor,
      details: { affectedIds },
    });

    return { deletedCount: affectedIds.length, affectedIds };
  }

  public addAuditLog(logData: Omit<ShiftAuditLog, 'id' | 'timestamp'>): ShiftAuditLog {
    this.ensureLoaded();
    const log: ShiftAuditLog = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...logData,
    };
    this.auditLogs.unshift(log);
    this.persistAuditLogs();
    return log;
  }

  public getAuditLogs(): ShiftAuditLog[] {
    this.ensureLoaded();
    return [...this.auditLogs];
  }
}

export const shiftRepository = new ShiftRepository();
