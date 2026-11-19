// roadmap.js — the six-stage platinum roadmap and the missables pages.
// Stages and their trophies come straight from each trophy's roadmapStage,
// which was assigned from its official description (chapter, mission, count).
import { spoilerName, isSpoilerHidden } from "./spoiler.js";
export const ROADMAP_STAGES = [
  { stage: 1, title: "Stage 1 — Story playthrough", text: "Play the story start to finish: Chapters 1 to 5, the named missions, and the final mission (gold). The story takes around 60–80 hours (PowerPyx). Do the Chapter 1 balcony meditation now — it is the only potentially missable step in the whole list." },
  { stage: 2, title: "Stage 2 — Side stories", text: "Finish the stranger strands and the five side-character finals — Andy, Kenton, Billy, Randy and Tyrone — plus Bret's hunt. 8 stranger strands earn the silver Strangers & Freaks." },
  { stage: 3, title: "Stage 3 — Collectibles", text: "Sweep Leonida: meditate at all 18 spots, finish 3 card sets, WAiNK It at 100 locations, discover 100 vehicles, explore the whole map, and register 10 vehicles to the Scooter Bros app." },
  { stage: 4, title: "Stage 4 — Activities", text: "The skill grind: 250 stunts, gold in all 42 Shooting Range challenges, a drone-race win at all 14 Top Fun locations, 20 race wins, a fishing win over Cal, one arcade game, and bowling at Kolt & Associates. Try all 9 activity types for Master of None." },
  { stage: 5, title: "Stage 5 — Clean-up", text: "Free-roam leftovers: robberies (5 bank vaults, an armored truck, shops with your partner), the 4-star wanted escape, Combat Focus, the airport departure, the money trophies ($250,000 laundered, $100,000 spent, every garage), and the vague one-off trophies whose methods were not yet confirmed at launch." },
  { stage: 6, title: "Stage 6 — Platinum", text: "Finish the 100% completion checklist for A Long Road (gold), then Vice Got a Price! pops. The checklist is lenient — about 60% of true completion (PowerPyx): 70 of 80 challenges, 300 of 397 stunts, 200 of 277 vehicles, 100 of 255 animals, and all 42 Shooting Range golds." },
];

export function trophiesForStage(trophies, stage) {
  return trophies.filter((t) => t.roadmapStage === stage).sort((a, b) => a.id - b.id);
}

export function renderRoadmap(container, trophies, state, onSelect) {
  container.innerHTML = "";
  for (const stage of ROADMAP_STAGES) {
    const members = trophiesForStage(trophies, stage.stage);
    const earned = members.filter((t) => state.earned.has(t.id)).length;
    const box = document.createElement("article");
    box.className = "stage";
    const heading = document.createElement("h3");
    heading.textContent = stage.title;
    const progress = document.createElement("p");
    progress.className = "stage-progress";
    progress.textContent = `${earned} / ${members.length} earned in this stage`;
    const text = document.createElement("p");
    text.textContent = stage.text;
    const chips = document.createElement("div");
    chips.className = "stage-trophies";
    for (const t of members) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "stage-chip" + (state.earned.has(t.id) ? " is-earned" : "");
      // The roadmap respects the spoiler setting too: an un-earned story
      // trophy shows only its grade here until it is earned.
      chip.textContent = `${spoilerName(t, state)} · ${t.grade}`;
      if (isSpoilerHidden(t, state)) chip.classList.add("spoiler-text");
      chip.addEventListener("click", () => onSelect(t.id));
      chips.appendChild(chip);
    }
    box.append(heading, progress, text, chips);
    container.appendChild(box);
  }
}

export function renderMissables(missableContainer, unconfirmedContainer, trophies, state, onSelect) {
  missableContainer.innerHTML = "";
  const missable = trophies.filter((t) => t.missable);
  if (missable.length === 0) {
    missableContainer.textContent = "No missable trophies are flagged.";
  }
  for (const t of missable) {
    const card = document.createElement("article");
    card.className = "missable-card";
    const heading = document.createElement("h3");
    heading.textContent = `⚠ ${t.name} — ${t.grade}`;
    const why = document.createElement("p");
    why.textContent = t.missableWhy;
    const guide = document.createElement("p");
    guide.textContent = t.guide;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "earn-btn" + (state.earned.has(t.id) ? " is-earned" : "");
    button.textContent = state.earned.has(t.id) ? "✓ Earned — ticked" : "Open its full guide";
    button.addEventListener("click", () => onSelect(t.id));
    card.append(heading, why, guide, button);
    missableContainer.appendChild(card);
  }
  const note = document.createElement("p");
  note.textContent = "Every other trophy is either automatic story progress or earnable in free-roam after the story, with no mission replay needed for it. PowerPyx and GTABase agree: this is the only trophy either guide flags.";
  missableContainer.appendChild(note);

  unconfirmedContainer.innerHTML = "";
  const unconfirmed = trophies.filter((t) => /not yet known/i.test(t.guide));
  for (const t of unconfirmed) {
    const item = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = t.name + " — ";
    item.append(strong, document.createTextNode(t.description));
    unconfirmedContainer.appendChild(item);
  }
}
