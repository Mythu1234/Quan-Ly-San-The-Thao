import { useEffect, useRef, useState } from 'react';
import { X, Wrench, ShieldCheck, Tag, Pencil } from 'lucide-react';
import type { FacilityEquipment } from '../../types/admin';
import AddEquipmentView from './AddEquipmentView';
import {facilityApiService} from '../../services/facilityService';
import {refreshCompensationCatalog} from '../../utils/compensationCatalog';

interface EquipmentDetailsDialogProps {
  name: string;
  sportLabel: string;
  compensationPrice: number;
  equipment?: FacilityEquipment;
  onClose: () => void;
  onUpdated?: (equipment: FacilityEquipment) => void;
}

const sportLabels: Record<string, string> = {
  CauLong: 'Cầu lông', BongChuyen: 'Bóng chuyền', BongDa: 'Bóng đá', DungChung: 'Thiết bị chung',
};
const displayText = (value?: string) => value?.trim() || 'Chưa cập nhật';
const displayMoney = (value?: number | null) => value != null ? `${value.toLocaleString('vi-VN')} VND` : 'Chưa cập nhật';

function DetailField({ label, value }: { label: string; value?: string }) {
  return <div className="min-w-0 space-y-1">
    <dt className="text-[10px] font-medium text-slate-600">{label}</dt>
    <dd className="break-words text-xs font-semibold leading-relaxed text-slate-900">{displayText(value)}</dd>
  </div>;
}

export default function EquipmentDetailsDialog({ name, sportLabel, compensationPrice, equipment: initialEquipment, onClose, onUpdated }: EquipmentDetailsDialogProps) {
  const [equipment,setEquipment]=useState(initialEquipment);
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const close=()=>{if(saving)return;if(editing)setEditing(false);else onClose();};
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {if(!saving){if(editing)setEditing(false);else onClose();}}
      if (event.key === 'Tab') {
        const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [onClose,editing,saving]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="equipment-details-title" className="flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-black/15 bg-white shadow-xl">
        <header className="flex shrink-0 items-center gap-2.5 border-b border-black/10 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 text-emerald-800"><Wrench className="h-4 w-4" /></div>
          <div className="min-w-0 flex-1">
            <h2 id="equipment-details-title" className="text-sm font-bold text-slate-900">{editing?'Chỉnh sửa thiết bị':'Chi tiết thiết bị'}</h2>
            <p className="mt-0.5 text-[10px] text-slate-500">{equipment?.code || 'Bảng giá niêm yết'}</p>
          </div>
          <button ref={closeRef} type="button" disabled={saving} onClick={close} aria-label={editing?'Hủy chỉnh sửa':'Đóng chi tiết'} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-700 disabled:opacity-50"><X className="h-4 w-4" /></button>
        </header>

        <div className="space-y-3 overflow-y-auto p-4">
          {editing&&equipment?<AddEquipmentView key={equipment.id} embedded initialEquipment={equipment} existingCount={0}
            onSavingChange={setSaving} onBack={()=>setEditing(false)} onAddEquipment={async value=>{
              const saved=await facilityApiService.updateEquipment(equipment.id,value);
              setEquipment(saved);setEditing(false);onUpdated?.(saved);
              window.dispatchEvent(new Event('courtx:facility-changed'));
              await refreshCompensationCatalog().catch(console.error);
            }}/>:<>
          <section className="space-y-3 rounded-xl border border-black/15 p-3">
            <div>
              <p className="text-[10px] text-slate-600">Tên thiết bị</p>
              <h3 className="mt-1 break-words text-base font-bold leading-snug text-slate-900">{equipment?.name ?? name}</h3>
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t border-black/10 pt-3">
              <DetailField label="Bộ môn" value={equipment ? sportLabels[equipment.sportType] ?? sportLabel : sportLabel} />
              <DetailField label="Tình trạng" value={equipment?.healthRate} />
            </dl>
          </section>

          <section className="rounded-xl border border-black/15 p-3">
            <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800"><Tag className="h-3.5 w-3.5" />Giá thiết bị</h3>
            <dl className="grid grid-cols-2 gap-3">
              <div><dt className="text-[10px] text-slate-600">Giá mua</dt><dd className="mt-1 break-words text-[13px] font-bold text-slate-900">{displayMoney(equipment?.purchasePrice)}</dd></div>
              <div><dt className="text-[10px] text-slate-600">Giá bồi thường</dt><dd className="mt-1 break-words text-[13px] font-bold text-emerald-800">{displayMoney(equipment?.compensationPrice ?? compensationPrice)}</dd></div>
            </dl>
          </section>

          <section className="rounded-xl border border-black/15 p-3">
            <h3 className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-emerald-800"><ShieldCheck className="h-3.5 w-3.5" />Bảo hành & Nhà cung cấp</h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <DetailField label="Nhà cung cấp" value={equipment?.supplier} />
              <DetailField label="Số điện thoại bảo hành" value={equipment?.supplierPhone} />
              <div className="col-span-2"><DetailField label="Địa chỉ bảo hành" value={equipment?.warrantyAddress} /></div>
              <DetailField label="Ngày nhập" value={equipment?.purchaseDate} />
              <DetailField label="Hạn bảo hành" value={equipment?.warrantyExpire} />
              <div className="col-span-2"><DetailField label="Số Seri" value={equipment?.serialNumber} /></div>
            </dl>
          </section>

          <section className="rounded-xl border border-black/15 p-3">
            <h3 className="text-[11px] font-bold text-emerald-800">Ghi chú</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">{displayText(equipment?.notes)}</p>
          </section>
          </>}
        </div>
        {!editing&&equipment&&<footer className="shrink-0 border-t border-slate-100 bg-white p-3">
          <button type="button" disabled={saving} onClick={()=>setEditing(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"><Pencil className="h-4 w-4"/>Chỉnh sửa thiết bị</button>
        </footer>}
      </div>
    </div>
  );
}
