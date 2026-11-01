import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Plus, Trash2, AlertTriangle, Camera, UserRound, Phone, CalendarDays, Clock3, MapPin } from 'lucide-react';
import type { BookingDetail } from '../../pages/AdminSchedulePage';
import type { FacilityEquipment, FacilityIncident } from '../../types/admin';
import type { IncidentReporter } from '../../utils/incidentStorage';
import { readCheckoutSnapshot } from '../../utils/incidentStorage';
import { facilityApiService } from '../../services/facilityService';
import { DATA, useCompensationCatalog } from '../../utils/compensationCatalog';
import { buildCheckoutReports, calculateCheckoutDamage, checkoutCourtCode, type CheckoutRequest, type CheckoutResult, type DamageDraft } from '../../utils/checkoutSettlement';

const inputClass='w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600';
const money=(value:number)=>`${value.toLocaleString('vi-VN')} VND`;
export default function CheckoutSettlementView({booking,date,equipments,incidents,currentUser,onBack,onComplete,onFinished}: {
  booking:BookingDetail; date:Date; equipments:FacilityEquipment[]; incidents:FacilityIncident[]; currentUser:IncidentReporter;
  onBack:()=>void; onComplete:(request:CheckoutRequest)=>Promise<CheckoutResult>; onFinished:()=>void;
}) {
  const liveCatalog=useCompensationCatalog(equipments);
  const catalog=[...liveCatalog];
  incidents.filter(report=>!report.deletedAt && report.compensationItemId && report.compensationPrice !== undefined).forEach(report=>{
    if(!catalog.some(item=>item.id===report.compensationItemId)) catalog.push({id:report.compensationItemId!,name:report.equipmentName||report.title,price:report.compensationPrice!,sport:'common',equipment:equipments.find(item=>item.code===report.equipmentCode)});
  });
  const [settlementDate]=useState(()=>new Date(date));
  const bookingDate=`${settlementDate.getFullYear()}-${String(settlementDate.getMonth()+1).padStart(2,'0')}-${String(settlementDate.getDate()).padStart(2,'0')}`;
  const reference=`${bookingDate}:${booking.code}`;
  const linked=incidents.filter(report=>!report.deletedAt && report.bookingCode === booking.code
    && (!report.bookingDate || report.bookingDate === bookingDate) && report.compensationPaymentStatus !== 'paid' && report.compensationPaymentStatus !== 'not_required');
  const toDraft=(report:FacilityIncident):DamageDraft=>({id:report.id,existingId:report.id,
    itemId:report.compensationItemId || catalog.find(item=>item.equipment?.code === report.equipmentCode)?.id || '',
    liability:report.liability || 'BAO_HANH_SAN_VAN_DONG',description:report.description,images:report.images || []});
  const [expanded,setExpanded]=useState(linked.length>0);
  const [drafts,setDrafts]=useState<DamageDraft[]>(()=>linked.map(toDraft));
  const [paymentConfirmed,setPaymentConfirmed]=useState(false);
  const [saving,setSaving]=useState(false);
  const [reading,setReading]=useState(false);
  const [error,setError]=useState('');
  const [previous,setPrevious]=useState<CheckoutResult|null>(null);
  const [checkingReceipt,setCheckingReceipt]=useState(true);
  useEffect(()=>{let mounted=true; setCheckingReceipt(true); Promise.all([
    readCheckoutSnapshot(reference).catch(()=>undefined),facilityApiService.getCheckoutReceipt(reference).catch(()=>undefined),
  ]).then(([local,remote])=>{if(mounted&&(remote||local))setPrevious(remote||local||null);}).finally(()=>{if(mounted)setCheckingReceipt(false);}); return()=>{mounted=false;};},[reference]);
  useEffect(()=>{if(linked.length){setExpanded(true);setDrafts(current=>[...current,...linked.filter(report=>!current.some(item=>item.existingId===report.id)).map(toDraft)]);}},[incidents]);
  const activeDrafts=expanded?drafts:[];
  const damage=calculateCheckoutDamage(activeDrafts,catalog,incidents);
  const balance=Number(booking.remaining.replace(/\D/g,''))||0;
  const amountDue=balance+damage;
  const timeParts=booking.time.match(/\d{1,2}:\d{2}/g);
  const toMinutes=(time:string)=>{const [hour,minute]=time.split(':').map(Number);return hour*60+minute;};
  const duration=timeParts?.length===2?toMinutes(timeParts[1])-toMinutes(timeParts[0]):0;
  const dateLabel=`${String(settlementDate.getDate()).padStart(2,'0')}/${String(settlementDate.getMonth()+1).padStart(2,'0')}/${settlementDate.getFullYear()}`;
  useEffect(()=>{setPaymentConfirmed(false);},[amountDue]);
  const candidates=incidents.filter(report=>!report.deletedAt && checkoutCourtCode(report.courtName)===checkoutCourtCode(booking.court) && (!report.bookingCode || report.bookingCode===booking.code)
    && (!report.bookingDate || report.bookingDate===bookingDate) && report.compensationPaymentStatus!=='paid' && report.compensationPaymentStatus!=='not_required'
    && !drafts.some(draft=>draft.existingId===report.id));
  const update=(id:string,patch:Partial<DamageDraft>)=>{setDrafts(current=>current.map(item=>item.id===id?{...item,...patch}:item));setPaymentConfirmed(false);setError('');};
  const add=()=>setDrafts(current=>[...current,{id:`SC-${crypto.randomUUID()}`,itemId:'',liability:'DO_KHACH_LAM_HONG',description:'',images:[]}]);
  const upload=(id:string,file?:File)=>{
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.');return;}
    setReading(true);const reader=new FileReader();reader.onload=()=>{update(id,{images:[String(reader.result)]});setReading(false);};reader.onerror=()=>{setError('Không đọc được ảnh.');setReading(false);};reader.readAsDataURL(file);
  };
  const confirm=async()=>{
    if(saving||reading||checkingReceipt)return;
    setError('');
    try {
      if(expanded&&!drafts.length)throw Error('Thêm thiết bị hoặc chọn báo cáo đã có.');
      if(amountDue>0&&!paymentConfirmed)throw Error('Xác nhận đã nhận thanh toán VietQR.');
      const base={reference,bookingCode:booking.code,bookingDate,courtName:booking.court,customerName:booking.customerName,customerPhone:booking.phone,remainingBalance:balance,expectedAmount:amountDue};
      const reports=buildCheckoutReports(activeDrafts,catalog,incidents,base,currentUser);
      setSaving(true);
      await onComplete({...base,paymentConfirmed,reports});
      onFinished();
    }catch(failure){setError(failure instanceof Error?failure.message:'Chưa hoàn tất được trả sân.');}finally{setSaving(false);}
  };
  if(previous)return <div className="space-y-3 bg-white p-3"><h2 className="text-lg font-bold text-emerald-800">Đã hoàn tất trả sân</h2><p className="text-xs text-slate-700">{booking.code} · Đã thu thêm {money(previous.receipt.amountPaid)}</p><button type="button" onClick={onFinished} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs text-white">Quay lại lịch sân</button></div>;
  return <div className="flex-1 min-h-0 overflow-y-auto space-y-3 bg-white p-3 pb-6">
    <button type="button" disabled={saving} onClick={onBack} className="flex items-center gap-1 text-xs text-slate-600"><ArrowLeft className="h-4 w-4"/>Quay lại lịch sân</button>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-bold text-slate-900">Quyết toán Check-out</h2>
      <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[11px] font-bold text-emerald-800">{booking.code}</span>
    </div>
    <section aria-label="Thông tin khách hàng" className="rounded-xl border border-black/15 bg-white p-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><UserRound className="h-5 w-5"/></div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900">{booking.customerName}</h3>
          <a href={`tel:${booking.phone.replace(/[^+\d]/g,'')}`} className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600"><Phone className="h-3 w-3"/>{booking.phone}</a>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{booking.status}</span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[11px] text-emerald-800"><CheckCircle2 className="h-3.5 w-3.5"/>{balance===0?'Đã thanh toán tiền sân qua VietQR':`Tiền sân còn lại: ${money(balance)}`}</p>
    </section>
    <section aria-label="Sân và thời gian" className="rounded-xl border border-black/15 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-bold text-emerald-800"><MapPin className="h-3.5 w-3.5"/>{booking.court}</h3>
        {booking.sport&&<span className="text-[11px] font-medium text-slate-600">{booking.sport}</span>}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-2">
        <div><p className="mb-1 flex items-center gap-1 text-[10px] text-slate-600"><CalendarDays className="h-3 w-3"/>Ngày chơi</p><p className="text-xs font-semibold text-slate-900">{dateLabel}</p></div>
        <div><p className="mb-1 flex items-center gap-1 text-[10px] text-slate-600"><Clock3 className="h-3 w-3"/>Khung giờ</p><p className="text-xs font-semibold text-slate-900">{booking.time}</p>{duration>0&&<p className="mt-0.5 text-[10px] text-slate-500">{duration} phút</p>}</div>
      </div>
    </section>
    {error&&<p role="alert" className="rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    <section className="space-y-3 rounded-xl border border-black/15 bg-white p-3">
      <label className="flex items-center gap-2 text-xs font-bold text-emerald-800"><input type="checkbox" checked={expanded} disabled={saving||linked.length>0} onChange={event=>{setExpanded(event.target.checked);setPaymentConfirmed(false);if(event.target.checked&&!drafts.length)add();}} className="accent-emerald-700"/><AlertTriangle className="h-4 w-4"/>Có hư hỏng / sự cố</label>
      {expanded&&<fieldset disabled={saving} className="space-y-3">
        {drafts.map(draft=>{
          const original=incidents.find(report=>report.id===draft.existingId);
          const price=original?.compensationPrice ?? catalog.find(item=>item.id===draft.itemId)?.price ?? 0;
          return <div key={draft.id} className="space-y-2 rounded-lg border border-slate-200 p-2.5">
            <div className="flex items-center justify-between gap-2"><span className="text-[11px] font-semibold text-slate-700">{original?`Báo cáo ${original.id}`:'Sự cố mới'}</span>{!linked.some(report=>report.id===draft.existingId)&&<button type="button" title="Bỏ sự cố" onClick={()=>{setDrafts(current=>current.filter(item=>item.id!==draft.id));setPaymentConfirmed(false);}} className="text-red-700"><Trash2 className="h-3.5 w-3.5"/></button>}</div>
            <label className="block text-[11px] text-slate-600">Thiết bị <span className="text-red-600">*</span><select disabled={!!original?.compensationItemId} value={draft.itemId} onChange={event=>update(draft.id,{itemId:event.target.value})} className={`${inputClass} mt-1`}><option value="">Chọn từ bảng giá bồi thường</option>{Object.entries(DATA).map(([sport,info])=><optgroup key={sport} label={info.label}>{(original?catalog:liveCatalog).filter(item=>item.sport===sport).map(item=><option key={item.id} value={item.id}>{item.name}{item.equipment?` · ${item.equipment.code}`:''} · {money(original?.compensationPrice ?? item.price)}</option>)}</optgroup>)}</select></label>
            <label className="block text-[11px] text-slate-600">Trách nhiệm<select value={draft.liability} onChange={event=>update(draft.id,{liability:event.target.value as DamageDraft['liability']})} className={`${inputClass} mt-1`}><option value="DO_KHACH_LAM_HONG">Do khách làm hỏng / làm mất</option><option value="BAO_HANH_SAN_VAN_DONG">Sân chịu: hao mòn / bảo hành</option></select></label>
            <textarea rows={2} readOnly={!!original} value={draft.description} onChange={event=>update(draft.id,{description:event.target.value})} placeholder="Mô tả hư hỏng (bắt buộc)" className={`${inputClass} resize-none`}/>
            {!original&&<label className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold text-emerald-800"><Camera className="h-3.5 w-3.5"/>Thêm ảnh (có thể bổ sung sau)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>upload(draft.id,event.target.files?.[0])} className="sr-only"/></label>}
            {draft.images[0]&&<img src={draft.images[0]} alt="Ảnh sự cố" className="max-h-24 rounded-lg object-contain"/>}
            <p className={`text-right text-xs font-bold ${draft.liability==='DO_KHACH_LAM_HONG'?'text-red-700':'text-emerald-800'}`}>Khách trả: {money(draft.liability==='DO_KHACH_LAM_HONG'?price:0)}</p>
          </div>;
        })}
        <div className="flex flex-wrap gap-2"><button type="button" onClick={add} className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1.5 text-[11px] font-semibold text-emerald-800"><Plus className="h-3 w-3"/>Thêm thiết bị</button>
        {candidates.length>0&&<select value="" onChange={event=>{const report=candidates.find(item=>item.id===event.target.value);if(report){setDrafts(current=>[...current,toDraft(report)]);setPaymentConfirmed(false);}}} className="min-w-0 flex-1 rounded-lg border border-emerald-200 px-2 text-[11px] text-emerald-800"><option value="">Gắn báo cáo đã lập</option>{candidates.map(report=><option key={report.id} value={report.id}>{report.title} · {report.id}</option>)}</select>}</div>
      </fieldset>}
    </section>
    <section className="space-y-2 rounded-xl border border-black/15 p-3 text-xs">
      <div className="flex justify-between gap-2"><span>Tiền sân</span><strong>{booking.total}</strong></div>
      <div className="flex justify-between gap-2 text-emerald-800"><span>Đã thanh toán VietQR</span><strong>{booking.paidAmount}</strong></div>
      {balance>0&&<div className="flex justify-between"><span>Tiền sân còn lại</span><strong>{money(balance)}</strong></div>}
      {damage>0&&<div className="flex justify-between text-red-700"><span>Bồi thường thiết bị</span><strong>{money(damage)}</strong></div>}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2"><span className="font-bold text-emerald-800">Cần thu thêm</span><strong className={`text-lg ${amountDue>0?'text-red-700':'text-emerald-800'}`}>{money(amountDue)}</strong></div>
    </section>
    {amountDue>0&&<section className="space-y-2 rounded-xl border border-black/15 p-3"><h3 className="text-xs font-bold text-emerald-800">Thanh toán qua VietQR</h3><img src="/images/QR.png" alt="VietQR chuyển khoản" className="mx-auto w-36 rounded-xl"/><p className="text-center text-xs font-semibold text-slate-800">Số tiền: {money(amountDue)}</p><p className="text-center text-[11px] text-slate-600">Nội dung: CK {booking.code}</p><label className="flex items-center gap-2 text-xs text-emerald-800"><input type="checkbox" checked={paymentConfirmed} onChange={event=>setPaymentConfirmed(event.target.checked)} disabled={saving} className="accent-emerald-700"/>Đã kiểm tra nhận đủ {money(amountDue)} qua VietQR</label></section>}
    <button type="button" onClick={confirm} disabled={checkingReceipt||saving||reading||(amountDue>0&&!paymentConfirmed)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"><CheckCircle2 className="h-4 w-4"/>{saving?'Đang lưu...':checkingReceipt?'Đang kiểm tra lượt trả sân...':'Xác nhận Check-out'}</button>
  </div>;
}
