import { useState, useMemo } from 'react';
import { Menu, User as UserIcon, AlertTriangle, Calendar, CalendarClock, ChevronLeft, ChevronRight, LogOut, Settings, LayoutGrid, Users, Wallet, Dumbbell, ClipboardList } from 'lucide-react';
import AdminSchedulePage from './AdminSchedulePage';
import AdminSetupReminderPage from './AdminSetupReminderPage';
import AdminBookingRequestsView from '../components/admin/AdminBookingRequestsView';
import ShiftScheduleView from '../components/admin/ShiftScheduleView';
import StaffList from '../components/admin/StaffList';
import AddStaffView from '../components/admin/AddStaffView';
import StaffDetailView from '../components/admin/StaffDetailView';
import EditStaffView from '../components/admin/EditStaffView';
import WalletRevenueView from '../components/admin/WalletRevenueView';
import FacilityManagementView from '../components/admin/FacilityManagementView';
import { getStoredBookingRequests } from '../types/bookingRequest';
import type { Employee, ShiftRegistration, Transaction, FacilityEquipment, CourtStatusItem, FacilityIncident } from '../types/admin';
import { INITIAL_EMPLOYEES, INITIAL_SHIFTS, INITIAL_TRANSACTIONS, INITIAL_EQUIPMENT, INITIAL_COURT_STATUSES, INITIAL_INCIDENTS } from '../types/admin';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [intervalMode, setIntervalMode] = useState<30 | 60>(30);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  // My states
  const [activeTab, setActiveTab] = useState<'lich_san' | 'yeu_cau_dat_san' | 'nhan_vien' | 'ca_truc' | 'vi_thu' | 'co_so_vat_chat'>('lich_san');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [shifts, setShifts] = useState<ShiftRegistration[]>(INITIAL_SHIFTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [equipments, setEquipments] = useState<FacilityEquipment[]>(INITIAL_EQUIPMENT);
  const [courtStatuses, setCourtStatuses] = useState<CourtStatusItem[]>(INITIAL_COURT_STATUSES);
  const [incidents, setIncidents] = useState<FacilityIncident[]>(INITIAL_INCIDENTS);
  const [staffSubView, setStaffSubView] = useState<'list' | 'add' | 'detail' | 'edit'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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

  const pendingRequestsCount = useMemo(() => {
    try {
      return getStoredBookingRequests().filter(r => r.status === 'pending').length;
    } catch {
      return 0;
    }
  }, [activeTab]);

  const handleTabChange = (tabId: 'lich_san' | 'yeu_cau_dat_san' | 'nhan_vien' | 'ca_truc' | 'vi_thu' | 'co_so_vat_chat') => {
    setActiveTab(tabId);
    setSidebarOpen(false);
    if (tabId === 'nhan_vien') setStaffSubView('list');
  };

  // Staff handlers
  const handleAddNewStaff = () => setStaffSubView('add');
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStaffSubView('detail');
  };
  const handleEditEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStaffSubView('edit');
  };
  const handleUpdateEmployee = (updatedEmp: Employee) => {
    setEmployees(employees.map(e => (e.id === updatedEmp.id ? updatedEmp : e)));
    setSelectedEmployee(updatedEmp);
    setStaffSubView('detail');
  };
  const handleSaveEmployee = (emp: Omit<Employee, 'id'>) => {
    const newEmp: Employee = { ...emp, id: `NV-0${Math.floor(Math.random() * 100) + 50}` };
    setEmployees([...employees, newEmp]);
    setStaffSubView('list');
  };
  const handleDeleteEmployee = (id: string, name: string) => {
    if (window.confirm(`Xóa nhân viên ${name}?`)) {
      setEmployees(employees.filter(e => e.id !== id));
      if (staffSubView === 'detail' && selectedEmployee?.id === id) {
        setStaffSubView('list');
      }
    }
  };
  const handleToggleStatus = (id: string) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e));
  };
  const handleProcessRefund = (id: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: 'refunded', statusLabel: 'Đã hoàn tiền' } : t));
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

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 w-full animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
      {sidebarOpen && (
        <div className="absolute inset-0 z-[200] flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />

          <div className="relative w-64 bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left-full duration-200">
            <div className="h-14 flex items-center px-4 border-b border-slate-100 bg-emerald-700">
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-emerald-700 font-black mr-2 text-xs">CX</div>
              <span className="font-black text-white tracking-tight">COURTX SPORT</span>
            </div>
            <div className="flex-1 py-4 px-3 space-y-1">
              <div 
                onClick={() => handleTabChange('lich_san')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${activeTab === 'lich_san' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutGrid className="w-4 h-4" /> Lịch sân
              </div>
              <div 
                onClick={() => handleTabChange('yeu_cau_dat_san')}
                className={`flex items-center justify-between px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${activeTab === 'yeu_cau_dat_san' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4" /> Yêu cầu đặt sân
                </div>
                {pendingRequestsCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'yeu_cau_dat_san' ? 'bg-white text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {pendingRequestsCount} chờ
                  </span>
                )}
              </div>
              <div
                onClick={() => handleTabChange('nhan_vien')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${activeTab === 'nhan_vien' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Users className="w-4 h-4" /> Nhân viên
              </div>
              <div
                onClick={() => handleTabChange('ca_truc')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${activeTab === 'ca_truc' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <CalendarClock className="w-4 h-4" /> Ca trực
              </div>
              <div
                onClick={() => handleTabChange('vi_thu')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${activeTab === 'vi_thu' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Wallet className="w-4 h-4" /> Ví & Thu
              </div>
              <div
                onClick={() => handleTabChange('co_so_vat_chat')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${activeTab === 'co_so_vat_chat' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Dumbbell className="w-4 h-4" /> Cơ sở vật chất
              </div>
              <div className="flex items-center gap-3 text-slate-600 px-3 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 cursor-pointer">
                <Settings className="w-4 h-4" /> Cài đặt
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                  <UserIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-xs">
                  <div className="font-bold text-slate-700">Ban Quản Trị</div>
                  <div className="text-slate-500 scale-90 origin-left">admin@courtx.vn</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-2 shrink-0 z-30 shadow-sm relative">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center text-emerald-700 active:scale-95 bg-emerald-50 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('yeu_cau_dat_san')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 cursor-pointer ${
                activeTab === 'yeu_cau_dat_san'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Tiếp nhận yêu cầu {pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ''}</span>
            </button>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-slate-800 tracking-tight uppercase text-sm">COURTX HUB</span>
            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Đang mở cửa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTabChange('yeu_cau_dat_san')}
              className={`sm:hidden flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition active:scale-95 cursor-pointer ${
                activeTab === 'yeu_cau_dat_san'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              <ClipboardList className="w-3 h-3" />
              <span>Yêu cầu {pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ''}</span>
            </button>
            <button onClick={onLogout} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 hover:bg-red-50 hover:text-red-600 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {activeTab === 'lich_san' && (
          <>
            {showScheduleControls && <button
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
            </button>}

            {showScheduleControls && <div className="bg-white border-b border-slate-200 px-3 py-2.5 flex flex-col gap-2 shrink-0 z-20 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between bg-slate-100 rounded-lg p-1 w-full relative">
                <button onClick={handlePrevDay} className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 relative z-10">
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
                    <span className="text-[15px] font-black text-slate-800">{dateDisplay}</span>
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

                <button onClick={handleNextDay} className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 relative z-10">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2 mt-1">
                <div className="relative bg-emerald-700 text-white text-[12px] font-bold px-3 py-2 rounded flex items-center gap-1.5 shadow-sm shrink-0">
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
            </div>}

            {isSetupMode ? (
              <AdminSetupReminderPage onBack={() => setIsSetupMode(false)} />
            ) : (
              <AdminSchedulePage
                onCheckoutModeChange={setIsCheckoutMode}
                onBookingCheckout={handleCheckoutCourtEquipment}
              />
            )}
          </>
        )}

        {activeTab === 'yeu_cau_dat_san' && (
          <AdminBookingRequestsView />
        )}

        {activeTab === 'nhan_vien' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            {staffSubView === 'list' && (
              <StaffList
                employees={employees}
                onSelectEmployee={handleSelectEmployee}
                onAddNew={handleAddNewStaff}
                onDeleteEmployee={handleDeleteEmployee}
                onToggleStatus={handleToggleStatus}
              />
            )}
            {staffSubView === 'add' && (
              <AddStaffView
                onBack={() => setStaffSubView('list')}
                onSaveEmployee={handleSaveEmployee}
              />
            )}
            {staffSubView === 'detail' && selectedEmployee && (
              <StaffDetailView
                employee={selectedEmployee}
                onViewSchedule={() => setActiveTab('ca_truc')}
                onDeleteEmployee={handleDeleteEmployee}
                onEditEmployee={handleEditEmployee}
              />
            )}
            {staffSubView === 'edit' && selectedEmployee && (
              <EditStaffView
                employee={selectedEmployee}
                onBack={() => setStaffSubView('detail')}
                onSaveEmployee={handleUpdateEmployee}
              />
            )}
          </div>
        )}

        {activeTab === 'ca_truc' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            <ShiftScheduleView
              employees={employees}
              shifts={shifts}
              onAddShift={(newShift) => setShifts((prev) => [...prev, newShift])}
              onAddMultipleShifts={(newShifts) => setShifts((prev) => [...prev, ...newShifts])}
              onDeleteMultipleShifts={(shiftIds, permanent, reason) => {
                setShifts((prev) =>
                  permanent
                    ? prev.filter((s) => !shiftIds.includes(s.id))
                    : prev.map((s) => (shiftIds.includes(s.id) ? { ...s, status: 'cancelled', cancelReason: reason } : s))
                );
              }}
              onUpdateShift={(updatedShift) => {
                setShifts((prev) => prev.map((s) => (s.id === updatedShift.id ? updatedShift : s)));
              }}
              onDeleteShift={(shiftId, reason, permanent) => {
                setShifts((prev) =>
                  permanent
                    ? prev.filter((s) => s.id !== shiftId)
                    : prev.map((s) => (s.id === shiftId ? { ...s, status: 'cancelled', cancelReason: reason } : s))
                );
              }}
              isAdmin={true}
            />
          </div>
        )}

        {activeTab === 'vi_thu' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            <WalletRevenueView
              transactions={transactions}
              onProcessRefund={handleProcessRefund}
            />
          </div>
        )}

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
