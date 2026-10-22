import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {inflateRawSync} from 'node:zlib';

const DEFAULT_ROOT = path.dirname(fileURLToPath(new URL('../index.html',import.meta.url)));
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const IMAGE = /\.(png|jpe?g|webp)$/i;
const ownKeys = (value, allowed) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => allowed.includes(key));

export function safeAssetPath(value, post, pattern) {
  if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(post.clientId || '') || !/^[a-zA-Z0-9_-]+$/.test(post.id || '')) return false;
  const prefix = `assets/finished/${post.clientId}/${post.id}/`;
  if (!value.startsWith(prefix)) return false;
  const name = value.slice(prefix.length);
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) && pattern.test(name);
}

export function imageSize(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && buffer.toString('ascii',12,16) === 'IHDR') return [buffer.readUInt32BE(16),buffer.readUInt32BE(20)];
  if (buffer.length >= 30 && buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP') {
    const kind=buffer.toString('ascii',12,16);
    if (kind==='VP8X') return [1+buffer.readUIntLE(24,3),1+buffer.readUIntLE(27,3)];
    if (kind==='VP8L' && buffer[20]===0x2f) return [1+((buffer[21]|buffer[22]<<8)&0x3fff),1+((buffer[22]>>6|buffer[23]<<2|buffer[24]<<10)&0x3fff)];
    if (kind==='VP8 ' && buffer[23]===0x9d && buffer[24]===0x01 && buffer[25]===0x2a) return [buffer.readUInt16LE(26)&0x3fff,buffer.readUInt16LE(28)&0x3fff];
  }
  if (buffer.length > 4 && buffer[0]===0xff && buffer[1]===0xd8) {
    let at=2;
    while (at+4 <= buffer.length) {
      if (buffer[at]!==0xff) break;
      const marker=buffer[at+1]; at+=2;
      if (marker===0xd8 || marker===0x01 || marker>=0xd0&&marker<=0xd7) continue;
      if (marker===0xd9 || marker===0xda) break;
      const length=buffer.readUInt16BE(at);
      if (length<2 || at+length>buffer.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length>=7) return [buffer.readUInt16BE(at+5),buffer.readUInt16BE(at+3)];
      at+=length;
    }
  }
  return null;
}

function zipEntries(buffer) {
  let end=-1;
  for (let at=buffer.length-22;at>=Math.max(0,buffer.length-65557);at--) if (buffer.readUInt32LE(at)===0x06054b50) { end=at; break; }
  if (end<0) throw new Error('ZIP end record missing');
  const count=buffer.readUInt16LE(end+10);
  let offset=buffer.readUInt32LE(end+16);
  const entries=[];
  for (let index=0;index<count;index++) {
    if (offset+46>buffer.length || buffer.readUInt32LE(offset)!==0x02014b50) throw new Error('Invalid ZIP directory');
    const nameLength=buffer.readUInt16LE(offset+28),extraLength=buffer.readUInt16LE(offset+30),commentLength=buffer.readUInt16LE(offset+32);
    const next=offset+46+nameLength+extraLength+commentLength;
    if (next>buffer.length) throw new Error('Truncated ZIP directory');
    entries.push({name:buffer.toString('utf8',offset+46,offset+46+nameLength),bytes:buffer.readUInt32LE(offset+24),method:buffer.readUInt16LE(offset+10),compressed:buffer.readUInt32LE(offset+20),local:buffer.readUInt32LE(offset+42)});
    offset=next;
  }
  return entries;
}
function zipText(buffer,entry){
  if(entry.bytes>1024*1024||entry.local+30>buffer.length||buffer.readUInt32LE(entry.local)!==0x04034b50)throw new Error('Invalid pack text entry');
  const start=entry.local+30+buffer.readUInt16LE(entry.local+26)+buffer.readUInt16LE(entry.local+28);
  const end=start+entry.compressed;
  if(end>buffer.length)throw new Error('Truncated pack text');
  const compressed=buffer.subarray(start,end),decoded=entry.method===0?compressed:entry.method===8?inflateRawSync(compressed,{maxOutputLength:1024*1024}):null;
  if(!decoded||decoded.length!==entry.bytes)throw new Error('Unsupported pack text');
  return decoded.toString('utf8');
}
function fastStart(file){
  const fd=fs.openSync(file,'r'),size=fs.fstatSync(fd).size,header=Buffer.alloc(16);
  let at=0,moov=-1,mdat=-1,count=0;
  try{
    while(at+8<=size&&count++<10000){
      fs.readSync(fd,header,0,Math.min(16,size-at),at);
      let length=header.readUInt32BE(0);
      const type=header.toString('ascii',4,8);
      if(length===1){if(at+16>size)return false;length=Number(header.readBigUInt64BE(8));}
      if(length===0)length=size-at;
      if(!Number.isSafeInteger(length)||length<8||at+length>size)return false;
      if(type==='moov')moov=at;
      if(type==='mdat')mdat=at;
      if(moov>=0&&mdat>=0)return moov<mdat;
      at+=length;
    }
    return false;
  }finally{fs.closeSync(fd);}
}

