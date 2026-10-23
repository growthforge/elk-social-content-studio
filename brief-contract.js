'use strict';

// Public-safe row contract from the human-confirmed 23 October brief.
// Source URLs, Drive IDs, author/revision IDs and inspection records stay internal.
(() => {
  const rows = [
    ['tw-fresh-food-centre','2026-10-24','carousel','designed','adapted'],
    ['tw-fresh-food-centre','2026-10-28','image','designed','adapted'],
    ['tw-fresh-food-centre','2026-10-30','image','logo-only','logo-only'],
    ['aara-birmingham','2026-10-26','carousel','designed','same-reference',4],
    ['aara-birmingham','2026-10-30','image','source-only','none',1],
    ['liman-islington','2026-10-24','image','designed','adapted'],
    ['liman-islington','2026-10-28','carousel','designed','adapted'],
    ['liman-islington','2026-10-30','image','logo-only','logo-only'],
    ['baker-crafts','2026-10-24','image','designed','adapted'],
    ['baker-crafts','2026-10-28','carousel','designed','adapted'],
    ['baker-crafts','2026-10-30','image','designed','adapted']
  ].map(([clientId,date,type,mediaTreatment,copyMode,slideCount]) => Object.freeze({id:`${clientId}-deeksha-${date}`,clientId,date,type,mediaTreatment,copyMode,...(slideCount ? {slideCount} : {})}));
  const referenceURLs={
    'aara-birmingham-deeksha-2026-10-26':'https://www.instagram.com/p/Ddt4G29juhs/',
    'liman-islington-deeksha-2026-10-24':'https://www.instagram.com/p/DecQapRRA8z/',
    'liman-islington-deeksha-2026-10-28':'https://www.instagram.com/p/Dcym1pcCRl6/',
    'baker-crafts-deeksha-2026-10-24':'https://www.instagram.com/p/DeuVDStSzfQ/',
    'baker-crafts-deeksha-2026-10-28':'https://www.instagram.com/p/DdTo17bmM22/',
    'baker-crafts-deeksha-2026-10-30':'https://www.instagram.com/p/DeuVDStSzfQ/'
  };
  const hasReference = (post,url) => Array.isArray(post.references) && post.references.some(r => {try {const a=new URL(r.url),b=new URL(url);return a.hostname.replace(/^www\./,'')===b.hostname.replace(/^www\./,'') && a.pathname.replace(/\/$/,'')===b.pathname.replace(/\/$/,'') && typeof r.inspected==='string' && r.inspected.trim();} catch {return false;}});
  const clients = Object.freeze([...new Set(rows.map(r => r.clientId))].map(id => Object.freeze({id,expectedPosts:rows.filter(r => r.clientId === id).length,...(id === 'baker-crafts' ? {name:'Baker Crafts'} : {})})));
  const id='deeksha-2026-10-23';
  const current = data => data?.brief?.id === id;
  const metadata = () => ({brief:{id,title:'Deeksha · October brief'},window:{from:'2026-10-24',to:'2026-10-30',timezone:'Europe/London'},expectedPosts:rows.length,clients:clients.map(c => ({...c})),cadence:{label:'11 dated deliverables from Deeksha’s brief',status:'Editorial dates; social scheduling and approval are separate'}});
  const validMetadata = data => current(data) && data.expectedPosts === rows.length && data.window?.from === '2026-10-24' && data.window?.to === '2026-10-30' && data.window?.timezone === 'Europe/London' && Array.isArray(data.clients) && data.clients.length === clients.length && new Set(data.clients.map(c => c.id)).size === clients.length && clients.every(c => data.clients.some(v => v.id === c.id && v.expectedPosts === c.expectedPosts && (!c.name || v.name === c.name)));
  const rowFor = post => rows.find(r => r.id === post?.id && r.clientId === post.clientId && r.date === post.date && r.type === post.type);
  const validPost = post => {
    const row=rowFor(post), slides=post?.slides;
    if (!row) return false;
    const reference=referenceURLs[row.id];
    if (reference && !hasReference(post,reference)) return false;
    if (row.copyMode==='same-reference') {
      const scope=post.artworkCopy?.referenceScope, hasCaption=typeof post.caption==='string' && !!post.caption.trim();
      if (!['artwork','caption','both'].includes(scope) || (scope!=='caption' && !post.artworkCopy?.text?.length) || (scope!=='artwork' && !hasCaption)) return false;
    }
    if (row.mediaTreatment==='source-only' && post.cover !== slides?.[0]?.src) return false;
    return !!row && post.mediaTreatment === row.mediaTreatment && post.artworkCopy?.mode === row.copyMode && Array.isArray(post.artworkCopy.text) && post.artworkCopy.text.every(t => typeof t === 'string' && t.trim()) && (!['none','logo-only'].includes(row.copyMode) || post.artworkCopy.text.length === 0) && Array.isArray(slides) && (row.slideCount ? slides.length === row.slideCount : post.type === 'image' ? slides.length === 1 : slides.length >= 2 && slides.length <= 20) && slides.every(s => Number.isInteger(s.width) && Number.isInteger(s.height) && s.width > 0 && s.height > 0 && s.width <= 20000 && s.height <= 20000) && ['caption','facebookCaption'].every(k => post[k] == null || typeof post[k] === 'string');
  };
  globalThis.ELK_PHOTO_BRIEF=Object.freeze({id,rows:Object.freeze(rows),referenceURLs:Object.freeze(referenceURLs),clients,current,metadata,validMetadata,rowFor,validPost});
})();
