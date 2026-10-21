'use strict';

(() => {
  const START = '2026-10-22';
  const END = '2026-12-21';
  const VIEWS = {
    overview: ['Overview', 'Content programme', 'Seven distinct brands. One place to find the next draft, its copy and the work behind it.'],
    calendar: ['Calendar', 'The publishing calendar', 'Proposed dates and local times. Open any draft for its captions, creative brief and checks.'],
    feed: ['Feed', 'Planned Instagram feed', 'A draft feed for one client at a time. Produced artwork and brief-only ideas stay clearly distinct.'],
    posts: ['Posts', 'The post library', 'Find the right idea, copy the caption and give production a clear brief.'],
    brand: ['Brand & audit', 'Brand & profile evidence', 'The supplied identities, what was actually observed and what still needs confirming.'],
    research: ['Research', 'Research & guidance', 'Primary platform guidance, category references and a clearly labelled research backlog.'],
    production: ['Production', 'From draft to final creative', 'A practical queue for assets, production and review. Approval is recorded separately by the authorised people.']
  };
  const ICONS = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
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
    view: VIEWS[initialView] ? initialView : 'feed', client: params.get('client') || 'all',
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

  function syncURL() {
    const next = new URLSearchParams();
    if (state.client !== 'all') next.set('client', state.client);
    if (state.view !== 'overview') next.set('view', state.view);
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
    $('#client-nav').innerHTML = `<button type="button" class="client-button" data-client="all" aria-pressed="${state.client === 'all'}"><span class="brand-logo all-clients-icon">${icon('overview', 15)}</span><span>All clients</span><span class="client-number">${posts.length}</span></button>` + clients.map(client => `<button type="button" class="client-button" data-client="${esc(client.id)}" aria-pressed="${state.client === client.id}">${logo(client)}<span class="client-label"><span>${esc(client.name)}</span>${logoStatus(client)}</span><span class="client-number">${client.posts.length}</span></button>`).join('');
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
  function renderFeed(rows) {
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
    const keys = ['view','client','clientView','feedClient','week','layout','researchTab','action'];
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
    updateFilters();
    renderNavigation();
    const rows = filteredPosts();
    const labels = VIEWS[state.view];
    $('#view-title').textContent = labels[1];
    $('#view-description').textContent = labels[2];
    $('#result-status').textContent = state.view === 'research' ? 'Research is shared across the programme. Client selection filters the category reference library.' : state.view === 'brand' ? `${clientScope().length} client workspace${clientScope().length === 1 ? '' : 's'} · profile access and approval limits shown below` : `${rows.length} of ${posts.length} planned drafts · ${state.client === 'all' ? 'all clients' : getClient(state.client)?.name || 'selected client'} · ${dateLabel(state.from)}—${dateLabel(state.to)} 2026`;
    $('#view-content').innerHTML = state.view === 'overview' ? renderOverview(rows) : state.view === 'calendar' ? renderCalendar(rows) : state.view === 'feed' ? renderFeed(rows) : state.view === 'posts' ? (rows.length ? postList(rows) : empty()) : state.view === 'brand' ? renderBrands() : state.view === 'research' ? renderResearch() : renderProduction(rows);
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
    const post = posts.find(item => item.id === state.openPost);
    if (!post) return;
    const client = getClient(post._client);
    const sources = postSources(post);
    const onScreen = text(post.onScreen);
    $('#dialog-content').innerHTML = `<header class="dialog-head"><div class="dialog-topline">${logo(client)}<span>${esc(client.name)}</span><span>·</span><span>${esc(post.id)}</span></div><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close post detail">×</button><h2 id="post-dialog-title">${esc(post.title)}</h2><p class="dialog-hook">${esc(post.hook)}</p><div class="dialog-meta"><span>${esc(dateLabel(post.date, { weekday: 'long', year: 'numeric' }))}</span>${formatTag(post)}<span>${esc(post.pillar)}</span>${post.series ? `<span class="series-label">Series · ${esc(post.series)}</span>` : ''}<span class="draft-badge">Draft</span></div><p class="dialog-slot"><span>UK · ${esc(post.time || 'Proposed slot to confirm · Europe/London')}${post.ukZone ? ` · ${esc(post.ukZone)}` : ''}</span>${post.indiaTime ? `<span class="india-time">India · ${esc(post.indiaTime)}</span>` : ''}</p></header><div class="dialog-tabs" role="tablist" aria-label="Post details">${[['media', 'Media preview'], ['copy', 'Copy & captions'], ['creative', 'Creative brief'], ['evidence', 'Evidence & approval']].map(([key, label]) => `<button type="button" id="tab-${key}" role="tab" aria-selected="${state.dialogTab === key}" aria-controls="panel-${key}" tabindex="${state.dialogTab === key ? '0' : '-1'}" data-dialog-tab="${key}">${label}</button>`).join('')}</div><div class="dialog-body"><section id="panel-media" role="tabpanel" aria-labelledby="tab-media"${state.dialogTab !== 'media' ? ' hidden' : ''}><div id="media-view-container" tabindex="-1">${renderMedia(post)}</div></section><section id="panel-copy" role="tabpanel" aria-labelledby="tab-copy"${state.dialogTab !== 'copy' ? ' hidden' : ''}><p class="dialog-draft-note">Paste-ready copy is kept below. Check the separate evidence and approval conditions before using it.</p>${copyBlock('Instagram caption', post.caption, 'instagram')}${copyBlock('Facebook caption', post.facebookCaption, 'facebook')}${copyBlock('Call to action', post.cta, 'cta')}</section><section id="panel-creative" role="tabpanel" aria-labelledby="tab-creative"${state.dialogTab !== 'creative' ? ' hidden' : ''}><section class="brief-block"><h3>On-screen text</h3><div class="on-screen">${esc(onScreen)}</div></section>${bulletBlock('Shot / slide plan', post.production)}<section class="brief-block"><h3>Motion direction</h3><p>${esc(text(post.motion))}</p></section>${bulletBlock('Story companion', post.story)}${copyBlock('Alt text · match to the final export', post.altText, 'alt')}<section class="brief-block"><h3>Asset brief</h3><p>${esc(text(post.asset))}</p></section></section><section id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence"${state.dialogTab !== 'evidence' ? ' hidden' : ''}><p class="dialog-draft-note">No approval is implied by a draft, a logo or a completed brief. These conditions remain attached to the final version.</p>${bulletBlock('Before publication', post.approvalNeeds, false)}<section class="brief-block"><h3>Test hypothesis</h3><p>${esc(text(post.hypothesis))}</p></section><section class="brief-block"><h3>What to measure</h3><p>${esc(text(post.metric))}</p></section><section class="brief-block"><h3>Source evidence & limits</h3>${sources.map(source => sourceDetails(source, true)).join('') || '<p>Source evidence needs confirmation.</p>'}</section><section class="brief-block"><h3>Brand / rights status</h3><p>${esc(text(client.brand.logo?.status))}</p><p>${esc(text(client.brand.rights))}</p></section></section><div class="dialog-actions"><button type="button" class="button yellow" data-copy="brief">${icon('copy', 13)} Copy entire brief</button><button type="button" class="button secondary" data-copy="link">Copy post link</button>${threadLink(client, true)}<p>Draft only · no account publishing is connected.</p></div></div>`;
  }

  function openPost(id, tab = '', trigger = null) {
    const selectedPost = posts.find(post => post.id === id);
    if (!selectedPost) return;
    lastPostTrigger = trigger || document.activeElement;
    state.openPost = id;
    state.dialogTab = ['media', 'copy', 'creative', 'evidence'].includes(tab) ? tab : (postPreview(selectedPost) ? 'media' : 'copy');
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
  }
  function setDialogTab(key, focus = true) {
    if (!['media', 'copy', 'creative', 'evidence'].includes(key)) return;
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
    const post = posts.find(item => item.id === state.openPost);
    if (!post) return;
    const values = { instagram: post.caption, facebook: post.facebookCaption, cta: post.cta, alt: post.altText, brief: entireBrief(post), link: location.href };
    const value = text(values[key]);
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
      showToast(key === 'brief' ? 'Entire draft brief copied' : key === 'link' ? 'Post link copied' : `${key === 'instagram' ? 'Instagram caption' : key === 'facebook' ? 'Facebook caption' : key === 'alt' ? 'Alt text' : 'Call to action'} copied`);
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
    const rows = filteredPosts();
    const selectedIds = new Set(rows.map(post => post.id));
    const exported = { title: 'Elk Social studio · draft planning export', version: '1.1', status: 'Draft — not publication approval', period: { from: state.from, to: state.to, timezone: 'Europe/London' }, filters: { client: state.client, format: state.format, pillar: state.pillar, query: state.query }, clients: clientScope().map(client => ({ ...client, posts: client.posts.filter(post => selectedIds.has(post.id)).map(({ _client, _name, ...post }) => post) })), guidance: data.guidance, research: data.research, threads: data.threads };
    download(JSON.stringify(exported, null, 2) + '\n', `elk-social-drafts-${state.client}-${state.from}-${state.to}.json`, 'application/json;charset=utf-8');
    showToast(`${rows.length} draft posts exported as JSON`);
  }

  function resetFilters() {
    state.client = 'all'; state.query = ''; state.format = 'all'; state.pillar = 'all'; state.from = START; state.to = END; state.researchCategory = 'all';
    render();
  }
  function setView(view) {
    if (!VIEWS[view]) return;
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
    document.addEventListener('load',event => { if (event.target instanceof HTMLImageElement && (event.target.dataset.feedPreview || event.target.dataset.mediaImage)) updatePreviewImage(event.target,true); },true);
    document.addEventListener('error', event => {
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
      if (dialog.open && event.target.closest('.media-viewer') && ['ArrowLeft','ArrowRight'].includes(event.key)) { event.preventDefault(); moveMedia(event.key === 'ArrowRight' ? 'next' : 'previous'); }
      if (dialog.open && event.target.getAttribute('role') === 'tab' && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const keys = ['media', 'copy', 'creative', 'evidence'];
        let index = keys.indexOf(state.dialogTab);
        index = event.key === 'Home' ? 0 : event.key === 'End' ? keys.length-1 : (index + (event.key === 'ArrowRight' ? 1 : keys.length-1)) % keys.length;
        setDialogTab(keys[index]);
      }
    });
    dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right) closeDialog(); } });
    dialog.addEventListener('close', () => { state.openPost = ''; document.body.style.overflow = ''; const toast = $('#toast'); if (toast) document.body.append(toast); syncURL(); if (lastPostTrigger?.isConnected) lastPostTrigger.focus(); });
    window.addEventListener('popstate', () => { const next = new URLSearchParams(location.search); state.view = VIEWS[next.get('view')] ? next.get('view') : 'feed'; state.client = clients.some(client => client.id === next.get('client')) ? next.get('client') : 'all'; render(); const id = next.get('post'); if (id) openPost(id); else closeDialog(); });
  }

  async function init() {
    $('#search-icon').innerHTML = icon('search', 15);
    if ($('.version')) $('.version').textContent = 'v1.1';
    bindEvents();
    try {
      const response = await fetch('./data.json', { credentials: 'omit' });
      if (!response.ok) throw new Error(`Data request returned ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.clients) || !payload.clients.length) throw new Error('No client data was supplied');
      data = { ...payload, guidance: arr(payload.guidance), research: arr(payload.research), threads: payload.threads || {} };
      clients = data.clients.map(normaliseClient);
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
      if (!posts.some(post => post.id === initialPost)) state.openPost = '';
      render();
      if (initialPost && posts.some(post => post.id === initialPost)) openPost(initialPost);
      window.__ELK_STUDIO__ = Object.freeze({ version: '1.1', clients: clients.length, posts: posts.length, getView: () => state.view });
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
