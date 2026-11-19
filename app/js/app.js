// app.js — boot, state and wiring for Leonida Trophy Atlas.
// Loads app/data/trophies.json (a file of this app, nothing else), restores
// progress from localStorage, and wires the tracker, roadmap and missables.
// Query params (for reproducible screenshots and deep links):
//   ?seed=demo&detail=28  seeds 13 earned trophies and opens one detail pane
//   ?view=roadmap|missables  opens that tab
//   ?spoiler=off  turns the spoiler setting off
import { loadStoredState, saveStoredState, exportProgress, parseImportedProgress } from "./store.js";
import { applyTrophyFilters, kindFilterNote } from "./filters.js";
import { renderProgress, renderTrophyList, renderDetail } from "./render.js";
import { renderRoadmap, renderMissables } from "./roadmap.js";

const DEMO_EARNED = [1, 2, 3, 8, 14, 15, 16, 20, 21, 28, 35, 42, 55];

const state = {
  trophies: [],
  earned: new Set(),
  spoiler: true,
  view: "tracker",
  selectedId: null,
  filters: { kind: "all", grade: "all", earned: "all", search: "", sort: "roadmap" },
};

function persist() {
  saveStoredState({ earned: state.earned, spoiler: state.spoiler });
}

function refreshAll() {
  const filtered = applyTrophyFilters(state.trophies, state, state.filters);
  renderProgress(state.trophies, state);
  renderTrophyList(
    document.getElementById("trophyList"),
    filtered,
    state,
    state.selectedId,
    (id) => selectTrophy(id),
    (id) => toggleEarned(id),
  );
  document.getElementById("listCount").textContent = `Showing ${filtered.length} of ${state.trophies.length} trophies`;
  document.getElementById("emptyNote").hidden = filtered.length !== 0;
  document.getElementById("filterNote").textContent = kindFilterNote(state.filters.kind, filtered.length);
  const selected = state.trophies.find((t) => t.id === state.selectedId) || null;
  renderDetail(document.getElementById("detailPane"), selected, state, (id) => toggleEarned(id));
  renderRoadmap(document.getElementById("roadmapStages"), state.trophies, state, (id) => selectTrophy(id));
  renderMissables(
    document.getElementById("missableList"),
    document.getElementById("unconfirmedList"),
    state.trophies,
    state,
    (id) => selectTrophy(id),
  );
}

function selectTrophy(id) {
  state.selectedId = id;
  state.view = "tracker";
  showView("tracker");
  refreshAll();
  document.getElementById("detailPane").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function toggleEarned(id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  persist();
  refreshAll();
}

function showView(view) {
  state.view = view;
  for (const tab of document.querySelectorAll(".view-tab")) {
    tab.classList.toggle("is-active", tab.dataset.view === view);
  }
  for (const section of document.querySelectorAll(".view")) {
    section.classList.toggle("is-active", section.id === `view-${view}`);
  }
}

function setStatus(text) {
  document.getElementById("saveStatus").textContent = text;
}

async function boot() {
  const response = await fetch("data/trophies.json");
  if (!response.ok) throw new Error(`Could not load data/trophies.json (${response.status})`);
  const data = await response.json();
  state.trophies = data.trophies;

  const stored = loadStoredState();
  state.earned = new Set(stored.earned);
  state.spoiler = stored.spoiler;

  const params = new URLSearchParams(window.location.search);
  if (params.get("seed") === "demo") {
    state.earned = new Set(DEMO_EARNED);
    persist();
  }
  if (params.get("spoiler") === "off") state.spoiler = false;
  if (params.get("spoiler") === "on") state.spoiler = true;
  const detailId = Number(params.get("detail"));
  if (Number.isInteger(detailId) && state.trophies.some((t) => t.id === detailId)) {
    state.selectedId = detailId;
  } else if (state.trophies.length > 0) {
    state.selectedId = state.trophies[0].id;
  }
  const view = params.get("view");
  if (view === "roadmap" || view === "missables" || view === "tracker") showView(view);
  // Deep-link filters (?kind=story&grade=bronze&earned=unearned&search=text)
  // so a filtered state is shareable and reproducible in screenshots.
  const kindParam = params.get("kind");
  if (["all", "story", "missable", "collectible", "activity", "online"].includes(kindParam)) {
    state.filters.kind = kindParam;
  }
  const gradeParam = params.get("grade");
  if (["all", "platinum", "gold", "silver", "bronze"].includes(gradeParam)) state.filters.grade = gradeParam;
  const earnedParam = params.get("earned");
  if (["all", "earned", "unearned"].includes(earnedParam)) state.filters.earned = earnedParam;
  const searchParam = params.get("search");
  if (searchParam) state.filters.search = searchParam;
  document.getElementById("searchBox").value = state.filters.search;
  document.getElementById("gradeFilter").value = state.filters.grade;
  document.getElementById("earnedFilter").value = state.filters.earned;
  for (const b of document.querySelectorAll("#kindFilters .filter-btn")) {
    b.classList.toggle("is-active", b.dataset.kind === state.filters.kind);
  }

  document.getElementById("spoilerToggle").checked = state.spoiler;
  document.getElementById("spoilerToggle").addEventListener("change", (event) => {
    state.spoiler = event.target.checked;
    persist();
    refreshAll();
  });

  document.getElementById("searchBox").addEventListener("input", (event) => {
    state.filters.search = event.target.value;
    refreshAll();
  });
  document.getElementById("kindFilters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-kind]");
    if (!button) return;
    state.filters.kind = button.dataset.kind;
    for (const b of document.querySelectorAll("#kindFilters .filter-btn")) {
      b.classList.toggle("is-active", b === button);
    }
    refreshAll();
  });
  document.getElementById("gradeFilter").addEventListener("change", (event) => {
    state.filters.grade = event.target.value;
    refreshAll();
  });
  document.getElementById("earnedFilter").addEventListener("change", (event) => {
    state.filters.earned = event.target.value;
    refreshAll();
  });
  document.getElementById("sortSelect").addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    refreshAll();
  });
  for (const tab of document.querySelectorAll(".view-tab")) {
    tab.addEventListener("click", () => showView(tab.dataset.view));
  }
  document.getElementById("exportBtn").addEventListener("click", () => {
    const count = exportProgress({ earned: state.earned, spoiler: state.spoiler }, state.trophies);
    setStatus(`Exported ${count} earned trophies to a JSON file.`);
  });
  document.getElementById("importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const parsed = parseImportedProgress(await file.text(), state.trophies);
      state.earned = new Set(parsed.earned);
      if (parsed.spoiler !== null) {
        state.spoiler = parsed.spoiler;
        document.getElementById("spoilerToggle").checked = state.spoiler;
      }
      persist();
      refreshAll();
      setStatus(`Imported ${parsed.earned.length} earned trophies from ${file.name}.`);
    } catch (err) {
      setStatus(`Import failed: ${err.message}`);
    }
    event.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!window.confirm("Clear all earned ticks? This cannot be undone (export first if you want a backup).")) return;
    state.earned = new Set();
    persist();
    refreshAll();
    setStatus("Progress reset.");
  });

  refreshAll();
}

boot().catch((err) => {
  document.getElementById("detailPane").innerHTML = `<h2>Could not load the guide</h2><p>${err.message}</p>`;
});
