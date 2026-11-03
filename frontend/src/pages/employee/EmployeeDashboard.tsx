import {staffAuthService} from '../../services/staffAuthService';
import type { IncidentReporter } from '../../utils/incidentStorage';
import useFacilityOperations from '../../hooks/useFacilityOperations';
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
import type { Employee } from '../../types/admin';
import { employeeApiService } from '../../services/employeeService';

export type EmployeeTab = 'lich_san' | 'nhan_vien' | 'co_so_vat_chat';

export default function EmployeeDashboard({ onLogout, currentUser }: { onLogout: () => void; currentUser: IncidentReporter }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EmployeeTab>('lich_san');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [profileError,setProfileError]=useState('');
  const currentEmployee=employees.find(employee=>currentUser.id?employee.id===currentUser.id:employee.phone===currentUser.phone);
  const handleTabChange=(tab:EmployeeTab)=>{setActiveTab(tab);setSidebarOpen(false);};

  // Facility management states

  // States for lich_san tab
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refresh=()=>{void employeeApiService.getEmployees().then(result => {
      if(mounted){setEmployees(result.employees);setProfileError('');}
    }).catch(error=>{if(mounted)setProfileError(error instanceof Error?error.message:'Chưa tải được hồ sơ.');});};
    refresh();const timer=setInterval(refresh,15000);window.addEventListener('focus',refresh);
    return () => { mounted = false;clearInterval(timer);window.removeEventListener('focus',refresh); };
  }, []);

  // Employee Profile Handlers
  const handleUpdateCurrentEmployeePassword = async (currentPassword:string,newPassword:string) => {
    if(!currentEmployee)throw Error('Chưa tải được hồ sơ tài khoản hiện tại.');
    await staffAuthService.changePassword(currentEmployee.id,currentPassword,newPassword);
  };
  const handleUpdateCurrentEmployeePhone = async (newPhone:string) => {
    if(!currentEmployee)throw Error('Chưa tải được hồ sơ tài khoản hiện tại.');
    const saved=await employeeApiService.updateEmployee(currentEmployee.id,{phone:newPhone});
    setEmployees(previous=>previous.map(employee=>employee.id===saved.id?saved:employee));
  };

  const {equipments, incidents, courtStatuses, facilityError, refreshFacility, completeCheckout,
    handleAddEquipment, handleUpdateEquipmentLocation, handleToggleCourtLock, handleDeleteIncident,
    handleSubmitIncident, handleUpdateIncidentStatus, handleReturnToWarehouse,
    handleAssignBookingToEquipment, handleAddTimelineLog, handleCompleteEquipmentWarranty} = useFacilityOperations();

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
        {facilityError && <div role="alert" className="m-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{facilityError}<button type="button" onClick={()=>void refreshFacility()} className="ml-2 font-bold underline">Thử lại</button></div>}
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
            {profileError&&<p role="alert" className="p-4 text-xs text-red-600">{profileError}</p>}
            {currentEmployee?<EmployeeProfileView
              employee={currentEmployee}
              onUpdatePhone={handleUpdateCurrentEmployeePhone}
              onChangePassword={handleUpdateCurrentEmployeePassword}
            />:<p className="p-4 text-xs text-slate-500">Đang tải hồ sơ tài khoản...</p>}
          </div>
        )}
      </div>
    </div>
  );
}
