import type {Employee} from '../types/admin';
import {apiRequest} from './apiClient';
export interface StaffAccount extends Employee {authRole:'ADMIN'|'STAFF'}
export const staffAuthService={
  login:(identifier:string,password:string)=>apiRequest<StaffAccount>('/employees/login',{method:'POST',body:JSON.stringify({identifier,password})}),
  changePassword:(id:string,currentPassword:string,newPassword:string)=>apiRequest<{message:string}>(`/employees/${encodeURIComponent(id)}/password`,{method:'POST',body:JSON.stringify({currentPassword,newPassword})}),
  sendForgotOtp:(phone:string)=>apiRequest<{phone:string;otp:string;message:string;employeeName?:string}>('/employees/forgot-password/send-otp',{method:'POST',body:JSON.stringify({phone})}),
  verifyForgotOtp:(phone:string,otp:string)=>apiRequest<{verified:boolean;message:string}>('/employees/forgot-password/verify-otp',{method:'POST',body:JSON.stringify({phone,otp})}),
  resetPassword:(phone:string,otp:string,newPassword:string)=>apiRequest<{message:string;employeeName?:string}>('/employees/forgot-password/reset',{method:'POST',body:JSON.stringify({phone,otp,newPassword})}),
};
