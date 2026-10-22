'use strict';

(() => {
  const START = '2026-10-22';
  const END = '2026-12-21';
  const VIEWS = {
    finished: ['Finished posts', 'Finished posts & Reels', 'Actual produced media, ready to inspect, copy and download. These are review drafts, not live Instagram posts.'],
    directions: ['Direction reset', 'The story comes first', 'Seven distinct client directions, the research behind them and the real resources each one needs. One pilot precedes further production.'],
    overview: ['Overview', 'Content programme', 'Seven distinct brands. One place to find the next draft, its copy and the work behind it.'],
    calendar: ['Calendar', 'The publishing calendar', 'Proposed dates and local times. Open any draft for its captions, creative brief and checks.'],
    'art-direction': ['Rejected studies', 'Previous photo studies · rejected', 'Preserved for comparison. These studies were rejected as a creative direction and must not be used as the new production system.'],
    feed: ['Held feed', 'Earlier planned feed · held', 'Previous planning previews are held for rebriefing. Open Finished posts for the current produced exports.'],
    posts: ['Held briefs', 'Earlier post briefs · held', 'Earlier ideas and captions are held for rebriefing. Open Direction reset for the new story briefs.'],
    brand: ['Brand & audit', 'Brand & profile evidence', 'The supplied identities, what was actually observed and what still needs confirming.'],
    research: ['Research', 'Research & guidance', 'Primary platform guidance, category references and a clearly labelled research backlog.'],
    production: ['Production', 'From draft to final creative', 'A practical queue for assets, production and review. Approval is recorded separately by the authorised people.']
  };
  const ICONS = {
    finished: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m10 8 6 4-6 4z"/>',
    directions: '<path d="M4 5h16v14H4zM8 9h8M8 13h5M8 16h3"/>',
    overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
    'art-direction': '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
    feed: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    posts: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h6"/>',
    brand: '<path d="m12 3 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8"/>',
    research: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6M10 7v6"/>',
    production: '<path d="M4 5h16v14H4zM4 10h16M9 10v9M9 5v5M15 5v5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    left: '<path d="m14 6-6 6 6 6"/>',
    right: '<path d="m10 6 6 6-6 6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M15 8V4H4v11h4"/>',
    external: '<path d="M14 3h7v7M21 3 11 13M10 5H4v15h15v-6"/>'
  };
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const arr = value => Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
  const text = value => value == null ? '' : Array.isArray(value) ? value.map(text).join('\n') : typeof value === 'object' ? Object.entries(value).filter(([key]) => !['local', 'path'].includes(key)).map(([key, val]) => `${humanise(key)}: ${text(val)}`).join('\n') : String(value);
  const humanise = value => String(value).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').replace(/^./, x => x.toUpperCase());
  const icon = (name, size = 18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.posts}</svg>`;
  const isDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(`${value}T12:00:00Z`));
  const dateObject = value => new Date(`${value}T12:00:00Z`);
  const dateLabel = (value, options = {}) => isDate(value) ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London', ...options }).format(dateObject(value)) : String(value || 'Date to confirm');
  const addDays = (value, days) => { const d = dateObject(value); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
  const monday = value => addDays(value, -((dateObject(value).getUTCDay() + 6) % 7));
  const FIRST_WEEK = monday(START);
  const LAST_WEEK = monday(END);
  const safeURL = (value, allowThread = false) => {
    try {
      if (!value || typeof value !== 'string') return '';
      const url = new URL(value);
      if (['https:', 'http:'].includes(url.protocol)) return url.href;
      if (allowThread && url.protocol === 'codex:' && url.hostname === 'threads' && /^\/[a-zA-Z0-9-]+\/?$/.test(url.pathname)) return url.href;
    } catch (_) { /* Invalid URLs are shown as a source gap, never injected. */ }
    return '';
  };
  const external = (value, label, className = 'text-link', allowThread = false) => {
    const url = safeURL(value, allowThread);
    return url ? `<a class="${esc(className)}" href="${esc(url)}"${url.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(label)}${icon('external', 12)}</a>` : '';
  };
  const hashText = value => text(value).toLocaleLowerCase('en-GB');
  const params = new URLSearchParams(location.search);
  const initialView = params.get('view') === 'brand-audit' ? 'brand' : params.get('view');
  const state = {
    view: VIEWS[initialView] ? initialView : 'finished', client: params.get('client') || 'all',
    query: params.get('q') || '', format: params.get('format') || 'all', pillar: params.get('pillar') || 'all',
    from: isDate(params.get('from')) ? params.get('from') : START, to: isDate(params.get('to')) ? params.get('to') : END,
    week: isDate(params.get('week')) ? monday(params.get('week')) : FIRST_WEEK,
    calendarMode: params.get('layout') === 'list' ? 'list' : 'week', researchTab: ['guidance', 'questions', 'references'].includes(params.get('tab')) ? params.get('tab') : 'guidance',
    feedOrder: params.get('order') === 'latest' ? 'latest' : 'earliest', previewIndex: 0,
    researchCategory: params.get('topic') || 'all', openPost: params.get('post') || '', dialogTab: 'copy'
  };
  let data = { clients: [], guidance: [], research: [], threads: {} };
  let clients = [];
  let posts = [];
  let sourceMap = new Map();
  let artDirection = { version: '', method: [], concepts: [] };
  let artDirectionState = 'loading';
  let directionReset = null;
  let finishedData = null;
  let finishedPosts = [];
  let finishedState = 'loading';
  const finishedUnavailable = new Set();
  let toastTimer;
  let searchTimer;
  let lastPostTrigger;
  const previewAvailability = new Map();
  const dialog = $('#post-dialog');

  function normaliseClient(raw) {
    const client = { ...raw, id: String(raw.id || ''), name: String(raw.name || 'Client name to confirm') };
    client.posts = arr(raw.posts).map(post => ({ ...post, id: String(post.id || ''), _client: client.id, _name: client.name }));
    client.audit = arr(raw.audit);
    client.sources = arr(raw.sources);
    client.references = arr(raw.references);
    client.assetNeeds = arr(raw.assetNeeds);
    client.brand = raw.brand || {};
    return client;
  }

  function logo(client, large = false) {
    if (!client || !/^[a-z0-9-]+$/.test(client.id)) return `<span class="brand-logo${large ? ' large' : ''}"><span class="logo-gap">Original logo unavailable</span></span>`;
    return `<span class="brand-logo${large ? ' large' : ''}${['nazar-bedford', 'nazar-cambridge', 'liman-islington'].includes(client.id) ? ' dark-logo' : ''}" data-logo><img src="./assets/logos/${encodeURIComponent(client.id)}.png" alt="${esc(client.name)} supplied logo" loading="lazy"><span class="logo-gap" hidden>Original logo unavailable</span></span>`;
  }

  function logoStatusLabel(client) {
    const value = text(client?.brand?.logo?.status);
    if (/concept|stand.in|generated identity|unapproved identity/i.test(value)) return 'Concept logo';
    if (/unavailable|not supplied|missing/i.test(value)) return 'Logo unavailable';
    return 'Supplied logo';
  }
  function logoStatus(client) {
    const label = logoStatusLabel(client);
    return `<span class="logo-status${label === 'Concept logo' ? ' concept' : ''}" title="${esc(text(client?.brand?.logo?.status))}">${esc(label)}</span>`;
  }
  function programmeStrategy() {
    const programme = data.programme;
    if (!programme || !programme.thesis) return '';
    const phases = arr(programme.phases);
    const facts = [['Cadence', programme.cadence], ['Measurement', programme.measurement], ['Limits', programme.limits]].filter(([,value]) => value);
    return `<section class="programme-strategy"><div class="section-head"><h2>Two-month direction</h2><span class="proposal-label">Proposed programme</span></div><p class="strategy-thesis">${esc(text(programme.thesis))}</p>${phases.length ? `<ol class="programme-phases">${phases.map(phase => `<li><span class="strategy-phase-date">${esc(text(phase.dates))}</span><h3>${esc(text(phase.title))}</h3><p>${esc(text(phase.action))}</p>${phase.review ? `<p class="strategy-review"><strong>Review:</strong> ${esc(text(phase.review))}</p>` : ''}</li>`).join('')}</ol>` : ''}<dl class="strategy-facts">${facts.map(([title,value]) => `<div><dt>${title}</dt><dd>${esc(text(value))}</dd></div>`).join('')}</dl></section>`;
  }
  function clientStrategy(client, compact = false) {
    const strategy = client?.strategy;
    if (!strategy) return '';
    const facts = [['Goal',strategy.goal],['Audience',strategy.audience],['Direction',strategy.thesis],['First priority',strategy.priority],['Measure',strategy.measure]].filter(([,value]) => value);
    if (!facts.length) return '';
    return `<section class="client-strategy${compact ? ' compact' : ''}"><div class="section-head"><h3>${compact ? esc(client.name) : 'Client direction'}</h3><span class="proposal-label">Proposed</span></div><dl class="client-strategy-facts">${facts.map(([title,value]) => `<div><dt>${title}</dt><dd>${esc(text(value))}</dd></div>`).join('')}</dl></section>`;
  }

  function getClient(id) { return clients.find(client => client.id === id); }
  function clientScope() { return state.client === 'all' ? clients : clients.filter(client => client.id === state.client); }
  function filteredPosts() {
    const query = state.query.trim().toLocaleLowerCase('en-GB');
    return posts.filter(post => (state.client === 'all' || post._client === state.client)
      && (state.format === 'all' || post.format === state.format)
      && (state.pillar === 'all' || post.pillar === state.pillar)
      && post.date >= state.from && post.date <= state.to
      && (!query || hashText([post._name, post.id, post.title, post.hook, post.caption, post.facebookCaption, post.pillar, post.production, post.motion, post.story, post.asset]).includes(query)));
  }

  // Finished media has a separate contract and never borrows an old planning preview.
  function safeFinishedAsset(value, post, extensions) {
    if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(post.clientId || '') || !/^[a-zA-Z0-9_-]+$/.test(post.id || '')) return '';
    const prefix = `assets/finished/${post.clientId}/${post.id}/`;
    if (!value.startsWith(prefix)) return '';
    const name = value.slice(prefix.length);
    return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name) && extensions.test(name) ? `./${value}` : '';
  }
  function normaliseFinished(raw) {
    if (!raw || typeof raw.id !== 'string' || typeof raw.clientId !== 'string' || raw.status !== 'Finished draft' || !getClient(raw.clientId) || !['image','carousel','reel'].includes(raw.type)) return null;
    const post = {...raw};
    post.cover = safeFinishedAsset(raw.cover, post, /\.(png|jpe?g|webp|avif)$/i);
    post.slides = arr(raw.slides).map(s => ({src:safeFinishedAsset(s?.src, post, /\.(png|jpe?g|webp|avif)$/i),alt:typeof s?.alt === 'string' ? s.alt.trim() : ''}));
    post.download = safeFinishedAsset(raw.download, post, /\.zip$/i);
    const client = getClient(post.clientId);
    post._client = client.id; post._name = client.name; post._finished = true;
    post.format = {image:'Photo',carousel:'Carousel',reel:'Reel'}[post.type];
    if (!post.cover || !post.download || !text(raw.title).trim() || !text(raw.caption).trim() || !text(raw.facebookCaption).trim() || !text(raw.alt).trim()) return null;
    if (post.type === 'reel') {
      const supplied = raw.video || {};
      post.video = {...supplied,src:safeFinishedAsset(supplied.src,post,/\.mp4$/i),poster:safeFinishedAsset(supplied.poster,post,/\.(png|jpe?g|webp|avif)$/i)};
      if (!post.video.src || !post.video.poster || !text(post.video.audioStatus).trim()) return null;
    } else if (post.slides.length < (post.type === 'carousel' ? 2 : 1) || (post.type === 'image' && post.slides.length !== 1) || post.slides.some(s => !s.src || !s.alt)) return null;
    return post;
  }
  function filteredFinished() {
    const query = state.query.trim().toLocaleLowerCase('en-GB');
    return finishedPosts.filter(post => !finishedUnavailable.has(post.id)
      && (state.client === 'all' || post.clientId === state.client)
      && (state.format === 'all' || post.format === state.format)
      && (!query || hashText([post._name,post.id,post.title,post.caption,post.facebookCaption,post.alt,post.type]).includes(query)));
  }
  function finishedTile(post) {
    const client = getClient(post.clientId);
    return `<button class="finished-tile" type="button" data-finished-post="${esc(post.id)}" aria-label="Open ${esc(post._name)}: ${esc(post.title)}, ${esc(post.format)}, finished draft"><span class="finished-cover"><img src="${esc(post.cover)}" alt="${esc(post.alt)}" width="1080" height="1440" loading="lazy" decoding="async" data-finished-image="${esc(post.id)}"><span class="finished-file-error" hidden>Media unavailable</span></span><span class="finished-tile-copy"><span class="finished-type">${post.type === 'reel' ? '<span aria-hidden="true">▷</span> Reel' : post.type === 'carousel' ? `${icon('copy',14)} ${post.slides.length} slides` : 'Photo'}</span>${state.client === 'all' ? `<span class="finished-client-name">${esc(client.name)}</span>` : ''}<strong>${esc(post.title)}</strong></span></button>`;
  }
  function renderFinished() {
    const rows = filteredFinished();
    const allScope = finishedPosts.filter(p => !finishedUnavailable.has(p.id) && (state.client === 'all' || p.clientId === state.client));
    const client = getClient(state.client);
    const chooser = `<div class="finished-client-tabs" role="group" aria-label="Finished posts by client"><button type="button" data-finished-client="all" aria-pressed="${state.client === 'all'}">All clients</button>${clients.map(c => `<button type="button" data-finished-client="${esc(c.id)}" aria-pressed="${state.client === c.id}">${esc(c.name)}</button>`).join('')}</div>`;
    const profile = client ? `<header class="feed-profile finished-profile">${logo(client,true)}<div class="feed-profile-copy"><div class="feed-profile-title"><h2>${esc(client.name)}</h2><span class="draft-badge">Review drafts</span></div>${instagramIdentity(client)}<p>${esc(client.location)}</p><div class="feed-profile-status">${logoStatus(client)}<span>${allScope.length} produced ${allScope.length === 1 ? 'post' : 'posts'} · no live profile data</span></div></div><button type="button" class="button secondary" data-view="brand">Brand & evidence</button></header>` : '';
    const intro = finishedData?.summary ? `<div class="finished-intro"><p>${esc(finishedData.summary)}</p></div>` : '';
    if (finishedState === 'unavailable') return chooser + profile + '<div class="empty-state"><h2>Finished media could not be opened</h2><p>The finished collection is unavailable. The earlier calendar remains held; its briefs are not counted as completed posts.</p><button class="button secondary" data-action="reload-finished" type="button">Try again</button></div>';
    const missingCount = (arr(finishedData?.posts).length - finishedPosts.length) + finishedUnavailable.size;
    const gap = missingCount > 0 ? `<p class="finished-gap" role="status">${missingCount} supplied ${missingCount === 1 ? 'record is' : 'records are'} unavailable or incomplete and excluded from the finished gallery.</p>` : '';
    return chooser + profile + intro + gap + (rows.length ? `<div class="finished-gallery-head"><h2>${client ? 'Posts & Reels' : 'All client posts & Reels'}</h2><span>${rows.length} actual ${rows.length === 1 ? 'export' : 'exports'} in supplied batch order</span></div><div class="finished-grid" aria-label="${esc(client?.name || 'All clients')} finished media grid">${rows.map(finishedTile).join('')}</div>` : empty('No finished media in this selection', 'Choose another client or format, or clear the search. Planning briefs do not appear in this gallery.'));
  }

  function finishedMedia(post) {
    if (post.type === 'reel') return `<div class="finished-video-wrap"><video class="finished-video" controls playsinline preload="none" poster="${esc(post.video.poster)}" aria-label="${esc(post.title)}" aria-describedby="finished-video-description"><source src="${esc(post.video.src)}" type="video/mp4"><p>Your browser cannot play this video. Use the MP4 download.</p></video><p id="finished-video-description">${esc(post.alt)}</p><p class="finished-audio"><strong>Audio:</strong> ${esc(post.video.audioStatus)}</p><div class="finished-player-error" hidden role="status">The video could not be played here. Try the direct MP4 download.</div><a class="button secondary" href="${esc(post.video.src)}" download>Download Reel MP4</a></div>`;
    state.previewIndex = Math.max(0,Math.min(state.previewIndex,post.slides.length-1));
    const slide = post.slides[state.previewIndex];
    return `<div class="finished-image-viewer" tabindex="-1"><div class="finished-image-frame"><img src="${esc(slide.src)}" alt="${esc(slide.alt)}" width="1080" height="1440" decoding="async" data-finished-detail="${esc(post.id)}"><p class="finished-player-error" hidden role="status">This slide is unavailable. No replacement artwork is shown.</p></div>${post.slides.length > 1 ? `<div class="media-controls"><button type="button" class="button secondary" data-finished-nav="previous" aria-label="Previous slide"${state.previewIndex === 0 ? ' disabled' : ''}>${icon('left',16)} Previous</button><p role="status" aria-live="polite">Slide ${state.previewIndex+1} of ${post.slides.length}</p><button type="button" class="button secondary" data-finished-nav="next" aria-label="Next slide"${state.previewIndex === post.slides.length-1 ? ' disabled' : ''}>Next ${icon('right',16)}</button></div>` : ''}<div class="media-alt"><strong>${post.slides.length > 1 ? `Slide ${state.previewIndex+1} alt text` : 'Image alt text'}</strong><p>${esc(slide.alt)}</p><button type="button" class="button secondary small" data-finished-copy="slide-alt">Copy this alt text</button></div><div class="media-downloads"><a class="button secondary" href="${esc(slide.src)}" download>Download ${post.slides.length > 1 ? 'slide' : 'image'}</a><a class="text-link" href="${esc(slide.src)}" target="_blank" rel="noopener noreferrer">Open full size ${icon('external',13)}</a></div></div>`;
  }
  function finishedCopyBlock(label, value, key) {
    return `<section class="copy-block"><div class="copy-block-head"><h3>${esc(label)}</h3><button class="button secondary small" type="button" data-finished-copy="${key}">${icon('copy',12)} Copy</button></div><pre class="copy-content">${esc(text(value))}</pre></section>`;
  }
  function finishedAlt(post) {
    return post.type === 'reel' ? post.alt : post.slides.map((slide,index) => `${post.slides.length > 1 ? `Slide ${index+1}\n` : ''}${slide.alt}`).join('\n\n');
  }
  function renderFinishedDialog(post) {
    const client = getClient(post.clientId);
    $('#dialog-content').innerHTML = `<header class="dialog-head"><div class="dialog-topline">${logo(client)}<span>${esc(client.name)}</span><span>·</span><span>${esc(post.id)}</span></div><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close post detail">×</button><h2 id="post-dialog-title">${esc(post.title)}</h2><div class="dialog-meta">${formatTag(post)}<span class="draft-badge">Finished draft</span><span>${esc(post.version || 'Version not supplied')}</span></div><p class="finished-detail-boundary">Produced media for review · not published or approved by this dashboard.</p></header><div class="dialog-tabs" role="tablist" aria-label="Finished post details">${[['media','Media'],['copy','Captions & alt text'],['evidence','Review & sources']].map(([key,label]) => `<button type="button" id="tab-${key}" role="tab" aria-selected="${state.dialogTab === key}" aria-controls="panel-${key}" tabindex="${state.dialogTab === key ? '0' : '-1'}" data-dialog-tab="${key}">${label}</button>`).join('')}</div><div class="dialog-body"><section id="panel-media" role="tabpanel" aria-labelledby="tab-media"${state.dialogTab !== 'media' ? ' hidden' : ''}><div id="finished-media-container" tabindex="-1">${finishedMedia(post)}</div></section><section id="panel-copy" role="tabpanel" aria-labelledby="tab-copy"${state.dialogTab !== 'copy' ? ' hidden' : ''}>${finishedCopyBlock('Instagram caption',post.caption,'instagram')}${finishedCopyBlock('Facebook caption',post.facebookCaption,'facebook')}${finishedCopyBlock(post.type === 'reel' ? 'Video description' : 'Alt text',finishedAlt(post),'alt')}</section><section id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence"${state.dialogTab !== 'evidence' ? ' hidden' : ''}><section class="brief-block"><h3>Source summary</h3><p>${esc(text(post.sourceSummary) || 'Source summary not supplied.')}</p></section><section class="brief-block"><h3>Review status</h3><p>${esc(text(post.review?.status) || 'Not verified')}</p><p>${esc(text(post.review?.scope) || 'Independent review scope has not been supplied.')}</p></section>${arr(post.notes).length ? bulletBlock('Notes & remaining checks',post.notes,false) : ''}<p class="finished-detail-boundary">A technical or AI review does not supply human approval. Check current facts, media and audio rights, consent and the exact final version before social publication.</p></section><div class="dialog-actions"><a class="button yellow" href="${esc(post.download)}" download>Download post pack ZIP</a><button class="button secondary" type="button" data-finished-copy="link">Copy post link</button>${threadLink(client,true)}</div></div>`;
  }
  function moveFinishedMedia(direction) {
    const post = finishedPosts.find(p => p.id === state.openPost);
    if (!post || post.type === 'reel') return;
    state.previewIndex = Math.max(0,Math.min(post.slides.length-1,state.previewIndex+(direction === 'next' ? 1 : -1)));
    const host = $('#finished-media-container',dialog);
    if (!host) return;
    host.innerHTML = finishedMedia(post);
    const target = [...host.querySelectorAll('[data-finished-nav]')].find(b => b.dataset.finishedNav === direction && !b.disabled) || [...host.querySelectorAll('[data-finished-nav]')].find(b => !b.disabled) || host;
    target.focus({preventScroll:true});
  }
  function stopVideos(scope = document) {
    scope.querySelectorAll('video').forEach(video => video.pause());
  }
  async function copyFinished(key) {
    const post = finishedPosts.find(p => p.id === state.openPost);
    if (!post) return;
    const values = {instagram:post.caption,facebook:post.facebookCaption,alt:finishedAlt(post),'slide-alt':post.slides[state.previewIndex]?.alt || post.alt,link:location.href};
    if (Object.hasOwn(values,key)) await copyText(text(values[key]),`${key === 'link' ? 'Post link' : key.includes('alt') ? 'Alt text' : key === 'facebook' ? 'Facebook caption' : 'Instagram caption'} copied`);
  }

  function syncURL() {
    const next = new URLSearchParams();
    if (state.client !== 'all') next.set('client', state.client);
    next.set('view', state.view);
    if (state.query) next.set('q', state.query);
    if (state.format !== 'all') next.set('format', state.format);
    if (state.pillar !== 'all') next.set('pillar', state.pillar);
    if (state.from !== START) next.set('from', state.from);
    if (state.to !== END) next.set('to', state.to);
    if (state.view === 'calendar' && state.week !== FIRST_WEEK) next.set('week', state.week);
    if (state.calendarMode !== 'week') next.set('layout', state.calendarMode);
    if (state.researchTab !== 'guidance') next.set('tab', state.researchTab);
    if (state.researchCategory !== 'all') next.set('topic', state.researchCategory);
    if (state.view === 'feed' && state.feedOrder !== 'earliest') next.set('order', state.feedOrder);
    if (state.openPost) next.set('post', state.openPost);
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}${location.hash}`);
  }

  function renderNavigation() {
    $('#view-nav').innerHTML = Object.entries(VIEWS).map(([key, labels]) => `<button type="button" class="nav-button" data-view="${key}"${state.view === key ? ' aria-current="page"' : ''}>${icon(key)}${esc(labels[0])}</button>`).join('');
    $('#client-count').textContent = clients.length;
    const actual = finishedPosts.filter(p => !finishedUnavailable.has(p.id));
    const count = id => state.view === 'finished' ? actual.filter(p => id === 'all' || p.clientId === id).length : id === 'all' ? posts.length : getClient(id).posts.length;
    $('#client-nav').innerHTML = `<button type="button" class="client-button" data-client="all" aria-pressed="${state.client === 'all'}"><span class="brand-logo all-clients-icon">${icon('overview', 15)}</span><span>All clients</span><span class="client-number" title="${state.view === 'finished' ? 'Produced exports' : 'Held calendar drafts'}">${count('all')}</span></button>` + clients.map(client => `<button type="button" class="client-button" data-client="${esc(client.id)}" aria-pressed="${state.client === client.id}">${logo(client)}<span class="client-label"><span>${esc(client.name)}</span>${logoStatus(client)}</span><span class="client-number" title="${state.view === 'finished' ? 'Produced exports' : 'Held calendar drafts'}">${count(client.id)}</span></button>`).join('');
  }

  function updateFilters() {
    if ($('#search').value !== state.query) $('#search').value = state.query;
    $('#client-filter').value = state.client;
    $('#format-filter').value = state.format;
    const pillars = [...new Set(posts.filter(post => state.client === 'all' || post._client === state.client).map(post => post.pillar).filter(Boolean))].sort();
    $('#pillar-filter').innerHTML = '<option value="all">All pillars</option>' + pillars.map(pillar => `<option value="${esc(pillar)}">${esc(pillar)}</option>`).join('');
    if (!pillars.includes(state.pillar)) state.pillar = 'all';
    $('#pillar-filter').value = state.pillar;
    $('#date-from').value = state.from;
    $('#date-to').value = state.to;
  }

  function formatTag(post) { return `<span class="format-tag ${esc(String(post.format || '').toLowerCase())}">${esc(post.format || 'Format to confirm')}</span>`; }
  function evidenceTag(value) {
    const status = text(value) || 'Not verified';
    const css = /not verified|unknown|pending|fail|proposed|not checked|concept/i.test(status) ? ' unknown' : /estimate|hypothesis|test/i.test(status) ? ' estimated' : '';
    return `<span class="evidence-tag${css}">${esc(status)}</span>`;
  }
  function empty(title = 'No drafts match these filters', description = 'Try a different client, date range, format or search. All original drafts remain in the programme.') {
    return `<div class="empty-state"><span class="empty-symbol" aria-hidden="true">⌕</span><h2>${esc(title)}</h2><p>${esc(description)}</p><button class="button secondary" type="button" data-action="reset">Reset filters</button></div>`;
  }
  function postRow(post) {
    const client = getClient(post._client);
    return `<button type="button" class="post-row" data-post="${esc(post.id)}" aria-label="Open ${esc(post.title)}, ${esc(post._name)}, ${esc(dateLabel(post.date))}"><span class="post-date">${esc(dateLabel(post.date))}<small>${esc(dateLabel(post.date, { weekday: 'short', day: undefined, month: undefined }))}</small></span><span class="post-client">${logo(client)}<span>${esc(post._name)}</span></span><span class="post-copy"><span class="post-title">${esc(post.title)}</span><span class="post-hook">${esc(post.hook)}</span></span>${formatTag(post)}<span class="post-pillar">${esc(post.pillar)}</span><span class="post-arrow" aria-hidden="true">↗</span></button>`;
  }
  function postList(rows, head = true) {
    return `<div class="post-list">${head ? '<div class="post-list-head" aria-hidden="true"><span>Date</span><span>Client</span><span>Draft post</span><span>Format</span><span class="pillar-heading">Pillar</span><span></span></div>' : ''}${rows.map(postRow).join('')}</div>`;
  }
  function threadLink(client, compact = false) {
    const thread = data.threads?.[client.id];
    if (!thread) return compact ? '' : '<span class="section-note">Execution chat not linked yet</span>';
    let url = typeof thread === 'string' ? thread : thread.url;
    if (!url && thread.threadId && /^[a-zA-Z0-9-]+$/.test(thread.threadId)) url = `codex://threads/${thread.threadId}`;
    return external(url, compact ? 'Execution chat' : text(thread.title) || 'Open execution chat', 'button secondary small', true);
  }

  function renderOverview(rows) {
    const scope = clientScope();
    const dates = new Set(rows.map(post => post.date));
    const overview = `<div class="overview-metrics"><div class="programme-metric"><span class="metric-label">Planned post drafts</span><p class="metric-number">${rows.length}</p><span class="metric-foot">Copy + a production brief for each</span></div><div class="programme-metric"><span class="metric-label">Client workspaces</span><p class="metric-number">${scope.length}<small> / ${clients.length}</small></p><span class="metric-foot">Individual identities and source limits</span></div><div class="programme-metric"><span class="metric-label">Core publishing dates</span><p class="metric-number">${dates.size}</p><span class="metric-foot">Proposed · Monday, Wednesday, Friday</span></div></div>`;
    if (!rows.length) return overview + programmeStrategy() + empty();
    const upcoming = rows.slice(0, 8);
    const upcomingHTML = upcoming.map(post => `<button class="upcoming-row" type="button" data-post="${esc(post.id)}"><span class="date-block"><strong>${esc(dateLabel(post.date, { month: undefined }))}</strong><span>${esc(dateLabel(post.date, { day: undefined }))}</span></span><span class="upcoming-main"><span class="row-client">${esc(post._name)} <span>·</span> ${esc(post.id)}</span><h3>${esc(post.title)}</h3><span class="row-meta">${formatTag(post)}<span>${esc(post.pillar)}</span></span></span><span class="row-arrow" aria-hidden="true">↗</span></button>`).join('');
    return overview + programmeStrategy() + `<div class="overview-layout"><div class="surface"><div class="schedule-heading"><div><h2>Next on the programme</h2><p>First drafts in the selected date range</p></div><button class="button text-button" data-view="calendar" type="button">View calendar ${icon('arrow', 13)}</button></div>${upcomingHTML}</div><div class="overview-side"><div class="focus-panel"><p class="eyebrow">Production focus</p><h2>Make the real business the subject.</h2><p>A specific product, place or action gives every post a reason to belong to its client.</p><ol class="focus-list"><li><span>1</span><div><strong>Confirm the source</strong>Check the actual product, business detail and current availability.</div></li><li><span>2</span><div><strong>Capture what is real</strong>Follow the shot list. Clear image, likeness and audio rights.</div></li><li><span>3</span><div><strong>Review the exact version</strong>Read the copy, inspect the export and record human approval.</div></li></ol></div><div class="evidence-mini"><h3>Open questions stay visible</h3><p>Account access, brand approval and photo rights vary by client. A supplied logo or a finished caption does not mean a post is approved.</p><button class="text-link button text-button" data-view="brand" type="button">Read brand & audit ${icon('arrow', 13)}</button></div></div></div><section class="client-strip"><div class="section-head"><h2>Client workspaces</h2><span class="section-note">All posts remain drafts</span></div><div class="client-summary-list">${scope.map(client => {
      const count = rows.filter(post => post._client === client.id).length;
      return `<div class="client-summary-row">${logo(client)}<div><h3>${esc(client.name)}</h3>${logoStatus(client)}<p>${esc(client.location)}</p></div><span class="client-summary-value">${count}<small>drafts in view</small></span><span class="client-summary-value summary-format">${client.posts.filter(post => post.format === 'Reel').length}<small>Reel briefs in full plan</small></span><button type="button" class="button secondary small" data-client-view="${esc(client.id)}">Open feed</button></div>`;
    }).join('')}</div></section>`;
  }

  function directionRows() {
    const query = state.query.trim().toLocaleLowerCase('en-GB');
    return arr(directionReset?.clients).filter(c => (state.client === 'all' || c.id === state.client)
      && (!query || JSON.stringify(c).toLocaleLowerCase('en-GB').includes(query)));
  }
  function renderDirections() {
    if (!directionReset) return '<div class="empty-state"><h2>Direction briefs could not be opened</h2><p>The previous creative remains on hold. Reload to try the direction data again.</p><button class="button secondary" type="button" data-action="reload-directions">Reload</button></div>';
    const rows = directionRows();
    const story = (s, selected) => `<details class="direction-story"${selected ? ' open' : ''}><summary><span>${selected ? 'Selected route' : 'Alternative route'} · ${esc(s.title)}</span><small>${esc(s.device)}</small></summary><div class="direction-story-body"><p class="direction-first-line">${esc(s.firstLine)}</p><p><strong>Open on:</strong> ${esc(s.firstShot)}</p><ol>${arr(s.beats).map(b => `<li>${esc(b)}</li>`).join('')}</ol><p><strong>Viewer payoff:</strong> ${esc(s.payoff)}</p><p><strong>Next step:</strong> ${esc(s.cta)}</p><p class="direction-source-needs"><strong>Sources needed:</strong> ${esc(s.needs)}</p></div></details>`;
    const pilot = directionReset.pilot;
    const pilotHTML = pilot && (state.client === 'all' || state.client === pilot.clientId) ? `<section class="direction-pilot"><div><div class="direction-client-identity">${logo(getClient(pilot.clientId))}<strong>${esc(getClient(pilot.clientId)?.name || "Pera")}</strong></div><p class="eyebrow">One real-footage pilot · ${esc(pilot.status)}</p><h2>${esc(pilot.title)}</h2><p>${esc(pilot.description)}</p><p>${esc(pilot.limits)}</p><p class="eyebrow">Conditional caption · review only</p><pre class="direction-caption">${esc(directionReset.clients.find(c => c.id === pilot.clientId)?.caption || "")}</pre><button class="button secondary small" type="button" data-direction-copy="${esc(pilot.clientId)}">Copy pilot draft caption</button> ${pilot.file && /^assets\/pilots\/[a-z0-9./-]+\.mp4$/.test(pilot.file) && !pilot.file.includes('..') ? `<a class="button secondary" href="./${esc(pilot.file)}" download>Download review MP4</a>` : ''}</div>${pilot.file && /^assets\/pilots\/[a-z0-9./-]+\.mp4$/.test(pilot.file) && !pilot.file.includes('..') ? `<video controls playsinline preload="none" aria-label="${esc(pilot.title)} review pilot"${pilot.poster && /^assets\/pilots\/[a-z0-9./-]+\.jpg$/.test(pilot.poster) && !pilot.poster.includes('..') ? ` poster="./${esc(pilot.poster)}"` : ''}><source src="./${esc(pilot.file)}" type="video/mp4"><p>Your browser cannot play this review video. Use the MP4 download.</p></video>` : ''}</section>` : '';
    return `<section class="direction-goal"><p class="eyebrow">Goal · proposed direction v2.0</p><h2>${esc(directionReset.goal)}</h2><ol class="direction-workflow">${arr(directionReset.workflow).map(x => `<li>${esc(x)}</li>`).join('')}</ol><p>${esc(directionReset.ai)}</p><details><summary>Two-month plan and measurement limits</summary><p>${esc(directionReset.period)}</p><p>${esc(directionReset.cadence)}</p><p>${esc(directionReset.measurement)}</p></details></section>${pilotHTML}<div class="direction-index" aria-label="Client direction summary">${rows.map(c => `<a href="#direction-${esc(c.id)}"><strong>${esc(c.name)}</strong><span>${esc(c.title)}</span></a>`).join('')}</div>${rows.length ? rows.map(c => `<article class="direction-client" id="direction-${esc(c.id)}"><header><div class="direction-client-identity">${logo(getClient(c.id))}<div><p class="eyebrow">${esc(c.name)}</p><h2>${esc(c.title)}</h2></div></div>${threadLink(getClient(c.id),true)}</header><p class="direction-premise">${esc(c.selected)}</p><div class="direction-context"><div><h3>The viewer and decision</h3><p>${esc(c.audience)}</p><p>${esc(c.decision)}</p><p><strong>Business purpose:</strong> ${esc(c.purpose)}</p></div><div><h3>What makes it this client</h3><p>${esc(c.proof)}</p><p><strong>Source readiness:</strong> ${esc(c.readiness)}</p></div></div><p class="direction-stop"><strong>Stop repeating:</strong> ${esc(c.stop)}</p>${arr(c.stories).map((s,i) => story(s,i===0)).join('')}<details class="direction-extra"><summary>Copy, visual language and sound</summary><p>${esc(c.voice)}</p><p>${esc(c.motion)}</p><p>${esc(c.layout)}</p><p class="direction-copy-status">${esc(c.copyStatus)}</p><pre class="direction-caption">${esc(c.caption)}</pre><button type="button" class="button secondary small" data-direction-copy="${esc(c.id)}">Copy conditional draft caption</button><div class="direction-palette">${arr(c.brand?.palette).map(p => /^#[0-9a-f]{6}$/i.test(p.hex) ? `<span><i style="background:${esc(p.hex)}"></i>${esc(p.name)} <small>${esc(p.hex)}</small></span>` : '').join('')}</div><p>${esc(c.brand?.status)}</p>${arr(c.brand?.fonts).map(f => `<p><strong>${esc(f.name)}:</strong> ${esc(f.reason)}</p>`).join('')}</details><details class="direction-extra"><summary>22 October–21 December · proposed episode sequence</summary><p>Episode opportunities depend on real sources, capacity and creative acceptance. These are not agreed delivery dates or finished posts.</p><div class="direction-calendar"><table><thead><tr><th>Period</th><th>Episode opportunity</th></tr></thead><tbody>${arr(c.calendar).map(w => `<tr><th scope="row">${esc(w.period)}</th><td>${esc(w.episode)}</td></tr>`).join('')}</tbody></table></div><dl>${Object.entries(c.formats || {}).map(([k,v]) => `<dt>${esc(humanise(k))}</dt><dd>${esc(v)}</dd>`).join('')}</dl></details><details class="direction-extra"><summary>Public sources and unresolved approval</summary><p>${esc(c.status)}</p>${arr(c.sources).map(u => `<p>${external(u,'Open primary/reference source')}</p>`).join('') || '<p>Exact public social identity remains unverified. No guessed account is used.</p>'}<p>Source qualification, current facts, rights and human creative acceptance remain open. A proposed brief or an AI review is not approval to publish.</p></details></article>`).join('') : '<div class="empty-state"><h2>No client direction matches</h2><button class="button secondary" data-action="reset" type="button">Reset filters</button></div>'}<section class="direction-research"><h2>What informed the reset</h2><p>Actual consultations and inspected references. Watching limits are stated; suggestions and case studies do not establish results.</p>${arr(directionReset.research).map(r => `<div><h3>${external(r.url,r.title)}</h3><p>${esc(r.detail)}</p></div>`).join('')}<details><summary>The quality standard before a batch</summary><ol>${arr(directionReset.quality).map(q => `<li>${esc(q)}</li>`).join('')}</ol></details></section>`;
  }

  function renderCalendar(rows) {
    const days = Array.from({ length: 7 }, (_, index) => addDays(state.week, index));
    const weekRows = rows.filter(post => days.includes(post.date));
    const weeks = [];
    for (let day = FIRST_WEEK; day <= LAST_WEEK; day = addDays(day, 7)) weeks.push(day);
    const toolbar = `<div class="toolbar"><div class="week-navigation"><button type="button" class="button icon-button" data-week="previous" aria-label="Previous week"${state.week <= FIRST_WEEK ? ' disabled' : ''}>${icon('left')}</button><h2>${esc(dateLabel(state.week))}—${esc(dateLabel(addDays(state.week, 6)))}</h2><button type="button" class="button icon-button" data-week="next" aria-label="Next week"${state.week >= LAST_WEEK ? ' disabled' : ''}>${icon('right')}</button><select id="week-jump" aria-label="Jump to a week">${weeks.map(day => `<option value="${day}"${day === state.week ? ' selected' : ''}>Week of ${esc(dateLabel(day))}</option>`).join('')}</select></div><div class="segmented" aria-label="Calendar display"><button type="button" data-layout="week" aria-pressed="${state.calendarMode === 'week'}">Week</button><button type="button" data-layout="list" aria-pressed="${state.calendarMode === 'list'}">List</button></div></div><div class="section-head"><span class="section-note">${weekRows.length} draft${weekRows.length === 1 ? '' : 's'} this week · all times Europe/London</span><button type="button" class="text-link button text-button" data-view="posts">See the full post library ${icon('arrow', 12)}</button></div>`;
    if (!weekRows.length) return toolbar + empty('No drafts in this week', 'Choose another week or widen your filters. The programme runs from 22 October to 21 December 2026.');
    if (state.calendarMode === 'list') return toolbar + `<div class="day-list">${days.map(day => {
      const dayRows = weekRows.filter(post => post.date === day);
      return dayRows.length ? `<section class="day-list-section"><h3>${esc(dateLabel(day, { weekday: 'long' }))}<span>${dayRows.length} draft${dayRows.length === 1 ? '' : 's'}</span></h3>${postList(dayRows, false)}</section>` : '';
    }).join('')}</div>`;
    return toolbar + `<div class="calendar-grid" aria-label="Drafts for the week of ${esc(dateLabel(state.week))}">${days.map((day, index) => {
      const dayRows = weekRows.filter(post => post.date === day);
      const outside = day < START || day > END;
      return `<section class="calendar-day${outside ? ' outside' : ''}${index > 4 ? ' weekend' : ''}" aria-label="${esc(dateLabel(day, { weekday: 'long' }))}"><h3 class="day-heading"><span>${esc(dateLabel(day, { weekday: 'short', day: undefined, month: undefined }))}</span><strong>${esc(dateLabel(day, { month: undefined }))}</strong><span class="day-count">${dayRows.length} drafts</span></h3><div class="day-posts">${dayRows.length ? dayRows.map(post => `<button type="button" class="calendar-post" data-post="${esc(post.id)}" aria-label="Open ${esc(post.title)}, ${esc(post._name)}, ${esc(dateLabel(post.date))}"><span class="calendar-client">${esc(post._name)}</span><strong>${esc(post.title)}</strong>${formatTag(post)}</button>`).join('') : `<p class="no-post">${outside ? 'Outside programme' : 'No core post planned'}</p>`}</div></section>`;
    }).join('')}</div>`;
  }

  function safeConceptAsset(value, clientId, extension) {
    if (typeof value !== 'string' || !/^[a-z0-9-]+$/.test(clientId)) return '';
    const candidate = value.replace(/^\.\//, '');
    const prefix = `assets/concepts/${clientId}`;
    if (!candidate.startsWith(prefix)) return '';
    const suffix = candidate.slice(prefix.length);
    return new RegExp(`^(?:-[a-z0-9]+)*-concept\\.${extension}$`).test(suffix) ? `./${candidate}` : '';
  }
  function safeConceptSourceURL(value) {
    const safe = safeURL(value);
    if (!safe) return '';
    const url = new URL(safe);
    return url.username || url.password || ['localhost','127.0.0.1','::1'].includes(url.hostname) || /(^|\.)(drive\.google\.com|docs\.google\.com|claude\.ai)$/i.test(url.hostname) ? '' : safe;
  }
  function directionAssets(concept) {
    if (concept.kind === 'ai') return { image: safeConceptAsset(concept.image,concept.clientId,'png'), thumbnail: safeConceptAsset(concept.thumbnail,concept.clientId,'webp') };
    if (concept.kind !== 'photo') return { image: '', thumbnail: '' };
    const post = getClient(concept.clientId)?.posts.find(item => item.id === concept.postId);
    if (!post || post.preview?.status !== 'Visual draft') return { image: '', thumbnail: '' };
    const expectedImage = safePostAsset(post.preview.slides?.[0]?.src,post.id);
    const expectedThumbnail = safePostAsset(post.preview.cover,post.id);
    const image = safePostAsset(concept.image,post.id);
    const thumbnail = safePostAsset(concept.thumbnail,post.id);
    return image && thumbnail && image === expectedImage && thumbnail === expectedThumbnail ? { image, thumbnail } : { image: '', thumbnail: '' };
  }
  function conceptRows() {
    const query = state.query.trim().toLocaleLowerCase('en-GB');
    return artDirection.concepts.filter(concept => (state.client === 'all' || concept.clientId === state.client)
      && (!query || hashText([getClient(concept.clientId)?.name, concept.title, concept.headline, concept.caption, concept.facebookCaption, concept.notes]).includes(query)));
  }
  async function loadArtDirection() {
    artDirectionState = 'loading';
    if (state.view === 'art-direction') render();
    try {
      const response = await fetch('./art-direction.json', { credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new Error('Photo direction collection unavailable');
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.concepts) || !Array.isArray(payload.method)) throw new Error('Invalid direction collection');
      const concepts = payload.concepts.filter(concept => {
        const client = getClient(concept?.clientId);
        return client && /^[a-zA-Z0-9_-]+$/.test(concept.id || '')
          && client.posts.some(post => post.id === concept.postId)
          && ['photo','ai'].includes(concept.kind)
          && concept.status === (concept.kind === 'photo' ? 'Rejected direction study · held for rebriefing' : 'AI concept — internal review')
          && ['title','alt','headline','caption','facebookCaption'].every(key => typeof concept[key] === 'string' && concept[key].trim())
          && directionAssets(concept).image && directionAssets(concept).thumbnail;
      }).map(concept => ({ ...concept, notes: arr(concept.notes).filter(note => typeof note === 'string'), sources: arr(concept.sources).filter(source => source && typeof source.title === 'string' && safeConceptSourceURL(source.url)) }));
      artDirection = { version: text(payload.version), method: payload.method.filter(item => item && typeof item.title === 'string' && typeof item.detail === 'string'), concepts };
      artDirectionState = 'ready';
    } catch (_) {
      artDirection = { version: '', method: [], concepts: [] };
      artDirectionState = 'unavailable';
    }
    if (['art-direction','feed'].includes(state.view)) render();
  }
  function renderConceptTeaser() {
    const concepts = conceptRows();
    if (!concepts.length) return '';
    const hasPhoto = concepts.some(concept => concept.kind === 'photo');
    return `<section class="concept-teaser" aria-label="${hasPhoto ? 'Previous rejected studies' : 'Additional art direction'}"><div><p class="eyebrow">${hasPhoto ? 'Previous rejected studies' : 'Additional art direction'}</p><h2>${hasPhoto ? 'Previous studies, held for rebriefing.' : 'Review the proposed direction.'}</h2><p>${hasPhoto ? 'Preserved for comparison. Open Direction reset for the proposed new stories.' : 'AI concepts · internal review only · not publishable.'}</p><button type="button" class="button primary" data-view="art-direction">View rejected studies ${icon('arrow',14)}</button></div><div class="concept-teaser-images">${concepts.slice(0,3).map(concept => `<button type="button" data-view="art-direction" aria-label="View ${esc(concept.title)}, ${concept.kind === 'photo' ? 'real-photo draft' : 'AI concept'}"><img src="${esc(directionAssets(concept).thumbnail)}" alt="${esc(concept.alt)}" width="540" height="720" loading="lazy" decoding="async" data-concept-image><span class="concept-image-missing" hidden>Preview unavailable</span>${concept.kind === 'ai' ? '<span class="concept-teaser-kind">AI concept · internal only</span>' : ''}</button>`).join('')}</div></section>`;
  }
  function renderFeed(rows) { return renderConceptTeaser() + renderPlannedFeed(rows); }
  function renderArtDirection() {
    const concepts = conceptRows();
    const notice = '<p class="concept-boundary"><strong>Rejected direction studies.</strong> These previous outputs are preserved for comparison. They are held for rebriefing, with caption copying disabled. Use Direction reset for the proposed new stories.</p>';
    const method = artDirection.method.length ? `<details class="concept-method"><summary>Research & composition method</summary><ol>${artDirection.method.map(item => `<li><h3>${esc(item.title)}</h3><p>${esc(item.detail)}</p>${safeConceptSourceURL(item.url) ? external(safeConceptSourceURL(item.url),'Read source') : ''}</li>`).join('')}</ol></details>` : '';
    if (!concepts.length) return notice + method + `<div class="empty-state"><h2>${artDirectionState === 'loading' ? 'Opening photo direction…' : artDirectionState === 'unavailable' ? 'Photo direction is unavailable' : 'No direction samples in this selection'}</h2><p>${artDirectionState === 'unavailable' ? 'The optional direction collection could not be opened. The calendar and real-photo drafts remain available.' : 'Use the client selector or clear the search to see available samples. The calendar and real-photo drafts remain available.'}</p>${artDirectionState === 'unavailable' ? '<button class="button secondary" type="button" data-action="retry-art-direction">Try again</button>' : artDirectionState !== 'loading' ? '<button class="button secondary" type="button" data-action="reset">Reset filters</button>' : ''}</div>`;
    return notice + method + `<div class="concept-grid">${concepts.map(concept => {
      const client = getClient(concept.clientId);
      const assets = directionAssets(concept);
      const photo = concept.kind === 'photo';
      const kindLabel = photo ? 'Rejected study' : 'AI concept';
      return `<article class="concept-card" data-direction-kind="${photo ? 'photo' : 'ai'}"><header class="concept-card-head">${logo(client)}<div><p>${esc(client.name)}</p>${logoStatus(client)}</div><span class="concept-label">${kindLabel}</span></header><a class="concept-image-link" href="${esc(assets.image)}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size ${esc(concept.title)}"><img src="${esc(assets.thumbnail)}" alt="${esc(concept.alt)}" width="540" height="720" loading="lazy" decoding="async" data-concept-image><span class="concept-image-missing" hidden>Preview unavailable · open full-size image</span></a><div class="concept-card-copy"><p class="concept-status">${photo ? 'Rejected creative direction · retained for comparison' : 'AI concept · internal review · not publishable'}</p><h2>${esc(concept.title)}</h2><p class="concept-headline">${esc(concept.headline)}</p>${photo ? '' : '<p class="concept-ai-boundary">AI-generated details, food, scale and setting may differ from the actual product or venue. Internal concept only; not publishable.</p>'}<div class="concept-card-actions"><a class="text-link" href="${esc(assets.image)}" target="_blank" rel="noopener noreferrer">Open full-size ${icon('external',13)}</a><button type="button" class="button secondary" data-post="${esc(concept.postId)}" data-open-tab="media">View matching draft</button></div><section class="concept-caption"><div><h3>Instagram ${photo ? 'draft' : 'concept'} caption</h3><button type="button" class="button secondary small" data-concept-copy="${esc(concept.id)}" data-concept-channel="instagram">${icon('copy',12)} Copy caption</button></div><pre>${esc(concept.caption)}</pre></section><section class="concept-caption"><div><h3>Facebook ${photo ? 'draft' : 'concept'} caption</h3><button type="button" class="button secondary small" data-concept-copy="${esc(concept.id)}" data-concept-channel="facebook">${icon('copy',12)} Copy caption</button></div><pre>${esc(concept.facebookCaption)}</pre></section><details class="concept-notes"><summary>Direction notes & references</summary>${concept.notes.length ? `<ul>${concept.notes.map(note => `<li>${esc(note)}</li>`).join('')}</ul>` : ''}${concept.sources.length ? `<ul class="concept-references">${concept.sources.map(source => `<li>${external(safeConceptSourceURL(source.url),source.title)}</li>`).join('')}</ul>` : '<p>No additional references supplied.</p>'}</details></div></article>`;
    }).join('')}</div>`;
  }

  function safePostAsset(value, postId, downloadAsset = false) {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(String(postId))) return '';
    const candidate = value.replace(/^\.\//, '');
    const prefix = `assets/posts/${postId}/`;
    if (!candidate.startsWith(prefix)) return '';
    const filename = candidate.slice(prefix.length);
    const allowed = downloadAsset ? /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpe?g|webp|avif|zip|pdf|mp4)$/i : /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpe?g|webp|avif)$/i;
    return allowed.test(filename) ? `./${candidate}` : '';
  }
  function postPreview(post) {
    const supplied = post.preview;
    if (!supplied || supplied.status !== 'Visual draft' || !['carousel','image'].includes(supplied.type)) return null;
    const slides = arr(supplied.slides).map((slide, index) => {
      const value = typeof slide === 'string' ? {src:slide} : slide || {};
      return {src:safePostAsset(value.src, post.id),alt:text(value.alt) || `${post.title} — visual draft slide ${index + 1}`};
    }).filter(slide => slide.src);
    const cover = safePostAsset(supplied.cover, post.id) || slides[0]?.src || '';
    if (!cover) return null;
    if (!slides.length) slides.push({src:cover,alt:text(post.altText) || `${post.title} — visual draft`});
    return {status:'Visual draft',type:supplied.type,cover,slides,download:safePostAsset(supplied.download, post.id, true)};
  }
  function feedTheme(client) {
    const colour = arr(client.brand.palette).find(item => /^#[0-9a-fA-F]{6}$/.test(item.hex || ''))?.hex || '#343f32';
    const channels = [1,3,5].map(index => parseInt(colour.slice(index,index+2),16)/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
    const luminance = channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
    const darkChannels = [0x24,0x28,0x25].map(value => value/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
    const darkLuminance = darkChannels[0]*.2126+darkChannels[1]*.7152+darkChannels[2]*.0722;
    const contrastDark = (Math.max(luminance,darkLuminance)+.05)/(Math.min(luminance,darkLuminance)+.05);
    const contrastWhite = 1.05/(luminance+.05);
    return `--feed-bg:${colour};--feed-ink:${contrastDark >= contrastWhite ? '#242825' : '#ffffff'}`;
  }
  function instagramIdentity(client) {
    const supplied = typeof client.instagram === 'object' ? client.instagram.url : client.instagram;
    const url = safeURL(supplied);
    if (!url) return '<span class="feed-identity-gap">Identity not verified</span>';
    const parsed = new URL(url);
    const handle = /(^|\.)instagram\.com$/i.test(parsed.hostname) ? parsed.pathname.split('/').filter(Boolean)[0] : '';
    if (!handle || !/^[a-zA-Z0-9._]+$/.test(handle) || ['p','reel','stories','explore','accounts'].includes(handle)) return '<span class="feed-identity-gap">Identity not verified</span>';
    return `<a class="feed-handle" href="${esc(url)}" target="_blank" rel="noopener noreferrer">@${esc(handle)} ${icon('external',13)}</a>`;
  }
  function feedTile(post) {
    const client = getClient(post._client);
    const preview = postPreview(post);
    const available = preview ? previewAvailability.get(preview.cover) : 'failed';
    const ready = available === 'loaded';
    const pending = preview && available !== 'failed';
    return `<button class="feed-tile" type="button" data-post="${esc(post.id)}" data-feed-tile="${esc(post.id)}" data-open-tab="media" aria-label="Open ${esc(post.title)}, ${esc(dateLabel(post.date))}, ${ready ? 'visual draft' : 'brief only or preview pending'}"><span class="feed-artwork${ready ? ' has-preview' : ''}" style="${feedTheme(client)}"><span class="brief-only-art"><span class="brief-art-format">${esc(post.format)}</span><strong>${esc(post.title)}</strong><span class="brief-art-label">Brief only</span></span>${pending ? `<img src="${esc(preview.cover)}" alt="${esc(preview.slides[0]?.alt || post.title)}" loading="lazy" decoding="async" width="1080" height="1440" data-feed-preview="${esc(post.id)}">` : ''}${preview?.type === 'carousel' ? `<span class="feed-carousel-symbol" aria-label="Carousel">${icon('copy',17)}</span>` : ''}</span><span class="feed-tile-meta"><time datetime="${esc(post.date)}">${esc(dateLabel(post.date))}</time><span data-feed-status>${ready ? 'Visual draft' : pending ? 'Loading preview' : 'Brief only'}</span></span><span class="feed-tile-title">${esc(post.title)}</span></button>`;
  }
  function renderPlannedFeed(rows) {
    const produced = rows.filter(post => postPreview(post));
    const producedGallery = produced.length ? `<section class="produced-gallery"><div class="section-head"><h2>Created image drafts</h2><span class="proposal-label">${produced.length} posts · open to view every slide</span></div><p>Real artwork is available below. Open a post to see the full-size carousel, its caption and downloads.</p><div class="feed-grid" aria-label="Created image drafts across clients">${produced.map(feedTile).join('')}</div></section>` : '';
    if (state.client === 'all') return `${producedGallery}<section class="feed-chooser"><div class="section-head"><h2>Choose a client feed</h2><span class="proposal-label">Drafts, not live profiles</span></div><p>Open one client to see the planned visual sequence. Original supplied logos remain separate from post artwork; a brief-only tile is a planning aid.</p><div class="feed-client-list">${clients.map(client => `<button type="button" class="feed-client-choice" data-feed-client="${esc(client.id)}">${logo(client,true)}<span><strong>${esc(client.name)}</strong><span>${esc(client.location)}</span>${logoStatus(client)}</span><span aria-hidden="true">↗</span></button>`).join('')}</div></section>`;
    const client = getClient(state.client);
    if (!client) return empty('Choose a client to preview its feed');
    const ordered = [...rows].sort((a,b) => state.feedOrder === 'latest' ? b.date.localeCompare(a.date) || b.id.localeCompare(a.id) : a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    return `<section class="planned-feed"><header class="feed-profile">${logo(client,true)}<div class="feed-profile-copy"><div class="feed-profile-title"><h2>${esc(client.name)}</h2><span class="draft-badge">Planning preview</span></div>${instagramIdentity(client)}<p>${esc(client.location)}</p><div class="feed-profile-status">${logoStatus(client)}<span>Not a live Instagram profile</span></div></div><button type="button" class="button secondary" data-view="brand">Brand & evidence</button></header><div class="feed-toolbar"><div><strong>Planned posts</strong><p>${rows.length} drafts match the current filters. Brief-only tiles are not finished artwork.</p></div><label>Order <select id="feed-order"><option value="earliest"${state.feedOrder === 'earliest' ? ' selected' : ''}>Earliest planned first</option><option value="latest"${state.feedOrder === 'latest' ? ' selected' : ''}>Latest planned first</option></select></label></div>${ordered.length ? `<div class="feed-grid" aria-label="${esc(client.name)} planned post grid">${ordered.map(feedTile).join('')}</div>` : empty('No posts match this feed selection','Adjust the date, format, pillar or search filters to see the client’s planned drafts.')}</section>`;
  }
  function renderMedia(post) {
    const preview = postPreview(post);
    if (!preview) return `<div class="media-brief-only"><span class="proposal-label">Brief only</span><h3>Artwork has not been supplied for this post.</h3><p>The copy and production brief are ready to review in the other tabs. The feed’s typographic tile is a planning aid, not a produced post.</p></div>`;
    state.previewIndex = Math.max(0,Math.min(state.previewIndex,preview.slides.length-1));
    const slide = preview.slides[state.previewIndex];
    const unavailable = previewAvailability.get(slide.src) === 'failed';
    const previous = state.previewIndex > 0;
    const next = state.previewIndex < preview.slides.length-1;
    return `<div class="media-viewer${unavailable ? ' is-missing' : ''}" data-media-post="${esc(post.id)}"><div class="media-frame"><img src="${esc(slide.src)}" alt="${esc(slide.alt)}" width="1080" height="1440" decoding="async" data-media-image="${esc(post.id)}"${unavailable ? ' hidden' : ''}><div class="media-missing"${unavailable ? '' : ' hidden'}><span class="proposal-label">Brief only</span><p>This artwork file is unavailable. The copy and brief remain available in the other tabs.</p></div></div><div class="media-controls"><button type="button" class="button secondary" data-media-nav="previous" aria-label="Previous slide"${previous ? '' : ' disabled'}>${icon('left',16)} Previous</button><p role="status" aria-live="polite">Slide ${state.previewIndex+1} of ${preview.slides.length}</p><button type="button" class="button secondary" data-media-nav="next" aria-label="Next slide"${next ? '' : ' disabled'}>Next ${icon('right',16)}</button></div><p class="media-draft-status">Visual draft · final rights, fact and human approval checks still apply.</p><div class="media-alt"><strong>Slide alt text</strong><p>${esc(slide.alt)}</p></div><div class="media-downloads"><a class="button secondary" href="${esc(slide.src)}" download="${esc(post.id)}-${String(state.previewIndex+1).padStart(2,'0')}.png" data-current-download${unavailable ? ' hidden' : ''}>Download slide</a><a class="text-link" href="${esc(slide.src)}" target="_blank" rel="noopener noreferrer" data-current-download${unavailable ? ' hidden' : ''}>Open full-size ${icon('external',13)}</a>${preview.download ? `<a class="button secondary" href="${esc(preview.download)}" download>Download set</a>` : ''}</div></div>`;
  }
  function moveMedia(direction) {
    const post = posts.find(item => item.id === state.openPost);
    const preview = post && postPreview(post);
    if (!preview) return;
    state.previewIndex = Math.max(0,Math.min(preview.slides.length-1,state.previewIndex+(direction === 'next' ? 1 : -1)));
    const host = $('#media-view-container',dialog);
    if (!host) return;
    host.innerHTML = renderMedia(post);
    let target = [...host.querySelectorAll('[data-media-nav]')].find(button => button.dataset.mediaNav === direction && !button.disabled);
    if (!target) target = [...host.querySelectorAll('[data-media-nav]')].find(button => !button.disabled);
    (target || host).focus({preventScroll:true});
  }

  function sourceDetails(source, expanded = false) {
    const heading = `${source.id ? `${source.id} · ` : ''}${source.title || 'Source'}`;
    const body = `${source.status ? evidenceTag(source.status) : ''}${source.observed ? `<p>Observed ${esc(source.observed)}</p>` : ''}${source.establishes || source.summary ? `<p>${esc(text(source.establishes || source.summary))}</p>` : ''}${source.limitation ? `<p><strong>Limit:</strong> ${esc(text(source.limitation))}</p>` : ''}${external(source.url, 'Open primary source')}`;
    return expanded ? `<div class="source-card"><h4>${esc(heading)}</h4>${body}</div>` : `<details class="source-details"><summary>${esc(heading)}</summary><div class="source-body">${body}</div></details>`;
  }
  function referencesMarkup(references) {
    return `<div class="reference-list">${references.map(ref => `<div class="reference-item">${external(ref.url, ref.name || ref.title || ref.business || 'Category reference') || `<strong>${esc(ref.name || ref.title || 'Category reference')}</strong>`}${ref.observed ? `<small>Observed ${esc(ref.observed)}</small>` : ''}<p>${esc(text(ref.principle || ref.application || ref.detail || 'Reference details to confirm.'))}</p>${ref.avoid ? `<p class="avoid"><strong>Do not transfer:</strong> ${esc(text(ref.avoid))}</p>` : ''}</div>`).join('')}</div>`;
  }
  function renderBrands() {
    const query = state.query.trim().toLowerCase();
    const scope = clientScope().filter(client => !query || hashText([client.name, client.location, client.brand, client.audit, client.assetNeeds, client.references]).includes(query));
    if (!scope.length) return empty('No brand evidence matches this search', 'Try a client name, product, colour or a shorter search.');
    return scope.map(client => {
      const brand = client.brand;
      const fonts = arr(brand.fonts);
      const palette = arr(brand.palette);
      const ig = typeof client.instagram === 'object' ? client.instagram.url : client.instagram;
      return `<article class="brand-report" id="brand-${esc(client.id)}"><header class="brand-report-header">${logo(client, true)}<div><h2>${esc(client.name)}</h2><p>${esc(client.location)}</p>${logoStatus(client)}</div><div class="brand-links">${external(ig, 'Instagram', 'button secondary small')}${websiteLinks(client)}${threadLink(client, true)}</div></header><div class="brand-body">${clientStrategy(client)}<p class="brand-status">${esc(text(brand.status || 'Brand approval not verified.'))}</p><div class="brand-grid"><div><section class="report-block"><h3>The characteristic detail</h3><p>${esc(text(brand.detail))}</p></section><section class="report-block"><h3>Palette</h3><div class="palette">${palette.map(colour => `<div class="swatch"><span class="swatch-colour" style="background:${/^#[0-9a-fA-F]{6}$/.test(colour.hex || '') ? colour.hex : '#dedfd6'}" aria-hidden="true"></span><span class="swatch-name">${esc(colour.name)}</span><span class="swatch-hex">${esc(colour.hex)}</span></div>`).join('')}</div><p>Read the brand status above. A proposed or sampled colour is not a confirmed brand standard.</p></section><section class="report-block"><h3>Typography</h3>${fonts.map(font => `<div class="font-sample"><strong>${esc(font.name)}</strong><p>${esc(font.reason)}</p></div>`).join('')}</section></div><div><section class="report-block"><h3>Layout direction</h3><p>${esc(text(brand.layout))}</p></section><section class="report-block"><h3>Voice</h3><p>${esc(text(brand.voice))}</p></section><section class="report-block"><h3>Supplied logo status</h3><p>${esc(text(brand.logo?.status || 'Original logo / approval not verified.'))}</p></section><div class="rights-note"><strong>Rights and approval limits</strong>${esc(text(brand.rights || 'Rights not verified.'))}</div></div></div></div><section class="report-section"><h3>Profile & source audit</h3><div>${client.audit.map(item => `<div class="audit-row"><div>${evidenceTag(item.status)}${item.observed ? `<small>${esc(item.observed)}</small>` : ''}</div><div><p>${esc(item.finding)}</p>${item.implication ? `<p class="implication"><strong>What this means:</strong> ${esc(item.implication)}</p>` : ''}</div></div>`).join('') || '<p class="section-note">Profile inspection not yet recorded.</p>'}</div></section><section class="report-section"><h3>Assets & confirmations needed</h3><ul class="needs-list">${client.assetNeeds.map(need => `<li>${esc(text(need))}</li>`).join('')}</ul></section><section class="report-section"><h3>Applied category references</h3>${referencesMarkup(client.references)}</section><section class="report-section"><h3>Source register</h3>${client.sources.map(source => sourceDetails(source)).join('') || '<p class="section-note">Source register not available.</p>'}</section><section class="report-section">${threadLink(client)}</section></article>`;
    }).join('');
  }

  function knowledgeItem(item, index) {
    const title = item.title || item.question || item.name || `Research item ${index + 1}`;
    const lead = item.question && item.question !== title ? item.question : item.summary || item.description || item.detail || '';
    const sections = [['finding', 'Finding / evidence'], ['action', 'Application'], ['nextAction', 'Next research or test'], ['limitation', 'Limit'], ['metric', 'Measure'], ['hypothesis', 'Hypothesis'], ['method', 'Method']];
    const fields = sections.filter(([key]) => item[key]).map(([key, label]) => `<div><strong>${label}</strong>${esc(text(item[key]))}</div>`).join('');
    const sourceLinks = arr(item.sourceIds).map(id => sourceMap.get(String(id))).filter(Boolean).map(source => external(source.url, source.title || source.id)).filter(Boolean);
    return `<article class="knowledge-item"><div class="knowledge-item-top"><span class="item-number">${esc(item.id || String(index + 1).padStart(2, '0'))}</span>${item.category ? `<span class="category-label">${esc(text(item.category))}</span>` : ''}${item.status ? evidenceTag(item.status) : ''}${item.observed ? `<span class="section-note">${esc(item.observed)}</span>` : ''}</div><h3>${esc(title)}</h3>${lead ? `<p>${esc(text(lead))}</p>` : ''}${fields ? `<div class="knowledge-fields">${fields}</div>` : ''}<div class="knowledge-links">${external(item.url || item.sourceUrl, 'Read source')}${sourceLinks.join('')}</div></article>`;
  }
  function renderResearch() {
    const sourceItems = state.researchTab === 'guidance' ? arr(data.guidance) : state.researchTab === 'questions' ? arr(data.research) : [];
    const categories = [...new Set(sourceItems.map(item => text(item.category)).filter(Boolean))].sort();
    const query = state.query.trim().toLowerCase();
    const filtered = sourceItems.filter(item => (state.researchCategory === 'all' || text(item.category) === state.researchCategory) && (!query || hashText(item).includes(query)));
    const tabs = `<div class="knowledge-tools"><div class="knowledge-tabs" aria-label="Research sections"><button type="button" data-research-tab="guidance" aria-pressed="${state.researchTab === 'guidance'}">Meta guidance <span class="quiet-count">${arr(data.guidance).length}</span></button><button type="button" data-research-tab="questions" aria-pressed="${state.researchTab === 'questions'}">Research questions <span class="quiet-count">${arr(data.research).length}</span></button><button type="button" data-research-tab="references" aria-pressed="${state.researchTab === 'references'}">Category references</button></div>${state.researchTab !== 'references' ? `<label><span class="sr-only">Research category</span><select id="research-category"><option value="all">All categories</option>${categories.map(category => `<option value="${esc(category)}"${state.researchCategory === category ? ' selected' : ''}>${esc(category)}</option>`).join('')}</select></label>` : ''}</div>`;
    if (state.researchTab === 'references') {
      const scope = clientScope().filter(client => !query || hashText([client.name, client.references]).includes(query));
      return tabs + '<p class="research-intro">Real category examples inform a direction. Their prices, products, claims and identities are not transferred to these clients.</p>' + (scope.length ? scope.map(client => `<section class="surface surface-pad" style="margin-bottom:18px"><div class="section-head"><h2>${esc(client.name)}</h2><span class="section-note">${client.references.length} references</span></div>${referencesMarkup(client.references)}</section>`).join('') : empty('No references match this search'));
    }
    const intro = state.researchTab === 'guidance' ? 'Primary platform guidance is separated from proposed creative tests. Read the source, observation date and application before using a rule.' : 'These questions are a research backlog. A proposed experiment is not a completed test or a measured result. Findings and next actions remain distinct.';
    return tabs + `<p class="research-intro">${intro}</p><div class="section-head"><span class="research-count">${filtered.length} of ${sourceItems.length} items shown</span><span class="section-note">Programme-wide research</span></div>` + (filtered.length ? `<div class="knowledge-list">${filtered.map(knowledgeItem).join('')}</div>` : empty('No research matches these filters', 'Try another research category or a shorter search.'));
  }

  function renderProduction(rows) {
    const phases = [['01', 'Confirm', 'Identity, facts, availability and intended audience.'], ['02', 'Capture', 'Real assets, shot list, people and audio permissions.'], ['03', 'Build', 'Copy, motion, subtitles, alt text and channel crops.'], ['04', 'Review', 'Independent claim and actual-export review.'], ['05', 'Approve', 'Dated human approval of the exact version.']];
    return `<div class="production-strategies">${clientScope().map(client => clientStrategy(client, true)).join('')}</div><div class="production-path">${phases.map(([number, title, description]) => `<div class="phase"><span class="phase-number">${number}</span><h3>${title}</h3><p>${description}</p></div>`).join('')}</div><p class="planning-note">Read-only planning queue. These drafts are not scheduled; this dashboard does not record approvals or change the working status register. Each post’s conditions must be resolved before publication.</p><div class="section-head"><h2>Production queue</h2><span class="section-note">${rows.length} draft briefs</span></div>${rows.length ? `<div class="production-list">${rows.map(post => `<article class="production-item">${logo(getClient(post._client))}<div><span class="row-client">${esc(post._name)} · ${esc(dateLabel(post.date))} · ${esc(post.id)}</span><h3>${esc(post.title)}</h3><p>${esc(post.format)} · ${esc(post.pillar)}</p></div><div class="production-blocker"><strong>Asset brief</strong><p>${esc(post.asset || 'Asset confirmation required.')}</p></div><button type="button" class="button secondary small" data-post="${esc(post.id)}" data-open-tab="creative">Open brief ↗</button></article>`).join('')}</div>` : empty()}`;
  }

  function captureFocus() {
    const active = document.activeElement;
    if (!active || active === document.body || dialog.contains(active)) return null;
    const keys = ['view','client','clientView','feedClient','finishedClient','week','layout','researchTab','action'];
    const key = keys.find(name => active.dataset?.[name] !== undefined);
    return { id: active.id || '', key, value: key ? active.dataset[key] : '', start: typeof active.selectionStart === 'number' ? active.selectionStart : null, end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null };
  }
  function focusViewTitle() {
    const title = $('#view-title');
    title.tabIndex = -1;
    title.focus({preventScroll:true});
  }
  function restoreFocus(previous) {
    if (!previous) return;
    let target = previous.id ? document.getElementById(previous.id) : null;
    if (!target && previous.key) target = [...document.querySelectorAll('button')].find(button => button.dataset[previous.key] === previous.value);
    if (target?.disabled && previous.key === 'week') target = $('#week-jump');
    if (!target || target.disabled) { focusViewTitle(); return; }
    target.focus({preventScroll:true});
    if (previous.start !== null && typeof target.setSelectionRange === 'function') {
      try { target.setSelectionRange(previous.start, previous.end); } catch (_) { /* Non-text inputs do not expose text selection. */ }
    }
  }
  function websiteLinks(client) {
    const official = typeof client.website === 'object' ? client.website.url : client.website;
    const explicitPreview = typeof client.previewWebsite === 'object' ? client.previewWebsite.url : client.previewWebsite;
    const legacyRetailPreview = ['tw-fresh-food-centre','the-local-shop'].includes(client.id) && /github\.io\//i.test(official || '');
    const preview = explicitPreview || (legacyRetailPreview ? official : '');
    return `${official && !legacyRetailPreview && official !== preview ? external(official, 'Website', 'button secondary small') : ''}${preview ? external(preview, 'Draft website preview — not a live business site', 'button secondary small preview-link') : ''}`;
  }
  function render() {
    const previousFocus = captureFocus();
    stopVideos($('#view-content'));
    updateFilters();
    renderNavigation();
    const rows = filteredPosts();
    const labels = VIEWS[state.view];
    $('#view-title').textContent = labels[1];
    $('#view-description').textContent = labels[2];
    const directionsView = state.view === 'directions';
    const finishedView = state.view === 'finished';
    const conceptsView = state.view === 'art-direction' || directionsView;
    $('#format-filter').closest('label').hidden = conceptsView;
    $('#pillar-filter').closest('label').hidden = conceptsView || finishedView;
    $('#date-toggle').hidden = conceptsView || finishedView;
    $('.export-actions').hidden = conceptsView;
    $('#search').placeholder = finishedView ? 'Search finished posts, clients, captions…' : directionsView ? 'Search client stories, sources, decisions…' : conceptsView ? 'Search rejected studies…' : 'Search held drafts and research…';
    $('#search').setAttribute('aria-label', finishedView ? 'Search finished posts, clients and captions' : directionsView ? 'Search client stories, sources and decisions' : conceptsView ? 'Search rejected photo studies' : 'Search held posts and research');
    if (conceptsView || finishedView) { $('#date-filters').hidden = true; $('#date-toggle').setAttribute('aria-expanded','false'); }
    $('.topbar > .draft-badge').textContent = finishedView ? 'Finished drafts' : 'Drafts · human acceptance pending';
    $('.draft-notice').hidden = finishedView;
    $('.draft-notice p').innerHTML = finishedView ? 'This gallery contains produced review exports. Open a post for its actual media, captions, alt text and download pack. <span>No social account is connected or published by this dashboard.</span>' : 'The previous 21 slides were rejected. All 182 earlier calendar drafts are held for rebriefing; their caption copying is disabled. Open Direction reset for the new story briefs and source gaps. <span>No final social release or guaranteed result is implied.</span>';
    $('#result-status').textContent = finishedView ? `${filteredFinished().length} produced exports shown · ${finishedPosts.filter(p => !finishedUnavailable.has(p.id)).length} in the finished collection · review drafts, not live posts` : directionsView ? `${directionRows().length} proposed client directions · source qualification and human creative acceptance pending` : conceptsView ? `${conceptRows().length} rejected studies preserved for comparison · client and search filters apply` : state.view === 'research' ? 'Research is shared across the programme. Client selection filters the category reference library.' : state.view === 'brand' ? `${clientScope().length} client workspace${clientScope().length === 1 ? '' : 's'} · profile access and approval limits shown below` : `${rows.length} of ${posts.length} held drafts · rebriefing required · ${dateLabel(state.from)}—${dateLabel(state.to)} 2026`;
    $('#view-content').innerHTML = finishedView ? renderFinished() : directionsView ? renderDirections() : state.view === 'overview' ? renderOverview(rows) : state.view === 'calendar' ? renderCalendar(rows) : state.view === 'feed' ? renderFeed(rows) : state.view === 'art-direction' ? renderArtDirection() : state.view === 'posts' ? (rows.length ? postList(rows) : empty()) : state.view === 'brand' ? renderBrands() : state.view === 'research' ? renderResearch() : renderProduction(rows);
    document.querySelectorAll('[data-concept-copy]').forEach(button => { button.disabled = true; button.title = 'Rejected creative: caption copying is held for rebriefing'; });
    document.title = `${state.client === 'all' ? labels[0] : getClient(state.client)?.name || labels[0]} · Social studio · Elk`;
    syncURL();
    restoreFocus(previousFocus);
  }

  function postSources(post) {
    const client = getClient(post._client);
    return arr(post.sourceIds).map(id => client?.sources.find(source => source.id === id) || sourceMap.get(String(id)) || { id, title: 'Source details not available', status: 'NOT VERIFIED', limitation: 'The reference must be reconciled before publication.' });
  }
  function copyBlock(label, value, key) {
    return `<section class="copy-block"><div class="copy-block-head"><h3>${esc(label)}</h3><button class="button secondary small" type="button" data-copy="${key}">${icon('copy', 12)} Copy</button></div><pre class="copy-content">${esc(text(value))}</pre></section>`;
  }
  function bulletBlock(title, items, numbered = true) {
    const tag = numbered ? 'ol' : 'ul';
    return `<section class="brief-block"><h3>${esc(title)}</h3><${tag} class="brief-list">${arr(items).map(item => `<li>${esc(text(item))}</li>`).join('')}</${tag}></section>`;
  }
  function renderDialog() {
    const finished = finishedPosts.find(item => item.id === state.openPost);
    if (finished && state.view === 'finished') { renderFinishedDialog(finished); return; }
    const post = posts.find(item => item.id === state.openPost);
    if (!post) return;
    const client = getClient(post._client);
    const sources = postSources(post);
    const onScreen = text(post.onScreen);
    $('#dialog-content').innerHTML = `<header class="dialog-head"><div class="dialog-topline">${logo(client)}<span>${esc(client.name)}</span><span>·</span><span>${esc(post.id)}</span></div><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close post detail">×</button><h2 id="post-dialog-title">${esc(post.title)}</h2><p class="dialog-hook">${esc(post.hook)}</p><div class="dialog-meta"><span>${esc(dateLabel(post.date, { weekday: 'long', year: 'numeric' }))}</span>${formatTag(post)}<span>${esc(post.pillar)}</span>${post.series ? `<span class="series-label">Series · ${esc(post.series)}</span>` : ''}<span class="draft-badge">Draft</span></div><p class="dialog-slot"><span>UK · ${esc(post.time || 'Proposed slot to confirm · Europe/London')}${post.ukZone ? ` · ${esc(post.ukZone)}` : ''}</span>${post.indiaTime ? `<span class="india-time">India · ${esc(post.indiaTime)}</span>` : ''}</p></header><div class="dialog-tabs" role="tablist" aria-label="Post details">${[['media', 'Media preview'], ['copy', 'Copy & captions'], ['creative', 'Creative brief'], ['evidence', 'Evidence & approval']].map(([key, label]) => `<button type="button" id="tab-${key}" role="tab" aria-selected="${state.dialogTab === key}" aria-controls="panel-${key}" tabindex="${state.dialogTab === key ? '0' : '-1'}" data-dialog-tab="${key}">${label}</button>`).join('')}</div><div class="dialog-body"><section id="panel-media" role="tabpanel" aria-labelledby="tab-media"${state.dialogTab !== 'media' ? ' hidden' : ''}><div id="media-view-container" tabindex="-1">${renderMedia(post)}</div></section><section id="panel-copy" role="tabpanel" aria-labelledby="tab-copy"${state.dialogTab !== 'copy' ? ' hidden' : ''}><p class="dialog-draft-note">Earlier copy is held for rebriefing. Use the new Direction reset brief.</p>${copyBlock('Instagram caption', post.caption, 'instagram')}${copyBlock('Facebook caption', post.facebookCaption, 'facebook')}${copyBlock('Call to action', post.cta, 'cta')}</section><section id="panel-creative" role="tabpanel" aria-labelledby="tab-creative"${state.dialogTab !== 'creative' ? ' hidden' : ''}><section class="brief-block"><h3>On-screen text</h3><div class="on-screen">${esc(onScreen)}</div></section>${bulletBlock('Shot / slide plan', post.production)}<section class="brief-block"><h3>Motion direction</h3><p>${esc(text(post.motion))}</p></section>${bulletBlock('Story companion', post.story)}${copyBlock('Alt text · match to the final export', post.altText, 'alt')}<section class="brief-block"><h3>Asset brief</h3><p>${esc(text(post.asset))}</p></section></section><section id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence"${state.dialogTab !== 'evidence' ? ' hidden' : ''}><p class="dialog-draft-note">No approval is implied by a draft, a logo or a completed brief. These conditions remain attached to the final version.</p>${bulletBlock('Before publication', post.approvalNeeds, false)}<section class="brief-block"><h3>Test hypothesis</h3><p>${esc(text(post.hypothesis))}</p></section><section class="brief-block"><h3>What to measure</h3><p>${esc(text(post.metric))}</p></section><section class="brief-block"><h3>Source evidence & limits</h3>${sources.map(source => sourceDetails(source, true)).join('') || '<p>Source evidence needs confirmation.</p>'}</section><section class="brief-block"><h3>Brand / rights status</h3><p>${esc(text(client.brand.logo?.status))}</p><p>${esc(text(client.brand.rights))}</p></section></section><div class="dialog-actions"><button type="button" class="button yellow" data-copy="brief">${icon('copy', 13)} Copy entire brief</button><button type="button" class="button secondary" data-copy="link">Copy post link</button>${threadLink(client, true)}<p>Draft only · no account publishing is connected.</p></div></div>`;
    $('.dialog-draft-note', dialog).textContent = 'This earlier calendar draft is held for rebriefing. Its creative direction was rejected; use Direction reset for the new brief. Copying old captions is disabled.';
    dialog.querySelectorAll('[data-copy]:not([data-copy="link"])').forEach(button => { button.disabled = true; button.title = 'Held for rebriefing'; });
  }

  function openPost(id, tab = '', trigger = null) {
    const selectedPost = state.view === 'finished' ? finishedPosts.find(post => post.id === id) : posts.find(post => post.id === id);
    if (!selectedPost) return;
    lastPostTrigger = trigger || document.activeElement;
    state.openPost = id;
    stopVideos(dialog);
    state.dialogTab = selectedPost._finished ? (['media','copy','evidence'].includes(tab) ? tab : 'media') : ['media', 'copy', 'creative', 'evidence'].includes(tab) ? tab : (postPreview(selectedPost) ? 'media' : 'copy');
    state.previewIndex = 0;
    renderDialog();
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    $('.dialog-close', dialog)?.focus();
    syncURL();
  }
  function closeDialog() {
    if (dialog.open) dialog.close();
    finishDialogClose();
  }
  function finishDialogClose() {
    if (dialog.open) return;
    stopVideos(dialog);
    state.openPost = '';
    const toast = $('#toast');
    if (toast) document.body.append(toast);
    $('#dialog-content').innerHTML = '';
    document.body.style.overflow = '';
    syncURL();
    if (lastPostTrigger?.isConnected) lastPostTrigger.focus();
  }
  function setDialogTab(key, focus = true) {
    if (!['media', 'copy', 'creative', 'evidence'].includes(key)) return;
    if (!$(`#tab-${key}`,dialog)) return;
    if (key !== 'media') stopVideos(dialog);
    state.dialogTab = key;
    for (const tab of dialog.querySelectorAll('[role=tab]')) {
      const active = tab.dataset.dialogTab === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of dialog.querySelectorAll('[role=tabpanel]')) panel.hidden = panel.id !== `panel-${key}`;
    if (focus) {
      const selectedTab = $(`#tab-${key}`, dialog);
      selectedTab?.focus();
      selectedTab?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
    }
  }

  function entireBrief(post) {
    const client = getClient(post._client);
    const lines = [
      `${client.name} · ${post.id} · DRAFT`, `${post.title}`, `${post.date} · UK: ${post.time}${post.ukZone ? ` · ${post.ukZone}` : ''}${post.indiaTime ? ` · India: ${post.indiaTime}` : ''}`, `${post.format} · ${post.pillar}${post.series ? ` · Series: ${post.series}` : ''}`,
      '\nHOOK', post.hook, '\nINSTAGRAM CAPTION', post.caption, '\nFACEBOOK CAPTION', post.facebookCaption, '\nCALL TO ACTION', post.cta,
      '\nON-SCREEN TEXT', text(post.onScreen), '\nSHOT / SLIDE PLAN', arr(post.production).map((x, i) => `${i + 1}. ${text(x)}`).join('\n'),
      '\nMOTION', post.motion, '\nSTORY COMPANION', arr(post.story).map((x, i) => `${i + 1}. ${text(x)}`).join('\n'),
      '\nALT TEXT — CHECK AGAINST FINAL EXPORT', post.altText, '\nASSETS', post.asset, '\nHYPOTHESIS', post.hypothesis, '\nMEASURE', post.metric,
      '\nBEFORE PUBLICATION', arr(post.approvalNeeds).map(x => `□ ${text(x)}`).join('\n'), '\nSOURCES', postSources(post).map(source => `${source.id || ''} · ${source.title || ''}\n${source.status || ''} · ${source.observed || ''}\n${source.establishes || ''}\nLimit: ${source.limitation || ''}${safeURL(source.url) ? `\n${safeURL(source.url)}` : ''}`).join('\n\n'),
      '\nBRAND / RIGHTS', text(client.brand.status), text(client.brand.rights), '\nNo publishing or approval is implied by this draft.'
    ];
    return lines.map(text).join('\n');
  }
  function showToast(message) {
    clearTimeout(toastTimer);
    const toast = $('#toast');
    (dialog.open ? dialog : document.body).append(toast);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3200);
  }
  async function copyValue(key) {
    if (key !== 'link') { showToast('Earlier copy is held for rebriefing. Open Direction reset.'); return; }
    const post = posts.find(item => item.id === state.openPost);
    if (!post) return;
    const values = { instagram: post.caption, facebook: post.facebookCaption, cta: post.cta, alt: post.altText, brief: entireBrief(post), link: location.href };
    const label = key === 'brief' ? 'Entire draft brief copied' : key === 'link' ? 'Post link copied' : `${key === 'instagram' ? 'Instagram caption' : key === 'facebook' ? 'Facebook caption' : key === 'alt' ? 'Alt text' : 'Call to action'} copied`;
    await copyText(text(values[key]), label);
  }
  async function copyConcept() { showToast('Rejected study: copying is held for rebriefing.'); }
  async function copyText(value, label) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const field = document.createElement('textarea');
        field.value = value;
        field.setAttribute('readonly', '');
        field.style.cssText = 'position:fixed;top:-9999px;left:0';
        (dialog.open ? dialog : document.body).append(field);
        field.select();
        const copied = document.execCommand('copy');
        field.remove();
        if (!copied) throw new Error('Clipboard unavailable');
      }
      showToast(label);
    } catch (_) { showToast('Clipboard is unavailable here. Select the text and copy it with your keyboard.'); }
  }

  function download(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportCSV() {
    if (state.view === 'finished') {
      const rows = filteredFinished();
      const cell = value => { let clean = text(value); if (/^\s*[=+@-]/.test(clean) || /^[\t\r]/.test(clean)) clean = `'${clean}`; return `"${clean.replace(/"/g,'""')}"`; };
      const columns = ['Client','Post ID','Title','Type','Version','Status','Instagram caption','Facebook caption','Alt text','Download pack','Review status','Review scope'];
      const csv = [columns,...rows.map(p => [p._name,p.id,p.title,p.type,p.version,p.status,p.caption,p.facebookCaption,finishedAlt(p),p.download,p.review?.status,p.review?.scope])].map(row => row.map(cell).join(',')).join('\r\n');
      download('\uFEFF'+csv,`elk-finished-drafts-${state.client}.csv`,'text/csv;charset=utf-8');
      showToast(`${rows.length} finished draft records exported`); return;
    }
    const rows = filteredPosts();
    const columns = ['Client', 'Post ID', 'Date', 'Proposed Europe/London time', 'UK zone', 'India time', 'Format', 'Pillar', 'Series', 'Title', 'Hook', 'Instagram caption', 'Facebook caption', 'CTA', 'On-screen text', 'Production', 'Motion', 'Stories', 'Alt text', 'Assets', 'Hypothesis', 'Metric', 'Approval conditions', 'Source IDs', 'Status'];
    const csvCell = value => {
      let clean = text(value);
      if (/^\s*[=+@-]/.test(clean) || /^[\t\r]/.test(clean)) clean = `'${clean}`;
      return `"${clean.replace(/"/g, '""')}"`;
    };
    const content = [columns, ...rows.map(post => [post._name, post.id, post.date, post.time, post.ukZone || '', post.indiaTime || '', post.format, post.pillar, post.series || '', post.title, post.hook, post.caption, post.facebookCaption, post.cta, post.onScreen, post.production, post.motion, post.story, post.altText, post.asset, post.hypothesis, post.metric, post.approvalNeeds, post.sourceIds, 'Draft'])].map(row => row.map(csvCell).join(',')).join('\r\n');
    download('\uFEFF' + content, `elk-social-drafts-${state.client}-${state.from}-${state.to}.csv`, 'text/csv;charset=utf-8');
    showToast(`${rows.length} draft posts exported as CSV`);
  }
  function exportJSON() {
    if (state.view === 'finished') {
      const ids = new Set(filteredFinished().map(p => p.id));
      const payload = {...finishedData,posts:arr(finishedData?.posts).filter(p => ids.has(p.id))};
      download(JSON.stringify(payload,null,2)+'\n',`elk-finished-drafts-${state.client}.json`,'application/json;charset=utf-8');
      showToast(`${ids.size} finished draft records exported`); return;
    }
    const rows = filteredPosts();
    const selectedIds = new Set(rows.map(post => post.id));
    const exported = { title: 'Elk Social studio · draft planning export', version: '2.0', status: 'Held for rebriefing — no publication approval', period: { from: state.from, to: state.to, timezone: 'Europe/London' }, filters: { client: state.client, format: state.format, pillar: state.pillar, query: state.query }, clients: clientScope().map(client => ({ ...client, posts: client.posts.filter(post => selectedIds.has(post.id)).map(({ _client, _name, ...post }) => post) })), guidance: data.guidance, research: data.research, threads: data.threads };
    download(JSON.stringify(exported, null, 2) + '\n', `elk-social-drafts-${state.client}-${state.from}-${state.to}.json`, 'application/json;charset=utf-8');
    showToast(`${rows.length} draft posts exported as JSON`);
  }

  function resetFilters() {
    state.client = 'all'; state.query = ''; state.format = 'all'; state.pillar = 'all'; state.from = START; state.to = END; state.researchCategory = 'all';
    render();
  }
  function setView(view) {
    if (!VIEWS[view]) return;
    closeDialog();
    state.view = view;
    render();
    focusViewTitle();
    $('#view-title').scrollIntoView({ block: 'start', behavior: 'instant' });
  }

  function updatePreviewImage(image, success) {
    const src = image.getAttribute('src');
    previewAvailability.set(src,success ? 'loaded' : 'failed');
    if (image.dataset.feedPreview) {
      const tile = image.closest('.feed-tile');
      const artwork = image.closest('.feed-artwork');
      artwork?.classList.toggle('has-preview',success);
      image.hidden = !success;
      const status = tile?.querySelector('[data-feed-status]');
      if (status) status.textContent = success ? 'Visual draft' : 'Brief only';
      const post = posts.find(post => post.id === image.dataset.feedPreview);
      if (tile && post) tile.setAttribute('aria-label', `Open ${post.title}, ${dateLabel(post.date)}, ${success ? 'visual draft' : 'brief only'}`);
    }
    if (image.dataset.mediaImage) {
      const viewer = image.closest('.media-viewer');
      viewer?.classList.toggle('is-missing',!success);
      image.hidden = !success;
      const message = viewer?.querySelector('.media-missing');
      if (message) message.hidden = success;
      viewer?.querySelectorAll('[data-current-download]').forEach(link => { link.hidden = !success; });
      const status = viewer?.querySelector('.media-draft-status');
      if (status) status.textContent = success ? 'Visual draft · final rights, fact and human approval checks still apply.' : 'Brief only · the selected artwork file is unavailable.';
    }
  }
  function bindEvents() {
    document.addEventListener('load', event => { if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-concept-image')) { event.target.hidden = false; const missing = event.target.nextElementSibling; if (missing) missing.hidden = true; } },true);
    document.addEventListener('load',event => { if (event.target instanceof HTMLImageElement && (event.target.dataset.feedPreview || event.target.dataset.mediaImage)) updatePreviewImage(event.target,true); },true);
    document.addEventListener('error', event => {
      if (event.target instanceof HTMLImageElement && event.target.dataset.finishedImage) {
        const id = event.target.dataset.finishedImage;
        finishedUnavailable.add(id);
        const tile = event.target.closest('.finished-tile');
        event.target.hidden = true;
        if (tile) { tile.disabled = true; tile.querySelector('.finished-file-error').hidden = false; tile.setAttribute('aria-label','Media unavailable; excluded from finished count'); }
        if (state.view === 'finished') {
          render();
        }
      }
      if (event.target instanceof HTMLImageElement && event.target.dataset.finishedDetail) { event.target.hidden = true; event.target.nextElementSibling.hidden = false; }
      if (event.target instanceof HTMLVideoElement && event.target.classList.contains('finished-video')) { const message = event.target.parentElement.querySelector('.finished-player-error'); if (message) message.hidden = false; }
      if (event.target instanceof HTMLImageElement && event.target.hasAttribute('data-concept-image')) { event.target.hidden = true; const missing = event.target.nextElementSibling; if (missing) missing.hidden = false; }
      if (event.target instanceof HTMLImageElement && (event.target.dataset.feedPreview || event.target.dataset.mediaImage)) updatePreviewImage(event.target,false);
      if (event.target instanceof HTMLImageElement && event.target.closest('[data-logo]')) {
        event.target.hidden = true;
        const fallback = event.target.nextElementSibling;
        if (fallback) fallback.hidden = false;
      }
    }, true);
    document.addEventListener('click', event => {
      const target = event.target.closest('button');
      if (!target) return;
      if (target.dataset.view) setView(target.dataset.view);
      else if (target.dataset.finishedClient) { state.client = target.dataset.finishedClient; state.pillar = 'all'; setView('finished'); }
      else if (target.dataset.finishedPost) openPost(target.dataset.finishedPost,'media',target);
      else if (target.dataset.finishedNav) moveFinishedMedia(target.dataset.finishedNav);
      else if (target.dataset.finishedCopy) copyFinished(target.dataset.finishedCopy);
      else if (target.dataset.client) { state.client = target.dataset.client; state.pillar = 'all'; render(); }
      else if (target.dataset.clientView) { state.client = target.dataset.clientView; state.pillar = 'all'; setView('feed'); }
      else if (target.dataset.feedClient) { state.client = target.dataset.feedClient; state.pillar = 'all'; setView('feed'); }
      else if (target.dataset.post) openPost(target.dataset.post, target.dataset.openTab || 'copy', target);
      else if (target.dataset.week) { state.week = addDays(state.week, target.dataset.week === 'next' ? 7 : -7); render(); }
      else if (target.dataset.layout) { state.calendarMode = target.dataset.layout; render(); }
      else if (target.dataset.researchTab) { state.researchTab = target.dataset.researchTab; state.researchCategory = 'all'; render(); }
      else if (target.dataset.dialogTab) setDialogTab(target.dataset.dialogTab);
      else if (target.dataset.mediaNav) moveMedia(target.dataset.mediaNav);
      else if (target.dataset.copy) copyValue(target.dataset.copy);
      else if (target.dataset.conceptCopy) copyConcept(target.dataset.conceptCopy,target.dataset.conceptChannel);
      else if (target.dataset.directionCopy) { const c = directionReset?.clients.find(x => x.id === target.dataset.directionCopy); if (c) copyText(c.caption, 'Conditional draft copied · filmed proof and approval still required'); }
      else if (target.dataset.action === 'reload-directions') location.reload();
      else if (target.dataset.action === 'reload-finished') location.reload();
      else if (target.dataset.action === 'retry-art-direction') loadArtDirection();
      else if (target.dataset.action === 'reset') resetFilters();
      else if (target.dataset.action === 'close-dialog') closeDialog();
    });
    $('#client-filter').addEventListener('change', event => { state.client = event.target.value; state.pillar = 'all'; render(); });
    $('#format-filter').addEventListener('change', event => { state.format = event.target.value; render(); });
    $('#pillar-filter').addEventListener('change', event => { state.pillar = event.target.value; render(); });
    $('#search').addEventListener('input', event => { clearTimeout(searchTimer); state.query = event.target.value; searchTimer = setTimeout(render, 130); });
    $('#date-toggle').addEventListener('click', () => { const open = $('#date-filters').hidden; $('#date-filters').hidden = !open; $('#date-toggle').setAttribute('aria-expanded', String(open)); });
    for (const [id, key] of [['date-from', 'from'], ['date-to', 'to']]) $( `#${id}`).addEventListener('change', event => {
      if (!isDate(event.target.value)) return;
      state[key] = event.target.value < START ? START : event.target.value > END ? END : event.target.value;
      if (state.from > state.to) { if (key === 'from') state.to = state.from; else state.from = state.to; }
      render();
    });
    $('#clear-filters').addEventListener('click', resetFilters);
    $('#export-csv').addEventListener('click', exportCSV);
    $('#export-json').addEventListener('click', exportJSON);
    $('#view-content').addEventListener('change', event => {
      if (event.target.id === 'feed-order') { state.feedOrder = event.target.value === 'latest' ? 'latest' : 'earliest'; render(); }
      else if (event.target.id === 'week-jump') { state.week = event.target.value; render(); }
      else if (event.target.id === 'research-category') { state.researchCategory = event.target.value; render(); }
    });
    document.addEventListener('keydown', event => {
      if (event.key === '/' && !dialog.open && !/input|textarea|select/i.test(event.target.tagName)) { event.preventDefault(); $('#search').focus(); }
      if (dialog.open && event.target.closest('.finished-image-viewer') && ['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); moveFinishedMedia(event.key === 'ArrowRight' ? 'next' : 'previous'); }
      if (dialog.open && event.target.closest('.media-viewer') && ['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); moveMedia(event.key === 'ArrowRight' ? 'next' : 'previous'); }
      if (dialog.open && event.target.getAttribute('role') === 'tab' && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const keys = [...dialog.querySelectorAll('[role=tab]')].map(tab => tab.dataset.dialogTab);
        let index = keys.indexOf(state.dialogTab);
        index = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length-1 : (index + (event.key === 'ArrowRight' ? 1 : keys.length-1)) % keys.length;
        setDialogTab(keys[index]);
      }
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right) closeDialog(); } });
    dialog.addEventListener('close', finishDialogClose);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopVideos(); });
    window.addEventListener('popstate', () => { const next = new URLSearchParams(location.search); const id = next.get('post'); closeDialog(); state.view = VIEWS[next.get('view')] ? next.get('view') : 'finished'; state.client = clients.some(client => client.id === next.get('client')) ? next.get('client') : 'all'; render(); if (id) openPost(id); });
  }

  async function init() {
    $('#search-icon').innerHTML = icon('search', 15);
    if ($('.version')) $('.version').textContent = 'v3.0';
    bindEvents();
    try {
      const response = await fetch('./data.json', { credentials: 'omit' });
      if (!response.ok) throw new Error(`Data request returned ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.clients) || !payload.clients.length) throw new Error('No client data was supplied');
      data = { ...payload, guidance: arr(payload.guidance), research: arr(payload.research), threads: payload.threads || {} };
      clients = data.clients.map(normaliseClient);
      try {
        const response = await fetch('./finished-posts.json',{credentials:'omit',cache:'no-store'});
        if (!response.ok) throw new Error('Finished collection unavailable');
        const payload = await response.json();
        if (!payload || !Array.isArray(payload.posts)) throw new Error('Invalid finished collection');
        finishedData = payload;
        const ids = new Set();
        finishedPosts = payload.posts.map(normaliseFinished).filter(post => { if (!post || ids.has(post.id)) return false; ids.add(post.id); return true; });
        finishedState = 'loaded';
      } catch (_) { finishedState = 'unavailable'; }
      try { const response = await fetch('./direction-reset.json', { credentials: 'omit', cache: 'no-store' }); if (!response.ok) throw new Error('Direction data unavailable'); const next = await response.json(); if (!Array.isArray(next.clients) || next.clients.length !== 7 || next.clients.some(c => !clients.some(x => x.id === c.id))) throw new Error('Invalid client directions'); directionReset = next; } catch (_) { directionReset = null; }
      posts = clients.flatMap(client => client.posts).sort((a, b) => a.date.localeCompare(b.date) || a._name.localeCompare(b._name) || a.id.localeCompare(b.id));
      sourceMap = new Map([...clients.flatMap(client => client.sources), ...arr(payload.sources), ...data.guidance].map(source => [String(source.id), source]));
      if (!clients.some(client => client.id === state.client)) state.client = 'all';
      if (!['all', 'Reel', 'Carousel', 'Photo'].includes(state.format)) state.format = 'all';
      state.from = state.from < START ? START : state.from > END ? END : state.from;
      state.to = state.to < START ? START : state.to > END ? END : state.to;
      if (state.from > state.to) [state.from, state.to] = [state.to, state.from];
      if (state.week < FIRST_WEEK || state.week > LAST_WEEK) state.week = FIRST_WEEK;
      $('#client-filter').innerHTML = '<option value="all">All clients</option>' + clients.map(client => `<option value="${esc(client.id)}">${esc(client.name)}</option>`).join('');
      const initialPost = state.openPost;
      const initialCollection = state.view === 'finished' ? finishedPosts : posts;
      if (!initialCollection.some(post => post.id === initialPost)) state.openPost = '';
      render();
      if (initialPost && initialCollection.some(post => post.id === initialPost)) openPost(initialPost);
      loadArtDirection();
      window.__ELK_STUDIO__ = Object.freeze({ version: '3.0', clients: clients.length, posts: posts.length, finishedPosts: finishedPosts.length, directions: directionReset?.clients.length || 0, getView: () => state.view });
    } catch (_) {
      $('#view-content').innerHTML = '<div class="error-note"><h2>The programme could not be opened</h2><p>The planner needs its sanitised <code>data.json</code> beside this page. Open the deployed team link or serve this folder through a local web server; browsers restrict data loading from a file opened directly.</p><p>No client account is connected, and no data has been changed.</p><button type="button" class="button secondary" id="retry-load" style="margin-top:15px">Try again</button></div>';
      $('#result-status').textContent = 'Programme data unavailable';
      $('#retry-load')?.addEventListener('click', () => location.reload());
      $('#export-csv').disabled = true;
      $('#export-json').disabled = true;
    }
  }
  init();
})();
