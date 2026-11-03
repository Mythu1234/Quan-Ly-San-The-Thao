import {useEffect,useSyncExternalStore} from 'react';
import type {SetStateAction} from 'react';
import type {BookingDetail} from '../types/schedule';
import {bookingApiService} from '../services/bookingService';
let bookings:BookingDetail[]=[];
let state={loading:true,error:''};
let subscribers=0,polling:ReturnType<typeof setInterval>|undefined,pending:Promise<void>|undefined;
const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(listener=>listener());
export const getSharedBookings=()=>bookings;
export function setSharedBookings(action:SetStateAction<BookingDetail[]>) {
  bookings=typeof action==='function'?action(bookings):action;notify();
}
export function refreshSharedBookings():Promise<void> {
  return pending ||= bookingApiService.list().then(saved=>{bookings=saved;state={loading:false,error:''};notify();})
    .catch(error=>{state={loading:false,error:error instanceof Error?error.message:'Chưa tải được lịch sân.'};notify();})
    .finally(()=>{pending=undefined;});
}
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export default function useSharedBookings() {
  const rows=useSyncExternalStore(subscribe,getSharedBookings);
  const status=useSyncExternalStore(subscribe,()=>state);
  useEffect(()=>{
    if(subscribers++===0){void refreshSharedBookings();polling=setInterval(()=>{void refreshSharedBookings();},10000);window.addEventListener('focus',refreshSharedBookings);}
    return()=>{if(--subscribers===0){clearInterval(polling);window.removeEventListener('focus',refreshSharedBookings);}};
  },[]);
  return [rows,setSharedBookings,status] as const;
}
