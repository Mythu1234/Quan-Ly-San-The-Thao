import { useState } from 'react';
import { Menu, User as UserIcon, AlertTriangle, Calendar, ChevronLeft, ChevronRight, LogOut, Settings, LayoutGrid } from 'lucide-react';
import AdminSchedulePage from './AdminSchedulePage';
import AdminSetupReminderPage from './AdminSetupReminderPage';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [intervalMode, setIntervalMode] = useState<30 | 60>(30);
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);

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
      {sidebarOpen && (
        <div className="absolute inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />

          <div className="relative w-64 bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-left-full duration-200">
            <div className="h-14 flex items-center px-4 border-b border-slate-100 bg-emerald-700">
              <div className="w-7 h-7 bg-white rounded flex items-center justify-center text-emerald-700 font-black mr-2 text-xs">CX</div>
              <span className="font-black text-white tracking-tight">COURTX SPORT</span>
            </div>
            <div className="flex-1 py-4 px-3 space-y-1">
              <div className="flex items-center gap-3 bg-emerald-700 text-white px-3 py-3 rounded-xl font-bold text-sm shadow-sm cursor-pointer">
                <LayoutGrid className="w-4 h-4" /> Bảng lịch sân
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
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 flex items-center justify-center text-emerald-700 active:scale-95 bg-emerald-50 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <span className="font-black text-slate-800 tracking-tight uppercase text-sm">COURTX HUB</span>
            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Đang mở cửa
            </span>
          </div>
          <button onClick={onLogout} className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 active:scale-95 hover:bg-red-50 hover:text-red-600 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

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
    </div>
  );
}
