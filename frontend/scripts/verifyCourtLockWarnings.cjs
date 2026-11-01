const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const storage=new Map();
const events={};
function load(file,deps={}) {
 const source=fs.readFileSync(path.join(root,file),'utf8').replace('import.meta.env.VITE_API_URL','undefined');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 vm.runInNewContext(code,{exports,require:name=>{if(!(name in deps))throw Error(`Unexpected import ${name}`);return deps[name];},Date,console,Map,Set,
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},window:{addEventListener:(name,handler)=>{events[name]=handler;}},
 });return exports;
}
const warnings=load('src/utils/courtBookingWarnings.ts');
const now=new Date('2026-11-02T03:00:00Z');
const booking=(code,date,time,status='Đã đặt',court='Sân CL-01')=>({code,bookingDate:date,time,status,court,customerName:'Khách '+code});
const fixtures=[
 booking('ended','2026-11-02','08:00 - 09:00'),
 booking('current','2026-11-02','09:00 - 10:30'),
 booking('later','2026-11-02','15:00 - 16:00'),
 booking('tomorrow','2026-11-03','05:00 - 06:00'),
 booking('old','2026-11-01','15:00 - 16:00'),
 booking('cancelled','2026-11-02','15:00 - 16:00','Đã hủy'),
 booking('checked-out','2026-11-02','15:00 - 16:00','Đã kết thúc'),
 booking('other','2026-11-02','15:00 - 16:00','Đã đặt','Sân CL-02'),
 booking('overrun','2026-11-02','08:00 - 09:00','Đang sử dụng'),
];
const result=warnings.getCourtLockWarnings(fixtures,'CL-01',now);
assert.deepEqual(Array.from(result,item=>item.code),['overrun','current','later','tomorrow']);
assert.equal(warnings.getCourtLockWarnings([booking('bd','2026-11-03','05:00 - 06:00','Đã đặt','Sân BĐ-01')],'SAN_BD_01',now).length,1);
assert.equal(warnings.vietnamBookingDate(new Date('2026-11-01T18:00:00Z')),'2026-11-02');
assert.equal(warnings.getCourtLockWarnings([booking('midnight','2026-11-02','05:00 - 06:00')],'CL-01',new Date('2026-11-01T18:00:00Z')).length,1);
assert.equal(warnings.getCourtLockWarnings([booking('boundary','2026-11-02','09:00 - 10:00')],'CL-01',now).length,0);
assert.equal(warnings.scheduleBookingsForDate(fixtures,new Date(2026,10,2)).some(item=>item.id==='cancelled'),false);
assert.equal(warnings.scheduleBookingsForDate(fixtures,new Date(2026,10,3)).length,1);
const react={useSyncExternalStore:(_subscribe,getSnapshot)=>getSnapshot(),useEffect:()=>{}};
const seed={INITIAL_ADMIN_BOOKINGS:fixtures};
const bookings=load('src/hooks/useSharedBookings.ts',{react,'../types/schedule':seed,'../utils/courtBookingWarnings':warnings});
const newBooking=booking('new','2026-11-03','16:00 - 17:00');
bookings.setSharedBookings(previous=>[...previous,newBooking]);
assert.ok(bookings.getSharedBookings().some(item=>item.code==='new'));
bookings.setSharedBookings(previous=>[...previous,booking('CX-customer','2026-11-03','18:00 - 19:00')]);
assert.equal(warnings.getCourtLockWarnings(bookings.getSharedBookings(),'CL-01',now).some(item=>item.code==='CX-customer'),true);
const reloaded=load('src/hooks/useSharedBookings.ts',{react,'../types/schedule':seed,'../utils/courtBookingWarnings':warnings});
assert.equal(warnings.getCourtLockWarnings(reloaded.getSharedBookings(),'CL-01',now).some(item=>item.code==='new'),true);
const courtDeps={react,'../types/admin':{INITIAL_COURT_STATUSES:[{id:'SAN-CL-01',code:'CL-01',name:'Sân CL-01',isLocked:false}]}};
let courts=load('src/hooks/useCourtAvailability.ts',courtDeps);
courts.setSharedCourtStatuses(previous=>previous.map(court=>({...court,isLocked:true})));
assert.equal(courts.isCourtLocked('CL-01'),true);
assert.equal(reloaded.getSharedBookings().some(item=>item.code==='current'),true,'locking preserves bookings');
reloaded.setSharedBookings(previous=>previous.map(item=>({...item,status:'Đã kết thúc'})));
assert.equal(courts.isCourtLocked('CL-01'),true,'checkout never unlocks maintenance');
courts=load('src/hooks/useCourtAvailability.ts',courtDeps);
assert.equal(courts.isCourtLocked('CL-01'),true,'lock survives reload');
courts.setSharedCourtStatuses(previous=>previous.map(court=>({...court,isLocked:false})));
assert.equal(courts.isCourtLocked('CL-01'),false);
console.log('PASS: active/future/overrun bookings, exclusions, Vietnam midnight, shared persistence, lock preserves bookings until explicit unlock');
