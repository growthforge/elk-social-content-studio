# Elk · Social studio v3.0

22 October 2026 · [codex]. A buildless, read-only team gallery for produced Instagram post and Reel drafts. The default **Finished posts** view shows actual files from `finished-posts.json`; the earlier 182 calendar briefs and rejected studies remain accessible in **Held feed**, **Held briefs**, **Rejected studies** and the existing planning/research views. They are excluded from finished counts. Earlier caption copying stays disabled.

A finished draft is a produced export, not a live post or human approval. The dashboard does not connect accounts, schedule, publish, record approval or change the working status register. Selected derivative media are intentionally shared for team review under the current user request. Raw originals, private source/Drive records and operating documents remain outside this public deployment. Final social rights, consent, current facts and human acceptance need separate evidence.

The site is public and unauthenticated. `noindex,nofollow,noarchive` requests crawler exclusion; it is not access control and does not guarantee search absence. Local files, fonts and media only; no remote embeds or analytics.

## Finished collection contract

Root integration supplies `finished-posts.json` beside the app:

```json
{
  "version": "1.0",
  "observed": "2026-10-22",
  "status": "Finished drafts · social release pending",
  "summary": "One image post and one Reel for each client.",
  "posts": [
    {
      "id": "client-image-01",
      "clientId": "client-slug",
      "type": "carousel",
      "title": "The actual post title",
      "caption": "Exact Instagram caption",
      "facebookCaption": "Exact Facebook caption",
      "alt": "Description of the cover or video",
      "status": "Finished draft",
      "version": "1.0",
      "cover": "assets/finished/client-slug/client-image-01/cover.webp",
      "slides": [
        {"src": "assets/finished/client-slug/client-image-01/01.png", "alt": "Actual slide one description"},
        {"src": "assets/finished/client-slug/client-image-01/02.png", "alt": "Actual slide two description"}
      ],
      "download": "assets/finished/client-slug/client-image-01/post-pack.zip",
      "notes": ["The remaining source or publication conditions"],
      "sourceSummary": "Public-safe description of the original client media used",
      "review": {"status": "Independent export review pending", "scope": "No human approval inferred"}
    }
  ]
}
```

`type` is exactly `image`, `carousel` or `reel`. Image records have exactly one slide; carousels have 2–20 unique actual slides. Reels omit `slides` or use an empty array, and supply:

```json
"video": {
  "src": "assets/finished/client-slug/client-reel-01/01.mp4",
  "poster": "assets/finished/client-slug/client-reel-01/poster.jpg",
  "width": 1080,
  "height": 1920,
  "duration": 12.4,
  "fps": 30,
  "audioStatus": "Describe the actual export audio and its qualification"
}
```

The Reel's `id`, `cover` and `download` must use that same `client-reel-01` directory. `duration` is the actual numeric seconds, not a target. All post media are flat relative paths under `assets/finished/<clientId>/<post-id>/`; no URLs, traversal, nested folders or private paths. Image files are PNG/JPEG/WebP. `download` is the final post-pack ZIP. Include the final image(s) or MP4, caption text containing both exact channel captions, and alt-text descriptions in flat public-safe files. A cover/poster may also be in the pack. Do not include raw originals, private handoffs, build/provenance details or Drive IDs.

Client identity, logo status and public handle come from existing `data.json`. No guessed handles, followers or performance figures are created. The app retains supplied batch order; it does not invent publication dates. Runtime metadata checks exclude incomplete records; a failed cover is marked unavailable and excluded from counts rather than replaced with fake artwork.

## Use and deep links

Open the deployed team URL or serve this directory over HTTP. Direct `file:` access cannot reliably fetch JSON. This handoff does not start a server or deploy.

```
?view=finished
?view=finished&client=pera-patisserie
?view=finished&client=pera-patisserie&post=pera-reel-01
?view=finished&format=Reel&q=detail
?view=directions
?view=feed&client=the-local-shop
?view=posts&client=nazar-bedford
```

An omitted view defaults to Finished posts, including a client-only link. All seven client buttons, the sidebar and Client select filter this gallery. Search covers client, title, caption, alt and type; Format selects Photo, Carousel or Reel. Calendar dates/pillars are hidden because finished exports have no invented schedule. CSV/JSON exports use only the displayed finished selection in this view; historical views retain their separate planning exports.

The three-column portrait grid loads lazy still covers only. It contains no video players. Opening a Reel mounts one native `controls playsinline preload="none"` player with its actual poster; leaving the media tab, closing the drawer, navigating or hiding the page pauses playback. A closed drawer removes the player. Image/carousel details display one full-size slide at a time with previous/next controls, slide-specific alt copy and direct downloads. All posts have exact Instagram/Facebook copy, complete alt copy, a ZIP link, version and separate source/review notes. Copying does not grant release approval.

Native modal dialog contains keyboard focus and supports Escape. Tabs use Left/Right/Home/End; focused carousel controls support Left/Right. View navigation focuses the heading, filters preserve logical focus, and `/` focuses search. The layout uses local Manrope, readable captions, visible focus and horizontal client navigation on narrow screens.

## Files and checks

Current data files are separate: `finished-posts.json` (new produced media), `direction-reset.json` (proposed stories), `data.json` (held calendar, clients and research), and `art-direction.json` (rejected studies). Existing validators remain unchanged. Original app/style/index/README files were moved to `99-archive/2026-10-22-finished-posts-dashboard/` with a source/destination/SHA-256 manifest before these successors were written.

```
node --check app.js
node --check scripts/validate-finished.mjs
node scripts/validate-finished.mjs
node scripts/validate-directions.mjs
node scripts/validate-data.mjs
node scripts/validate-concepts.mjs --required
```

The finished validator requires **14 actual exports, seven clients, one still post/carousel plus one Reel each**. It checks safe local paths, regular files, recognised image headers/dimensions (full still slides 1080×1350 or 1080×1440), MP4 header/fast-start box order and ffprobe H264/yuv420p/1080×1920/30fps/duration metadata, explicit audio status, ZIP structure/media/text presence, exact caption/alt agreement and private-path/credential-like leaks. `--partial` permits an incomplete collection solely for integration checks and explicitly does not certify the first wave. `ffprobe` must be on PATH. Source fidelity, real action, sound suitability, storytelling, rights, current identity and human acceptance require independent actual-output review.

Integration still requires actual desktop/390px and enlarged-text review; client/search/format filters; native playback and pause/close behaviour; carousel, copy, downloads and deep links; final dataset/pack inspection; and deployed-byte verification. The producer's syntax and fixture checks are not browser, creative or human approval.
