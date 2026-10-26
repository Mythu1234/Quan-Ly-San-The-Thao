import {
  ShiftRegistration,
  CreateShiftDTO,
  UpdateShiftDTO,
  BatchCreateShiftDTO,
  DeleteShiftOptions,
  BatchDeleteShiftDTO,
  ShiftFilterQuery,
  ShiftConflictValidation,
  ShiftExportQuery,
  ShiftExportPreviewResult,
  ShiftStatisticsResult,
  ShiftAuditLog,
} from '../types/shift.js';
import { shiftRepository, ShiftRepository } from '../repositories/shiftRepository.js';

export class ShiftService {
  private repo: ShiftRepository;

  constructor(repo: ShiftRepository = shiftRepository) {
    this.repo = repo;
  }

  /**
   * Helper: Map date (YYYY-MM-DD) to Vietnamese Day of Week
   */
  private getVietnameseDayOfWeek(dateStr: string): string {
    const d = new Date(dateStr);
    const day = d.getDay();
    switch (day) {
      case 0:
        return 'Chủ Nhật';
      case 1:
        return 'Thứ 2';
      case 2:
        return 'Thứ 3';
      case 3:
        return 'Thứ 4';
      case 4:
        return 'Thứ 5';
      case 5:
        return 'Thứ 6';
      case 6:
        return 'Thứ 7';
      default:
        return 'Thứ ' + (day + 1);
    }
  }

  /**
   * Helper: Standard shift config
   */
  private getStandardShiftConfig(shiftType: string) {
    switch (shiftType) {
      case 'Ca 1':
        return {
          name: 'Ca 1: Sáng sớm & Thể dục',
          timeRange: '05:00 - 11:00',
          hours: 6,
          isNight: false,
        };
      case 'Ca 2':
        return {
          name: 'Ca 2: Chiều & Giải đấu',
          timeRange: '11:00 - 17:00',
          hours: 6,
          isNight: false,
        };
      case 'Ca 3':
        return {
          name: 'Ca 3: Tối Giờ Vàng & Đóng sân',
          timeRange: '17:00 - 23:00',
          hours: 6,
          isNight: true, // Ca đêm hưởng hệ số x1.3 (BR2 UC-10)
        };
      default:
        return {
          name: `${shiftType}: Ca tiêu chuẩn`,
          timeRange: '08:00 - 16:00',
          hours: 8,
          isNight: false,
        };
    }
  }

