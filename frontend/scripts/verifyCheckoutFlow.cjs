const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
function load(file,deps={}){
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:name=>{if(!(name in deps))throw Error(`Unexpected import ${name}`);return deps[name];},Date,console,Set,Map});return exports;
}
const helpers=load('frontend/src/utils/checkoutSettlement.ts');
let reports,equipments,receipts,commits;
const asset=(code,price)=>({id:code,code,name:code,currentLocation:'Sân CL-01',status:'dang_su_dung',statusLabel:'Đang sử dụng',compensationPrice:price,assignedBookingCode:'BK-test',assignedCourt:'Sân CL-01'});
function reset(){reports=[];equipments=[asset('MATB-1',250000),asset('MATB-2',150000)];receipts=new Map();commits=0;}
const repository={
 getCheckout:reference=>clone(receipts.get(reference)),getAllEquipments:()=>clone(equipments),
 getIncidentById:id=>clone(reports.find(report=>report.id===id)),
 commitCheckout:result=>{commits++;receipts.set(result.receipt.reference,clone(result));result.incidents.forEach(report=>{reports=reports.filter(item=>item.id!==report.id);reports.push(clone(report));});equipments=equipments.map(item=>clone(result.equipments.find(updated=>updated.code===item.code)||item));return clone(result);},
};
const {completeCheckout}=load('backend/src/services/checkoutService.ts',{'../repositories/facilityRepository.js':{facilityRepository:repository}});
const context={reference:'2026-11-02:BK-test',bookingDate:'2026-11-02',bookingCode:'BK-test',courtName:'Sân CL-01',customerName:'Khách thử',customerPhone:'0900000000',remainingBalance:0,expectedAmount:0};
const reporter={name:'Nhân viên lập phiếu',role:'Nhân viên',phone:'0911111111'};
const catalog=[{id:'equipment:MATB-1',name:'Lưới',price:250000,sport:'badminton',equipment:asset('MATB-1',250000)},{id:'equipment:MATB-2',name:'Vợt',price:150000,sport:'badminton',equipment:asset('MATB-2',150000)}];
const draft={id:'SC-new',itemId:catalog[0].id,liability:'DO_KHACH_LAM_HONG',description:'Lưới đứt tại góc trái.\nChờ thay dây.',images:[]};
reset();
let result=completeCheckout({...context,paymentConfirmed:false,reports:[]});
assert.equal(result.receipt.amountPaid,0);assert.equal(result.incidents.length,0);assert.ok(equipments.every(item=>item.status==='san_sang'));
reset();
let built=helpers.buildCheckoutReports([draft],catalog,[],context,reporter);
assert.equal(built[0].reporterName,reporter.name);assert.equal(built[0].description,draft.description);assert.equal(built[0].images.length,0,'photo can be added later');
assert.equal(helpers.calculateCheckoutDamage([draft],catalog),250000);
assert.throws(()=>completeCheckout({...context,expectedAmount:250000,reports:built,paymentConfirmed:false}),/VietQR/);
assert.equal(commits,0,'failed payment check does not mutate records');
result=completeCheckout({...context,expectedAmount:250000,reports:built,paymentConfirmed:true});
assert.equal(result.receipt.amountPaid,250000);assert.equal(result.incidents[0].compensationPaymentStatus,'paid');assert.equal(equipments[0].status,'hong');assert.equal(equipments[1].status,'san_sang');
completeCheckout({...context,expectedAmount:250000,reports:built,paymentConfirmed:true});
assert.equal(commits,1,'repeat confirmation is idempotent');assert.equal(reports.length,1);
reset();
const venue={...draft,liability:'BAO_HANH_SAN_VAN_DONG'};
built=helpers.buildCheckoutReports([venue],catalog,[],context,reporter);
result=completeCheckout({...context,reports:built,paymentConfirmed:false});
assert.equal(result.receipt.amountPaid,0);assert.equal(result.incidents[0].compensationPaymentStatus,'not_required');assert.equal(equipments[0].status,'hong');
reset();
const external={...helpers.buildCheckoutReports([draft],catalog,[],context,{...reporter,name:'Chủ sân'} )[0],id:'SC-existing',bookingCode:undefined,checkoutReference:undefined,compensationPrice:200000,images:['data:image/png;base64,b3JpZ2luYWw='],timelineLogs:[{id:'log1',title:'Ghi nhận',description:'Nội dung cũ',time:'07:00'}]};
reports=[clone(external)];
const existingDraft={...draft,id:'SC-existing',existingId:'SC-existing',description:external.description};
built=helpers.buildCheckoutReports([existingDraft],catalog,reports,context,reporter);
assert.equal(helpers.calculateCheckoutDamage([existingDraft],catalog,reports),200000);
result=completeCheckout({...context,expectedAmount:200000,reports:built,paymentConfirmed:true});
assert.equal(reports.length,1,'attach an existing report without duplication');assert.equal(result.incidents[0].reporterName,'Chủ sân');assert.equal(result.incidents[0].images[0],external.images[0]);assert.equal(result.incidents[0].timelineLogs[0].description,'Nội dung cũ');
assert.throws(()=>helpers.buildCheckoutReports([existingDraft],catalog,result.incidents,context,reporter),/thu phí/);
reset();
built=helpers.buildCheckoutReports([draft],catalog,[],context,reporter);equipments[0].compensationPrice=300000;
assert.throws(()=>completeCheckout({...context,expectedAmount:250000,reports:built,paymentConfirmed:true}),/thay đổi/);assert.equal(commits,0);
assert.throws(()=>helpers.buildCheckoutReports([draft,{...draft,id:'duplicate'}],catalog,[],context,reporter),/trùng/);
assert.throws(()=>helpers.buildCheckoutReports([draft],[],[],context,reporter),/thiết bị/);
assert.equal(helpers.checkoutCourtCode('Sân BĐ-01'),helpers.checkoutCourtCode('Sân BD-01'));
// Check the default checkout render has neither damage fields nor a transfer QR.
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const ui=load('frontend/src/components/admin/CheckoutSettlementView.tsx',{
 react:{useState:value=>[typeof value==='function'?value():value,()=>{}],useEffect:()=>{}},'react/jsx-runtime':jsx,
 'lucide-react':{},'../../utils/incidentStorage':{},'../../services/facilityService':{},
 '../../utils/compensationCatalog':{DATA:{badminton:{label:'Cầu lông'}},useCompensationCatalog:()=>catalog},'../../utils/checkoutSettlement':helpers,
});
const tree=ui.default({booking:{code:'BK-test',court:'Sân CL-01',time:'08:00 - 09:00',remaining:'0 VND',total:'120.000 VND',paidAmount:'120.000 VND',customerName:'Khách',phone:'0900000000'},date:new Date(2026,10,2),equipments:[],incidents:[],currentUser:reporter,onBack:()=>{},onComplete:()=>{},onFinished:()=>{}});
const nodes=[];function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return;}nodes.push(node);visit(node.props?.children);}visit(tree);
assert.equal(nodes.some(node=>node.type==='textarea'||node.type==='select'),false,'damage form hidden initially');
assert.equal(nodes.some(node=>node.type==='img'),false,'no QR without an amount due');
// Type-check the backend checkout graph using the existing frontend Node typings.
const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,skipLibCheck:true,noEmit:true,esModuleInterop:true,types:['node'],typeRoots:[path.join(root,'frontend/node_modules/@types')]};
const program=ts.createProgram([path.join(root,'backend/src/services/checkoutService.ts')],options);
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length)throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:file=>file,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
console.log('PASS: no-incident checkout, customer vs venue liability, catalogue totals, VietQR confirmation, existing report/history/photos, duplicate protection, price-change rejection, asset recall, default compact UI and backend typecheck');
