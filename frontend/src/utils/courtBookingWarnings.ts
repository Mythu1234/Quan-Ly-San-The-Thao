import type { BookingDetail } from '../types/schedule';

export const calendarBookingDate=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const vietnamBookingDate=(instant=new Date())=>{
  const shifted=new Date(instant.getTime()+7*60*60*1000);
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth()+1).padStart(2,'0')}-${String(shifted.getUTCDate()).padStart(2,'0')}`;
};
const normalizeCourt=(value:string)=>value.toUpperCase().replace(/Đ/g,'D').match(/(?:CL|BC|BD)[-_]\d{2}/)?.[0].replace('_','-')||value.trim();
export function scheduleBookingsForDate(bookings:BookingDetail[],date:Date) {
  return bookings.filter(booking=>booking.bookingDate===calendarBookingDate(date)&&['Đã đặt','Đang sử dụng','Chờ duyệt hủy'].includes(booking.status)).map(booking=>{
    const times=booking.time.match(/(\d{1,2}):(\d{2})/g)||['00:00','00:00'];
    const [startH,startM]=times[0].split(':').map(Number);
    const [endH,endM]=(times[1]||times[0]).split(':').map(Number);
    const courtCode=normalizeCourt(booking.courtCode||booking.court);
    return {id:booking.code,courtCode,courtName:booking.court,sportId:booking.sportId||(courtCode.startsWith('BC')?'volleyball' as const:courtCode.startsWith('BD')?'football' as const:'badminton' as const),
      startH:booking.startH??startH,startM:booking.startM??startM,endH:booking.endH??endH,endM:booking.endM??endM,title:booking.status};
  });
}
const startMinutes=(booking:BookingDetail)=>{
  if(booking.startH!==undefined)return booking.startH*60+(booking.startM||0);
  const match=booking.time.match(/(\d{1,2}):(\d{2})/);
  return match?Number(match[1])*60+Number(match[2]):0;
};
export function getCourtLockWarnings(bookings:BookingDetail[],court:string,instant=new Date()) {
  const today=vietnamBookingDate(instant);
  const vietnam=new Date(instant.getTime()+7*60*60*1000);
  const nowMinutes=vietnam.getUTCHours()*60+vietnam.getUTCMinutes();
  return bookings.filter(booking=>{
    if(normalizeCourt(booking.courtCode||booking.court)!==normalizeCourt(court))return false;
    if(!['Đã đặt','Đang sử dụng','Chờ duyệt hủy'].includes(booking.status))return false;
    const date=booking.bookingDate||today;
    if(booking.status==='Đang sử dụng')return true;
    if(date<today)return false;
    if(date>today)return true;
    const times=booking.time.match(/(\d{1,2}):(\d{2})/g);
    const last=times?.[1]?.split(':').map(Number);
    const end=booking.endH!==undefined?booking.endH*60+(booking.endM||0):last?last[0]*60+last[1]:24*60;
    return end>nowMinutes;
  }).sort((a,b)=>(a.bookingDate||today).localeCompare(b.bookingDate||today)||startMinutes(a)-startMinutes(b));
}
