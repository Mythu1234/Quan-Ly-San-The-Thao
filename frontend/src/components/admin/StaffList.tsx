import {useState} from 'react';
import {Search,Plus,ChevronRight,Phone} from 'lucide-react';
import type {Employee} from '../../types/admin';
import {staffRole} from '../../utils/staffRole';
interface Props {employees:Employee[];onSelectEmployee:(employee:Employee)=>void;onAddNew:()=>void;onDeleteEmployee:(id:string,name:string,reason?:string)=>void;onToggleStatus:(id:string)=>void;readOnly?:boolean;isBackendOnline?:boolean}
export default function StaffList({employees,onSelectEmployee,onAddNew,readOnly=false}:Props){
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState<'all'|'active'|'inactive'>('all');
  const visible=employees.filter(employee=>(status==='all'||employee.status===status)&&[employee.name,employee.phone,employee.email,employee.id].some(value=>value.toLocaleLowerCase('vi-VN').includes(search.trim().toLocaleLowerCase('vi-VN'))));
  return <div className="space-y-3 p-3 pb-6">
    <div className="flex items-center justify-between gap-2"><div><h1 className="text-lg font-extrabold text-slate-900">Quản lý nhân viên</h1><p className="mt-0.5 text-[11px] text-slate-500">Tài khoản và thông tin liên hệ</p></div>
      {!readOnly&&<button type="button" onClick={onAddNew} className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-emerald-700 px-3 text-xs font-bold text-white hover:bg-emerald-800"><Plus className="h-4 w-4"/>Thêm mới</button>}
    </div>
    <label className="relative block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400"/><input aria-label="Tìm nhân viên" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Tìm tên, số điện thoại, email..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-emerald-600"/></label>
    <div className="flex gap-1.5 overflow-x-auto">{(['all','active','inactive'] as const).map(value=><button key={value} type="button" onClick={()=>setStatus(value)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[11px] font-semibold ${status===value?'border-emerald-700 bg-emerald-700 text-white':'border-slate-200 bg-white text-slate-600'}`}>{value==='all'?`Tất cả (${employees.length})`:value==='active'?'Đang hoạt động':'Ngừng hoạt động'}</button>)}</div>
    <div className="space-y-2">{visible.map(employee=><button key={employee.id} type="button" onClick={()=>onSelectEmployee(employee)} className="flex w-full items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${employee.avatarBg}`}>{employee.avatarText}</div>
      <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><p className="truncate text-sm font-bold text-slate-900">{employee.name}</p><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${employee.status==='active'?'bg-emerald-500':'bg-slate-400'}`} title={employee.status==='active'?'Đang hoạt động':'Ngừng hoạt động'}/></div>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500"><Phone className="h-3 w-3"/>{employee.phone}<span className="px-0.5">·</span>{staffRole(employee)}</p></div><ChevronRight className="h-4 w-4 shrink-0 text-slate-400"/>
    </button>)}{!visible.length&&<p className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">Không có tài khoản phù hợp.</p>}</div>
  </div>;
}
