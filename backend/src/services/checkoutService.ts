import { facilityRepository } from '../repositories/facilityRepository.js';
import type { CheckoutRequest, CheckoutResult } from '../types/checkout.js';

const courtCode = (value: string) => value.toUpperCase().replace(/Đ/g, 'D').match(/(?:CL|BC|BD)[-_]\d{2}/)?.[0].replace('_','-') || value;
export function getCheckoutReceipt(reference:string) { return facilityRepository.getCheckout(reference)?.receipt; }
export function completeCheckout(request: CheckoutRequest): CheckoutResult {
  if (!request.reference || !request.bookingCode || !request.courtName || !request.bookingDate || !Array.isArray(request.reports)) throw Error('Thiếu thông tin lượt trả sân.');
  if (request.reference !== `${request.bookingDate}:${request.bookingCode}`) throw Error('Mã quyết toán không khớp lượt đặt.');
  if (!Number.isSafeInteger(request.remainingBalance) || request.remainingBalance < 0) throw Error('Khoản còn lại không hợp lệ.');
  const already = facilityRepository.getCheckout(request.reference);
  if (already) return { receipt:already.receipt,
    incidents:already.receipt.incidentIds.map(id=>facilityRepository.getIncidentById(id)).filter((item):item is NonNullable<typeof item>=>!!item),
    equipments:facilityRepository.getAllEquipments().filter(item=>already.equipments.some(original=>original.code === item.code)),
  };
  const now = new Date().toISOString();
  const allEquipment = facilityRepository.getAllEquipments();
  const identities = new Set<string>();
  const reports = request.reports.map(report => {
    const original = facilityRepository.getIncidentById(report.id);
    if (original?.deletedAt || original?.compensationPaymentStatus === 'paid'
      || (original?.bookingCode && original.bookingCode !== request.bookingCode)
      || (original?.bookingDate && original.bookingDate !== request.bookingDate)) throw Error('Báo cáo đã thu phí, đã xóa hoặc thuộc lượt đặt khác.');
    if (courtCode(report.courtName) !== courtCode(request.courtName)) throw Error('Sự cố không thuộc sân đang trả.');
    if (!report.compensationItemId || !report.description?.trim() || !report.reporterName?.trim()) throw Error('Thiếu thiết bị, mô tả hoặc người lập sự cố.');
    if (!['DO_KHACH_LAM_HONG','BAO_HANH_SAN_VAN_DONG'].includes(report.liability || '')) throw Error('Chọn trách nhiệm hư hỏng.');
    const identity = report.equipmentCode || report.compensationItemId;
    if (identities.has(identity)) throw Error('Thiết bị đang được ghi trùng.');
    identities.add(identity);
    const equipment = allEquipment.find(item => item.code === report.equipmentCode);
    const price = original?.compensationPrice ?? equipment?.compensationPrice ?? report.compensationPrice;
    if (price === undefined || !Number.isSafeInteger(price) || price < 0) throw Error('Giá bồi thường không hợp lệ.');
    const amount = report.liability === 'DO_KHACH_LAM_HONG' ? price : 0;
    return { ...(original || report), compensationItemId:report.compensationItemId,
      compensationPrice:price, liability:report.liability, compensationAmount:amount,
      compensationPaymentStatus:amount > 0 ? 'paid' as const : 'not_required' as const,
      compensationPaidAt:amount > 0 ? now : undefined, bookingCode:request.bookingCode,
      bookingDate:request.bookingDate, checkoutReference:request.reference, updatedAt:now,
    };
  });
  const compensationAmount = reports.reduce((sum, report) => sum + report.compensationAmount, 0);
  const amountPaid = compensationAmount + request.remainingBalance;
  if (!Number.isSafeInteger(amountPaid) || request.expectedAmount !== amountPaid) throw Error('Giá hoặc khoản cần thu đã thay đổi. Vui lòng kiểm tra lại.');
  if (amountPaid > 0 && request.paymentConfirmed !== true) throw Error('Xác nhận đã nhận thanh toán VietQR trước khi trả sân.');
  const damagedCodes = new Set(reports.map(report => report.equipmentCode).filter(Boolean));
  const equipments = allEquipment.filter(equipment => courtCode(equipment.currentLocation) === courtCode(request.courtName)
    || courtCode(equipment.assignedCourt || '') === courtCode(request.courtName) || damagedCodes.has(equipment.code))
    .map(equipment => ({ ...equipment, currentLocation:'Kho chung',
      status: damagedCodes.has(equipment.code) ? 'hong' as const : (equipment.status === 'hong' || equipment.status === 'bao_tri' ? equipment.status : 'san_sang' as const),
      statusLabel:damagedCodes.has(equipment.code) ? 'Hỏng' : (equipment.status === 'hong' || equipment.status === 'bao_tri' ? equipment.statusLabel : 'Sẵn sàng'),
      assignedBookingCode:undefined, assignedCourt:undefined, assignedTimeSlot:undefined, assignedCustomer:undefined,
    }));
  return facilityRepository.commitCheckout({receipt:{reference:request.reference,bookingCode:request.bookingCode,bookingDate:request.bookingDate,courtName:request.courtName,compensationAmount,amountPaid,completedAt:now,incidentIds:reports.map(report=>report.id)},incidents:reports,equipments});
}
