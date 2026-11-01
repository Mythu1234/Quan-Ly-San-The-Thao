import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  FacilityEquipment,
  CourtStatusItem,
  FacilityIncident,
  IncidentTimelineLog,
} from '../types/facility.js';
import { INITIAL_EQUIPMENT } from '../data/initialEquipment.js';
import { INITIAL_COURTS } from '../data/initialCourts.js';
import { INITIAL_INCIDENTS } from '../data/initialIncidents.js';
import type { CheckoutResult } from '../types/checkout.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const EQUIPMENTS_FILE = path.join(DATA_DIR, 'equipments.json');
const COURTS_FILE = path.join(DATA_DIR, 'courts.json');
const INCIDENTS_FILE = path.join(DATA_DIR, 'incidents.json');
const CHECKOUTS_FILE = path.join(DATA_DIR, 'checkouts.json');

export class FacilityRepository {
  private equipments: FacilityEquipment[] = [];
  private courts: CourtStatusItem[] = [];
  private incidents: FacilityIncident[] = [];
  private isLoaded = false;

  constructor() {
    this.ensureLoaded();
  }

  private ensureLoaded(): void {
    if (this.isLoaded) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // 1. Equipments
      if (fs.existsSync(EQUIPMENTS_FILE)) {
        const raw = fs.readFileSync(EQUIPMENTS_FILE, 'utf-8');
        this.equipments = JSON.parse(raw);
      } else {
        this.equipments = [...INITIAL_EQUIPMENT];
        this.persistEquipments();
      }

      // 2. Courts
      if (fs.existsSync(COURTS_FILE)) {
        const raw = fs.readFileSync(COURTS_FILE, 'utf-8');
        this.courts = JSON.parse(raw);
        // Preserve legacy records referenced by incident history, and add missing standard courts.
        const missing = INITIAL_COURTS.filter(c => !this.courts.some(existing => existing.id === c.id));
        if (missing.length) {
          this.courts.push(...missing);
          this.persistCourts();
        }
      } else {
        this.courts = [...INITIAL_COURTS];
        this.persistCourts();
      }

      // 3. Incidents
      if (fs.existsSync(INCIDENTS_FILE)) {
        const raw = fs.readFileSync(INCIDENTS_FILE, 'utf-8');
        this.incidents = JSON.parse(raw);
      } else {
        this.incidents = [...INITIAL_INCIDENTS];
        this.persistIncidents();
      }

      this.recoverCheckout();
      this.isLoaded = true;
    } catch (err) {
      console.error('FacilityRepository ensureLoaded error:', err);
      this.equipments = [...INITIAL_EQUIPMENT];
      this.courts = [...INITIAL_COURTS];
      this.incidents = [...INITIAL_INCIDENTS];
      this.isLoaded = true;
    }
  }

  private persistEquipments(): void {
    try {
      fs.writeFileSync(EQUIPMENTS_FILE, JSON.stringify(this.equipments, null, 2), 'utf-8');
    } catch (err) {
      console.error('persistEquipments error:', err);
    }
  }

  private readCheckoutLedger(): { receipts: CheckoutResult[]; pending?: CheckoutResult } {
    return fs.existsSync(CHECKOUTS_FILE) ? JSON.parse(fs.readFileSync(CHECKOUTS_FILE, 'utf8')) : { receipts: [] };
  }

  private writeCheckoutLedger(ledger: { receipts: CheckoutResult[]; pending?: CheckoutResult }):void {
    const temporary = `${CHECKOUTS_FILE}.tmp`;
    fs.writeFileSync(temporary,JSON.stringify(ledger,null,2),'utf8');
    fs.renameSync(temporary,CHECKOUTS_FILE);
  }

  private recoverCheckout(): void {
    const ledger = this.readCheckoutLedger();
    if (!ledger.pending) return;
    const result = ledger.pending;
    const incidentMap = new Map(this.incidents.map(incident => [incident.id, incident]));
    result.incidents.forEach(incident => incidentMap.set(incident.id, incident));
    this.incidents = [...incidentMap.values()];
    const equipmentMap = new Map(result.equipments.map(equipment => [equipment.code, equipment]));
    this.equipments = this.equipments.map(equipment => equipmentMap.get(equipment.code) || equipment);
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(this.incidents, null, 2), 'utf8');
    fs.writeFileSync(EQUIPMENTS_FILE, JSON.stringify(this.equipments, null, 2), 'utf8');
    ledger.receipts = [...ledger.receipts.filter(item => item.receipt.reference !== result.receipt.reference), result];
    delete ledger.pending;
    this.writeCheckoutLedger(ledger);
  }

  public getCheckout(reference: string): CheckoutResult | undefined {
    this.ensureLoaded();
    this.recoverCheckout();
    return this.readCheckoutLedger().receipts.find(item => item.receipt.reference === reference);
  }

  public commitCheckout(result: CheckoutResult): CheckoutResult {
    this.ensureLoaded();
    this.recoverCheckout();
    const ledger = this.readCheckoutLedger();
    const existing = ledger.receipts.find(item => item.receipt.reference === result.receipt.reference);
    if (existing) return existing;
    // Write the recovery record before changing incident/equipment files.
    ledger.pending = result;
    this.writeCheckoutLedger(ledger);
    this.recoverCheckout();
    return result;
  }

  private persistCourts(): void {
    try {
      fs.writeFileSync(COURTS_FILE, JSON.stringify(this.courts, null, 2), 'utf-8');
    } catch (err) {
      console.error('persistCourts error:', err);
    }
  }

  private persistIncidents(): void {
    try {
      fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(this.incidents, null, 2), 'utf-8');
    } catch (err) {
      console.error('persistIncidents error:', err);
    }
  }

  // ===============================
  // EQUIPMENT OPERATIONS
  // ===============================
  public getAllEquipments(): FacilityEquipment[] {
    this.ensureLoaded();
    return [...this.equipments];
  }

  public getEquipmentById(id: string): FacilityEquipment | null {
    this.ensureLoaded();
    const found = this.equipments.find((e) => e.id.toLowerCase() === id.toLowerCase());
    return found ? { ...found } : null;
  }

  public getEquipmentByCode(code: string): FacilityEquipment | null {
    this.ensureLoaded();
    const found = this.equipments.find((e) => e.code.toLowerCase() === code.toLowerCase());
    return found ? { ...found } : null;
  }

  public getNextEquipmentIdAndCode(): { id: string; code: string } {
    this.ensureLoaded();
    let maxNum = 0;
    for (const eq of this.equipments) {
      const match = eq.code.match(/MATB-(\d+)/i) || eq.id.match(/EQ(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    const padded = nextNum.toString().padStart(2, '0');
    return {
      id: `EQ${padded}`,
      code: `MATB-${padded}`,
    };
  }

  public createEquipment(item: FacilityEquipment): FacilityEquipment {
    this.ensureLoaded();
    this.equipments.unshift(item);
    this.persistEquipments();
    return { ...item };
  }

  public updateEquipment(idOrCode: string, updates: Partial<FacilityEquipment>): FacilityEquipment | null {
    this.ensureLoaded();
    const index = this.equipments.findIndex(
      (e) => e.id.toLowerCase() === idOrCode.toLowerCase() || e.code.toLowerCase() === idOrCode.toLowerCase()
    );
    if (index === -1) return null;

    const current = this.equipments[index];
    const updated: FacilityEquipment = {
      ...current,
      ...updates,
      id: current.id,
      code: updates.code || current.code,
      updatedAt: new Date().toISOString(),
    };
    this.equipments[index] = updated;
    this.persistEquipments();
    return { ...updated };
  }

  public deleteEquipment(idOrCode: string): boolean {
    this.ensureLoaded();
    const index = this.equipments.findIndex(
      (e) => e.id.toLowerCase() === idOrCode.toLowerCase() || e.code.toLowerCase() === idOrCode.toLowerCase()
    );
    if (index === -1) return false;
    this.equipments.splice(index, 1);
    this.persistEquipments();
    return true;
  }

  // ===============================
  // COURT STATUS OPERATIONS (UC-04)
  // ===============================
  public getAllCourts(): CourtStatusItem[] {
    this.ensureLoaded();
    return [...this.courts];
  }

  public getCourtById(id: string): CourtStatusItem | null {
    this.ensureLoaded();
    const found = this.courts.find((c) => c.id.toLowerCase() === id.toLowerCase());
    return found ? { ...found } : null;
  }

  public updateCourtLock(
    courtId: string,
    isLocked: boolean,
    reason?: string,
    lockedBy = 'Admin'
  ): CourtStatusItem | null {
    this.ensureLoaded();
    const index = this.courts.findIndex((c) => c.id.toLowerCase() === courtId.toLowerCase());
    if (index === -1) return null;

    const current = this.courts[index];
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const updated: CourtStatusItem = {
      ...current,
      isLocked,
      lockReason: isLocked ? (reason || 'Bảo trì kỹ thuật') : undefined,
      lockedAt: isLocked ? `${nowTime} Hôm nay` : undefined,
      lockedBy: isLocked ? lockedBy : undefined,
      updatedAt: new Date().toISOString(),
    };

    this.courts[index] = updated;
    this.persistCourts();
    return { ...updated };
  }

  // ===============================
  // INCIDENT OPERATIONS (UC-03, UC-05)
  // ===============================
  public getAllIncidents(): FacilityIncident[] {
    this.ensureLoaded();
    return [...this.incidents];
  }

  public getIncidentById(id: string): FacilityIncident | null {
    this.ensureLoaded();
    const found = this.incidents.find((i) => i.id.toLowerCase() === id.toLowerCase());
    return found ? { ...found } : null;
  }

  public getNextIncidentId(): string {
    this.ensureLoaded();
    let maxNum = 8900;
    for (const inc of this.incidents) {
      const match = inc.id.match(/SC-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    const nextNum = maxNum + 1;
    return `SC-${nextNum}`;
  }

  public createIncident(incident: FacilityIncident): FacilityIncident {
    this.ensureLoaded();
    this.incidents.unshift(incident);
    this.persistIncidents();
    return { ...incident };
  }

  public deleteIncident(id: string): FacilityIncident | null {
    this.ensureLoaded();
    const index = this.incidents.findIndex(incident => incident.id.toLowerCase() === id.toLowerCase());
    if (index < 0) return null;
    const now = new Date().toISOString();
    this.incidents[index] = { ...this.incidents[index], deletedAt: now, updatedAt: now };
    this.persistIncidents();
    return { ...this.incidents[index] };
  }

  public updateIncidentStatus(
    id: string,
    newStatus: 'cho_xu_ly' | 'dang_sua_chua' | 'da_khac_phuc',
    technicianNote?: string
  ): FacilityIncident | null {
    this.ensureLoaded();
    const index = this.incidents.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return null;

    const current = this.incidents[index];
    const statusLabels = {
      cho_xu_ly: 'Chờ xử lý',
      dang_sua_chua: 'Đang sửa chữa',
      da_khac_phuc: 'Đã khắc phục',
    };

    const updated: FacilityIncident = {
      ...current,
      status: newStatus,
      statusLabel: statusLabels[newStatus],
      isCourtLocked: newStatus === 'da_khac_phuc' ? false : current.isCourtLocked,
      technicianNote: technicianNote !== undefined ? technicianNote : current.technicianNote,
      updatedAt: new Date().toISOString(),
    };

    this.incidents[index] = updated;
    this.persistIncidents();
    return { ...updated };
  }

  public addIncidentTimelineLog(id: string, log: IncidentTimelineLog): FacilityIncident | null {
    this.ensureLoaded();
    const index = this.incidents.findIndex((i) => i.id.toLowerCase() === id.toLowerCase());
    if (index === -1) return null;

    const current = this.incidents[index];
    const existingLogs = current.timelineLogs || [];

    // Mark previous logs active = false, and prepend or append new log
    const updatedLogs = [
      { ...log, active: true },
      ...existingLogs.map((l) => ({ ...l, active: false })),
    ];

    const updated: FacilityIncident = {
      ...current,
      timelineLogs: updatedLogs,
      updatedAt: new Date().toISOString(),
    };

    this.incidents[index] = updated;
    this.persistIncidents();
    return { ...updated };
  }
}

export const facilityRepository = new FacilityRepository();
