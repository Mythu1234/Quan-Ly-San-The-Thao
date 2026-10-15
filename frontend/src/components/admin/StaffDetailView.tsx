import { useState } from 'react';
import {
  Clock,
  Pencil,
  Calendar,
  Phone,
  PhoneCall,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  ArrowRight,
  Trash2,
  AlertTriangle,
  Shield,
  BadgeCheck,
} from 'lucide-react';
import type { Employee } from '../../types/admin';

interface StaffDetailViewProps {
  employee: Employee;
  onAssignShift: (emp: Employee) => void;
  onViewSchedule: () => void;
  onDeleteEmployee: (empId: string, empName: string) => void;
}

export default function StaffDetailView({
  employee,
  onAssignShift,
  onViewSchedule,
  onDeleteEmployee,
}: StaffDetailViewProps) {
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleCopy = (text: string, field: 'phone' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  // Perform UC-11 delete action
  const handleConfirmDelete = () => {
    if (!deleteReason.trim()) {
      setDeleteError('Vui lòng nhập lý do chấm dứt công việc / vô hiệu hóa tài khoản!');
      return;
    }
    setShowDeleteConfirm(false);
    onDeleteEmployee(employee.id, employee.name);
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200">
      {/* 🟢 Profile Card */}
      <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xs">
        {/* Avatar with verified badge */}
        <div className="relative mb-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-700 text-white font-black text-2xl shadow-md overflow-hidden">
            {employee.avatarImage ? (
              <img
                src={employee.avatarImage}
                alt={employee.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            <span className={employee.avatarImage ? 'hidden' : 'block'}>
              {employee.avatarText}
            </span>
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md border-2 border-white">
            <BadgeCheck className="w-4 h-4 fill-emerald-600 text-white" />
          </div>
        </div>

        {/* Name, Role & Status */}
        <h2 className="text-xl font-black tracking-tight text-slate-900">{employee.name}</h2>
        <p className="mt-0.5 text-xs text-slate-500 font-medium">{employee.role}</p>

        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>{employee.status === 'active' ? 'ĐANG HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'}</span>
        </div>

        {/* 2 Main Action Buttons */}
        <div className="mt-5 grid grid-cols-2 gap-3 w-full">
          <button
            type="button"
            onClick={() => alert(`Chỉnh sửa thông tin của ${employee.name}`)}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-black text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Chỉnh sửa</span>
          </button>

          <button
            type="button"
            onClick={() => onAssignShift(employee)}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#1b4d3e] hover:bg-[#143d31] py-3 text-xs font-black text-white shadow-sm active:scale-95 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Phân ca</span>
          </button>
        </div>
      </div>

      {/* 🟢 CA LÀM HÔM NAY */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              CA LÀM HÔM NAY
            </span>
          </div>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
            {employee.currentShift?.title || 'Ca sáng'}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-2xl font-black text-slate-900 tracking-tight block">
              {employee.currentShift?.time || '04:00 - 10:00'}
            </span>
            <span className="text-[11px] text-slate-500 font-semibold mt-0.5 block">
              Thứ Năm, 01/10/2026
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{employee.currentShift?.statusLabel || 'Đang trong ca trực'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewSchedule}
          className="flex w-full items-center justify-end gap-1 text-xs font-bold text-[#1b4d3e] hover:underline pt-1 cursor-pointer"
        >
          <span>Xem lịch làm việc</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 🟢 THÔNG TIN NHÂN VIÊN */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-1 rounded-full bg-[#1b4d3e]" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            THÔNG TIN NHÂN VIÊN
          </span>
        </div>

        {/* Số điện thoại */}
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-slate-600">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                SỐ ĐIỆN THOẠI
              </span>
              <span className="text-xs font-black text-slate-900">{employee.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCopy(employee.phone, 'phone')}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              {copiedField === 'phone' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleCall(employee.phone)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Email làm việc */}
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-2xs text-slate-600">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                EMAIL LÀM VIỆC
              </span>
              <span className="text-xs font-black text-slate-900">{employee.email}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(employee.email, 'email')}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {copiedField === 'email' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* 2 Mini Cards: Vai trò & Tài khoản */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              VAI TRÒ HỆ THỐNG
            </span>
            <span className="text-xs font-black text-slate-900 mt-1 block">Nhân viên</span>
          </div>

          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              TÀI KHOẢN
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-black text-slate-900">
                {employee.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
              </span>
            </div>
          </div>
        </div>

        {/* Ngày tham gia */}
        <div className="flex items-center justify-between rounded-xl px-2 py-1 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            NGÀY THAM GIA
          </span>
          <span className="font-bold text-slate-700">{employee.joinDate}</span>
        </div>
      </div>

      {/* 🟢 LỊCH TRỰC 5 NGÀY TỚI */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-1 rounded-full bg-[#1b4d3e]" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              LỊCH TRỰC 5 NGÀY TỚI
            </span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">01/10 - 05/10</span>
        </div>

        <div className="space-y-2">
          {employee.schedule5Days.map((item, idx) => {
            const isWorking = item.status === 'working';
            return (
              <div
                key={idx}
                className={[
                  'flex items-center justify-between rounded-2xl p-3 border transition',
                  isWorking
                    ? 'border-emerald-200 bg-emerald-50/60'
                    : 'border-slate-100 bg-slate-50/60',
                ].join(' ')}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800">{item.dayLabel}</span>
                    {item.shiftName && item.status !== 'off' && (
                      <span className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                        {item.shiftName}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 mt-0.5 block">
                    {item.time || 'Nghỉ ca thường lệ'}
                  </span>
                </div>

                <span
                  className={[
                    'rounded-lg px-2.5 py-1 text-[11px] font-bold',
                    isWorking
                      ? 'bg-white text-emerald-800 border border-emerald-200 shadow-2xs'
                      : item.status === 'off'
                      ? 'text-slate-400 font-medium'
                      : 'text-slate-600 bg-slate-100',
                  ].join(' ')}
                >
                  {item.statusLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔴 VÔ HIỆU HÓA HOẶC XÓA NHÂN VIÊN */}
      <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
        <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>VÔ HIỆU HÓA & XÓA NHÂN VIÊN</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
          Tài khoản nhân viên sẽ bị khóa quyền truy cập và gỡ bỏ khỏi toàn bộ ca trực trong tương lai. Thao tác này chỉ dành riêng cho Chủ sân (Owner).
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white py-3 text-xs font-black text-rose-600 hover:bg-rose-50 transition active:scale-95 cursor-pointer shadow-2xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>XÓA NHÂN VIÊN NÀY</span>
        </button>
      </div>

      {/* 🔴 MODAL XÁC NHẬN XÓA NHÂN VIÊN */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-600 font-black text-sm uppercase">
              <Shield className="w-5 h-5" />
              <span>Xác nhận xóa nhân viên</span>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Lưu ý quan trọng trước khi xóa:
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Tài khoản của <strong className="font-black text-slate-900">{employee.name}</strong> sẽ bị khóa đăng nhập ngay lập tức. Toàn bộ các ca trực trong tương lai của nhân viên này sẽ được tự động giải phóng để phân công người khác. Lịch sử làm việc cũ vẫn được lưu trữ đối soát.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Lý do chấm dứt làm việc <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                placeholder="Nhập lý do nghỉ việc (ví dụ: Hết hạn hợp đồng, chuyển công tác, xin nghỉ việc...)"
                value={deleteReason}
                onChange={(e) => {
                  setDeleteReason(e.target.value);
                  setDeleteError(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-rose-500 focus:bg-white"
              />
              {deleteError && (
                <span className="text-[11px] font-bold text-rose-600 mt-1 block">
                  {deleteError}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 py-3 text-xs font-black text-white shadow-sm cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
