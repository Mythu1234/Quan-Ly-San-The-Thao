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
  Search,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react';
import type { Transaction } from '../../types/admin';

interface WalletRevenueViewProps {
  transactions: Transaction[];
  onProcessRefund: (txId: string, bankRef: string) => void;
}

type StatusFilter = 'all' | Transaction['status'];
type ReportPeriod = 'day' | 'week' | 'month';

const fallbackTransactions: Transaction[] = [
  {
    id: 'fallback-1',
    code: 'REF-88429',
    customerName: 'Trần Anh Quân',
    customerPhone: '0912 345 678',
    amount: 360000,
    type: 'refund',
    status: 'pending_refund',
    statusLabel: 'Chờ hoàn tiền',
    date: '01/10/2026 14:20',
    courtInfo: 'Cầu lông · Sân số 05 (VIP)',
    timeSlot: '01/10/2026 · 17:30 - 19:00',
    bankRef: 'MB-0912345678',
    ticketCode: '#BK-88429',
    refundReason: 'Khách hủy trước 26h, đủ điều kiện hoàn 100%.',
  },
  {
    id: 'fallback-2',
    code: 'TXN-8829104',
    customerName: 'Trần Minh Quân',
    customerPhone: '0946 682 888',
    amount: 360000,
    type: 'booking',
    status: 'success',
    statusLabel: 'Đã khớp',
    date: '01/10/2026 13:15',
    courtInfo: 'Cầu lông · Sân số 03 (Trong nhà)',
    timeSlot: '01/10/2026 · 19:00 - 20:30',
    bankRef: 'FT24298177263011',
    ticketCode: '#BK-9201',
  },
  {
    id: 'fallback-3',
    code: 'TXN-8829103',
    customerName: 'Lê Hoàng Nam',
    customerPhone: '0912 345 678',
    amount: 420000,
    type: 'booking',
    status: 'success',
    statusLabel: 'Đã khớp',
    date: '01/10/2026 12:58',
    courtInfo: 'Pickleball · Sân số 01 (Ngoài trời)',
    timeSlot: '01/10/2026 · 20:00 - 21:30',
    bankRef: 'FT2429816550293',
    ticketCode: '#BK-9200',
  },
  {
    id: 'fallback-4',
    code: 'TXN-8829098',
    customerName: 'Cty TNHH VinaSoftware',
    customerPhone: '0903 771 992',
    amount: 1050000,
    type: 'booking',
    status: 'success',
    statusLabel: 'Đã khớp',
    date: '01/10/2026 11:30',
    courtInfo: 'Bóng chuyền · Sân đa năng 4-in-1',
    timeSlot: '01/10/2026 · 18:00 - 20:00',
    bankRef: 'FT2429818820301',
    ticketCode: '#BK-9195',
  },
  {
    id: 'fallback-5',
    code: 'TXN-8829085',
    customerName: 'Phạm Phương Thảo',
    customerPhone: '0977 123 456',
    amount: 270000,
    type: 'booking',
    status: 'success',
    statusLabel: 'Đã khớp',
    date: '01/10/2026 10:14',
    courtInfo: 'Cầu lông · Sân số 06 (Tiêu chuẩn)',
    timeSlot: '01/10/2026 · 16:00 - 17:30',
    bankRef: 'FT2429811292038',
    ticketCode: '#BK-9182',
  },
];

const formatCurrency = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;

const parseCourtInfo = (courtInfo: string) => {
  const parts = courtInfo.split(/\s*·\s*|\s+[-–—]\s+/).map((part) => part.trim()).filter(Boolean);
  return {
    sport: parts[0] || 'Khác',
    court: parts.slice(1).join(' · '),
  };
};

const getSport = (courtInfo: string) => parseCourtInfo(courtInfo).sport;

const getCourt = (courtInfo: string) => parseCourtInfo(courtInfo).court || 'Chưa cập nhật sân';

const parseTransactionDate = (date: string) => {
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
};

const statusText: Record<Transaction['status'], string> = {
  success: 'Đã khớp',
  pending_refund: 'Chờ hoàn tiền',
  refunded: 'Đã hoàn tiền',
};

