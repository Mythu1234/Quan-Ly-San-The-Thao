const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
function load(file,deps={},globals={}){
 const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,require:name=>{if(!(name in deps))throw Error(`Unexpected import ${name}`);return deps[name];},Date,console,Set,Map,...globals});return exports;
}
const helpers=load('frontend/src/utils/checkoutSettlement.ts');
// Responsibility must be chosen explicitly before a new checkout report can be saved.
const damageDraft={id:'draft-test',itemId:'DB00000001',liability:'',description:'Lưới bị rách',images:[]};
const priceCatalog=[{id:'DB00000001',name:'Lưới cầu lông',price:150000,sport:'badminton'}];
const checkoutBooking={reference:'test',bookingCode:'DS00000001',bookingDate:'2026-11-04',courtName:'Sân CL-01'};
assert.equal(helpers.calculateCheckoutDamage([damageDraft],priceCatalog),0);
assert.throws(()=>helpers.buildCheckoutReports([damageDraft],priceCatalog,[],checkoutBooking,{}),/chọn trách nhiệm/);
for(const liability of ['DO_KHACH_LAM_HONG','BAO_HANH_SAN_VAN_DONG']){
 const draft={...damageDraft,liability};
 const [report]=helpers.buildCheckoutReports([draft],priceCatalog,[],checkoutBooking,{});
 assert.equal(report.liability,liability);
 assert.equal(report.bookingCode,checkoutBooking.bookingCode);
 assert.equal(report.compensationAmount,liability==='DO_KHACH_LAM_HONG'?150000:0);
}
const {execFileSync}=require('node:child_process');
execFileSync(process.execPath,['--test','tests/facility-database.test.mjs'],{cwd:path.join(root,'backend'),stdio:'inherit'});
const catalog=[];
const reporter={name:'Nhân viên',role:'Nhân viên',phone:'0912345678'};
// Check the default checkout render has neither damage fields nor a transfer QR.
const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
const ui=load('frontend/src/components/admin/CheckoutSettlementView.tsx',{
 react:{useState:value=>[typeof value==='function'?value():value,()=>{}],useEffect:()=>{}},'react/jsx-runtime':jsx,
 'lucide-react':{},'../../utils/incidentStorage':{},'../../services/facilityService':{},'./IncidentSelect':{default:()=>null},
 '../QrCodeArtwork':{default:()=>null},'../../utils/compensationCatalog':{DATA:{badminton:{label:'Cầu lông'}},useCompensationCatalog:()=>catalog},'../../utils/checkoutSettlement':helpers,
});
const tree=ui.default({booking:{code:'BK-test',court:'Sân CL-01',time:'08:00 - 09:00',remaining:'0 VND',total:'120.000 VND',paidAmount:'120.000 VND',customerName:'Khách',phone:'0900000000'},date:new Date(2026,10,2),equipments:[],incidents:[],currentUser:reporter,onBack:()=>{},onComplete:()=>{},onFinished:()=>{}});
const nodes=[];function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return;}nodes.push(node);visit(node.props?.children);}visit(tree);
assert.equal(nodes.some(node=>node.type==='textarea'||node.type==='select'),false,'damage form hidden initially');
assert.equal(nodes.some(node=>node.type==='img'),false,'no QR without an amount due');
// Run the component with controlled hooks and a fake clock: payment is opt-in,
// takes seven seconds, cancels when unticked and still requires explicit checkout.
const slots=[],effects=[];let cursor=0,dirty=false,pending=[],clock=0,nextTimer=0;
const timers=new Map();
const hooks={useState(initial){const index=cursor++;if(!(index in slots))slots[index]=typeof initial==='function'?initial():initial;return [slots[index],value=>{const next=typeof value==='function'?value(slots[index]):value;if(!Object.is(slots[index],next)){slots[index]=next;dirty=true;}}];},useEffect(callback,deps){const index=cursor++,previous=effects[index];if(!previous||deps.some((value,i)=>!Object.is(value,previous.deps[i])))pending.push(()=>{previous?.cleanup?.();effects[index]={deps,cleanup:callback()};});}};
const paymentUi=load('frontend/src/components/admin/CheckoutSettlementView.tsx',{
 react:hooks,'react/jsx-runtime':jsx,'lucide-react':{},'./IncidentSelect':{default:()=>null},'../QrCodeArtwork':{default:()=>null},
 '../../services/facilityService':{facilityApiService:{getCheckoutReceipt:()=>({then(callback){callback(null);return {catch(){return {finally(callback){callback();}};}};}})}},
 '../../utils/compensationCatalog':{DATA:{badminton:{label:'Cầu lông'}},useCompensationCatalog:()=>priceCatalog},'../../utils/checkoutSettlement':helpers,
},{setTimeout(callback,delay){const id=++nextTimer;timers.set(id,{callback,at:clock+delay});return id;},clearTimeout(id){timers.delete(id);}});
let completedRequest,finished=false;
const paymentProps={booking:{code:'DS00000001',court:'Sân CL-01',time:'08:00 - 09:00',remaining:'0 VND',total:'120.000 VND',paidAmount:'120.000 VND',customerName:'Khách',phone:'0900000000'},date:new Date(2026,10,4),equipments:[],incidents:[{id:'SC00000001',bookingCode:'DS00000001',bookingDate:'2026-11-04',courtName:'Sân CL-01',compensationItemId:'DB00000001',compensationPrice:150000,liability:'DO_KHACH_LAM_HONG',description:'Lưới rách',images:[],compensationPaymentStatus:'pending'}],currentUser:reporter,onBack:()=>{},onComplete:async request=>{completedRequest=request;return {};},onFinished:()=>{finished=true;}};
let paymentNodes=[];
function renderPayment(){let passes=0;do{dirty=false;cursor=0;pending=[];const output=paymentUi.default(paymentProps);paymentNodes=[];const walk=node=>{if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(walk);return;}paymentNodes.push(node);walk(node.props?.children);};walk(output);pending.forEach(run=>run());assert.ok(++passes<20,'hooks settle');}while(dirty);}
const paymentToggle=()=>paymentNodes.find(node=>node.type==='input'&&node.props.type==='checkbox'&&node.props.className?.includes('h-4 w-4'));
const checkoutButton=()=>paymentNodes.find(node=>node.type==='button'&&node.props.className?.includes('w-full'));
function advance(ms){clock+=ms;for(const [id,timer] of timers){if(timer.at<=clock){timers.delete(id);timer.callback();}}renderPayment();}
renderPayment();assert.equal(checkoutButton().props.disabled,true);assert.equal(timers.size,0);
paymentToggle().props.onChange({target:{checked:true}});renderPayment();
assert.equal(timers.size,1);advance(6999);assert.equal(checkoutButton().props.disabled,true);
paymentProps.incidents=[...paymentProps.incidents];renderPayment();assert.equal(timers.size,1,'background refresh preserves pending payment');
advance(1);assert.equal(checkoutButton().props.disabled,false);assert.equal(completedRequest,undefined,'timer does not checkout');
// Changing the report invalidates the prior payment acknowledgement.
paymentProps.incidents=[];
renderPayment();
paymentNodes.find(node=>node.type==='textarea').props.onChange({target:{value:'Mô tả đã cập nhật'}});renderPayment();
assert.equal(paymentToggle().props.checked,false);assert.equal(checkoutButton().props.disabled,true);
// Restore the original linked report so its historical validation remains available.
paymentProps.incidents=[{id:'SC00000001',bookingCode:'DS00000001',bookingDate:'2026-11-04',courtName:'Sân CL-01',compensationItemId:'DB00000001',compensationPrice:150000,liability:'DO_KHACH_LAM_HONG',description:'Lưới rách',images:[],compensationPaymentStatus:'pending'}];renderPayment();
paymentToggle().props.onChange({target:{checked:false}});renderPayment();assert.equal(checkoutButton().props.disabled,true);
paymentToggle().props.onChange({target:{checked:true}});renderPayment();
paymentToggle().props.onChange({target:{checked:false}});renderPayment();assert.equal(timers.size,0,'untick cancels timer');
paymentToggle().props.onChange({target:{checked:true}});renderPayment();advance(7000);
checkoutButton().props.onClick().then(()=>{assert.equal(completedRequest.paymentConfirmed,true);assert.match(completedRequest.bankTransactionCode,/^VQR\d{8}$/);assert.equal(completedRequest.expectedAmount,150000);assert.equal(completedRequest.reports.length,1);assert.equal(finished,true);});
// Type-check the backend checkout graph using the existing frontend Node typings.
const options={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,strict:true,skipLibCheck:true,noEmit:true,esModuleInterop:true,types:['node'],typeRoots:[path.join(root,'frontend/node_modules/@types')]};
const program=ts.createProgram([path.join(root,'backend/src/services/checkoutService.ts')],options);
const diagnostics=ts.getPreEmitDiagnostics(program);
if(diagnostics.length)throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:file=>file,getCurrentDirectory:()=>root,getNewLine:()=> '\n'}));
console.log('PASS: PostgreSQL checkout transactions, default compact UI and backend typecheck');
