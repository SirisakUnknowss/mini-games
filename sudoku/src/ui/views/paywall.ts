// =====================================================================
// Paywall modal — STUB for Phase 5 monetization
// Wires UI only. Real IAP/subscription requires RevenueCat or App/Play
// Store Connect setup which is out of scope for this code-only milestone.
// =====================================================================
import { track } from '@lib/analytics';

export interface PaywallProps {
  source?: string;
  onClose: () => void;
}

const PERKS = [
  '🎨 All themes unlocked',
  '📊 Full stats history (not just last 30 days)',
  '🚫 No ads',
  '🎁 Monthly coin bonus',
  '⚡ Priority support',
];

export function showPaywall(props: PaywallProps): void {
  const existing = document.getElementById('paywall-root');
  if (existing) existing.remove();

  track('paywall_shown', { source: props.source ?? 'unknown' });

  const wrapper = document.createElement('div');
  wrapper.id = 'paywall-root';
  wrapper.className = 'modal-bg active';
  wrapper.innerHTML = `
    <div class="modal paywall-modal">
      <button class="modal-close" id="pw-close" aria-label="Close">×</button>
      <div style="font-size:48px;">✨</div>
      <h2>Sudoku Premium</h2>
      <p class="auth-sub">Unlock everything. Cancel anytime.</p>

      <ul class="onb-list" style="text-align:left;margin:14px 0;">
        ${PERKS.map((p) => `<li>${p}</li>`).join('')}
      </ul>

      <div class="paywall-plans">
        <button class="paywall-plan" data-plan="monthly">
          <strong>Monthly</strong><span>$3.99/mo</span>
        </button>
        <button class="paywall-plan recommended" data-plan="yearly">
          <strong>Yearly</strong><span>$29.99/yr</span>
          <small>Save 37%</small>
        </button>
      </div>

      <p class="auth-note">
        Subscriptions are not yet available in this build.
        <br>Coming soon via App Store / Play Store.
      </p>
    </div>
  `;
  document.body.appendChild(wrapper);

  wrapper.querySelectorAll<HTMLButtonElement>('[data-plan]').forEach((btn) => {
    btn.addEventListener('click', () => {
      track('paywall_plan_clicked', { plan: btn.dataset.plan });
      alert('Subscription flow not yet available — coming soon via the App Store / Play Store.');
    });
  });

  wrapper.querySelector('#pw-close')?.addEventListener('click', () => {
    wrapper.remove();
    props.onClose();
  });
}
