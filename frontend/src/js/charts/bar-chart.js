/**
 * Renders a small horizontal comparison bar chart as raw SVG.
 * No charting library — a handful of <rect>s is all this needs.
 *
 * @param {{label:string, value:number, color:string}[]} items
 * @param {{width?:number, barHeight?:number, gap?:number}} opts
 */
export function horizontalBarChart(items, opts = {}) {
  const width = opts.width ?? 100; // percentage-based width, scales via CSS
  const barHeight = opts.barHeight ?? 10;
  const gap = opts.gap ?? 22;
  const max = Math.max(1, ...items.map((i) => Math.abs(i.value) || 0));
  const height = items.length * gap;

  const rows = items
    .map((item, i) => {
      const pct = Math.max(2, (Math.abs(item.value) / max) * 100);
      const y = i * gap;
      return `
        <text x="0" y="${y + barHeight - 1}" font-size="10.5" fill="var(--color-ink-dim)" font-family="var(--font-mono)">${escapeXml(
        item.label
      )}</text>
        <rect x="0" y="${y + barHeight + 3}" width="${pct}%" height="${barHeight - 3}" rx="3" fill="${item.color || "var(--color-brand)"}" />
      `;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" role="img" aria-hidden="true">
      ${rows}
    </svg>
  `;
}

/** Simple donut/ring built from stacked stroke segments — used for language breakdowns. */
export function ringChart(segments, { size = 120, thickness = 14 } = {}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const circles = segments
    .map((s) => {
      const frac = s.value / total;
      const dash = frac * circumference;
      const el = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${thickness}" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${size / 2} ${size / 2})" stroke-linecap="butt" />`;
      offset += dash;
      return el;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--color-border)" stroke-width="${thickness}" />
      ${circles}
    </svg>
  `;
}

function escapeXml(str = "") {
  return String(str).replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));
}
