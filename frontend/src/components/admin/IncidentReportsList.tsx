import { useState } from 'react';
import { Eye, MoreVertical, Plus, Trash2, Wrench } from 'lucide-react';
import type { FacilityIncident } from '../../types/admin';
import { filterIncidents, type IncidentFilter } from '../../utils/incidentStorage';

export default function IncidentReportsList({ incidents, onView, onDelete, onCreate }: {
  incidents: FacilityIncident[];
  onView: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onCreate: () => void;
}) {
  const [filter, setFilter] = useState<IncidentFilter>('all');
  const [deleting, setDeleting] = useState<FacilityIncident | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const visible = filterIncidents(incidents, filter);
  const tabs = [{id:'all',label:'Tất cả sự cố'}, {id:'resolved',label:'Đã xử lý'}, {id:'unresolved',label:'Chưa xử lý'}] as const;
  const closeMenu = (element: HTMLElement) => element.closest('details')?.removeAttribute('open');
  const confirmDelete = async () => {
    if (!deleting || saving) return;
    setSaving(true);
    setError('');
    try { await onDelete(deleting.id); setDeleting(null); }
    catch { setError('Chưa xóa được báo cáo. Vui lòng thử lại.'); }
    finally { setSaving(false); }
  };
  return <section id="recent-incidents" className="scroll-mt-3 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase text-slate-900"><Wrench className="h-4 w-4 text-emerald-800" />Báo cáo sự cố gần đây</h2>
      <button type="button" onClick={onCreate} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-2 text-[10px] font-bold text-white hover:bg-emerald-800"><Plus className="h-3.5 w-3.5" />Báo sự cố mới</button>
    </div>
    <div className="flex flex-wrap gap-1.5" aria-label="Lọc sự cố">
      {tabs.map(tab => <button type="button" key={tab.id} aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)} className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold ${filter === tab.id ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50'}`}>
        {tab.label} ({filterIncidents(incidents, tab.id).length})
      </button>)}
    </div>
    {visible.length === 0 && <p className="rounded-xl border border-slate-200 p-4 text-center text-xs text-slate-500">Chưa có sự cố trong mục này.</p>}
    <div key={filter} role="region" aria-label="Danh sách sự cố" tabIndex={visible.length > 2 ? 0 : undefined} className={`grid auto-rows-[160px] gap-3 ${visible.length > 2 ? 'max-h-[332px] overflow-y-auto overscroll-contain pr-1 custom-scrollbar' : ''}`}>
    {visible.map(incident => <article key={incident.id} className="min-h-0 space-y-2 rounded-2xl border border-black/15 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-900">#{incident.id}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500">{incident.reportedAt}</span>
          <details name="incident-actions" className="relative" onKeyDown={event => { if (event.key === 'Escape') event.currentTarget.removeAttribute('open'); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.removeAttribute('open'); }}>
            <summary aria-label={`Thao tác sự cố ${incident.id}`} title="Thao tác" className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 [&::-webkit-details-marker]:hidden"><MoreVertical className="h-4 w-4" /></summary>
            <div className="absolute right-0 top-8 z-20 min-w-32 space-y-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              <button type="button" onClick={event => { closeMenu(event.currentTarget); onView(incident.id); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"><Eye className="h-4 w-4" />Xem chi tiết</button>
              <button type="button" onClick={event => { closeMenu(event.currentTarget); setError(''); setDeleting(incident); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" />Xóa</button>
            </div>
          </details>
        </div>
      </div>
      <h3 className="line-clamp-2 text-xs font-bold leading-snug text-slate-900">{incident.title}</h3>
      <p className="line-clamp-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600">{incident.description}</p>
    </article>)}
    </div>
    {deleting && <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-4">
      <section role="alertdialog" aria-modal="true" aria-labelledby="delete-incident-title" aria-describedby="delete-incident-description" className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-4 shadow-xl">
        <h3 id="delete-incident-title" className="text-sm font-bold text-slate-900">Xóa báo cáo sự cố?</h3>
        <p id="delete-incident-description" className="text-xs leading-relaxed text-slate-600">Xóa “{deleting.title}” khỏi danh sách sự cố?</p>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" autoFocus disabled={saving} onClick={() => setDeleting(null)} className="rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700">Giữ lại</button>
          <button type="button" disabled={saving} onClick={confirmDelete} className="rounded-lg bg-red-50 py-2 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">{saving ? 'Đang xóa...' : 'Xóa báo cáo'}</button>
        </div>
      </section>
    </div>}
  </section>;
}
