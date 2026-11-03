import type {FacilityEquipment,CourtStatusItem,FacilityIncident} from '../types/admin';
import type {CheckoutRequest,CheckoutResult} from '../utils/checkoutSettlement';
import type {PriceRow} from '../utils/compensationCatalog';
import {apiRequest,ApiError} from './apiClient';
export {ApiError as FacilitySaveError} from './apiClient';
export interface FacilityDashboardStats {
  totalEquipments:number;readyEquipments:number;inUseEquipments:number;maintenanceEquipments:number;
  totalCourts:number;lockedCourts:number;openCourts:number;totalIncidents:number;urgentIncidents:number;pendingIncidents:number;
}
class FacilityApiService {
  async getCheckoutReceipt(reference:string):Promise<CheckoutResult|undefined> {
    try {const receipt=await apiRequest<CheckoutResult['receipt']>(`/checkout-settlements/${encodeURIComponent(reference)}`);return {receipt,incidents:[],equipments:[]};}
    catch(error){if(error instanceof ApiError&&error.status===404)return undefined;throw error;}
  }
  completeCheckout=(request:CheckoutRequest)=>apiRequest<CheckoutResult>('/checkout-settlements',{method:'POST',body:JSON.stringify(request)});
  async loadAllFacilityData() {
    const [equipments,courts,incidents]=await Promise.all([this.getEquipments(),this.getCourts(),this.getIncidents()]);
    return {equipments,courts,incidents,isBackendOnline:true};
  }
  getEquipments=(_filters?:unknown)=>apiRequest<FacilityEquipment[]>('/equipments');
  createEquipment=(value:Partial<FacilityEquipment>)=>apiRequest<FacilityEquipment>('/equipments',{method:'POST',body:JSON.stringify(value)});
  updateEquipment=(id:string,value:Partial<FacilityEquipment>)=>apiRequest<FacilityEquipment>(`/equipments/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(value)});
  relocateEquipment=(id:string,targetLocation:string,bookingDetails?:{bookingCode?:string;timeSlot?:string;customerName?:string})=>apiRequest<FacilityEquipment>(`/equipments/${encodeURIComponent(id)}/relocate`,{method:'PATCH',body:JSON.stringify({targetLocation,...bookingDetails})});
  returnToWarehouse=(id:string)=>apiRequest<FacilityEquipment>(`/equipments/${encodeURIComponent(id)}/return-warehouse`,{method:'PATCH'});
  completeMaintenance=(id:string)=>apiRequest<FacilityEquipment>(`/equipments/${encodeURIComponent(id)}/complete-maintenance`,{method:'POST'});
  getCourts=()=>apiRequest<CourtStatusItem[]>('/courts');
  toggleCourtLock=(id:string,isLocked:boolean,reason?:string)=>apiRequest<CourtStatusItem>(`/courts/${encodeURIComponent(id)}/lock`,{method:'PATCH',body:JSON.stringify({isLocked,reason})});
  getIncidents=(_filters?:unknown)=>apiRequest<FacilityIncident[]>('/incidents');
  deleteIncident=(id:string)=>apiRequest<FacilityIncident>(`/incidents/${encodeURIComponent(id)}`,{method:'DELETE'});
  async createIncident(value:Partial<FacilityIncident>&{lockCourt?:boolean}) {return {incident:await apiRequest<FacilityIncident>('/incidents',{method:'POST',body:JSON.stringify(value)}),courtLocked:false};}
  async updateIncidentStatus(id:string,status:FacilityIncident['status'],unlockCourt=false,technicianNote?:string) {return {incident:await apiRequest<FacilityIncident>(`/incidents/${encodeURIComponent(id)}/status`,{method:'PATCH',body:JSON.stringify({status,unlockCourt,technicianNote})}),courtUnlocked:unlockCourt};}
  addTimelineLog=(id:string,title:string,description:string,images:string[]=[])=>apiRequest<FacilityIncident>(`/incidents/${encodeURIComponent(id)}/timeline`,{method:'POST',body:JSON.stringify({title,description,images})});
  getCompensationPrices=()=>apiRequest<(PriceRow&{equipmentId?:string})[]>('/compensation-prices');
  hideCompensationPrice=(id:string)=>apiRequest<void>(`/compensation-prices/${encodeURIComponent(id)}`,{method:'DELETE'});
}
export const facilityApiService=new FacilityApiService();
