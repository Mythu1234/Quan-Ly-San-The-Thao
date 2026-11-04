import { useState } from 'react';
import { ChevronLeft, Check, ShieldCheck, Phone } from 'lucide-react';
import type { FacilityEquipment, EquipmentCategory } from '../../types/admin';
import { getVietnamToday } from '../../hooks/useVietnamToday';
import IncidentSelect from './IncidentSelect';

const formatCalendarDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

const formatDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const isValidDateInput = (value: string) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return year >= 1000 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

interface AddEquipmentViewProps {
  existingCount: number;
  initialEquipment?: FacilityEquipment;
  embedded?: boolean;
  onSavingChange?: (saving: boolean) => void;
  onBack: () => void;
  onAddEquipment: (newEq: FacilityEquipment) => void | Promise<void>;
}

export default function AddEquipmentView({ existingCount, initialEquipment, embedded=false, onSavingChange, onBack, onAddEquipment }: AddEquipmentViewProps) {
  const nextNum = existingCount + 1;
  const defaultCode = `TB${String(nextNum).padStart(8, '0')}`;

  const [name, setName] = useState(initialEquipment?.name||'');
  const [sportType, setSportType] = useState<'CauLong' | 'BongChuyen' | 'BongDa' | 'DungChung'>(()=>initialEquipment&&['CauLong','BongChuyen','BongDa','DungChung'].includes(initialEquipment.sportType)?initialEquipment.sportType as 'CauLong'|'BongChuyen'|'BongDa'|'DungChung':'CauLong');
  const [healthRate, setHealthRate] = useState(initialEquipment?.healthRate||'Mới 100%');
  const [purchasePrice, setPurchasePrice] = useState(String(initialEquipment?.purchasePrice??''));
  const [compensationPrice, setCompensationPrice] = useState(String(initialEquipment?.compensationPrice??''));
  const [initialToday] = useState(getVietnamToday);
  const [purchaseDate, setPurchaseDate] = useState(() => initialEquipment?initialEquipment.purchaseDate:formatCalendarDate(initialToday));
  const [warrantyExpire, setWarrantyExpire] = useState(initialEquipment?.warrantyExpire||'');
  const [supplier, setSupplier] = useState(initialEquipment?.supplier||'');
  const [supplierPhone, setSupplierPhone] = useState(initialEquipment?.supplierPhone||'');
  const [warrantyAddress, setWarrantyAddress] = useState(initialEquipment?.warrantyAddress||'');
  const [serialNumber, setSerialNumber] = useState(initialEquipment?.serialNumber||'');
  const [notes, setNotes] = useState(initialEquipment?.notes||'');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!name.trim()) { setErrorMessage('Vui lòng nhập tên thiết bị!'); return; }
    if (!sportType) { setErrorMessage('Vui lòng chọn bộ môn!'); return; }
    if (!healthRate.trim()) { setErrorMessage('Vui lòng nhập tình trạng thiết bị!'); return; }
    if ((purchaseDate && !isValidDateInput(purchaseDate)) || (warrantyExpire && !isValidDateInput(warrantyExpire))) {
      setErrorMessage('Ngày nhập và hạn bảo hành phải là ngày hợp lệ theo định dạng dd/mm/yyyy!');
      return;
    }
    const price = Number(compensationPrice);
    const buyPrice = purchasePrice.trim() === '' ? null : Number(purchasePrice);
    if (buyPrice !== null && (!Number.isSafeInteger(buyPrice) || buyPrice < 0)) {
      setErrorMessage('Vui lòng nhập giá mua là số nguyên không âm!');
      return;
    }
    if (!Number.isSafeInteger(price) || price <= 0) {
      setErrorMessage('Vui lòng nhập giá bồi thường là số nguyên lớn hơn 0!');
      return;
    }

    const newEquipment: FacilityEquipment = {
      ...initialEquipment,
      id: initialEquipment?.id||'',
      code: initialEquipment?.code||defaultCode,
      name: name.trim(),
      category: 'dung_cu' as EquipmentCategory,
      categoryLabel: 'Dụng cụ',
      sportType,
      currentLocation: 'Kho chung',
      status: 'san_sang',
      statusLabel: 'Sẵn sàng',
      healthRate: healthRate.trim() || 'Tốt',
      purchaseDate,
      purchasePrice: buyPrice,
      compensationPrice: price,
      warrantyExpire,
      supplier: supplier.trim(),
      supplierPhone: supplierPhone.trim(),
      warrantyAddress: warrantyAddress.trim(),
      serialNumber: serialNumber.trim(),
      notes: notes.trim(),
    };

    setIsSaving(true);
    onSavingChange?.(true);
    try {
      await onAddEquipment(newEquipment);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Chưa lưu được thiết bị. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
      onSavingChange?.(false);
    }

  };

  return (
    <div className={`flex-1 space-y-3 w-full max-w-full min-w-0 ${embedded?'':'p-3'}`}>

      {/* Header */}
      {!embedded&&<div className="flex items-center gap-2">
        <button type="button" disabled={isSaving} onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h1 className="text-lg font-black tracking-tight text-slate-900">
          {initialEquipment?'Chỉnh sửa thiết bị':<>Thêm thiết bị <span className="text-emerald-600">mới</span></>}
        </h1>
      </div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Card 1: Thông tin cơ bản */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
          {/* Tên thiết bị — full row */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tên thiết bị <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => { setName(e.target.value); setErrorMessage(null); }}
              placeholder="Ví dụ: Bộ cột & lưới Yonex Pro, Bóng đá Nike..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Row 2: Bộ môn + Tình trạng */}
          <div className="grid grid-cols-2 gap-2">
            <div className="min-w-0">
              <label htmlFor="equipment-sport" className="block text-[11px] font-bold text-slate-600 mb-1">Bộ môn <span className="text-red-600">*</span></label>
              <IncidentSelect
                id="equipment-sport"
                value={sportType}
                options={[
                  { value: 'CauLong', label: '🏸 Cầu lông' },
                  { value: 'BongChuyen', label: '🏐 Bóng chuyền' },
                  { value: 'BongDa', label: '⚽ Bóng đá' },
                  { value: 'DungChung', label: '🔧 Thiết bị chung' },
                ]}
                placeholder="Chọn bộ môn"
                searchPlaceholder="Bộ môn"
                searchable={false}
                compact
                disabled={isSaving}
                onChange={value => setSportType(value as typeof sportType)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tình trạng <span className="text-red-600">*</span></label>
              <input
                type="text"
                required
                value={healthRate}
                onChange={(e) => setHealthRate(e.target.value)}
                placeholder="Mới 100%, Tốt 95%..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Giá mua & giá bồi thường */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1" htmlFor="equipment-purchase-price">Giá mua</label>
              <div className="relative">
                <input
                  id="equipment-purchase-price"
                  type="number" min="0" step="1" inputMode="numeric"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="Ví dụ: 200000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-12 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="absolute right-3 top-2 text-[10px] font-black text-slate-400">VND</span>
              </div>
            </div>
            <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Giá bồi thường <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min="1"
                step="1"
                inputMode="numeric"
                value={compensationPrice}
                onChange={(e) => setCompensationPrice(e.target.value)}
                placeholder="Ví dụ: 150000"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-12 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-2 text-[10px] font-black text-slate-400">VND</span>
            </div>
            </div>
          </div>
        </div>

        {/* Card 2: Hồ sơ bảo hành */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Bảo hành &amp; Nhà cung cấp</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nhà cung cấp</label>
              <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)}
                placeholder="Yonex VN, Rạng Đông..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Số điện thoại bảo hành</label>
              <div className="relative">
                <input type="tel" value={supplierPhone} onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="1900 6868"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
                />
                <Phone className="w-3 h-3 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Địa chỉ bảo hành</label>
            <input type="text" value={warrantyAddress} onChange={(e) => setWarrantyAddress(e.target.value)}
              placeholder="Địa chỉ tiếp nhận bảo hành (không bắt buộc)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Ngày nhập</label>
              <input type="text" value={purchaseDate} onChange={(e) => setPurchaseDate(formatDateInput(e.target.value))}
                placeholder="dd/mm/yyyy" inputMode="numeric" maxLength={10}
                pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" title="Nhập ngày theo định dạng dd/mm/yyyy"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Hạn bảo hành</label>
              <input type="text" value={warrantyExpire} onChange={(e) => setWarrantyExpire(formatDateInput(e.target.value))}
                placeholder="dd/mm/yyyy" inputMode="numeric" maxLength={10}
                pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" title="Nhập ngày theo định dạng dd/mm/yyyy"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Số Seri</label>
              <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="SN-YN-8821"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Ghi chú</label>
            <textarea rows={1} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Phụ kiện đi kèm, hướng dẫn bảo quản..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" disabled={isSaving} onClick={onBack}
            className="rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 active:scale-95 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button type="submit" disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 py-2.5 text-xs font-black text-white shadow-md active:scale-95 transition cursor-pointer disabled:opacity-60 disabled:cursor-wait"
          >
            <Check className="w-4 h-4" />
            {isSaving ? 'Đang lưu...' : 'Lưu thiết bị'}
          </button>
        </div>
      </form>
    </div>
  );
}
