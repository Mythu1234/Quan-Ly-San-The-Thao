const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
let fetchImpl=()=>Promise.reject(Error('offline'));
function load(file,deps={}) {
  const source=fs.readFileSync(path.join(root,file),'utf8').replaceAll('import.meta.env.VITE_API_URL','undefined');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};
  vm.runInNewContext(code,{exports,require:name=>{if(!(name in deps))throw Error(`Unexpected import ${name}`);return deps[name];},
    fetch:(...args)=>fetchImpl(...args),AbortSignal,Date,console,Map,Set,Promise});
  return exports;
}
const response=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
async function main() {
  const api=load('src/services/apiClient.ts');
  const {facilityApiService:facility}=load('src/services/facilityService.ts',{'./apiClient':api});
  const {bookingApiService:booking}=load('src/services/bookingService.ts',{'./apiClient':api,'../lib/supabaseClient':{supabase:{}}});
  fetchImpl=async(url,options)=>{
    assert.equal(url,'/api/bookings/lookup');assert.equal(options.method,'POST');
    assert.equal(JSON.parse(options.body).query,'DS00000001');
    return response(200,{success:true,data:[{code:'DS00000001'}]});
  };
  assert.equal((await booking.lookup('DS00000001'))[0].code,'DS00000001');
  fetchImpl=()=>Promise.reject(Error('offline'));
  await assert.rejects(facility.loadAllFacilityData(),/chưa được lưu/);
  await assert.rejects(facility.completeCheckout({}),/chưa được lưu/);
  fetchImpl=async()=>response(503,{success:false,message:'Database chưa cập nhật'});
  await assert.rejects(facility.getCheckoutReceipt('2026-11-03:DS1'),/chưa cập nhật/);
  await assert.rejects(booking.checkIn('DS1','2026-11-03'),/chưa cập nhật/);
  fetchImpl=async()=>response(404,{success:false});
  assert.equal(await facility.getCheckoutReceipt('2026-11-03:DS1'),undefined);
  const hook=load('src/hooks/useCompleteCheckout.ts',{'../services/facilityService':{facilityApiService:facility}}).default;
  let stateWrites=0;
  fetchImpl=()=>Promise.reject(Error('offline'));
  await assert.rejects(hook([],()=>stateWrites++,[],()=>stateWrites++)({}),/chưa được lưu/);
  assert.equal(stateWrites,0,'failed checkout never updates local state or reports success');
  const react={useEffect:()=>{},useSyncExternalStore:(_subscribe,snapshot)=>snapshot()};
  const store=load('src/hooks/useSharedBookings.ts',{react,'../services/bookingService':{bookingApiService:booking}});
  assert.equal(store.getSharedBookings().length,0,'schedule never loads browser demo records');
  const fixture=[{code:'DS00000001',bookingDate:'2026-11-03',court:'Sân CL-01',status:'Đã đặt',time:'08:00 - 09:00'}];
  fetchImpl=async()=>response(200,{success:true,data:fixture});
  await store.refreshSharedBookings();
  assert.equal(store.getSharedBookings()[0].code,fixture[0].code);
  const reload=load('src/hooks/useSharedBookings.ts',{react,'../services/bookingService':{bookingApiService:booking}});
  assert.equal(reload.getSharedBookings().length,0);
  await reload.refreshSharedBookings();
  assert.equal(reload.getSharedBookings()[0].code,fixture[0].code,'reload reads the database API again');
  const catalog=load('src/utils/compensationCatalog.ts',{react,'../services/facilityService':{facilityApiService:facility}});
  const prices=[{id:'DB00000001',name:'Lưới',price:150000,sport:'badminton',equipmentId:'TB00000001'}];
  fetchImpl=async()=>response(200,{success:true,data:prices});
  await catalog.refreshCompensationCatalog();
  const asset={id:'TB00000001',code:'TB00000001',serialNumber:'SERIAL-01'};
  assert.equal(catalog.getCompensationItems([asset])[0].equipment.serialNumber,'SERIAL-01');
  fetchImpl=async()=>response(503,{success:false,message:'Database offline'});
  await assert.rejects(catalog.hideCompensationItem(prices[0].id),/offline/);
  assert.equal(catalog.getCompensationItems([asset]).length,1,'failed save does not hide a database price locally');
  console.log('PASS: API errors, absent vs failed receipt, no offline checkout success, database schedule reload');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
