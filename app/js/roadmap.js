// roadmap.js — the platinum roadmap (6 stages, in earning order) and the
// dedicated missable view. Both are built from the trophy data itself:
// stage, chapter and mission come from app/data/trophies.json, so the
// roadmap can never drift away from the checklist.
import { isEarned } from "./store.js";
import { gradeLabel, kindLabel } from "./filters.js";

export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: "Stage 1 — Play the story",
    time: "60–80 hours · 13 trophies",
    text: "Finish all five chapters and the named story missions. Do the Chapter 1 balcony meditation for 'Positive Mental Attitude' before the chapter ends — it is the only thing in the game that can be missed. Scan new vehicles and places with WAiNK as you go; the counters already count.",
  },
  {
    stage: 2,
    title: "Stage 2 — Side stories",
    time: "7 trophies",
    text: "Finish the character quest lines (Andy, Kenton, Billy, Randy, Tyrone), Bret's hunt, and 8 Strangers & Freaks strands. Andy is Lucia-only; Tyrone and Bret are Jason-only. Quest givers who vanish mid-story always return in free roam.",
  },
  {
    stage: 3,
    title: "Stage 3 — Collectibles",
    time: "5 trophies",
    text: "Cards (3 full sets for this stage, 15 for 100%), WAiNK scans (100), vehicles discovered (100), all 52 areas of Leonida explored, and all 8 garage properties bought.",
  },
  {
    stage: 4,
    title: "Stage 4 — Activities",
    time: "25 trophies",
    text: "Races, drone races, the shooting range, fishing, arcade, bowling, robberies, stunts and the odd one-off moments — the wide middle of the list. Most of these overlap with the 100% checklist, so work them together.",
  },
  {
    stage: 5,
    title: "Stage 5 — Clean-up",
    time: "4 trophies",
    text: "Open the 100% Completion Checklist under Progress after the finale and work it line by line until 'A Long Road' pops. Finish the 50 challenges and the two money totals ($250,000 laundered, $100,000 spent) on the way.",
  },
  {
    stage: 6,
    title: "Stage 6 — Platinum",
    time: "1 trophy",
    text: "'Vice Got a Price!' unlocks the moment the other 54 are earned. There is nothing left to do but enjoy being a Leonida Legend.",
  },
];

function trophyLine(trophy, state, onSelect) {
  const li = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "stage-trophy-link";
  button.textContent = trophy.name;
  button.addEventListener("click", () => onSelect(trophy.id));
  li.appendChild(button);
  const note = document.createElement("span");
  note.className = "t-note";
  const bits = [gradeLabel(trophy.grade), kindLabel(trophy.kind)];
  if (trophy.chapter) bits.push(trophy.chapter);
  if (trophy.mission) bits.push(trophy.mission);
  if (trophy.count) bits.push("×" + trophy.count);
  if (trophy.missable) bits.push("MISSABLE");
  note.textContent = " — " + bits.join(" · ");
  li.appendChild(note);
  if (isEarned(state, trophy.id)) {
    const mark = document.createElement("span");
    mark.className = "t-note";
    mark.textContent = " ✓ earned";
    li.appendChild(mark);
  }
  return li;
}

export function renderRoadmap(container, trophies, state, onSelect) {
  container.textContent = "";
  for (const stage of ROADMAP_STAGES) {
    const members = trophies
      .filter((t) => t.roadmapStage === stage.stage)
      .sort((a, b) => a.id - b.id);
    const earned = members.filter((t) => isEarned(state, t.id)).length;
    const section = document.createElement("section");
    section.className = "stage";
    const heading = document.createElement("h3");
    heading.textContent = stage.title;
    section.appendChild(heading);
    const meta = document.createElement("p");
    meta.className = "stage-meta";
    meta.textContent = stage.time + " · " + earned + "/" + members.length + " earned";
    section.appendChild(meta);
    const text = document.createElement("p");
    text.textContent = stage.text;
    section.appendChild(text);
    const list = document.createElement("ul");
    for (const trophy of members) list.appendChild(trophyLine(trophy, state, onSelect));
    section.appendChild(list);
    container.appendChild(section);
  }
}

export function renderMissables(container, trophies, state, onSelect) {
  container.textContent = "";
  const missable = trophies.filter((t) => t.missable);
  if (missable.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No missable trophies are currently known.";
    container.appendChild(p);
    return;
  }
  for (const trophy of missable) {
    const card = document.createElement("article");
    card.className = "stage";
    const heading = document.createElement("h3");
    heading.textContent = "⚠ " + trophy.name + " — " + gradeLabel(trophy.grade);
    card.appendChild(heading);
    const why = document.createElement("p");
    why.textContent = trophy.missableWhy;
    card.appendChild(why);
    const guide = document.createElement("p");
    guide.textContent = trophy.guide;
    card.appendChild(guide);
    const open = document.createElement("button");
    open.type = "button";
    open.className = "btn";
    open.textContent = "Open its full guide";
    open.addEventListener("click", () => onSelect(trophy.id));
    card.appendChild(open);
    container.appendChild(card);
  }
}
