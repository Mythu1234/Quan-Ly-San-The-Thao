import type {BookingDetail} from '../types/schedule';
import {apiRequest} from './apiClient';
export interface CustomerLookupResult {
  code:string;name:string;phone:string;sport:string;court:string;bookingDate:string;date:string;time:string;
  total:string;paidAmount:string;remaining:string;status:string;paymentStatus:string;refundAmount:string;refundStatus:string;
  cancellationReason?:string;cancelledAt?:string;hoursUntilStart:number;sportId:string;canCancel:boolean;
}
export const bookingApiService={
  list:()=>apiRequest<BookingDetail[]>('/bookings'),
  lookup:(query:string)=>apiRequest<CustomerLookupResult[]>('/bookings/lookup',{method:'POST',body:JSON.stringify({query})}),
  checkIn:(code:string,bookingDate:string)=>apiRequest<BookingDetail>(`/bookings/${encodeURIComponent(code)}/check-in`,{method:'POST',body:JSON.stringify({bookingDate})}),
};
