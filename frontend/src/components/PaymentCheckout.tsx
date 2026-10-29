import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Check,
  CheckCheck,
  Copy,
  Landmark,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react';
import QrCodeArtwork from './QrCodeArtwork';

export type PaymentPlan = 'full' | 'installment';
export type PaymentMethod = 'qr';

type ScheduleItem = {
  label: string;
  amount: number;
  isToday: boolean;
};

type PlanDetails = {
  id: PaymentPlan;
  title: string;
  description: string;
  badge?: string;
  todayAmount: number;
  remainingAmount: number;
  nextDue: string | null;
  schedule: ScheduleItem[];
};

export type PaymentResult = {
  orderCode: string;
  plan: PaymentPlan;
  planLabel: string;
  method: PaymentMethod;
  methodLabel: string;
  paidAmount: number;
  remainingAmount: number;
  nextDue: string | null;
  remainingSchedule: ScheduleItem[];
  installmentCount: number | null;
};

type PaymentCheckoutProps = {
  open: boolean;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  registrationMonths?: number;
  bookingDetails?: {
    sport: string;
    court: string;
    date: string;
    time: string;
  };
  allowInstallments?: boolean;
  onClose: () => void;
  onComplete: (result: PaymentResult) => void;
};

const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`;

const getEffectiveRegistrationMonths = (months: number) => {
  const wholeMonths = Number.isFinite(months) ? Math.trunc(months) : 1;
  return Math.min(12, Math.max(1, wholeMonths));
};

export default function PaymentCheckout({
  open,
  orderCode,
  customerName,
  customerPhone,
  totalAmount,
  registrationMonths,
  bookingDetails,
  allowInstallments = false,
  onClose,
  onComplete,
}: PaymentCheckoutProps) {
  const effectiveInstallmentCount = getEffectiveRegistrationMonths(registrationMonths ?? 6);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>('full');
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [installmentCount, setInstallmentCount] = useState(effectiveInstallmentCount);

  const plans = useMemo<PlanDetails[]>(() => {
    const installmentAmount = Math.floor(totalAmount / installmentCount);
    const installmentSchedule = Array.from({ length: installmentCount }, (_, index) => ({
      label: index === 0 ? 'Kỳ 1 · Hôm nay' : `Kỳ ${index + 1} · sau ${index} tháng`,
      amount:
        index === installmentCount - 1
          ? totalAmount - installmentAmount * (installmentCount - 1)
          : installmentAmount,
      isToday: index === 0,
    }));

    const availablePlans: PlanDetails[] = [
      {
        id: 'full',
        title: 'Trả toàn bộ một lần (100%)',
        description: `Thanh toán đủ ${formatCurrency(totalAmount)} ngay`,
        todayAmount: totalAmount,
        remainingAmount: 0,
        nextDue: null,
        schedule: [{ label: 'Hôm nay', amount: totalAmount, isToday: true }],
      },
    ];

    if (allowInstallments) {
      availablePlans.push({
        id: 'installment',
        title: 'Trả theo từng kỳ linh hoạt',
        description: `${installmentCount} kỳ trong ${installmentCount} tháng · kỳ đầu thanh toán hôm nay`,
        badge: '1–12 kỳ',
        todayAmount: installmentSchedule[0]?.amount ?? 0,
        remainingAmount: totalAmount - (installmentSchedule[0]?.amount ?? 0),
        nextDue: installmentSchedule[1]?.label ?? null,
        schedule: installmentSchedule,
      });
    }

    return availablePlans;
  }, [allowInstallments, installmentCount, totalAmount]);

  const activePlan = plans.find((plan) => plan.id === selectedPlan) ?? plans[0];
  const transferContent = `THANHTOAN ${orderCode.replace(/[^a-zA-Z0-9]/g, '')}`;

  const closeCheckout = useCallback(() => {
    setSelectedPlan('full');
    setResult(null);
    setInstallmentCount(effectiveInstallmentCount);
    onClose();
  }, [effectiveInstallmentCount, onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCheckout();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeCheckout, open]);

  if (!open) return null;

  const selectPlan = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
  };

  const selectInstallmentCount = (count: number) => {
    setInstallmentCount(count);
  };

  const confirmPayment = () => {
    setResult({
      orderCode,
      plan: activePlan.id,
      planLabel: activePlan.title,
      method: 'qr',
      methodLabel: 'VietQR MB Bank',
      paidAmount: activePlan.todayAmount,
      remainingAmount: activePlan.remainingAmount,
      nextDue: activePlan.nextDue,
      remainingSchedule: activePlan.schedule.filter((item) => !item.isToday),
      installmentCount: activePlan.id === 'installment' ? installmentCount : null,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-checkout-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-0 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeCheckout();
      }}
    >
      {/* 🟢 KHUNG FORM CHUẨN MAX-W-MD, DÍNH HẾT TRÊN DƯỚI MÀN HÌNH (100% CHIỀU CAO) */}
      <div className="relative flex w-full max-w-md flex-col h-full h-dvh overflow-hidden bg-white text-slate-900 shadow-2xl border-x border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* ======================================================== */}
        {/* 🟢 HEADER ĐỒNG BỘ COURT X NHÀ THI ĐẤU ĐA NĂNG           */}
        {/* ======================================================== */}
        <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <span className="text-lg font-black">C</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-slate-900">
                    COURT<span className="text-emerald-600">X</span>
                  </span>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                </div>
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Nhà thi đấu đa năng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3 w-3" /> An toàn
              </span>
              <button
                type="button"
                onClick={closeCheckout}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Subtitle tag */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 font-black text-slate-900">
              <WalletCards className="w-4 h-4 text-emerald-600" />
              <span>{result ? 'Ghi nhận thanh toán' : 'Thanh toán đặt sân'}</span>
            </div>
            <span className="text-slate-500 font-mono font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">
              {orderCode}
            </span>
          </div>
        </header>

        {/* ======================================================== */}
        {/* 📋 NỘI DUNG FORM (ẨN SCROLLBAR XẤU, CUỘN MƯỢT)           */}
        {/* ======================================================== */}
        {result ? (
          <PaymentRecordContent result={result} />
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-3.5 space-y-3.5 text-xs">
            {/* BƯỚC 1: THÔNG TIN ĐẶT SÂN */}
            <section aria-labelledby="booking-summary-heading">
              <SectionHeading number="1" id="booking-summary-heading" title="Thông tin đặt sân" />
              <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3">
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <InfoItem label="Khách hàng" value={customerName} />
                  <InfoItem label="Số điện thoại" value={customerPhone} />
                  <InfoItem label="Mã đặt sân" value={orderCode} mono />
                  {bookingDetails && (
                    <>
                      <InfoItem label="Môn thể thao" value={bookingDetails.sport} />
                      <InfoItem label="Sân / khu vực" value={bookingDetails.court} />
                      <InfoItem label="Ngày đặt" value={bookingDetails.date} />
                      <InfoItem label="Khung giờ" value={bookingDetails.time} />
                    </>
                  )}
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <span className="text-xs font-bold text-slate-600">Tổng tiền đặt sân:</span>
                  <span className="text-base font-black text-slate-900 tabular-nums">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </section>

            {/* BƯỚC 2: CHỌN CÁCH THANH TOÁN */}
            <section aria-labelledby="payment-plan-heading">
              <SectionHeading number="2" id="payment-plan-heading" title="Chọn hình thức thanh toán" />
              <p className="mt-0.5 text-[10px] text-slate-500">
                {allowInstallments
                  ? 'Thanh toán đủ ngay hoặc chia đợt theo thỏa thuận hợp đồng.'
                  : 'Thanh toán đủ 100% ngay khi xác nhận đặt sân.'}
              </p>
              
              <div className="mt-2 space-y-1.5" role="radiogroup" aria-label="Cách thanh toán">
                {plans.map((plan) => {
                  const selected = plan.id === selectedPlan;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectPlan(plan.id)}
                      className={`w-full rounded-2xl border p-2.5 text-left transition cursor-pointer ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {selected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">{plan.title}</span>
                            {plan.badge && (
                              <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-black uppercase text-emerald-700">
                                {plan.badge}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[10px] text-slate-600">{plan.description}</p>
                        </div>
                        <span className={`shrink-0 text-xs font-black tabular-nums ${selected ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {formatCurrency(plan.todayAmount)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* TÙY CHỌN SỐ KỲ NẾU CHỌN TRẢ THEO KỲ */}
              {selectedPlan === 'installment' && (
                <div
                  className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-2.5"
                  role="group"
                  aria-labelledby="installment-count-heading"
                >
                  <div className="flex items-center justify-between gap-1">
                    <p id="installment-count-heading" className="text-[10px] font-black text-slate-800">
                      Chọn số kỳ thanh toán:
                    </p>
                    <span className="text-[9px] font-semibold text-slate-500">Mỗi kỳ cách 1 tháng</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1" role="radiogroup" aria-label="Số kỳ">
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => {
                      const selected = installmentCount === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => selectInstallmentCount(count)}
                          className={`py-1 rounded-lg text-[10px] font-black tabular-nums transition cursor-pointer text-center ${
                            selected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
                        >
                          {count} kỳ
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LỊCH THANH TOÁN CHI TIẾT */}
              <div className="mt-2 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-2.5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    <CalendarClock className="h-3.5 w-3.5 text-emerald-600" /> Tiến độ thanh toán
                  </p>
                  <span className="text-[10px] font-bold text-slate-500">{activePlan.schedule.length} đợt</span>
                </div>
                <div className={`mt-1.5 grid gap-1 ${activePlan.schedule.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {activePlan.schedule.map((item) => (
                    <div
                      key={item.label}
                      className="flex min-w-0 items-center justify-between gap-1.5 rounded-lg bg-white px-2 py-1 border border-slate-200/80 shadow-2xs"
                    >
                      <span className={`truncate text-[10px] font-semibold ${item.isToday ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                        {item.label}
                      </span>
                      <strong className="shrink-0 text-[10px] tabular-nums text-slate-800">{formatCurrency(item.amount)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* BƯỚC 3: PHƯƠNG THỨC THANH TOÁN */}
            <section aria-labelledby="payment-method-heading">
              <SectionHeading number="3" id="payment-method-heading" title="Phương thức thanh toán" />
              <p className="mt-0.5 text-[10px] text-slate-500">Chỉ nhận chuyển khoản qua mã QR của sân.</p>
              <div className="mt-2">
                <QrPaymentContent amount={activePlan.todayAmount} transferContent={transferContent} />
              </div>
            </section>
          </div>
        )}

        {/* ======================================================== */}
        {/* 🔘 FOOTER THANH TOÁN (BO GÓC TRÒN ĐỒNG NHẤT)             */}
        {/* ======================================================== */}
        <footer className="border-t border-slate-200 bg-white/95 px-4 py-3 shrink-0 flex items-center justify-between gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          {result ? (
            <button
              type="button"
              onClick={() => {
                onComplete(result);
                setSelectedPlan('full');
                setResult(null);
                setInstallmentCount(effectiveInstallmentCount);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 text-xs font-black uppercase tracking-wide text-white shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Check className="h-4 w-4" strokeWidth={3} /> Hoàn tất ghi nhận
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-xs">
                <div>
                  <span className="block text-[11px] font-bold text-slate-500">Ghi nhận hôm nay:</span>
                  <span className="text-sm font-black text-emerald-700 tabular-nums">
                    {formatCurrency(activePlan.todayAmount)}
                  </span>
                </div>
                <div className="h-5 w-px bg-slate-200" />
                <div>
                  <span className="block text-[11px] font-bold text-slate-500">Còn phải thu:</span>
                  <span className={`text-xs font-black tabular-nums ${activePlan.remainingAmount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    {formatCurrency(activePlan.remainingAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={closeCheckout}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={confirmPayment}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Tôi đã đối soát
                </button>
              </div>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

function SectionHeading({ number, id, title }: { number: string; id: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[10px] font-black text-white">
        {number}
      </span>
      <h3 id={id} className="text-xs font-black uppercase tracking-wide text-slate-900">
        {title}
      </h3>
    </div>
  );
}

function InfoItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold text-slate-600">{label}</p>
      <p className={`mt-0.5 truncate text-xs font-black text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function QrPaymentContent({ amount, transferContent }: { amount: number; transferContent: string }) {
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  const copyToClipboard = (text: string, type: 'acc' | 'content') => {
    navigator.clipboard.writeText(text);
    if (type === 'acc') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/50 p-3">
      <div className="flex items-center gap-3">
        {/* QR Scan box */}
        <QrCodeArtwork className="h-28 w-28 shrink-0 rounded-xl p-1.5" />

        {/* Thông tin chuyển khoản */}
        <div className="min-w-0 flex-1 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-black text-slate-900 text-[11px]">
              <Landmark className="h-3.5 w-3.5 text-emerald-700" /> MB Bank
            </div>
            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-black text-emerald-700">VIETQR</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white px-2 py-1 border border-slate-200/80">
            <div>
              <p className="text-[11px] font-bold text-slate-600">STK MB Bank</p>
              <p className="font-mono text-[11px] font-black text-slate-900">12427519920188</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('12427519920188', 'acc')}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded cursor-pointer"
            >
              {copiedAccount ? <CheckCheck className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{copiedAccount ? 'Đã chép' : 'Chép'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-600">Số tiền cần quét</p>
              <p className="text-xs font-black tabular-nums text-emerald-700">{formatCurrency(amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-slate-600">Chủ tài khoản</p>
              <p className="text-[11px] font-black text-slate-800 uppercase">COURTX ARENA</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white px-2 py-1 border border-slate-200/80">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-600">Nội dung chuyển khoản</p>
              <p className="font-mono text-[11px] font-black text-slate-900 truncate">{transferContent}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(transferContent, 'content')}
              className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded cursor-pointer shrink-0 ml-1.5"
            >
              {copiedContent ? <CheckCheck className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{copiedContent ? 'Đã chép' : 'Chép'}</span>
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 rounded-lg bg-white/90 px-2 py-1 text-[12px] leading-relaxed text-slate-700 border border-emerald-100">
        Mã QR minh họa, không dùng để chuyển tiền. Hệ thống không xác minh giao dịch ngân hàng; chỉ ghi nhận sau khi nhân viên tự đối soát khoản tiền thực nhận.
      </p>
    </div>
  );
}

function PaymentRecordContent({ result }: { result: PaymentResult }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 text-xs space-y-3.5">
      <div className="text-center py-1">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <Check className="h-6 w-6" strokeWidth={3} />
        </div>
        <p className="mt-2.5 text-[11px] font-black uppercase tracking-wider text-amber-800">Ghi nhận nội bộ từ nhân viên</p>
        <h3 className="mt-0.5 text-base font-black text-slate-900">
          Ghi nhận {formatCurrency(result.paidAmount)}
        </h3>
        <p className="mt-0.5 text-[10px] text-slate-500">
          Mã đơn: <strong className="font-mono text-slate-800">{result.orderCode}</strong>
        </p>
      </div>

      <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-950">
        Mã QR chỉ minh họa và không dùng để chuyển tiền. Đây không phải xác nhận từ ngân hàng; hệ thống không kiểm tra giao dịch tự động. Chỉ hoàn tất sau khi nhân viên đã tự đối soát khoản tiền thực nhận.
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
        <ResultRow label="Hình thức thanh toán" value={result.planLabel} />
        {result.installmentCount && (
          <ResultRow label="Số kỳ thanh toán" value={`${result.installmentCount} kỳ (${result.installmentCount} tháng)`} />
        )}
        <ResultRow label="Kênh thu tiền" value={result.methodLabel} />
        
        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
          <div>
            <p className="text-[11px] font-bold text-slate-600">Đã ghi nhận</p>
            <p className="mt-0.5 text-xs font-black tabular-nums text-slate-900">{formatCurrency(result.paidAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-slate-600">Còn phải thu</p>
            <p className={`mt-0.5 text-xs font-black tabular-nums ${result.remainingAmount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {formatCurrency(result.remainingAmount)}
            </p>
          </div>
        </div>
      </div>

      {result.remainingAmount > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
          <div className="flex items-center gap-1.5 text-amber-900 font-black text-[11px]">
            <CalendarClock className="h-3.5 w-3.5 text-amber-700" />
            <span>Kế hoạch thanh toán kỳ tiếp theo</span>
          </div>
          {result.nextDue && (
            <p className="mt-1 text-[10px] text-amber-800">
              Kỳ đến hạn gần nhất: <strong>{result.nextDue}</strong>
            </p>
          )}
          <div className="mt-1.5 space-y-1">
            {result.remainingSchedule.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/90 px-2 py-1 text-[10px] border border-amber-100 shadow-2xs">
                <span className="font-semibold text-slate-700">{item.label}</span>
                <strong className="tabular-nums text-slate-900">{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-2.5 text-[12px] text-slate-800 border border-slate-200 font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0 text-slate-600" />
          <span>Đã ghi nhận đủ 100% tại quầy sau đối soát thủ công; không có xác minh tự động từ ngân hàng.</span>
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[11px]">
      <span className="shrink-0 font-semibold text-slate-500">{label}:</span>
      <strong className="text-right text-slate-900">{value}</strong>
    </div>
  );
}
