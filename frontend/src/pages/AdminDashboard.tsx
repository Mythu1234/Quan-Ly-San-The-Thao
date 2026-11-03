import EmployeeProfileView from '../components/employee/EmployeeProfileView';
import {staffAuthService} from '../services/staffAuthService';
import type { IncidentReporter } from '../utils/incidentStorage';
import useFacilityOperations from '../hooks/useFacilityOperations';
import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import AdminSchedulePage from './AdminSchedulePage';
import AdminSetupReminderPage from './AdminSetupReminderPage';
import StaffList from '../components/admin/StaffList';
import AddStaffView from '../components/admin/AddStaffView';
import StaffDetailView from '../components/admin/StaffDetailView';
import EditStaffView from '../components/admin/EditStaffView';
import WalletRevenueView from '../components/admin/WalletRevenueView';
import FacilityManagementView from '../components/admin/FacilityManagementView';
import type { Employee, Transaction } from '../types/admin';
import { employeeApiService } from '../services/employeeService';
import { paymentBookingService } from '../services/paymentBookingService';

export default function AdminDashboard({ onLogout, currentUser }: { onLogout: () => void; currentUser: IncidentReporter }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'lich_san' | 'nhan_vien' | 'vi_thu' | 'co_so_vat_chat' | 'ho_so'>('lich_san');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [staffError,setStaffError]=useState('');
  const currentEmployee=employees.find(employee=>currentUser.id?employee.id===currentUser.id:employee.phone===currentUser.phone);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [staffSubView, setStaffSubView] = useState<'list' | 'add' | 'detail' | 'edit'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const handleTabChange = (tabId: 'lich_san' | 'nhan_vien' | 'vi_thu' | 'co_so_vat_chat' | 'ho_so') => {
    setActiveTab(tabId);
    setSidebarOpen(false);
    if (tabId === 'nhan_vien') {
      setStaffSubView('list');
      employeeApiService.getEmployees().then((res) => {
        if (res.employees) {
          setEmployees(res.employees);
          setStaffError('');
          setIsBackendOnline(true);
        }
      }).catch(error=>setStaffError(error instanceof Error?error.message:'Chưa tải được nhân viên.'));
    }
  };

  // State for backend connectivity status
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const refresh=()=>{void employeeApiService.getEmployees().then(result => {
      if(mounted){setEmployees(result.employees);setStaffError('');setIsBackendOnline(true);}
    }).catch(error=>{if(mounted)setStaffError(error instanceof Error?error.message:'Chưa tải được nhân viên.');});};
    refresh();const timer=setInterval(refresh,15000);window.addEventListener('focus',refresh);
    return () => { mounted = false;clearInterval(timer);window.removeEventListener('focus',refresh); };
  }, []);

  // Load real transactions from Supabase for Thống kê đặt sân
  useEffect(() => {
    let mounted = true;
    const loadTransactions = async () => {
      setTransactionsLoading(true);
      try {
        const data = await paymentBookingService.fetchAllTransactions();
        if (mounted) setTransactions(data);
      } catch {
        // fallback: keep current state
      } finally {
        if (mounted) setTransactionsLoading(false);
      }
    };
    void loadTransactions();
    // Refresh every 30s to catch new bookings
    const timer = setInterval(() => { void loadTransactions(); }, 30000);
    window.addEventListener('focus', () => { void loadTransactions(); });
    return () => { mounted = false; clearInterval(timer); };
  }, []);

  // Staff handlers connected to backend
  const handleAddNewStaff = () => setStaffSubView('add');
  const handleSelectEmployee = async (emp: Employee) => {
    try {
      const saved=await employeeApiService.getEmployeeById(emp.id);
      if(!saved)throw Error('Tài khoản không còn tồn tại.');
      setSelectedEmployee(saved);setStaffError('');setStaffSubView('detail');
    }catch(error){setStaffError(error instanceof Error?error.message:'Chưa tải được chi tiết tài khoản.');}
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
      console.warn('Backend update failed:', err);
      setPopup({
        type: 'danger',
        title: 'Không thể cập nhật nhân viên',
        message: err.message || 'Lỗi khi cập nhật thông tin nhân viên vào cơ sở dữ liệu!',
        confirmText: 'Đóng',
      });
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
      console.error('Backend create failed:', err);
      setPopup({
        type: 'danger',
        title: 'Không thể thêm nhân viên',
        message: err.message || 'Lỗi khi lưu nhân viên vào cơ sở dữ liệu. Vui lòng kiểm tra lại số điện thoại hoặc email!',
        confirmText: 'Đã hiểu',
      });
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

  const {equipments, incidents, courtStatuses, facilityError, refreshFacility, completeCheckout,
    handleAddEquipment, handleUpdateEquipmentLocation, handleToggleCourtLock, handleDeleteIncident,
    handleSubmitIncident, handleUpdateIncidentStatus, handleReturnToWarehouse,
    handleAssignBookingToEquipment, handleAddTimelineLog, handleCompleteEquipmentWarranty} = useFacilityOperations();

  return (
    <div data-admin-dashboard="true" className="flex h-screen bg-slate-50 text-slate-900 w-full animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden">
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
                onClick={() => handleTabChange('nhan_vien')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${activeTab === 'nhan_vien' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Users className="w-4 h-4" /> Nhân viên
              </div>
              <button type="button" onClick={()=>handleTabChange('ho_so')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${activeTab==='ho_so'?'bg-emerald-700 text-white shadow-sm':'text-slate-600 hover:bg-slate-50'}`}><UserIcon className="h-4 w-4"/>Hồ sơ cá nhân</button>
              <div
                onClick={() => handleTabChange('vi_thu')}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm cursor-pointer ${activeTab === 'vi_thu' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Wallet className="w-4 h-4" /> Thống kê đặt sân
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
                  <div className="font-bold text-slate-700">{currentUser.name}</div>
                  <div className="text-slate-500 scale-90 origin-left">{currentEmployee?.email || currentUser.phone}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        {staffError&&<p role="alert" className="m-3 rounded-xl bg-red-50 p-3 text-xs text-red-600">{staffError}</p>}

        {facilityError && <div role="alert" className="m-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{facilityError}<button type="button" onClick={()=>void refreshFacility()} className="ml-2 font-bold underline">Thử lại</button></div>}
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-2 shrink-0 z-30 shadow-sm relative">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center text-emerald-700 active:scale-95 bg-emerald-50 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-black text-slate-800 tracking-tight uppercase text-sm">COURTX HUB</span>
            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Đang mở cửa
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogout} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 hover:bg-red-50 hover:text-red-600 transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>
        {activeTab==='ho_so'&&<div className="flex-1 overflow-auto">{currentEmployee?<EmployeeProfileView employee={currentEmployee}
          onChangePassword={async(currentPassword,newPassword)=>{await staffAuthService.changePassword(currentEmployee.id,currentPassword,newPassword);}}
          onUpdatePhone={async phone=>{const saved=await employeeApiService.updateEmployee(currentEmployee.id,{phone});setEmployees(previous=>previous.map(employee=>employee.id===saved.id?saved:employee));}}
        />:<p className="p-4 text-xs text-slate-500">Đang tải hồ sơ tài khoản...</p>}</div>}

        {activeTab === 'lich_san' && (
          <>
            {isSetupMode ? (
              <AdminSetupReminderPage onBack={() => setIsSetupMode(false)} />
            ) : (
              <AdminSchedulePage
                equipments={equipments}
                incidents={incidents}
                currentUser={currentUser}
                onCompleteCheckout={completeCheckout}
                courtStatuses={courtStatuses}
              />
            )}
          </>
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
          <div className="min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 relative custom-scrollbar">
            <WalletRevenueView
              transactions={transactions}
              onProcessRefund={handleProcessRefund}
              isLoading={transactionsLoading}
            />
          </div>
        )}

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
