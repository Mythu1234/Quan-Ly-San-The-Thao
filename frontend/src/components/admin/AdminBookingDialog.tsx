import type { FormEvent } from 'react';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, Clock3, User, X } from 'lucide-react';

interface Props {
  court: { name: string; sportName: string; pricePerHour: number };
  dateLabel: string;
  startTime: string;
  endTime: string;
  duration: number;
  startOptions: string[];
  endOptions: string[];
  durations: number[];
  customerName: string;
  customerPhone: string;
  note: string;
  sendZalo: boolean;
  errors: { name?: string; phone?: string };
  conflict: { customerName: string; time: string } | null | undefined;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onSendZaloChange: (value: boolean) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function AdminBookingDialog(props: Props) {
  const { court, errors, conflict } = props;
  const totalPrice = Math.round((court.pricePerHour * props.duration) / 60);
  const formattedPrice = `${totalPrice.toLocaleString('vi-VN')}đ`;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-booking-title"
        className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-2xl animate-in slide-in-from-bottom-6 duration-200"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 id="admin-booking-title" className="text-sm font-extrabold text-slate-900">
                Chi tiết đặt sân
              </h2>
              <p className="mt-0.5 text-[11px] text-slate-500">Kiểm tra lịch và thông tin người đặt</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng chi tiết đặt sân"
            onClick={props.onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={props.onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 py-3">
            <section aria-label="Thông tin sân và thời gian" className="space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500">{court.sportName}</p>
                    <h3 className="mt-0.5 text-lg font-extrabold tracking-tight text-emerald-800">{court.name}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã chọn sân
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 border-t border-emerald-100 pt-2 text-xs font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  {props.dateLabel}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="space-y-1 text-[11px] font-semibold text-slate-500">
                  <span>Giờ bắt đầu</span>
                  <select
                    value={props.startTime}
                    onChange={e => props.onStartChange(e.target.value)}
                    className={`h-10 w-full cursor-pointer rounded-xl border bg-white px-3 text-sm font-bold outline-none transition focus:ring-2 focus:ring-emerald-100 ${
                      conflict ? 'border-red-300 text-red-700' : 'border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    {props.startOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-500">
                  <span>Giờ kết thúc</span>
                  <select
                    value={props.endTime}
                    onChange={e => props.onEndChange(e.target.value)}
                    className={`h-10 w-full cursor-pointer rounded-xl border bg-white px-3 text-sm font-bold outline-none transition focus:ring-2 focus:ring-emerald-100 ${
                      conflict ? 'border-red-300 text-red-700' : 'border-slate-200 text-slate-900 focus:border-emerald-600'
                    }`}
                  >
                    {props.endOptions.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label htmlFor="admin-booking-duration" className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  Thời lượng
                </label>
                <select
                  id="admin-booking-duration"
                  value={props.duration}
                  onChange={e => props.onDurationChange(Number(e.target.value))}
                  className="h-9 max-w-[60%] cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {props.durations.map(dur => (
                    <option key={dur} value={dur}>
                      {dur === 30 ? '30 phút' : dur % 60 === 0 ? `${dur / 60} tiếng` : `${Math.floor(dur / 60)} tiếng 30 phút`}
                    </option>
                  ))}
                </select>
              </div>

              {conflict && (
                <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-bold">Khung giờ đã được đặt</p>
                    <p className="mt-1 leading-relaxed">
                      {conflict.customerName ? `${conflict.customerName} · ${conflict.time}` : `${props.startTime} – ${props.endTime} bị trùng lịch trên ${court.name}`}. Vui lòng chọn giờ khác.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-2.5 border-t border-slate-100 pt-3">
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <User className="h-3.5 w-3.5 text-emerald-700" />
                Thông tin người đặt
              </h3>
              <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
                <label className="space-y-1 text-[11px] font-semibold text-slate-500">
                  <span>
                    Họ và tên <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={props.customerName}
                    onChange={e => props.onNameChange(e.target.value)}
                    placeholder="Nhập họ và tên (tối thiểu 5 ký tự)"
                    aria-invalid={Boolean(errors.name)}
                    className={`h-10 w-full rounded-xl border px-3 text-xs font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 ${
                      errors.name
                        ? 'border-red-400 bg-red-50/40 text-red-900 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-slate-50 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100'
                    }`}
                  />
                  {errors.name && (
                    <p role="alert" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-tight text-red-600">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </label>
                <label className="space-y-1 text-[11px] font-semibold text-slate-500">
                  <span>
                    Số điện thoại <span className="text-red-500">*</span>
                  </span>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={props.customerPhone}
                    onChange={e => props.onPhoneChange(e.target.value)}
                    placeholder="Ví dụ: 0912345678 (10 số)"
                    maxLength={11}
                    aria-invalid={Boolean(errors.phone)}
                    className={`h-10 w-full rounded-xl border px-3 text-xs font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 ${
                      errors.phone
                        ? 'border-red-400 bg-red-50/40 text-red-900 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 bg-slate-50 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100'
                    }`}
                  />
                  {errors.phone && (
                    <p role="alert" className="mt-1 flex items-start gap-1 text-[11px] font-semibold leading-tight text-red-600">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </label>
              </div>
              <label className="block space-y-1 text-[11px] font-semibold text-slate-500">
                <span>
                  Ghi chú <span className="font-normal text-slate-400">(tùy chọn)</span>
                </span>
                <input
                  type="text"
                  value={props.note}
                  onChange={e => props.onNoteChange(e.target.value)}
                  placeholder="Yêu cầu thêm cho lượt đặt"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="flex cursor-pointer items-start gap-2 py-1 text-[11px] leading-relaxed text-slate-600">
                <input
                  type="checkbox"
                  checked={props.sendZalo}
                  onChange={e => props.onSendZaloChange(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-emerald-700"
                />
                <span>Nhận vé và nhắc lịch qua Zalo/SMS</span>
              </label>
            </section>
          </div>

          <div className="shrink-0 space-y-2.5 border-t border-slate-100 bg-white px-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-slate-700">Tổng thanh toán</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {court.pricePerHour.toLocaleString('vi-VN')}đ/giờ · {props.duration} phút
                </p>
              </div>
              <strong className={`text-2xl font-extrabold tracking-tight ${conflict ? 'text-slate-400 line-through' : 'text-emerald-700'}`}>
                {formattedPrice}
              </strong>
            </div>
            <button
              type="submit"
              disabled={Boolean(conflict) || !props.startOptions.length || !props.endOptions.length}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              Thanh toán qua VietQR <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
