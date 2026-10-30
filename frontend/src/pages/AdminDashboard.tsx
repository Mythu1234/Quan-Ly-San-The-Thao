import { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  User as UserIcon,
  AlertTriangle,
  LogOut,
  LayoutGrid,
  Users,
  Wallet,
  Dumbbell,
  Trash2,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';
import AdminSchedulePage from './AdminSchedulePage';
import AdminSetupReminderPage from './AdminSetupReminderPage';
import AdminBookingRequestsView from '../components/admin/AdminBookingRequestsView';
import StaffList from '../components/admin/StaffList';
import AddStaffView from '../components/admin/AddStaffView';
import StaffDetailView from '../components/admin/StaffDetailView';
import EditStaffView from '../components/admin/EditStaffView';
import WalletRevenueView from '../components/admin/WalletRevenueView';
import FacilityManagementView from '../components/admin/FacilityManagementView';
import { getStoredBookingRequests } from '../types/bookingRequest';
import type { Employee, Transaction, FacilityEquipment, CourtStatusItem, FacilityIncident } from '../types/admin';
import { INITIAL_EMPLOYEES, INITIAL_TRANSACTIONS, INITIAL_EQUIPMENT, INITIAL_COURT_STATUSES, INITIAL_INCIDENTS } from '../types/admin';
import { employeeApiService } from '../services/employeeService';
import { facilityApiService } from '../services/facilityService';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const showScheduleControls = !isCheckoutMode && !isSetupMode;
  
  const [activeTab, setActiveTab] = useState<'lich_san' | 'yeu_cau_dat_san' | 'nhan_vien' | 'vi_thu' | 'co_so_vat_chat'>('lich_san');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [equipments, setEquipments] = useState<FacilityEquipment[]>(INITIAL_EQUIPMENT);
  const [courtStatuses, setCourtStatuses] = useState<CourtStatusItem[]>(INITIAL_COURT_STATUSES);
  const [incidents, setIncidents] = useState<FacilityIncident[]>(INITIAL_INCIDENTS);
  const [staffSubView, setStaffSubView] = useState<'list' | 'add' | 'detail' | 'edit'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const pendingRequestsCount = useMemo(() => {
    try {
      return getStoredBookingRequests().filter(r => r.status === 'pending').length;
    } catch {
      return 0;
    }
  }, [activeTab]);

  const handleTabChange = (tabId: 'lich_san' | 'yeu_cau_dat_san' | 'nhan_vien' | 'vi_thu' | 'co_so_vat_chat') => {
    setActiveTab(tabId);
    setSidebarOpen(false);
    if (tabId === 'nhan_vien') setStaffSubView('list');
  };

  // State for backend connectivity status
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  // Load employees, facility data, and shifts from backend API on mount
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      try {
        const [empRes, facRes] = await Promise.all([
          employeeApiService.getEmployees(),
          facilityApiService.loadAllFacilityData(),
        ]);
        if (isMounted) {
          setEmployees(empRes.employees);
          setIsBackendOnline(empRes.isBackendOnline || facRes.isBackendOnline);
          if (facRes.isBackendOnline) {
            setEquipments(facRes.equipments);
            setCourtStatuses(facRes.courts);
            setIncidents(facRes.incidents);
          }
        }
      } catch (err) {
        console.warn('Could not load data from backend, using local state:', err);
      }
    };
    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Staff handlers connected to backend
  const handleAddNewStaff = () => setStaffSubView('add');
  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStaffSubView('detail');
  };
  const handleEditEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setStaffSubView('edit');
  };

  const handleUpdateEmployee = async (updatedEmp: Employee, newPassword?: string) => {
    try {
      const saved = await employeeApiService.updateEmployee(updatedEmp.id, {
        ...updatedEmp,
        password: newPassword,
      });
      setEmployees((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
      setSelectedEmployee(saved);
      setStaffSubView('detail');
      setPopup({
        type: 'alert',
        title: 'Cập nhật thành công',
        message: `Đã lưu các thay đổi cho nhân viên "${saved.name}" (Mã: ${saved.id}) vào cơ sở dữ liệu!`,
        confirmText: 'Đóng',
      });
    } catch (err: any) {
      console.warn('Backend update failed, applying locally:', err);
      setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));
      setSelectedEmployee(updatedEmp);
      setStaffSubView('detail');
    }
  };

  const handleSaveEmployee = async (emp: Employee, password?: string) => {
    try {
      const created = await employeeApiService.createEmployee({
        name: emp.name,
        phone: emp.phone,
        email: emp.email,
        role: emp.role,
        status: emp.status,
        avatarText: emp.avatarText,
        avatarBg: emp.avatarBg,
        avatarImage: emp.avatarImage,
        password,
      });
      setEmployees((prev) => [created, ...prev]);
      setStaffSubView('list');
      setPopup({
        type: 'alert',
        title: 'Thêm nhân viên thành công',
        message: `Đã thêm mới nhân viên "${created.name}" (Mã số: ${created.id}) vào hệ thống CourtX!`,
        confirmText: 'Đóng',
      });
    } catch (err: any) {
      console.warn('Backend create failed, saving locally:', err);
      const newEmp: Employee = { ...emp, id: emp.id || `NV-0${Math.floor(Math.random() * 100) + 50}` };
      setEmployees((prev) => [newEmp, ...prev]);
      setStaffSubView('list');
    }
  };

  // Custom common popup state
  const [popup, setPopup] = useState<{
    type: 'alert' | 'confirm' | 'danger';
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  } | null>(null);

  const handleDeleteEmployee = (id: string, name: string, reason?: string) => {
    setPopup({
      type: 'danger',
      title: 'Vô hiệu hóa nhân viên (UC-11)',
      message: `Bạn có chắc chắn muốn vô hiệu hóa tài khoản của nhân viên "${name}" khỏi hệ thống không? (Hệ thống sẽ chuyển trạng thái sang Đã nghỉ việc và bảo lưu toàn bộ lịch sử theo quy tắc Soft Delete).`,
      confirmText: 'Xác nhận vô hiệu hóa',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        try {
          const res = await employeeApiService.deleteEmployee(id, reason, false);
          if (res.employee) {
            setEmployees((prev) => prev.map((e) => (e.id === id ? res.employee! : e)));
          } else {
            setEmployees((prev) => prev.filter((e) => e.id !== id));
          }
          if (staffSubView === 'detail' && selectedEmployee?.id === id) {
            setStaffSubView('list');
          }
        } catch (err: any) {
          console.warn('Backend delete failed, applying locally:', err);
          setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, status: 'inactive' } : e)));
          if (staffSubView === 'detail' && selectedEmployee?.id === id) {
            setStaffSubView('list');
          }
        }
      },
    });
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await employeeApiService.toggleStatus(id);
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
      if (selectedEmployee?.id === id) {
        setSelectedEmployee(updated);
      }
    } catch (err: any) {
      console.warn('Backend toggle failed, toggling locally:', err);
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e))
      );
    }
  };
  const handleProcessRefund = (id: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, status: 'refunded', statusLabel: 'Đã hoàn tiền' } : t));
  };

  // Facility handlers connected to backend
  const handleAddEquipment = async (newEq: FacilityEquipment) => {
    try {
      const created = await facilityApiService.createEquipment(newEq);
      setEquipments((prev) => [created, ...prev]);
    } catch (err) {
      console.warn('Backend add equipment failed, adding locally:', err);
      setEquipments([newEq, ...equipments]);
    }
  };

  const handleUpdateEquipmentLocation = async (equipmentCode: string, newLocation: string) => {
    try {
      const updated = await facilityApiService.relocateEquipment(equipmentCode, newLocation);
      setEquipments((prev) => prev.map((eq) => (eq.code === equipmentCode ? updated : eq)));
    } catch (err) {
      console.warn('Backend relocate failed, applying locally:', err);
      setEquipments((prev) =>
        prev.map((eq) => (eq.code === equipmentCode ? { ...eq, currentLocation: newLocation } : eq))
      );
    }
  };

  const handleToggleCourtLock = async (courtId: string, isLocked: boolean, reason?: string) => {
    try {
      const updated = await facilityApiService.toggleCourtLock(courtId, isLocked, reason);
      setCourtStatuses((prev) => prev.map((c) => (c.id === courtId ? updated : c)));
    } catch (err) {
      console.warn('Backend court lock failed, applying locally:', err);
      setCourtStatuses((prev) =>
        prev.map((c) =>
          c.id === courtId
            ? {
                ...c,
                isLocked,
                lockReason: isLocked ? (reason || 'Bảo trì kỹ thuật') : undefined,
                lockedAt: isLocked ? 'Vừa xong' : undefined,
              }
            : c
        )
      );
    }
  };

  const handleSubmitIncident = async (newIncident: FacilityIncident, lockCourt: boolean) => {
    try {
      const res = await facilityApiService.createIncident({
        ...newIncident,
        lockCourt,
      });
      setIncidents((prev) => [res.incident, ...prev]);
      if (res.courtLocked && newIncident.courtId) {
        setCourtStatuses((prev) =>
          prev.map((c) =>
            c.id === newIncident.courtId
              ? { ...c, isLocked: true, lockReason: `Sự cố: ${newIncident.title}` }
              : c
          )
        );
      }
    } catch (err) {
      console.warn('Backend incident report failed, applying locally:', err);
      setIncidents([newIncident, ...incidents]);
      if (lockCourt && newIncident.courtId) {
        handleToggleCourtLock(newIncident.courtId, true, newIncident.title);
      }
    }
  };

  const handleUpdateIncidentStatus = async (
    incidentId: string,
    newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc',
    unlockCourt?: boolean
  ) => {
    try {
      const res = await facilityApiService.updateIncidentStatus(incidentId, newStatus, unlockCourt);
      setIncidents((prev) => prev.map((i) => (i.id === incidentId ? res.incident : i)));
      if (res.courtUnlocked) {
        const targetInc = incidents.find((i) => i.id === incidentId);
        if (targetInc?.courtId) {
          setCourtStatuses((prev) =>
            prev.map((c) => (c.id === targetInc.courtId ? { ...c, isLocked: false } : c))
          );
        }
      }
    } catch (err) {
      console.warn('Backend incident update failed, applying locally:', err);
      setIncidents(
        incidents.map((i) => {
          if (i.id === incidentId) {
            return {
              ...i,
              status: newStatus,
              statusLabel:
                newStatus === 'da_khac_phuc'
                  ? 'Đã khắc phục'
                  : newStatus === 'dang_sua_chua'
                  ? 'Đang sửa chữa'
                  : 'Chờ xử lý',
              isCourtLocked: newStatus !== 'da_khac_phuc' ? i.isCourtLocked : false,
            };
          }
          return i;
        })
      );
      if (unlockCourt) {
        const targetInc = incidents.find((i) => i.id === incidentId);
        if (targetInc?.courtId) {
          handleToggleCourtLock(targetInc.courtId, false);
        }
      }
    }
  };

  // Trả thiết bị về kho chung khi check-out hoặc điều phối
  const handleReturnToWarehouse = async (equipmentCode: string) => {
    try {
      const updated = await facilityApiService.returnToWarehouse(equipmentCode);
      setEquipments((prev) => prev.map((eq) => (eq.code === equipmentCode ? updated : eq)));
    } catch (err) {
      console.warn('Backend return to warehouse failed, applying locally:', err);
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.code === equipmentCode
            ? {
                ...eq,
                currentLocation: 'Kho chung',
                status: 'san_sang',
                statusLabel: 'Sẵn sàng',
                healthRate: 'Sẵn sàng điều phối',
                assignedBookingCode: undefined,
                assignedTimeSlot: undefined,
                assignedCustomer: undefined,
                assignedCourt: undefined,
              }
            : eq
        )
      );
    }
  };

  // Ghi nhận ca đặt sân cho thiết bị
  const handleAssignBookingToEquipment = async (
    equipmentCode: string,
    courtName: string,
    timeSlot: string,
    bookingCode: string,
    customerName: string
  ) => {
    try {
      const updated = await facilityApiService.relocateEquipment(equipmentCode, courtName, {
        bookingCode,
        timeSlot,
        customerName,
      });
      setEquipments((prev) => prev.map((eq) => (eq.code === equipmentCode ? updated : eq)));
    } catch (err) {
      console.warn('Backend assign booking failed, applying locally:', err);
      setEquipments((prev) =>
        prev.map((eq) =>
          eq.code === equipmentCode
            ? {
                ...eq,
                currentLocation: courtName,
                status: 'dang_su_dung',
                statusLabel: 'Đang sử dụng',
                assignedBookingCode: bookingCode || 'BK-8491',
                assignedTimeSlot: timeSlot || '06:00 - 07:30',
                assignedCustomer: customerName || 'Khách đặt sân',
                assignedCourt: courtName,
              }
            : eq
        )
      );
    }
  };

  // Tự động thu hồi thiết bị của sân về Kho chung khi Check-out sân
  const handleCheckoutCourtEquipment = async (courtName: string, _timeSlot?: string) => {
    try {
      const returnedList = await facilityApiService.checkoutCourtEquipments(courtName);
      const returnedCodes = new Set(returnedList.map((e) => e.code));
      setEquipments((prev) =>
        prev.map((eq) => {
          if (returnedCodes.has(eq.code)) {
            const found = returnedList.find((r) => r.code === eq.code);
            return found || eq;
          }
          return eq;
        })
      );
    } catch (err) {
      console.warn('Backend checkout court failed, applying locally:', err);
      setEquipments((prev) =>
        prev.map((eq) => {
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
        })
      );
    }
  };

  const handleAddTimelineLog = async (incidentId: string, title: string, description: string) => {
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newLog = {
      id: `TL-${Date.now()}`,
      time: nowTime,
      title,
      description,
      active: true,
    };
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              timelineLogs: [newLog, ...(i.timelineLogs || []).map((l) => ({ ...l, active: false }))],
            }
          : i
      )
    );
    try {
      await facilityApiService.addTimelineLog(incidentId, title, description);
    } catch (err) {
      console.warn('Backend timeline log error:', err);
    }
  };

  const handleCompleteEquipmentWarranty = async (equipmentCode: string, equipmentName?: string) => {
    const today = new Date().toLocaleDateString('vi-VN');
    const formattedDate = `Hôm nay (${today})`;

    // 1. Update equipment locally in AdminDashboard
    setEquipments((prev) =>
      prev.map((eq) =>
        eq.code === equipmentCode
          ? {
              ...eq,
              status: 'san_sang',
              statusLabel: 'Sẵn sàng',
              healthRate: 'Tốt (Đã nghiệm thu bảo hành)',
              lastMaintenance: formattedDate,
            }
          : eq
      )
    );

    // 2. Persist to backend
    try {
      await facilityApiService.updateEquipment(equipmentCode, {
        status: 'san_sang',
        statusLabel: 'Sẵn sàng',
        healthRate: 'Tốt (Đã nghiệm thu bảo hành)',
        lastMaintenance: formattedDate,
      });
    } catch (err) {
      console.warn('Backend equipment update error:', err);
    }

    // 3. Find related incident and append timeline log
    const relatedInc =
      incidents.find(
        (i) =>
          i.equipmentCode === equipmentCode ||
          i.damageItems?.some((d) => d.equipmentCode === equipmentCode)
      ) || incidents[0];

    if (relatedInc) {
      const logTitle = `Nghiệm thu hoàn tất bảo hành [${equipmentCode}]`;
      const logDesc = `Đã nghiệm thu thiết bị ${equipmentName ? `${equipmentName} (${equipmentCode})` : equipmentCode} sau bảo hành/sửa chữa. Thiết bị chuyển sang trạng thái Sẵn sàng vận hành.`;
      await handleAddTimelineLog(relatedInc.id, logTitle, logDesc);
    }
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
                isBackendOnline={isBackendOnline}
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
                onBack={() => setStaffSubView('list')}
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

        {activeTab === 'vi_thu' && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 relative custom-scrollbar">
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
              onCompleteEquipmentWarranty={handleCompleteEquipmentWarranty}
              onAddTimelineLog={handleAddTimelineLog}
              isBackendOnline={isBackendOnline}
            />
          </div>
        )}
      </div>

      {/* 🟣 CUSTOM POPUP THEO THIẾT KẾ CHUNG */}
      {popup && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-slate-100">
            {popup.type === 'danger' ? (
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Trash2 className="w-6 h-6 stroke-[2.2]" />
              </div>
            ) : popup.type === 'confirm' ? (
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              </div>
            )}

            <h3 className="text-base sm:text-lg font-black text-slate-900">{popup.title}</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 whitespace-pre-line leading-relaxed">{popup.message}</p>

            <div className={`mt-5 grid gap-2.5 ${popup.type === 'alert' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {popup.type !== 'alert' && (
                <button
                  type="button"
                  onClick={() => setPopup(null)}
                  className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                >
                  {popup.cancelText || 'Không, quay lại'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const current = popup;
                  setPopup(null);
                  if (current.onConfirm) {
                    setTimeout(() => current.onConfirm!(), 10);
                  }
                }}
                className={`rounded-xl py-3 text-xs font-black text-white active:scale-95 transition shadow-sm cursor-pointer ${
                  popup.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                {popup.confirmText || (popup.type === 'alert' ? 'Đóng' : 'Có, xác nhận')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
