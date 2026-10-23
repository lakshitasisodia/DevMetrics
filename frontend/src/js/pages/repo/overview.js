import { api, ApiError } from "../../core/api.js";
import { METRICS_ROUTES } from "../../core/config.js";
import { loadingBlock, errorBlock } from "../../components/states.js";
import { formatNumber, formatPercent, formatDurationHours, formatRelativeTime, humanizeKey } from "../../core/format.js";
import { horizontalBarChart } from "../../charts/bar-chart.js";

export async function renderOverviewTab(container, owner, repo) {
  container.innerHTML = loadingBlock("Crunching repository metrics…");

  try {
    const metrics = await api.get(METRICS_ROUTES.full(owner, repo));
    container.innerHTML = buildOverview(metrics);
  } catch (err) {
    container.innerHTML = errorBlock(err instanceof ApiError ? err.message : "Failed to load metrics.");
    container.querySelector("#retry-btn")?.addEventListener("click", () => renderOverviewTab(container, owner, repo));
  }
}

function section(title, subtitle, body) {
  return `
    <section class="card p-5 sm:p-6">
      <div class="flex items-baseline justify-between gap-3 mb-4">
        <h2 class="text-sm font-semibold text-[var(--color-ink)]">${title}</h2>
        ${subtitle ? `<span class="text-xs text-[var(--color-ink-faint)]">${subtitle}</span>` : ""}
      </div>
      ${body}
    </section>
  `;
}

function statGrid(stats) {
  return `
    <dl class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-5">
      ${stats
        .map(
          (s) => `
        <div>
          <dt class="text-[11px] uppercase tracking-wide text-[var(--color-ink-faint)]">${s.label}</dt>
          <dd class="mono-num text-xl font-semibold mt-1" style="color:${s.accent || "var(--color-ink)"}">${s.value}</dd>
        </div>
      `
        )
        .join("")}
    </dl>
  `;
}