export function validateFinished(root=DEFAULT_ROOT,{partial=false,probe=true}={}) {
  const errors=[],warnings=[],assets=new Map();
  const check=(condition,message)=>{if(!condition)errors.push(message);return Boolean(condition);};
  let collection,base;
  try { collection=JSON.parse(fs.readFileSync(path.join(root,'finished-posts.json'),'utf8')); } catch(error) { return {errors:[`finished-posts.json: ${error.message}`],warnings,posts:0,clients:0,assets:0}; }
  try { base=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8')); } catch(error) { return {errors:[`data.json: ${error.message}`],warnings,posts:0,clients:0,assets:0}; }
  const clients=new Set((Array.isArray(base.clients)?base.clients:[]).map(c=>c.id));
  check(clients.size===7,'Exactly seven existing client identities are required.');
  check(ownKeys(collection,['version','observed','status','summary','posts']),'Unknown or private top-level field.');
  for(const field of ['version','observed','status','summary'])check(nonempty(collection[field]),`Collection ${field} is missing.`);
  const posts=Array.isArray(collection.posts)?collection.posts:[];
  check(Array.isArray(collection.posts),'posts must be an array.');
  check(partial ? posts.length>0 : posts.length===14,partial ? 'Partial collection must still contain an actual post.' : 'The first wave requires exactly 14 actual posts.');
  const ids=new Set();
  const file=(value,post,pattern,label)=>{
    if(!check(safeAssetPath(value,post,pattern),`${post.id}: unsafe ${label} path.`))return null;
    const absolute=path.resolve(root,value);
    try {
      const stat=fs.lstatSync(absolute);
      if(!check(stat.isFile()&&!stat.isSymbolicLink()&&stat.size>0,`${post.id}: ${label} must be a nonempty regular local file.`))return null;
      const real=fs.realpathSync(absolute),prefix=fs.realpathSync(root)+path.sep;
      if(!check(real.startsWith(prefix),`${post.id}: ${label} resolves outside dashboard.`))return null;
      assets.set(value,stat.size);return absolute;
    }catch {check(false,`${post.id}: ${label} file is missing.`);return null;}
  };
  const image=(value,post,label,full=false)=>{
    const absolute=file(value,post,IMAGE,label);if(!absolute)return null;
    const size=imageSize(fs.readFileSync(absolute));
    if(!check(size&&size[0]>0&&size[1]>0,`${post.id}: ${label} has no recognised PNG/JPEG/WebP dimensions.`))return null;
    if(full)check(size[0]===1080&&[1350,1440].includes(size[1]),`${post.id}: slide must be 1080×1350 or 1080×1440.`);
    return size;
  };
  const leak=/\/Users\/|\/private\/|file:\/\/|[A-Z]:\\|(?:^|\s)execution\/|sourceDrive|sourceHash|originalSource|imagePath|drive\.google\.com|docs\.google\.com|(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|session[_-]?cookie)\s*[:=]/i;
  const scan=(value,trail='collection')=>{
    if(typeof value==='string')check(!leak.test(value),`${trail}: private path, source identifier or credential-like text.`);
    else if(Array.isArray(value))value.forEach((v,i)=>scan(v,`${trail}[${i}]`));
    else if(value&&typeof value==='object')Object.entries(value).forEach(([key,v])=>{check(!/imagePath|originalSource|sourcehash|sourceDrive|crop|buildcommand|localexport|private/i.test(key),`${trail}: private field ${key}.`);scan(v,`${trail}.${key}`);});
  };
  scan(collection);
  for(const post of posts){
    if(!check(ownKeys(post,['id','clientId','type','title','caption','facebookCaption','alt','status','version','cover','slides','video','download','notes','sourceSummary','review']),'Unknown or private post field.'))continue;
    check(typeof post.id==='string'&&/^[a-zA-Z0-9_-]+$/.test(post.id),'Post ID is missing or unsafe.');
    check(!ids.has(post.id),`${post.id}: duplicate post ID.`);ids.add(post.id);
    check(clients.has(post.clientId),`${post.id}: unknown client.`);
    check(['image','carousel','reel'].includes(post.type),`${post.id}: unsupported media type.`);
    for(const field of ['title','caption','facebookCaption','alt','version','sourceSummary'])check(nonempty(post[field]),`${post.id}: ${field} missing.`);
    check(post.status==='Finished draft',`${post.id}: status must be Finished draft; never inferred approval.`);
    check(Array.isArray(post.notes)&&post.notes.every(nonempty),`${post.id}: notes must be an array of nonempty strings (may be empty).`);
    check(ownKeys(post.review,['status','scope'])&&nonempty(post.review.status)&&nonempty(post.review.scope),`${post.id}: review status and scope required.`);
    image(post.cover,post,'cover');
    const slides=Array.isArray(post.slides)?post.slides:[];
    const expected=[];
    if(post.type==='image'||post.type==='carousel'){
      check(post.type==='image'?slides.length===1:slides.length>=2&&slides.length<=20,`${post.id}: invalid actual slide count.`);
      check(post.video==null,`${post.id}: still post must not supply video metadata.`);
      const seenSlides=new Set();
      for(const [index,slide]of slides.entries()){
        if(!check(ownKeys(slide,['src','alt']),`${post.id}: slide ${index+1} fields invalid.`))continue;
        check(nonempty(slide.alt),`${post.id}: slide ${index+1} alt is missing.`);
        check(!seenSlides.has(slide.src),`${post.id}: duplicate slide reference.`);seenSlides.add(slide.src);
        image(slide.src,post,`slide ${index+1}`,true);if(typeof slide.src==='string')expected.push(path.basename(slide.src));
      }
    }else if(post.type==='reel'){
      check(slides.length===0,`${post.id}: Reel slides must be empty or omitted.`);
      const video=post.video;
      if(check(ownKeys(video,['src','poster','width','height','duration','fps','audioStatus']),`${post.id}: video metadata invalid.`)){
        const absolute=file(video.src,post,/\.mp4$/i,'video');
        image(video.poster,post,'video poster');
        check(video.width===1080&&video.height===1920,`${post.id}: Reel must be 1080×1920.`);
        check(Number.isFinite(video.duration)&&video.duration>0,`${post.id}: positive actual duration required.`);
        check(video.fps===30,`${post.id}: first wave target is 30fps; exceptions need root/reviewer reconciliation.`);
        check(nonempty(video.audioStatus),`${post.id}: explicit audio status required.`);
        if(absolute){
          expected.push(path.basename(video.src));
          const header=Buffer.alloc(12),fd=fs.openSync(absolute,'r');try{fs.readSync(fd,header,0,12,0);}finally{fs.closeSync(fd);}
          check(header.toString('ascii',4,8)==='ftyp',`${post.id}: file does not have an MP4 ftyp header.`);
          check(fastStart(absolute),`${post.id}: MP4 moov must precede mdat for fast start.`);
          if(assets.get(video.src)>25*1024*1024)warnings.push(`${post.id}: Reel exceeds 25MB; review download performance.`);
          if(probe){
            const result=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,width,height,pix_fmt,avg_frame_rate:format=duration','-of','json',absolute],{encoding:'utf8',maxBuffer:1024*1024,timeout:15000});
            if(check(!result.error&&result.status===0,`${post.id}: ffprobe failed or is unavailable.`)){
              try{const info=JSON.parse(result.stdout),stream=info.streams.find(s=>s.codec_type==='video');
                check(stream?.codec_name==='h264'&&stream?.pix_fmt==='yuv420p',`${post.id}: export must be H264/yuv420p.`);
                check(stream?.width===video.width&&stream?.height===video.height,`${post.id}: dimensions disagree with actual MP4.`);
                const [n,d]=String(stream?.avg_frame_rate).split('/').map(Number),fps=n/d;
                check(Number.isFinite(fps)&&Math.abs(fps-video.fps)<.01,`${post.id}: fps disagrees with actual MP4.`);
                check(Math.abs(Number(info.format.duration)-video.duration)<.15,`${post.id}: duration disagrees with actual MP4.`);
                if(/no audio|silent|no soundtrack/i.test(video.audioStatus))check(!info.streams.some(s=>s.codec_type==='audio'),`${post.id}: silent/no-audio label conflicts with an audio stream.`);
              }catch{check(false,`${post.id}: unreadable ffprobe result.`);}
            }
          }
        }
      }
    }
    const pack=file(post.download,post,/\.zip$/i,'post pack');
    if(pack)try{
      const packBytes=fs.readFileSync(pack),entries=zipEntries(packBytes);
      const names=entries.filter(e=>!e.name.endsWith('/')).map(e=>e.name);
      check(names.length>0&&names.every(n=>/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpe?g|webp|mp4|txt)$/i.test(n)),`${post.id}: pack must contain only flat final media/text files; no raw sources or paths.`);
      check(new Set(names).size===names.length,`${post.id}: duplicate filenames in post pack.`);
      const allowedMedia=new Set([...expected,path.basename(post.cover),...(post.video?.poster?[path.basename(post.video.poster)]:[])]);
      check(names.filter(n=>!/\.txt$/i.test(n)).every(n=>allowedMedia.has(n)),`${post.id}: post pack contains an unreferenced media file.`);
      check(expected.every(name=>names.includes(name)),`${post.id}: post pack is missing an actual slide/video.`);
      check(names.some(n=>/caption/i.test(n))&&names.some(n=>/alt/i.test(n)),`${post.id}: pack needs captions and alt-text files.`);
      const texts=entries.filter(e=>/\.txt$/i.test(e.name)).map(e=>({name:e.name,text:zipText(packBytes,e)}));
      texts.forEach(entry=>check(!leak.test(entry.text),`${post.id}: private material in pack ${entry.name}.`));
      const captions=texts.filter(e=>/caption/i.test(e.name)).map(e=>e.text).join('\n');
      const alts=texts.filter(e=>/alt/i.test(e.name)).map(e=>e.text).join('\n');
      check(captions.includes(post.caption)&&captions.includes(post.facebookCaption),`${post.id}: pack captions disagree with public captions.`);
      const descriptions=post.type==='reel'?[post.alt]:slides.map(s=>s.alt);
      check(descriptions.every(alt=>alts.includes(alt)),`${post.id}: pack alt text disagrees with public descriptions.`);
    }catch(error){check(false,`${post.id}: ${error.message}`);}
  }
  if(!partial)for(const clientId of clients){const selected=posts.filter(p=>p.clientId===clientId);check(selected.length===2&&selected.filter(p=>p.type==='reel').length===1&&selected.filter(p=>['image','carousel'].includes(p.type)).length===1,`${clientId}: exactly one still post and one real-footage Reel required.`);}
  return {errors,warnings,posts:posts.length,clients:new Set(posts.map(p=>p.clientId)).size,assets:assets.size,scope:partial?'Partial integration check; not first-wave completion':'Complete first-wave check'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=validateFinished(DEFAULT_ROOT,{partial:process.argv.includes('--partial')});
  for(const warning of result.warnings)console.warn(`WARN ${warning}`);
  if(result.errors.length){result.errors.forEach(message=>console.error(`FAIL ${message}`));process.exitCode=1;}
  else console.log(`PASS ${result.posts} finished drafts / ${result.clients} clients / ${result.assets} local assets. ${result.scope}. This does not verify source fidelity, story quality, rights or human approval.`);
}
