import { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Shield,
  Layers,
  Lightbulb,
  Wrench,
  Camera,
  Phone,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  Lock,
  Unlock,
} from 'lucide-react';
import type { FacilityIncident, FacilityEquipment } from '../../types/admin';
import useVietnamToday from '../../hooks/useVietnamToday';
import { getEquipmentWarranty } from '../../utils/equipmentWarranty';
import { getIncidentTimeline } from '../../utils/incidentStorage';
import useCourtAvailability, { normalizeCourtCode } from '../../hooks/useCourtAvailability';

interface IncidentDetailViewProps {
  incident: FacilityIncident;
  equipments: FacilityEquipment[];
  onBack: () => void | Promise<void>;
  onUpdateStatus: (incidentId: string, newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc', unlockCourt?: boolean) => void | Promise<void>;
  onAddTimelineLog?: (incidentId: string, title: string, description: string, images?: string[]) => void | Promise<void>;
  onCompleteEquipmentWarranty?: (equipmentCode: string, equipmentName?: string) => void | Promise<void>;
}

export default function IncidentDetailView({
  incident,
  equipments,
  onBack,
  onUpdateStatus,
  onAddTimelineLog,
  onCompleteEquipmentWarranty,
}: IncidentDetailViewProps) {
  const [currentStatus, setCurrentStatus] = useState(incident.status);
  const [saving,setSaving]=useState(false);
  const [actionError,setActionError]=useState('');
  useEffect(()=>{setCurrentStatus(incident.status);},[incident.status]);
  const [timelineLogs, setTimelineLogs] = useState(() => getIncidentTimeline(incident));
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogDesc, setNewLogDesc] = useState('');
  const [newLogImages, setNewLogImages] = useState<string[]>([]);
  const [imageError, setImageError] = useState('');
  const [readingImage, setReadingImage] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [warrantyToast, setWarrantyToast] = useState<string | null>(null);
  useEffect(() => { setTimelineLogs(getIncidentTimeline(incident)); }, [incident]);

