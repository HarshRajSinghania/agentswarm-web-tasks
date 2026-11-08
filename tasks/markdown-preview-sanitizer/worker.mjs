import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {previewText} = await import(pathToFileURL(process.argv[2]));
const cases=JSON.parse(readFileSync(new URL('./fixtures/cases.json',import.meta.url)));
for(const [input,limit,want] of cases) assert.equal(previewText(input,limit),want,JSON.stringify([input,limit]));
for(const limit of [-1,1.5,NaN,Infinity,'2',null,Number.MAX_SAFE_INTEGER+1]) assert.throws(()=>previewText('hi',limit),TypeError);
for(const input of [null,2,{},[]]) assert.throws(()=>previewText(input,10),TypeError);
console.log(`PASS markdown-preview-sanitizer: ${cases.length} exact synthetic cases and 11 invalid inputs`);
