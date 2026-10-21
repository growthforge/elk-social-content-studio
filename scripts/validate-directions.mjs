import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.dirname(fileURLToPath(new URL('../index.html',import.meta.url)));
const d=JSON.parse(fs.readFileSync(path.join(root,'direction-reset.json'),'utf8'));
const old=JSON.parse(fs.readFileSync(path.join(root,'data.json'),'utf8'));
const ids=new Set(old.clients.map(c=>c.id));
const errors=[];
const check=(yes,msg)=>{if(!yes)errors.push(msg);};
const string=s=>typeof s==='string'&&s.trim().length>0;
const publicURL=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!['drive.google.com','docs.google.com','claude.ai'].includes(u.hostname);}catch{return false;}};
check(d.clients.length===7,'Seven proposed client directions required.');
check(new Set(d.clients.map(c=>c.id)).size===7,'Duplicate direction client.');
for(const c of d.clients){
 check(ids.has(c.id),'Direction has no matching client.');
 for(const k of ['title','audience','decision','purpose','proof','selected','readiness','caption','copyStatus','status'])check(string(c[k]),`${c.id}: ${k} missing.`);
 check(c.stories.length===3&&new Set(c.stories.map(s=>s.device)).size===3,`${c.id}: three distinct narrative devices required.`);
 for(const s of c.stories){for(const k of ['title','device','firstLine','firstShot','payoff','cta','needs'])check(string(s[k]),`${c.id}: story ${k} missing.`);check(s.beats.length>=3&&s.beats.every(string),`${c.id}: insufficient meaningful beats.`);}
 check(c.calendar.length===8&&c.calendar.every(w=>string(w.period)&&string(w.episode)),`${c.id}: conditional period sequence incomplete.`);
 check(c.brand.palette.length>=4&&c.brand.palette.length<=6&&c.brand.palette.every(p=>/^#[a-f0-9]{6}$/i.test(p.hex)),`${c.id}: palette malformed.`);
 check(c.brand.fonts.length===2,`${c.id}: two type roles required.`);
 check(c.sources.every(publicURL),`${c.id}: unsafe source URL.`);
 check(/conditional/i.test(c.copyStatus)&&/pending/i.test(c.status),`${c.id}: copy/direction acceptance must remain explicit.`);
}
check(old.clients.flatMap(c=>c.posts).every(p=>p.status==='Held for rebriefing'),'Prior calendar must remain held.');
for(const id of ['pera-01','pera-26']){const p=old.clients.find(c=>c.id==='pera-patisserie').posts.find(p=>p.id===id);check(p.title.startsWith('Withdrawn source premise')&&!/baklava/i.test(p.caption),`${id}: old misidentification still current.`);}
check(d.research.every(r=>publicURL(r.url)&&string(r.detail)),'Research link or access limit missing.');
const values=o=>typeof o==='string'?[o]:Array.isArray(o)?o.flatMap(values):o&&typeof o==='object'?Object.values(o).flatMap(values):[];
const strings=values(d);
check(!strings.some(s=>/\/Users\/|\/private\/|(?:01-clients|08-independent|00-operations|99-archive|03-deliverables|codex)\//i.test(s)),'Private/internal path in public directions.');
check(!strings.some(s=>/(?:password|api[_-]?key|session[_-]?cookie|bearer|secret)\s*[=:]\s*\S+|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}/i.test(s)),'Possible credential in direction data.');
if(d.pilot){
 check(d.pilot.clientId==='pera-patisserie'&&/silent/i.test(d.pilot.description),'Pilot scope/sound distinction missing.');
 for(const [key,ext] of [['file','mp4'],['poster','jpg']]){const p=d.pilot[key];check(new RegExp(`^assets/pilots/[a-z0-9./-]+\\.${ext}$`).test(p)&&!p.includes('..'),`Unsafe pilot ${key}.`);check(fs.existsSync(path.join(root,p)),`Missing pilot ${key}.`);}
 check(/not.*final|not.*upload|not.*release/i.test(d.pilot.limits),'Pilot release/export limitation missing.');
}
if(errors.length){process.stderr.write(errors.map(e=>'FAIL: '+e).join('\n')+'\n');process.exit(1);}
process.stdout.write(`PASS:7source-limited directions,21story alternatives,56conditional period opportunities;182prior drafts held,2Pera premises withdrawn; safe public links/paths;${d.pilot?'1silent visual pilot':'no finished pilot yet'}. Creative acceptance and release are separate.\n`);
