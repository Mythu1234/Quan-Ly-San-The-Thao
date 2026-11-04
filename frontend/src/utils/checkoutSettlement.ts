import type { FacilityEquipment, FacilityIncident } from '../types/admin';
import type { IncidentReporter } from './incidentStorage';
import type { PriceRow } from './compensationCatalog';

export type IncidentLiability = 'DO_KHACH_LAM_HONG' | 'BAO_HANH_SAN_VAN_DONG';
export interface CheckoutRequest {
  reference: string;
  bookingCode: string;
  bookingDate: string;
  courtName: string;
  courtId?: string;
  customerName: string;
  customerPhone: string;
  remainingBalance: number;
  expectedAmount: number;
  paymentConfirmed: boolean;
  reports: FacilityIncident[];
  bankTransactionCode?:string;
}
export interface CheckoutReceipt {
  reference: string;
  bookingCode: string;
  bookingDate: string;
  courtName: string;
  compensationAmount: number;
  amountPaid: number;
  completedAt: string;
  incidentIds: string[];
}
export interface CheckoutResult { receipt: CheckoutReceipt; incidents: FacilityIncident[]; equipments: FacilityEquipment[] }
export interface DamageDraft { id: string; existingId?: string; itemId: string; equipmentCode?:string; liability: IncidentLiability | ''; description: string; images: string[] }
export const checkoutCourtCode=(value:string)=>value.toUpperCase().replace(/Đ/g,'D').match(/(?:CL|BC|BD)[-_]\d{2}/)?.[0].replace('_','-') || value;

export function calculateCheckoutDamage(drafts: DamageDraft[], catalog: PriceRow[], existing: FacilityIncident[] = []) {
  return drafts.reduce((total, draft) => total + (draft.liability === 'DO_KHACH_LAM_HONG'
    ? existing.find(report=>report.id === draft.existingId)?.compensationPrice ?? catalog.find(item => item.id === draft.itemId)?.price ?? 0 : 0), 0);
}
export function buildCheckoutReports(drafts: DamageDraft[], catalog: PriceRow[], existing: FacilityIncident[], booking: Omit<CheckoutRequest, 'reports' | 'paymentConfirmed'>, reporter: IncidentReporter): FacilityIncident[] {
  const selected = new Set<string>();
  return drafts.map(draft => {
    if (draft.liability !== 'DO_KHACH_LAM_HONG' && draft.liability !== 'BAO_HANH_SAN_VAN_DONG') throw Error('Vui lòng chọn trách nhiệm cho từng sự cố.');
    const item = catalog.find(row => row.id === draft.itemId);
    if (!item || !draft.description.trim()) throw Error('Chọn thiết bị và nhập mô tả cho từng sự cố.');
    const equipmentCode=draft.equipmentCode||(!item.equipment?.isCatalogItem?item.equipment?.code:undefined);
    const identity = draft.existingId || equipmentCode || item.id;
    if (selected.has(identity)) throw Error('Thiết bị hoặc báo cáo đang được chọn trùng.');
    selected.add(identity);
    const original = draft.existingId ? existing.find(incident => incident.id === draft.existingId && !incident.deletedAt) : undefined;
    if (draft.existingId && !original) throw Error('Báo cáo đã bị xóa hoặc không còn tồn tại.');
    if (original && checkoutCourtCode(original.courtName) !== checkoutCourtCode(booking.courtName)) throw Error('Báo cáo không thuộc sân đang trả.');
    if (original?.compensationPaymentStatus === 'paid' || (original?.bookingCode && original.bookingCode !== booking.bookingCode)) throw Error('Báo cáo đã thu phí hoặc thuộc lượt đặt khác.');
    const now = new Date();
    const price = original?.compensationPrice ?? item.price;
    if (!Number.isSafeInteger(price) || price < 0) throw Error('Giá bồi thường không hợp lệ.');
    return {
      ...(original || { id: draft.id, courtName: booking.courtName, courtId: booking.courtId,
        title: `Sự cố ${item.name}`, description: draft.description.trim(), severity: 'trung_binh' as const,
        severityLabel: 'Trung bình', status: 'cho_xu_ly' as const, statusLabel: 'Chờ xử lý',
        reportedAt: now.toLocaleString('vi-VN', { timeZone:'Asia/Ho_Chi_Minh' }), createdAt: now.toISOString(),
        reporterName:reporter.name, reporterRole:reporter.role, reporterPhone:reporter.phone,
        equipmentCode, equipmentName:item.name,
        images:draft.images,
        damageItems:[{id:`DM-${draft.id}`,title:item.name,equipmentCode,description:draft.description.trim(),riskBadge:'Chờ xử lý',riskColor:'amber' as const}],
      }),
      bookingCode: booking.bookingCode, bookingDate:booking.bookingDate, checkoutReference:booking.reference,
      compensationItemId:item.id, compensationPrice:price, liability:draft.liability,
      compensationAmount:draft.liability === 'DO_KHACH_LAM_HONG' ? price : 0,
      compensationPaymentStatus:'pending', updatedAt:now.toISOString(),
    };
  });
}
