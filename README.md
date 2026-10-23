# Elk · Brief deliverables

23 October 2026 · [codex]. Buildless read-only team review on the existing GitHub Pages host. The active contract is Deeksha’s confirmed11dated rows: TW3, Aara2, Liman3 and Baker Crafts3, on24/26/28/30October2026. The exact public-safe row rules live in `brief-contract.js`; private source cells, Drive IDs, Canva editing links and evidence stay internal. The implementation and integration proposal is `../production/08-deeksha-brief-2026-10-23/03-dashboard-contract-proposal.md`.

`photo-programme.json` holds actual current exports only. It declares `brief.id:"deeksha-2026-10-23"`, the24–30October window, expected11and four client expectations3/2/3/3. Every post must match its exact assigned ID/client/date/format and media treatment. Aara26 requires exactly4slides. Baker Crafts is the Doc’s supplied name; no new logo, address or business facts are inferred. Unknown or wrong-scope rows cannot enter current gallery/calendar/CSV/counts. Expected rows and available actual assets are separate; a count is not human creative acceptance or social approval.

Root preserves the previous28-row collection locally before replacing canonical data; it is not automatically exposed. **Previous October drafts** reads only an explicit root-supplied `previous-photo-programme.json` and permits only already-published Pera records from Git HEAD. Other previous28/14artwork remains held locally. A legacy canonical collection is neither current completion nor an automatic hosted archive. Older182planning briefs remain held. None fills a missing Deeksha row. Pera has no assigned rows; held clients/November are not current production.

Actual public assets remain flat files under `assets/programme/<clientId>/<exactRowId>/`. Each brief slide declares actual width/height; full contained artwork and original aspect are retained. Aara30 is an original asset handoff: exact original bytes/dimensions, no crop, overlay, logo, redesign or lossy re-encode. Its cover equals the sole original slide. The offline validator requires a separate internal `--source-bindings` file tying that exact row to the inspected original SHA256/dimensions; it is never published. No unverified source-only exemption is granted to another row.

Artwork copy and optional proposed social captions are distinct. `artworkCopy` declares the row’s mode and exact on-art strings; logo-only/none require no added text. Aara26 additionally declares whether inspected “same copy” applies to artwork, caption or both, and retains the assigned public reference/inspection record. Separate `caption` and `facebookCaption` may be omitted; absence is not an incomplete brief row. The viewer never creates an empty caption Copy control. Useful alt text, media, independent review context and a clean ZIP remain required.

Brief ZIPs contain exactly final slides, `alt-text.txt`, and only supplied `instagram-caption.txt`/`facebook-caption.txt`. Each designated string must match exactly, allowing one final LF; captions cannot be swapped or pass by substring inclusion. Alt text uses `Slide 1\n<exact alt>`, then double newline and the next labelled slide. No private paths, Drive/Docs links/IDs, Canva edit/shortlinks, raw editables or internal process are included. The integration proposal defines the exact shape.

Noindex/nofollow/noarchive and the existing CSP remain. This is public, unauthenticated hosting; noindex is not access control. No account is connected, and the app cannot schedule, publish, authenticate approval or write shared state. Video directions remain separate from asset counts; this brief assigns none. No video players, external media requests, remote fonts or analytics are introduced.

Filters combine client, month, week, date, format and search. The current rail shows only the4assigned clients; archives retain their historical identities. Copy preserves exact supplied social/alt strings. The existing phone3-column gallery, accessible More filters, lazy covers and full-image viewer remain. Each unique actual image/ZIP receives at most four concurrent HEAD checks per load, cached by version; filters do not repeat those requests. Missing files or later image decode failures remove the affected asset from available counts. A HEAD success verifies availability only.

## Validation

```sh
node --check app.js
node scripts/validate-photo-programme.mjs --mode deeksha --partial --source-bindings /absolute/internal/bindings.json
node scripts/validate-photo-programme.mjs --mode deeksha --source-bindings /absolute/internal/bindings.json
# Historical archives, explicitly selected:
node scripts/validate-photo-programme.mjs --mode october --partial
node scripts/validate-photo-programme.mjs --mode full --partial
```

`deeksha` validates exact row membership, formats/treatments, actual image signatures/dimensions, original-byte binding, safe local files, exact pack media/channel/alt equality and public-field restrictions. `--partial` permits missing actual rows but grants no completion claim; complete requires all11. `october` retains the superseded28/four-per-client23/25/28/30Oct contract; `full` retains archived119/17Oct–Nov. Explicit mode is mandatory. Historical validator support is not current progress credit.

Internal checks: `../production/08-deeksha-brief-2026-10-23/qa/04-dashboard-contract-check.mjs`, using temporary private fixtures and a genuine retained image. No invented public records/artwork are seeded. These checks cannot establish creative quality, actual reference/source fidelity, rights, current facts or human/client approval. Root performs the final actual desktop/390browser check and owns public integration, deployment, Git, state/client logs and release decisions.

Exact pre-edit code copies and movement/SHA manifest are preserved in workspace `99-archive/2026-10-23-before-deeksha-dashboard/`. Existing UI CSS and earlier artwork/media are unchanged.
