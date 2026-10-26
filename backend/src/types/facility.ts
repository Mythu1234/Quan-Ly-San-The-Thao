export type EquipmentCategory = 'tru_luoi' | 'tham_san' | 'chieu_sang' | 'dung_cu' | 've_sinh';
export type EquipmentStatus = 'san_sang' | 'dang_su_dung' | 'bao_tri' | 'hong';
export type EquipmentSportType = 'CauLong' | 'BongChuyen' | 'BongDa' | 'DungChung' | 'Pickleball';

export interface FacilityEquipment {
  id: string;               // EQ01, EQ02...
  code: string;             // MATB-01, MATB-02...
  name: string;             // Bộ trụ & Lưới Yonex Pro...
  category: EquipmentCategory;
  categoryLabel: string;    // Trụ & Lưới, Mặt thảm, Chiếu sáng, Dụng cụ, Vệ sinh
  sportType: EquipmentSportType;
  currentLocation: string;  // Sân 01, Sân 02... Kho chung
  status: EquipmentStatus;
  statusLabel: string;      // Sẵn sàng, Đang sử dụng, Bảo trì, Hỏng
  healthRate: string;       // Mới 95%, Tốt, Cần bảo trì ngay...
  purchaseDate: string;     // Ngày nhập
  warrantyExpire: string;   // Hạn bảo hành
  supplier?: string;        // Hãng / Nhà cung cấp bảo hành
  supplierPhone?: string;   // Hotline bảo hành
  serialNumber?: string;    // Số Seri / Model
  lastMaintenance?: string; // Ngày bảo dưỡng gần nhất
  notes?: string;
  assignedBookingCode?: string;
  assignedTimeSlot?: string;
  assignedCustomer?: string;
  assignedCourt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEquipmentDTO {
  name: string;
  category: EquipmentCategory;
  sportType: EquipmentSportType;
  currentLocation: string;
  healthRate?: string;
  purchaseDate?: string;
  warrantyExpire?: string;
  supplier?: string;
  supplierPhone?: string;
  serialNumber?: string;
  notes?: string;
  code?: string;
}

export interface UpdateEquipmentDTO {
  name?: string;
  category?: EquipmentCategory;
  categoryLabel?: string;
  sportType?: EquipmentSportType;
  currentLocation?: string;
  status?: EquipmentStatus;
  statusLabel?: string;
  healthRate?: string;
  purchaseDate?: string;
  warrantyExpire?: string;
  supplier?: string;
  supplierPhone?: string;
  serialNumber?: string;
  lastMaintenance?: string;
  notes?: string;
  assignedBookingCode?: string;
  assignedTimeSlot?: string;
  assignedCustomer?: string;
  assignedCourt?: string;
}

export interface CourtStatusItem {
  id: string;               // SAN-01 .. SAN-08
  courtNumber: number;      // 1 .. 8
  name: string;             // Sân 01 (Tiêu chuẩn A)...
  isLocked: boolean;        // true = Đang khóa bảo trì, false = Đang mở
  lockReason?: string;      // Sửa thảm & đèn, Thay lưới...
  lockedAt?: string;
  lockedBy?: string;
  updatedAt?: string;
}

export interface IncidentDamageItem {
  id: string;
  equipmentCode?: string;
  title: string;
  riskBadge: string;
  riskColor: 'rose' | 'amber' | 'blue' | 'slate';
  description: string;
  imageLabel?: string;
  imageUrl?: string;
}

export interface IncidentTimelineLog {
  id: string;
  time: string;
  title: string;
  description: string;
  active?: boolean;
}

export interface FacilityIncident {
  id: string;               // SC-8921 / SC-2024-8921
  courtId?: string;
  courtName: string;
  courtZone?: string;
  courtSubtype?: string;
  isCourtLocked?: boolean;
  equipmentCode?: string;
  equipmentName?: string;
  title: string;
  description: string;
  severity: 'khan_cap' | 'trung_binh' | 'thap';
  severityLabel: string;
  status: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc';
  statusLabel: string;
  reportedAt: string;
  reporterName: string;
  reporterRole?: string;
  reporterPhone?: string;
  damageItems?: IncidentDamageItem[];
  timelineLogs?: IncidentTimelineLog[];
  technicianNote?: string;
  imageUrl?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIncidentDTO {
  courtId?: string;
  courtName: string;
  courtZone?: string;
  courtSubtype?: string;
  equipmentCode?: string;
  equipmentName?: string;
  title: string;
  description: string;
  severity: 'khan_cap' | 'trung_binh' | 'thap';
  reporterName: string;
  reporterRole?: string;
  reporterPhone?: string;
  lockCourt?: boolean;
  damageItems?: IncidentDamageItem[];
  technicianNote?: string;
  imageUrl?: string;
  images?: string[];
}

export interface FacilityDashboardStats {
  totalEquipments: number;
  readyEquipments: number;
  inUseEquipments: number;
  maintenanceEquipments: number;
  totalCourts: number;
  lockedCourts: number;
  openCourts: number;
  totalIncidents: number;
  urgentIncidents: number;
  pendingIncidents: number;
}
