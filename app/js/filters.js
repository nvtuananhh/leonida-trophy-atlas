const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const RARITY_GUESS = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function filterTrophies(trophies, state) {
  const query = state.query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.kind !== "all") {
      if (state.kind === "missable") {
        if (!t.missable) return false;
      } else if (state.kind === "online") {
        return false;
      } else if (t.kind !== state.kind) {
        return false;
      }
    }
    if (state.grade !== "all" && t.grade !== state.grade) return false;
    const earned = Boolean(state.earned[t.id]);
    if (state.earnedFilter === "earned" && !earned) return false;
    if (state.earnedFilter === "unearned" && earned) return false;
    if (state.missableOnly && !t.missable) return false;
    if (query) {
      const hay = `${t.name} ${t.description} ${t.mission || ""} ${t.chapter || ""} ${t.kind}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

export function sortTrophies(trophies, sortKey) {
  const list = [...trophies];
  if (sortKey === "alpha") return list.sort((a, b) => a.name.localeCompare(b.name));
  if (sortKey === "grade") {
    return list.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name));
  }
  if (sortKey === "rarity") {
    return list.sort((a, b) => RARITY_GUESS[a.grade] - RARITY_GUESS[b.grade] || (b.count || 0) - (a.count || 0));
  }
  return list.sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
}
