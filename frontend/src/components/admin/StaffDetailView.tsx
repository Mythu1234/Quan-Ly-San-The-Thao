import {useState} from 'react';
import {ArrowLeft,Pencil,Shield,Phone,Mail} from 'lucide-react';
import type {Employee} from '../../types/admin';
import {staffRole} from '../../utils/staffRole';
interface Props{employee:Employee;onBack?:()=>void;onDeleteEmployee:(id:string,name:string,reason?:string)=>void;onEditEmployee:(employee:Employee)=>void}
export default function StaffDetailView({employee,onBack,onDeleteEmployee,onEditEmployee}:Props){
  const [confirm,setConfirm]=useState(false);const [reason,setReason]=useState('');
  const role=staffRole(employee),active=employee.status==='active';
  return <div className="space-y-3 p-3 pb-6">
    <div className="flex items-center gap-2"><button type="button" onClick={onBack} aria-label="Quay lại" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white"><ArrowLeft className="h-4 w-4"/></button><h1 className="text-base font-extrabold text-slate-900">Chi tiết tài khoản</h1></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 p-3.5"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${employee.avatarBg}`}>{employee.avatarText}</div><div className="min-w-0"><h2 className="text-base font-bold text-slate-900">{employee.name}</h2><p className="mt-0.5 text-xs text-emerald-700">{role} <span className="text-slate-400">· {employee.id}</span></p></div></div>
      <dl className="space-y-3 p-3.5 text-xs">
        <div className="flex items-center justify-between gap-3"><dt className="flex items-center gap-1.5 text-slate-500"><Phone className="h-3.5 w-3.5"/>Điện thoại</dt><dd className="font-semibold text-slate-900">{employee.phone}</dd></div>
        <div className="flex items-start justify-between gap-3"><dt className="flex items-center gap-1.5 text-slate-500"><Mail className="h-3.5 w-3.5"/>Email</dt><dd className="min-w-0 break-all text-right font-semibold text-slate-900">{employee.email||'—'}</dd></div>
        <div className="flex justify-between"><dt className="flex items-center gap-1.5 text-slate-500"><Shield className="h-3.5 w-3.5"/>Vai trò</dt><dd className="font-semibold text-slate-900">{role}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Trạng thái</dt><dd className={`font-semibold ${active?'text-emerald-700':'text-slate-500'}`}>{active?'Đang hoạt động':'Ngừng hoạt động'}</dd></div>
        <div className="flex justify-between"><dt className="text-slate-500">Ngày tạo tài khoản</dt><dd className="font-semibold text-slate-900">{employee.joinDate||'—'}</dd></div>
      </dl>
    </section>
    <div className={`grid gap-2 ${active?'grid-cols-2':'grid-cols-1'}`}>
      <button type="button" onClick={()=>onEditEmployee(employee)} className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-2 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-800"><Pencil className="h-3.5 w-3.5 shrink-0"/>Chỉnh sửa tài khoản</button>
      {active&&<button type="button" onClick={()=>setConfirm(!confirm)} className="min-h-10 rounded-xl border border-red-200 bg-red-50 px-2 py-2 text-[11px] font-semibold text-red-700 transition hover:bg-red-100">Ngừng hoạt động tài khoản</button>}
    </div>
    {confirm&&<form onSubmit={event=>{event.preventDefault();if(reason.trim()){setConfirm(false);onDeleteEmployee(employee.id,employee.name,reason.trim());}}} className="space-y-2 rounded-xl border border-red-100 bg-red-50 p-3"><p className="text-xs text-red-700">Khóa đăng nhập và giữ lại lịch sử của {employee.name}.</p><input required value={reason} onChange={event=>setReason(event.target.value)} placeholder="Lý do ngừng hoạt động" className="h-9 w-full rounded-lg border border-red-200 bg-white px-3 text-xs"/><div className="flex justify-end gap-2"><button type="button" onClick={()=>setConfirm(false)} className="px-3 py-2 text-xs text-slate-600">Hủy</button><button type="submit" className="rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white">Xác nhận</button></div></form>}
  </div>;
}
