import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {webcrypto} from 'node:crypto';
function load(relative,deps){
 const code=ts.transpileModule(readFileSync(new URL(relative,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(code,{exports,Date,console,crypto:webcrypto,require:name=>{if(!(name in deps))throw Error(name);return deps[name];}});return exports;
}
test('new catalogue equipment saves its name, sport and compensation price without requiring a physical serial',async()=>{
 let saved;
 const {FacilityService}=load('../src/services/facilityService.ts',{'../repositories/facilityRepository.js':{facilityRepository:{getAllEquipments:async()=>[],saveEquipment:async item=>(saved=item)}}});
 const result=await new FacilityService().createEquipment({name:'  New item  ',sportType:'BongChuyen',compensationPrice:250000});
 assert.equal(result,saved);assert.equal(saved.name,'New item');assert.equal(saved.isCatalogItem,true);
 assert.equal(saved.compensationPrice,250000);assert.equal(saved.sportType,'BongChuyen');assert.equal(saved.currentLocation,'Kho chung');
});
test('missing prices and duplicate catalogue names are rejected before saving',async()=>{
 let writes=0;
 const {FacilityService}=load('../src/services/facilityService.ts',{'../repositories/facilityRepository.js':{facilityRepository:{getAllEquipments:async()=>[{name:'Existing Item',sportType:'CauLong',isCatalogItem:true}],saveEquipment:async()=>{writes++;}}}});
 const service=new FacilityService();
 for(const price of [undefined,-1,0,1.5])await assert.rejects(service.createEquipment({name:'New',sportType:'CauLong',compensationPrice:price}));
 await assert.rejects(service.createEquipment({name:'  existing   item  ',sportType:'CauLong',compensationPrice:100000}),e=>e.status===409);
 assert.equal(writes,0);
});
test('catalogue API uses the saved equipment identity, sport and price, hiding unrelated old price rows',async()=>{
 const data={thiet_bi:[{ma_thiet_bi:'TB00000021',ten_thiet_bi:'Canonical Name',so_seri:null,trang_thai:'san_sang',thong_tin_bo_sung:{isCatalogItem:true,compensationItemId:'DB00000001',sportType:'BongChuyen',compensationPrice:250000}}],
  bang_gia_den_bu:[{ma_danh_muc_den_bu:'DB00000001',ten_vat_tu:'Canonical Name',don_gia_den_bu:250000,bo_mon:null},{ma_danh_muc_den_bu:'DB00000002',ten_vat_tu:'Old duplicate',don_gia_den_bu:250000,bo_mon:null}]};
 const supabase={from:table=>{const query={select:()=>query,order:()=>query,then:resolve=>Promise.resolve({data:data[table],error:null}).then(resolve)};return query;}};
 const {FacilityRepository}=load('../src/repositories/facilityRepository.ts',{'../lib/supabaseClient.js':{supabase}});
 const prices=await new FacilityRepository().getCompensationPrices();
 assert.equal(prices.length,1);assert.equal(prices[0].equipmentId,'TB00000021');assert.equal(prices[0].name,'Canonical Name');
 assert.equal(prices[0].sport,'volleyball');assert.equal(prices[0].price,250000);
});
test('incident details use persisted equipment links instead of incomplete draft metadata, preserving photos',()=>{
 const {mapIncident}=load('../src/repositories/facilityRepository.ts',{'../lib/supabaseClient.js':{supabase:{}}});
 const report=mapIncident({ma_su_co:'SC00000005',ngay_tao:'2026-11-03T17:41:18Z',trang_thai_xu_ly:'DA_XU_LY',tong_tien_den_bu:0,
  thong_tin_bo_sung:{damageItems:[{id:'DM-draft',title:'Draft name',imageUrl:'data:image/png;base64,test',imageLabel:'Photo'}]},
  chi_tiet_su_co:[{ma_chi_tiet:'CT00000005',ma_thiet_bi:'TB00000010',don_gia_ap_dung:250000,so_luong_hu_hai:1,mo_ta_chi_tiet:'Broken ball',bang_gia_den_bu:{ten_vat_tu:'Quả bóng đá thi đấu'}}]});
 assert.equal(report.damageItems[0].id,'CT00000005');assert.equal(report.damageItems[0].equipmentCode,'TB00000010');
 assert.equal(report.damageItems[0].title,'Quả bóng đá thi đấu');assert.equal(report.damageItems[0].imageUrl,'data:image/png;base64,test');
 assert.equal(report.compensationPrice,250000);assert.equal(report.compensationAmount,0);
});

test('equipment mapping reads explicit price columns and preserves unknown purchase costs as missing',()=>{
 const {mapEquipment}=load('../src/repositories/facilityRepository.ts',{'../lib/supabaseClient.js':{supabase:{}}});
 const row={ma_thiet_bi:'TB00000001',ten_thiet_bi:'Item',trang_thai:'san_sang',gia_mua:'250000.00',gia_boi_thuong:'150000.00',
  thong_tin_bo_sung:{purchasePrice:1,compensationPrice:2,isCatalogItem:true}};
 assert.equal(mapEquipment(row).purchasePrice,250000);assert.equal(mapEquipment(row).compensationPrice,150000);
 assert.equal(mapEquipment({...row,gia_mua:null}).purchasePrice,undefined);
 const {gia_mua,gia_boi_thuong,...legacy}=row;
 assert.equal(mapEquipment(legacy).purchasePrice,1);assert.equal(mapEquipment(legacy).compensationPrice,2);
});
test('checkout charges catalogue price for customer damage and zero for venue liability without mutating a shared physical asset',()=>{
 const {buildCheckoutReports,calculateCheckoutDamage}=load('../../frontend/src/utils/checkoutSettlement.ts',{});
 const catalog=[{id:'DB00000001',name:'Catalogue item',price:150000,sport:'badminton',equipment:{code:'TB00000021',isCatalogItem:true}}];
 const draft={id:'draft',itemId:'DB00000001',liability:'DO_KHACH_LAM_HONG',description:'Broken',images:[]};
 const booking={reference:'2026-11-03:DS00000001',bookingCode:'DS00000001',bookingDate:'2026-11-03',courtName:'CL-01'};
 const reports=buildCheckoutReports([draft],catalog,[],booking,{name:'Staff',role:'Staff',phone:'0900000000'});
 assert.equal(reports[0].equipmentCode,undefined);assert.equal(reports[0].equipmentName,'Catalogue item');assert.equal(reports[0].compensationAmount,150000);
 assert.equal(calculateCheckoutDamage([draft],catalog),150000);
 assert.equal(calculateCheckoutDamage([{...draft,liability:'BAO_HANH_SAN_VAN_DONG'}],catalog),0);
});