function buildOverview(m) {
  const repository = m.repository || {};
  const commits = m.commits || {};
  const prs = m.pullRequests || {};
  const reviews = m.reviews || {};
  const issues = m.issues || {};
  const developers = m.developers;

  const topBar = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <p class="text-sm text-[var(--color-ink-dim)]">Generated ${formatRelativeTime(m.generatedAt)}</p>
      <button type="button" id="overview-refresh" class="btn btn-secondary !py-1.5 !px-3 text-sm">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"/></svg>
        Refresh
      </button>
    </div>
  `;

  const repositorySection = section(
    "Repository",
    null,
    statGrid([
      { label: "Stars", value: formatNumber(repository.stars) },
      { label: "Forks", value: formatNumber(repository.forks) },
      { label: "Contributors", value: formatNumber(repository.contributors) },
      { label: "Age (days)", value: formatNumber(repository.repositoryAge) },
    ])
  );

  const commitsSection = section(
    "Commits",
    null,
    `
      ${statGrid([
        { label: "Total commits", value: formatNumber(commits.totalCommits) },
        { label: "Active contributors", value: formatNumber(commits.activeContributors) },
        { label: "Avg / contributor", value: formatNumber(commits.averageCommitsPerContributor) },
        { label: "Commit frequency", value: formatNumber(commits.commitFrequency) },
        { label: "Code churn", value: formatNumber(commits.codeChurn) },
        { label: "Additions vs deletions", value: "" },
      ])}
      <div class="mt-4">
        ${horizontalBarChart(
          [
            { label: "+" + formatNumber(commits.totalAdditions), value: commits.totalAdditions ?? 0, color: "var(--color-add)" },
            { label: "−" + formatNumber(commits.totalDeletions), value: commits.totalDeletions ?? 0, color: "var(--color-del)" },
          ],
          { gap: 26 }
        )}
      </div>
    `
  );

  const prSection = section(
    "Pull requests",
    formatPercent(prs.mergeRate ?? 0) + " merge rate",
    `
      ${statGrid([
        { label: "Total", value: formatNumber(prs.totalPRs) },
        { label: "Open", value: formatNumber(prs.openPRs), accent: "var(--color-warn)" },
        { label: "Merged", value: formatNumber(prs.mergedPRs), accent: "var(--color-merged)" },
        { label: "Closed w/o merge", value: formatNumber(prs.closedWithoutMerge), accent: "var(--color-del)" },
        { label: "Avg size (lines)", value: formatNumber(prs.averagePRSize) },
        { label: "Avg cycle time", value: formatDurationHours(prs.averagePRCycleTime) },
        { label: "Median cycle time", value: formatDurationHours(prs.medianPRCycleTime) },
        { label: "Longest cycle time", value: formatDurationHours(prs.longestPRCycleTime) },
      ])}
    `
  );

  const reviewsSection = section(
    "Reviews",
    null,
    statGrid([
      { label: "Total reviews", value: formatNumber(reviews.totalReviews) },
      { label: "Reviews / PR", value: formatNumber(reviews.reviewsPerPR) },
      { label: "Avg time to first review", value: formatDurationHours(reviews.averageTimeToFirstReview) },
    ])
  );

  const issuesSection = section(
    "Issues",
    formatPercent(issues.closureRate ?? 0) + " closure rate",
    `
      ${statGrid([
        { label: "Total", value: formatNumber(issues.totalIssues) },
        { label: "Open", value: formatNumber(issues.openIssues), accent: "var(--color-warn)" },
        { label: "Closed", value: formatNumber(issues.closedIssues), accent: "var(--color-add)" },
        { label: "Avg resolution time", value: formatDurationHours(issues.averageResolutionTime) },
        { label: "Median resolution time", value: formatDurationHours(issues.medianResolutionTime) },
      ])}
    `
  );

  const developersSection = section("Developers", null, renderDevelopers(developers));

  return `
    ${topBar}
    <div class="grid gap-5 lg:grid-cols-2">
      ${repositorySection}
      ${commitsSection}
      ${prSection}
      ${reviewsSection}
    </div>
    <div class="mt-5 grid gap-5">
      ${issuesSection}
      ${developersSection}
    </div>
  `;
}

/**
 * The developer-level aggregation isn't part of the metrics contract that's
 * validated before the API responds, so its shape isn't guaranteed the way
 * repository/commits/pullRequests/reviews/issues are. This renders whatever
 * comes back — a list of per-developer stats, a map keyed by username, or a
 * flat object — without assuming field names that may not exist.
 */
function renderDevelopers(developers) {
  if (!developers || (Array.isArray(developers) && developers.length === 0)) {
    return `<p class="text-sm text-[var(--color-ink-faint)]">No developer data available.</p>`;
  }

  const rows = Array.isArray(developers)
    ? developers
    : typeof developers === "object"
    ? Object.entries(developers).map(([key, value]) =>
        typeof value === "object" && value !== null ? { developer: key, ...value } : { developer: key, value }
      )
    : [{ value: developers }];

  const keys = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set())
  ).slice(0, 6);

  return `
    <div class="overflow-x-auto -mx-1">
      <table class="w-full text-sm min-w-[420px]">
        <thead>
          <tr class="text-left text-[11px] uppercase tracking-wide text-[var(--color-ink-faint)]">
            ${keys.map((k) => `<th class="px-1 pb-2 font-medium">${humanizeKey(k)}</th>`).join("")}
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--color-border-subtle)]">
          ${rows
            .slice(0, 25)
            .map(
              (row) => `
            <tr>
              ${keys
                .map((k) => {
                  const v = row[k];
                  const display =
                    typeof v === "number"
                      ? formatNumber(v)
                      : v === undefined || v === null
                      ? "—"
                      : typeof v === "object"
                      ? JSON.stringify(v)
                      : String(v);
                  return `<td class="px-1 py-2 mono-num text-[var(--color-ink)]">${display}</td>`;
                })
                .join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#overview-refresh")) {
    const container = document.getElementById("repo-tab-panel");
    const params = new URLSearchParams(location.search);
    renderOverviewTab(container, params.get("owner"), params.get("repo"));
  }
});
