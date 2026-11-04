const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const assert=require('node:assert/strict');
const fixtures=Array.from({length:14},(_,i)=>{
 const sport=i<5?'CL':i<10?'BC':'BD',number=i<5?i+1:i<10?i-4:i-9;
 return {id:'SAN'+String(i+1).padStart(8,'0'),name:`Sân ${sport}-${String(number).padStart(2,'0')}`,sportId:i<5?'badminton':i<10?'volleyball':'football',isLocked:false};
});
const exportsObject={};
const code=ts.transpileModule(fs.readFileSync(new URL('../src/hooks/useCourtAvailability.ts',`file:///${__filename.replaceAll('\\','/')}`),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
vm.runInNewContext(code,{exports:exportsObject,console,setInterval,clearInterval,
 require:name=>{
  if(name==='react')return {useEffect:()=>{},useSyncExternalStore:(_,snapshot)=>snapshot()};
  if(name==='../services/facilityService')return {facilityApiService:{getCourts:async()=>fixtures}};
  throw Error(name);
 }});
(async()=>{
 const api=exportsObject;
 await api.refreshCourtAvailability();
 const visible=api.default()[0];
 assert.equal(visible.length,14);assert.equal(visible[0].code,'CL-01');assert.equal(visible[13].code,'BD-04');
 api.setSharedCourtStatuses(previous=>previous.map(c=>({...c,isLocked:c.id==='SAN00000001'})));
 assert.equal(api.isCourtLocked('Sân CL-01'),true);assert.equal(api.isCourtLocked('CL-02'),false);
 assert.equal(api.isCourtLocked('unknown'),false);
 api.setSharedCourtStatuses(previous=>previous.map(c=>({...c,isLocked:false})));
 assert.equal(api.isCourtLocked('CL-01'),false);
 console.log('Court availability: 14 API courts retained with SAN IDs, lock/unlock shared correctly.');
})().catch(error=>{console.error(error);process.exitCode=1;});
