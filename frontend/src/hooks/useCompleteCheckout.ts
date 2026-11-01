import type { Dispatch, SetStateAction } from 'react';
import type { FacilityIncident, FacilityEquipment } from '../types/admin';
import { facilityApiService, FacilitySaveError } from '../services/facilityService';
import { mergeIncidents, readCheckoutSnapshot, writeCheckoutSnapshot } from '../utils/incidentStorage';
import type { CheckoutRequest, CheckoutResult } from '../utils/checkoutSettlement';
import { checkoutCourtCode } from '../utils/checkoutSettlement';

export default function useCompleteCheckout(incidents:FacilityIncident[], setIncidents:Dispatch<SetStateAction<FacilityIncident[]>>, equipments:FacilityEquipment[],setEquipments:Dispatch<SetStateAction<FacilityEquipment[]>>) {
  return async (request:CheckoutRequest):Promise<CheckoutResult> => {
    const previous = await readCheckoutSnapshot(request.reference).catch(() => undefined);
    let result:CheckoutResult;
    if (previous) result = previous;
    else {
      try { result = await facilityApiService.completeCheckout(request); }
      catch (error) {
        if (error instanceof FacilitySaveError) throw error;
        const completedAt = new Date().toISOString();
        const reports = request.reports.map(report => ({...report,
          compensationPaymentStatus:(report.compensationAmount || 0) > 0 ? 'paid' as const : 'not_required' as const,
          compensationPaidAt:(report.compensationAmount || 0) > 0 ? completedAt : undefined, updatedAt:completedAt,
        }));
        const compensationAmount = reports.reduce((sum,report)=>sum+(report.compensationAmount||0),0);
        const amountPaid = compensationAmount + request.remainingBalance;
        if(amountPaid !== request.expectedAmount) throw Error('Khoản cần thu đã thay đổi. Vui lòng kiểm tra lại.');
        if(amountPaid > 0 && !request.paymentConfirmed) throw Error('Vui lòng xác nhận đã nhận thanh toán VietQR.');
        const damaged = new Set(reports.map(report=>report.equipmentCode).filter(Boolean));
        const returned = equipments.filter(equipment=>checkoutCourtCode(equipment.currentLocation) === checkoutCourtCode(request.courtName) || checkoutCourtCode(equipment.assignedCourt || '') === checkoutCourtCode(request.courtName) || damaged.has(equipment.code)).map(equipment=>({...equipment,currentLocation:'Kho chung',
          status:damaged.has(equipment.code)?'hong' as const:(equipment.status === 'hong'||equipment.status ==='bao_tri'?equipment.status:'san_sang' as const),
          statusLabel:damaged.has(equipment.code)?'Hỏng':(equipment.status === 'hong'||equipment.status ==='bao_tri'?equipment.statusLabel:'Sẵn sàng'),
          assignedBookingCode:undefined,assignedCourt:undefined,assignedTimeSlot:undefined,assignedCustomer:undefined,
        }));
        result={receipt:{reference:request.reference,bookingCode:request.bookingCode,bookingDate:request.bookingDate,courtName:request.courtName,compensationAmount,amountPaid,completedAt,incidentIds:reports.map(report=>report.id)},incidents:reports,equipments:returned};
      }
    }
    const merged=mergeIncidents(result.incidents,incidents);
    await writeCheckoutSnapshot(result,merged);
    setIncidents(current=>mergeIncidents(result.incidents,current));
    setEquipments(current=>current.map(equipment=>result.equipments.find(item=>item.code === equipment.code)||equipment));
    return result;
  };
}
