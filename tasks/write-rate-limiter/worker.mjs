import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {createLimiter} = await import(pathToFileURL(process.argv[2]));
const traces = JSON.parse(readFileSync(new URL('./fixtures/cases.json', import.meta.url)));
for (const {limit,steps} of traces) {
 let time=steps[0][0], calls=0;
 const limiter=createLimiter({perMinute:limit,now:()=>{calls++; return time;}});
 assert.equal(calls,1);
 for (const step of steps) {
  time=step[0]; const before=calls;
  if(step[1]==='take') for(let i=0;i<step[2];i++) assert.equal(limiter.tryTake(),step[3],JSON.stringify(step));
  else { assert.equal(limiter.msUntilNext(),step[2]); }
  assert.equal(calls-before,step[1]==='take'?step[2]:1);
 }
}
for(const limit of [0,-1,1.5,NaN,Infinity,'30',Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>createLimiter({perMinute:limit,now:()=>0}),TypeError);
assert.throws(()=>createLimiter({perMinute:30,now:0}),TypeError);
for(const bad of [NaN,Infinity,-Infinity,'0',null]) assert.throws(()=>createLimiter({perMinute:1,now:()=>bad}),RangeError);
for(const method of ['tryTake','msUntilNext']) {
 let time=100; const limiter=createLimiter({perMinute:1,now:()=>time});
 assert.equal(limiter.tryTake(),true);
 for(const bad of [99,NaN,Infinity,'100',null]) {
  time=bad; assert.throws(()=>limiter[method](),RangeError);
  time=100; assert.equal(limiter.tryTake(),false); assert.equal(limiter.msUntilNext(),60000);
 }
 time=60100; assert.equal(limiter.tryTake(),true);
}
const a=createLimiter({perMinute:1,now:()=>0}), b=createLimiter({perMinute:1,now:()=>0});
assert.equal(a.msUntilNext(),0); assert.equal(a.msUntilNext(),0); assert.equal(a.tryTake(),true); assert.equal(b.tryTake(),true);
let explode=false; const error=new Error('clock'); const l=createLimiter({perMinute:1,now:()=>{if(explode)throw error;return 0;}});
explode=true; assert.throws(()=>l.tryTake(),e=>e===error); explode=false; assert.equal(l.tryTake(),true);
console.log('PASS write-rate-limiter: 3 traces, exact boundaries, fractional clocks, invalid options/clocks, rollback recovery, queries and isolation');
