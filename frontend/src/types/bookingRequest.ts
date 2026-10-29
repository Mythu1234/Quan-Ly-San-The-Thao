export type CustomerType = 'trai_nghiem' | 'event_series';

export interface BookingRequest {
  id: string;
  code: string;
  customerName: string;
  phone: string;
  customerType: CustomerType;
  customerTypeLabel: string;
  sport: 'badminton' | 'volleyball' | 'football';
  sportLabel: string;
  courtDetails: string;
  preferredSchedule: string;
  preferredTime: string;
  durationMonths?: number;
  eventDays?: number;
  source: 'direct_counter' | 'website' | 'phone_call' | 'zalo';
  sourceLabel: string;
  notes: string;

  // Financial & Payment details
  totalPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  paymentMode: 'full_100' | 'deposit_50' | 'installments';
  paymentModeLabel: string;
  installmentCount?: number;
  paidAmount: number;
  remainingDue: number;
  paymentMethod?: 'cash' | 'vietqr';
  paymentStatus: 'unpaid' | 'partial' | 'paid_in_full';
  paymentStatusLabel: string;

  status: 'pending' | 'in_consultation' | 'confirmed' | 'cancelled';
  statusLabel: string;
  createdAt: string;
  lastContactedAt?: string;
  contactLogs?: {
    date: string;
    staffName: string;
    note: string;
  }[];
}

export const INITIAL_BOOKING_REQUESTS: BookingRequest[] = [
  {
    id: 'REQ-02',
    code: 'YC-20261016-02',
    customerName: 'Chị Lê Thu Hà (Công ty CP FPT Software)',
    phone: '0977.889.900',
    customerType: 'event_series',
    customerTypeLabel: 'Đặt sân',
    sport: 'volleyball',
    sportLabel: 'Bóng Chuyền',
    courtDetails: 'Cụm BC1 (Ô 1-4)',
    preferredSchedule: 'Chuỗi 14 ngày (20/10 - 03/11)',
    preferredTime: '14:00 – 17:00 (Chiều)',
    eventDays: 14,
    source: 'direct_counter',
    sourceLabel: 'Tại quầy',
    notes: 'Tập huấn bóng chuyền công ty. Xin ưu đãi giờ thấp điểm -5% và mượn 2 bảng điểm lật tay.',
    totalPrice: 6300000,
    discountPercent: 5,
    discountAmount: 315000,
    finalPrice: 5985000,
    paymentMode: 'full_100',
    paymentModeLabel: 'Thanh toán đủ 100%',
    paidAmount: 5985000,
    remainingDue: 0,
    paymentMethod: 'vietqr',
    paymentStatus: 'paid_in_full',
    paymentStatusLabel: 'Đã thanh toán đủ',
    status: 'in_consultation',
    statusLabel: 'Đang tư vấn',
    createdAt: '16/10/2026 09:30',
    lastContactedAt: '16/10/2026 11:00',
    contactLogs: [
      {
        date: '16/10/2026 11:00',
        staffName: 'Quản lý (Admin)',
        note: 'Đã gọi tư vấn giảm 5% giờ chiều. Khách đồng ý, hẹn gửi danh sách VĐV trước 17h.'
      }
    ]
  },
  {
    id: 'REQ-03',
    code: 'YC-20261016-03',
    customerName: 'Anh Tuấn (Nhóm FC Tuổi Trẻ)',
    phone: '0904.556.778',
    customerType: 'trai_nghiem',
    customerTypeLabel: 'Đặt sân',
    sport: 'football',
    sportLabel: 'Bóng Đá Mini',
    courtDetails: 'Toàn bộ 8 ô sàn',
    preferredSchedule: 'Thứ 7 hàng tuần',
    preferredTime: '17:00 – 19:00 (2h)',
    durationMonths: 2,
    source: 'phone_call',
    sourceLabel: 'Gọi Hotline',
    notes: 'Thuê trải nghiệm 2 tháng giữ cố định giờ vàng thứ 7.',
    totalPrice: 3200000,
    discountPercent: 0,
    discountAmount: 0,
    finalPrice: 3200000,
    paymentMode: 'full_100',
    paymentModeLabel: 'Thanh toán đủ 100%',
    paidAmount: 3200000,
    remainingDue: 0,
    paymentMethod: 'vietqr',
    paymentStatus: 'paid_in_full',
    paymentStatusLabel: 'Đã thanh toán đủ',
    status: 'pending',
    statusLabel: 'Chờ liên hệ',
    createdAt: '16/10/2026 08:30',
    contactLogs: []
  },
  {
    id: 'REQ-04',
    code: 'YC-20261015-08',
    customerName: 'Bạn Hoàng Nam',
    phone: '0988.123.456',
    customerType: 'trai_nghiem',
    customerTypeLabel: 'Đặt sân',
    sport: 'badminton',
    sportLabel: 'Cầu Lông (1 Sân)',
    courtDetails: 'Sân 05',
    preferredSchedule: 'Tối nay 16/10/2026',
    preferredTime: '19:30 – 21:00 (1.5h)',
    source: 'direct_counter',
    sourceLabel: 'Tại quầy',
    notes: 'Khách đến quầy nhờ xếp 1.5h tối nay.',
    totalPrice: 180000,
    discountPercent: 0,
    discountAmount: 0,
    finalPrice: 180000,
    paymentMode: 'full_100',
    paymentModeLabel: 'Thanh toán 100%',
    paidAmount: 180000,
    remainingDue: 0,
    paymentMethod: 'vietqr',
    paymentStatus: 'paid_in_full',
    paymentStatusLabel: 'Đã thanh toán đủ',
    status: 'confirmed',
    statusLabel: 'Đã chốt đặt sân',
    createdAt: '15/10/2026 17:20',
    lastContactedAt: '15/10/2026 17:25',
    contactLogs: [
      {
        date: '15/10/2026 17:25',
        staffName: 'Lễ tân',
        note: 'Đã nhận đủ 180.000đ qua VietQR và xuất vé QR.'
      }
    ]
  }
];

const STORAGE_KEY = 'courtx_booking_requests';

export function getStoredBookingRequests(): BookingRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_BOOKING_REQUESTS));
      return INITIAL_BOOKING_REQUESTS;
    }
    const storedRequests: Array<BookingRequest | { customerType: 'vip_monthly' }> = JSON.parse(raw);
    return storedRequests.filter(
      (request): request is BookingRequest => request.customerType !== 'vip_monthly'
    );
  } catch {
    return INITIAL_BOOKING_REQUESTS;
  }
}

export function saveBookingRequests(requests: BookingRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
  } catch (e) {
    console.error('Failed to save booking requests to localStorage', e);
  }
}

export function addBookingRequest(newReq: BookingRequest): void {
  try {
    const current = getStoredBookingRequests();
    const updated = [newReq, ...current];
    saveBookingRequests(updated);
  } catch (e) {
    console.error('Failed to add booking request', e);
  }
}
