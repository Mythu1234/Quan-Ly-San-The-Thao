import { useState } from 'react';
import {
  Menu,
  User as UserIcon,
  LogOut,
  AlertTriangle,
  Calendar,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Dumbbell,
  Settings,
} from 'lucide-react';
import AdminSchedulePage from '../AdminSchedulePage';
import AdminSetupReminderPage from '../AdminSetupReminderPage';
import ShiftScheduleView from '../../components/admin/ShiftScheduleView';
import EmployeeProfileView from '../../components/employee/EmployeeProfileView';
import FacilityManagementView from '../../components/admin/FacilityManagementView';
import type { Employee, ShiftRegistration, FacilityEquipment, CourtStatusItem, FacilityIncident } from '../../types/admin';
import { INITIAL_EMPLOYEES, INITIAL_SHIFTS, INITIAL_EQUIPMENT, INITIAL_COURT_STATUSES, INITIAL_INCIDENTS } from '../../types/admin';

export type EmployeeTab = 'lich_san' | 'nhan_vien' | 'ca_truc' | 'co_so_vat_chat';

export default function EmployeeDashboard({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EmployeeTab>('ca_truc');
  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [shifts, setShifts] = useState<ShiftRegistration[]>(INITIAL_SHIFTS);

  // Facility management states
  const [equipments, setEquipments] = useState<FacilityEquipment[]>(INITIAL_EQUIPMENT);
  const [courtStatuses, setCourtStatuses] = useState<CourtStatusItem[]>(INITIAL_COURT_STATUSES);
  const [incidents, setIncidents] = useState<FacilityIncident[]>(INITIAL_INCIDENTS);

  // States for lich_san tab
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [intervalMode, setIntervalMode] = useState<30 | 60>(30);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  // Shift handlers
  const handleAddShift = (shift: Omit<ShiftRegistration, 'id'>) => {
    const newShift: ShiftRegistration = {
      ...shift,
      id: `SH-${Math.floor(Math.random() * 1000)}`
    };
    setShifts([...shifts, newShift]);
  };

  const handleDeleteShift = (id: string, reason?: string, permanent?: boolean) => {
    if (permanent) {
      setShifts((prev) => prev.filter((s) => s.id !== id));
    } else {
      setShifts(
        shifts.map((s) => (s.id === id ? { ...s, status: 'cancelled', cancelReason: reason || 'Nhân viên hủy' } : s))
      );
    }
  };

  // Facility handlers
  const handleAddEquipment = (newEq: FacilityEquipment) => {
    setEquipments([newEq, ...equipments]);
  };

  const handleUpdateEquipmentLocation = (equipmentCode: string, newLocation: string) => {
    setEquipments(equipments.map(eq => eq.code === equipmentCode ? { ...eq, currentLocation: newLocation } : eq));
  };

  const handleToggleCourtLock = (courtId: string, isLocked: boolean, reason?: string) => {
    setCourtStatuses(courtStatuses.map(c => c.id === courtId ? {
      ...c,
      isLocked,
      lockReason: isLocked ? (reason || 'Bảo trì kỹ thuật') : undefined,
      lockedAt: isLocked ? 'Vừa xong' : undefined,
    } : c));
  };

  const handleSubmitIncident = (newIncident: FacilityIncident, lockCourt: boolean) => {
    setIncidents([newIncident, ...incidents]);
    if (lockCourt && newIncident.courtId) {
      handleToggleCourtLock(newIncident.courtId, true, newIncident.title);
    }
  };

  const handleUpdateIncidentStatus = (incidentId: string, newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc', unlockCourt?: boolean) => {
    setIncidents(incidents.map(i => {
      if (i.id === incidentId) {
        return {
          ...i,
          status: newStatus,
          statusLabel: newStatus === 'da_khac_phuc' ? 'Đã khắc phục' : newStatus === 'dang_sua_chua' ? 'Đang sửa chữa' : 'Chờ xử lý',
          isCourtLocked: newStatus !== 'da_khac_phuc' ? i.isCourtLocked : false,
        };
      }
      return i;
    }));

    if (unlockCourt) {
      const targetInc = incidents.find(i => i.id === incidentId);
      if (targetInc?.courtId) {
        handleToggleCourtLock(targetInc.courtId, false);
      }
    }
  };

  // Trả thiết bị về kho chung khi check-out hoặc điều phối
  const handleReturnToWarehouse = (equipmentCode: string) => {
    setEquipments(prev => prev.map(eq => eq.code === equipmentCode ? {
      ...eq,
      currentLocation: 'Kho chung',
      status: 'san_sang',
      statusLabel: 'Sẵn sàng',
      healthRate: 'Sẵn sàng điều phối',
      assignedBookingCode: undefined,
      assignedTimeSlot: undefined,
      assignedCustomer: undefined,
      assignedCourt: undefined,
    } : eq));
  };

  // Ghi nhận ca đặt sân cho thiết bị
  const handleAssignBookingToEquipment = (
    equipmentCode: string,
    courtName: string,
    timeSlot: string,
    bookingCode: string,
    customerName: string
  ) => {
    setEquipments(prev => prev.map(eq => eq.code === equipmentCode ? {
      ...eq,
      currentLocation: courtName,
      status: 'dang_su_dung',
      statusLabel: 'Đang sử dụng',
      assignedBookingCode: bookingCode || 'BK-8491',
      assignedTimeSlot: timeSlot || '06:00 - 07:30',
      assignedCustomer: customerName || 'Khách đặt sân',
      assignedCourt: courtName,
    } : eq));
  };

  // Tự động thu hồi thiết bị của sân về Kho chung khi Check-out sân
  const handleCheckoutCourtEquipment = (courtName: string, _timeSlot?: string) => {
    setEquipments(prev => prev.map(eq => {
      if (eq.currentLocation === courtName || eq.assignedCourt === courtName) {
        return {
          ...eq,
          currentLocation: 'Kho chung',
          status: 'san_sang',
          statusLabel: 'Sẵn sàng',
          healthRate: 'Sẵn sàng điều phối (Đã thu hồi về kho)',
          assignedBookingCode: undefined,
          assignedTimeSlot: undefined,
          assignedCustomer: undefined,
          assignedCourt: undefined,
        };
      }
      return eq;
    }));
  };

  const handleTabChange = (tabId: EmployeeTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  // Helper functions for lich_san tab
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const formatDate = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  const dateDisplay = (isToday(selectedDate) ? 'Hôm nay, ' : '') + formatDate(selectedDate);
  const htmlDate = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
  const showScheduleControls = !isCheckoutMode && !isSetupMode;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 w-full animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
      {/* 📱 LEFT SIDEBAR DRAWER (Giống chủ, nhưng không có Ví & Thu) */}
      {sidebarOpen && (
        <div className="absolute inset-0 z-[200] flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />

          <div className="relative w-64 bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left-full duration-200">
            {/* Drawer Header */}
            <div className="h-14 flex items-center px-4 border-b border-slate-100 bg-emerald-700">
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-emerald-700 font-black mr-2 text-xs">
                CX
              </div>
              <span className="font-black text-white tracking-tight">COURTX SPORT</span>
            </div>

            {/* Menu Items (Lịch sân, Nhân viên, Ca trực, Cơ sở vật chất, Cài đặt - KHÔNG CÓ VÍ & THU) */}
            <div className="flex-1 py-4 px-3 space-y-1">
              <div
                onClick={() => handleTabChange('lich_san')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${
                  activeTab === 'lich_san'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Lịch sân
              </div>

              <div
                onClick={() => handleTabChange('nhan_vien')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${
                  activeTab === 'nhan_vien'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserIcon className="w-4 h-4" /> Hồ sơ cá nhân
              </div>

              <div
                onClick={() => handleTabChange('ca_truc')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${
                  activeTab === 'ca_truc'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CalendarClock className="w-4 h-4" /> Ca trực
              </div>

              <div
                onClick={() => handleTabChange('co_so_vat_chat')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${
                  activeTab === 'co_so_vat_chat'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Dumbbell className="w-4 h-4" /> Cơ sở vật chất
              </div>

              <div className="flex items-center gap-3 text-slate-600 px-3 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 cursor-pointer">
                <Settings className="w-4 h-4" /> Cài đặt
              </div>
            </div>

            {/* Drawer User Info Footer */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                  <UserIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-700">Nguyễn Văn An</div>
                  <div className="text-slate-500 scale-90 origin-left">Nhân viên trực ca</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ⚡ MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        {/* TOP HEADER (Giống thanh header của chủ với nút Menu mở sidebar bên trái) */}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-2 shrink-0 z-30 shadow-sm relative">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-emerald-700 active:scale-95 bg-emerald-50 rounded-lg cursor-pointer"
            title="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center">
            <span className="font-black text-slate-800 tracking-tight uppercase text-sm">
              COURTX HUB
            </span>
            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Cổng Nhân Viên
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* 🟢 1. LỊCH SÂN TAB */}
        {activeTab === 'lich_san' && (
          <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
            {showScheduleControls && (
              <button
                type="button"
                onClick={() => {
                  setIsCheckoutMode(false);
                  setIsSetupMode(true);
                }}
                className="bg-red-50 border-b border-red-100 px-3 py-2.5 flex gap-2 shrink-0 items-start text-left active:bg-red-100"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[12px] text-red-800 font-medium leading-relaxed pr-2">
                  <strong className="font-bold">Nhắc nhở setup mặt sân:</strong> Cần setup chuyển đổi cụm sân 1-4 thành sân bóng chuyền BC1 trước <strong className="font-bold underline">09:30</strong>. Lịch bóng chuyền bắt đầu lúc 09:30.
                </p>
              </button>
            )}

            {showScheduleControls && (
              <div className="bg-white border-b border-slate-200 px-3 py-2.5 flex flex-col gap-2 shrink-0 z-20 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1 w-full relative">
                  <button
                    type="button"
                    onClick={handlePrevDay}
                    className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 relative z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div
                    className="flex items-center justify-center flex-1 relative h-8 mx-2 cursor-pointer"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input[type="date"]');
                      if (input && 'showPicker' in input) {
                        try {
                          (input as HTMLInputElement).showPicker();
                        } catch {}
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 pointer-events-none">
                      <span className="text-[13px] font-black text-slate-800">{dateDisplay}</span>
                      <Calendar className="w-4 h-4 text-slate-600 shrink-0" strokeWidth={2.5} />
                    </div>
                    <input
                      type="date"
                      value={htmlDate}
                      onChange={(e) => {
                        if (e.target.value) setSelectedDate(new Date(e.target.value));
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNextDay}
                    className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 relative z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2 mt-1">
                  <div className="relative bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1 shadow-sm shrink-0">
                    <LayoutGrid className="w-3 h-3" /> Dòng thời gian {intervalMode === 30 ? '30p' : '1h'}
                    <select
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={intervalMode}
                      onChange={(e) => setIntervalMode(Number(e.target.value) as 30 | 60)}
                    >
                      <option value={30}>Dòng thời gian 30 phút</option>
                      <option value={60}>Dòng thời gian 1 tiếng</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {isSetupMode ? (
              <AdminSetupReminderPage onBack={() => setIsSetupMode(false)} />
            ) : (
              <AdminSchedulePage
                onCheckoutModeChange={setIsCheckoutMode}
                onBookingCheckout={handleCheckoutCourtEquipment}
              />
            )}
          </div>
        )}

        {/* 🟢 2. CA TRỰC TAB */}
        {activeTab === 'ca_truc' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            <ShiftScheduleView
              employees={employees}
              shifts={shifts}
              onAddShift={handleAddShift}
              onDeleteShift={handleDeleteShift}
            />
          </div>
        )}

        {/* 🟢 3. HỒ SƠ CÁ NHÂN (CHỈ HIỂN THỊ THÔNG TIN RIÊNG CỦA NHÂN VIÊN ĐÓ) */}
        {activeTab === 'nhan_vien' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            <EmployeeProfileView
              employee={employees[0]}
              onViewMyShifts={() => setActiveTab('ca_truc')}
            />
          </div>
        )}

        {/* 🟢 4. CƠ SỞ VẬT CHẤT TAB (Giống chủ) */}
        {activeTab === 'co_so_vat_chat' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            <FacilityManagementView
              equipments={equipments}
              courts={courtStatuses}
              incidents={incidents}
              onAddEquipment={handleAddEquipment}
              onUpdateEquipmentLocation={handleUpdateEquipmentLocation}
              onToggleCourtLock={handleToggleCourtLock}
              onSubmitIncident={handleSubmitIncident}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onReturnToWarehouse={handleReturnToWarehouse}
              onAssignBookingToEquipment={handleAssignBookingToEquipment}
            />
          </div>
        )}
      </div>
    </div>
  );
}
