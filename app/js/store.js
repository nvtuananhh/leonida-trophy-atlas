// store.js — persistence, export and import for Leonida Trophy Atlas.
// State lives only in localStorage under one key; nothing leaves the browser.
export const STORE_KEY = "leonida-trophy-atlas-v1";

export function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: [], spoiler: true };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { earned: [], spoiler: true };
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => Number.isInteger(n)) : [],
      spoiler: parsed.spoiler !== false,
    };
  } catch (err) {
    return { earned: [], spoiler: true };
  }
}

export function saveStoredState(state) {
  const payload = { earned: [...state.earned].sort((a, b) => a - b), spoiler: state.spoiler };
  localStorage.setItem(STORE_KEY, JSON.stringify(payload));
  return payload;
}

export function exportProgress(state, trophies) {
  const payload = {
    app: "Leonida Trophy Atlas",
    game: "Grand Theft Auto VI",
    exportedAt: new Date().toISOString(),
    total: trophies.length,
    earned: [...state.earned].sort((a, b) => a - b),
    earnedNames: trophies.filter((t) => state.earned.has(t.id)).map((t) => t.name),
    spoiler: state.spoiler,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "leonida-trophy-atlas-progress.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload.earned.length;
}

export function parseImportedProgress(text, trophies) {
  const parsed = JSON.parse(text);
  const ids = Array.isArray(parsed.earned) ? parsed.earned : Array.isArray(parsed) ? parsed : null;
  if (!ids) throw new Error("Import file has no earned list.");
  const valid = new Set(trophies.map((t) => t.id));
  const earned = ids.map(Number).filter((n) => Number.isInteger(n) && valid.has(n));
  return { earned, spoiler: parsed.spoiler === true ? true : parsed.spoiler === false ? false : null };
}
