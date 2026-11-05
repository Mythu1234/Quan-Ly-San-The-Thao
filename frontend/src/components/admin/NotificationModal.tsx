import { useEffect, useState } from 'react';
import { NOTIFICATION_STORAGE_KEY, readNotifications, retainNotifications, writeNotifications } from '../../utils/notificationRetention';
import type { SystemNotification } from '../../utils/notificationRetention';
export type { SystemNotification } from '../../utils/notificationRetention';
import {
  ChevronLeft,
  Bell,
  AlertTriangle,
  Calendar,
  UserCheck,
  CheckCheck,
  CheckCircle2,
} from 'lucide-react';

const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NOTIF-01',
    type: 'incident',
    typeLabel: 'Sự cố sân',
    title: 'Sự cố đèn chiếu sáng tại Sân CL-03',
    message: 'Bóng cao áp số 2 bị chập chờn. Hệ thống đã kích hoạt khóa bảo trì Sân CL-03.',
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    isRead: false,
    priority: 'high',
  },
  {
    id: 'NOTIF-02',
    type: 'booking',
    typeLabel: 'Lịch đặt sân',
    title: 'Khách hàng đặt trước Sân CL-02',
    message: 'Khách hàng vừa thanh toán đủ 100% qua VietQR cho khung giờ 18:00 - 20:00.',
    createdAt: new Date(Date.now() - 25 * 60_000).toISOString(),
    isRead: false,
    priority: 'normal',
  },
  {
    id: 'NOTIF-04',
    type: 'staff',
    typeLabel: 'Nhân sự',
    title: 'Cập nhật thông tin nhân viên',
    message: 'Nhân viên Nguyễn Văn An vừa cập nhật số điện thoại liên hệ cá nhân.',
    createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    isRead: true,
    priority: 'normal',
  },
  {
    id: 'NOTIF-05',
    type: 'system',
    typeLabel: 'Hệ thống CourtX',
    title: 'Cập nhật bảng giá niêm yết sân',
    message: 'Bảng giá tiêu chuẩn: Cầu lông 120.000 VND, Bóng chuyền 150.000 VND, Bóng đá mini 200.000 VND/giờ/sân.',
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    isRead: true,
    priority: 'normal',
  },
];

interface NotificationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBack?: () => void;
  onNavigate?: (notif: SystemNotification) => void;
}

export default function NotificationModal({ isOpen, onClose, onBack, onNavigate }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => readNotifications(DEFAULT_NOTIFICATIONS));
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [now, setNow] = useState(Date.now);

  useEffect(() => { writeNotifications(notifications); }, [notifications]);

  useEffect(() => {
    const refresh = () => {
      const timestamp = Date.now();
      setNow(timestamp);
      setNotifications((previous) => {
        const retained = retainNotifications(previous, timestamp);
        return retained.length === previous.length ? previous : retained;
      });
    };
    const onVisibility = () => { if (!document.hidden) refresh(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === NOTIFICATION_STORAGE_KEY || event.key === null) {
        const next = readNotifications();
        setNotifications((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      }
    };
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibility);
    refresh();
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const formatTime = (createdAt: string) => {
    const minutes = Math.max(0, Math.floor((now - Date.parse(createdAt)) / 60_000));
    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} giờ trước`;
    return new Date(createdAt).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  };

  // If isOpen is explicitly false, do not render
  if (isOpen === false) return null;

  const handleBack = onBack || onClose || (() => {});

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'incident':
        return <AlertTriangle className="w-4 h-4 text-red-700" />;
      case 'booking':
        return <Calendar className="w-4 h-4 text-emerald-800" />;
      case 'staff':
        return <UserCheck className="w-4 h-4 text-emerald-800" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-800" />;
    }
  };

  const getBadgeBg = (type: SystemNotification['type']) => {
    switch (type) {
      case 'incident':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'booking':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'staff':
        return 'bg-white text-emerald-800 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 space-y-3 p-3 pb-6 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* 🟢 Top Badge & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Quay lại"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h1 className="text-base font-bold text-slate-900">Thông báo</h1>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 border border-slate-200">
          <Bell className="w-3.5 h-3.5 text-emerald-600" />
          <span>{unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}</span>
        </div>
      </div>

      {/* 🟢 Filter Bar & Read All */}
      <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl bg-white border border-slate-200 p-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
              filter === 'all'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] transition cursor-pointer ${
              filter === 'unread'
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* 🟢 Notification Cards List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 text-center text-slate-600">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            <p className="text-xs font-semibold text-slate-700">{filter === 'unread' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo trong 3 tháng gần đây'}</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                handleMarkAsRead(notif.id);
                if (onNavigate) onNavigate(notif);
              }}
              className={`p-3 rounded-xl border transition cursor-pointer relative ${
                notif.isRead
                  ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  : 'bg-white border-emerald-400 text-slate-900 hover:bg-emerald-50/30'
              }`}
            >
              {!notif.isRead && (
                <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-600" />
              )}

              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${getBadgeBg(notif.type)}`}>
                      {notif.typeLabel}
                    </span>
                    <span className="text-[10px] text-slate-500">{formatTime(notif.createdAt)}</span>
                  </div>

                  <h4 className="text-[12px] font-bold leading-snug text-slate-900">
                    {notif.title}
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="pt-1 text-center text-[11px] leading-relaxed text-slate-400">
        Thông báo được lưu trong 3 tháng và tự động xóa khi hết hạn.
      </p>

    </div>
  );
}
