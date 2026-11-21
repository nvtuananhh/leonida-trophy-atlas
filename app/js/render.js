// render.js — the checklist, the detail panel and the progress header.
// All text goes through textContent (never innerHTML with data), so trophy
// names, guides and source names can never inject markup.
import { isEarned, earnedCount, setEarned } from "./store.js";
import { isSpoilerHidden, spoilerPlaceholder, spoilerSummary } from "./spoiler.js";
import { gradeLabel, kindLabel } from "./filters.js";

function badge(trophy) {
  const span = document.createElement("span");
  span.className = "grade-badge grade-" + trophy.grade;
  span.textContent = gradeLabel(trophy.grade);
  return span;
}

function kindTag(trophy) {
  const span = document.createElement("span");
  span.className = "kind-tag";
  span.textContent = kindLabel(trophy.kind);
  return span;
}

export function renderProgress(trophies, state) {
  const earned = earnedCount(state);
  const total = trophies.length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  document.getElementById("earnedCount").textContent = String(earned);
  const fill = document.getElementById("progressFill");
  fill.style.width = pct + "%";
  document.getElementById("progressBarWrap").setAttribute("aria-valuenow", String(earned));
  document.getElementById("progressText").textContent =
    earned + " of " + total + " earned · platinum " + pct + "%";
  const byGrade = {};
  for (const trophy of trophies) {
    if (!byGrade[trophy.grade]) byGrade[trophy.grade] = [0, 0];
    byGrade[trophy.grade][1] += 1;
    if (isEarned(state, trophy.id)) byGrade[trophy.grade][0] += 1;
  }
  const order = ["platinum", "gold", "silver", "bronze"];
  document.getElementById("gradeCounts").textContent = order
    .filter((g) => byGrade[g])
    .map((g) => gradeLabel(g) + " " + byGrade[g][0] + "/" + byGrade[g][1])
    .join(" · ");
}

export function renderList(listEl, trophies, state, handlers) {
  listEl.textContent = "";
  for (const trophy of trophies) {
    const item = document.createElement("li");
    item.className = "trophy" + (isEarned(state, trophy.id) ? " earned" : "")
      + (state.selectedId === trophy.id ? " selected" : "");
    item.dataset.id = String(trophy.id);

    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = isEarned(state, trophy.id);
    check.setAttribute("aria-label", "Mark " + trophy.name + " as earned");
    check.addEventListener("click", (event) => event.stopPropagation());
    check.addEventListener("change", () => handlers.onToggle(trophy.id, check.checked));
    item.appendChild(check);

    const body = document.createElement("div");
    const name = document.createElement("p");
    name.className = "trophy-name";
    const desc = document.createElement("p");
    desc.className = "trophy-desc";
    if (isSpoilerHidden(trophy, state)) {
      name.textContent = spoilerSummary(trophy);
      name.classList.add("spoiler-name");
      desc.textContent = spoilerPlaceholder(trophy);
    } else {
      name.textContent = trophy.name;
      desc.textContent = trophy.description;
    }
    body.appendChild(name);
    body.appendChild(desc);
    const meta = document.createElement("div");
    meta.className = "trophy-meta";
    meta.appendChild(badge(trophy));
    meta.appendChild(kindTag(trophy));
    if (trophy.hidden) {
      const hidden = document.createElement("span");
      hidden.className = "hidden-tag";
      hidden.textContent = "Hidden";
      meta.appendChild(hidden);
    }
    if (trophy.missable) {
      const flag = document.createElement("span");
      flag.className = "missable-badge";
      flag.textContent = "⚠ Missable";
      meta.appendChild(flag);
    }
    if (trophy.count) {
      const count = document.createElement("span");
      count.className = "count-tag";
      count.textContent = "Target: " + trophy.count;
      meta.appendChild(count);
    }
    body.appendChild(meta);
    item.appendChild(body);

    const mark = document.createElement("span");
    mark.className = "earned-mark";
    mark.textContent = isEarned(state, trophy.id) ? "✓ Earned" : "Not earned";
    mark.hidden = !isEarned(state, trophy.id);
    item.appendChild(mark);

    item.addEventListener("click", () => handlers.onSelect(trophy.id));
    listEl.appendChild(item);
  }
  document.getElementById("emptyNote").hidden = trophies.length !== 0;
}

export function renderDetail(panel, trophy, state, handlers) {
  panel.textContent = "";
  if (!trophy) {
    const p = document.createElement("p");
    p.className = "detail-empty";
    p.textContent = "Select a trophy on the left to read its guide, its sources and its missable warning.";
    panel.appendChild(p);
    return;
  }

  const meta = document.createElement("div");
  meta.className = "trophy-meta";
  meta.appendChild(badge(trophy));
  meta.appendChild(kindTag(trophy));
  if (trophy.hidden) {
    const hidden = document.createElement("span");
    hidden.className = "hidden-tag";
    hidden.textContent = "Hidden on PlayStation";
    meta.appendChild(hidden);
  }
  if (trophy.missable) {
    const flag = document.createElement("span");
    flag.className = "missable-badge";
    flag.textContent = "⚠ Missable";
    meta.appendChild(flag);
  }
  panel.appendChild(meta);

  const title = document.createElement("h2");
  title.textContent = trophy.name;
  panel.appendChild(title);

  const official = document.createElement("p");
  official.className = "official";
  official.textContent = "Official: “" + trophy.description + "”";
  panel.appendChild(official);

  const warn = document.createElement("p");
  if (trophy.missable) {
    warn.className = "missable-warning";
    warn.textContent = "⚠ Missable: " + trophy.missableWhy;
  } else {
    warn.className = "missable-safe";
    warn.textContent = "Not missable: " + trophy.missableWhy;
  }
  panel.appendChild(warn);

  const facts = document.createElement("p");
  facts.className = "detail-facts";
  const factBits = [];
  if (trophy.chapter) factBits.push("Chapter: " + trophy.chapter);
  if (trophy.mission) factBits.push("Mission: " + trophy.mission);
  if (trophy.count) factBits.push("Target: " + trophy.count);
  factBits.push("Roadmap stage: " + trophy.roadmapStage + " of 6");
  facts.textContent = factBits.join(" · ");
  panel.appendChild(facts);

  const guideHeading = document.createElement("h3");
  guideHeading.textContent = "How to earn it";
  panel.appendChild(guideHeading);
  const guide = document.createElement("p");
  guide.className = "guide-text";
  guide.textContent = trophy.guide;
  panel.appendChild(guide);

  const sourcesHeading = document.createElement("h3");
  sourcesHeading.textContent = "Sources — where this guide comes from";
  panel.appendChild(sourcesHeading);
  const sources = document.createElement("ul");
  sources.className = "sources";
  for (const source of trophy.sources || []) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    li.appendChild(link);
    sources.appendChild(li);
  }
  panel.appendChild(sources);

  const row = document.createElement("div");
  row.className = "earned-row";
  const label = document.createElement("label");
  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = isEarned(state, trophy.id);
  check.addEventListener("change", () => handlers.onToggle(trophy.id, check.checked));
  label.appendChild(check);
  const span = document.createElement("span");
  span.textContent = isEarned(state, trophy.id) ? "Earned — ticked off" : "Mark as earned";
  label.appendChild(span);
  row.appendChild(label);
  panel.appendChild(row);
}
