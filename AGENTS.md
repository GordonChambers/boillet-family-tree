# AGENTS.md

## Cursor Cloud specific instructions

### What this is
`Ascendance Boillet` is a single, self-contained **static genealogy / family-tree web app** (in French, with an FR/EN toggle) for the Boillet family. The entire application — HTML, inline CSS, inline JS, and the embedded genealogy dataset (`const DATA={...}`) — lives in one file: `index.html`. There is no framework, no bundler, no backend, and no database.

### Repo layout
- `index.html` — the whole app (~333 KB). Edit this to change the UI or data.
- `family.csv` — source genealogy data (Sosa numbers, names, dates, places, professions).
- `geocode-places.mjs` — a one-off dev/data-prep Node script (see caveat below). **Not** part of the running product.
- `geocode-cache.json` — cached geocoding results used by the script above.

### Dependencies / setup
- **None to install.** No `package.json`, lockfile, or `node_modules`. The update script is intentionally a no-op.
- Runtimes are preinstalled: Node 22 and Python 3.12. Only Node 18+ is needed for the optional geocode script.

### Running the app (required service)
Serve the repo root over static HTTP and open `index.html`:
```
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```
`npx serve` / `npx http-server` also work. Opening `index.html` directly via `file://` works too, but a static HTTP server is the recommended dev flow. Google Fonts are loaded from a CDN and degrade gracefully to system fonts if unavailable (e.g. offline).

### Core features to sanity-check (no automated tests exist)
Three tabs: **Arbre/Tree** (fan chart + timeline/branches views), **Carte/Map** (SVG map of France with birth/marriage/death markers and a time slider), **Chiffres/Numbers** (statistics charts). Also: search box, per-person detail card, FR/EN toggle, and light/dark theme toggle. There is **no** lint/test/build tooling — validation is manual in the browser.

### Caveats
- `geocode-places.mjs` reads/writes `index2.html`, which no longer exists in the repo (removed alongside a refactor into `index.html`). The script is therefore stale and will not run as-is; treat it as a leftover data-prep tool, not runtime code.
