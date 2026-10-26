import { useState } from 'react';
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
import type { FacilityIncident } from '../../types/admin';

interface IncidentDetailViewProps {
  incident: FacilityIncident;
  onBack: () => void;
  onUpdateStatus: (incidentId: string, newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc', unlockCourt?: boolean) => void;
  onAddTimelineLog?: (incidentId: string, title: string, description: string) => void;
  onCompleteEquipmentWarranty?: (equipmentCode: string, equipmentName?: string) => void;
}

export default function IncidentDetailView({
  incident,
  onBack,
  onUpdateStatus,
  onAddTimelineLog,
  onCompleteEquipmentWarranty,
}: IncidentDetailViewProps) {
  const [currentStatus, setCurrentStatus] = useState(incident.status);
  const [timelineLogs, setTimelineLogs] = useState(incident.timelineLogs || []);
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogDesc, setNewLogDesc] = useState('');
  const [showAddLog, setShowAddLog] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isEquipmentWarrantyDone, setIsEquipmentWarrantyDone] = useState(false);
  const [warrantyToast, setWarrantyToast] = useState<string | null>(null);

  const targetEquipmentCode = incident.equipmentCode || incident.damageItems?.[0]?.equipmentCode || 'MATB-02';
  const targetEquipmentName = incident.equipmentName || incident.damageItems?.[0]?.title || 'Thảm sàn Vinyl BWF 4.5mm';

  const isResolved = currentStatus === 'da_khac_phuc';

  const handleCompleteWarranty = () => {
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const logTitle = `Nghiệm thu hoàn tất bảo hành [${targetEquipmentCode}]`;
    const logDesc = `Đã nghiệm thu thiết bị ${targetEquipmentName} sau khi hoàn tất bảo hành/sửa chữa kỹ thuật. Thiết bị đạt chuẩn kiểm định và chuyển về trạng thái 🟢 Sẵn sàng vận hành.`;

    const warrantyLog = {
      id: `TL-${Date.now()}`,
      time: nowTime,
      title: logTitle,
      description: logDesc,
      active: true,
    };

    setTimelineLogs((prev) => [warrantyLog, ...prev.map((l) => ({ ...l, active: false }))]);
    setIsEquipmentWarrantyDone(true);

    if (onAddTimelineLog) {
      onAddTimelineLog(incident.id, logTitle, logDesc);
    }
    if (onCompleteEquipmentWarranty) {
      onCompleteEquipmentWarranty(targetEquipmentCode, targetEquipmentName);
    }

    setWarrantyToast(`Đã nghiệm thu thiết bị [${targetEquipmentCode}]! Trạng thái chuyển về 🟢 Sẵn sàng và ghi nhận vào Nhật ký sự cố. Sân ${incident.courtName} vẫn giữ nguyên trạng thái khóa.`);
    setTimeout(() => setWarrantyToast(null), 4500);
  };

  const handleResolveAndUnlock = () => {
    setCurrentStatus('da_khac_phuc');
    const newLog = {
      id: `TL-${Date.now()}`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      title: 'Nghiệm thu hoàn tất & Mở lại sân',
      description: 'Ban quản lý đã kiểm tra hiện trường, các hạng mục hỏng hóc đã khắc phục đạt chuẩn. Sân 03 được mở lại cho khách đặt.',
      active: true,
    };
    setTimelineLogs([newLog, ...timelineLogs.map(l => ({ ...l, active: false }))]);
    onUpdateStatus(incident.id, 'da_khac_phuc', true);
    if (onAddTimelineLog) {
      onAddTimelineLog(incident.id, newLog.title, newLog.description);
    }
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3500);
  };

  const handleChangeStatus = (newSt: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc') => {
    setCurrentStatus(newSt);
    onUpdateStatus(incident.id, newSt, newSt === 'da_khac_phuc');
  };

  const handleAddNewLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle.trim()) return;

    const newLog = {
      id: `TL-${Date.now()}`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      title: newLogTitle.trim(),
      description: newLogDesc.trim() || 'Cập nhật tiến độ xử lý hiện trường.',
      active: true,
    };

    setTimelineLogs([newLog, ...timelineLogs.map(l => ({ ...l, active: false }))]);
    if (onAddTimelineLog) {
      onAddTimelineLog(incident.id, newLog.title, newLog.description);
    }
    setNewLogTitle('');
    setNewLogDesc('');
    setShowAddLog(false);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
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

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 border border-emerald-200 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            BIÊN BẢN KIỂM SOÁT SỰ CỐ
          </div>
        </div>

        <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border shadow-2xs ${
          currentStatus === 'da_khac_phuc'
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : currentStatus === 'dang_sua_chua'
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : 'bg-amber-100 text-amber-800 border-amber-300'
        }`}>
          {currentStatus === 'da_khac_phuc' ? 'Đã khắc phục' : currentStatus === 'dang_sua_chua' ? 'Đang sửa chữa' : 'Chờ xử lý'}
        </span>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          CHI TIẾT SỰ CỐ <span className="text-emerald-600">#{incident.id}</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Hồ sơ kiểm soát kỹ thuật, nhật ký sửa chữa và nghiệm thu vận hành {incident.courtName}.
        </p>
      </div>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="rounded-2xl bg-emerald-600 text-white p-3.5 shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            <span className="text-xs font-black">
              Đã nghiệm thu thành công! Sân {incident.courtName} đã được mở lại.
            </span>
          </div>
        </div>
      )}

      {/* Warranty Success Toast */}
      {warrantyToast && (
        <div className="rounded-2xl bg-emerald-700 text-white p-3.5 shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <span className="text-xs font-black">
              {warrantyToast}
            </span>
          </div>
        </div>
      )}

      {/* 1. Header Banner (Red/Pink Gradient) matching mockup */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-100 via-rose-50 to-red-100/70 border border-rose-200 p-4 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          {isResolved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-[11px] font-black tracking-wide shadow-2xs">
              <Unlock className="w-3.5 h-3.5" />
              ĐÃ NGHIỆM THU - ĐÃ MỞ SÂN
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-700 text-white text-[11px] font-black tracking-wide shadow-2xs">
              <Lock className="w-3.5 h-3.5" />
              ĐANG BẢO TRÌ - ĐÃ KHÓA SÂN
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-200/80 text-rose-800 text-[11px] font-black tracking-wide">
            <span className="text-rose-600 font-bold">!</span>
            MỨC ĐỘ: {incident.severityLabel.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-rose-200/60">
          <div>
            <div className="text-[10px] font-bold text-rose-700/80 uppercase tracking-wider">
              MÃ PHIẾU KIỂM SOÁT
            </div>
            <div className="text-sm font-black text-rose-900 mt-0.5">
              #{incident.id}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-rose-700/80 uppercase tracking-wider">
              THỜI ĐIỂM GHI NHẬN
            </div>
            <div className="text-xs font-bold text-rose-900 mt-0.5">
              {incident.reportedAt}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Court Card (Sân 03 Khu A - Master Lock) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="text-xl">🏸</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">
                  {incident.courtName}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200/60">
                  {incident.courtZone || 'Khu A'}
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {incident.courtSubtype || 'Sân Cầu Lông Tiêu Chuẩn Quốc Tế'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-[11px] font-black">
            <span className={`h-2 w-2 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-rose-600 animate-pulse'}`} />
            {isResolved ? 'Unlocked' : 'Master Lock'}
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/80 border border-blue-100 p-2.5 text-xs">
          <Shield className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
          <span className="text-blue-900 text-[11px] font-medium leading-relaxed">
            {isResolved
              ? 'Sân đã được mở khóa an toàn. Khách hàng có thể tiếp tục tạo slot đặt sân trên hệ thống CourtX.'
              : 'Hệ thống đã tự động gỡ lịch đặt trực tuyến. Khách hàng không thể tạo slot giữ chỗ trên ' + incident.courtName + ' trong thời gian này.'}
          </span>
        </div>
      </div>

      {/* 3. Detailed Damage Items ("Hạng mục hư hại chi tiết") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Hạng mục hư hại chi tiết
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
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                    {idx === 0 ? <Layers className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">
                      {item.title}
                    </h3>
                    {item.equipmentCode && (
                      <span className="inline-block mt-0.5 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Mã TB: {item.equipmentCode}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                    item.riskColor === 'rose'
                      ? 'bg-rose-100 text-rose-800'
                      : item.riskColor === 'blue'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.riskBadge}
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
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-slate-900">{incident.title}</span>
              </div>
              {incident.equipmentCode && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Bảo hành & Nghiệm thu thiết bị
            </h2>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
            isEquipmentWarrantyDone
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : 'bg-amber-100 text-amber-800 border-amber-300'
          }`}>
            {isEquipmentWarrantyDone ? '🟢 Đã nghiệm thu' : 'Chờ nghiệm thu'}
          </span>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200/80 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Thiết bị cần nghiệm thu:</span>
            <span className="font-bold text-slate-800">{targetEquipmentName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Mã dán thiết bị:</span>
            <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {targetEquipmentCode}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Trạng thái thiết bị:</span>
            <span className={`font-bold ${isEquipmentWarrantyDone ? 'text-emerald-700 font-black' : 'text-amber-700'}`}>
              {isEquipmentWarrantyDone ? '🟢 Sẵn sàng vận hành' : '🟡 Đang sửa chữa / Chờ bảo hành'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Hotline bảo hành hãng:</span>
            <span className="font-bold text-emerald-700">1900 6868 (Yonex / Đại Việt)</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
          💡 Khi hãng hoặc thợ bảo trì đã sửa xong thiết bị, bấm nút nghiệm thu bên dưới để chuyển thiết bị về 🟢 <strong>Sẵn sàng</strong> và tự động ghi vào Nhật ký xử lý sự cố. <em>(Sân đấu vẫn giữ nguyên trạng thái khóa, người quản lý sẽ tự mở lại sân khi kiểm tra an toàn xong).</em>
        </p>

        {/* Nút Nghiệm thu thiết bị */}
        <button
          type="button"
          disabled={isEquipmentWarrantyDone}
          onClick={handleCompleteWarranty}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black transition active:scale-95 cursor-pointer shadow-md ${
            isEquipmentWarrantyDone
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>
            {isEquipmentWarrantyDone
              ? `✓ Đã nghiệm thu [${targetEquipmentCode}] (🟢 Sẵn sàng)`
              : 'Xác nhận đã bảo hành xong / Nghiệm thu'}
          </span>
        </button>
      </div>

      {/* 4. Reporter Card ("NGƯỜI LẬP BIÊN BẢN") */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          NGƯỜI LẬP BIÊN BẢN
        </h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white font-black text-sm shadow-sm">
              {getInitials(incident.reporterName)}
            </div>
            <div>
              <div className="text-xs font-black text-slate-900">
                {incident.reporterName}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {incident.reporterRole || 'Nhân viên trực ca • 05:00 - 11:00'}
              </div>
            </div>
          </div>

          <a
            href={`tel:${incident.reporterPhone || '0912345678'}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition active:scale-95 cursor-pointer border border-blue-200/60"
            title="Gọi điện"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>

        <div className="rounded-xl bg-blue-50/70 border border-blue-100 px-3 py-2 flex items-center justify-between text-xs">
          <span className="text-[11px] font-bold text-slate-500">Số điện thoại liên hệ</span>
          <span className="text-xs font-black text-slate-800 tracking-wider">
            {incident.reporterPhone || '0912.345.678'}
          </span>
        </div>
      </div>

      {/* 5. Incident Timeline ("Nhật ký xử lý sự cố (Thời gian thực)") */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Nhật ký xử lý sự cố
            </h2>
          </div>
          <span className="text-[11px] font-bold text-emerald-700">
            Thời gian thực
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
                <h4 className="text-xs font-black text-slate-900">{log.title}</h4>
                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                  {log.time}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium leading-relaxed">
                {log.description}
              </p>
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
            <span>Ghi thêm nhật ký tiến độ</span>
          </button>
        ) : (
          <form onSubmit={handleAddNewLog} className="space-y-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in">
            <input
              type="text"
              placeholder="Tiêu đề nhật ký (ví dụ: Kỹ thuật viên dán xong mép thảm...)"
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
              <button
                type="button"
                onClick={() => setShowAddLog(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white shadow cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Lưu nhật ký</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 6. Quick Status Switcher */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Chuyển đổi trạng thái xử lý
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleChangeStatus('cho_xu_ly')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer ${
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
            className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer ${
              currentStatus === 'dang_sua_chua'
                ? 'bg-blue-100 text-blue-800 ring-2 ring-blue-300'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Đang sửa chữa
          </button>
          <button
            type="button"
            onClick={() => handleChangeStatus('da_khac_phuc')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-black transition cursor-pointer ${
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
        <button
          type="button"
          disabled={isEquipmentWarrantyDone}
          onClick={handleCompleteWarranty}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black transition active:scale-95 cursor-pointer shadow-sm ${
            isEquipmentWarrantyDone
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>
            {isEquipmentWarrantyDone
              ? `✓ Đã nghiệm thu thiết bị [${targetEquipmentCode}] (🟢 Sẵn sàng)`
              : 'Xác nhận đã bảo hành xong / Nghiệm thu'}
          </span>
        </button>

        {!isResolved ? (
          <button
            type="button"
            onClick={handleResolveAndUnlock}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-900 py-3.5 text-xs font-black text-white shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-300" />
            <span>Nghiệm thu toàn bộ sự cố & Mở lại sân</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 border border-emerald-300 py-3 text-xs font-black text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã nghiệm thu đạt chuẩn • Sân đang hoạt động tốt</span>
          </div>
        )}
      </div>
    </div>
  );
}
