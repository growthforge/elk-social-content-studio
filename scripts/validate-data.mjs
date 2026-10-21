import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inflateRawSync} from 'node:zlib';

const root = path.dirname(fileURLToPath(new URL('../index.html', import.meta.url)));
const input = path.join(root, 'data.json');
if (!fs.existsSync(input)) {
  process.stderr.write('Final data.json is not present. Supply the sanitised programme before validation.\n');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(input, 'utf8'));
const errors = [];
const check = (condition, description) => { if (!condition) errors.push(description); };
const fields = ['id','date','time','format','pillar','title','hook','caption','facebookCaption','cta','onScreen','production','motion','story','altText','asset','sourceIds','hypothesis','metric','approvalNeeds','status'];
const clients = data.clients || [];
const allPosts = clients.flatMap(client => client.posts || []);
const previewPosts = allPosts.filter(post => post.preview !== undefined && post.preview !== null);
const previewPNGs = new Set();
const previewCovers = new Set();
const previewZIPs = new Set();

function postAsset(value, postId, extension, label) {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(String(postId))) {
    check(false, `${postId}: ${label} must be a relative post asset path.`);
    return null;
  }
  const relative = value.replace(/^\.\//, '');
  const prefix = `assets/posts/${postId}/`;
  const filename = relative.startsWith(prefix) ? relative.slice(prefix.length) : '';
  const valid = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename) && extension.test(filename);
  check(valid, `${postId}: unsafe or unexpected ${label} path.`);
  if (!valid) return null;
  const absolute = path.join(root, relative);
  const exists = fs.existsSync(absolute);
  check(exists, `${postId}: ${label} file is missing (${relative}).`);
  if (!exists) return null;
  const stat = fs.lstatSync(absolute);
  check(stat.isFile() && !stat.isSymbolicLink(), `${postId}: ${label} must be a regular local file.`);
  if (!stat.isFile() || stat.isSymbolicLink()) return null;
  check(fs.realpathSync(absolute).startsWith(fs.realpathSync(root) + path.sep), `${postId}: ${label} resolves outside the published folder.`);
  return {relative, absolute, filename};
}

function pngHeader(buffer) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  if (buffer.length < 24 || !buffer.subarray(0,8).equals(signature) || buffer.toString('ascii',12,16) !== 'IHDR') return null;
  return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
}

function zipEntries(buffer) {
  const earliest = Math.max(0,buffer.length-65557);
  let end = -1;
  for (let i=buffer.length-22;i>=earliest;i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50 && i+22+buffer.readUInt16LE(i+20) === buffer.length) { end=i; break; }
  }
  if (end < 0) throw new Error('ZIP end directory not found');
  const count = buffer.readUInt16LE(end+10);
  let offset = buffer.readUInt32LE(end+16);
  const names = [];
  for (let i=0;i<count;i++) {
    if (offset+46>buffer.length || buffer.readUInt32LE(offset)!==0x02014b50) throw new Error('Invalid ZIP central directory');
    const nameLength=buffer.readUInt16LE(offset+28);
    const extraLength=buffer.readUInt16LE(offset+30);
    const commentLength=buffer.readUInt16LE(offset+32);
    const next=offset+46+nameLength+extraLength+commentLength;
    if (next>buffer.length) throw new Error('Truncated ZIP directory');
    names.push({name:buffer.toString('utf8',offset+46,offset+46+nameLength),method:buffer.readUInt16LE(offset+10),compressedSize:buffer.readUInt32LE(offset+20),size:buffer.readUInt32LE(offset+24),localOffset:buffer.readUInt32LE(offset+42)});
    offset=next;
  }
  return names;
}

function zipText(buffer,entry) {
  const at=entry.localOffset;
  if (at+30>buffer.length || buffer.readUInt32LE(at)!==0x04034b50 || entry.size>1024*1024) throw new Error('Invalid ZIP text entry');
  const start=at+30+buffer.readUInt16LE(at+26)+buffer.readUInt16LE(at+28);
  const end=start+entry.compressedSize;
  if (end>buffer.length) throw new Error('Truncated ZIP text entry');
  const bytes=buffer.subarray(start,end);
  const decoded=entry.method===0 ? bytes : entry.method===8 ? inflateRawSync(bytes,{maxOutputLength:1024*1024}) : null;
  if (!decoded || decoded.length!==entry.size) throw new Error('Unsupported ZIP text entry');
  return decoded.toString('utf8');
}

