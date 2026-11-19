// filters.js — kind, grade, earned-state, search and sort for the tracker.
export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function applyTrophyFilters(trophies, state, filters) {
  const query = (filters.search || "").trim().toLowerCase();
  let list = trophies.filter((t) => {
    if (filters.kind === "missable" && !t.missable) return false;
    if (filters.kind === "online") return false;
    if (filters.kind !== "all" && filters.kind !== "missable" && t.kind !== filters.kind) return false;
    if (filters.grade !== "all" && t.grade !== filters.grade) return false;
    if (filters.earned === "earned" && !state.earned.has(t.id)) return false;
    if (filters.earned === "unearned" && state.earned.has(t.id)) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.mission || ""} ${t.chapter || ""}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  if (filters.sort === "alpha") {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  } else if (filters.sort === "grade") {
    list = [...list].sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name));
  } else {
    list = [...list].sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
  }
  return list;
}

export function kindFilterNote(kind, total) {
  if (kind === "online") {
    return "Online: 0 trophies. All 55 trophies are offline and single-player (PowerPyx lists 0 online trophies), so this filter is empty by design — nothing here needs GTA Online.";
  }
  if (kind === "missable") {
    return "Missable: 1 trophy is flagged as potentially missable — Positive Mental Attitude. See the Missables tab for the full warning.";
  }
  if (kind === "all") return "";
  return `Showing ${total} ${kind} trophies.`;
}
