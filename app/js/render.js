// render.js — list, progress bar, grade counts and the detail panel for the
// Leonida Trophy Atlas. Rendering is plain DOM: no framework, no network.
import { isSpoilerHidden, spoilerMaskText } from './spoiler.js';

const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const GRADE_SYMBOL = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };

export function renderProgress(trophies, earned) {
  const done = trophies.filter((t) => earned.has(t.id)).length;
  const pct = Math.round((done / trophies.length) * 100);
  document.getElementById('progressText').textContent = `${done} / ${trophies.length} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] ?? { total: 0, done: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.id)) byGrade[t.grade].done += 1;
  }
  document.getElementById('gradeCounts').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${GRADE_LABEL[g]} ${byGrade[g].done}/${byGrade[g].total}`)
    .join(' · ');
}

export function trophyCard(trophy, earned, spoilerOn, callbacks) {
  const li = document.createElement('li');
  li.className = `trophy-card${earned.has(trophy.id) ? ' earned' : ''}`;
  const hidden = isSpoilerHidden(trophy, earned, spoilerOn);
  const top = document.createElement('div');
  top.className = 'top';
  const dot = document.createElement('span');
  dot.className = `grade-dot grade-${trophy.grade}`;
  dot.textContent = GRADE_SYMBOL[trophy.grade];
  dot.title = GRADE_LABEL[trophy.grade];
  const h3 = document.createElement('h3');
  h3.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  top.append(dot, h3);
  const desc = document.createElement('p');
  desc.className = hidden ? 'official spoiler-mask' : 'official';
  desc.textContent = hidden ? spoilerMaskText() : trophy.description;
  const badges = document.createElement('div');
  badges.className = 'badge-row';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge grade-${trophy.grade}`;
  gradeBadge.textContent = GRADE_LABEL[trophy.grade];
  badges.appendChild(gradeBadge);
  if (trophy.hidden) {
    const b = document.createElement('span');
    b.className = 'badge hidden-badge';
    b.textContent = 'Hidden on PSN';
    badges.appendChild(b);
  }
  if (trophy.missable) {
    const b = document.createElement('span');
    b.className = 'badge missable';
    b.textContent = '⚠ Missable';
    badges.appendChild(b);
  }
  const kindBadge = document.createElement('span');
  kindBadge.className = 'badge';
  kindBadge.textContent = trophy.kind;
  badges.appendChild(kindBadge);
  if (trophy.count) {
    const b = document.createElement('span');
    b.className = 'badge';
    b.textContent = `×${trophy.count}`;
    badges.appendChild(b);
  }
  const snippet = document.createElement('p');
  snippet.className = 'guide-snippet';
  snippet.textContent = hidden ? '' : trophy.guide;
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  const earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  earnBtn.className = `earn-btn${earned.has(trophy.id) ? ' earned' : ''}`;
  earnBtn.textContent = earned.has(trophy.id) ? '✓ Earned — undo' : 'Mark earned';
  earnBtn.addEventListener('click', () => callbacks.onToggleEarned(trophy.id));
  const guideBtn = document.createElement('button');
  guideBtn.type = 'button';
  guideBtn.className = 'guide-btn';
  guideBtn.textContent = 'Guide & sources';
  guideBtn.addEventListener('click', () => callbacks.onOpenDetail(trophy.id));
  actions.append(earnBtn, guideBtn);
  li.append(top, desc, badges);
  if (trophy.missable && trophy.missableWhy) {
    const why = document.createElement('p');
    why.className = 'missable-why';
    why.textContent = `Missable: ${trophy.missableWhy}`;
    li.appendChild(why);
  }
  li.append(snippet, actions);
  return li;
}

export function renderList(listEl, emptyNote, countLine, trophies, earned, spoilerOn, callbacks) {
  listEl.innerHTML = '';
  for (const t of trophies) listEl.appendChild(trophyCard(t, earned, spoilerOn, callbacks));
  emptyNote.hidden = trophies.length !== 0;
  countLine.textContent = `Showing ${trophies.length} of 55 trophies.`;
}

export function renderDetail(panel, body, trophy, earned, spoilerOn, onToggleEarned) {
  const hidden = isSpoilerHidden(trophy, earned, spoilerOn);
  body.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'detail-inner';
  const h2 = document.createElement('h2');
  h2.textContent = hidden ? 'Hidden story trophy' : trophy.name;
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = hidden
    ? spoilerMaskText()
    : `${trophy.description} — ${GRADE_LABEL[trophy.grade]}${trophy.hidden ? ' · hidden on PlayStation until earned' : ''}`;
  inner.append(h2, official);
  if (trophy.missable && trophy.missableWhy) {
    const warn = document.createElement('p');
    warn.className = 'missable-why';
    warn.textContent = `⚠ Missable — ${trophy.missableWhy}`;
    inner.appendChild(warn);
  }
  const meta = document.createElement('p');
  const parts = [`Kind: ${trophy.kind}`, `Roadmap stage ${trophy.roadmapStage}`];
  if (trophy.chapter) parts.push(`Chapter: ${trophy.chapter}`);
  if (trophy.mission) parts.push(`Mission: ${trophy.mission}`);
  if (trophy.count) parts.push(`Tracked count: ${trophy.count}`);
  meta.textContent = parts.join(' · ');
  inner.appendChild(meta);
  const gh = document.createElement('h3');
  gh.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.textContent = trophy.guide;
  inner.append(gh, guide);
  const sh = document.createElement('h3');
  sh.textContent = 'Sources';
  const ul = document.createElement('ul');
  for (const s of trophy.sources) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.name;
    li.appendChild(a);
    ul.appendChild(li);
  }
  inner.append(sh, ul);
  const earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  earnBtn.className = `earn-btn${earned.has(trophy.id) ? ' earned' : ''}`;
  earnBtn.textContent = earned.has(trophy.id) ? '✓ Earned — undo' : 'Mark earned';
  earnBtn.addEventListener('click', () => onToggleEarned(trophy.id));
  inner.appendChild(earnBtn);
  body.appendChild(inner);
  panel.hidden = false;
}
