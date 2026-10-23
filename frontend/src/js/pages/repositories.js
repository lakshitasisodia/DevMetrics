import "../../css/main.css";
import { api, ApiError } from "../core/api.js";
import { GITHUB_ROUTES } from "../core/config.js";
import { requireAuth } from "../core/session.js";
import { renderNavbar } from "../components/navbar.js";
import { showToast } from "../components/toast.js";
import { loadingBlock, errorBlock, emptyBlock } from "../components/states.js";
import { formatCompact } from "../core/format.js";

requireAuth();
renderNavbar("repositories");

const trackedEl = document.getElementById("tracked-list");
const availableEl = document.getElementById("available-list");
const searchInput = document.getElementById("repo-search");

let allAvailable = [];
let trackedFullNames = new Set();
let trackingInFlight = new Set();

async function init() {
  trackedEl.innerHTML = loadingBlock("Loading tracked repositories…");
  availableEl.innerHTML = loadingBlock("Loading your GitHub repositories…");

  let selected;
  try {
    selected = await api.get(GITHUB_ROUTES.repositoriesSelected);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      location.replace("/connect.html");
      return;
    }
    trackedEl.innerHTML = errorBlock(err.message);
    availableEl.innerHTML = "";
    bindRetry(trackedEl, init);
    return;
  }

  const trackedRepos = selected?.repositories || [];
  trackedFullNames = new Set(trackedRepos.map((r) => r.fullName));
  renderTracked(trackedRepos);

  try {
    const available = await api.get(GITHUB_ROUTES.repositories);
    allAvailable = available?.repositories || [];
    renderAvailable(allAvailable);
  } catch (err) {
    availableEl.innerHTML = errorBlock(err.message);
    bindRetry(availableEl, init);
  }
}

function bindRetry(container, fn) {
  container.querySelector("#retry-btn")?.addEventListener("click", fn);
}

function renderTracked(repos) {
  if (repos.length === 0) {
    trackedEl.innerHTML = emptyBlock({
      title: "No repositories tracked yet",
      body: "Select a repository below to start measuring it.",
    });
    return;
  }

  trackedEl.innerHTML = `
    <ul class="grid gap-3 sm:grid-cols-2">
      ${repos
        .map((r) => {
          const [owner, repo] = r.fullName.split("/");
          return `
          <li class="card p-4 flex items-center justify-between gap-3">
            <div class="min-w-0">
              <p class="font-medium text-sm text-[var(--color-ink)] truncate mono-num">${r.fullName}</p>
              <p class="text-xs text-[var(--color-ink-faint)] mt-0.5">Tracked</p>
            </div>
            <a href="/repo.html?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}" class="btn btn-secondary !py-1.5 !px-3 text-sm shrink-0">View metrics</a>
          </li>
        `;
        })
        .join("")}
    </ul>
  `;
}

function renderAvailable(repos) {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = query
    ? repos.filter((r) => r.full_name?.toLowerCase().includes(query) || r.name?.toLowerCase().includes(query))
    : repos;

  if (repos.length === 0) {
    availableEl.innerHTML = emptyBlock({
      title: "No repositories found on this GitHub account",
      body: "Make sure your personal access token has access to the repositories you want to track.",
    });
    return;
  }

  if (filtered.length === 0) {
    availableEl.innerHTML = emptyBlock({ title: "No repositories match your filter" });
    return;
  }

  availableEl.innerHTML = `
    <ul class="divide-y divide-[var(--color-border-subtle)] card">
      ${filtered.map((r) => availableItem(r)).join("")}
    </ul>
  `;

  filtered.forEach((r) => {
    const btn = document.getElementById(`track-btn-${r.id}`);
    if (!btn || btn.disabled) return;
    btn.addEventListener("click", () => trackRepository(r));
  });
}

function availableItem(r) {
  const isTracked = trackedFullNames.has(r.full_name);
  const isLoading = trackingInFlight.has(r.id);
  return `
    <li class="p-4 flex items-center justify-between gap-4">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-medium text-sm text-[var(--color-ink)] mono-num truncate">${r.full_name}</p>
          ${r.private ? `<span class="badge bg-[var(--color-warn-soft)] text-[var(--color-warn)]">Private</span>` : ""}
          ${r.language ? `<span class="badge bg-[var(--color-bg-hover)] text-[var(--color-ink-dim)]">${r.language}</span>` : ""}
        </div>
        ${r.description ? `<p class="text-xs text-[var(--color-ink-dim)] mt-1 truncate">${escapeHtml(r.description)}</p>` : ""}
        <div class="flex items-center gap-3 mt-1.5 text-xs text-[var(--color-ink-faint)]">
          <span class="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 15 8.5 22 9.3 17 14 18.2 21 12 17.8 5.8 21 7 14 2 9.3 9 8.5Z"/></svg>
            ${formatCompact(r.stargazers_count ?? 0)}
          </span>
          <span class="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v12M18 9v6M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM18 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM6 9a9 9 0 0 0 9 9"/></svg>
            ${formatCompact(r.forks_count ?? 0)}
          </span>
        </div>
      </div>
      ${
        isTracked
          ? `<span class="badge bg-[var(--color-add-soft)] text-[var(--color-add)] shrink-0">Tracked</span>`
          : `<button type="button" id="track-btn-${r.id}" class="btn btn-primary !py-1.5 !px-3 text-sm shrink-0" ${isLoading ? "disabled" : ""}>${isLoading ? "Tracking…" : "Track"}</button>`
      }
    </li>
  `;
}

async function trackRepository(repo) {
  trackingInFlight.add(repo.id);
  renderAvailable(allAvailable);

  try {
    await api.post(GITHUB_ROUTES.repositoriesSelect, {
      githubRepoId: repo.id,
      repoName: repo.name,
      fullName: repo.full_name,
    });
    trackedFullNames.add(repo.full_name);
    showToast(`Now tracking ${repo.full_name}.`, { variant: "success" });

    const selected = await api.get(GITHUB_ROUTES.repositoriesSelected);
    renderTracked(selected?.repositories || []);
  } catch (err) {
    showToast(err instanceof ApiError ? err.message : "Failed to track repository.", { variant: "error" });
  } finally {
    trackingInFlight.delete(repo.id);
    renderAvailable(allAvailable);
  }
}

function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

let searchDebounce;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => renderAvailable(allAvailable), 120);
});

init();
