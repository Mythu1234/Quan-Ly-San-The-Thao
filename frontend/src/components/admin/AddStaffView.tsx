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
  UserPlus,
  RotateCcw,
  ChevronLeft,
} from 'lucide-react';
import type { Employee } from '../../types/admin';

interface AddStaffViewProps {
  onBack: () => void;
  onSaveEmployee: (newEmp: Employee, password?: string) => void;
}

export default function AddStaffView({ onBack, onSaveEmployee }: AddStaffViewProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [avatarText, setAvatarText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset form
  const handleReset = () => {
    setFullName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setStatus('active');
    setAvatarText('');
    setErrorMessage(null);
  };

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
    } else {
      setAvatarText('');
    }
  };

  // Submit employee
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
    if (password.length < 6) {
      setErrorMessage('Mật khẩu ban đầu phải có ít nhất 6 ký tự!');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu không khớp!');
      return;
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
      'NV';

    const bgList = [
      'bg-blue-100 text-blue-800 border-blue-300',
      'bg-emerald-100 text-emerald-800 border-emerald-300',
      'bg-indigo-100 text-indigo-800 border-indigo-300',
      'bg-amber-100 text-amber-800 border-amber-300',
      'bg-purple-100 text-purple-800 border-purple-300',
    ];
    const pickedBg = bgList[Math.floor(Math.random() * bgList.length)];

    const newEmp: Employee = {
      id: `NV${Date.now().toString().slice(-4)}`,
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || `${initials.toLowerCase()}@courtx.vn`,
      avatarText: initials,
      avatarBg: pickedBg,
      status,
      role: 'Nhân viên vận hành sân COURTX',
      joinDate: new Date().toLocaleDateString('vi-VN'),
      schedule5Days: [],
    };

    onSaveEmployee(newEmp, password);
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

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer shadow-2xs"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          THÊM NHÂN VIÊN <span className="text-emerald-600">MỚI</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Tạo tài khoản và phân quyền nhân viên vận hành sân thể thao đa năng CourtX.
        </p>
      </div>

      {/* 🟢 Avatar Preview Section */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 text-blue-700 font-black text-xl shadow-2xs">
            <span>{avatarText || 'NV'}</span>
          </div>
          <span
            className={[
              'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white',
              status === 'active' ? 'bg-emerald-500' : 'bg-slate-400',
            ].join(' ')}
          />
        </div>
        <span className="mt-2 text-xs font-bold text-slate-800">
          {fullName.trim() || 'Nhân viên mới'}
        </span>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          {errorMessage}
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
                placeholder="Nhập họ và tên (vd: Nguyễn Văn An)"
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
              <span className="text-[10px] text-slate-400 font-medium">Định dạng VN</span>
            </div>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                placeholder="Nhập số điện thoại (vd: 0901 234 567)"
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
              <span className="text-[10px] text-slate-400 font-medium">Không bắt buộc</span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="Nhập email liên hệ (không bắt buộc)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TÀI KHOẢN & BẢO MẬT */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <span>TÀI KHOẢN & BẢO MẬT</span>
          </div>

          {/* Mật khẩu ban đầu */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800">
                Mật khẩu ban đầu <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Ít nhất 6 ký tự</span>
            </div>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu truy cập"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-10 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Mật khẩu để nhân viên đăng nhập ứng dụng COURTX Mobile.
            </p>
          </div>

          {/* Xác nhận mật khẩu */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Xác nhận mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Xác nhận lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: TRẠNG THÁI TÀI KHOẢN */}
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
                Được phép đăng nhập hệ thống
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
                Khóa quyền đăng nhập
              </span>
            </div>
          </div>
        </div>



        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.2]" />
          <span>+ THÊM NHÂN VIÊN</span>
        </button>
      </form>
    </div>
  );
}
