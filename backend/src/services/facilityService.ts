import {
  FacilityEquipment,
  CourtStatusItem,
  FacilityIncident,
  CreateEquipmentDTO,
  UpdateEquipmentDTO,
  CreateIncidentDTO,
  FacilityDashboardStats,
  EquipmentCategory,
} from '../types/facility.js';
import { facilityRepository } from '../repositories/facilityRepository.js';

export class FacilityService {
  private categoryLabels: Record<EquipmentCategory, string> = {
    tru_luoi: 'Trụ & Lưới',
    tham_san: 'Mặt thảm',
    chieu_sang: 'Chiếu sáng',
    dung_cu: 'Dụng cụ',
    ve_sinh: 'Vệ sinh',
  };

  // ==========================================
  // DASHBOARD KPI STATS (UC-06)
  // ==========================================
  public getDashboardStats(): FacilityDashboardStats {
    const equipments = facilityRepository.getAllEquipments();
    const courts = facilityRepository.getAllCourts();
    const incidents = facilityRepository.getAllIncidents();

    const readyEquipments = equipments.filter((e) => e.status === 'san_sang').length;
    const inUseEquipments = equipments.filter((e) => e.status === 'dang_su_dung').length;
    const maintenanceEquipments = equipments.filter((e) => e.status === 'bao_tri' || e.status === 'hong').length;

    const lockedCourts = courts.filter((c) => c.isLocked).length;
    const openCourts = courts.length - lockedCourts;

    const urgentIncidents = incidents.filter(
      (i) => i.severity === 'khan_cap' && i.status !== 'da_khac_phuc'
    ).length;
    const pendingIncidents = incidents.filter((i) => i.status !== 'da_khac_phuc').length;

    return {
      totalEquipments: equipments.length,
      readyEquipments,
      inUseEquipments,
      maintenanceEquipments,
      totalCourts: courts.length,
      lockedCourts,
      openCourts,
      totalIncidents: incidents.length,
      urgentIncidents,
      pendingIncidents,
    };
  }

  // ==========================================
  // EQUIPMENT OPERATIONS (UC-07)
  // ==========================================
  public listEquipments(filters?: {
    location?: string;
    category?: string;
    status?: string;
    search?: string;
  }): FacilityEquipment[] {
    let list = facilityRepository.getAllEquipments();

    if (filters) {
      const { location, category, status, search } = filters;

      if (location && location !== 'ALL') {
        list = list.filter((e) => e.currentLocation.toLowerCase() === location.toLowerCase());
      }

      if (category && category !== 'ALL') {
        list = list.filter((e) => e.category === category);
      }

      if (status && status !== 'ALL') {
        list = list.filter((e) => e.status === status);
      }

      if (search && search.trim()) {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (e) =>
            e.name.toLowerCase().includes(q) ||
            e.code.toLowerCase().includes(q) ||
            e.categoryLabel.toLowerCase().includes(q) ||
            e.currentLocation.toLowerCase().includes(q)
        );
      }
    }

