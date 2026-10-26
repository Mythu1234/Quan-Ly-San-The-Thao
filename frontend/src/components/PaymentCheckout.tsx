import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CalendarClock,
  Check,
  CheckCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  Landmark,
  QrCode,
  ShieldCheck,
  WalletCards,
  X,
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
  { id: 'qr', label: 'VietQR MB Bank', shortLabel: 'VietQR', icon: QrCode },
  { id: 'card', label: 'Quẹt thẻ POS', shortLabel: 'Thẻ POS', icon: CreditCard },
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
        title: 'Trả toàn bộ một lần (100%)',
        description: `Thanh toán đủ ${formatCurrency(totalAmount)} ngay`,
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
        title: 'Trả theo từng kỳ linh hoạt',
        description: `${installmentCount} kỳ trong ${installmentCount} tháng · kỳ đầu thanh toán hôm nay`,
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
              <span>{result ? 'Thanh toán thành công' : 'Thanh toán đặt sân'}</span>
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
          <SuccessContent result={result} />
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
                  <InfoItem label="Thời hạn đăng ký" value={`${effectiveRegistrationMonths} tháng`} />
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <span className="text-[11px] font-bold text-slate-600">Tổng tiền đăng ký:</span>
                  <span className="text-base font-black text-slate-900 tabular-nums">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            </section>

            {/* BƯỚC 2: CHỌN CÁCH THANH TOÁN */}
            <section aria-labelledby="payment-plan-heading">
              <SectionHeading number="2" id="payment-plan-heading" title="Chọn hình thức thanh toán" />
              <p className="mt-0.5 text-[10px] text-slate-500">Chọn cách chia khoản tiền theo thời gian.</p>
              
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
              <p className="mt-0.5 text-[10px] text-slate-500">Chọn kênh thực hiện khoản thanh toán hôm nay.</p>
              
              <div className="mt-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Phương thức thanh toán">
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
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-2 text-center transition cursor-pointer ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50/70 text-emerald-800 font-bold shadow-xs ring-1 ring-emerald-500/20'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${selected ? 'text-emerald-600' : 'text-slate-500'}`} />
                      <span className="text-[10px] font-black">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* NỘI DUNG THEO PHƯƠNG THỨC ĐÃ CHỌN */}
              <div className="mt-2">
                {selectedMethod === 'qr' && (
                  <QrPaymentContent
                    amount={activePlan.todayAmount}
                    transferContent={transferContent}
                  />
                )}
                {selectedMethod === 'cash' && (
                  <ManualConfirmation
                    icon={Banknote}
                    title="Tiền mặt cần thu"
                    amount={activePlan.todayAmount}
                    instruction="Nhân viên kiểm đếm đủ tiền mặt từ khách trước khi bấm xác nhận."
                    buttonLabel="Xác nhận đã thu đủ tiền mặt"
                    confirmed={methodConfirmed}
                    onToggle={() => setMethodConfirmed((value) => !value)}
                  />
                )}
                {selectedMethod === 'card' && (
                  <ManualConfirmation
                    icon={CreditCard}
                    title="Số tiền quẹt POS"
                    amount={activePlan.todayAmount}
                    instruction="Quẹt/chạm thẻ trên máy POS và đối chiếu biên lai thành công."
                    buttonLabel="Xác nhận đã thanh toán POS thành công"
                    confirmed={methodConfirmed}
                    onToggle={() => setMethodConfirmed((value) => !value)}
                  />
                )}
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
                setSelectedMethod('qr');
                setMethodConfirmed(false);
                setResult(null);
                setInstallmentCount(effectiveRegistrationMonths);
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 text-xs font-black uppercase tracking-wide text-white shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Check className="h-4 w-4" strokeWidth={3} /> Hoàn tất đơn đặt sân
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-xs">
                <div>
                  <span className="block text-[9px] font-bold text-slate-500">Thu hôm nay:</span>
                  <span className="text-sm font-black text-emerald-700 tabular-nums">
                    {formatCurrency(activePlan.todayAmount)}
                  </span>
                </div>
                <div className="h-5 w-px bg-slate-200" />
                <div>
                  <span className="block text-[9px] font-bold text-slate-500">Còn lại:</span>
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
                  disabled={!canSubmit}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1 shadow-xs transition active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Xác nhận
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
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
      <p className={`mt-0.5 truncate text-[11px] font-black text-slate-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
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
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs text-center flex items-center justify-center">
          <div className="grid h-full w-full grid-cols-11 gap-[2px] rounded bg-white p-1">
            {qrCells.map((filled, index) => (
              <span key={index} className={filled ? 'bg-slate-900' : 'bg-white'} />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-white text-emerald-700 px-1.5 py-0.5 font-black text-[8px] rounded-full shadow border border-emerald-100 uppercase">
              COURTX
            </span>
          </div>
        </div>

        {/* Thông tin chuyển khoản */}
        <div className="min-w-0 flex-1 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-black text-slate-900 text-[11px]">
              <Landmark className="h-3.5 w-3.5 text-emerald-700" /> MB Bank
            </div>
            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[8px] font-black text-emerald-700">VIETQR</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white px-2 py-1 border border-slate-200/80">
            <div>
              <p className="text-[9px] font-bold text-slate-500">STK MB Bank</p>
              <p className="font-mono text-[11px] font-black text-slate-900">12427519920188</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard('12427519920188', 'acc')}
              className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded cursor-pointer"
            >
              {copiedAccount ? <CheckCheck className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{copiedAccount ? 'Đã chép' : 'Chép'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-500">Số tiền cần quét</p>
              <p className="text-xs font-black tabular-nums text-emerald-700">{formatCurrency(amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500">Chủ tài khoản</p>
              <p className="text-[10px] font-black text-slate-800 uppercase">COURTX ARENA</p>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-white px-2 py-1 border border-slate-200/80">
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold text-slate-500">Nội dung CK</p>
              <p className="font-mono text-[10px] font-black text-slate-900 truncate">{transferContent}</p>
            </div>
            <button
              type="button"
              onClick={() => copyToClipboard(transferContent, 'content')}
              className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded cursor-pointer shrink-0 ml-1.5"
            >
              {copiedContent ? <CheckCheck className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              <span>{copiedContent ? 'Đã chép' : 'Chép'}</span>
            </button>
          </div>
        </div>
      </div>
      <p className="mt-2 rounded-lg bg-white/90 px-2 py-1 text-[9px] leading-relaxed text-slate-600 border border-emerald-100">
        💡 Quét mã bằng app ngân hàng bất kỳ để tự động điền đúng số tiền và nội dung.
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
    <div className={`rounded-2xl border p-3 transition ${confirmed ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-slate-50/70'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${confirmed ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 shadow-2xs'}`}>
          {confirmed ? <Check className="h-4 w-4" strokeWidth={3} /> : <Icon className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-500">{title}</p>
          <p className="text-sm font-black tabular-nums text-slate-900">{formatCurrency(amount)}</p>
        </div>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">{instruction}</p>
      <button
        type="button"
        aria-pressed={confirmed}
        onClick={onToggle}
        className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-[11px] font-black transition cursor-pointer ${
          confirmed
            ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
            : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700'
        }`}
      >
        <Check className="h-3.5 w-3.5" /> {confirmed ? 'Đã xác nhận thành công' : buttonLabel}
      </button>
    </div>
  );
}

