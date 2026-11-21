import { shownName, shownDescription, spoilerHides } from "./spoiler.js";

export function gradeCounts(trophies, state) {
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const trophy of trophies) {
    counts[trophy.grade][1] += 1;
    if (state.earned[trophy.id]) counts[trophy.grade][0] += 1;
  }
  return counts;
}

export function renderProgress(progressEl, fillEl, countsEl, trophies, state) {
  const earned = trophies.filter((t) => state.earned[t.id]).length;
  progressEl.textContent = `${earned} / ${trophies.length} trophies earned`;
  fillEl.style.width = `${Math.round((earned / trophies.length) * 100)}%`;
  const counts = gradeCounts(trophies, state);
  countsEl.textContent = Object.entries(counts)
    .map(([grade, [got, total]]) => `${grade}: ${got}/${total}`)
    .join(" · ") + ` · hidden: ${trophies.filter((t) => t.hidden).length} · missable: ${trophies.filter((t) => t.missable).length}`;
}

export function renderList(listEl, trophies, state, onToggle, onSelect) {
  listEl.innerHTML = "";
  for (const trophy of trophies) {
    const item = document.createElement("li");
    item.className = "card" + (state.earned[trophy.id] ? " earned" : "");
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = Boolean(state.earned[trophy.id]);
    box.setAttribute("aria-label", `Mark ${trophy.name} earned`);
    box.addEventListener("change", () => onToggle(trophy.id, box.checked));
    const body = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = shownName(trophy, state);
    const desc = document.createElement("p");
    desc.className = "desc";
    desc.textContent = shownDescription(trophy, state);
    const meta = document.createElement("div");
    meta.className = "meta";
    const grade = document.createElement("span");
    grade.className = `badge ${trophy.grade}`;
    grade.textContent = trophy.grade;
    meta.appendChild(grade);
    const kind = document.createElement("span");
    kind.className = "badge kind";
    kind.textContent = trophy.kind;
    meta.appendChild(kind);
    if (trophy.hidden) {
      const flag = document.createElement("span");
      flag.className = "badge hiddenflag";
      flag.textContent = "hidden on PSN";
      meta.appendChild(flag);
    }
    if (trophy.count) {
      const count = document.createElement("span");
      count.className = "badge countflag";
      count.textContent = `count: ${trophy.count.toLocaleString()}`;
      meta.appendChild(count);
    }
    if (trophy.missable) {
      const miss = document.createElement("span");
      miss.className = "badge missbadge";
      miss.textContent = "⚠ Missable";
      meta.appendChild(miss);
    }
    body.append(title, desc, meta);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "guideBtn";
    button.textContent = "Guide →";
    button.addEventListener("click", () => onSelect(trophy.id));
    item.append(box, body, button);
    listEl.appendChild(item);
  }
  if (trophies.length === 0) {
    const empty = document.createElement("li");
    empty.className = "card";
    empty.textContent = "No trophies match these filters. Clear the search or choose All kinds.";
    listEl.appendChild(empty);
  }
}

export function renderDetail(detailEl, trophy, state, onToggle) {
  detailEl.innerHTML = "";
  if (!trophy) {
    detailEl.textContent = "Select a trophy to read its guide.";
    return;
  }
  const heading = document.createElement("h2");
  heading.textContent = "Trophy guide";
  const official = document.createElement("div");
  official.className = "official";
  const name = document.createElement("h3");
  name.textContent = spoilerHides(trophy, state) ? "Hidden story trophy" : trophy.name;
  const desc = document.createElement("p");
  desc.textContent = spoilerHides(trophy, state) ? "Hidden until earned (spoiler-safe mode)." : trophy.description;
  const meta = document.createElement("p");
  meta.textContent = `Grade: ${trophy.grade} · Kind: ${trophy.kind} · Stage ${trophy.roadmapStage}` +
    (trophy.chapter ? ` · ${trophy.chapter}` : "") + (trophy.mission ? ` · Mission: ${trophy.mission}` : "") +
    (trophy.count ? ` · Tracked count: ${trophy.count.toLocaleString()}` : "") + (trophy.hidden ? " · Hidden on PlayStation" : "");
  official.append(name, desc, meta);
  const guideHeading = document.createElement("h3");
  guideHeading.textContent = "Guide (own words)";
  const guide = document.createElement("p");
  guide.className = "guideText";
  guide.textContent = trophy.guide;
  detailEl.append(heading, official, guideHeading, guide);
  if (trophy.missable) {
    const warn = document.createElement("p");
    warn.className = "warn";
    warn.textContent = `⚠ Missable — do not miss: ${trophy.missableWhy}`;
    detailEl.appendChild(warn);
  }
  const sourcesHeading = document.createElement("h3");
  sourcesHeading.textContent = "Sources";
  const list = document.createElement("ul");
  list.className = "sources";
  for (const source of trophy.sources || []) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.textContent = source.name;
    link.target = "_blank";
    link.rel = "noopener";
    item.appendChild(link);
    list.appendChild(item);
  }
  detailEl.append(sourcesHeading, list);
  const earnedLabel = document.createElement("label");
  earnedLabel.className = "check";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = Boolean(state.earned[trophy.id]);
  box.addEventListener("change", () => onToggle(trophy.id, box.checked));
  earnedLabel.append(box, document.createTextNode(" Earned"));
  detailEl.appendChild(earnedLabel);
}
