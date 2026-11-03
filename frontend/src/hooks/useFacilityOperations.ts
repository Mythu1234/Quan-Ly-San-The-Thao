import {useEffect,useState,useRef} from 'react';
import type {FacilityEquipment,FacilityIncident} from '../types/admin';
import {facilityApiService as api} from '../services/facilityService';
import useCourtAvailability from './useCourtAvailability';
import useCompleteCheckout from './useCompleteCheckout';
import {refreshSharedBookings} from './useSharedBookings';
import {refreshCompensationCatalog} from '../utils/compensationCatalog';

export default function useFacilityOperations() {
  const [equipments,setEquipments]=useState<FacilityEquipment[]>([]);
  const [incidents,setIncidents]=useState<FacilityIncident[]>([]);
  const [courtStatuses,setCourtStatuses]=useCourtAvailability();
  const [facilityError,setFacilityError]=useState('');
  const revision=useRef(0);
  const refreshFacility=async()=>{
    const version=++revision.current;
    try {
      const data=await api.loadAllFacilityData();
      if(version!==revision.current)return;
      setEquipments(data.equipments);setIncidents(data.incidents);setCourtStatuses(data.courts);setFacilityError('');
    }catch(error){if(version===revision.current)setFacilityError(error instanceof Error?error.message:'Chưa tải được dữ liệu.');}
  };
  useEffect(()=>{
    void refreshFacility();
    const refresh=()=>{void refreshFacility();};
    window.addEventListener('courtx:facility-changed',refresh);
    const timer=setInterval(()=>{void refreshFacility();},15000);
    return()=>{clearInterval(timer);revision.current++;window.removeEventListener('courtx:facility-changed',refresh);};
  },[]);
  const saveEquipment=(saved:FacilityEquipment)=>{revision.current++;setEquipments(previous=>[saved,...previous.filter(e=>e.id!==saved.id)]);};
  const saveIncident=(saved:FacilityIncident)=>{revision.current++;setIncidents(previous=>[saved,...previous.filter(i=>i.id!==saved.id)]);};
  const completeCheckout=useCompleteCheckout(incidents,setIncidents,equipments,setEquipments);
  return {equipments,incidents,courtStatuses,facilityError,refreshFacility,
    completeCheckout:async(...args:Parameters<typeof completeCheckout>)=>{revision.current++;const result=await completeCheckout(...args);void refreshSharedBookings();void refreshFacility();return result;},
    handleAddEquipment:async(item:FacilityEquipment)=>{saveEquipment(await api.createEquipment(item));void refreshCompensationCatalog().catch(console.error);},
    handleUpdateEquipmentLocation:async(code:string,location:string)=>{saveEquipment(await api.relocateEquipment(code,location));},
    handleToggleCourtLock:async(id:string,locked:boolean,reason?:string)=>{const saved=await api.toggleCourtLock(id,locked,reason);setCourtStatuses(previous=>previous.map(c=>c.id===id?saved:c));},
    handleDeleteIncident:async(id:string)=>{saveIncident(await api.deleteIncident(id));},
    handleSubmitIncident:async(item:FacilityIncident,_lockCourt:boolean)=>{saveIncident((await api.createIncident(item)).incident);void refreshFacility();},
    handleUpdateIncidentStatus:async(id:string,status:FacilityIncident['status'],unlockCourt?:boolean)=>{saveIncident((await api.updateIncidentStatus(id,status,unlockCourt)).incident);void refreshFacility();},
    handleReturnToWarehouse:async(code:string)=>{saveEquipment(await api.returnToWarehouse(code));},
    handleAssignBookingToEquipment:async(code:string,court:string,timeSlot:string,bookingCode:string,customerName:string)=>{saveEquipment(await api.relocateEquipment(code,court,{timeSlot,bookingCode,customerName}));},
    handleAddTimelineLog:async(id:string,title:string,description:string,images:string[]=[])=>{saveIncident(await api.addTimelineLog(id,title,description,images));},
    handleCompleteEquipmentWarranty:async(code:string,_name?:string)=>{
      saveEquipment(await api.completeMaintenance(code));
      void refreshFacility();
    },
  };
}
