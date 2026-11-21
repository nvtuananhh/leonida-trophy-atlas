// store.js — persistence + export / import for the Leonida Trophy Atlas.
// Progress lives in localStorage under versioned keys; export writes a
// JSON file, import reads one back. Nothing leaves the browser.
export const EARNED_KEY = 'leonida-trophy-atlas.earned.v1';
export const SPOILER_KEY = 'leonida-trophy-atlas.spoiler.v1';

export function loadEarnedIds() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55));
  } catch {
    return new Set();
  }
}

export function saveEarnedIds(earned) {
  try {
    localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or unavailable (private mode): progress still works
    // in-memory for this session.
  }
}

export function loadSpoilerOn() {
  try {
    const raw = localStorage.getItem(SPOILER_KEY);
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

export function saveSpoilerOn(on) {
  try {
    localStorage.setItem(SPOILER_KEY, on ? '1' : '0');
  } catch {
    // Ignore: the toggle still works in-memory for this session.
  }
}

export function exportProgress(earned, spoilerOn) {
  const payload = {
    app: 'Leonida Trophy Atlas',
    version: 1,
    exportedTrophies: 55,
    spoilerOn,
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-trophy-atlas-progress.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importProgressFile(file) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const earned = Array.isArray(parsed.earned) ? parsed.earned : parsed;
  if (!Array.isArray(earned)) throw new Error('That file holds no earned-trophy list.');
  const ids = new Set(earned.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55));
  return { earned: ids, spoilerOn: typeof parsed.spoilerOn === 'boolean' ? parsed.spoilerOn : null };
}