function SuccessContent({ result }: { result: PaymentResult }) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 text-xs space-y-3.5">
      <div className="text-center py-1">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
          <Check className="h-6 w-6" strokeWidth={3} />
        </div>
        <p className="mt-2.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">Giao dịch đã xác nhận</p>
        <h3 className="mt-0.5 text-base font-black text-slate-900">
          Đã thu {formatCurrency(result.paidAmount)}
        </h3>
        <p className="mt-0.5 text-[10px] text-slate-500">
          Mã đơn: <strong className="font-mono text-slate-800">{result.orderCode}</strong>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-3 space-y-2">
        <ResultRow label="Hình thức thanh toán" value={result.planLabel} />
        {result.installmentCount && (
          <ResultRow label="Số kỳ đăng ký" value={`${result.installmentCount} kỳ (${result.installmentCount} tháng)`} />
        )}
        <ResultRow label="Kênh thu tiền" value={result.methodLabel} />
        
        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
          <div>
            <p className="text-[9px] font-bold text-slate-500">Đã thu</p>
            <p className="mt-0.5 text-xs font-black tabular-nums text-emerald-700">{formatCurrency(result.paidAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-bold text-slate-500">Còn lại</p>
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
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-2.5 text-[10px] text-emerald-800 border border-emerald-100 font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Đã thanh toán đủ 100%. Không còn công nợ.</span>
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
