import { Request, Response } from 'express';
import { shiftService } from '../services/shiftService.js';
import { CreateShiftDTO, UpdateShiftDTO, BatchCreateShiftDTO, BatchDeleteShiftDTO } from '../types/shift.js';

function getActor(req: Request, fallback: string = 'Quản lý sân'): string {
  const h = req.headers['x-actor-name'];
  if (Array.isArray(h)) return h[0] || fallback;
  return (h as string) || fallback;
}

export class ShiftController {
  /**
   * GET /api/shifts
   * Query shifts with filters
   */
  public async getShifts(req: Request, res: Response): Promise<void> {
    try {
      const {
        date,
        startDate,
        endDate,
        month,
        year,
        employeeId,
        shiftType,
        status,
        courtArea,
      } = req.query;

      const shifts = shiftService.getShifts({
        date: date ? String(date) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        month: month ? String(month) : undefined,
        year: year ? String(year) : undefined,
        employeeId: employeeId ? String(employeeId) : undefined,
        shiftType: shiftType ? String(shiftType) : undefined,
        status: status ? String(status) : undefined,
        courtArea: courtArea ? String(courtArea) : undefined,
      });

      res.status(200).json({
        success: true,
        total: shifts.length,
        shifts,
      });
    } catch (error: any) {
      console.error('Error in getShifts:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi tải danh sách ca trực',
      });
    }
  }

  /**
   * GET /api/shifts/:id
   * Get shift by ID
   */
  public async getShiftById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const shift = shiftService.getShiftById(id);

      if (!shift) {
        res.status(404).json({
          success: false,
          message: `Không tìm thấy ca trực với mã: ${id}`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        shift,
      });
    } catch (error: any) {
      console.error('Error in getShiftById:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi khi lấy thông tin ca trực',
      });
    }
  }

  /**
   * POST /api/shifts/validate
   * UC-08: Validate shift business rules
   */
  public async validateShift(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateShiftDTO = req.body;
      const validation = shiftService.validateShiftRules(dto);

      res.status(200).json({
        success: true,
        validation,
      });
    } catch (error: any) {
      console.error('Error in validateShift:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi kiểm tra quy tắc ca trực',
      });
    }
  }

  /**
   * POST /api/shifts
   * UC-08: Register / Assign a new shift
   */
  public async createShift(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateShiftDTO = req.body;
      const actor = getActor(req, 'Quản lý sân');

      const shift = shiftService.createShift(dto, actor);

      res.status(201).json({
        success: true,
        message: `Đăng ký ca trực thành công cho nhân viên ${shift.employeeName}!`,
        shift,
      });
    } catch (error: any) {
      console.error('Error in createShift:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi đăng ký ca trực',
      });
    }
  }

  /**
   * POST /api/shifts/batch
   * UC-08 Alternative Flow 3a: Batch assign shifts
   */
  public async createBatchShifts(req: Request, res: Response): Promise<void> {
    try {
      const dto: BatchCreateShiftDTO = req.body;
      const result = shiftService.createBatchShifts(dto);

      res.status(200).json({
        success: true,
        message: `Đã phân bổ thành công ${result.createdShifts.length} ca trực!`,
        createdCount: result.createdShifts.length,
        failedCount: result.failedShifts.length,
        createdShifts: result.createdShifts,
        failedShifts: result.failedShifts,
      });
    } catch (error: any) {
      console.error('Error in createBatchShifts:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi phân bổ ca trực hàng loạt',
      });
    }
  }

  /**
   * PUT /api/shifts/:id
   * Update shift details
   */
  public async updateShift(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updates: UpdateShiftDTO = req.body;
      const actor = getActor(req, 'Quản lý sân');

      const updated = shiftService.updateShift(id, updates, actor);

      res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin ca trực thành công!',
        shift: updated,
      });
    } catch (error: any) {
      console.error('Error in updateShift:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi cập nhật ca trực',
      });
    }
  }

  /**
   * DELETE /api/shifts/:id
   * UC-09: Delete or Cancel a shift
   */
  public async deleteShift(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const permanent = req.query.permanent === 'true' || req.body.permanent === true;
      const reason = String(req.body.reason || req.query.reason || 'Chủ sân hủy ca');
      const actor = getActor(req, 'Quản lý ca');

      const result = shiftService.deleteShift(id, {
        permanent,
        reason,
        actor,
      });

      res.status(200).json({
        success: true,
        message: permanent ? 'Đã xóa vĩnh viễn ca trực!' : 'Đã hủy ca trực thành công!',
        deletedShift: result.deletedShift,
        warningQuotaZero: result.warningQuotaZero,
        warningMessage: result.warningMessage,
      });
    } catch (error: any) {
      console.error('Error in deleteShift:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi khi xóa/hủy ca trực',
      });
    }
  }

  /**
   * POST /api/shifts/batch-delete
   * UC-09: Batch delete shifts
   */
  public async deleteBatchShifts(req: Request, res: Response): Promise<void> {
    try {
      const dto: BatchDeleteShiftDTO = req.body;
      const result = shiftService.deleteBatchShifts(dto);

      res.status(200).json({
        success: true,
        message: `Đã xử lý xóa/hủy ${result.deletedCount} ca trực!`,
        deletedCount: result.deletedCount,
        affectedIds: result.affectedIds,
      });
    } catch (error: any) {
      console.error('Error in deleteBatchShifts:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi xóa ca trực hàng loạt',
      });
    }
  }

  /**
   * PATCH /api/shifts/:id/unassign
   * Unassign employee from shift
   */
  public async unassignStaff(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const reason = req.body.reason ? String(req.body.reason) : undefined;
      const actor = getActor(req, 'Quản lý');

      const updated = shiftService.unassignStaff(id, reason, actor);

      res.status(200).json({
        success: true,
        message: 'Đã gỡ phân công nhân viên khỏi ca trực!',
        shift: updated,
      });
    } catch (error: any) {
      console.error('Error in unassignStaff:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi gỡ phân công nhân viên',
      });
    }
  }

  /**
   * POST /api/shifts/:id/tasks
   * Assign task to shift
   */
  public async assignTask(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { taskTitle, courtArea, priority } = req.body;
      const actor = getActor(req, 'Quản lý');

      if (!taskTitle || !String(taskTitle).trim()) {
        res.status(400).json({
          success: false,
          message: 'Tên nhiệm vụ không được để trống!',
        });
        return;
      }

      const updated = shiftService.assignTask(id, String(taskTitle).trim(), courtArea, priority, actor);

      res.status(200).json({
        success: true,
        message: 'Đã giao nhiệm vụ cho ca trực!',
        shift: updated,
      });
    } catch (error: any) {
      console.error('Error in assignTask:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Lỗi giao nhiệm vụ',
      });
    }
  }

  /**
   * GET /api/shifts/export/preview
   * UC-10: Preview export shift matrix
   */
  public async getExportPreview(req: Request, res: Response): Promise<void> {
    try {
      const {
        month,
        year,
        scope,
        employeeId,
        shiftType,
        includeNightBonus,
        onlyCompleted,
      } = req.query;

      const preview = shiftService.getExportPreview({
        month: month ? String(month) : undefined,
        year: year ? String(year) : undefined,
        scope: scope as any,
        employeeId: employeeId ? String(employeeId) : undefined,
        shiftType: shiftType ? String(shiftType) : undefined,
        includeNightBonus: includeNightBonus ? String(includeNightBonus) : undefined,
        onlyCompleted: onlyCompleted ? String(onlyCompleted) : undefined,
      });

      res.status(200).json({
        success: true,
        preview,
      });
    } catch (error: any) {
      console.error('Error in getExportPreview:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi xem trước dữ liệu trích xuất',
      });
    }
  }

  /**
   * GET /api/shifts/export/download
   * UC-10: Download Excel/CSV report
   */
  public async downloadExport(req: Request, res: Response): Promise<void> {
    try {
      const {
        month,
        year,
        scope,
        employeeId,
        shiftType,
        includeNightBonus,
        onlyCompleted,
      } = req.query;

      const { csvContent, filename } = shiftService.generateExportCsv({
        month: month ? String(month) : undefined,
        year: year ? String(year) : undefined,
        scope: scope as any,
        employeeId: employeeId ? String(employeeId) : undefined,
        shiftType: shiftType ? String(shiftType) : undefined,
        includeNightBonus: includeNightBonus ? String(includeNightBonus) : undefined,
        onlyCompleted: onlyCompleted ? String(onlyCompleted) : undefined,
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.status(200).send(csvContent);
    } catch (error: any) {
      console.error('Error in downloadExport:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi xuất tệp bảng phân ca',
      });
    }
  }

  /**
   * GET /api/shifts/statistics/kpi
   * Shift operational KPIs
   */
  public async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { month, year } = req.query;
      const stats = shiftService.getShiftStatistics(
        month ? String(month) : undefined,
        year ? String(year) : undefined
      );

      res.status(200).json({
        success: true,
        statistics: stats,
      });
    } catch (error: any) {
      console.error('Error in getStatistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi thống kê ca trực',
      });
    }
  }

  /**
   * GET /api/shifts/audit-logs
   * UC-09 BR2: Get audit logs for shift modifications
   */
  public async getAuditLogs(_req: Request, res: Response): Promise<void> {
    try {
      const logs = shiftService.getAuditLogs();
      res.status(200).json({
        success: true,
        total: logs.length,
        logs,
      });
    } catch (error: any) {
      console.error('Error in getAuditLogs:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Lỗi lấy nhật ký đối soát',
      });
    }
  }
}

export const shiftController = new ShiftController();
