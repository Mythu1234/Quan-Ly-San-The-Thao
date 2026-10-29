import { useState } from 'react';
import {
  ChevronLeft,
  PlusCircle,
  Tag,
  Dumbbell,
  MapPin,
  Check,
  ShieldCheck,
  Phone,
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
  const [supplier, setSupplier] = useState('Công ty Thể Thao Đại Việt (Yonex VN)');
  const [supplierPhone, setSupplierPhone] = useState('1900 6868');
  const [serialNumber, setSerialNumber] = useState('');
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
      supplier: supplier.trim() || undefined,
      supplierPhone: supplierPhone.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onAddEquipment(newEquipment);
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
            QUẢN TRỊ CƠ SỞ VẬT CHẤT
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-emerald-700 border border-emerald-200 shadow-2xs">
          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mã: EQ-MỚI</span>
        </div>
      </div>

      {/* 🟢 Main Title */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
          THÊM THIẾT BỊ <span className="text-emerald-600">& DỤNG CỤ MỚI</span>
        </h1>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed font-medium">
          Đăng ký mã thiết bị lưu động, thiết lập vị trí lưu trữ và thông tin bảo hành ban đầu.
        </p>
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

        {/* 4. Hồ sơ bảo hành & Nhà cung cấp */}
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Hồ sơ bảo hành & Nhà cung cấp
              </h2>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Chính hãng
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Hãng / Nhà cung cấp
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Ví dụ: Yonex VN, Enlio Floor, Rạng Đông..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Hotline hỗ trợ bảo hành
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="1900 6868 hoặc SĐT thợ"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
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
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Số Seri / Model
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="SN-YN-8821"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="rounded-xl bg-emerald-50/70 border border-emerald-200 p-2.5 flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 text-[11px]">
              Chế độ bảo hành:
            </span>
            <span className="font-black text-emerald-700 text-[11px]">
              Hãng sửa chữa & đổi linh kiện miễn phí trong thời hạn
            </span>
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
