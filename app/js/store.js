// store.js — localStorage persistence, export and import of tracker progress.
// The atlas is offline: progress lives in the browser only, and export/import
// is a plain JSON file the reader owns. Nothing is sent anywhere.
export const STORAGE_KEY = "leonida-trophy-atlas-v1";

export function defaultState() {
  return { earned: {}, spoiler: false, selectedId: null };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultState();
    return {
      earned: parsed.earned && typeof parsed.earned === "object" ? parsed.earned : {},
      spoiler: parsed.spoiler === true,
      selectedId: typeof parsed.selectedId === "number" ? parsed.selectedId : null,
    };
  } catch (_err) {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: state.earned,
      spoiler: state.spoiler,
      selectedId: state.selectedId,
    }));
  } catch (_err) {
    // Storage full or unavailable: the in-memory state still works.
  }
}

export function isEarned(state, id) {
  return state.earned[id] === true;
}

export function setEarned(state, id, value) {
  if (value) {
    state.earned[id] = true;
  } else {
    delete state.earned[id];
  }
  saveState(state);
}

export function earnedCount(state) {
  return Object.keys(state.earned).length;
}

export function earnedIds(state) {
  return Object.keys(state.earned).map(Number).sort((a, b) => a - b);
}

// Validate an imported file: it must be an object with an "earned" map of
// trophy ids (1-55) to true. Returns the earned map, or throws a message.
export function parseImport(text, validIds) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (_err) {
    throw new Error("That file is not valid JSON.");
  }
  const source = parsed && typeof parsed === "object" ? (parsed.earned || parsed) : null;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new Error("That file has no earned-trophy list in it.");
  }
  const earned = {};
  let found = 0;
  for (const key of Object.keys(source)) {
    const id = Number(key);
    if (validIds.has(id) && source[key] === true) {
      earned[id] = true;
      found += 1;
    }
  }
  if (found === 0) {
    throw new Error("No recognised trophy ids were found in that file.");
  }
  return earned;
}

export function exportProgress(state, trophies) {
  const payload = {
    app: "Leonida Trophy Atlas",
    game: "Grand Theft Auto VI",
    exported: new Date().toISOString().slice(0, 10),
    earnedCount: earnedCount(state),
    total: trophies.length,
    earned: state.earned,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-trophy-atlas-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
