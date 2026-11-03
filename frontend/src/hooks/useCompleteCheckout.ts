import type {Dispatch,SetStateAction} from 'react';
import type {FacilityEquipment,FacilityIncident} from '../types/admin';
import type {CheckoutRequest} from '../utils/checkoutSettlement';
import {facilityApiService} from '../services/facilityService';
export default function useCompleteCheckout(_incidents:FacilityIncident[],setIncidents:Dispatch<SetStateAction<FacilityIncident[]>>,
  _equipments:FacilityEquipment[],setEquipments:Dispatch<SetStateAction<FacilityEquipment[]>>) {
  return async(request:CheckoutRequest)=>{
    const result=await facilityApiService.completeCheckout(request);
    setIncidents(previous=>[...result.incidents,...previous.filter(i=>!result.incidents.some(saved=>saved.id===i.id))]);
    setEquipments(previous=>previous.map(item=>result.equipments.find(saved=>saved.id===item.id)||item));
    return result;
  };
}
