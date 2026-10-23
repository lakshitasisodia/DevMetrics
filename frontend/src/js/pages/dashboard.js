import "../../css/main.css";
import { api, ApiError } from "../core/api.js";
import { GITHUB_ROUTES, METRICS_ROUTES } from "../core/config.js";
import { requireAuth, getUser } from "../core/session.js";
import { renderNavbar } from "../components/navbar.js";
import { errorBlock, emptyBlock, skeletonCards } from "../components/states.js";
import { formatCompact, formatPercent, formatRelativeTime } from "../core/format.js";

requireAuth();
renderNavbar("dashboard");

const content = document.getElementById("dashboard-content");
const user = getUser();

async function init() {
  content.innerHTML = `
    <p class="text-sm text-[var(--color-ink-dim)] mb-5">Welcome back${user?.name ? `, ${escapeHtml(user.name)}` : ""}.</p>
    ${skeletonCards(3)}
  `;

  let repos;
  try {
    const data = await api.get(GITHUB_ROUTES.repositoriesSelected);
    repos = data?.repositories || [];
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      location.replace("/connect.html");
      return;
    }
    content.innerHTML = errorBlock(err.message);
    content.querySelector("#retry-btn")?.addEventListener("click", init);
    return;
  }

  if (repos.length === 0) {
    content.innerHTML = emptyBlock({
      title: "No repositories tracked yet",
      body: "Add a repository to see commit, pull request, review, and issue metrics here.",
      actionLabel: "Choose repositories",
    });
    content.querySelector("#empty-action")?.addEventListener("click", () => {
      location.href = "/repositories.html";
    });
    return;
  }

  content.innerHTML = `
    <p class="text-sm text-[var(--color-ink-dim)] mb-5">
      Welcome back${user?.name ? `, ${escapeHtml(user.name)}` : ""}. Tracking ${repos.length} repositor${repos.length === 1 ? "y" : "ies"}.
    </p>
    <div id="repo-cards" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"></div>
  `;

  const grid = document.getElementById("repo-cards");
  repos.forEach((r) => {
    const [owner, repo] = r.fullName.split("/");
    const card = document.createElement("a");
    card.href = `/repo.html?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`;
    card.id = `card-${cssId(r.fullName)}`;
    card.className = "card p-5 flex flex-col gap-4 hover:border-[var(--color-border-strong)] transition-colors";
    card.innerHTML = cardSkeleton(r.fullName);
    grid.appendChild(card);

    api
      .get(METRICS_ROUTES.full(owner, repo))
      .then((metrics) => {
        card.innerHTML = cardBody(r.fullName, metrics);
      })
      .catch((err) => {
        card.innerHTML = cardError(r.fullName, err instanceof ApiError ? err.message : "Failed to load metrics.");
      });
  });
}

function cardSkeleton(fullName) {
  return `
    <div class="flex items-center justify-between">
      <p class="font-semibold text-sm mono-num truncate">${fullName}</p>
    </div>
    <div class="grid grid-cols-3 gap-2">
      ${Array.from({ length: 3 }).map(() => `<div class="skeleton h-10"></div>`).join("")}
    </div>
    <div class="skeleton h-3 w-24"></div>
  `;
}

function cardError(fullName, message) {
  return `
    <div class="flex items-center justify-between">
      <p class="font-semibold text-sm mono-num truncate">${fullName}</p>
      <span class="badge bg-[var(--color-del-soft)] text-[var(--color-del)]">Error</span>
    </div>
    <p class="text-xs text-[var(--color-ink-dim)] leading-relaxed">${escapeHtml(message)}</p>
  `;
}

function cardBody(fullName, metrics) {
  const stat = (label, value) => `
    <div>
      <p class="mono-num text-lg font-semibold text-[var(--color-ink)]">${value}</p>
      <p class="text-[11px] text-[var(--color-ink-faint)] uppercase tracking-wide mt-0.5">${label}</p>
    </div>
  `;

  return `
    <div class="flex items-start justify-between gap-2">
      <p class="font-semibold text-sm mono-num truncate">${fullName}</p>
      <svg class="shrink-0 mt-0.5 text-[var(--color-ink-faint)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M8 7h9v9"/></svg>
    </div>
    <div class="grid grid-cols-3 gap-2">
      ${stat("Stars", formatCompact(metrics.repository?.stars ?? 0))}
      ${stat("Open PRs", formatCompact(metrics.pullRequests?.openPRs ?? 0))}
      ${stat("Open issues", formatCompact(metrics.issues?.openIssues ?? 0))}
    </div>
    <div class="flex items-center justify-between text-xs text-[var(--color-ink-faint)]">
      <span>Merge rate ${formatPercent(metrics.pullRequests?.mergeRate ?? 0)}</span>
      <span>${formatRelativeTime(metrics.generatedAt)}</span>
    </div>
  `;
}

function cssId(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "-");
}

function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

init();
