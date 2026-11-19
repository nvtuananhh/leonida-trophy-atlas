// spoiler.js — the spoiler setting: un-earned STORY trophies stay hidden.
// The rule is narrow on purpose: only story-kind trophies, only while un-earned.
// Grades, kinds and counts are never hidden; only the name and description are.
export function isSpoilerHidden(trophy, state) {
  return state.spoiler && trophy.kind === "story" && !state.earned.has(trophy.id);
}

export function spoilerName(trophy, state) {
  return isSpoilerHidden(trophy, state) ? "Hidden story trophy" : trophy.name;
}

export function spoilerDescription(trophy, state) {
  return isSpoilerHidden(trophy, state)
    ? "Hidden until earned — turn the spoiler setting off, or tick this trophy earned, to reveal it."
    : trophy.description;
}
