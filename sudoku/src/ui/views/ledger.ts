// =====================================================================
// Coin transactions ledger — debug-friendly view of all coin in/out
// =====================================================================
import { supabase } from '@lib/supabase';
import { useStore } from '@state/store';
import { escapeHtml, formatNumber } from '@lib/format';
import { bottomNavHTML, wireBottomNav, type BottomNavCallbacks } from '../components/bottom-nav';
import { ic } from '@ui/icons';

interface Tx {
  id: number;
  amount: number;
  reason: string;
  balance_after: number;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export interface LedgerProps {
  onBack: () => void;
  nav: BottomNavCallbacks;
}

const REASON_LABEL: Record<string, string> = {
  signup_bonus:        'Welcome bonus',
  daily_complete:      'Daily puzzle',
  practice_complete:   'Practice complete',
  purchase_item:       'Item purchased',
  hint_used:           'Hint used',
  level_up_bonus:      'Level up reward',
  streak_bonus:        'Streak bonus',
  achievement_reward:  'Achievement reward',
  xp_reward:           'XP reward',
  refund:              'Refund',
  admin_grant:         'Admin grant',
};

function reasonLabel(reason: string): string {
  return REASON_LABEL[reason] ?? reason.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch { return iso; }
}

export function mountLedgerView(root: HTMLElement, props: LedgerProps): { unmount: () => void } {
  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="ledger-back" aria-label="Back"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        <h2 style="margin:0;">${ic.coin(16)} Coin Ledger</h2>
        <span style="width:38px;"></span>
      </div>
      <div id="ledger-body" class="stats-body">
        <div class="shop-loading">Loading…</div>
      </div>
    </section>
    ${bottomNavHTML('profile')}
  `;
  wireBottomNav(root, props.nav, 'profile');

  const body = root.querySelector<HTMLElement>('#ledger-body')!;

  async function load() {
    const userId = useStore.getState().user?.id;
    if (!userId) {
      body.innerHTML = `<div class="lb-empty"><p>Sign in to see your ledger.</p></div>`;
      return;
    }
    try {
      const { data, error } = await supabase
        .from('coin_transactions')
        .select('id, amount, reason, balance_after, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const txs = (data ?? []) as Tx[];
      if (!txs.length) {
        body.innerHTML = `<div class="lb-empty"><p>${ic.empty(20)} No transactions yet.</p>
          <p style="opacity:0.75;font-size:13px;">Play a daily puzzle to earn your first coins.</p></div>`;
        return;
      }

      const earned = txs.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
      const spent = txs.filter((t) => t.amount < 0).reduce((a, t) => a + t.amount, 0);

      body.innerHTML = `
        <div class="profile-stats">
          <div class="stat-tile"><div class="stat-label">Earned</div><div class="stat-value" style="color:#a5d6a7;">+${formatNumber(earned)}</div></div>
          <div class="stat-tile"><div class="stat-label">Spent</div><div class="stat-value" style="color:#ffab91;">${formatNumber(spent)}</div></div>
          <div class="stat-tile"><div class="stat-label">Balance</div><div class="stat-value">${formatNumber(useStore.getState().coins)}</div></div>
        </div>

        <div class="card">
          <h3>Last 100 transactions</h3>
          <div class="ledger-list">
            ${txs.map((t) => {
              const sign = t.amount > 0 ? '+' : '';
              const color = t.amount > 0 ? '#a5d6a7' : '#ffab91';
              return `
                <div class="ledger-row">
                  <div class="ledger-reason">
                    <strong>${escapeHtml(reasonLabel(t.reason))}</strong>
                    <small>${formatTimestamp(t.created_at)}</small>
                  </div>
                  <div class="ledger-amount" style="color:${color};">${sign}${t.amount.toLocaleString()}</div>
                </div>
              `;
            }).join('')}
          </div>
          <p style="opacity:0.65;font-size:11px;margin-top:10px;">Showing the 100 most recent transactions.</p>
        </div>
      `;
    } catch (err) {
      body.innerHTML = `<div class="lb-empty"><p>${ic.warning(16)} ${escapeHtml((err as Error).message)}</p></div>`;
    }
  }

  root.querySelector('#ledger-back')?.addEventListener('click', props.onBack);

  void load();
  return { unmount() { /* no-op */ } };
}