function inspectPreview(post) {
  const preview = post.preview;
  check(preview && typeof preview === 'object' && !Array.isArray(preview), `${post.id}: preview must be an object.`);
  if (!preview || typeof preview !== 'object' || Array.isArray(preview)) return;
  const allowed = new Set(['status','type','cover','slides','download']);
  check(Object.keys(preview).every(key => allowed.has(key)), `${post.id}: private or unknown field in public preview.`);
  check(preview.status === 'Visual draft', `${post.id}: artwork status must be Visual draft.`);
  check(preview.type === 'carousel', `${post.id}: this seven-post batch must use three-slide carousels.`);
  const slides = Array.isArray(preview.slides) ? preview.slides : [];
  check(slides.length === 3, `${post.id}: produced set must contain exactly three slides.`);
  const filenames=[];
  const localPaths=[];
  for (const [index,slide] of slides.entries()) {
    const valid = slide && typeof slide === 'object' && !Array.isArray(slide);
    check(valid, `${post.id}: slide ${index+1} must be an object.`);
    if (!valid) continue;
    check(Object.keys(slide).every(key => ['src','alt'].includes(key)), `${post.id}: slide ${index+1} exposes private or unknown fields.`);
    check(typeof slide.alt === 'string' && slide.alt.trim().length>0, `${post.id}: slide ${index+1} needs nonempty alt text.`);
    const asset=postAsset(slide.src,post.id,/\.png$/i,`slide ${index+1}`);
    if (!asset) continue;
    check(!previewPNGs.has(asset.relative), `${post.id}: PNG slide is referenced more than once.`);
    previewPNGs.add(asset.relative);
    localPaths.push(asset.relative);
    filenames.push(asset.filename);
    const header=pngHeader(fs.readFileSync(asset.absolute));
    check(Boolean(header), `${post.id}: slide ${index+1} has no valid PNG header.`);
    if (header) check(header.width===1080 && header.height===1440, `${post.id}: slide ${index+1} must be 1080×1440 (found ${header.width}×${header.height}).`);
  }
  check(new Set(localPaths).size===3, `${post.id}: expected three distinct existing PNG slides.`);
  const cover=postAsset(preview.cover,post.id,/\.webp$/i,'WebP cover');
  if (cover) {
    previewCovers.add(cover.relative);
    const buffer=fs.readFileSync(cover.absolute);
    check(buffer.length>=12 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP', `${post.id}: cover has no valid WebP header.`);
  }
  const bundle=postAsset(preview.download,post.id,/\.zip$/i,'ZIP download');
  if (bundle) {
    previewZIPs.add(bundle.relative);
    try {
      const buffer=fs.readFileSync(bundle.absolute);
      const records=zipEntries(buffer);
      const entries=records.filter(entry=>!entry.name.endsWith('/'));
      check(records.every(entry=>!entry.name.startsWith('/') && !entry.name.includes('\\') && !entry.name.split('/').includes('..')), `${post.id}: unsafe path in ZIP download.`);
      const actual=entries.map(entry=>path.posix.basename(entry.name)).sort();
      const expected=[...filenames,'captions.txt','alt-text.txt'].sort();
      check(entries.length===5 && JSON.stringify(actual)===JSON.stringify(expected), `${post.id}: ZIP must contain its same three PNG slides plus public captions.txt and alt-text.txt only.`);
      for (const name of ['captions.txt','alt-text.txt']) {
        const entry=entries.find(item=>path.posix.basename(item.name)===name);
        check(Boolean(entry), `${post.id}: ZIP needs ${name}.`);
        if (!entry) continue;
        const content=zipText(buffer,entry);
        check(content.trim().length>0, `${post.id}: ZIP ${name} is empty.`);
        check(!/\/Users\/|\/private\/|01-clients\/|08-independent\/|\bimagePath\b|\boriginalSource\b|source_?hash|sourceSha256|["']crop["']\s*:/i.test(content), `${post.id}: ZIP ${name} contains private provenance or a local path.`);
        if (name==='captions.txt') check(content.includes(post.caption.trim()) && content.includes(post.facebookCaption.trim()), `${post.id}: ZIP captions must match the public final draft copy.`);
        else check(slides.every(slide=>typeof slide.alt==='string' && content.includes(slide.alt.trim())), `${post.id}: ZIP alt text must match all three public slide descriptions.`);
      }
    } catch (_) { check(false, `${post.id}: ZIP download has an invalid directory.`); }
  }
}

function publishedPostFiles(folder) {
  if (!fs.existsSync(folder)) return [];
  const files=[];
  for (const entry of fs.readdirSync(folder,{withFileTypes:true})) {
    const absolute=path.join(folder,entry.name);
    if (entry.isSymbolicLink()) { check(false,'Published post assets must not contain symbolic links.'); continue; }
    if (entry.isDirectory()) files.push(...publishedPostFiles(absolute));
    else if (entry.isFile()) files.push(path.relative(root,absolute).split(path.sep).join('/'));
  }
  return files;
}
check(clients.length === 7, `Expected 7 clients; found ${clients.length}.`);
check(allPosts.length === 182, `Expected 182 post drafts; found ${allPosts.length}.`);
check(new Set(allPosts.map(post => post.id)).size === allPosts.length, 'Post IDs must be unique across clients.');
check((data.research || []).length === 100, `Expected 100 research questions; found ${(data.research || []).length}.`);
check(Array.isArray(data.guidance), 'Guidance must be an array.');
check(previewPosts.length===7, `Expected exactly 7 produced preview posts; found ${previewPosts.length}.`);
for (const client of clients) {
  const posts = client.posts || [];
  const sources = new Set((client.sources || []).map(source => source.id));
  check(/^[a-z0-9-]+$/.test(client.id || ''), 'Client ID must be a safe slug.');
  check(posts.length === 26, `${client.id}: expected 26 posts.`);
  check(new Set(posts.map(post => post.date)).size === 26, `${client.id}: expected 26 distinct dates.`);
  check((client.references || []).length >= 5, `${client.id}: needs at least 5 recorded category references.`);
  check(fs.existsSync(path.join(root, 'assets', 'logos', `${client.id}.png`)), `${client.id}: original logo preview file missing.`);
  check(Boolean(client.brand?.logo?.status), `${client.id}: logo status missing.`);
  for (const post of posts) {
    for (const field of fields) check(post[field] !== undefined && post[field] !== null && post[field] !== '', `${post.id}: missing ${field}.`);
    check(post.date >= '2026-10-22' && post.date <= '2026-12-21', `${post.id}: date outside planning window.`);
    check([1,3,5].includes(new Date(`${post.date}T12:00:00Z`).getUTCDay()), `${post.id}: expected Monday, Wednesday or Friday.`);
    check(['Reel','Carousel','Photo'].includes(post.format), `${post.id}: unknown format.`);
    check(post.status === (data.version === '2.0-direction-reset' ? 'Held for rebriefing' : 'Draft'), `${post.id}: status must match programme phase.`);
    if (!post.title.startsWith('Withdrawn source premise')) check(post.caption !== post.facebookCaption, `${post.id}: channel captions must be distinct.`);
    check(Array.isArray(post.production) && post.production.length >= (post.title.startsWith('Withdrawn source premise') ? 1 : 3), `${post.id}: production brief incomplete.`);
    check(Array.isArray(post.story) && post.story.length >= (post.title.startsWith('Withdrawn source premise') ? 1 : 3), `${post.id}: Story companion incomplete.`);
    check(Array.isArray(post.approvalNeeds) && post.approvalNeeds.length > 0, `${post.id}: approval conditions missing.`);
    check(Array.isArray(post.sourceIds) && post.sourceIds.every(id => sources.has(id)), `${post.id}: source IDs do not resolve within client.`);
    check(!/\b(TODO|TBD|INSERT HERE|PLACEHOLDER)\b/i.test(`${post.caption} ${post.facebookCaption}`), `${post.id}: placeholder in paste-ready copy.`);
    if (post.preview !== undefined && post.preview !== null) inspectPreview(post);
  }
}
check(clients.every(client => (client.posts || []).filter(post => post.preview).length===1), 'The first visual batch must contain one produced post per client.');
check(previewPNGs.size===21, `Expected 21 distinct existing PNG slides; found ${previewPNGs.size}.`);
check(previewCovers.size===7, `Expected 7 existing WebP covers; found ${previewCovers.size}.`);
check(previewZIPs.size===7, `Expected 7 existing ZIP downloads; found ${previewZIPs.size}.`);
const postFiles=publishedPostFiles(path.join(root,'assets','posts'));
const allowedPostFiles=new Set([...previewPNGs,...previewCovers,...previewZIPs]);
check(postFiles.filter(file=>/\.png$/i.test(file)).length===21, 'Published post directory must contain exactly the 21 final slide PNGs; archive preliminary/superseded images.');
check(postFiles.every(file=>allowedPostFiles.has(file)), 'Published post directory contains unreferenced, raw or private files outside the seven final draft sets.');
const serialised = JSON.stringify(data);
check(!/\/Users\/|\/private\/|[A-Za-z]:\\\\|08-independent\/|01-clients\//.test(serialised), 'Dataset contains a local/internal filesystem path.');
if (errors.length) {
  process.stderr.write(errors.map(error => `FAIL: ${error}`).join('\n') + '\n');
  process.exit(1);
}
process.stdout.write(`PASS: ${clients.length} clients, ${allPosts.length} ${data.version === "2.0-direction-reset" ? "held calendar drafts" : "Draft posts"}, ${(data.research || []).length} research questions; ${previewPosts.length} preserved study carousels, ${previewPNGs.size} PNG slides at 1080×1440, ${previewCovers.size} WebP covers and ${previewZIPs.size} three-slide ZIPs. Sources, safe paths and required assets resolve.\n`);
