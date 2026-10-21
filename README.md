# Elk · Social studio v1.1

A buildless, read-only team planner for 22 October–21 December 2026. It contains 182 planned post drafts and a first produced batch of seven real-photo draft carousels: three 1080×1440 PNG slides per client, 21 slides in total. It does not connect social accounts, schedule posts, record approvals or write status changes.

The user requested real-photo previews in the shareable team dashboard. These selected, derived review images are included for that purpose. Final social publication rights, likeness permissions where applicable and dated approval of the exact post version still need to be recorded. A visible image is not a released social post.

## Files and data

- `index.html`, `styles.css`, `app.js`: the application, with all links relative for a GitHub Pages project path.
- `data.json`: supplied separately by the coordinating task. Schema: `{clients: [...], guidance: [...], research: [...], threads: {...}}`.
- `assets/logos/<client-id>.png`: supplied original logo previews, preserved without redraw. Each brand panel displays its own recorded logo/approval status. A failed image shows “Original logo unavailable”.
- `assets/posts/<post-id>/`: the seven selected produced draft sets, each with `01.png`, `02.png`, `03.png`, a WebP cover and a ZIP download containing the three slides plus the public caption and alt-text files. Raw photo originals, the private artwork plan, source hashes and crop/provenance records are excluded from this public directory and dataset.
- `assets/fonts/`: local Manrope weights 400/500/600/700 and the bundled licence.
- `robots.txt`, `.nojekyll`: crawler request and static hosting support.
- `scripts/validate-data.mjs`: checks the final planning dataset before deployment.

Client objects use the agreed `id`, `name`, `location`, `instagram`, `website`, `brand`, `audit`, `sources`, `references`, `posts` and `assetNeeds` fields. `onScreen` may be a string or array. Source `local`/logo `path` fields are not rendered; the supplied dataset must still be sanitised before it is hosted or exported.

Only the seven produced posts carry public `post.preview` data:

```json
{
  "status": "Visual draft",
  "type": "carousel",
  "cover": "assets/posts/<post-id>/cover.webp",
  "slides": [
    {"src": "assets/posts/<post-id>/01.png", "alt": "The actual first slide description"},
    {"src": "assets/posts/<post-id>/02.png", "alt": "The actual second slide description"},
    {"src": "assets/posts/<post-id>/03.png", "alt": "The actual third slide description"}
  ],
  "download": "assets/posts/<post-id>/slides.zip"
}
```

Filenames for the cover/ZIP may differ; their paths must remain relative, inside that same post's folder. Preview records carry display/download paths and slide alt text only. They must not contain `imagePath`, `originalSource`, source hashes or crop metadata. The earlier single-image Pera study is superseded and archived; it is not an eighth produced post or a twenty-second slide.

Guidance items support `id,title,category,status,summary,action,url,observed`. Research questions support `id,title,category,question,status,finding,nextAction,sourceIds,url`. Proposed tests remain distinct from findings. Thread records use `{threadId,title,url}` by client ID; permitted explicit Codex thread links use `codex://threads/<id>`.

The optional top-level `programme` object supports `thesis`, `phases: [{title,dates,action,review}]`, `cadence`, `measurement` and `limits`; Overview displays this as a compact proposed two-month direction. Each optional `client.strategy` supports `goal,audience,thesis,priority,measure`, shown in Brand & audit and Production. These are proposed planning directions, not contracts or results. Supplied versus concept logo labels appear near the client navigation, Overview client list and brand heading. Optional post `ukZone` and `indiaTime` fields appear beside the UK slot in the drawer and in CSV/full-brief exports; the app does not invent time conversions.

`client.previewWebsite` is a separate draft-preview link, labelled “Draft website preview — not a live business site”; it is not used in post CTAs. Optional `post.series` appears separately from the broad pillar in post detail, full briefs and CSV. Original Nazar and Liman logo assets have a dark backing for contrast without modifying their images. View navigation focuses the view heading; client/week/research controls restore logical keyboard focus after rendering, and search preserves its text selection.

