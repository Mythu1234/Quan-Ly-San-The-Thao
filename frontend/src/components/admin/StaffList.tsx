import { useState } from 'react';
import {
  Users,
  Search,
  X,
  MoreVertical,
  UserPlus,
  Phone,
  Trash2,
  Eye,
  Ban,
  Bell,
} from 'lucide-react';
import type { Employee } from '../../types/admin';
import NotificationModal from './NotificationModal';

interface StaffListProps {
  employees: Employee[];
  onSelectEmployee: (emp: Employee) => void;
  onAddNew: () => void;
  onDeleteEmployee: (empId: string, empName: string, reason?: string) => void;
  onToggleStatus: (empId: string) => void;
  readOnly?: boolean;
  isBackendOnline?: boolean;
}

export default function StaffList({
  employees,
  onSelectEmployee,
  onAddNew,
  onDeleteEmployee,
  onToggleStatus,
  readOnly = false,
  isBackendOnline: _isBackendOnline = false,
}: StaffListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'inactive'>('all');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    if (filterMode === 'active' && emp.status !== 'active') return false;
    if (filterMode === 'inactive' && emp.status !== 'inactive') return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.phone.includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
  });

  // Render Notification Screen if active
  if (showNotificationModal) {
    return (
      <NotificationModal
        onBack={() => setShowNotificationModal(false)}
      />
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200">
      {/* 🟢 Top Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            QUẢN TRỊ NHÂN VIÊN
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNotificationModal(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
          title="Thông báo hệ thống"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-600 ring-2 ring-white" />
        </button>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          QUẢN LÝ NHÂN VIÊN
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Quản lý tài khoản, thông tin liên hệ và phân quyền nhân sự sân CourtX.
        </p>
      </div>

      {/* 🟢 Search bar & Action */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhân viên theo tên, SĐT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-emerald-600 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition cursor-pointer"
              title="Xóa tìm kiếm"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="flex h-11 items-center justify-center gap-1.5 px-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition shadow-xs cursor-pointer text-xs font-bold shrink-0"
          title="Tìm kiếm"
        >
          <Search className="w-4 h-4 stroke-[2.2]" />
          <span>Tìm kiếm</span>
        </button>
      </form>

      {/* 🟢 Quick filter tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={[
            'rounded-full px-3.5 py-1.5 font-bold transition whitespace-nowrap cursor-pointer',
            filterMode === 'all'
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          ].join(' ')}
        >
          Tất cả {employees.length}
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('active')}
          className={[
            'rounded-full px-3.5 py-1.5 font-bold transition whitespace-nowrap cursor-pointer',
            filterMode === 'active'
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          ].join(' ')}
        >
          Đang hoạt động
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('inactive')}
          className={[
            'rounded-full px-3.5 py-1.5 font-bold transition whitespace-nowrap cursor-pointer',
            filterMode === 'inactive'
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
          ].join(' ')}
        >
          Ngừng hoạt động
        </button>
      </div>

      {/* 🟢 Staff List Cards */}
      <div className="space-y-3">
        {filteredEmployees.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">Không tìm thấy nhân viên phù hợp</p>
            <p className="text-xs text-slate-400">
              {filterMode !== 'all'
                ? 'Không có nhân viên nào trong trạng thái này.'
                : 'Thử tìm kiếm với số điện thoại hoặc từ khóa khác.'}
            </p>
            {filterMode !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="mt-2 text-xs font-bold text-emerald-600 underline cursor-pointer"
              >
                Quay về danh sách mặc định
              </button>
            )}
          </div>
        ) : (
          filteredEmployees.map((emp) => {
            const isMenuOpen = activeMenuId === emp.id;
            return (
              <div
                key={emp.id}
                className="relative rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs transition hover:shadow-xs"
              >
                {/* Top Info Row */}
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => onSelectEmployee(emp)}
                    className="flex items-center gap-3 cursor-pointer flex-1"
                  >
                    {/* Avatar with status indicator */}
                    <div className="relative">
                      <div
                        className={[
                          'flex h-12 w-12 items-center justify-center rounded-2xl font-black text-sm border',
                          emp.avatarBg,
                        ].join(' ')}
                      >
                        {emp.avatarText}
                      </div>
                      <span
                        className={[
                          'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white',
                          emp.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400',
                        ].join(' ')}
                      />
                    </div>

                    {/* Name & Phone */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{emp.name}</span>
                        <span
                          className={[
                            'rounded-full px-2 py-0.5 text-[10px] font-bold',
                            emp.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500',
                          ].join(' ')}
                        >
                          {emp.status === 'active' ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3-dots action menu */}
                  {!readOnly && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(isMenuOpen ? null : emp.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-8 z-30 w-48 rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onSelectEmployee(emp);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" /> Xem chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onToggleStatus(emp.id);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5 text-amber-500" />
                          {emp.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onDeleteEmployee(emp.id, emp.name);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Xóa nhân viên
                        </button>
                      </div>
                    )}
                  </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🟢 Action Button: + THÊM NHÂN VIÊN MỚI */}
      {!readOnly && (
        <button
          type="button"
          onClick={onAddNew}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
        >
          <UserPlus className="w-4 h-4 stroke-[2.2]" />
          <span>THÊM NHÂN VIÊN MỚI</span>
        </button>
      )}
    </div>
  );
}
