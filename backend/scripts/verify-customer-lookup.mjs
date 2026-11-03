// Read-only smoke check through the running frontend's API proxy.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const origin='http://localhost:5173';
async function request(path,query) {
  const response=await fetch(origin+'/api/'+path,{signal:AbortSignal.timeout(10000),
    ...(query===undefined?{}:{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query})})});
  const body=await response.json();
  assert.equal(response.status,200);assert.equal(body.success,true);
  return body.data;
}
const rows=await request('bookings');
assert.ok(rows.length,'Database needs an existing booking for this smoke check');
const original=rows[0];
const byCode=await request('bookings/lookup',original.code);
assert.equal(byCode.length,1);assert.equal(byCode[0].name,original.customerName);
assert.equal(byCode[0].phone,original.phone);assert.equal(byCode[0].court,original.court);
const byPhone=await request('bookings/lookup',original.phone);
assert.ok(byPhone.some(row=>row.code===original.code));
assert.ok(byPhone.every(row=>row.phone===original.phone));
const missing=await request('bookings/lookup','DS99999999');
assert.equal(missing.length,0);
const seedSql=await readFile(new URL('../../frontend/docs/supabase_schema.sql',import.meta.url),'utf8');
const seedCodes=new Set(seedSql.match(/DS\d{8}/g)||[]);
console.log(JSON.stringify({codeLookup:'passed',phoneLookup:'passed',missingLookup:'empty',
  onlineBookings:rows.length,bookingIdsAlsoInSeed:rows.filter(row=>seedCodes.has(row.code)).length}));
