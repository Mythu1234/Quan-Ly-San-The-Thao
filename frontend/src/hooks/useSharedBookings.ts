import { useSyncExternalStore } from 'react';
import type { SetStateAction } from 'react';
import { INITIAL_ADMIN_BOOKINGS, type BookingDetail } from '../types/schedule';
import { vietnamBookingDate } from '../utils/courtBookingWarnings';

const KEY='courtx_bookings_v1';
const today=vietnamBookingDate();
const listeners=new Set<()=>void>();
const isBooking=(item:unknown):item is BookingDetail=>!!item&&typeof item==='object'
  &&typeof (item as BookingDetail).code==='string'&&typeof (item as BookingDetail).court==='string'
  &&typeof (item as BookingDetail).status==='string'&&typeof (item as BookingDetail).time==='string';
let bookings:BookingDetail[]=INITIAL_ADMIN_BOOKINGS.map(booking=>({...booking,bookingDate:booking.bookingDate||today}));
try {
  const saved=JSON.parse(localStorage.getItem(KEY)||'null');
  if(Array.isArray(saved)&&saved.every(isBooking))bookings=saved.map(booking=>({...booking,bookingDate:booking.bookingDate||today}));
  else localStorage.setItem(KEY,JSON.stringify(bookings));
}catch{/* Retain bookings in this session when browser storage is unavailable. */}
export const getSharedBookings=()=>bookings;
export function setSharedBookings(action:SetStateAction<BookingDetail[]>) {
  const next=typeof action==='function'?action(bookings):action;
  bookings=next.map(booking=>({...booking,bookingDate:booking.bookingDate||vietnamBookingDate()}));
  try{localStorage.setItem(KEY,JSON.stringify(bookings));}catch{/* Session updates remain available. */}
  listeners.forEach(listener=>listener());
}
if(typeof window!=='undefined')window.addEventListener('storage',event=>{
  if(event.key!==KEY||!event.newValue)return;
  try {
    const saved=JSON.parse(event.newValue);
    if(Array.isArray(saved)&&saved.every(isBooking)){bookings=saved;listeners.forEach(listener=>listener());}
  }catch{/* Ignore malformed changes from other tabs. */}
});
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export default function useSharedBookings(){return [useSyncExternalStore(subscribe,getSharedBookings),setSharedBookings] as const;}
