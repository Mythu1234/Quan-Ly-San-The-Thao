import { useState } from 'react';
import {
  ChevronLeft,
  PlusCircle,
  Tag,
  Dumbbell,
  MapPin,
  Calendar,
  Check,
} from 'lucide-react';
import type { FacilityEquipment, EquipmentCategory } from '../../types/admin';

interface AddEquipmentViewProps {
  existingCount: number;
  onBack: () => void;
  onAddEquipment: (newEq: FacilityEquipment) => void;
}

export default function AddEquipmentView({
  existingCount,
  onBack,
  onAddEquipment,
}: AddEquipmentViewProps) {
  const nextNum = existingCount + 1;
  const defaultCode = `MATB-${String(nextNum).padStart(2, '0')}`;

  const [code, setCode] = useState(defaultCode);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('dung_cu');
  const [sportType, setSportType] = useState<'CauLong' | 'BongChuyen' | 'BongDa' | 'DungChung'>('CauLong');
  const [currentLocation, setCurrentLocation] = useState('Kho chung');
  const [healthRate, setHealthRate] = useState('Mới 100%');
  const [purchaseDate, setPurchaseDate] = useState('16/10/2026');
  const [warrantyExpire, setWarrantyExpire] = useState('16/10/2028');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getCategoryLabel = (cat: EquipmentCategory) => {
    switch (cat) {
      case 'tru_luoi': return 'Trụ & Lưới';
      case 'tham_san': return 'Mặt thảm';
      case 'chieu_sang': return 'Chiếu sáng';
      case 'dung_cu': return 'Dụng cụ';
      case 've_sinh': return 'Vệ sinh';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên trang thiết bị!');
      return;
    }
    if (!code.trim()) {
      setErrorMessage('Vui lòng nhập mã dán thiết bị (MATB...)!');
      return;
    }

    const newEquipment: FacilityEquipment = {
      id: `EQ${String(nextNum).padStart(2, '0')}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      categoryLabel: getCategoryLabel(category),
      sportType,
      currentLocation,
      status: currentLocation === 'Kho chung' ? 'san_sang' : 'dang_su_dung',
      statusLabel: currentLocation === 'Kho chung' ? 'Sẵn sàng' : 'Đang sử dụng',
      healthRate: healthRate.trim() || 'Tốt',
      purchaseDate,
      warrantyExpire,
      notes: notes.trim() || undefined,
    };

    onAddEquipment(newEquipment);
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
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                THÊM THIẾT BỊ LƯU ĐỘNG
              </span>
            </div>
            <h1 className="text-sm font-black text-slate-900 truncate">
              Nhập Thiết Bị & Đăng Ký Mã Dán
            </h1>
          </div>
        </div>

        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs shadow-2xs">
          <PlusCircle className="w-4 h-4" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* 1. Mã dán & Tên thiết bị */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Mã dán thiết bị & Tên gọi
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mã dán (MATB) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MATB-11"
                className="w-full rounded-xl border border-emerald-300 bg-emerald-50/50 p-2.5 text-xs font-black text-emerald-800 outline-none focus:border-emerald-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tên thiết bị <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Ví dụ: Bộ cột & lưới Yonex Pro, Máy sấy..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Mỗi thiết bị được dán tem định danh mã riêng (ví dụ: MATB-01, MATB-02) để nhân viên dễ dàng kiểm kê và điều phối lưu động.
          </p>
        </div>

        {/* 2. Nhóm & Bộ môn */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Phân loại & Bộ môn áp dụng
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nhóm thiết bị
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="tru_luoi">Trụ & Lưới</option>
                <option value="tham_san">Mặt thảm</option>
                <option value="chieu_sang">Chiếu sáng</option>
                <option value="dung_cu">Dụng cụ thi đấu</option>
                <option value="ve_sinh">Vệ sinh sân bãi</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Bộ môn
              </label>
              <select
                value={sportType}
                onChange={(e) => setSportType(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="CauLong">Cầu lông</option>
                <option value="BongChuyen">Bóng chuyền</option>
                <option value="BongDa">Bóng đá mini</option>
                <option value="DungChung">Dùng chung</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Vị trí lưu động & Tình trạng */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Vị trí lưu động & Tình trạng
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Vị trí lưu động ban đầu
              </label>
              <select
                value={currentLocation}
                onChange={(e) => setCurrentLocation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="Kho chung">Kho chung (Sẵn sàng điều phối)</option>
                <option value="Sân 01">Sân 01</option>
                <option value="Sân 02">Sân 02</option>
                <option value="Sân 03">Sân 03</option>
                <option value="Sân 04">Sân 04</option>
                <option value="Sân 05">Sân 05</option>
                <option value="Sân 06">Sân 06</option>
                <option value="Sân 07">Sân 07</option>
                <option value="Sân 08">Sân 08</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tình trạng / Độ mới
              </label>
              <input
                type="text"
                value={healthRate}
                onChange={(e) => setHealthRate(e.target.value)}
                placeholder="Ví dụ: Mới 100%, Tốt (95%)..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* 4. Ngày nhập & Bảo hành */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Hạn bảo hành & Thông số
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Ngày nhập
              </label>
              <input
                type="text"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Hạn bảo hành
              </label>
              <input
                type="text"
                value={warrantyExpire}
                onChange={(e) => setWarrantyExpire(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Ghi chú thêm
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Thông số kỹ thuật, phụ kiện đi kèm, hướng dẫn bảo quản..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
            />
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
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 py-3 text-xs font-black text-white shadow-md shadow-emerald-700/25 active:scale-95 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lưu thiết bị</span>
          </button>
        </div>
      </form>
    </div>
  );
}
