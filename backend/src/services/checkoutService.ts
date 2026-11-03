import { supabase } from '../lib/supabaseClient.js';
import { databaseError, facilityRepository } from '../repositories/facilityRepository.js';
import type { CheckoutRequest, CheckoutResult } from '../types/checkout.js';
export async function getCheckoutReceipt(reference:string) { return (await facilityRepository.getCheckout(reference))?.receipt; }
export async function completeCheckout(request:CheckoutRequest):Promise<CheckoutResult> {
  if (!request.bookingCode || !/^\d{4}-\d{2}-\d{2}$/.test(request.bookingDate) || !Array.isArray(request.reports)
    || request.reference !== `${request.bookingDate}:${request.bookingCode}` || !Number.isSafeInteger(request.expectedAmount) || request.expectedAmount<0) throw Error('Thông tin quyết toán không hợp lệ.');
  const {data,error}=await supabase.rpc('courtx_checkout',{p_request:request});
  if(error)databaseError(error);
  return facilityRepository.expandCheckout(data);
}
