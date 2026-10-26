import { useState, useRef } from 'react';
import {
  ChevronLeft,
  AlertTriangle,
  Flame,
  Send,
  Building2,
  Tag,
  Camera,
  Upload,
  X,
  CheckCircle2,
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

  // 🟢 Mandatory image upload states (UC-03)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample incident photos for quick testing
  const SAMPLE_INCIDENT_PHOTOS = [
    {
      id: 'sample-vinyl',
      label: 'Rách mép thảm Vinyl Court 3',
      url: '/images/court_vinyl_damage.jpg',
      badge: 'Thảm sàn',
    },
    {
      id: 'sample-led',
      label: 'Cháy đèn LED giàn Line 2',
      url: '/images/court_led_lights.jpg',
      badge: 'Hệ thống đèn',
    },
    {
      id: 'sample-badminton',
      label: 'Lệch cột lưới & vạch biên',
      url: '/images/badminton_court_1789660096896.jpg',
      badge: 'Cột lưới',
    },
    {
      id: 'sample-pickleball',
      label: 'Lún sụt sàn thi đấu ngoài trời',
      url: '/images/pickleball_court_1789660134654.jpg',
      badge: 'Mặt sân',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // UC-03 Exception flow 7a: Max 5MB
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setImageError(`Ảnh vượt quá dung lượng cho phép (tối đa ${MAX_SIZE_MB}MB)! Vui lòng chọn ảnh nhẹ hơn.`);
      setErrorMessage(`Ảnh vượt quá dung lượng cho phép (tối đa ${MAX_SIZE_MB}MB)!`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('Tệp tải lên không đúng định dạng hình ảnh (.jpg, .png, .webp)!');
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ!');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setImageFileName(file.name);
      setImageError(null);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSamplePhoto = (sampleUrl: string, sampleLabel: string) => {
    setImagePreview(sampleUrl);
    setImageFileName(sampleLabel);
    setImageError(null);
    setErrorMessage(null);
  };

  const handleRemovePhoto = () => {
    setImagePreview(null);
    setImageFileName(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

    // 🟢 Mandatory image validation
    if (!imagePreview) {
      setImageError('Ảnh chụp hiện trường sự cố là BẮT BUỘC theo quy định kiểm soát cơ sở vật chất!');
      setErrorMessage('Vui lòng tải lên hoặc chụp ảnh hiện trường sự cố hỏng hóc (Bắt buộc)!');
      return;
    }

    const newIncident: FacilityIncident = {
      id: `SC-${Math.floor(1000 + Math.random() * 9000)}`,
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      courtZone: 'Khu A',
      courtSubtype: selectedCourt.name.includes('VIP') ? 'Sân Tiêu Chuẩn Quốc Tế' : 'Sân Tiêu Chuẩn',
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
      imageUrl: imagePreview,
      images: [imagePreview],
      damageItems: [
        {
          id: `DM-${Date.now()}`,
          equipmentCode: selectedEquipment?.code || selectedEquipmentCode,
          title: title.trim(),
          riskBadge: severity === 'khan_cap' ? 'Nguy cơ cao' : severity === 'trung_binh' ? 'Cần sửa sớm' : 'Hỏng nhẹ',
          riskColor: severity === 'khan_cap' ? 'rose' : severity === 'trung_binh' ? 'blue' : 'amber',
          description: description.trim(),
          imageLabel: imageFileName ? `Ảnh: ${imageFileName}` : 'Ảnh chụp hiện trường sự cố',
          imageUrl: imagePreview,
        },
      ],
    };

    onSubmitIncident(newIncident, severity === 'khan_cap' && autoLockCourt);
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
            BÁO CÁO SỰ CỐ CƠ SỞ
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-rose-700 border border-slate-200 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Mã: SC-MỚI</span>
        </div>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          GHI NHẬN SỰ CỐ <span className="text-emerald-600">& HỎNG HÓC</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Khai báo thông tin sự cố hư hỏng cơ sở vật chất, thiết bị và kích hoạt khóa sân bảo trì.
        </p>
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

        {/* 4. Hình ảnh hiện trường sự cố (BẮT BUỘC) */}
        <div
          className={`rounded-2xl border bg-white p-4 shadow-2xs space-y-3 transition ${
            imageError ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Hình ảnh hiện trường sự cố <span className="text-rose-500">*</span>
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Bắt buộc
            </span>
          </div>

          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            Chụp trực tiếp tại hiện trường hoặc tải ảnh lên từ máy (JPG, PNG, WEBP tối đa 5MB) để lưu bằng chứng đối soát kỹ thuật.
          </p>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {imageError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{imageError}</span>
            </div>
          )}

          {imagePreview ? (
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-video shadow-2xs">
                <img
                  src={imagePreview}
                  alt="Ảnh hiện trường sự cố"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex items-end p-3">
                  <div className="flex items-center justify-between w-full text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs font-bold truncate">
                        {imageFileName || 'Ảnh hiện trường đã chọn'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white transition active:scale-95 cursor-pointer shadow shrink-0"
                      title="Xóa ảnh này"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã tải ảnh hiện trường hợp lệ
                </span>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 px-3 py-1 rounded-xl transition cursor-pointer border border-slate-200"
                >
                  Thay đổi ảnh khác
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Dropzone Upload Button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition cursor-pointer group ${
                  imageError
                    ? 'border-rose-400 bg-rose-50/50 hover:bg-rose-50'
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/40'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition shadow-2xs mb-2">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-slate-800 group-hover:text-emerald-700">
                  Chụp ảnh hoặc Tải ảnh từ thiết bị
                </span>
                <span className="text-[10.5px] text-slate-400 font-medium mt-1">
                  Định dạng PNG, JPG, WEBP (Tối đa 5MB)
                </span>
                <span className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  Chọn tệp ảnh
                </span>
              </div>

              {/* Quick Select Sample Photos */}
              <div className="pt-1">
                <span className="text-[10.5px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Hoặc chọn nhanh ảnh mẫu hiện trường để kiểm thử:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_INCIDENT_PHOTOS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSamplePhoto(sample.url, sample.label)}
                      className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-emerald-300 text-left transition cursor-pointer active:scale-98"
                    >
                      <img
                        src={sample.url}
                        alt={sample.label}
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-100"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10.5px] font-bold text-slate-800 block truncate leading-tight">
                          {sample.label}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-bold">
                          {sample.badge}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
