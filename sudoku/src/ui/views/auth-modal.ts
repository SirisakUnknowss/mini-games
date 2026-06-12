// =====================================================================
// Auth modal — sign in / sign up / upgrade-from-anonymous
// =====================================================================
import { signIn, signUp, upgradeAnonymousToEmail, signInWithGoogle } from '@lib/auth';
import { track, Events, identify } from '@lib/analytics';
import { ic } from '@ui/icons';

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
    const title = isUpgrade ? `${ic.cloud(20)} Save your progress`
                : isSignup  ? `${ic.sparkle(20)} Create account`
                            : `${ic.wave(20)} Welcome back`;
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

        ${!isUpgrade ? `
          <button class="btn-google" id="auth-google" type="button">
            <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
          <div class="auth-divider"><span>or</span></div>
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

    // Google sign-in
    wrapper.querySelector('#auth-google')?.addEventListener('click', async () => {
      const btn = wrapper.querySelector<HTMLButtonElement>('#auth-google')!;
      btn.disabled = true;
      btn.textContent = 'Redirecting to Google…';
      await signInWithGoogle(); // redirects browser — page will reload on return
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
