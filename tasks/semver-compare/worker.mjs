import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {compareSkillVersions: compare, isAtLeast} = await import(pathToFileURL(process.argv[2]));
const {valid, invalid} = JSON.parse(readFileSync(new URL('./fixtures/cases.json', import.meta.url)));
for (const [a,b,want] of valid) {
  assert.equal(compare(a,b),want); assert.equal(compare(b,a),want === 0 ? 0 : -want);
  assert.equal(isAtLeast(a,b),want>=0); assert.equal(isAtLeast(b,a),want<=0);
}
for (const bad of invalid) for (const [a,b] of [[bad,'1.2.3'],['1.2.3',bad]]) {
  assert.throws(()=>compare(a,b), TypeError); assert.throws(()=>isAtLeast(a,b), TypeError);
}
console.log(`PASS semver-compare: ${valid.length} pairs both directions, ${invalid.length} invalid values both operands/functions`);
