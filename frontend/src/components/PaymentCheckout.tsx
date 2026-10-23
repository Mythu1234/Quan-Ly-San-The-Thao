import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  Landmark,
  QrCode,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type PaymentPlan = 'full' | 'half' | 'installment';
export type PaymentMethod = 'cash' | 'qr' | 'card';

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
  onClose: () => void;
  onComplete: (result: PaymentResult) => void;
};

const methodOptions: Array<{
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}> = [
  { id: 'cash', label: 'Tiền mặt', shortLabel: 'Tiền mặt', icon: Banknote },
  { id: 'qr', label: 'QR / Chuyển khoản', shortLabel: 'QR / CK', icon: QrCode },
  { id: 'card', label: 'Quẹt thẻ', shortLabel: 'Quẹt thẻ', icon: CreditCard },
];

const qrCells = Array.from({ length: 121 }, (_, index) => {
  const row = Math.floor(index / 11);
  const column = index % 11;
  const finder =
    (row < 4 && column < 4) ||
    (row < 4 && column > 6) ||
    (row > 6 && column < 4);
  return finder || ((row * 3 + column * 5 + row * column) % 7 < 3);
});

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
  registrationMonths = 6,
  onClose,
  onComplete,
}: PaymentCheckoutProps) {
  const effectiveRegistrationMonths = getEffectiveRegistrationMonths(registrationMonths);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>('full');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qr');
  const [methodConfirmed, setMethodConfirmed] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [installmentCount, setInstallmentCount] = useState(effectiveRegistrationMonths);

  const plans = useMemo<PlanDetails[]>(() => {
    const halfAmount = Math.round(totalAmount / 2);
    const installmentAmount = Math.floor(totalAmount / installmentCount);
    const installmentSchedule = Array.from({ length: installmentCount }, (_, index) => ({
      label: index === 0 ? 'Kỳ 1 · Hôm nay' : `Kỳ ${index + 1} · sau ${index} tháng`,
      amount:
        index === installmentCount - 1
          ? totalAmount - installmentAmount * (installmentCount - 1)
          : installmentAmount,
      isToday: index === 0,
    }));

    return [
      {
        id: 'full',
        title: 'Trả toàn bộ một lần',
        description: `Thanh toán ${formatCurrency(totalAmount)} ngay`,
        todayAmount: totalAmount,
        remainingAmount: 0,
        nextDue: null,
        schedule: [{ label: 'Hôm nay', amount: totalAmount, isToday: true }],
      },
      {
        id: 'half',
        title: 'Cọc 50%, trả phần còn lại giữa kỳ',
        description: `${formatCurrency(halfAmount)} hôm nay · phần còn lại giữa kỳ`,
        badge: 'Từ 3 tháng',
        todayAmount: halfAmount,
        remainingAmount: totalAmount - halfAmount,
        nextDue: 'Giữa kỳ · sau 3 tháng',
        schedule: [
          { label: 'Hôm nay', amount: halfAmount, isToday: true },
          { label: 'Giữa kỳ · sau 3 tháng', amount: totalAmount - halfAmount, isToday: false },
        ],
      },
      {
        id: 'installment',
        title: 'Trả theo kỳ',
        description: `${installmentCount} kỳ trong ${installmentCount} tháng · kỳ đầu hôm nay`,
        badge: '1–12 kỳ',
        todayAmount: installmentSchedule[0]?.amount ?? 0,
        remainingAmount: totalAmount - (installmentSchedule[0]?.amount ?? 0),
        nextDue: installmentSchedule[1]?.label ?? null,
        schedule: installmentSchedule,
      },
    ];
  }, [installmentCount, totalAmount]);

  const activePlan = plans.find((plan) => plan.id === selectedPlan) ?? plans[0];
  const activeMethod = methodOptions.find((method) => method.id === selectedMethod) ?? methodOptions[1];
  const requiresMethodConfirmation = selectedMethod === 'cash' || selectedMethod === 'card';
  const canSubmit = !requiresMethodConfirmation || methodConfirmed;
  const transferContent = `THANHTOAN ${orderCode.replace(/[^a-zA-Z0-9]/g, '')}`;

  const closeCheckout = useCallback(() => {
    setSelectedPlan('full');
    setSelectedMethod('qr');
    setMethodConfirmed(false);
    setResult(null);
    setInstallmentCount(effectiveRegistrationMonths);
    onClose();
  }, [effectiveRegistrationMonths, onClose]);

  useEffect(() => {
    setInstallmentCount(effectiveRegistrationMonths);
    setMethodConfirmed(false);
  }, [effectiveRegistrationMonths, open]);

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
    setMethodConfirmed(false);
  };

  const selectMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setMethodConfirmed(false);
  };

  const selectInstallmentCount = (count: number) => {
    setInstallmentCount(count);
    setMethodConfirmed(false);
  };

  const confirmPayment = () => {
    if (!canSubmit) return;

    setResult({
      orderCode,
      plan: activePlan.id,
      planLabel: activePlan.title,
      method: activeMethod.id,
      methodLabel: activeMethod.label,
      paidAmount: activePlan.todayAmount,
      remainingAmount: activePlan.remainingAmount,
      nextDue: activePlan.nextDue,
      remainingSchedule: activePlan.schedule.filter((item) => !item.isToday),
      installmentCount: activePlan.id === 'installment' ? installmentCount : null,
    });
  };

  return (
    <section
      aria-labelledby="payment-checkout-title"
      className="flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-white text-slate-900"
    >
        <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 pb-2.5 pt-[calc(.75rem+env(safe-area-inset-top))] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                <span className="text-lg font-black">C</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black leading-5 tracking-tight text-slate-900">
                    COURT<span className="text-emerald-600">X</span>
                  </span>
                  <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
                </div>
                <p className="truncate text-[9px] font-bold uppercase leading-3 tracking-[0.14em] text-slate-500">
                  Nhà thi đấu đa năng
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold text-emerald-700">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Thanh toán an toàn</span>
            </div>
          </div>
        </header>

        <header className="shrink-0 border-b border-slate-100 bg-white py-3 pl-3 pr-4">
          <div className="flex items-start gap-3">
            {!result && (
              <button
                type="button"
                onClick={closeCheckout}
                aria-label="Quay lại trang đặt sân"
                className="-ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              {result ? <CheckCircle2 className="h-5 w-5" /> : <WalletCards className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="payment-checkout-title" className="text-lg font-black leading-5 tracking-tight text-slate-950">
                {result ? 'Thanh toán thành công' : 'Thanh toán đặt sân'}
              </h2>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                {result ? 'Giao dịch đã được ghi nhận trên bản mẫu' : 'Hoàn tất theo 3 bước rõ ràng'}
              </p>
            </div>
          </div>
        </header>

        {result ? (
          <SuccessContent result={result} />
        ) : (
          <div className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <section aria-labelledby="booking-summary-heading">
              <SectionHeading number="1" id="booking-summary-heading" title="Thông tin đặt sân" />
              <div className="mt-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80">
                <div className="p-3.5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <InfoItem label="Khách hàng" value={customerName} />
                    <InfoItem label="Số điện thoại" value={customerPhone} className="pl-3" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-200 pt-3">
                    <InfoItem label="Mã đặt sân" value={orderCode} mono />
                    <InfoItem label="Thời hạn đăng ký" value={`${effectiveRegistrationMonths} tháng`} className="pl-3" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 items-end gap-x-4 border-t border-slate-200 pt-3">
                    <span className="text-[11px] font-bold text-slate-500">Tổng tiền đăng ký</span>
                    <strong className="min-w-0 break-words pl-3 text-left text-xl font-black tabular-nums tracking-tight text-slate-950">
                      {formatCurrency(totalAmount)}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            <section aria-labelledby="payment-plan-heading">
              <SectionHeading number="2" id="payment-plan-heading" title="Chọn cách thanh toán" />
              <p className="mt-1 text-[10px] leading-4 text-slate-500">Chọn cách chia khoản tiền theo thời gian.</p>
              <div className="mt-2.5 space-y-2" role="radiogroup" aria-label="Cách thanh toán">
                {plans.map((plan) => {
                  const selected = plan.id === selectedPlan;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectPlan(plan.id)}
                      className={`w-full rounded-2xl border p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                            selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[13px] font-extrabold leading-4 text-slate-900">{plan.title}</span>
                            {plan.badge && (
                              <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">
                                {plan.badge}
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-[11px] leading-4 text-slate-600">{plan.description}</span>
                        </span>
                        <strong className={`shrink-0 text-[12px] tabular-nums ${selected ? 'text-emerald-700' : 'text-slate-700'}`}>
                          {formatCurrency(plan.todayAmount)}
                        </strong>
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedPlan === 'installment' && (
                <div
                  className="mt-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 px-3 py-3"
                  role="group"
                  aria-labelledby="installment-count-heading"
                >
                  <div className="flex items-end justify-between gap-3">
                    <p id="installment-count-heading" className="text-[11px] font-black text-slate-800">Chọn số kỳ thanh toán</p>
                    <span className="text-[9px] font-semibold text-slate-500">Mỗi kỳ cách nhau 1 tháng</span>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Số kỳ thanh toán">
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => {
                      const selected = installmentCount === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => selectInstallmentCount(count)}
                          className={`min-h-10 rounded-lg border px-1.5 py-2 text-[11px] font-extrabold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                            selected
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
                        >
                          {count} kỳ
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-600">
                    <CalendarClock className="h-3.5 w-3.5 text-emerald-600" /> Lịch thanh toán
                  </p>
                  <span className="text-[10px] font-bold text-slate-400">{activePlan.schedule.length} lần</span>
                </div>
                <div className={`mt-2 grid gap-1.5 ${activePlan.schedule.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {activePlan.schedule.map((item) => (
                    <div key={item.label} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-2 ring-1 ring-slate-200">
                      <span className={`truncate text-[10px] font-semibold ${item.isToday ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {item.label}
                      </span>
                      <strong className="shrink-0 text-[10px] tabular-nums text-slate-800">{formatCurrency(item.amount)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section aria-labelledby="payment-method-heading">
              <SectionHeading number="3" id="payment-method-heading" title="Chọn phương thức thanh toán" />
              <p className="mt-1 text-[10px] leading-4 text-slate-500">Chọn cách thực hiện khoản thanh toán hôm nay.</p>
              <div className="mt-2.5 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Phương thức thanh toán">
                {methodOptions.map((method) => {
                  const Icon = method.icon;
                  const selected = method.id === selectedMethod;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => selectMethod(method.id)}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] font-extrabold leading-3.5 sm:hidden">{method.shortLabel}</span>
                      <span className="hidden text-[10px] font-extrabold leading-3.5 sm:block">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5">
                {selectedMethod === 'qr' && (
                  <QrPaymentContent
                    amount={activePlan.todayAmount}
                    transferContent={transferContent}
                  />
                )}
                {selectedMethod === 'cash' && (
                  <ManualConfirmation
                    icon={Banknote}
                    title="Số tiền cần thu"
                    amount={activePlan.todayAmount}
                    instruction="Nhân viên kiểm đếm tiền với khách trước khi xác nhận đã thu."
                    buttonLabel="Xác nhận đã thu tiền"
                    confirmed={methodConfirmed}
                    onToggle={() => setMethodConfirmed((value) => !value)}
                  />
                )}
                {selectedMethod === 'card' && (
                  <ManualConfirmation
                    icon={CreditCard}
                    title="Số tiền cần quẹt"
                    amount={activePlan.todayAmount}
                    instruction="Thực hiện giao dịch trên máy POS và kiểm tra trạng thái thành công."
                    buttonLabel="Xác nhận đã thanh toán thẻ"
                    confirmed={methodConfirmed}
                    onToggle={() => setMethodConfirmed((value) => !value)}
                  />
                )}
              </div>
            </section>
          </div>
        )}

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
          {result ? (
            <button
              type="button"
              onClick={() => {
                onComplete(result);
                setSelectedPlan('full');
                setSelectedMethod('qr');
                setMethodConfirmed(false);
                setResult(null);
                setInstallmentCount(effectiveRegistrationMonths);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-[12px] font-black uppercase tracking-wide text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              <Check className="h-4 w-4" strokeWidth={3} /> Hoàn tất
            </button>
          ) : (
            <>
              <div className="mb-2.5 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500">Thanh toán hôm nay</p>
                  <p className="mt-0.5 text-lg font-black tabular-nums text-emerald-700">{formatCurrency(activePlan.todayAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-500">Còn lại</p>
                  <p className={`mt-0.5 text-lg font-black tabular-nums ${activePlan.remainingAmount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                    {formatCurrency(activePlan.remainingAmount)}
                  </p>
                </div>
              </div>
              {activePlan.nextDue && (
                <div className="mb-2.5 flex items-center justify-between rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] text-amber-800">
                  <span className="font-semibold">Lần trả tiếp theo</span>
                  <strong>{activePlan.nextDue}</strong>
                </div>
              )}
              {requiresMethodConfirmation && !methodConfirmed && (
                <p className="mb-2 text-center text-[10px] font-semibold text-amber-700">
                  Hãy xác nhận giao dịch {selectedMethod === 'cash' ? 'tiền mặt' : 'thẻ'} ở bước 3 trước.
                </p>
              )}
              <button
                type="button"
                onClick={confirmPayment}
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-[12px] font-black uppercase tracking-wide text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                <ShieldCheck className="h-4 w-4" /> Xác nhận thanh toán
              </button>
            </>
          )}
        </footer>
    </section>
  );
}

function SectionHeading({ number, id, title }: { number: string; id: string; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-black text-white">{number}</span>
      <h3 id={id} className="text-[13px] font-black uppercase tracking-wide text-slate-900">{title}</h3>
    </div>
  );
}

function InfoItem({ label, value, mono = false, className = '' }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-[10px] font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 break-words text-[12px] font-extrabold leading-snug text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

function QrPaymentContent({ amount, transferContent }: { amount: number; transferContent: string }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3">
      <div className="flex items-center gap-3">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Mã QR minh họa">
          <div className="grid h-full w-full grid-cols-11 gap-[2px] rounded bg-white p-1">
            {qrCells.map((filled, index) => (
              <span key={index} className={filled ? 'bg-slate-900' : 'bg-white'} />
            ))}
          </div>
          <span className="absolute inset-x-2 bottom-2 rounded bg-white/95 py-0.5 text-center text-[7px] font-black uppercase tracking-wider text-emerald-700 shadow-sm">
            QR minh họa
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-900">
            <Landmark className="h-3.5 w-3.5 text-emerald-700" /> MB Bank
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-500">Tài khoản nhận</p>
            <p className="truncate text-[10px] font-bold text-slate-800">COURTX · 12427519920188</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-500">Số tiền</p>
            <p className="text-base font-black tabular-nums text-emerald-700">{formatCurrency(amount)}</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-500">Nội dung chuyển khoản</p>
            <p className="truncate font-mono text-[10px] font-black text-slate-900">{transferContent}</p>
          </div>
        </div>
      </div>
      <p className="mt-2.5 rounded-lg bg-white/80 px-2.5 py-2 text-[10px] leading-4 text-slate-600 ring-1 ring-emerald-100">
        Mã QR chỉ dùng minh họa. Kiểm tra đúng số tiền và nội dung trước khi xác nhận.
      </p>
    </div>
  );
}

function ManualConfirmation({
  icon: Icon,
  title,
  amount,
  instruction,
  buttonLabel,
  confirmed,
  onToggle,
}: {
  icon: LucideIcon;
  title: string;
  amount: number;
  instruction: string;
  buttonLabel: string;
  confirmed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-3.5 transition ${confirmed ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${confirmed ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>
          {confirmed ? <Check className="h-5 w-5" strokeWidth={3} /> : <Icon className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-slate-500">{title}</p>
          <p className="text-xl font-black tabular-nums text-slate-950">{formatCurrency(amount)}</p>
        </div>
      </div>
      <p className="mt-3 text-[10px] leading-4 text-slate-600">{instruction}</p>
      <button
        type="button"
        aria-pressed={confirmed}
        onClick={onToggle}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[11px] font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
          confirmed
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
        }`}
      >
        <Check className="h-4 w-4" /> {confirmed ? 'Đã xác nhận' : buttonLabel}
      </button>
    </div>
  );
}

function SuccessContent({ result }: { result: PaymentResult }) {
  return (
    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-5">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
          <Check className="h-8 w-8" strokeWidth={3} />
        </div>
        <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Giao dịch thành công</p>
        <h3 className="mt-1 text-xl font-black text-slate-950">Đã ghi nhận {formatCurrency(result.paidAmount)}</h3>
        <p className="mt-1 text-[11px] text-slate-500">Mã đặt sân <strong className="font-mono text-slate-800">{result.orderCode}</strong></p>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <div className="space-y-3 p-3.5">
          <ResultRow label="Cách thanh toán" value={result.planLabel} />
          {result.installmentCount && (
            <ResultRow label="Số kỳ đã chọn" value={`${result.installmentCount} kỳ trong ${result.installmentCount} tháng`} />
          )}
          <ResultRow label="Phương thức" value={result.methodLabel} />
          <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
            <div>
              <p className="text-[10px] font-semibold text-slate-500">Đã thanh toán</p>
              <p className="mt-0.5 text-base font-black tabular-nums text-emerald-700">{formatCurrency(result.paidAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-500">Còn lại</p>
              <p className={`mt-0.5 text-base font-black tabular-nums ${result.remainingAmount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {formatCurrency(result.remainingAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {result.remainingAmount > 0 ? (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-center gap-2 text-amber-800">
            <CalendarClock className="h-4 w-4" />
            <p className="text-[11px] font-black">Lịch thanh toán tiếp theo</p>
          </div>
          {result.nextDue && <p className="mt-1 text-[10px] text-amber-700">Kỳ gần nhất: <strong>{result.nextDue}</strong></p>}
          <div className="mt-2 space-y-1.5">
            {result.remainingSchedule.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-white/80 px-2.5 py-2 text-[10px] ring-1 ring-amber-100">
                <span className="font-semibold text-slate-600">{item.label}</span>
                <strong className="tabular-nums text-slate-900">{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-[10px] leading-4 text-emerald-800 ring-1 ring-emerald-100">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Đơn đăng ký đã được thanh toán đầy đủ, không còn khoản đến hạn.
        </div>
      )}
    </div>
  );
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[11px]">
      <span className="shrink-0 font-semibold text-slate-500">{label}</span>
      <strong className="text-right leading-4 text-slate-900">{value}</strong>
    </div>
  );
}
