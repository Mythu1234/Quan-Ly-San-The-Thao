import type { FormEvent } from 'react';
import { AlertTriangle, ArrowRight, Calendar, CheckCircle2, Clock3, UserRound, X } from 'lucide-react';
import IncidentSelect from './IncidentSelect';

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

const durationLabel = (minutes: number) => {
  const hours = Math.floor(minutes / 60), remaining = minutes % 60;
  return hours ? `${hours} giờ${remaining ? ` ${remaining} phút` : ''}` : `${remaining} phút`;
};

export default function AdminBookingDialog(props: Props) {
  const { court, errors, conflict } = props;
  const inputClass = (invalid = false) => `h-10 w-full min-w-0 rounded-xl border px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 ${invalid ? 'border-red-300 bg-red-50 focus:ring-red-100' : 'border-slate-200 bg-slate-50/60 focus:border-emerald-500 focus:bg-white focus:ring-emerald-100'}`;
  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-900/60 p-2 backdrop-blur-sm sm:items-center sm:p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="admin-booking-title" className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white text-slate-900 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><Calendar className="h-5 w-5" /></span>
            <div><h2 id="admin-booking-title" className="text-base font-bold">Chi tiết đặt sân</h2><p className="mt-0.5 text-xs text-slate-500">Kiểm tra lịch và thông tin người đặt</p></div>
          </div>
          <button type="button" aria-label="Đóng form đặt sân" onClick={props.onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"><X className="h-4 w-4" /></button>
        </header>
        <form onSubmit={props.onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain px-4 py-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <div><p className="text-xs text-slate-500">{court.sportName}</p><h3 className="mt-0.5 text-xl font-bold text-emerald-800">{court.name}</h3></div>
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-1 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="h-3 w-3" />Đã chọn sân</span>
              </div>
              <p className="mt-2 flex items-center gap-2 border-t border-emerald-100 pt-2 text-xs font-medium text-slate-600"><Calendar className="h-4 w-4 text-emerald-600" />{props.dateLabel}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="min-w-0"><label htmlFor="admin-booking-start" className="mb-1 block text-xs font-medium text-slate-500">Giờ bắt đầu</label><IncidentSelect id="admin-booking-start" value={props.startTime} options={props.startOptions.map(value => ({ value, label: value }))} placeholder="Hết giờ đặt" searchPlaceholder="Giờ bắt đầu" searchable={false} disabled={!props.startOptions.length} onChange={props.onStartChange} /></div>
              <div className="min-w-0"><label htmlFor="admin-booking-end" className="mb-1 block text-xs font-medium text-slate-500">Giờ kết thúc</label><IncidentSelect id="admin-booking-end" value={props.endTime} options={props.endOptions.map(value => ({ value, label: value }))} placeholder="Chọn giờ" searchPlaceholder="Giờ kết thúc" searchable={false} disabled={!props.endOptions.length} onChange={props.onEndChange} /></div>
            </div>
            <div className="flex items-center justify-between gap-3"><label htmlFor="admin-booking-duration" className="flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="h-4 w-4" />Thời lượng</label><div className="w-36"><IncidentSelect id="admin-booking-duration" value={String(props.duration)} options={props.durations.map(value => ({ value: String(value), label: durationLabel(value) }))} placeholder="Chọn thời lượng" searchPlaceholder="Thời lượng" searchable={false} compact onChange={value => props.onDurationChange(Number(value))} /></div></div>
            {conflict && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" /><div><p className="font-semibold">Khung giờ đã có người đặt</p><p className="mt-1">{conflict.customerName} · {conflict.time}. Vui lòng chọn giờ khác.</p></div></div>}
            <div className="space-y-2.5 border-t border-slate-100 pt-3">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold"><UserRound className="h-4 w-4 text-emerald-700" />Thông tin người đặt</h3>
              <div className="grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
                <div className="min-w-0"><label htmlFor="admin-booking-name" className="mb-1 block text-xs text-slate-500">Họ và tên <span className="text-red-500">*</span></label><input id="admin-booking-name" required autoComplete="name" value={props.customerName} onChange={event => props.onNameChange(event.target.value)} placeholder="Nhập họ và tên" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'admin-booking-name-error' : undefined} className={inputClass(!!errors.name)} />{errors.name && <p id="admin-booking-name-error" className="mt-1 text-[11px] text-red-600">{errors.name}</p>}</div>
                <div className="min-w-0"><label htmlFor="admin-booking-phone" className="mb-1 block text-xs text-slate-500">Số điện thoại <span className="text-red-500">*</span></label><input id="admin-booking-phone" type="tel" required autoComplete="tel" value={props.customerPhone} onChange={event => props.onPhoneChange(event.target.value)} placeholder="Nhập số điện thoại" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'admin-booking-phone-error' : undefined} className={inputClass(!!errors.phone)} />{errors.phone && <p id="admin-booking-phone-error" className="mt-1 text-[11px] text-red-600">{errors.phone}</p>}</div>
              </div>
              <div><label htmlFor="admin-booking-note" className="mb-1 block text-xs text-slate-500">Ghi chú <span className="text-slate-400">(tùy chọn)</span></label><input id="admin-booking-note" value={props.note} onChange={event => props.onNoteChange(event.target.value)} placeholder="Yêu cầu thêm cho lượt đặt" className={inputClass()} /></div>
              <label className="flex cursor-pointer items-center gap-2 py-1 text-xs text-slate-500"><input type="checkbox" checked={props.sendZalo} onChange={event => props.onSendZaloChange(event.target.checked)} className="h-4 w-4 accent-emerald-700" />Nhận vé và nhắc lịch qua Zalo/SMS</label>
            </div>
          </div>
          <footer className="shrink-0 space-y-3 border-t border-slate-100 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-2"><div><p className="text-xs font-semibold text-slate-700">Tổng thanh toán</p><p className="mt-0.5 text-[10px] text-slate-400">{court.pricePerHour.toLocaleString('vi-VN')}đ/giờ · {durationLabel(props.duration)}</p></div><strong className="text-2xl text-emerald-700">{Math.round(court.pricePerHour * props.duration / 60).toLocaleString('vi-VN')}đ</strong></div>
            <div className="flex gap-2"><button type="button" onClick={props.onClose} className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100">Hủy bỏ</button><button type="submit" disabled={!!conflict || !props.startOptions.length || !props.endOptions.length} className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-2 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">Thanh toán qua VietQR<ArrowRight className="h-4 w-4 shrink-0" /></button></div>
          </footer>
        </form>
      </section>
    </div>
  );
}
