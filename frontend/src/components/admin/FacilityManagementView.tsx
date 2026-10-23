import { useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Plus,
  Bell,
  Search,
  ArrowRightLeft,
  ChevronRight,
  Layers,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Lock,
  Building2,
  X,
  Clock,
} from 'lucide-react';
import type { FacilityEquipment, CourtStatusItem, FacilityIncident } from '../../types/admin';
import ReportIncidentView from './ReportIncidentView';
import IncidentDetailView from './IncidentDetailView';
import AddEquipmentView from './AddEquipmentView';

interface FacilityManagementViewProps {
  equipments: FacilityEquipment[];
  courts: CourtStatusItem[];
  incidents: FacilityIncident[];
  onAddEquipment: (newEq: FacilityEquipment) => void;
  onUpdateEquipmentLocation: (equipmentCode: string, newLocation: string) => void;
  onToggleCourtLock: (courtId: string, isLocked: boolean, reason?: string) => void;
  onSubmitIncident: (newIncident: FacilityIncident, lockCourt: boolean) => void;
  onUpdateIncidentStatus: (incidentId: string, newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc', unlockCourt?: boolean) => void;
  onReturnToWarehouse?: (equipmentCode: string) => void;
  onAssignBookingToEquipment?: (
    equipmentCode: string,
    courtName: string,
    timeSlot: string,
    bookingCode: string,
    customerName: string
  ) => void;
}

export default function FacilityManagementView({
  equipments,
  courts,
  incidents,
  onAddEquipment,
  onUpdateEquipmentLocation,
  onToggleCourtLock,
  onSubmitIncident,
  onUpdateIncidentStatus,
  onReturnToWarehouse,
  onAssignBookingToEquipment,
}: FacilityManagementViewProps) {
  // Navigation sub-views: 'main' | 'report_incident' | 'incident_detail' | 'add_equipment'
  const [subView, setSubView] = useState<'main' | 'report_incident' | 'incident_detail' | 'add_equipment'>('main');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('SC-8921');

  // Filter & Search
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Court Lock Dialog
  const [lockingCourt, setLockingCourt] = useState<CourtStatusItem | null>(null);
  const [lockReasonInput, setLockReasonInput] = useState<string>('');

  // Equipment Relocate Dialog
  const [relocatingEq, setRelocatingEq] = useState<FacilityEquipment | null>(null);
  const [targetLocation, setTargetLocation] = useState<string>('Sân 01');
  const [isAssignBooking, setIsAssignBooking] = useState(false);
  const [assignBookingCode, setAssignBookingCode] = useState('BK-8491');
  const [assignTimeSlot, setAssignTimeSlot] = useState('06:00 - 07:30');
  const [assignCustomer, setAssignCustomer] = useState('Khách đặt sân');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handlers for Subviews
  const handleOpenIncidentDetail = (id: string) => {
    setSelectedIncidentId(id);
    setSubView('incident_detail');
  };

  const handleCreateIncident = (newIncident: FacilityIncident, lockCourt: boolean) => {
    onSubmitIncident(newIncident, lockCourt);
    setSubView('main');
    showToast(`Đã ghi nhận sự cố #${newIncident.id} thành công!`);
  };

  const handleAddNewEquipment = (newEq: FacilityEquipment) => {
    onAddEquipment(newEq);
    setSubView('main');
    showToast(`Đã thêm thiết bị [${newEq.code}] ${newEq.name}!`);
  };

  // Court toggle logic
  const handleCourtSwitchClick = (court: CourtStatusItem) => {
    if (court.isLocked) {
      // Unlock directly
      onToggleCourtLock(court.id, false);
      showToast(`Đã mở lại ${court.name} đón khách!`);
    } else {
      // Open dialog to input reason
      setLockingCourt(court);
      setLockReasonInput('Sửa thảm & kiểm tra thiết bị');
    }
  };

  const handleConfirmLockCourt = () => {
    if (!lockingCourt) return;
    onToggleCourtLock(lockingCourt.id, true, lockReasonInput.trim() || 'Bảo trì kỹ thuật');
    showToast(`Đã kích hoạt khóa bảo trì ${lockingCourt.name}!`);
    setLockingCourt(null);
  };

  // Equipment relocation & booking allocation
  const handleConfirmRelocate = () => {
    if (!relocatingEq) return;

    if (targetLocation === 'Kho chung') {
      if (onReturnToWarehouse) {
        onReturnToWarehouse(relocatingEq.code);
      } else {
        onUpdateEquipmentLocation(relocatingEq.code, 'Kho chung');
      }
      showToast(`Đã thu hồi [${relocatingEq.code}] về Kho chung an toàn!`);
    } else {
      if (isAssignBooking && onAssignBookingToEquipment) {
        onAssignBookingToEquipment(
          relocatingEq.code,
          targetLocation,
          assignTimeSlot.trim() || '06:00 - 07:30',
          assignBookingCode.trim() || 'BK-8491',
          assignCustomer.trim() || 'Khách đặt sân'
        );
        showToast(`Đã gán [${relocatingEq.code}] vào ${targetLocation} ca ${assignTimeSlot}!`);
      } else {
        onUpdateEquipmentLocation(relocatingEq.code, targetLocation);
        showToast(`Đã điều phối [${relocatingEq.code}] sang ${targetLocation}!`);
      }
    }

    setRelocatingEq(null);
    setIsAssignBooking(false);
  };

  // KPI Calculations
  const urgentIncidentsCount = incidents.filter(i => i.status !== 'da_khac_phuc').length;
  const lockedCourtsCount = courts.filter(c => c.isLocked).length;
  const lockedCourtNames = courts.filter(c => c.isLocked).map(c => `Sân 0${c.courtNumber}`).join(', ') || 'Không có';

  // Filtered Equipment List
  const filteredEquipments = equipments.filter((eq) => {
    const matchesLocation = locationFilter === 'ALL' || eq.currentLocation === locationFilter;
    const matchesQuery =
      !searchQuery.trim() ||
      eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLocation && matchesQuery;
  });

  const getEquipmentIcon = (category: string) => {
    switch (category) {
      case 'tru_luoi':
        return <span className="text-base">🏸</span>;
      case 'tham_san':
        return <Layers className="w-4 h-4 text-rose-600" />;
      case 'chieu_sang':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 've_sinh':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      default:
        return <Wrench className="w-4 h-4 text-emerald-600" />;
    }
  };

  // ==========================================
  // RENDER SUB-VIEWS
  // ==========================================
  if (subView === 'report_incident') {
    return (
      <ReportIncidentView
        equipments={equipments}
        courts={courts}
        onBack={() => setSubView('main')}
        onSubmitIncident={handleCreateIncident}
      />
    );
  }

  if (subView === 'incident_detail') {
    const currentIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0];
    return (
      <IncidentDetailView
        incident={currentIncident}
        onBack={() => setSubView('main')}
        onUpdateStatus={(id, st, unlock) => {
          onUpdateIncidentStatus(id, st, unlock);
          showToast(`Đã cập nhật trạng thái sự cố #${id}!`);
        }}
      />
    );
  }

