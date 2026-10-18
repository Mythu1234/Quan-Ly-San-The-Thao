import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { Employee } from '../../types/admin';

interface EmployeeProfileViewProps {
  employee: Employee;
  onViewMyShifts: () => void;
  onUpdatePhone?: (newPhone: string) => void;
}

export default function EmployeeProfileView({
  employee,
  onViewMyShifts,
  onUpdatePhone,
}: EmployeeProfileViewProps) {
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(employee.phone || '0912.345.678');
  const [saveToast, setSaveToast] = useState<string | null>(null);

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

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* Toast Feedback */}
      {saveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-emerald-700 text-white px-4 py-2.5 text-xs font-black shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 🟢 Top Navigation Bar */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                THÔNG TIN NHÂN SỰ
              </span>
            </div>
            <h1 className="text-sm font-black text-slate-900 truncate">
              Hồ Sơ Cá Nhân Của Tôi
            </h1>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-200">
          Mã NV: {employee.id || 'NV-01'}
        </span>
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
          <span>ĐANG TRỰC CA 2 (11:00 - 17:00)</span>
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
            <span className="text-[10px] font-black text-slate-400 uppercase">GIỜ CÔNG</span>
            <div className="text-lg font-black text-slate-900 mt-1">142h</div>
            <span className="text-[10px] text-emerald-600 font-bold">95% chỉ tiêu</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase">CA HOÀN THÀNH</span>
            <div className="text-lg font-black text-slate-900 mt-1">18 ca</div>
            <span className="text-[10px] text-blue-600 font-bold">0 ca đi trễ</span>
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
        </div>
      </div>

      {/* 4. Lịch trực 5 ngày sắp tới của riêng tôi */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Lịch trực của tôi
            </h2>
          </div>
          <button
            type="button"
            onClick={onViewMyShifts}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
          >
            <span>Xem chi tiết</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {employee.schedule5Days && employee.schedule5Days.length > 0 ? (
            employee.schedule5Days.map((sch, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-[11px] font-black text-slate-700">
                    {sch.dayLabel}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      {sch.shiftName || 'Nghỉ'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {sch.time || 'Không có ca trực'}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                    sch.status === 'working'
                      ? 'bg-emerald-100 text-emerald-800'
                      : sch.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {sch.statusLabel}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-xs text-slate-400">
              Chưa có lịch trực trong 5 ngày tới.
            </div>
          )}
        </div>
      </div>

      {/* 5. Quick Security Notice */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs">
          <span className="font-bold text-slate-800 block">Quyền hạn tài khoản</span>
          <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
            Tài khoản nhân viên được cấp quyền quản lý cơ sở vật chất, vận hành ca trực và theo dõi lịch sân. Mọi thay đổi về phân công nhân sự do Chủ sân phê duyệt.
          </p>
        </div>
      </div>

      {/* 6. CTA to View Shifts */}
      <button
        type="button"
        onClick={onViewMyShifts}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-black text-white shadow-md shadow-emerald-700/20 active:scale-95 transition cursor-pointer"
      >
        <Clock className="w-4 h-4" />
        <span>Vào bảng lịch phân ca trực của tôi</span>
      </button>
    </div>
  );
}
