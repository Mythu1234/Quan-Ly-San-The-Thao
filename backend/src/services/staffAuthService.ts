import {supabase} from '../lib/supabaseClient.js';
import {hashPassword,verifyPassword} from './passwords.js';
const columns='ma_nhan_vien,ho_ten,so_dien_thoai,email,vai_tro,trang_thai_hoat_dong,ngay_tao,mat_khau';
const fail=(message:string,status=400)=>Object.assign(Error(message),{status});
export function publicEmployee(row:any) {
  const words=row.ho_ten.trim().split(/\s+/);
  return {id:row.ma_nhan_vien,name:row.ho_ten,phone:row.so_dien_thoai,email:row.email,
    authRole:row.vai_tro,role:row.vai_tro==='ADMIN'?'Chủ sân':'Nhân viên',
    status:row.trang_thai_hoat_dong?'active':'inactive',avatarText:words.slice(-2).map((word:string)=>word[0]).join('').toUpperCase(),
    avatarBg:'bg-emerald-100 text-emerald-800 border-emerald-300',joinDate:new Date(row.ngay_tao).toLocaleDateString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})};
}
export function createStaffAuthService(db:any=supabase) {
  return {
    async login(identifier:unknown,password:unknown) {
      if(typeof identifier!=='string'||typeof password!=='string'||!identifier.trim()||password.length>256)throw fail('Nhập tài khoản và mật khẩu hợp lệ.');
      const key=identifier.trim().toLowerCase();
      let query=db.from('nhan_vien').select(columns).eq('trang_thai_hoat_dong',true);
      if(key==='admin')query=query.eq('vai_tro','ADMIN');
      else if(key==='staff'||key==='nhanvien')query=query.eq('vai_tro','STAFF');
      else if(/^nv\d{8}$/i.test(key))query=query.eq('ma_nhan_vien',key.toUpperCase());
      else if(key.includes('@'))query=query.eq('email',key);
      else {
        let phone=key.replace(/[\s().-]/g,'').replace(/^\+?84/,'0');
        if(!/^0[35789]\d{8}$/.test(phone))throw fail('Tài khoản hoặc mật khẩu không chính xác.',401);
        query=query.eq('so_dien_thoai',phone);
      }
      const {data,error}=await query.order('ma_nhan_vien').limit(1);
      if(error)throw fail('Chưa kết nối được dữ liệu tài khoản. Vui lòng thử lại.',503);
      const row=data?.[0];
      if(!row||!verifyPassword(password,row.mat_khau))throw fail('Tài khoản hoặc mật khẩu không chính xác.',401);
      return publicEmployee(row);
    },
    async changePassword(id:string,currentPassword:unknown,newPassword:unknown) {
      if(typeof currentPassword!=='string'||typeof newPassword!=='string'||newPassword.length<6||newPassword.length>256||currentPassword===newPassword)throw fail('Mật khẩu mới phải từ 6 đến 256 ký tự và khác mật khẩu hiện tại.');
      const {data,error}=await db.from('nhan_vien').select(columns).eq('ma_nhan_vien',id).single();
      if(error||!data||!data.trang_thai_hoat_dong||!verifyPassword(currentPassword,data.mat_khau))throw fail('Mật khẩu hiện tại không đúng hoặc tài khoản đã ngừng hoạt động.',401);
      const saved=await db.from('nhan_vien').update({mat_khau:hashPassword(newPassword)}).eq('ma_nhan_vien',id).eq('mat_khau',data.mat_khau).eq('trang_thai_hoat_dong',true).select('ma_nhan_vien');
      if(saved.error)throw fail('Chưa lưu được mật khẩu vào database. Vui lòng thử lại.',503);
      if(saved.data?.length!==1)throw fail('Tài khoản vừa thay đổi. Vui lòng đăng nhập lại.',409);
      return {message:'Đã cập nhật mật khẩu trong Supabase.'};
    },
  };
}
export const staffAuthService=createStaffAuthService();
