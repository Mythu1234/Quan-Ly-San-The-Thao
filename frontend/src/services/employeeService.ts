import type {Employee} from '../types/admin';
import {apiRequest,ApiError} from './apiClient';
export interface EmployeeStats {total:number;active:number;inactive:number;currentlyWorking:number}
export interface EmployeeFilterParams {search?:string;status?:'active'|'inactive'|'all';role?:string}
export const employeeApiService={
  async getEmployees(params?:EmployeeFilterParams){
    const query=new URLSearchParams();if(params?.search)query.set('search',params.search);if(params?.status)query.set('status',params.status);
    const employees=await apiRequest<Employee[]>('/employees'+(query.size?'?'+query:''));
    const active=employees.filter(employee=>employee.status==='active').length;
    return {employees,stats:{total:employees.length,active,inactive:employees.length-active,currentlyWorking:active},isBackendOnline:true};
  },
  async getEmployeeById(id:string):Promise<Employee|null>{try{return await apiRequest<Employee>('/employees/'+encodeURIComponent(id));}catch(error){if(error instanceof ApiError&&error.status===404)return null;throw error;}},
  createEmployee:(data:Partial<Employee>&{password?:string})=>apiRequest<Employee>('/employees',{method:'POST',body:JSON.stringify(data)}),
  updateEmployee:(id:string,data:Partial<Employee>&{password?:string})=>apiRequest<Employee>('/employees/'+encodeURIComponent(id),{method:'PUT',body:JSON.stringify(data)}),
  toggleStatus:(id:string)=>apiRequest<Employee>('/employees/'+encodeURIComponent(id)+'/status',{method:'PATCH'}),
  deleteEmployee:(id:string,_reason?:string,_permanent=false)=>apiRequest<{success:boolean;message:string;employee?:Employee}>('/employees/'+encodeURIComponent(id),{method:'DELETE'}),
};
export default employeeApiService;
