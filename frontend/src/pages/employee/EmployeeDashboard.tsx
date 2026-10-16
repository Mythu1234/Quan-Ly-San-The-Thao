import { useState } from 'react';
import { LogOut, AlertTriangle, Calendar, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';
import AdminSchedulePage from '../AdminSchedulePage';
import AdminSetupReminderPage from '../AdminSetupReminderPage';
import ShiftScheduleView from '../../components/admin/ShiftScheduleView';
import StaffList from '../../components/admin/StaffList';
import AdminBottomNav from '../../components/admin/AdminBottomNav';
import type { AdminTab } from '../../components/admin/AdminBottomNav';
import type { Employee, ShiftRegistration } from '../../types/admin';
import { INITIAL_EMPLOYEES, INITIAL_SHIFTS } from '../../types/admin';

export default function EmployeeDashboard({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('ca_truc');
  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [shifts, setShifts] = useState<ShiftRegistration[]>(INITIAL_SHIFTS);

  // States for lich_san tab
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [intervalMode, setIntervalMode] = useState<30 | 60>(30);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

  const handleAddShift = (shift: Omit<ShiftRegistration, 'id'>) => {
    const newShift: ShiftRegistration = {
      ...shift,
      id: `SH-${Math.floor(Math.random() * 1000)}`
    };
    setShifts([...shifts, newShift]);
  };

  const handleDeleteShift = (id: string, reason?: string) => {
    setShifts(shifts.map(s => s.id === id ? { ...s, status: 'cancelled', cancelReason: reason || 'Nhân viên hủy' } : s));
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
    <div className="flex h-screen bg-slate-50 text-slate-900 w-full animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden pb-14">
      {/* 📱 MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ⚡ MAIN CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* TOP HEADER */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <span className="text-lg font-black">C</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 leading-none">COURT<span className="text-emerald-600">X</span></span>
              </div>
              <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5">
                CỔNG NHÂN VIÊN
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-700">Nguyễn Văn An</p>
              <p className="text-[10px] font-semibold text-emerald-600">Nhân viên trực ca</p>
            </div>
            <button 
              onClick={onLogout}
              className="h-9 px-3 rounded-full bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-red-100 transition active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </header>

        {/* 🟢 LỊCH SÂN TAB (Identical to Admin) */}
        {activeTab === 'lich_san' && (
          <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
            {showScheduleControls && <button
              type="button"
              onClick={() => {
                setIsCheckoutMode(false);
                setIsSetupMode(true);
              }}
              className="bg-red-50 border-b border-red-100 px-3 py-2.5 flex gap-2 shrink-0 items-start text-left active:bg-red-100"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-800 font-medium leading-relaxed pr-2">
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

                <button onClick={handleNextDay} className="w-8 h-8 flex items-center justify-center text-slate-500 bg-white rounded shadow-sm active:scale-95 relative z-10">
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
            </div>}

            {isSetupMode ? (
              <AdminSetupReminderPage onBack={() => setIsSetupMode(false)} />
            ) : (
              <AdminSchedulePage onCheckoutModeChange={setIsCheckoutMode} />
            )}
          </div>
        )}

        {/* Scrollable Area for other tabs */}
        {activeTab !== 'lich_san' && (
          <div className="flex-1 overflow-auto bg-slate-50 relative custom-scrollbar">
            {activeTab === 'ca_truc' && (
              <ShiftScheduleView
                employees={employees}
                shifts={shifts}
                onAddShift={handleAddShift}
                onDeleteShift={handleDeleteShift}
              />
            )}
            {activeTab === 'nhan_vien' && (
              <StaffList 
                employees={employees} 
                onAddNew={() => {}} 
                onSelectEmployee={() => {}} 
                onDeleteEmployee={() => {}} 
                onToggleStatus={() => {}} 
                readOnly={true}
              />
            )}
            {activeTab === 'vi_thu' && (
              <div className="p-8 text-center text-slate-500 text-sm font-bold">Tính năng không khả dụng cho nhân viên.</div>
            )}
          </div>
        )}
      </div>
      
      {/* BOTTOM NAV */}
      <AdminBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
