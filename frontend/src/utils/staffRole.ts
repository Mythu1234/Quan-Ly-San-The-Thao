import type {Employee} from '../types/admin';
export function staffRole(employee:Pick<Employee,'role'|'authRole'>):'Chủ sân'|'Nhân viên' {
  if(employee.authRole)return employee.authRole==='ADMIN'?'Chủ sân':'Nhân viên';
  return /chủ|admin/i.test(employee.role)?'Chủ sân':'Nhân viên';
}
