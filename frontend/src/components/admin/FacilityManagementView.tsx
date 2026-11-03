import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  Building2,
  X,
  AlertTriangle,
  ArrowLeft,
  Bell,
} from 'lucide-react';
import type { FacilityEquipment, CourtStatusItem, FacilityIncident } from '../../types/admin';
import ReportIncidentView from './ReportIncidentView';
import IncidentReportsList from './IncidentReportsList';
import useSharedBookings, { getSharedBookings } from '../../hooks/useSharedBookings';
import { getCourtLockWarnings, vietnamBookingDate } from '../../utils/courtBookingWarnings';
import IncidentDetailView from './IncidentDetailView';
import { filterIncidents, type IncidentReporter } from '../../utils/incidentStorage';
import AddEquipmentView from './AddEquipmentView';
import CompensationPriceTable from './CompensationPriceTable';
import {refreshCourtAvailability} from '../../hooks/useCourtAvailability';

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
  onToggleCourtLock,
  onSubmitIncident,
  onDeleteIncident,
  onUpdateIncidentStatus,
  onCompleteEquipmentWarranty,
  onAddTimelineLog,
  isBackendOnline: _isBackendOnline = false,
}: FacilityManagementViewProps) {
  const [subView, setSubView] = useState<'main' | 'report_incident' | 'incident_detail' | 'add_equipment' | 'incidents'>('main');
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [incidentReturnView,setIncidentReturnView]=useState<'main'|'incidents'>('main');
  const unresolvedCount=filterIncidents(incidents,'unresolved').length;



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

  const [operationError,setOperationError]=useState('');

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

    setSubView('incidents');
    showToast('Đã lưu báo cáo sự cố.');
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

  const handleCompleteEquipmentWarranty = async (equipmentCode: string, equipmentName?: string) => {
    if(!onCompleteEquipmentWarranty)throw Error('Chưa kết nối thao tác nghiệm thu.');
    await onCompleteEquipmentWarranty(equipmentCode,equipmentName);
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
        onBack={() => setSubView(incidentReturnView)}
        onSubmitIncident={handleCreateIncident}
      />
    );
  }

  if (subView === 'incident_detail') {
    const currentIncident = incidents.find(i => i.id === selectedIncidentId && !i.deletedAt);
    if(!currentIncident)return <div className="space-y-3 p-3"><p className="text-xs text-slate-700">Báo cáo không còn trong danh sách hiện tại.</p><button type="button" onClick={()=>setSubView('incidents')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white">Quay lại báo cáo sự cố</button></div>;
    return (
      <IncidentDetailView
        incident={currentIncident}
        equipments={equipments}
        onBack={() => setSubView('incidents')}
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

  if (subView === 'incidents') {
    return (
      <div className="min-w-0 flex-1 space-y-4 bg-white p-4 pb-8">
        <button type="button" onClick={()=>setSubView('main')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><ArrowLeft className="h-4 w-4"/>Cơ sở vật chất</button>
        {toastMessage&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">{toastMessage}</p>}
        <IncidentReportsList incidents={incidents} onView={handleOpenIncidentDetail} onDelete={onDeleteIncident} onCreate={()=>{setIncidentReturnView('incidents');setSubView('report_incident');}}/>
      </div>
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
          QUẢN LÝ CƠ SỞ VẬT CHẤT
        </h1>
        <button type="button" onClick={()=>setSubView('incidents')} aria-label={`Báo cáo sự cố, ${unresolvedCount} chưa xử lý`} title="Báo cáo sự cố" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
          <Bell className="h-5 w-5"/>
          {unresolvedCount>0&&<span aria-hidden="true" className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{unresolvedCount>99?'99+':unresolvedCount}</span>}
        </button>
      </div>

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
          {courts.length===0&&<div role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Chưa tải được danh sách sân. <button type="button" onClick={()=>void refreshCourtAvailability()} className="font-bold underline">Tải lại danh sách sân</button></div>}
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

    </div>
  );
}
