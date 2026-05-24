// =====================================================================
// Animated splash screen — shown briefly while app boots
// =====================================================================

export function mountSplash(root: HTMLElement): { unmount: () => Promise<void> } {
  const el = document.createElement('div');
  el.className = 'splash-screen';
  el.innerHTML = `
    <div class="splash-logo-wrap">
      <svg class="splash-logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="splashShadow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgba(0,0,0,0.2)"/>
            <stop offset="1" stop-color="rgba(0,0,0,0)"/>
          </linearGradient>
        </defs>
        <!-- shadow -->
        <rect x="22" y="32" width="156" height="156" rx="20" fill="url(#splashShadow)" opacity="0.6"/>
        <!-- board -->
        <rect x="20" y="20" width="160" height="160" rx="18" fill="white" class="splash-board"/>
        <!-- grid -->
        <g stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" class="splash-grid">
          <line x1="73.33" y1="32" x2="73.33" y2="168"/>
          <line x1="126.66" y1="32" x2="126.66" y2="168"/>
          <line x1="32" y1="73.33" x2="168" y2="73.33"/>
          <line x1="32" y1="126.66" x2="168" y2="126.66"/>
        </g>
        <!-- numbers (animate in sequence) -->
        <g font-family="-apple-system, sans-serif" font-size="32" font-weight="bold" text-anchor="middle" class="splash-numbers">
          <text x="46" y="62" fill="#1a1a2e" class="n n1">5</text>
          <text x="100" y="62" fill="#1a1a2e" class="n n2">3</text>
          <text x="153" y="62" fill="#1976d2" class="n n3">4</text>
          <text x="153" y="115" fill="#1976d2" class="n n4">7</text>
          <text x="46" y="168" fill="#1a1a2e" class="n n5">8</text>
          <text x="100" y="168" fill="#1976d2" class="n n6">2</text>
          <text x="153" y="168" fill="#1a1a2e" class="n n7">1</text>
        </g>
      </svg>
      <div class="splash-title">Sudoku <span>Daily</span></div>
      <div class="splash-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  root.appendChild(el);

  return {
    async unmount() {
      el.classList.add('splash-leave');
      await new Promise<void>((resolve) => setTimeout(resolve, 350));
      el.remove();
    },
  };
}
