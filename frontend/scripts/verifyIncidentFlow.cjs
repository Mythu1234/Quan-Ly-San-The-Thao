const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
function moduleAt(relative, dependencies) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const code = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports = {};
  vm.runInNewContext(code, {exports, require: name => {
    if (!(name in dependencies)) throw Error(`Unexpected import ${name}`);
    return dependencies[name];
  }, Date, console, Map, Set, crypto:require('node:crypto').webcrypto});
  return exports;
}
let record;
let courtLockCalls = 0;
const copy = value => JSON.parse(JSON.stringify(value));
const repository = {
  getNextIncidentId: () => 'SC-test',
  updateCourtLock: () => { courtLockCalls++; },
  createIncident: incident => { record = copy({...incident,id:incident.id||'SC-test'}); return copy(record); },
  getIncidentById: () => copy(record),
  deleteIncident: () => {
    record.deletedAt = new Date().toISOString();
    record.updatedAt = record.deletedAt;
    return copy(record);
  },
  addIncidentTimelineLog: (_id, log) => {
    record.timelineLogs = [copy(log), ...(record.timelineLogs||[]).map(item => ({...item,active:false}))];
    return copy(record);
  },
};
const {facilityService} = moduleAt('backend/src/services/facilityService.ts', {'../repositories/facilityRepository.js':{facilityRepository:repository}});
const {getIncidentTimeline, mergeIncidents, sortRecentIncidents, filterIncidents} = moduleAt('frontend/src/utils/incidentStorage.ts', {'react':{},'../types/admin':{INITIAL_INCIDENTS:[]}});
async function main(){
const photo = 'data:image/png;base64,aW5jaWRlbnQ=';
const updatePhoto = 'data:image/png;base64,cmVwYWly';
for (const reporter of [{name:'Chủ sân thử nghiệm',role:'Chủ sân',phone:'0901000000'}, {name:'Nhân viên thử nghiệm',role:'Nhân viên',phone:'0902000000'}]) {
  const input = {courtId:'SAN-CL-03',courtName:'Sân CL-03',title:'Dây lưới bị đứt',description:'Đứt tại góc trái.\nCần thay dây mới.',severity:'trung_binh',reporterName:reporter.name,reporterRole:reporter.role,reporterPhone:reporter.phone,images:[photo],imageUrl:photo,technicianNote:'Kiểm tra cột trước khi mở lại.',lockCourt:true};
  const created = (await facilityService.createIncident(input)).incident;
  assert.equal(created.reporterName,reporter.name);
  assert.equal(created.reporterRole,reporter.role);
  assert.equal(created.reporterPhone,reporter.phone);
  let timeline = getIncidentTimeline(created);
  assert.equal(timeline.filter(item=>item.title === input.title).length,1);
  assert.equal(timeline.at(-1).description,input.description);
  assert.equal(timeline.at(-1).images[0],photo);
  const saved = await facilityService.addTimelineLog(created.id,'Đã thay dây','Dây mới đã được căng.\nChờ kiểm tra.',[updatePhoto]);
  const reloaded = copy(saved);
  timeline = getIncidentTimeline(reloaded);
  assert.equal(timeline[0].description,'Dây mới đã được căng.\nChờ kiểm tra.');
  assert.equal(timeline[0].images[0],updatePhoto);
  assert.equal(timeline.at(-1).images[0],photo);
  assert.equal(reloaded.technicianNote,input.technicianNote);
  assert.equal(reloaded.reporterName,reporter.name);
}
const legacy = {id:'old',title:'Nội dung báo cáo',description:'Nguyên văn\nkhông thay đổi',reportedAt:'07:15',reporterName:'Người lập',imageUrl:photo,timelineLogs:[{id:'update',title:'Sửa chữa',description:'Đang sửa',time:'08:00'}]};
const duplicates={...legacy,images:[photo,photo],damageItems:[{imageUrl:photo}],timelineLogs:[
 {id:'REPORT-draft',title:legacy.title,description:legacy.description,time:'07:15',images:[photo]},
 {id:'later',title:'Ảnh bổ sung',description:'Sau khi kiểm tra',time:'2026-11-03T18:20:17.565Z',images:[photo,updatePhoto,updatePhoto]}
]};
const deduplicated=getIncidentTimeline(duplicates);
assert.equal(deduplicated.flatMap(log=>log.images||[]).length,2,'each distinct photo appears once across report and updates');
assert.equal(deduplicated.length,2,'initial report does not become a duplicate journal entry');
assert.ok(deduplicated[0].time.includes('01:20:17'),'ISO log time is displayed in Vietnam time');
assert.equal(deduplicated.at(-1).images[0],photo,'original photo stays on the original report');
assert.equal(getIncidentTimeline(legacy).at(-1).description,legacy.description);
assert.equal(getIncidentTimeline(legacy).at(-1).images[0],photo);
const cached = {...legacy, updatedAt:'2026-11-01T10:00:00Z'};
const server = {...legacy, description:'older',updatedAt:'2026-11-01T09:00:00Z'};
assert.equal(mergeIncidents([server],[cached])[0].description,legacy.description);
const archived = Array.from({length:5},(_, index) => ({...legacy, id:`SC-${index}`,createdAt:`2026-11-0${index+1}T07:00:00Z`}));
const archive = sortRecentIncidents(copy(archived));
assert.equal(archive.length,5,'all stored reports remain available');
assert.equal(archive[0].id,'SC-4','latest report appears first');
assert.equal(archive[4].id,'SC-0','older report remains in archive');
for(const severity of ['khan_cap','trung_binh','thap']) {
  const result = await facilityService.createIncident({courtId:'SAN-CL-01',courtName:'Sân CL-01',title:'Báo cáo',description:'Chưa thay đổi trạng thái sân',severity,lockCourt:true,reporterName:'Chủ sân',compensationItemId:'standard:badminton:0',compensationPrice:250000});
  assert.equal(result.courtLocked,false);
  assert.equal(result.incident.compensationItemId,'standard:badminton:0');
  assert.equal(result.incident.compensationPrice,250000);
  assert.equal(result.incident.timelineLogs?.length||0,0,'court status is not modified by report creation');
}
assert.equal(courtLockCalls,0,'reporting must never lock or unlock a court');
const cases = ['cho_xu_ly','dang_sua_chua','da_khac_phuc'].map((status,index)=>({...legacy,id:`status-${index}`,status}));
assert.equal(filterIncidents(cases,'all').length,3);
assert.equal(filterIncidents(cases,'resolved').length,1);
assert.equal(filterIncidents(cases,'unresolved').length,2);
const deleted = await facilityService.deleteIncident(record.id);
assert.ok(deleted.deletedAt);
assert.equal(deleted.description,record.description,'delete preserves historical incident data');
assert.equal(filterIncidents([deleted],'all').length,0);
assert.equal(filterIncidents([deleted],'unresolved').length,0);
const staleCopy = {...deleted,deletedAt:undefined,updatedAt:'2099-01-01T00:00:00Z'};
assert.equal(filterIncidents(mergeIncidents([staleCopy],[copy(deleted)]),'all').length,0,'deleted report does not return after reload');
assert.equal(filterIncidents(mergeIncidents([copy(deleted)],[staleCopy]),'all').length,0,'server deletion defeats stale browser cache');
assert.equal(courtLockCalls,0,'deletion never changes court lock');
console.log('PASS: all/resolved/unresolved filters, persistent deletion and stale-cache protection');
console.log('PASS: all incident severities leave courts unchanged');
console.log('PASS: both reporters, original report text/photos, photo updates, reload round trip, legacy report and cache merge');

}
main().catch(error=>{console.error(error);process.exitCode=1;});
