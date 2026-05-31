// =====================================================================
// Daily Quests renderer — drop-in for the #quest-list element on home
// =====================================================================
import * as api from '@lib/api';
import { useStore } from '@state/store';
import { todayUtc, escapeHtml } from '@lib/format';
import { track } from '@lib/analytics';
import { sfxQuestClaim } from '@lib/sound';

interface Quest {
  date: string;
  quest_id: string;
  tier: number;
  target: number;
  progress: number;
  reward_coin: number;
  reward_xp: number;
  completed_at: string | null;
  claimed_at: string | null;
}

const QUEST_META: Record<string, { icon: string; title: string }> = {
  daily_complete: { icon: '📅', title: 'Complete today\'s daily puzzle' },
  no_mistakes: { icon: '🎯', title: 'Finish with 0 mistakes' },
  no_hints: { icon: '🧠', title: 'Finish without using a hint' },
  fast_finish: { icon: '⚡', title: 'Finish under target time' },
  practice_streak: { icon: '🔁', title: 'Complete 3 practice puzzles' },
};

function questTitle(q: Quest): string {
  return QUEST_META[q.quest_id]?.title || q.quest_id.replace(/_/g, ' ');
}

function questIcon(q: Quest): string {
  return QUEST_META[q.quest_id]?.icon || '⭐';
}

export interface RenderQuestsOptions {
  /** called with a toast message after claim/refresh */
  onToast?: (msg: string) => void;
}

export async function renderDailyQuests(container: HTMLElement, opts: RenderQuestsOptions = {}): Promise<void> {
  if (!useStore.getState().user) {
    container.innerHTML = `<p style="opacity:0.7;font-size:13px;">Sign in to see daily quests.</p>`;
    return;
  }

  container.innerHTML = `<p style="opacity:0.7;font-size:13px;">Loading quests…</p>`;

  let quests: Quest[];
  try {
    quests = (await api.getDailyQuests(todayUtc())) as Quest[];
  } catch (err) {
    container.innerHTML = `<p style="opacity:0.7;font-size:13px;">⚠️ Could not load quests.</p>`;
    console.warn('Quest load failed:', err);
    return;
  }

  if (!quests.length) {
    container.innerHTML = `<p style="opacity:0.7;font-size:13px;">No quests yet — play today's daily to unlock them.</p>`;
    return;
  }

  container.innerHTML = quests.map((q) => {
    const pct = Math.min(100, Math.round((q.progress / Math.max(1, q.target)) * 100));
    const done = !!q.completed_at;
    const claimed = !!q.claimed_at;
    const state = claimed ? 'claimed' : done ? 'claimable' : 'progress';
    return `
      <div class="quest-row quest-${state}" data-quest="${escapeHtml(q.quest_id)}">
        <div class="quest-icon">${questIcon(q)}</div>
        <div class="quest-body">
          <div class="quest-title">${escapeHtml(questTitle(q))}</div>
          <div class="quest-bar">
            <div class="quest-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="quest-meta">
            <span>${q.progress}/${q.target}</span>
            <span>💰 ${q.reward_coin}${q.reward_xp ? ` · ⭐ ${q.reward_xp}` : ''}</span>
          </div>
        </div>
        <div class="quest-action">
          ${claimed
            ? `<span class="quest-tag">✓ Claimed</span>`
            : done
              ? `<button class="btn btn--small" data-claim="${escapeHtml(q.quest_id)}">Claim</button>`
              : `<span class="quest-tag muted">${pct}%</span>`}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll<HTMLButtonElement>('[data-claim]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const questId = btn.dataset.claim!;
      btn.disabled = true;
      btn.textContent = '…';
      try {
        const { error } = await api.claimQuestReward(todayUtc(), questId);
        if (error) throw error;
        track('quest_claimed', { quest_id: questId });
        sfxQuestClaim();
        opts.onToast?.('Quest reward claimed! 💰');
        // Optimistically refresh
        await renderDailyQuests(container, opts);
      } catch (err) {
        console.warn('Claim failed:', err);
        opts.onToast?.('Could not claim — try again');
        btn.disabled = false;
        btn.textContent = 'Claim';
      }
    });
  });
}