  /**
   * UC-08: Validate shift business rules before registration
   * - BR1: Trùng ca trong cùng ngày
   * - BR2: Ràng buộc số ca tối đa và khoảng nghỉ tối thiểu giữa 2 ca
   */
  public validateShiftRules(dto: CreateShiftDTO): ShiftConflictValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!dto.date) {
      errors.push('Ngày trực là bắt buộc!');
    }
    if (!dto.shiftType) {
      errors.push('Loại ca trực là bắt buộc!');
    }
    if (!dto.employeeId) {
      errors.push('Mã nhân viên là bắt buộc!');
    }

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // 1. Check duplicate: same employee, same date, same shiftType
    const existingSameDay = this.repo.findByEmployeeAndDate(dto.employeeId, dto.date);
    const hasSameShift = existingSameDay.some(
      (s) => s.shiftType === dto.shiftType && s.id !== dto.id
    );

    if (hasSameShift) {
      errors.push(
        `Nhân viên ${dto.employeeName || dto.employeeId} đã được phân công ${dto.shiftType} vào ngày ${dto.date}!`
      );
    }

    // 2. Check maximum shifts in 1 day
    if (existingSameDay.length >= 2) {
      errors.push(
        `Nhân viên đã trực ${existingSameDay.length} ca trong ngày ${dto.date}. Vượt quá số ca tối đa cho phép!`
      );
    } else if (existingSameDay.length === 1) {
      warnings.push(
        `Nhân viên đã có 1 ca trực trong ngày (${existingSameDay[0].shiftType}). Đang đăng ký ca tăng cường thứ 2.`
      );
    }

    // 3. Check rest interval rule (BR2 UC-08: Không trực ca đêm liền kề ca sáng hôm sau)
    if (dto.shiftType === 'Ca 1') {
      // Check previous day Ca 3
      const prevDate = new Date(dto.date);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];
      const prevDayShifts = this.repo.findByEmployeeAndDate(dto.employeeId, prevDateStr);
      const hadNightShift = prevDayShifts.some((s) => s.shiftType === 'Ca 3');
      if (hadNightShift) {
        warnings.push(
          `Cảnh báo khoảng nghỉ: Nhân viên vừa trực Ca 3 đêm hôm trước (${prevDateStr}). Hãy đảm bảo đủ thời gian hồi phục sức khỏe!`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * UC-08: Create / Register single shift
   */
  public createShift(dto: CreateShiftDTO, actor: string = 'Quản trị viên'): ShiftRegistration {
    const validation = this.validateShiftRules(dto);
    if (!validation.valid) {
      throw new Error(validation.errors.join(' | '));
    }

    const config = this.getStandardShiftConfig(dto.shiftType);
    const dayOfWeek = dto.dayOfWeek || this.getVietnameseDayOfWeek(dto.date);

    // Auto-generate clean ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const id = dto.id || `SH-${dto.date.replace(/-/g, '').slice(2)}-${randomSuffix}`;

    const newShift: ShiftRegistration = {
      id,
      employeeId: dto.employeeId,
      employeeName: dto.employeeName || 'Nhân viên',
      date: dto.date,
      dayOfWeek,
      shiftType: dto.shiftType,
      shiftName: dto.shiftName || config.name,
      timeRange: dto.timeRange || config.timeRange,
      status: dto.status || 'scheduled',
      courtArea: dto.courtArea || 'Toàn bộ 8 sân',
      notes: dto.notes,
      taskDescription: dto.taskDescription,
      tasks: dto.tasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = this.repo.create(newShift);

    // Audit log
    this.repo.addAuditLog({
      action: 'create',
      shiftId: saved.id,
      employeeId: saved.employeeId,
      employeeName: saved.employeeName,
      date: saved.date,
      shiftType: saved.shiftType,
      reason: 'Phân ca trực mới',
      performedBy: actor,
    });

    return saved;
  }

  /**
   * UC-08: Batch assign shifts (Alternative flow 3a)
   */
  public createBatchShifts(dto: BatchCreateShiftDTO): {
    createdShifts: ShiftRegistration[];
    failedShifts: { dto: CreateShiftDTO; reason: string }[];
  } {
    const createdShifts: ShiftRegistration[] = [];
    const failedShifts: { dto: CreateShiftDTO; reason: string }[] = [];

    for (const shiftDto of dto.shifts) {
      try {
        const created = this.createShift(shiftDto, dto.actor || 'Quản lý phân ca');
        createdShifts.push(created);
      } catch (err: any) {
        failedShifts.push({
          dto: shiftDto,
          reason: err.message || 'Lỗi không xác định',
        });
      }
    }

    return { createdShifts, failedShifts };
  }

  /**
   * Get shifts with flexible filtering
   */
  public getShifts(query?: ShiftFilterQuery): ShiftRegistration[] {
    return this.repo.getAll(query);
  }

  /**
   * Get single shift by ID
   */
  public getShiftById(id: string): ShiftRegistration | undefined {
    return this.repo.getById(id);
  }

  /**
   * Update shift
   */
  public updateShift(
    id: string,
    updates: UpdateShiftDTO,
    actor: string = 'Quản trị viên'
  ): ShiftRegistration {
    const existing = this.repo.getById(id);
    if (!existing) {
      throw new Error(`Không tìm thấy ca trực với mã: ${id}`);
    }

    if (updates.date && !updates.dayOfWeek) {
      updates.dayOfWeek = this.getVietnameseDayOfWeek(updates.date);
    }

    const updated = this.repo.update(id, updates);
    if (!updated) {
      throw new Error(`Lỗi cập nhật ca trực ${id}`);
    }

    this.repo.addAuditLog({
      action: 'update',
      shiftId: id,
      employeeId: updated.employeeId,
      employeeName: updated.employeeName,
      date: updated.date,
      shiftType: updated.shiftType,
      reason: updates.cancelReason || 'Cập nhật thông tin ca trực',
      performedBy: actor,
      details: updates as Record<string, any>,
    });

    return updated;
  }

  /**
   * UC-09: Delete / Cancel Shift
   * - Exception flow 2a: Ca trực đã hoặc đang diễn ra không thể xóa
   * - Exception flow 5a: Cảnh báo xóa ca gây trống 0 người trực (BR1)
   * - BR2: Lưu nhật ký đối soát (Audit Log)
   */
  public deleteShift(
    id: string,
    options: DeleteShiftOptions
  ): {
    success: boolean;
    deletedShift?: ShiftRegistration;
    warningQuotaZero?: boolean;
    warningMessage?: string;
  } {
    const shift = this.repo.getById(id);
    if (!shift) {
      throw new Error(`Không tìm thấy ca trực với mã: ${id}`);
    }

    // Exception Flow 2a: Check if shift already in progress or completed
    if (options.permanent && (shift.status === 'completed' || shift.status === 'in_progress')) {
      throw new Error(
        `Không thể xóa ca trực đã hoặc đang diễn ra (${shift.status === 'completed' ? 'Đã hoàn thành' : 'Đang trực'}). Chỉ có thể cập nhật trạng thái chấm công!`
      );
    }

    if (!options.reason || !options.reason.trim()) {
      throw new Error('Lý do hủy/xóa ca trực là bắt buộc để ghi nhận nhật ký đối soát!');
    }

    // Exception Flow 5a & BR1: Check remaining staff in the same shift on that date
    const sameSlotShifts = this.repo
      .getAll({ date: shift.date, shiftType: shift.shiftType })
      .filter((s) => s.id !== id && s.status !== 'cancelled');

    let warningQuotaZero = false;
    let warningMessage: string | undefined;

    if (sameSlotShifts.length === 0) {
      warningQuotaZero = true;
      warningMessage = `Cảnh báo định biên: Xóa ca này sẽ khiến ${shift.shiftType} ngày ${shift.date} bị TRỐNG (0 người trực)! Cần tạo thông báo tìm người trực thay.`;
    }

    const res = this.repo.delete(
      id,
      options.permanent,
      options.reason.trim(),
      options.actor || 'Quản lý ca'
    );

    return {
      success: res.success,
      deletedShift: shift,
      warningQuotaZero,
      warningMessage,
    };
  }

  /**
   * UC-09: Batch delete shifts
   */
  public deleteBatchShifts(dto: BatchDeleteShiftDTO): {
    deletedCount: number;
    affectedIds: string[];
    warningQuotaZero: boolean;
  } {
    if (!dto.shiftIds || dto.shiftIds.length === 0) {
      throw new Error('Danh sách ca cần xóa không được rỗng!');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new Error('Lý do hủy ca hàng loạt là bắt buộc!');
    }

    const res = this.repo.deleteBatch(
      dto.shiftIds,
      dto.permanent,
      dto.reason.trim(),
      dto.actor || 'Chủ sân'
    );

    return {
      deletedCount: res.deletedCount,
      affectedIds: res.affectedIds,
      warningQuotaZero: false,
    };
  }

  /**
   * Unassign staff from shift (keep slot as unassigned)
   */
  public unassignStaff(id: string, reason?: string, actor?: string): ShiftRegistration {
    const shift = this.repo.getById(id);
    if (!shift) {
      throw new Error(`Không tìm thấy ca trực: ${id}`);
    }

    const updated = this.repo.update(id, {
      employeeId: 'UNASSIGNED',
      employeeName: 'Chưa phân công',
      notes: reason ? `[Gỡ phân công]: ${reason}` : '[Gỡ phân công]',
      status: 'scheduled',
    });

    if (!updated) {
      throw new Error('Không thể gỡ phân công nhân viên');
    }

    this.repo.addAuditLog({
      action: 'unassign',
      shiftId: id,
      employeeId: shift.employeeId,
      employeeName: shift.employeeName,
      date: shift.date,
      shiftType: shift.shiftType,
      reason: reason || 'Gỡ nhân viên khỏi ca trực',
      performedBy: actor || 'Quản lý',
    });

    return updated;
  }

  /**
   * Assign task to a shift (Giao việc cho ca trực)
   */
  public assignTask(
    id: string,
    taskTitle: string,
    courtArea?: string,
    priority: 'normal' | 'important' | 'urgent' = 'normal',
    actor: string = 'Quản lý sân'
  ): ShiftRegistration {
    const shift = this.repo.getById(id);
    if (!shift) {
      throw new Error(`Không tìm thấy ca trực với mã: ${id}`);
    }

    const existingTasks = shift.tasks || [];
    const formattedTask = priority === 'urgent'
      ? `[KHẨN CẤP] ${taskTitle}`
      : priority === 'important'
      ? `[QUAN TRỌNG] ${taskTitle}`
      : taskTitle;

    const updatedTasks = [...existingTasks, formattedTask];

    const updated = this.repo.update(id, {
      tasks: updatedTasks,
      courtArea: courtArea || shift.courtArea,
      taskDescription: shift.taskDescription
        ? `${shift.taskDescription}; ${formattedTask}`
        : formattedTask,
    });

    this.repo.addAuditLog({
      action: 'update',
      shiftId: id,
      employeeId: shift.employeeId,
      employeeName: shift.employeeName,
      date: shift.date,
      reason: `Giao nhiệm vụ ca: ${taskTitle} (${priority})`,
      performedBy: actor,
    });

    return updated!;
  }

  /**
   * UC-10: Preview Export Excel Data
   * - Aggregates data according to filters
   * - Calculates x1.3 night bonus for Ca 3 (BR2)
   * - Returns operational days, staff count, summary calculations
   */
  public getExportPreview(query: ShiftExportQuery): ShiftExportPreviewResult {
    const month = query.month || '10';
    const year = query.year || '2026';
    const scope = query.scope || 'week_current';
    const includeNightBonus = query.includeNightBonus === true || query.includeNightBonus === 'true';
    const onlyCompleted = query.onlyCompleted === true || query.onlyCompleted === 'true';

    // Base filter by month & year
    let shifts = this.repo.getAll({ month, year });

    // Filter by scope
    if (scope === 'week_1') {
      shifts = shifts.filter((s) => {
        const day = parseInt(s.date.split('-')[2], 10);
        return day >= 1 && day <= 7;
      });
    } else if (scope === 'week_2') {
      shifts = shifts.filter((s) => {
        const day = parseInt(s.date.split('-')[2], 10);
        return day >= 8 && day <= 14;
      });
    } else if (scope === 'week_3' || scope === 'week_current') {
      shifts = shifts.filter((s) => {
        const day = parseInt(s.date.split('-')[2], 10);
        return day >= 15 && day <= 21;
      });
    } else if (scope === 'week_4') {
      shifts = shifts.filter((s) => {
        const day = parseInt(s.date.split('-')[2], 10);
        return day >= 22 && day <= 28;
      });
    } else if (scope === 'week_5') {
      shifts = shifts.filter((s) => {
        const day = parseInt(s.date.split('-')[2], 10);
        return day >= 29;
      });
    }

    // Filter by employee
    if (query.employeeId && query.employeeId !== 'ALL') {
      shifts = shifts.filter((s) => s.employeeId === query.employeeId);
    }

    // Filter by shift type
    if (query.shiftType && query.shiftType !== 'ALL') {
      shifts = shifts.filter((s) => s.shiftType === query.shiftType);
    }

    // Filter by status if onlyCompleted
    if (onlyCompleted) {
      shifts = shifts.filter((s) => s.status === 'completed');
    } else {
      shifts = shifts.filter((s) => s.status !== 'cancelled');
    }

    // Calculate metrics
    const operationalDaysSet = new Set(shifts.map((s) => s.date));
    const staffMap = new Map<
      string,
      {
        employeeId: string;
        employeeName: string;
        shiftCount: number;
        shift1Count: number;
        shift2Count: number;
        shift3Count: number;
        standardHours: number;
        weightedHours: number;
      }
    >();

    let totalStandardHours = 0;
    let totalWeightedHours = 0;

    shifts.forEach((s) => {
      const config = this.getStandardShiftConfig(s.shiftType);
      const hours = config.hours;
      const weighted = config.isNight && includeNightBonus ? hours * 1.3 : hours;

      totalStandardHours += hours;
      totalWeightedHours += weighted;

      const empId = s.employeeId || 'UNASSIGNED';
      const empName = s.employeeName || 'Chưa phân công';

      if (!staffMap.has(empId)) {
        staffMap.set(empId, {
          employeeId: empId,
          employeeName: empName,
          shiftCount: 0,
          shift1Count: 0,
          shift2Count: 0,
          shift3Count: 0,
          standardHours: 0,
          weightedHours: 0,
        });
      }

      const rec = staffMap.get(empId)!;
      rec.shiftCount += 1;
      if (s.shiftType === 'Ca 1') rec.shift1Count += 1;
      else if (s.shiftType === 'Ca 2') rec.shift2Count += 1;
      else if (s.shiftType === 'Ca 3') rec.shift3Count += 1;
      rec.standardHours += hours;
      rec.weightedHours += Math.round(weighted * 10) / 10;
    });

    const staffSummary = Array.from(staffMap.values());
    const expectedFileName = `Bang_Phan_Ca_Thang_${month}_${year}_CourtX.xlsx`;

    return {
      month,
      year,
      scope,
      totalShifts: shifts.length,
      operationalDays: operationalDaysSet.size,
      staffCount: staffMap.size,
      standardHours: totalStandardHours,
      weightedHours: Math.round(totalWeightedHours * 10) / 10,
      expectedFileName,
      shifts,
      staffSummary,
    };
  }

  /**
   * UC-10: Generate Excel/CSV report file content
   */
  public generateExportCsv(query: ShiftExportQuery): {
    csvContent: string;
    filename: string;
  } {
    const preview = this.getExportPreview(query);

    const lines: string[] = [];

    // UTF-8 BOM for Excel support (BR1 UC-10)
    lines.push(`HỆ THỐNG QUẢN LÝ NHÀ THI ĐẤU COURTX ARENA`);
    lines.push(`BẢNG TỔNG HỢP PHÂN CA & CHẤM CÔNG NHÂN SỰ`);
    lines.push(
      `Kỳ trích xuất: Tháng ${preview.month}/${preview.year} - Phạm vi: ${preview.scope}`
    );
    lines.push(
      `Tổng số ca: ${preview.totalShifts} | Ngày vận hành: ${preview.operationalDays} ngày | Tổng giờ quy đổi: ${preview.weightedHours} giờ`
    );
    lines.push('');

    // Section 1: Detailed Shifts Table
    lines.push(
      'STT,Mã ca,Ngày trực,Thứ,Ca trực,Khung giờ,Mã nhân viên,Họ và tên nhân viên,Khu vực phụ trách,Giờ chuẩn,Hệ số đêm,Giờ quy đổi,Trạng thái,Nhiệm vụ bàn giao'
    );

    preview.shifts.forEach((s, idx) => {
      const config = this.getStandardShiftConfig(s.shiftType);
      const isNight = config.isNight;
      const multiplier = isNight && query.includeNightBonus !== false && query.includeNightBonus !== 'false' ? 1.3 : 1.0;
      const weighted = Math.round(config.hours * multiplier * 10) / 10;
      const statusLabel =
        s.status === 'completed'
          ? 'Đã hoàn thành'
          : s.status === 'in_progress'
          ? 'Đang trực'
          : s.status === 'cancelled'
          ? 'Đã hủy'
          : 'Đã xếp lịch';

      const taskSafe = (s.taskDescription || '').replace(/,/g, ';');

      lines.push(
        `${idx + 1},${s.id},${s.date},${s.dayOfWeek},${s.shiftType},"${s.timeRange}",${s.employeeId},"${s.employeeName}","${s.courtArea || ''}",${config.hours},${multiplier},${weighted},${statusLabel},"${taskSafe}"`
      );
    });

    lines.push('');
    // Section 2: Staff Summary Table
    lines.push('--- BẢNG TỔNG HỢP CÔNG THEO TỪNG NHÂN SỰ ---');
    lines.push(
      'STT,Mã nhân viên,Họ và tên,Tổng số ca,Ca 1 (Sáng),Ca 2 (Chiều),Ca 3 (Đêm),Tổng giờ tiêu chuẩn,Tổng giờ quy đổi (x1.3 đêm)'
    );

    preview.staffSummary.forEach((staff, idx) => {
      lines.push(
        `${idx + 1},${staff.employeeId},"${staff.employeeName}",${staff.shiftCount},${staff.shift1Count},${staff.shift2Count},${staff.shift3Count},${staff.standardHours},${staff.weightedHours}`
      );
    });

    // Totals row
    lines.push(
      `TỔNG CỘNG,,,"${preview.totalShifts} ca",,,,${preview.standardHours}h,${preview.weightedHours}h`
    );

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const filename = `Bang_Phan_Ca_Thang_${preview.month}_${preview.year}_CourtX.csv`;

    return { csvContent, filename };
  }

  /**
   * Shift statistics for admin dashboard
   */
  public getShiftStatistics(month?: string, year?: string): ShiftStatisticsResult {
    const shifts = this.repo.getAll({ month, year });

    let scheduled = 0;
    let inProgress = 0;
    let completed = 0;
    let cancelled = 0;
    let s1 = 0;
    let s2 = 0;
    let s3 = 0;
    let totalHours = 0;
    let unassigned = 0;

    shifts.forEach((s) => {
      if (s.status === 'scheduled') scheduled++;
      else if (s.status === 'in_progress') inProgress++;
      else if (s.status === 'completed') completed++;
      else if (s.status === 'cancelled') cancelled++;

      if (s.shiftType === 'Ca 1') s1++;
      else if (s.shiftType === 'Ca 2') s2++;
      else if (s.shiftType === 'Ca 3') s3++;

      if (s.employeeId === 'UNASSIGNED' || !s.employeeId) {
        unassigned++;
      }

      if (s.status !== 'cancelled') {
        const config = this.getStandardShiftConfig(s.shiftType);
        totalHours += config.hours;
      }
    });

    const activeShiftsCount = scheduled + inProgress + completed;
    const coverageRate = activeShiftsCount > 0
      ? Math.round(((activeShiftsCount - unassigned) / activeShiftsCount) * 100)
      : 100;

    return {
      totalShifts: shifts.length,
      scheduledShifts: scheduled,
      inProgressShifts: inProgress,
      completedShifts: completed,
      cancelledShifts: cancelled,
      coverageRate,
      unassignedSlots: unassigned,
      totalWorkingHours: totalHours,
      shiftTypeBreakdown: {
        shift1: s1,
        shift2: s2,
        shift3: s3,
      },
    };
  }

  /**
   * Get shift audit logs
   */
  public getAuditLogs(): ShiftAuditLog[] {
    return this.repo.getAuditLogs();
  }
}

export const shiftService = new ShiftService();
