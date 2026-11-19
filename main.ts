// main.ts — Leonida Trophy Atlas entry program (Node 22, standard library only).
// Validates the guide, copies app/ and screenshots/ into the output directory,
// writes a build manifest, and writes /output/dossier.json with buildDossier
// from ./vendor/makefun-frontend.ts. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
import { buildDossier } from "./vendor/makefun-frontend.ts";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
const MAX_SCREENSHOT_BYTES = 262144;
const EXPECTED_TROPHIES = 55;

function fail(message) {
  throw new Error(`main.ts: ${message}`);
}

function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`${path} is not valid JSON (${err.message})`);
  }
}

function gitHead() {
  try {
    return execSync("git rev-parse HEAD", { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function listFilesRecursive(dir) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...listFilesRecursive(full));
    else if (entry.isFile()) found.push(full);
    else fail(`${full} is not a regular file`);
  }
  return found.sort();
}

function validateGuide() {
  const appDir = join(REPO_ROOT, "app");
  if (!existsSync(appDir) || !statSync(appDir).isDirectory()) fail("app/ is missing");
  const indexHtml = join(appDir, "index.html");
  if (!existsSync(indexHtml) || !statSync(indexHtml).isFile()) fail("app/index.html is missing");

  const trophiesPath = join(appDir, "data", "trophies.json");
  if (!existsSync(trophiesPath)) fail("app/data/trophies.json is missing");
  const data = readJsonFile(trophiesPath);
  const trophies = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(trophies)) fail("app/data/trophies.json holds no trophies array");
  if (trophies.length !== EXPECTED_TROPHIES) {
    fail(`trophies.json holds ${trophies.length} trophies, expected ${EXPECTED_TROPHIES}`);
  }
  const withoutGuide = trophies.filter((t) => !t || typeof t.guide !== "string" || t.guide.trim() === "");
  if (withoutGuide.length > 0) {
    fail(`${withoutGuide.length} trophies have no guide (first: ${withoutGuide[0].name ?? withoutGuide[0].id})`);
  }
  const withoutSource = trophies.filter((t) => !Array.isArray(t.sources) || t.sources.length === 0);
  if (withoutSource.length > 0) {
    fail(`${withoutSource.length} trophies have no cited source (first: ${withoutSource[0].name})`);
  }
  const grades = {};
  for (const t of trophies) grades[t.grade] = (grades[t.grade] ?? 0) + 1;
  if (grades.platinum !== 1 || grades.gold !== 2 || grades.silver !== 6 || grades.bronze !== 46) {
    fail(`unexpected grade split: ${JSON.stringify(grades)}`);
  }
  return { trophies, grades };
}

function validateScreenshots() {
  const shotsDir = join(REPO_ROOT, "screenshots");
  if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) fail("screenshots/ is missing");
  const names = readdirSync(shotsDir).filter((n) => !n.startsWith(".")).sort();
  if (names.length < 3 || names.length > 4) fail(`screenshots/ holds ${names.length} files, expected 3 or 4`);
  const shots = [];
  for (const name of names) {
    const full = join(shotsDir, name);
    if (!statSync(full).isFile()) fail(`screenshots/${name} is not a regular file`);
    const size = statSync(full).size;
    if (size > MAX_SCREENSHOT_BYTES) fail(`screenshots/${name} is ${size} bytes, over ${MAX_SCREENSHOT_BYTES}`);
    shots.push({ name, size });
  }
  return shots;
}

function buildManifest(appFiles, shots) {
  const files = [];
  for (const full of appFiles) {
    files.push({ path: `app/${relative(join(REPO_ROOT, "app"), full)}`, bytes: statSync(full).size });
  }
  for (const shot of shots) {
    files.push({ path: `screenshots/${shot.name}`, bytes: shot.size });
  }
  return {
    app: "Leonida Trophy Atlas",
    competition: "gta6-trophy-guide-01",
    gitHead: gitHead(),
    builtAt: new Date().toISOString(),
    trophyCount: 55,
    files,
  };
}

function main() {
  const { trophies, grades } = validateGuide();
  const shots = validateScreenshots();
  const appFiles = listFilesRecursive(join(REPO_ROOT, "app"));

  mkdirSync(OUTPUT_DIR, { recursive: true });
  cpSync(join(REPO_ROOT, "app"), join(OUTPUT_DIR, "app"), { recursive: true });
  cpSync(join(REPO_ROOT, "screenshots"), join(OUTPUT_DIR, "screenshots"), { recursive: true });

  const manifest = buildManifest(appFiles, shots);
  writeFileSync(join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: MAX_SCREENSHOT_BYTES },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  });
  writeFileSync(join(OUTPUT_DIR, "dossier.json"), dossier);

  const totalAppBytes = appFiles.reduce((sum, f) => sum + statSync(f).size, 0);
  console.log(
    `Leonida Trophy Atlas: ${trophies.length} trophies ` +
      `(platinum ${grades.platinum}, gold ${grades.gold}, silver ${grades.silver}, bronze ${grades.bronze}), ` +
      `${appFiles.length} app files (${totalAppBytes} bytes), ${shots.length} screenshots -> ${OUTPUT_DIR}`,
  );
}

main();
