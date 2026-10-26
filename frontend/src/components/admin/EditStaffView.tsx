import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Lock,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  SlidersHorizontal,
  CheckCircle2,
  Circle,
  Save,
  Briefcase,
  ChevronLeft,
} from 'lucide-react';
import type { Employee } from '../../types/admin';

interface EditStaffViewProps {
  employee: Employee;
  onBack: () => void;
  onSaveEmployee: (updatedEmp: Employee, newPassword?: string) => void;
}

export default function EditStaffView({
  employee,
  onBack,
  onSaveEmployee,
}: EditStaffViewProps) {
  const [fullName, setFullName] = useState(employee.name);
  const [phone, setPhone] = useState(employee.phone);
  const [email, setEmail] = useState(employee.email);
  const [role, setRole] = useState(employee.role || 'Nhân viên vận hành sân COURTX');
  const [status, setStatus] = useState<'active' | 'inactive'>(employee.status);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarText, setAvatarText] = useState(employee.avatarText);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Compute initials for avatar
  const handleNameChange = (val: string) => {
    setFullName(val);
    const words = val.trim().split(/\s+/);
    if (words.length >= 2) {
      setAvatarText(
        (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
      );
    } else if (words.length === 1 && words[0]) {
      setAvatarText(words[0].slice(0, 2).toUpperCase());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên nhân viên!');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại liên hệ!');
      return;
    }

    if (newPassword || confirmPassword) {
      if (!newPassword) {
        setErrorMessage('Vui lòng nhập mật khẩu mới!');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự!');
        return;
      }
      if (!confirmPassword) {
        setErrorMessage('Vui lòng nhập xác nhận lại mật khẩu mới!');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('Xác nhận mật khẩu mới không khớp!');
        return;
      }
    }

    const initials =
      avatarText ||
      fullName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase() ||
      employee.avatarText ||
      'NV';

    const updatedEmp: Employee = {
      ...employee,
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || employee.email,
      role: role.trim() || employee.role,
      status,
      avatarText: initials,
    };

    setErrorMessage(null);
    setSuccessMessage('Cập nhật thông tin nhân viên thành công!');
    setTimeout(() => {
      onSaveEmployee(updatedEmp, newPassword || undefined);
    }, 400);
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200">
      {/* 🟢 Top Badge & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Quay lại"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            QUẢN TRỊ NHÂN VIÊN
          </div>
        </div>

        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 border border-slate-200 shadow-2xs">
          Mã NV: {employee.id}
        </span>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          CHỈNH SỬA THÔNG TIN <span className="text-emerald-600">NHÂN VIÊN</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Cập nhật hồ sơ, phân quyền và trạng thái hoạt động của nhân sự #{employee.id}.
        </p>
      </div>

      {/* 🟢 Avatar Section */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative">
          <div
            className={[
              'flex h-16 w-16 items-center justify-center rounded-2xl font-black text-xl border shadow-2xs',
              employee.avatarBg || 'bg-blue-100 text-blue-800 border-blue-300',
            ].join(' ')}
          >
            <span>{avatarText || employee.avatarText}</span>
          </div>
          <span
            className={[
              'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white',
              status === 'active' ? 'bg-emerald-500' : 'bg-slate-400',
            ].join(' ')}
          />
        </div>
        <span className="mt-2 text-xs font-bold text-slate-800">{fullName || employee.name}</span>
        <span className="text-[10px] text-slate-400">Ngày gia nhập: {employee.joinDate}</span>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 animate-in fade-in">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 animate-in fade-in">
          {successMessage}
        </div>
      )}

      {/* 🟢 Form Container */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: THÔNG TIN NHÂN SỰ */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>THÔNG TIN NHÂN SỰ</span>
          </div>

          {/* Mã nhân viên (Read-only) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">Mã nhân viên</label>
            <input
              type="text"
              value={employee.id}
              disabled
              className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 px-3.5 text-xs font-bold text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Họ và tên */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Bắt buộc</span>
            </div>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Nhập họ và tên"
                value={fullName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Số điện thoại */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Số điện thoại <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Liên hệ</span>
            </div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">Email</label>
              <span className="text-[10px] text-slate-400 font-medium">Hòm thư</span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Vai trò / Chức danh */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Chức danh công việc
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Vd: Nhân viên vận hành sân COURTX"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: ĐỔI MẬT KHẨU (TÙY CHỌN) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <span>ĐỔI MẬT KHẨU (TÙY CHỌN)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Bỏ trống nếu không đổi</span>
          </div>

          {/* Mật khẩu mới */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Mật khẩu mới
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Tối thiểu 6 ký tự</span>
            </div>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới (nếu muốn thay đổi)"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-10 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Xác nhận mật khẩu mới (Luôn hiển thị) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Xác nhận mật khẩu mới
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Nhập khớp mật khẩu trên</span>
            </div>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Xác nhận lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-10 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
              Bỏ trống cả hai ô nếu không có nhu cầu đổi mật khẩu tài khoản nhân viên.
            </p>
          </div>
        </div>

        {/* SECTION 3: TRẠNG THÁI HOẠT ĐỘNG */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <span>TRẠNG THÁI TÀI KHOẢN</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Đang hoạt động */}
            <div
              onClick={() => setStatus('active')}
              className={[
                'rounded-xl border p-3 cursor-pointer transition flex flex-col justify-between',
                status === 'active'
                  ? 'border-emerald-300 bg-emerald-50/60'
                  : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">Đang hoạt động</span>
                {status === 'active' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                Cho phép phân ca & đăng nhập
              </span>
            </div>

            {/* Ngừng hoạt động */}
            <div
              onClick={() => setStatus('inactive')}
              className={[
                'rounded-xl border p-3 cursor-pointer transition flex flex-col justify-between',
                status === 'inactive'
                  ? 'border-emerald-300 bg-emerald-50/60'
                  : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50',
              ].join(' ')}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-900">Ngừng hoạt động</span>
                {status === 'inactive' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <span className="text-[10px] text-slate-500 leading-tight">
                Tạm khóa quyền truy cập
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Hủy & Lưu */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer shadow-2xs"
          >
            HỦY BỎ
          </button>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4 stroke-[2.2]" />
            <span>LƯU THAY ĐỔI</span>
          </button>
        </div>
      </form>
    </div>
  );
}
