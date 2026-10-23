import { api, ApiError } from "../../core/api.js";
import { GITHUB_ROUTES } from "../../core/config.js";
import { loadingBlock, errorBlock, emptyBlock } from "../../components/states.js";
import { formatNumber, formatRelativeTime, truncate } from "../../core/format.js";
import { ringChart } from "../../charts/bar-chart.js";

async function loadList(container, fetcher, renderFn, emptyTitle, retry) {
  container.innerHTML = loadingBlock();
  try {
    const data = await fetcher();
    const list = Array.isArray(data) ? data : [];
    if (list.length === 0) {
      container.innerHTML = emptyBlock({ title: emptyTitle });
      return;
    }
    container.innerHTML = renderFn(list);
  } catch (err) {
    container.innerHTML = errorBlock(err instanceof ApiError ? err.message : "Failed to load data.");
    container.querySelector("#retry-btn")?.addEventListener("click", retry);
  }
}

function externalIcon() {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
}

function escapeHtml(str = "") {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// -----------------------------------------------------------------------
// COMMITS
// -----------------------------------------------------------------------

export function renderCommitsTab(container, owner, repo) {
  const run = () =>
    loadList(
      container,
      () => api.get(GITHUB_ROUTES.commits(owner, repo)),
      (commits) => `
        <ul class="card divide-y divide-[var(--color-border-subtle)]">
          ${commits
            .slice(0, 100)
            .map((c) => {
              const message = (c.commit?.message || "").split("\n")[0];
              const author = c.commit?.author?.name || c.author?.login || "Unknown";
              const date = c.commit?.author?.date;
              return `
              <li class="p-4 flex items-start gap-3">
                <span class="mono-num text-xs text-[var(--color-brand)] bg-[var(--color-brand-soft)] rounded px-1.5 py-0.5 shrink-0 mt-0.5">${(c.sha || "").slice(0, 7)}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-[var(--color-ink)] truncate">${escapeHtml(truncate(message, 100))}</p>
                  <p class="text-xs text-[var(--color-ink-faint)] mt-1">${escapeHtml(author)} · ${formatRelativeTime(date)}</p>
                </div>
                ${c.html_url ? `<a href="${c.html_url}" target="_blank" rel="noopener noreferrer" class="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] mt-1">${externalIcon()}</a>` : ""}
              </li>
            `;
            })
            .join("")}
        </ul>
        ${commits.length > 100 ? `<p class="text-xs text-[var(--color-ink-faint)] mt-3">Showing the 100 most recent of ${formatNumber(commits.length)} commits.</p>` : ""}
      `,
      "No commits found.",
      run
    );
  run();
}

// -----------------------------------------------------------------------
// PULL REQUESTS
// -----------------------------------------------------------------------

function prStateBadge(pr) {
  if (pr.merged_at) return `<span class="badge bg-[var(--color-merged-soft)] text-[var(--color-merged)]">Merged</span>`;
  if (pr.state === "closed") return `<span class="badge bg-[var(--color-del-soft)] text-[var(--color-del)]">Closed</span>`;
  return `<span class="badge bg-[var(--color-add-soft)] text-[var(--color-add)]">Open</span>`;
}

export function renderPullRequestsTab(container, owner, repo) {
  const run = () =>
    loadList(
      container,
      () => api.get(GITHUB_ROUTES.pullRequests(owner, repo)),
      (prs) => `
        <ul class="card divide-y divide-[var(--color-border-subtle)]">
          ${prs
            .slice(0, 100)
            .map(
              (pr) => `
            <li>
              <button type="button" class="pr-row w-full text-left p-4 flex items-start gap-3 hover:bg-[var(--color-bg-hover)] transition-colors" data-number="${pr.number}">
                ${prStateBadge(pr)}
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-[var(--color-ink)] truncate">${escapeHtml(truncate(pr.title || "", 90))}</p>
                  <p class="text-xs text-[var(--color-ink-faint)] mt-1 mono-num">#${pr.number} · ${escapeHtml(pr.user?.login || "unknown")} · opened ${formatRelativeTime(pr.created_at)}</p>
                </div>
                <svg class="shrink-0 mt-1 text-[var(--color-ink-faint)] chevron transition-transform" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
              <div class="pr-detail hidden px-4 pb-4"></div>
            </li>
          `
            )
            .join("")}
        </ul>
        ${prs.length > 100 ? `<p class="text-xs text-[var(--color-ink-faint)] mt-3">Showing the 100 most recent of ${formatNumber(prs.length)} pull requests.</p>` : ""}
      `,
      "No pull requests found.",
      run
    );
  run();

  container.addEventListener("click", async (e) => {
    const btn = e.target.closest(".pr-row");
    if (!btn) return;
    const detail = btn.nextElementSibling;
    const chevron = btn.querySelector(".chevron");
    const isHidden = detail.classList.contains("hidden");

    detail.classList.toggle("hidden", !isHidden);
    chevron.style.transform = isHidden ? "rotate(90deg)" : "rotate(0deg)";

    if (isHidden && !detail.dataset.loaded) {
      detail.dataset.loaded = "1";
      detail.innerHTML = `<div class="text-xs text-[var(--color-ink-faint)] py-2">Loading reviews…</div>`;
      try {
        const reviews = await api.get(GITHUB_ROUTES.pullRequestReviews(owner, repo, btn.dataset.number));
        detail.innerHTML = renderReviews(reviews);
      } catch (err) {
        detail.innerHTML = `<p class="text-xs text-[var(--color-del)] py-2">${err instanceof ApiError ? err.message : "Failed to load reviews."}</p>`;
      }
    }
  });
}

function renderReviews(reviews) {
  const list = Array.isArray(reviews) ? reviews : [];
  if (list.length === 0) {
    return `<p class="text-xs text-[var(--color-ink-faint)] py-2 border-t border-[var(--color-border-subtle)] pt-3">No reviews yet.</p>`;
  }
  return `
    <ul class="border-t border-[var(--color-border-subtle)] pt-3 space-y-2">
      ${list
        .map(
          (r) => `
        <li class="flex items-center justify-between text-xs">
          <span class="text-[var(--color-ink-dim)]">${escapeHtml(r.user?.login || "unknown")}</span>
          <span class="mono-num text-[var(--color-ink-faint)]">${escapeHtml(r.state || "")} · ${formatRelativeTime(r.submitted_at)}</span>
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}

// -----------------------------------------------------------------------
// ISSUES
// -----------------------------------------------------------------------

export function renderIssuesTab(container, owner, repo) {
  const run = () =>
    loadList(
      container,
      () => api.get(GITHUB_ROUTES.issues(owner, repo)),
      (rawIssues) => {
        // The GitHub issues endpoint also returns pull requests; exclude
        // anything carrying a `pull_request` key so this tab shows issues only.
        const issues = rawIssues.filter((i) => !i.pull_request);
        if (issues.length === 0) {
          return emptyBlock({ title: "No issues found." });
        }
        return `
          <ul class="card divide-y divide-[var(--color-border-subtle)]">
            ${issues
              .slice(0, 100)
              .map(
                (issue) => `
              <li class="p-4 flex items-start gap-3">
                ${
                  issue.state === "closed"
                    ? `<span class="badge bg-[var(--color-del-soft)] text-[var(--color-del)]">Closed</span>`
                    : `<span class="badge bg-[var(--color-add-soft)] text-[var(--color-add)]">Open</span>`
                }
                <div class="min-w-0 flex-1">
                  <p class="text-sm text-[var(--color-ink)] truncate">${escapeHtml(truncate(issue.title || "", 90))}</p>
                  <p class="text-xs text-[var(--color-ink-faint)] mt-1 mono-num">#${issue.number} · ${escapeHtml(issue.user?.login || "unknown")} · opened ${formatRelativeTime(issue.created_at)}</p>
                </div>
                ${issue.html_url ? `<a href="${issue.html_url}" target="_blank" rel="noopener noreferrer" class="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] mt-1">${externalIcon()}</a>` : ""}
              </li>
            `
              )
              .join("")}
          </ul>
          ${issues.length > 100 ? `<p class="text-xs text-[var(--color-ink-faint)] mt-3">Showing the 100 most recent of ${formatNumber(issues.length)} issues.</p>` : ""}
        `;
      },
      "No issues found.",
      run
    );
  run();
}

// -----------------------------------------------------------------------
// CONTRIBUTORS / COLLABORATORS (shared shape: login, avatar_url, ...)
// -----------------------------------------------------------------------

function peopleGrid(people, { countKey, countLabel } = {}) {
  return `
    <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      ${people
        .map(
          (p) => `
        <li class="card p-4 flex items-center gap-3">
          <img src="${p.avatar_url}" alt="" class="w-9 h-9 rounded-full shrink-0 bg-[var(--color-bg-hover)]" loading="lazy" />
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-[var(--color-ink)] truncate">${escapeHtml(p.login || "unknown")}</p>
            ${countKey ? `<p class="text-xs text-[var(--color-ink-faint)] mono-num">${formatNumber(p[countKey])} ${countLabel}</p>` : ""}
          </div>
          ${p.html_url ? `<a href="${p.html_url}" target="_blank" rel="noopener noreferrer" class="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">${externalIcon()}</a>` : ""}
        </li>
      `
        )
        .join("")}
    </ul>
  `;
}

export function renderContributorsTab(container, owner, repo) {
  const run = () =>
    loadList(
      container,
      () => api.get(GITHUB_ROUTES.contributors(owner, repo)),
      (contributors) => peopleGrid(contributors, { countKey: "contributions", countLabel: "commits" }),
      "No contributors found.",
      run
    );
  run();
}

export function renderCollaboratorsTab(container, owner, repo) {
  const run = () =>
    loadList(
      container,
      () => api.get(GITHUB_ROUTES.collaborators(owner, repo)),
      (collaborators) => peopleGrid(collaborators),
      "No collaborators found, or your token doesn't have permission to view them.",
      run
    );
  run();
}

// -----------------------------------------------------------------------
// LANGUAGES
// -----------------------------------------------------------------------

const LANGUAGE_PALETTE = [
  "#7C6FF0",
  "#3FB950",
  "#E3B341",
  "#F0665E",
  "#58A6FF",
  "#A371F7",
  "#39C5CF",
  "#F778BA",
];

export function renderLanguagesTab(container, owner, repo) {
  const run = async () => {
    container.innerHTML = loadingBlock();
    try {
      const languages = await api.get(GITHUB_ROUTES.languages(owner, repo));
      const entries = Object.entries(languages || {});
      if (entries.length === 0) {
        container.innerHTML = emptyBlock({ title: "No language data available." });
        return;
      }
      const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
      const segments = entries.map(([name, bytes], i) => ({
        name,
        value: bytes,
        color: LANGUAGE_PALETTE[i % LANGUAGE_PALETTE.length],
      }));

      container.innerHTML = `
        <div class="card p-6 flex flex-col sm:flex-row items-center gap-8">
          ${ringChart(segments)}
          <ul class="flex-1 w-full space-y-2.5">
            ${segments
              .map(
                (s) => `
              <li class="flex items-center gap-3 text-sm">
                <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${s.color}"></span>
                <span class="text-[var(--color-ink)] flex-1">${escapeHtml(s.name)}</span>
                <span class="mono-num text-[var(--color-ink-faint)]">${((s.value / total) * 100).toFixed(1)}%</span>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
      `;
    } catch (err) {
      container.innerHTML = errorBlock(err instanceof ApiError ? err.message : "Failed to load languages.");
      container.querySelector("#retry-btn")?.addEventListener("click", run);
    }
  };
  run();
}

// -----------------------------------------------------------------------
// BRANCHES
// -----------------------------------------------------------------------

export function renderBranchesTab(container, owner, repo) {
  const run = () =>
    loadList(
      container,
      () => api.get(GITHUB_ROUTES.branches(owner, repo)),
      (branches) => `
        <ul class="card divide-y divide-[var(--color-border-subtle)]">
          ${branches
            .map(
              (b) => `
            <li class="p-4 flex items-center justify-between gap-3">
              <span class="text-sm mono-num text-[var(--color-ink)]">${escapeHtml(b.name)}</span>
              <div class="flex items-center gap-2">
                ${b.protected ? `<span class="badge bg-[var(--color-warn-soft)] text-[var(--color-warn)]">Protected</span>` : ""}
                <span class="mono-num text-xs text-[var(--color-ink-faint)]">${(b.commit?.sha || "").slice(0, 7)}</span>
              </div>
            </li>
          `
            )
            .join("")}
        </ul>
      `,
      "No branches found.",
      run
    );
  run();
}
