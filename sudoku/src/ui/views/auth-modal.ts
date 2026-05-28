// =====================================================================
// Auth modal — sign in / sign up / upgrade-from-anonymous
// =====================================================================
import { signIn, signUp, upgradeAnonymousToEmail } from '@lib/auth';
import { track, Events, identify } from '@lib/analytics';

type Mode = 'signin' | 'signup' | 'upgrade';

export interface AuthModalProps {
  /** initial mode — defaults to 'signin' */
  mode?: Mode;
  /** true when user is currently anonymous and trying to save progress */
  isUpgrade?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function showAuthModal(props: AuthModalProps): void {
  const existing = document.getElementById('auth-modal-root');
  if (existing) existing.remove();

  const initialMode: Mode = props.isUpgrade ? 'upgrade' : (props.mode ?? 'signin');
  let mode: Mode = initialMode;

  const wrapper = document.createElement('div');
  wrapper.id = 'auth-modal-root';
  wrapper.className = 'modal-bg active';
  document.body.appendChild(wrapper);

  const render = () => {
    const isUpgrade = mode === 'upgrade';
    const isSignup = mode === 'signup';
    const title = isUpgrade ? '☁️ Save your progress'
                : isSignup  ? '✨ Create account'
                            : '👋 Welcome back';
    const subtitle = isUpgrade
      ? 'Link an email so you can play on any device.'
      : isSignup
        ? 'Sign up to sync across devices.'
        : 'Sign in to your account.';
    const submitLabel = isUpgrade ? 'Save progress'
                      : isSignup  ? 'Create account'
                                  : 'Sign in';

    wrapper.innerHTML = `
      <div class="modal auth-modal">
        <button class="modal-close" id="auth-close" aria-label="Close">×</button>
        <h2>${title}</h2>
        <p class="auth-sub">${subtitle}</p>

        ${!isUpgrade ? `
          <div class="auth-tabs">
            <button class="auth-tab ${mode === 'signin' ? 'active' : ''}" data-tab="signin">Sign in</button>
            <button class="auth-tab ${mode === 'signup' ? 'active' : ''}" data-tab="signup">Sign up</button>
          </div>
        ` : ''}

        <form class="auth-form" id="auth-form">
          <label class="auth-field">
            <span>Email</span>
            <input type="email" id="auth-email" required autocomplete="email" placeholder="you@example.com">
          </label>
          <label class="auth-field">
            <span>Password</span>
            <input type="password" id="auth-password" required minlength="6" autocomplete="${isSignup || isUpgrade ? 'new-password' : 'current-password'}" placeholder="At least 6 characters">
          </label>
          <p class="auth-error" id="auth-error" aria-live="polite"></p>
          <button type="submit" class="btn btn--full" id="auth-submit">${submitLabel}</button>
        </form>

        ${isUpgrade ? `
          <p class="auth-note">Your coins, streak, and stats will stay the same.</p>
        ` : `
          <p class="auth-note">
            Or <button class="auth-link" id="auth-guest">continue as guest</button>
          </p>
        `}
      </div>
    `;

    // Tab switching (signin/signup)
    wrapper.querySelectorAll<HTMLButtonElement>('.auth-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.tab as Mode;
        if (next && next !== mode) {
          mode = next;
          render();
        }
      });
    });

    // Close button
    wrapper.querySelector('#auth-close')?.addEventListener('click', () => {
      wrapper.remove();
      props.onCancel();
    });

    // Continue as guest (only shown when not upgrade)
    wrapper.querySelector('#auth-guest')?.addEventListener('click', (e) => {
      e.preventDefault();
      wrapper.remove();
      props.onCancel();
    });

    // Form submit
    const form = wrapper.querySelector<HTMLFormElement>('#auth-form')!;
    const submitBtn = wrapper.querySelector<HTMLButtonElement>('#auth-submit')!;
    const errorEl = wrapper.querySelector<HTMLElement>('#auth-error')!;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (wrapper.querySelector<HTMLInputElement>('#auth-email')!).value.trim();
      const password = (wrapper.querySelector<HTMLInputElement>('#auth-password')!).value;

      if (!email || !password) {
        errorEl.textContent = 'Please fill in both fields.';
        return;
      }
      if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters.';
        return;
      }

      errorEl.textContent = '';
      submitBtn.disabled = true;
      const origLabel = submitBtn.textContent;
      submitBtn.textContent = 'Please wait…';

      try {
        let result;
        if (mode === 'signin') {
          result = await signIn(email, password);
          if (result.ok && result.user) {
            track(Events.SIGN_IN, { method: 'email' });
            identify(result.user.id);
          }
        } else if (mode === 'signup') {
          result = await signUp(email, password);
          if (result.ok && result.user) {
            track(Events.SIGN_UP, { method: 'email' });
            identify(result.user.id);
          }
        } else {
          result = await upgradeAnonymousToEmail(email, password);
          if (result.ok && result.user) {
            track(Events.ANONYMOUS_UPGRADED, {});
          }
        }

        if (!result.ok) {
          errorEl.textContent = result.error ?? 'Something went wrong.';
          submitBtn.disabled = false;
          submitBtn.textContent = origLabel;
          return;
        }

        wrapper.remove();
        props.onSuccess();
      } catch (err) {
        errorEl.textContent = String(err);
        submitBtn.disabled = false;
        submitBtn.textContent = origLabel;
      }
    });
  };

  render();
}
