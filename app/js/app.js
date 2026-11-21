import { loadState, saveState, exportProgress, importProgress, downloadText, defaultState } from "./store.js";
import { filterTrophies, sortTrophies } from "./filters.js";
import { renderList, renderDetail, renderProgress } from "./render.js";
import { renderRoadmap } from "./roadmap.js";

const DEMO_EARNED = [2, 3, 4, 5, 8, 14, 15, 16, 20, 28, 35, 42];

async function loadTrophies() {
  const response = await fetch("data/trophies.json");
  if (!response.ok) throw new Error(`trophies.json failed: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data) ? data : data.trophies;
}

function readParams(state) {
  const params = new URLSearchParams(location.search);
  const view = params.get("view");
  if (params.get("demo") === "1") {
    for (const id of DEMO_EARNED) state.earned[id] = true;
  }
  if (params.get("spoiler") === "1") state.spoiler = true;
  if (params.get("missable") === "1") state.missableOnly = true;
  if (view === "roadmap") {
    document.getElementById("roadmapSection").scrollIntoView();
  }
  const detailId = Number(params.get("id"));
  if (Number.isFinite(detailId) && detailId > 0) state.selectedId = detailId;
  return view;
}

function syncControls(state) {
  document.getElementById("search").value = state.query;
  document.getElementById("kindFilter").value = state.kind;
  document.getElementById("gradeFilter").value = state.grade;
  document.getElementById("earnedFilter").value = state.earnedFilter;
  document.getElementById("sortSelect").value = state.sort;
  document.getElementById("missableOnly").checked = state.missableOnly;
  document.getElementById("spoilerToggle").checked = state.spoiler;
}

export async function boot() {
  const trophies = await loadTrophies();
  const state = loadState();
  const view = readParams(state);
  if (view === "detail" && !state.selectedId) state.selectedId = 40;

  const listEl = document.getElementById("trophyList");
  const detailEl = document.getElementById("detail");
  const roadmapEl = document.getElementById("roadmap");

  function renderAll() {
    saveState(state);
    renderProgress(
      document.getElementById("progress"),
      document.getElementById("progressFill"),
      document.getElementById("gradeCounts"),
      trophies,
      state,
    );
    const visible = sortTrophies(filterTrophies(trophies, state), state.sort);
    document.getElementById("resultCount").textContent = `Showing ${visible.length} of ${trophies.length} trophies.`;
    renderList(listEl, visible, state, toggleEarned, selectTrophy);
    renderRoadmap(roadmapEl, trophies, state, selectTrophy);
    const selected = trophies.find((t) => t.id === state.selectedId) || trophies[0];
    renderDetail(detailEl, selected, state, toggleEarned);
  }

  function toggleEarned(id, earned) {
    if (earned) state.earned[id] = true;
    else delete state.earned[id];
    renderAll();
  }

  function selectTrophy(id) {
    state.selectedId = id;
    renderAll();
    detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderAll();
  });
  document.getElementById("kindFilter").addEventListener("change", (event) => {
    state.kind = event.target.value;
    renderAll();
  });
  document.getElementById("gradeFilter").addEventListener("change", (event) => {
    state.grade = event.target.value;
    renderAll();
  });
  document.getElementById("earnedFilter").addEventListener("change", (event) => {
    state.earnedFilter = event.target.value;
    renderAll();
  });
  document.getElementById("sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderAll();
  });
  document.getElementById("missableOnly").addEventListener("change", (event) => {
    state.missableOnly = event.target.checked;
    renderAll();
  });
  document.getElementById("spoilerToggle").addEventListener("change", (event) => {
    state.spoiler = event.target.checked;
    renderAll();
  });
  document.getElementById("exportBtn").addEventListener("click", () => {
    downloadText("leonida-trophy-atlas-progress.json", exportProgress(state, trophies));
  });
  document.getElementById("importFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const next = importProgress(await file.text(), trophies);
      Object.assign(state, next);
      syncControls(state);
      renderAll();
    } catch (error) {
      window.alert(`Could not import that file: ${error.message}`);
    }
    event.target.value = "";
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    const fresh = defaultState();
    Object.assign(state, fresh, { earned: {} });
    syncControls(state);
    renderAll();
  });

  syncControls(state);
  renderAll();
}

boot().catch((error) => {
  document.getElementById("trophyList").innerHTML = `<li class="card">Could not load the trophy data: ${error.message}</li>`;
  console.error(error);
});
