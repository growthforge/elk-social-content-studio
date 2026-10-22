'use strict';

(() => {
  let windowStart = '';
  let windowEnd = '';
  const VIEWS = {
    programme: ['Photos & carousels', 'Inspect slides, copy captions and download a post.'],
    calendar: ['Photo calendar', 'Proposed dates for the actual photo and carousel exports. Open a post to inspect every slide.'],
    'video-directions': ['Video directions', 'Ideas, shot sequences and direct references. These are directions to produce, never finished videos.'],
    previous: ['Previous wave · needs rebrief', 'The earlier 14-post wave needs rebriefing and is excluded from new programme totals. Creative acceptance is not recorded.'],
    held: ['Held briefs · archive', 'Earlier calendar briefs remain held. Their dates and ideas are not new finished posts. Caption copying is disabled.'],
    references: ['Brand & research', 'Supplied identities and the existing evidence library. Historical observations need current checks before social release.']
  };
  const ALIASES = {finished:'programme',overview:'programme',directions:'video-directions',feed:'held',posts:'held',brand:'references','brand-audit':'references',research:'references',production:'programme','art-direction':'held'};
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const arr = value => Array.isArray(value) ? value : [];
  const str = value => typeof value === 'string' ? value.trim() : '';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0,10) === value;
  const addDays = (date, n) => {const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10);};
  const monday = date => addDays(date,-((new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7));
  const dateLabel = (date, options = {}) => isDate(date) ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'Europe/London',...options}).format(new Date(`${date}T12:00:00Z`)) : 'Date not supplied';
  const rangeLabel = week => `${dateLabel(week < windowStart ? windowStart : week)}–${dateLabel(addDays(week,6) > windowEnd ? windowEnd : addDays(week,6))}`;
  const safeURL = value => {try {const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : '';} catch (_) {return '';}};
  const external = (url, label) => safeURL(url) ? `<a href="${esc(safeURL(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>` : '';
  const params = new URLSearchParams(location.search);
  const requestedView = ALIASES[params.get('view')] || params.get('view');
  const state = {
    view: Object.hasOwn(VIEWS,requestedView) ? requestedView : 'programme', client:params.get('client') || 'all', query:params.get('q') || '',
    month:params.get('month') || 'all', week:isDate(params.get('week')) ? monday(params.get('week')) : 'all',
    from:'', to:'',
    format:['image','carousel'].includes(params.get('format')) ? params.get('format') : 'all', order:params.get('order') === 'latest' ? 'latest' : 'earliest',
    post:params.get('post') || '', slide:0
  };
  let baseline = {clients:[],guidance:[],research:[]};
  let clients = [];
  let programme = null;
  let posts = [];
  let previous = [];
  let directions = [];
  let primaryState = 'loading';
  let previousState = 'loading';
  let invalidCount = 0;
  let missingCount = 0;
  let previousInvalid = 0;
  let fileCheckCount = 0;
  let totalFileChecks = 0;
  let toastTimer;
  let searchTimer;
  let lastTrigger;
  let loaded = false;
  const failedPreviousCovers = new Set();
  const failedPrimaryImages = new Set();
  const dialog = $('#post-dialog');
  const content = $('#view-content');
  function clampDate(date) {return date < windowStart ? windowStart : date > windowEnd ? windowEnd : date;}
  function configureWindow(data) {
    const from=data?.window?.from, to=data?.window?.to;
    if (!isDate(from) || !isDate(to) || from > to || data.window.timezone !== 'Europe/London') return false;
    const days=(Date.parse(`${to}T12:00:00Z`)-Date.parse(`${from}T12:00:00Z`))/86400000+1;
    const expectations=arr(data.clients);
    if (days > 366 || !Number.isInteger(data.expectedPosts) || data.expectedPosts < 1 || expectations.length !== clients.length || new Set(expectations.map(c => c.id)).size !== clients.length || !expectations.every(c => client(c.id) && Number.isInteger(c.expectedPosts) && c.expectedPosts > 0 && c.expectedPosts <= days) || expectations.reduce((n,c) => n+c.expectedPosts,0) !== data.expectedPosts) return false;
    windowStart=from; windowEnd=to;
    state.from=isDate(params.get('from')) ? clampDate(params.get('from')) : from;
    state.to=isDate(params.get('to')) ? clampDate(params.get('to')) : to;
    if (state.from > state.to) state.to=state.from;
    const months=[...new Set(Array.from({length:days},(_,i) => addDays(from,i).slice(0,7)))];
    if (!months.includes(state.month)) state.month='all';
    $('#month-filter').innerHTML='<option value="all">All dates</option>'+months.map(month => `<option value="${month}">${dateLabel(`${month}-01`,{day:undefined,month:'long',year:'numeric'})}</option>`).join('');
    const weeks=[]; for(let week=monday(from);week<=monday(to);week=addDays(week,7)) weeks.push(week);
    if (!weeks.includes(state.week)) state.week='all';
    $('#week-filter').innerHTML='<option value="all">All weeks</option>'+weeks.map(week => `<option value="${week}">${rangeLabel(week)}</option>`).join('');
    for (const id of ['date-from','date-to']) {const input=$(`#${id}`); input.min=from; input.max=to;}
    const label=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'}).formatRange(new Date(`${from}T12:00:00Z`),new Date(`${to}T12:00:00Z`));
    $('#programme-window').textContent=label;
    $('#sidebar-window').textContent=label;
    return true;
  }
  function client(id) {return clients.find(c => c.id === id);}
  function name(id) {return client(id)?.name || 'Client unavailable';}
  function logo(c) {return c ? `<span class="brand-logo${['nazar-cambridge','nazar-bedford','liman-islington'].includes(c.id) ? ' dark-logo' : ''}"><img src="./assets/logos/${esc(c.id)}.png" alt="" width="44" height="44" loading="lazy" data-logo><span hidden aria-hidden="true">${esc(c.name.slice(0,2))}</span></span>` : '';}
  function empty(title, detail) {return `<div class="empty-state"><h2>${esc(title)}</h2><p>${esc(detail)}</p></div>`;}
  function syncURL() {
    const p = new URLSearchParams({view:state.view});
    for (const [key,value,fallback] of [['client',state.client,'all'],['q',state.query,''],['month',state.month,'all'],['week',state.week,'all'],['format',state.format,'all'],['from',state.from,windowStart],['to',state.to,windowEnd],['order',state.order,'earliest'],['post',state.post,'']]) if (value !== fallback) p.set(key,value);
    history.replaceState(null,'',`${location.pathname}?${p}${location.hash}`);
  }
  function asset(value, post, collection, extensions) {
    if (!/^[a-z0-9-]+$/.test(post.clientId || '') || !/^[A-Za-z0-9_-]+$/.test(post.id || '') || typeof value !== 'string') return '';
    const prefix = `assets/${collection}/${post.clientId}/${post.id}/`;
    if (!value.startsWith(prefix)) return '';
    const filename = value.slice(prefix.length);
    return /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(filename) && extensions.test(filename) ? `./${value}` : '';
  }
  function normalizePost(raw, collection) {
    if (!raw || !client(raw.clientId) || raw.status !== 'Finished draft' || !['image','carousel',...(collection === 'finished' ? ['reel'] : [])].includes(raw.type)) return null;
    const p = {...raw, _collection:collection};
    if (collection === 'programme' && (!isDate(p.date) || p.date < windowStart || p.date > windowEnd)) return null;
    if (!['id','title','caption','facebookCaption','alt','version','sourceSummary'].every(k => str(p[k]))) return null;
    p.cover = asset(raw.cover,p,collection,/\.(png|jpe?g|webp)$/i);
    p.download = asset(raw.download,p,collection,/\.zip$/i);
    p.slides = arr(raw.slides).map(s => ({src:asset(s?.src,p,collection,/\.(png|jpe?g|webp)$/i),alt:str(s?.alt)}));
    if (!p.cover || !p.download) return null;
    if (p.type !== 'reel' && (p.slides.length < (p.type === 'carousel' ? 2 : 1) || p.slides.length > 20 || (p.type === 'image' && p.slides.length !== 1) || p.slides.some(s => !s.src || !s.alt) || new Set(p.slides.map(s => s.src)).size !== p.slides.length)) return null;
    p.references = arr(raw.references).filter(r => str(r?.title) && safeURL(r.url));
    p.notes = arr(raw.notes).filter(n => typeof n === 'string');
    return p;
  }
  function matches(p, dates = true) {
    const q = state.query.trim().toLocaleLowerCase('en-GB');
    return (state.client === 'all' || p.clientId === state.client) && (state.format === 'all' || p.type === state.format)
      && (!dates || (p.date >= state.from && p.date <= state.to && (state.month === 'all' || p.date.startsWith(state.month)) && (state.week === 'all' || monday(p.date) === state.week)))
      && (!q || [name(p.clientId),p.id,p.title,p.caption,p.facebookCaption,p.alt].filter(Boolean).join(' ').toLocaleLowerCase('en-GB').includes(q));
  }
  function filteredPosts() {return posts.filter(p => matches(p)).sort((a,b) => (state.order === 'latest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) || a.clientId.localeCompare(b.clientId) || a.id.localeCompare(b.id));}
  function scopedPosts() {return posts.filter(p => state.client === 'all' || p.clientId === state.client);}
  function renderNavigation() {
    $('#view-nav').innerHTML = Object.entries(VIEWS).map(([id,[label]]) => `<button type="button" data-view="${id}" class="nav-button${['previous','held','references'].includes(id) ? ' nav-secondary' : ''}"${state.view === id ? ' aria-current="page"' : ''}>${label}</button>`).join('');
    $('#client-nav').innerHTML = `<button type="button" data-client="all" class="client-button" aria-pressed="${state.client === 'all'}"><span class="all-client-mark" aria-hidden="true">${clients.length}</span><span>All clients</span></button>` + clients.map(c => `<button type="button" data-client="${esc(c.id)}" class="client-button" aria-pressed="${state.client === c.id}">${logo(c)}<span>${esc(c.name)}</span></button>`).join('');
    $('#client-count').textContent = clients.length;
    $('#client-filter').innerHTML = '<option value="all">All clients</option>' + clients.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');
    for (const [id,value] of [['client-filter',state.client],['month-filter',state.month],['week-filter',state.week],['format-filter',state.format],['date-from',state.from],['date-to',state.to],['order',state.order]]) $(`#${id}`).value = value;
    $('#search').value = state.query;
    const datesApply = !!windowStart && ['programme','calendar'].includes(state.view);
    for (const id of ['month-filter','week-filter','date-from','date-to']) $(`#${id}`).disabled = !datesApply;
    $('#format-filter').disabled = !['programme','calendar','previous'].includes(state.view);
    $('#order').disabled = !datesApply;
    $('#dates-toggle').disabled = !datesApply;
    const advanced = Number(state.week !== 'all') + Number(state.format !== 'all') + Number(state.from !== windowStart || state.to !== windowEnd);
    $('#more-filters-toggle').textContent = advanced ? `More filters (${advanced})` : 'More filters';
    $('#export-csv').disabled = primaryState !== 'ready' || !filteredPosts().length;
  }
  function profile() {
    const c = client(state.client);
    if (!c) return '';
    return `<header class="client-profile">${logo(c)}<div><h2>${esc(c.name)}</h2><p>${esc(c.location || '')}</p><div class="profile-links">${external(c.instagram,'Instagram')}${external(c.website,'Website')}</div></div><span class="badge">Review drafts</span></header>`;
  }
  function summary() {
    const scoped = scopedPosts();
    const expected = state.client === 'all' ? programme?.expectedPosts : arr(programme?.clients).find(c => c.id === state.client)?.expectedPosts;
    const expectedLabel = Number.isInteger(expected) && expected > 0 ? `<span class="count-context">of ${expected} proposed posts</span>` : '';
    const shown = filteredPosts().length;
    return `<div class="programme-summary" aria-label="Actual programme counts and proposed cadence"><span><strong>${scoped.length}</strong> finished ${scoped.length === 1 ? 'draft' : 'drafts'}</span>${expectedLabel}<span>${scoped.filter(p => p.type === 'carousel').length} carousels · ${scoped.filter(p => p.type === 'image').length} photos</span>${str(programme?.cadence?.label) ? `<span class="summary-cadence" title="${esc(programme.cadence.status || '')}">${esc(programme.cadence.label)}</span>` : ''}${shown !== scoped.length ? `<span class="selection-count"><strong>${shown}</strong> shown</span>` : ''}</div>`;
  }
  function primaryMessage() {
    if (primaryState === 'loading') return empty('Opening the photo programme','The actual export collection is loading. Earlier plans are excluded.');
    if (primaryState === 'checking') return empty('Checking the supplied files',`${fileCheckCount} of ${totalFileChecks} file paths checked. Counts appear after the image and ZIP checks complete.`);
    if (primaryState === 'unavailable') return empty('The new photo programme is unavailable','The programme file or its window and target metadata could not be read. Previous work remains in the archive; it does not fill this programme.');
    return '';
  }
  function fileGap() {return invalidCount || missingCount ? `<p class="file-gap" role="status">${invalidCount ? `${invalidCount} incomplete or invalid ${invalidCount === 1 ? 'record' : 'records'}` : ''}${invalidCount && missingCount ? ' and ' : ''}${missingCount ? `${missingCount} ${missingCount === 1 ? 'post with an unavailable file' : 'posts with unavailable files'}` : ''} excluded from new finished counts.</p>` : '';}
  function tile(p) {
    const old = p._collection === 'finished';
    return `<article class="post-tile"><button type="button" class="tile-open" data-post="${esc(p.id)}" data-collection="${p._collection}" aria-label="Open ${esc(name(p.clientId))}: ${esc(p.title)}"><span class="tile-cover"><img src="${esc(p.cover)}" alt="${esc(p.alt)}" width="1080" height="1440" loading="lazy" decoding="async" ${old ? 'data-previous-cover' : 'data-primary-cover'}="${esc(p.id)}"><span class="cover-error" hidden>Image unavailable</span></span><span class="tile-copy"><span class="format-badge">${p.type === 'carousel' ? `${p.slides.length} slides` : p.type === 'reel' ? 'Previous Reel' : 'Photo'}</span><span class="tile-meta">${old ? 'Previous wave' : `${dateLabel(p.date)} · Proposed`}${state.client === 'all' ? `<span>${esc(name(p.clientId))}</span>` : ''}</span><strong>${esc(p.title)}</strong></span></button><div class="tile-actions"><button type="button" class="text-button" data-post="${esc(p.id)}" data-collection="${p._collection}">Inspect ${p.type === 'carousel' ? 'slides' : 'post'}</button><a href="${esc(p.download)}" download>ZIP <span aria-hidden="true">↓</span></a></div></article>`;
  }
  function gallery() {
    const message = primaryMessage();
    if (message) return profile()+message;
    const rows = filteredPosts();
    return profile()+summary()+fileGap()+(rows.length ? `<div class="post-grid">${rows.map(tile).join('')}</div>` : empty(posts.length ? 'No posts match these filters' : 'No new photo exports supplied yet',posts.length ? 'Reset the filters or choose another client or week.' : 'The gallery counts actual exports when their images, captions, alt text and ZIP are supplied. Video directions and earlier drafts are excluded.'));
  }
  function calendar() {
    const message = primaryMessage();
    if (message) return profile()+message;
    const rows = filteredPosts();
    const weeks = state.week === 'all' ? [...new Set(rows.map(p => monday(p.date)))].sort() : [state.week];
    if (!rows.length) return profile()+summary()+fileGap()+empty('No exported posts in this date selection','Change the month, week or date range. Empty dates do not imply publication or a completed post.');
    return profile()+summary()+fileGap()+`<p class="calendar-note">Each card opens an actual export. Every date is proposed.</p><div class="calendar-weeks">${weeks.map(week => `<section class="calendar-week"><h2>Week of ${dateLabel(week)}</h2><div class="calendar-days">${Array.from({length:7},(_,i) => addDays(week,i)).filter(day => day >= windowStart && day <= windowEnd && day >= state.from && day <= state.to && (state.month === 'all' || day.startsWith(state.month))).map(day => {const dayRows=rows.filter(p => p.date === day); return `<section class="calendar-day${!dayRows.length ? ' is-empty' : ''}"><h3><span>${dateLabel(day,{weekday:'short'})}</span><small>${dayRows.length ? `${dayRows.length} ${dayRows.length === 1 ? 'post' : 'posts'}` : '—'}</small></h3>${dayRows.map(p => `<button class="calendar-card" type="button" data-post="${esc(p.id)}" data-collection="programme"><span>${esc(name(p.clientId))}</span><strong>${esc(p.title)}</strong><small>${p.type === 'carousel' ? `${p.slides.length}-slide carousel` : 'Photo'} · Proposed</small></button>`).join('')}</section>`;}).join('')}</div></section>`).join('')}</div>`;
  }
  function directionView() {
    const q=state.query.trim().toLocaleLowerCase('en-GB');
    const rows=directions.filter(d => (state.client === 'all' || d.clientId === state.client) && (!q || JSON.stringify(d).toLocaleLowerCase('en-GB').includes(q)));
    return profile()+`<p class="direction-boundary"><strong>Concept / direction only.</strong> These briefs are not rendered media and do not count as finished posts. References show the creative approach; source and usage checks still apply before production. Competitor media is not copied into these briefs.</p>`+(rows.length ? `<div class="direction-list">${rows.map((d,i) => `<article class="direction-card"><header><p class="eyebrow">${esc(name(d.clientId))} · Direction ${i+1}</p><span class="badge">Concept / direction only</span><h2>${esc(d.title)}</h2></header>${[['Viewer decision',d.viewerDecision],['Opening',d.hook],['Payoff',d.payoff],['Next step',d.cta]].filter(([,v]) => str(v)).map(([label,v]) => `<div class="direction-field"><h3>${label}</h3><p>${esc(v)}</p></div>`).join('')}${arr(d.beats).length ? `<div class="direction-field"><h3>Shot sequence</h3><ol>${d.beats.map(b => `<li>${esc(b)}</li>`).join('')}</ol></div>` : ''}${arr(d.footageNeeded).length ? `<div class="direction-field"><h3>Footage needed</h3><ul>${d.footageNeeded.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}<div class="direction-field"><h3>Direct references</h3>${references(d.references)}</div>${str(d.notes) ? `<p>${esc(d.notes)}</p>` : ''}</article>`).join('')}</div>` : empty('No video directions in this selection',primaryState === 'unavailable' ? 'The new programme file could not be loaded.' : 'Direction briefs appear here once their direct references and shot sequences are supplied.'));
  }
  function references(rows) {return arr(rows).length ? `<ul class="reference-list">${arr(rows).map(r => `<li>${external(r.url,r.title || 'Reference')}${r.why || r.detail || r.summary ? `<p>${esc(r.why || r.detail || r.summary)}</p>` : ''}${str(r.inspected) ? `<p><strong>Actually inspected:</strong> ${esc(r.inspected)}</p>` : ''}</li>`).join('')}</ul>` : '<p class="muted">Direct references not supplied.</p>';}
  function previousView() {
    if (previousState === 'unavailable') return empty('Previous wave unavailable','The archive collection could not be opened. It is excluded from the new programme.');
    const rows=previous.filter(p => !failedPreviousCovers.has(p.id) && matches(p,false));
    return profile()+`<p class="archive-boundary"><strong>Previous wave — needs rebrief.</strong> ${previous.length} supplied records from the earlier wave; excluded from new progress. Creative acceptance is not recorded. Rendered Reels are archived reference; this dashboard creates no video players. Date filters do not apply here.</p>${previousInvalid ? `<p class="file-gap">${previousInvalid} incomplete archive records excluded.</p>` : ''}`+(rows.length ? `<div class="post-grid">${rows.map(tile).join('')}</div>` : empty('No previous posts match this selection','Reset client, format or search filters to inspect the retained wave.'));
  }
  function heldView() {
    const q=state.query.trim().toLocaleLowerCase('en-GB');
    const all=clients.flatMap(c => arr(c.posts).map(p => ({...p,clientId:c.id})));
    const rows=all.filter(p => (state.client === 'all' || p.clientId === state.client) && (!q || [name(p.clientId),p.title,p.hook,p.caption].join(' ').toLocaleLowerCase('en-GB').includes(q)));
    return `<p class="archive-boundary"><strong>${all.length} earlier briefs · held for rebriefing.</strong> These entries are ideas and dates from the previous plan, with no new completion credit. Caption copying remains disabled.</p><div class="held-list">${rows.map(p => `<article><span>${esc(name(p.clientId))}</span><time datetime="${esc(p.date || '')}">${dateLabel(p.date)}</time><h2>${esc(p.title || 'Earlier brief')}</h2><p>${esc(p.hook || '')}</p><span class="badge">Held · ${esc(p.format || 'Brief')}</span></article>`).join('')}</div>`;
  }
  function referenceView() {
    return clients.filter(c => state.client === 'all' || c.id === state.client).map(c => `<section class="brand-reference"><header>${logo(c)}<div><p class="eyebrow">Supplied identity & historical evidence</p><h2>${esc(c.name)}</h2></div></header><p>${esc(c.brand?.status || 'Current identity status not verified.')}</p>${str(c.brand?.detail) ? `<p>${esc(c.brand.detail)}</p>` : ''}<div class="profile-links">${external(c.instagram,'Instagram')}${external(c.website,'Website')}</div>${str(c.brand?.layout) ? `<p>${esc(c.brand.layout)}</p>` : ''}${arr(c.brand?.palette).length ? `<div class="palette">${c.brand.palette.filter(p => /^#[0-9a-f]{6}$/i.test(p.hex)).map(p => `<span><i style="background:${esc(p.hex)}" aria-hidden="true"></i>${esc(p.name)}<small>${esc(p.hex)}</small></span>`).join('')}</div>` : ''}${arr(c.brand?.fonts).length ? `<ul>${c.brand.fonts.map(f => `<li><strong>${esc(f.name)}</strong> — ${esc(f.reason)}</li>`).join('')}</ul>` : ''}<details><summary>Existing creative references</summary>${references(c.references)}</details></section>`).join('')+`<section class="brand-reference"><h2>Existing platform research</h2><p class="muted">Observed ${esc(baseline.observed || 'date not supplied')}. Recheck volatile guidance before use.</p>${references(arr(baseline.guidance).map(g => ({title:`${g.status || 'NOT VERIFIED'} · ${g.title}`,url:g.url,summary:g.summary})))}</section>`;
  }
  function render() {
    if (!loaded) return;
    renderNavigation();
    $('#view-title').textContent=VIEWS[state.view][0];
    $('#view-description').textContent=VIEWS[state.view][1];
    const rows=filteredPosts();
    $('#result-status').classList[['programme','calendar'].includes(state.view) && primaryState === 'ready' ? 'add' : 'remove']('sr-only');
    $('#result-status').textContent=['programme','calendar'].includes(state.view) ? primaryState === 'ready' ? `${rows.length} matching new finished ${rows.length === 1 ? 'post' : 'posts'} · proposed dates · social approval pending` : primaryState === 'checking' ? 'Checking actual file availability…' : primaryState === 'unavailable' ? 'New programme unavailable' : 'Opening new programme…' : state.view === 'video-directions' ? 'Direction briefs are excluded from all finished totals' : state.view === 'previous' ? 'Archived wave · excluded from new programme totals' : state.view === 'held' ? 'Held planning briefs · no finished-post credit' : 'Historical evidence · check before current use';
    content.innerHTML=({programme:gallery,calendar,'video-directions':directionView,previous:previousView,held:heldView,references:referenceView})[state.view]();
    syncURL();
  }
  function postByID(id, collection) {return (collection === 'finished' ? previous : posts).find(p => p.id === id);}
  function altText(p) {return p.type === 'reel' ? p.alt : p.slides.map((s,i) => `${p.slides.length > 1 ? `Slide ${i+1}\n` : ''}${s.alt}`).join('\n\n');}
  function copyBlock(label,value,key) {return `<section class="copy-block"><div><h3>${label}</h3><button type="button" class="button secondary small" data-copy="${key}">Copy</button></div><pre>${esc(value)}</pre></section>`;}
  function renderDialog(p) {
    state.slide=Math.max(0,Math.min(state.slide,p.slides.length-1));
    const slide=p.slides[state.slide];
    const old=p._collection === 'finished';
    const media=p.type === 'reel' ? `<div class="archive-reel"><img src="${esc(p.cover)}" alt="${esc(p.alt)}" width="1080" height="1920"><p>Previous rendered Reel · archived. Video players are removed from this photo programme.</p></div>` : `<div class="slide-frame"><img src="${esc(slide.src)}" alt="${esc(slide.alt)}" width="1080" height="1440" decoding="async" data-detail-image><p class="detail-error" hidden>Slide unavailable. No replacement artwork is shown.</p></div>${p.slides.length > 1 ? `<div class="slide-controls"><button class="button secondary" type="button" data-slide="previous"${state.slide === 0 ? ' disabled' : ''}>← Previous</button><span role="status" aria-live="polite">Slide ${state.slide+1} of ${p.slides.length}</span><button class="button secondary" type="button" data-slide="next"${state.slide === p.slides.length-1 ? ' disabled' : ''}>Next →</button></div><div class="slide-index" aria-label="Choose a slide">${p.slides.map((_,i) => `<button type="button" data-slide-index="${i}" aria-pressed="${state.slide === i}" aria-label="Show slide ${i+1}">${i+1}</button>`).join('')}</div>` : ''}<div class="slide-downloads"><a class="button secondary" href="${esc(slide.src)}" download>Download ${p.slides.length > 1 ? 'slide' : 'image'}</a><a href="${esc(slide.src)}" target="_blank" rel="noopener noreferrer">Full size ↗</a></div>${copyBlock(p.slides.length > 1 ? `Slide ${state.slide+1} alt text` : 'Image alt text',slide.alt,'slide-alt')}`;
    $('#dialog-content').innerHTML=`<header class="dialog-header"><button class="dialog-close" type="button" data-close aria-label="Close post">×</button><p class="eyebrow">${esc(name(p.clientId))} · ${old ? 'Previous wave' : `${dateLabel(p.date)} · Proposed`}</p><h2 id="post-dialog-title">${esc(p.title)}</h2><p class="dialog-meta">${p.type === 'carousel' ? `${p.slides.length}-slide carousel` : p.type === 'reel' ? 'Archived Reel' : 'Photo'} · ${esc(p.version)} · ${old ? 'Previous wave — needs rebrief' : 'Finished draft'}</p><p class="muted">${old ? 'Archived work; excluded from new progress.' : 'Actual export for review. The date does not mean scheduled, published or approved.'}</p></header><div class="dialog-grid"><section class="dialog-media" aria-label="Actual media">${media}</section><section class="dialog-copy" aria-label="Captions and sources">${copyBlock('Instagram caption',p.caption,'instagram')}${copyBlock('Facebook caption',p.facebookCaption,'facebook')}${p.slides.length > 1 ? copyBlock('All slide alt text',altText(p),'alt') : ''}<div class="post-downloads"><a class="button primary" href="${esc(p.download)}" download>Download post pack ZIP ↓</a><button class="button secondary" type="button" data-copy="link">Copy post link</button></div><details class="post-evidence"><summary>Sources, review & remaining checks</summary><h3>Source summary</h3><p>${esc(p.sourceSummary)}</p><h3>Review</h3><p>${esc(str(p.review?.status) || 'Independent review not supplied.')}</p><p>${esc(str(p.review?.scope) || 'Social-release approval not verified.')}</p>${p.notes.length ? `<ul>${p.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}${references(p.references)}<p>Technical or AI review does not supply human social-release approval.</p></details></section></div>`;
  }
  function openPost(id,collection,trigger) {
    const p=postByID(id,collection);
    if (!p) return;
    lastTrigger=trigger || document.activeElement;
    state.post=id; state.slide=0;
    dialog.dataset.collection=collection;
    renderDialog(p); syncURL();
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
    $('.dialog-close',dialog).focus();
  }
  function closeDialog() {if(dialog.open) dialog.close();}
  function changeSlide(index) {
    const p=postByID(state.post,dialog.dataset.collection);
    if (!p || p.type === 'reel' || index < 0 || index >= p.slides.length) return;
    const focused=document.activeElement;
    const key=focused?.dataset?.slide || '';
    state.slide=index; renderDialog(p);
    const next=key ? $(`[data-slide="${key}"]:not(:disabled)`,dialog) : $(`[data-slide-index="${index}"]`,dialog);
    (next || $('.dialog-close',dialog)).focus({preventScroll:true});
  }
  async function copyText(value) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {const field=document.createElement('textarea'); field.value=value; field.className='clipboard-fallback'; (dialog.open ? dialog : document.body).append(field); field.select(); if(!document.execCommand('copy')) throw new Error('Clipboard unavailable'); field.remove();}
      toast('Copied exact text');
    } catch (_) {toast('Clipboard unavailable. Select and copy the text shown.');}
  }
  function toast(message) {clearTimeout(toastTimer); const t=$('#toast'); t.textContent=message; t.hidden=false; toastTimer=setTimeout(() => {t.hidden=true;},3500);}
  function downloadCSV() {
    const quoted=value => `"${String(value ?? '').replace(/"/g,'""')}"`;
    const rows=[['Proposed date','Client','Title','Format','Version','Instagram caption','Facebook caption','Alt text','Pack path','Status'],...filteredPosts().map(p => [p.date,name(p.clientId),p.title,p.type,p.version,p.caption,p.facebookCaption,altText(p),p.download,'Finished draft; date proposed; social approval pending'])];
    const blob=new Blob(['\uFEFF'+rows.map(row => row.map(quoted).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='elk-photo-programme-proposed-dates.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);
  }
  function resetFilters() {Object.assign(state,{client:'all',query:'',month:'all',week:'all',from:windowStart,to:windowEnd,format:'all',order:'earliest'}); render();}
  async function getJSON(filename) {const response=await fetch(`./${filename}`,{cache:'no-store'}); if(!response.ok) throw new Error(`Unavailable ${filename}`); return response.json();}
  async function checkFiles(candidates) {
    const urls=[...new Set(candidates.flatMap(p => [p.cover,p.download,...p.slides.map(s => s.src)]))];
    totalFileChecks=urls.length; fileCheckCount=0; render();
    const available=new Map(); let cursor=0;
    await Promise.all(Array.from({length:Math.min(4,urls.length)},async () => {
      while(cursor < urls.length) {
        const url=urls[cursor++];
        try {const response=await fetch(`${url}?v=${encodeURIComponent(str(programme?.version) || 'unversioned')}`,{method:'HEAD',cache:'force-cache'}); available.set(url,response.ok && Number(response.headers.get('content-length') || 1)>0);} catch (_) {available.set(url,false);}
        fileCheckCount++;
        if(fileCheckCount%16 === 0 && ['programme','calendar'].includes(state.view)) {const progress=$('.empty-state p',content); if(progress) progress.textContent=`${fileCheckCount} of ${totalFileChecks} file paths checked. Counts appear after the image and ZIP checks complete.`;}
      }
    }));
    return candidates.filter(p => [p.cover,p.download,...p.slides.map(s => s.src)].every(url => available.get(url)));
  }
  async function load() {
    const [baseResult,programmeResult,previousResult]=await Promise.allSettled([getJSON('data.json'),getJSON('photo-programme.json'),getJSON('finished-posts.json')]);
    if(baseResult.status === 'fulfilled') baseline=baseResult.value;
    clients=arr(baseline.clients).filter(c => /^[a-z0-9-]+$/.test(c.id) && str(c.name));
    if (!clients.length) {
      $('#result-status').textContent='Client identity data unavailable';
      content.innerHTML=empty('The client register could not be opened','No client identity or completed-post totals are inferred. Reload once the supplied data is available.');
      return;
    }
    if (!client(state.client)) state.client='all';
    if(previousResult.status === 'fulfilled') {previous=arr(previousResult.value.posts).map(p => normalizePost(p,'finished')).filter(Boolean); previousInvalid=arr(previousResult.value.posts).length-previous.length; previousState='ready';} else previousState='unavailable';
    let candidates=[];
    if(programmeResult.status === 'fulfilled' && programmeResult.value && typeof programmeResult.value === 'object' && Array.isArray(programmeResult.value.posts) && configureWindow(programmeResult.value)) {
      programme=programmeResult.value;
      const ids=new Set();
      candidates=programme.posts.map(p => normalizePost(p,'programme')).filter(p => {if(!p || ids.has(p.id)) return false; ids.add(p.id); return true;});
      invalidCount=programme.posts.length-candidates.length;
      directions=arr(programme.videoDirections).filter(d => d?.status === 'Direction only' && client(d.clientId) && str(d.id) && str(d.title)).map(d => ({...d,references:arr(d.references).filter(r => str(r?.title) && safeURL(r.url))}));
      primaryState=candidates.length ? 'checking' : 'ready';
    } else primaryState='unavailable';
    loaded=true; render();
    if(candidates.length) {posts=await checkFiles(candidates); missingCount=candidates.length-posts.length; primaryState='ready'; render();}
    if(state.post) {const id=state.post; const collection=state.view === 'previous' ? 'finished' : 'programme'; if(postByID(id,collection)) openPost(id,collection); else {state.post=''; syncURL();}}
  }
  document.addEventListener('click',event => {
    const b=event.target.closest('button'); if(!b) return;
    if(b.dataset.view) {closeDialog(); state.view=b.dataset.view; state.post=''; render(); $('#main').focus({preventScroll:true});}
    else if(b.dataset.client) {state.client=b.dataset.client; render();}
    else if(b.dataset.post) openPost(b.dataset.post,b.dataset.collection,b);
    else if(b.hasAttribute('data-close')) closeDialog();
    else if(b.dataset.slide) changeSlide(state.slide+(b.dataset.slide === 'next' ? 1 : -1));
    else if(b.hasAttribute('data-slide-index')) changeSlide(Number(b.dataset.slideIndex));
    else if(b.dataset.copy) {const p=postByID(state.post,dialog.dataset.collection); if(p) copyText({instagram:p.caption,facebook:p.facebookCaption,alt:altText(p),'slide-alt':p.slides[state.slide]?.alt || p.alt,link:location.href}[b.dataset.copy] || '');}
  });
  for(const [id,key] of [['client-filter','client'],['month-filter','month'],['week-filter','week'],['format-filter','format']]) $(`#${id}`).addEventListener('change',event => {state[key]=event.target.value; render();});
  $('#search').addEventListener('input',event => {state.query=event.target.value; clearTimeout(searchTimer); searchTimer=setTimeout(render,140);});
  $('#dates-toggle').addEventListener('click',() => {const hidden=$('#date-filters').hidden; $('#date-filters').hidden=!hidden; $('#dates-toggle').setAttribute('aria-expanded',String(hidden));});
  $('#more-filters-toggle').addEventListener('click',() => {const hidden=$('#more-filters').hidden; $('#more-filters').hidden=!hidden; $('#more-filters-toggle').setAttribute('aria-expanded',String(hidden));});
  for(const [id,key] of [['date-from','from'],['date-to','to']]) $(`#${id}`).addEventListener('change',event => {if(!isDate(event.target.value)) return; state[key]=clampDate(event.target.value); if(state.from > state.to) {if(key === 'from') state.to=state.from; else state.from=state.to;} render();});
  $('#reset-filters').addEventListener('click',resetFilters);
  $('#export-csv').addEventListener('click',downloadCSV);
  $('#order').addEventListener('change',event => {state.order=event.target.value; render();});
  document.addEventListener('error',event => {
    const img=event.target;
    if(!(img instanceof HTMLImageElement)) return;
    if(img.hasAttribute('data-logo')) {img.hidden=true; if(img.nextElementSibling) img.nextElementSibling.hidden=false;}
    if(img.hasAttribute('data-primary-cover')) {const id=img.dataset.primaryCover; if(!failedPrimaryImages.has(id)) {failedPrimaryImages.add(id); posts=posts.filter(p => p.id !== id); missingCount++; render();}}
    if(img.hasAttribute('data-previous-cover')) {failedPreviousCovers.add(img.dataset.previousCover); img.hidden=true; if(img.nextElementSibling) img.nextElementSibling.hidden=false;}
    if(img.hasAttribute('data-detail-image')) {img.hidden=true; if(img.nextElementSibling) img.nextElementSibling.hidden=false; if(dialog.dataset.collection === 'programme' && !failedPrimaryImages.has(state.post)) {failedPrimaryImages.add(state.post); posts=posts.filter(p => p.id !== state.post); missingCount++; render();}}
  },true);
  dialog.addEventListener('close',() => {state.post=''; state.slide=0; document.body.classList.remove('dialog-open'); syncURL(); if(lastTrigger?.isConnected) lastTrigger.focus({preventScroll:true});});
  dialog.addEventListener('click',event => {if(event.target === dialog) {const box=dialog.getBoundingClientRect(); if(event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog();}});
  document.addEventListener('keydown',event => {if(!dialog.open || event.target.closest('input,textarea,select')) return; if(event.key === 'ArrowLeft') {event.preventDefault(); changeSlide(state.slide-1);} if(event.key === 'ArrowRight') {event.preventDefault(); changeSlide(state.slide+1);}});
  load().catch(() => {$('#result-status').textContent='Programme could not be opened'; content.innerHTML=empty('The studio could not be opened','Reload to try the supplied data again. No replacement posts are shown.');});
})();
