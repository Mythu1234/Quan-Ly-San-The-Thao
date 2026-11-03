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
const {execFileSync}=require('node:child_process');
execFileSync(process.execPath,['--test','tests/facility-database.test.mjs'],{cwd:path.join(root,'backend'),stdio:'inherit'});
const catalog=[];
const reporter={name:'Nhân viên',role:'Nhân viên',phone:'0912345678'};
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
console.log('PASS: PostgreSQL checkout transactions, default compact UI and backend typecheck');
