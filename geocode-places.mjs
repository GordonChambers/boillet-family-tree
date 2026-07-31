#!/usr/bin/env node
import fs from 'fs';

const DEPS = {
  '02': 'Aisne', '27': 'Eure', '60': 'Oise', '62': 'Pas-de-Calais',
  '76': 'Seine-Maritime', '78': 'Yvelines', '80': 'Somme', '95': "Val-d'Oise",
};

const html = fs.readFileSync('index2.html', 'utf8');
const m = html.match(/const DATA=(\{.*?\});/s);
if (!m) throw new Error('DATA not found');
const DATA = JSON.parse(m[1]);

const places = new Map();
for (const p of Object.values(DATA.people)) {
  for (const k of ['bp', 'up', 'dp']) {
    const pl = p[k];
    if (!pl?.[0]) continue;
    const key = `${pl[0]}|${pl[1]}`;
    if (!places.has(key)) places.set(key, { name: pl[0], dep: pl[1] });
  }
}

const cachePath = 'geocode-cache.json';
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

async function geocode(name, dep) {
  const key = `${name}|${dep}`;
  if (cache[key]) return cache[key];

  const dept = DEPS[dep] || dep;
  const q = `${name}, ${dept}, France`;
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q, format: 'json', limit: '1', countrycodes: 'fr',
  })}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'boillet-family-tree/1.0 (local genealogy project)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${q}`);
  const rows = await res.json();
  if (!rows.length) {
    console.warn(`  MISS: ${q}`);
    return null;
  }
  const hit = rows[0];
  const out = { la: +hit.lat, lo: +hit.lon, display: hit.display_name };
  cache[key] = out;
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  await new Promise(r => setTimeout(r, 1100));
  return out;
}

console.log(`Geocoding ${places.size} communes…`);
let updated = 0, missed = 0;

for (const [key, { name, dep }] of places) {
  if (cache[key]?.la != null) {
    console.log(`  cached ${key}`);
  } else {
    console.log(`  fetch ${key}`);
    const g = await geocode(name, dep);
    if (!g) { missed++; continue; }
    console.log(`    → ${g.la}, ${g.lo}`);
  }
}

for (const p of Object.values(DATA.people)) {
  for (const k of ['bp', 'up', 'dp']) {
    const pl = p[k];
    if (!pl?.[0]) continue;
    const key = `${pl[0]}|${pl[1]}`;
    const g = cache[key];
    if (!g?.la) continue;
    if (pl[2] !== g.la || pl[3] !== g.lo) {
      pl[2] = +g.la.toFixed(5);
      pl[3] = +g.lo.toFixed(5);
      updated++;
    }
  }
}

const newData = `const DATA=${JSON.stringify(DATA)};`;
const out = html.replace(/const DATA=\{.*?\};/s, newData);
fs.writeFileSync('index2.html', out);
console.log(`Done — ${updated} coordinate updates, ${missed} misses, cache in ${cachePath}`);
