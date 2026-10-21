# Elk · Social studio v1.0

A buildless, read-only team planner for 22 October–21 December 2026. It displays supplied draft planning data; it does not connect social accounts, schedule posts, record approvals or write status changes.

## Files and data

- `index.html`, `styles.css`, `app.js`: the application, with all links relative for a GitHub Pages project path.
- `data.json`: supplied separately by the coordinating task. Schema: `{clients: [...], guidance: [...], research: [...], threads: {...}}`.
- `assets/logos/<client-id>.png`: supplied original logo previews, preserved without redraw. Each brand panel displays its own recorded logo/approval status. A failed image shows “Original logo unavailable”.
- `assets/fonts/`: local Manrope weights 400/500/600/700 and the bundled licence.
- `robots.txt`, `.nojekyll`: crawler request and static hosting support.
- `scripts/validate-data.mjs`: checks the final planning dataset before deployment.

Client objects use the agreed `id`, `name`, `location`, `instagram`, `website`, `brand`, `audit`, `sources`, `references`, `posts` and `assetNeeds` fields. `onScreen` may be a string or array. Source `local`/logo `path` fields are not rendered; the supplied dataset must still be sanitised before it is hosted or exported.

Guidance items support `id,title,category,status,summary,action,url,observed`. Research questions support `id,title,category,question,status,finding,nextAction,sourceIds,url`. Proposed tests remain distinct from findings. Thread records use `{threadId,title,url}` by client ID; permitted explicit Codex thread links use `codex://threads/<id>`.

The optional top-level `programme` object supports `thesis`, `phases: [{title,dates,action,review}]`, `cadence`, `measurement` and `limits`; Overview displays this as a compact proposed two-month direction. Each optional `client.strategy` supports `goal,audience,thesis,priority,measure`, shown in Brand & audit and Production. These are proposed planning directions, not contracts or results. Supplied versus concept logo labels appear near the client navigation, Overview client list and brand heading. Optional post `ukZone` and `indiaTime` fields appear beside the UK slot in the drawer and in CSV/full-brief exports; the app does not invent time conversions.

`client.previewWebsite` is a separate draft-preview link, labelled “Draft website preview — not a live business site”; it is not used in post CTAs. Optional `post.series` appears separately from the broad pillar in post detail, full briefs and CSV. Original Nazar and Liman logo assets have a dark backing for contrast without modifying their images. View navigation focuses the view heading; client/week/research controls restore logical keyboard focus after rendering, and search preserves its text selection.

## Use

Open through a static web server or the deployed team URL. Direct `file:` loading cannot reliably fetch the dataset. This handoff does not start a server or deploy.

The six views are Overview, Calendar, Posts, Brand & audit, Research and Production. Client/search/format/pillar/date filters apply to the post programme and CSV/JSON exports. Research has separate guidance/question/reference tabs and category filters. Post detail has separate caption, creative and evidence/approval tabs; all posts remain drafts.

The Copy buttons use the browser clipboard with a local fallback. CSV fields are quoted and formula-like values are neutralised. Exports contain only the supplied planning data and the current filtered post selection; no user information or account access is collected.

Deep links:

```
?client=nazar-bedford&view=posts
?client=the-local-shop&view=calendar&week=2026-11-02
?post=TW-01
```

The search shortcut is `/`. Post drawers use native modal dialog keyboard containment and Escape to close. Detail tabs support Left/Right/Home/End. Calendar posts are native buttons; the List display gives a linear alternative. Reduced motion is respected.

## Validation and remaining checks

```
node --check app.js
node scripts/validate-data.mjs
```

The first command validates JavaScript syntax. The second needs the final `data.json` and all seven logo files; it checks seven clients, 182 unique post IDs, 26 dates per client, source links, required copy/brief fields, 100 research questions, 26 Monday/Wednesday/Friday dates, draft status and caption separation. It is not a rights or human approval check.

The coordinating task must inspect desktop and 390px layouts, search/filter/reset, calendar navigation, modal keyboard handling, copy/export, source/thread links and the final published dataset. No browser QA or deployment is claimed by this file.

The document carries `noindex,nofollow,noarchive`. Crawlers are permitted to read that tag; Google’s official guidance explains that blocking crawling can hide noindex. A project-path robots file does not control the hostname root. Search exclusion is requested, not guaranteed, and applies to the Pages HTML rather than GitHub repository search. Anyone with the link can view; there is no authentication. Do not host unapproved photographs, private documents, credentials, personal data or commercial/account details. The browser requests only local app/data/font/logo files and loads no remote embeds or analytics.
