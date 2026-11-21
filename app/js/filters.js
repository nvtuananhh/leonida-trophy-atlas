// filters.js — kind / grade / earned-state filters, text search and sorting.
// Every filter is pure: it takes the trophy list and the current options and
// returns a new array, so the checklist, the roadmap and the missable view
// can never disagree about what a filter means.
export const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };

export function kindLabel(kind) {
  switch (kind) {
    case "story": return "Story";
    case "missable": return "Missable";
    case "collectible": return "Collectible";
    case "activity": return "Activity";
    case "online": return "Online";
    default: return kind;
  }
}

export function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

export function matchesSearch(trophy, query) {
  if (!query) return true;
  const haystack = [
    trophy.name,
    trophy.description,
    trophy.chapter || "",
    trophy.mission || "",
    trophy.guide || "",
    kindLabel(trophy.kind),
    gradeLabel(trophy.grade),
  ].join(" ").toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).every((word) => haystack.includes(word));
}

export function applyFilters(trophies, state, options) {
  const query = (options.search || "").trim();
  const filtered = trophies.filter((trophy) => {
    if (options.kind && options.kind !== "all") {
      if (options.kind === "missable") {
        if (!trophy.missable) return false;
      } else if (trophy.kind !== options.kind) {
        return false;
      }
    }
    if (options.grade && options.grade !== "all" && trophy.grade !== options.grade) return false;
    if (options.stateFilter === "earned" && state.earned[trophy.id] !== true) return false;
    if (options.stateFilter === "unearned" && state.earned[trophy.id] === true) return false;
    if (!matchesSearch(trophy, query)) return false;
    return true;
  });
  return sortTrophies(filtered, options.sort || "roadmap");
}

export function sortTrophies(trophies, sort) {
  const list = trophies.slice();
  switch (sort) {
    case "alpha":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    case "grade":
      return list.sort((a, b) =>
        GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.name.localeCompare(b.name));
    case "rarity":
      // Hardest first: platinum, gold, silver, bronze; within a grade the
      // longest grinds (biggest count) first, then roadmap order.
      return list.sort((a, b) =>
        GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade]
        || (b.count || 0) - (a.count || 0)
        || a.roadmapStage - b.roadmapStage
        || a.id - b.id);
    case "roadmap":
    default:
      return list.sort((a, b) =>
        a.roadmapStage - b.roadmapStage || a.id - b.id);
  }
}

export function filterStatusText(shown, total, options) {
  const parts = [];
  parts.push("Showing " + shown + " of " + total + " trophies");
  if (options.kind && options.kind !== "all") parts.push("kind: " + kindLabel(options.kind));
  if (options.grade && options.grade !== "all") parts.push("grade: " + gradeLabel(options.grade));
  if (options.stateFilter === "earned") parts.push("earned only");
  if (options.stateFilter === "unearned") parts.push("unearned only");
  if ((options.search || "").trim()) parts.push("matching “" + options.search.trim() + "”");
  return parts.join(" · ") + ".";
}
