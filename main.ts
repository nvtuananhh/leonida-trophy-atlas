// main.ts — hands in the Leonida Trophy Atlas entry.
//
// It validates app/ (index present, trophies.json parses with 55 items and a
// non-blank guide each, screenshots present and within the byte cap), copies
// app/ and screenshots/ to the output directory, writes a manifest whose
// build time comes from the git HEAD commit timestamp (never the wall clock,
// so two runs are byte-identical), and writes dossier.json with buildDossier
// from ./vendor/makefun-frontend.ts.
//
// Run locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it with /output as the target instead.
import { buildDossier } from "./vendor/makefun-frontend.ts";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";

const REPO_ROOT = resolve(import.meta.dirname);
const APP_DIR = join(REPO_ROOT, "app");
const SHOTS_DIR = join(REPO_ROOT, "screenshots");
const OUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

const EXPECTED_TROPHIES = 55;
const MAX_SHOT_BYTES = 256 * 1024;
const DOSSIER_TEXT_MAX_BYTES = 163840;

function fail(message: string): never {
  throw new Error("main.ts: " + message);
}

// The git HEAD commit timestamp, in ISO form. This is the ONLY clock the
// entry uses: manifest.json and everything derived from it are identical
// across runs of the same commit, whatever the wall clock says.
function gitHeadTimestamp(): { sha: string; iso: string } {
  const sha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
  const seconds = execFileSync("git", ["show", "-s", "--format=%ct", "HEAD"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  }).trim();
  const iso = new Date(Number(seconds) * 1000).toISOString();
  return { sha, iso };
}

function listFiles(dir: string, base: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, base));
    else if (entry.isFile()) out.push(relative(base, full));
    else fail("not a plain file: " + relative(base, full));
  }
  return out.sort();
}

function checkTrophies(): { count: number; grades: Record<string, number> } {
  const path = join(APP_DIR, "data", "trophies.json");
  if (!existsSync(path)) fail("app/data/trophies.json is missing");
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail("app/data/trophies.json does not parse: " + (err as Error).message);
  }
  const list = (data as { trophies?: unknown[] }).trophies ?? data;
  if (!Array.isArray(list)) fail("app/data/trophies.json holds no trophy array");
  if (list.length !== EXPECTED_TROPHIES) {
    fail(`expected ${EXPECTED_TROPHIES} trophies, found ${list.length}`);
  }
  const grades: Record<string, number> = {};
  for (const [index, item] of list.entries()) {
    const trophy = item as Record<string, unknown>;
    if (typeof trophy.name !== "string" || !trophy.name.trim()) {
      fail(`trophy #${index + 1} has no name`);
    }
    if (typeof trophy.guide !== "string" || !trophy.guide.trim()) {
      fail(`trophy "${trophy.name}" has a blank guide`);
    }
    if (!Array.isArray(trophy.sources) || trophy.sources.length === 0) {
      fail(`trophy "${trophy.name}" cites no source`);
    }
    const grade = String(trophy.grade || "unknown");
    grades[grade] = (grades[grade] || 0) + 1;
  }
  return { count: list.length, grades };
}

function checkScreenshots(): { name: string; bytes: number }[] {
  if (!existsSync(SHOTS_DIR)) fail("screenshots/ is missing");
  const names = readdirSync(SHOTS_DIR)
    .filter((name) => !name.startsWith("."))
    .sort();
  if (names.length < 3 || names.length > 4) {
    fail(`expected 3 or 4 screenshots, found ${names.length}`);
  }
  const shots: { name: string; bytes: number }[] = [];
  for (const name of names) {
    const full = join(SHOTS_DIR, name);
    if (!statSync(full).isFile()) fail("screenshot is not a file: " + name);
    const bytes = statSync(full).size;
    if (bytes > MAX_SHOT_BYTES) {
      fail(`screenshot ${name} is ${bytes} bytes, over the ${MAX_SHOT_BYTES} cap`);
    }
    if (!/\.(png|jpe?g)$/i.test(name)) fail("screenshot is not a PNG or JPEG: " + name);
    shots.push({ name, bytes });
  }
  return shots;
}

function main(): void {
  if (!existsSync(APP_DIR)) fail("app/ is missing");
  const indexPath = join(APP_DIR, "index.html");
  if (!existsSync(indexPath)) fail("app/index.html is missing");
  if (statSync(indexPath).size > 1024 * 1024) fail("app/index.html is over 1 MiB");

  const trophies = checkTrophies();
  const shots = checkScreenshots();
  const head = gitHeadTimestamp();

  mkdirSync(OUT_DIR, { recursive: true });
  cpSync(APP_DIR, join(OUT_DIR, "app"), { recursive: true });
  cpSync(SHOTS_DIR, join(OUT_DIR, "screenshots"), { recursive: true });

  const appFiles = listFiles(join(OUT_DIR, "app"), join(OUT_DIR, "app")).map((rel) => ({
    path: "app/" + rel,
    bytes: statSync(join(OUT_DIR, "app", rel)).size,
  }));
  const shotFiles = shots.map((shot) => ({
    path: "screenshots/" + shot.name,
    bytes: shot.bytes,
  }));
  const manifest = {
    app: "Leonida Trophy Atlas",
    game: "Grand Theft Auto VI",
    gitHead: head.sha,
    builtAt: head.iso,
    trophies: trophies.count,
    grades: trophies.grades,
    files: [...appFiles, ...shotFiles],
    totalBytes: appFiles.reduce((sum, f) => sum + f.bytes, 0)
      + shotFiles.reduce((sum, f) => sum + f.bytes, 0),
  };
  writeFileSync(join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");

  const dossier = buildDossier(OUT_DIR, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: 4, max_bytes: MAX_SHOT_BYTES },
    app_max_files: 993,
    app_max_bytes: 48 * 1024 * 1024,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(OUT_DIR, "dossier.json"), dossier);

  console.log(
    `Leonida Trophy Atlas: ${trophies.count} trophies, ${shots.length} screenshots, ` +
    `head ${head.sha.slice(0, 7)}, builtAt ${head.iso} -> ${OUT_DIR}`,
  );
}

main();
