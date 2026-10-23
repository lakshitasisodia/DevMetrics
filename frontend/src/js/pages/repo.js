import "../../css/main.css";
import { requireAuth } from "../core/session.js";
import { renderNavbar } from "../components/navbar.js";
import { renderOverviewTab } from "./repo/overview.js";
import {
  renderCommitsTab,
  renderPullRequestsTab,
  renderIssuesTab,
  renderContributorsTab,
  renderLanguagesTab,
  renderBranchesTab,
  renderCollaboratorsTab,
} from "./repo/explorer.js";

requireAuth();
renderNavbar();

const params = new URLSearchParams(location.search);
const owner = params.get("owner");
const repo = params.get("repo");

if (!owner || !repo) {
  location.replace("/dashboard.html");
  throw new Error("missing-owner-repo");
}

document.getElementById("page-title").textContent = `${owner}/${repo} — DevMetrics`;

const TABS = [
  { key: "overview", label: "Overview", render: renderOverviewTab },
  { key: "commits", label: "Commits", render: renderCommitsTab },
  { key: "pull-requests", label: "Pull requests", render: renderPullRequestsTab },
  { key: "issues", label: "Issues", render: renderIssuesTab },
  { key: "contributors", label: "Contributors", render: renderContributorsTab },
  { key: "languages", label: "Languages", render: renderLanguagesTab },
  { key: "branches", label: "Branches", render: renderBranchesTab },
  { key: "collaborators", label: "Collaborators", render: renderCollaboratorsTab },
];

const headerEl = document.getElementById("repo-header");
const tabsEl = document.getElementById("repo-tabs");
const panelEl = document.getElementById("repo-tab-panel");

headerEl.innerHTML = `
  <a href="/dashboard.html" class="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
    Dashboard
  </a>
  <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
    <h1 class="text-2xl font-bold tracking-tight mono-num text-[var(--color-ink)]">${owner}/${repo}</h1>
    <a href="https://github.com/${owner}/${repo}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary !py-1.5 !px-3 text-sm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.61-3.37-1.21-3.37-1.21-.46-1.19-1.11-1.51-1.11-1.51-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/></svg>
      View on GitHub
    </a>
  </div>
`;

tabsEl.innerHTML = TABS.map(
  (t) => `
  <button type="button" data-tab="${t.key}" class="tab-btn px-3.5 py-2.5 text-sm font-medium border-b-2 border-transparent text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] whitespace-nowrap transition-colors">
    ${t.label}
  </button>
`
).join("");

function setActiveTab(key) {
  tabsEl.querySelectorAll(".tab-btn").forEach((btn) => {
    const isActive = btn.dataset.tab === key;
    btn.classList.toggle("!text-[var(--color-brand)]", isActive);
    btn.classList.toggle("!border-[var(--color-brand)]", isActive);
  });
}

const loadedOnce = new Set();

function activateTab(key, { force = false } = {}) {
  const tab = TABS.find((t) => t.key === key) || TABS[0];
  setActiveTab(tab.key);

  const url = new URL(location.href);
  url.searchParams.set("tab", tab.key);
  history.replaceState(null, "", url);

  if (!force && loadedOnce.has(tab.key)) return;
  loadedOnce.add(tab.key);
  tab.render(panelEl, owner, repo);
}

tabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  activateTab(btn.dataset.tab, { force: false });
});

const initialTab = params.get("tab") || "overview";
activateTab(initialTab, { force: true });
