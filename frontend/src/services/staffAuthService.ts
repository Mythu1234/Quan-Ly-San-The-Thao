import type {Employee} from '../types/admin';
import {apiRequest} from './apiClient';
export interface StaffAccount extends Employee {authRole:'ADMIN'|'STAFF'}
export const staffAuthService={
  login:(identifier:string,password:string)=>apiRequest<StaffAccount>('/employees/login',{method:'POST',body:JSON.stringify({identifier,password})}),
  changePassword:(id:string,currentPassword:string,newPassword:string)=>apiRequest<{message:string}>(`/employees/${encodeURIComponent(id)}/password`,{method:'POST',body:JSON.stringify({currentPassword,newPassword})}),
};