    return list;
  }

  public getEquipment(idOrCode: string): FacilityEquipment {
    const item = facilityRepository.getEquipmentById(idOrCode) || facilityRepository.getEquipmentByCode(idOrCode);
    if (!item) {
      throw new Error(`Không tìm thấy trang thiết bị với mã: ${idOrCode}`);
    }
    return item;
  }

  public createEquipment(dto: CreateEquipmentDTO): FacilityEquipment {
    if (!dto.name || !dto.name.trim()) {
      throw new Error('Tên trang thiết bị không được để trống!');
    }

    const { id, code } = facilityRepository.getNextEquipmentIdAndCode();
    const finalCode = dto.code?.trim() || code;

    // Check if code already exists
    const existing = facilityRepository.getEquipmentByCode(finalCode);
    if (existing) {
      throw new Error(`Mã thiết bị "${finalCode}" đã tồn tại trên hệ thống!`);
    }

    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()}`;
    const warrantyDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear() + 2}`;

    const isWarehouse = dto.currentLocation.toLowerCase().includes('kho');
    const status = isWarehouse ? 'san_sang' : 'dang_su_dung';
    const statusLabel = isWarehouse ? 'Sẵn sàng' : 'Đang sử dụng';

    const newEquipment: FacilityEquipment = {
      id,
      code: finalCode,
      name: dto.name.trim(),
      category: dto.category,
      categoryLabel: this.categoryLabels[dto.category] || 'Dụng cụ',
      sportType: dto.sportType || 'CauLong',
      currentLocation: dto.currentLocation || 'Kho chung',
      status,
      statusLabel,
      healthRate: dto.healthRate || 'Mới 100%',
      purchaseDate: dto.purchaseDate || dateFormatted,
      warrantyExpire: dto.warrantyExpire || warrantyDate,
      supplier: dto.supplier?.trim() || undefined,
      supplierPhone: dto.supplierPhone?.trim() || undefined,
      serialNumber: dto.serialNumber?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    return facilityRepository.createEquipment(newEquipment);
  }

  public updateEquipment(idOrCode: string, dto: UpdateEquipmentDTO): FacilityEquipment {
    const existing = this.getEquipment(idOrCode);

    const updates: Partial<FacilityEquipment> = {};
    if (dto.name !== undefined) updates.name = dto.name.trim();
    if (dto.category !== undefined) {
      updates.category = dto.category;
      updates.categoryLabel = this.categoryLabels[dto.category] || 'Dụng cụ';
    }
    if (dto.sportType !== undefined) updates.sportType = dto.sportType;
    if (dto.currentLocation !== undefined) updates.currentLocation = dto.currentLocation;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.statusLabel !== undefined) updates.statusLabel = dto.statusLabel;
    if (dto.healthRate !== undefined) updates.healthRate = dto.healthRate;
    if (dto.notes !== undefined) updates.notes = dto.notes;
    if (dto.lastMaintenance !== undefined) updates.lastMaintenance = dto.lastMaintenance;
    if (dto.warrantyExpire !== undefined) updates.warrantyExpire = dto.warrantyExpire;
    if (dto.supplier !== undefined) updates.supplier = dto.supplier;
    if (dto.supplierPhone !== undefined) updates.supplierPhone = dto.supplierPhone;
    if (dto.serialNumber !== undefined) updates.serialNumber = dto.serialNumber;

    if (dto.assignedBookingCode !== undefined) updates.assignedBookingCode = dto.assignedBookingCode;
    if (dto.assignedTimeSlot !== undefined) updates.assignedTimeSlot = dto.assignedTimeSlot;
    if (dto.assignedCustomer !== undefined) updates.assignedCustomer = dto.assignedCustomer;
    if (dto.assignedCourt !== undefined) updates.assignedCourt = dto.assignedCourt;

    const updated = facilityRepository.updateEquipment(existing.id, updates);
    if (!updated) {
      throw new Error(`Cập nhật trang thiết bị ${idOrCode} thất bại.`);
    }
    return updated;
  }

  public relocateEquipment(
    code: string,
    targetLocation: string,
    bookingDetails?: {
      bookingCode?: string;
      timeSlot?: string;
      customerName?: string;
    }
  ): FacilityEquipment {
    const isWarehouse = targetLocation.toLowerCase().includes('kho');

    const updates: Partial<FacilityEquipment> = {
      currentLocation: targetLocation,
      status: isWarehouse ? 'san_sang' : 'dang_su_dung',
      statusLabel: isWarehouse ? 'Sẵn sàng' : 'Đang sử dụng',
      lastMaintenance: new Date().toLocaleDateString('vi-VN'),
    };

    if (isWarehouse) {
      updates.healthRate = 'Sẵn sàng điều phối';
      updates.assignedBookingCode = undefined;
      updates.assignedTimeSlot = undefined;
      updates.assignedCustomer = undefined;
      updates.assignedCourt = undefined;
    } else if (bookingDetails?.bookingCode) {
      updates.assignedBookingCode = bookingDetails.bookingCode;
      updates.assignedTimeSlot = bookingDetails.timeSlot;
      updates.assignedCustomer = bookingDetails.customerName;
      updates.assignedCourt = targetLocation;
    }

    const result = facilityRepository.updateEquipment(code, updates);
    if (!result) {
      throw new Error(`Không thể điều chuyển thiết bị ${code}.`);
    }
    return result;
  }

  public returnToWarehouse(code: string): FacilityEquipment {
    return this.relocateEquipment(code, 'Kho chung');
  }

  public checkoutCourtEquipments(courtName: string): FacilityEquipment[] {
    const all = facilityRepository.getAllEquipments();
    const updatedList: FacilityEquipment[] = [];

    for (const eq of all) {
      if (eq.currentLocation === courtName || eq.assignedCourt === courtName) {
        const returned = this.returnToWarehouse(eq.code);
        updatedList.push(returned);
      }
    }
    return updatedList;
  }

  public deleteEquipment(idOrCode: string): boolean {
    const existing = this.getEquipment(idOrCode);
    const success = facilityRepository.deleteEquipment(existing.id);
    if (!success) {
      throw new Error(`Xóa thiết bị ${idOrCode} thất bại.`);
    }
    return true;
  }

  // ==========================================
  // COURT STATUS OPERATIONS (UC-04)
  // ==========================================
  public listCourts(): CourtStatusItem[] {
    return facilityRepository.getAllCourts();
  }

  public toggleCourtLock(
    courtId: string,
    isLocked: boolean,
    reason?: string,
    lockedBy?: string
  ): CourtStatusItem {
    const court = facilityRepository.getCourtById(courtId);
    if (!court) {
      throw new Error(`Không tìm thấy sân với mã: ${courtId}`);
    }

    const updated = facilityRepository.updateCourtLock(
      courtId,
      isLocked,
      isLocked ? (reason || 'Bảo trì kỹ thuật (Master Lock)') : undefined,
      lockedBy || 'Admin'
    );

    if (!updated) {
      throw new Error(`Không thể chuyển trạng thái khóa sân ${courtId}`);
    }

    return updated;
  }

  // ==========================================
  // INCIDENT OPERATIONS (UC-03, UC-05)
  // ==========================================
  public listIncidents(filters?: {
    status?: string;
    severity?: string;
    courtId?: string;
  }): FacilityIncident[] {
    let list = facilityRepository.getAllIncidents();

    if (filters) {
      const { status, severity, courtId } = filters;
      if (status && status !== 'ALL') {
        list = list.filter((i) => i.status === status);
      }
      if (severity && severity !== 'ALL') {
        list = list.filter((i) => i.severity === severity);
      }
      if (courtId && courtId !== 'ALL') {
        list = list.filter((i) => i.courtId?.toLowerCase() === courtId.toLowerCase());
      }
    }

    return list;
  }

  public getIncident(id: string): FacilityIncident {
    const incident = facilityRepository.getIncidentById(id);
    if (!incident) {
      throw new Error(`Không tìm thấy phiếu báo cáo sự cố: ${id}`);
    }
    return incident;
  }

  public createIncident(dto: CreateIncidentDTO): { incident: FacilityIncident; courtLocked: boolean } {
    if (!dto.title || !dto.title.trim()) {
      throw new Error('Vui lòng nhập tiêu đề sự cố!');
    }
    if (!dto.courtName || !dto.courtName.trim()) {
      throw new Error('Vui lòng chọn sân xảy ra sự cố!');
    }

    const nextId = facilityRepository.getNextIncidentId();
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()}`;
    const reportedAt = `${timeStr} • ${dateStr}`;

    const severityLabels = {
      khan_cap: 'Khẩn cấp',
      trung_binh: 'Trung bình',
      thap: 'Thấp',
    };

    // Auto-lock court if requested or if severity is "khan_cap" (UC-03 BR1)
    const shouldLockCourt = dto.lockCourt === true || dto.severity === 'khan_cap';

    const initialTimelineLogs = [
      {
        id: `TL-${Date.now()}-1`,
        time: timeStr,
        title: 'Ghi nhận biên bản sự cố',
        description: `${dto.reporterName || 'Nhân viên'} lập biên bản sự cố hiện trường: ${dto.title}.`,
        active: !shouldLockCourt,
      },
    ];

    if (shouldLockCourt && dto.courtId) {
      initialTimelineLogs.unshift({
        id: `TL-${Date.now()}-2`,
        time: timeStr,
        title: 'Kích hoạt Master Lock khóa sân tự động',
        description: `Hệ thống tự động kích hoạt chế độ bảo trì Master Lock đóng ${dto.courtName} trên lịch trực tuyến.`,
        active: true,
      });

      // Execute court lock
      facilityRepository.updateCourtLock(
        dto.courtId,
        true,
        `Sự cố ${severityLabels[dto.severity]}: ${dto.title}`,
        dto.reporterName || 'Admin'
      );
    }

    const damageItems = dto.damageItems && dto.damageItems.length > 0
      ? dto.damageItems
      : dto.imageUrl
      ? [
          {
            id: `DM-${Date.now()}`,
            equipmentCode: dto.equipmentCode,
            title: dto.title.trim(),
            riskBadge: severityLabels[dto.severity] || 'Khẩn cấp',
            riskColor: (dto.severity === 'khan_cap' ? 'rose' : dto.severity === 'trung_binh' ? 'blue' : 'amber') as any,
            description: dto.description?.trim() || 'Hiện trường hỏng hóc thực tế',
            imageLabel: 'Ảnh chụp hiện trường sự cố',
            imageUrl: dto.imageUrl,
          },
        ]
      : [];

    const newIncident: FacilityIncident = {
      id: nextId,
      courtId: dto.courtId,
      courtName: dto.courtName,
      courtZone: dto.courtZone || 'Khu A',
      courtSubtype: dto.courtSubtype || 'Sân Cầu Lông Đa Năng',
      isCourtLocked: shouldLockCourt,
      equipmentCode: dto.equipmentCode,
      equipmentName: dto.equipmentName,
      title: dto.title.trim(),
      description: dto.description?.trim() || 'Cần kiểm tra kỹ thuật tại chỗ',
      severity: dto.severity,
      severityLabel: severityLabels[dto.severity] || 'Trung bình',
      status: 'cho_xu_ly',
      statusLabel: 'Chờ xử lý',
      reportedAt,
      reporterName: dto.reporterName || 'Nguyễn Văn An',
      reporterRole: dto.reporterRole || 'Nhân viên vận hành',
      reporterPhone: dto.reporterPhone || '0901.234.567',
      damageItems,
      timelineLogs: initialTimelineLogs,
      technicianNote: dto.technicianNote,
      imageUrl: dto.imageUrl,
      images: dto.images || (dto.imageUrl ? [dto.imageUrl] : []),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const created = facilityRepository.createIncident(newIncident);
    return {
      incident: created,
      courtLocked: shouldLockCourt,
    };
  }

  public updateIncidentStatus(
    id: string,
    newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc',
    unlockCourt = false,
    technicianNote?: string
  ): { incident: FacilityIncident; courtUnlocked: boolean } {
    const existing = this.getIncident(id);

    const updated = facilityRepository.updateIncidentStatus(id, newStatus, technicianNote);
    if (!updated) {
      throw new Error(`Cập nhật trạng thái sự cố ${id} thất bại.`);
    }

    let courtWasUnlocked = false;

    // UC-05: Nghiệm thu & Mở lại sân
    if (newStatus === 'da_khac_phuc' && unlockCourt && existing.courtId) {
      facilityRepository.updateCourtLock(existing.courtId, false);
      courtWasUnlocked = true;

      const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      facilityRepository.addIncidentTimelineLog(id, {
        id: `TL-${Date.now()}`,
        time: nowTime,
        title: 'Nghiệm thu hoàn tất & Mở lại sân',
        description: `Ban quản lý đã kiểm tra hiện trường, các hạng mục hỏng hóc đã khắc phục đạt chuẩn. Sân ${existing.courtName} được mở lại phục vụ khách.`,
        active: true,
      });
    }

    return {
      incident: facilityRepository.getIncidentById(id) || updated,
      courtUnlocked: courtWasUnlocked,
    };
  }

  public addTimelineLog(incidentId: string, title: string, description: string): FacilityIncident {
    this.getIncident(incidentId);

    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const log = {
      id: `TL-${Date.now()}`,
      time: nowTime,
      title: title.trim(),
      description: description.trim(),
      active: true,
    };

    const updated = facilityRepository.addIncidentTimelineLog(incidentId, log);
    if (!updated) {
      throw new Error(`Thêm nhật ký tiến độ sự cố ${incidentId} thất bại.`);
    }
    return updated;
  }
}

export const facilityService = new FacilityService();
