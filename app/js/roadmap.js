export const ROADMAP_STAGES = [
  { stage: 1, title: "Story playthrough", note: "Chapters 1–4, the final mission and every named mission. Do the missable feats as they arise; there is no mission replay." },
  { stage: 2, title: "Side stories", note: "The five named stranger finales (Andy, Kenton, Billy, Randy, Tyrone) plus 8 stranger strands and Bret's hunt." },
  { stage: 3, title: "Collectibles & exploration", note: "Cards, WAiNK scans, vehicles, all 52 areas, garages and Scooter Bros registrations." },
  { stage: 4, title: "Activities", note: "Stunts, races, drone races, shooting range, fishing, arcade, meditation spots, challenges and bowling." },
  { stage: 5, title: "Clean-up & money", note: "Bank vaults, laundering, shop spending and shooting-range golds; check the 100% list as you go." },
  { stage: 6, title: "Platinum", note: "100% completion, then the platinum unlocks automatically." },
];

export function renderRoadmap(container, trophies, state, onSelect) {
  container.innerHTML = "";
  for (const stage of ROADMAP_STAGES) {
    const items = trophies.filter((t) => t.roadmapStage === stage.stage);
    const earned = items.filter((t) => state.earned[t.id]).length;
    const section = document.createElement("section");
    section.className = "stage";
    const heading = document.createElement("h3");
    heading.textContent = `Stage ${stage.stage} — ${stage.title} (${earned}/${items.length})`;
    const note = document.createElement("p");
    note.textContent = stage.note;
    const chips = document.createElement("div");
    chips.className = "chips";
    for (const trophy of items) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip" + (state.earned[trophy.id] ? " earned" : "") + (trophy.missable ? " miss" : "");
      chip.textContent = (state.earned[trophy.id] ? "✓ " : "") + trophy.name + (trophy.missable ? " ⚠ missable" : "");
      chip.addEventListener("click", () => onSelect(trophy.id));
      chips.appendChild(chip);
    }
    section.append(heading, note, chips);
    container.appendChild(section);
  }
}