## Use

Open through a static web server or the deployed team URL. Direct `file:` loading cannot reliably fetch the dataset. This handoff does not start a server or deploy.

The seven views are Overview, Calendar, Feed, Posts, Brand & audit, Research and Production. Client/search/format/pillar/date filters apply to the post programme and CSV/JSON exports. Research has separate guidance/question/reference tabs and category filters. All 182 posts remain drafts.

Feed shows one client profile at a time, with its supplied logo, public handle or “Identity not verified”, and a three-column portrait grid. It is a planning preview, not a live Instagram profile; no follower or engagement figures are invented. All-clients Feed opens a gallery of created drafts and the client chooser. A produced cover appears only from the supplied local artwork file. Other ideas have explicitly labelled “Brief only” typographic planning tiles, which are not finished artwork. Earliest/latest planned ordering is labelled, and existing filters still apply.

Open a feed tile to inspect the Media preview tab. It has the actual slides, previous/next controls, slide alt text, full-size links and downloads. Missing files show a clear brief-only state. Copy & captions, Creative brief and Evidence & approval remain separate tabs; the caption Copy buttons copy the text rather than internal checks. Cover images load lazily, and the viewer displays one active carousel slide at a time.

The Copy buttons use the browser clipboard with a local fallback. CSV fields are quoted and formula-like values are neutralised. Exports contain only the supplied planning data and the current filtered post selection; no user information or account access is collected.

Deep links:

```
?client=nazar-bedford&view=posts
?client=nazar-bedford&view=feed
?client=the-local-shop
?client=pera-patisserie&view=feed&order=latest
?client=the-local-shop&view=calendar&week=2026-11-02
?post=TW-01
```

An explicit `view` is respected; a client link without a view defaults to Feed. Overview's client shortcut opens that feed. The search shortcut is `/`. Post drawers use native modal dialog keyboard containment and Escape to close. Detail tabs support Left/Right/Home/End; the media carousel has labelled buttons and Left/Right controls while focus is in its viewer. Calendar posts are native buttons; the List display gives a linear alternative. Reduced motion is respected.

## Validation and remaining checks

```
node --check app.js
node scripts/validate-data.mjs
```

The first command validates JavaScript syntax. The second needs the final `data.json`, all seven logo files and the seven produced artwork folders. It preserves the original seven-client / 182-draft / 100-question checks, then verifies exactly seven produced preview records, three uniquely referenced PNG slides per set, 21 PNG slides in total, PNG signatures and 1080×1440 dimensions, safe post-relative paths, cover and ZIP existence, WebP/ZIP signatures, nonempty slide alt text and exclusion of private preview fields. ZIP contents must be the same three slide PNGs plus `captions.txt` and `alt-text.txt`; the text is checked against the public draft captions/slide descriptions and for private-path/provenance leaks. No raw originals or private plan are allowed. This validates the integrated release data and files; it is not a rights or human approval check.

The coordinating task must inspect desktop and 390px layouts, enlarged text, Feed/chooser/order/filter behaviour, loaded and missing artwork, carousel navigation, full-size/download links, calendar navigation, modal keyboard handling, copy/export, source/thread links and the final published dataset. No browser QA or deployment is certified by this README.

The document carries `noindex,nofollow,noarchive`. Crawlers are permitted to read that tag; Google's official guidance explains that blocking crawling can hide noindex. A project-path robots file does not control the hostname root. Search exclusion is requested, not guaranteed, and applies to the Pages HTML rather than GitHub repository search. Anyone with the link can view; there is no authentication. The selected derived real-photo draft previews are intentionally shared here. Raw originals, private documents/plans, credentials, personal data and commercial/account details must remain excluded. The browser loads local app/data/font/logo/post files, with no remote embeds or analytics.
