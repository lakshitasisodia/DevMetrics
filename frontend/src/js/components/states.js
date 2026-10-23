export function loadingBlock(message = "Loading…") {
  return `
    <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div class="spinner w-6 h-6"></div>
      <p class="text-sm text-[var(--color-ink-dim)]">${message}</p>
    </div>
  `;
}

export function skeletonCards(count = 3) {
  return `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${Array.from({ length: count })
        .map(
          () => `
        <div class="card p-5 space-y-3">
          <div class="skeleton h-4 w-2/3"></div>
          <div class="skeleton h-3 w-full"></div>
          <div class="skeleton h-3 w-4/5"></div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

export function errorBlock(message, { retryId = "retry-btn" } = {}) {
  return `
    <div class="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
      <div class="w-10 h-10 rounded-full bg-[var(--color-del-soft)] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-del)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8v5m0 3h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
        </svg>
      </div>
      <p class="text-sm text-[var(--color-ink)] font-medium max-w-sm">${message}</p>
      <button type="button" id="${retryId}" class="btn btn-secondary text-sm mt-1">Try again</button>
    </div>
  `;
}

export function emptyBlock({ title, body, actionLabel, actionId = "empty-action" }) {
  return `
    <div class="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
      <div class="w-10 h-10 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center mb-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-dim)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
        </svg>
      </div>
      <p class="text-sm font-medium text-[var(--color-ink)]">${title}</p>
      ${body ? `<p class="text-sm text-[var(--color-ink-dim)] max-w-sm">${body}</p>` : ""}
      ${actionLabel ? `<button type="button" id="${actionId}" class="btn btn-primary text-sm mt-3">${actionLabel}</button>` : ""}
    </div>
  `;
}
