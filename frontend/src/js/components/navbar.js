import { getUser, clearSession } from "../core/session.js";
import { initials } from "../core/format.js";

/**
 * Renders the app shell top bar into #app-navbar.
 * `active` is one of "dashboard" | "repositories" to highlight the current link.
 */
export function renderNavbar(active = "") {
  const mount = document.getElementById("app-navbar");
  if (!mount) return;

  const user = getUser();
  const links = [
    { key: "dashboard", href: "/dashboard.html", label: "Dashboard" },
    { key: "repositories", href: "/repositories.html", label: "Repositories" },
  ];

  mount.innerHTML = `
    <header class="border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur sticky top-0 z-40">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div class="flex items-center gap-6 min-w-0">
          <a href="/dashboard.html" class="flex items-center gap-2 shrink-0" aria-label="DevMetrics home">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-brand)" stroke-width="2.2" stroke-linecap="round">
              <path d="M4 19V6M12 19V4M20 19v-9" />
            </svg>
            <span class="font-semibold text-[15px] tracking-tight text-[var(--color-ink)]">DevMetrics</span>
          </a>
          <nav class="hidden sm:flex items-center gap-1" aria-label="Primary">
            ${links
              .map(
                (l) => `
              <a href="${l.href}" class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                active === l.key
                  ? "text-[var(--color-ink)] bg-[var(--color-bg-hover)]"
                  : "text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[var(--color-bg-hover)]"
              }">${l.label}</a>
            `
              )
              .join("")}
          </nav>
        </div>

        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
            <span class="w-7 h-7 rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)] flex items-center justify-center text-[11px] font-semibold">
              ${initials(user?.name || user?.email || "?") || "?"}
            </span>
            <span class="max-w-[140px] truncate">${user?.name || user?.email || ""}</span>
          </div>
          <button type="button" id="nav-logout" class="btn btn-secondary !py-1.5 !px-3 text-sm">Log out</button>
          <button type="button" id="nav-menu-toggle" class="sm:hidden btn btn-secondary !p-2" aria-label="Toggle menu" aria-expanded="false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
      <nav id="nav-mobile" class="hidden sm:hidden border-t border-[var(--color-border)] px-4 py-2 flex-col gap-1" aria-label="Primary mobile">
        ${links
          .map(
            (l) => `
          <a href="${l.href}" class="px-3 py-2 rounded-md text-sm font-medium ${
            active === l.key
              ? "text-[var(--color-ink)] bg-[var(--color-bg-hover)]"
              : "text-[var(--color-ink-dim)]"
          }">${l.label}</a>
        `
          )
          .join("")}
      </nav>
    </header>
  `;

  document.getElementById("nav-logout").addEventListener("click", () => {
    clearSession();
    location.href = "/index.html";
  });

  const toggle = document.getElementById("nav-menu-toggle");
  const mobileNav = document.getElementById("nav-mobile");
  toggle?.addEventListener("click", () => {
    const isHidden = mobileNav.classList.contains("hidden");
    mobileNav.classList.toggle("hidden", !isHidden);
    mobileNav.classList.toggle("flex", isHidden);
    toggle.setAttribute("aria-expanded", String(isHidden));
  });
}
