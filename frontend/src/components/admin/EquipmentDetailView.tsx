import { useState } from 'react';
import {
  ChevronLeft,
  ArrowRightLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Layers,
  Lightbulb,
  Sparkles,
  Wrench,
  ShieldCheck,
  Tag,
  Phone,
} from 'lucide-react';
import type { FacilityEquipment } from '../../types/admin';

interface EquipmentDetailViewProps {
  equipment: FacilityEquipment;
  onBack: () => void;
  onRelocate: (eq: FacilityEquipment) => void;
  onReportIncident: (eq: FacilityEquipment) => void;
  onCompleteMaintenance?: (eq: FacilityEquipment) => void;
}

export default function EquipmentDetailView({
  equipment,
  onBack,
  onRelocate,
  onReportIncident,
  onCompleteMaintenance,
}: EquipmentDetailViewProps) {
  const [currentEq, setCurrentEq] = useState<FacilityEquipment>(equipment);
  const [maintainedSuccess, setMaintainedSuccess] = useState(false);

  const handleAcceptance = () => {
    const today = new Date().toLocaleDateString('vi-VN');
    const formattedDate = `Hôm nay (${today})`;
    const updated: FacilityEquipment = {
      ...currentEq,
      status: 'san_sang',
      statusLabel: 'Sẵn sàng',
      healthRate: 'Tốt (Đã nghiệm thu bảo hành)',
      lastMaintenance: formattedDate,
    };
    setCurrentEq(updated);
    setMaintainedSuccess(true);
    if (onCompleteMaintenance) {
      onCompleteMaintenance(updated);
    }
  };
  const getEquipmentIcon = (category: string) => {
    switch (category) {
      case 'tru_luoi':
        return <span className="text-xl">🏸</span>;
      case 'tham_san':
        return <Layers className="w-5 h-5 text-rose-600" />;
      case 'chieu_sang':
        return <Lightbulb className="w-5 h-5 text-amber-600" />;
      case 've_sinh':
        return <Sparkles className="w-5 h-5 text-blue-600" />;
      default:
        return <Wrench className="w-5 h-5 text-emerald-600" />;
    }
  };

  const getSportTypeLabel = (sport: string) => {
    switch (sport) {
      case 'CauLong':
        return 'Cầu lông';
      case 'BongChuyen':
        return 'Bóng chuyền';
      case 'BongDa':
        return 'Bóng đá trong nhà';
      case 'Pickleball':
        return 'Pickleball';
      default:
        return 'Dùng chung đa năng';
    }
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
            HỒ SƠ THIẾT BỊ VẬN HÀNH
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-700 border border-slate-200 shadow-2xs">
          <Tag className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mã dán: {currentEq.code}</span>
        </div>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          CHI TIẾT THIẾT BỊ <span className="text-emerald-600">& VỊ TRÍ</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Hồ sơ kỹ thuật, tình trạng sử dụng và phân bổ thiết bị lưu động.
        </p>
      </div>

      {/* 🟢 Thông báo sau khi nghiệm thu thành công */}
      {maintainedSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3.5 shadow-sm space-y-1 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>ĐÃ NGHIỆM THU BẢO HÀNH THÀNH CÔNG!</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
            Thiết bị [{currentEq.code}] đã chuyển về trạng thái 🟢 <strong>Sẵn sàng</strong>, cập nhật ngày bảo dưỡng gần nhất là <strong>{currentEq.lastMaintenance}</strong> và tự động cập nhật vào Nhật ký xử lý sự cố.
          </p>
          <p className="text-[10px] text-slate-500 italic">
            * Lưu ý: Trạng thái đóng/mở sân vẫn giữ nguyên theo quyền quyết định của Quản lý sân.
          </p>
        </div>
      )}

      {/* 🟢 Hero Profile Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 shadow-2xs">
            {getEquipmentIcon(currentEq.category)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-300">
                {currentEq.code}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                {currentEq.categoryLabel}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                {getSportTypeLabel(currentEq.sportType)}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                currentEq.status === 'san_sang'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : currentEq.status === 'dang_su_dung'
                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                {currentEq.status === 'san_sang' ? '🟢 Sẵn sàng' : currentEq.statusLabel}
              </span>
            </div>

            <h3 className="text-base font-black text-slate-900 leading-snug">
              {currentEq.name}
            </h3>
          </div>
        </div>

        {/* 2 Stat Boxes */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Vị trí hiện tại
            </span>
            <span className="font-black text-slate-900 text-sm mt-0.5 block">
              {currentEq.currentLocation}
            </span>
          </div>

          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-3 text-center">
            <span className="text-[10px] font-bold text-emerald-600 block uppercase tracking-wider">
              Tình trạng
            </span>
            <span className="font-black text-emerald-800 text-sm mt-0.5 block">
              {currentEq.healthRate}
            </span>
          </div>
        </div>
      </div>

      {/* 🟢 Trạng thái ca đặt sân / Sẵn sàng */}
      {currentEq.assignedTimeSlot ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-4 space-y-3 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black text-amber-900">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Đang phục vụ ca thi đấu</span>
          </div>

          <div className="space-y-2 text-xs bg-white rounded-2xl p-3 border border-amber-200/60">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Khung giờ ca:</span>
              <span className="font-bold text-slate-800">{currentEq.assignedTimeSlot}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Mã booking:</span>
              <span className="font-bold text-amber-800">
                {currentEq.assignedBookingCode || 'BK-8491'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Khách đặt sân:</span>
              <span className="font-bold text-slate-800">
                {currentEq.assignedCustomer || 'Khách đặt sân'}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-amber-800 font-medium italic">
            💡 Thiết bị sẽ được tự động hoàn trả về Kho chung khi nhân viên xác nhận Check-out sân.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-blue-100 bg-blue-50/50 p-4 flex items-center gap-3 shadow-2xs">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-800 font-medium leading-relaxed">
            Thiết bị đang ở trạng thái <span className="font-bold text-emerald-700">🟢 Sẵn sàng</span>, có thể điều phối linh hoạt đến bất kỳ sân nào theo lịch thi đấu.
          </p>
        </div>
      )}

      {/* 🟢 Thông số & Hồ sơ tài sản */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3 text-xs">
        <div className="flex items-center gap-2 font-black text-slate-800 text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Thông số kỹ thuật & Bảo hành</span>
        </div>

        <div className="space-y-2 divide-y divide-slate-100">
          <div className="flex justify-between pt-1">
            <span className="text-slate-500 font-medium">Mã định danh nội bộ:</span>
            <span className="font-bold text-slate-800">{currentEq.id} ({currentEq.code})</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 font-medium">Bộ môn thi đấu:</span>
            <span className="font-bold text-slate-800">{getSportTypeLabel(currentEq.sportType)}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 font-medium">Hãng / Nhà cung cấp:</span>
            <span className="font-bold text-slate-800">{currentEq.supplier || 'Công ty Thể Thao Đại Việt (Yonex VN)'}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 font-medium">Hotline bảo hành:</span>
            <a
              href={`tel:${currentEq.supplierPhone || '19006868'}`}
              className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>{currentEq.supplierPhone || '1900 6868'}</span>
            </a>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 font-medium">Số Seri / Model:</span>
            <span className="font-bold text-slate-800 font-mono">{currentEq.serialNumber || currentEq.code}</span>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 font-medium">Ngày nhập kho:</span>
            <span className="font-bold text-slate-800">{currentEq.purchaseDate || '15/01/2026'}</span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-slate-500 font-medium">Hạn bảo hành:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800">{currentEq.warrantyExpire || '15/01/2028'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Còn bảo hành
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <span className="text-slate-500 font-medium">Bảo dưỡng gần nhất (lastMaintenance):</span>
            <span className="font-bold text-emerald-700">{currentEq.lastMaintenance || 'Hôm nay (25/10/2026)'}</span>
          </div>

          {currentEq.notes && (
            <div className="pt-2">
              <span className="text-slate-500 font-medium block mb-1">Ghi chú kỹ thuật:</span>
              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed font-medium">
                {currentEq.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 🟢 Action Buttons */}
      <div className="pt-2 space-y-2.5">
        {/* Nút Nghiệm thu / Đã bảo hành xong */}
        <button
          type="button"
          disabled={currentEq.status === 'san_sang' && maintainedSuccess}
          onClick={handleAcceptance}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black transition active:scale-95 cursor-pointer shadow-md ${
            currentEq.status === 'san_sang' && maintainedSuccess
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          <span>
            {currentEq.status === 'san_sang' && maintainedSuccess
              ? '✓ Thiết bị đã nghiệm thu (🟢 Sẵn sàng)'
              : 'Xác nhận đã bảo hành xong / Nghiệm thu'}
          </span>
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onRelocate(currentEq)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-900 py-3 text-xs font-black text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Điều phối vị trí</span>
          </button>

          <button
            type="button"
            onClick={() => onReportIncident(currentEq)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 py-3 text-xs font-black text-rose-700 transition active:scale-95 cursor-pointer shadow-2xs"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Báo hỏng</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 py-3 text-xs font-bold text-slate-600 transition cursor-pointer"
        >
          Quay lại danh mục thiết bị
        </button>
      </div>
    </div>
  );
}
