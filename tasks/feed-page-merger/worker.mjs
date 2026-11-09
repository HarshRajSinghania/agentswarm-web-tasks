import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {mergeFeedPages} = await import(pathToFileURL(process.argv[2]));
const cases=JSON.parse(readFileSync(new URL('./fixtures/cases.json',import.meta.url)));
function freeze(value) {
  if(value && typeof value==='object') { for(const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
}
for(const {name,pages,expected} of cases) {
  for(const repeated of [false,true]) {
    const input=structuredClone(repeated ? [...pages,...pages] : pages);
    const before=structuredClone(input); freeze(input);
    const result=mergeFeedPages(input);
    assert.ok(Array.isArray(result) && result!==input,name+': new array');
    assert.deepEqual(result,expected,name);
    assert.deepEqual(input,before,name+': input mutation');
  }
}
console.log(`PASS feed-page-merger: ${cases.length} exact cases and repeated-page/nonmutation probes`);
