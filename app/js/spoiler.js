export function spoilerHides(trophy, state) {
  return Boolean(state.spoiler) && trophy.kind === "story" && !state.earned[trophy.id];
}

export function shownName(trophy, state) {
  return spoilerHides(trophy, state) ? "Hidden story trophy — earn it to reveal" : trophy.name;
}

export function shownDescription(trophy, state) {
  return spoilerHides(trophy, state) ? "Its name and description stay hidden until earned, with spoiler-safe mode on." : trophy.description;
}

export function spoilerNote(trophy, state) {
  if (!spoilerHides(trophy, state)) return "";
  return "Spoiler-safe mode is hiding this story trophy because it is not earned yet.";
}
