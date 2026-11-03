import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(file,deps={}){
  const code=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const exports={};vm.runInNewContext(code,{exports,Buffer,Date,require:name=>name in deps?deps[name]:require(name)});return exports;
}
const passwords=load('../src/services/passwords.ts');
const {createStaffAuthService,publicEmployee}=load('../src/services/staffAuthService.ts',{'../lib/supabaseClient.js':{supabase:{}},'./passwords.js':passwords});
function fixture(){
  const rows=[['NV00000001','ADMIN','0912345678','admin@1234'],['NV00000002','STAFF','0901234567','staff@1234'],['NV00000003','STAFF','0907654321','staff@1234']].map(([id,role,phone,password])=>({ma_nhan_vien:id,ho_ten:id,so_dien_thoai:phone,email:id.toLowerCase()+'@example.invalid',vai_tro:role,trang_thai_hoat_dong:true,ngay_tao:'2026-11-03T00:00:00Z',mat_khau:passwords.hashPassword(password)}));
  const db={rows,fail:false,from(){
    const filters=[];let patch;
    const run=()=>{
      if(db.fail)return {data:null,error:{message:'database offline'}};
      const matches=rows.filter(row=>filters.every(([key,value])=>row[key]===value));
      if(patch)matches.forEach(row=>Object.assign(row,patch));
      return {data:matches,error:null};
    };
    const query={select(){return query;},eq(key,value){filters.push([key,value]);return query;},order(){return query;},limit(){return Promise.resolve(run());},single(){const result=run();return Promise.resolve({...result,data:result.data?.[0]});},maybeSingle(){return query.single();},update(value){patch=value;return query;},then(resolve,reject){return Promise.resolve(run()).then(resolve,reject);}};
    return query;
  }};
  return {db,auth:createStaffAuthService(db)};
}
test('password hashes are salted, verifiable and support legacy credentials',()=>{
  const first=passwords.hashPassword('staff@1234'),second=passwords.hashPassword('staff@1234');
  assert.notEqual(first,second);assert.ok(passwords.verifyPassword('staff@1234',first));
  assert.ok(!passwords.verifyPassword('wrong',first));assert.ok(passwords.verifyPassword('legacy','legacy'));
});
test('login reads database roles and correct accounts, never returns password, rejects disabled and old sample passwords',async()=>{
  const {db,auth}=fixture();
  const admin=await auth.login('admin','admin@1234');assert.equal(admin.id,'NV00000001');assert.equal(admin.authRole,'ADMIN');
  const staff=await auth.login('+84907654321','staff@1234');assert.equal(staff.id,'NV00000003');assert.equal(staff.authRole,'STAFF');
  assert.ok(!('mat_khau' in staff));assert.ok(!('password' in staff));
  await assert.rejects(auth.login('admin','admin'),/không chính xác/);
  db.rows[2].trang_thai_hoat_dong=false;await assert.rejects(auth.login('0907654321','staff@1234'),/không chính xác/);
});
test('password change checks current password and updates only the logged account; new login uses saved password',async()=>{
  const {db,auth}=fixture();const untouched=db.rows[0].mat_khau;
  await assert.rejects(auth.changePassword('NV00000002','wrong','staff@5678'),/hiện tại/);
  await auth.changePassword('NV00000002','staff@1234','staff@5678');
  assert.equal(db.rows[0].mat_khau,untouched);assert.notEqual(db.rows[1].mat_khau,'staff@5678');
  await assert.rejects(auth.login('0901234567','staff@1234'),/không chính xác/);
  assert.equal((await auth.login('0901234567','staff@5678')).id,'NV00000002');
});
test('database failure is surfaced instead of accepting local sample credentials',async()=>{
  const {db,auth}=fixture();db.fail=true;
  await assert.rejects(auth.login('admin','admin@1234'),/kết nối/);
});
const directoryFor=db=>load('../src/services/staffDirectoryService.ts',{'../lib/supabaseClient.js':{supabase:db},'./staffAuthService.js':{publicEmployee},'./passwords.js':passwords}).staffDirectoryService;
test('staff directory and details use exact database identity, two roles and no secret fields',async()=>{
  const {db}=fixture(),directory=directoryFor(db);
  const rows=await directory.list();assert.equal(rows.length,3);
  assert.equal(rows[0].role,'Chủ sân');assert.equal(rows[1].role,'Nhân viên');
  const staff=await directory.get('NV00000003');assert.equal(staff.phone,'0907654321');assert.equal(staff.id,'NV00000003');
  assert.equal((await directory.get('NV00000001')).authRole,'ADMIN');
  assert.ok(!('mat_khau' in staff));await assert.rejects(directory.get('NV99999999'),/Không tìm thấy/);
});
test('directory edits persist canonical roles and hashed reset passwords on only the selected account',async()=>{
  const {db}=fixture(),directory=directoryFor(db),adminPassword=db.rows[0].mat_khau;
  const saved=await directory.update('NV00000002',{name:'Tên đã sửa',authRole:'ADMIN',role:'Chủ sân',password:'new@1234'});
  assert.equal(saved.name,'Tên đã sửa');assert.equal(saved.role,'Chủ sân');assert.equal(saved.authRole,'ADMIN');
  assert.ok(passwords.verifyPassword('new@1234',db.rows[1].mat_khau));assert.equal(db.rows[0].mat_khau,adminPassword);
  assert.ok(!('mat_khau' in saved));
  await assert.rejects(directory.update('NV00000002',{role:'Thu ngân'}),/Chủ sân hoặc Nhân viên/);
  db.fail=true;await assert.rejects(directory.list(),/offline/);
});
