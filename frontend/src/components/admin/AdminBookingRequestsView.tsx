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
  ChevronDown
} from 'lucide-react';
import type { 
  BookingRequest, 
  CustomerType 
} from '../../types/bookingRequest';
import {
  getStoredBookingRequests, 
  saveBookingRequests 
} from '../../types/bookingRequest';
import PaymentCheckout, { type PaymentResult } from '../PaymentCheckout';

export default function AdminBookingRequestsView() {
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_consultation' | 'confirmed' | 'cancelled'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CustomerType>('all');

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
  const [payMethodInput, setPayMethodInput] = useState<'cash' | 'vietqr'>('cash');
  const [showQrBox, setShowQrBox] = useState<boolean>(false);

  // New Request Form State
  const [newCustomerType, setNewCustomerType] = useState<CustomerType>('trai_nghiem');
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newSource, setNewSource] = useState<BookingRequest['source']>('direct_counter');
  const [newSport, setNewSport] = useState<BookingRequest['sport']>('badminton');
  const [newCourtDetails, setNewCourtDetails] = useState<string>('Sân 01');
  const [newTime, setNewTime] = useState<string>('18:00 – 20:00 (2h/buổi)');
  const [newDurationMonths, setNewDurationMonths] = useState<number>(1);
  const [newEventDays, setNewEventDays] = useState<number>(7);
  const [newNotes, setNewNotes] = useState<string>('');

  // Schedule Days Multi-select State
  const DAYS_LIST = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const [selectedDays, setSelectedDays] = useState<string[]>(['Thứ 2', 'Thứ 4', 'Thứ 6']);
  const [isDaysDropdownOpen, setIsDaysDropdownOpen] = useState<boolean>(false);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      const updated = [...selectedDays, day].sort((a, b) => DAYS_LIST.indexOf(a) - DAYS_LIST.indexOf(b));
      setSelectedDays(updated);
    }
  };

  const applyPresetDays = (preset: '246' | '357' | 'weekend' | 'all') => {
    if (preset === '246') setSelectedDays(['Thứ 2', 'Thứ 4', 'Thứ 6']);
    else if (preset === '357') setSelectedDays(['Thứ 3', 'Thứ 5', 'Thứ 7']);
    else if (preset === 'weekend') setSelectedDays(['Thứ 7', 'Chủ Nhật']);
    else if (preset === 'all') setSelectedDays([...DAYS_LIST]);
  };

  // Payment inside New Request Form
  const [newBasePrice, setNewBasePrice] = useState<number>(120000);
  const [newPaymentMode, setNewPaymentMode] = useState<BookingRequest['paymentMode']>('deposit_50');
  const [newPaidNow, setNewPaidNow] = useState<number>(60000);
  const [newPayMethod, setNewPayMethod] = useState<'cash' | 'vietqr'>('cash');
  const [newInstallmentCount, setNewInstallmentCount] = useState<number>(3);

  // Automatically adjust max installments when switching customer type
  useEffect(() => {
    if (newCustomerType === 'event_series' && newInstallmentCount > 3) {
      setNewInstallmentCount(3);
    } else if (newCustomerType === 'trai_nghiem' && newInstallmentCount > 2) {
      setNewInstallmentCount(2);
    }
  }, [newCustomerType, newInstallmentCount]);

  // Automatically recalculate estimate based on Customer Type & Sport in Add Form
  useEffect(() => {
    let rate = newSport === 'badminton' ? 120000 : newSport === 'volleyball' ? 150000 : 200000;
    
    if (newCustomerType === 'trai_nghiem') {
      const estimatedTotal = rate * 2 * (newDurationMonths > 0 ? newDurationMonths * 4 * 2 : 1);
      setNewBasePrice(estimatedTotal);
      if (newPaymentMode === 'full_100') setNewPaidNow(estimatedTotal);
      else if (newPaymentMode === 'deposit_50') setNewPaidNow(Math.round(estimatedTotal / 2));
      else {
        const count = Math.min(2, newInstallmentCount);
        setNewPaidNow(Math.round(estimatedTotal / count));
      }
    } else if (newCustomerType === 'vip_monthly') {
      const months = Math.max(3, newDurationMonths);
      const totalHours = months * 4 * 3 * 2; // 3 buổi/tuần, 2h/buổi
      const gross = totalHours * rate;
      const discount = months <= 6 ? 10 : 15;
      const net = Math.round(gross * (1 - discount / 100));
      setNewBasePrice(net);
      if (newPaymentMode === 'full_100') setNewPaidNow(net);
      else if (newPaymentMode === 'deposit_50') setNewPaidNow(Math.round(net / 2));
      else {
        // VIP allows up to 4 installments (2, 3, or 4)
        const count = Math.min(4, Math.max(2, newInstallmentCount));
        setNewPaidNow(Math.round(net / count)); // Kỳ 1
      }
    } else if (newCustomerType === 'event_series') {
      const days = Math.max(7, newEventDays);
      const totalHours = days * 3; // 3h/ngày
      const gross = totalHours * rate;
      const net = Math.round(gross * 0.95); // -5%
      setNewBasePrice(net);
      if (newPaymentMode === 'full_100') setNewPaidNow(net);
      else if (newPaymentMode === 'deposit_50') setNewPaidNow(Math.round(net / 2));
      else {
        // Event allows up to 3 installments (2 or 3)
        const count = Math.min(3, Math.max(2, newInstallmentCount));
        setNewPaidNow(Math.round(net / count)); // Kỳ 1
      }
    }
  }, [newCustomerType, newSport, newDurationMonths, newEventDays, newPaymentMode, newInstallmentCount]);

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
      const matchType = typeFilter === 'all' || r.customerType === typeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [requests, searchQuery, statusFilter, typeFilter]);

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
    setPayMethodInput('cash');
    setShowQrBox(false);
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
          paymentMethod: payMethodInput,
          paymentStatus: newRemaining === 0 ? ('paid_in_full' as const) : ('partial' as const),
          paymentStatusLabel: newRemaining === 0 ? 'Đã thanh toán đủ' : `Đã nộp ${newPaid.toLocaleString('vi-VN')}đ`,
          status: newRemaining === 0 && r.status === 'pending' ? ('confirmed' as const) : r.status,
          statusLabel: newRemaining === 0 && r.status === 'pending' ? 'Đã chốt đặt sân' : r.statusLabel,
          contactLogs: [
            {
              date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
              staffName: 'Quản lý (Admin)',
              note: `Thu thêm ${payAmountInput.toLocaleString('vi-VN')}đ qua ${payMethodInput === 'cash' ? 'Tiền mặt tại quầy' : 'VietQR'}. Còn nợ: ${newRemaining.toLocaleString('vi-VN')}đ.`
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
    const paymentMode = result.plan === 'full' ? 'full_100' : result.plan === 'half' ? 'deposit_50' : 'installments';

    updateRequestsList(requests.map(request => {
      if (request.id !== checkoutReq.id) return request;

      return {
        ...request,
        paymentMode,
        paymentModeLabel: result.planLabel,
        installmentCount: result.installmentCount ?? undefined,
        paidAmount: totalPaid,
        remainingDue,
        paymentMethod: result.method === 'qr' ? 'vietqr' : 'cash',
        paymentStatus: remainingDue === 0 ? ('paid_in_full' as const) : ('partial' as const),
        paymentStatusLabel: remainingDue === 0 ? 'Đã thanh toán đủ' : `Đã thanh toán ${totalPaid.toLocaleString('vi-VN')}đ`,
        status: 'confirmed' as const,
        statusLabel: 'Đã chốt đặt sân',
        contactLogs: [
          {
            date: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
            staffName: 'Quản lý (Admin)',
            note: `Đã chốt đặt sân và ghi nhận ${result.paidAmount.toLocaleString('vi-VN')}đ qua ${result.methodLabel}.`
          },
          ...(request.contactLogs || [])
        ]
      };
    }));
    setCheckoutReq(null);
  };

  // Submit New Request Created by Admin
  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Vui lòng nhập Tên khách và Số điện thoại!');
      return;
    }

    const typeLabels: Record<CustomerType, string> = {
      trai_nghiem: newDurationMonths > 0 ? `Trải nghiệm (${newDurationMonths} Tháng)` : 'Trải nghiệm (Giờ lẻ)',
      vip_monthly: `Hội viên VIP (${newDurationMonths} Tháng)`,
      event_series: `Sự kiện (${newEventDays} Ngày)`
    };

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

    const modeLabels: Record<BookingRequest['paymentMode'], string> = {
      full_100: 'Thanh toán 100%',
      deposit_50: 'Cọc 50%',
      installments: `Chia ${newInstallmentCount} kỳ`
    };

    const remaining = Math.max(0, newBasePrice - newPaidNow);
    const now = new Date();
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const randomCode = `YC-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(10 + Math.random() * 90)}`;

    const newReqItem: BookingRequest = {
      id: `REQ-${Date.now()}`,
      code: randomCode,
      customerName: newName.trim(),
      phone: newPhone.trim(),
      customerType: newCustomerType,
      customerTypeLabel: typeLabels[newCustomerType],
      sport: newSport,
      sportLabel: sportLabels[newSport],
      courtDetails: newCourtDetails.trim() || 'Sân 01',
      preferredSchedule: selectedDays.length > 0 ? `${selectedDays.join(', ')} hàng tuần` : 'Lịch linh hoạt',
      preferredTime: newTime.trim() || '18:00 – 20:00 (2h/buổi)',
      durationMonths: newCustomerType !== 'event_series' ? newDurationMonths : undefined,
      eventDays: newCustomerType === 'event_series' ? newEventDays : undefined,
      source: newSource,
      sourceLabel: sourceLabels[newSource],
      notes: newNotes.trim() || 'Tiếp nhận trực tiếp tại quầy.',
      totalPrice: newBasePrice,
      discountPercent: newCustomerType === 'vip_monthly' ? (newDurationMonths <= 6 ? 10 : 15) : newCustomerType === 'event_series' ? 5 : 0,
      discountAmount: 0,
      finalPrice: newBasePrice,
      paymentMode: newPaymentMode,
      paymentModeLabel: newPaymentMode === 'installments' ? `Chia ${newInstallmentCount} kỳ` : modeLabels[newPaymentMode],
      installmentCount: newPaymentMode === 'installments' ? newInstallmentCount : undefined,
      paidAmount: newPaidNow,
      remainingDue: remaining,
      paymentMethod: newPayMethod,
      paymentStatus: remaining === 0 ? 'paid_in_full' : newPaidNow > 0 ? 'partial' : 'unpaid',
      paymentStatusLabel: remaining === 0 ? 'Đã thanh toán đủ' : newPaidNow > 0 ? (newPaymentMode === 'installments' ? `Đã nộp Kỳ 1 (${newPaidNow.toLocaleString('vi-VN')}đ)` : `Đã nộp ${newPaidNow.toLocaleString('vi-VN')}đ`) : 'Chưa đóng',
      status: 'pending',
      statusLabel: 'Chờ liên hệ',
      createdAt: dateStr,
      contactLogs: newPaidNow > 0 ? [
        {
          date: dateStr,
          staffName: 'Quản lý (Admin)',
          note: `Đã thu ${newPaidNow.toLocaleString('vi-VN')}đ (${newPayMethod === 'cash' ? 'Tiền mặt' : 'VietQR'}) - ${newPaymentMode === 'installments' ? `Đợt 1/${newInstallmentCount}` : 'Đặt cọc'}. Còn nợ: ${remaining.toLocaleString('vi-VN')}đ.`
        }
      ] : []
    };

    updateRequestsList([newReqItem, ...requests]);
    setShowAddModal(false);

    // Reset Form
    setNewName('');
    setNewPhone('');
    setSelectedDays(['Thứ 2', 'Thứ 4', 'Thứ 6']);
    setIsDaysDropdownOpen(false);
    setNewInstallmentCount(3);
    setNewNotes('');
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
          <span>Tạo yêu cầu mới</span>
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

          {/* Customer Group Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 cursor-pointer max-w-[140px] truncate"
          >
            <option value="all">Tất cả khách</option>
            <option value="trai_nghiem">Trải nghiệm (1-2T)</option>
            <option value="vip_monthly">VIP (3-12T)</option>
            <option value="event_series">Sự kiện (7-14N)</option>
          </select>
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

            const typeBadgeColor = 
              req.customerType === 'vip_monthly' 
                ? 'bg-amber-50 text-amber-800 border-amber-200' 
                : req.customerType === 'event_series' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-slate-100 text-slate-700 border-slate-200';

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

                {/* Dòng 2: Môn, Sân & Gói khách */}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 flex-wrap">
                  <span className="font-bold text-slate-800">{req.sportLabel}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-semibold">{req.courtDetails}</span>
                  <span className="text-slate-300">•</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium border ${typeBadgeColor}`}>
                    {req.customerTypeLabel}
                  </span>
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
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-white text-slate-800">
                  {currentDetailReq.customerTypeLabel}
                </span>
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
                  <span className="text-slate-400 block text-[10px]">Lịch trong tuần:</span>
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

      {checkoutReq && (
        <PaymentCheckout
          open
          orderCode={checkoutReq.code}
          customerName={checkoutReq.customerName}
          customerPhone={checkoutReq.phone}
          totalAmount={checkoutReq.finalPrice}
          registrationMonths={checkoutReq.durationMonths}
          onClose={() => setCheckoutReq(null)}
          onComplete={handleCompleteCheckout}
        />
      )}

      {/* ======================================================== */}
      {/* 🟢 MODAL: TIẾP NHẬN YÊU CẦU MỚI TẠI QUẦY (ĐẦY ĐỦ 3 NHÓM) */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl max-h-[92vh] overflow-y-auto text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase">
                  Tiếp nhận khách & Đặt sân mới
                </h3>
                <p className="text-[11px] text-slate-500">
                  Hỗ trợ Khách trải nghiệm, VIP tháng và Sự kiện chuỗi ngày
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
              {/* STEP 1: CHỌN NHÓM KHÁCH HÀNG (3 TABS) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  1. Nhóm khách hàng & Nhu cầu:
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomerType('trai_nghiem');
                      setNewDurationMonths(1);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                      newCustomerType === 'trai_nghiem' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Trải nghiệm (1-2T)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomerType('vip_monthly');
                      setNewDurationMonths(6);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                      newCustomerType === 'vip_monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    VIP Tháng (3-12T)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomerType('event_series');
                      setNewEventDays(14);
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition text-center cursor-pointer ${
                      newCustomerType === 'event_series' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sự kiện (7-14N)
                  </button>
                </div>
              </div>

              {/* STEP 2: THÔNG TIN KHÁCH */}
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
                    onChange={(e) => setNewSource(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500"
                  >
                    <option value="direct_counter">Tại quầy lễ tân</option>
                    <option value="phone_call">Gọi điện hotline</option>
                    <option value="zalo">Zalo / Tin nhắn</option>
                    <option value="website">Website</option>
                  </select>
                </div>
              </div>

              {/* STEP 3: MÔN, SÂN & THỜI LƯỢNG */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Môn chơi
                  </label>
                  <select
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value as any)}
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    {newCustomerType === 'event_series' ? 'Số ngày' : 'Thời hạn'}
                  </label>
                  {newCustomerType === 'event_series' ? (
                    <select
                      value={newEventDays}
                      onChange={(e) => setNewEventDays(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      <option value={7}>7 ngày</option>
                      <option value={10}>10 ngày</option>
                      <option value={14}>14 ngày</option>
                      <option value={21}>21 ngày</option>
                      <option value={30}>30 ngày</option>
                    </select>
                  ) : (
                    <select
                      value={newDurationMonths}
                      onChange={(e) => setNewDurationMonths(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-bold text-slate-800 outline-none focus:border-emerald-500"
                    >
                      {newCustomerType === 'trai_nghiem' ? (
                        <>
                          <option value={0}>Thuê giờ lẻ</option>
                          <option value={1}>1 Tháng (Giá chuẩn)</option>
                          <option value={2}>2 Tháng (Giá chuẩn)</option>
                        </>
                      ) : (
                        <>
                          <option value={3}>3 Tháng (-10%)</option>
                          <option value={6}>6 Tháng (-10%)</option>
                          <option value={12}>12 Tháng (-15%)</option>
                        </>
                      )}
                    </select>
                  )}
                </div>
              </div>

              {/* STEP 3.5: LỊCH TRONG TUẦN (DROPDOWN MULTI-SELECT) & KHUNG GIỜ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Lịch thi đấu các thứ trong tuần */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Lịch thi đấu trong tuần:
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {selectedDays.length} buổi/tuần
                    </span>
                  </div>

                  {/* Trigger Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setIsDaysDropdownOpen(!isDaysDropdownOpen)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-bold text-slate-800 text-left flex items-center justify-between outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <span className="truncate text-xs">
                      {selectedDays.length === 0 ? (
                        <span className="text-slate-400 font-normal">Chưa chọn (bấm để chọn thứ)...</span>
                      ) : (
                        <span>{selectedDays.join(', ')} hàng tuần</span>
                      )}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isDaysDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Popover */}
                  {isDaysDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-2.5 bg-white border border-slate-200 rounded-xl shadow-xl space-y-2 z-30">
                      {/* Presets */}
                      <div className="flex items-center gap-1 text-[10px] pb-1.5 border-b border-slate-100 overflow-x-auto">
                        <span className="text-slate-400 font-semibold shrink-0">Chọn nhanh:</span>
                        <button
                          type="button"
                          onClick={() => applyPresetDays('246')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0 cursor-pointer"
                        >
                          T2-4-6
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetDays('357')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0 cursor-pointer"
                        >
                          T3-5-7
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetDays('weekend')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0 cursor-pointer"
                        >
                          T7-CN
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetDays('all')}
                          className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold shrink-0 cursor-pointer"
                        >
                          Cả tuần
                        </button>
                      </div>

                      {/* Day pills */}
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                        {DAYS_LIST.map((day) => {
                          const isSelected = selectedDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`py-1.5 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {day.replace('Thứ ', 'T')}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-500">
                          Đã chọn: <strong className="text-emerald-700">{selectedDays.length}</strong> ngày
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsDaysDropdownOpen(false)}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer"
                        >
                          Xác nhận
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Khung giờ */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Khung giờ thi đấu:
                  </label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                  >
                    <option value="18:00 – 20:00 (2h/buổi)">18:00 – 20:00 (Tối vàng - 2h)</option>
                    <option value="17:00 – 19:00 (2h/buổi)">17:00 – 19:00 (Chiều tối - 2h)</option>
                    <option value="19:00 – 21:00 (2h/buổi)">19:00 – 21:00 (Tối muộn - 2h)</option>
                    <option value="20:00 – 22:00 (2h/buổi)">20:00 – 22:00 (Đêm - 2h)</option>
                    <option value="06:00 – 08:00 (2h/buổi)">06:00 – 08:00 (Sáng sớm - 2h)</option>
                    <option value="08:00 – 10:00 (2h/buổi)">08:00 – 10:00 (Sáng - 2h)</option>
                    <option value="15:00 – 17:00 (2h/buổi)">15:00 – 17:00 (Chiều - 2h)</option>
                  </select>
                </div>
              </div>

              {/* STEP 4: KHU VỰC THANH TOÁN (PAYMENT SECTION) */}
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                  <span className="font-bold text-slate-800 uppercase text-[10px]">Thanh toán & Thu tiền tại quầy</span>
                  <span className="font-bold text-emerald-700 text-xs">
                    Tổng dự toán: {newBasePrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Hình thức thanh toán:
                    </label>
                    <select
                      value={newPaymentMode}
                      onChange={(e) => setNewPaymentMode(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="deposit_50">Đặt cọc 50%</option>
                      <option value="full_100">Thanh toán đủ 100%</option>
                      {newCustomerType !== 'trai_nghiem' && (
                        <option value="installments">Chia nhiều đợt (VIP/Sự kiện)</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Phương thức thu:
                    </label>
                    <select
                      value={newPayMethod}
                      onChange={(e) => setNewPayMethod(e.target.value as any)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="cash">Tiền mặt tại quầy</option>
                      <option value="vietqr">Chuyển khoản VietQR</option>
                    </select>
                  </div>
                </div>

                {/* LỰA CHỌN SỐ KỲ THANH TOÁN (KHI CHỌN CHIA NHIỀU ĐỢT) */}
                {newPaymentMode === 'installments' && (
                  <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-emerald-950">
                        Chọn số kỳ thanh toán:
                      </label>
                      <span className="text-[10px] font-medium text-emerald-700">
                        {newCustomerType === 'vip_monthly' 
                          ? '👑 VIP: Tối đa 4 kỳ' 
                          : '🎪 Sự kiện: Tối đa 3 kỳ'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {/* 2 Kỳ */}
                      <button
                        type="button"
                        onClick={() => setNewInstallmentCount(2)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer border ${
                          newInstallmentCount === 2
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Chia 2 kỳ
                      </button>

                      {/* 3 Kỳ */}
                      <button
                        type="button"
                        onClick={() => setNewInstallmentCount(3)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer border ${
                          newInstallmentCount === 3
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Chia 3 kỳ
                      </button>

                      {/* 4 Kỳ: Chỉ dành cho VIP */}
                      {newCustomerType === 'vip_monthly' ? (
                        <button
                          type="button"
                          onClick={() => setNewInstallmentCount(4)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition text-center cursor-pointer border ${
                            newInstallmentCount === 4
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Chia 4 kỳ
                        </button>
                      ) : (
                        <div className="py-1.5 px-2 rounded-lg text-[10px] text-slate-400 border border-dashed border-slate-200 flex items-center justify-center text-center bg-slate-50/50">
                          4 kỳ (chỉ VIP)
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-emerald-800 flex items-center justify-between pt-1 border-t border-emerald-200/50">
                      <span>Mỗi kỳ: <strong>{Math.round(newBasePrice / newInstallmentCount).toLocaleString('vi-VN')}đ</strong></span>
                      <span>Thu Kỳ 1 hôm nay: <strong>{newPaidNow.toLocaleString('vi-VN')}đ</strong></span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Số tiền thu ngay lúc này:
                    </label>
                    <input
                      type="number"
                      value={newPaidNow}
                      onChange={(e) => setNewPaidNow(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-black text-emerald-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Số tiền còn nợ lại:
                    </label>
                    <div className="py-1 px-2.5 rounded-lg bg-slate-100 text-xs font-black text-amber-800 border border-slate-200">
                      {Math.max(0, newBasePrice - newPaidNow).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
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
                  Lưu & Tiếp nhận
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-emerald-700 outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Phương thức thanh toán:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPayMethodInput('cash');
                      setShowQrBox(false);
                    }}
                    className={`py-2 px-2 rounded-lg border font-bold text-center cursor-pointer transition ${
                      payMethodInput === 'cash' ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Tiền mặt tại quầy
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayMethodInput('vietqr');
                      setShowQrBox(true);
                    }}
                    className={`py-2 px-2 rounded-lg border font-bold text-center cursor-pointer transition flex items-center justify-center gap-1 ${
                      payMethodInput === 'vietqr' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>VietQR MB Bank</span>
                  </button>
                </div>
              </div>

              {/* VietQR Quick Scan Box */}
              {showQrBox && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/50 p-3 text-center space-y-2">
                  <div className="mx-auto w-32 h-32 bg-white rounded-lg p-2 border border-slate-200 flex items-center justify-center relative shadow-xs">
                    <div className="grid grid-cols-4 gap-1 w-full h-full p-1 bg-slate-100 rounded">
                      {Array.from({ length: 16 }).map((_, idx) => (
                        <div key={idx} className={'rounded ' + (idx % 3 === 0 ? 'bg-emerald-600' : 'bg-slate-800')}></div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white text-emerald-700 px-2 py-0.5 font-black text-[9px] rounded-full shadow border border-emerald-100">COURTX</span>
                    </div>
                  </div>
                  <p className="font-bold text-emerald-800 text-[11px]">
                    Quét mã MB Bank: {payAmountInput.toLocaleString('vi-VN')}đ
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Nội dung: {selectedReq.code} {selectedReq.phone}
                  </p>
                </div>
              )}

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
                  onChange={(e) => setNewStatusInput(e.target.value as any)}
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
