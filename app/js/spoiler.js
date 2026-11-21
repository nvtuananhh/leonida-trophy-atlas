// spoiler.js — the spoiler setting for the Leonida Trophy Atlas.
// When the setting is on, the name and description of an un-earned STORY
// trophy stay hidden until it is earned. Non-story trophies are never
// hidden: their names give nothing away.
export function isSpoilerHidden(trophy, earned, spoilerOn) {
  return spoilerOn && trophy.kind === 'story' && !earned.has(trophy.id);
}

export function spoilerMaskText() {
  return 'Hidden story trophy — earn it to reveal its name and description.';
}
