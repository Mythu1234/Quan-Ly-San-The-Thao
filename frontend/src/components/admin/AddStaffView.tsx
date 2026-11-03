import StaffForm from './StaffForm';
import type {Employee} from '../../types/admin';
export default function AddStaffView(props:{onBack:()=>void;onSaveEmployee:(employee:Employee,password?:string)=>Promise<void>|void}){return <StaffForm {...props}/>;}
