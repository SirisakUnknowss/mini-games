// =====================================================================
// Win modal — shown after game completion
// =====================================================================
import type { GameResult } from './game';
import { formatTime } from '@lib/format';

export interface WinModalProps {
  result: GameResult;
  rank?: number;
  totalPlayers?: number;
  coinsEarned: number;
  xpEarned: number;
  isPersonalBest?: boolean;
  onContinue: () => void;
  onShare?: () => void;
}

export function showWinModal(props: WinModalProps): void {
  const { result, rank, totalPlayers, coinsEarned, xpEarned, isPersonalBest } = props;

  const existing = document.getElementById('win-modal-root');
  if (existing) existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = 'win-modal-root';
  wrapper.className = 'modal-bg active';
  wrapper.innerHTML = `
    <div class="modal">
      <h2>🎉 You won!</h2>
      <div class="big-number">${result.score.toLocaleString()}</div>
      <p class="small" style="opacity:0.8;">Points</p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:18px 0;">
        <div style="background:rgba(0,0,0,0.25);padding:8px;border-radius:8px;">
          <div style="font-size:11px;opacity:0.8;">Time</div>
          <div style="font-size:18px;font-weight:bold;">${formatTime(result.timeSeconds)}</div>
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:8px;border-radius:8px;">
          <div style="font-size:11px;opacity:0.8;">Mistakes</div>
          <div style="font-size:18px;font-weight:bold;">${result.mistakes}</div>
        </div>
        <div style="background:rgba(0,0,0,0.25);padding:8px;border-radius:8px;">
          <div style="font-size:11px;opacity:0.8;">Hints</div>
          <div style="font-size:18px;font-weight:bold;">${result.hintsUsed}</div>
        </div>
      </div>

      ${rank ? `<p style="font-size:14px;margin-bottom:8px;">🏆 Rank #${rank} / ${totalPlayers}</p>` : ''}
      ${isPersonalBest ? `<p style="color:var(--color-xp);font-weight:bold;">🏆 New Personal Best!</p>` : ''}

      <p style="margin:12px 0;font-size:14px;">
        💰 +${coinsEarned} coins · ⭐ +${xpEarned} XP
      </p>

      <div class="modal-buttons">
        ${props.onShare ? `<button class="btn btn--secondary" id="win-share">Share</button>` : ''}
        <button class="btn" id="win-continue">Continue</button>
      </div>
    </div>
  `;

  document.body.appendChild(wrapper);

  wrapper.querySelector('#win-continue')?.addEventListener('click', () => {
    wrapper.remove();
    props.onContinue();
  });
  wrapper.querySelector('#win-share')?.addEventListener('click', () => {
    props.onShare?.();
  });
}

export function buildShareText(result: GameResult, date?: string, rank?: number, total?: number): string {
  const lines = [
    `🧩 Sudoku Daily${date ? ' #' + date : ''}`,
    `⏱ ${formatTime(result.timeSeconds)} · ❌ ${result.mistakes} · 💡 ${result.hintsUsed}`,
  ];
  if (rank && total) lines.push(`🏆 Rank #${rank} / ${total}`);
  lines.push(`Score: ${result.score.toLocaleString()}`);
  lines.push('');
  lines.push('Play: sudokudaily.app');
  return lines.join('\n');
}
