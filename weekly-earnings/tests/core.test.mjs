import test from 'node:test';
import assert from 'node:assert/strict';
import {payment,freshData,parseRate,total,weekStart,addDays,monthWeeks,validateData} from '../core.mjs';
const entry=(date,quantity,ratePence,job='Dual')=>({id:crypto.randomUUID(),date,quantity,ratePence,job,area:'London'});
test('GBP rates preserve pennies and reject malformed values',()=>{
  assert.equal(parseRate('80'),8000); assert.equal(parseRate('80.50'),8050);assert.equal(parseRate('0'),0);
  for(const text of ['-1','80.123','', '1e3','NaN','100000','£80','1,000'])assert.equal(parseRate(text),null);
});
test('default job example is £240; historical rates are immutable',()=>{
  const data=freshData();data.entries=[entry('2026-10-11',2,8000),entry('2026-10-11',1,data.rates.Single,'Single'),entry('2026-10-11',1,3000,'Site investigation')];
  assert.equal(total(data.entries,'2026-10-11','2026-10-12'),24000);
  data.rates.Dual=9000;assert.equal(total(data.entries,'2026-10-11','2026-10-12'),24000);
});
test('Monday weeks, leap days and year boundaries',()=>{
 assert.equal(weekStart('2026-10-11'),'2026-10-05');assert.equal(weekStart('2026-10-12'),'2026-10-12');
 assert.equal(weekStart('2027-01-01'),'2026-12-28');assert.equal(addDays('2024-02-28',1),'2024-02-29');
 assert.equal(addDays('2026-12-31',1),'2027-01-01');assert.equal(monthWeeks('2026-10')[0].start,'2026-09-28');
});
test('cross-month weekly and monthly totals count each entry correctly',()=>{
 const entries=[entry('2026-09-30',1,8000),entry('2026-10-01',1,6000,'Single'),entry('2026-10-04',1,3000,'Site investigation'),entry('2026-10-05',2,8000)];
 assert.equal(total(entries,'2026-09-28','2026-10-05'),17000);
 assert.equal(total(entries,'2026-10-01','2026-11-01'),25000);
});
test('backup validates integrity and rejects corrupt, duplicate and future formats',()=>{
 const data=freshData();data.entries=[entry('2026-10-11',1,8000)];assert.deepEqual(validateData(JSON.parse(JSON.stringify(data))),data);
 for(const bad of [{...data,version:3},{...data,rates:{Dual:-1}}, {...data,entries:[null]}, {...data,entries:[data.entries[0],data.entries[0]]}, {...data,entries:[{...data.entries[0],quantity:1.5}]}, {...data,entries:[{...data.entries[0],date:'2026-02-30'}]}])assert.throws(()=>validateData(bad));
});
test('native Swift backup is supported',()=>{
 const data=freshData();delete data.version;
 data.entries=[{...entry('2026-10-11',1,8000),date:(Date.UTC(2026,9,11)-Date.UTC(2001,0,1))/1000}];
 assert.equal(validateData(data).entries[0].date,'2026-10-11');
});

test('London and outside London defaults, with safe legacy migration',()=>{
 const fresh=freshData();assert.deepEqual(fresh.outsideRates,{Dual:7000,Single:4500,'Site investigation':3000});
 const old={version:1,configured:true,rates:{Dual:8500,Single:6000,'Site investigation':3500},entries:[entry('2026-10-11',2,8000)]};
 delete old.entries[0].area;
 const migrated=validateData(old);assert.equal(migrated.entries[0].area,'London');assert.equal(migrated.entries[0].ratePence,8000);assert.equal(migrated.rates.Single,6000);assert.equal(migrated.outsideRates.Single,4500);
 assert.deepEqual(validateData(JSON.parse(JSON.stringify(migrated))),migrated);
 assert.throws(()=>validateData({...fresh,entries:[{...entry('2026-10-11',1,7000),area:'Unknown'}]}));
});

test('CIS deducts 20 percent with integer-penny rounding',()=>{
 assert.deepEqual(payment(24000),{grossPence:24000,cisPence:4800,netPence:19200});
 assert.deepEqual(payment(14500),{grossPence:14500,cisPence:2900,netPence:11600});
 assert.deepEqual(payment(0),{grossPence:0,cisPence:0,netPence:0});
 assert.deepEqual(payment(3),{grossPence:3,cisPence:1,netPence:2});
 assert.deepEqual(payment(10002),{grossPence:10002,cisPence:2000,netPence:8002});
});
