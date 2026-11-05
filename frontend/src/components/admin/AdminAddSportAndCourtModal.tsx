import React, { useState, useEffect } from 'react';
import { X, Layers, PlusCircle, AlertTriangle, Sparkles, Minus, Plus } from 'lucide-react';
import {
  type SportCategoryItem,
  type AdminCourtItem,
  getAdminSports,
  getAdminCourts,
  addNewSportWithCourts,
  addNewCourtsToSport,
  generatePrefix,
} from '../../utils/dynamicCourtStorage';

interface AdminAddSportAndCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string, sportId?: string) => void;
}

const detectSportIcon = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('pickleball')) return '🏓';
  if (lower.includes('tennis') || lower.includes('quần vợt')) return '🎾';
  if (lower.includes('bóng rổ') || lower.includes('basketball')) return '🏀';
  if (lower.includes('bàn') || lower.includes('ping pong')) return '🏓';
  if (lower.includes('bơi') || lower.includes('swim')) return '🏊';
  if (lower.includes('chạy') || lower.includes('điền kinh')) return '🏃';
  if (lower.includes('golf')) return '⛳';
  if (lower.includes('bóng chày') || lower.includes('baseball')) return '⚾';
  if (lower.includes('võ') || lower.includes('karate') || lower.includes('taekwondo') || lower.includes('judo')) return '🥋';
  if (lower.includes('bóng ném')) return '🤾';
  if (lower.includes('billiards') || lower.includes('bida')) return '🎱';
  if (lower.includes('cầu lông') || lower.includes('badminton')) return '🏸';
  if (lower.includes('bóng đá') || lower.includes('football') || lower.includes('soccer')) return '⚽';
  if (lower.includes('bóng chuyền') || lower.includes('volleyball')) return '🏐';
  return '🏅';
};

export default function AdminAddSportAndCourtModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminAddSportAndCourtModalProps) {
  const [activeTab, setActiveTab] = useState<'court' | 'sport'>('court');

  // Sports & Courts data
  const [sports, setSports] = useState<SportCategoryItem[]>([]);
  const [courts, setCourts] = useState<AdminCourtItem[]>([]);

  // Tab 1: Thêm Sân State
  const [selectedSportId, setSelectedSportId] = useState<string>('');
  const [courtQuantity, setCourtQuantity] = useState<number>(1);
  const [courtPrice, setCourtPrice] = useState<number>(120000);

  // Tab 2: Thêm Bộ Môn State
  const [sportName, setSportName] = useState<string>('');
  const [sportPrefix, setSportPrefix] = useState<string>('PB');
  const [sportPrice, setSportPrice] = useState<number>(150000);
  const [initialCourtsCount, setInitialCourtsCount] = useState<number>(2);

  // Error & Status
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Load current sports & courts
  useEffect(() => {
    if (isOpen) {
      const s = getAdminSports();
      const c = getAdminCourts();
      setSports(s);
      setCourts(c);
      setErrorMsg('');

      if (s.length > 0 && !selectedSportId) {
        setSelectedSportId(s[0].id);
        setCourtPrice(s[0].pricePerHour);
      }
    }
  }, [isOpen]);

  // When selected sport changes in Tab 1, update default price
  const handleSportChange = (sportId: string) => {
    setSelectedSportId(sportId);
    const sp = sports.find((s) => s.id === sportId);
    if (sp) {
      setCourtPrice(sp.pricePerHour);
    }
  };

  // When sport name changes in Tab 2, suggest prefix
  const handleSportNameChange = (name: string) => {
    setSportName(name);
    if (name.trim()) {
      setSportPrefix(generatePrefix(name));
    }
  };

  if (!isOpen) return null;

  // Selected sport object for Tab 1
  const activeSport = sports.find((s) => s.id === selectedSportId);
  const currentSportCourts = courts.filter((c) => c.sportId === selectedSportId);

  // Calculate preview of new courts in Tab 1
  const getTab1PreviewCodes = () => {
    if (!activeSport) return [];
    let maxIndex = 0;
    currentSportCourts.forEach((c) => {
      const match = c.code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIndex) maxIndex = num;
      }
    });

    const preview: string[] = [];
    for (let i = 1; i <= Math.min(courtQuantity, 5); i++) {
      const nextIdx = maxIndex + i;
      preview.push(`Sân ${activeSport.prefix}-${nextIdx.toString().padStart(2, '0')}`);
    }
    if (courtQuantity > 5) {
      preview.push(`...và ${courtQuantity - 5} sân tiếp theo`);
    }
    return preview;
  };

  // Calculate preview of initial courts in Tab 2
  const getTab2PreviewCodes = () => {
    const pfx = sportPrefix.trim().toUpperCase() || 'SN';
    const preview: string[] = [];
    for (let i = 1; i <= Math.min(initialCourtsCount, 5); i++) {
      preview.push(`Sân ${pfx}-${i.toString().padStart(2, '0')}`);
    }
    if (initialCourtsCount > 5) {
      preview.push(`...và ${initialCourtsCount - 5} sân tiếp theo`);
    }
    return preview;
  };

  // Submit Tab 1: Thêm Sân
  const handleAddCourts = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedSportId) {
      setErrorMsg('Vui lòng chọn bộ môn cần thêm sân!');
      return;
    }
    if (courtQuantity < 1) {
      setErrorMsg('Số lượng sân thêm tối thiểu là 1!');
      return;
    }
    if (courtPrice <= 0) {
      setErrorMsg('Đơn giá thuê sân phải lớn hơn 0 VNĐ!');
      return;
    }

    const res = await addNewCourtsToSport({
      sportId: selectedSportId,
      quantity: courtQuantity,
      pricePerHour: courtPrice,
    });

    if (res.success && res.createdCourts) {
      const spName = activeSport?.name || 'môn';
      const msg = `Đã thêm thành công ${res.createdCourts.length} sân mới cho ${spName}!`;
      onClose();
      onSuccess?.(msg, selectedSportId);
    } else {
      setErrorMsg(res.message || 'Chưa thể thêm sân. Vui lòng thử lại!');
    }
  };

  // Submit Tab 2: Thêm Môn
  const handleAddSport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!sportName.trim()) {
      setErrorMsg('Vui lòng nhập tên bộ môn!');
      return;
    }
    if (sportPrice <= 0) {
      setErrorMsg('Đơn giá chuẩn phải lớn hơn 0 VNĐ!');
      return;
    }

    const res = await addNewSportWithCourts({
      name: sportName,
      icon: detectSportIcon(sportName),
      pricePerHour: sportPrice,
      prefix: sportPrefix,
      initialCourtCount: initialCourtsCount,
    });

    if (res.success && res.sport) {
      const courtNote = initialCourtsCount > 0 ? ` kèm ${initialCourtsCount} sân mới` : '';
      const msg = `Đã tạo thành công bộ môn "${res.sport.name}"${courtNote}!`;
      onClose();
      onSuccess?.(msg, res.sport.id);
    } else {
      setErrorMsg(res.message || 'Chưa thể tạo bộ môn. Vui lòng kiểm tra lại!');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-4 py-3.5 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white backdrop-blur-xs">
              <PlusCircle className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white leading-tight">Thêm Sân & Bộ Môn</h2>
              <p className="text-[10px] text-emerald-100 font-medium leading-tight">Mở rộng cơ sở vật chất sân CourtX</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2.5 bg-slate-50 border-b border-slate-100 shrink-0">
          <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl text-xs font-black">
            <button
              type="button"
              onClick={() => {
                setActiveTab('court');
                setErrorMsg('');
              }}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'court'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Thêm Sân Mới
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sport');
                setErrorMsg('');
              }}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'sport'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Thêm Bộ Môn
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto no-scrollbar flex-1 space-y-3.5">
          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: THÊM SÂN */}
          {activeTab === 'court' && (
            <form onSubmit={handleAddCourts} className="space-y-3">
              {/* Chọn bộ môn */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  1. Chọn Bộ môn <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedSportId}
                  onChange={(e) => handleSportChange(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {sports.map((s) => {
                    const cnt = courts.filter((c) => c.sportId === s.id).length;
                    return (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name} (hiện có {cnt} sân)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Số lượng sân cần thêm */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    2. Số lượng sân cần thêm <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +{courtQuantity} sân
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCourtQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center font-black text-slate-700 transition cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={courtQuantity}
                    onChange={(e) => setCourtQuantity(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                    className="flex-1 h-10 px-3 text-center bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCourtQuantity((q) => Math.min(20, q + 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center font-black text-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview mã sân sẽ thêm */}
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px]">
                <p className="font-bold text-emerald-900 mb-1">Dự kiến tạo:</p>
                <div className="flex flex-wrap gap-1.5">
                  {getTab1PreviewCodes().map((name, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800 font-extrabold text-[10px]">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Đơn giá thuê */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  3. Đơn giá thuê / giờ (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={10000}
                    min={10000}
                    value={courtPrice}
                    onChange={(e) => setCourtPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">
                    đ / giờ
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Xác nhận thêm {courtQuantity} Sân
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: THÊM BỘ MÔN */}
          {activeTab === 'sport' && (
            <form onSubmit={handleAddSport} className="space-y-3">
              {/* Tên bộ môn */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  1. Tên Bộ môn mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Pickleball, Tennis, Bóng rổ..."
                  value={sportName}
                  onChange={(e) => handleSportNameChange(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Mã tiền tố */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    2. Mã tiền tố sân (Prefix) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Tự động tạo theo tên môn
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={5}
                  value={sportPrefix}
                  onChange={(e) => setSportPrefix(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 uppercase bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: PB (tạo các sân PB-01, PB-02...)"
                />
              </div>

              {/* Đơn giá tiêu chuẩn */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1">
                  3. Đơn giá tiêu chuẩn / giờ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={10000}
                    min={10000}
                    value={sportPrice}
                    onChange={(e) => setSportPrice(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-slate-400 pointer-events-none">
                    đ / giờ
                  </span>
                </div>
              </div>

              {/* Số lượng sân khởi tạo ban đầu */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                    4. Số lượng sân khởi tạo <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {initialCourtsCount} sân ban đầu
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInitialCourtsCount((q) => Math.max(0, q - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center font-black text-slate-700 transition cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={initialCourtsCount}
                    onChange={(e) => setInitialCourtsCount(Math.max(0, Math.min(20, parseInt(e.target.value, 10) || 0)))}
                    className="flex-1 h-10 px-3 text-center bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setInitialCourtsCount((q) => Math.min(20, q + 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center font-black text-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Preview sân ban đầu */}
              {initialCourtsCount > 0 && (
                <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-[11px]">
                  <p className="font-bold text-teal-900 mb-1">Dự kiến tạo sẵn:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {getTab2PreviewCodes().map((name, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-teal-200 text-teal-800 font-extrabold text-[10px]">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-700/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Tạo Bộ Môn {initialCourtsCount > 0 ? `(${initialCourtsCount} sân)` : ''}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
