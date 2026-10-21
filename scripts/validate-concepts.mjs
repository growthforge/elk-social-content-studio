import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(new URL('../index.html',import.meta.url)));
const input=path.join(root,'art-direction.json');
if(!fs.existsSync(input)){
  if(process.argv.includes('--required')){process.stderr.write('FAIL: required art-direction.json is absent.\n');process.exit(1);}
  process.stdout.write('SKIP: optional art-direction.json is absent; no direction collection validated.\n');process.exit(0);
}
const errors=[];
const check=(condition,message)=>{if(!condition)errors.push(message);};
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const keys=(value,allowed,label)=>check(Object.keys(value).every(key=>allowed.includes(key)),`${label}: unexpected/private field.`);
const relative=value=>typeof value==='string'?value.replace(/^\.\//,''):'';
const publicURL=value=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&!['localhost','127.0.0.1','::1'].includes(u.hostname);}catch{return false;}};
let data,programme;
try{data=JSON.parse(fs.readFileSync(input,'utf8'));programme=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8'));}catch{process.stderr.write('FAIL: direction/programme JSON could not be read.\n');process.exit(1);}
check(object(data),'Collection must be an object.');
if(!object(data)){process.stderr.write(errors.join('\n')+'\n');process.exit(1);}
keys(data,['version','status','method','concepts'],'Collection');
check(nonempty(data.version)&&nonempty(data.status),'Collection version/status required.');
check(Array.isArray(data.method),'Method must be an array.');
check(Array.isArray(data.concepts),'Concepts must be an array.');
for(const item of Array.isArray(data.method)?data.method:[]){
  check(object(item),'Method item must be an object.');if(!object(item))continue;
  keys(item,['title','detail','url'],'Method');
  check(nonempty(item.title)&&nonempty(item.detail),'Method title/detail required.');
  if(item.url!==undefined)check(publicURL(item.url),'Method URL must be public HTTP(S) without credentials.');
}
const ids=new Set(),aiFiles=new Set(),photoFiles=new Set();
const clients=new Map((programme.clients||[]).map(client=>[client.id,client]));
function inspectFile(value,extension,label){
  const absolute=path.join(root,value);
  if(!fs.existsSync(absolute)){check(false,`${label}: file missing.`);return;}
  const stat=fs.lstatSync(absolute);
  check(stat.isFile()&&!stat.isSymbolicLink(),`${label}: expected regular file, no symlinks.`);
  check(fs.realpathSync(absolute).startsWith(fs.realpathSync(root)+path.sep),`${label}: resolves outside publication root.`);
  if(!stat.isFile()||stat.isSymbolicLink())return;
  const bytes=fs.readFileSync(absolute);
  if(extension==='png'){
    const signature=Buffer.from([137,80,78,71,13,10,26,10]);
    const valid=bytes.length>=24&&bytes.subarray(0,8).equals(signature)&&bytes.toString('ascii',12,16)==='IHDR';
    check(valid,`${label}: invalid PNG signature.`);
    if(valid)check(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(20)>0,`${label}: invalid PNG dimensions.`);
  }else check(bytes.length>=12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP',`${label}: invalid WebP signature.`);
}
function aiAsset(value,clientId,extension,label){
  if(typeof value!=='string'||!/^[a-z0-9-]+$/.test(clientId||'')){check(false,`${label}: unsafe path/client.`);return '';}
  const file=relative(value),prefix=`assets/concepts/${clientId}`;
  const suffix=file.startsWith(prefix)?file.slice(prefix.length):'';
  if(!new RegExp(`^(?:-[a-z0-9]+)*-concept\\.${extension}$`).test(suffix)){check(false,`${label}: expected safe same-client ${extension} concept path.`);return '';}
  check(!aiFiles.has(file),`${label}: AI file referenced more than once.`);aiFiles.add(file);inspectFile(file,extension,label);return file;
}
function photoAsset(value,expected,postId,filename,extension,label){
  const file=relative(value),canonical=relative(expected);
  if(!/^[a-zA-Z0-9_-]+$/.test(postId||'')||!file||file!==canonical||file!==`assets/posts/${postId}/${filename}`){
    check(false,`${label}: must reference the exact matching post.preview ${filename} file.`);return '';
  }
  photoFiles.add(file);inspectFile(file,extension,label);return file;
}
const concepts=Array.isArray(data.concepts)?data.concepts:[];
for(const concept of concepts){
  check(object(concept),'Direction item must be an object.');if(!object(concept))continue;
  keys(concept,['id','kind','clientId','postId','title','image','thumbnail','alt','headline','caption','facebookCaption','notes','sources','status'],'Direction item');
  check(/^[a-zA-Z0-9_-]+$/.test(concept.id||''),'Direction ID must be a safe nonempty identifier.');
  check(!ids.has(concept.id),'Direction IDs must be unique.');ids.add(concept.id);
  const client=clients.get(concept.clientId),post=client?.posts?.find(post=>post.id===concept.postId);
  check(Boolean(client),'Direction client must exist in programme.');
  check(Boolean(post),`${concept.id}: matching post must belong to direction client.`);
  for(const field of ['title','alt','headline','caption','facebookCaption'])check(nonempty(concept[field]),`${concept.id}: ${field} required.`);
  check(['photo','ai'].includes(concept.kind),`${concept.id}: kind must be photo or ai.`);
  check(concept.status===(concept.kind==='photo'?'Real-photo draft':'AI concept — internal review'),`${concept.id}: explicit kind-matched status required.`);
  check(Array.isArray(concept.notes)&&concept.notes.every(nonempty),`${concept.id}: notes must be nonempty strings.`);
  check(Array.isArray(concept.sources)&&concept.sources.length>0,`${concept.id}: source references required.`);
  for(const source of Array.isArray(concept.sources)?concept.sources:[]){
    check(object(source),`${concept.id}: source must be an object.`);if(!object(source))continue;
    keys(source,['title','url'],`${concept.id} source`);
    check(nonempty(source.title)&&publicURL(source.url),`${concept.id}: source title/public URL required.`);
  }
  if(concept.kind==='photo'){
    check(post?.preview?.status==='Visual draft',`${concept.id}: photo post must have an existing Visual draft preview.`);
    photoAsset(concept.image,post?.preview?.slides?.[0]?.src,post?.id,'01.png','png',`${concept.id} image`);
    photoAsset(concept.thumbnail,post?.preview?.cover,post?.id,'cover.webp','webp',`${concept.id} thumbnail`);
  }else if(concept.kind==='ai'){
    const image=aiAsset(concept.image,concept.clientId,'png',`${concept.id} image`);
    const thumb=aiAsset(concept.thumbnail,concept.clientId,'webp',`${concept.id} thumbnail`);
    if(image&&thumb)check(image.slice(0,-4)===thumb.slice(0,-5),`${concept.id}: PNG/WebP stems must match.`);
  }
}
function files(folder){
  if(!fs.existsSync(folder))return [];
  if(fs.lstatSync(folder).isSymbolicLink()){check(false,'AI concept folder must not be a symlink.');return [];}
  const out=[];
  for(const item of fs.readdirSync(folder,{withFileTypes:true})){
    const absolute=path.join(folder,item.name);
    if(item.isSymbolicLink()){check(false,'AI concept tree must contain no symlinks.');continue;}
    if(item.isDirectory())out.push(...files(absolute));
    else if(item.isFile())out.push(path.relative(root,absolute).split(path.sep).join('/'));
  }
  return out;
}
const aiCount=concepts.filter(concept=>concept?.kind==='ai').length;
const actual=files(path.join(root,'assets/concepts'));
check(actual.length===aiCount*2,'AI asset count must equal two files per listed AI item; photo items reuse existing post assets.');
check(actual.every(file=>aiFiles.has(file)),'AI directory contains unreferenced/private/non-PNG-WebP files.');
check(aiFiles.size===aiCount*2,'Each AI item needs two distinct image references.');
// Inspect actual string values, not JSON-escaped newlines that resemble drive paths.
function stringValues(value){
  if(typeof value==='string')return [value];
  if(Array.isArray(value))return value.flatMap(stringValues);
  return object(value)?Object.values(value).flatMap(stringValues):[];
}
const values=stringValues(data);
check(!values.some(value=>/\/Users\/|\/private\/|(?:^|[^A-Za-z0-9])[A-Za-z]:[\\/]|(?:01-clients|00-operations|08-independent|99-archive|03-deliverables|codex)\//i.test(value)),'Collection contains private/internal paths.');
check(!values.some(value=>/https?:\/\/(?:drive\.google\.com|docs\.google\.com|claude\.ai)\//i.test(value)),'Collection contains private source/service links.');
check(!values.some(value=>/(?:api[_-]?key|authorization|bearer|password|session[_-]?cookie|secret)\s*[=:]\s*\S+|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}/i.test(value)),'Collection may contain a credential/token; do not publish.');
if(errors.length){process.stderr.write(errors.map(error=>`FAIL: ${error}`).join('\n')+'\n');process.exit(1);}
process.stdout.write(`PASS: ${concepts.length-aiCount} Real-photo drafts reuse ${photoFiles.size} exact existing preview files; ${aiCount} AI/internal-review items reference ${aiFiles.size} safe separate PNG/WebP files. Client/post joins, metadata and AI-only asset counts checked. Rights/fidelity/approval remain separate.\n`);
