import {useState} from 'react';
import {Phone,Mail,KeyRound,Check,Shield} from 'lucide-react';
import type {Employee} from '../../types/admin';
import {staffRole} from '../../utils/staffRole';
interface Props{employee:Employee;onViewMyShifts?:()=>void;onUpdatePhone?:(phone:string)=>Promise<void>|void;onChangePassword?:(currentPassword:string,newPassword:string)=>Promise<void>|void}
const inputClass='mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50';
export default function EmployeeProfileView({employee,onUpdatePhone,onChangePassword}:Props){
  const [editPhone,setEditPhone]=useState(false),[editPassword,setEditPassword]=useState(false),[phone,setPhone]=useState(employee.phone);
  const [oldPassword,setOldPassword]=useState(''),[newPassword,setNewPassword]=useState(''),[confirmation,setConfirmation]=useState('');
  const [saving,setSaving]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const active=employee.status==='active';
  return <div className="space-y-3 p-3 pb-6">
    <h1 className="text-lg font-extrabold text-slate-900">Hồ sơ cá nhân</h1>
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center gap-3"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${employee.avatarBg}`}>{employee.avatarText}</div><div className="min-w-0"><h2 className="text-base font-bold text-slate-900">{employee.name}</h2><p className="mt-0.5 text-xs text-emerald-700">{staffRole(employee)} <span className="text-slate-400">· {employee.id}</span></p></div></div>
      <dl className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-xs">
        <div className="flex justify-between gap-2"><dt className="text-slate-500">Trạng thái</dt><dd className={`font-semibold ${active?'text-emerald-700':'text-slate-500'}`}>{active?'Đang hoạt động':'Ngừng hoạt động'}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-slate-500">Ngày tạo tài khoản</dt><dd className="font-semibold text-slate-800">{employee.joinDate||'—'}</dd></div>
        <div className="flex items-center justify-between gap-2"><dt className="flex items-center gap-1.5 text-slate-500"><Phone className="h-3.5 w-3.5"/>Điện thoại</dt><dd className="flex items-center gap-2"><span className="font-semibold text-slate-800">{employee.phone}</span><button type="button" onClick={()=>{setPhone(employee.phone);setEditPhone(!editPhone);setError('');}} className="font-semibold text-emerald-700">Sửa</button></dd></div>
        <div className="flex items-start justify-between gap-3"><dt className="flex items-center gap-1.5 text-slate-500"><Mail className="h-3.5 w-3.5"/>Email</dt><dd className="min-w-0 break-all text-right font-semibold text-slate-800">{employee.email||'—'}</dd></div>
      </dl>
      {editPhone&&<form className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-3" onSubmit={async event=>{event.preventDefault();if(saving)return;setSaving(true);setError('');setNotice('');try{if(!onUpdatePhone)throw Error('Chưa kết nối cập nhật hồ sơ.');await onUpdatePhone(phone);setEditPhone(false);setNotice('Đã lưu số điện thoại.');}catch(failure){setError(failure instanceof Error?failure.message:'Chưa lưu được hồ sơ.');}finally{setSaving(false);}}}><label className="flex-1 text-[11px] text-slate-500">Số điện thoại mới<input required type="tel" pattern="0[35789][0-9]{8}" placeholder="Nhập số điện thoại mới" value={phone} onChange={event=>setPhone(event.target.value)} className={inputClass}/></label><button disabled={saving} className="h-10 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white">Lưu</button></form>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center justify-between"><h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-800"><Shield className="h-4 w-4 text-emerald-700"/>Mật khẩu đăng nhập</h3><button type="button" onClick={()=>{setEditPassword(!editPassword);setError('');setOldPassword('');setNewPassword('');setConfirmation('');}} className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><KeyRound className="h-3.5 w-3.5"/>{editPassword?'Đóng':'Đổi mật khẩu'}</button></div>
      {editPassword&&<form className="mt-3 space-y-2.5 border-t border-slate-100 pt-3" onSubmit={async event=>{event.preventDefault();if(saving)return;setError('');setNotice('');if(newPassword!==confirmation){setError('Xác nhận mật khẩu không khớp.');return;}setSaving(true);try{if(!onChangePassword)throw Error('Chưa kết nối đổi mật khẩu.');await onChangePassword(oldPassword,newPassword);setEditPassword(false);setOldPassword('');setNewPassword('');setConfirmation('');setNotice('Đã đổi mật khẩu trong hệ thống.');}catch(failure){setError(failure instanceof Error?failure.message:'Chưa lưu được mật khẩu.');}finally{setSaving(false);}}}>
        <label className="block text-[11px] font-semibold text-slate-500">Mật khẩu hiện tại<input required type="password" autoComplete="current-password" value={oldPassword} onChange={event=>setOldPassword(event.target.value)} placeholder="Nhập mật khẩu hiện tại" className={inputClass}/></label>
        <div className="grid grid-cols-2 gap-2.5"><label className="text-[11px] font-semibold text-slate-500">Mật khẩu mới<input required type="password" minLength={6} maxLength={256} autoComplete="new-password" value={newPassword} onChange={event=>setNewPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" className={inputClass}/></label><label className="text-[11px] font-semibold text-slate-500">Xác nhận mật khẩu<input required type="password" autoComplete="new-password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} placeholder="Nhập lại mật khẩu mới" className={inputClass}/></label></div>
        <button disabled={saving} className="h-10 w-full rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60">{saving?'Đang lưu...':'Lưu mật khẩu mới'}</button>
      </form>}
    </section>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>}
    {notice&&<p role="status" className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700"><Check className="h-3.5 w-3.5"/>{notice}</p>}
  </div>;
}
