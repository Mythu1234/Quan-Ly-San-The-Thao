import { Request, Response } from 'express';
import { facilityService } from '../services/facilityService.js';
import {
  CreateEquipmentDTO,
  UpdateEquipmentDTO,
  CreateIncidentDTO,
} from '../types/facility.js';

export class FacilityController {
  // ==========================================
  // DASHBOARD KPI (UC-06)
  // ==========================================
  public async getDashboardStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = facilityService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Lỗi khi lấy dữ liệu tổng quan cơ sở vật chất',
      });
    }
  }

  // ==========================================
  // EQUIPMENT ENDPOINTS (UC-07)
  // ==========================================
  public async getEquipments(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        location: typeof req.query.location === 'string' ? req.query.location : undefined,
        category: typeof req.query.category === 'string' ? req.query.category : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      };

      const list = facilityService.listEquipments(filters);
      res.status(200).json({
        success: true,
        total: list.length,
        data: list,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Lỗi khi lấy danh sách trang thiết bị',
      });
    }
  }

  public async getEquipmentById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const item = facilityService.getEquipment(id);
      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        message: err.message || 'Không tìm thấy trang thiết bị',
      });
    }
  }

  public async createEquipment(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateEquipmentDTO = req.body;
      const created = facilityService.createEquipment(dto);
      res.status(201).json({
        success: true,
        message: `Thêm thiết bị [${created.code}] ${created.name} thành công!`,
        data: created,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Dữ liệu thêm thiết bị không hợp lệ',
      });
    }
  }

  public async updateEquipment(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const dto: UpdateEquipmentDTO = req.body;
      const updated = facilityService.updateEquipment(id, dto);
      res.status(200).json({
        success: true,
        message: `Cập nhật thiết bị ${updated.code} thành công!`,
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi cập nhật thiết bị',
      });
    }
  }

  public async relocateEquipment(req: Request, res: Response): Promise<void> {
    try {
      const code = String(req.params.code);
      const { targetLocation, bookingCode, timeSlot, customerName } = req.body;

      if (!targetLocation) {
        res.status(400).json({ success: false, message: 'Vui lòng chọn vị trí cần chuyển đến' });
        return;
      }

      const updated = facilityService.relocateEquipment(code, targetLocation, {
        bookingCode,
        timeSlot,
        customerName,
      });

      res.status(200).json({
        success: true,
        message: `Đã điều chuyển thiết bị [${updated.code}] sang "${targetLocation}"!`,
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi điều chuyển thiết bị',
      });
    }
  }

  public async returnToWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const code = String(req.params.code);
      const updated = facilityService.returnToWarehouse(code);
      res.status(200).json({
        success: true,
        message: `Đã thu hồi thiết bị [${updated.code}] về Kho chung thành công!`,
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi thu hồi thiết bị về kho',
      });
    }
  }

  public async checkoutCourtEquipments(req: Request, res: Response): Promise<void> {
    try {
      const { courtName } = req.body;
      if (!courtName) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập tên sân cần checkout' });
        return;
      }

      const returned = facilityService.checkoutCourtEquipments(courtName);
      res.status(200).json({
        success: true,
        message: `Đã tự động thu hồi ${returned.length} thiết bị của ${courtName} về Kho chung!`,
        data: returned,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi checkout thiết bị sân',
      });
    }
  }

  public async deleteEquipment(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      facilityService.deleteEquipment(id);
      res.status(200).json({
        success: true,
        message: `Đã xóa trang thiết bị ${id} thành công!`,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi xóa trang thiết bị',
      });
    }
  }

  // ==========================================
  // COURT STATUS ENDPOINTS (UC-04)
  // ==========================================
  public async getCourts(_req: Request, res: Response): Promise<void> {
    try {
      const courts = facilityService.listCourts();
      res.status(200).json({
        success: true,
        total: courts.length,
        data: courts,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Lỗi khi lấy trạng thái các sân',
      });
    }
  }

  public async toggleCourtLock(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { isLocked, reason, lockedBy } = req.body;

      if (typeof isLocked !== 'boolean') {
        res.status(400).json({ success: false, message: 'Trường isLocked phải là boolean (true/false)' });
        return;
      }

      const updated = facilityService.toggleCourtLock(id, isLocked, reason, lockedBy);
      const actionText = isLocked ? `Khóa bảo trì (Master Lock) ${updated.name}` : `Mở lại ${updated.name} đón khách`;

      res.status(200).json({
        success: true,
        message: `Đã ${actionText} thành công!`,
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi chuyển trạng thái khóa sân',
      });
    }
  }

  // ==========================================
  // INCIDENT ENDPOINTS (UC-03, UC-05)
  // ==========================================
  public async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        severity: typeof req.query.severity === 'string' ? req.query.severity : undefined,
        courtId: typeof req.query.courtId === 'string' ? req.query.courtId : undefined,
      };

      const list = facilityService.listIncidents(filters);
      res.status(200).json({
        success: true,
        total: list.length,
        data: list,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Lỗi khi lấy danh sách sự cố hỏng hóc',
      });
    }
  }

  public async getIncidentById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const item = facilityService.getIncident(id);
      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        message: err.message || 'Không tìm thấy phiếu báo cáo sự cố',
      });
    }
  }

  public async createIncident(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateIncidentDTO = req.body;
      const result = facilityService.createIncident(dto);

      const lockNote = result.courtLocked ? ' (Đã tự động kích hoạt Master Lock khóa bảo trì sân)' : '';

      res.status(201).json({
        success: true,
        message: `Báo cáo sự cố #${result.incident.id} thành công!${lockNote}`,
        data: result.incident,
        courtLocked: result.courtLocked,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Dữ liệu báo cáo sự cố không hợp lệ',
      });
    }
  }

  public async updateIncidentStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status, unlockCourt, technicianNote } = req.body;

      if (!status || !['cho_xu_ly', 'dang_sua_chua', 'da_khac_phuc'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Trạng thái không hợp lệ (phải là cho_xu_ly, dang_sua_chua hoặc da_khac_phuc)',
        });
        return;
      }

      const result = facilityService.updateIncidentStatus(
        id,
        status,
        unlockCourt === true,
        technicianNote
      );

      const unlockNote = result.courtUnlocked ? ' và tự động mở lại sân hoạt động tốt' : '';

      res.status(200).json({
        success: true,
        message: `Cập nhật tiến độ sự cố #${id} thành "${result.incident.statusLabel}"${unlockNote}!`,
        data: result.incident,
        courtUnlocked: result.courtUnlocked,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi cập nhật trạng thái sự cố',
      });
    }
  }

  public async addIncidentTimelineLog(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { title, description } = req.body;

      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề nhật ký tiến độ' });
        return;
      }

      const updated = facilityService.addTimelineLog(id, title, description || '');
      res.status(200).json({
        success: true,
        message: 'Đã thêm nhật ký tiến độ sự cố thành công!',
        data: updated,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Lỗi khi thêm nhật ký sự cố',
      });
    }
  }
}

export const facilityController = new FacilityController();
