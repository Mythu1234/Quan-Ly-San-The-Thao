import type { FacilityIncident, FacilityEquipment } from './facility.js';
export interface CheckoutRequest {
  reference: string; bookingCode: string; bookingDate: string; courtName: string; courtId?: string;
  customerName: string; customerPhone: string; remainingBalance: number; expectedAmount: number; paymentConfirmed: boolean;
  reports: FacilityIncident[];
  bankTransactionCode?:string;
}
export interface CheckoutReceipt {
  reference: string; bookingCode: string; bookingDate: string; courtName: string;
  compensationAmount: number; amountPaid: number; completedAt: string; incidentIds: string[];
}
export interface CheckoutResult { receipt: CheckoutReceipt; incidents: FacilityIncident[]; equipments: FacilityEquipment[] }
