import { useState } from 'react';
import { DATA, useCompensationCatalog, hideCompensationItem, type SportTab, type PriceRow } from '../../utils/compensationCatalog';
import { ShieldAlert, Eye, Trash2 } from 'lucide-react';
import type { FacilityEquipment } from '../../types/admin';
import EquipmentDetailsDialog from './EquipmentDetailsDialog';

const TAB_ACTIVE: Record<string, string> = {
  emerald: 'bg-emerald-700 text-white',
  orange: 'bg-emerald-700 text-white',
  blue: 'bg-emerald-700 text-white',
  slate: 'bg-emerald-700 text-white',
};

const ROW_STRIPE: Record<string, string> = {
  emerald: 'even:bg-emerald-50/60',
  orange: 'even:bg-emerald-50/60',
  blue: 'even:bg-emerald-50/60',
  slate: 'even:bg-emerald-50/60',
};

const BADGE: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700',
  orange: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-emerald-100 text-emerald-800',
  slate: 'bg-emerald-100 text-emerald-800',
};

export default function CompensationPriceTable({
  onAddEquipment,
  equipments = [],
}: {
  onAddEquipment?: () => void;
  equipments?: FacilityEquipment[];
}) {
  const [tab, setTab] = useState<SportTab>('badminton');
  const [viewingItem, setViewingItem] = useState<PriceRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<PriceRow | null>(null);
  const [deleteError,setDeleteError]=useState('');
  const [deleting,setDeleting]=useState(false);
  const sport = DATA[tab];
  const mergedItems = useCompensationCatalog(equipments).filter(item => item.sport === tab);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-800" />
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Bảng giá bồi thường thiết bị
          </h2>
        </div>
        {onAddEquipment && (
          <button
            type="button"
            onClick={onAddEquipment}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-700 text-white text-[10px] font-bold hover:bg-emerald-800 transition cursor-pointer"
          >
            <span className="text-[11px]">+</span> Thêm thiết bị
          </button>
        )}
      </div>

      {/* Tab filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {(Object.keys(DATA) as SportTab[]).map((key) => {
          const d = DATA[key];
          const isActive = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-bold transition cursor-pointer shrink-0 ${
                isActive ? TAB_ACTIVE[d.color] : 'bg-white text-emerald-800 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-50'
              }`}
            >
              <span>{d.emoji}</span>
              {d.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {/* Table header */}
        <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto_3.75rem] gap-1.5 px-2.5 py-2 border-b border-slate-100 bg-slate-50">
          <span className="text-[9px] font-black uppercase tracking-wide text-slate-900">STT</span>
          <span className="text-[9px] font-black uppercase tracking-wide text-slate-900">Tên thiết bị</span>
          <span className="text-[9px] font-black uppercase tracking-wide text-slate-900">Giá bồi thường</span>
          <span className="text-center text-[9px] font-black uppercase text-slate-900">Thao tác</span>
        </div>

        {/* Rows */}
        {mergedItems.map((item, i) => (
          <div
            key={item.id}
            className={`grid grid-cols-[1.25rem_minmax(0,1fr)_auto_3.75rem] gap-1.5 items-center px-2.5 py-2 border-b border-slate-50 last:border-0 ${ROW_STRIPE[sport.color]}`}
          >
            <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black ${BADGE[sport.color]}`}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-800 break-words">{item.name}</span>
              {item.equipment && <p className="text-[9px] text-slate-500">{item.equipment.serialNumber || item.equipment.code}</p>}
            </div>
            <span className="text-[11px] font-black text-slate-900 whitespace-nowrap">
              {item.price.toLocaleString('vi-VN')}&nbsp;VND
            </span>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                title={`Xem chi tiết ${item.name}`}
                aria-label={`Xem chi tiết ${item.name}`}
                onClick={() => setViewingItem(item)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-700 transition hover:bg-gray-300 cursor-pointer"
              ><Eye className="h-3.5 w-3.5" /></button>
              <button
                type="button"
                title={`Xóa ${item.name} khỏi bảng giá`}
                aria-label={`Xóa ${item.name} khỏi bảng giá`}
                onClick={() => setDeletingItem(item)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 cursor-pointer"
              ><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
        {mergedItems.length === 0 && <p className="p-4 text-center text-xs text-slate-500">Chưa có thiết bị trong bảng giá của bộ môn này.</p>}
      </div>

      {viewingItem && (
        <EquipmentDetailsDialog
          name={viewingItem.name}
          sportLabel={sport.label}
          compensationPrice={viewingItem.price}
          equipment={viewingItem.equipment}
          onUpdated={equipment=>setViewingItem(current=>current?{...current,equipment,name:equipment.name,price:equipment.compensationPrice??current.price}:null)}
          onClose={() => setViewingItem(null)}
        />
      )}
      {deletingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4">
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-price-title" aria-describedby="delete-price-description" className="w-full max-w-sm space-y-3 rounded-2xl border border-black/15 bg-white p-4 shadow-xl">
            <h3 id="delete-price-title" className="text-sm font-bold text-slate-900">Xóa thiết bị khỏi bảng giá?</h3>
            <p id="delete-price-description" className="text-xs leading-relaxed text-slate-600">Xóa “{deletingItem.name}” khỏi bảng giá bồi thường. Hồ sơ thiết bị và lịch sử sự cố vẫn được lưu.</p>
            {deleteError&&<p role="alert" className="text-xs text-red-700">{deleteError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setDeletingItem(null)} className="rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700">Giữ lại</button>
              <button type="button" disabled={deleting} onClick={async () => {
                setDeleting(true);setDeleteError('');
                try{await hideCompensationItem(deletingItem.id);setDeletingItem(null);}
                catch(error){setDeleteError(error instanceof Error?error.message:'Chưa lưu được thay đổi.');}
                finally{setDeleting(false);}
              }} className="rounded-xl border border-red-200 bg-red-50 py-2 text-xs font-bold text-red-700 hover:bg-red-100">Xóa khỏi bảng giá</button>
            </div>
          </section>
        </div>
      )}

      {/* Note */}
      <div className="flex items-center justify-center gap-1.5 px-2 py-2">
        <ShieldAlert className="h-3 w-3 text-yellow-600 shrink-0" />
        <p className="whitespace-nowrap text-center text-[9px] tracking-tight font-medium text-yellow-600 leading-4" title="Chỉ thu bồi thường khi khách gây hư hỏng hoặc làm mất — không tính hao mòn thông thường.">
          Chỉ bồi thường do khách làm hỏng/mất; không tính hao mòn.
        </p>
      </div>
    </div>
  );
}