  if (subView === 'add_equipment') {
    return (
      <AddEquipmentView
        existingCount={equipments.length}
        onBack={() => setSubView('main')}
        onAddEquipment={handleAddNewEquipment}
      />
    );
  }

  // ==========================================
  // RENDER MAIN VIEW
  // ==========================================
  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-slate-900 text-white px-4 py-2.5 text-xs font-black shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🟢 Top Header matching mockup */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-xs shadow-sm">
            CX
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black text-slate-900 tracking-tight">COURTX</span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="text-xs font-extrabold text-slate-700">Cơ Sở Vật Chất</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (incidents.length > 0) handleOpenIncidentDetail(incidents[0].id);
            }}
            className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            title="Thông báo sự cố"
          >
            <Bell className="w-4 h-4" />
            {urgentIncidentsCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-600 ring-2 ring-white" />
            )}
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-white font-black text-xs">
            AD
          </div>
        </div>
      </div>

      {/* 1. Chỉ số vận hành (KPI Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="text-emerald-700">📈</span> Chỉ số vận hành
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            Cập nhật vừa xong
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Card 1: Thiết bị */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                THIẾT BỊ
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <span className="text-xs">🏸</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-slate-900">
                {equipments.length > 0 ? String(equipments.length).padStart(2, '0') : '42'}
              </div>
              <div className="text-[10px] text-slate-400 font-bold truncate mt-0.5">
                Tổng tài sản lưu động
              </div>
            </div>
          </div>

          {/* Card 2: Cần xử lý */}
          <div
            onClick={() => {
              if (incidents.length > 0) handleOpenIncidentDetail(incidents[0].id);
            }}
            className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3 shadow-2xs flex flex-col justify-between cursor-pointer hover:bg-rose-100/70 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">
                CẦN XỬ LÝ
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-200 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl font-black text-rose-900">
                {String(urgentIncidentsCount).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-rose-700/80 font-bold truncate mt-0.5">
                Sự cố khẩn cấp
              </div>
            </div>
          </div>

          {/* Card 3: Bảo trì */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">
                BẢO TRÌ
              </span>
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-200 text-indigo-700">
                <Wrench className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-black text-indigo-900 truncate">
                {lockedCourtNames}
              </div>
              <div className="text-[10px] text-indigo-700/80 font-bold truncate mt-0.5">
                {lockedCourtsCount > 0 ? `${lockedCourtsCount} sân đang ngắt ca` : 'Các sân sẵn sàng'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Thao tác cơ sở */}
      <div className="space-y-2">
        <h2 className="text-xs font-black text-slate-900 px-1">
          Thao tác cơ sở
        </h2>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => setSubView('report_incident')}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-black text-white shadow-md shadow-emerald-700/20 active:scale-95 transition cursor-pointer"
        >
          <Bell className="w-4 h-4 text-emerald-200" />
          <span>+ Báo sự cố hỏng hóc mới</span>
        </button>

        {/* Secondary CTAs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSubView('add_equipment')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 active:scale-95 transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span>Thêm thiết bị</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('court-switch-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 active:scale-95 transition shadow-2xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Khóa / Mở sân</span>
          </button>
        </div>
      </div>

      {/* 3. Chuyển đổi trạng thái sân (Court Status Switches) */}
      <div id="court-switch-section" className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Chuyển đổi trạng thái sân
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
            Bảo trì
          </span>
        </div>

        <div className="space-y-2">
          {courts.map((court) => (
            <div
              key={court.id}
              className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                court.isLocked
                  ? 'border-rose-200 bg-rose-50/50'
                  : 'border-slate-100 bg-slate-50/80 hover:bg-slate-100/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${
                    court.isLocked
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {court.courtNumber ? `S${court.courtNumber}` : 'CX'}
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900">
                    {court.name}
                  </div>
                  <div className="text-[11px] font-semibold mt-0.5 flex items-center gap-1">
                    {court.isLocked ? (
                      <span className="text-rose-700">
                        • Đang Khóa: {court.lockReason || 'Bảo trì kỹ thuật'}
                      </span>
                    ) : (
                      <span className="text-emerald-700">
                        • Đang Mở: Nhận khách tốt
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Interactive Switch */}
              <button
                type="button"
                onClick={() => handleCourtSwitchClick(court)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  court.isLocked ? 'bg-rose-600' : 'bg-slate-300'
                }`}
                title={court.isLocked ? 'Bấm để mở lại sân' : 'Bấm để khóa bảo trì'}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    court.isLocked ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Báo cáo sự cố gần đây (Recent Incidents) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Báo cáo sự cố gần đây
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
            {String(incidents.length).padStart(2, '0')} Mới nhất
          </span>
        </div>

        <div className="space-y-3">
          {incidents.slice(0, 3).map((incident) => (
            <div
              key={incident.id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-black">
                    #{incident.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                      incident.severity === 'khan_cap'
                        ? 'bg-rose-100 text-rose-800'
                        : incident.severity === 'trung_binh'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    • {incident.severityLabel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                      incident.status === 'da_khac_phuc'
                        ? 'bg-emerald-100 text-emerald-800'
                        : incident.status === 'dang_sua_chua'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {incident.statusLabel}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-400">
                  {incident.reportedAt}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-900 leading-snug">
                  {incident.title}
                </h3>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed line-clamp-2 font-medium">
                  {incident.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenIncidentDetail(incident.id)}
                className="w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition active:scale-95 cursor-pointer border border-blue-200/60"
              >
                <span>Xem chi tiết báo cáo sự cố</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Danh mục trang thiết bị (Lưu động) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-base">📋</span>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Danh mục trang thiết bị
            </h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
            Tự động thu hồi khi Check-out sân
          </span>
        </div>

        {/* Filter Chips by Court / Warehouse - ĐỦ 8 SÂN + KHO CHUNG */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {['ALL', 'Sân 01', 'Sân 02', 'Sân 03', 'Sân 04', 'Sân 05', 'Sân 06', 'Sân 07', 'Sân 08', 'Kho chung'].map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocationFilter(loc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                locationFilter === loc
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {loc === 'ALL' ? 'Tất cả' : loc}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên thiết bị hoặc mã dán MATB..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 shadow-2xs"
          />
        </div>

        {/* Equipment Items List matching mockup */}
        <div className="space-y-2">
          {filteredEquipments.map((eq) => (
            <div
              key={eq.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                  {getEquipmentIcon(eq.category)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-slate-900 truncate">
                    {eq.name}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate flex items-center gap-1">
                    <span className="font-bold text-slate-700">{eq.currentLocation}</span>
                    <span>•</span>
                    <span
                      className={
                        eq.status === 'bao_tri'
                          ? 'text-rose-600 font-bold'
                          : eq.status === 'san_sang'
                          ? 'text-blue-600 font-bold'
                          : 'text-emerald-700 font-bold'
                      }
                    >
                      {eq.healthRate}
                    </span>
                  </div>

                  {/* 🕒 Ghi nhận ca đặt sân & giờ đặt của thiết bị */}
                  {eq.assignedTimeSlot && (
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Ca: {eq.assignedTimeSlot} ({eq.assignedBookingCode || 'BK'})
                      </span>
                      {eq.assignedCustomer && (
                        <span className="text-[10px] text-slate-500 font-bold truncate max-w-[120px]">
                          • {eq.assignedCustomer}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: MATB sticker tag + Quick Checkout to Warehouse + Relocate Button */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <div className="text-right">
                  <div className="inline-block px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-black tracking-wider">
                    {eq.code}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold">Mã dán</div>
                </div>

                {/* Nút Điều phối vị trí */}
                <button
                  type="button"
                  onClick={() => {
                    setRelocatingEq(eq);
                    setTargetLocation(eq.currentLocation === 'Kho chung' ? 'Sân 01' : 'Kho chung');
                    setIsAssignBooking(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                  title="Điều phối vị trí lưu động"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredEquipments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 font-medium">
              Không tìm thấy thiết bị nào phù hợp với bộ lọc.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: KHÓA SÂN BẢO TRÌ                                      */}
      {/* ============================================================ */}
      {lockingCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Khóa bảo trì {lockingCourt.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLockingCourt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Khi khóa bảo trì, hệ thống sẽ ngắt ca đặt và gỡ lịch đặt trực tuyến của sân này cho đến khi được mở lại.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do khóa sân <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  placeholder="Ví dụ: Sửa thảm & thay bóng đèn LED Line 2..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLockingCourt(null)}
                className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmLockCourt}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-black text-white shadow-md shadow-rose-600/25 cursor-pointer"
              >
                Xác nhận khóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ĐIỀU PHỐI THIẾT BỊ LƯU ĐỘNG                           */}
      {/* ============================================================ */}
      {relocatingEq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Điều phối thiết bị lưu động
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRelocatingEq(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-3 space-y-1">
              <div className="text-[10px] font-black text-emerald-700 uppercase">
                MÃ THIẾT BỊ: {relocatingEq.code}
              </div>
              <div className="text-xs font-black text-slate-900">
                {relocatingEq.name}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                Vị trí hiện tại: <span className="font-bold text-slate-900">{relocatingEq.currentLocation}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chuyển đến vị trí mới:
              </label>
              <select
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
              >
                <option value="Kho chung">Kho chung nhà thi đấu</option>
                <option value="Sân 01">Sân 01 (Tiêu chuẩn A)</option>
                <option value="Sân 02">Sân 02 (Tiêu chuẩn A)</option>
                <option value="Sân 03">Sân 03 (Trong nhà VIP)</option>
                <option value="Sân 04">Sân 04 (Tiêu chuẩn B)</option>
                <option value="Sân 05">Sân 05 (Tiêu chuẩn B)</option>
                <option value="Sân 06">Sân 06 (Tiêu chuẩn B)</option>
                <option value="Sân 07">Sân 07 (Tiêu chuẩn A)</option>
                <option value="Sân 08">Sân 08 (Tiêu chuẩn A)</option>
              </select>
            </div>

            {/* Tùy chọn gán ca đặt sân khi chuyển vào sân cụ thể */}
            {targetLocation !== 'Kho chung' ? (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAssignBooking}
                    onChange={(e) => setIsAssignBooking(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                  />
                  <span className="text-xs font-bold text-amber-900">
                    Ghi nhận ca đặt sân vào giờ đó
                  </span>
                </label>

                {isAssignBooking && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        Khung giờ đặt sân:
                      </label>
                      <input
                        type="text"
                        value={assignTimeSlot}
                        onChange={(e) => setAssignTimeSlot(e.target.value)}
                        placeholder="VD: 17:00 - 18:30"
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Mã đặt:
                        </label>
                        <input
                          type="text"
                          value={assignBookingCode}
                          onChange={(e) => setAssignBookingCode(e.target.value)}
                          placeholder="BK-8491"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                          Khách đặt:
                        </label>
                        <input
                          type="text"
                          value={assignCustomer}
                          onChange={(e) => setAssignCustomer(e.target.value)}
                          placeholder="Anh Tuấn Hưng"
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 font-medium leading-relaxed">
                ℹ️ Thiết bị chuyển về Kho chung sẽ tự động được giải phóng ca đặt cũ và chuyển về trạng thái Sẵn sàng.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRelocatingEq(null)}
                className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRelocate}
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-700/25 cursor-pointer"
              >
                Xác nhận chuyển
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
