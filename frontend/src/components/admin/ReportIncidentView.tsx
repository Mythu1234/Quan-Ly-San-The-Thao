import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Camera, X, Check, AlertTriangle } from 'lucide-react';
import type { FacilityEquipment, FacilityIncident, CourtStatusItem } from '../../types/admin';
import type { IncidentReporter } from '../../utils/incidentStorage';
import { DATA, useCompensationCatalog } from '../../utils/compensationCatalog';
import IncidentSelect from './IncidentSelect';

interface ReportIncidentViewProps {
  currentUser: IncidentReporter;
  equipments: FacilityEquipment[];
  courts: CourtStatusItem[];
  onBack: () => void;
  onSubmitIncident: (incident: FacilityIncident, lockCourt: boolean) => void | Promise<void>;
}

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600';
const labelClass = 'mb-0.5 block text-[11px] font-semibold text-slate-700';
const requiredMark = <span className="text-red-600">*</span>;
const severities = [
  { value: 'khan_cap', label: 'Khẩn cấp', active: 'border-red-300 bg-red-50 text-red-700' },
  { value: 'trung_binh', label: 'Trung bình', active: 'border-amber-300 bg-amber-50 text-amber-800' },
  { value: 'thap', label: 'Nhẹ', active: 'border-emerald-300 bg-emerald-50 text-emerald-800' },
] as const;

