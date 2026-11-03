import { useEffect, useState } from 'react';
import {
  ArrowRightLeft,
  CheckCircle2,
  Lock,
  Building2,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { FacilityEquipment, CourtStatusItem, FacilityIncident } from '../../types/admin';
import ReportIncidentView from './ReportIncidentView';
import IncidentReportsList from './IncidentReportsList';
import useSharedBookings, { getSharedBookings } from '../../hooks/useSharedBookings';
import { getCourtLockWarnings, vietnamBookingDate } from '../../utils/courtBookingWarnings';
import IncidentDetailView from './IncidentDetailView';
import { type IncidentReporter } from '../../utils/incidentStorage';
import AddEquipmentView from './AddEquipmentView';
import EquipmentDetailView from './EquipmentDetailView';
import NotificationModal from './NotificationModal';
import CompensationPriceTable from './CompensationPriceTable';

interface FacilityManagementViewProps {
  currentUser: IncidentReporter;
  equipments: FacilityEquipment[];
  courts: CourtStatusItem[];
  incidents: FacilityIncident[];
  onAddEquipment: (newEq: FacilityEquipment) => void | Promise<void>;
  onUpdateEquipmentLocation: (equipmentCode: string, newLocation: string) => void | Promise<void>;
  onToggleCourtLock: (courtId: string, isLocked: boolean, reason?: string) => void | Promise<void>;
  onDeleteIncident: (id: string) => Promise<void>;
  onSubmitIncident: (newIncident: FacilityIncident, lockCourt: boolean) => void | Promise<void>;
  onUpdateIncidentStatus: (incidentId: string, newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc', unlockCourt?: boolean) => void | Promise<void>;
  onReturnToWarehouse?: (equipmentCode: string) => void | Promise<void>;
  onAssignBookingToEquipment?: (
    equipmentCode: string,
    courtName: string,
    timeSlot: string,
    bookingCode: string,
    customerName: string
  ) => void | Promise<void>;
  onCompleteEquipmentWarranty?: (equipmentCode: string, equipmentName?: string) => void | Promise<void>;
  onAddTimelineLog?: (incidentId: string, title: string, description: string, images?: string[]) => void | Promise<void>;
  isBackendOnline?: boolean;
}

export default function FacilityManagementView({
  currentUser,
  equipments,
  courts,
  incidents,
  onAddEquipment,
  onUpdateEquipmentLocation,
  onToggleCourtLock,
  onSubmitIncident,
  onDeleteIncident,
  onUpdateIncidentStatus,
  onReturnToWarehouse,
  onAssignBookingToEquipment,
  onCompleteEquipmentWarranty,
  onAddTimelineLog,
  isBackendOnline: _isBackendOnline = false,
}: FacilityManagementViewProps) {
  // Navigation sub-views: 'main' | 'report_incident' | 'incident_detail' | 'add_equipment' | 'equipment_detail' | 'notifications'
  const [subView, setSubView] = useState<'main' | 'report_incident' | 'incident_detail' | 'add_equipment' | 'equipment_detail' | 'notifications'>('main');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('SC-8921');



  // Filter & Search
  const [selectedEquipmentDetail, setSelectedEquipmentDetail] = useState<FacilityEquipment | null>(null);

  // Court Lock Dialog
  const [lockingCourt, setLockingCourt] = useState<CourtStatusItem | null>(null);
  const [lockReasonInput, setLockReasonInput] = useState<string>('');
  const [bookings] = useSharedBookings();
  const [warningTime,setWarningTime] = useState(()=>new Date());
  const [lockSaving,setLockSaving] = useState(false);
  const [lockError,setLockError] = useState('');
  const lockWarnings = lockingCourt ? getCourtLockWarnings(bookings,lockingCourt.code||lockingCourt.name,warningTime) : [];
  useEffect(()=>{
    if(!lockingCourt)return;
    const timer=window.setInterval(()=>setWarningTime(new Date()),15000);
    return()=>window.clearInterval(timer);
  },[lockingCourt]);
  const [courtSportFilter, setCourtSportFilter] = useState<'all' | 'badminton' | 'volleyball' | 'football'>('all');

  // Equipment Relocate Dialog
  const [relocatingEq, setRelocatingEq] = useState<FacilityEquipment | null>(null);
  const [targetLocation, setTargetLocation] = useState<string>('Kho chung');
  const [operationError,setOperationError]=useState('');
  const [operationSaving,setOperationSaving]=useState(false);
  const [isAssignBooking, setIsAssignBooking] = useState(false);
  const [assignBookingCode, setAssignBookingCode] = useState('');
  const [assignTimeSlot, setAssignTimeSlot] = useState('');
  const [assignCustomer, setAssignCustomer] = useState('');

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

  const handleCreateIncident = async (newIncident: FacilityIncident, lockCourt: boolean) => {
    await onSubmitIncident(newIncident, lockCourt);

    setSubView('main');
    showToast('Đã lưu báo cáo sự cố.');
    requestAnimationFrame(() => document.getElementById('recent-incidents')?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  const handleAddNewEquipment = async (newEq: FacilityEquipment) => {
    await onAddEquipment(newEq);
    setSubView('main');
    showToast(`Đã lưu thiết bị ${newEq.name} vào database.`);
  };

  // Court toggle logic
  const handleCourtSwitchClick = async (court: CourtStatusItem) => {
    if (court.isLocked) {
      // Unlock directly
      try {await onToggleCourtLock(court.id, false);showToast(`Đã mở lại ${court.name} đón khách!`);}
      catch(error){setOperationError(error instanceof Error?error.message:'Chưa mở được sân.');}
    } else {
      // Open dialog to input reason
      setLockingCourt(court);
      setLockReasonInput('');
      setWarningTime(new Date());
      setLockError('');
    }
  };

  const handleConfirmLockCourt = async () => {
    if (!lockingCourt || lockSaving) return;
    const signature=(list:typeof lockWarnings)=>list.map(booking=>`${booking.bookingDate}:${booking.code}:${booking.time}:${booking.status}`).join('|');
    const latest=getCourtLockWarnings(getSharedBookings(),lockingCourt.code||lockingCourt.name,new Date());
    if(signature(latest)!==signature(lockWarnings)) {
      setWarningTime(new Date());
      setLockError('Lượt đặt vừa thay đổi. Vui lòng kiểm tra và xác nhận lại.');
      return;
    }
    setLockSaving(true);
    setLockError('');
    try {
      await onToggleCourtLock(lockingCourt.id, true, lockReasonInput.trim() || 'Bảo trì kỹ thuật');
      showToast(`Đã khóa ${lockingCourt.name} cho đến khi được mở lại.`);
      setLockingCourt(null);
    } catch { setLockError('Chưa khóa được sân. Vui lòng thử lại.'); }
    finally { setLockSaving(false); }
  };

  // Equipment relocation & booking allocation
  const handleConfirmRelocate = async () => {
    if (!relocatingEq || operationSaving) return;
    setOperationSaving(true);setOperationError('');
    try {

    if (targetLocation === 'Kho chung') {
      if (onReturnToWarehouse) {
        await onReturnToWarehouse(relocatingEq.code);
      } else {
        await onUpdateEquipmentLocation(relocatingEq.code, 'Kho chung');
      }
      showToast(`Đã thu hồi [${relocatingEq.code}] về Kho chung an toàn!`);
    } else {
      if (isAssignBooking && onAssignBookingToEquipment) {
        const selected=bookings.find(booking=>booking.code===assignBookingCode.trim()&&booking.court===targetLocation&&['Đã đặt','Đang sử dụng'].includes(booking.status));
        if(!selected)throw Error('Chọn mã lượt đặt có thật và thuộc sân đang điều phối.');
        await onAssignBookingToEquipment(
          relocatingEq.code,
          targetLocation,
          selected.time,
          selected.code,
          selected.customerName
        );
        showToast(`Đã gán [${relocatingEq.code}] vào ${targetLocation} ca ${assignTimeSlot}!`);
      } else {
        await onUpdateEquipmentLocation(relocatingEq.code, targetLocation);
        showToast(`Đã điều phối [${relocatingEq.code}] sang ${targetLocation}!`);
      }
    }

    setRelocatingEq(null);
    setIsAssignBooking(false);
    }catch(error){setOperationError(error instanceof Error?error.message:'Chưa lưu được vị trí thiết bị.');}
    finally{setOperationSaving(false);}
  };

  const handleCompleteEquipmentWarranty = async (equipmentCode: string, equipmentName?: string) => {
    if(!onCompleteEquipmentWarranty)throw Error('Chưa kết nối thao tác nghiệm thu.');
    await onCompleteEquipmentWarranty(equipmentCode,equipmentName);
    const today = new Date().toLocaleDateString('vi-VN');
    const formattedDate = `Hôm nay (${today})`;

    // Update selectedEquipmentDetail if currently open
    if (selectedEquipmentDetail && selectedEquipmentDetail.code === equipmentCode) {
      setSelectedEquipmentDetail({
        ...selectedEquipmentDetail,
        status: 'san_sang',
        statusLabel: 'Sẵn sàng',
        healthRate: 'Tốt (Đã nghiệm thu)',
        lastMaintenance: formattedDate,
      });
    }

    showToast(`Đã nghiệm thu thiết bị [${equipmentCode}] và cập nhật vào Nhật ký xử lý sự cố!`);
  };

  // ==========================================
  // RENDER SUB-VIEWS
  // ==========================================
  if (subView === 'report_incident') {
    return (
      <ReportIncidentView
        currentUser={currentUser}
        equipments={equipments}
        courts={courts}
        onBack={() => setSubView('main')}
        onSubmitIncident={handleCreateIncident}
      />
    );
  }

  if (subView === 'incident_detail') {
    const currentIncident = incidents.find(i => i.id === selectedIncidentId && !i.deletedAt);
    if(!currentIncident)return <div className="space-y-3 p-3"><p className="text-xs text-slate-700">Báo cáo không còn trong danh sách hiện tại.</p><button type="button" onClick={()=>setSubView('main')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white">Quay lại cơ sở vật chất</button></div>;
    return (
      <IncidentDetailView
        incident={currentIncident}
        equipments={equipments}
        onBack={() => setSubView('main')}
        onUpdateStatus={async (id, st, unlock) => {
          await onUpdateIncidentStatus(id, st, unlock);
          showToast(`Đã cập nhật trạng thái sự cố #${id}!`);
        }}
        onAddTimelineLog={onAddTimelineLog}
        onCompleteEquipmentWarranty={handleCompleteEquipmentWarranty}
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

  if (subView === 'notifications') {
    return (
      <NotificationModal
        onBack={() => setSubView('main')}
        onClose={() => setSubView('main')}
      />
    );
  }

  if (subView === 'equipment_detail' && selectedEquipmentDetail) {
    return (
      <EquipmentDetailView
        equipment={selectedEquipmentDetail}
        onBack={() => {
          setSubView('main');
          setSelectedEquipmentDetail(null);
        }}
        onRelocate={(eq) => {
          setSubView('main');
          setSelectedEquipmentDetail(null);
          setRelocatingEq(eq);
          setTargetLocation(eq.currentLocation === 'Kho chung' ? courts.find(c=>!c.isLocked)?.name||'Kho chung' : 'Kho chung');
          setIsAssignBooking(false);
        }}
        onReportIncident={() => {
          setSelectedEquipmentDetail(null);
          setSubView('report_incident');
        }}
        onCompleteMaintenance={(eq) => handleCompleteEquipmentWarranty(eq.code, eq.name)}
      />
    );
  }

  // ==========================================
  // RENDER MAIN VIEW
  // ==========================================
  return (
    <div className="flex-1 min-h-full space-y-4 bg-white p-4 pb-8 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {operationError&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{operationError}</p>}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-emerald-600 text-white border border-emerald-500 px-4 py-2.5 text-xs font-black shadow-2xl shadow-emerald-900/30 flex items-center gap-2 animate-in fade-in slide-in-from-top duration-200 w-[90%] max-w-[360px] justify-center text-center">
          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
          <span className="leading-snug break-words whitespace-normal text-left">{toastMessage}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          QUẢN LÝ CƠ SỞ VẬT CHẤT <br />
          <span className="text-emerald-800">& THIẾT BỊ</span>
        </h1>

      </div>

      <IncidentReportsList incidents={incidents} onView={handleOpenIncidentDetail} onDelete={onDeleteIncident} onCreate={() => setSubView('report_incident')} />

      {/* 3. Chuyển đổi trạng thái sân */}
      <div id="court-switch-section" className="rounded-2xl border border-black/15 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Chuyển đổi trạng thái sân
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
            {courts.filter(c => c.isLocked).length} đang khóa
          </span>
        </div>

        {/* Bộ lọc môn */}
        <div className="flex gap-1.5">
          {(['all', 'badminton', 'volleyball', 'football'] as const).map((f) => {
            const labels = { all: 'Tất cả', badminton: 'Cầu lông', volleyball: 'Bóng chuyền', football: 'Bóng đá' };
            return (
              <button
                key={f}
                type="button"
                onClick={() => setCourtSportFilter(f)}
                className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold transition cursor-pointer ${
                  courtSportFilter === f
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {courts
            .filter((c) => {
              if (courtSportFilter === 'all') return true;
              return c.sportId === courtSportFilter;
            })
            .map((court) => (
            <div
              key={court.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border bg-white transition ${
                court.isLocked
                  ? 'border-red-200'
                  : 'border-black/10 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className={`h-9 w-9 shrink-0 rounded-xl ${
                    court.sportId === 'volleyball' ? 'bg-orange-200'
                      : court.sportId === 'football' ? 'bg-blue-200'
                      : 'bg-emerald-200'
                  }`}
                />
                <div>
                  <div className="text-xs font-black text-slate-900">{court.name}</div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${
                    court.isLocked ? 'text-red-700' : 'text-emerald-800'
                  }`}>
                    {court.isLocked
                      ? `● Đang khóa${court.lockReason ? ': ' + court.lockReason : ''}`
                      : '● Đang mở'}
                  </div>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => handleCourtSwitchClick(court)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  court.isLocked ? 'bg-red-500' : 'bg-emerald-700'
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

      {/* 5. Bảng giá bồi thường thiết bị */}
      <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
        <h2 className="text-xs font-bold text-emerald-800">Thiết bị theo số Seri / Asset ID</h2>
        {equipments.map(equipment=><div key={equipment.id} className="flex items-center justify-between gap-2 border-t border-slate-100 py-2">
          <div className="min-w-0"><p className="text-xs font-semibold text-slate-900">{equipment.name}</p>
            <p className="break-words text-[10px] text-slate-500">{equipment.code} · Seri: {equipment.serialNumber||'Chưa ghi nhận'}</p>
            <p className="text-[10px] text-emerald-800">{equipment.currentLocation} · {equipment.statusLabel}</p></div>
          <div className="flex shrink-0 flex-col gap-1">
            <button type="button" onClick={()=>{setSelectedEquipmentDetail(equipment);setSubView('equipment_detail');}} className="rounded-lg border border-slate-200 px-2 py-1 text-[10px] text-slate-700">Chi tiết</button>
            <button type="button" onClick={()=>{setOperationError('');setRelocatingEq(equipment);setTargetLocation('Kho chung');}} className="rounded-lg bg-emerald-700 px-2 py-1 text-[10px] text-white hover:bg-emerald-800">Điều chuyển</button>
          </div>
        </div>)}
        {!equipments.length&&<p className="text-xs text-slate-500">Chưa có dữ liệu thiết bị từ máy chủ.</p>}
      </section>
      <CompensationPriceTable
        onAddEquipment={() => setSubView('add_equipment')}
        equipments={equipments}
      />

      {/* ============================================================ */}
      {/* MODAL: KHÓA SÂN BẢO TRÌ                                      */}
      {/* ============================================================ */}
      {lockingCourt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div role="alertdialog" aria-modal="true" aria-labelledby="court-lock-title" className="w-full max-w-sm max-h-[85dvh] overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <h3 id="court-lock-title" className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Khóa bảo trì {lockingCourt.name}
                </h3>
              </div>
              <button
                type="button"
                disabled={lockSaving}
                onClick={() => setLockingCourt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Sân sẽ ẩn khỏi lịch và không nhận đặt mới cho đến khi được mở lại. Các lượt đã đặt được giữ nguyên để xử lý riêng.
              </p>
              {lockWarnings.length>0 && <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <p className="flex items-start gap-1.5 text-xs font-bold text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0"/>{lockingCourt.name} có {lockWarnings.length} lượt đặt cần lưu ý</p>
                <ul className="max-h-40 space-y-2 overflow-y-auto text-[11px] text-amber-950">
                  {lockWarnings.map(booking=><li key={`${booking.bookingDate}:${booking.code}`} className="rounded-lg bg-white/70 p-2">
                    <p className="font-bold">{(booking.bookingDate||vietnamBookingDate(warningTime)).split('-').reverse().join('/')} · {booking.time}</p>
                    <p className="mt-0.5">{booking.customerName} · {booking.code}</p>
                    {booking.status==='Đang sử dụng'&&<p className="mt-0.5 font-semibold text-red-700">Đang sử dụng sân</p>}
                  </li>)}
                </ul>
                <p className="text-[11px] leading-relaxed text-amber-900">Vui lòng liên hệ xử lý các lượt này. Nếu vẫn xác nhận, sân sẽ khóa ngay.</p>
              </div>}
              {lockError&&<p role="alert" className="text-xs text-red-700">{lockError}</p>}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý do khóa sân
                </label>
                <input
                  type="text"
                  value={lockReasonInput}
                  disabled={lockSaving}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  placeholder="Ví dụ: Sửa thảm & thay bóng đèn LED Line 2..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                disabled={lockSaving}
                onClick={() => setLockingCourt(null)}
                className="rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={lockSaving}
                onClick={handleConfirmLockCourt}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 text-xs font-black text-white shadow-md shadow-rose-600/25 cursor-pointer"
              >
                {lockSaving?'Đang khóa...':lockWarnings.length?'Vẫn xác nhận khóa':'Xác nhận khóa'}
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
              {operationError&&<p role="alert" className="text-xs text-red-700">{operationError}</p>}
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
                {courts.filter(c=>!c.isLocked).map(court=><option key={court.id} value={court.name}>{court.name}</option>)}
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
                disabled={operationSaving}
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
