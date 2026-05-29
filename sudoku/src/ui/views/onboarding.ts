// =====================================================================
// Onboarding wizard — 4 steps, shown once per device
// =====================================================================
import { supabase } from '@lib/supabase';
import { useStore } from '@state/store';
import { track } from '@lib/analytics';

const ONBOARDED_KEY = 'sudoku_onboarded_v1';

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === '1';
  } catch {
    return false;
  }
}

export function markOnboarded(): void {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch { /* private mode */ }
}

export interface OnboardingProps {
  onFinish: () => void;
}

export function showOnboarding(props: OnboardingProps): void {
  const existing = document.getElementById('onb-root');
  if (existing) existing.remove();

  let step = 0;
  let nickname = '';
  let notifChoice: 'accept' | 'skip' | null = null;

  const wrapper = document.createElement('div');
  wrapper.id = 'onb-root';
  wrapper.className = 'modal-bg active';
  document.body.appendChild(wrapper);

  track('onboarding_started');

  const finish = async () => {
    markOnboarded();
    // Save nickname to profile if provided
    if (nickname.trim().length > 0) {
      try {
        const user = useStore.getState().user;
        if (user) {
          await supabase.from('profiles').update({ display_name: nickname.trim() }).eq('id', user.id);
          useStore.setState({ profile: { ...(useStore.getState().profile ?? {}), display_name: nickname.trim() } });
        }
      } catch (err) {
        console.warn('Failed to save nickname:', err);
      }
    }
    track('onboarding_completed', { steps: 4, notifications: notifChoice ?? 'skipped' });
    wrapper.remove();
    props.onFinish();
  };

  const renderStep = () => {
    let body = '';
    let primaryLabel = 'Next';
    let canSkip = step < 3;

    if (step === 0) {
      body = `
        <div class="onb-emoji">👋</div>
        <h2>Welcome to Sudoku Daily!</h2>
        <p class="onb-sub">Let's set up your account. What should we call you?</p>
        <label class="auth-field" style="margin-top:14px;">
          <span>Nickname (optional)</span>
          <input id="onb-name" type="text" maxlength="20" placeholder="e.g. SudokuMaster" value="${nickname}">
        </label>
      `;
      primaryLabel = 'Continue';
    } else if (step === 1) {
      body = `
        <div class="onb-emoji">🧠</div>
        <h2>How to play</h2>
        <ul class="onb-list">
          <li>Fill the grid so every <strong>row</strong>, <strong>column</strong>, and <strong>3×3 box</strong> contains digits 1–9.</li>
          <li>Tap a cell, then tap a number on the numpad to place it.</li>
          <li>Use <strong>hints</strong> wisely — they cost score.</li>
        </ul>
      `;
    } else if (step === 2) {
      body = `
        <div class="onb-emoji">📅</div>
        <h2>One puzzle per day</h2>
        <ul class="onb-list">
          <li>A new daily puzzle drops every midnight UTC.</li>
          <li>Keep your <strong>🔥 streak</strong> alive — play every day!</li>
          <li>Climb the global <strong>leaderboard</strong> for bragging rights.</li>
        </ul>
        <p class="onb-sub" style="margin-top:12px;">Want a daily reminder?</p>
        <div class="onb-choices">
          <button class="btn btn--secondary" data-notif="accept">🔔 Yes, remind me</button>
          <button class="btn btn--secondary" data-notif="skip">No thanks</button>
        </div>
      `;
      primaryLabel = 'Next';
    } else {
      body = `
        <div class="onb-emoji">🚀</div>
        <h2>You're all set!</h2>
        <p class="onb-sub">Ready to start your first daily puzzle?</p>
        <ul class="onb-list" style="margin-top:14px;">
          <li>💰 Earn coins for each puzzle</li>
          <li>⭐ Level up by gaining XP</li>
          <li>🏆 Unlock achievements</li>
        </ul>
      `;
      primaryLabel = "Let's play!";
      canSkip = false;
    }

    wrapper.innerHTML = `
      <div class="modal onb-modal">
        <div class="onb-dots">
          ${[0, 1, 2, 3].map((i) => `<span class="onb-dot${i === step ? ' active' : ''}${i < step ? ' done' : ''}"></span>`).join('')}
        </div>
        ${body}
        <div class="modal-buttons" style="margin-top:18px;">
          ${canSkip ? `<button class="btn btn--secondary" id="onb-skip">Skip</button>` : ''}
          <button class="btn" id="onb-next">${primaryLabel}</button>
        </div>
      </div>
    `;

    // Step-specific handlers
    if (step === 0) {
      const input = wrapper.querySelector<HTMLInputElement>('#onb-name');
      input?.focus();
      input?.addEventListener('input', (e) => {
        nickname = (e.target as HTMLInputElement).value;
      });
    }
    if (step === 2) {
      wrapper.querySelectorAll<HTMLButtonElement>('[data-notif]').forEach((btn) => {
        btn.addEventListener('click', () => {
          notifChoice = btn.dataset.notif as 'accept' | 'skip';
          wrapper.querySelectorAll<HTMLButtonElement>('[data-notif]').forEach((b) => {
            b.classList.toggle('selected', b === btn);
          });
        });
      });
    }

    wrapper.querySelector('#onb-skip')?.addEventListener('click', () => void finish());
    wrapper.querySelector('#onb-next')?.addEventListener('click', () => {
      if (step < 3) {
        step += 1;
        renderStep();
      } else {
        void finish();
      }
    });
  };

  renderStep();
}