  const handleLogImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setImageError('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.');
      return;
    }
    setImageError('');
    setReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => { setNewLogImages([String(reader.result)]); setReadingImage(false); };
    reader.onerror = () => { setImageError('Không đọc được ảnh.'); setReadingImage(false); };
    reader.readAsDataURL(file);
  };

  const targetEquipmentCode = incident.equipmentCode || incident.damageItems?.[0]?.equipmentCode || '';
  const targetEquipment = equipments.find(equipment => equipment.code === targetEquipmentCode);
  const today = useVietnamToday();
  const warranty = getEquipmentWarranty(targetEquipment?.warrantyExpire, today);
  const targetEquipmentName = targetEquipment?.name || incident.equipmentName || 'Chưa liên kết thiết bị';
  const equipmentStatuses = {
    san_sang: { label: 'Sẵn sàng', color: 'bg-emerald-50 text-emerald-800' },
    dang_su_dung: { label: 'Đang sử dụng', color: 'bg-emerald-50 text-emerald-800' },
    bao_tri: { label: 'Bảo trì', color: 'bg-amber-100 text-amber-800' },
    hong: { label: 'Hỏng', color: 'bg-red-50 text-red-700' },
  };
  const getEquipmentStatus = (equipment?: FacilityEquipment) => equipment
    ? equipmentStatuses[equipment.status]
    : { label: 'Chưa liên kết', color: 'bg-amber-100 text-amber-800' };
  const targetStatus = getEquipmentStatus(targetEquipment);
  const isEquipmentWarrantyDone = targetEquipment?.status === 'san_sang';

  const isResolved = currentStatus === 'da_khac_phuc';
  const [courtStatuses] = useCourtAvailability();
  const courtLocked = courtStatuses.some(court => court.isLocked && (court.id === incident.courtId
    || normalizeCourtCode(court.code || court.name) === normalizeCourtCode(incident.courtName)));

  const run=async(action:()=>Promise<void>)=>{
    if(saving)return;
    setSaving(true);setActionError('');
    try {await action();}catch(error){setActionError(error instanceof Error?error.message:'Chưa lưu được thay đổi.');}
    finally{setSaving(false);}
  };
  const handleCompleteWarranty=()=>run(async()=>{
    if(!targetEquipment||!onCompleteEquipmentWarranty||isEquipmentWarrantyDone)return;
    await onCompleteEquipmentWarranty(targetEquipmentCode,targetEquipmentName);
    setWarrantyToast(`Đã nghiệm thu thiết bị ${targetEquipmentCode}.`);
    setTimeout(()=>setWarrantyToast(null),4500);
  });
  const handleResolveAndUnlock=()=>run(async()=>{
    await onUpdateStatus(incident.id,'da_khac_phuc',false);
    setCurrentStatus('da_khac_phuc');setShowSuccessToast(true);
    setTimeout(()=>setShowSuccessToast(false),3500);
  });
  const handleChangeStatus=(status:FacilityIncident['status'])=>run(async()=>{
    await onUpdateStatus(incident.id,status,false);setCurrentStatus(status);
  });
  const handleAddNewLog=(event:React.FormEvent)=>{
    event.preventDefault();
    if(!newLogTitle.trim()||readingImage||imageError||!onAddTimelineLog)return;
    void run(async()=>{
      await onAddTimelineLog(incident.id,newLogTitle.trim(),newLogDesc.trim(),newLogImages);
      setNewLogTitle('');setNewLogDesc('');setNewLogImages([]);setShowAddLog(false);
    });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex-1 space-y-3 bg-white p-3 pb-6 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {actionError&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{actionError}</p>}
      {saving&&<p role="status" className="text-xs text-emerald-800">Đang lưu thay đổi...</p>}
      {/* 🟢 Top Badge & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-2xs"
            title="Quay lại"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h1 className="text-base font-bold text-slate-900">
            Sự cố <span className="text-emerald-800">#{incident.id}</span>
          </h1>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-2xs ${
          currentStatus === 'da_khac_phuc'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : currentStatus === 'dang_sua_chua'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-amber-100 text-amber-800 border-amber-300'
        }`}>
          {currentStatus === 'da_khac_phuc' ? 'Đã khắc phục' : currentStatus === 'dang_sua_chua' ? 'Đang sửa chữa' : 'Chờ xử lý'}
        </span>
      </div>


      {/* Success Toast */}
      {showSuccessToast && (
        <div className="rounded-2xl bg-emerald-600 text-white p-3.5 shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            <span className="text-xs font-bold">
              Đã hoàn tất xử lý sự cố.
            </span>
          </div>
        </div>
      )}

      {/* Warranty Success Toast */}
      {warrantyToast && (
        <div className="rounded-2xl bg-emerald-700 text-white p-3.5 shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs font-bold">
              {warrantyToast}
            </span>
          </div>
        </div>
      )}

      {/* Court and incident summary */}
      <div className="rounded-2xl bg-white border border-black/15 p-3 space-y-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{incident.courtName}</span>
            {incident.courtZone && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                {incident.courtZone}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-600">{incident.reportedAt}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          {!courtLocked ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-[11px] font-bold tracking-wide shadow-2xs">
              <Unlock className="w-3.5 h-3.5" />
              Sân đang mở
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-700 text-white text-[11px] font-bold tracking-wide shadow-2xs">
              <Lock className="w-3.5 h-3.5" />
              Sân đang khóa
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-[11px] font-bold tracking-wide">
            <span className="text-amber-700 font-bold">!</span>
            {incident.severityLabel}
          </span>
        </div>

      </div>

      {/* 3. Detailed Damage Items ("Hạng mục hư hại chi tiết") */}
      {incident.bookingCode && <div className="space-y-1 rounded-xl border border-emerald-200 bg-white p-3 text-xs">
        <div className="flex justify-between gap-2"><span className="text-slate-600">Lượt đặt</span><strong className="text-emerald-800">{incident.bookingCode}</strong></div>
        <div className="flex justify-between gap-2"><span className="text-slate-600">Trách nhiệm</span><span>{incident.liability === 'DO_KHACH_LAM_HONG' ? 'Do khách làm hỏng' : 'Sân chịu chi phí'}</span></div>
        {incident.compensationAmount !== undefined && <div className="flex justify-between gap-2"><span className="text-slate-600">Bồi thường</span><strong>{incident.compensationAmount.toLocaleString('vi-VN')} VND</strong></div>}
        <p className="text-right text-[11px] text-emerald-800">{incident.compensationPaymentStatus === 'paid' ? 'Đã thu qua VietQR khi trả sân' : incident.compensationPaymentStatus === 'not_required' ? 'Không thu phí khách' : 'Chưa quyết toán'}</p>
      </div>}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Hạng mục hư hại
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
            {String(incident.damageItems?.length || 1).padStart(2, '0')} hạng mục
          </span>
        </div>

        {incident.damageItems && incident.damageItems.length > 0 ? (
          incident.damageItems.map((item, idx) => (
            <div
              key={item.id || idx}
              className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                    {idx === 0 ? <Layers className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">
                      {equipments.find(equipment => equipment.code === item.equipmentCode)?.name || item.title}
                    </h3>
                    {item.equipmentCode && (
                      <span className="inline-block mt-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Mã TB: {item.equipmentCode}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                    getEquipmentStatus(equipments.find(equipment => equipment.code === item.equipmentCode)).color
                  }`}
                >
                  {getEquipmentStatus(equipments.find(equipment => equipment.code === item.equipmentCode)).label}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {item.description}
              </p>

              {item.imageUrl && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs aspect-video bg-slate-100">
                  <img
                    src={item.imageUrl}
                    alt={item.imageLabel || 'Hiện trường hư hỏng'}
                    className="w-full h-full object-cover"
                  />
                  {item.imageLabel && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white shadow">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{item.imageLabel}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900">{incident.title}</span>
              </div>
              {incident.equipmentCode && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {incident.equipmentCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {incident.description}
            </p>

            {incident.imageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-2xs aspect-video bg-slate-100">
                <img
                  src={incident.imageUrl}
                  alt={incident.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-white shadow">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Ảnh chụp hiện trường sự cố</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3.5. Equipment Warranty & Acceptance Card ("BẢO HÀNH & NGHIỆM THU THIẾT BỊ") */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {warranty.active ? 'Bảo hành & nghiệm thu' : 'Sửa chữa & nghiệm thu'}
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
            targetStatus.color
          }`}>
            {targetStatus.label}
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Thiết bị</span>
            <span className="font-bold text-slate-800">{targetEquipmentName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Mã thiết bị</span>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {targetEquipmentCode || 'Chưa liên kết'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Trạng thái</span>
            <span className={`rounded-md px-2 py-0.5 font-bold ${targetStatus.color}`}>
              {targetStatus.label}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <span className="text-slate-600 font-medium">Bảo hành</span>
            <span className="text-right font-semibold text-slate-700">{warranty.label}</span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <span className="text-slate-600 font-medium">SĐT bảo hành</span>
            {targetEquipment?.supplierPhone?.trim() ? (
              <a href={`tel:${targetEquipment.supplierPhone.replace(/[^+\d]/g, '')}`} className="font-bold text-emerald-700">{targetEquipment.supplierPhone}</a>
            ) : <span className="text-slate-500">Chưa cập nhật</span>}
          </div>
          <div className="flex items-start justify-between gap-3 pt-1 border-t border-slate-100">
            <span className="shrink-0 text-slate-600 font-medium">Địa chỉ bảo hành</span>
            <span className="text-right font-medium text-slate-800 break-words min-w-0">{targetEquipment?.warrantyAddress?.trim() || 'Chưa cập nhật'}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          Nghiệm thu đưa thiết bị về trạng thái sẵn sàng. Khóa/mở sân tại “Chuyển đổi trạng thái sân”.
        </p>

        {/* Nút Nghiệm thu thiết bị */}
        <button
          type="button"
          disabled={!targetEquipment || isEquipmentWarrantyDone}
          onClick={handleCompleteWarranty}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-md ${
            isEquipmentWarrantyDone
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-600/25'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>
            {isEquipmentWarrantyDone
              ? 'Đã nghiệm thu thiết bị'
              : warranty.active ? 'Nghiệm thu thiết bị' : 'Xác nhận sửa xong'}
          </span>
        </button>
      </div>

      {/* 4. Reporter Card ("NGƯỜI LẬP BIÊN BẢN") */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
          NGƯỜI LẬP BIÊN BẢN
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold text-sm shadow-sm">
              {getInitials(incident.reporterName)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                {incident.reporterName}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {incident.reporterRole || 'Nhân viên'}
              </div>
            </div>
          </div>

        </div>

        <div className="flex items-center gap-2 text-xs text-emerald-800">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          {incident.reporterPhone ? <a className="font-semibold" href={`tel:${incident.reporterPhone.replace(/[^+\d]/g, '')}`}>{incident.reporterPhone}</a> : <span className="text-slate-500">Chưa cập nhật</span>}
        </div>
      </div>

      {/* 5. Incident Timeline ("Nhật ký xử lý sự cố (Thời gian thực)") */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Nhật ký xử lý sự cố
            </h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-700">
            {timelineLogs.length} cập nhật
          </span>
        </div>

        <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timelineLogs.map((log) => (
            <div key={log.id} className="relative group">
              <span
                className={`absolute -left-5 top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                  log.active ? 'bg-emerald-600' : 'bg-slate-400'
                }`}
              />
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-900">{log.title}</h4>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                  {log.time}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-[11px] text-slate-600 mt-0.5 font-medium leading-relaxed">
                {log.description}
              </p>
              {log.id === `REPORT-${incident.id}` && incident.technicianNote && (
                <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-600">Ghi chú: {incident.technicianNote}</p>
              )}
              {log.images?.map((src, index) => (
                <img key={`${log.id}-${index}`} src={src} alt={`Ảnh nhật ký: ${log.title}`} className="mt-2 max-h-48 w-full rounded-lg border border-slate-200 object-contain bg-white" />
              ))}
            </div>
          ))}
        </div>

        {/* Add Timeline Entry Button */}
        {!showAddLog ? (
          <button
            type="button"
            onClick={() => setShowAddLog(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm nhật ký</span>
          </button>
        ) : (
          <form onSubmit={handleAddNewLog} className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
            <input
              type="text"
              placeholder="Tiêu đề cập nhật"
              value={newLogTitle}
              onChange={(e) => setNewLogTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            />
            <textarea
              rows={2}
              placeholder="Chi tiết ghi nhận..."
              value={newLogDesc}
              onChange={(e) => setNewLogDesc(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
            />
            <div className="flex items-center justify-end gap-2 pt-1">
              <label className="mr-auto cursor-pointer text-xs font-semibold text-emerald-800">
                <span className="inline-flex items-center gap-1"><Camera className="h-3.5 w-3.5" />Thêm ảnh</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogImage} className="sr-only" />
              </label>
              <button
                type="button"
                onClick={() => setShowAddLog(false)}
                className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-bold text-red-700 hover:bg-red-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={readingImage || !!imageError}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-xs font-bold text-white shadow cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Lưu nhật ký</span>
              </button>
            </div>
            {imageError && <p className="text-xs text-red-700">{imageError}</p>}
            {newLogImages.map(src => <div key={src} className="flex items-center gap-2"><img src={src} alt="Ảnh cập nhật" className="h-20 rounded-lg" /><button type="button" className="text-xs text-red-700" onClick={() => { setNewLogImages([]); setImageError(''); }}>Bỏ ảnh</button></div>)}
          </form>
        )}
      </div>

      {/* 6. Quick Status Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Trạng thái xử lý
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleChangeStatus('cho_xu_ly')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
              currentStatus === 'cho_xu_ly'
                ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chờ xử lý
          </button>
          <button
            type="button"
            onClick={() => handleChangeStatus('dang_sua_chua')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
              currentStatus === 'dang_sua_chua'
                ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Đang sửa chữa
          </button>
          <button
            type="button"
            onClick={() => handleChangeStatus('da_khac_phuc')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition cursor-pointer ${
              currentStatus === 'da_khac_phuc'
                ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Đã khắc phục
          </button>
        </div>
      </div>

      {/* 7. Bottom Main CTA */}
      <div className="pt-2 space-y-2.5">
        {!isResolved ? (
          <button
            type="button"
            onClick={handleResolveAndUnlock}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-300" />
            <span>Hoàn tất xử lý</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 border border-emerald-300 py-2.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã khắc phục</span>
          </div>
        )}
      </div>
    </div>
  );
}
