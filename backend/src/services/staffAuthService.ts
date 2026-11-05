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
    async sendForgotOtp(phoneInput: unknown) {
      if (typeof phoneInput !== 'string' || !phoneInput.trim()) {
        throw fail('Vui lòng nhập số điện thoại hợp lệ.', 400);
      }
      const cleanPhone = phoneInput.trim().replace(/[\s().-]/g, '').replace(/^\+?84/, '0');
      if (!/^0[35789]\d{8}$/.test(cleanPhone)) {
        throw fail('Số điện thoại không đúng định dạng.', 400);
      }

      const { data, error } = await db
        .from('nhan_vien')
        .select('ma_nhan_vien,ho_ten,so_dien_thoai,trang_thai_hoat_dong')
        .eq('so_dien_thoai', cleanPhone)
        .eq('trang_thai_hoat_dong', true)
        .limit(1);

      if (error) {
        throw fail('Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau.', 503);
      }

      const employee = data?.[0];
      if (!employee) {
        throw fail('Số điện thoại chưa được đăng ký trong hệ thống!', 404);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      otpCache.set(cleanPhone, {
        otp,
        expiresAt: Date.now() + 60 * 1000,
        verified: false,
      });

      return {
        phone: cleanPhone,
        otp,
        employeeName: employee.ho_ten,
        message: 'Mã xác thực OTP đã được gửi thành công.',
      };
    },
    async verifyForgotOtp(phoneInput: unknown, otpInput: unknown) {
      if (typeof phoneInput !== 'string' || typeof otpInput !== 'string') {
        throw fail('Thông tin xác thực không hợp lệ.', 400);
      }
      const cleanPhone = phoneInput.trim().replace(/[\s().-]/g, '').replace(/^\+?84/, '0');
      const cleanOtp = otpInput.trim();

      const session = otpCache.get(cleanPhone);
      if (!session) {
        throw fail('Mã OTP đã hết hiệu lực hoặc chưa được gửi. Vui lòng gửi lại mã mới!', 400);
      }
      if (Date.now() > session.expiresAt) {
        otpCache.delete(cleanPhone);
        throw fail('Mã OTP đã hết hiệu lực. Vui lòng gửi lại mã mới!', 400);
      }
      if (session.otp !== cleanOtp) {
        throw fail('Mã OTP không chính xác. Vui lòng kiểm tra lại!', 400);
      }

      session.verified = true;
      return {
        verified: true,
        message: 'Xác thực mã OTP thành công. Vui lòng đặt mật khẩu mới.',
      };
    },
    async resetPassword(phoneInput: unknown, otpInput: unknown, newPassword: unknown) {
      if (typeof phoneInput !== 'string' || typeof otpInput !== 'string' || typeof newPassword !== 'string') {
        throw fail('Thông tin đặt lại mật khẩu không hợp lệ.', 400);
      }
      const cleanPhone = phoneInput.trim().replace(/[\s().-]/g, '').replace(/^\+?84/, '0');
      const cleanOtp = otpInput.trim();

      if (newPassword.length < 8 || newPassword.length > 256) {
        throw fail('Mật khẩu mới phải có tối thiểu 8 ký tự!', 400);
      }
      if (!/[a-zA-Z]/.test(newPassword)) {
        throw fail('Mật khẩu mới phải chứa ít nhất 1 chữ cái!', 400);
      }
      if (!/[0-9]/.test(newPassword)) {
        throw fail('Mật khẩu mới phải chứa ít nhất 1 chữ số!', 400);
      }
      if (!/[^a-zA-Z0-9]/.test(newPassword)) {
        throw fail('Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (VD: @, #, $, %, !...)!', 400);
      }

      const session = otpCache.get(cleanPhone);
      if (!session || session.otp !== cleanOtp || !session.verified) {
        throw fail('Phiên xác thực OTP không hợp lệ hoặc đã hết hạn!', 400);
      }

      // 1. Kiểm tra tài khoản và so sánh mật khẩu cũ
      const { data: existingUser, error: findError } = await db
        .from('nhan_vien')
        .select('ma_nhan_vien,ho_ten,mat_khau')
        .eq('so_dien_thoai', cleanPhone)
        .eq('trang_thai_hoat_dong', true)
        .limit(1);

      if (findError) {
        throw fail('Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau.', 503);
      }

      const oldRow = existingUser?.[0];
      if (!oldRow) {
        throw fail('Tài khoản không tồn tại hoặc đã ngừng hoạt động!', 404);
      }

      if (oldRow.mat_khau && verifyPassword(newPassword, oldRow.mat_khau)) {
        throw fail('Bạn đã nhập mật khẩu cũ. Vui lòng chọn mật khẩu mới khác với mật khẩu cũ!', 400);
      }

      const hashedPassword = hashPassword(newPassword);
      const { data, error } = await db
        .from('nhan_vien')
        .update({ mat_khau: hashedPassword })
        .eq('so_dien_thoai', cleanPhone)
        .eq('trang_thai_hoat_dong', true)
        .select('ma_nhan_vien,ho_ten');

      if (error) {
        throw fail('Chưa cập nhật được mật khẩu vào database. Vui lòng thử lại.', 503);
      }

      otpCache.delete(cleanPhone);
      return {
        success: true,
        message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.',
        employeeName: data?.[0]?.ho_ten,
      };
    },
  };
}
const otpCache = new Map<string, { otp: string; expiresAt: number; verified?: boolean }>();
export const staffAuthService=createStaffAuthService();
