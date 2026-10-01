import { useState } from 'react';
import {
  X,
  Camera,
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
  Info,
  UserPlus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { Employee } from '../../types/admin';

interface AddStaffViewProps {
  onBack: () => void;
  onSaveEmployee: (newEmp: Employee) => void;
}

export default function AddStaffView({ onBack, onSaveEmployee }: AddStaffViewProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'template'>('create');

  // Form states
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

  // Load sample template (Chỉnh sửa (Mẫu))
  const handleLoadTemplate = () => {
    setActiveTab('template');
    setFullName('Lê Hoàng Cường');
    setPhone('0915 889 900');
    setEmail('cuong.le@courtx.vn');
    setPassword('CourtX@2026');
    setConfirmPassword('CourtX@2026');
    setStatus('active');
    setAvatarText('HC');
    setErrorMessage(null);
  };

  // Switch to clean create mode
  const handleSwitchCreate = () => {
    setActiveTab('create');
    handleReset();
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

    const newEmp: Employee = {
      id: `NV${Date.now().toString().slice(-4)}`,
      name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || `${initials.toLowerCase()}@courtx.vn`,
      avatarText: initials,
      avatarBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      status,
      role: 'Nhân viên vận hành sân COURTX',
      joinDate: new Date().toLocaleDateString('vi-VN'),
      currentShift: {
        type: 'morning',
        title: 'Ca sáng',
        time: '06:00 - 14:00',
        status: 'working',
        statusLabel: 'SẴN SÀNG',
      },
      schedule5Days: [
        { dayLabel: 'Hôm nay (01/10)', date: '01/10', shiftName: 'Ca sáng', time: '06:00 - 14:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
        { dayLabel: 'Ngày mai (02/10)', date: '02/10', shiftName: 'Ca chiều', time: '14:00 - 22:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
        { dayLabel: 'Thứ Bảy (03/10)', date: '03/10', shiftName: 'Nghỉ ca thường lệ', time: '', status: 'off', statusLabel: 'Nghỉ ca' },
        { dayLabel: 'Chủ Nhật (04/10)', date: '04/10', shiftName: 'Ca tối', time: '17:00 - 23:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
        { dayLabel: 'Thứ Hai (05/10)', date: '05/10', shiftName: 'Ca sáng', time: '06:00 - 14:00', status: 'scheduled', statusLabel: 'Đã phân ca' },
      ],
    };

    onSaveEmployee(newEmp);
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200">
      {/* 🟢 Subheader Banner (Dismiss Bar) */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                HỆ THỐNG COURTX
              </span>
            </div>
            <p className="text-xs font-bold text-slate-800">Thêm Nhân Viên Mới</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* 🟢 Top Tab Switcher */}
      <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={handleSwitchCreate}
          className={[
            'rounded-xl py-2 text-xs font-bold transition cursor-pointer',
            activeTab === 'create'
              ? 'bg-white text-slate-900 shadow-2xs font-black'
              : 'text-slate-500 hover:text-slate-800',
          ].join(' ')}
        >
          Thêm mới
        </button>
        <button
          type="button"
          onClick={handleLoadTemplate}
          className={[
            'flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition cursor-pointer',
            activeTab === 'template'
              ? 'bg-white text-slate-900 shadow-2xs font-black'
              : 'text-slate-500 hover:text-slate-800',
          ].join(' ')}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Chỉnh sửa (Mẫu)</span>
        </button>
      </div>

      {/* 🟢 Avatar Upload Section */}
      <div className="flex flex-col items-center justify-center py-2">
        <div className="relative">
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 text-emerald-800 shadow-2xs">
            {avatarText ? (
              <span className="text-xl font-black">{avatarText}</span>
            ) : (
              <UserPlus className="w-8 h-8 stroke-[1.8] text-emerald-700" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#1b4d3e] text-white shadow-md border-2 border-white">
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
        </div>
        <span className="mt-2.5 text-xs font-bold text-slate-800">Thêm ảnh đại diện</span>
        <span className="text-[10px] text-slate-400">Định dạng JPG, PNG (Tối đa 3MB)</span>
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
                Cho phép truy cập ca trực
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

        {/* Info Banner */}
        <div className="flex gap-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 p-3.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Vai trò mặc định là <strong className="text-slate-900 font-bold">Nhân viên</strong>.
            Quyền hạn bao gồm: nhận lịch đặt sân, check-in vận động viên và hỗ trợ khách tại quầy.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#1b4d3e] hover:bg-[#143d31] py-4 text-xs font-black uppercase tracking-wider text-white shadow-md shadow-emerald-950/15 transition active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.2]" />
          <span>+ THÊM NHÂN VIÊN</span>
        </button>
      </form>
    </div>
  );
}
