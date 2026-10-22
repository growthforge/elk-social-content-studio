# Elk · Photo programme v5

22 October 2026 · [codex]. VERIFIED implementation: `index.html`, `app.js` and `styles.css`, inspected 22 October 2026. Buildless, read-only team review on the existing GitHub Pages host. The primary collection is `photo-programme.json`; its supplied window determines the header, month/week options, date bounds and calendar. The current authorised production scope is **22–31 October 2026**, with four proposed dates per client: 23, 25, 28 and 30 October. Only actual photo or carousel exports enter the primary gallery, calendar, CSV and finished counts. Video ideas appear in **Video directions** as **Concept / direction only**. No video players, embeds, video requests, external fonts or analytics are created.

Dates are proposed posting dates. A finished draft means an export exists; it does not mean scheduled, published, creatively accepted or approved for social release. The October target is 28 posts, four for each of seven clients. Expected collection/client totals and the cadence label are read from the dataset and displayed separately from actual counts. The retained full October–November schema remains supported for explicit archive validation; its 119/17 targets do not describe current October work. November media and sources remain local historical work, without new progress credit. Root owns replacement of actual public JSON; this code change does not relabel the existing dataset or claim 28 reviewed posts exist.

The earlier wave is **Previous wave · needs rebrief** and contributes no new progress. Its cover images, captions and retained ZIPs remain inspectable without a video player. The 182 older briefs remain **Held briefs · archive**, with copying disabled. Existing brand and platform evidence remains accessible in **Brand & research**.

The site remains public and unauthenticated. `noindex,nofollow,noarchive` is a crawler instruction, not access control or a guarantee of search absence. No account is connected and the app cannot schedule, publish, record human approval or write to the agency register.

## Collection and files

The integration contract and complete sample shape are in `../01-photo-programme-schema.md`. Root integration owns the real JSON and media. Client identity, original logos and public account links come from existing `data.json`.

Every new post must have an ID, known client ID, proposed date in the window, type `image` or `carousel`, status exactly `Finished draft`, title, exact Instagram/Facebook copy, cover description, actual slide descriptions, version, public-safe source summary, review status/scope and a ZIP. Images have exactly one slide; carousels have 2–20 unique actual slides. All new files are flat paths under:

```
assets/programme/<clientId>/<postId>/<filename>
```

The runtime rejects unsafe paths, invalid window/target metadata and incomplete post metadata. It clips all calendar dates to the supplied window and selected date/month range, including weeks that cross a month boundary. Outdated month/week deep links reset, and date links clamp to the new window. Once per load it checks each unique image/ZIP path using at most four concurrent HEAD requests, with availability cached by the dataset version. Filtering never repeats the file checks. Missing files exclude the whole post from finished totals. No image bytes are fetched by this preflight; gallery images use native lazy loading, and the slide viewer inserts only its active full image. A later image decode error also removes the affected primary post from the counts. A HEAD success proves file availability only; the validator and actual export review provide the deeper checks.

A post ZIP contains the actual final images, exact caption text and exact alt text in flat public-safe files. It must omit raw originals, private paths, Drive IDs, source handoffs, agency process and credential-bearing material. Rights, factual/currentness and approval notes belong in contextual evidence fields rather than consumer copy.

Video direction references provide a direct video URL, why it applies and what was actually inspected. A page title or thumbnail is not represented as video playback. No competitor media is copied or embedded. Directions never enter post or media completion counts.

## Use and deep links

Serve this directory over HTTP, or use the existing deployed GitHub Pages URL. Direct `file:` access cannot reliably fetch JSON.

```
?view=programme
?view=finished
?view=programme&client=pera-patisserie&month=2026-10
?view=calendar&week=2026-10-26
?view=programme&client=nazar-bedford&post=<actual-post-id>
?view=video-directions&client=aara-birmingham
?view=previous
?view=held
?view=references
```

`finished` remains an alias for the new programme. Client, month, Monday-starting week, date range, image/carousel format and search filters combine. Date filters apply only to the new programme. Results can sort by earliest or latest proposed date. CSV exports only the filtered new finished posts, with their dates explicitly marked proposed.

Open a post to view the full contained image, step through every actual slide, copy exact Instagram/Facebook captions or alt text, and download individual images or the ZIP. Arrow keys switch slides; Escape closes the native dialog. Every supplied logo uses `object-fit:contain`; cover previews also contain the complete artwork rather than cropping it. The mobile gallery retains three columns, with full-size inspection in the dialog.

## Validation

```
node --check app.js
node scripts/validate-photo-programme.mjs --mode october --partial
node scripts/validate-photo-programme.mjs --mode october
# Historical full schema only:
node scripts/validate-photo-programme.mjs --mode full --partial
node scripts/validate-photo-programme.mjs --mode full
```

An explicit `--mode october` or `--mode full` is required; scope is never inferred from counts. October requires window 22–31 October, expected 28/four per client and only 23/25/28/30 October. Full retains the archived 22 October–30 November, 119/17 contract. `--partial` permits missing actual posts but still rejects wrong metadata, dates, duplicate placements, excess posts or broken supplied files; without it every client must have every expected date. October video directions are optional: omitted/empty, or 14 briefs/two per client for a complete direction collection; partial collection validation allows fewer. They never satisfy a photo count. The archived full complete mode retains its earlier separate-direction-per-client check.

Both modes validate safe paths, actual file signatures/dimensions, ZIP media equality, exact caption/alt inclusion, public-safe fields and direction references. Neither mode establishes creative acceptance, current facts, rights or human approval. Empty or missing primary data has an honest empty/unavailable state; it never borrows earlier media.

Implementation palette: Field Paper `#F6F7F2`, White `#FFFFFF`, Forest Ink `#27362A`, Moss `#455E3A`, Sage Line `#DCE2D4`, Harvest Gold `#DEC56D`. Manrope remains the supplied local interface family for continuity; Arial is the local fallback for robust system rendering. No new consumer brand system is invented. Layout: a compact client rail and filter bar lead directly to an Instagram-style three-column export gallery, with a full-image review dialog.

Predecessors and SHA-256 movement manifests: `99-archive/2026-10-22-photo-programme-dashboard/` and `99-archive/2026-10-22-photo-dashboard-october-window/` in the workspace. Deployment, public data integration and shared/client logs belong to the parent task. Browser visual verification at desktop and 390 px must be performed on the final actual dataset before deployment; static checks alone do not establish it.
