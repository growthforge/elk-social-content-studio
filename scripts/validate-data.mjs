import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

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
check(clients.length === 7, `Expected 7 clients; found ${clients.length}.`);
check(allPosts.length === 182, `Expected 182 post drafts; found ${allPosts.length}.`);
check(new Set(allPosts.map(post => post.id)).size === allPosts.length, 'Post IDs must be unique across clients.');
check((data.research || []).length === 100, `Expected 100 research questions; found ${(data.research || []).length}.`);
check(Array.isArray(data.guidance), 'Guidance must be an array.');
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
    check(post.status === 'Draft', `${post.id}: status must remain Draft.`);
    check(post.caption !== post.facebookCaption, `${post.id}: channel captions must be distinct.`);
    check(Array.isArray(post.production) && post.production.length >= 3, `${post.id}: production brief incomplete.`);
    check(Array.isArray(post.story) && post.story.length >= 3, `${post.id}: Story companion incomplete.`);
    check(Array.isArray(post.approvalNeeds) && post.approvalNeeds.length > 0, `${post.id}: approval conditions missing.`);
    check(Array.isArray(post.sourceIds) && post.sourceIds.every(id => sources.has(id)), `${post.id}: source IDs do not resolve within client.`);
    check(!/\b(TODO|TBD|INSERT HERE|PLACEHOLDER)\b/i.test(`${post.caption} ${post.facebookCaption}`), `${post.id}: placeholder in paste-ready copy.`);
  }
}
const serialised = JSON.stringify(data);
check(!/\/Users\/|\/private\/|[A-Za-z]:\\\\|08-independent\/|01-clients\//.test(serialised), 'Dataset contains a local/internal filesystem path.');
if (errors.length) {
  process.stderr.write(errors.map(error => `FAIL: ${error}`).join('\n') + '\n');
  process.exit(1);
}
process.stdout.write(`PASS: ${clients.length} clients, ${allPosts.length} draft posts, ${(data.research || []).length} research questions; sources and required assets resolve.\n`);
