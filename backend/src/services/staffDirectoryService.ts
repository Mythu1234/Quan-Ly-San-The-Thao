import {supabase} from '../lib/supabaseClient.js';
import {publicEmployee} from './staffAuthService.js';
import {hashPassword} from './passwords.js';
const columns='ma_nhan_vien,ho_ten,so_dien_thoai,email,vai_tro,trang_thai_hoat_dong,ngay_tao';
const invalid=(message:string,status=400)=>Object.assign(Error(message),{status});
function checked(error:any){if(error)throw invalid(error.code==='23505'?'Số điện thoại, email hoặc mã nhân viên đã tồn tại.':error.message,400);}
function payload(input:any,create=false) {
  const result:Record<string,any>={};
  for(const [key,column] of [['name','ho_ten'],['phone','so_dien_thoai'],['email','email']]){
    if(create||input[key]!==undefined){
      const value=typeof input[key]==='string'?input[key].trim():'';
      if(!value||value.length>100)throw invalid('Nhập đầy đủ họ tên, số điện thoại và email.');
      if(key==='phone'&&!/^0[35789]\d{8}$/.test(value))throw invalid('Số điện thoại không hợp lệ.');
      if(key==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw invalid('Email không hợp lệ.');
      result[column]=value;
    }
  }
  if(create||input.role!==undefined||input.authRole!==undefined){
    const role=input.authRole??input.role??'STAFF';
    if(!['ADMIN','STAFF','Chủ sân','Nhân viên'].includes(role))throw invalid('Chỉ có vai trò Chủ sân hoặc Nhân viên.');
    result.vai_tro=role==='ADMIN'||role==='Chủ sân'?'ADMIN':'STAFF';
  }
  if(create||input.status!==undefined){
    if(input.status!==undefined&&!['active','inactive'].includes(input.status))throw invalid('Trạng thái không hợp lệ.');
    result.trang_thai_hoat_dong=input.status!=='inactive';
  }
  if(create||input.password){
    if(typeof input.password!=='string'||input.password.length<6||input.password.length>256)throw invalid('Mật khẩu phải có từ 6 đến 256 ký tự.');
    result.mat_khau=hashPassword(input.password);
  }
  return result;
}
export const staffDirectoryService={
  async list(){const {data,error}=await supabase.from('nhan_vien').select(columns).order('ma_nhan_vien');checked(error);return (data||[]).map(publicEmployee);},
  async get(id:string){const {data,error}=await supabase.from('nhan_vien').select(columns).eq('ma_nhan_vien',id).maybeSingle();checked(error);if(!data)throw invalid('Không tìm thấy tài khoản.',404);return publicEmployee(data);},
  async create(input:any){
    const values=payload(input,true);
    for(let attempt=0;attempt<3;attempt++){
      const {data:ids,error:idError}=await supabase.from('nhan_vien').select('ma_nhan_vien');checked(idError);
      const next=1+Math.max(0,...(ids||[]).filter(row=>/^NV\d{8}$/.test(row.ma_nhan_vien)).map(row=>Number(row.ma_nhan_vien.slice(2))));
      if(next>99999999)throw invalid('Đã hết dải mã nhân viên.');
      const {data,error}=await supabase.from('nhan_vien').insert({...values,ma_nhan_vien:'NV'+String(next).padStart(8,'0')}).select(columns).single();
      if(error?.code==='23505'&&error.message.includes('nhan_vien_pkey'))continue;
      checked(error);return publicEmployee(data);
    }
    throw invalid('Chưa cấp được mã nhân viên. Vui lòng thử lại.',409);
  },
  async update(id:string,input:any){const {data,error}=await supabase.from('nhan_vien').update(payload(input)).eq('ma_nhan_vien',id).select(columns).single();checked(error);return publicEmployee(data);},
  async toggle(id:string){const current=await this.get(id);return this.update(id,{status:current.status==='active'?'inactive':'active'});},
};
