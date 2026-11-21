// spoiler.js — the spoiler setting: un-earned STORY trophies stay hidden
// until they are earned. Names and descriptions are both hidden; grade,
// kind and the "hidden story trophy" placeholder stay visible so the list
// still shows how many story trophies exist without spoiling them.
export function isSpoilerHidden(trophy, state) {
  if (!state.spoiler) return false;
  if (trophy.kind !== "story") return false;
  if (state.earned[trophy.id] === true) return false;
  return true;
}

export function spoilerPlaceholder(trophy) {
  return "Hidden story trophy — earn it to reveal its name and description.";
}

export function spoilerSummary(trophy) {
  return trophy.grade === "platinum"
    ? "Hidden platinum trophy"
    : "Hidden " + trophy.grade + " story trophy";
}
