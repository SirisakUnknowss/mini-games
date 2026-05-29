// =====================================================================
// Shop view — browse / purchase / equip items
// =====================================================================
import * as api from '@lib/api';
import { useStore } from '@state/store';
import { escapeHtml, formatNumber } from '@lib/format';
import { track } from '@lib/analytics';
import { applyTheme, themePreview, THEMES } from '@lib/themes';

export interface ShopProps {
  onBack: () => void;
  onToast: (msg: string) => void;
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
  common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡',
};

const CATEGORY_TABS: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'theme', label: '🎨 Themes' },
  { key: 'background', label: '🖼 Backgrounds' },
  { key: 'avatar', label: '👤 Avatars' },
];

export function mountShopView(root: HTMLElement, props: ShopProps): { unmount: () => void } {
  let activeCat: Category = 'all';
  let items: ShopItem[] = [];
  let loading = true;
  let errorMsg: string | null = null;

  root.innerHTML = `
    <section class="view">
      <div class="top-bar">
        <button class="icon-btn" id="shop-back" aria-label="Back">‹</button>
        <h2 style="margin:0;">🛍️ Shop</h2>
        <span class="stat-pill">💰 ${formatNumber(useStore.getState().coins)}</span>
      </div>

      <div class="shop-tabs">
        ${CATEGORY_TABS.map((t) => `
          <button class="shop-tab${t.key === 'all' ? ' active' : ''}" data-cat="${t.key}">${escapeHtml(t.label)}</button>
        `).join('')}
      </div>

      <div class="shop-grid" id="shop-grid"></div>
    </section>
    <nav class="bottom-nav">
      <button id="shop-nav-home"><span class="icon">🏠</span><span>Home</span></button>
      <button id="shop-nav-lb"><span class="icon">🏆</span><span>Leaderboard</span></button>
      <button class="active"><span class="icon">🛍️</span><span>Shop</span></button>
      <button id="shop-nav-profile"><span class="icon">👤</span><span>Profile</span></button>
    </nav>
  `;

  const gridEl = root.querySelector<HTMLElement>('#shop-grid')!;

  function refreshCoinBadge() {
    const pill = root.querySelector<HTMLElement>('.top-bar .stat-pill');
    if (pill) pill.textContent = `💰 ${formatNumber(useStore.getState().coins)}`;
  }

  function render() {
    if (loading) {
      gridEl.innerHTML = `<div class="shop-loading">Loading items…</div>`;
      return;
    }
    if (errorMsg) {
      gridEl.innerHTML = `<div class="lb-empty"><p>⚠️ ${escapeHtml(errorMsg)}</p>
        <button class="btn btn--small" id="shop-retry">Retry</button></div>`;
      gridEl.querySelector('#shop-retry')?.addEventListener('click', () => void load());
      return;
    }
    const filtered = activeCat === 'all' ? items : items.filter((i) => i.category === activeCat);
    if (!filtered.length) {
      gridEl.innerHTML = `<div class="lb-empty"><p>🫥 No items here.</p></div>`;
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

      let action = '';
      if (isEquipped) {
        action = `<span class="quest-tag">✓ Equipped</span>`;
      } else if (isOwned) {
        action = `<button class="btn btn--small" data-equip="${escapeHtml(item.id)}">Equip</button>`;
      } else {
        action = `<button class="btn btn--small" data-buy="${escapeHtml(item.id)}" ${canAfford ? '' : 'disabled'}>
          💰 ${item.price_coin}
        </button>`;
      }

      let preview = '🎁';
      if (item.category === 'theme') preview = themePreview(item.id);
      else if (item.category === 'background') preview = '🖼';
      else if (item.category === 'avatar') preview = '👤';

      return `
        <div class="shop-card shop-rarity-${rarity}">
          <div class="shop-preview">${preview}</div>
          <div class="shop-name">${escapeHtml(item.name)}</div>
          ${item.description ? `<div class="shop-desc">${escapeHtml(item.description)}</div>` : ''}
          <div class="shop-rarity">${RARITY_LABEL[rarity] ?? '⚪'} ${escapeHtml(rarity)}</div>
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
      // Optimistic: deduct coins + add to inventory
      useStore.setState({
        coins: Math.max(0, useStore.getState().coins - item.price_coin),
      });
      useStore.getState().addToInventory(itemId);
      props.onToast(`✨ ${item.name} purchased!`);
      refreshCoinBadge();
      render();
    } catch (err) {
      console.warn('Purchase failed:', err);
      props.onToast('Purchase failed');
      btn.disabled = false; btn.textContent = `💰 ${item.price_coin}`;
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
      if (item.category === 'theme' && THEMES[itemId]) applyTheme(itemId);
      props.onToast(`✓ ${item.name} equipped`);
      render();
    } catch (err) {
      // Server may not have equip-item function in MVP — fall back to local-only
      console.warn('Equip endpoint missing, local-only:', err);
      useStore.getState().setEquipped(payload);
      if (item.category === 'theme' && THEMES[itemId]) applyTheme(itemId);
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
  root.querySelector('#shop-nav-home')?.addEventListener('click', props.onBack);

  void load();

  return { unmount() { /* no listeners to clean */ } };
}
