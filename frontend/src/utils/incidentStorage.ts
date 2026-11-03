import { useEffect, useState } from 'react';
import type { FacilityIncident } from '../types/admin';
import { INITIAL_INCIDENTS } from '../types/admin';
import type { CheckoutResult } from './checkoutSettlement';

export interface IncidentReporter { id?: string; name: string; phone: string; role: string }
export type IncidentFilter = 'all' | 'resolved' | 'unresolved';
export function filterIncidents(incidents: FacilityIncident[], filter: IncidentFilter = 'all') {
  return sortRecentIncidents(incidents.filter(incident => !incident.deletedAt && (filter === 'all'
    || (filter === 'resolved' ? incident.status === 'da_khac_phuc' : incident.status !== 'da_khac_phuc'))));
}

export function sortRecentIncidents(incidents: FacilityIncident[]) {
  return [...incidents].sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));
}

export function getIncidentTimeline(incident: FacilityIncident) {
  const report = {
    id: `REPORT-${incident.id}`, time: incident.reportedAt,
    title: incident.title, description: incident.description,
    images: incident.images?.length ? incident.images : incident.imageUrl ? [incident.imageUrl] : [],
    active: !incident.timelineLogs?.length,
  };
  const updates = (incident.timelineLogs || []).filter(log => log.id !== report.id
    && !(log.title === report.title && log.description === report.description));
  return [...updates, report];
}

// IndexedDB retains full photos without localStorage's small string quota.
let database: Promise<IDBDatabase> | undefined;
function incidentDatabase() {
  return database ||= new Promise((resolve, reject) => {
    const request = indexedDB.open('courtx_incidents', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function readIncidentSnapshot(): Promise<FacilityIncident[]> {
  const db = await incidentDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction('records').objectStore('records').get('incidents');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}
export async function writeIncidentSnapshot(incidents: FacilityIncident[]) {
  const db = await incidentDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction('records', 'readwrite');
    transaction.objectStore('records').put(incidents, 'incidents');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function readCheckoutSnapshot(reference: string): Promise<CheckoutResult | undefined> {
  const db = await incidentDatabase();
  return new Promise((resolve,reject) => {
    const request = db.transaction('records').objectStore('records').get(`checkout:${reference}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function writeCheckoutSnapshot(result: CheckoutResult, incidents: FacilityIncident[]) {
  const db = await incidentDatabase();
  return new Promise<void>((resolve,reject) => {
    const transaction = db.transaction('records','readwrite');
    transaction.objectStore('records').put(result,`checkout:${result.receipt.reference}`);
    transaction.objectStore('records').put(incidents,'incidents');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export function mergeIncidents(current: FacilityIncident[], cached: FacilityIncident[]) {
  const merged = new Map(current.map(incident => [incident.id, incident]));
  for (const saved of cached) {
    const existing = merged.get(saved.id);
    if (existing?.deletedAt) continue;
    const settled=(incident:FacilityIncident)=>incident.compensationPaymentStatus === 'paid' || incident.compensationPaymentStatus === 'not_required';
    if(existing && settled(existing) && !settled(saved)) continue;
    if(existing && settled(saved) && !settled(existing)){merged.set(saved.id,saved);continue;}
    if (saved.deletedAt || !existing || Date.parse(saved.updatedAt || saved.createdAt || '') > Date.parse(existing.updatedAt || existing.createdAt || '1970-01-01')) merged.set(saved.id, saved);
  }
  return sortRecentIncidents([...merged.values()]);
}

export function useStoredIncidents() {
  const [incidents, setIncidents] = useState<FacilityIncident[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('courtx_incidents_v1') || 'null');
      if (Array.isArray(saved)) return saved;
    } catch { /* Start with the available initial records. */ }
    return INITIAL_INCIDENTS;
  });
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    let mounted = true;
    readIncidentSnapshot().then(saved => {
      if (mounted) setIncidents(current => mergeIncidents(current, saved));
    }).catch(console.warn).finally(() => { if (mounted) setHydrated(true); });
    return () => { mounted = false; };
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    writeIncidentSnapshot(incidents).catch(error => {
      console.error('Could not cache incident photos:', error);
      window.alert('Không lưu được bản sao báo cáo trên thiết bị này. Vui lòng kiểm tra kết nối máy chủ trước khi đóng trang.');
    });
  }, [incidents, hydrated]);
  const saveIncidents: typeof setIncidents = action => setIncidents(previous => {
    const next = typeof action === 'function' ? action(previous) : action;
    try { localStorage.setItem('courtx_incidents_v1', JSON.stringify(next)); }
    catch { /* Full images are retained in IndexedDB. */ }
    return next;
  });
  return [incidents, saveIncidents] as const;
}
