import { useState } from 'react';
import {
  ChevronLeft,
  AlertTriangle,
  Flame,
  Send,
  Building2,
  Tag,
} from 'lucide-react';
import type { FacilityEquipment, FacilityIncident, CourtStatusItem } from '../../types/admin';

interface ReportIncidentViewProps {
  equipments: FacilityEquipment[];
  courts: CourtStatusItem[];
  onBack: () => void;
  onSubmitIncident: (newIncident: FacilityIncident, lockCourt: boolean) => void;
}

export default function ReportIncidentView({
  equipments,
  courts,
  onBack,
  onSubmitIncident,
}: ReportIncidentViewProps) {
  const [selectedCourtId, setSelectedCourtId] = useState<string>('SAN-03');
  const [selectedEquipmentCode, setSelectedEquipmentCode] = useState<string>('MATB-02');
  const [severity, setSeverity] = useState<'khan_cap' | 'trung_binh' | 'thap'>('khan_cap');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [technicianNote, setTechnicianNote] = useState('');
  const [autoLockCourt, setAutoLockCourt] = useState(true);
  const [reporterName] = useState('Nguyễn Văn An (NV ca trực)');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCourt = courts.find((c) => c.id === selectedCourtId) || courts[0];
  const selectedEquipment = equipments.find((e) => e.code === selectedEquipmentCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Vui lòng nhập tiêu đề sự cố hỏng hóc!');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Vui lòng nhập mô tả chi tiết tình trạng hỏng hóc!');
      return;
    }

    const newIncident: FacilityIncident = {
      id: `SC-${Math.floor(1000 + Math.random() * 9000)}`,
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      equipmentCode: selectedEquipment?.code || selectedEquipmentCode,
      equipmentName: selectedEquipment?.name || 'Thiết bị tại sân',
      title: title.trim(),
      description: description.trim(),
      severity,
      severityLabel: severity === 'khan_cap' ? 'Khẩn cấp' : severity === 'trung_binh' ? 'Trung bình' : 'Thấp',
      status: 'cho_xu_ly',
      statusLabel: 'Chờ xử lý',
      reportedAt: `${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} Hôm nay`,
      reporterName,
      technicianNote: technicianNote.trim() || undefined,
    };

    onSubmitIncident(newIncident, severity === 'khan_cap' && autoLockCourt);
  };

  return (
    <div className="flex-1 space-y-4 p-4 pb-28 animate-in fade-in duration-200 w-full max-w-full min-w-0">
      {/* 🟢 Top Navigation Bar */}
      <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">
                BÁO CÁO SỰ CỐ CƠ SỞ
              </span>
            </div>
            <h1 className="text-sm font-black text-slate-900 truncate">
              Ghi Nhận Sự Cố Hỏng Hóc Mới
            </h1>
          </div>
        </div>

        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-700 font-bold text-xs shadow-2xs">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </div>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 flex items-center gap-2 animate-in shake">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Chọn vị trí sân & thiết bị */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Vị trí & Thiết bị liên quan
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khu vực / Sân thi đấu phát sinh <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCourtId}
                onChange={(e) => setSelectedCourtId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              >
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name} {court.isLocked ? '(Đang khóa bảo trì)' : '(Đang mở)'}
                  </option>
                ))}
                <option value="KHO_CHUNG">Kho chung nhà thi đấu (Thiết bị lưu kho)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thiết bị hư hỏng (Dán mã MATB) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedEquipmentCode}
                onChange={(e) => setSelectedEquipmentCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="">-- Chọn thiết bị có dán mã MATB --</option>
                {equipments.map((eq) => (
                  <option key={eq.id} value={eq.code}>
                    [{eq.code}] {eq.name} ({eq.currentLocation})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-400 font-medium">
                Mỗi thiết bị có mã dán nhãn MATB... trên thân để phân biệt cá thể tài sản.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Mức độ nghiêm trọng */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Mức độ nghiêm trọng
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setSeverity('khan_cap');
                setAutoLockCourt(true);
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                severity === 'khan_cap'
                  ? 'border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-300 font-black'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span className="text-xs">🔴 Khẩn cấp</span>
              <span className="text-[10px] opacity-80 mt-0.5">Dừng hoạt động</span>
            </button>

            <button
              type="button"
              onClick={() => setSeverity('trung_binh')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                severity === 'trung_binh'
                  ? 'border-blue-400 bg-blue-50 text-blue-800 ring-2 ring-blue-300 font-black'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span className="text-xs">🟡 Trung bình</span>
              <span className="text-[10px] opacity-80 mt-0.5">Cần sửa sớm</span>
            </button>

            <button
              type="button"
              onClick={() => setSeverity('thap')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition cursor-pointer ${
                severity === 'thap'
                  ? 'border-slate-400 bg-slate-100 text-slate-800 ring-2 ring-slate-300 font-black'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold'
              }`}
            >
              <span className="text-xs">🟢 Nhẹ / Thấp</span>
              <span className="text-[10px] opacity-80 mt-0.5">Không ảnh hưởng</span>
            </button>
          </div>

          {severity === 'khan_cap' && (
            <div className="rounded-xl bg-rose-50/80 border border-rose-200 p-3 space-y-2 animate-in fade-in">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLockCourt}
                  onChange={(e) => setAutoLockCourt(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-rose-600 focus:ring-rose-500 accent-rose-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-rose-900 block">
                    Đồng thời kích hoạt khóa bảo trì sân này ngay lập tức
                  </span>
                  <span className="text-[11px] text-rose-700/80 font-medium leading-relaxed block mt-0.5">
                    Hệ thống sẽ khóa nhận khách mới trên lịch sân để bảo đảm an toàn trận đấu.
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* 3. Chi tiết sự cố */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Chi tiết sự cố hỏng hóc
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề ngắn gọn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Rách góc thảm sàn Vinyl hoặc Đèn LED Line 2 chập chờn..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả hiện trường & Phương án đề xuất <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Ghi rõ hiện trạng: vị trí hư hỏng, ảnh hưởng thi đấu, đã điều phối ai xử lý tạm thời..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú kỹ thuật viên / Thời gian xử lý dự kiến
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Đã xuất keo dán nhiệt, dự kiến khắc phục xong trước 17:00..."
                value={technicianNote}
                onChange={(e) => setTechnicianNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* 🟢 Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Gửi báo cáo sự cố</span>
          </button>
        </div>
      </form>
    </div>
  );
}
