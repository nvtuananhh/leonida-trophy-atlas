import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ? resolve(process.env.MAKEFUN_OUTPUT_DIR) : "/output";
const appDir = join(repoRoot, "app");
const shotsDir = join(repoRoot, "screenshots");
const MAX_SHOT_BYTES = 262144;

function fail(message) {
  throw new Error(`Leonida Trophy Atlas build: ${message}`);
}

function gitWord(args, fallback) {
  try {
    return execFileSync("git", ["-C", repoRoot, ...args], { encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
}

function walk(dir, base) {
  const found = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full, base));
    else if (entry.isFile()) found.push(relative(base, full).split("\\").join("/"));
  }
  return found.sort();
}

function sha256Of(full) {
  return createHash("sha256").update(readFileSync(full)).digest("hex");
}

function main() {
  const indexPath = join(appDir, "index.html");
  if (!existsSync(indexPath) || !statSync(indexPath).isFile()) fail("app/index.html is missing");
  const dataPath = join(appDir, "data", "trophies.json");
  if (!existsSync(dataPath)) fail("app/data/trophies.json is missing");
  const data = JSON.parse(readFileSync(dataPath, "utf8"));
  const trophies = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(trophies) || trophies.length !== 55) fail(`expected 55 trophies, found ${Array.isArray(trophies) ? trophies.length : "none"}`);
  for (const trophy of trophies) {
    if (typeof trophy.guide !== "string" || trophy.guide.trim() === "") fail(`trophy ${trophy.id} has no guide`);
    if (typeof trophy.name !== "string" || trophy.name.trim() === "") fail(`trophy ${trophy.id} has no name`);
    if (!Array.isArray(trophy.sources) || trophy.sources.length < 1) fail(`trophy ${trophy.id} has no source`);
  }
  if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) fail("screenshots/ is missing");
  const shots = readdirSync(shotsDir).filter((name) => !name.startsWith(".") && /\.(png|jpe?g)$/i.test(name)).sort();
  if (shots.length < 3 || shots.length > 4) fail(`expected 3 or 4 screenshots, found ${shots.length}`);
  for (const name of shots) {
    const size = statSync(join(shotsDir, name)).size;
    if (size > MAX_SHOT_BYTES) fail(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
  }

  const gitHead = gitWord(["rev-parse", "HEAD"], "unknown");
  const gitHeadTimestamp = Number(gitWord(["log", "-1", "--format=%ct"], "0")) || 0;

  const manifestFiles = [];
  for (const rel of walk(appDir, repoRoot)) {
    const full = join(repoRoot, rel);
    manifestFiles.push({ path: rel, bytes: statSync(full).size, sha256: sha256Of(full) });
  }
  for (const name of shots) {
    const rel = `screenshots/${name}`;
    const full = join(repoRoot, rel);
    manifestFiles.push({ path: rel, bytes: statSync(full).size, sha256: sha256Of(full) });
  }
  manifestFiles.sort((a, b) => (a.path < b.path ? -1 : 1));
  const manifest = {
    app: "Leonida Trophy Atlas",
    gitHead,
    gitHeadTimestamp,
    trophies: trophies.length,
    screenshots: shots,
    totalBytes: manifestFiles.reduce((sum, file) => sum + file.bytes, 0),
    files: manifestFiles,
  };

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
  cpSync(appDir, join(outputDir, "app"), { recursive: true });
  cpSync(shotsDir, join(outputDir, "screenshots"), { recursive: true });
  writeFileSync(join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: MAX_SHOT_BYTES },
    app_max_files: 993,
    app_max_bytes: 48 * 1024 * 1024,
  });
  writeFileSync(join(outputDir, "dossier.json"), dossier);
  console.log(`Leonida Trophy Atlas: ${trophies.length} trophies, ${shots.length} screenshots, git ${gitHead} @ ${gitHeadTimestamp}`);
  console.log(`Wrote ${outputDir} (manifest + dossier, deterministic from git HEAD)`);
}

main();
