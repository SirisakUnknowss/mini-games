// =====================================================================
// Tiny canvas line chart — no deps. Suited to ≤60 data points.
// =====================================================================

export interface LinePoint { label: string; value: number; }

export interface LineChartOptions {
  height?: number;
  padding?: number;
  stroke?: string;
  fill?: string;
  textColor?: string;
  gridColor?: string;
}

const DEFAULTS: Required<LineChartOptions> = {
  height: 160,
  padding: 24,
  stroke: '#ffeb3b',
  fill: 'rgba(255, 235, 59, 0.18)',
  textColor: 'rgba(255,255,255,0.85)',
  gridColor: 'rgba(255,255,255,0.12)',
};

export function drawLineChart(canvas: HTMLCanvasElement, points: LinePoint[], opts: LineChartOptions = {}): void {
  const o = { ...DEFAULTS, ...opts };
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 320;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(o.height * dpr);
  canvas.style.height = `${o.height}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, o.height);

  if (!points.length) {
    ctx.fillStyle = o.textColor;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet', cssWidth / 2, o.height / 2);
    return;
  }

  const values = points.map((p) => p.value);
  const max = Math.max(1, ...values);
  const min = 0;
  const innerW = cssWidth - o.padding * 2;
  const innerH = o.height - o.padding * 2;

  // Grid lines (4 horizontal)
  ctx.strokeStyle = o.gridColor;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = o.padding + (innerH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(o.padding, y);
    ctx.lineTo(o.padding + innerW, y);
    ctx.stroke();
  }

  // Y-axis labels (max + mid + 0)
  ctx.fillStyle = o.textColor;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.round(max)), o.padding - 4, o.padding + 4);
  ctx.fillText(String(Math.round(max / 2)), o.padding - 4, o.padding + innerH / 2 + 4);
  ctx.fillText('0', o.padding - 4, o.padding + innerH + 4);

  // Path
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0;
  const xy = points.map((p, i) => {
    const x = o.padding + stepX * i;
    const ratio = (p.value - min) / (max - min || 1);
    const y = o.padding + innerH - ratio * innerH;
    return { x, y };
  });

  // Filled area
  ctx.beginPath();
  ctx.moveTo(xy[0].x, o.padding + innerH);
  for (const p of xy) ctx.lineTo(p.x, p.y);
  ctx.lineTo(xy[xy.length - 1].x, o.padding + innerH);
  ctx.closePath();
  ctx.fillStyle = o.fill;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(xy[0].x, xy[0].y);
  for (let i = 1; i < xy.length; i++) ctx.lineTo(xy[i].x, xy[i].y);
  ctx.strokeStyle = o.stroke;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Dots
  ctx.fillStyle = o.stroke;
  for (const p of xy) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // X-axis: first + last + middle labels only (avoid crowding)
  ctx.fillStyle = o.textColor;
  ctx.textAlign = 'center';
  const labelsToShow = [0, Math.floor((points.length - 1) / 2), points.length - 1];
  for (const i of labelsToShow) {
    if (!points[i]) continue;
    ctx.fillText(points[i].label, xy[i].x, o.height - 6);
  }
}
