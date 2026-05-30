// =====================================================================
// Profile view — avatar picker, editable display name, stats summary
// =====================================================================
import { useStore } from '@state/store';
import * as api from '@lib/api';
import { escapeHtml, formatNumber } from '@lib/format';
import { track } from '@lib/analytics';

export interface ProfileProps {
  onBack: () => void;
  onOpenStats: () => void;
  onOpenAchievements: () => void;
  onOpenRecap: () => void;
  onSignOut: () => void;
  onUpgradeAccount: () => void;
  onToast: (msg: string) => void;
}

const DEFAULT_AVATARS = [
  '👤','🧑','👩','👨','🧒','👵','👴',
  '🦸','🧙','🥷','🤖','👻','🐱','🦊',
  '🐼','🐯','🦁','🐸','🐧','🦉','🐙',
];

export function mountProfileView(root: HTMLElement, props: ProfileProps): { unmount: () => void } {
  const state = useStore.getState();
  const user = state.user;
  const profile = state.profile ?? {};
  const isAnonymous = !!user?.is_anonymous;
  const currentEmoji = (state.equipped.avatar?.emoji as string) ?? '👤';
  const displayName = profile.display_name || profile.username || (isAnonymous ? 'Guest' : 'Player');

  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="prof-back" aria-label="Back">‹</button>
        <h2 style="margin:0;">👤 Profile</h2>
        <span style="width:38px;"></span>
      </div>

      <div class="profile-hero">
        <button class="profile-avatar" id="prof-avatar-btn" title="Change avatar">${currentEmoji}</button>
        <div class="profile-name">
          <span id="prof-name">${escapeHtml(displayName)}</span>
          <button class="icon-btn icon-btn--ghost" id="prof-edit-name" title="Edit name">✏️</button>
        </div>
        ${isAnonymous ? `
          <div class="badge-tag" style="margin-top:6px;">guest</div>
          <button class="btn btn--small" id="prof-upgrade" style="margin-top:10px;">☁️ Save progress</button>
        ` : `<div style="opacity:0.7;font-size:12px;">${escapeHtml(user?.email ?? '')}</div>`}
      </div>

      <div class="profile-stats">
        <div class="stat-tile">
          <div class="stat-label">Streak</div>
          <div class="stat-value">🔥 ${state.currentStreak}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">Level</div>
          <div class="stat-value">⭐ ${state.level}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">Coins</div>
          <div class="stat-value">💰 ${formatNumber(state.coins)}</div>
        </div>
      </div>

      <div class="card">
        <button class="profile-row" id="prof-stats">
          <span><strong>📊 Stats</strong><br><small>Detailed game history</small></span>
          <span>›</span>
        </button>
        <button class="profile-row" id="prof-ach">
          <span><strong>🏆 Achievements</strong><br><small>Unlock badges</small></span>
          <span>›</span>
        </button>
        <button class="profile-row" id="prof-recap">
          <span><strong>📅 Weekly Recap</strong><br><small>This week's highlights</small></span>
          <span>›</span>
        </button>
        ${!isAnonymous ? `
          <button class="profile-row danger" id="prof-signout">
            <span><strong>🚪 Sign out</strong></span>
            <span>›</span>
          </button>
        ` : ''}
      </div>

      <div id="avatar-grid" class="avatar-grid hidden">
        ${DEFAULT_AVATARS.map((e) => `
          <button class="avatar-cell${e === currentEmoji ? ' selected' : ''}" data-emoji="${e}">${e}</button>
        `).join('')}
      </div>
    </section>
    <nav class="bottom-nav">
      <button id="prof-nav-home"><span class="icon">🏠</span><span>Home</span></button>
      <button id="prof-nav-lb"><span class="icon">🏆</span><span>Leaderboard</span></button>
      <button id="prof-nav-shop"><span class="icon">🛍️</span><span>Shop</span></button>
      <button class="active"><span class="icon">👤</span><span>Profile</span></button>
    </nav>
  `;

  const avatarGrid = root.querySelector<HTMLElement>('#avatar-grid')!;
  const avatarBtn = root.querySelector<HTMLElement>('#prof-avatar-btn')!;

  avatarBtn.addEventListener('click', () => {
    avatarGrid.classList.toggle('hidden');
  });

  avatarGrid.querySelectorAll<HTMLButtonElement>('.avatar-cell').forEach((cell) => {
    cell.addEventListener('click', async () => {
      const emoji = cell.dataset.emoji!;
      avatarGrid.querySelectorAll('.avatar-cell').forEach((c) => c.classList.remove('selected'));
      cell.classList.add('selected');
      avatarBtn.textContent = emoji;
      const newAvatar = { emoji };
      useStore.getState().setEquipped({ avatar: newAvatar });
      track('avatar_changed', { emoji });
      try {
        await api.equipItem({ avatar: newAvatar });
      } catch {
        // local-only fallback
      }
      props.onToast('Avatar updated');
    });
  });

  root.querySelector('#prof-edit-name')?.addEventListener('click', async () => {
    const next = prompt('Display name:', displayName);
    if (next == null) return;
    const trimmed = next.trim().slice(0, 20);
    if (!trimmed) return;
    try {
      await api.updateProfile({ display_name: trimmed });
      useStore.setState({
        profile: { ...(useStore.getState().profile ?? {}), display_name: trimmed },
      });
      const nameEl = root.querySelector<HTMLElement>('#prof-name');
      if (nameEl) nameEl.textContent = trimmed;
      props.onToast('Name updated');
    } catch (err) {
      props.onToast('Could not update name');
      console.warn(err);
    }
  });

  root.querySelector('#prof-back')?.addEventListener('click', props.onBack);
  root.querySelector('#prof-nav-home')?.addEventListener('click', props.onBack);
  root.querySelector('#prof-stats')?.addEventListener('click', props.onOpenStats);
  root.querySelector('#prof-ach')?.addEventListener('click', props.onOpenAchievements);
  root.querySelector('#prof-recap')?.addEventListener('click', props.onOpenRecap);
  root.querySelector('#prof-signout')?.addEventListener('click', props.onSignOut);
  root.querySelector('#prof-upgrade')?.addEventListener('click', props.onUpgradeAccount);

  return { unmount() { /* no listeners to clean */ } };
}
