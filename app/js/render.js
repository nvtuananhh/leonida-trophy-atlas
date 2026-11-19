// render.js — the trophy list and the detail pane.
import { spoilerName, spoilerDescription, isSpoilerHidden } from "./spoiler.js";

const GRADE_LABEL = { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };

function badge(text, cls) {
  const span = document.createElement("span");
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function renderProgress(trophies, state) {
  const earned = trophies.filter((t) => state.earned.has(t.id)).length;
  const total = trophies.length;
  document.getElementById("progressCount").textContent = `${earned} / ${total} earned`;
  document.getElementById("progressPct").textContent = `${Math.round((earned / total) * 100)}%`;
  document.getElementById("progressFill").style.width = `${(earned / total) * 100}%`;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { earned: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (state.earned.has(t.id)) byGrade[t.grade].earned += 1;
  }
  document.getElementById("gradeCounts").textContent = ["platinum", "gold", "silver", "bronze"]
    .map((g) => `${GRADE_LABEL[g]} ${byGrade[g].earned}/${byGrade[g].total}`)
    .join(" · ");
}

export function renderTrophyList(listEl, trophies, state, selectedId, onSelect, onToggle) {
  listEl.innerHTML = "";
  for (const t of trophies) {
    const item = document.createElement("li");
    item.className = "trophy-card" + (state.earned.has(t.id) ? " is-earned" : "") + (t.id === selectedId ? " is-selected" : "");
    const top = document.createElement("div");
    top.className = "trophy-top";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "trophy-check";
    check.checked = state.earned.has(t.id);
    check.setAttribute("aria-label", `Mark ${t.name} earned`);
    check.addEventListener("click", (event) => { event.stopPropagation(); onToggle(t.id); });
    const name = document.createElement("p");
    name.className = "trophy-name";
    name.textContent = spoilerName(t, state);
    if (isSpoilerHidden(t, state)) name.classList.add("spoiler-text");
    top.append(check, name);
    const desc = document.createElement("p");
    desc.className = "trophy-desc";
    desc.textContent = spoilerDescription(t, state);
    const meta = document.createElement("div");
    meta.className = "trophy-meta";
    meta.append(badge(GRADE_LABEL[t.grade], `badge-${t.grade}`));
    meta.append(badge(t.kind === "story" ? "Story" : t.kind === "collectible" ? "Collectible" : "Activity", "badge-kind"));
    if (t.hidden) meta.append(badge("Hidden on PSN", "badge-hidden"));
    if (t.missable) meta.append(badge("⚠ Missable", "badge-missable"));
    if (t.count !== null && t.count !== undefined) meta.append(badge(`Target: ${t.count.toLocaleString("en-US")}`, ""));
    if (t.chapter) meta.append(badge(t.chapter, ""));
    item.append(top, desc, meta);
    item.addEventListener("click", () => onSelect(t.id));
    listEl.appendChild(item);
  }
}

export function renderDetail(pane, trophy, state, onToggle) {
  if (!trophy) {
    pane.innerHTML = "<h2>Pick a trophy</h2><p>Select any trophy in the list to see its official description, the guide in our own words, and its sources. Tick the box to mark it earned — progress is saved in this browser.</p>";
    return;
  }
  const hidden = isSpoilerHidden(trophy, state);
  const earned = state.earned.has(trophy.id);
  const sources = trophy.sources.map((s) => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a></li>`).join("");
  const facts = [
    trophy.chapter ? `Chapter: ${escapeHtml(trophy.chapter)}` : "",
    trophy.mission ? `Mission: ${escapeHtml(trophy.mission)}` : "",
    trophy.count !== null && trophy.count !== undefined ? `PSN target: ${trophy.count.toLocaleString("en-US")}` : "",
    `Roadmap stage ${trophy.roadmapStage} of 6`,
    trophy.hidden ? "Hidden on PlayStation until earned" : "Visible on PlayStation",
  ].filter(Boolean).join(" · ");
  pane.innerHTML = `
    <h2>${hidden ? "Hidden story trophy" : escapeHtml(trophy.name)}</h2>
    <p><span class="badge badge-${trophy.grade}">${GRADE_LABEL[trophy.grade]}</span>
    ${trophy.missable ? '<span class="badge badge-missable">⚠ Missable</span>' : ""}
    ${trophy.hidden ? '<span class="badge badge-hidden">Hidden on PSN</span>' : ""}</p>
    <p class="trophy-desc">${hidden ? "Hidden until earned — turn the spoiler setting off, or tick this trophy earned, to reveal it." : escapeHtml(trophy.description)}</p>
    ${trophy.missable ? `<div class="missable-warning"><strong>⚠ Do not miss:</strong> ${escapeHtml(trophy.missableWhy)}</div>` : ""}
    <div class="detail-guide"><h3>Guide — our own words</h3><p>${escapeHtml(trophy.guide)}</p></div>
    <div class="detail-sources"><h3>Sources</h3><ul>${sources}</ul><p class="detail-facts">Sources are cited, never copied. Links open only if you follow them; this page fetches nothing.</p></div>
    <p class="detail-facts">${facts}</p>
    <button type="button" class="earn-btn${earned ? " is-earned" : ""}" id="detailEarnBtn">${earned ? "✓ Earned — click to untick" : "Mark as earned"}</button>`;
  pane.querySelector("#detailEarnBtn").addEventListener("click", () => onToggle(trophy.id));
}
