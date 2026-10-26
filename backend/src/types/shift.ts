export interface ShiftRegistration {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  shiftType: 'Ca 1' | 'Ca 2' | 'Ca 3' | string;
  shiftName: string;
  timeRange: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cancelReason?: string;
  courtArea?: string;
  notes?: string;
  taskDescription?: string;
  tasks?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ShiftAuditLog {
  id: string;
  action: 'create' | 'update' | 'delete' | 'cancel' | 'unassign' | 'batch_create' | 'batch_delete';
  shiftId?: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  shiftType?: string;
  reason?: string;
  performedBy: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface CreateShiftDTO {
  id?: string;
  employeeId: string;
  employeeName?: string;
  date: string; // YYYY-MM-DD
  dayOfWeek?: string;
  shiftType: 'Ca 1' | 'Ca 2' | 'Ca 3' | string;
  shiftName?: string;
  timeRange?: string;
  courtArea?: string;
  notes?: string;
  taskDescription?: string;
  tasks?: string[];
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface UpdateShiftDTO {
  employeeId?: string;
  employeeName?: string;
  date?: string;
  dayOfWeek?: string;
  shiftType?: string;
  shiftName?: string;
  timeRange?: string;
  courtArea?: string;
  notes?: string;
  taskDescription?: string;
  tasks?: string[];
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  cancelReason?: string;
}

export interface BatchCreateShiftDTO {
  shifts: CreateShiftDTO[];
  actor?: string;
}

export interface DeleteShiftOptions {
  permanent?: boolean;
  reason: string;
  actor?: string;
}

export interface BatchDeleteShiftDTO {
  shiftIds: string[];
  permanent?: boolean;
  reason: string;
  actor?: string;
}

export interface ShiftFilterQuery {
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

export interface ShiftConflictValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ShiftExportQuery {
  month?: string;
  year?: string;
  scope?: 'week_current' | 'all_month' | 'week_1' | 'week_2' | 'week_3' | 'week_4' | 'week_5';
  employeeId?: string;
  shiftType?: string;
  includeNightBonus?: boolean | string;
  onlyCompleted?: boolean | string;
}

export interface ShiftExportPreviewResult {
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

export interface ShiftStatisticsResult {
  totalShifts: number;
  scheduledShifts: number;
  inProgressShifts: number;
  completedShifts: number;
  cancelledShifts: number;
  coverageRate: number; // Tỷ lệ phủ ca (%)
  unassignedSlots: number; // Số ca thiếu người
  totalWorkingHours: number;
  shiftTypeBreakdown: {
    shift1: number;
    shift2: number;
    shift3: number;
  };
}
