import StaffForm from './StaffForm';
import type {Employee} from '../../types/admin';
export default function EditStaffView(props:{employee:Employee;onBack:()=>void;onSaveEmployee:(employee:Employee,password?:string)=>Promise<void>|void}){return <StaffForm key={props.employee.id} {...props}/>;}
