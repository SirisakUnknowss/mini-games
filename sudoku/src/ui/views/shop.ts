// =====================================================================
// Shop view — browse / purchase / equip items
// =====================================================================
import * as api from '@lib/api';
import { useStore } from '@state/store';
import { escapeHtml, formatNumber } from '@lib/format';
import { track } from '@lib/analytics';
import { applyTheme, themePreview, THEMES } from '@lib/themes';
import { applyBackground, BACKGROUNDS, bgPreviewIcon } from '@lib/backgrounds';
import { countUp, floatReward } from '@lib/animate';
import { PREMIUM_THEMES, isPremium } from '@lib/premium';
import { showPaywall } from './paywall';
import { bottomNavHTML, wireBottomNav, type BottomNavCallbacks } from '../components/bottom-nav';
import { ic } from '@ui/icons';
import { sfxThemeChange, sfxCoin } from '@lib/sound';

export interface ShopProps {
  onBack: () => void;
  onToast: (msg: string) => void;
  nav: BottomNavCallbacks;
}

type Category = 'theme' | 'background' | 'avatar' | 'all';

interface ShopItem {
  id: string;
  category: string;
  name: string;
  description: string | null;
  price_coin: number;
  rarity: string | null;
  unlock_type: string;
  available: boolean;
  sort_order: number;
}

const RARITY_LABEL: Record<string, string> = {
  common: '◯ COMMON', rare: '◉ RARE', epic: '◈ EPIC', legendary: '★ LEGENDARY',
};

const AVATAR_EMOJI: Record<string, string> = {
  avatar_face_happy:   '😊',
  avatar_face_cool:    '😎',
  avatar_face_nerd:    '🤓',
  avatar_face_lion:    '🦁',
  avatar_hat_cap:      '🧢',
  avatar_hat_top:      '🎩',
  avatar_hat_crown:    '👑',
  avatar_pet_dog:      '🐶',
  avatar_pet_cat:      '🐱',
  avatar_pet_dragon:   '🐲',
  avatar_frame_bronze: '🥉',
  avatar_frame_gold:   '🥇',
  avatar_frame_rainbow:'🌈',
};

function avatarPreviewIcon(id: string): string {
  return AVATAR_EMOJI[id] ?? '👤';
}

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'avatar', label: 'Avatars' },
];

