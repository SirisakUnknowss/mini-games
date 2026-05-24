// =====================================================================
// Format utilities
// =====================================================================

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function todayUtc(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  );
}
