import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Banknote,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  Info,
  Printer,
  QrCode,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Transaction } from '../../types/admin';

interface WalletRevenueViewProps {
  transactions: Transaction[];
  onProcessRefund: (txId: string, bankRef: string) => void;
}

type StatusFilter = 'all' | Transaction['status'];
type ReportPeriod = 'day' | 'week' | 'month';

interface DateRange {
  start: Date;
  end: Date;
}

interface DailyBookingTotal {
  date: Date;
  amount: number;
}

const formatCurrency = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseTransactionDate = (value: string): Date | null => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, dayText, monthText, yearText, hourText, minuteText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hour ||
    date.getMinutes() !== minute
  ) {
    return null;
  }

  return date;
};

const dateKey = (date: Date) => formatDateInput(date);

const getLatestTransactionDate = (transactions: Transaction[]) => {
  let latestDate: Date | null = null;

  for (const transaction of transactions) {
    const transactionDate = parseTransactionDate(transaction.date);
    if (transactionDate && (!latestDate || transactionDate > latestDate)) {
      latestDate = transactionDate;
    }
  }

  return latestDate ? dateKey(latestDate) : formatDateInput(new Date());
};

const getDateRange = (selectedDate: string, period: ReportPeriod): DateRange => {
  const [year, month, day] = selectedDate.split('-').map(Number);
  const anchorDate = new Date(year, month - 1, day);
  const start = new Date(anchorDate);
  const end = new Date(anchorDate);

  if (period === 'week') {
    const daysFromMonday = (anchorDate.getDay() + 6) % 7;
    start.setDate(anchorDate.getDate() - daysFromMonday);
    end.setDate(start.getDate() + 6);
  } else if (period === 'month') {
    start.setDate(1);
    end.setMonth(anchorDate.getMonth() + 1, 0);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const getCourtInfo = (courtInfo: string) => {
  const parts = courtInfo.split(/\s*·\s*|\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
  return {
    sport: parts[0] || 'Khác',
    court: parts.slice(1).join(' · ') || 'Chưa cập nhật sân',
  };
};

const getSport = (courtInfo: string) => getCourtInfo(courtInfo).sport;

const statusText: Record<Transaction['status'], string> = {
  success: 'Đã thanh toán',
  pending_refund: 'Chờ hoàn tiền',
  refunded: 'Đã hoàn tiền',
};

const transactionTypeText: Record<Transaction['type'], string> = {
  booking: 'Đặt sân',
  refund: 'Hoàn tiền',
};

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

function StatusPill({ status, compact = false }: { status: Transaction['status']; compact?: boolean }) {
  const styles: Record<Transaction['status'], string> = {
    success: 'bg-emerald-50 text-emerald-700',
    pending_refund: 'bg-amber-50 text-amber-800',
    refunded: 'bg-slate-100 text-slate-600',
  };

  const dotStyles: Record<Transaction['status'], string> = {
    success: 'bg-emerald-500',
    pending_refund: 'bg-amber-500',
    refunded: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${compact ? 'gap-1 px-1.5 py-0.5 text-[10px] leading-4' : ''} ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {statusText[status]}
    </span>
  );
}

export default function WalletRevenueView({ transactions, onProcessRefund }: WalletRevenueViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('day');
  const [selectedDate, setSelectedDate] = useState(() => getLatestTransactionDate(transactions));
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundTransaction, setRefundTransaction] = useState<Transaction | null>(null);
  const [refundReference, setRefundReference] = useState('');
  const [localStatuses, setLocalStatuses] = useState<Record<string, Transaction['status']>>({});
  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const refundCloseRef = useRef<HTMLButtonElement>(null);
  const detailDialogRef = useRef<HTMLDivElement>(null);
  const refundDialogRef = useRef<HTMLDivElement>(null);

  const visibleTransactions = useMemo(
    () => transactions.map((transaction) => ({
      ...transaction,
      status: localStatuses[transaction.id] ?? transaction.status,
    })),
    [localStatuses, transactions],
  );

  const dateRange = useMemo(() => getDateRange(selectedDate, reportPeriod), [reportPeriod, selectedDate]);
  const periodTransactions = useMemo(
    () => visibleTransactions.filter((transaction) => {
      const transactionDate = parseTransactionDate(transaction.date);
      return transactionDate !== null && transactionDate >= dateRange.start && transactionDate <= dateRange.end;
    }),
    [dateRange, visibleTransactions],
  );

  const sports = useMemo(
    () => [...new Set(periodTransactions.map((transaction) => getSport(transaction.courtInfo)))].sort(),
    [periodTransactions],
  );

  const filteredTransactions = useMemo(
    () => periodTransactions.filter((transaction) => {
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesSport = sportFilter === 'all' || getSport(transaction.courtInfo) === sportFilter;
      return matchesStatus && matchesSport;
    }),
    [periodTransactions, sportFilter, statusFilter],
  );

  const bookingTransactions = useMemo(
    () => periodTransactions.filter((transaction) => transaction.type === 'booking'),
    [periodTransactions],
  );
  const successfulBookingTransactions = bookingTransactions.filter((transaction) => transaction.status === 'success');
  const pendingRefunds = periodTransactions.filter(
    (transaction) => transaction.type === 'refund' && transaction.status === 'pending_refund',
  );
  const bookingAmount = bookingTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const receivedAmount = successfulBookingTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const pendingRefundTotal = pendingRefunds.reduce((sum, transaction) => sum + transaction.amount, 0);

  const periodLabel = reportPeriod === 'day' ? 'Ngày' : reportPeriod === 'week' ? 'Tuần' : 'Tháng';
  const formatRangeDate = (date: Date) => new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
  const rangeLabel = reportPeriod === 'day'
    ? formatRangeDate(dateRange.start)
    : `${formatRangeDate(dateRange.start)} – ${formatRangeDate(dateRange.end)}`;

  const chartData = useMemo<DailyBookingTotal[]>(() => {
    const dayTotals = new Map<string, number>();
    for (const transaction of bookingTransactions) {
      const transactionDate = parseTransactionDate(transaction.date);
      if (transactionDate) {
        const key = dateKey(transactionDate);
        dayTotals.set(key, (dayTotals.get(key) ?? 0) + transaction.amount);
      }
    }

    const days: DailyBookingTotal[] = [];
    const cursor = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), dateRange.start.getDate());
    const lastDate = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth(), dateRange.end.getDate());
    while (cursor <= lastDate) {
      days.push({ date: new Date(cursor), amount: dayTotals.get(dateKey(cursor)) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [bookingTransactions, dateRange]);

  const chartMax = Math.max(0, ...chartData.map((item) => item.amount));

  useEffect(() => {
    if (!selectedTransaction && !refundTransaction) return;

    const closeButton = refundTransaction ? refundCloseRef.current : detailCloseRef.current;
    const dialog = refundTransaction ? refundDialogRef.current : detailDialogRef.current;
    closeButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (refundTransaction) setRefundTransaction(null);
        else setSelectedTransaction(null);
        return;
      }

      if (event.key !== 'Tab' || !dialog) return;
      const focusableElements = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refundTransaction, selectedTransaction]);

  const handleConfirmRefund = () => {
    if (!refundTransaction || !refundReference.trim()) return;
    onProcessRefund(refundTransaction.id, refundReference.trim());
    setLocalStatuses((current) => ({ ...current, [refundTransaction.id]: 'refunded' }));
    setRefundTransaction(null);
    setSelectedTransaction(null);
    setRefundReference('');
  };

  const handleExport = () => {
    const headers = [
      'Mã giao dịch',
      'Ngày giao dịch',
      'Loại giao dịch',
      'Khách hàng',
      'Số điện thoại',
      'Bộ môn',
      'Sân',
      'Khung giờ',
      'Số tiền (VND)',
      'Trạng thái',
      'Mã đặt sân',
      'Mã tham chiếu',
    ];
    const rows = filteredTransactions.map((transaction) => {
      const { sport, court } = getCourtInfo(transaction.courtInfo);
      return [
        transaction.code,
        transaction.date,
        transactionTypeText[transaction.type],
        transaction.customerName,
        transaction.customerPhone,
        sport,
        court,
        transaction.timeSlot,
        transaction.amount,
        statusText[transaction.status],
        transaction.ticketCode,
        transaction.bankRef,
      ];
    });
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `thong-ke-dat-san-${periodLabel.toLowerCase()}-${selectedDate}${statusFilter !== 'all' ? `-${statusFilter}` : ''}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  };

  const openRefundDialog = (transaction: Transaction) => {
    setRefundReference(transaction.bankRef || '');
    setRefundTransaction(transaction);
  };

  return (
    <main className="relative @container min-w-0 w-full flex-1 space-y-6 overflow-x-hidden bg-white p-4 pb-28 sm:p-6 lg:p-8">
      <header className="flex min-w-0 flex-col gap-5 @6xl:flex-row @6xl:items-end @6xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
            <CalendarDays className="h-3.5 w-3.5 text-emerald-700" />
            {periodLabel} · {rangeLabel}
          </div>
          <h1 className="mt-3 text-xl font-black tracking-tight text-slate-950 @6xl:text-2xl">
            Thống kê đặt sân & thanh toán
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-600">
            Tổng hợp giao dịch đặt sân và khoản hoàn tiền theo ngày, tuần hoặc tháng đã chọn.
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-3 @2xl:flex-row @2xl:items-center @6xl:shrink-0">
          <div role="group" aria-label="Chọn kỳ thống kê" className="grid grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 shadow-sm @2xl:min-w-[220px]">
            {([
              ['day', 'Ngày'],
              ['week', 'Tuần'],
              ['month', 'Tháng'],
            ] as [ReportPeriod, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={reportPeriod === value}
                onClick={() => setReportPeriod(value)}
                className={`min-h-10 rounded-lg px-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                  reportPeriod === value
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 @2xl:flex-none">
            <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 @2xl:flex-none">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              <span className="sr-only">Chọn ngày neo cho kỳ thống kê</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none"
                aria-label="Chọn ngày neo cho kỳ thống kê"
              />
            </label>

            <button
              type="button"
              onClick={handleExport}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-emerald-800 bg-emerald-800 px-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 @2xl:px-3"
            >
              <Download className="h-3.5 w-3.5" />
              Xuất Excel
            </button>
          </div>
        </div>
      </header>

      <section
        aria-label={`Số liệu ${periodLabel.toLowerCase()} ${rangeLabel}`}
        className="flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2"
      >
        <MetricCard
          icon={<ReceiptText />}
          label="Số lượt đặt sân"
          value={new Intl.NumberFormat('vi-VN').format(bookingTransactions.length)}
          detail={`Trong ${periodLabel.toLowerCase()} đã chọn`}
          tone="emerald"
        />
        <MetricCard
          icon={<Banknote />}
          label="Tổng tiền đặt sân"
          value={formatCurrency(bookingAmount)}
          detail="Giao dịch đặt sân trong kỳ"
          tone="slate"
        />
        <MetricCard
          icon={<CheckCircle2 />}
          label="Đã nhận từ đặt sân"
          value={formatCurrency(receivedAmount)}
          detail={`${successfulBookingTransactions.length} giao dịch thanh toán thành công`}
          tone="emerald"
        />
        <MetricCard
          icon={<RotateCcw />}
          label="Đang chờ hoàn tiền"
          value={formatCurrency(pendingRefundTotal)}
          detail={`${pendingRefunds.length} giao dịch hoàn tiền`}
          tone="amber"
        />
      </section>

      <section className="grid min-w-0 gap-4 @6xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.85fr)]">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-slate-900">Giá trị đặt sân theo ngày</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Tổng tiền từ các giao dịch đặt sân trong khoảng thời gian đã chọn.</p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-700" />
              Tiền đặt sân
            </span>
          </div>

          {bookingTransactions.length === 0 ? (
            <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
                <CalendarDays className="h-5 w-5" />
              </span>
              <p className="mt-3 text-sm font-bold text-slate-700">Chưa có giao dịch đặt sân</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">Chọn ngày khác hoặc đổi kỳ thống kê để xem dữ liệu giao dịch thực tế.</p>
            </div>
          ) : (
            <div
              role="img"
              aria-label={`Biểu đồ giá trị đặt sân theo ngày, tổng ${formatCurrency(bookingAmount)}`}
              className="mt-5 overflow-x-auto pb-2"
            >
              <div className={`flex h-48 min-w-0 items-end gap-1.5 border-b border-slate-200 px-1 sm:gap-2 ${chartData.length > 10 ? 'min-w-[900px]' : ''}`}>
                {chartData.map(({ date, amount }, index) => {
                  const barHeight = chartMax > 0 && amount > 0 ? Math.max(8, (amount / chartMax) * 100) : 2;
                  const showLabel = reportPeriod === 'month' || chartData.length < 10 || index === 0 || index === chartData.length - 1 || (index + 1) % 5 === 0;
                  const label = reportPeriod === 'week'
                    ? new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(date)
                    : String(date.getDate());

                  return (
                    <div key={dateKey(date)} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                      <span className="max-w-full truncate text-center text-[10px] font-semibold tabular-nums text-slate-500">
                        {chartData.length <= 10 && amount > 0
                          ? new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(amount)
                          : ''}
                      </span>
                      <div className="flex h-28 w-full items-end justify-center">
                        <div
                          title={`${formatRangeDate(date)} · ${formatCurrency(amount)}`}
                          className={`w-full max-w-12 rounded-t-md transition-colors ${amount > 0 ? 'bg-gradient-to-t from-emerald-800 to-emerald-500 hover:from-emerald-700 hover:to-emerald-400' : 'bg-slate-100'}`}
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span className="h-4 text-[10px] font-semibold text-slate-500">
                        {showLabel ? label : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {bookingTransactions.length > 0 && (
            <p className="mt-2 text-right text-[11px] font-semibold text-slate-500">
              Tổng cộng <span className="font-extrabold text-slate-800">{formatCurrency(bookingAmount)}</span>
            </p>
          )}
        </div>

        {pendingRefunds.length > 0 ? (
          <aside className="flex min-w-0 flex-col rounded-2xl border border-amber-200 bg-[#fffaf0] p-4 shadow-sm sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <RotateCcw className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-wide text-amber-900">Cần đối soát hoàn tiền</p>
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{formatCurrency(pendingRefundTotal)}</p>
                <p className="mt-1 text-xs font-medium text-amber-900/80">{pendingRefunds.length} khoản hoàn đang chờ xử lý trong kỳ.</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-amber-200/80 bg-white/70 p-3">
              <p className="text-xs font-bold text-slate-800">{pendingRefunds[0].customerName}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {pendingRefunds[0].refundReason || 'Yêu cầu hoàn tiền cần được chủ sân đối soát.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openRefundDialog(pendingRefunds[0])}
              className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              <QrCode className="h-4 w-4" />
              Tiếp tục hoàn tiền
            </button>
          </aside>
        ) : (
          <aside className="flex min-w-0 flex-col justify-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Hoàn tiền đang chờ</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">Không có giao dịch hoàn tiền cần xử lý trong kỳ này.</p>
              </div>
            </div>
          </aside>
        )}
      </section>

      <section className="-mx-4 overflow-hidden border-y border-slate-200 bg-white shadow-sm sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:p-5 @6xl:flex-row @6xl:items-center @6xl:justify-between">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-slate-900">Giao dịch trong kỳ</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredTransactions.length} / {periodTransactions.length} giao dịch · {rangeLabel}
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-3 @4xl:flex-row @4xl:items-center">
            <div role="group" aria-label="Lọc theo trạng thái" className="flex min-w-0 gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
              {([
                ['all', 'Tất cả'],
                ['success', 'Đã thanh toán'],
                ['pending_refund', 'Chờ hoàn'],
                ['refunded', 'Đã hoàn'],
              ] as [StatusFilter, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={statusFilter === value}
                  onClick={() => setStatusFilter(value)}
                  className={`min-h-10 shrink-0 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    statusFilter === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="relative flex min-h-11 min-w-0 items-center">
              <span className="sr-only">Lọc theo bộ môn</span>
              <select
                value={sportFilter}
                onChange={(event) => setSportFilter(event.target.value)}
                aria-label="Lọc theo bộ môn"
                className="min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 @2xl:min-w-44"
              >
                <option value="all">Tất cả bộ môn</option>
                {sports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
            </label>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <ReceiptText className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-slate-700">Không có giao dịch phù hợp</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
              {periodTransactions.length === 0
                ? 'Chưa có giao dịch hợp lệ trong khoảng thời gian đã chọn.'
                : 'Thử thay đổi bộ lọc trạng thái hoặc bộ môn.'}
            </p>
          </div>
        ) : (
          <div className="w-full min-w-0 overflow-x-auto">
            <table className="w-full min-w-[560px] table-fixed border-collapse text-left @4xl:min-w-0">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="w-[24%] border border-slate-200 px-1.5 py-2 text-[10px] leading-4 @4xl:hidden">Giao dịch</th>
                  <th scope="col" className="w-[23%] border border-slate-200 px-1.5 py-2 text-[10px] leading-4 @4xl:hidden">Khách</th>
                  <th scope="col" className="w-[17%] border border-slate-200 px-1.5 py-2 text-[10px] leading-4 @4xl:hidden">Sân</th>
                  <th scope="col" className="w-[24%] border border-slate-200 px-1.5 py-2 text-[10px] leading-4 @4xl:hidden">Tiền · xử lý</th>
                  <th scope="col" className="w-[12%] border border-slate-200 px-1 py-2 text-center text-[10px] leading-4 @4xl:hidden">Chi tiết</th>
                  <th scope="col" className="hidden w-[20%] border border-slate-200 px-3 py-3.5 @4xl:table-cell">Giao dịch</th>
                  <th scope="col" className="hidden w-[19%] border border-slate-200 px-3 py-3.5 @4xl:table-cell">Khách hàng</th>
                  <th scope="col" className="hidden w-[17%] border border-slate-200 px-3 py-3.5 @4xl:table-cell">Bộ môn & sân</th>
                  <th scope="col" className="hidden w-[17%] border border-slate-200 px-3 py-3.5 text-right @4xl:table-cell">Số tiền</th>
                  <th scope="col" className="hidden w-[17%] border border-slate-200 px-3 py-3.5 @4xl:table-cell">Trạng thái</th>
                  <th scope="col" className="hidden w-[10%] border border-slate-200 px-3 py-3.5 text-right @4xl:table-cell">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onView={() => setSelectedTransaction(transaction)}
                    onRefund={() => openRefundDialog(transaction)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedTransaction(null)}
        >
          <div
            ref={detailDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-dialog-title"
            className="flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex flex-none items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <ReceiptText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Chi tiết giao dịch</p>
                  <h2 id="transaction-dialog-title" className="mt-0.5 truncate text-base font-black text-slate-900">
                    {selectedTransaction.code}
                  </h2>
                </div>
              </div>
              <button
                ref={detailCloseRef}
                type="button"
                aria-label="Đóng chi tiết giao dịch"
                onClick={() => setSelectedTransaction(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="no-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900">{selectedTransaction.customerName}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">{selectedTransaction.customerPhone}</p>
                    <p className="mt-1.5 inline-flex rounded-md bg-white px-2 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                      {transactionTypeText[selectedTransaction.type]}
                    </p>
                  </div>
                  <StatusPill status={selectedTransaction.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-slate-200 pt-2.5">
                  <p className="text-[11px] font-semibold text-slate-500">Số tiền giao dịch</p>
                  <p className="text-lg font-black tracking-tight text-slate-950">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
              </section>

              <section aria-label="Thông tin giao dịch" className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                <DetailRow icon={<ReceiptText />} label="Mã đặt sân" value={selectedTransaction.ticketCode || '—'} />
                <DetailRow icon={<CalendarDays />} label="Thời gian giao dịch" value={selectedTransaction.date} />
                <DetailRow wide icon={<Building2 />} label="Bộ môn & sân" value={selectedTransaction.courtInfo} />
                <DetailRow wide icon={<Clock3 />} label="Khung giờ đặt sân" value={selectedTransaction.timeSlot} />
                <DetailRow wide icon={<Banknote />} label="Mã tham chiếu ngân hàng" value={selectedTransaction.bankRef || '—'} />
              </section>

              {selectedTransaction.refundReason && (
                <aside className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] leading-4 text-amber-900">
                  <div className="flex items-center gap-2 font-extrabold"><Info className="h-3.5 w-3.5 shrink-0" /> Lý do hoàn tiền</div>
                  <p className="mt-1">{selectedTransaction.refundReason}</p>
                </aside>
              )}
            </div>

            <footer className="flex flex-none gap-2 border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <Printer className="h-3.5 w-3.5" />
                In phiếu
              </button>
              {selectedTransaction.type === 'refund' && selectedTransaction.status === 'pending_refund' && (
                <button
                  type="button"
                  onClick={() => openRefundDialog(selectedTransaction)}
                  className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-3 text-xs font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Xử lý hoàn
                </button>
              )}
            </footer>
          </div>
        </div>
      )}

      {refundTransaction && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => event.target === event.currentTarget && setRefundTransaction(null)}
        >
          <div
            ref={refundDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-dialog-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <QrCode className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">Xác nhận hoàn tiền</p>
                  <h2 id="refund-dialog-title" className="mt-0.5 text-lg font-black text-slate-900">Hoàn qua VietQR</h2>
                </div>
              </div>
              <button
                ref={refundCloseRef}
                type="button"
                aria-label="Đóng xác nhận hoàn tiền"
                onClick={() => setRefundTransaction(null)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-500">Khách hàng</span>
                <strong className="text-right text-slate-900">{refundTransaction.customerName}</strong>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-500">Số tiền hoàn</span>
                <strong className="text-lg font-black text-amber-800">{formatCurrency(refundTransaction.amount)}</strong>
              </div>
              <div className="mt-3 flex items-start justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-500">Tham chiếu hiện có</span>
                <strong className="break-all text-right text-slate-800">{refundTransaction.bankRef || 'Chưa có'}</strong>
              </div>
            </div>

            <label className="mt-4 block text-xs font-bold text-slate-700">
              Mã tham chiếu giao dịch hoàn tiền
              <input
                value={refundReference}
                onChange={(event) => setRefundReference(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Nhập mã giao dịch ngân hàng"
              />
            </label>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs leading-5 text-emerald-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              Kiểm tra thông tin chuyển khoản trước khi xác nhận để cập nhật trạng thái hoàn tiền.
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setRefundTransaction(null)}
                className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRefund}
                disabled={!refundReference.trim()}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Xác nhận hoàn tiền
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: 'emerald' | 'slate' | 'amber';
}) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-800',
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-800',
  };

  return (
    <article className="w-[min(70vw,240px)] shrink-0 snap-start rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4 @6xl:w-auto @6xl:flex-1 @6xl:basis-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-600">{label}</p>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${tones[tone]} [&>svg]:h-4 [&>svg]:w-4`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 break-words text-[clamp(1rem,3.4vw,1.4rem)] font-black leading-tight tracking-tight text-slate-950 tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-500">{detail}</p>
    </article>
  );
}

function TransactionRow({
  transaction,
  onView,
  onRefund,
}: {
  transaction: Transaction;
  onView: () => void;
  onRefund: () => void;
}) {
  const { sport, court } = getCourtInfo(transaction.courtInfo);
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="border border-slate-200 px-1.5 py-2 align-top @4xl:hidden">
        <button type="button" onClick={onView} className="block max-w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <span className="block break-all text-[12px] font-extrabold leading-4 text-slate-800">{transaction.code}</span>
          <span className="mt-1 block break-words text-[10px] leading-4 text-slate-500">{transaction.date}</span>
        </button>
        <span className="mt-1 inline-flex max-w-full break-words rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold leading-4 text-slate-600">
          {transactionTypeText[transaction.type]}
        </span>
      </td>
      <td className="border border-slate-200 px-1.5 py-2 align-top @4xl:hidden">
        <span className="block break-words text-[11px] font-bold leading-4 text-slate-800">{transaction.customerName}</span>
        <span className="mt-1 block break-all text-[10px] leading-4 text-slate-500">{transaction.customerPhone}</span>
      </td>
      <td className="border border-slate-200 px-1.5 py-2 align-top @4xl:hidden">
        <span className="block break-words text-[11px] font-bold leading-4 text-slate-800">{sport}</span>
        <span className="mt-1 block break-words text-[10px] leading-4 text-slate-500">{court}</span>
      </td>
      <td className="border border-slate-200 px-1.5 py-2 align-top @4xl:hidden">
        <span className="block break-words text-[11px] font-black leading-4 tabular-nums text-slate-900">{formatCurrency(transaction.amount)}</span>
        <div className="mt-1"><StatusPill status={transaction.status} compact /></div>
        <div className="mt-1 flex items-center gap-1">
          {transaction.type === 'refund' && transaction.status === 'pending_refund' && (
            <button
              type="button"
              onClick={onRefund}
              aria-label={`Xử lý hoàn tiền ${transaction.code}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
      <td className="border border-slate-200 px-1 py-2 text-center align-top @4xl:hidden">
        <button
          type="button"
          onClick={onView}
          aria-label={`Xem chi tiết ${transaction.code}`}
          className="inline-flex min-h-8 items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-bold text-emerald-800 transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <Eye className="h-4 w-4 shrink-0" />
          <span>Xem</span>
        </button>
      </td>
      <td className="hidden border border-slate-200 px-3 py-4 align-top @4xl:table-cell">
        <button type="button" onClick={onView} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <span className="block text-sm font-extrabold text-slate-800">{transaction.code}</span>
          <span className="mt-1 block text-xs text-slate-500">{transaction.date}</span>
        </button>
        <span className="mt-1.5 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
          {transactionTypeText[transaction.type]}
        </span>
      </td>
      <td className="hidden border border-slate-200 px-3 py-4 align-top @4xl:table-cell">
        <span className="block text-sm font-bold text-slate-800">{transaction.customerName}</span>
        <span className="mt-1 block text-xs text-slate-500">{transaction.customerPhone}</span>
      </td>
      <td className="hidden border border-slate-200 px-3 py-4 align-top @4xl:table-cell">
        <span className="block text-sm font-bold text-slate-800">{sport}</span>
        <span className="mt-1 block text-xs text-slate-500">{court}</span>
      </td>
      <td className="hidden border border-slate-200 px-3 py-4 text-right align-top text-sm font-black tabular-nums text-slate-900 @4xl:table-cell">
        {formatCurrency(transaction.amount)}
      </td>
      <td className="hidden border border-slate-200 px-3 py-4 align-top @4xl:table-cell"><StatusPill status={transaction.status} /></td>
      <td className="hidden border border-slate-200 px-3 py-4 align-top @4xl:table-cell">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onView}
            aria-label={`Xem chi tiết ${transaction.code}`}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Eye className="h-4 w-4" />
          </button>
          {transaction.type === 'refund' && transaction.status === 'pending_refund' && (
            <button
              type="button"
              onClick={onRefund}
              className="min-h-9 rounded-lg bg-emerald-800 px-3 text-xs font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              Hoàn tiền
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function DetailRow({
  icon,
  label,
  value,
  wide = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={`flex min-w-0 items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200/70 [&>svg]:h-3.5 [&>svg]:w-3.5">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-slate-500">{label}</p>
        <p className="mt-0.5 break-words text-[11px] font-bold leading-4 text-slate-800">{value}</p>
      </div>
    </div>
  );
}