export default function ReportIncidentView({ currentUser, equipments, courts, onBack, onSubmitIncident }: ReportIncidentViewProps) {
  const [courtId, setCourtId] = useState(courts[0]?.id || '');
  useEffect(()=>{if(!courtId&&courts.length)setCourtId(courts[0].id);},[courts,courtId]);
  const [compensationItemId, setCompensationItemId] = useState('');
  const compensationItems = useCompensationCatalog(equipments);
  const [severity, setSeverity] = useState<FacilityIncident['severity']>('khan_cap');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [bookingCode, setBookingCode] = useState('');
  const [liability, setLiability] = useState<'DO_KHACH_LAM_HONG' | 'BAO_HANH_SAN_VAN_DONG'>('BAO_HANH_SAN_VAN_DONG');
  const [photo, setPhoto] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [readingPhoto, setReadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.');
      return;
    }
    setReadingPhoto(true);
    setError('');
    const reader = new FileReader();
    reader.onload = () => { setPhoto(String(reader.result)); setPhotoName(file.name); setReadingPhoto(false); };
    reader.onerror = () => { setError('Không đọc được ảnh. Vui lòng chọn lại.'); setReadingPhoto(false); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || readingPhoto) return;
    const court = courts.find(item => item.id === courtId);
    const isCommonArea = courtId === 'CHUNG';
    const priceItem = compensationItems.find(item => item.id === compensationItemId);
    const equipment = priceItem?.equipment?.isCatalogItem?undefined:priceItem?.equipment;
    if ((!court && !isCommonArea) || !priceItem || !title.trim() || !description.trim() || !photo || !currentUser.name.trim()) {
      setError('Vui lòng chọn sân, thiết bị và nhập đủ tiêu đề, mô tả, ảnh.');
      return;
    }
    const now = new Date();
    const id = `SC-${crypto.randomUUID()}`;
    const reportedAt = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const incident: FacilityIncident = {
      id, createdAt: now.toISOString(), updatedAt: now.toISOString(),
      courtId: court?.id, courtName: isCommonArea ? 'Chung' : court!.name,
      isCourtLocked: court?.isLocked || false, equipmentCode: equipment?.code, equipmentName: priceItem.name,
      compensationItemId: priceItem.id, compensationPrice: priceItem.price,
      bookingCode:bookingCode.trim() || undefined, liability, compensationPaymentStatus:'pending',
      title: title.trim(), description: description.trim(), technicianNote: note.trim() || undefined,
      severity, severityLabel: severities.find(item => item.value === severity)!.label,
      status: 'cho_xu_ly', statusLabel: 'Chờ xử lý', reportedAt,
      reporterName: currentUser.name, reporterPhone: currentUser.phone, reporterRole: currentUser.role,
      images: [photo],
      damageItems: [{ id: `DM-${id}`, equipmentCode: equipment?.code, title: priceItem.name,
        description: description.trim(), riskBadge: 'Chờ xử lý', riskColor: 'amber' }],
      timelineLogs: [],
    };
    setError('');
    setSaving(true);
    try { await onSubmitIncident(incident, false); }
    catch (failure) { setError(failure instanceof Error?failure.message:'Chưa lưu được báo cáo. Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="w-full min-w-0 space-y-2 bg-white p-2.5 pb-4">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onBack} disabled={saving} title="Quay lại" className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
        <h1 className="text-base font-bold text-slate-900">Báo cáo sự cố</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        {error && <p role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</p>}
        <fieldset disabled={saving} className="space-y-2 rounded-xl border border-black/15 p-2.5">
          <div className="grid items-start gap-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <label htmlFor="incident-court" className={labelClass}>Sân / khu vực {requiredMark}</label>
              <IncidentSelect compact id="incident-court" value={courtId} onChange={setCourtId} disabled={saving} placeholder={courts.length?'Chọn sân / khu vực':'Đang tải sân...'} searchPlaceholder="Tìm sân / khu vực..." options={[...courts.map(court=>({value:court.id,label:court.name,detail:court.isLocked?'Đang khóa':undefined})),{value:'CHUNG',label:'Chung',detail:'Khu vực ngoài các sân'}]}/>
            </div>
            <div>
              <label htmlFor="incident-equipment" className={labelClass}>Thiết bị {requiredMark}</label>
              <IncidentSelect compact id="incident-equipment" value={compensationItemId} onChange={setCompensationItemId} disabled={saving} placeholder="Chọn thiết bị" searchPlaceholder="Tìm tên thiết bị..." options={Object.entries(DATA).flatMap(([sport,info])=>compensationItems.filter(item=>item.sport===sport).map(item=>({value:item.id,label:item.name,group:info.label,detail:`${item.price.toLocaleString('vi-VN')} VND`})))} />
            </div>
          </div>
          <div>
            <span className={labelClass}>Mức độ {requiredMark}</span>
            <div className="grid grid-cols-3 gap-2">
              {severities.map(item => <button type="button" key={item.value} aria-pressed={severity === item.value} onClick={() => setSeverity(item.value)} className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${severity === item.value ? item.active : 'border-slate-200 bg-white text-slate-600'}`}>{item.label}</button>)}
            </div>
          </div>
          <div>
            <label htmlFor="incident-title" className={labelClass}>Tiêu đề {requiredMark}</label>
            <input id="incident-title" required value={title} onChange={event => setTitle(event.target.value)} placeholder="Ví dụ: Lưới bị đứt dây" className={fieldClass} />
          </div>
          <div className="grid grid-cols-2 items-start gap-2">
            <div><label htmlFor="incident-liability" className={labelClass}>Trách nhiệm</label><IncidentSelect compact id="incident-liability" value={liability} onChange={value=>setLiability(value as typeof liability)} disabled={saving} searchable={false} placeholder="Chọn trách nhiệm" searchPlaceholder="Trách nhiệm" options={[{value:'BAO_HANH_SAN_VAN_DONG',label:'Sân chịu',detail:'Hao mòn / bảo hành · Không thu khách'},{value:'DO_KHACH_LAM_HONG',label:'Khách chịu',detail:'Làm hỏng / làm mất · Thu khi checkout'}]}/></div>
            <div className="min-w-0"><label htmlFor="incident-booking-code" className={labelClass}>Mã đặt sân <span className="font-normal text-slate-400">(nếu có)</span></label><input id="incident-booking-code" value={bookingCode} onChange={event=>setBookingCode(event.target.value.toUpperCase())} placeholder="DS00000001" className="h-9 w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 text-xs font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"/></div>
          </div>
          {compensationItemId&&<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <span>{liability==='DO_KHACH_LAM_HONG'?'Khách bồi thường khi checkout':'Sân chịu chi phí · Không thu khách'}</span>
            <strong>{(compensationItems.find(item=>item.id===compensationItemId)?.price||0).toLocaleString('vi-VN')} VND</strong>
          </div>}
          <div>
            <label htmlFor="incident-description" className={labelClass}>Mô tả {requiredMark}</label>
            <textarea id="incident-description" required rows={2} value={description} onChange={event => setDescription(event.target.value)} placeholder="Tình trạng hư hỏng, hướng xử lý" className={`${fieldClass} resize-y`} />
          </div>
          <div>
            <label htmlFor="incident-note" className={labelClass}>Ghi chú</label>
            <input id="incident-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Thông tin bổ sung (nếu có)" className={fieldClass} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between gap-2"><span className={labelClass}>Ảnh hiện trường {requiredMark}</span><span className="text-[10px] text-slate-500">JPG, PNG, WebP · tối đa 5 MB</span></div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="hidden" />
            {photo ? <div className="relative rounded-lg border border-slate-200 bg-white p-2">
              <img src={photo} alt="Ảnh hiện trường" className="max-h-40 w-full rounded-md object-contain" />
              <div className="mt-1 flex items-center justify-between gap-2"><span className="truncate text-[10px] text-slate-500">{photoName}</span><button type="button" onClick={() => fileRef.current?.click()} className="shrink-0 text-[11px] font-semibold text-emerald-800">Đổi ảnh</button></div>
              <button type="button" title="Xóa ảnh" onClick={() => { setPhoto(''); setPhotoName(''); if (fileRef.current) fileRef.current.value = ''; }} className="absolute right-2 top-2 rounded-lg border border-red-200 bg-red-50 p-1 text-red-700"><X className="h-3.5 w-3.5" /></button>
            </div> : <button type="button" disabled={readingPhoto} onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-white py-2 text-xs font-semibold text-emerald-800"><Camera className="h-4 w-4" />{readingPhoto ? 'Đang đọc ảnh...' : 'Chọn ảnh'}</button>}
          </div>
        </fieldset>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onBack} disabled={saving} className="rounded-lg border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-700">Hủy bỏ</button>
          <button type="submit" disabled={saving || readingPhoto} className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"><Check className="h-4 w-4" />{saving ? 'Đang lưu...' : 'Lưu báo cáo'}</button>
        </div>
      </form>
    </div>
  );
}
