import { useState } from 'react';
import { 
  Clock, 
  QrCode, 
  Award, 
  LogOut, 
  CheckCircle2, 
  ArrowLeft, 
  RotateCcw, 
  Receipt, 
  AlertCircle, 
  X, 
  Wallet, 
  DollarSign, 
  CalendarCheck,
  FileText
} from 'lucide-react';

interface VipCustomerDashboardProps {
  onLogout: () => void;
}

interface SessionItem {
  id: string;
  date: string;
  time: string;
  court: string;
  status: string;
  statusLabel: string;
  canReschedule: boolean;
  checkInTime?: string;
  rescheduledTo?: string;
  reason?: string;
}

export default function VipCustomerDashboard({ onLogout }: VipCustomerDashboardProps) {
  // Navigation Tabs: 'schedule' (Lịch đặt của tôi) | 'payments' (Quản lý thanh toán & Sổ tài chính)
  const [activeTab, setActiveTab] = useState<'schedule' | 'payments'>('schedule');

  // Popup & Alert State
  const [popup, setPopup] = useState<{ title: string; message: string; type?: 'alert' | 'confirm'; onConfirm?: () => void } | null>(null);
  const showAlert = (title: string, message: string) => setPopup({ title, message, type: 'alert' });

  // Modal States
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [showPayDueModal, setShowPayDueModal] = useState<boolean>(false);
  const [selectedSessionToReschedule, setSelectedSessionToReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');

  // Payment Simulation State
  const [hasPaidDue, setHasPaidDue] = useState<boolean>(false);

  // VIP Contract Data (Mock Data)
  const vipProfile = {
    customerName: 'CLB Cầu Lông Đam Mê',
    representative: 'Anh Nguyễn Hoàng Nam',
    phone: '0901.234.567',
    tier: 'VIP Vàng (6 Tháng)',
    discountPercent: 10,
    contractCode: 'VIP-CLB-20260901',
    validFrom: '01/09/2026',
    validTo: '28/02/2027',
    remainingMonths: 4.5,
    sport: 'Cầu Lông (2 Sân)',
    court: 'Sân 01 & Sân 02',
    fixedSchedule: 'Thứ 2 - Thứ 4 - Thứ 6 hàng tuần',
    fixedTime: '18:00 – 20:00 (2 giờ/buổi)',
    totalContractSessions: 72,
    completedSessions: 18,
  };

  // Next Session (Reminder)
  const nextSession = {
    date: 'Thứ Sáu, 17/10/2026',
    time: '18:00 – 20:00',
    court: 'Sân 01 & Sân 02',
    countdown: 'Còn ~05 giờ 30 phút nữa',
    isToday: true,
    qrCode: 'COURTX-VIP-SESSION-20261017-0102',
  };

  // Sessions List State
  const [sessionsFilter, setSessionsFilter] = useState<'all' | 'upcoming' | 'completed' | 'rescheduled'>('upcoming');
  const [sessions, setSessions] = useState<SessionItem[]>([
    {
      id: 'SESS-19',
      date: '17/10/2026 (Thứ 6)',
      time: '18:00 - 20:00',
      court: 'Sân 01 & 02',
      status: 'upcoming',
      statusLabel: 'Sắp diễn ra hôm nay',
      canReschedule: true,
    },
    {
      id: 'SESS-20',
      date: '20/10/2026 (Thứ 2)',
      time: '18:00 - 20:00',
      court: 'Sân 01 & 02',
      status: 'upcoming',
      statusLabel: 'Đã lên lịch',
      canReschedule: true,
    },
    {
      id: 'SESS-21',
      date: '22/10/2026 (Thứ 4)',
      time: '18:00 - 20:00',
      court: 'Sân 01 & 02',
      status: 'upcoming',
      statusLabel: 'Đã lên lịch',
      canReschedule: true,
    },
    {
      id: 'SESS-22',
      date: '24/10/2026 (Thứ 6)',
      time: '18:00 - 20:00',
      court: 'Sân 01 & 02',
      status: 'upcoming',
      statusLabel: 'Đã lên lịch',
      canReschedule: true,
    },
    {
      id: 'SESS-18',
      date: '15/10/2026 (Thứ 4)',
      time: '18:00 - 20:00',
      court: 'Sân 01 & 02',
      status: 'completed',
      statusLabel: 'Đã hoàn thành',
      checkInTime: '18:03',
      canReschedule: false,
    },
    {
      id: 'SESS-17',
      date: '13/10/2026 (Thứ 2)',
      time: '18:00 - 20:00',
      court: 'Sân 01 & 02',
      status: 'completed',
      statusLabel: 'Đã hoàn thành',
      checkInTime: '17:58',
      canReschedule: false,
    },
    {
      id: 'SESS-16',
      date: '10/10/2026 (Thứ 6)',
      time: '18:00 - 20:00',
      court: 'Sân 01 & 02',
      status: 'completed',
      statusLabel: 'Đã hoàn thành',
      checkInTime: '18:05',
      canReschedule: false,
    },
    {
      id: 'SESS-15',
      date: '08/10/2026 (Thứ 4)',
      time: '18:00 - 20:00',
      court: 'Sân 01 & 02',
      status: 'rescheduled',
      statusLabel: 'Đã dời sang 25/10',
      rescheduledTo: '25/10/2026 (18:00 - 20:00)',
      reason: 'CLB tham gia giải đấu giao hữu mở rộng',
      canReschedule: false,
    },
  ]);

  // Financial Ledger Data (Mock Data)
  const financialSummary = {
    totalOriginal: 19200000,
    vipDiscountAmount: 1920000,
    totalContractPrice: 17280000,
    totalPaid: hasPaidDue ? 17430000 : 11520000,
    remainingDue: hasPaidDue ? 0 : 5760000,
    incidentalFee: hasPaidDue ? 0 : 150000, // phí nước uống, cầu lông phát sinh
    totalPendingToPay: hasPaidDue ? 0 : (5760000 + 150000),
    nextDueDate: '25/10/2026',
    isOverdue: false,
  };

  // Installment Details
  const [installments, setInstallments] = useState([
    {
      id: 'DOT-1',
      title: 'Đợt 1: Cọc ký hợp đồng (50%)',
      amount: 8640000,
      dueDate: '01/09/2026',
      paidDate: '01/09/2026 09:30',
      paymentMethod: 'VietQR (MB Bank)',
      transactionRef: 'MB-8829104',
      invoiceNumber: 'HĐ-0019284',
      status: 'PAID',
      statusLabel: 'Đã thanh toán đủ',
      note: 'Cọc giữ lịch cố định 6 tháng cho 2 sân',
    },
    {
      id: 'DOT-2',
      title: 'Đợt 2: Thanh toán kỳ Tháng 10',
      amount: 2880000,
      dueDate: '28/09/2026',
      paidDate: '28/09/2026 14:15',
      paymentMethod: 'VietQR (Vietcombank)',
      transactionRef: 'VCB-9921490',
      invoiceNumber: 'HĐ-0021490',
      status: 'PAID',
      statusLabel: 'Đã thanh toán đủ',
      note: 'Thanh toán tiền sân tháng 10/2026',
    },
    {
      id: 'DOT-3',
      title: 'Đợt 3: Thanh toán kỳ Tháng 11 & 12',
      amount: 5760000,
      dueDate: '25/10/2026',
      paidDate: null,
      paymentMethod: 'VietQR',
      transactionRef: null,
      invoiceNumber: null,
      status: hasPaidDue ? 'PAID' : 'PENDING',
      statusLabel: hasPaidDue ? 'Đã thanh toán đủ' : 'Sắp đến hạn (Còn nợ)',
      note: 'Hạn chót đóng tiền trước ngày 25/10/2026',
    },
  ]);

  // Incidental Fees (Phí phát sinh tại quầy)
  const incidentals = [
    {
      id: 'PHU-01',
      date: '10/10/2026 19:45',
      description: '2 thùng nước khoáng Revive + 1 hộp cầu lông Victor Gold',
      amount: 150000,
      status: hasPaidDue ? 'PAID' : 'PENDING',
      statusLabel: hasPaidDue ? 'Đã thanh toán' : 'Chưa thanh toán (Gộp vào Đợt 3)',
    },
  ];

  // Refund History (Lịch sử hoàn tiền)
  const refundHistory = [
    {
      id: 'REF-20261005-01',
      requestDate: '05/10/2026',
      reason: 'Sự cố kỹ thuật đèn chiếu sáng Sân 01 (Buổi tối 05/10)',
      affectedSession: '05/10/2026 (18:00 - 20:00)',
      refundAmount: 216000, // Đơn giá 1 buổi VIP sau giảm 10%
      refundMethod: 'Chuyển khoản hoàn tiền STK Vietcombank *8829',
      completedDate: '06/10/2026 10:20',
      status: 'COMPLETED',
      statusLabel: 'Đã hoàn tiền thành công',
      note: 'Nhà thi đấu bồi hoàn 100% buổi thi đấu do lỗi kỹ thuật sân.',
    },
    {
      id: 'REF-20261014-03',
      requestDate: '14/10/2026',
      reason: 'CLB báo bận lịch công tác, hủy buổi theo đúng quy chế báo trước 48h',
      affectedSession: '19/10/2026 (18:00 - 20:00)',
      refundAmount: 216000,
      refundMethod: 'Khấu trừ vào kỳ hạn đóng tiền tiếp theo (Đợt 3)',
      completedDate: null,
      status: 'PROCESSING',
      statusLabel: 'Đang xử lý đối soát (Dự kiến 24h)',
      note: 'Đã ghi nhận yêu cầu, số tiền sẽ được tự động trừ vào công nợ Đợt 3.',
    },
  ];

  // Handler for Rescheduling a Session
  const handleOpenReschedule = (session: any) => {
    setSelectedSessionToReschedule(session);
    setRescheduleDate('');
    setRescheduleReason('');
    setShowRescheduleModal(true);
  };

  const handleSubmitReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate.trim()) {
      showAlert('Thiếu ngày dời', 'Vui lòng chọn ngày thi đấu mới bạn muốn dời sang!');
      return;
    }

    // Update sessions state
    setSessions((prev) =>
      prev.map((s) =>
        s.id === selectedSessionToReschedule.id
          ? {
              ...s,
              status: 'rescheduled',
              statusLabel: `Đã dời sang ${rescheduleDate}`,
              rescheduledTo: rescheduleDate,
              reason: rescheduleReason || 'CLB xin dời lịch thi đấu',
              canReschedule: false,
            }
          : s
      )
    );

    setShowRescheduleModal(false);
    showAlert(
      'Yêu cầu dời lịch thành công! 📅',
      `Đã chuyển lịch buổi ${selectedSessionToReschedule.date} sang ngày ${rescheduleDate}.\n\nĐặc quyền VIP của bạn cho phép dời lịch miễn phí. Sơ đồ sàn đã được cập nhật!`
    );
  };

  // Handler for Simulating Payment of Due Amount
  const handleSimulatePayment = () => {
    setHasPaidDue(true);
    setInstallments((prev) =>
      prev.map((inst) =>
        inst.id === 'DOT-3'
          ? {
              ...inst,
              status: 'PAID',
              statusLabel: 'Đã thanh toán đủ',
              paidDate: '16/10/2026 14:00',
              transactionRef: 'MB-8921003',
              invoiceNumber: 'HĐ-0023819',
            }
          : inst
      )
    );
    setShowPayDueModal(false);
    showAlert(
      'Thanh toán thành công! 🎉',
      `Bạn đã thanh toán thành công Đợt 3 (${financialSummary.totalPendingToPay.toLocaleString('vi-VN')}đ) qua VietQR.\n\nSổ công nợ của bạn hiện tại: 0đ (Đã hoàn thành 100% nghĩa vụ tài chính kỳ này).`
    );
  };

  // Filtered Sessions
  const filteredSessions = sessions.filter((s) => {
    if (sessionsFilter === 'all') return true;
    return s.status === sessionsFilter;
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 antialiased font-sans">
      {/* 🟢 TOP VIP HEADER */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white px-4 py-3 shadow-md border-b border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onLogout}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-slate-200"
              title="Quay lại Trang chủ"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md">
              <Award className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">{vipProfile.customerName}</span>
                <span className="rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black px-1.5 py-0.2">
                  VIP -{vipProfile.discountPercent}%
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {vipProfile.representative} • {vipProfile.phone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex items-center gap-1 rounded-full bg-slate-800/80 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/50 px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:text-red-300 active:scale-95 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
        </div>

        {/* 2 MAIN TABS */}
        <div className="mt-3 grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>LỊCH ĐẶT CỦA TÔI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>SỔ TÀI CHÍNH</span>
          </button>
        </div>
      </header>

      {/* ⚪ MAIN BODY */}
      <main className="flex-1 p-4 pb-20 space-y-4">

        {/* ======================================================== */}
        {/* TAB 1: LỊCH ĐẶT CỦA TÔI & NHẮC LỊCH TIẾP THEO           */}
        {/* ======================================================== */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* 🔴 HERO REMINDER CARD: BUỔI THI ĐẤU TIẾP THEO */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 p-5 text-white shadow-xl border border-amber-500/40">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-500/20 blur-2xl pointer-events-none"></div>

              {/* Tagline */}
              <div className="flex items-center justify-between relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-400/40 px-2.5 py-0.5 text-[10px] font-black uppercase text-red-300">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                  NHẮC LỊCH BUỔI TIẾP THEO
                </span>
                <span className="text-[10px] text-amber-300 font-bold">{nextSession.countdown}</span>
              </div>

              {/* Next session details */}
              <div className="mt-3 relative z-10">
                <h2 className="text-xl font-black text-white">{nextSession.date}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1 font-bold text-amber-400">
                    <Clock className="w-3.5 h-3.5" /> {nextSession.time}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-emerald-400">{nextSession.court}</span>
                  <span>•</span>
                  <span>{vipProfile.sport}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 relative z-10">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-2.5 px-3 text-xs font-black uppercase text-slate-950 shadow-md active:scale-95 transition cursor-pointer"
                >
                  <QrCode className="w-4 h-4" /> QR Check-in
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenReschedule(sessions[0])}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 px-3 text-xs font-bold text-slate-200 active:scale-95 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" /> Xin dời buổi
                </button>
              </div>
            </div>

            {/* VIP CONTRACT INFO SUMMARY */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">HỢP ĐỒNG VIP CỦA BẠN</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-500">#{vipProfile.contractCode}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Lịch chơi cố định:</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">{vipProfile.fixedSchedule}</span>
                  <span className="text-[10px] text-slate-500">{vipProfile.fixedTime}</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Thời hạn hợp đồng:</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">{vipProfile.validFrom} – {vipProfile.validTo}</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Còn ~{vipProfile.remainingMonths} tháng</span>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200/60 flex items-center justify-between text-xs">
                <span className="text-amber-900 font-medium text-[11px]">Tiến độ thi đấu hợp đồng:</span>
                <span className="font-black text-amber-700">{vipProfile.completedSessions} / {vipProfile.totalContractSessions} buổi</span>
              </div>
            </div>

            {/* SESSIONS HISTORY & UPCOMING */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">DANH SÁCH BUỔI THI ĐẤU</h3>
                <span className="text-[10px] text-slate-500">{filteredSessions.length} buổi</span>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
                {[
                  { key: 'upcoming', label: 'Sắp tới' },
                  { key: 'completed', label: 'Đã hoàn thành' },
                  { key: 'rescheduled', label: 'Đã dời' },
                  { key: 'all', label: 'Tất cả' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setSessionsFilter(f.key as any)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                      sessionsFilter === f.key
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Sessions List */}
              <div className="space-y-2 pt-1">
                {filteredSessions.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 flex items-center justify-between transition hover:border-slate-300"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{s.date}</span>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            s.status === 'upcoming'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'completed'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.statusLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {s.time} • <strong className="text-slate-800">{s.court}</strong>
                      </p>
                      {s.status === 'rescheduled' && (
                        <p className="text-[10px] text-amber-700 mt-1 italic">
                          ↳ Dời sang: {s.rescheduledTo} ({s.reason})
                        </p>
                      )}
                    </div>

                    <div>
                      {s.canReschedule ? (
                        <button
                          type="button"
                          onClick={() => handleOpenReschedule(s)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-[10px] font-bold text-slate-700 hover:border-amber-500 hover:text-amber-700 active:scale-95 transition cursor-pointer"
                        >
                          Dời lịch
                        </button>
                      ) : s.status === 'completed' ? (
                        <span className="text-[10px] text-slate-400 font-bold">Check-in {s.checkInTime}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Đã cập nhật</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: QUẢN LÝ THANH TOÁN (SỔ TÀI CHÍNH CÁ NHÂN)         */}
        {/* ======================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* FINANCIAL OVERVIEW CARD */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950 p-5 text-white shadow-xl border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-400" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">SỔ TAY TÀI CHÍNH VIP</h2>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                  {hasPaidDue ? 'ĐÃ HOÀN TẤT ĐỦ' : 'CÒN KỲ HẠN ĐÓNG'}
                </span>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl bg-white/5 border border-slate-800 p-3">
                  <span className="text-[10px] text-slate-400 block">Tổng Hợp Đồng (Đã -10%):</span>
                  <span className="text-base font-black text-white mt-0.5 block">
                    {financialSummary.totalContractPrice.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-[9px] text-emerald-400">
                    Tiết kiệm được: {financialSummary.vipDiscountAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="rounded-2xl bg-white/5 border border-slate-800 p-3">
                  <span className="text-[10px] text-slate-400 block">Đã thanh toán (Cọc + Đợt):</span>
                  <span className="text-base font-black text-emerald-400 mt-0.5 block">
                    {financialSummary.totalPaid.toLocaleString('vi-VN')}đ
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Tỷ lệ: {Math.round((financialSummary.totalPaid / financialSummary.totalContractPrice) * 100)}%
                  </span>
                </div>
              </div>

              {/* Due Notice & Remaining Debt */}
              {!hasPaidDue ? (
                <div className="rounded-2xl bg-gradient-to-r from-red-500/20 via-amber-500/20 to-amber-600/10 border border-amber-500/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      KỲ HẠN ĐÓNG TIẾP THEO (ĐỢT 3):
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">Hạn: {financialSummary.nextDueDate}</span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xl font-black text-amber-400">
                        {financialSummary.totalPendingToPay.toLocaleString('vi-VN')}đ
                      </span>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        Gồm <strong>{financialSummary.remainingDue.toLocaleString('vi-VN')}đ</strong> tiền sân + <strong>{financialSummary.incidentalFee.toLocaleString('vi-VN')}đ</strong> phụ phí nước
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPayDueModal(true)}
                      className="rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-black uppercase text-slate-950 shadow-md active:scale-95 transition cursor-pointer"
                    >
                      Đóng tiền ngay →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-emerald-500/20 border border-emerald-400/40 p-3.5 flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <span className="font-black block">Không có khoản nợ nào!</span>
                    <span className="text-[10px] text-slate-300">Bạn đã hoàn tất đầy đủ mọi kỳ thanh toán và phụ phí phát sinh.</span>
                  </div>
                </div>
              )}
            </div>

            {/* INSTALLMENT DETAILS TABLE / CARDS */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">TIẾN ĐỘ CÁC KỲ ĐÓNG TIỀN</h3>
                </div>
                <span className="text-[10px] text-slate-500">3 Đợt theo hợp đồng</span>
              </div>

              <div className="space-y-2.5">
                {installments.map((inst) => (
                  <div
                    key={inst.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900">{inst.title}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          inst.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {inst.statusLabel}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black text-slate-900">
                        {inst.amount.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[11px] text-slate-500">Hạn đóng: {inst.dueDate}</span>
                    </div>

                    {inst.status === 'PAID' ? (
                      <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-600 flex flex-wrap justify-between items-center gap-1">
                        <span>Đã nộp: <strong>{inst.paidDate}</strong> ({inst.paymentMethod})</span>
                        {inst.invoiceNumber && (
                          <button
                            type="button"
                            onClick={() => showAlert('Hóa đơn điện tử VAT', `Mã số hóa đơn: ${inst.invoiceNumber}\nĐơn vị: ${vipProfile.customerName}\nĐã xuất điện tử theo đúng quy định hệ thống.`)}
                            className="font-bold text-emerald-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <FileText className="w-3 h-3" /> {inst.invoiceNumber}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                        <span className="text-amber-800 font-medium">{inst.note}</span>
                        <button
                          type="button"
                          onClick={() => setShowPayDueModal(true)}
                          className="px-3 py-1 bg-amber-400 hover:bg-amber-500 font-black text-slate-950 rounded-lg text-[10px] uppercase active:scale-95 transition cursor-pointer"
                        >
                          Thanh toán
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* INCIDENTAL FEES (KHOẢN PHỤ PHÍ PHÁT SINH) */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">PHỤ PHÍ DỊCH VỤ PHÁT SINH</h3>
                </div>
                <span className="text-[10px] text-slate-500">Tại quầy / Đồ uống</span>
              </div>

              <div className="space-y-2">
                {incidentals.map((inc) => (
                  <div key={inc.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-900">{inc.description}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{inc.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 block">{inc.amount.toLocaleString('vi-VN')}đ</span>
                      <span className={`text-[9px] font-bold ${inc.status === 'PAID' ? 'text-emerald-600' : 'text-amber-700'}`}>
                        {inc.statusLabel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* REFUND HISTORY (LỊCH SỬ HOÀN TIỀN) */}
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">LỊCH SỬ HOÀN TIỀN & ĐỐI SOÁT</h3>
                </div>
                <span className="text-[10px] text-slate-500">{refundHistory.length} giao dịch</span>
              </div>

              <p className="text-[11px] text-slate-500">
                Minh bạch lịch sử các khoản hoàn tiền do sự cố kỹ thuật hoặc do khách tự hủy/dời lịch theo đúng quy chế.
              </p>

              <div className="space-y-2.5">
                {refundHistory.map((ref) => (
                  <div
                    key={ref.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-500 font-bold">#{ref.id}</span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          ref.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {ref.statusLabel}
                      </span>
                    </div>

                    <div>
                      <p className="font-bold text-slate-900">{ref.reason}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Buổi thi đấu: {ref.affectedSession}</p>
                    </div>

                    <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Số tiền hoàn:</span>
                        <span className="text-sm font-black text-emerald-600">
                          +{ref.refundAmount.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Phương thức hoàn:</span>
                        <span className="text-[11px] font-bold text-slate-700">{ref.refundMethod}</span>
                      </div>
                    </div>

                    {ref.completedDate && (
                      <p className="text-[10px] text-slate-400 italic">
                        ✓ Đã hoàn tất đối soát và chuyển tiền lúc {ref.completedDate}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* 📱 MODAL: QR CODE CHECK-IN TẠI CỬA                       */}
      {/* ======================================================== */}
      {showQrModal && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black uppercase text-slate-900">MÃ CHECK-IN KHÁCH VIP</span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-sm">{vipProfile.customerName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{nextSession.date} • {nextSession.time}</p>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">{nextSession.court}</p>
            </div>

            {/* Mock QR Code Graphic */}
            <div className="mx-auto h-48 w-48 bg-slate-50 rounded-2xl p-3 border-2 border-dashed border-amber-400 flex flex-col items-center justify-center relative shadow-inner">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full p-2 bg-white rounded-xl shadow-xs">
                {Array.from({ length: 25 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`rounded ${
                      idx % 2 === 0 || idx % 5 === 0 ? 'bg-slate-950' : 'bg-amber-500'
                    }`}
                  ></div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="bg-white text-slate-950 px-2 py-0.5 text-[10px] font-black rounded-full border border-amber-400 shadow-md">
                  VIP PASS
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Đưa mã QR này trước camera quét tại quầy lễ tân hoặc máy soát vé để check-in mở cửa vào sân.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                showAlert('Check-in thành công! ✓', 'Hệ thống đã ghi nhận check-in của CLB Cầu Lông Đam Mê tại Sân 01 & 02. Chúc bạn có buổi thi đấu tuyệt vời!');
              }}
              className="w-full rounded-xl bg-slate-900 text-white py-3 text-xs font-black uppercase tracking-wider hover:bg-slate-800 active:scale-95 transition"
            >
              Mô phỏng Check-in thành công
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 📅 MODAL: XIN DỜI / ĐỔI BUỔI THI ĐẤU                      */}
      {/* ======================================================== */}
      {showRescheduleModal && selectedSessionToReschedule && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-black uppercase text-slate-900">XIN DỜI BUỔI THI ĐẤU</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRescheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs border border-slate-200 space-y-1">
              <span className="text-slate-400 text-[10px] block">Buổi muốn dời:</span>
              <p className="font-black text-slate-900">{selectedSessionToReschedule.date}</p>
              <p className="text-slate-600">{selectedSessionToReschedule.time} • {selectedSessionToReschedule.court}</p>
            </div>

            <form onSubmit={handleSubmitReschedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Ngày & Giờ muốn dời sang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thứ Bảy ngày 25/10 (18:00 - 20:00)"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                  Lý do dời lịch
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: CLB bận lịch thi đấu giải công ty..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="rounded-xl bg-amber-50 p-2.5 text-[10px] text-amber-800 border border-amber-200 leading-relaxed">
                ✨ <strong>Đặc quyền Khách VIP:</strong> Bạn được bảo lưu và đổi buổi thi đấu miễn phí không giới hạn (với điều kiện báo trước ít nhất 12 giờ).
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-400 hover:bg-amber-500 py-2.5 text-xs font-black text-slate-950 uppercase"
                >
                  Xác nhận dời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 💳 MODAL: THANH TOÁN KỲ ĐẾN HẠN QUA VIETQR               */}
      {/* ======================================================== */}
      {showPayDueModal && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-left">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase text-slate-900">THANH TOÁN KỲ HẠN ĐỢT 3</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPayDueModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Payment Summary */}
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-4 text-left space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-extrabold text-slate-900">MB BANK (QUÂN ĐỘI)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-extrabold text-slate-900">NHÀ THI ĐẤU COURTX ARENA</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">8829 0192 8888</span>
              </div>
              <div className="flex justify-between items-center border-t border-emerald-200 pt-1.5">
                <span className="text-slate-600 font-bold">Số tiền thanh toán:</span>
                <span className="text-lg font-black text-emerald-600">
                  {financialSummary.totalPendingToPay.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nội dung chuyển khoản:</span>
                <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  VIP CLB 20260901 DOT3
                </span>
              </div>
            </div>

            {/* QR Mock */}
            <div className="mx-auto h-36 w-36 bg-white rounded-xl p-2 border border-slate-200 shadow-sm relative flex items-center justify-center">
              <div className="grid grid-cols-4 gap-1.5 w-full h-full p-2 bg-slate-100 rounded">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <div key={idx} className={'rounded ' + (idx % 3 === 0 ? 'bg-emerald-500' : 'bg-slate-800')}></div>
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white text-emerald-600 px-2 py-0.5 font-black text-[10px] rounded-full shadow-md uppercase border border-emerald-100">
                  VIETQR
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500">
              Mở ứng dụng ngân hàng bất kỳ để quét mã VietQR tự động khớp tiền và nội dung.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowPayDueModal(false)}
                className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
              >
                Để sau
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white active:scale-95 transition"
              >
                Mô phỏng đã chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🟣 GENERIC POPUP */}
      {popup && (
        <div className="fixed top-0 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-3">
            <h3 className="text-base font-black text-slate-900">{popup.title}</h3>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{popup.message}</p>
            <button
              type="button"
              onClick={() => setPopup(null)}
              className="mt-3 w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-xs font-black uppercase text-white shadow-sm active:scale-95 transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
