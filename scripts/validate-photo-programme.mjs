import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {inflateRawSync} from 'node:zlib';
import {imageSize} from './validate-finished.mjs';

const ROOT=path.dirname(fileURLToPath(new URL('../index.html',import.meta.url)));
export const EXPECTED_DATES=['2026-10-23','2026-10-25','2026-10-28','2026-10-30','2026-11-01','2026-11-04','2026-11-06','2026-11-08','2026-11-11','2026-11-13','2026-11-15','2026-11-18','2026-11-20','2026-11-22','2026-11-25','2026-11-27','2026-11-29'];
export const PROGRAMME_MODES=Object.freeze({
  october:Object.freeze({from:'2026-10-22',to:'2026-10-31',dates:Object.freeze(EXPECTED_DATES.slice(0,4)),expectedPosts:28,perClient:4,label:'October-only programme'}),
  full:Object.freeze({from:'2026-10-22',to:'2026-11-30',dates:Object.freeze([...EXPECTED_DATES]),expectedPosts:119,perClient:17,label:'Archived October–November programme'})
});
const IMAGE=/\.(png|jpe?g|webp)$/i;
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const own=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>keys.includes(key));
const arr=value=>Array.isArray(value)?value:[];
const date=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&!Number.isNaN(Date.parse(`${value}T12:00:00Z`))&&new Date(`${value}T12:00:00Z`).toISOString().slice(0,10)===value;
const http=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}};
const videoURL=value=>{try{const u=new URL(value),host=u.hostname.toLowerCase();return http(value)&&(/\.(mp4|webm)$/i.test(u.pathname)||(/(^|\.)(instagram\.com|facebook\.com|tiktok\.com)$/.test(host)&&/\/(reels?|videos?|p)\//.test(u.pathname))||(/(^|\.)(youtube\.com)$/.test(host)&&((u.pathname==='/watch'&&u.searchParams.has('v'))||/^\/shorts\//.test(u.pathname)))||host==='youtu.be'||host==='fb.watch'||(/(^|\.)(x\.com|twitter\.com)$/.test(host)&&/\/status\/\d+/.test(u.pathname))||(/(^|\.)(vimeo\.com)$/.test(host)&&/\/\d+/.test(u.pathname)));}catch{return false;}};
export function safeProgrammeAsset(value,post,pattern=IMAGE){
  if(typeof value!=='string'||!/^[a-z0-9-]+$/.test(post?.clientId||'')||!/^[A-Za-z0-9_-]+$/.test(post?.id||''))return false;
  const prefix=`assets/programme/${post.clientId}/${post.id}/`;
  return value.startsWith(prefix)&&/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value.slice(prefix.length))&&pattern.test(value.slice(prefix.length));
}
function entries(buffer){
  let end=-1;
  for(let at=buffer.length-22;at>=Math.max(0,buffer.length-65557);at--)if(buffer.readUInt32LE(at)===0x06054b50){end=at;break;}
  if(end<0)throw new Error('ZIP end record missing.');
  const count=buffer.readUInt16LE(end+10);let at=buffer.readUInt32LE(end+16);const out=[];
  if(count>100)throw new Error('ZIP contains too many entries.');
  for(let i=0;i<count;i++){
    if(at+46>buffer.length||buffer.readUInt32LE(at)!==0x02014b50)throw new Error('ZIP directory malformed.');
    const n=buffer.readUInt16LE(at+28),e=buffer.readUInt16LE(at+30),c=buffer.readUInt16LE(at+32),next=at+46+n+e+c;
    if(next>buffer.length)throw new Error('ZIP directory truncated.');
    out.push({name:buffer.toString('utf8',at+46,at+46+n),method:buffer.readUInt16LE(at+10),compressed:buffer.readUInt32LE(at+20),size:buffer.readUInt32LE(at+24),offset:buffer.readUInt32LE(at+42)});at=next;
  }
  return out;
}
function decode(buffer,entry){
  const at=entry.offset;
  if(entry.size>30*1024*1024||at+30>buffer.length||buffer.readUInt32LE(at)!==0x04034b50)throw new Error('ZIP entry invalid or exceeds 30 MB.');
  const start=at+30+buffer.readUInt16LE(at+26)+buffer.readUInt16LE(at+28),end=start+entry.compressed;
  if(end>buffer.length)throw new Error('ZIP entry truncated.');
  const bytes=buffer.subarray(start,end),out=entry.method===0?bytes:entry.method===8?inflateRawSync(bytes,{maxOutputLength:30*1024*1024}):null;
  if(!out||out.length!==entry.size)throw new Error('ZIP method or decoded size invalid.');
  return out;
}
export function validatePhotoProgramme(root=ROOT,{partial=false,mode}={}){
  const errors=[],warnings=[],assets=new Map(),qualifiedFiles=new Map();
  const check=(ok,message)=>{if(!ok)errors.push(message);return !!ok;};
  const plan=Object.hasOwn(PROGRAMME_MODES,mode)?PROGRAMME_MODES[mode]:null;
  if(!plan)return {errors:['Explicit mode required: october or full. The validator never infers the programme scope from supplied counts.'],warnings,posts:0,clients:0,directions:0,assets:0};
  let d,base;
  try{d=JSON.parse(fs.readFileSync(path.join(root,'photo-programme.json'),'utf8'));base=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8'));}catch(e){return {errors:[e.message],warnings,posts:0,clients:0,directions:0,assets:0};}
  const identities=new Map(arr(base.clients).map(c=>[c.id,c.name]));
  check(identities.size===7,'Exactly seven existing client identities required.');
  check(own(d,['version','observed','window','cadence','expectedPosts','clients','posts','videoDirections','summary','status']),'Unknown/private collection field.');
  check(nonempty(d.version)&&date(d.observed),'Collection version and valid observation date required.');
  check(own(d.window,['from','to','timezone'])&&d.window.from===plan.from&&d.window.to===plan.to&&d.window.timezone==='Europe/London',`${mode} mode requires window ${plan.from}–${plan.to}, Europe/London.`);
  check(own(d.cadence,['label','status'])&&nonempty(d.cadence.label)&&nonempty(d.cadence.status),'Explicit cadence label/status required.');
  check(d.expectedPosts===plan.expectedPosts,`${mode} mode requires expectedPosts ${plan.expectedPosts}, labelled as proposed posts.`);
  const suppliedClients=arr(d.clients);check(suppliedClients.length===7&&new Set(suppliedClients.map(c=>c.id)).size===7,'Each existing client must have one programme expectation.');
  for(const c of suppliedClients){if(!check(own(c,['id','name','expectedPosts'])&&identities.has(c.id),'Unknown/private client expectation.'))continue;check(c.expectedPosts===plan.perClient,`${c.id}: ${mode} expected total must be ${plan.perClient}.`);if(c.name!=null)check(c.name===identities.get(c.id),`${c.id}: programme must preserve supplied client identity.`);}
  check(Array.isArray(d.posts),'posts must be an array.');check(d.videoDirections===undefined||Array.isArray(d.videoDirections),'Optional videoDirections must be an array when supplied.');
  const leak=/\/Users\/|\/private\/|file:\/\/|[A-Z]:\\|(?:^|\s)execution\/|sourceDrive|sourceHash|originalSource|imagePath|drive\.google\.com|docs\.google\.com|(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|session[_-]?cookie)\s*[:=]/i;
  const scan=(v,p='collection')=>{if(typeof v==='string')check(!leak.test(v),`${p}: private path/source ID or credential-like text.`);else if(Array.isArray(v))v.forEach((item,i)=>scan(item,`${p}[${i}]`));else if(v&&typeof v==='object')Object.entries(v).forEach(([k,value])=>{check(!/imagePath|originalSource|sourcehash|sourceDrive|buildcommand|localexport|private/i.test(k),`${p}: private field ${k}.`);scan(value,`${p}.${k}`);});};scan(d);
  const rootReal=fs.realpathSync(root)+path.sep;
  const file=(value,p,pattern,label)=>{
    if(!check(safeProgrammeAsset(value,p,pattern),`${p.id}: unsafe ${label} path.`))return null;
    try{const absolute=path.resolve(root,value),stat=fs.lstatSync(absolute);if(!check(stat.isFile()&&!stat.isSymbolicLink()&&stat.size>0,`${p.id}: ${label} must be a nonempty regular file.`))return null;if(!check(fs.realpathSync(absolute).startsWith(rootReal),`${p.id}: ${label} resolves outside dashboard.`))return null;assets.set(value,stat.size);qualifiedFiles.set(value,absolute);return absolute;}catch{check(false,`${p.id}: ${label} missing.`);return null;}
  };
  const image=(value,p,label,full=false)=>{const absolute=file(value,p,IMAGE,label);if(!absolute)return null;const dimensions=imageSize(fs.readFileSync(absolute));if(!check(dimensions&&dimensions[0]>0&&dimensions[1]>0,`${p.id}: ${label} has no PNG/JPEG/WebP dimensions.`))return null;if(full)check(dimensions[0]===1080&&[1350,1440].includes(dimensions[1]),`${p.id}: actual slides must be 1080×1350 or 1080×1440.`);return dimensions;};
  const refs=(rows,label,video=false)=>{check(Array.isArray(rows),`${label}: references must be an array.`);if(video)check(arr(rows).length>0,`${label}: at least one direct video reference required.`);for(const r of arr(rows)){if(!check(own(r,['title','url','why','inspected']),`${label}: unknown/private reference field.`))continue;check(nonempty(r.title)&&http(r.url)&&nonempty(r.why)&&nonempty(r.inspected),`${label}: reference title, HTTP URL, application reason and actual-inspection record required.`);if(video)check(videoURL(r.url),`${label}: reference must link directly to a video, Reel or status, not a search/profile page.`);}};
  const ids=new Set();const mediaHashes=new Map();
  for(const p of arr(d.posts)){
    if(!check(own(p,['id','clientId','date','type','status','title','caption','facebookCaption','alt','version','cover','slides','download','sourceSummary','references','notes','review']),'Unknown/private new post field.'))continue;
    check(nonempty(p.id)&&/^[A-Za-z0-9_-]+$/.test(p.id),'Unsafe post ID.');check(!ids.has(p.id),`${p.id}: duplicate post ID.`);ids.add(p.id);
    check(identities.has(p.clientId),`${p.id}: unknown client.`);check(date(p.date)&&p.date>=plan.from&&p.date<=plan.to,`${p.id}: valid proposed date inside ${mode} window required.`);
    check(plan.dates.includes(p.date),`${p.id}: date is not part of the ${mode} sequence.`);
    check(['image','carousel'].includes(p.type),`${p.id}: only photo/carousel exports count.`);check(p.status==='Finished draft',`${p.id}: status must be Finished draft.`);
    for(const key of ['title','caption','facebookCaption','alt','version','sourceSummary'])check(nonempty(p[key]),`${p.id}: ${key} required.`);
    check(own(p.review,['status','scope'])&&nonempty(p.review.status)&&nonempty(p.review.scope),`${p.id}: actual review status/scope required; no inferred human approval.`);
    check(Array.isArray(p.notes)&&p.notes.every(nonempty),`${p.id}: notes must be an array of nonempty strings (empty allowed).`);refs(p.references,`${p.id} still references`);
    image(p.cover,p,'cover');const slides=arr(p.slides);check(p.type==='image'?slides.length===1:slides.length>=2&&slides.length<=20,`${p.id}: invalid slide count.`);
    const slidePaths=new Set();const sizes=[];const expected=new Map();
    for(const [index,s] of slides.entries()){
      if(!check(own(s,['src','alt']),`${p.id}: invalid slide fields.`))continue;
      check(nonempty(s.alt),`${p.id}: slide ${index+1} alt required.`);check(!slidePaths.has(s.src),`${p.id}: duplicated slide path.`);slidePaths.add(s.src);
      const size=image(s.src,p,`slide ${index+1}`,true);if(size)sizes.push(size.join('x'));
      if(qualifiedFiles.has(s.src)){const hash=createHash('sha256').update(fs.readFileSync(qualifiedFiles.get(s.src))).digest('hex');expected.set(path.basename(s.src),hash);if(mediaHashes.has(hash))warnings.push(`${p.id}: exact slide bytes also used by ${mediaHashes.get(hash)}; actual creative-variety review required.`);else mediaHashes.set(hash,p.id);}
    }
    check(new Set(sizes).size<=1,`${p.id}: carousel slides must have consistent dimensions.`);
    const pack=file(p.download,p,/\.zip$/i,'post pack');
    if(pack)try{
      const stat=fs.statSync(pack);if(stat.size>100*1024*1024)throw new Error('Post pack exceeds 100 MB.');
      const bytes=fs.readFileSync(pack),items=entries(bytes),names=items.map(e=>e.name);
      check(names.length>0&&names.every(n=>/^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|jpe?g|webp|txt)$/i.test(n)),`${p.id}: pack may contain only flat final image/text files.`);
      check(new Set(names).size===names.length,`${p.id}: duplicate ZIP entry names.`);
      const allowed=new Set([...expected.keys(),path.basename(p.cover||'')]);
      check(names.filter(n=>!/\.txt$/i.test(n)).every(n=>allowed.has(n)),`${p.id}: pack contains unreferenced media.`);
      check([...expected.keys()].every(n=>names.includes(n)),`${p.id}: pack missing actual slide.`);
      check(names.some(n=>/caption.*\.txt$/i.test(n))&&names.some(n=>/alt.*\.txt$/i.test(n)),`${p.id}: exact caption and alt-text files required.`);
      let captions='',alts='';
      for(const e of items){
        if(!/\.(png|jpe?g|webp|txt)$/i.test(e.name))continue;
        const decoded=decode(bytes,e);
        if(/\.txt$/i.test(e.name)){const value=decoded.toString('utf8');check(!leak.test(value),`${p.id}: private material in ZIP text.`);if(/caption/i.test(e.name))captions+=value+'\n';if(/alt/i.test(e.name))alts+=value+'\n';}
        else if(expected.has(e.name))check(createHash('sha256').update(decoded).digest('hex')===expected.get(e.name),`${p.id}: packed ${e.name} differs from actual public slide.`);
      }
      check(nonempty(p.caption)&&nonempty(p.facebookCaption)&&captions.includes(p.caption)&&captions.includes(p.facebookCaption),`${p.id}: exact Instagram/Facebook captions must match pack.`);
      check(slides.every(s=>nonempty(s.alt)&&alts.includes(s.alt)),`${p.id}: exact slide alt text must match pack.`);
    }catch(e){check(false,`${p.id}: ${e.message}`);}
  }
  const directionIds=new Set();
  for(const direction of arr(d.videoDirections)){
    if(!check(own(direction,['id','clientId','status','title','viewerDecision','hook','beats','payoff','cta','footageNeeded','references','notes']),'Unknown/private video-direction field.'))continue;
    check(nonempty(direction.id)&&/^[A-Za-z0-9_-]+$/.test(direction.id)&&!directionIds.has(direction.id),'Direction ID must be unique and safe.');directionIds.add(direction.id);
    check(identities.has(direction.clientId),`${direction.id}: unknown direction client.`);check(direction.status==='Direction only',`${direction.id}: direction status must remain Direction only.`);
    for(const key of ['title','viewerDecision','hook','payoff','cta'])check(nonempty(direction[key]),`${direction.id}: ${key} required.`);
    check(Array.isArray(direction.beats)&&direction.beats.length>=2&&direction.beats.every(nonempty),`${direction.id}: at least two actual shot beats required.`);
    check(Array.isArray(direction.footageNeeded)&&direction.footageNeeded.every(nonempty),`${direction.id}: footageNeeded must be a string array.`);if(direction.notes!=null)check(typeof direction.notes==='string',`${direction.id}: notes must be a public-safe string.`);
    refs(direction.references,`${direction.id} video references`,true);
  }
  for(const id of identities.keys()){
    const selected=arr(d.posts).filter(p=>p.clientId===id),dates=selected.map(p=>p.date);
    check(new Set(dates).size===dates.length,`${id}: one new post per proposed date; duplicate date found.`);
    check(selected.length<=plan.perClient,`${id}: ${mode} scope permits at most ${plan.perClient} actual posts.`);
    if(!partial){check(selected.length===plan.perClient,`${id}: complete ${mode} programme requires ${plan.perClient} actual posts.`);check(plan.dates.every(day=>dates.includes(day)),`${id}: complete ${mode} programme must cover every expected date.`);if(mode==='full')check(arr(d.videoDirections).some(d=>d.clientId===id),`${id}: archived full handoff requires a separate video direction.`);}
    if(mode==='october')check(arr(d.videoDirections).filter(d=>d.clientId===id).length<=2,`${id}: optional October directions permit at most two briefs per client.`);
  }
  check(arr(d.posts).length<=plan.expectedPosts,`${mode} scope permits at most ${plan.expectedPosts} actual photo/carousel posts.`);
  if(!partial)check(arr(d.posts).length===plan.expectedPosts,`Complete ${mode} programme requires ${plan.expectedPosts} actual photo/carousel posts.`);
  if(mode==='october'&&!partial&&arr(d.videoDirections).length){check(arr(d.videoDirections).length===14,'Optional complete October direction collection requires 14 briefs, separate from the 28 photo/carousel posts.');for(const id of identities.keys())check(arr(d.videoDirections).filter(d=>d.clientId===id).length===2,`${id}: optional complete October directions require two briefs.`);}
  return {errors,warnings,mode,expectedPosts:plan.expectedPosts,posts:arr(d.posts).length,clients:new Set(arr(d.posts).map(p=>p.clientId)).size,directions:arr(d.videoDirections).length,assets:assets.size,scope:`${plan.label}: ${partial?'partial integration; no completion claim':'complete proposed photo/carousel programme'}`};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const rootIndex=process.argv.indexOf('--root'),root=rootIndex>=0?path.resolve(process.argv[rootIndex+1]):ROOT;
  const modeIndex=process.argv.indexOf('--mode'),mode=modeIndex>=0?process.argv[modeIndex+1]:undefined;
  const result=validatePhotoProgramme(root,{partial:process.argv.includes('--partial'),mode});
  for(const warning of result.warnings)console.warn(`WARN ${warning}`);
  for(const error of result.errors)console.error(`FAIL ${error}`);
  if(result.errors.length)process.exitCode=1;
  else console.log(`PASS ${result.posts} actual posts / ${result.clients} clients / ${result.directions} direction-only briefs / ${result.assets} local assets. ${result.scope}. Creative quality, source fidelity, current facts, rights and human approval require actual review.`);
}
