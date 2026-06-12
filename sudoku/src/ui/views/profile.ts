// =====================================================================
// Profile view — avatar picker, editable display name, stats summary
// =====================================================================
import { useStore } from '@state/store';
import * as api from '@lib/api';
import { escapeHtml, formatNumber } from '@lib/format';
import { track } from '@lib/analytics';
import { bottomNavHTML, wireBottomNav, type BottomNavCallbacks } from '../components/bottom-nav';
import { ic } from '@ui/icons';
import { APP_VERSION } from '@lib/version';

export interface ProfileProps {
  onBack: () => void;
  onOpenStats: () => void;
  onOpenAchievements: () => void;
  onOpenRecap: () => void;
  onOpenLedger: () => void;
  onSignOut: () => void;
  onUpgradeAccount: () => void;
  onToast: (msg: string) => void;
  nav: BottomNavCallbacks;
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
  // A real (signed-in) user has an email and is not anonymous.
  // Anonymous Supabase users + offline-demo guests both lack a real account.
  const isSignedIn = !!user && !isAnonymous;
  const isGuest = !isSignedIn;
  const currentEmoji = (state.equipped.avatar?.emoji as string) ?? '👤';
  const displayName = profile.display_name || profile.username || (isGuest ? 'Guest' : 'Player');

  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="prof-back" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style="margin:0;font-size:16px;color:var(--app-text);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Profile
        </h2>
        <span style="width:38px;"></span>
      </div>

      <div class="profile-hero">
        <button class="profile-avatar" id="prof-avatar-btn" title="Change avatar">${currentEmoji}</button>
        <div class="profile-name">
          <span id="prof-name">${escapeHtml(displayName)}</span>
          <button class="icon-btn--ghost" id="prof-edit-name" title="Edit name">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
        <div class="badge-tag" style="margin-top:6px;">${isGuest ? 'GUEST' : 'MEMBER'}</div>
        ${isGuest ? `
          <button class="btn btn--primary btn--small" id="prof-upgrade" style="margin-top:10px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            Save progress
          </button>
        ` : `<div style="font-size:12px;color:var(--app-text-secondary);margin-top:4px;">${escapeHtml(user?.email ?? '')}</div>`}
      </div>

      <div class="profile-stats">
        <div class="stat-tile">
          <div class="stat-label">STREAK</div>
          <div class="stat-value">${ic.streak(14)} ${state.currentStreak}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">LEVEL</div>
          <div class="stat-value">${ic.star(14)} ${state.level}</div>
        </div>
        <div class="stat-tile">
          <div class="stat-label">COINS</div>
          <div class="stat-value">${ic.coin(14)} ${formatNumber(state.coins)}</div>
        </div>
      </div>

      <div class="card">
        <button class="profile-row" id="prof-stats">
          <span style="display:flex;align-items:center;gap:10px;">
            <svg class="row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span><span style="color:var(--app-text)">Stats</span><br><small>Detailed game history</small></span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="profile-row" id="prof-ach">
          <span style="display:flex;align-items:center;gap:10px;">
            <svg class="row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            <span><span style="color:var(--app-text)">Achievements</span><br><small>Unlock badges</small></span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="profile-row" id="prof-recap">
          <span style="display:flex;align-items:center;gap:10px;">
            <svg class="row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span><span style="color:var(--app-text)">Weekly Recap</span><br><small>This week's highlights</small></span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <button class="profile-row" id="prof-ledger">
          <span style="display:flex;align-items:center;gap:10px;">
            <svg class="row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></svg>
            <span><span style="color:var(--app-text)">Coin Ledger</span><br><small>Earned and spent</small></span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        ${isSignedIn ? `
          <button class="profile-row danger" id="prof-signout">
            <span style="display:flex;align-items:center;gap:10px;">
              <svg class="row-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span style="color:#ef4444">Sign out</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ` : ''}
      </div>

      <div class="app-version">v${APP_VERSION}</div>

      <div id="avatar-grid" class="avatar-grid hidden">
        ${DEFAULT_AVATARS.map((e) => `
          <button class="avatar-cell${e === currentEmoji ? ' selected' : ''}" data-emoji="${e}">${e}</button>
        `).join('')}
      </div>
    </section>
    ${bottomNavHTML('profile')}
  `;
  wireBottomNav(root, props.nav, 'profile');

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
  root.querySelector('#prof-stats')?.addEventListener('click', props.onOpenStats);
  root.querySelector('#prof-ach')?.addEventListener('click', props.onOpenAchievements);
  root.querySelector('#prof-recap')?.addEventListener('click', props.onOpenRecap);
  root.querySelector('#prof-ledger')?.addEventListener('click', props.onOpenLedger);
  root.querySelector('#prof-signout')?.addEventListener('click', props.onSignOut);
  root.querySelector('#prof-upgrade')?.addEventListener('click', props.onUpgradeAccount);

  return { unmount() { /* no listeners to clean */ } };
}
