// roadmap.js — the six-stage platinum roadmap and the missable list for the
// Leonida Trophy Atlas. Stages are built from the official descriptions:
// story first, then side stories, collectibles, activities, clean-up, platinum.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Story playthrough',
    text: 'Play the five chapters in order and finish the final mission. Every chapter and named-mission trophy pops here, and so do the side-character finales as their strands end. Meditate at Jason\u2019s house in Chapter 1 — the one spot that may not come back.',
  },
  {
    stage: 2,
    title: 'Stage 2 — Side stories & strangers',
    text: 'Finish the last mission for Andy, Kenton, Billy, Randy and Tyrone, and complete 8 stranger mission strands across Leonida. Hunt Bret\u2019s unique animal while you are out there.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Collectibles',
    text: 'Complete 3 of the 18 collectible card sets, WAiNK It at 100 locations, discover 100 vehicles, explore every area of Leonida, and buy every garage property.',
  },
  {
    stage: 4,
    title: 'Stage 4 — Activities & the open world',
    text: 'Try all 9 activity types, then grind the big ones: 250 stunts, 20 different race wins, drone races at all 14 locations, fishing with Cal, an arcade game, and the 50 challenges. Robberies, vaults, armored trucks and gang operations all live here too.',
  },
  {
    stage: 5,
    title: 'Stage 5 — Clean-up & 100% completion',
    text: 'After the credits, open Progress > Stats > 100% Completion and work the checklist: gold in all 42 Shooting Range challenges, 5 of the 8 bank vaults, and the last stragglers. Only 70 of the 80 challenges are needed, so skip the hardest ones.',
  },
  {
    stage: 6,
    title: 'Stage 6 — Platinum',
    text: 'Vice Got a Price! pops the moment the other 54 are yours. About 200 hours, 4/10 difficulty, one playthrough, no online trophies.',
  },
];

export function trophiesForStage(trophies, stage) {
  return trophies.filter((t) => t.roadmapStage === stage).sort((a, b) => a.id - b.id);
}

export function missableTrophies(trophies) {
  return trophies.filter((t) => t.missable);
}

export function renderRoadmap(container, trophies, earned, onOpenDetail) {
  container.innerHTML = '';
  for (const stage of ROADMAP_STAGES) {
    const list = trophiesForStage(trophies, stage.stage);
    const done = list.filter((t) => earned.has(t.id)).length;
    const div = document.createElement('div');
    div.className = 'stage';
    const h3 = document.createElement('h3');
    h3.textContent = `${stage.title} — ${done}/${list.length}`;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const ul = document.createElement('ul');
    for (const t of list) {
      const li = document.createElement('li');
      const mark = earned.has(t.id) ? '✓ ' : '○ ';
      const flag = t.missable ? ' ⚠ missable' : '';
      li.textContent = `${mark}${t.name}${flag}`;
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => onOpenDetail(t.id));
      ul.appendChild(li);
    }
    div.append(h3, p, ul);
    container.appendChild(div);
  }
}
