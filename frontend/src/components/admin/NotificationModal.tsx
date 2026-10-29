import { useState } from 'react';
import {
  ChevronLeft,
  Bell,
  AlertTriangle,
  Calendar,
  UserCheck,
  CheckCheck,
  CheckCircle2,
} from 'lucide-react';

export interface SystemNotification {
  id: string;
  type: 'incident' | 'booking' | 'staff' | 'system';
  typeLabel: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  priority?: 'high' | 'normal';
}

const DEFAULT_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'NOTIF-01',
    type: 'incident',
    typeLabel: 'Sự cố sân',
    title: 'Sự cố đèn chiếu sáng tại Sân CL-03',
    message: 'Bóng cao áp số 2 bị chập chờn. Hệ thống đã kích hoạt khóa bảo trì Sân CL-03.',
    time: '5 phút trước',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'NOTIF-02',
    type: 'booking',
    typeLabel: 'Lịch đặt sân',
    title: 'Khách hàng đặt trước Sân CL-02',
    message: 'Khách hàng vừa hoàn tất thanh toán cọc cho khung giờ 18:00 - 20:00 tối nay.',
    time: '25 phút trước',
    isRead: false,
    priority: 'normal',
  },
  {
    id: 'NOTIF-04',
    type: 'staff',
    typeLabel: 'Nhân sự',
    title: 'Cập nhật thông tin nhân viên',
    message: 'Nhân viên Nguyễn Văn An vừa cập nhật số điện thoại liên hệ cá nhân.',
    time: '3 giờ trước',
    isRead: true,
    priority: 'normal',
  },
  {
    id: 'NOTIF-05',
    type: 'system',
    typeLabel: 'Hệ thống CourtX',
    title: 'Cập nhật bảng giá niêm yết sân',
    message: 'Chủ sân đã cập nhật đơn giá giờ cao điểm áp dụng từ ngày 15/10/2026.',
    time: 'Hôm qua',
    isRead: true,
    priority: 'normal',
  },
];

interface NotificationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onBack?: () => void;
}

export default function NotificationModal({ isOpen, onClose, onBack }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'booking':
        return <Calendar className="w-5 h-5 text-emerald-600" />;
      case 'staff':
        return <UserCheck className="w-5 h-5 text-purple-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-slate-600" />;
    }
  };

  const getBadgeBg = (type: SystemNotification['type']) => {
    switch (type) {
      case 'incident':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'booking':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'staff':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
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

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            THÔNG BÁO HỆ THỐNG
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 border border-slate-200 shadow-2xs">
          <Bell className="w-3.5 h-3.5 text-emerald-600" />
          <span>{unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}</span>
        </div>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          THÔNG BÁO <span className="text-emerald-600">HỆ THỐNG</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Cập nhật vận hành sân thể thao, lịch đặt sân và thông báo quản trị.
        </p>
      </div>

      {/* 🟢 Filter Bar & Read All */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-2 shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
              filter === 'unread'
                ? 'bg-emerald-600 text-white shadow-2xs'
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Đọc tất cả</span>
          </button>
        )}
      </div>

      {/* 🟢 Notification Cards List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-400 shadow-2xs">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
            <p className="text-sm font-bold text-slate-700">Không có thông báo mới nào</p>
            <p className="text-xs text-slate-400 mt-1">Tất cả thông báo trong hệ thống đã được đọc</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkAsRead(notif.id)}
              className={`p-4 rounded-3xl border transition cursor-pointer relative shadow-2xs ${
                notif.isRead
                  ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  : 'bg-emerald-50/50 border-emerald-300 text-slate-900 hover:bg-emerald-50/80'
              }`}
            >
              {!notif.isRead && (
                <span className="absolute top-4 right-4 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse" />
              )}

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 shrink-0 shadow-2xs mt-0.5">
                  {getIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${getBadgeBg(notif.type)}`}>
                      {notif.typeLabel}
                    </span>
                    <span className="text-[11px] text-slate-400 font-semibold">{notif.time}</span>
                  </div>

                  <h4 className={`text-sm tracking-tight ${notif.isRead ? 'font-bold text-slate-800' : 'font-black text-slate-900'}`}>
                    {notif.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
                    {notif.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🟢 Back button at bottom */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleBack}
          className="w-full rounded-2xl bg-slate-900 hover:bg-black py-3 text-xs font-black text-white active:scale-95 transition cursor-pointer shadow-md flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Quay lại màn hình quản lý</span>
        </button>
      </div>
    </div>
  );
}
