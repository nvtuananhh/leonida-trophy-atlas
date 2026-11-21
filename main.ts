// Leonida Trophy Atlas — entrypoint.
// Copies app/ and screenshots/ into the output directory, validates the
// trophy data, and writes dossier.json + manifest.json there.
// The build time recorded in the manifest is the git HEAD commit's
// timestamp, never the wall clock, so two runs are byte-identical.
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const APP_DIR = join(REPO_ROOT, 'app');
const SHOTS_DIR = join(REPO_ROOT, 'screenshots');
const TROPHIES_FILE = join(APP_DIR, 'data', 'trophies.json');

const MAX_SHOT_BYTES = 256 * 1024;
const DOSSIER_TEXT_MAX = 163840;

function fail(message: string): never {
  throw new Error(`leonida-trophy-atlas main.ts: ${message}`);
}

function gitHeadTimestamp(): string {
  try {
    const stamp = execSync('git log -1 --format=%cI', { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(stamp)) return stamp;
  } catch {
    // No git history available (for example a bare checkout): fall back to a
    // fixed epoch so the output stays deterministic.
  }
  return '1970-01-01T00:00:00+00:00';
}

function listFilesRecursive(dir: string, base: string): { rel: string; bytes: number }[] {
  const out: { rel: string; bytes: number }[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = join(dir, entry.name);
    const rel = base === '' ? entry.name : `${base}/${entry.name}`;
    if (entry.isDirectory()) out.push(...listFilesRecursive(full, rel));
    else if (entry.isFile()) out.push({ rel, bytes: statSync(full).size });
    else fail(`app/${rel} is not a regular file`);
  }
  return out;
}

function validateTrophies(): number {
  if (!existsSync(TROPHIES_FILE)) fail('app/data/trophies.json is missing');
  const parsed = JSON.parse(readFileSync(TROPHIES_FILE, 'utf8')) as { trophies?: unknown };
  const list = Array.isArray(parsed) ? parsed : parsed.trophies;
  if (!Array.isArray(list)) fail('trophies.json must hold an array or an object with a "trophies" array');
  if (list.length !== 55) fail(`trophies.json holds ${list.length} trophies, expected 55`);
  list.forEach((item, i) => {
    const t = item as { name?: unknown; guide?: unknown; sources?: unknown };
    if (typeof t.name !== 'string' || t.name.trim() === '') fail(`trophy #${i + 1} has no name`);
    if (typeof t.guide !== 'string' || t.guide.trim() === '') fail(`trophy "${t.name}" has a blank guide`);
    if (!Array.isArray(t.sources) || t.sources.length === 0) fail(`trophy "${t.name}" cites no source`);
  });
  return list.length;
}

function validateScreenshots(): { name: string; bytes: number }[] {
  if (!existsSync(SHOTS_DIR)) fail('screenshots/ is missing');
  const names = readdirSync(SHOTS_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();
  if (names.length < 3 || names.length > 4) fail(`screenshots/ holds ${names.length} images, expected 3 or 4`);
  return names.map((name) => {
    const size = statSync(join(SHOTS_DIR, name)).size;
    if (size > MAX_SHOT_BYTES) fail(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
    return { name, bytes: size };
  });
}

function main(): void {
  if (!existsSync(APP_DIR)) fail('app/ is missing');
  if (!existsSync(join(APP_DIR, 'index.html'))) fail('app/index.html is missing');
  const trophyCount = validateTrophies();
  const shots = validateScreenshots();

  mkdirSync(OUT_DIR, { recursive: true });
  cpSync(APP_DIR, join(OUT_DIR, 'app'), { recursive: true });
  cpSync(SHOTS_DIR, join(OUT_DIR, 'screenshots'), { recursive: true });

  const buildTime = gitHeadTimestamp();
  const appFiles = listFilesRecursive(join(OUT_DIR, 'app'), 'app');
  const shotFiles = shots.map((s) => ({ rel: `screenshots/${s.name}`, bytes: s.bytes }));
  const manifest = {
    title: 'Leonida Trophy Atlas — the complete offline GTA VI trophy guide + tracker',
    competition: 'gta6-trophy-guide-01',
    trophies: trophyCount,
    gitHeadTimestamp: buildTime,
    buildTime,
    files: [...appFiles, ...shotFiles].sort((a, b) => (a.rel < b.rel ? -1 : 1)),
  };
  writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const dossier = buildDossier(OUT_DIR, {
    text_max_bytes: DOSSIER_TEXT_MAX,
    screenshots: { max: 4, max_bytes: MAX_SHOT_BYTES },
    app_max_files: 993,
    app_max_bytes: 48 * 1024 * 1024,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(OUT_DIR, 'dossier.json'), dossier);
  console.log(`leonida-trophy-atlas: ${trophyCount} trophies, ${shots.length} screenshots, buildTime ${buildTime}`);
}

main();
