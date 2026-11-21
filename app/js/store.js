export const STORAGE_KEY = "leonida-trophy-atlas-v1";

export function defaultState() {
  return { earned: {}, spoiler: false, query: "", kind: "all", grade: "all", earnedFilter: "all", missableOnly: false, sort: "roadmap", selectedId: 1 };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState();
    return { ...defaultState(), ...parsed, earned: { ...(parsed.earned || {}) } };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable: progress stays in memory */
  }
}

export function exportProgress(state, trophies) {
  const earnedIds = trophies.filter((t) => state.earned[t.id]).map((t) => t.id);
  return JSON.stringify({ app: "Leonida Trophy Atlas", version: 1, exportedEarned: earnedIds, spoiler: state.spoiler, state }, null, 2);
}

export function importProgress(text, trophies) {
  const parsed = JSON.parse(text);
  const known = new Set(trophies.map((t) => t.id));
  const base = defaultState();
  if (Array.isArray(parsed.exportedEarned)) {
    for (const id of parsed.exportedEarned) if (known.has(id)) base.earned[id] = true;
    if (typeof parsed.spoiler === "boolean") base.spoiler = parsed.spoiler;
    return base;
  }
  if (parsed && typeof parsed === "object" && parsed.state && typeof parsed.state === "object") {
    const merged = { ...base, ...parsed.state, earned: {} };
    for (const [key, value] of Object.entries(parsed.state.earned || {})) {
      const id = Number(key);
      if (known.has(id) && value) merged.earned[id] = true;
    }
    return merged;
  }
  throw new Error("Unrecognised progress file");
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
