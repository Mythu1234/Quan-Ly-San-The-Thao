import { useState } from 'react';
import {
  Phone,
  Mail,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Lock,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import type { Employee } from '../../types/admin';

interface EmployeeProfileViewProps {
  employee: Employee;
  onViewMyShifts?: () => void;
  onUpdatePhone?: (newPhone: string) => void;
  onChangePassword?: (newPassword: string) => Promise<void> | void;
}

export default function EmployeeProfileView({
  employee,
  onUpdatePhone,
  onChangePassword,
}: EmployeeProfileViewProps) {
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(employee.phone || '0912.345.678');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // States for Change Password
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleCopy = (text: string, field: 'phone' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdatePhone) {
      onUpdatePhone(phoneNumber);
    }
    setIsEditingPhone(false);
    setSaveToast('Đã cập nhật số điện thoại cá nhân thành công!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    try {
      setIsSubmittingPassword(true);
      if (onChangePassword) {
        await onChangePassword(newPassword);
      }
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaveToast('Đã đổi mật khẩu cá nhân thành công!');
      setTimeout(() => setSaveToast(null), 3500);
    } catch (err: any) {
      setPasswordError(err?.message || 'Có lỗi xảy ra khi đổi mật khẩu!');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* Toast Feedback */}
      {saveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-emerald-700 text-white px-4 py-2.5 text-xs font-black shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 🟢 Top Badge */}
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          THÔNG TIN NHÂN SỰ
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-emerald-700 text-[11px] font-black border border-slate-200 shadow-2xs">
          Mã NV: {employee.id || 'NV-01'}
        </span>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          HỒ SƠ CÁ NHÂN <span className="text-emerald-600">CỦA TÔI</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Xem thông tin liên hệ cá nhân, phân quyền tài khoản và nhiệm vụ vận hành.
        </p>
      </div>

      {/* 1. Main Profile Card */}
      <div className="flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-emerald-600 to-teal-700" />

        {/* Avatar with status indicator */}
        <div className="relative mt-4 mb-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl font-black text-2xl border-4 border-white bg-emerald-100 text-emerald-800 shadow-md">
            <span>{employee.avatarText || 'NA'}</span>
          </div>
          <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500 animate-pulse" />
        </div>

        <h2 className="text-lg font-black tracking-tight text-slate-900">
          {employee.name || 'Nguyễn Văn An'}
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          {employee.role || 'Nhân viên trực ca'} • Ban Vận Hành Sân
        </p>

        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>ĐANG HOẠT ĐỘNG</span>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-around text-center">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Ngày gia nhập</div>
            <div className="text-xs font-black text-slate-800 mt-0.5">{employee.joinDate || '15/01/2024'}</div>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Chức danh</div>
            <div className="text-xs font-black text-slate-800 mt-0.5">Nhân viên chính thức</div>
          </div>
        </div>
      </div>

      {/* 2. My Work Statistics (KPIs cá nhân tháng này) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 px-1">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Thống kê công việc tháng này
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase">GIỜ VẬN HÀNH</span>
            <div className="text-lg font-black text-slate-900 mt-1">142h</div>
            <span className="text-[10px] text-emerald-600 font-bold">95% chỉ tiêu</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase">SỰ CỐ XỬ LÝ</span>
            <div className="text-lg font-black text-slate-900 mt-1">18</div>
            <span className="text-[10px] text-blue-600 font-bold">100% hoàn thành</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase">HIỆU SUẤT</span>
            <div className="text-lg font-black text-emerald-700 mt-1">98.5%</div>
            <span className="text-[10px] text-slate-400 font-bold">Hạng A</span>
          </div>
        </div>
      </div>

      {/* 3. My Contact & Account Information */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Thông tin liên hệ & tài khoản
            </h2>
          </div>
          {!isEditingPhone && (
            <button
              type="button"
              onClick={() => setIsEditingPhone(true)}
              className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Sửa SĐT
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {/* Phone */}
          {isEditingPhone ? (
            <form onSubmit={handleSavePhone} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700">
                Cập nhật số điện thoại liên hệ:
              </label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingPhone(false)}
                  className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-emerald-700 text-xs font-black text-white hover:bg-emerald-800"
                >
                  Lưu
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400">Số điện thoại</div>
                  <div className="text-xs font-black text-slate-900">{phoneNumber}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(phoneNumber, 'phone')}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Sao chép số"
              >
                {copiedField === 'phone' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}

          {/* Email */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400">Email công vụ</div>
                <div className="text-xs font-black text-slate-900">{employee.email || 'an.nguyen@courtx.vn'}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(employee.email || 'an.nguyen@courtx.vn', 'email')}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              title="Sao chép email"
            >
              {copiedField === 'email' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Mật khẩu truy cập & Đổi mật khẩu */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400">Mật khẩu đăng nhập</div>
                  <div className="text-xs font-black text-slate-900 tracking-widest">••••••••</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setPasswordError(null);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isChangingPassword
                    ? 'bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'
                }`}
              >
                <Lock className="w-3 h-3 text-amber-600" />
                <span>{isChangingPassword ? 'Đóng form' : 'Đổi mật khẩu'}</span>
              </button>
            </div>

            {/* Expandable Change Password Form */}
            {isChangingPassword && (
              <form onSubmit={handleSavePassword} className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Cập nhật mật khẩu cá nhân
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Bảo mật</span>
                </div>

                {passwordError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* Mật khẩu hiện tại */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu hiện tại"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Mật khẩu mới */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Mật khẩu mới <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Tối thiểu 6 ký tự</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Xác nhận mật khẩu mới */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Xác nhận lại mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-xs font-bold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordError(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPassword}
                    className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-black text-white shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingPassword ? 'Đang lưu...' : 'Lưu mật khẩu mới'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 4. Quick Security Notice */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-800 block">Quyền hạn tài khoản</span>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
            Tài khoản nhân viên được cấp quyền quản lý cơ sở vật chất, xử lý sự cố thiết bị và theo dõi lịch sân. Mọi thay đổi về phân công nhân sự do Chủ sân phê duyệt.
          </p>
        </div>
      </div>
    </div>
  );
}