export function mountShopView(root: HTMLElement, props: ShopProps): { unmount: () => void } {
  let activeCat: Category = 'all';
  let items: ShopItem[] = [];
  let loading = true;
  let errorMsg: string | null = null;

  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="shop-back" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h2 style="margin:0;font-size:16px;color:var(--app-text);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:6px"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Shop
        </h2>
        <span class="stat-pill" style="background:#fffbeb;color:#b45309;border:1px solid #fde68a;">${ic.coin(12)} ${formatNumber(useStore.getState().coins)}</span>
      </div>

      <div class="shop-tabs">
        ${CATEGORY_TABS.map((t) => `
          <button class="shop-tab${t.key === 'all' ? ' active' : ''}" data-cat="${t.key}">${escapeHtml(t.label)}</button>
        `).join('')}
      </div>

      <div class="shop-grid" id="shop-grid"></div>
    </section>
    ${bottomNavHTML('shop')}
  `;
  wireBottomNav(root, props.nav, 'shop');

  const gridEl = root.querySelector<HTMLElement>('#shop-grid')!;

  function refreshCoinBadge(prev?: number) {
    const pill = root.querySelector<HTMLElement>('.top-bar .stat-pill');
    if (!pill) return;
    const now = useStore.getState().coins;
    if (typeof prev === 'number') {
      countUp(pill, prev, now, 600, (n) => `${ic.coin(12)} ${formatNumber(Math.round(n))}`);
    } else {
      pill.innerHTML = `${ic.coin(12)} ${formatNumber(now)}`;
    }
  }

  // Theme preview: hover/touch a card to preview, leave to restore
  let previewSavedTheme: string | null = null;
  function previewIn(itemId: string) {
    if (!THEMES[itemId]) return;
    if (previewSavedTheme === null) {
      previewSavedTheme = useStore.getState().equipped.theme_id || 'theme_classic';
    }
    applyTheme(itemId);
  }
  function previewOut() {
    if (previewSavedTheme !== null) {
      applyTheme(previewSavedTheme);
      previewSavedTheme = null;
    }
  }

  function render() {
    if (loading) {
      gridEl.innerHTML = `<div class="shop-loading">Loading items…</div>`;
      return;
    }
    if (errorMsg) {
      gridEl.innerHTML = `<div class="lb-empty"><p>${ic.warning(16)} ${escapeHtml(errorMsg)}</p>
        <button class="btn btn--small" id="shop-retry">Retry</button></div>`;
      gridEl.querySelector('#shop-retry')?.addEventListener('click', () => void load());
      return;
    }
    const filtered = activeCat === 'all'
      ? items.filter((i) => i.category !== 'theme' && i.category !== 'background')
      : items.filter((i) => i.category === activeCat);
    if (!filtered.length) {
      gridEl.innerHTML = `<div class="lb-empty"><p>${ic.empty(20)} No items here.</p></div>`;
      return;
    }

    const state = useStore.getState();
    const owned = new Set(state.inventory);
    const equipped = state.equipped;

    gridEl.innerHTML = filtered.map((item) => {
      const isOwned = owned.has(item.id) || item.price_coin === 0;
      const isEquipped =
        (item.category === 'theme' && equipped.theme_id === item.id) ||
        (item.category === 'background' && equipped.background_id === item.id);
      const canAfford = state.coins >= item.price_coin;
      const rarity = item.rarity ?? 'common';

      const isPremiumGated = PREMIUM_THEMES.has(item.id) && !isOwned && !isPremium();
      let action = '';
      if (isEquipped) {
        action = `<span class="quest-tag">✓ Equipped</span>`;
      } else if (isOwned) {
        action = `<button class="btn btn--small" data-equip="${escapeHtml(item.id)}">Equip</button>`;
      } else if (isPremiumGated) {
        action = `<button class="btn btn--small" data-premium="${escapeHtml(item.id)}">${ic.sparkle(13)} Premium</button>`;
      } else {
        action = `<button class="btn btn--small" data-buy="${escapeHtml(item.id)}" ${canAfford ? '' : 'disabled'}>${ic.coin(12)} ${item.price_coin}</button>`;
      }

      let preview = '🎁';
      if (item.category === 'theme') preview = themePreview(item.id);
      else if (item.category === 'background') preview = bgPreviewIcon(item.id);
      else if (item.category === 'avatar') preview = avatarPreviewIcon(item.id);

      const previewable = item.category === 'theme';
      return `
        <div class="shop-card shop-rarity-${rarity}${previewable ? ' previewable' : ''}" data-preview="${previewable ? escapeHtml(item.id) : ''}">
          ${isPremiumGated ? `<div class="shop-premium-badge" title="Premium-only">${ic.sparkle(12)}</div>` : ''}
          <div class="shop-preview">${preview}</div>
          <div class="shop-name">${escapeHtml(item.name)}</div>
          ${item.description ? `<div class="shop-desc">${escapeHtml(item.description)}</div>` : ''}
          <div class="shop-rarity">${RARITY_LABEL[rarity] ?? `⚪ ${escapeHtml(rarity)}`}</div>
          <div class="shop-action">${action}</div>
        </div>
      `;
    }).join('');

    // Wire actions
    gridEl.querySelectorAll<HTMLButtonElement>('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => void buy(btn.dataset.buy!, btn));
    });
    gridEl.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach((btn) => {
      btn.addEventListener('click', () => void equip(btn.dataset.equip!, btn));
    });
    gridEl.querySelectorAll<HTMLButtonElement>('[data-premium]').forEach((btn) => {
      btn.addEventListener('click', () => {
        showPaywall({ source: `shop_premium_item:${btn.dataset.premium}`, onClose: () => {} });
      });
    });
    // Theme preview on hover (desktop) + on tap (mobile)
    // touchmove / touchcancel / scroll all restore the theme immediately
    gridEl.querySelectorAll<HTMLElement>('.shop-card.previewable').forEach((card) => {
      const id = card.dataset.preview!;
      card.addEventListener('mouseenter', () => previewIn(id));
      card.addEventListener('mouseleave', () => previewOut());
      card.addEventListener('touchstart', () => previewIn(id), { passive: true });
      card.addEventListener('touchend',    () => previewOut());
      card.addEventListener('touchmove',   () => previewOut(), { passive: true });
      card.addEventListener('touchcancel', () => previewOut());
    });
  }

  async function buy(itemId: string, btn: HTMLButtonElement) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    if (!confirm(`Buy ${item.name} for ${item.price_coin} coins?`)) return;
    btn.disabled = true; btn.textContent = '…';
    try {
      const { error } = await api.purchaseItem(itemId);
      if (error) throw error;
      track('item_purchased', { item_id: itemId, category: item.category, price: item.price_coin });
      // Optimistic: deduct coins + add to inventory (animated)
      const prevCoins = useStore.getState().coins;
      useStore.setState({ coins: Math.max(0, prevCoins - item.price_coin) });
      useStore.getState().addToInventory(itemId);
      sfxCoin();
      props.onToast(`${item.name} purchased!`);
      floatReward(btn, `−${item.price_coin}`);
      refreshCoinBadge(prevCoins);
      render();
    } catch (err) {
      console.warn('Purchase failed:', err);
      props.onToast('Purchase failed');
      btn.disabled = false; btn.innerHTML = `${ic.coin(12)} ${item.price_coin}`;
    }
  }

  async function equip(itemId: string, btn: HTMLButtonElement) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    btn.disabled = true; btn.textContent = '…';
    const payload: { theme_id?: string; background_id?: string } = {};
    if (item.category === 'theme') payload.theme_id = itemId;
    else if (item.category === 'background') payload.background_id = itemId;

    try {
      const { error } = await api.equipItem(payload);
      if (error) throw error;
      track('item_equipped', { item_id: itemId, category: item.category });
      useStore.getState().setEquipped(payload);
      if (item.category === 'theme' && THEMES[itemId]) { applyTheme(itemId); sfxThemeChange(); }
      if (item.category === 'background' && BACKGROUNDS[itemId]) applyBackground(itemId);
      props.onToast(`✓ ${item.name} equipped`);
      render();
    } catch (err) {
      // Server may not have equip-item function in MVP — fall back to local-only
      console.warn('Equip endpoint missing, local-only:', err);
      useStore.getState().setEquipped(payload);
      if (item.category === 'theme' && THEMES[itemId]) { applyTheme(itemId); sfxThemeChange(); }
      if (item.category === 'background' && BACKGROUNDS[itemId]) applyBackground(itemId);
      props.onToast(`✓ ${item.name} equipped (local)`);
      render();
    }
  }

  async function load() {
    loading = true; errorMsg = null; render();
    try {
      const [shopItems, inventory, equipped] = await Promise.all([
        api.getShopItems(),
        api.getInventory().catch(() => []),
        api.getEquipped().catch(() => null),
      ]);
      items = (shopItems ?? []) as ShopItem[];
      useStore.getState().setInventory((inventory ?? []).map((r: any) => r.item_id));
      if (equipped) {
        useStore.getState().setEquipped({
          theme_id: equipped.theme_id ?? null,
          background_id: equipped.background_id ?? null,
          avatar: equipped.avatar ?? { emoji: '👤' },
        });
        if (equipped.theme_id) applyTheme(equipped.theme_id);
        if (equipped.background_id) applyBackground(equipped.background_id);
      }
      loading = false;
      render();
    } catch (err) {
      loading = false;
      errorMsg = (err as Error).message || 'Could not load shop.';
      render();
    }
  }

  // Tabs
  root.querySelectorAll<HTMLButtonElement>('.shop-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat as Category;
      root.querySelectorAll<HTMLButtonElement>('.shop-tab').forEach((b) =>
        b.classList.toggle('active', b.dataset.cat === activeCat),
      );
      render();
    });
  });

  root.querySelector('#shop-back')?.addEventListener('click', props.onBack);

  // Cancel any active preview when the page scrolls (mobile safety net)
  const onScroll = () => previewOut();
  window.addEventListener('scroll', onScroll, { passive: true });

  void load();

  return {
    unmount() {
      previewOut();
      window.removeEventListener('scroll', onScroll);
    },
  };
}
