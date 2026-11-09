import assert from 'node:assert/strict';

/** Parse only the simple block forms allowed by the pinned README. */
export function parse(text) {
  const blocks=[], headings=[], fences=[];
  let paragraph=[], fence=null, raw=[], table=[];
  const flush=()=>{if(paragraph.length) blocks.push(['paragraph',paragraph.join('\n')]); paragraph=[];};
  const flushTable=()=>{
    if(!table.length) return;
    assert.ok(table.length>=2 && table[1][0]==='table-separator','Table needs delimiter immediately after header');
    const columns=table.map(([kind,row],i)=>{
      assert.equal(kind,i===1?'table-separator':'table','Invalid delimiter position');
      return (row.replace(/`[^`]*`/g,'').match(/(?<!\\)\|/g)||[]).length;
    });
    assert.ok(columns[0]>1 && columns.every(n=>n===columns[0]),'Table columns must match'); table=[];
  };
  for(const line of text.match(/[^\n]*\n|[^\n]+$/g)||[]) {
    if(fence) {
      raw.push(line);
      if(new RegExp('^ {0,3}'+fence[0]+'{'+fence[1]+',}[ \\t]*\\r?\\n?$').test(line)) {
        fences.push(raw.join('')); fence=null; raw=[];
      }
      continue;
    }
    if(!line.trimStart().startsWith('|')) flushTable();
    // Tabs must not smuggle indented paragraphs/code into visible language checks.
    let column=0;
    for(const c of line.match(/^[ \t]*/)[0]) column=c==='\t'?column+(4-column%4):column+1;
    assert.ok(!line.trim() || column<4,'Indented prose/code forbidden');
    const opening=line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)/);
    if(opening) {flush();fence=[opening[1][0],opening[1].length];raw=[line];blocks.push(['fence','']);continue;}
    const visible=line.replace(/(`+).*?\1/g,'');
    assert.ok(!/<!--|<!\[CDATA\[|<\/?[A-Za-z][\w-]*(?:\s|\/?>)/.test(visible),'Raw HTML forbidden');
    assert.ok(!/(?:^|[ \t>])\[[^\]]+\]:/.test(visible),'Reference links forbidden');
    if(!line.trim()) {flush();continue;}
    const heading=line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)\s*#*\s*$/);
    if(heading) {flush();headings.push(heading[1].length);blocks.push(['heading',heading[2]]);}
    else if(line.trimStart().startsWith('|')) {
      flush(); assert.ok(line.trimEnd().endsWith('|'),'Outer table pipes required');
      const row=[/^[\s|:-]+$/.test(line)?'table-separator':'table',line.trim()];blocks.push(row);table.push(row);
    } else if(/^\s*(?:[-+*]|\d+[.)])\s+/.test(line)) {flush();blocks.push(['list',line.replace(/^\s*(?:[-+*]|\d+[.)])\s+/,'').trim()]);}
    else if(line.trimStart().startsWith('>')) {flush();blocks.push(['quote',line.trimStart().slice(1).trim()]);}
    else paragraph.push(line.trim());
  }
  flush();flushTable();assert.equal(fence,null,'Unclosed fence');return {blocks,headings,fences};
}

export function targets(text) {
  const found=[];
  text=text.replace(/\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g,(_all,url)=>{found.push(url.replace(/^<|>$/g,''));return '';});
  found.push(...(text.match(/https?:\/\/[^\s<>`"\[\]{}\u3000-\u303f\uff00-\uffef]+/g)||[]).map(s=>s.replace(/[.,;:)]+$/g,'')));
  return [...new Set(found)].sort();
}
const inline=text=>[...text.matchAll(/`([^`]+)`/g)].map(m=>m[1]).sort();
const prose=text=>text.replace(/(`+).*?\1/g,'').replace(/!?\[([^\]]*)\]\([^\n]*?\)/g,'$1').replace(/https?:\/\/[^\s<>]+|<[^>]+>/g,'');
const words=text=>(text.toLowerCase().match(/\p{L}+/gu)||[]);
const languageProse=(text,source)=>{
  const technical=new Set((source.match(/[A-Za-z][A-Za-z0-9_.-]*/g)||[]).filter(w=>/[A-Z.]/.test(w)));
  for(const m of source.matchAll(/\[([A-Za-z0-9_.-]+)\]\(/g)) technical.add(m[1]);
  return prose(text).replace(/[A-Za-z][A-Za-z0-9_.-]*/g,w=>technical.has(w)?'':w);
};
function language(text,source,context) {
  const visible=languageProse(text,source), all=words(visible);
  const letters=[...visible].filter(c=>/\p{L}/u.test(c));
  const latin=letters.filter(c=>/\p{Script=Han}/u.test(c));
  assert.ok(letters.length && latin.length>letters.length/2,context+': Han majority required');
  const common=new Set('的了是在和有与为不这以可将到中个上用者或对从并通过其');
  if(latin.length>=40) assert.ok(latin.filter(c=>common.has(c)).length>=latin.length*.05,context+': Chinese function characters missing');
  if(latin.length>=20) {
    const counts=new Map();for(const c of latin) counts.set(c,(counts.get(c)||0)+1);
    assert.ok(counts.size>=6 && Math.max(...counts.values())<=latin.length*.4,context+': repeated character padding');
    assert.ok(!/(.{2,80})\1{3,}/u.test(latin.join('')),context+': repeated phrase padding');
  }
}
export function checkTranslation(english,translated) {
  const a=parse(english),b=parse(translated);
  assert.deepEqual(b.headings,a.headings,'Heading count/levels/order');
  assert.deepEqual(b.fences,a.fences,'Fenced code bytes/order');
  assert.deepEqual(targets(translated),targets(english),'Link targets');
  assert.deepEqual(b.blocks.map(r=>r[0]),a.blocks.map(r=>r[0]),'Block order/coverage');
  const seen=new Map();
  for(let i=0;i<a.blocks.length;i++) {
    const [kind,source]=a.blocks[i],actual=b.blocks[i][1],context='Block '+(i+1);
    if(kind==='fence') continue;
    if(kind==='table-separator') {assert.equal(actual,source,context+': delimiter');continue;}
    if(kind==='table') assert.equal((actual.match(/(?<!\\)\|/g)||[]).length,(source.match(/(?<!\\)\|/g)||[]).length,context+': table columns');
    assert.deepEqual(inline(actual),inline(source),context+': inline code');
    assert.deepEqual(targets(actual),targets(source),context+': link block');
    const sp=prose(source),ap=prose(actual);
    assert.ok(ap.trim().length>=Math.max(sp.trim()?1:0,Math.floor(.15*sp.trim().length)),context+': missing prose');
    if((sp.match(/[A-Za-z]{2,}/g)||[]).length>=4) {
      language(actual,source,context);
      const sw=words(languageProse(source,source)),aw=words(languageProse(actual,source));
      const runs=new Set();for(let j=0;j<=sw.length-6;j++)runs.add(sw.slice(j,j+6).join(' '));
      for(let j=0;j<=aw.length-6;j++)assert.ok(!runs.has(aw.slice(j,j+6).join(' ')),context+': untranslated English sequence');
      const key=aw.join('');seen.set(key,(seen.get(key)||0)+1);assert.ok(seen.get(key)<=2,context+': repeated filler');
    }
  }
  language(translated,english,'Document');
}
