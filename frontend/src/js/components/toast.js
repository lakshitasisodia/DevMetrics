let container = null;

function ensureContainer() {
  if (container) return container;
  container = document.createElement("div");
  container.setAttribute("aria-live", "polite");
  container.className =
    "fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]";
  document.body.appendChild(container);
  return container;
}

const VARIANTS = {
  success: { border: "border-l-[var(--color-add)]", icon: "M20 6 9 17l-5-5" },
  error: {
    border: "border-l-[var(--color-del)]",
    icon: "M12 8v5m0 3h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z",
  },
  info: { border: "border-l-[var(--color-info)]", icon: "M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" },
};

export function showToast(message, { variant = "info", duration = 4500 } = {}) {
  const el = ensureContainer();
  const v = VARIANTS[variant] || VARIANTS.info;

  const toast = document.createElement("div");
  toast.className = `card border-l-4 ${v.border} px-4 py-3 flex items-start gap-3 shadow-xl shadow-black/40 animate-[toast-in_180ms_ease-out]`;
  toast.innerHTML = `
    <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="${v.icon}" />
    </svg>
    <p class="text-sm text-[var(--color-ink)] leading-snug">${message}</p>
    <button type="button" aria-label="Dismiss" class="ml-auto shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
    </button>
  `;

  const remove = () => {
    toast.style.transition = "opacity 150ms ease, transform 150ms ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(8px)";
    setTimeout(() => toast.remove(), 150);
  };

  toast.querySelector("button").addEventListener("click", remove);
  el.appendChild(toast);
  if (duration) setTimeout(remove, duration);
}

const styleTag = document.createElement("style");
styleTag.textContent = `@keyframes toast-in { from { opacity: 0; transform: translateY(-6px);} to { opacity: 1; transform: translateY(0);} }`;
document.head.appendChild(styleTag);