function StatusPill({ status }: { status: Transaction['status'] }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-700',
    pending_refund: 'bg-amber-50 text-amber-700',
    refunded: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-extrabold ${styles[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'pending_refund' ? 'bg-amber-500' : status === 'success' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {statusText[status]}
    </span>
  );
}

export default function WalletRevenueView({ transactions, onProcessRefund }: WalletRevenueViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sportFilter, setSportFilter] = useState('all');
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('day');
  const [selectedDate, setSelectedDate] = useState('2026-10-01');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundTransaction, setRefundTransaction] = useState<Transaction | null>(null);
  const [refundReference, setRefundReference] = useState('MB-0912345678');
  const [localStatuses, setLocalStatuses] = useState<Record<string, Transaction['status']>>({});
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const refundCloseRef = useRef<HTMLButtonElement>(null);

  const sourceTransactions = transactions.length > 0 ? transactions : fallbackTransactions;
  const visibleTransactions = useMemo(
    () => sourceTransactions.map((transaction) => ({ ...transaction, status: localStatuses[transaction.id] ?? transaction.status })),
    [localStatuses, sourceTransactions],
  );

  const periodTransactions = useMemo(() => {
    const anchorDate = new Date(`${selectedDate}T00:00:00`);
    const startDate = new Date(anchorDate);
    const endDate = new Date(anchorDate);

    if (reportPeriod === 'week') {
      const dayOffset = anchorDate.getDay() === 0 ? -6 : 1 - anchorDate.getDay();
      startDate.setDate(anchorDate.getDate() + dayOffset);
      endDate.setDate(startDate.getDate() + 6);
    } else if (reportPeriod === 'month') {
      startDate.setDate(1);
      endDate.setMonth(anchorDate.getMonth() + 1, 0);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return visibleTransactions.filter((transaction) => {
      const transactionDate = parseTransactionDate(transaction.date);
      return !transactionDate || (transactionDate >= startDate && transactionDate <= endDate);
    });
  }, [reportPeriod, selectedDate, visibleTransactions]);

  const sports = useMemo(() => [...new Set(periodTransactions.map((transaction) => getSport(transaction.courtInfo)))], [periodTransactions]);

  const filteredTransactions = useMemo(() => {
    return periodTransactions.filter((transaction) => {
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      const matchesSport = sportFilter === 'all' || getSport(transaction.courtInfo) === sportFilter;
      return matchesStatus && matchesSport;
    });
  }, [periodTransactions, sportFilter, statusFilter]);

  const pendingRefunds = periodTransactions.filter((transaction) => transaction.status === 'pending_refund');
  const totalRevenue = periodTransactions.filter((transaction) => transaction.type === 'booking' && transaction.status !== 'refunded').reduce((sum, transaction) => sum + transaction.amount, 0);
  const completedBookings = periodTransactions.filter((transaction) => transaction.type === 'booking' && transaction.status === 'success').length;
  const pendingRefundTotal = pendingRefunds.reduce((sum, transaction) => sum + transaction.amount, 0);

  const periodLabel = reportPeriod === 'day' ? 'Hôm nay' : reportPeriod === 'week' ? 'Tuần này' : 'Tháng này';
  const formattedSelectedDate = new Intl.DateTimeFormat('vi-VN').format(new Date(`${selectedDate}T00:00:00`));

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedTransaction(null);
        setRefundTransaction(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (refundTransaction) {
      refundCloseRef.current?.focus();
    } else if (selectedTransaction) {
      drawerCloseRef.current?.focus();
    }
  }, [refundTransaction, selectedTransaction]);

  const handleConfirmRefund = () => {
    if (!refundTransaction || !refundReference.trim()) return;
    onProcessRefund(refundTransaction.id, refundReference.trim());
    setLocalStatuses((current) => ({ ...current, [refundTransaction.id]: 'refunded' }));
    setRefundTransaction(null);
    setSelectedTransaction(null);
  };

  const handleExport = () => {
    window.alert(`Đã chuẩn bị báo cáo ${filteredTransactions.length} giao dịch trong kỳ ${periodLabel}, ngày ${formattedSelectedDate}.`);
  };

  return (
    <div className="relative min-w-0 flex-1 space-y-4 overflow-x-hidden p-3 pb-28 animate-in fade-in duration-200 sm:p-4 md:p-5">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 max-w-full truncate whitespace-nowrap text-lg font-black leading-tight tracking-tight text-slate-900 sm:text-xl md:text-2xl">Doanh thu & Đối soát</h1>
            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Đang đồng bộ</span>
          </div>
          <p className="mt-1 max-w-prose text-xs font-medium leading-relaxed text-slate-500">Theo dõi dòng tiền, đối soát giao dịch và xử lý hoàn tiền Napas247 / VietQR.</p>
        </div>
        <div className="flex w-full min-w-0 flex-nowrap items-center gap-1 sm:justify-start sm:gap-2">
          <div className="flex min-w-0 flex-[1_1_170px] rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs lg:flex-none lg:p-1">
            {([['day', 'Hôm nay'], ['week', 'Tuần này'], ['month', 'Tháng này']] as [ReportPeriod, string][]).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setReportPeriod(value)} className={`min-w-0 flex-1 whitespace-nowrap rounded-md px-0.5 py-1.5 text-[7px] font-bold transition lg:px-2.5 lg:text-[10px] ${reportPeriod === value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>{label}</button>
            ))}
          </div>
          <label className="flex min-w-0 flex-[0_1_100px] cursor-pointer items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-2 text-[7px] font-bold text-slate-600 shadow-2xs hover:border-emerald-300 hover:text-emerald-700 lg:flex-none lg:gap-1.5 lg:px-3 lg:text-[10px]" title="Chọn ngày báo cáo"><CalendarDays className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" /><span className="min-w-0 truncate whitespace-nowrap">{formattedSelectedDate}</span><input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="sr-only" aria-label="Chọn ngày báo cáo" /></label>
          <button type="button" onClick={handleExport} className="flex min-w-0 flex-[0_1_118px] items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-2 text-[7px] font-bold text-slate-600 shadow-2xs hover:border-emerald-300 hover:text-emerald-700 lg:flex-none lg:gap-1.5 lg:px-3 lg:text-[10px]">
            <Download className="h-3 w-3 shrink-0 lg:h-3.5 lg:w-3.5" /> <span className="min-w-0 truncate whitespace-nowrap">Xuất Excel</span>
          </button>
        </div>
      </div>

      <section className="no-scrollbar flex snap-x snap-mandatory items-stretch gap-2.5 overflow-x-auto pb-1">
        <div className="flex min-h-[138px] min-w-[260px] flex-[1_0_260px] snap-start flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5"><span className="min-w-0 break-words text-[12px] font-semibold leading-[1.35] text-slate-600">Tổng doanh thu</span><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><WalletCards className="h-3.5 w-3.5" /></span></div>
          <div className="mt-2.5 flex min-w-0 flex-wrap items-baseline gap-1"><strong className="min-w-0 break-words text-[20px] font-black leading-none tracking-[-0.035em] text-slate-900 tabular-nums">{formatCurrency(totalRevenue).replace(' đ', '')}</strong><span className="shrink-0 text-[10px] font-semibold text-slate-400">đ</span></div>
          <div className="mt-auto flex min-w-0 flex-wrap items-center gap-1.5 pt-2.5 text-[10px] font-medium leading-relaxed"><span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold leading-relaxed text-emerald-700">↗ +18%</span><span className="min-w-0 break-words text-slate-500">so với ngày hôm qua</span></div>
        </div>
        <div className="flex min-h-[138px] min-w-[260px] flex-[1_0_260px] snap-start flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5"><span className="min-w-0 break-words text-[12px] font-semibold leading-[1.35] text-slate-600">Lượt booking hoàn tất</span><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><CheckCircle2 className="h-3.5 w-3.5" /></span></div>
          <div className="mt-2.5 flex min-w-0 items-baseline gap-1.5"><strong className="text-[20px] font-black leading-none tracking-tight text-slate-900 tabular-nums">{completedBookings}</strong><span className="shrink-0 text-[10px] font-semibold text-slate-400">lượt</span></div>
          <div className="mt-auto flex min-w-0 items-start gap-1.5 pt-2.5 text-[10px] font-medium leading-relaxed text-slate-500"><span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" /><span className="min-w-0 break-words">100% tự động qua VietQR Napas</span></div>
        </div>
        <div className="flex min-h-[138px] min-w-[260px] flex-[1_0_260px] snap-start flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2.5"><span className="min-w-0 break-words text-[12px] font-semibold leading-[1.35] text-slate-600">Tỷ lệ lấp đầy sân (04:00 - 23:00)</span><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><ShieldCheck className="h-3.5 w-3.5" /></span></div>
          <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-1.5"><strong className="text-[20px] font-black leading-none tracking-tight text-slate-900 tabular-nums">84%</strong><span className="shrink-0 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold leading-relaxed text-emerald-700">Giờ vàng</span></div>
          <div className="mt-auto flex min-w-0 flex-wrap items-end justify-between gap-x-2.5 gap-y-1 pt-2.5 text-[10px] font-medium leading-relaxed text-slate-500"><span className="min-w-0 break-words">Cao điểm 17:30 - 21:00</span><span className="shrink-0 font-bold text-slate-700 tabular-nums">10/12 sân</span></div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex h-[120px] min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-2xs sm:p-3.5">
          <div className="flex min-w-0 items-center justify-between gap-2"><p className="min-w-0 truncate text-[12px] font-black leading-snug text-slate-700">Tỷ trọng doanh thu bộ môn <span className="font-medium text-slate-400">· {periodLabel}</span></p><span className="shrink-0 text-[10px] font-semibold text-slate-400"><span className="text-emerald-500">●</span> Napas tự động khớp</span></div>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-slate-100"><span className="w-[58%] bg-emerald-600" /><span className="w-[27%] bg-teal-400" /><span className="w-[15%] bg-slate-400" /></div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5 text-[11px] font-semibold leading-snug text-slate-500 sm:gap-2"><div className="min-w-0"><p className="truncate"><span className="mr-1 text-emerald-600">●</span>Cầu lông (58%)</p><strong className="mt-0.5 block truncate font-extrabold text-slate-700">4.901.000 đ</strong></div><div className="min-w-0"><p className="truncate"><span className="mr-1 text-teal-500">●</span>Pickleball (27%)</p><strong className="mt-0.5 block truncate font-extrabold text-slate-700">2.281.500 đ</strong></div><div className="min-w-0"><p className="truncate"><span className="mr-1 text-slate-400">●</span>Bóng chuyền (15%)</p><strong className="mt-0.5 block truncate font-extrabold text-slate-700">1.267.500 đ</strong></div></div>
        </div>
        <div className="flex min-w-0 flex-col rounded-xl border border-amber-200 bg-amber-50/60 p-3 sm:p-3.5">
          <div className="flex min-w-0 items-start gap-2.5 sm:gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><RotateCcw className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1"><p className="min-w-0 text-[11px] font-black uppercase leading-snug tracking-wide text-amber-800">Yêu cầu hoàn tiền cần xử lý</p><span className="shrink-0 text-[12px] font-black text-amber-700">{formatCurrency(pendingRefundTotal)}</span></div><p className="mt-1 break-words text-[11px] leading-relaxed text-amber-800/80">{pendingRefunds[0]?.refundReason || 'Không có yêu cầu hoàn tiền cần xử lý trong kỳ này.'}</p></div></div>
          <div className="mt-3 flex flex-col items-stretch gap-2 border-t border-amber-200/80 pt-2 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><span className="min-w-0 break-words text-[10px] font-semibold leading-relaxed text-amber-700">MB Bank: {pendingRefunds[0]?.bankRef || '0912345678'}</span><button type="button" onClick={() => pendingRefunds[0] && setRefundTransaction(pendingRefunds[0])} className="flex h-11 min-h-0 w-full min-w-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-center text-[11px] font-extrabold leading-snug text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[116px]" disabled={!pendingRefunds[0]}><QrCode className="h-3.5 w-3.5 shrink-0" /> <span>Quét QR Hoàn tiền nhanh</span></button></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex shrink-0 rounded-lg bg-slate-50 p-1">
              {([['all', 'Tất cả'], ['pending_refund', 'Chờ hoàn'], ['success', 'Đã khớp'], ['refunded', 'Đã hoàn']] as [StatusFilter, string][]).map(([value, label]) => <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap ${statusFilter === value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{label}{value === 'all' ? ` (${periodTransactions.length})` : ''}</button>)}
            </div>
            <label className="relative flex shrink-0 items-center"><select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-7 text-[11px] font-bold text-slate-600 outline-none focus:border-emerald-500"><option value="all">Tất cả bộ môn</option>{sports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-slate-400" /></label>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead><tr className="whitespace-nowrap border-b border-slate-100 bg-slate-50/70 text-[10px] font-black uppercase tracking-wide text-slate-500"><th className="px-3 py-3">Mã GD / Giờ</th><th className="px-3 py-3">Khách hàng & SĐT</th><th className="px-3 py-3">Bộ môn & Sân</th><th className="px-3 py-3 text-right">Số tiền</th><th className="px-3 py-3">Phương thức</th><th className="px-3 py-3">Trạng thái đối soát</th><th className="px-3 py-3 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((transaction) => <tr key={transaction.id} className="group transition hover:bg-slate-50/70">
                <td className="px-3 py-3 align-top"><button type="button" onClick={() => setSelectedTransaction(transaction)} className="text-left"><span className="block text-[11px] font-black text-slate-700">{transaction.code}</span><span className="mt-1 block text-[10px] font-medium text-slate-400">{transaction.date.split(' ').slice(1).join(' ') || transaction.date}</span></button></td>
                <td className="px-3 py-3 align-top"><span className="block text-[11px] font-bold text-slate-700">{transaction.customerName}</span><span className="mt-1 block text-[10px] font-medium text-slate-400">{transaction.customerPhone}</span></td>
                <td className="px-3 py-3 align-top"><span className="flex items-center gap-1 text-[11px] font-bold text-slate-700"><span className={`h-1.5 w-1.5 rounded-full ${getSport(transaction.courtInfo).toLowerCase().includes('cầu') ? 'bg-emerald-500' : getSport(transaction.courtInfo).toLowerCase().includes('pickle') ? 'bg-teal-500' : 'bg-slate-400'}`} />{getSport(transaction.courtInfo)}</span><span className="mt-1 block max-w-[150px] text-[10px] font-medium text-slate-400">{getCourt(transaction.courtInfo)}</span></td>
                <td className="px-3 py-3 text-right align-top text-[11px] font-black text-slate-700">{formatCurrency(transaction.amount)}</td>
                <td className="px-3 py-3 align-top"><span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700"><QrCode className="h-3 w-3" /> VietQR</span></td>
                <td className="px-3 py-3 align-top"><StatusPill status={transaction.status} /></td>
                <td className="px-3 py-3 align-top"><div className="flex items-center justify-end gap-1.5"><button type="button" title="Xem chi tiết" onClick={() => setSelectedTransaction(transaction)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Eye className="h-3.5 w-3.5" /></button>{transaction.status === 'pending_refund' && <button type="button" onClick={() => setRefundTransaction(transaction)} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-[10px] font-extrabold text-white hover:bg-emerald-700">Hoàn tiền ngay</button>}{transaction.status !== 'pending_refund' && <button type="button" title="In phiếu" onClick={() => window.print()} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Printer className="h-3.5 w-3.5" /></button>}</div></td>
              </tr>)}
            </tbody>
          </table>
          {filteredTransactions.length === 0 && <div className="p-10 text-center"><Search className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 text-xs font-bold text-slate-600">Không tìm thấy giao dịch</p><p className="mt-1 text-[11px] text-slate-400">Thử thay đổi từ khóa hoặc bộ lọc.</p></div>}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2.5 text-[11px] font-semibold text-slate-400"><span>Hiển thị {filteredTransactions.length} / {visibleTransactions.length} giao dịch</span><span className="text-right">Đồng bộ lần cuối: vừa xong</span></div>
      </section>

      {selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200"
          onMouseDown={(event) => event.target === event.currentTarget && setSelectedTransaction(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <header className="flex flex-none items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ReceiptText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Chi tiết giao dịch</p>
                  <h2 id="transaction-dialog-title" className="mt-0.5 truncate text-lg font-black leading-tight text-slate-900">{selectedTransaction.code}</h2>
                </div>
              </div>
              <button ref={drawerCloseRef} type="button" aria-label="Đóng chi tiết giao dịch" onClick={() => setSelectedTransaction(null)} className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="no-scrollbar mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto">
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-slate-800">{selectedTransaction.customerName}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">{selectedTransaction.customerPhone}</p>
                  </div>
                  <StatusPill status={selectedTransaction.status} />
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-3 border-t border-slate-200/70 pt-2.5">
                  <p className="pb-0.5 text-[10px] font-bold text-slate-400">Tổng tiền giao dịch</p>
                  <p className="shrink-0 text-2xl font-black leading-none tracking-tight text-slate-900 tabular-nums">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
              </section>

              <section aria-label="Thông tin giao dịch" className="grid grid-cols-2 gap-2">
                <DetailRow icon={<ReceiptText />} label="Mã vé / booking" value={selectedTransaction.ticketCode} />
                <DetailRow icon={<CalendarDays />} label="Thời gian tạo" value={selectedTransaction.date} />
                <DetailRow wide icon={<Building2 />} label="Bộ môn & sân" value={selectedTransaction.courtInfo} />
                <DetailRow wide icon={<Clock3 />} label="Khung giờ" value={selectedTransaction.timeSlot} />
                <DetailRow wide icon={<Banknote />} label="Mã tham chiếu ngân hàng" value={selectedTransaction.bankRef} />
              </section>

              {selectedTransaction.refundReason && (
                <aside className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-2.5 text-[10px] leading-relaxed text-amber-800">
                  <div className="flex items-center gap-1.5 font-black"><Info className="h-3.5 w-3.5 shrink-0" /> Lý do hoàn tiền</div>
                  <p className="mt-1 font-medium">{selectedTransaction.refundReason}</p>
                </aside>
              )}
            </div>

            <div className="mt-4 flex flex-none gap-2">
              <button type="button" onClick={() => window.print()} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 text-[11px] font-extrabold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
                <Printer className="h-3.5 w-3.5" /> In phiếu
              </button>
              {selectedTransaction.status === 'pending_refund' && (
                <button type="button" onClick={() => setRefundTransaction(selectedTransaction)} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2">
                  <RotateCcw className="h-3.5 w-3.5" /> Xử lý hoàn
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {refundTransaction && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && setRefundTransaction(null)}><div role="dialog" aria-modal="true" aria-labelledby="refund-dialog-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><QrCode className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Xác nhận hoàn tiền</p><h2 id="refund-dialog-title" className="mt-0.5 text-lg font-black text-slate-900">Hoàn qua VietQR</h2></div></div></div><button ref={refundCloseRef} type="button" aria-label="Đóng xác nhận hoàn tiền" onClick={() => setRefundTransaction(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-500">Khách hàng</span><strong className="text-slate-800">{refundTransaction.customerName}</strong></div><div className="mt-3 flex items-center justify-between text-xs"><span className="font-semibold text-slate-500">Số tiền hoàn</span><strong className="text-lg font-black text-amber-700">{formatCurrency(refundTransaction.amount)}</strong></div><div className="mt-3 flex items-center justify-between text-xs"><span className="font-semibold text-slate-500">Ngân hàng nhận</span><strong className="text-slate-800">MB Bank · {refundTransaction.bankRef}</strong></div></div><label className="mt-4 block text-[10px] font-extrabold text-slate-600">Mã tham chiếu hoàn tiền<input value={refundReference} onChange={(event) => setRefundReference(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500" placeholder="Nhập mã giao dịch ngân hàng" /></label><div className="mt-4 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-[10px] leading-relaxed text-emerald-800"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Kiểm tra đúng tài khoản nhận trước khi xác nhận. Hệ thống sẽ ghi nhận giao dịch hoàn tiền ngay lập tức.</div><div className="mt-5 flex gap-2"><button type="button" onClick={() => setRefundTransaction(null)} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-50">Hủy</button><button type="button" onClick={handleConfirmRefund} disabled={!refundReference.trim()} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4" /> Xác nhận hoàn tiền</button></div></div></div>}
    </div>
  );
}

function DetailRow({ icon, label, value, wide = false }: { icon: ReactNode; label: string; value: string; wide?: boolean }) {
  return (
    <div className={`flex min-w-0 items-start gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 ${wide ? 'col-span-2' : ''}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-2xs ring-1 ring-slate-200/70 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold leading-tight text-slate-400">{label}</p>
        <p className="mt-0.5 break-words text-[11px] font-extrabold leading-snug text-slate-700">{value}</p>
      </div>
    </div>
  );
}
