import useCompleteCheckout from '../../hooks/useCompleteCheckout';
import { useStoredIncidents, mergeIncidents, writeIncidentSnapshot, type IncidentReporter } from '../../utils/incidentStorage';
import { useState, useEffect } from 'react';
import {
  Menu,
  User as UserIcon,
  LogOut,
  LayoutGrid,
  Dumbbell,
} from 'lucide-react';
import AdminSchedulePage from '../AdminSchedulePage';
import AdminSetupReminderPage from '../AdminSetupReminderPage';
import EmployeeProfileView from '../../components/employee/EmployeeProfileView';
import FacilityManagementView from '../../components/admin/FacilityManagementView';
import { saveLocalEquipment, withLocalEquipment } from '../../utils/localEquipment';
import { facilityApiService, FacilitySaveError } from '../../services/facilityService';
import useCourtAvailability from '../../hooks/useCourtAvailability';
import type { Employee, FacilityEquipment, FacilityIncident } from '../../types/admin';
import { INITIAL_EMPLOYEES, INITIAL_EQUIPMENT } from '../../types/admin';
import { employeeApiService } from '../../services/employeeService';

export type EmployeeTab = 'lich_san' | 'nhan_vien' | 'co_so_vat_chat';

export default function EmployeeDashboard({ onLogout, currentUser }: { onLogout: () => void; currentUser: IncidentReporter }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EmployeeTab>('lich_san');
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);

  // Facility management states
  const [equipments, setEquipments] = useState<FacilityEquipment[]>(() => withLocalEquipment(INITIAL_EQUIPMENT));
  const [courtStatuses, setCourtStatuses] = useCourtAvailability();
  const [incidents, setIncidents] = useStoredIncidents();

  // States for lich_san tab
  const [isSetupMode, setIsSetupMode] = useState(false);

  // Load backend data on mount
  useEffect(() => {
    let isMounted = true;
    employeeApiService
      .getEmployees()
      .then((empRes) => {
        if (isMounted && empRes.isBackendOnline && empRes.employees.length > 0) {
          setEmployees(empRes.employees);
        }
      })
      .catch(console.warn);

    facilityApiService.loadAllFacilityData().then((data) => {
      if (isMounted && data.isBackendOnline) {
        setEquipments(withLocalEquipment(data.equipments));
        setCourtStatuses(data.courts);
        setIncidents(previous => mergeIncidents(data.incidents, previous));
      }
    }).catch(console.warn);

    return () => {
      isMounted = false;
    };
  }, []);

  // Employee Profile Handlers
  const handleUpdateCurrentEmployeePassword = async (newPassword: string) => {
    const currentEmp = employees[0];
    if (!currentEmp) return;
    try {
      await employeeApiService.updateEmployee(currentEmp.id, {
        ...currentEmp,
        password: newPassword,
      });
    } catch (err) {
      console.warn('Backend update password failed, keeping local state:', err);
    }
  };

  const handleUpdateCurrentEmployeePhone = async (newPhone: string) => {
    const currentEmp = employees[0];
    if (!currentEmp) return;
    const updated = { ...currentEmp, phone: newPhone };
    setEmployees((prev) => [updated, ...prev.slice(1)]);
    try {
      await employeeApiService.updateEmployee(currentEmp.id, updated);
    } catch (err) {
      console.warn('Backend update phone failed, keeping local state:', err);
    }
  };

  // Facility handlers
  const handleAddEquipment = async (newEq: FacilityEquipment) => {
    try {
      const created = await facilityApiService.createEquipment(newEq);
      setEquipments((previous) => [created, ...previous]);
    } catch (error) {
      if (error instanceof FacilitySaveError) throw error;
      saveLocalEquipment(newEq);
      setEquipments((previous) => [newEq, ...previous]);
    }
  };

  const handleUpdateEquipmentLocation = (equipmentCode: string, newLocation: string) => {
    setEquipments(equipments.map(eq => eq.code === equipmentCode ? { ...eq, currentLocation: newLocation } : eq));
  };

  const handleToggleCourtLock = async (courtId: string, isLocked: boolean, reason?: string) => {
    setCourtStatuses(courtStatuses.map(c => c.id === courtId ? {
      ...c,
      isLocked,
      lockReason: isLocked ? (reason || 'Bảo trì kỹ thuật') : undefined,
      lockedAt: isLocked ? 'Vừa xong' : undefined,
    } : c));
    try {
      const updated = await facilityApiService.toggleCourtLock(courtId, isLocked, reason);
      setCourtStatuses(previous => previous.map(c => c.id === courtId ? updated : c));
    } catch (error) { console.warn('Court lock saved locally:', error); }
  };

  const completeCheckout = useCompleteCheckout(incidents, setIncidents, equipments, setEquipments);

  const handleDeleteIncident = async (id: string) => {
    const now = new Date().toISOString();
    let tombstone: FacilityIncident | undefined;
    try { tombstone = await facilityApiService.deleteIncident(id); }
    catch (error) { if (error instanceof FacilitySaveError) throw error; }
    const next = incidents.map(incident => incident.id === id ? (tombstone || { ...incident, deletedAt: now, updatedAt: now }) : incident);
    await writeIncidentSnapshot(next);
    setIncidents(next);
  };

  const handleSubmitIncident = async (newIncident: FacilityIncident, _lockCourt: boolean) => {
    try {
      const result = await facilityApiService.createIncident({ ...newIncident, lockCourt: false });
      setIncidents(previous => [result.incident, ...previous]);
      return;
    } catch (error) { console.warn('Report saved locally:', error); }
    const saved = [newIncident, ...incidents];
    await writeIncidentSnapshot(saved);
    setIncidents(saved);
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

  const handleAddTimelineLog = async (incidentId: string, title: string, description: string, images: string[] = []) => {
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newLog = {
      id: `TL-${Date.now()}`,
      time: nowTime,
      title,
      description,
      images,
      active: true,
    };
    setIncidents(prev =>
      prev.map(i =>
        i.id === incidentId
          ? {
              ...i,
              timelineLogs: [newLog, ...(i.timelineLogs || []).map(l => ({ ...l, active: false }))],
              updatedAt: new Date().toISOString(),
            }
          : i
      )
    );
    try {
      const saved = await facilityApiService.addTimelineLog(incidentId, title, description, images);
      setIncidents(previous => previous.map(item => item.id === incidentId ? saved : item));
    } catch (error) { console.warn('Timeline saved locally:', error); }
  };

  const handleCompleteEquipmentWarranty = async (equipmentCode: string, equipmentName?: string) => {
    const today = new Date().toLocaleDateString('vi-VN');
    const formattedDate = `Hôm nay (${today})`;

    // 1. Update equipment state
    setEquipments(prev =>
      prev.map(eq =>
        eq.code === equipmentCode
          ? {
              ...eq,
              status: 'san_sang',
              statusLabel: 'Sẵn sàng',
              healthRate: 'Tốt (Đã nghiệm thu)',
              lastMaintenance: formattedDate,
            }
          : eq
      )
    );

    try {
      await facilityApiService.updateEquipment(equipmentCode, {
        status: 'san_sang', statusLabel: 'Sẵn sàng',
        healthRate: 'Tốt (Đã nghiệm thu)', lastMaintenance: formattedDate,
      });
    } catch (error) { console.warn('Backend equipment update error:', error); }

    // 2. Find related incident and append timeline log
    const relatedInc =
      incidents.find(
        i =>
          i.equipmentCode === equipmentCode ||
          i.damageItems?.some(d => d.equipmentCode === equipmentCode)
      ) || incidents[0];

    if (relatedInc) {
      const logTitle = `Nghiệm thu thiết bị [${equipmentCode}]`;
      const logDesc = `Đã nghiệm thu thiết bị ${equipmentName ? `${equipmentName} (${equipmentCode})` : equipmentCode}. Thiết bị chuyển sang trạng thái Sẵn sàng.`;
      handleAddTimelineLog(relatedInc.id, logTitle, logDesc);
    }
  };

  const handleTabChange = (tabId: EmployeeTab) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };



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

            {/* Menu Items (Lịch sân, Cơ sở vật chất, Hồ sơ cá nhân) */}
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
                onClick={() => handleTabChange('co_so_vat_chat')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${
                  activeTab === 'co_so_vat_chat'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Dumbbell className="w-4 h-4" /> Cơ sở vật chất
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
            </div>

            {/* Drawer User Info Footer */}
            <div
              onClick={() => handleTabChange('nhan_vien')}
              className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 cursor-pointer hover:bg-emerald-50/50 transition"
              title="Xem Hồ sơ cá nhân"
            >
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
            {isSetupMode ? (
              <AdminSetupReminderPage onBack={() => setIsSetupMode(false)} />
            ) : (
              <AdminSchedulePage
                equipments={equipments}
                incidents={incidents}
                currentUser={currentUser}
                onCompleteCheckout={completeCheckout}
              />
            )}
          </div>
        )}

        {/* 🟢 2. CƠ SỞ VẬT CHẤT TAB (Giống chủ) */}
        {activeTab === 'co_so_vat_chat' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            <FacilityManagementView
              currentUser={currentUser}
              equipments={equipments}
              courts={courtStatuses}
              incidents={incidents}
              onAddEquipment={handleAddEquipment}
              onUpdateEquipmentLocation={handleUpdateEquipmentLocation}
              onToggleCourtLock={handleToggleCourtLock}
              onDeleteIncident={handleDeleteIncident}
              onSubmitIncident={handleSubmitIncident}
              onUpdateIncidentStatus={handleUpdateIncidentStatus}
              onReturnToWarehouse={handleReturnToWarehouse}
              onAssignBookingToEquipment={handleAssignBookingToEquipment}
              onCompleteEquipmentWarranty={handleCompleteEquipmentWarranty}
              onAddTimelineLog={handleAddTimelineLog}
            />
          </div>
        )}

        {/* 🟢 3. HỒ SƠ CÁ NHÂN (CHỈ HIỂN THỊ THÔNG TIN RIÊNG CỦA NHÂN VIÊN ĐÓ) */}
        {activeTab === 'nhan_vien' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            <EmployeeProfileView
              employee={employees[0]}
              onUpdatePhone={handleUpdateCurrentEmployeePhone}
              onChangePassword={handleUpdateCurrentEmployeePassword}
            />
          </div>
        )}
      </div>
    </div>
  );
}
