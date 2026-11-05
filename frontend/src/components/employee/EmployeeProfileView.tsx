import { useState } from 'react';
import {
  Phone,
  Mail,
  KeyRound,
  Check,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
} from 'lucide-react';
import type { Employee } from '../../types/admin';
import { staffRole } from '../../utils/staffRole';

interface Props {
  employee: Employee;
  onViewMyShifts?: () => void;
  onUpdatePhone?: (phone: string) => Promise<void> | void;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<void> | void;
}

const inputClass =
  'h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-10 text-xs text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50';

export default function EmployeeProfileView({
  employee,
  onUpdatePhone,
  onChangePassword,
}: Props) {
  const [editPhone, setEditPhone] = useState(false);
  const [editPassword, setEditPassword] = useState(false);
  const [phone, setPhone] = useState(employee.phone);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Show/Hide password toggles
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const active = employee.status === 'active';

  // Kiểm tra thời gian thực các tiêu chuẩn mật khẩu
  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const isDifferentFromOld =
    oldPassword.length > 0 && newPassword.length > 0 && newPassword !== oldPassword;
  const isMatchConfirm = confirmation.length > 0 && confirmation === newPassword;

  // Tính điểm độ mạnh mật khẩu (0 - 4)
  const strengthScore =
    (hasMinLength ? 1 : 0) +
    (hasLetter && hasNumber ? 1 : 0) +
    (hasSpecial ? 1 : 0) +
    (newPassword.length >= 10 ? 1 : 0);

  const getStrengthMeta = () => {
    if (newPassword.length === 0) return { label: 'Chưa nhập', color: 'bg-slate-200', text: 'text-slate-400' };
    if (strengthScore <= 1) return { label: 'Yếu', color: 'bg-rose-500', text: 'text-rose-600' };
    if (strengthScore === 2) return { label: 'Trung bình', color: 'bg-amber-500', text: 'text-amber-600' };
    if (strengthScore === 3) return { label: 'Khá mạnh', color: 'bg-blue-500', text: 'text-blue-600' };
    return { label: 'Rất mạnh', color: 'bg-emerald-600', text: 'text-emerald-700' };
  };

  const strengthMeta = getStrengthMeta();

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    setNotice('');

    // 1. Kiểm tra mật khẩu hiện tại
    if (!oldPassword.trim()) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    // 2. Kiểm tra mật khẩu mới theo chuẩn bảo mật
    if (!hasMinLength) {
      setError('Mật khẩu mới phải có tối thiểu 8 ký tự.');
      return;
    }
    if (!hasLetter) {
      setError('Mật khẩu mới phải chứa ít nhất 1 chữ cái (a-z, A-Z).');
      return;
    }
    if (!hasNumber) {
      setError('Mật khẩu mới phải chứa ít nhất 1 chữ số (0-9).');
      return;
    }
    if (!hasSpecial) {
      setError('Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (VD: @, #, $, %, !...).');
      return;
    }

    // 3. Kiểm tra mật khẩu mới không trùng mật khẩu cũ
    if (newPassword === oldPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu hiện tại. Vui lòng chọn mật khẩu khác.');
      return;
    }

    // 4. Kiểm tra xác nhận mật khẩu
    if (!confirmation.trim()) {
      setError('Vui lòng nhập lại mật khẩu mới vào ô xác nhận.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.');
      return;
    }

    setSaving(true);
    try {
      if (!onChangePassword) {
        throw new Error('Chưa kết nối dịch vụ đổi mật khẩu.');
      }
      await onChangePassword(oldPassword, newPassword);

      // Đồng bộ vào tài khoản fallback nếu có lưu trong localStorage
      try {
        const rawCreds = localStorage.getItem('courtx_account_credentials');
        if (rawCreds) {
          const creds = JSON.parse(rawCreds);
          let updated = false;
          for (const key of Object.keys(creds)) {
            if (creds[key].phone === employee.phone || key === employee.id) {
              creds[key].password = newPassword;
              updated = true;
            }
          }
          if (updated) {
            localStorage.setItem('courtx_account_credentials', JSON.stringify(creds));
          }
        }
      } catch (storageErr) {
        console.warn('Lưu credentials fallback:', storageErr);
      }

      setNotice('Đổi mật khẩu thành công! Mật khẩu mới đã được cập nhật an toàn.');
      setEditPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmation('');
    } catch (failure: any) {
      const msg = failure instanceof Error ? failure.message : 'Chưa lưu được mật khẩu.';
      if (msg.includes('hiện tại') || msg.includes('401')) {
        setError('Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại!');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 pb-12 max-w-2xl">
      <h1 className="text-lg font-black text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>

      {/* Thông tin cá nhân */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${employee.avatarBg}`}
          >
            {employee.avatarText}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">{employee.name}</h2>
            <p className="mt-0.5 text-xs text-emerald-700 font-semibold">
              {staffRole(employee)} <span className="text-slate-400">· {employee.id}</span>
            </p>
          </div>
        </div>

        <dl className="mt-3 space-y-3 border-t border-slate-100 pt-3 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Trạng thái</dt>
            <dd className={`font-semibold ${active ? 'text-emerald-700' : 'text-slate-500'}`}>
              {active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Ngày tạo tài khoản</dt>
            <dd className="font-semibold text-slate-800">{employee.joinDate || '—'}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-slate-500">
              <Phone className="h-3.5 w-3.5" />
              Điện thoại
            </dt>
            <dd className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{employee.phone}</span>
              <button
                type="button"
                onClick={() => {
                  setPhone(employee.phone);
                  setEditPhone(!editPhone);
                  setError('');
                }}
                className="font-semibold text-emerald-700 hover:underline cursor-pointer"
              >
                {editPhone ? 'Hủy' : 'Sửa'}
              </button>
            </dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-slate-500">
              <Mail className="h-3.5 w-3.5" />
              Email
            </dt>
            <dd className="min-w-0 break-all text-right font-semibold text-slate-800">
              {employee.email || '—'}
            </dd>
          </div>
        </dl>

        {editPhone && (
          <form
            className="mt-3 flex items-end gap-2 border-t border-slate-100 pt-3"
            onSubmit={async (event) => {
              event.preventDefault();
              if (saving) return;
              setSaving(true);
              setError('');
              setNotice('');
              try {
                if (!onUpdatePhone) throw new Error('Chưa kết nối cập nhật hồ sơ.');
                await onUpdatePhone(phone);
                setEditPhone(false);
                setNotice('Đã lưu số điện thoại mới thành công.');
              } catch (failure: any) {
                setError(failure instanceof Error ? failure.message : 'Chưa lưu được hồ sơ.');
              } finally {
                setSaving(false);
              }
            }}
          >
            <label className="flex-1 text-[11px] font-semibold text-slate-600">
              Số điện thoại mới
              <input
                required
                type="tel"
                pattern="0[35789][0-9]{8}"
                placeholder="Nhập số điện thoại (10 chữ số)"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-50"
              />
            </label>
            <button
              disabled={saving}
              className="h-10 rounded-xl bg-emerald-700 px-4 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              Lưu
            </button>
          </form>
        )}
      </section>

      {/* Đổi mật khẩu tài khoản */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Shield className="h-4 w-4 text-emerald-700" />
            Mật khẩu bảo mật
          </h3>
          <button
            type="button"
            onClick={() => {
              setEditPassword(!editPassword);
              setError('');
              setNotice('');
              setOldPassword('');
              setNewPassword('');
              setConfirmation('');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {editPassword ? 'Đóng' : 'Đổi mật khẩu'}
          </button>
        </div>

        {editPassword && (
          <form onSubmit={handlePasswordSubmit} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
            {/* 1. Mật khẩu hiện tại */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  type={showOldPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang sử dụng"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showOldPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 2. Mật khẩu mới & Xác nhận */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mật khẩu mới */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={showNewPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={showConfirmPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Thước đo độ mạnh mật khẩu */}
            {newPassword.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Độ mạnh mật khẩu:</span>
                  <span className={`font-bold ${strengthMeta.text}`}>{strengthMeta.label}</span>
                </div>
                {/* 4 nấc đo */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        strengthScore >= step ? strengthMeta.color : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Danh sách tiêu chí kiểm tra trực tiếp (Checklist) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    {hasMinLength ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                    <span>Tối thiểu 8 ký tự</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    {hasLetter && hasNumber ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                    <span>Có cả chữ cái và chữ số</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    {hasSpecial ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                    <span>Chứa ký tự đặc biệt (@, #, $...)</span>
                  </div>

                  <div className={`flex items-center gap-1.5 ${isDifferentFromOld ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                    {isDifferentFromOld ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className="h-3.5 w-3.5 rounded-full border border-slate-300" />}
                    <span>Khác mật khẩu hiện tại</span>
                  </div>

                  {confirmation.length > 0 && (
                    <div className={`flex items-center gap-1.5 sm:col-span-2 ${isMatchConfirm ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}`}>
                      {isMatchConfirm ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                      <span>{isMatchConfirm ? 'Mật khẩu xác nhận trùng khớp' : 'Mật khẩu xác nhận chưa khớp'}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nút hành động */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={saving}
                className="h-10 w-full rounded-xl bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 transition active:scale-95 shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="h-3.5 w-3.5" />
                {saving ? 'Đang cập nhật mật khẩu...' : 'Lưu mật khẩu mới'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Thông báo lỗi */}
      {error && (
        <div
          role="alert"
          className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Thông báo thành công */}
      {notice && (
        <div
          role="status"
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in"
        >
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
}
