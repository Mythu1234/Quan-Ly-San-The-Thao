import {useState} from 'react';
import {ArrowLeft, Save, Eye, EyeOff} from 'lucide-react';
import type {Employee} from '../../types/admin';
import {staffRole} from '../../utils/staffRole';
import IncidentSelect from './IncidentSelect';
interface Props {employee?:Employee;onBack:()=>void;onSaveEmployee:(employee:Employee,password?:string)=>Promise<void>|void}
const inputClass='mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50';
export default function StaffForm({employee,onBack,onSaveEmployee}:Props){
  const [name,setName]=useState(employee?.name||'');const [phone,setPhone]=useState(employee?.phone||'');const [email,setEmail]=useState(employee?.email||'');
  const [role,setRole]=useState<'ADMIN'|'STAFF'>(employee&&staffRole(employee)==='Chủ sân'?'ADMIN':'STAFF');
  const [status,setStatus]=useState<'active'|'inactive'>(employee?.status||'active');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  return <form className="space-y-3 p-3 pb-6" onSubmit={async event=>{
    event.preventDefault();
    if(saving) return;
    setError('');

    // Kiểm tra mật khẩu (nếu là thêm mới hoặc admin có nhập mật khẩu mới để đổi)
    if (!employee || password) {
      if (!password && !employee) {
        setError('Vui lòng thiết lập mật khẩu đăng nhập cho nhân viên.');
        return;
      }
      if (password) {
        if (password.length < 8) {
          setError('Mật khẩu phải có tối thiểu 8 ký tự.');
          return;
        }
        if (!/[a-zA-Z]/.test(password)) {
          setError('Mật khẩu phải chứa ít nhất 1 chữ cái (a-z, A-Z).');
          return;
        }
        if (!/[0-9]/.test(password)) {
          setError('Mật khẩu phải chứa ít nhất 1 chữ số (0-9).');
          return;
        }
        if (!confirmation) {
          setError('Vui lòng nhập lại mật khẩu vào ô xác nhận.');
          return;
        }
        if (password !== confirmation) {
          setError('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.');
          return;
        }
      }
    }

    setSaving(true);
    try {
      await onSaveEmployee({...employee,id:employee?.id||'',name:name.trim(),phone:phone.trim(),email:email.trim(),authRole:role,role:role==='ADMIN'?'Chủ sân':'Nhân viên',status,avatarText:name.trim().split(/\s+/).slice(-2).map(word=>word[0]).join('').toUpperCase(),avatarBg:employee?.avatarBg||'bg-emerald-100 text-emerald-800 border-emerald-300',joinDate:employee?.joinDate||''},password||undefined);
    } catch(failure) {
      setError(failure instanceof Error?failure.message:'Chưa lưu được tài khoản.');
    } finally {
      setSaving(false);
    }
  }}>
    <div className="flex items-center gap-2"><button type="button" onClick={onBack} aria-label="Quay lại" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white"><ArrowLeft className="h-4 w-4"/></button><div><h1 className="text-base font-extrabold text-slate-900">{employee?'Chỉnh sửa tài khoản':'Thêm nhân viên'}</h1>{employee&&<p className="text-[10px] text-slate-400">{employee.id}</p>}</div></div>
    <fieldset disabled={saving} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3.5 disabled:opacity-60">
      <label className="block text-[11px] font-semibold text-slate-600">Họ và tên *<input required maxLength={100} value={name} onChange={event=>setName(event.target.value)} placeholder="Nhập họ và tên" className={inputClass}/></label>
      <label className="block text-[11px] font-semibold text-slate-600">Số điện thoại *<input required type="tel" pattern="0[35789][0-9]{8}" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="Số điện thoại 10 chữ số" className={inputClass}/></label>
      <label className="block text-[11px] font-semibold text-slate-600">Email *<input required type="email" maxLength={100} value={email} onChange={event=>setEmail(event.target.value)} placeholder="Nhập email tài khoản" className={inputClass}/></label>
      <div className="grid grid-cols-2 gap-2.5">
        <div className="min-w-0 space-y-1">
          <label htmlFor="staff-role" className="block text-[11px] font-semibold text-slate-600">Vai trò</label>
          <IncidentSelect id="staff-role" value={role} options={[{value:'STAFF',label:'Nhân viên'},{value:'ADMIN',label:'Chủ sân'}]} placeholder="Chọn vai trò" searchPlaceholder="Vai trò" searchable={false} disabled={saving} onChange={value=>setRole(value as typeof role)}/>
        </div>
        <div className="min-w-0 space-y-1">
          <label htmlFor="staff-status" className="block text-[11px] font-semibold text-slate-600">Trạng thái</label>
          <IncidentSelect id="staff-status" value={status} options={[{value:'active',label:'Đang hoạt động'},{value:'inactive',label:'Ngừng hoạt động'}]} placeholder="Chọn trạng thái" searchPlaceholder="Trạng thái" searchable={false} disabled={saving} onChange={value=>setStatus(value as typeof status)}/>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs font-bold text-slate-800">{employee?'Đặt lại mật khẩu':'Mật khẩu đăng nhập'}</p>
        {employee&&<p className="mt-0.5 text-[10px] text-slate-400">Để trống nếu muốn giữ nguyên mật khẩu cũ của nhân viên</p>}
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="text-[11px] font-semibold text-slate-600">
            Mật khẩu mới {!employee && <span className="text-red-500">*</span>}
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required={!employee}
                value={password}
                onChange={event=>setPassword(event.target.value)}
                placeholder="Tối thiểu 8 ký tự (chữ & số)"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
          <label className="text-[11px] font-semibold text-slate-600">
            Xác nhận mật khẩu {(!employee || !!password) && <span className="text-red-500">*</span>}
            <div className="relative mt-1">
              <input
                type={showConfirmation ? 'text' : 'password'}
                autoComplete="new-password"
                required={!employee||!!password}
                value={confirmation}
                onChange={event=>setConfirmation(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmation(!showConfirmation)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                tabIndex={-1}
              >
                {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>
        </div>
      </div>
    </fieldset>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>}
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onBack} disabled={saving} className="h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60">Hủy</button><button type="submit" disabled={saving} className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"><Save className="h-3.5 w-3.5"/>{saving?'Đang lưu...':'Lưu tài khoản'}</button></div>
  </form>;
}
