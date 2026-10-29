import { useState, useEffect, useMemo } from 'react';
import { 
  PhoneCall, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  X,
  DollarSign,
  QrCode,
} from 'lucide-react';
import type { 
  BookingRequest
} from '../../types/bookingRequest';
import {
  getStoredBookingRequests, 
  saveBookingRequests 
} from '../../types/bookingRequest';
import PaymentCheckout, { type PaymentResult } from '../PaymentCheckout';
import QrCodeArtwork from '../QrCodeArtwork';

const getTodayInputDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

export default function AdminBookingRequestsView() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_consultation' | 'confirmed' | 'cancelled'>('all');

  // Load from localStorage on mount & listen to changes
  useEffect(() => {
    setRequests(getStoredBookingRequests());
  }, []);

  const updateRequestsList = (updated: BookingRequest[]) => {
    setRequests(updated);
    saveBookingRequests(updated);
  };

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedReq, setSelectedReq] = useState<BookingRequest | null>(null);
  const [checkoutReq, setCheckoutReq] = useState<BookingRequest | null>(null);
  const [counterCheckoutReq, setCounterCheckoutReq] = useState<BookingRequest | null>(null);

  // Detail Modal State (Mobile-first)
  const [detailReq, setDetailReq] = useState<BookingRequest | null>(null);
  const currentDetailReq = useMemo(() => {
    if (!detailReq) return null;
    return requests.find(r => r.id === detailReq.id) || detailReq;
  }, [detailReq, requests]);

  // Contact Log Modal State
  const [contactNoteInput, setContactNoteInput] = useState<string>('');
  const [newStatusInput, setNewStatusInput] = useState<BookingRequest['status']>('in_consultation');

  // Payment Modal State
  const [payAmountInput, setPayAmountInput] = useState<number>(0);

  // New Request Form State
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newSource, setNewSource] = useState<BookingRequest['source']>('direct_counter');
  const [newSport, setNewSport] = useState<BookingRequest['sport']>('badminton');
  const [newCourtDetails, setNewCourtDetails] = useState<string>('Sân 01');
  const [newBookingDate, setNewBookingDate] = useState<string>(getTodayInputDate);
  const [newStartTime, setNewStartTime] = useState<string>('18:00');
  const [newDurationHours, setNewDurationHours] = useState<number>(2);
  const [newNotes, setNewNotes] = useState<string>('');

  const hourlyRate = newSport === 'badminton' ? 120000 : newSport === 'volleyball' ? 150000 : 200000;
  const newBasePrice = hourlyRate * newDurationHours;

  // Counters
  const pendingCount = useMemo(() => requests.filter(r => r.status === 'pending').length, [requests]);
  const consultingCount = useMemo(() => requests.filter(r => r.status === 'in_consultation').length, [requests]);
  const confirmedCount = useMemo(() => requests.filter(r => r.status === 'confirmed').length, [requests]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchSearch = 
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.phone.includes(searchQuery) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.notes && r.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  // Open Contact Modal
  const handleOpenContactModal = (req: BookingRequest) => {
    setSelectedReq(req);
    setContactNoteInput('');
    setNewStatusInput(req.status === 'pending' ? 'in_consultation' : req.status);
    setShowContactModal(true);
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (req: BookingRequest) => {
    setSelectedReq(req);
    setPayAmountInput(req.remainingDue);
    setShowPaymentModal(true);
  };

  // Submit Contact Log
  const handleSaveContactLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newLog = contactNoteInput.trim() ? {
      date: dateStr,
      staffName: 'Quản lý (Admin)',
      note: contactNoteInput.trim()
    } : null;

    const statusLabels: Record<BookingRequest['status'], string> = {
      pending: 'Chờ liên hệ',
      in_consultation: 'Đang tư vấn',
      confirmed: 'Đã chốt đặt sân',
      cancelled: 'Đã hủy'
    };

    const updated = requests.map(r => {
      if (r.id === selectedReq.id) {
        return {
          ...r,
          status: newStatusInput,
          statusLabel: statusLabels[newStatusInput],
          lastContactedAt: dateStr,
          contactLogs: newLog ? [newLog, ...(r.contactLogs || [])] : r.contactLogs
        };
      }
      return r;
    });

    updateRequestsList(updated);
    setShowContactModal(false);
  };

  // Submit Additional Payment
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || payAmountInput <= 0) return;

    const newPaid = selectedReq.paidAmount + payAmountInput;
    const newRemaining = Math.max(0, selectedReq.finalPrice - newPaid);

    const updated = requests.map(r => {
      if (r.id === selectedReq.id) {
        return {
          ...r,
          paidAmount: newPaid,
          remainingDue: newRemaining,
          paymentMethod: 'vietqr' as const,
          paymentStatus: newRemaining === 0 ? ('paid_in_full' as const) : ('partial' as const),
          paymentStatusLabel: newRemaining === 0 ? 'Đã thanh toán đủ' : `Đã nộp ${newPaid.toLocaleString('vi-VN')}đ`,
          status: newRemaining === 0 && r.status === 'pending' ? ('confirmed' as const) : r.status,
          statusLabel: newRemaining === 0 && r.status === 'pending' ? 'Đã chốt đặt sân' : r.statusLabel,
          contactLogs: [
            {
              date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
              staffName: 'Nhân viên/Quản lý tại quầy',
              note: `Thu thêm ${payAmountInput.toLocaleString('vi-VN')}đ qua VietQR. Còn nợ: ${newRemaining.toLocaleString('vi-VN')}đ.`
            },
            ...(r.contactLogs || [])
          ]
        };
      }
      return r;
    });

    updateRequestsList(updated);
    setShowPaymentModal(false);
  };

  const handleCompleteCheckout = (result: PaymentResult) => {
    if (!checkoutReq) return;

    const totalPaid = Math.min(checkoutReq.finalPrice, checkoutReq.paidAmount + result.paidAmount);
    const remainingDue = Math.max(0, checkoutReq.finalPrice - totalPaid);
    const paymentMode = result.plan === 'full' ? 'full_100' : 'installments';

    updateRequestsList(requests.map(request => {
      if (request.id !== checkoutReq.id) return request;

      return {
        ...request,
        paymentMode,
        paymentModeLabel: result.planLabel,
        installmentCount: result.installmentCount ?? undefined,
        paidAmount: totalPaid,
        remainingDue,
        paymentMethod: 'vietqr',
        paymentStatus: remainingDue === 0 ? ('paid_in_full' as const) : ('partial' as const),
        paymentStatusLabel: remainingDue === 0 ? 'Đã thanh toán đủ' : `Đã thanh toán ${totalPaid.toLocaleString('vi-VN')}đ`,
        status: 'confirmed' as const,
        statusLabel: 'Đã chốt đặt sân',
        contactLogs: [
          {
            date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            staffName: 'Quản lý (Admin)',
            note: `Đã đối soát thủ công và ghi nhận ${result.paidAmount.toLocaleString('vi-VN')}đ qua VietQR; hệ thống không xác minh giao dịch ngân hàng tự động.`
          },
          ...(request.contactLogs || [])
        ]
      };
    }));
    setCheckoutReq(null);
  };

  const handleCompleteCounterCheckout = (result: PaymentResult) => {
    if (!counterCheckoutReq || result.plan !== 'full' || result.paidAmount !== counterCheckoutReq.finalPrice) return;

    const confirmedRequest: BookingRequest = {
      ...counterCheckoutReq,
      paymentMode: 'full_100',
      paymentModeLabel: 'Thanh toán đủ 100%',
      paidAmount: counterCheckoutReq.finalPrice,
      remainingDue: 0,
      paymentMethod: 'vietqr',
      paymentStatus: 'paid_in_full',
      paymentStatusLabel: 'Đã thanh toán đủ',
      status: 'confirmed',
      statusLabel: 'Đã chốt đặt sân',
      contactLogs: [
        {
          date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
          staffName: 'Nhân viên/Quản lý tại quầy',
          note: `Đã đối soát thủ công và ghi nhận đủ ${result.paidAmount.toLocaleString('vi-VN')}đ qua VietQR; hệ thống không xác minh giao dịch ngân hàng tự động.`
        }
      ]
    };

    updateRequestsList([confirmedRequest, ...requests]);
    setCounterCheckoutReq(null);
    setShowAddModal(false);

    setNewName('');
    setNewPhone('');
    setNewBookingDate(getTodayInputDate());
    setNewStartTime('18:00');
    setNewDurationHours(2);
    setNewNotes('');
  };

  // Submit New Request Created by Admin
  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Vui lòng nhập Tên khách và Số điện thoại!');
      return;
    }

    const [year, month, day] = newBookingDate.split('-').map(Number);
    const [startHour, startMinute] = newStartTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + newDurationHours * 60;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const today = getTodayInputDate();
    if (
      !newBookingDate ||
      newBookingDate < today ||
      (newBookingDate === today && startMinutes < currentMinutes) ||
      Number.isNaN(startMinutes) ||
      endMinutes > 23 * 60 ||
      startMinutes < 5 * 60
    ) {
      alert('Vui lòng chọn ngày và khung giờ trong giờ hoạt động 05:00–23:00.');
      return;
    }

    const formatTime = (minutes: number) =>
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

    const sportLabels: Record<BookingRequest['sport'], string> = {
      badminton: 'Cầu Lông',
      volleyball: 'Bóng Chuyền',
      football: 'Bóng Đá Mini'
    };

    const sourceLabels: Record<BookingRequest['source'], string> = {
      direct_counter: 'Tại quầy',
      phone_call: 'Gọi Hotline',
      website: 'Từ Website',
      zalo: 'Nhắn qua Zalo'
    };

    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const randomCode = `YC-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(10 + Math.random() * 90)}`;
    const bookingDate = new Date(year, month - 1, day).toLocaleDateString('vi-VN');
    const timeRange = `${newStartTime} – ${formatTime(endMinutes)} (${newDurationHours} giờ)`;

    const newReqItem: BookingRequest = {
      id: `REQ-${Date.now()}`,
      code: randomCode,
      customerName: newName.trim(),
      phone: newPhone.trim(),
      customerType: 'trai_nghiem',
      customerTypeLabel: 'Đặt sân',
      sport: newSport,
      sportLabel: sportLabels[newSport],
      courtDetails: newCourtDetails.trim() || 'Sân 01',
      preferredSchedule: bookingDate,
      preferredTime: timeRange,
      source: newSource,
      sourceLabel: sourceLabels[newSource],
      notes: newNotes.trim() || 'Tiếp nhận trực tiếp tại quầy.',
      totalPrice: newBasePrice,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: newBasePrice,
      paymentMode: 'full_100',
      paymentModeLabel: 'Thanh toán đủ 100%',
      paidAmount: 0,
      remainingDue: newBasePrice,
      paymentStatus: 'unpaid',
      paymentStatusLabel: 'Chưa thanh toán',
      status: 'pending',
      statusLabel: 'Chờ thanh toán',
      createdAt: dateStr,
      contactLogs: []
    };

    setCounterCheckoutReq(newReqItem);
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 overflow-auto bg-slate-50 p-3 sm:p-5 custom-scrollbar text-slate-900">
      
      {/* 🟢 TOP CLEAN BAR (MOBILE-OPTIMIZED) */}
      <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-3">
        <div>
          <h1 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
            Yêu cầu đặt sân
          </h1>
          <p className="text-[11px] text-slate-500">
            {filteredRequests.length} yêu cầu • Khách quầy & website
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 active:scale-95 transition cursor-pointer shadow-xs shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Đặt sân tại quầy</span>
        </button>
      </div>

      {/* 🔍 FILTER & SEARCH TOOLBAR (COMPACT) */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs mb-3 space-y-2">
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên khách, SĐT, mã yêu cầu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

        </div>

        {/* Status Filter Tabs (Horizontal scroll on mobile) */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1.5 border-t border-slate-100 text-[11px]">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-md font-bold transition shrink-0 cursor-pointer ${statusFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Tất cả ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-md font-bold transition shrink-0 cursor-pointer ${statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'text-amber-800 hover:bg-amber-50'}`}
          >
            Chờ xử lý ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('in_consultation')}
            className={`px-2.5 py-1 rounded-md font-bold transition shrink-0 cursor-pointer ${statusFilter === 'in_consultation' ? 'bg-sky-600 text-white' : 'text-sky-800 hover:bg-sky-50'}`}
          >
            Đang tư vấn ({consultingCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('confirmed')}
            className={`px-2.5 py-1 rounded-md font-bold transition shrink-0 cursor-pointer ${statusFilter === 'confirmed' ? 'bg-emerald-600 text-white' : 'text-emerald-800 hover:bg-emerald-50'}`}
          >
            Đã chốt ({confirmedCount})
          </button>
        </div>
      </div>

      {/* 📋 COMPACT MOBILE-FIRST LIST */}
      <div className="space-y-2">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            <AlertCircle className="w-6 h-6 mx-auto mb-1 text-slate-400" />
            <p className="font-bold">Không tìm thấy yêu cầu nào</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === 'pending';
            const isConfirmed = req.status === 'confirmed';

            const statusBadgeColor =
              isPending ? 'bg-amber-100 text-amber-800' :
              req.status === 'in_consultation' ? 'bg-sky-100 text-sky-800' :
              isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600';

            return (
              <div 
                key={req.id}
                onClick={() => setDetailReq(req)}
                className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-400 active:bg-slate-50 transition cursor-pointer flex flex-col gap-1.5"
              >
                {/* Dòng 1: Mã ngắn & Tên khách & Trạng thái */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">#{req.code.slice(-4)}</span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {req.customerName}
                    </span>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeColor}`}>
                    {req.statusLabel}
                  </span>
                </div>

                {/* Dòng 2: Môn, Sân & Lịch đặt */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-wrap">
                  <span className="font-bold text-slate-800">{req.sportLabel}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-semibold">{req.courtDetails}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-medium">{req.preferredSchedule} · {req.preferredTime}</span>
                </div>

                {/* Dòng 3: Tài chính & Ngày tiếp nhận + Nút xem chi tiết */}
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">
                      Tổng: <strong className="text-slate-800 font-bold">{req.finalPrice.toLocaleString('vi-VN')}đ</strong>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">
                      Nợ: <strong className={req.remainingDue > 0 ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                        {req.remainingDue > 0 ? `${req.remainingDue.toLocaleString('vi-VN')}đ` : '0đ'}
                      </strong>
                    </span>
                  </div>
                  
                  <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-0.5 shrink-0">
                    Chi tiết &rarr;
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* 🔍 MODAL: CHI TIẾT YÊU CẦU ĐẶT SÂN (MOBILE-FIRST)        */}
      {/* ======================================================== */}
      {currentDetailReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 sm:p-5 shadow-2xl max-h-[92vh] overflow-y-auto text-xs space-y-3.5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-slate-400">{currentDetailReq.code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentDetailReq.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    currentDetailReq.status === 'in_consultation' ? 'bg-sky-100 text-sky-800' :
                    currentDetailReq.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {currentDetailReq.statusLabel}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  {currentDetailReq.customerName}
                </h3>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Tiếp nhận: {currentDetailReq.createdAt} ({currentDetailReq.sourceLabel})
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailReq(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QUICK ACTIONS BAR */}
            <div className={`grid gap-2 ${currentDetailReq.status !== 'confirmed' ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <a
                href={`tel:${currentDetailReq.phone.replace(/[^0-9]/g, '')}`}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition font-bold"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600 mb-0.5" />
                <span className="text-[11px]">Gọi khách</span>
                <span className="text-[9px] font-mono text-emerald-600 font-semibold">{currentDetailReq.phone}</span>
              </a>

              {currentDetailReq.status !== 'confirmed' && (
                <button
                type="button"
                onClick={() => {
                  handleOpenPaymentModal(currentDetailReq);
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition font-bold cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-amber-600 mb-0.5" />
                <span className="text-[11px]">Thu tiền</span>
                <span className="text-[9px] text-amber-600 font-semibold">
                  {currentDetailReq.remainingDue > 0 ? `Nợ ${currentDetailReq.remainingDue.toLocaleString('vi-VN')}đ` : 'Đã đủ 100%'}
                </span>
              </button>
              )}

              <button
                type="button"
                onClick={() => {
                  handleOpenContactModal(currentDetailReq);
                }}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition font-bold cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-sky-600 mb-0.5" />
                <span className="text-[11px]">Tư vấn</span>
                <span className="text-[9px] text-sky-600 font-semibold">Ghi nhật ký</span>
              </button>
            </div>

            {/* SECTIONS */}
            {/* 1. DỊCH VỤ & LỊCH ĐẶT */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide flex items-center justify-between">
                <span>Thông tin đặt sân</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Bộ môn & Sân:</span>
                  <span className="font-bold text-slate-800">{currentDetailReq.sportLabel}</span> • <span className="font-bold text-emerald-700">{currentDetailReq.courtDetails}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Khung giờ:</span>
                  <span className="font-bold text-slate-800">{currentDetailReq.preferredTime}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Ngày đặt sân:</span>
                  <span className="font-bold text-slate-800">{currentDetailReq.preferredSchedule}</span>
                </div>
              </div>
            </div>

            {/* 2. TÀI CHÍNH & CÔNG NỢ */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide flex items-center justify-between">
                <span>Tài chính & Thanh toán</span>
                <span className="text-[10px] text-slate-500 font-medium">
                  ({currentDetailReq.installmentCount ? `Chia ${currentDetailReq.installmentCount} kỳ` : currentDetailReq.paymentModeLabel})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400">Tổng tiền</div>
                  <div className="font-black text-slate-900 text-xs mt-0.5">
                    {currentDetailReq.finalPrice.toLocaleString('vi-VN')}đ
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400">Đã nộp</div>
                  <div className="font-black text-emerald-700 text-xs mt-0.5">
                    {currentDetailReq.paidAmount.toLocaleString('vi-VN')}đ
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] text-slate-400">Còn nợ</div>
                  <div className={`font-black text-xs mt-0.5 ${currentDetailReq.remainingDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {currentDetailReq.remainingDue > 0 ? `${currentDetailReq.remainingDue.toLocaleString('vi-VN')}đ` : '0đ (Đủ)'}
                  </div>
                </div>
              </div>

              {currentDetailReq.paymentMode === 'installments' && (
                <div className="text-[10px] text-emerald-900 bg-white p-2 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <span>Kế hoạch: <strong>Chia {currentDetailReq.installmentCount || 3} kỳ</strong></span>
                  <span className="text-slate-500 font-medium">
                    (Ước tính ~{Math.round(currentDetailReq.finalPrice / (currentDetailReq.installmentCount || 3)).toLocaleString('vi-VN')}đ/kỳ)
                  </span>
                </div>
              )}
            </div>

            {/* 3. GHI CHÚ TỪ KHÁCH */}
            {currentDetailReq.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px]">
                <span className="font-bold text-amber-900 block mb-0.5">Ghi chú của khách:</span>
                <p className="text-amber-800 italic">"{currentDetailReq.notes}"</p>
              </div>
            )}

            {/* 4. NHẬT KÝ TƯ VẤN / LIÊN HỆ */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                  Nhật ký tư vấn & liên hệ
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenContactModal(currentDetailReq)}
                  className="text-emerald-700 hover:underline font-bold text-[10px] cursor-pointer"
                >
                  + Thêm nhật ký
                </button>
              </div>

              {(!currentDetailReq.contactLogs || currentDetailReq.contactLogs.length === 0) ? (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center text-slate-400 text-[11px]">
                  Chưa có lịch sử liên hệ nào
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {currentDetailReq.contactLogs.map((log, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="font-bold text-slate-700">{log.staffName}</span>
                        <span>{log.date}</span>
                      </div>
                      <p className="text-slate-700 mt-0.5">{log.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CHỐT SÂN BUTTON */}
            {currentDetailReq.status !== 'confirmed' && (
              <button
                type="button"
                onClick={() => {
                  setCheckoutReq(currentDetailReq);
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác nhận chốt đặt sân</span>
              </button>
            )}
          </div>
        </div>
      )}

      {(checkoutReq || counterCheckoutReq) && (
        <PaymentCheckout
          key={(counterCheckoutReq || checkoutReq)!.id}
          open
          orderCode={(counterCheckoutReq || checkoutReq)!.code}
          customerName={(counterCheckoutReq || checkoutReq)!.customerName}
          customerPhone={(counterCheckoutReq || checkoutReq)!.phone}
          totalAmount={(counterCheckoutReq || checkoutReq)!.finalPrice}
          bookingDetails={{
            sport: (counterCheckoutReq || checkoutReq)!.sportLabel,
            court: (counterCheckoutReq || checkoutReq)!.courtDetails,
            date: (counterCheckoutReq || checkoutReq)!.preferredSchedule,
            time: (counterCheckoutReq || checkoutReq)!.preferredTime,
          }}
          registrationMonths={(counterCheckoutReq || checkoutReq)!.durationMonths}
          allowInstallments={!counterCheckoutReq && checkoutReq!.customerType !== 'trai_nghiem'}
          onClose={() => {
            if (counterCheckoutReq) {
              setCounterCheckoutReq(null);
              setShowAddModal(true);
            } else {
              setCheckoutReq(null);
            }
          }}
          onComplete={counterCheckoutReq ? handleCompleteCounterCheckout : handleCompleteCheckout}
        />
      )}

      {/* ======================================================== */}
      {/* 🟢 MODAL: TIẾP NHẬN ĐẶT SÂN TẠI QUẦY */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl max-h-[92vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Tiếp nhận đặt sân tại quầy
                </h3>
                <p className="text-[11px] text-slate-500">
                  Chọn khách, môn chơi, ngày giờ và thời lượng thuê sân
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRequest} className="mt-3.5 space-y-3">
              {/* THÔNG TIN KHÁCH */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tên khách / Đơn vị <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Anh Nguyễn Văn A"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0912345678"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kênh tiếp nhận
                  </label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as BookingRequest['source'])}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="direct_counter">Tại quầy lễ tân</option>
                    <option value="phone_call">Gọi điện hotline</option>
                    <option value="zalo">Zalo / Tin nhắn</option>
                    <option value="website">Website</option>
                  </select>
                </div>
              </div>

              {/* MÔN CHƠI & SÂN */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Môn chơi
                  </label>
                  <select
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value as BookingRequest['sport'])}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="badminton">Cầu Lông (120k)</option>
                    <option value="volleyball">Bóng Chuyền (150k)</option>
                    <option value="football">Bóng Đá Mini (200k)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sân mong muốn
                  </label>
                  <input
                    type="text"
                    placeholder="Sân 01 & 02"
                    value={newCourtDetails}
                    onChange={(e) => setNewCourtDetails(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>

              </div>

              {/* NGÀY, GIỜ & THỜI LƯỢNG */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Ngày đặt sân</label>
                  <input
                    type="date"
                    required
                    min={getTodayInputDate()}
                    value={newBookingDate}
                    onChange={(e) => setNewBookingDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Giờ bắt đầu</label>
                  <input
                    type="time"
                    required
                    min="05:00"
                    max={`${String(Math.floor((23 * 60 - newDurationHours * 60) / 60)).padStart(2, '0')}:${String((23 * 60 - newDurationHours * 60) % 60).padStart(2, '0')}`}
                    step={60}
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Thời lượng</label>
                  <select
                    value={newDurationHours}
                    onChange={(e) => setNewDurationHours(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value={1}>1 giờ</option>
                    <option value={1.5}>1,5 giờ</option>
                    <option value={2}>2 giờ</option>
                    <option value={2.5}>2,5 giờ</option>
                    <option value={3}>3 giờ</option>
                    <option value={3.5}>3,5 giờ</option>
                    <option value={4}>4 giờ</option>
                  </select>
                </div>
              </div>

              {/* THANH TOÁN */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[10px]">Thanh toán tại quầy</span>
                  <span className="font-bold text-emerald-700 text-xs">
                    Tổng dự toán: {newBasePrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-slate-200 bg-white px-2 py-1">
                    <span className="block text-[10px] text-slate-500">Hình thức thanh toán</span>
                    <span className="text-xs font-bold text-slate-800">Thanh toán đủ 100%</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 mb-0.5">Phương thức thu</span>
                    <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                      Chuyển khoản qua mã QR VietQR của sân
                    </p>
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200/60 text-xs font-bold text-emerald-800">
                  Thu đủ 100%: {newBasePrice.toLocaleString('vi-VN')}đ
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Ghi chú thỏa thuận riêng của khách
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cần xuất hóa đơn VAT, hỗ trợ mượn bóng..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Xác nhận đặt sân
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🟡 MODAL: THU TIỀN & CẬP NHẬT THANH TOÁN                */}
      {/* ======================================================== */}
      {showPaymentModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Thu tiền & Cập nhật công nợ
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedReq.customerName} ({selectedReq.code})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Status Summary */}
            <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tổng tiền phải trả:</span>
                <span className="font-bold text-slate-900">{selectedReq.finalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Đã thanh toán trước:</span>
                <span className="font-bold text-emerald-700">{selectedReq.paidAmount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5 font-bold">
                <span className="text-slate-700">Số tiền còn thiếu:</span>
                <span className="text-amber-800 text-sm">{selectedReq.remainingDue.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Số tiền thu lần này (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={selectedReq.remainingDue}
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(Number(e.target.value))}
                  readOnly={selectedReq.customerType === 'trai_nghiem'}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-emerald-700 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Phương thức thanh toán:
                </label>
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 font-bold text-emerald-800">
                  <QrCode className="mr-1 inline h-3.5 w-3.5" />
                  Chuyển khoản qua mã QR VietQR của sân
                </p>
              </div>

              {/* VietQR Quick Scan Box */}
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-3 text-center space-y-2">
                <QrCodeArtwork className="mx-auto h-32 w-32 rounded-lg p-2" />
                <p className="font-bold text-emerald-800 text-[11px]">
                  Mã QR minh họa • {payAmountInput.toLocaleString('vi-VN')}đ
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Nội dung: {selectedReq.code} {selectedReq.phone}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Xác nhận đã thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 🔵 MODAL: TƯ VẤN & CẬP NHẬT TRẠNG THÁI                    */}
      {/* ======================================================== */}
      {showContactModal && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Nhật ký tư vấn & Trạng thái
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedReq.customerName} ({selectedReq.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContactLog} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Trạng thái xử lý:
                </label>
                <select
                  value={newStatusInput}
                  onChange={(e) => setNewStatusInput(e.target.value as BookingRequest['status'])}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-bold text-slate-800 outline-none"
                >
                  <option value="pending">Chờ liên hệ</option>
                  <option value="in_consultation">Đang tư vấn / Đã gọi</option>
                  <option value="confirmed">Đã chốt đặt sân</option>
                  <option value="cancelled">Đã hủy / Khách đổi ý</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nội dung cuộc gọi / tư vấn với khách:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Đã gọi báo giá, khách đồng ý hẹn 18h qua ký hợp đồng..."
                  value={contactNoteInput}
                  onChange={(e) => setContactNoteInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  Lưu nhật ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
